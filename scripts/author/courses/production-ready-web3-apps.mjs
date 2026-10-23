import { capstone, ck, classifyLab, code, course, def, explorer, flow, list, miniQuiz, mistakes, module_, p, S, sheetLab, table, tip, topic, W, warn, wordLab } from "../kit.mjs";

const SK = "prod-web3";

const configContract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

// Protocol settings that can change, but only through the owner, which in production is a time-lock.
contract ProtocolConfig is Ownable {
    uint256 public constant MAX_FEE_BPS = 500;   // hard ceiling of 5%, impossible to exceed even for the owner
    uint256 public feeBps;
    address public feeReceiver;

    event FeeChanged(uint256 oldFeeBps, uint256 newFeeBps);
    event FeeReceiverChanged(address indexed oldReceiver, address indexed newReceiver);

    error FeeTooHigh();
    error ZeroAddress();

    constructor(address initialOwner, uint256 initialFeeBps, address receiver) Ownable(initialOwner) {
        if (initialFeeBps > MAX_FEE_BPS) revert FeeTooHigh();
        if (receiver == address(0)) revert ZeroAddress();
        feeBps = initialFeeBps;
        feeReceiver = receiver;
    }

    function setFee(uint256 newFeeBps) external onlyOwner {
        if (newFeeBps > MAX_FEE_BPS) revert FeeTooHigh();
        emit FeeChanged(feeBps, newFeeBps);
        feeBps = newFeeBps;
    }

    function setFeeReceiver(address newReceiver) external onlyOwner {
        if (newReceiver == address(0)) revert ZeroAddress();
        emit FeeReceiverChanged(feeReceiver, newReceiver);
        feeReceiver = newReceiver;
    }
}`;

const timelockContract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/TimelockController.sol";

// A delay between 'decided' and 'done'. Proposers queue a change; nobody can execute it until the delay has passed.
// Users can read the queue and leave if they disagree. Here the delay, proposers and executors are chosen at deployment.
contract ProtocolTimelock is TimelockController {
    constructor(uint256 minDelaySeconds, address[] memory proposers, address[] memory executors)
        TimelockController(minDelaySeconds, proposers, executors, address(0)) // no extra admin: the time-lock governs itself
    {}
}`;

