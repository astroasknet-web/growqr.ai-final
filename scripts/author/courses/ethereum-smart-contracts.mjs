import { bars, capstone, ck, classifyLab, code, course, def, example, explorer, flow, formula, hashLab, list, miniQuiz, mistakes, module_, p, S, sheetLab, table, tip, topic, W, warn, wordLab } from "../kit.mjs";

const SK = "ethereum";

const simpleStorage = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleStorage {
    uint256 private value;

    event ValueChanged(address indexed by, uint256 newValue);

    function set(uint256 newValue) external {
        value = newValue;
        emit ValueChanged(msg.sender, newValue);
    }

    function get() external view returns (uint256) {
        return value;
    }
}`;

const counter = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Counter {
    uint256 public count;

    function increment() external {
        count += 1;
    }

    function add(uint256 a, uint256 b) external pure returns (uint256) {
        return a + b;
    }
}`;

const tipJar = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TipJar {
    address public immutable owner;
    uint256 public totalTips;
    mapping(address => uint256) public tipsFrom;

    event Tipped(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    error NotOwner();
    error NothingToWithdraw();
    error TransferFailed();

    constructor() {
        owner = msg.sender;
    }

    function tip() external payable {
        require(msg.value > 0, "Send some ETH");
        tipsFrom[msg.sender] += msg.value;
        totalTips += msg.value;
        emit Tipped(msg.sender, msg.value);
    }

    function withdraw() external {
        if (msg.sender != owner) revert NotOwner();
        uint256 amount = address(this).balance;
        if (amount == 0) revert NothingToWithdraw();
        (bool ok, ) = owner.call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit Withdrawn(owner, amount);
    }
}`;

const vulnerable = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// FOR LEARNING ONLY. Do not deploy: this contract can be drained by reentrancy.
contract VulnerableBank {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "Nothing to withdraw");
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "Transfer failed");
        balances[msg.sender] = 0;
    }
}`;

const safe = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SaferBank {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "Nothing to withdraw");
        balances[msg.sender] = 0; // effects first
        (bool ok, ) = msg.sender.call{value: amount}(""); // interaction last
        require(ok, "Transfer failed");
    }
}`;

const hhTest = `const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TipJar", function () {
  it("accepts tips and lets only the owner withdraw", async function () {
    const [owner, fan] = await ethers.getSigners();
    const jar = await ethers.deployContract("TipJar");

    await jar.connect(fan).tip({ value: ethers.parseEther("0.1") });
    expect(await jar.totalTips()).to.equal(ethers.parseEther("0.1"));

    await expect(jar.connect(fan).withdraw()).to.be.revertedWithCustomError(jar, "NotOwner");
    await expect(jar.connect(owner).withdraw()).to.emit(jar, "Withdrawn");
  });
});`;

const labs = [
  classifyLab({
    id: "e1-accounts", module: "ethereum-model", title: "Wallet account or contract account?", level: "beginner", minutes: 8, xp: 30, skills: [SK], required: true,
    objective: "Tell externally owned accounts from contract accounts.", scenario: "Ethereum has two kinds of account. One is controlled by a private key; the other is controlled by code.",
    steps: ["Read each statement.", "Choose the account type.", "Press Check my work."],
    categories: [["eoa", "Externally owned account (EOA)"], ["contract", "Contract account"]],
    items: [["Controlled by a private key held in a wallet", "eoa", "A person or a device signs for it."], ["Has code that runs when it receives a call", "contract", "Code is the controller."], ["The only kind of account that can start a transaction", "eoa", "Contracts only react."], ["Can store data in its own storage", "contract", "Contract storage lives in the account."], ["Created when someone deploys code", "contract", "Deployment creates the account."], ["Has no code", "eoa", "Just a balance and a nonce."], ["Can hold ETH and tokens, and enforce rules about who can spend them", "contract", "Rules are programmed."], ["Your MetaMask-style wallet address", "eoa", "Controlled by your keys."]],
  }),
  sheetLab({
    id: "e2-units", module: "ethereum-model", title: "Wei, gwei and ether", level: "beginner", minutes: 12, xp: 45, skills: [SK], required: false,
    objective: "Convert between Ethereum's units, which are all powers of ten.",
    scenario: "Contracts count in wei, the smallest unit, because they cannot use decimals. 1 gwei is 1,000,000,000 wei and 1 ETH is 1,000,000,000,000,000,000 (10^18) wei.",
    steps: ["In C2 convert each amount in ETH (B) to wei: ETH times 10^18 using POWER(10,18).", "In D2 convert wei to gwei: wei divided by 10^9.", "Fill down rows 2 to 5.", "In B8 work out how many wei are in 0.025 ETH using the same method (type the formula)."],
    cells: { A1: "Description", B1: "ETH", C1: "Wei", D1: "Gwei", A2: "One ether", B2: "1", A3: "A small tip", B3: "0.01", A4: "A gas fee", B4: "0.0005", A5: "The smallest sensible fee", B5: "0.000001", A8: "0.025 ETH in wei" }, view: { cols: 4, rows: 10 },
    checks: [
      ck("c2", "C2 is one ether in wei", "=B2*POWER(10,18)", "Multiply by 10^18.", S.formula("C2", { fns: ["POWER"], equals: 1e18 })),
      ck("d3", "D3 is the tip in gwei", "=C3/POWER(10,9)", "Divide wei by 10^9.", S.formula("D3", { fns: ["POWER"], equals: 0.01 * 1e9 })),
      ck("c5", "C5 is the smallest fee in wei", "Fill down.", "0.000001 ETH is 10^12 wei.", S.formula("C5", { equals: 0.000001 * 1e18 })),
      ck("b8", "B8 is 0.025 ETH in wei", "=0.025*POWER(10,18)", "Same rule.", S.formula("B8", { fns: ["POWER"], equals: 0.025 * 1e18 })),
    ],
    solution: { cells: Object.assign({ B8: "=0.025*POWER(10,18)" }, ...[2, 3, 4, 5].map((r) => ({ [`C${r}`]: `=B${r}*POWER(10,18)`, [`D${r}`]: `=C${r}/POWER(10,9)` }))) },
  }),
  sheetLab({
    id: "e3-fee-market", module: "evm-and-gas", title: "Work out an EIP-1559 fee", level: "intermediate", minutes: 18, xp: 65, skills: [SK], required: true,
    objective: "Calculate the total fee, the burned part and the tip from gas used, base fee and priority fee.",
    scenario: "Since the London upgrade (2021) each block has a base fee per unit of gas, set by the protocol and burned. A user adds a priority fee (a tip) for the block producer. The total price per gas is the base fee plus the tip, provided it does not exceed the user's maximum. (Teaching numbers; 1 ETH = 10^9 gwei.)",
    steps: ["In B8 work out the price per gas: base fee plus tip.", "In B9 check the user's maximum fee per gas covers it: show OK if B3 is at least B8, otherwise Too low.", "In B10 work out the total fee in gwei: gas used times price per gas.", "In B11 work out the burned part in gwei: gas used times the base fee.", "In B12 work out the tip paid to the producer in gwei: gas used times the tip.", "In B13 convert the total fee to ETH: gwei divided by 1,000,000,000.", "In B14 convert to rupees using the ETH price in B6."],
    cells: { A1: "Input", B1: "Value", A2: "Gas used", B2: "65000", A3: "Maximum fee per gas the user allows (gwei)", B3: "50", A4: "Base fee per gas (gwei)", B4: "30", A5: "Priority fee (tip) per gas (gwei)", B5: "2", A6: "Illustrative price of 1 ETH (rupees)", B6: "250000", A8: "Price per gas (gwei)", A9: "Does the maximum cover it?", A10: "Total fee (gwei)", A11: "Burned (gwei)", A12: "Tip to the producer (gwei)", A13: "Total fee (ETH)", A14: "Total fee (rupees)" }, view: { cols: 2, rows: 16 },
    checks: [
      ck("b8", "B8 is the price per gas", "=B4+B5", "Base fee plus tip.", S.formula("B8", { equals: 32 })),
      ck("b9", "B9 is OK", "=IF(B3>=B8,\"OK\",\"Too low\")", "The user's cap must cover the price.", S.formula("B9", { fns: ["IF"], equals: "OK" })),
      ck("b10", "B10 is the total fee in gwei", "=B2*B8", "Gas times price.", S.formula("B10", { equals: 65000 * 32 })),
      ck("b11", "B11 is the burned part", "=B2*B4", "Gas times base fee.", S.formula("B11", { equals: 65000 * 30 })),
      ck("b12", "B12 is the tip", "=B2*B5", "Gas times tip.", S.formula("B12", { equals: 65000 * 2 })),
      ck("b13", "B13 is the total in ETH", "=B10/1000000000", "Divide gwei by a billion.", S.formula("B13", { equals: 65000 * 32 / 1e9 })),
      ck("b14", "B14 is the total in rupees", "=B13*B6", "ETH times price.", S.formula("B14", { equals: 65000 * 32 / 1e9 * 250000 })),
    ],
    solution: { cells: { B8: "=B4+B5", B9: "=IF(B3>=B8,\"OK\",\"Too low\")", B10: "=B2*B8", B11: "=B2*B4", B12: "=B2*B5", B13: "=B10/1000000000", B14: "=B13*B6" } },
  }),
  classifyLab({
    id: "e4-data-locations", module: "evm-and-gas", title: "Storage, memory or calldata?", level: "intermediate", minutes: 9, xp: 35, skills: [SK], required: false,
    objective: "Match data locations in the EVM to their cost and lifetime.", scenario: "Where data lives changes how much gas it costs and how long it lasts.",
    steps: ["Read each description.", "Choose the location.", "Press Check my work."],
    categories: [["storage", "Storage"], ["memory", "Memory"], ["calldata", "Calldata"]],
    items: [["Persistent data that stays between transactions; the most expensive to write", "storage", "It is saved on the chain."], ["Temporary space that disappears when the call ends", "memory", "Cheap and temporary."], ["Read-only input data sent with the transaction", "calldata", "Cheapest for external function inputs."], ["State variables declared at contract level", "storage", "Contract state."], ["A local array created inside a function", "memory", "Lives for the call."], ["The arguments of an external function when marked this way", "calldata", "Not copied."], ["Updating a balance mapping", "storage", "Each write costs gas."], ["A string built for a return value", "memory", "Temporary."]],
  }),
  classifyLab({
    id: "e5-read-code", module: "first-smart-contract", title: "What does this keyword mean?", level: "beginner", minutes: 9, xp: 35, skills: [SK], required: true,
    objective: "Read Solidity keywords and say what each is for.", scenario: "Before writing contracts you should be able to read them. Match each snippet to its meaning.",
    steps: ["Read each snippet.", "Choose what it means.", "Press Check my work."],
    categories: [["view", "Reads state, changes nothing"], ["pure", "Uses neither state nor chain data"], ["payable", "Can receive ETH"], ["event", "Writes a log for outside observers"], ["modifier", "Reusable check run before a function"]],
    items: [["function get() external view returns (uint256)", "view", "It can read state but not change it."], ["function add(uint256 a, uint256 b) external pure returns (uint256)", "pure", "It only uses its inputs."], ["function tip() external payable", "payable", "It accepts ETH with the call."], ["emit Tipped(msg.sender, msg.value);", "event", "Emits a log."], ["modifier onlyOwner() { require(msg.sender == owner); _; }", "modifier", "A check applied to functions."], ["function balanceOf(address who) external view returns (uint256)", "view", "A typical getter."], ["function deposit() external payable", "payable", "ETH can come with the call."], ["event Transfer(address indexed from, address indexed to, uint256 amount);", "event", "Declares a log format."]],
  }),
  wordLab({
    id: "e6-explain-contract", module: "first-smart-contract", title: "Explain the SimpleStorage contract in words", level: "intermediate", minutes: 15, xp: 55, skills: [SK], required: false,
    objective: "Describe what a small contract does, line by line, in plain English.",
    scenario: "SimpleStorage keeps one number. The function set stores a new number and emits an event ValueChanged with the caller's address and the new number. The function get returns the stored number and is marked view. Explain it to a classmate who has never seen Solidity.",
    steps: ["Write at least three sentences.", "Mention the state variable, the event and what view means.", "Say who is allowed to call set (anyone) and why that might or might not be a problem.", "Keep it between 70 and 180 words."],
    checks: [
      ck("state", "Mentions the stored number", "Mention the stored value or state variable.", "That is what the contract keeps.", W.pattern("state variable|stored|store|value", "the stored value")),
      ck("event", "Mentions the event", "Mention the event.", "Events tell the outside world.", W.contains("event")),
      ck("view", "Explains view", "Mention view or read-only.", "view means it does not change state.", W.pattern("view|read-only|reads|does not change|doesn't change", "view meaning read-only")),
      ck("anyone", "Says anyone can call set", "Mention anyone or no restriction.", "There is no access control.", W.pattern("anyone|any address|no restriction|no access control|everybody|not restricted", "that anyone can call it")),
      ck("para", "At least three sentences", "Write a real paragraph.", "Explain clearly.", W.paragraphs(1, 25)),
      ck("len", "Between 70 and 180 words", "Concise.", "A good explanation is brief.", W.words(70, 180)),
    ],
    solution: "<p>SimpleStorage is a tiny contract that remembers one number in a state variable called value. The set function lets someone store a new number and then emits an event called ValueChanged, which writes the caller's address and the new number into the transaction's log so apps outside the chain can notice the change. The get function simply returns the stored number, and because it is marked view it only reads and never changes anything, so calling it costs no gas when done from outside. Notice that anyone can call set, because there is no access control, which is fine for a demo but would be a problem for a contract that held something valuable.</p>",
  }),
  classifyLab({
    id: "e7-call-vs-tx", module: "contract-interaction", title: "Call or transaction?", level: "beginner", minutes: 8, xp: 30, skills: [SK], required: true,
    objective: "Tell a read-only call from a state-changing transaction.", scenario: "Reading from a contract is free from outside; changing it needs a signed transaction and gas.",
    steps: ["Read each action.", "Choose Call or Transaction.", "Press Check my work."],
    categories: [["call", "Call (read-only, no signing, no gas for the caller)"], ["tx", "Transaction (signed, costs gas, changes state)"]],
    items: [["Asking a contract for the stored value with get()", "call", "A read from a node."], ["Sending 0.1 ETH to tip()", "tx", "Changes balances."], ["Checking someone's token balance", "call", "Just a read."], ["Calling set(42) to change the value", "tx", "Writes to storage."], ["Deploying a new contract", "tx", "Creates an account."], ["Reading the owner address from a public variable", "call", "A free getter."], ["Withdrawing funds as the owner", "tx", "Moves ETH."], ["Estimating what a transaction would return without sending it", "call", "A simulation."]],
  }),
  sheetLab({
    id: "e8-gas-budget", module: "contract-interaction", title: "Budget the gas for a small project", level: "intermediate", minutes: 16, xp: 55, skills: [SK], required: false,
    objective: "Estimate what deploying and using a contract costs, so you can plan a testnet or live budget.",
    scenario: "Different actions use different amounts of gas. At a given gas price, work out the cost of each action and of a whole month of use. (Teaching numbers.)",
    steps: ["In D2 work out the cost of one action in ETH: gas used times gas price in gwei, divided by 1,000,000,000. Fill down to D5.", "In E2 work out the monthly cost: the cost of one action times the number of times per month (C). Fill down.", "In E7 total the monthly cost.", "In E8 convert it to rupees using the ETH price in B9.", "In B10 show Over budget if the monthly rupee cost is more than the budget in B11, else Within budget."],
    cells: { A1: "Action", B1: "Gas used", C1: "Times per month", D1: "Cost of one (ETH)", E1: "Monthly cost (ETH)", A2: "Deploy the contract", B2: "600000", C2: "1", A3: "Fans tip", B3: "50000", C3: "400", A4: "Owner withdraws", B4: "35000", C4: "4", A5: "Change a setting", B5: "30000", C5: "2", A7: "Total (ETH)", A8: "Total (rupees)", A9: "Gas price (gwei)", B9: "30", A10: "ETH price (rupees)", B10: "250000", A11: "Monthly budget (rupees)", B11: "100000", A12: "Verdict" }, view: { cols: 5, rows: 14 },
    checks: [
      ck("d2", "D2 is the cost of deploying", "=B2*$B$9/1000000000", "Gas times price over a billion.", S.formula("D2", { equals: 600000 * 30 / 1e9 })),
      ck("e3", "E3 is the monthly cost of tips", "=D3*C3", "One cost times the count.", S.formula("E3", { equals: 50000 * 30 / 1e9 * 400 })),
      ck("e7", "E7 is the total in ETH", "=SUM(E2:E5)", "Add the four rows.", S.formula("E7", { fns: ["SUM"], equals: (600000 * 1 + 50000 * 400 + 35000 * 4 + 30000 * 2) * 30 / 1e9 })),
      ck("e8", "E8 is the total in rupees", "=E7*B10", "ETH times the price.", S.formula("E8", { equals: (600000 * 1 + 50000 * 400 + 35000 * 4 + 30000 * 2) * 30 / 1e9 * 250000 })),
      ck("v", "B12 is the verdict", "=IF(E8>B11,\"Over budget\",\"Within budget\")", "Compare with the budget.", S.formula("B12", { fns: ["IF"], equals: (600000 * 1 + 50000 * 400 + 35000 * 4 + 30000 * 2) * 30 / 1e9 * 250000 > 100000 ? "Over budget" : "Within budget" })),
    ],
    solution: { cells: Object.assign({ E7: "=SUM(E2:E5)", E8: "=E7*B10", B12: "=IF(E8>B11,\"Over budget\",\"Within budget\")" }, ...[2, 3, 4, 5].map((r) => ({ [`D${r}`]: `=B${r}*$B$9/1000000000`, [`E${r}`]: `=D${r}*C${r}` }))) },
  }),
  classifyLab({
    id: "e9-spot-bug", module: "patterns-and-limits", title: "Safe pattern or bug?", level: "intermediate", minutes: 10, xp: 40, skills: [SK], required: true,
    objective: "Recognise common beginner mistakes and the safe patterns that fix them.", scenario: "Smart contracts hold real money and cannot be patched casually. Sort these short code habits.",
    steps: ["Read each snippet or habit.", "Choose Safe or Bug.", "Press Check my work."],
    categories: [["safe", "Safe pattern"], ["bug", "Bug or risky habit"]],
    items: [["Set the user's balance to zero before sending them ETH", "safe", "Checks, effects, interactions."], ["Send ETH first, then update the balance afterwards", "bug", "Opens the door to reentrancy."], ["Use msg.sender to check who is calling", "safe", "The direct caller."], ["Use tx.origin to check ownership", "bug", "A malicious contract can trick the owner."], ["Mark withdraw so that only the owner can call it", "safe", "Access control."], ["Leave an admin function with no access restriction", "bug", "Anyone can call it."], ["Use require to reject zero amounts and bad input", "safe", "Validate early."], ["Use block.timestamp or a blockhash as a source of randomness", "bug", "Producers can influence it."]],
  }),
  wordLab({
    id: "e10-spec", module: "patterns-and-limits", title: "Specify a contract before you code it", level: "intermediate", minutes: 18, xp: 60, skills: [SK], required: false,
    objective: "Write a clear specification: purpose, functions, rules, events and risks.",
    scenario: "A class wants a simple voting contract: the teacher creates three options, each student can vote once, and anyone can see the counts.",
    steps: ["Add Heading 2 sections: Purpose, Functions, Rules, Events, Risks.", "Under Functions list at least three functions in bullets.", "Under Rules say who can do what and the 'one vote each' rule.", "Under Risks mention at least two issues.", "Keep it between 120 and 280 words."],
    checks: [
      ck("heads", "Five sections", "Use Heading 2.", "A spec has structure.", W.heading(5, 2)),
      ck("order", "In order", "Purpose, Functions, Rules, Events, Risks.", "From why to how.", W.order(["Purpose", "Functions", "Rules", "Events", "Risks"])),
      ck("fn", "At least three functions", "Use the bullet button.", "List the functions.", W.list(3, "ul")),
      ck("once", "Mentions one vote each", "Mention only once or one vote.", "The key rule.", W.pattern("once|one vote|only one|cannot vote twice|can't vote twice", "the one-vote rule")),
      ck("owner", "Mentions the teacher's role", "Mention teacher, owner or admin.", "Who has special powers.", W.pattern("teacher|owner|admin", "the teacher's role")),
      ck("len", "Between 120 and 280 words", "Concise.", "A spec should be short.", W.words(120, 280)),
    ],
    solution: "<h2>Purpose</h2><p>Let a class vote on three options in a way that everyone can verify, with each student allowed one vote.</p><h2>Functions</h2><ul><li>addOption(name): the teacher adds an option before voting starts.</li><li>vote(optionId): a student casts a vote for an option.</li><li>getCount(optionId): anyone reads the votes for an option.</li><li>endVoting(): the teacher closes voting.</li></ul><h2>Rules</h2><p>Only the teacher, who is the owner set at deployment, can add options and end voting. Each student address can vote only once, and nobody can vote after voting has ended.</p><h2>Events</h2><p>VoteCast(voter, optionId) is emitted for every vote so that apps can display a live result.</p><h2>Risks</h2><ul><li>A student could use several addresses to vote more than once, so the teacher must register eligible addresses.</li><li>Votes on a public chain are visible, so this is not a secret ballot.</li></ul>",
  }),
  wordLab({
    id: "e11-checklist", module: "testing-and-deploying", title: "Write your deployment checklist", level: "intermediate", minutes: 15, xp: 55, skills: [SK], required: true,
    objective: "List the steps and checks to take before and after deploying a contract.",
    scenario: "You are about to deploy TipJar to a test network and later to the main network. Write a checklist.",
    steps: ["Add Heading 2 sections: Before deploying, Deploying, After deploying.", "Under each, write a numbered list of at least three steps.", "Mention a test network, tests, verifying source code on an explorer and a small first transaction.", "Keep it between 120 and 280 words."],
    checks: [
      ck("heads", "Three sections", "Use Heading 2.", "Group the steps.", W.heading(3, 2)),
      ck("order", "In order", "Before deploying, Deploying, After deploying.", "Time order.", W.order(["Before deploying", "Deploying", "After deploying"])),
      ck("steps", "Numbered steps", "Use the numbered list button for at least three steps.", "Order matters.", W.list(3, "ol")),
      ck("test", "Mentions a testnet and tests", "Mention testnet or test network and tests.", "Never go live untested.", W.pattern("testnet|test network|sepolia|test ", "a test network")),
      ck("verify", "Mentions verifying the source", "Mention verify or verified on an explorer.", "Transparency.", W.pattern("verif", "verifying the source code")),
      ck("len", "Between 120 and 280 words", "Concise.", "A checklist is short.", W.words(120, 280)),
    ],
    solution: "<h2>Before deploying</h2><ol><li>Write and run unit tests that cover every function and every revert.</li><li>Read the code again for access control, payments and events.</li><li>Get a second person to review it, and for anything holding real money an independent audit.</li></ol><h2>Deploying</h2><ol><li>Deploy first to a test network and use a faucet for test ETH.</li><li>Check the network, the account and the gas estimate before confirming.</li><li>Record the contract address and the transaction hash.</li></ol><h2>After deploying</h2><ol><li>Verify the source code on the block explorer so that anyone can read it.</li><li>Send a small first transaction and check the result and the event.</li><li>Document the address, the owner and how to pause or withdraw, then repeat on the main network with a small amount first.</li></ol>",
  }),
  classifyLab({
    id: "e12-read-tx", module: "testing-and-deploying", title: "Reading a transaction on an explorer", level: "beginner", minutes: 8, xp: 30, skills: [SK], required: false,
    objective: "Match the fields of a transaction page to their meaning.", scenario: "Block explorers show the same data every time. Learn what each field tells you.",
    steps: ["Read each field description.", "Choose the field name.", "Press Check my work."],
    categories: [["hash", "Transaction hash"], ["status", "Status"], ["gas", "Gas used"], ["logs", "Logs (events)"], ["input", "Input data"]],
    items: [["A unique identifier for the transaction", "hash", "You search by it."], ["Success or failed", "status", "A reverted transaction still costs gas."], ["How much computation was needed", "gas", "Fee is gas used times price."], ["Records emitted by the contract such as Tipped", "logs", "What the contract announced."], ["The encoded function call and arguments", "input", "Starts with a function selector."], ["Shows whether the contract reverted", "status", "Look here first when something fails."], ["Used with the price to compute the fee", "gas", "A key number."], ["Lets apps follow what happened without reading storage", "logs", "Events."]],
  }),
  wordLab({
    id: "cap-tipjar", module: "capstone", title: "Final project: a specification and test plan for TipJar", level: "challenge", minutes: 30, xp: 150, skills: [SK], required: true,
    objective: "Write a professional specification and test plan for a small contract, covering functions, access control, events, tests and risks.",
    scenario: "Use the TipJar contract as a model: people can send tips, the owner can withdraw. Specify an improved version that also lets the owner set a minimum tip and pause tipping. Write the spec and test plan.",
    steps: ["Add a Heading 1 'TipJar v2: specification and test plan'.", "Add Heading 2 sections: Purpose, Functions, Access control, Events and errors, Test plan, Risks.", "Under Functions list at least five functions in bullets.", "Under Test plan write a numbered list of at least six tests including a failing case.", "Under Risks list at least three risks.", "Keep it between 230 and 460 words."],
    checks: [
      ck("t", "A title", "Use Heading 1.", "Name the document.", W.heading(1, 1)),
      ck("secs", "Six sections", "Use Heading 2.", "A spec has structure.", W.heading(6, 2)),
      ck("order", "In order", "Purpose, Functions, Access control, Events and errors, Test plan, Risks.", "From purpose to risks.", W.order(["Purpose", "Functions", "Access control", "Events and errors", "Test plan", "Risks"])),
      ck("fn", "Five functions", "Use the bullet button.", "List the functions.", W.list(5, "ul")),
      ck("tests", "Six numbered tests", "Use the numbered list button.", "A test plan is numbered.", W.list(6, "ol")),
      ck("fail", "Includes a failing case", "Mention reverts, fails or not the owner.", "Test the bad paths too.", W.pattern("revert|fails|should fail|reject|not the owner|non-owner|only the owner", "a failing case")),
      ck("terms", "Uses contract vocabulary", "Mention msg.sender, require, event, payable or reentrancy.", "Use the language of the course.", W.pattern("msg\\.sender|require|event|payable|reentran|modifier|revert", "contract vocabulary")),
      ck("len", "Between 230 and 460 words", "A page or so.", "Specs must be readable.", W.words(230, 460)),
    ],
    solution: "<h1>TipJar v2: specification and test plan</h1><h2>Purpose</h2><p>A contract that lets anyone send ETH tips to a creator, records who tipped how much, and lets the creator withdraw the balance, set a minimum tip and pause tipping in an emergency.</p><h2>Functions</h2><ul><li>tip(): payable, accepts ETH, rejects amounts below the minimum and while paused.</li><li>withdraw(): only the owner, sends the whole balance to the owner.</li><li>setMinimumTip(amount): only the owner changes the minimum.</li><li>pause() and unpause(): only the owner toggles tipping.</li><li>tipsFrom(address) and totalTips(): public read functions.</li></ul><h2>Access control</h2><p>The owner is set in the constructor from msg.sender and cannot be changed. Every owner function checks msg.sender and reverts with NotOwner otherwise.</p><h2>Events and errors</h2><p>Tipped(from, amount), Withdrawn(to, amount), MinimumChanged(amount) and Paused(state) are emitted. Errors: NotOwner, BelowMinimum, PausedNow, NothingToWithdraw and TransferFailed.</p><h2>Test plan</h2><ol><li>A tip above the minimum increases totalTips and tipsFrom and emits Tipped.</li><li>A tip below the minimum reverts with BelowMinimum.</li><li>A tip while paused reverts with PausedNow.</li><li>A non-owner calling withdraw reverts with NotOwner.</li><li>The owner withdraw sends the full balance and emits Withdrawn.</li><li>Withdraw with a zero balance reverts with NothingToWithdraw.</li><li>setMinimumTip by a non-owner fails.</li></ol><h2>Risks</h2><ul><li>Reentrancy during withdraw, mitigated by sending only once and updating state before any external call.</li><li>A lost owner key means funds cannot be withdrawn, so the owner should use a hardware wallet or a multi-signature wallet.</li><li>Sending ETH to a contract that cannot receive it, so the withdraw function must check the result of the call.</li></ul>",
  }),
];

const M1 = module_({
  slug: "ethereum-model", title: "The Ethereum model", hours: 1.75, level: "Foundations",
  summary: "Accounts, transactions, blocks and units: the building blocks of the world computer.",
  outcome: "You can describe the two account types, read the fields of a transaction, convert between wei, gwei and ether and explain how Ethereum differs from Bitcoin.",
  intro: "Ethereum is often called a 'world computer': a single shared machine whose state is agreed by thousands of nodes. To write programs for it you need a precise model of what that machine contains and how it changes.",
  topics: [
    topic({
      title: "Accounts and state", slug: "accounts",
      blocks: [
        p("Ethereum keeps a **world state**: a mapping from addresses to accounts. Every account has a balance, a nonce (a count of how many transactions it has sent), and, for contracts, code and storage. A transaction is the only thing that changes this state."),
        table("Two kinds of account", ["", "Externally owned account (EOA)", "Contract account"], [["Controlled by", "A private key", "Its code"], ["Has code", "No", "Yes"], ["Can start a transaction", "Yes", "No; only reacts when called"], ["Created by", "Generating a key pair", "A deployment transaction"], ["Typical use", "A person's wallet", "An application's rules and assets"]]),
        flow("How the state changes", ["An EOA signs a transaction", "Nodes validate it and include it in a block", "The EVM runs any code involved", "Balances and storage are updated", "The new state root goes into the next block header"]),
        miniQuiz("accounts-mini", [["Which kind of account can start a transaction?", ["Contract accounts", "Externally owned accounts", "Both", "Neither"], 1, "Contracts only react to calls."]]),
        tip("The nonce stops a transaction from being replayed: each EOA transaction must carry the next number in sequence."),
      ],
      points: ["Ethereum's world state maps addresses to accounts.", "Only EOAs start transactions; contracts react."],
      check: [["A contract account is controlled by:", ["A private key", "Its code", "A miner", "A bank"], 1, "The code decides what happens."]],
    }),
    topic({
      title: "Transactions", slug: "transactions",
      blocks: [
        table("Fields of a transaction", ["Field", "Meaning"], [["nonce", "The sender's transaction count, to order and prevent replay"], ["to", "The recipient: an EOA or a contract (empty when deploying)"], ["value", "How much ETH to send, in wei"], ["data", "Encoded function call and arguments for a contract, or contract code when deploying"], ["gasLimit", "The most gas the sender allows this transaction to use"], ["maxFeePerGas and maxPriorityFeePerGas", "The most the sender will pay per gas, and the tip for the block producer"], ["signature", "Proves the sender authorised it"], ["chainId", "Which network it is for, to stop replay on other chains"]]),
        example("Three kinds of transaction", "What do the fields look like?", ["Plain transfer: to = a friend's address, value = 0.1 ETH, data empty.", "Contract call: to = the contract, value = 0 (or some ETH), data = the encoded function call.", "Deployment: to empty, data = the compiled contract code."], "Everything on Ethereum is a transaction with a different shape."),
        explorer({ id: "esc-units", title: "Wei, gwei and ether", intro: "Contracts count in wei because they cannot hold decimals. Change the amount of ETH to see it in gwei and wei.", inputs: [{ id: "eth", label: "Amount in ETH", min: 0.000001, max: 10, step: 0.000001, value: 0.01 }], outputs: [{ label: "Gwei", expr: "eth * 1000000000", unit: "n" }, { label: "Wei (shown in millions)", expr: "eth * 1000000000000", unit: "n" }] }),
        miniQuiz("tx-mini", [["Which field tells a contract which function to run and with what arguments?", ["nonce", "value", "data", "chainId"], 2, "It carries the encoded call."]]),
      ],
      points: ["A transaction has nonce, to, value, data, gas fields and a signature.", "A contract call puts the encoded function call in data."],
      check: [["A deployment transaction has:", ["An empty to field and code in data", "A zero value only", "No data", "No signature"], 0, "That creates a new contract."]],
    }),
    topic({
      title: "Blocks, ETH and how it differs from Bitcoin", slug: "blocks-and-eth",
      blocks: [
        table("Ethereum compared with Bitcoin", ["", "Bitcoin", "Ethereum"], [["Account model", "Unspent outputs", "Accounts with balances"], ["Programs", "Limited scripts", "Turing-complete smart contracts"], ["Block time", "About 10 minutes", "12 seconds (in slots)"], ["Consensus", "Proof of work", "Proof of stake since September 2022"], ["Fees", "By transaction size", "By computation (gas)"], ["Native asset", "BTC", "ETH, used for fees and staking"]]),
        p("Ethereum divides time into **slots** of 12 seconds. In each slot a validator is chosen to propose a block, and others attest to it. After enough attestations, blocks become final. The result is much faster confirmation than Bitcoin's, with a programming model that supports applications."),
        list("Test networks", ["Test networks such as Sepolia copy Ethereum's behaviour with worthless test ETH.", "You get test ETH from a 'faucet', a website that gives small amounts for free.", "Always develop and practise on a test network first; mistakes there cost nothing.", "Networks and faucets change over time, so check the official documentation for current ones."]),
        miniQuiz("eth-mini", [["Ethereum's consensus mechanism today is:", ["Proof of work", "Proof of stake", "Voting by banks", "None"], 1, "Since the Merge in 2022."]]),
      ],
      points: ["Ethereum has 12-second slots and proof of stake.", "Test networks let you practise with worthless ETH."],
      check: [["Test ETH is obtained from:", ["A bank", "A faucet", "Mining at home", "An exchange"], 1, "It is free and worthless."]],
    }),
  ],
  terms: [["World state", "All accounts and their data"], ["EOA", "Externally owned account"], ["Contract account", "An account controlled by code"], ["Nonce", "A transaction counter"], ["Wei", "The smallest unit of ether"], ["Faucet", "A site giving free test ETH"]],
  practical: { title: "Practical: explore a block explorer", intro: "Open a public block explorer for a test network.", steps: ["Find a recent block and count its transactions.", "Open one transaction and name its fields.", "Find an address and see whether it is an account or a contract.", "Note the gas used and the fee."] },
  quiz: [
    ["An EOA is controlled by:", ["Code", "A private key", "A miner", "A bank"], 1, "A wallet holds it."],
    ["The nonce is:", ["A fee", "The count of transactions an account has sent", "A hash", "A token"], 1, "It orders and protects against replay."],
    ["1 gwei equals:", ["10^9 wei", "10^18 wei", "10^3 wei", "1 wei"], 0, "A billion wei."],
    ["The data field of a call contains:", ["The encoded function and arguments", "The fee", "The signature", "The nonce"], 0, "That is how a contract knows what to run."],
    ["Ethereum slots last about:", ["12 seconds", "10 minutes", "1 hour", "1 second"], 0, "Faster than Bitcoin."],
    ["A faucet gives:", ["Real coins", "Free test ETH", "Tokens for sale", "Fees"], 1, "Worthless but useful."],
    ["Which is true of contract accounts?", ["They start transactions", "They have code and storage", "They have private keys", "They cannot hold ETH"], 1, "Code and storage define them."],
  ],
});

const M2 = module_({
  slug: "evm-and-gas", title: "The EVM and gas", hours: 1.75, level: "Core skills",
  summary: "How contract code runs, why every operation costs gas and how the fee market works.",
  outcome: "You can explain the EVM, distinguish storage from memory and calldata and calculate a transaction fee from gas used, base fee and tip.",
  intro: "Every node must run every contract call and reach the same answer. That is only possible if computation is deterministic and metered. The Ethereum Virtual Machine and its gas system are how Ethereum achieves both.",
  topics: [
    topic({
      title: "The Ethereum Virtual Machine", slug: "evm",
      blocks: [
        def("EVM", "The Ethereum Virtual Machine: a simple, deterministic machine that executes contract bytecode. Every node runs the same instructions on the same inputs and must get the same result."),
        p("You write contracts in a high-level language such as **Solidity**. A compiler turns your code into **bytecode**, a sequence of low-level instructions called opcodes. The EVM runs those opcodes on a stack, reading and writing three kinds of data."),
        table("Where data lives", ["Location", "Lifetime", "Cost", "Use"], [["Storage", "Permanent, part of the account", "Highest: writing a new slot is very expensive", "State variables such as balances"], ["Memory", "Only while the call runs", "Low", "Temporary working data"], ["Calldata", "Only during the call, read-only", "Cheapest to read", "Inputs to external functions"], ["Stack", "Only while the call runs", "Very low", "Small values used by opcodes"]]),
        flow("From source to execution", ["Solidity source", "Compiler (solc)", "Bytecode and ABI", "Deployment transaction", "Contract account with code", "EVM runs it on each call"]),
        miniQuiz("evm-mini", [["What does the compiler produce that the EVM executes?", ["A wallet", "Bytecode", "A hash", "A signature"], 1, "Opcodes run on the EVM."]]),
        warn("Because every node repeats every execution, contracts cannot use anything non-deterministic, such as the local time of one machine or true randomness from outside, without a specially designed source."),
      ],
      points: ["Solidity compiles to bytecode that the deterministic EVM executes.", "Storage is permanent and expensive; memory and calldata are temporary and cheaper."],
      check: [["Which location is permanent and most expensive to write?", ["Memory", "Calldata", "Storage", "Stack"], 2, "Writes change the chain's state."]],
    }),
    topic({
      title: "Gas: metering computation", slug: "gas",
      blocks: [
        p("Each opcode has a fixed **gas** cost, based roughly on the work it forces nodes to do. A simple addition costs very little; writing to storage costs a great deal; sending a transaction has a base cost of 21,000 gas. Gas does two jobs: it pays block producers, and it stops infinite loops, because a transaction that runs out of gas is stopped and its changes are undone."),
        table("Rough gas costs (order of magnitude)", ["Operation", "Approximate gas"], [["Basic transfer of ETH", "21,000"], ["Addition or comparison", "A few"], ["Reading a storage value", "A few hundred to a couple of thousand"], ["Writing a new storage value (zero to non-zero)", "About 20,000"], ["Updating an existing storage value", "A few thousand"], ["Emitting an event", "A few thousand, depending on data"], ["Deploying a small contract", "Hundreds of thousands"]]),
        def("Gas limit and gas used", "The gas limit is the most gas you allow a transaction to consume. Gas used is what it actually consumed. You pay for gas used, and any unused part of the limit is refunded; if the transaction needs more than the limit it fails and you still pay for what it used."),
        mistakes(["Setting a gas limit too low and having the transaction fail while still paying.", "Writing to storage in a loop without thinking about cost.", "Assuming all operations cost the same."]),
        miniQuiz("gas-mini", [["What happens if a transaction runs out of gas?", ["It is completed anyway", "It stops, its changes are undone and you still pay for the gas used", "The block is deleted", "You get a refund of all gas"], 1, "Work done must be paid for."]]),
      ],
      points: ["Gas meters computation and prevents infinite loops.", "Storage writes are the most expensive operations."],
      check: [["A basic ETH transfer costs:", ["21,000 gas", "1 gas", "1 million gas", "Nothing"], 0, "The standard base cost."]],
    }),
    topic({
      title: "The fee market (EIP-1559)", slug: "fee-market",
      blocks: [
        p("Before 2021 users bid blindly in an auction for block space. The London upgrade introduced EIP-1559: the protocol sets a **base fee** per gas that rises when blocks are more than half full and falls when they are emptier. The base fee is **burned** (destroyed), and the user can add a **priority fee** (a tip) to encourage the block producer to include the transaction sooner."),
        formula("The fee", "fee = gas used × (base fee + priority fee)", "Gas used 65,000, base fee 30 gwei and tip 2 gwei: 65,000 × 32 = 2,080,000 gwei = 0.00208 ETH."),
        explorer({ id: "esc-fee", title: "Fee calculator", intro: "Change gas used, base fee and tip to see the total fee and how much is burned. The ETH price is a teaching figure.", inputs: [{ id: "gas", label: "Gas used", min: 21000, max: 500000, step: 1000, value: 65000 }, { id: "base", label: "Base fee (gwei)", min: 1, max: 200, step: 1, value: 30 }, { id: "tip", label: "Priority fee (gwei)", min: 0, max: 20, step: 0.5, value: 2 }, { id: "eth", label: "Price of 1 ETH (rupees)", min: 50000, max: 500000, step: 10000, value: 250000 }], outputs: [{ label: "Total fee (ETH)", expr: "gas * (base + tip) / 1000000000", unit: "n" }, { label: "Burned (ETH)", expr: "gas * base / 1000000000", unit: "n" }, { label: "Total fee (rupees)", expr: "gas * (base + tip) / 1000000000 * eth", unit: "rs" }] }),
        table("Why it is better", ["Benefit", "How"], [["Predictable fees", "A visible base fee instead of guessing"], ["Less overpaying", "You pay the base fee plus a small tip"], ["Value to all ETH holders", "Burning reduces supply as usage grows"]]),
        miniQuiz("fee-mini", [["What happens to the base fee under EIP-1559?", ["It goes to the block producer", "It is burned", "It is refunded", "It goes to a bank"], 1, "Only the tip goes to the producer."]]),
      ],
      points: ["Fee = gas used × (base fee + tip).", "The base fee is burned; the tip pays the producer."],
      check: [["The priority fee is:", ["Burned", "A tip for the block producer", "A refund", "Paid to a bank"], 1, "It encourages inclusion."]],
    }),
  ],
  terms: [["EVM", "The machine that runs contract bytecode"], ["Bytecode", "Compiled low-level instructions"], ["Opcode", "A single EVM instruction"], ["Gas", "The unit of computation cost"], ["Base fee", "A protocol-set fee per gas that is burned"], ["Priority fee", "A tip to the block producer"]],
  practical: { title: "Practical: read gas on an explorer", intro: "Open any transaction on a block explorer.", steps: ["Find gas used and gas limit.", "Find the base fee and the tip.", "Compute the fee yourself and compare.", "Note how much was burned."] },
  quiz: [
    ["The EVM is:", ["A wallet", "A deterministic machine that runs bytecode", "A coin", "A bank"], 1, "All nodes must agree on results."],
    ["Solidity is compiled to:", ["Bytecode", "Hashes", "Keys", "Blocks"], 0, "The EVM runs it."],
    ["The most expensive operation here is:", ["Reading memory", "Writing new storage", "Adding numbers", "Using calldata"], 1, "About 20,000 gas."],
    ["Gas stops infinite loops because:", ["Each step costs gas and the limit runs out", "Nodes refuse loops", "Blocks are small", "Fees are fixed"], 0, "Metering each step makes loops run out of gas."],
    ["Unused gas is:", ["Lost", "Refunded", "Burned", "Paid to the producer"], 1, "You pay for gas used."],
    ["The base fee is:", ["Burned", "Paid to the sender", "Refunded", "Paid to the validator"], 0, "It is destroyed."],
    ["Fee equals:", ["Gas used × (base + tip)", "Gas limit × tip", "Base + tip", "Gas limit"], 0, "Per unit price times units."],
  ],
});

const M3 = module_({
  slug: "first-smart-contract", title: "Your first smart contract", hours: 2, level: "Core skills",
  summary: "Read and write small Solidity contracts: state, functions, events and the view and pure keywords.",
  outcome: "You can read a small contract, say what every line does and write a simple one in Remix.",
  intro: "Time to read real code. This module walks through two tiny contracts line by line. You can follow along without installing anything by using Remix, a free development environment that runs in your browser at remix.ethereum.org.",
  topics: [
    topic({
      title: "Anatomy of a contract", slug: "anatomy",
      blocks: [
        p("Here is a complete contract. It stores one number, lets anyone change it and lets anyone read it. Read it first, then we will go through it."),
        code("solidity", simpleStorage, "SimpleStorage.sol"),
        table("Line by line", ["Code", "Meaning"], [["// SPDX-License-Identifier: MIT", "A machine-readable licence label, required by the compiler as a warning if missing"], ["pragma solidity ^0.8.20;", "Compile with version 0.8.20 or a later 0.8.x release"], ["contract SimpleStorage { ... }", "Declares a contract, like a class: it has state and functions"], ["uint256 private value;", "A state variable: an unsigned 256-bit integer stored permanently in the contract; private means other contracts cannot read it directly"], ["event ValueChanged(address indexed by, uint256 newValue);", "Declares a log entry that apps can listen to; indexed makes 'by' searchable"], ["function set(uint256 newValue) external", "A function anyone can call from outside; it changes state"], ["emit ValueChanged(msg.sender, newValue);", "Writes the log entry; msg.sender is the account that called"], ["function get() external view returns (uint256)", "A read-only function that returns the stored number"]]),
        miniQuiz("anatomy-mini", [["What does the keyword view promise?", ["The function costs nothing always", "The function does not change state", "The function is private", "The function is payable"], 1, "It may read but not write."]]),
        tip("Open Remix, create a file called SimpleStorage.sol, paste the code and press Compile. A green tick means it compiled."),
      ],
      points: ["A contract has state variables, events and functions.", "view functions read state but do not change it."],
      check: [["msg.sender is:", ["The contract's address", "The account that called the function", "The miner", "The fee"], 1, "The direct caller."]],
    }),
    topic({
      title: "Types, functions and visibility", slug: "types-functions",
      blocks: [
        code("solidity", counter, "Counter.sol"),
        table("Key ideas from Counter", ["Idea", "Example", "Meaning"], [["Public state variable", "uint256 public count;", "The compiler creates a free getter function called count()"], ["State-changing function", "increment()", "Costs gas when called in a transaction"], ["Pure function", "add(a, b)", "Uses only its inputs; can be called for free"], ["Compound assignment", "count += 1", "Same as count = count + 1"]]),
        table("Common types", ["Type", "What it holds"], [["uint256 and other uint sizes", "Non-negative whole numbers"], ["int256", "Whole numbers that can be negative"], ["bool", "true or false"], ["address", "A 20-byte account address"], ["string and bytes", "Text and raw data"], ["mapping(K => V)", "A lookup table, like a dictionary"], ["struct and arrays", "Groups and lists of values"]]),
        table("Function visibility", ["Keyword", "Who can call"], [["external", "Only from outside the contract"], ["public", "From outside and inside"], ["internal", "Only this contract and contracts that inherit from it"], ["private", "Only this contract"]]),
        p("Since Solidity 0.8, arithmetic is checked: if an addition would overflow a uint256, the transaction reverts instead of silently wrapping around. This removed a whole category of older bugs, though you can still opt out with unchecked blocks when you are sure."),
        miniQuiz("types-mini", [["What does uint256 public count; create automatically?", ["A fee", "A getter function named count()", "An event", "A constructor"], 1, "Public state variables get free getters."]]),
      ],
      points: ["Public variables get automatic getters.", "Since 0.8, arithmetic reverts on overflow."],
      check: [["A pure function:", ["Reads state", "Neither reads nor changes state", "Changes state", "Sends ETH"], 1, "It uses only its inputs."]],
    }),
    topic({
      title: "Events and a first run in Remix", slug: "events-remix",
      blocks: [
        p("Events are how contracts talk to the outside world. Storage cannot be watched cheaply, but logs can: an app can subscribe to an event and update its screen whenever one is emitted. They are also cheap compared with storage, so they are used for history that the contract itself does not need to read."),
        flow("A first run in Remix", ["Open remix.ethereum.org", "Create SimpleStorage.sol and paste the code", "Compile with the Solidity compiler tab", "Deploy to the built-in test environment", "Call set(42), then get()", "Open the transaction logs and find ValueChanged"]),
        list("What to look for", ["After set(42), the log shows ValueChanged with your address and 42.", "get() returns 42 and costs nothing because it is a call.", "set shows a gas figure, because it changed storage.", "Change the value twice and notice that the second write is cheaper than the first."], true),
        warn("Remix's built-in environment uses fake accounts and fake ETH. When you connect Remix to a real wallet, double-check the network. Practise on a test network first."),
        miniQuiz("events-mini", [["Why use events rather than storage for history?", ["They are slower", "They are much cheaper and easy for apps to follow", "They are secret", "They are required"], 1, "Logs cost less than storage."]]),
      ],
      points: ["Events are cheap logs that apps can follow.", "Practise in Remix's built-in environment before using a test network."],
      check: [["After calling set(42), where would you see ValueChanged?", ["In the transaction's logs", "In your wallet balance", "In the compiler", "In the gas price"], 0, "Events appear in the receipt's logs."]],
    }),
  ],
  terms: [["Solidity", "The main language for Ethereum contracts"], ["State variable", "A value stored permanently in a contract"], ["Event", "A log entry apps can follow"], ["view", "Reads state but does not change it"], ["pure", "Uses neither state nor chain data"], ["Remix", "A browser-based Solidity IDE"]],
  practical: { title: "Practical: deploy and call", intro: "Use Remix with its built-in test environment.", steps: ["Compile and deploy SimpleStorage.", "Call set with three different numbers.", "Find the events in the logs.", "Compare the gas of the first and second write."] },
  quiz: [
    ["Solidity is:", ["A wallet", "A language for smart contracts", "A coin", "A hash"], 1, "It compiles to EVM bytecode."],
    ["A state variable is stored:", ["Temporarily", "Permanently in the contract", "In a wallet", "In memory only"], 1, "It lives in storage."],
    ["The keyword emit:", ["Sends ETH", "Writes an event log", "Deletes data", "Signs"], 1, "Logs go to the receipt."],
    ["The pragma line sets:", ["The compiler version range", "The fee", "The owner", "The network"], 0, "Compatibility."],
    ["A pure function:", ["Can read storage", "Uses only its inputs", "Changes state", "Is payable"], 1, "No state, no chain data."],
    ["public state variables:", ["Cannot be read", "Get an automatic getter", "Cost no gas to write", "Are secret"], 1, "A convenience."],
    ["Overflow in Solidity 0.8:", ["Wraps silently", "Reverts the transaction", "Is ignored", "Burns gas only"], 1, "Checked arithmetic."],
  ],
});

const M4 = module_({
  slug: "contract-interaction", title: "Interacting with contracts", hours: 1.75, level: "Applied skills",
  summary: "Calls versus transactions, the ABI, payable functions and a first contract that holds money.",
  outcome: "You can tell reads from writes, explain the ABI and msg.value, and read a contract that accepts and pays out ETH.",
  intro: "A contract is useful when other accounts can use it. This module explains how outside accounts and apps talk to contracts, and then walks through a contract that really holds and moves ETH.",
  topics: [
    topic({
      title: "Calls, transactions and the ABI", slug: "calls-abi",
      blocks: [
        table("Two ways of using a function", ["", "Call", "Transaction"], [["Changes state", "No", "Yes"], ["Needs a signature", "No", "Yes"], ["Costs gas to the caller", "No (a node just runs it)", "Yes"], ["Returns a value to you", "Yes, immediately", "No; you get a receipt and can read events"], ["Example", "get() or balanceOf(address)", "set(5), tip(), transfer(...)"]]),
        def("ABI", "The Application Binary Interface: a description of a contract's functions and events (names, input types, output types). Wallets and libraries use it to encode a call into the data field and to decode results and logs."),
        p("A transaction's data field starts with a four-byte **function selector**: the first four bytes of the hash of the function's signature, for example set(uint256). Then come the arguments, encoded in a fixed format. The contract reads the selector to decide which function to run. Without the ABI, the data looks like unreadable hex."),
        hashLab({ id: "esc-selector", title: "A function selector is a hash", intro: "Ethereum uses Keccak-256 for this; the lab uses SHA-256, a different function, so the result will not match a real selector. The idea is the same: a short fingerprint of the function's signature picks the function.", start: "set(uint256)" }),
        miniQuiz("abi-mini", [["What does a wallet need to turn set(42) into the data bytes?", ["A password", "The contract's ABI", "A hash of the user", "A faucet"], 1, "The ABI describes the functions."]]),
      ],
      points: ["Calls read for free; transactions change state and cost gas.", "The ABI describes functions so that calls can be encoded and decoded."],
      check: [["A function selector is:", ["The first four bytes of a hash of the signature", "A password", "A fee", "A token"], 0, "It tells the contract which function to run."]],
    }),
    topic({
      title: "A contract that holds ETH", slug: "tipjar",
      blocks: [
        p("Contracts have balances, just like wallets. A function marked **payable** can receive ETH sent with the call, and inside the function the amount is available as **msg.value**. Here is a small contract that accepts tips and lets its owner withdraw them."),
        code("solidity", tipJar, "TipJar.sol"),
        table("What to notice", ["Feature", "Explanation"], [["address public immutable owner;", "Set once in the constructor and never changed; immutable values are cheaper than storage"], ["mapping(address => uint256) public tipsFrom;", "A table of how much each address tipped; the public keyword creates a getter"], ["function tip() external payable", "payable lets it receive ETH"], ["require(msg.value > 0, \"Send some ETH\");", "Rejects empty tips and reverts with a message"], ["if (msg.sender != owner) revert NotOwner();", "A custom error: cheaper than a text message"], ["(bool ok, ) = owner.call{value: amount}(\"\");", "Sends ETH and returns whether it worked; the result must be checked"], ["emit Tipped / Withdrawn", "Logs for apps to display the history"]]),
        warn("Never send ETH to an address and ignore whether it worked. Always check the success flag, and think about what happens if the recipient is a contract."),
        miniQuiz("tipjar-mini", [["What does the payable keyword allow?", ["The function can receive ETH", "The function is free", "The function is private", "The function returns a value"], 0, "Without it, sending ETH reverts."]]),
      ],
      points: ["payable functions receive ETH; msg.value is the amount.", "Always check the result when sending ETH out."],
      check: [["immutable means:", ["Set once at deployment and cheap to read", "Changing every block", "Stored in memory", "Public"], 0, "Fixed at construction."]],
    }),
    topic({
      title: "Reading a contract on an explorer", slug: "reading-explorer",
      blocks: [
        p("Block explorers show any contract's address, balance, transactions and, if the author has verified it, its source code. Reading real contracts is one of the best ways to learn."),
        table("What to check on a contract page", ["Item", "What it tells you"], [["Verified source code", "Whether you can read what it does; unverified contracts deserve suspicion"], ["Read contract tab", "The free calls you can make, such as owner() and balances"], ["Write contract tab", "The transactions you could send"], ["Transactions and events", "How it is being used"], ["Creator and creation transaction", "Who deployed it and when"], ["Proxy information", "Whether the code can be upgraded"]]),
        list("A safe reading routine", ["Find the owner and see whether they can move funds.", "Look for functions that only the owner can call and ask what they do.", "Check whether it is upgradable and who controls the upgrade.", "Search for audits and read the findings.", "Never interact with a contract you do not understand using your main wallet."], true),
        miniQuiz("explorer-mini", [["Why is verified source code important?", ["It makes the contract faster", "Anyone can read what the contract does", "It changes the owner", "It lowers fees"], 1, "Transparency allows scrutiny."]]),
      ],
      points: ["Explorers show verified code, read and write functions, and events.", "Check ownership, upgradability and audits before interacting."],
      check: [["An unverified contract is:", ["Always safe", "Harder to trust because its code is not published", "Cheaper", "Official"], 1, "You cannot read the source."]],
    }),
  ],
  terms: [["Call", "A free read of contract data"], ["Transaction", "A signed, state-changing action"], ["ABI", "Description of a contract's interface"], ["Function selector", "Four bytes identifying a function"], ["payable", "A function that can receive ETH"], ["msg.value", "The ETH sent with a call"]],
  practical: { title: "Practical: deploy TipJar in Remix", intro: "Use the built-in test environment.", steps: ["Compile and deploy TipJar.", "Send a tip of 1 ETH from account two.", "Try withdraw from account two and note the revert.", "Withdraw from the owner account and see the event."] },
  quiz: [
    ["A call:", ["Changes state", "Reads without a transaction", "Needs gas from the caller", "Needs a signature"], 1, "A node simply runs it."],
    ["The ABI is:", ["A coin", "A description of the contract's interface", "A fee", "A wallet"], 1, "Used to encode and decode."],
    ["msg.value is:", ["The caller", "The ETH sent with the call", "The gas", "The nonce"], 1, "In wei."],
    ["payable allows:", ["Receiving ETH", "Private data", "Faster execution", "Reading only"], 0, "Otherwise it reverts."],
    ["custom errors are:", ["Cheaper than long text messages", "Not allowed", "Only for owners", "Events"], 0, "revert NotOwner();"],
    ["When sending ETH out you must:", ["Ignore the result", "Check that the call succeeded", "Use storage", "Sign twice"], 1, "Failures must be handled."],
    ["Before trusting a contract, check:", ["Its logo", "Verified code, owner powers and audits", "Its colour", "Nothing"], 1, "Read before you use."],
  ],
});

const M5 = module_({
  slug: "patterns-and-limits", title: "Patterns, pitfalls and limits", hours: 2, level: "Applied skills",
  summary: "Access control, input checks, the reentrancy trap and what smart contracts cannot do.",
  outcome: "You can apply access control and validation, recognise and fix a reentrancy bug and explain the main limits of on-chain code.",
  intro: "Smart contracts hold real value and cannot be patched casually, so a few safe habits matter more than clever tricks. This module teaches the habits that prevent most beginner losses.",
  topics: [
    topic({
      title: "Access control and validation", slug: "access-validation",
      blocks: [
        list("The habits", ["Decide who may call each function and write the check explicitly.", "Use msg.sender, never tx.origin, for permission checks.", "Validate inputs at the start with require or custom errors.", "Fail loudly: a revert is better than quietly doing nothing.", "Keep functions small and single-purpose.", "Emit events for every important change."], true),
        table("Revert styles", ["Style", "Example", "Notes"], [["require with message", "require(msg.value > 0, \"Send some ETH\");", "Readable, a little more gas"], ["Custom error", "if (msg.sender != owner) revert NotOwner();", "Cheaper and can carry data"], ["assert", "assert(total >= part);", "For things that should never be false; indicates a bug"]]),
        example("Why tx.origin is wrong", "A contract checks require(tx.origin == owner).", ["The owner is tricked into calling a malicious contract.", "That contract calls the protected contract.", "tx.origin is still the owner, so the check passes.", "msg.sender would have been the malicious contract, and the check would have failed."], "Use msg.sender for authorisation."),
        miniQuiz("access-mini", [["Which should be used to check who is calling a function?", ["tx.origin", "msg.sender", "block.number", "address(this)"], 1, "msg.sender is the direct caller."]]),
      ],
      points: ["Check permissions with msg.sender and validate inputs early.", "tx.origin authorisation can be exploited."],
      check: [["A custom error compared with a require message is:", ["More expensive", "Usually cheaper", "Not allowed", "The same"], 1, "Less data is stored."]],
    }),
    topic({
      title: "The reentrancy trap", slug: "reentrancy",
      blocks: [
        p("**Reentrancy** is the bug behind some of the most famous contract losses. When your contract sends ETH to another contract, that contract's code runs. If it calls back into your contract before you have finished updating your records, it can withdraw again and again. Study this vulnerable example, and then the fix."),
        code("solidity", vulnerable, "VulnerableBank.sol (do not deploy)"),
        p("The problem is the order: the contract sends the money before it sets the balance to zero. A malicious contract receiving the money can call withdraw() again from its receive function, while its balance still reads as non-zero."),
        code("solidity", safe, "SaferBank.sol"),
        flow("Checks, effects, interactions", ["Checks: validate the request", "Effects: update your own state", "Interactions: only then call other accounts"]),
        list("Defences", ["Follow checks-effects-interactions.", "Use a reentrancy guard (a lock) on functions that send value.", "Prefer pulling payments (users withdraw) to pushing them to many addresses.", "Keep external calls to a minimum and treat every external address as untrusted.", "Have the code audited."]),
        miniQuiz("reent-mini", [["What is the key fix for the vulnerable bank?", ["Charge more gas", "Update the balance before sending the ETH", "Remove the owner", "Use tx.origin"], 1, "Effects before interactions."]]),
      ],
      points: ["Reentrancy happens when an external call lets an attacker call back before state is updated.", "Checks, effects, interactions prevents it."],
      check: [["In checks-effects-interactions, external calls come:", ["First", "Last", "Never", "In the middle"], 1, "After state is updated."]],
    }),
    topic({
      title: "What contracts cannot do", slug: "limits",
      blocks: [
        table("Limits to design around", ["Limit", "What it means", "Workaround"], [["No true randomness", "Block data can be influenced by producers", "Use a verifiable randomness service"], ["No outside data", "Contracts cannot make web requests", "Use an oracle"], ["No scheduling", "Contracts cannot wake themselves up", "Use an off-chain keeper or let users trigger actions"], ["Limited storage and gas", "Big loops and big data are too expensive", "Design for small bounded operations; keep big data off-chain"], ["Immutability", "Bugs cannot be patched easily", "Test heavily; consider carefully governed upgrades; include a pause"], ["Public data", "Everything on-chain is visible, including 'private' variables", "Never store secrets in a contract"]]),
        warn("The private keyword only stops other contracts from reading a variable directly. Anyone can read all contract storage from a node. Never put passwords or secrets on-chain."),
        mistakes(["Looping over an array that can grow without limit, so one day the transaction costs more than the block allows.", "Using block.timestamp for fine-grained decisions or randomness.", "Assuming 'private' means secret.", "Skipping tests because the code is 'simple'."]),
        miniQuiz("limits-mini", [["Does the private keyword hide data from everyone?", ["Yes", "No, it only restricts other contracts' direct access", "Only on test networks", "Only for owners"], 1, "All storage is readable."]]),
      ],
      points: ["No randomness, no outside data, no self-scheduling, limited gas and public storage.", "private is not secret."],
      check: [["Smart contracts cannot by themselves:", ["Hold ETH", "Fetch web data", "Emit events", "Store numbers"], 1, "They need an oracle."]],
    }),
  ],
  terms: [["Access control", "Rules about who may call a function"], ["revert", "Undo the transaction with an error"], ["Reentrancy", "Calling back into a contract before it updates its state"], ["Checks-effects-interactions", "A safe ordering of operations"], ["Reentrancy guard", "A lock that blocks nested calls"], ["Oracle", "A source of outside data"]],
  practical: { title: "Practical: read for bugs", intro: "Use the two bank contracts.", steps: ["Explain in words how the attack works.", "List the line that must change.", "Write the order of operations in the safe version.", "Add one more safe habit you would apply."] },
  quiz: [
    ["Authorisation should use:", ["tx.origin", "msg.sender", "block.number", "gasleft()"], 1, "The direct caller."],
    ["Reentrancy is when:", ["A contract is called again before it finishes updating", "Fees double", "A block is repeated", "A key is lost"], 0, "The state is stale during the call."],
    ["Checks-effects-interactions means:", ["Interact first", "Validate, update state, then call out", "Skip checks", "Emit last"], 1, "Order matters."],
    ["A reentrancy guard is:", ["A lock on a function", "A fee", "A wallet", "A hash"], 0, "It blocks nested calls."],
    ["Randomness from block data is:", ["Safe", "Influenceable by block producers", "Free", "Required"], 1, "Do not use it for valuable outcomes."],
    ["Everything stored on-chain is:", ["Secret", "Readable by anyone running a node", "Encrypted", "Deleted"], 1, "Even private variables."],
    ["Unbounded loops are dangerous because:", ["They cost gas that may exceed the block limit", "They are fast", "They are encrypted", "They need a license"], 0, "Transactions can become impossible."],
  ],
});

const M6 = module_({
  slug: "testing-and-deploying", title: "Testing and deploying", hours: 1.5, level: "Applied skills",
  summary: "Test networks, automated tests, verification and a deployment checklist.",
  outcome: "You can run a test, deploy to a test network, verify source code and follow a checklist before going live.",
  intro: "Because a deployed contract is hard to change, professional teams spend more time testing than coding. This last module introduces automated tests, test networks and the discipline of a deployment checklist.",
  topics: [
    topic({
      title: "Automated tests", slug: "tests",
      blocks: [
        p("Instead of clicking through Remix every time, developers write tests: small programs that deploy the contract to a local blockchain, call it, and check the results. Popular tools include Hardhat and Foundry. The following example uses Hardhat with JavaScript to test the TipJar contract. You can run it on your own computer after installing Node.js and Hardhat; the course platform itself does not run code."),
        code("javascript", hhTest, "test/TipJar.js"),
        table("What the test shows", ["Line", "Meaning"], [["ethers.getSigners()", "Gets test accounts with fake ETH"], ["ethers.deployContract(\"TipJar\")", "Deploys a fresh contract for the test"], ["jar.connect(fan).tip({ value: ... })", "Calls tip() as the fan, sending 0.1 ETH"], ["expect(...).to.equal(...)", "Asserts an exact result"], ["revertedWithCustomError(jar, \"NotOwner\")", "Asserts that a non-owner is rejected with the expected error"], ["to.emit(jar, \"Withdrawn\")", "Asserts that the event was logged"]]),
        list("What to test", ["The happy path for every function.", "Every revert and every access-control rule.", "Edge cases: zero amounts, maximum values, repeated calls.", "Events: that they are emitted with the right data.", "Sequences: tip, tip, withdraw, tip again."]),
        miniQuiz("tests-mini", [["Why test the failing paths as well?", ["To make tests longer", "Because attackers will try them", "They are free", "Because law requires it"], 1, "Security lives in the rejected cases."]]),
      ],
      points: ["Automated tests deploy and call contracts on a local chain.", "Test reverts and access control, not just the happy path."],
      check: [["A good test suite checks:", ["Only successes", "Successes and failures", "Only events", "Nothing"], 1, "Failures matter most."]],
    }),
    topic({
      title: "Test networks and verification", slug: "testnets",
      blocks: [
        flow("From laptop to public network", ["Local tests", "A test network with faucet ETH", "Verify the source on the explorer", "A small amount on the real network", "Monitor and document"]),
        table("Why each step", ["Step", "Purpose"], [["Local tests", "Fast feedback and no cost"], ["Test network", "Realistic environment: real tools, real timing, fake money"], ["Source verification", "Lets users and auditors read exactly what runs"], ["Small first deployment", "Limits the harm of a surprise"], ["Monitoring", "Alerts you to unusual activity"]]),
        def("Verification", "Publishing a contract's source code and compiler settings to a block explorer, which recompiles it and confirms that the result matches the deployed bytecode. Verified contracts can be read and checked by anyone."),
        tip("Keep the deployment addresses, the constructor arguments and the compiler version in a file in your project. You will need them again."),
        miniQuiz("testnet-mini", [["Why deploy to a test network before the main network?", ["It is required by law", "To find problems with fake money", "It is faster", "It lowers gas on mainnet"], 1, "Mistakes are free there."]]),
      ],
      points: ["Test, then testnet, then verify, then small, then monitor.", "Verification lets anyone read the deployed code."],
      check: [["Verifying a contract means:", ["Making it faster", "Publishing source that matches the deployed bytecode", "Hiding the code", "Changing the owner"], 1, "Transparency."]],
    }),
    topic({
      title: "A pre-launch checklist", slug: "checklist",
      blocks: [
        list("Before going live", ["All tests pass, including failure cases.", "The code has been read by a second person.", "For anything holding real money, an independent audit is complete and findings are fixed.", "Owner keys are held in a hardware wallet or a multi-signature wallet.", "There is an emergency plan: who can pause, and how will you tell users?", "The source is verified and the addresses are documented.", "Start with limits on how much value the contract can hold."], true),
        table("Common launch mistakes", ["Mistake", "Better"], [["Deploying with a hot wallet that also does daily work", "A dedicated deployer key, then transfer ownership to a safer wallet"], ["No pause or limits", "Add a pause and deposit caps for the first weeks"], ["Skipping an audit to save money", "Budget for review; losses are larger than audit fees"], ["No monitoring", "Alerts on large transfers and owner actions"], ["Silence during an incident", "A status page and clear updates"]]),
        warn("This course teaches concepts and good habits, not a guarantee that code is secure. For any contract that will hold real value, hire experienced auditors and follow current security guidance."),
        miniQuiz("check-mini", [["Why add deposit limits in the first weeks?", ["To make it look busy", "To limit the harm if a bug is found", "To save gas", "To avoid events"], 1, "A cap limits the blast radius."]]),
      ],
      points: ["Test, review, audit, secure keys, plan for incidents and limit exposure.", "Audits and professional help are needed for real value."],
      check: [["The first deployment to a real network should hold:", ["As much as possible", "A small, capped amount", "Nothing ever", "Borrowed funds"], 1, "Start small."]],
    }),
  ],
  terms: [["Hardhat", "A development environment for Ethereum"], ["Foundry", "Another toolkit written for speed"], ["Unit test", "A small automated check of one behaviour"], ["Testnet", "A network with worthless coins for practice"], ["Verification", "Publishing source that matches the bytecode"], ["Audit", "An independent security review"]],
  practical: { title: "Practical: write your plan", intro: "Use the checklist lab.", steps: ["List what you will test.", "List what the testnet will tell you.", "Write your key management rule.", "Write what you will do if something goes wrong."] },
  quiz: [
    ["A unit test:", ["Checks one behaviour automatically", "Replaces audits", "Is a token", "Is a wallet"], 0, "Fast feedback."],
    ["Test networks use:", ["Real money", "Worthless test ETH", "No blocks", "Only Bitcoin"], 1, "Practice safely."],
    ["Verifying source code:", ["Hides it", "Lets anyone check it matches the bytecode", "Makes it immutable", "Pays fees"], 1, "Transparency."],
    ["For high-value contracts you need:", ["No review", "An independent audit", "Only a friend's glance", "Luck"], 1, "Professional review."],
    ["Owner keys should be:", ["On a shared laptop", "In a hardware wallet or multi-signature wallet", "In an email", "Written in code"], 1, "Protect admin power."],
    ["A pause function helps:", ["Stop activity during an incident", "Speed up blocks", "Reduce fees", "Hide code"], 0, "Emergency control."],
    ["The first live deployment should:", ["Hold a lot", "Be small and capped", "Be secret", "Skip tests"], 1, "Limit harm."],
  ],
});

export default course({
  slug: "ethereum-smart-contracts", title: "Ethereum & Smart Contracts", tagline: "Understand the world computer, read real Solidity, deploy to a test network and think like an auditor", level: "Intermediate", hours: 11,
  summary: "From accounts and gas to your first Solidity contract: the Ethereum model, the EVM and the fee market, reading and writing small contracts, calls versus transactions, patterns and the reentrancy trap, and testing and deploying safely. Code examples were compiled and checked; you run them yourself in the free Remix editor.",
  modules: [M1, M2, M3, M4, M5, M6],
  capstone: capstone({
    title: "Final project: a specification and test plan for TipJar", summary: "Specify an improved contract and plan its tests, then pass the final assessment.",
    intro: "You can now read a contract, explain gas, tell calls from transactions, spot a reentrancy bug and plan a deployment. In this final step you write a professional specification and test plan for an improved TipJar. Then take the final assessment covering the whole course.",
    steps: ["Work through the **Final project: a specification and test plan for TipJar** lab.", "Optionally implement it in Remix and run your tests on a test network.", "Take the final assessment below."], projectTitle: "A TipJar specification and test plan",
    quiz: [
      ["Which accounts can start a transaction?", ["EOAs only", "Contracts only", "Both", "Neither"], 0, "Contracts react."],
      ["1 gwei equals:", ["10^9 wei", "10^18 wei", "10^3 wei", "1 wei"], 0, "A billion wei."],
      ["Writing to storage is:", ["Cheap", "The most expensive common operation", "Free", "Impossible"], 1, "It changes the chain's state."],
      ["Under EIP-1559 the base fee is:", ["Burned", "Paid to the producer", "Refunded", "Paid to the sender"], 0, "Only the tip is paid."],
      ["A view function:", ["May change state", "Reads but does not change state", "Is payable", "Is private"], 1, "A read-only promise."],
      ["A call differs from a transaction because it:", ["Needs gas from the caller", "Needs no signature and changes no state", "Changes balances", "Is slower"], 1, "A node just runs it."],
      ["msg.value is:", ["The ETH sent with the call", "The gas limit", "The sender", "The nonce"], 0, "In wei."],
      ["Authorisation checks should use:", ["msg.sender", "tx.origin", "block.timestamp", "address(0)"], 0, "tx.origin can be abused."],
      ["Reentrancy is prevented by:", ["Checks-effects-interactions", "Raising fees", "Using more storage", "Removing events"], 0, "Update state before external calls."],
      ["The private keyword means:", ["Nobody can read the data", "Other contracts cannot read it directly, but nodes can", "It is encrypted", "It costs nothing"], 1, "All storage is readable."],
      ["Before a real deployment you should:", ["Test, review and use a test network", "Skip tests", "Deploy first", "Hide the code"], 0, "Practise where mistakes are free."],
      ["Verifying a contract means:", ["Publishing source that matches the bytecode", "Hiding its code", "Changing owners", "Paying fees"], 0, "Anyone can read it."],
    ],
  }),
  labs,
  skills: [{ id: SK, label: "Ethereum and smart contracts" }],
  badges: [
    { id: "account-aware", title: "Account aware", description: "Told EOAs from contract accounts.", when: { all: ["e1-accounts"] } },
    { id: "fee-calculator", title: "Fee calculator", description: "Worked out an EIP-1559 fee.", when: { all: ["e3-fee-market"] } },
    { id: "bug-spotter", title: "Bug spotter", description: "Recognised safe patterns and bugs.", when: { all: ["e9-spot-bug"] } },
    { id: "contract-specifier", title: "Contract specifier", description: "Wrote a TipJar specification and test plan.", when: { all: ["cap-tipjar"] } },
  ],
  landing: {
    hero: { eyebrow: "Ethereum · Real Solidity, compiled and checked", title: "Ethereum & Smart Contracts: read it, reason about it, then build", subtitle: "Learn the account model and gas, read real Solidity line by line, tell reads from writes, spot the reentrancy trap and write a specification and test plan. Code examples were compiled and checked; you try them in the free Remix editor.", level: "Intermediate", outcomeLine: "After this course you can read small smart contracts, explain what they cost and what can go wrong, and plan a safe deployment." },
    outcomes: [
      { icon: "web", title: "Understand the world computer", text: "Accounts, transactions, blocks and units." },
      { icon: "sheet", title: "Price computation", text: "Gas, the EVM and EIP-1559 fees." },
      { icon: "docs", title: "Read Solidity", text: "State, functions, events, view and pure." },
      { icon: "safety", title: "Handle ETH safely", text: "payable, access control and reentrancy." },
      { icon: "sort", title: "Know the limits", text: "No randomness, no outside data, public storage." },
      { icon: "word", title: "Plan and deploy", text: "Specs, tests, test networks and verification." },
    ],
    projects: [
      { title: "A fee calculation", text: "Base fee, tip and the burned part.", module: "evm-and-gas" },
      { title: "A contract explained in words", text: "SimpleStorage for a classmate.", module: "first-smart-contract" },
      { title: "A deployment checklist", text: "Before, during and after launch.", module: "testing-and-deploying" },
      { title: "A TipJar spec and test plan", text: "Functions, access control, events, tests and risks.", module: "capstone" },
    ],
    tools: [{ icon: "docs", title: "Code listings", text: "Compiled Solidity you can paste into Remix." }, { icon: "sheet", title: "Spreadsheet lab", text: "Units, fees and gas budgets." }, { icon: "word", title: "Document editor", text: "Specs, checklists and test plans." }],
    assessment: ["Finish the required labs in each module: they are checked automatically and explained when something is missing.", "Pass each module quiz (70% or more). Short tests inside the lessons give instant feedback.", "Complete the specification and the final assessment."],
    faq: [
      { q: "Does the course run my code?", a: "No. Labs check your analysis and writing. You run the Solidity examples yourself in Remix, a free tool that works in your browser." },
      { q: "Do I need ETH?", a: "No. Remix has a built-in test environment, and test networks give free worthless ETH from faucets." },
      { q: "Will this make me an auditor?", a: "No. It gives the foundation. The security and advanced Solidity courses in the series go further, and real audits need experienced professionals." },
    ],
  },
  catalogue: {
    hours: "~11 hrs", weeks: "~4 weeks", pace: "3 hrs/wk", badge: "Ethereum Practitioner",
    brief: "The Ethereum account model, the EVM and gas, reading and writing small Solidity contracts, calls and transactions, patterns and pitfalls, testing and deployment.",
    learn: ["Accounts, transactions, blocks and units", "The EVM, gas and the EIP-1559 fee market", "Reading and writing small Solidity contracts", "Calls, transactions, the ABI and payable functions", "Access control, reentrancy and the limits of contracts", "Testing, test networks, verification and a launch checklist"],
    handsOn: "Write a specification and test plan for an improved TipJar contract, including access control, events, tests and risks.",
    outcome: "Read small smart contracts, explain what they cost and what can go wrong, and plan a safe deployment.",
  },
});