const limiter = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// A vault with brakes: a pause switch for a fast guardian role and a daily withdrawal ceiling that limits the damage of any bug.
contract BrakedVault is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");

    uint256 public immutable dailyLimit;
    uint256 public windowStart;
    uint256 public withdrawnInWindow;
    mapping(address => uint256) public balances;

    error Insufficient();
    error DailyLimitReached();
    error TransferFailed();

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    constructor(address admin, address guardian, uint256 limitPerDay) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(GUARDIAN_ROLE, guardian);
        dailyLimit = limitPerDay;
        windowStart = block.timestamp;
    }

    function deposit() external payable whenNotPaused {
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    // Withdrawals stay open when paused: a pause protects the system, it must never trap users' money.
    function withdraw(uint256 amount) external nonReentrant {
        if (balances[msg.sender] < amount) revert Insufficient();
        if (block.timestamp >= windowStart + 1 days) {
            windowStart = block.timestamp;
            withdrawnInWindow = 0;
        }
        if (withdrawnInWindow + amount > dailyLimit) revert DailyLimitReached();
        withdrawnInWindow += amount;
        balances[msg.sender] -= amount;
        emit Withdrawn(msg.sender, amount);
        (bool ok, ) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    function pause() external onlyRole(GUARDIAN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}`;

const deployScript = `// scripts/deploy.js — run with: npx hardhat run scripts/deploy.js --network sepolia
const { ethers, network, run } = require("hardhat");

async function main() {
  const required = ["MULTISIG_ADDRESS", "FEE_RECEIVER"];
  for (const name of required) {
    if (!process.env[name]) throw new Error("Missing environment variable " + name);
  }
  const multisig = process.env.MULTISIG_ADDRESS;
  const delay = network.name === "mainnet" ? 2 * 24 * 3600 : 60;   // 2 days on mainnet, 1 minute on a test network

  const [deployer] = await ethers.getSigners();
  console.log("Network:", network.name, "Deployer:", deployer.address);

  // 1. The time-lock, controlled by the multi-signature wallet
  const Timelock = await ethers.getContractFactory("ProtocolTimelock");
  const timelock = await Timelock.deploy(delay, [multisig], [multisig]);
  await timelock.waitForDeployment();

  // 2. The configuration contract, owned by the time-lock from the very first block
  const Config = await ethers.getContractFactory("ProtocolConfig");
  const config = await Config.deploy(await timelock.getAddress(), 100, process.env.FEE_RECEIVER);
  await config.waitForDeployment();

  console.log("Timelock:", await timelock.getAddress());
  console.log("Config:  ", await config.getAddress());

  // 3. Verify the source code on the block explorer so anyone can read it
  if (network.name !== "hardhat" && network.name !== "localhost") {
    await new Promise((resolve) => setTimeout(resolve, 30000));   // give the explorer time to index
    await run("verify:verify", { address: await timelock.getAddress(), constructorArguments: [delay, [multisig], [multisig]] });
    await run("verify:verify", { address: await config.getAddress(), constructorArguments: [await timelock.getAddress(), 100, process.env.FEE_RECEIVER] });
  }

  // 4. Save the addresses somewhere that is committed and reviewed
  require("fs").writeFileSync(
    "deployments/" + network.name + ".json",
    JSON.stringify({ timelock: await timelock.getAddress(), config: await config.getAddress(), delay }, null, 2)
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});`;

const ciYaml = `# .github/workflows/ci.yml — runs on every pull request
name: ci
on:
  pull_request:
  push:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - name: Compile with warnings visible
        run: npx hardhat compile
      - name: Unit and contract tests
        run: npx hardhat test
      - name: Coverage report
        run: npx hardhat coverage
      - name: Static analysis
        run: pip install slither-analyzer && slither . --exclude-dependencies
      - name: Front end type check and tests
        run: npm run typecheck && npm run test:web
      - name: Dependency audit
        run: npm audit --audit-level=high

  deploy-testnet:
    needs: verify
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: testnet            # secrets for the test network live in this environment
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx hardhat run scripts/deploy.js --network sepolia
        env:
          SEPOLIA_RPC_URL: \${{ secrets.SEPOLIA_RPC_URL }}
          TEST_PRIVATE_KEY: \${{ secrets.TEST_PRIVATE_KEY }}
          MULTISIG_ADDRESS: \${{ vars.MULTISIG_ADDRESS }}
          FEE_RECEIVER: \${{ vars.FEE_RECEIVER }}

# Mainnet is never deployed by a pipeline holding a key. A person with a hardware wallet runs the reviewed script.`;

const txMachine = `// tx-state.js — a transaction as a small state machine, so the interface always tells the truth.
const STATES = {
  idle: "idle",
  waitingForWallet: "waitingForWallet",   // the wallet window is open
  submitted: "submitted",                 // we have a hash; not yet in a block
  confirming: "confirming",               // mined; waiting for more blocks on top
  confirmed: "confirmed",                 // final enough for this app
  failed: "failed",                       // reverted, rejected or timed out
};

const MESSAGES = {
  idle: "",
  waitingForWallet: "Please confirm in your wallet.",
  submitted: "Sent. Waiting for the network to include it.",
  confirming: "Included in a block. Waiting for confirmations.",
  confirmed: "Done. Your change is final.",
  failed: "Something went wrong.",
};

function friendlyError(err) {
  switch (err && err.code) {
    case "ACTION_REJECTED":
      return "You cancelled the request. Nothing was sent and nothing was spent.";
    case "INSUFFICIENT_FUNDS":
      return "Your wallet does not have enough currency to pay the network fee. Add a little and try again.";
    case "CALL_EXCEPTION":
      return "The contract refused this action: " + (err.reason || "see the transaction link for details") + ".";
    case "NETWORK_ERROR":
    case "TIMEOUT":
      return "We could not reach the network. Your money is safe. Please try again in a minute.";
    default:
      return "Unexpected problem. Nothing has been lost; please try again or contact support with your reference.";
  }
}

async function runTransaction(send, requiredConfirmations, setState) {
  try {
    setState({ state: STATES.waitingForWallet, message: MESSAGES.waitingForWallet });
    const tx = await send();
    setState({ state: STATES.submitted, message: MESSAGES.submitted, hash: tx.hash });

    const receipt = await tx.wait(1);
    if (receipt.status !== 1) throw Object.assign(new Error("reverted"), { code: "CALL_EXCEPTION" });
    setState({ state: STATES.confirming, message: MESSAGES.confirming, hash: tx.hash });

    await tx.wait(requiredConfirmations);
    setState({ state: STATES.confirmed, message: MESSAGES.confirmed, hash: tx.hash });
  } catch (err) {
    setState({ state: STATES.failed, message: friendlyError(err) });
  }
}

module.exports = { STATES, runTransaction, friendlyError };`;

const healthCheck = `// monitor.js — a tiny health check you can run every minute from a scheduler.
// It checks the things users feel: is the chain reachable, is the indexer keeping up, has anything odd happened?
const { JsonRpcProvider } = require("ethers");

const MAX_LAG_BLOCKS = 25;            // about five minutes on a 12-second chain
const MAX_BLOCK_AGE_SECONDS = 120;    // the chain itself should not stall

async function postAlert(severity, text) {
  await fetch(process.env.ALERT_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ severity, text, at: new Date().toISOString() }),
    signal: AbortSignal.timeout(10000)
  });
}

async function check(getIndexedBlock) {
  const provider = new JsonRpcProvider(process.env.RPC_URL);
  const problems = [];

  const head = await provider.getBlock("latest");
  const ageSeconds = Math.floor(Date.now() / 1000) - head.timestamp;
  if (ageSeconds > MAX_BLOCK_AGE_SECONDS) {
    problems.push({ severity: "page", text: "No new block for " + ageSeconds + " seconds. Provider or chain problem." });
  }

  const indexed = await getIndexedBlock();                 // from your database
  const lag = head.number - indexed;
  if (lag > MAX_LAG_BLOCKS) {
    problems.push({ severity: "page", text: "Indexer is " + lag + " blocks behind." });
  } else if (lag > MAX_LAG_BLOCKS / 2) {
    problems.push({ severity: "ticket", text: "Indexer lag is growing: " + lag + " blocks." });
  }

  for (const problem of problems) {
    await postAlert(problem.severity, problem.text);
  }
  return problems.length === 0;
}

module.exports = { check };`;

const configValidation = `// config.js — fail at start-up, loudly, if the environment is wrong. Never discover it on mainnet at 2 a.m.
const CHAINS = {
  local:   { id: 31337n,   explorer: "" },
  sepolia: { id: 11155111n, explorer: "https://sepolia.etherscan.io" },
  mainnet: { id: 1n,        explorer: "https://etherscan.io" },
};

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error("Missing required environment variable " + name);
  return value;
}

function loadConfig() {
  const target = requireEnv("APP_ENV");                    // local, sepolia or mainnet
  const chain = CHAINS[target];
  if (!chain) throw new Error("APP_ENV must be one of " + Object.keys(CHAINS).join(", "));

  const config = {
    target,
    chainId: chain.id,
    explorer: chain.explorer,
    rpcUrl: requireEnv("RPC_URL"),
    contractAddress: requireEnv("CONTRACT_ADDRESS"),
    confirmations: Number(process.env.CONFIRMATIONS || (target === "mainnet" ? 12 : 2)),
  };

  if (!/^0x[0-9a-fA-F]{40}$/.test(config.contractAddress)) {
    throw new Error("CONTRACT_ADDRESS is not a valid address");
  }
  if (target === "mainnet" && process.env.ALLOW_MAINNET !== "yes") {
    throw new Error("Refusing to start on mainnet without ALLOW_MAINNET=yes");
  }
  return Object.freeze(config);
}

// The app also checks the chain it is really connected to before doing anything.
async function assertChain(provider, config) {
  const network = await provider.getNetwork();
  if (network.chainId !== config.chainId) {
    throw new Error("Connected to chain " + network.chainId + " but the configuration expects " + config.chainId);
  }
}

module.exports = { loadConfig, assertChain };`;

const labs = [
  classifyLab({
    id: "q1-environments", module: "full-stack-architecture", title: "Which environment is right?", level: "advanced", minutes: 12, xp: 45, skills: [SK], required: true,
    objective: "Choose the right environment for each activity.", scenario: "Professional teams use several environments so that mistakes happen where they are cheap. Choose the best one for each activity.",
    steps: ["Read each activity.", "Choose the environment.", "Press Check my work."],
    categories: [["local", "Local chain on your laptop"], ["testnet", "Public test network"], ["fork", "Local fork of the main network"], ["mainnet", "Main network"]],
    items: [["Running the whole test suite hundreds of times a day", "local", "Fast and free."], ["Letting real users from the community try the app before launch", "testnet", "Realistic but harmless."], ["Checking how your contract behaves with real, deployed token contracts", "fork", "Real dependencies without cost."], ["The final deployment that users will rely on", "mainnet", "Where real value lives."], ["Experimenting with a new contract idea at 2 a.m.", "local", "No consequences."], ["A rehearsal of the exact deployment and upgrade steps", "testnet", "Same steps, no real money."], ["Reproducing last week's incident with the exact on-chain state at that block", "fork", "A snapshot of the real state."], ["Publishing the verified source and the official address", "mainnet", "The permanent record."]],
  }),
  sheetLab({
    id: "q2-deploy-cost", module: "full-stack-architecture", title: "Budget a deployment", level: "advanced", minutes: 14, xp: 50, skills: [SK], required: false,
    objective: "Estimate the cost of deploying several contracts with a safety buffer and compare it with a budget.",
    scenario: "A launch deploys 4 contracts at about 1,800,000 gas each. Gas costs 20 gwei and ETH is 250,000 rupees. Add a 25% buffer for price swings. (Teaching figures.)",
    steps: ["In B7 work out the total gas.", "In B8 convert it to ETH using the gas price in gwei.", "In B9 convert it to rupees.", "In B10 add the safety buffer percentage.", "In B11 show Over budget if B10 is above the budget in B12, otherwise Within budget."],
    cells: { A1: "Input", B1: "Value", A2: "Gas per deployment", B2: "1800000", A3: "Gas price (gwei)", B3: "20", A4: "ETH price (rupees)", B4: "250000", A5: "Number of contracts", B5: "4", A6: "Safety buffer (%)", B6: "25", A7: "Total gas", A8: "Cost (ETH)", A9: "Cost (rupees)", A10: "Cost with buffer (rupees)", A11: "Verdict", A12: "Budget (rupees)", B12: "40000" }, view: { cols: 2, rows: 14 },
    checks: [
      ck("b7", "B7 is the total gas", "=B2*B5", "Gas each times contracts.", S.formula("B7", { equals: 7200000 })),
      ck("b8", "B8 is the cost in ETH", "=B7*B3/1000000000", "Gas times gwei over a billion.", S.formula("B8", { equals: 7200000 * 20 / 1e9 })),
      ck("b9", "B9 is the cost in rupees", "=B8*B4", "ETH times price.", S.formula("B9", { equals: (7200000 * 20 / 1e9) * 250000 })),
      ck("b10", "B10 is the cost with buffer", "=B9*(100+B6)/100", "Add the percentage.", S.formula("B10", { equals: ((7200000 * 20 / 1e9) * 250000) * 125 / 100 })),
      ck("b11", "B11 is the verdict", "=IF(B10>B12,\"Over budget\",\"Within budget\")", "Compare with the budget.", S.formula("B11", { fns: ["IF"], equals: "Over budget" })),
    ],
    solution: { cells: { B7: "=B2*B5", B8: "=B7*B3/1000000000", B9: "=B8*B4", B10: "=B9*(100+B6)/100", B11: "=IF(B10>B12,\"Over budget\",\"Within budget\")" } },
  }),
  classifyLab({
    id: "q3-governance", module: "contracts-in-production", title: "Acceptable or risky control?", level: "advanced", minutes: 12, xp: 45, skills: [SK], required: true,
    objective: "Judge who holds power over a live contract and how it is limited.", scenario: "Every power over a live contract is a promise users must trust. Judge each setup as a careful reviewer would.",
    steps: ["Read each setup.", "Choose the verdict.", "Press Check my work."],
    categories: [["good", "Good practice"], ["risky", "Risky"], ["context", "Acceptable with conditions"]],
    items: [["Admin rights held by a multi-signature wallet", "good", "No single key can act."], ["Admin rights held by one developer's laptop key", "risky", "A single point of failure."], ["A time-lock of two days between a change being queued and executed", "good", "Users get notice and can leave."], ["A fee that the owner can set to any value", "risky", "A hard ceiling should limit it."], ["A fee the owner can change but never above a constant ceiling of five percent", "good", "Power is bounded in code."], ["A guardian who can pause but cannot move funds", "good", "A brake without a steering wheel."], ["An upgradeable proxy with a short or zero delay", "context", "Only if users are told clearly and the key is well protected."], ["A pause that also blocks withdrawals", "risky", "Users' money can be trapped."]],
  }),
  wordLab({
    id: "q4-deploy-runbook", module: "contracts-in-production", title: "Write the deployment runbook", level: "advanced", minutes: 20, xp: 65, skills: [SK], required: false,
    objective: "Write step-by-step instructions that someone else could follow to deploy safely.",
    scenario: "You are about to deploy ProtocolTimelock and ProtocolConfig to a public test network and later to the main network. Write the runbook.",
    steps: ["Add Heading 2 sections: Before, During, After, If something goes wrong.", "Under During write a numbered list of at least five steps.", "Under Before mention hardware wallet, review and rehearsal.", "Under After mention verifying the source code and publishing addresses.", "Keep it between 140 and 300 words."],
    checks: [
      ck("heads", "Four sections", "Use Heading 2.", "A usable runbook.", W.heading(4, 2)),
      ck("order", "In order", "Before, During, After, If something goes wrong.", "Time order.", W.order(["Before", "During", "After", "If something goes wrong"])),
      ck("steps", "Five steps", "Use the numbered list button.", "A sequence.", W.list(5, "ol")),
      ck("hw", "Mentions a hardware wallet", "Mention a hardware wallet.", "Protect keys.", W.pattern("hardware wallet|hardware", "a hardware wallet")),
      ck("rehearse", "Mentions rehearsal on a test network", "Mention rehearsal or a test network.", "Practice first.", W.pattern("rehears|test network|testnet", "a rehearsal on a test network")),
      ck("verify", "Mentions verifying the source", "Mention verifying the source code.", "Transparency.", W.pattern("verif", "verifying the source")),
      ck("len", "Between 140 and 300 words", "Concise.", "Usable under pressure.", W.words(140, 300)),
    ],
    solution: "<h2>Before</h2><p>The code is frozen at a tagged commit, all tests and the review are complete, and the exact steps have been rehearsed on a public test network. The deployer uses a hardware wallet that holds only the small amount of currency needed for fees. Two people check the configuration values aloud.</p><h2>During</h2><ol><li>Confirm the network name and chain id on screen against the plan.</li><li>Deploy the time-lock with the agreed delay and the multi-signature wallet as proposer and executor.</li><li>Deploy the configuration contract with the time-lock as the owner from the start.</li><li>Check on the block explorer that the owner is the time-lock and the settings are right.</li><li>Save the addresses and the transaction links in the repository.</li></ol><h2>After</h2><p>Verify the source code of every contract on the block explorer, publish the official addresses in one trusted place, and announce the deployment. Start monitoring and keep the first limits small.</p><h2>If something goes wrong</h2><p>Stop, do not continue to later steps, and tell the team. If a wrong value was deployed, do not hope: pause anything that can be paused, record what happened and redeploy from the rehearsed script after a review.</p>",
  }),
  classifyLab({
    id: "q5-ci-stages", module: "ci-cd-and-testing", title: "Which stage of the pipeline?", level: "advanced", minutes: 12, xp: 45, skills: [SK], required: true,
    objective: "Place each check or action in the right stage of a delivery pipeline.", scenario: "A good pipeline catches problems as early and cheaply as possible and keeps dangerous actions for humans. Place each step.",
    steps: ["Read each step.", "Choose the stage.", "Press Check my work."],
    categories: [["commit", "On every commit or pull request"], ["testnet", "Automatic test-network deployment"], ["approval", "Needs a human decision"], ["never", "Never automated with a key in the pipeline"]],
    items: [["Compile the contracts and run unit tests", "commit", "Fast feedback."], ["Run static analysis and a dependency audit", "commit", "Cheap and repeatable."], ["Deploy to the public test network after the main branch is green", "testnet", "Safe to automate."], ["Approve the date and parameters of the mainnet launch", "approval", "A human decision."], ["Send the mainnet deployment using a hardware wallet", "never", "No hot key should hold that power."], ["Check gas-use changes against the previous version", "commit", "Catch regressions early."], ["Review the audit report and accept remaining risks", "approval", "A person owns the risk."], ["Store the mainnet deployer's private key as a pipeline secret", "never", "A leaked pipeline secret would be a disaster."]],
  }),
  sheetLab({
    id: "q6-readiness", module: "ci-cd-and-testing", title: "Score launch readiness", level: "advanced", minutes: 14, xp: 50, skills: [SK], required: false,
    objective: "Turn a launch checklist into a weighted score and a clear verdict.",
    scenario: "A team scores five readiness checks by importance. Each check passes (1) or fails (0).",
    steps: ["In D2 work out the points for the first check: weight times passed. Fill down to D6.", "In B8 add up the points earned.", "In B9 add up the weights.", "In B10 work out the percentage.", "In B11 show Ready to launch for 90 or more, Needs work for 70 or more, otherwise Not ready."],
    cells: { A1: "Check", B1: "Weight", C1: "Passed (1 or 0)", D1: "Points", A2: "Independent audit complete", B2: "30", C2: "1", A3: "Tests and coverage reviewed", B3: "20", C3: "1", A4: "Monitoring and alerts live", B4: "15", C4: "1", A5: "Incident runbook written and rehearsed", B5: "15", C5: "0", A6: "Bug bounty or security contact published", B6: "20", C6: "1", A8: "Points earned", A9: "Points possible", A10: "Percentage", A11: "Verdict" }, view: { cols: 4, rows: 13 },
    checks: [
      ck("d2", "D2 is the points", "=B2*C2", "Weight times passed.", S.formula("D2", { equals: 30 })),
      ck("d5", "D5 is the points", "=B5*C5", "Fill down.", S.formula("D5", { equals: 0 })),
      ck("b8", "B8 is the points earned", "=SUM(D2:D6)", "Add the column.", S.formula("B8", { fns: ["SUM"], equals: 85 })),
      ck("b9", "B9 is the points possible", "=SUM(B2:B6)", "Add the weights.", S.formula("B9", { fns: ["SUM"], equals: 100 })),
      ck("b10", "B10 is the percentage", "=B8/B9*100", "Earned over possible.", S.formula("B10", { equals: 85 })),
      ck("b11", "B11 is the verdict", "=IF(B10>=90,\"Ready to launch\",IF(B10>=70,\"Needs work\",\"Not ready\"))", "Nest two IFs.", S.formula("B11", { fns: ["IF"], equals: "Needs work" })),
    ],
    solution: { cells: Object.assign({ B8: "=SUM(D2:D6)", B9: "=SUM(B2:B6)", B10: "=B8/B9*100", B11: "=IF(B10>=90,\"Ready to launch\",IF(B10>=70,\"Needs work\",\"Not ready\"))" }, ...[2, 3, 4, 5, 6].map((r) => ({ [`D${r}`]: `=B${r}*C${r}` }))) },
  }),
  classifyLab({
    id: "q7-tx-ux", module: "wallet-ux-and-front-end", title: "What should the screen say?", level: "advanced", minutes: 12, xp: 45, skills: [SK], required: true,
    objective: "Match each situation to the best message and behaviour.", scenario: "Users are nervous when money is involved. The interface must always tell the truth, calmly. Match the situation to the best response.",
    steps: ["Read each situation.", "Choose the best response.", "Press Check my work."],
    categories: [["reassure", "Reassure and let them retry"], ["wait", "Show progress and ask them to wait"], ["fix", "Tell them what to fix"], ["escalate", "Show a reference and offer support"]],
    items: [["The user pressed Reject in the wallet", "reassure", "Nothing was spent."], ["The transaction was sent and is waiting to be included", "wait", "Show the hash and status."], ["The wallet has too little currency for the network fee", "fix", "Say how to add more."], ["The page is on the wrong network", "fix", "Offer a switch button."], ["The transaction was mined but reverted for an unknown reason", "escalate", "Provide the link and a reference."], ["The network request timed out", "reassure", "Money is safe; try again."], ["The transaction is included and has two of twelve confirmations", "wait", "Show progress."], ["The same payment seems to be recorded twice", "escalate", "Needs a person to check."]],
  }),
  wordLab({
    id: "q8-error-copy", module: "wallet-ux-and-front-end", title: "Write the error messages", level: "advanced", minutes: 16, xp: 55, skills: [SK], required: false,
    objective: "Write calm, specific messages that tell users what happened and what to do next.",
    scenario: "Write the five messages users will see most often in your dApp's payment flow.",
    steps: ["Add Heading 2 sections: Rejected in wallet, Not enough for the fee, Wrong network, Contract refused, Network unreachable.", "Under each, write one or two sentences.", "Each message must say what happened and what to do.", "Reassure users that no money was lost where that is true.", "Keep it between 100 and 230 words."],
    checks: [
      ck("heads", "Five sections", "Use Heading 2.", "Five messages.", W.heading(5, 2)),
      ck("order", "In order", "Rejected in wallet, Not enough for the fee, Wrong network, Contract refused, Network unreachable.", "As listed.", W.order(["Rejected in wallet", "Not enough for the fee", "Wrong network", "Contract refused", "Network unreachable"])),
      ck("safe", "Reassures about money", "Say nothing was spent or your money is safe.", "Calm users.", W.pattern("nothing (was|has been) (spent|sent|lost)|money is safe|no money|not charged|nothing was charged", "reassurance that money is safe")),
      ck("action", "Tells users what to do", "Use words like try again, switch, add.", "Actionable.", W.pattern("try again|switch|add |please", "what to do next")),
      ck("len", "Between 100 and 230 words", "Concise.", "Short messages.", W.words(100, 230)),
    ],
    solution: "<h2>Rejected in wallet</h2><p>You cancelled the request, so nothing was sent and nothing was spent. Press the button again whenever you are ready.</p><h2>Not enough for the fee</h2><p>Your wallet does not have enough currency to pay the network fee. Please add a little more, then try again. Your balance has not changed.</p><h2>Wrong network</h2><p>Your wallet is connected to a different network. Press the Switch button and approve the change in your wallet, then try again.</p><h2>Contract refused</h2><p>The contract did not accept this action, for example because the amount is too high. Nothing was spent apart from a small network fee. Check the amount and try again, or contact support with the reference shown.</p><h2>Network unreachable</h2><p>We could not reach the network just now. Your money is safe. Please try again in a minute, and contact us if it keeps happening.</p>",
  }),
  classifyLab({
    id: "q9-alerts", module: "indexing-monitoring-and-scaling", title: "Page someone, open a ticket or ignore?", level: "advanced", minutes: 12, xp: 45, skills: [SK], required: true,
    objective: "Decide how urgently each signal needs a human.", scenario: "Too many alerts and people stop listening; too few and you miss real trouble. Triage each signal.",
    steps: ["Read each signal.", "Choose the response.", "Press Check my work."],
    categories: [["page", "Page someone now"], ["ticket", "Open a ticket for working hours"], ["ignore", "Record only; no action"]],
    items: [["The indexer is more than 25 blocks behind", "page", "Users see stale data."], ["The indexer lag is slowly growing but still small", "ticket", "A trend to investigate."], ["A guardian pause was triggered on the main network", "page", "A serious event."], ["One RPC request failed once and succeeded on retry", "ignore", "Normal noise."], ["A large unexpected withdrawal from the vault", "page", "Possible attack."], ["Disk usage on the indexer database passed 70%", "ticket", "Will become a problem later."], ["A dependency has a new patch version available", "ticket", "Plan an update."], ["Daily active wallets are slightly lower than last week", "ignore", "Not an incident."]],
  }),
  sheetLab({
    id: "q10-error-budget", module: "indexing-monitoring-and-scaling", title: "Spend your error budget", level: "advanced", minutes: 14, xp: 50, skills: [SK], required: false,
    objective: "Turn an availability target into allowed downtime and decide how careful to be with releases.",
    scenario: "Your service promises 99.5% availability over a 30-day month. This month there have been 3 incidents averaging 45 minutes. (A teaching model.)",
    steps: ["In B7 work out the minutes in the month (days times 24 times 60).", "In B8 work out the allowed downtime in minutes.", "In B9 work out the downtime used so far.", "In B10 work out the percentage of the budget used.", "In B11 show SLO missed above 100, Slow down releases above 75, otherwise Healthy."],
    cells: { A1: "Input", B1: "Value", A2: "Availability target (%)", B2: "99.5", A3: "Incidents this month", B3: "3", A4: "Average length (minutes)", B4: "45", A5: "Days in the month", B5: "30", A7: "Minutes in the month", A8: "Allowed downtime (minutes)", A9: "Downtime used (minutes)", A10: "Budget used (%)", A11: "Verdict" }, view: { cols: 2, rows: 13 },
    checks: [
      ck("b7", "B7 is the minutes in the month", "=B5*24*60", "Days times hours times minutes.", S.formula("B7", { equals: 43200 })),
      ck("b8", "B8 is the allowed downtime", "=B7*(100-B2)/100", "The share you may be down.", S.formula("B8", { equals: 216 })),
      ck("b9", "B9 is the downtime used", "=B3*B4", "Incidents times length.", S.formula("B9", { equals: 135 })),
      ck("b10", "B10 is the budget used", "=B9/B8*100", "Used over allowed, times 100.", S.formula("B10", { equals: 135 / 216 * 100 })),
      ck("b11", "B11 is the verdict", "=IF(B10>100,\"SLO missed\",IF(B10>75,\"Slow down releases\",\"Healthy\"))", "Nest two IFs.", S.formula("B11", { fns: ["IF"], equals: "Healthy" })),
    ],
    solution: { cells: { B7: "=B5*24*60", B8: "=B7*(100-B2)/100", B9: "=B3*B4", B10: "=B9/B8*100", B11: "=IF(B10>100,\"SLO missed\",IF(B10>75,\"Slow down releases\",\"Healthy\"))" } },
  }),
  wordLab({
    id: "q11-launch-day", module: "launch-and-operate", title: "Write the launch-day plan", level: "advanced", minutes: 20, xp: 70, skills: [SK], required: true,
    objective: "Plan the first day on the main network: who does what, what to watch and when to stop.",
    scenario: "Your team is launching on the main network with a small deposit cap. Write the plan for launch day.",
    steps: ["Add Heading 2 sections: Roles, Timeline, What we watch, Stop conditions, Communication.", "Under Timeline write a numbered list of at least five steps.", "Under Stop conditions write a bulleted list of at least three conditions.", "Mention the deposit cap and the pause.", "Keep it between 150 and 320 words."],
    checks: [
      ck("heads", "Five sections", "Use Heading 2.", "A complete plan.", W.heading(5, 2)),
      ck("order", "In order", "Roles, Timeline, What we watch, Stop conditions, Communication.", "People to messages.", W.order(["Roles", "Timeline", "What we watch", "Stop conditions", "Communication"])),
      ck("time", "Five timeline steps", "Use the numbered list button.", "A sequence.", W.list(5, "ol")),
      ck("stop", "Three stop conditions", "Use the bullet button.", "Know when to stop.", W.list(3, "ul")),
      ck("cap", "Mentions the deposit cap", "Mention the cap.", "Limit the risk.", W.pattern("cap|limit", "the deposit cap")),
      ck("pause", "Mentions pausing", "Mention pause.", "A brake.", W.pattern("pause", "the pause")),
      ck("len", "Between 150 and 320 words", "Concise.", "Usable on the day.", W.words(150, 320)),
    ],
    solution: "<h2>Roles</h2><p>The deployer runs the reviewed script from a hardware wallet. A second engineer verifies each step. The incident lead decides whether to pause. One person writes public updates, and one person answers users.</p><h2>Timeline</h2><ol><li>Confirm the network, the addresses and the parameters against the signed-off plan.</li><li>Deploy the contracts and check the owner, the time-lock and the settings on the explorer.</li><li>Verify the source code and publish the official addresses on the website.</li><li>Open deposits with a small cap and let the internal team make the first transactions.</li><li>Raise the cap in steps after hours without problems, announcing each step in advance.</li></ol><h2>What we watch</h2><p>Indexer lag, error rates, large transfers, role changes and the contract balance compared with the recorded deposits.</p><h2>Stop conditions</h2><ul><li>Any balance that does not match the records.</li><li>Any unexpected call to an admin function.</li><li>The indexer or the provider failing for more than a few minutes.</li></ul><p>If any condition appears, the guardian uses the pause at once and nobody continues to the next step until the cause is understood.</p><h2>Communication</h2><p>We announce the launch, each cap increase and any pause in the same official channel. We say what we know and what we do not know, and we never ask for recovery phrases.</p>",
  }),
  classifyLab({
    id: "q12-incident-response", module: "launch-and-operate", title: "First move in an incident", level: "advanced", minutes: 10, xp: 40, skills: [SK], required: false,
    objective: "Pick the right first action in common incident situations.", scenario: "In an incident the first action matters most. Choose the best first move.",
    steps: ["Read each situation.", "Choose the first action.", "Press Check my work."],
    categories: [["pause", "Pause what can be paused"], ["verify", "Verify before acting"], ["inform", "Inform users now"], ["preserve", "Preserve evidence"]],
    items: [["Funds are leaving the vault in unusual transactions", "pause", "Stop the loss first."], ["A tweet claims there is a bug but nothing unusual shows on-chain", "verify", "Check the facts."], ["The front end shows wrong balances because the indexer is down", "inform", "Tell users their funds are safe and data is delayed."], ["After the pause, the team is tempted to redeploy immediately", "preserve", "Keep logs and state for the investigation."], ["An admin key may have leaked", "pause", "Stop actions that the key could perform, then rotate."], ["A researcher privately reports a vulnerability", "verify", "Reproduce it safely before deciding."], ["A phishing site copies your front end", "inform", "Warn users and share the official address."], ["Before fixing a bug, you want to understand what happened", "preserve", "Evidence first."]],
  }),
  wordLab({
    id: "cap-readiness", module: "capstone", title: "Final project: write a production readiness review", level: "challenge", minutes: 40, xp: 170, skills: [SK], required: true,
    objective: "Produce a professional readiness review for a Web3 product, covering architecture, control, testing, user experience, monitoring, launch and open risks.",
    scenario: "Your team is about to launch a vault product with a front end, an indexer and contracts. Write the review that decides whether to launch.",
    steps: ["Add a Heading 1 'Production readiness review'.", "Add Heading 2 sections: Architecture, Control and governance, Testing and CI, User experience, Monitoring and response, Launch plan, Open risks and decision.", "Under Control and governance mention a time-lock, a multi-signature wallet and a ceiling on parameters.", "Under Testing and CI list at least four checks in bullets.", "Under Monitoring and response mention an alert threshold and a runbook.", "Under Open risks and decision give a clear launch, delay or do-not-launch decision with reasons.", "Mention that an independent audit is required for real value.", "Keep it between 340 and 680 words."],
    checks: [
      ck("t", "A title", "Use Heading 1.", "Name the review.", W.heading(1, 1)),
      ck("secs", "Seven sections", "Use Heading 2.", "A complete review.", W.heading(7, 2)),
      ck("order", "In order", "Architecture, Control and governance, Testing and CI, User experience, Monitoring and response, Launch plan, Open risks and decision.", "A logical flow.", W.order(["Architecture", "Control and governance", "Testing and CI", "User experience", "Monitoring and response", "Launch plan", "Open risks and decision"])),
      ck("gov", "Mentions time-lock and multi-signature", "Mention a time-lock and a multi-signature wallet.", "Control.", W.pattern("time-?lock[\\s\\S]*multi-?sig|multi-?sig[\\s\\S]*time-?lock", "a time-lock and a multi-signature wallet")),
      ck("tests", "Four checks", "Use the bullet button.", "List the checks.", W.list(4, "ul")),
      ck("alert", "Mentions an alert threshold", "Mention an alert or threshold.", "Monitoring.", W.pattern("alert|threshold", "an alert threshold")),
      ck("run", "Mentions a runbook", "Mention a runbook.", "Response.", W.pattern("runbook", "a runbook")),
      ck("audit", "Mentions an independent audit", "Mention an independent audit.", "Required.", W.pattern("audit", "an independent audit")),
      ck("decide", "States a decision", "State launch, delay or do not launch.", "A review decides.", W.pattern("launch|delay|do not launch|not ready", "a decision")),
      ck("len", "Between 340 and 680 words", "Two pages at most.", "Readable.", W.words(340, 680)),
    ],
    solution: "<h1>Production readiness review</h1><h2>Architecture</h2><p>The product has three smart contracts (a vault, a configuration contract and a time-lock), a front end that connects to users' wallets, a Node.js indexer that copies events into a database, and a small API. Environments are local, a public test network and the main network, and configuration is validated at start-up so that the app refuses to run against the wrong chain.</p><h2>Control and governance</h2><p>Admin powers are held by a multi-signature wallet, and every parameter change passes a two-day time-lock. Parameters such as the fee have a hard ceiling in code. A guardian can pause deposits but cannot move funds or block withdrawals.</p><h2>Testing and CI</h2><ul><li>Unit, fuzz and invariant tests run on every pull request, with coverage reviewed for untested branches.</li><li>Static analysis and a dependency audit run in the pipeline and failures block merging.</li><li>The deployment and an upgrade rehearsal are run on a public test network.</li><li>An end-to-end test creates a deposit and a withdrawal through the real front end.</li></ul><h2>User experience</h2><p>Every transaction follows a state machine from waiting for the wallet to confirmed, with friendly messages for rejection, missing fee currency, wrong network, contract refusal and network problems. Users are told plainly what is final and what is pending.</p><h2>Monitoring and response</h2><p>Alerts page a person when the indexer is more than 25 blocks behind, when the contract balance differs from the recorded deposits, when a pause happens or when an admin function is called. A runbook explains the first moves in an incident, and a post-mortem is published afterwards.</p><h2>Launch plan</h2><p>We launch on the main network with a small deposit cap, raise it in announced steps after quiet periods, publish the verified source and a bug bounty, and keep the team on call for the first week.</p><h2>Open risks and decision</h2><p>An independent audit is complete but two low-severity findings are accepted in writing. The incident runbook still needs one rehearsal. Decision: delay the launch by one week to rehearse the runbook, then launch with the small cap. Real value should not be held without an independent audit, and this review is not a guarantee of safety.</p>",
  }),
];

const M1 = module_({
  slug: "full-stack-architecture", title: "Full-stack Web3 architecture", hours: 2.5, level: "Foundations",
  summary: "The parts of a real Web3 product, the environments they live in and how configuration keeps them straight.",
  outcome: "You can draw the architecture of a Web3 product, choose environments for each activity and validate configuration safely.",
  intro: "A demo is a contract and a button. A product is contracts, a front end, a backend, an indexer, monitoring, environments, pipelines and people who know what to do on a bad day. This module draws the whole picture and then focuses on the first discipline: keeping environments and configuration straight.",
  topics: [
    topic({
      title: "The parts of a real product", slug: "the-parts",
      blocks: [
        flow("A typical architecture", ["Users and their wallets", "Front end (static site)", "API and backend services", "Indexer and database", "RPC providers", "Smart contracts on the chain", "Monitoring and alerting"]),
        table("Each part and its job", ["Part", "Job", "Typical failure"], [["Smart contracts", "Hold the rules and the money", "Bugs, bad parameters, key compromise"], ["Front end", "Let people use the contracts", "Wrong network, confusing messages, malicious script injection"], ["Backend and API", "Search, notifications, login, rate limits", "Leaked secrets, overload"], ["Indexer and database", "Fast queries over events", "Falls behind, reorganisation errors"], ["RPC providers", "Access to the chain", "Outages, rate limits, wrong data"], ["Monitoring", "Tell people when something breaks", "No alerts, too many alerts"], ["People and process", "Decide, deploy and respond", "No runbook, one person knows everything"]]),
        p("The contracts are usually the smallest part by size but the largest by risk: they are public, hold value and are hard to change. Everything else exists to make them usable and to notice when something is wrong. A common mistake is to spend all the time on the contract and none on the parts users actually touch."),
        miniQuiz("parts-mini", [["Which part holds the rules and the money?", ["The front end", "The smart contracts", "The monitoring", "The RPC provider"], 1, "On-chain code is the final judge."]]),
      ],
      points: ["A product is contracts plus front end, backend, indexer, providers, monitoring and people.", "Contracts are small but carry the most risk."],
      check: [["Monitoring exists to:", ["Tell people when something is wrong", "Hold funds", "Sign transactions", "Write contracts"], 0, "Detection comes before response."]],
    }),
    topic({
      title: "Environments", slug: "environments",
      blocks: [
        table("The environments a professional team uses", ["Environment", "Purpose", "Real money?"], [["Local chain", "Fast development and automated tests", "No"], ["Public test network", "Rehearsal and user testing with the real tools", "No"], ["Local fork of the main network", "Testing against real deployed contracts and real state", "No"], ["Main network", "Production", "Yes"]]),
        list("Rules for environments", ["Every environment has its own addresses, keys and configuration.", "Never reuse a test key on the main network.", "Rehearse every deployment and upgrade on a test network first.", "Keep the exact same scripts and code paths across environments, changing only configuration.", "Make the current environment obvious in the interface for developers, for example a coloured banner on test builds."], true),
        mistakes(["Sending a test transaction to the main network because the wallet was on the wrong network.", "Deploying from a laptop with a key that also holds personal funds.", "Different code paths for test and production, so the test proves nothing."]),
        miniQuiz("env-mini", [["Why use identical scripts across environments?", ["It is shorter", "A rehearsal only proves something if it runs the same steps as production", "Providers demand it", "It saves gas"], 1, "Rehearse the real thing."]]),
      ],
      points: ["Use local, test network, fork and main network for different jobs.", "Same scripts everywhere; only configuration changes."],
      check: [["A fork is useful for testing against:", ["Real deployed contracts and state", "Nothing", "Only wallets", "Only CSS"], 0, "Realistic dependencies."]],
    }),
    topic({
      title: "Configuration that fails loudly", slug: "configuration",
      blocks: [
        code("javascript", configValidation, "config.js"),
        table("What the code protects against", ["Check", "Mistake prevented"], [["Required variables", "Starting with a missing RPC URL or address"], ["Known environment names", "A typo selecting no environment"], ["Address format check", "Deploying a malformed address into configuration"], ["ALLOW_MAINNET guard", "Accidentally running a test build against the main network"], ["assertChain", "Being connected to the wrong network"], ["Object.freeze", "Code changing configuration at run time"]]),
        miniQuiz("config-mini", [["Why check the connected chain id at start-up?", ["To save gas", "Configuration might name one network while the provider points to another", "Wallets require it", "It makes the app faster"], 1, "Trust but verify."]]),
        tip("A configuration error caught at start-up costs a minute. The same error discovered after a transaction costs real money."),
      ],
      points: ["Validate configuration at start-up and refuse to run if it is wrong.", "Check the real chain id against the expected one."],
      check: [["A guard like ALLOW_MAINNET prevents:", ["Accidental mainnet use", "High fees", "Reorgs", "Slow blocks"], 0, "A deliberate step is required."]],
    }),
  ],
  terms: [["Environment", "A separate place where the product runs"], ["Testnet", "A public network without real value"], ["Fork", "A local copy of a real network"], ["Configuration", "Settings that differ between environments"], ["Indexer", "A service that organises events for queries"], ["RPC provider", "A service giving access to chain data"]],
  practical: { title: "Practical: draw your architecture", intro: "For a product you want to build.", steps: ["Draw the seven parts.", "Mark which environment each part runs in during development.", "List the configuration each part needs.", "Write the three mistakes most likely in your team."] },
  quiz: [
    ["A product needs:", ["More than contracts", "Only a contract", "Only a page", "Only a token"], 0, "Many parts."],
    ["Contracts carry:", ["The most risk", "No risk", "Only style", "Only images"], 0, "Public and hard to change."],
    ["A test network has:", ["No real value", "Real value", "Bank accounts", "Passwords"], 0, "Safe to practise."],
    ["A fork lets you test:", ["Against real state", "Nothing", "Only UI", "Only fonts"], 0, "Without cost."],
    ["Test keys on mainnet:", ["Must never be reused", "Are fine", "Are required", "Are encouraged"], 0, "Separate keys."],
    ["Configuration should:", ["Fail loudly at start-up", "Be guessed", "Be hidden", "Be ignored"], 0, "Catch mistakes early."],
    ["The chain id check ensures:", ["You are on the intended network", "Low fees", "Fast blocks", "Privacy"], 0, "Wrong-network protection."],
  ],
});

const M2 = module_({
  slug: "contracts-in-production", title: "Contracts in production", hours: 3, level: "Core skills",
  summary: "Bounded parameters, time-locks, multi-signature control, brakes that do not trap users, and a careful deployment script.",
  outcome: "You can design bounded admin powers, put a time-lock in front of them, add safe brakes and deploy and verify with a script.",
  intro: "Production contracts need more than correct logic. They need to answer: who can change what, how quickly, with what limits, and how do users find out. This module builds a configuration contract, a time-lock, a braked vault and the deployment script that ties them together.",
  topics: [
    topic({
      title: "Bounded admin powers", slug: "bounded-powers",
      blocks: [
        code("solidity", configContract, "ProtocolConfig.sol"),
        table("What the contract shows", ["Feature", "Reason"], [["MAX_FEE_BPS constant", "A ceiling the owner cannot exceed, so users know the worst case"], ["Events for every change", "Monitoring and users can see changes"], ["Custom errors", "Cheap and clear failures"], ["Zero-address checks", "A mistake cannot send fees to nobody"], ["Owner set at construction", "Ownership starts in the right place, not with the deployer"]]),
        p("The most important idea is the ceiling. Instead of asking users to trust that an owner will not set the fee to 100%, the code makes it impossible. Power that is limited by code needs much less trust than power that is only limited by promises."),
        miniQuiz("bounded-mini", [["What does a constant ceiling on fees provide?", ["Lower gas", "A worst case users can rely on, enforced by code", "Faster blocks", "Privacy"], 1, "Limits beat promises."]]),
      ],
      points: ["Limit admin powers in code, not just in promises.", "Emit events for every change."],
      check: [["Events on parameter changes help:", ["Monitoring and transparency", "Hiding changes", "Saving gas", "Minting"], 0, "Everyone can see."]],
    }),
    topic({
      title: "Time-locks and multi-signature control", slug: "timelock",
      blocks: [
        code("solidity", timelockContract, "ProtocolTimelock.sol"),
        flow("A governed change", ["The multi-signature wallet queues a change in the time-lock", "The delay starts and the queued change is public", "Users and monitors see it and can react", "After the delay the multi-signature wallet executes it", "The configuration contract applies it and emits an event"]),
        table("What each layer adds", ["Layer", "Adds"], [["Multi-signature wallet", "No single person can act alone"], ["Time-lock", "A public waiting period so users can exit or object"], ["Bounded parameters", "A limit on what even an approved change can do"], ["Events and monitoring", "Everyone can see what happened"]]),
        warn("A time-lock is only meaningful if the owner of the sensitive contract is the time-lock. If the deployer remains the owner, the delay protects nobody."),
        miniQuiz("lock-mini", [["Why must the time-lock own the configuration contract?", ["It costs less", "Otherwise the owner can bypass the delay", "It is required by the compiler", "It speeds up changes"], 1, "The delay must apply to every change."]]),
      ],
      points: ["A time-lock gives users notice; a multi-signature wallet spreads control.", "The time-lock must be the real owner."],
      check: [["A queued change in a time-lock is:", ["Visible before it takes effect", "Secret", "Instant", "Impossible"], 0, "That is its point."]],
    }),
    topic({
      title: "Brakes, limits and the deployment script", slug: "brakes-deploy",
      blocks: [
        code("solidity", limiter, "BrakedVault.sol"),
        table("Brakes and why they are designed this way", ["Brake", "Design choice"], [["Guardian can pause", "A fast, narrow power: stop deposits when something looks wrong"], ["Only the admin unpauses", "Restarting needs the slower, stronger authority"], ["Withdrawals stay open when paused", "A pause must never trap users' money"], ["Daily withdrawal limit", "Caps the loss from any bug or exploit in a day"], ["Reentrancy guard", "Second layer on the function that sends ETH"]]),
        code("javascript", deployScript, "scripts/deploy.js"),
        list("What the deployment script does well", ["Fails if required configuration is missing.", "Uses a short delay on test networks and a long one on the main network.", "Gives ownership to the time-lock in the constructor, not later.", "Verifies source code on the explorer.", "Writes the addresses to a file that is committed and reviewed."]),
        miniQuiz("brake-mini", [["Why should a pause not block withdrawals?", ["It saves gas", "A safety feature must not become a way to trap users' funds", "Withdrawals are free", "It is a compiler rule"], 1, "Do no extra harm."]]),
      ],
      points: ["Narrow, fast brakes plus slow, strong control; withdrawals stay open.", "Deploy by a reviewed script that sets ownership correctly and verifies source."],
      check: [["A daily withdrawal limit reduces:", ["The loss from a bug in one day", "Gas costs", "Block times", "Fees"], 0, "Damage control."]],
    }),
  ],
  terms: [["Time-lock", "A mandatory delay before a change takes effect"], ["Multi-signature wallet", "A wallet needing several approvals"], ["Guardian", "A role that can pause but not move funds"], ["Ceiling", "A hard limit enforced in code"], ["Verification", "Publishing source that matches deployed code"], ["Deployment script", "Code that performs a deployment repeatably"]],
  practical: { title: "Practical: deploy on a local chain", intro: "With Hardhat locally.", steps: ["Compile the three contracts.", "Run the deployment script on a local network.", "Queue a fee change through the time-lock and fast-forward time.", "Try to call setFee directly and watch it fail."] },
  quiz: [
    ["A ceiling in code is better than:", ["A promise", "A test", "An event", "A role"], 0, "Code is enforced."],
    ["A time-lock gives:", ["Users notice", "Free gas", "Secrecy", "Speed"], 0, "A waiting period."],
    ["Multi-signature control means:", ["Several approvals are needed", "One person acts", "No one acts", "Everyone acts"], 0, "Spread trust."],
    ["Guardian powers should be:", ["Narrow", "Unlimited", "Hidden", "Permanent"], 0, "Pause only."],
    ["A pause must not:", ["Trap withdrawals", "Stop deposits", "Emit events", "Alert"], 0, "Do no extra harm."],
    ["Daily limits help:", ["Limit losses", "Raise fees", "Hide balances", "Speed up blocks"], 0, "Cap the damage."],
    ["Verification lets anyone:", ["Read the deployed source", "Withdraw", "Mint", "Pause"], 0, "Transparency."],
  ],
});

const M3 = module_({
  slug: "ci-cd-and-testing", title: "CI/CD and testing", hours: 2.5, level: "Core skills",
  summary: "Automated checks on every change, test-network deployment by pipeline, and why mainnet stays in human hands.",
  outcome: "You can design a pipeline, say what runs automatically and what needs people, and score launch readiness.",
  intro: "A team that tests by hand ships by luck. Continuous integration runs the same checks on every change, continuous delivery makes test-network releases boring, and a few steps are deliberately left to humans. This module designs that pipeline.",
  topics: [
    topic({
      title: "A pipeline you can read", slug: "pipeline",
      blocks: [
        code("yaml", ciYaml, ".github/workflows/ci.yml"),
        table("What each step catches", ["Step", "Catches"], [["Compile with warnings visible", "Syntax and many careless mistakes"], ["Contract tests", "Logic errors"], ["Coverage report", "Code never exercised"], ["Static analysis", "Known bad patterns"], ["Front end type check and tests", "Breakage in the part users touch"], ["Dependency audit", "Known vulnerable packages"], ["Test-network deployment", "Deployment script errors, in a harmless place"]]),
        miniQuiz("pipe-mini", [["Why deploy to a test network from the pipeline?", ["It is required", "It tests the deployment script itself, repeatedly and safely", "It earns money", "It is faster than local"], 1, "Boring releases are safe releases."]]),
      ],
      points: ["Run compile, tests, coverage, analysis and audits on every change.", "Automate test-network deployment."],
      check: [["A pipeline helps most by:", ["Running the same checks every time", "Replacing people", "Deleting tests", "Adding gas"], 0, "Consistency."]],
    }),
    topic({
      title: "What stays with humans", slug: "humans",
      blocks: [
        table("Automate or not?", ["Action", "Automate?", "Why"], [["Tests, analysis, builds", "Yes", "Cheap, repeatable and safe"], ["Test-network deployment", "Yes", "No real value at stake"], ["Choosing the mainnet date and parameters", "No", "A decision with consequences"], ["Mainnet deployment signing", "No", "A hardware wallet in human hands"], ["Accepting audit findings", "No", "Someone must own the risk"], ["Emergency pause", "A person or trusted guardian", "Fast but accountable"]]),
        p("Pipelines hold secrets, and secrets leak: through logs, forked pull requests, compromised actions or stolen tokens. Never give a pipeline a key that controls real value. If a pipeline can do it with a stored key, so can anyone who compromises the pipeline."),
        list("Pipeline hygiene", ["Pin versions of actions and dependencies.", "Restrict which branches can deploy.", "Use protected environments for test-network secrets.", "Never print secrets in logs.", "Review changes to the pipeline like code."], true),
        miniQuiz("human-mini", [["Why not sign mainnet deployments from the pipeline?", ["It is slow", "A compromised pipeline would be a compromised key that controls real value", "Wallets forbid it", "Pipelines cannot sign"], 1, "Keep dangerous powers away from stored secrets."]]),
      ],
      points: ["Automate checks and test-network releases; keep mainnet decisions and signing human.", "Never store a key that controls real value in a pipeline."],
      check: [["Mainnet deployment should be signed by:", ["A person with a hardware wallet", "A pipeline secret", "A random bot", "The browser"], 0, "Human control."]],
    }),
    topic({
      title: "A test strategy and readiness score", slug: "test-strategy",
      blocks: [
        table("The test strategy", ["Layer", "Tests", "Run when"], [["Contracts", "Unit, fuzz and invariant tests, gas snapshots", "Every change"], ["Integration", "Several contracts together, including fork tests", "Every change or nightly"], ["Front end", "Component tests and type checks", "Every change"], ["End to end", "A real user path on a local chain or test network", "Before release"], ["Operations", "Rehearsal of deployment, upgrade and incident response", "Before launch and each quarter"]]),
        explorer({ id: "pw-ready", title: "Readiness score", intro: "Move the sliders to mark how well each area is covered (0 to 100). The score weights the areas by importance. A teaching model.", inputs: [{ id: "audit", label: "Audit and review", min: 0, max: 100, step: 5, value: 90 }, { id: "tests", label: "Tests and coverage", min: 0, max: 100, step: 5, value: 80 }, { id: "mon", label: "Monitoring", min: 0, max: 100, step: 5, value: 70 }, { id: "run", label: "Runbooks and rehearsal", min: 0, max: 100, step: 5, value: 40 }], outputs: [{ label: "Weighted readiness (%)", expr: "(audit * 35 + tests * 25 + mon * 20 + run * 20) / 100", unit: "n" }] }),
        miniQuiz("strat-mini", [["Why rehearse the incident response?", ["It is fun", "A plan that has never been tried usually fails when needed", "It lowers fees", "It is legally required"], 1, "Practice reveals gaps."]]),
        warn("A high readiness score is not a guarantee. It is a structured way to see what is missing."),
      ],
      points: ["Test at every layer and rehearse operations.", "Use a score to expose gaps, not to claim safety."],
      check: [["An end-to-end test checks:", ["A real user path", "One function", "Gas", "Names"], 0, "From click to result."]],
    }),
  ],
  terms: [["CI", "Continuous integration: automatic checks on every change"], ["CD", "Continuous delivery: automatic release to safe environments"], ["Coverage", "How much code the tests run"], ["Static analysis", "Automated scanning for bug patterns"], ["Protected environment", "A place where secrets are restricted"], ["Rehearsal", "Practice of a real procedure"]],
  practical: { title: "Practical: build the pipeline", intro: "In a repository of your own.", steps: ["Add the workflow and make it pass.", "Break a test and see the pipeline fail.", "Add a test-network deployment job with protected secrets.", "Write what stays manual and why."] },
  quiz: [
    ["CI runs:", ["On every change", "Once a year", "Never", "By hand"], 0, "Consistency."],
    ["Static analysis finds:", ["Known patterns", "All bugs", "Intent", "Market risk"], 0, "Fast checks."],
    ["Test-network deployment can be:", ["Automatic", "Impossible", "Illegal", "Secret"], 0, "No real value."],
    ["Mainnet signing should be:", ["Human, with hardware", "Automatic", "Random", "Hidden"], 0, "Protect the key."],
    ["A pipeline secret may leak through:", ["Logs and forks", "Nothing", "Colours", "Fonts"], 0, "Treat as compromised."],
    ["Rehearsal reveals:", ["Gaps in procedures", "Nothing", "Prices", "Names"], 0, "Practice finds problems."],
    ["Readiness scores:", ["Expose gaps", "Guarantee safety", "Replace audits", "Fix bugs"], 0, "A tool, not a proof."],
  ],
});

const M4 = module_({
  slug: "wallet-ux-and-front-end", title: "Wallet UX and the front end", hours: 2.5, level: "Applied skills",
  summary: "Transactions as state machines, honest messages, network handling and accessibility.",
  outcome: "You can model a transaction as states, write friendly error messages and design a front end that tells the truth.",
  intro: "Most users blame the app, not the blockchain, when something goes wrong. A front end that shows the truth calmly keeps their trust. This module models transactions as clear states and writes the messages around them.",
  topics: [
    topic({
      title: "A transaction is a story with states", slug: "tx-states",
      blocks: [
        code("javascript", txMachine, "tx-state.js"),
        flow("The user's view", ["Waiting for wallet", "Submitted", "Confirming", "Confirmed", "or Failed at any point"]),
        table("Why states beat spinners", ["A single spinner", "Explicit states"], [["The user does not know whether to wait", "The user sees exactly what is happening"], ["Failure shows a vague error", "Each failure has a specific, helpful message"], ["The app may claim success too early", "Success is shown only when the required confirmations exist"], ["Hard to test", "Each state is easy to test"]]),
        miniQuiz("state-mini", [["Why show 'Confirmed' only after enough confirmations?", ["Because it looks nicer", "A recent block can still be replaced, so earlier success could be false", "Wallets require it", "To waste time"], 1, "Do not promise what is not final."]]),
      ],
      points: ["Model a transaction as states with specific messages.", "Show success only when it is final enough."],
      check: [["A rejection in the wallet should be shown as:", ["A calm, non-error message", "A scary error", "A success", "Nothing"], 0, "It was the user's choice."]],
    }),
    topic({
      title: "Messages, fees and network handling", slug: "messages-network",
      blocks: [
        table("Good and poor messages", ["Situation", "Poor", "Good"], [["Not enough for the fee", "Error: INSUFFICIENT_FUNDS", "Your wallet does not have enough currency to pay the network fee. Add a little and try again."], ["User cancelled", "Transaction failed", "You cancelled the request. Nothing was sent or spent."], ["Wrong network", "Unsupported chain", "Please switch to the right network. [Switch button]"], ["Contract refusal", "execution reverted", "The contract did not accept this action: the amount is above your limit."]]),
        list("Handling fees and networks", ["Estimate and show the expected fee before asking for confirmation.", "Explain that the fee goes to the network, not to you.", "Detect the wrong network and offer a switch button.", "Handle accounts changing while the page is open.", "Show the transaction link so users can verify independently.", "Never auto-approve unlimited token allowances."]),
        explorer({ id: "pw-fee", title: "Fee preview", intro: "Change gas and price to preview the fee a user will see. Teaching figures.", inputs: [{ id: "gas", label: "Gas expected", min: 21000, max: 500000, step: 1000, value: 85000 }, { id: "gwei", label: "Gas price (gwei)", min: 1, max: 200, step: 1, value: 20 }, { id: "eth", label: "ETH price (rupees)", min: 50000, max: 500000, step: 10000, value: 250000 }], outputs: [{ label: "Expected fee (rupees)", expr: "gas * gwei / 1000000000 * eth", unit: "rs" }] }),
        miniQuiz("msg-mini", [["Why show the expected fee before the wallet prompt?", ["It is required by law", "Users should not be surprised by the cost", "It lowers the fee", "It is quicker"], 1, "Predictability builds trust."]]),
      ],
      points: ["Replace error codes with calm, specific, actionable messages.", "Preview fees and handle network and account changes."],
      check: [["Unlimited token approvals should be:", ["Avoided by default", "Always requested", "Hidden", "Automatic"], 0, "Limit exposure."]],
    }),
    topic({
      title: "Trust, safety and accessibility", slug: "trust-access",
      blocks: [
        table("Front-end safety", ["Risk", "Defence"], [["Fake copy of your site", "Publish the official address; use consistent domains; warn users"], ["Malicious script injected via a dependency", "Pin and audit dependencies; use a strict content security policy; avoid loading unknown scripts"], ["Phishing prompts impersonating your app", "Teach users to read wallet prompts; never ask for recovery phrases"], ["Unsafe links in user content", "Sanitise and validate everything shown"], ["Showing data from untrusted sources as if it were verified", "Label what is verified on-chain and what is not"]]),
        list("Accessibility and clarity", ["Use plain language and avoid jargon, or explain it.", "Keep text readable and colours distinguishable.", "Make every control usable with a keyboard.", "Do not rely on colour alone to show status.", "Support slow connections and failed requests gracefully.", "Provide help in the languages your users speak."]),
        miniQuiz("trust-mini", [["Why label what is verified on-chain?", ["It is decorative", "Users can tell facts from claims", "It saves gas", "It speeds up loading"], 1, "Honesty about what is known."]]),
      ],
      points: ["Defend the front end like any web application and label what is verified.", "Plain language and accessibility are part of safety."],
      check: [["A content security policy helps:", ["Limit which scripts can run", "Lower fees", "Speed up blocks", "Hide data"], 0, "Stops injected scripts."]],
    }),
  ],
  terms: [["State machine", "A model with defined states and transitions"], ["Wallet prompt", "The approval window shown by the wallet"], ["Content security policy", "Browser rules limiting scripts"], ["Allowance", "Permission for a contract to move tokens"], ["Phishing", "Tricking users into harmful actions"], ["Accessibility", "Usability for everyone"]],
  practical: { title: "Practical: build the state view", intro: "In a small page.", steps: ["Use the state machine with a fake send function.", "Show a different message for each state.", "Make it fail in each of the five ways.", "Read every message aloud as a new user."] },
  quiz: [
    ["A transaction has:", ["Several states", "One state", "No states", "Colours"], 0, "Model them."],
    ["Success should be shown:", ["When final enough", "At once", "Never", "Randomly"], 0, "Do not promise early."],
    ["A cancelled request should say:", ["Nothing was spent", "Fatal error", "You are blocked", "Try never"], 0, "Reassure users that nothing was lost."],
    ["Unlimited approvals are:", ["Risky by default", "Required", "Free", "Private"], 0, "Ask for what is needed."],
    ["Dependencies should be:", ["Pinned and audited", "Random", "Ignored", "Deleted"], 0, "Supply-chain risk."],
    ["Plain language is:", ["Part of safety", "Optional decoration", "Banned", "Slow"], 0, "Clarity prevents mistakes."],
    ["Verified facts should be:", ["Labelled", "Hidden", "Mixed with claims", "Removed"], 0, "Be honest about what is verified."],
  ],
});

const M5 = module_({
  slug: "indexing-monitoring-and-scaling", title: "Indexing, monitoring and scaling", hours: 2.5, level: "Applied skills",
  summary: "Health checks, alert triage, error budgets and scaling reads without breaking provider limits.",
  outcome: "You can write a health check, triage alerts sensibly and plan capacity for growth.",
  intro: "Things will break. What separates professionals is how soon they know and how calmly they respond. This module covers the signals worth watching, how to avoid alert fatigue and how to scale the read side of an application.",
  topics: [
    topic({
      title: "Health checks that match what users feel", slug: "health-checks",
      blocks: [
        code("javascript", healthCheck, "monitor.js"),
        table("What the monitor watches", ["Signal", "Why it matters"], [["Age of the latest block", "A stalled chain or provider means stale data and stuck transactions"], ["Indexer lag in blocks", "Users see old balances and missing items"], ["Alert severity: page or ticket", "Not everything deserves a 3 a.m. call"]]),
        p("Good monitoring starts from what users feel: pages that are stale, transactions that never confirm, balances that look wrong. Technical signals such as CPU matter too, but a green dashboard that hides a broken user journey is worse than none."),
        miniQuiz("health-mini", [["Why alert on indexer lag in blocks rather than only server uptime?", ["Uptime is useless", "A running indexer that is far behind still serves stale data", "Blocks are free", "Lag is invisible"], 1, "Measure what users experience."]]),
      ],
      points: ["Monitor block age and indexer lag, not just whether processes are running.", "Classify alerts by severity."],
      check: [["A stale indexer means users see:", ["Old data", "New data", "No page", "Faster pages"], 0, "Lag has user impact."]],
    }),
    topic({
      title: "Alerts, error budgets and incidents", slug: "alerts-slo",
      blocks: [
        table("Alert design", ["Level", "Meaning", "Example"], [["Page", "A human must act now", "Unexpected large withdrawal; indexer far behind; contract paused"], ["Ticket", "Fix in working hours", "Slow lag trend; disk filling; dependency update"], ["Log only", "Record, no action", "Single retry succeeded"]]),
        p("An **error budget** turns an availability promise into numbers. If you promise 99.5% over a month, you may be down about 216 minutes in a 30-day month. When the budget is nearly used up, slow down risky releases and fix reliability; when plenty remains, you can move faster."),
        explorer({ id: "pw-slo", title: "Downtime allowed", intro: "Change the target and incidents to see how much of the error budget is used. A teaching model.", inputs: [{ id: "target", label: "Availability target (%)", min: 95, max: 99.99, step: 0.01, value: 99.5 }, { id: "n", label: "Incidents this month", min: 0, max: 10, step: 1, value: 3 }, { id: "len", label: "Average length (minutes)", min: 5, max: 180, step: 5, value: 45 }], outputs: [{ label: "Allowed downtime (minutes)", expr: "43200 * (100 - target) / 100", unit: "n" }, { label: "Budget used (%)", expr: "n * len / (43200 * (100 - target) / 100) * 100", unit: "n" }] }),
        list("Incident habits", ["One person leads; others support.", "Write down what you do and when.", "Pause first if funds are at risk.", "Communicate early, honestly and regularly.", "Fix, then write a post-mortem without blame.", "Turn lessons into tests, alerts and runbook changes."], true),
        miniQuiz("slo-mini", [["What does an exhausted error budget suggest?", ["Release faster", "Slow down risky changes and fix reliability", "Ignore alerts", "Raise prices"], 1, "Reliability first."]]),
      ],
      points: ["Page only for what needs a human now.", "Use error budgets to balance speed and reliability."],
      check: [["A post-mortem should be:", ["Blameless and shared", "Secret", "Skipped", "Personal"], 0, "Learn openly."]],
    }),
    topic({
      title: "Scaling reads and controlling cost", slug: "scaling",
      blocks: [
        table("Scaling the read side", ["Technique", "Benefit", "Care needed"], [["Cache values that change slowly", "Fewer requests, faster pages", "Know how stale is acceptable"], ["Serve reads from your own database fed by the indexer", "Fast, searchable, no per-request chain cost", "Keep the indexer correct and monitored"], ["Share one backend reader instead of each browser polling", "Stays inside provider limits", "Backend becomes critical"], ["Use more than one provider", "Survives outages", "Compare answers for important data"], ["Paginate and limit API responses", "Protects the API", "Clients must handle pages"]]),
        explorer({ id: "pw-scale", title: "Request load", intro: "Change users and polling to see requests per day if every browser polls, compared with a backend that reads each block once. A teaching model.", inputs: [{ id: "users", label: "Active users", min: 100, max: 100000, step: 100, value: 5000 }, { id: "polls", label: "Polls per minute per user", min: 1, max: 20, step: 1, value: 4 }], outputs: [{ label: "Every browser polls (requests per day)", expr: "users * polls * 60 * 24", unit: "n" }, { label: "One backend reads each block (requests per day)", expr: "7200", unit: "n" }] }),
        mistakes(["Scaling by buying a bigger plan before fixing wasteful polling.", "Caching data that must be fresh, such as a balance during a withdrawal.", "Having a single provider with no fallback."]),
        miniQuiz("scale-mini", [["What is the cheapest first step to scale reads?", ["Buy more servers", "Stop each browser polling and share reads through a backend or cache", "Remove monitoring", "Raise fees"], 1, "Remove waste before adding capacity."]]),
      ],
      points: ["Share reads, cache wisely and use more than one provider.", "Remove wasteful polling before buying capacity."],
      check: [["Caching is dangerous for:", ["Data that must be fresh", "Static text", "Logos", "Fonts"], 0, "Know staleness limits."]],
    }),
  ],
  terms: [["Health check", "A test that a system is working"], ["Lag", "How far behind a processor is"], ["Page", "To alert a person immediately"], ["Error budget", "The downtime allowed by an availability target"], ["Post-mortem", "A written review of an incident"], ["Fallback provider", "A backup service"]],
  practical: { title: "Practical: set your alerts", intro: "For your own project.", steps: ["List five signals users feel.", "Mark each page, ticket or log-only.", "Write the threshold for each.", "Calculate your monthly error budget."] },
  quiz: [
    ["Health checks should reflect:", ["What users experience", "Only CPU", "Only memory", "Only colours"], 0, "Lag and freshness."],
    ["Page a human for:", ["Urgent risk", "Every log", "Every retry", "Every deploy"], 0, "Avoid alert fatigue."],
    ["An error budget is:", ["Allowed downtime", "Money", "A bug count", "A fee"], 0, "From the availability target."],
    ["Blameless post-mortems:", ["Focus on learning", "Assign blame", "Are secret", "Are skipped"], 0, "Improve the system."],
    ["Scaling reads starts with:", ["Removing wasteful polling", "Buying hardware", "Deleting data", "Raising prices"], 0, "Efficiency first."],
    ["Multiple providers give:", ["Resilience", "Higher fees", "Slower pages", "Less data"], 0, "Outage protection."],
    ["Pagination protects:", ["The API", "The chain", "The wallet", "The font"], 0, "Limits response size."],
  ],
});

const M6 = module_({
  slug: "launch-and-operate", title: "Launch and operate", hours: 2.5, level: "Applied skills",
  summary: "The launch plan, the first week, incident response, upgrades and honest communication.",
  outcome: "You can write a launch-day plan, run an incident calmly and keep operating a live product responsibly.",
  intro: "Launch is a beginning, not an end. The first days are the riskiest and the habits you establish now decide how well the product survives its first surprise. This module is about doing it calmly.",
  topics: [
    topic({
      title: "The launch plan", slug: "launch-plan",
      blocks: [
        table("A staged launch", ["Stage", "What happens", "Gate to the next stage"], [["Internal", "Team uses the main network deployment with tiny amounts", "No unexpected behaviour for a day"], ["Invited", "A small group with a low cap", "No incidents, monitoring quiet"], ["Public, capped", "Open to everyone with a modest cap", "A week without issues; alerts tuned"], ["Public, raised", "Caps raised in announced steps", "Each step gated on stability"], ["Steady state", "Caps set by risk appetite", "Quarterly reviews continue"]]),
        explorer({ id: "pw-cap", title: "Cap and exposure", intro: "Change the cap and the chance of a serious undiscovered bug to see expected exposure. A teaching model with made-up figures.", inputs: [{ id: "cap", label: "Deposit cap (rupees)", min: 100000, max: 500000000, step: 100000, value: 10000000 }, { id: "p", label: "Chance of a serious bug (%)", min: 1, max: 50, step: 1, value: 10 }], outputs: [{ label: "Expected exposure (rupees)", expr: "cap * p / 100", unit: "rs" }] }),
        list("Launch-day essentials", ["Everyone knows their role.", "The exact steps were rehearsed.", "Monitoring is live before the first user.", "The pause and the person who can use it are ready.", "Official addresses and links are published in one place.", "Stop conditions are agreed in advance."]),
        miniQuiz("launch-mini", [["Why raise caps in announced steps?", ["It looks professional", "Each step limits exposure while evidence of stability accumulates", "It is required by law", "It saves gas"], 1, "Earn trust with evidence."]]),
      ],
      points: ["Launch in stages with caps and gates.", "Agree stop conditions before launch day."],
      check: [["A stage gate is:", ["A condition to pass before the next stage", "A fee", "A token", "A wallet"], 0, "Evidence-based progress."]],
    }),
    topic({
      title: "Incidents and communication", slug: "incidents",
      blocks: [
        flow("An incident, calmly", ["Detect (alert or report)", "Assess: is money or data at risk?", "Contain: pause what can be paused", "Communicate: say what is known and not known", "Fix and rehearse the fix", "Resume gradually", "Learn: publish a post-mortem"]),
        table("Writing to users during an incident", ["Do", "Don't"], [["Say what happened, in plain words", "Use jargon to sound clever"], ["Say what you do not yet know", "Guess or speculate about causes"], ["Say what users should do or not do", "Leave them wondering"], ["Give the next update time", "Go silent"], ["Take responsibility", "Blame others"], ["Warn about impersonators", "Ask users for recovery phrases"]]),
        p("Silence is read as guilt or incompetence. Short, honest updates at predictable times build more trust than perfect statements that arrive late."),
        miniQuiz("inc-mini", [["What belongs in an early incident update?", ["A full explanation of the cause", "What happened, what is known and unknown, and when the next update comes", "Blame", "A sales pitch"], 1, "Honest and predictable."]]),
      ],
      points: ["Contain first, then communicate honestly and regularly.", "Publish a blameless post-mortem."],
      check: [["During an incident you should never ask users for:", ["Recovery phrases", "Patience", "Feedback", "Updates"], 0, "Nobody legitimate needs them."]],
    }),
    topic({
      title: "Operating over time", slug: "operating",
      blocks: [
        table("Ongoing work", ["Area", "Practice"], [["Upgrades", "Rehearse, review, announce and use the time-lock; never surprise users"], ["Dependencies", "Update and audit regularly; pin versions"], ["Keys and roles", "Review who holds what; rotate after any doubt; practise recovery"], ["Monitoring", "Tune alerts to remove noise and add missing signals"], ["Docs and runbooks", "Keep them current; new people should be able to follow them"], ["Bounty and disclosure", "Respond fast and reward responsibly"], ["Costs", "Review provider, hosting and gas costs monthly"]]),
        list("A quarterly review asks", ["What incidents and near misses did we have?", "Did our alerts help or distract?", "Who still depends on one person's knowledge?", "Which dependencies are out of date?", "Did we keep our promises to users?", "What will we change?"], true),
        warn("This course teaches practice, not a guarantee. Products that hold other people's money need independent audits, legal advice and continuing care."),
        miniQuiz("op-mini", [["Why review near misses?", ["To assign blame", "They reveal weaknesses before they cause harm", "They are illegal", "They raise costs"], 1, "Cheap lessons."]]),
      ],
      points: ["Operations is continuous: upgrades, dependencies, keys, alerts and docs.", "Review incidents and near misses regularly."],
      check: [["A single person holding all knowledge is:", ["A risk", "Ideal", "Required", "Irrelevant"], 0, "Spread knowledge across the team."]],
    }),
  ],
  terms: [["Stage gate", "A condition for moving to the next stage"], ["Deposit cap", "A limit on funds the product accepts"], ["Incident", "An unplanned event harming service or safety"], ["Contain", "Limit the damage"], ["Near miss", "A problem that nearly caused harm"], ["Rotation", "Replacing keys or secrets"]],
  practical: { title: "Practical: rehearse an incident", intro: "With your team or a friend.", steps: ["Invent a scenario such as an unexpected large withdrawal.", "Walk through detect, assess, contain and communicate.", "Write the first public update.", "List what you would change in your tools."] },
  quiz: [
    ["A staged launch limits:", ["Exposure", "Tests", "Monitoring", "Docs"], 0, "Grow with evidence."],
    ["Stop conditions are agreed:", ["In advance", "During the incident", "After", "Never"], 0, "Decide calmly."],
    ["In an incident, first:", ["Contain the risk", "Argue", "Wait", "Delete logs"], 0, "Pause if possible."],
    ["Updates should state:", ["Known and unknown", "Only good news", "Only blame", "Nothing"], 0, "Honest updates build trust."],
    ["Post-mortems are:", ["Blameless and public", "Secret", "Skipped", "Personal"], 0, "Learn openly."],
    ["Upgrades go through:", ["Rehearsal and a time-lock", "Surprise", "One key", "Chance"], 0, "Warn users."],
    ["Operations is:", ["Continuous", "One-off", "Optional", "Automatic"], 0, "Ongoing care."],
  ],
});

export default course({
  slug: "production-ready-web3-apps", title: "Building Production-Ready Web3 Applications", tagline: "From a working demo to a launched product: control, pipelines, user experience, monitoring and calm operations", level: "Professional", hours: 16,
  summary: "The professional layer on top of the code: full-stack architecture and environments, bounded admin powers with time-locks and multi-signature control, safe brakes, a reviewed deployment script, CI/CD pipelines, transaction state machines and honest wallet UX, health checks, alerts and error budgets, staged launches and incident response. Solidity listings were compiled with solc against OpenZeppelin 5 and JavaScript was syntax-checked. This course teaches practice; it does not make any product safe by itself.",
  modules: [M1, M2, M3, M4, M5, M6],
  capstone: capstone({
    title: "Final project: write a production readiness review", summary: "Produce a professional readiness review and pass the final assessment.",
    intro: "You have seen every layer: architecture, control, pipelines, user experience, monitoring and launch. In this final step you review a vault product the way a senior engineer or auditor would, decide whether it is ready, and say plainly what remains risky. Then take the final assessment covering the whole course.",
    steps: ["Work through the **Final project: write a production readiness review** lab.", "Make sure every risk has an owner or an accepted decision.", "Take the final assessment below."], projectTitle: "A production readiness review",
    quiz: [
      ["The part of a product carrying the most risk is usually:", ["The smart contracts", "The logo", "The fonts", "The footer"], 0, "Public, valuable, hard to change."],
      ["Rehearsals should use:", ["The same scripts as production", "Different scripts", "No scripts", "Manual guesses"], 0, "Only then do they prove something."],
      ["A hard fee ceiling in code gives users:", ["A worst case they can rely on", "Lower gas", "Privacy", "Faster blocks"], 0, "Limits beat promises."],
      ["A time-lock gives users:", ["Notice before a change", "Free gas", "Secrecy", "Speed"], 0, "A waiting period."],
      ["A pause should never:", ["Trap users' withdrawals", "Stop deposits", "Emit events", "Alert the team"], 0, "Do no extra harm."],
      ["Mainnet deployment should be signed by:", ["A person with a hardware wallet", "A pipeline secret", "A bot", "The browser"], 0, "Keep dangerous keys out of pipelines."],
      ["Transactions in the interface are best modelled as:", ["States with specific messages", "One spinner", "No feedback", "Random colours"], 0, "Tell the truth."],
      ["A user cancelling in the wallet should see:", ["A calm message that nothing was spent", "A fatal error", "A success", "Nothing"], 0, "Reassure users that nothing was lost."],
      ["Good monitoring watches:", ["What users feel, such as lag and freshness", "Only CPU", "Only memory", "Nothing"], 0, "User-centred signals."],
      ["An error budget is:", ["Allowed downtime from the availability target", "A cash fund", "A bug count", "A fee"], 0, "Balance speed and reliability."],
      ["The first stage of a launch should use:", ["A small cap and a small group", "Everyone and no cap", "No monitoring", "No pause"], 0, "Limit exposure."],
      ["Holding real value requires:", ["An independent audit and continuing care", "Only tests", "Only a logo", "Luck"], 0, "Real value, real duty."],
    ],
  }),
  labs,
  skills: [{ id: SK, label: "Production Web3" }],
  badges: [
    { id: "environment-wise", title: "Environment-wise", description: "Chose the right environment for each task.", when: { all: ["q1-environments"] } },
    { id: "governance-reviewer", title: "Governance reviewer", description: "Judged who controls a live contract.", when: { all: ["q3-governance"] } },
    { id: "launch-planner", title: "Launch planner", description: "Wrote a launch-day plan.", when: { all: ["q11-launch-day"] } },
    { id: "readiness-reviewer", title: "Readiness reviewer", description: "Wrote a production readiness review.", when: { all: ["cap-readiness"] } },
  ],
  landing: {
    hero: { eyebrow: "Professional · Solidity compiled, JavaScript and CI configuration included", title: "Production-ready Web3: from working demo to calm operations", subtitle: "Design environments and control, build a pipeline, write honest wallet messages, monitor what users feel and plan a staged launch and a calm response when something breaks. Every task is checked and explained.", level: "Professional", outcomeLine: "After this course you can plan, review and operate a Web3 product the way a careful professional team would." },
    outcomes: [
      { icon: "docs", title: "See the whole product", text: "Contracts, front end, backend, indexer, providers and people." },
      { icon: "safety", title: "Limit and delay power", text: "Ceilings, time-locks, multi-signature control and safe brakes." },
      { icon: "cloud", title: "Automate the boring parts", text: "CI, test-network deployment and human-held mainnet." },
      { icon: "sort", title: "Tell users the truth", text: "Transaction states and calm, specific messages." },
      { icon: "sheet", title: "Measure and decide", text: "Costs, readiness scores and error budgets." },
      { icon: "word", title: "Launch and respond", text: "Stage gates, runbooks and honest incident updates." },
    ],
    projects: [
      { title: "A deployment runbook", text: "Steps anyone on the team can follow.", module: "contracts-in-production" },
      { title: "Error-message copy", text: "Five calm, specific messages.", module: "wallet-ux-and-front-end" },
      { title: "A launch-day plan", text: "Roles, timeline, stop conditions and updates.", module: "launch-and-operate" },
      { title: "A production readiness review", text: "A decision with reasons and open risks.", module: "capstone" },
    ],
    tools: [{ icon: "docs", title: "Checked code listings", text: "Solidity compiled with solc; JavaScript syntax-checked; CI configuration shown." }, { icon: "sheet", title: "Spreadsheet lab", text: "Deployment cost, readiness score and error budget." }, { icon: "word", title: "Document editor", text: "Runbooks, plans and reviews." }],
    assessment: ["Finish the required labs in each module: they are checked automatically and explained when something is missing.", "Pass each module quiz (70% or more). Short tests inside the lessons give instant feedback.", "Complete the readiness review and the final assessment."],
    faq: [
      { q: "Does the platform run my pipeline or deploy contracts?", a: "No. The labs check your plans, calculations and writing. You run the code and pipelines in your own tools, on test networks while learning." },
      { q: "Do I need the earlier courses?", a: "You should be comfortable with Solidity and Web3 JavaScript, for example from the earlier courses in this series." },
      { q: "Will this make my product safe?", a: "It teaches the practices that reduce risk. Products holding real value still need independent audits, legal advice and continuing operations." },
    ],
  },
  catalogue: {
    hours: "~16 hrs", weeks: "~6 weeks", pace: "3 hrs/wk", badge: "Professional Web3 Developer",
    brief: "Architecture, bounded control with time-locks, CI/CD, wallet UX, monitoring and staged launch and operations.",
    learn: ["Full-stack architecture and environments", "Bounded admin powers, time-locks and safe brakes", "CI/CD with test-network deployment and human-held mainnet", "Transaction state machines and calm wallet messages", "Health checks, alert triage, error budgets and scaling reads", "Staged launches, incident response and ongoing operations"],
    handsOn: "Write a production readiness review for a vault product and decide whether to launch, delay or stop.",
    outcome: "Plan, review and operate Web3 products with professional discipline.",
  },
});
