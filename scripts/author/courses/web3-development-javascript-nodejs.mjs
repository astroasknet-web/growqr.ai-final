import { capstone, ck, classifyLab, code, course, def, explorer, flow, list, miniQuiz, mistakes, module_, p, S, sheetLab, table, tip, topic, W, warn, wordLab } from "../kit.mjs";

const SK = "web3-js";

const greeter = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// The small contract that the JavaScript examples in this course talk to.
contract Notebook {
    struct Note {
        address author;
        string text;
        uint256 timestamp;
    }

    Note[] private _notes;

    event NoteAdded(uint256 indexed id, address indexed author, string text);

    function addNote(string calldata text) external returns (uint256 id) {
        require(bytes(text).length > 0 && bytes(text).length <= 280, "Text must be 1-280 bytes");
        id = _notes.length;
        _notes.push(Note(msg.sender, text, block.timestamp));
        emit NoteAdded(id, msg.sender, text);
    }

    function noteCount() external view returns (uint256) {
        return _notes.length;
    }

    function getNote(uint256 id) external view returns (address author, string memory text, uint256 timestamp) {
        Note storage n = _notes[id];
        return (n.author, n.text, n.timestamp);
    }
}`;

const units = `// Runs in plain Node.js after: npm install ethers
const { parseEther, formatEther, parseUnits, formatUnits } = require("ethers");

// Amounts on the chain are BigInt values in the smallest unit (wei for ETH).
const etherOne = parseEther("1.0");           // 1000000000000000000n
const half = etherOne / 2n;                    // BigInt division drops the remainder
console.log(formatEther(half));                // "0.5"

// A token with 6 decimals stores 2500.5 tokens as 2500500000n
const tokens = parseUnits("2500.5", 6);
console.log(tokens, formatUnits(tokens, 6));   // 2500500000n "2500.5"

// BigInt and Number do not mix: this line would throw a TypeError.
// const wrong = etherOne + 1;
const right = etherOne + 1n;                   // add a BigInt to a BigInt

// Never use floating point for money: 0.1 + 0.2 is 0.30000000000000004
console.log(0.1 + 0.2);
console.log(formatEther(parseEther("0.1") + parseEther("0.2"))); // "0.3"`;

const readScript = `// read.js — read-only access: no keys, no cost.
const { JsonRpcProvider, Contract, formatEther } = require("ethers");

const NOTEBOOK_ABI = [
  "function noteCount() view returns (uint256)",
  "function getNote(uint256 id) view returns (address author, string text, uint256 timestamp)",
  "event NoteAdded(uint256 indexed id, address indexed author, string text)"
];

async function main() {
  const provider = new JsonRpcProvider(process.env.RPC_URL);       // a node or a hosted RPC address
  const network = await provider.getNetwork();
  console.log("Connected to chain", network.chainId.toString());

  const balance = await provider.getBalance(process.env.ADDRESS);
  console.log("Balance:", formatEther(balance), "ETH");

  const notebook = new Contract(process.env.NOTEBOOK, NOTEBOOK_ABI, provider);
  const count = await notebook.noteCount();
  for (let i = 0n; i < count; i++) {
    const [author, text, timestamp] = await notebook.getNote(i);
    console.log(i.toString(), author, text, new Date(Number(timestamp) * 1000).toISOString());
  }

  // Past events for a range of blocks
  const latest = await provider.getBlockNumber();
  const events = await notebook.queryFilter(notebook.filters.NoteAdded(), latest - 1000, latest);
  console.log("Events in the last 1000 blocks:", events.length);
}

main().catch((err) => {
  console.error("Failed:", err.shortMessage || err.message);
  process.exit(1);
});`;

const sendScript = `// send.js — writes to the chain. Use a TEST account on a TEST network only.
const { JsonRpcProvider, Wallet, Contract } = require("ethers");

const NOTEBOOK_ABI = ["function addNote(string text) returns (uint256)"];

async function main() {
  const provider = new JsonRpcProvider(process.env.RPC_URL);
  const wallet = new Wallet(process.env.TEST_PRIVATE_KEY, provider);  // key from the environment, never in code
  const notebook = new Contract(process.env.NOTEBOOK, NOTEBOOK_ABI, wallet);

  // 1. Simulate first: if it would revert, find out before paying
  await notebook.addNote.staticCall("Hello from Node");

  // 2. Estimate gas and leave a margin
  const gas = await notebook.addNote.estimateGas("Hello from Node");

  // 3. Send
  const tx = await notebook.addNote("Hello from Node", { gasLimit: (gas * 120n) / 100n });
  console.log("Submitted:", tx.hash);

  // 4. Wait for it to be mined and for one more block on top
  const receipt = await tx.wait(2);
  console.log("Mined in block", receipt.blockNumber, "status", receipt.status, "gas used", receipt.gasUsed.toString());
}

main().catch((err) => {
  switch (err.code) {
    case "INSUFFICIENT_FUNDS":
      console.error("Not enough funds to pay for gas.");
      break;
    case "CALL_EXCEPTION":
      console.error("The contract rejected the call:", err.reason || err.shortMessage);
      break;
    case "NONCE_EXPIRED":
    case "REPLACEMENT_UNDERPRICED":
      console.error("A transaction with this nonce already exists; wait or raise the fee.");
      break;
    default:
      console.error("Unexpected error:", err.shortMessage || err.message);
  }
  process.exit(1);
});`;

const walletScript = `// wallet.js — browser code that connects to the user's wallet (EIP-1193).
const { BrowserProvider } = require("ethers");

let provider;
let signer;

async function connect() {
  if (!window.ethereum) {
    throw new Error("No wallet found. Please install one.");
  }
  provider = new BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []); // the user must approve
  signer = await provider.getSigner();
  return accounts[0];
}

async function ensureChain(expectedChainId) {
  const network = await provider.getNetwork();
  if (network.chainId !== BigInt(expectedChainId)) {
    // Ask the wallet to switch; the user can refuse.
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x" + Number(expectedChainId).toString(16) }]
    });
  }
}

// The wallet tells the page when the user changes something. Always listen.
function watchWallet(onChange) {
  window.ethereum.on("accountsChanged", (accounts) => onChange({ accounts }));
  window.ethereum.on("chainChanged", () => window.location.reload());
}`;

const serverLogin = `// server.js — passwordless login with a signed message (the idea behind Sign-In with Ethereum, EIP-4361).
const express = require("express");
const crypto = require("crypto");
const { verifyMessage, getAddress } = require("ethers");

const app = express();
app.use(express.json());

const pending = new Map();  // nonce -> { createdAt }. Use a database or cache with expiry in production.

app.get("/auth/nonce", (req, res) => {
  const nonce = crypto.randomBytes(16).toString("hex");
  pending.set(nonce, { createdAt: Date.now() });
  res.json({ nonce });
});

app.post("/auth/verify", (req, res) => {
  const { message, signature } = req.body;
  const match = /Nonce: ([a-f0-9]{32})/.exec(message || "");
  if (!match || !pending.has(match[1])) return res.status(400).json({ error: "Unknown or reused nonce" });

  const { createdAt } = pending.get(match[1]);
  pending.delete(match[1]);                                   // single use
  if (Date.now() - createdAt > 5 * 60 * 1000) return res.status(400).json({ error: "Nonce expired" });

  const domainOk = (message || "").includes("Domain: example.com");
  if (!domainOk) return res.status(400).json({ error: "Wrong domain" });

  const signer = getAddress(verifyMessage(message, signature)); // recovers the address that signed
  // Create a session for 'signer'. The server now knows this browser controls that address.
  res.json({ ok: true, address: signer });
});

app.listen(3000);`;

const clientLogin = `// login.js — the browser side of the signed-message login.
async function signIn(signer) {
  const { nonce } = await (await fetch("/auth/nonce")).json();
  const address = await signer.getAddress();

  // The message is plain text the user can read in the wallet. Never ask them to sign opaque hex.
  const message = [
    "Domain: example.com",
    "Purpose: Sign in to Example. This does not cost gas or move funds.",
    "Address: " + address,
    "Nonce: " + nonce,
    "Issued at: " + new Date().toISOString()
  ].join("\\n");

  const signature = await signer.signMessage(message);
  const response = await fetch("/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, signature })
  });
  return response.json();
}`;

const indexer = `// indexer.js — a small service that copies contract events into a database, safely.
const { JsonRpcProvider, Contract } = require("ethers");

const ABI = ["event NoteAdded(uint256 indexed id, address indexed author, string text)"];
const CONFIRMATIONS = 12;       // wait this many blocks to avoid recent reorganisations
const BATCH = 500;              // blocks per query, to stay inside RPC limits

async function run(db) {
  const provider = new JsonRpcProvider(process.env.RPC_URL);
  const notebook = new Contract(process.env.NOTEBOOK, ABI, provider);

  const state = await db.getOne("SELECT last_block FROM indexer_state WHERE id = 1");
  let from = Number(state.last_block) + 1;

  for (;;) {
    const head = (await provider.getBlockNumber()) - CONFIRMATIONS;
    while (from <= head) {
      const to = Math.min(from + BATCH - 1, head);
      const events = await notebook.queryFilter(notebook.filters.NoteAdded(), from, to);

      await db.transaction(async (tx) => {
        for (const e of events) {
          // INSERT IGNORE with a unique key (tx hash + log index) makes the job safe to repeat
          await tx.query(
            "INSERT IGNORE INTO notes (tx_hash, log_index, note_id, author, text) VALUES (?, ?, ?, ?, ?)",
            [e.transactionHash, e.index, e.args.id.toString(), e.args.author, e.args.text]
          );
        }
        await tx.query("UPDATE indexer_state SET last_block = ? WHERE id = 1", [to]);
      });
      from = to + 1;
    }
    await new Promise((resolve) => setTimeout(resolve, 12000)); // about one block
  }
}

module.exports = { run };`;

const hardhatTest = `// test/notebook.test.js — run with: npx hardhat test
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Notebook", function () {
  let notebook;
  let alice;
  let bob;

  beforeEach(async function () {
    [alice, bob] = await ethers.getSigners();
    const Notebook = await ethers.getContractFactory("Notebook");
    notebook = await Notebook.deploy();
    await notebook.waitForDeployment();
  });

  it("stores a note and emits an event", async function () {
    await expect(notebook.connect(alice).addNote("hello"))
      .to.emit(notebook, "NoteAdded")
      .withArgs(0n, alice.address, "hello");
    expect(await notebook.noteCount()).to.equal(1n);
    const [author, text] = await notebook.getNote(0);
    expect(author).to.equal(alice.address);
    expect(text).to.equal("hello");
  });

  it("rejects empty and over-long text", async function () {
    await expect(notebook.addNote("")).to.be.revertedWith("Text must be 1-280 bytes");
    await expect(notebook.addNote("x".repeat(281))).to.be.revertedWith("Text must be 1-280 bytes");
  });

  it("records different authors", async function () {
    await notebook.connect(alice).addNote("from alice");
    await notebook.connect(bob).addNote("from bob");
    const [author] = await notebook.getNote(1);
    expect(author).to.equal(bob.address);
  });
});`;

const configEnv = `// hardhat.config.js — keep secrets in environment variables, never in this file.
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.26",
  networks: {
    // A public test network. The key must belong to a throw-away test account.
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.TEST_PRIVATE_KEY ? [process.env.TEST_PRIVATE_KEY] : []
    }
  }
};`;

const labs = [
  classifyLab({
    id: "w1-bigint-units", module: "javascript-for-web3", title: "BigInt, units or float?", level: "intermediate", minutes: 10, xp: 40, skills: [SK], required: true,
    objective: "Decide the right way to represent and handle amounts in JavaScript.", scenario: "Money bugs often come from using the wrong number type. Judge each approach.",
    steps: ["Read each approach.", "Choose the verdict.", "Press Check my work."],
    categories: [["correct", "Correct"], ["wrong", "Wrong"], ["care", "Needs care"]],
    items: [["Store token amounts as BigInt in the smallest unit", "correct", "No rounding errors."], ["Add 1 to a BigInt using plain 1", "wrong", "BigInt and Number do not mix."], ["Convert a user's typed '2500.5' with parseUnits(value, decimals)", "correct", "The library handles decimals safely."], ["Calculate a balance with 0.1 + 0.2 in floating point", "wrong", "Floating point is not exact."], ["Convert a BigInt to Number to show a small count", "care", "Safe only if the value is small enough."], ["Format a BigInt for display with formatUnits", "correct", "Display only; keep BigInt for maths."], ["Compare two BigInt balances with <", "correct", "Comparison works for BigInt."], ["Use Number for a wei amount above 2^53", "wrong", "Precision is lost."]],
  }),
  sheetLab({
    id: "w2-fee", module: "javascript-for-web3", title: "What does a transaction really cost?", level: "intermediate", minutes: 12, xp: 45, skills: [SK], required: false,
    objective: "Turn gas used and gas price into ETH and rupees, and judge whether a feature is affordable.",
    scenario: "Your app sends a transaction that uses 52,000 gas when the gas price is 25 gwei and ETH is 250,000 rupees. (Teaching figures.)",
    steps: ["In B7 work out the fee in ETH: gas used times gwei divided by 1,000,000,000.", "In B8 convert it to rupees.", "In B9 work out the monthly cost for the number of transactions in B5.", "In B10 work out the fee if the gas price doubles.", "In B11 show Too expensive for a free action if B8 is above the limit in B6, otherwise Acceptable."],
    cells: { A1: "Input", B1: "Value", A2: "Gas used", B2: "52000", A3: "Gas price (gwei)", B3: "25", A4: "ETH price (rupees)", B4: "250000", A5: "Transactions per month", B5: "3000", A6: "Most you would pay for a free action (rupees)", B6: "100", A7: "Fee (ETH)", A8: "Fee (rupees)", A9: "Monthly cost (rupees)", A10: "Fee at double gas price (rupees)", A11: "Verdict" }, view: { cols: 2, rows: 13 },
    checks: [
      ck("b7", "B7 is the fee in ETH", "=B2*B3/1000000000", "Gas times gwei over a billion.", S.formula("B7", { equals: 52000 * 25 / 1e9 })),
      ck("b8", "B8 is the fee in rupees", "=B7*B4", "ETH times the ETH price.", S.formula("B8", { equals: (52000 * 25 / 1e9) * 250000 })),
      ck("b9", "B9 is the monthly cost", "=B8*B5", "Fee times transactions.", S.formula("B9", { equals: ((52000 * 25 / 1e9) * 250000) * 3000 })),
      ck("b10", "B10 is the doubled fee", "=B8*2", "Double the price, double the fee.", S.formula("B10", { equals: ((52000 * 25 / 1e9) * 250000) * 2 })),
      ck("b11", "B11 is the verdict", "=IF(B8>B6,\"Too expensive for a free action\",\"Acceptable\")", "Compare with the limit.", S.formula("B11", { fns: ["IF"], equals: "Too expensive for a free action" })),
    ],
    solution: { cells: { B7: "=B2*B3/1000000000", B8: "=B7*B4", B9: "=B8*B5", B10: "=B8*2", B11: "=IF(B8>B6,\"Too expensive for a free action\",\"Acceptable\")" } },
  }),
  classifyLab({
    id: "w3-ethers-objects", module: "reading-the-chain", title: "Provider, signer or contract?", level: "intermediate", minutes: 10, xp: 40, skills: [SK], required: true,
    objective: "Know which ethers object does which job.", scenario: "ethers separates reading, signing and contract calls. Match each job to the right object.",
    steps: ["Read each job.", "Choose the object.", "Press Check my work."],
    categories: [["provider", "Provider"], ["signer", "Signer (wallet)"], ["contract", "Contract"]],
    items: [["Read an account's ETH balance", "provider", "A connection for reading."], ["Sign a message with a private key", "signer", "Only a signer can sign."], ["Call a view function such as noteCount()", "contract", "A typed interface to the contract."], ["Get the latest block number", "provider", "Chain data."], ["Pay the gas for a transaction", "signer", "The signer authorises it."], ["Filter past events with queryFilter", "contract", "Knows the event definitions."], ["Look up the connected chain id", "provider", "Network information."], ["Send a state-changing call such as addNote()", "contract", "A contract connected to a signer."]],
  }),
  wordLab({
    id: "w4-errors", module: "reading-the-chain", title: "Plan how your app handles failure", level: "advanced", minutes: 16, xp: 55, skills: [SK], required: false,
    objective: "Write an error-handling plan that gives users clear next steps.",
    scenario: "Your dApp reads from the chain and sends transactions. Plan how it should react when things go wrong.",
    steps: ["Add Heading 2 sections: Reading failures, Sending failures, User messages, Logging.", "Under Sending failures write a bulleted list of at least four failures (for example rejected by user, insufficient funds, reverted, wrong network).", "Under User messages give one friendly message example.", "Mention timeouts or retries.", "Keep it between 120 and 260 words."],
    checks: [
      ck("heads", "Four sections", "Use Heading 2.", "A clear plan.", W.heading(4, 2)),
      ck("order", "In order", "Reading failures, Sending failures, User messages, Logging.", "From read to log.", W.order(["Reading failures", "Sending failures", "User messages", "Logging"])),
      ck("fails", "Four sending failures", "Use the bullet button.", "List them.", W.list(4, "ul")),
      ck("funds", "Mentions insufficient funds", "Mention insufficient funds or not enough.", "A common error.", W.pattern("insufficient|not enough", "insufficient funds")),
      ck("retry", "Mentions retries or timeouts", "Mention retry, retries or timeout.", "Networks are flaky.", W.pattern("retry|retries|timeout|back-?off", "retries or timeouts")),
      ck("len", "Between 120 and 260 words", "Concise.", "One page.", W.words(120, 260)),
    ],
    solution: "<h2>Reading failures</h2><p>If the RPC server does not answer, the app retries up to three times with a short delay between attempts and a timeout of ten seconds. If it still fails, the page shows the last known data with a notice that it may be out of date, instead of an empty screen.</p><h2>Sending failures</h2><ul><li>The user rejects the request in the wallet: we show a calm message and let them try again.</li><li>Insufficient funds for gas: we tell them how much more they need and where to get test currency.</li><li>The contract reverts: we show the contract's reason in plain words, for example that the text is too long.</li><li>The wallet is on the wrong network: we offer a button that asks the wallet to switch.</li><li>A transaction is stuck: we show its status and a link to the block explorer.</li></ul><h2>User messages</h2><p>We write what happened and what to do next, for example: Your wallet does not have enough currency to pay the network fee. Add a little more and try again.</p><h2>Logging</h2><p>We log error codes and transaction hashes, never private keys or full wallet data, so that support can help without exposing secrets.</p>",
  }),
  classifyLab({
    id: "w5-tx-lifecycle", module: "sending-transactions", title: "Where is the transaction in its life?", level: "advanced", minutes: 10, xp: 40, skills: [SK], required: true,
    objective: "Place each event in the lifecycle of a transaction.", scenario: "A transaction goes through stages from creation to final. Put each event in the correct stage.",
    steps: ["Read each event.", "Choose the stage.", "Press Check my work."],
    categories: [["prepare", "Prepare"], ["submit", "Submit"], ["pending", "Pending"], ["mined", "Mined and confirmed"]],
    items: [["Simulating the call with staticCall to see whether it would revert", "prepare", "Before paying anything."], ["Estimating gas and adding a margin", "prepare", "Part of preparation."], ["The wallet shows the details and the user signs", "submit", "Authorisation."], ["The node returns a transaction hash", "submit", "The network accepted it."], ["The transaction waits in the mempool for a block", "pending", "Not yet included."], ["tx.wait(1) resolves with a receipt", "mined", "Included in a block."], ["Waiting for extra blocks on top to reduce reorganisation risk", "mined", "More confirmations."], ["Another transaction with the same nonce replaces it with a higher fee", "pending", "Speeding up or cancelling."]],
  }),
  sheetLab({
    id: "w6-backoff", module: "sending-transactions", title: "Plan retries with backoff", level: "advanced", minutes: 12, xp: 50, skills: [SK], required: false,
    objective: "Calculate how long a retry plan waits and whether it fits what the user will tolerate.",
    scenario: "When an RPC call fails, your app waits 1 second, then 2, then 4 and so on, doubling each time, for up to 6 attempts. (A teaching model.)",
    steps: ["In B7 work out the delay before the last wait: the start delay times 2 to the power of attempts minus 2.", "In B8 work out the total waiting time between the 6 attempts: start delay times (2 to the power of attempts minus 1, minus 1).", "In B9 show Within limit if B8 is not above the limit in B5, otherwise Give up earlier.", "In B10 work out the average wait per attempt.", "In B11 work out the delay for attempt 7 if the delays double with no cap."],
    cells: { A1: "Input", B1: "Value", A2: "Start delay (seconds)", B2: "1", A3: "Number of attempts", B3: "6", A4: "Doubling factor", B4: "2", A5: "Longest the user will wait (seconds)", B5: "60", A7: "Last wait", A8: "Total waiting time", A9: "Verdict", A10: "Average wait per attempt", A11: "Wait after the 7th failure" }, view: { cols: 2, rows: 13 },
    checks: [
      ck("b7", "B7 is the last wait", "=B2*POWER(B4,B3-2)", "The waits are 1, 2, 4, 8, 16.", S.formula("B7", { fns: ["POWER"], equals: 16 })),
      ck("b8", "B8 is the total wait", "=B2*(POWER(B4,B3-1)-1)", "A doubling series adds up to the next power minus one.", S.formula("B8", { fns: ["POWER"], equals: 31 })),
      ck("b9", "B9 is the verdict", "=IF(B8>B5,\"Give up earlier\",\"Within limit\")", "Compare with what the user tolerates.", S.formula("B9", { fns: ["IF"], equals: "Within limit" })),
      ck("b10", "B10 is the average wait", "=B8/B3", "Total over attempts.", S.formula("B10", { equals: 31 / 6 })),
      ck("b11", "B11 is the next delay", "=B2*POWER(B4,B3)", "The delay keeps doubling.", S.formula("B11", { fns: ["POWER"], equals: 64 })),
    ],
    solution: { cells: { B7: "=B2*POWER(B4,B3-2)", B8: "=B2*(POWER(B4,B3-1)-1)", B9: "=IF(B8>B5,\"Give up earlier\",\"Within limit\")", B10: "=B8/B3", B11: "=B2*POWER(B4,B3)" } },
  }),
  classifyLab({
    id: "w7-wallet-auth", module: "wallets-and-signing", title: "Secure or insecure sign-in?", level: "advanced", minutes: 12, xp: 45, skills: [SK], required: true,
    objective: "Judge the design of a wallet-based login.", scenario: "Signing a message proves control of an address, but only if the design is careful. Judge each choice.",
    steps: ["Read each design choice.", "Choose the verdict.", "Press Check my work."],
    categories: [["secure", "Secure"], ["insecure", "Insecure"], ["improve", "Needs improvement"]],
    items: [["The server issues a random nonce that can be used only once", "secure", "Stops replay."], ["The user is asked to sign the same fixed text every time", "insecure", "A captured signature works forever."], ["The signed message names the website's domain", "secure", "Stops another site reusing it."], ["The app asks the user to sign unreadable hex", "insecure", "Users cannot tell what they approve."], ["The nonce expires after five minutes", "secure", "Limits the window."], ["The server trusts the address sent by the browser without verifying the signature", "insecure", "Anyone can claim any address."], ["The sign-in message says it costs no gas and moves no funds", "secure", "Clear intent."], ["Sessions last forever with no way to log out", "improve", "Add expiry and revocation."]],
  }),
  wordLab({
    id: "w8-login-design", module: "wallets-and-signing", title: "Design a wallet login", level: "advanced", minutes: 18, xp: 65, skills: [SK], required: false,
    objective: "Describe a safe wallet login from request to session.",
    scenario: "Your service wants to let users log in by signing a message with their wallet. Write the design.",
    steps: ["Add Heading 2 sections: Flow, Message contents, Server checks, Risks.", "Under Flow write a numbered list of at least five steps.", "Under Message contents list at least four fields in bullets (domain, nonce, time, purpose).", "Mention replay and phishing.", "Keep it between 130 and 300 words."],
    checks: [
      ck("heads", "Four sections", "Use Heading 2.", "A clear design.", W.heading(4, 2)),
      ck("order", "In order", "Flow, Message contents, Server checks, Risks.", "Process to risk.", W.order(["Flow", "Message contents", "Server checks", "Risks"])),
      ck("steps", "Five steps", "Use the numbered list button.", "The sequence.", W.list(5, "ol")),
      ck("fields", "Four fields", "Use the bullet button.", "What to sign.", W.list(4, "ul")),
      ck("nonce", "Mentions a nonce", "Mention a nonce.", "Single use.", W.pattern("nonce", "a nonce")),
      ck("replay", "Mentions replay", "Mention replay.", "Reused signatures.", W.pattern("replay", "replay")),
      ck("phish", "Mentions phishing", "Mention phishing or a fake site.", "Domain binding.", W.pattern("phish|fake site|another site|different site", "phishing")),
      ck("len", "Between 130 and 300 words", "Concise.", "A usable design.", W.words(130, 300)),
    ],
    solution: "<h2>Flow</h2><ol><li>The browser asks the server for a fresh nonce.</li><li>The page builds a readable message that includes the nonce.</li><li>The wallet asks the user to approve signing the message.</li><li>The page sends the message and signature to the server.</li><li>The server verifies the signature, checks the nonce and creates a session.</li></ol><h2>Message contents</h2><ul><li>Domain: the exact website that is asking.</li><li>Nonce: a random value issued by the server for one use.</li><li>Issued at: the time, so old messages are rejected.</li><li>Purpose: a sentence saying that signing costs nothing and moves no funds.</li></ul><h2>Server checks</h2><p>The server recovers the signer's address from the signature, confirms that the nonce exists and has not been used, deletes it, checks that the domain and time are right, and only then starts a session with an expiry.</p><h2>Risks</h2><p>Replay is blocked by the single-use nonce. Phishing, where a fake site asks for a signature, is limited because the domain is in the message and the wallet shows it. Lost wallets need a recovery path.</p>",
  }),
  classifyLab({
    id: "w9-where-code-lives", module: "node-backends", title: "Browser, backend or contract?", level: "advanced", minutes: 12, xp: 45, skills: [SK], required: true,
    objective: "Decide where each responsibility belongs in a Web3 application.", scenario: "A good architecture puts each job where it is secure, cheap and reliable.",
    steps: ["Read each responsibility.", "Choose where it belongs.", "Press Check my work."],
    categories: [["browser", "Browser (front end)"], ["backend", "Backend (Node.js)"], ["contract", "Smart contract"]],
    items: [["Asking the user's wallet to sign a transaction", "browser", "Keys stay with the user."], ["Enforcing that only the owner can withdraw", "contract", "Rules that move money belong on-chain."], ["Copying events into a database for fast search", "backend", "An indexer."], ["Keeping the server's API key for the RPC provider secret", "backend", "Never ship secrets to browsers."], ["Showing a loading spinner while a transaction is mined", "browser", "User interface."], ["Sending e-mails when a purchase is confirmed", "backend", "Off-chain side effects."], ["Holding the funds of a sale", "contract", "Trustless custody."], ["Rate-limiting abusive clients", "backend", "Server control."]],
  }),
  sheetLab({
    id: "w10-rpc-load", module: "node-backends", title: "Why polling from every browser breaks", level: "advanced", minutes: 12, xp: 50, skills: [SK], required: false,
    objective: "Compare the request load of client polling with one shared backend that reads each block once.",
    scenario: "2,000 users keep a page open and each browser asks the RPC provider for data 6 times a minute. A backend could read once per block (about 7,200 blocks a day) and share the results. (A teaching model.)",
    steps: ["In B7 work out the requests per day from client polling: users times polls per minute times 60 times 24.", "In B8 write the requests per day from one backend: the blocks per day.", "In B9 work out the requests saved.", "In B10 work out the percentage saved.", "In B11 show Client polling exceeds the plan if B7 is above the plan limit in B5, otherwise Fits the plan."],
    cells: { A1: "Input", B1: "Value", A2: "Users", B2: "2000", A3: "Polls per minute per user", B3: "6", A4: "Blocks per day", B4: "7200", A5: "Provider plan limit (requests per day)", B5: "1000000", A7: "Client polling (requests per day)", A8: "One backend (requests per day)", A9: "Requests saved", A10: "Percentage saved", A11: "Verdict" }, view: { cols: 2, rows: 13 },
    checks: [
      ck("b7", "B7 is the client load", "=B2*B3*60*24", "Users times polls times minutes in a day.", S.formula("B7", { equals: 17280000 })),
      ck("b8", "B8 is the backend load", "=B4", "One read per block.", S.formula("B8", { equals: 7200 })),
      ck("b9", "B9 is the saving", "=B7-B8", "The difference.", S.formula("B9", { equals: 17272800 })),
      ck("b10", "B10 is the percentage", "=B9/B7*100", "Saved over client load, times 100.", S.formula("B10", { equals: 17272800 / 17280000 * 100 })),
      ck("b11", "B11 is the verdict", "=IF(B7>B5,\"Client polling exceeds the plan\",\"Fits the plan\")", "Compare with the plan.", S.formula("B11", { fns: ["IF"], equals: "Client polling exceeds the plan" })),
    ],
    solution: { cells: { B7: "=B2*B3*60*24", B8: "=B4", B9: "=B7-B8", B10: "=B9/B7*100", B11: "=IF(B7>B5,\"Client polling exceeds the plan\",\"Fits the plan\")" } },
  }),
  classifyLab({
    id: "w11-test-kinds", module: "testing-and-tooling", title: "Which test catches this?", level: "advanced", minutes: 10, xp: 40, skills: [SK], required: true,
    objective: "Match each risk to the kind of test that would find it.", scenario: "A Web3 app needs tests at several levels. Match each risk to a test.",
    steps: ["Read each risk.", "Choose the test.", "Press Check my work."],
    categories: [["contract", "Contract test (Hardhat)"], ["unit", "JavaScript unit test"], ["fork", "Fork test"], ["e2e", "End-to-end test"], ["manual", "Manual review"]],
    items: [["addNote should reject text over 280 bytes", "contract", "Contract behaviour."], ["A helper that formats token amounts must handle zero and huge values", "unit", "Pure JavaScript logic."], ["Your code works against a copy of the real main network state", "fork", "Realistic dependencies."], ["A user can connect a wallet, mint and see the result in the page", "e2e", "Whole user path."], ["The wording of a warning message is confusing", "manual", "A human must judge."], ["A revert reason is shown correctly in the user interface", "e2e", "UI plus chain."], ["The event NoteAdded carries the right arguments", "contract", "Emitted events."], ["A retry function waits longer each time", "unit", "Deterministic logic."]],
  }),
  wordLab({
    id: "w12-security-checklist", module: "testing-and-tooling", title: "Write a Web3 app security checklist", level: "advanced", minutes: 18, xp: 65, skills: [SK], required: false,
    objective: "Turn the lessons about keys, signing and servers into a checklist your team can follow.",
    scenario: "Your team is about to release a Web3 app with a Node.js backend. Write the checklist.",
    steps: ["Add Heading 2 sections: Keys and secrets, Signing and login, Server and API, Release.", "Under each, write at least two bullet points.", "Mention environment variables, a nonce, and rate limiting.", "Keep it between 130 and 300 words."],
    checks: [
      ck("heads", "Four sections", "Use Heading 2.", "A structured checklist.", W.heading(4, 2)),
      ck("order", "In order", "Keys and secrets, Signing and login, Server and API, Release.", "From keys to release.", W.order(["Keys and secrets", "Signing and login", "Server and API", "Release"])),
      ck("bul", "Bullet points", "Use the bullet button.", "Short rules.", W.list(2, "ul")),
      ck("env", "Mentions environment variables", "Mention environment variables.", "Keep secrets out of code.", W.pattern("environment variable|\\.env|secret manager", "environment variables")),
      ck("nonce", "Mentions a nonce", "Mention a nonce.", "Replay protection.", W.pattern("nonce", "a nonce")),
      ck("rate", "Mentions rate limiting", "Mention rate limiting.", "Abuse protection.", W.pattern("rate.?limit", "rate limiting")),
      ck("len", "Between 130 and 300 words", "Concise.", "A usable list.", W.words(130, 300)),
    ],
    solution: "<h2>Keys and secrets</h2><ul><li>Private keys and RPC keys live in environment variables or a secret manager and are never committed to the repository.</li><li>Deployment keys belong to hardware wallets, and test keys are separate from anything that holds value.</li></ul><h2>Signing and login</h2><ul><li>Every login message includes a single-use nonce, the domain and a time, and the server verifies the signature and deletes the nonce.</li><li>Wallet prompts show readable text, and the app never asks for a recovery phrase.</li></ul><h2>Server and API</h2><ul><li>The API applies rate limiting, input validation and authentication on every route.</li><li>The indexer waits for confirmations and is safe to repeat, using unique keys in the database.</li></ul><h2>Release</h2><ul><li>Contract tests, JavaScript tests and an end-to-end test pass before every release.</li><li>The verified contract address is published in one official place, and dependencies are updated and audited regularly.</li></ul>",
  }),
  wordLab({
    id: "cap-web3-app", module: "capstone", title: "Final project: design a Web3 application end to end", level: "challenge", minutes: 40, xp: 170, skills: [SK], required: true,
    objective: "Produce a professional design for a Web3 application covering architecture, data flow, login, transactions, indexing, testing and operations.",
    scenario: "Design an app where members of a club post short public notes through a smart contract, log in with their wallet, and see a searchable feed. Describe every part.",
    steps: ["Add a Heading 1 'Club notes: application design'.", "Add Heading 2 sections: Architecture, Smart contract, Login, Writing notes, Reading and indexing, Testing, Operations and security.", "Under Architecture list at least four components in bullets.", "Under Writing notes write a numbered list of at least five steps from click to confirmation.", "Under Reading and indexing mention confirmations and what happens during a reorganisation.", "Under Operations and security mention secrets, rate limiting and monitoring.", "Keep it between 320 and 640 words."],
    checks: [
      ck("t", "A title", "Use Heading 1.", "Name the design.", W.heading(1, 1)),
      ck("secs", "Seven sections", "Use Heading 2.", "A complete design.", W.heading(7, 2)),
      ck("order", "In order", "Architecture, Smart contract, Login, Writing notes, Reading and indexing, Testing, Operations and security.", "A logical flow.", W.order(["Architecture", "Smart contract", "Login", "Writing notes", "Reading and indexing", "Testing", "Operations and security"])),
      ck("comp", "Four components", "Use the bullet button.", "Name the parts.", W.list(4, "ul")),
      ck("steps", "Five steps", "Use the numbered list button.", "From click to confirmation.", W.list(5, "ol")),
      ck("conf", "Mentions confirmations", "Mention confirmations.", "Safe reading.", W.pattern("confirmation", "confirmations")),
      ck("reorg", "Mentions reorganisation", "Mention reorg or reorganisation.", "The chain can change.", W.pattern("reorg", "reorganisation")),
      ck("sec", "Mentions secrets and rate limiting", "Mention secrets and rate limiting.", "Operations.", W.pattern("secret[\\s\\S]*rate.?limit|rate.?limit[\\s\\S]*secret", "secrets and rate limiting")),
      ck("mon", "Mentions monitoring", "Mention monitoring or alerts.", "Know when it breaks.", W.pattern("monitor|alert", "monitoring")),
      ck("len", "Between 320 and 640 words", "Two pages at most.", "Readable.", W.words(320, 640)),
    ],
    solution: "<h1>Club notes: application design</h1><h2>Architecture</h2><ul><li>A smart contract that stores notes and emits an event for each one.</li><li>A browser front end that connects to the user's wallet and sends transactions.</li><li>A Node.js backend that handles wallet login and serves a search API.</li><li>An indexer service that copies events into a database for fast search.</li></ul><h2>Smart contract</h2><p>The Notebook contract accepts notes of 1 to 280 bytes, stores the author and time, and emits NoteAdded. It has no owner and no upgrade path, so the rules cannot be changed. Tests cover empty and over-long notes, events and authors.</p><h2>Login</h2><p>The user signs a readable message containing the domain, a single-use nonce and the time. The server verifies the signature, deletes the nonce and starts a short session.</p><h2>Writing notes</h2><ol><li>The user types a note and presses Post.</li><li>The page simulates the call to check that it would not revert.</li><li>The wallet shows the details and the user approves.</li><li>The page shows the transaction hash and a pending state.</li><li>After the transaction is mined and a few blocks have passed, the note appears in the feed.</li></ol><h2>Reading and indexing</h2><p>The indexer reads events only after twelve confirmations, so a reorganisation of recent blocks cannot remove a note it has already stored. Each event is saved with a unique key made of the transaction hash and log index, so the job is safe to repeat after a crash.</p><h2>Testing</h2><p>Contract tests run in Hardhat, JavaScript unit tests cover formatting and retry logic, and an end-to-end test posts a note on a local chain and checks the feed.</p><h2>Operations and security</h2><p>Secrets such as RPC keys live in environment variables, the API applies rate limiting and input validation, and monitoring alerts us when the indexer falls behind the chain by more than a few minutes. Users never type a recovery phrase into any page, and we publish a short security contact and a plain-language explanation of what the application can and cannot do.</p>",
  }),
];

const M1 = module_({
  slug: "javascript-for-web3", title: "JavaScript for Web3", hours: 2, level: "Foundations",
  summary: "The parts of JavaScript Web3 code relies on: BigInt, async functions, hex strings, units and the tooling around them.",
  outcome: "You can handle amounts safely with BigInt and units and write async code that talks to a network.",
  intro: "You do not need to be a JavaScript expert to build Web3 apps, but a few features matter more than usual: numbers that can be bigger than JavaScript's normal limits, code that waits for the network, and strings that are really numbers in hex. This module covers those and sets up the project.",
  topics: [
    topic({
      title: "Amounts, BigInt and units", slug: "bigint-units",
      blocks: [
        p("JavaScript's normal number type is a floating-point value that is exact only up to about nine quadrillion. One ether is a quintillion wei, far beyond that. Blockchain amounts are therefore handled as **BigInt**, a built-in type for arbitrarily large whole numbers, written with an n suffix such as 1000000000000000000n. BigInt and normal numbers do not mix in the same calculation, which prevents a silent loss of precision."),
        code("javascript", units, "units.js"),
        table("Helpers from ethers", ["Function", "Purpose"], [["parseEther('1.5')", "Text to wei as BigInt"], ["formatEther(x)", "BigInt wei to a readable string"], ["parseUnits('12.5', 6)", "Text to base units for a token with 6 decimals"], ["formatUnits(x, 6)", "Base units to readable text"]]),
        explorer({ id: "js-units", title: "Units converter", intro: "Change the amount and decimals to see how it is stored. Very large numbers are shown approximately here; real code uses BigInt.", inputs: [{ id: "amt", label: "Human amount", min: 0, max: 1000, step: 0.5, value: 2.5 }, { id: "dec", label: "Decimals", min: 0, max: 8, step: 1, value: 6 }], outputs: [{ label: "Stored whole number", expr: "amt * pow(10, dec)", unit: "n" }] }),
        miniQuiz("bigint-mini", [["Why use BigInt for token amounts?", ["It is faster", "Normal numbers lose precision beyond about 9 quadrillion", "It is required by wallets", "It uses less memory"], 1, "Precision matters with money."]]),
      ],
      points: ["Amounts are BigInt values in the smallest unit.", "Convert to text only for display with formatUnits."],
      check: [["BigInt literals end with:", ["n", "b", "i", "x"], 0, "For example 10n."]],
    }),
    topic({
      title: "Async code, hex strings and project set-up", slug: "async-setup",
      blocks: [
        p("Talking to a blockchain takes time, so almost every call returns a **Promise**. You write async functions and use await to wait for results. If a call fails, it throws, and you handle that with try and catch. Three habits matter: always await, always catch errors, and never block the page while waiting."),
        table("Hex strings", ["Value", "Looks like", "Meaning"], [["Address", "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4", "20 bytes shown as 40 hex digits; checksummed capitals protect against typos"], ["Transaction hash", "0x followed by 64 hex digits", "A fingerprint of a transaction"], ["Function selector", "0x followed by 8 hex digits", "The first 4 bytes of the hash of the function signature"], ["Quantity in RPC", "0x1b4", "A number written in hexadecimal"]]),
        list("A sensible starting project", ["Install Node.js (a current long-term-support version).", "Create a folder and run npm init.", "Install ethers with npm install ethers.", "Keep secrets in a .env file and add it to .gitignore.", "Use a free account with a hosted RPC provider or a local test node.", "Start on a test network or a local node, never with real funds."], true),
        mistakes(["Forgetting await, so you print a Promise instead of the value.", "Committing a .env file or a private key to a public repository.", "Doing calculations with Number when values could be large."]),
        miniQuiz("async-mini", [["What does forgetting await give you?", ["The value", "A Promise object that has not finished", "An error always", "A BigInt"], 1, "You must wait for results."]]),
      ],
      points: ["Network calls return Promises: await them and catch errors.", "Keep keys in environment variables, never in the repository."],
      check: [["A checksummed address helps catch:", ["Typing mistakes", "High fees", "Reorgs", "Hacks"], 0, "Capital letters encode a check."]],
    }),
    topic({
      title: "The notebook contract used in this course", slug: "notebook",
      blocks: [
        code("solidity", greeter, "Notebook.sol"),
        table("What the JavaScript examples will use", ["Part", "Used for"], [["addNote (writes)", "Sending a transaction"], ["noteCount and getNote (reads)", "Read-only calls with no gas cost"], ["NoteAdded event", "Reading history and building an indexer"], ["require messages", "Practising error handling"]]),
        p("Keeping one simple contract throughout lets you focus on the JavaScript. You will read it, write to it, watch its events, sign in with a wallet to use it and test it. Deploy it to a local Hardhat node or a public test network in your own tools."),
        miniQuiz("note-mini", [["Why do view functions cost no gas when called from a script?", ["They are free of code", "They are read by a node without a transaction", "They are cached", "Gas is optional"], 1, "Reads need no transaction."]]),
      ],
      points: ["One small contract carries all the JavaScript examples.", "Reads are free; writes are transactions."],
      check: [["Events are useful for:", ["Reading history", "Paying gas", "Mining", "Hiding data"], 0, "Cheap logs."]],
    }),
  ],
  terms: [["BigInt", "A type for arbitrarily large whole numbers"], ["Wei", "The smallest unit of ether"], ["Promise", "A value that arrives later"], ["await", "Wait for a Promise"], ["RPC", "The interface to a blockchain node"], ["Checksum address", "An address with a built-in typo check"]],
  practical: { title: "Practical: set up the project", intro: "On your own computer.", steps: ["Install Node.js and create a new folder.", "Install ethers and run the units example.", "Deploy Notebook to a local node.", "Write down its address."] },
  quiz: [
    ["BigInt is used for:", ["Large whole numbers", "Decimals", "Text", "Images"], 0, "Amounts need exact whole-number arithmetic."],
    ["Mixing BigInt and Number:", ["Throws an error", "Works", "Is faster", "Is encouraged"], 0, "Convert explicitly."],
    ["parseUnits turns:", ["Text into base units", "Base units into text", "ETH into gas", "Gas into ETH"], 0, "With decimals."],
    ["Network calls return:", ["Promises", "Numbers", "Images", "Nothing"], 0, "Use await to wait for the result."],
    ["Secrets belong in:", ["Environment variables", "The repository", "The web page", "A comment"], 0, "Never commit them."],
    ["An address has:", ["20 bytes", "2 bytes", "100 bytes", "1 byte"], 0, "40 hex digits."],
    ["View calls cost:", ["No gas", "A lot", "A fee", "A token"], 0, "They are reads."],
  ],
});

const M2 = module_({
  slug: "reading-the-chain", title: "Reading the chain with ethers", hours: 2.5, level: "Core skills",
  summary: "Providers, contracts, events and the habits of reliable read-only code.",
  outcome: "You can read balances, call view functions, filter events and handle errors in a read-only script.",
  intro: "Reading is the safest thing you can do on a blockchain: no keys, no cost, no risk. It is also where most real applications spend nearly all their time. This module builds a read-only script and explains how to make it reliable.",
  topics: [
    topic({
      title: "A read-only script", slug: "read-script",
      blocks: [
        code("javascript", readScript, "read.js"),
        table("What the script does", ["Step", "Notes"], [["JsonRpcProvider(url)", "Connects to a node or hosted service; the URL often contains an API key, so keep it secret"], ["getNetwork", "Confirms which chain you are talking to; always check"], ["getBalance", "Returns a BigInt in wei"], ["Contract with a human-readable ABI", "Lists only the functions and events you need"], ["noteCount and getNote", "View calls: free reads"], ["queryFilter with a block range", "Past events, in a limited range"], ["main().catch(...)", "Handles failures and sets an exit code"]]),
        miniQuiz("read-mini", [["Why check getNetwork?", ["It lowers fees", "To confirm you are on the intended chain", "It is required by ethers", "It signs messages"], 1, "Wrong-chain bugs are common."]]),
        warn("An RPC URL with an API key is a secret. If it leaks, others can use your quota."),
      ],
      points: ["A provider is a read connection; a contract wraps the ABI.", "Always confirm the network and handle errors."],
      check: [["A human-readable ABI lists:", ["Only what you need", "Everything ever", "Keys", "Fees"], 0, "Short and clear."]],
    }),
    topic({
      title: "Events and block ranges", slug: "events-ranges",
      blocks: [
        p("Events are how contracts publish history. Each log has the contract address, indexed topics for fast filtering and non-indexed data. You can ask for all logs of a given event in a range of blocks, filtered by indexed arguments such as the author. Most RPC providers limit the size of a range or the number of results, so serious code reads in batches."),
        table("Event reading pitfalls", ["Problem", "Remedy"], [["Querying from block 0 to the latest in one call", "Read in batches of a few hundred or thousand blocks"], ["Provider returns an error for too many results", "Narrow the range or the filter"], ["Missing events during a gap", "Save the last block you have processed and continue from the next"], ["Duplicates after a restart", "Use a unique key of transaction hash and log index"], ["Events from the latest blocks vanish after a reorganisation", "Wait for confirmations before treating events as final"]]),
        flow("A safe event loop", ["Load the last processed block", "Ask the node for the latest block", "Subtract a confirmation margin", "Read events in batches up to that block", "Store them with unique keys", "Save the new last processed block", "Sleep about one block and repeat"]),
        miniQuiz("ev-mini", [["Why wait for confirmations before trusting recent events?", ["To save bandwidth", "Recent blocks can be replaced in a reorganisation", "Events are encrypted", "Providers require it"], 1, "Finality takes time."]]),
      ],
      points: ["Read events in batches and remember where you stopped.", "Use unique keys and wait for confirmations."],
      check: [["A reorganisation is when:", ["Recent blocks are replaced by a different chain tip", "Fees rise", "A contract is deleted", "A wallet locks"], 0, "The latest blocks can change."]],
    }),
    topic({
      title: "Reliability: limits, retries and caching", slug: "reliability",
      blocks: [
        explorer({ id: "js-poll", title: "Why shared reading wins", intro: "Change the users and polling rate to see daily requests if every browser polls, compared with one backend reading each block. A teaching model.", inputs: [{ id: "users", label: "Users", min: 10, max: 20000, step: 10, value: 2000 }, { id: "rate", label: "Polls per minute per user", min: 1, max: 30, step: 1, value: 6 }], outputs: [{ label: "Browser polling (requests per day)", expr: "users * rate * 60 * 24", unit: "n" }, { label: "One backend (requests per day)", expr: "7200", unit: "n" }] }),
        table("Habits of reliable read code", ["Habit", "Why"], [["Cache values that do not change quickly", "Fewer requests, faster pages"], ["Use a backend to share reads between many users", "Stays inside provider limits"], ["Retry with increasing delays (backoff)", "Networks are flaky"], ["Set timeouts", "A hung request should not freeze the page"], ["Use more than one provider for important data", "Providers have outages"], ["Show stale data with a notice rather than nothing", "Better user experience"]]),
        mistakes(["Polling from every browser every second.", "Treating a failed read as 'no data' instead of an error.", "Ignoring rate-limit responses."]),
        miniQuiz("rel-mini", [["What is backoff?", ["Cancelling a request", "Waiting longer after each failed attempt", "Changing the chain", "Hiding errors"], 1, "A polite retry."]]),
      ],
      points: ["Cache, share reads through a backend and retry with backoff.", "Show stale data honestly rather than an empty page."],
      check: [["Timeouts prevent:", ["A hung request freezing the app", "Gas fees", "Reorgs", "Hacks"], 0, "A hung request should fail quickly."]],
    }),
  ],
  terms: [["Provider", "A read connection to a chain"], ["ABI", "The description of a contract's interface"], ["Event log", "A record emitted by a contract"], ["Confirmation", "A block built on top of yours"], ["Reorganisation", "Replacement of recent blocks"], ["Backoff", "Increasing waits between retries"]],
  practical: { title: "Practical: read your Notebook", intro: "With your deployed contract.", steps: ["Set RPC_URL, ADDRESS and NOTEBOOK in your environment.", "Run read.js.", "Add a note from Remix and read it again.", "Change the script to print only notes by one author."] },
  quiz: [
    ["A provider is used for:", ["Reading", "Signing", "Mining", "Minting"], 0, "No keys needed."],
    ["queryFilter reads:", ["Past events", "Future events", "Balances", "Keys"], 0, "In a block range."],
    ["Large ranges often:", ["Hit provider limits", "Are free", "Are faster", "Are required"], 0, "Read in batches."],
    ["A unique key for a log is:", ["Transaction hash and log index", "The date", "The author", "The amount"], 0, "Safe to repeat."],
    ["Confirmations protect against:", ["Reorganisations", "Fees", "Typos", "Hacks"], 0, "Recent blocks can still be replaced."],
    ["Shared reads through a backend:", ["Save requests", "Cost more", "Hide data", "Slow pages"], 0, "Avoid duplicated polling."],
    ["A leaked RPC key lets others:", ["Use your quota", "Steal funds", "Mint tokens", "Delete the chain"], 0, "Keep it secret."],
  ],
});

const M3 = module_({
  slug: "sending-transactions", title: "Sending transactions", hours: 2.5, level: "Core skills",
  summary: "Signers, simulation, gas estimation, nonces, receipts and a complete error-handling pattern.",
  outcome: "You can send a transaction from a script, simulate it first, wait for confirmations and handle failures.",
  intro: "Reading is safe; writing costs money and cannot be undone. This module teaches the careful sequence professionals follow: simulate, estimate, send, wait and handle every way it can fail.",
  topics: [
    topic({
      title: "A careful send script", slug: "send-script",
      blocks: [
        code("javascript", sendScript, "send.js"),
        flow("The safe sequence", ["Load the key from the environment", "Connect a wallet to the provider", "Simulate with staticCall", "Estimate gas and add a margin", "Send the transaction", "Wait for the receipt and extra confirmations", "Check the receipt status"]),
        warn("Use a throw-away test account on a test network. Never put a key that controls real funds in a script, a shared machine or a repository."),
        miniQuiz("send-mini", [["Why simulate with staticCall before sending?", ["It is cheaper than reading", "It finds out whether the call would revert before you pay for it", "It signs the call", "It skips the wallet"], 1, "Avoid paying for a failure."]]),
      ],
      points: ["Simulate, estimate, send, wait, then check the receipt.", "Keys come from the environment and belong to test accounts only."],
      check: [["A receipt with status 0 means the transaction:", ["Reverted", "Succeeded", "Is pending", "Is cancelled"], 0, "It failed on-chain."]],
    }),
    topic({
      title: "Nonces, gas and stuck transactions", slug: "nonce-gas",
      blocks: [
        table("Key ideas", ["Idea", "Meaning"], [["Nonce", "The count of transactions an account has sent; each must use the next number in order"], ["Gas limit", "The most gas a transaction may use; unused gas is returned"], ["Max fee and priority fee", "What you are willing to pay per unit of gas in total and as a tip for the block producer"], ["Pending", "Waiting to be included"], ["Replacement", "A new transaction with the same nonce and a higher fee replaces a stuck one"], ["Cancel", "Replace a stuck transaction with a zero-value transfer to yourself using the same nonce"]]),
        list("If a transaction is stuck", ["Do not send many new ones; they queue behind the stuck nonce.", "Check the fee against current network conditions.", "Resubmit the same nonce with a higher fee.", "Or replace it with a harmless transaction to yourself.", "Tell the user clearly what is happening and show the transaction link."], true),
        explorer({ id: "js-gas", title: "Fee calculator", intro: "Change gas used, price and ETH price to see the cost of one transaction. Teaching figures.", inputs: [{ id: "gas", label: "Gas used", min: 21000, max: 500000, step: 1000, value: 52000 }, { id: "gwei", label: "Gas price (gwei)", min: 1, max: 200, step: 1, value: 25 }, { id: "eth", label: "ETH price (rupees)", min: 50000, max: 500000, step: 10000, value: 250000 }], outputs: [{ label: "Fee (ETH)", expr: "gas * gwei / 1000000000", unit: "n" }, { label: "Fee (rupees)", expr: "gas * gwei / 1000000000 * eth", unit: "rs" }] }),
        miniQuiz("nonce-mini", [["Why do later transactions wait behind a stuck one?", ["Fees are high", "Nonces must be used in order", "Wallets refuse", "Blocks are full"], 1, "Order is enforced."]]),
      ],
      points: ["Nonces enforce order; stuck transactions are replaced by raising the fee on the same nonce.", "Estimate gas and add a margin."],
      check: [["A gas limit protects you by:", ["Capping the maximum gas used", "Raising the price", "Cancelling retries", "Hiding errors"], 0, "It sets a ceiling on gas used."]],
    }),
    topic({
      title: "Receipts, errors and user messages", slug: "receipts-errors",
      blocks: [
        table("Common error codes in ethers v6", ["Code", "Meaning", "What to tell the user"], [["INSUFFICIENT_FUNDS", "Not enough currency for value plus gas", "Add more currency and try again"], ["CALL_EXCEPTION", "The contract reverted", "Show the contract's reason in plain words"], ["ACTION_REJECTED", "The user declined in the wallet", "No problem; try again when ready"], ["NONCE_EXPIRED", "That nonce was already used", "Refresh and try again"], ["REPLACEMENT_UNDERPRICED", "A replacement needs a higher fee", "Increase the fee or wait"], ["NETWORK_ERROR / TIMEOUT", "The node did not answer", "Retry shortly"]]),
        p("A receipt tells you what happened on the chain: the block, the gas used, the status and the logs. Always check the status, because a transaction that was mined but reverted still costs gas. Decode logs to show results such as the id of a new item."),
        mistakes(["Assuming the transaction succeeded because the hash was returned.", "Showing raw error objects to users.", "Not telling the user what to do next."]),
        miniQuiz("err-mini", [["If the user presses Reject in the wallet, you should:", ["Show a scary error", "Treat it as a normal choice and let them retry", "Resend automatically", "Log them out"], 1, "A rejection is not a failure."]]),
      ],
      points: ["Check the receipt status and decode logs.", "Translate error codes into friendly next steps."],
      check: [["A mined but reverted transaction:", ["Still costs gas", "Costs nothing", "Is cancelled", "Is a success"], 0, "Gas is spent."]],
    }),
  ],
  terms: [["Signer", "An object that can sign and send"], ["Nonce", "A per-account transaction counter"], ["Gas limit", "The maximum gas a transaction may use"], ["Receipt", "The record of a mined transaction"], ["staticCall", "A simulation that sends nothing"], ["Replacement", "Overwriting a stuck transaction"]],
  practical: { title: "Practical: post a note", intro: "On a local node or test network.", steps: ["Create a throw-away test account.", "Run send.js with a short note.", "Try an empty note and read the error.", "Remove funds from the account and see the other error."] },
  quiz: [
    ["Simulating first avoids:", ["Paying for failures", "Reading", "Signing", "Waiting"], 0, "staticCall."],
    ["A nonce is:", ["A transaction counter", "A key", "A fee", "A block"], 0, "Nonces must be used strictly in order."],
    ["To replace a stuck transaction:", ["Use the same nonce and a higher fee", "Use a lower fee", "Delete the account", "Wait a year"], 0, "Replacement."],
    ["A reverted transaction:", ["Costs gas", "Is free", "Is invisible", "Is a success"], 0, "Check the status."],
    ["ACTION_REJECTED means:", ["The user declined", "The chain stopped", "Gas is zero", "A hack"], 0, "Not an error to fear."],
    ["Test keys should be:", ["Throw-away", "Your savings", "Shared", "Public"], 0, "Never real funds."],
    ["Wait for extra confirmations to:", ["Reduce reorg risk", "Lower fees", "Skip checks", "Hide errors"], 0, "Recent blocks can still be replaced."],
  ],
});

const M4 = module_({
  slug: "wallets-and-signing", title: "Wallets and signing", hours: 2.5, level: "Applied skills",
  summary: "Connecting to browser wallets, chain switching, signed messages and passwordless login.",
  outcome: "You can connect to a wallet, handle account and chain changes and build a safe signed-message login.",
  intro: "A wallet is the user's identity and key chain. Your app never sees their private key; it asks the wallet to sign. This module covers connecting, reacting to changes and using signatures to log users in without passwords.",
  topics: [
    topic({
      title: "Connecting to a wallet", slug: "connect",
      blocks: [
        code("javascript", walletScript, "wallet.js"),
        table("Pieces of the connection", ["Piece", "Role"], [["window.ethereum", "The provider injected by the wallet (EIP-1193)"], ["eth_requestAccounts", "Asks the user to share an account; they may refuse"], ["BrowserProvider and getSigner", "ethers objects that route requests through the wallet"], ["wallet_switchEthereumChain", "Asks the wallet to change networks"], ["accountsChanged and chainChanged", "Events your app must handle"]]),
        mistakes(["Assuming the user is on the right network.", "Ignoring the accountsChanged event and showing the wrong account.", "Requesting a connection on page load instead of after a user click."]),
        miniQuiz("conn-mini", [["Why should the app listen to accountsChanged?", ["To save gas", "The user can switch accounts at any time", "It is required by law", "It signs messages"], 1, "Keep the page in step with the wallet."]]),
      ],
      points: ["Connect through the wallet's injected provider and ask for permission.", "React to account and chain changes."],
      check: [["The app should request accounts:", ["After a user action", "On every page load silently", "Never", "Using the private key"], 0, "Ask politely."]],
    }),
    topic({
      title: "Signing messages safely", slug: "sign-messages",
      blocks: [
        table("Kinds of signature", ["Kind", "Used for", "Risk"], [["Message signature (personal_sign)", "Login, proving control of an address", "A signed message must not be reusable elsewhere"], ["Typed data (EIP-712)", "Orders, permits, votes with readable fields", "Users must read the fields"], ["Transaction signature", "Actually changing the chain", "Costs gas and moves value"]]),
        p("Signing a message costs nothing and moves no funds, but it can still be dangerous if the message authorises something elsewhere. A signature on an opaque hash can be an approval hidden in plain sight. Good apps show human-readable text, bind it to a domain and a time and add a single-use nonce."),
        list("Rules for signing prompts", ["Show text a person can read.", "Say what the signature is for.", "Include the domain.", "Include a nonce and a time.", "Never request signatures on arbitrary data from untrusted sources.", "Never ask users for their recovery phrase."], true),
        miniQuiz("sign-mini", [["What risk does an opaque hash signature carry?", ["It costs gas", "It might authorise something the user did not understand", "It is slow", "It is encrypted"], 1, "Readable messages protect users."]]),
      ],
      points: ["Message signatures cost nothing but must be readable and bound to context.", "Typed data (EIP-712) makes fields visible in the wallet."],
      check: [["A signature that includes the domain helps stop:", ["Another site reusing it", "High fees", "Reorgs", "Typos"], 0, "Domain binding."]],
    }),
    topic({
      title: "Passwordless login", slug: "login",
      blocks: [
        code("javascript", serverLogin, "server.js"),
        code("javascript", clientLogin, "login.js"),
        flow("The login flow", ["Browser asks for a nonce", "Server creates and stores it", "Browser builds a readable message with the nonce", "Wallet asks the user to sign", "Browser sends message and signature", "Server recovers the address, checks the nonce and domain, deletes the nonce", "Server starts a session"]),
        table("What each check prevents", ["Check", "Prevents"], [["Nonce exists and is deleted after use", "Replay of an old signature"], ["Nonce expiry", "Using a stale signature later"], ["Domain in the message", "A phishing site collecting signatures for yours"], ["Recovered address, not a claimed address", "Someone pretending to be another address"], ["Session expiry", "Endless access from one signature"]]),
        miniQuiz("login-mini", [["Why recover the address from the signature rather than trust the one the browser sends?", ["It is faster", "Anyone can claim any address; only the signature proves control", "It saves bandwidth", "It is required by Express"], 1, "Proof, not claims."]]),
        tip("For production use, follow the Sign-In with Ethereum standard (EIP-4361) and a maintained library instead of writing the message format yourself."),
      ],
      points: ["Issue a nonce, sign a readable message, verify and delete the nonce.", "Recover the signer from the signature; never trust a claimed address."],
      check: [["After use, the nonce should be:", ["Deleted", "Reused", "Published", "Extended"], 0, "Single use."]],
    }),
  ],
  terms: [["EIP-1193", "The standard wallet provider interface"], ["Signer", "An object that signs for an account"], ["personal_sign", "Signing a text message"], ["EIP-712", "Signing structured data"], ["Nonce", "A single-use number"], ["SIWE", "Sign-In with Ethereum"]],
  practical: { title: "Practical: build the login", intro: "With a local Node server and a test wallet.", steps: ["Run server.js and add the login code to a page.", "Sign in with a test account.", "Replay the same signature and see it rejected.", "Change the domain in the message and see it rejected."] },
  quiz: [
    ["window.ethereum is:", ["The injected wallet provider", "A website", "A token", "A fee"], 0, "It is the wallet provider standard."],
    ["eth_requestAccounts:", ["Asks the user to share accounts", "Reads keys", "Sends funds", "Burns tokens"], 0, "They can refuse."],
    ["Message signatures:", ["Cost no gas", "Cost gas", "Move funds", "Are private"], 0, "But can still authorise things."],
    ["A login nonce should be:", ["Single use", "Reusable", "Public forever", "Zero"], 0, "Stops replay."],
    ["The server should:", ["Recover the signer", "Trust the claimed address", "Skip checks", "Store keys"], 0, "Proof of control."],
    ["Recovery phrases must be:", ["Never requested", "Collected", "Emailed", "Stored"], 0, "Nobody needs them."],
    ["Domain binding stops:", ["Cross-site reuse", "Fees", "Reorgs", "Typos"], 0, "Phishing defence."],
  ],
});

const M5 = module_({
  slug: "node-backends", title: "Node.js backends for Web3", hours: 2.5, level: "Applied skills",
  summary: "What belongs on a server, a safe event indexer, APIs and keeping everything repeatable.",
  outcome: "You can decide where each responsibility belongs, write a repeat-safe indexer and design a small API over indexed data.",
  intro: "Chains are slow to search and strict about cost. Most real applications add a backend to index events, send e-mails, rate-limit abuse and keep secrets. This module shows what belongs there and how to build it safely.",
  topics: [
    topic({
      title: "What belongs where", slug: "responsibilities",
      blocks: [
        table("Where each responsibility goes", ["Responsibility", "Browser", "Backend", "Contract"], [["Hold the user's keys", "Wallet only", "Never", "Never"], ["Enforce rules that move money", "No", "No", "Yes"], ["Search and filter history", "No (too slow)", "Yes, via an index", "No"], ["Hold API keys and secrets", "Never", "Yes", "Never"], ["Send e-mail or notifications", "No", "Yes", "No"], ["Show progress to the user", "Yes", "Helps", "No"], ["Rate-limit abuse", "No", "Yes", "No"]]),
        p("A common mistake is to put a rule in the page that should be in the contract (anyone can bypass the page) or to put a secret in the page that should be on the server (anyone can read the page). Treat the browser as untrusted, the backend as your trusted helper and the contract as the final judge."),
        miniQuiz("where-mini", [["Why must money rules live in the contract?", ["It is cheaper", "A page or server can be bypassed; the contract is the final judge", "Wallets demand it", "Contracts are faster"], 1, "Do not rely on the front end to enforce rules."]]),
      ],
      points: ["Contracts enforce rules; backends index and protect secrets; browsers show and sign.", "Treat the browser as untrusted."],
      check: [["API keys for an RPC provider belong:", ["On the backend", "In the page", "In the contract", "In a comment"], 0, "Keep them private."]],
    }),
    topic({
      title: "A repeat-safe indexer", slug: "indexer",
      blocks: [
        code("javascript", indexer, "indexer.js"),
        table("Why it is written this way", ["Feature", "Reason"], [["CONFIRMATIONS", "Do not store events from blocks that could still be replaced"], ["Batches of BATCH blocks", "Stay inside provider limits"], ["indexer_state with last_block", "Resume exactly where it stopped"], ["A database transaction around events and the new last_block", "Either both are saved or neither"], ["INSERT IGNORE with a unique key", "Running the same range twice causes no duplicates"], ["Sleeping about one block", "Avoids hammering the provider"]]),
        p("The core idea is **idempotence**: you can run the same step again and get the same result. Crashes, restarts and retries are normal, so any step that cannot be safely repeated is a bug waiting for a bad day."),
        miniQuiz("idx-mini", [["Why wrap the inserts and the last_block update in one database transaction?", ["To make it slower", "So a crash cannot leave events saved but the position unsaved, or the reverse", "Databases require it", "To hide errors"], 1, "All or nothing."]]),
      ],
      points: ["Index with confirmations, batches and unique keys.", "Make every step safe to repeat."],
      check: [["Idempotent means:", ["Repeating gives the same result", "Very fast", "Encrypted", "One time only"], 0, "Safe to retry."]],
    }),
    topic({
      title: "APIs, security and operations", slug: "api-ops",
      blocks: [
        list("Designing the API over your index", ["Expose read endpoints such as notes by author, with pagination.", "Validate every input and limit page sizes.", "Require login for anything personal.", "Apply rate limits per address and per network address.", "Return clear errors, not stack traces.", "Never expose database errors or secrets."]),
        table("Operations checklist", ["Area", "Practice"], [["Secrets", "Environment variables or a secret manager; rotate on suspicion"], ["Monitoring", "Alert when the indexer falls behind or the provider fails"], ["Logging", "Log transaction hashes and error codes, never private keys"], ["Backups", "Back up the database; the chain is the source of truth for events"], ["Providers", "Have a second provider for failover"], ["Dependencies", "Update and audit packages regularly"]]),
        mistakes(["Trusting the browser to tell the server who the user is.", "Running the indexer once manually and forgetting it.", "Letting the API return unlimited rows."]),
        miniQuiz("ops-mini", [["What should alert you in an indexer?", ["Nothing", "It falls far behind the latest block or errors repeatedly", "A new block", "A busy day"], 1, "You need to know when it stops."]]),
      ],
      points: ["Validate, paginate, rate-limit and log carefully.", "Monitor lag and keep secrets out of logs."],
      check: [["The chain remains the source of truth for:", ["Events and balances", "Your passwords", "E-mails", "CSS"], 0, "The database is a copy."]],
    }),
  ],
  terms: [["Indexer", "A service that copies events into a database"], ["Idempotent", "Safe to repeat"], ["Pagination", "Returning results in pages"], ["Rate limit", "A cap on requests"], ["Failover", "Switching to a backup"], ["Source of truth", "The authoritative record"]],
  practical: { title: "Practical: index your notes", intro: "With a local database.", steps: ["Create the tables with a unique key.", "Run the indexer against your node.", "Stop it and run it again to check there are no duplicates.", "Write an API route that returns notes by author."] },
  quiz: [
    ["Rules that move money belong in:", ["The contract", "The page", "The server", "The CSS"], 0, "The final judge."],
    ["RPC keys belong in:", ["The backend", "The page", "The contract", "The wallet"], 0, "Secrets must never reach the browser."],
    ["An indexer waits for confirmations to:", ["Avoid storing replaced blocks", "Save space", "Pay gas", "Hide data"], 0, "Reorg safety."],
    ["Idempotent steps:", ["Can be repeated", "Run once only", "Are fast", "Are random"], 0, "Retry-safe."],
    ["Pagination limits:", ["Result sizes", "Gas", "Blocks", "Keys"], 0, "Protects the API."],
    ["Logs must not contain:", ["Private keys", "Transaction hashes", "Error codes", "Block numbers"], 0, "Never log secrets."],
    ["A second provider gives:", ["Failover", "More gas", "More ETH", "Privacy"], 0, "Providers have outages."],
  ],
});

const M6 = module_({
  slug: "testing-and-tooling", title: "Testing and tooling", hours: 2, level: "Applied skills",
  summary: "Hardhat tests with ethers, JavaScript unit tests, fork tests, configuration and a security checklist.",
  outcome: "You can write contract tests in JavaScript, configure Hardhat safely and choose the right kind of test.",
  intro: "Code that touches money is tested more thoroughly than most. In the JavaScript world that means Hardhat for contracts, ordinary test frameworks for your helpers and a few end-to-end checks for the whole path.",
  topics: [
    topic({
      title: "Testing contracts with Hardhat", slug: "hardhat-tests",
      blocks: [
        code("javascript", hardhatTest, "test/notebook.test.js"),
        table("What the tests check", ["Test", "Why"], [["Stores a note and emits an event", "Core behaviour and the event the indexer depends on"], ["Rejects empty and over-long text", "Boundaries are where bugs live"], ["Records different authors", "msg.sender is used correctly"]]),
        list("Habits for good contract tests", ["Test failures as carefully as successes.", "Test boundaries: zero, one, maximum and one over.", "Test every event your off-chain code relies on.", "Use fresh state for each test with beforeEach.", "Name tests after the behaviour they protect."], true),
        miniQuiz("hh-mini", [["Why test the event as well as the stored value?", ["Events are free", "Your indexer relies on the event", "Wallets demand it", "It is shorter"], 1, "Off-chain code trusts events."]]),
      ],
      points: ["Hardhat runs contracts on a local chain for fast tests.", "Test boundaries, failures and events."],
      check: [["beforeEach gives each test:", ["Fresh state", "Real funds", "A bank", "A key"], 0, "Independent tests."]],
    }),
    topic({
      title: "Configuration, forks and other tests", slug: "config-forks",
      blocks: [
        code("javascript", configEnv, "hardhat.config.js"),
        table("Kinds of test for a Web3 app", ["Kind", "Finds", "Tool"], [["Contract tests", "Logic errors in contracts", "Hardhat or Foundry"], ["JavaScript unit tests", "Bugs in helpers: formatting, retries, parsing", "A test framework such as Jest, Vitest or Mocha"], ["Fork tests", "Problems with real deployed contracts", "A local fork of a real network"], ["End-to-end tests", "Broken user flows", "A browser test tool with a test wallet"], ["Manual review", "Confusing wording and risky flows", "People"]]),
        p("A **fork** runs a local copy of a real network at a chosen block. You can interact with real deployed contracts and see how your code behaves without spending anything. Forks are excellent for testing integrations, but remember that they are a snapshot, not a guarantee about the live network later."),
        miniQuiz("fork-mini", [["What is a fork test?", ["A test of cutlery", "A local copy of a real network used for testing", "A hard fork of a chain", "A deployment"], 1, "Real contracts, no cost."]]),
        warn("Keep keys in environment variables. Add .env to .gitignore before the first commit, and check that a private key was never pushed."),
      ],
      points: ["Configure networks with environment variables.", "Combine contract, unit, fork and end-to-end tests."],
      check: [["A fork lets you test against:", ["Real deployed contracts at no cost", "Real funds", "Nothing", "A different language"], 0, "Great for integrations."]],
    }),
    topic({
      title: "Release discipline", slug: "release",
      blocks: [
        table("Before you release", ["Area", "Check"], [["Contracts", "Tests pass, coverage reviewed, independent review for anything holding value"], ["Frontend", "Network and address are right; errors are friendly; no secrets in the bundle"], ["Backend", "Rate limits, input validation, monitoring and backups in place"], ["Keys", "Deployment keys on hardware wallets; test keys separate"], ["Docs", "A README with set-up, environment variables and a security contact"], ["Users", "Clear risk disclosure; no promises of profit"]]),
        flow("A release path", ["Local tests", "Test network deployment", "Rehearsal with real users on the test network", "Review and fixes", "Small first launch with caps", "Monitor and respond", "Grow gradually"]),
        tip("Write the README as if you will hand the project to a stranger tomorrow. Often, that stranger is you in six months."),
        miniQuiz("rel2-mini", [["Why launch small first?", ["It looks modest", "It limits harm from anything the tests missed", "It lowers gas", "It avoids reviews"], 1, "Reduce the blast radius."]]),
      ],
      points: ["Release gradually: local, test network, rehearsal, review, small launch.", "Document set-up and keep secrets out of bundles."],
      check: [["A README should include:", ["Set-up and environment variables", "Private keys", "Passwords", "Nothing"], 0, "Help the next person."]],
    }),
  ],
  terms: [["Hardhat", "A development environment for contracts"], ["Fork", "A local copy of a real network"], ["Unit test", "A test of a small piece of logic"], ["End-to-end test", "A test of the whole user path"], ["Coverage", "How much code tests run"], ["Release discipline", "A careful path to production"]],
  practical: { title: "Practical: test the Notebook", intro: "In a Hardhat project.", steps: ["Add the test file and run it.", "Add a test for a note of exactly 280 bytes.", "Add a test for 281 bytes.", "Break the contract on purpose and watch a test fail."] },
  quiz: [
    ["Hardhat tests run on:", ["A local chain", "Your bank", "The main network", "A phone"], 0, "Fast and free."],
    ["Tests should cover:", ["Failures and boundaries", "Only success", "Nothing", "Only names"], 0, "Bugs live there."],
    ["A fork test uses:", ["A copy of a real network", "No network", "Real money", "A bank"], 0, "Real contracts, no cost."],
    ["Keys in config files belong in:", ["Environment variables", "The file itself", "A comment", "The repository"], 0, "Never commit keys."],
    ["End-to-end tests check:", ["The whole user path", "One function", "Gas", "Names"], 0, "From click to result."],
    ["A small first launch:", ["Limits harm", "Raises price", "Skips tests", "Hides code"], 0, "A gradual start limits any harm."],
    ["A README helps:", ["The next person", "Nobody", "Only bots", "Only auditors"], 0, "It helps whoever takes the project next."],
  ],
});

export default course({
  slug: "web3-development-javascript-nodejs", title: "Web3 Development with JavaScript & Node.js", tagline: "ethers, wallets, signed logins, indexers and tests: the JavaScript half of a Web3 application", level: "Intermediate", hours: 14,
  summary: "Build the JavaScript side of a Web3 application: handle amounts safely with BigInt, read the chain with ethers, send transactions carefully, connect to wallets, build a signed-message login, index events with Node.js and test everything with Hardhat. All Solidity listings were compiled and all JavaScript listings were syntax-checked. You run the code yourself on a local or test network.",
  modules: [M1, M2, M3, M4, M5, M6],
  capstone: capstone({
    title: "Final project: design a Web3 application end to end", summary: "Produce a professional application design and pass the final assessment.",
    intro: "You can now read, write, sign, index and test. In this final step you design a complete Web3 application, a notes feed with wallet login, a smart contract, a front end, a Node.js indexer and search API, covering architecture, flows, testing and operations. Then take the final assessment covering the whole course.",
    steps: ["Work through the **Final project: design a Web3 application end to end** lab.", "Check each flow for failure cases and for secrets.", "Take the final assessment below."], projectTitle: "A Web3 application design",
    quiz: [
      ["Token amounts in JavaScript should be:", ["BigInt in the smallest unit", "Floating point", "Strings of words", "Images"], 0, "No rounding errors."],
      ["A provider is used to:", ["Read from the chain", "Hold keys", "Mint tokens", "Hide data"], 0, "A read connection."],
      ["Events should be read:", ["In batches, remembering the last block", "All at once always", "Never", "Randomly"], 0, "Stay within limits."],
      ["Before sending a transaction you should:", ["Simulate and estimate gas", "Guess", "Share the key", "Skip checks"], 0, "Avoid paying for failures."],
      ["A stuck transaction can be replaced by:", ["The same nonce and a higher fee", "A lower fee", "Deleting the account", "Waiting forever"], 0, "Nonces enforce order."],
      ["A login nonce should be:", ["Single use", "Reusable", "Public", "Zero"], 0, "Stops replay."],
      ["The server should trust:", ["The address recovered from the signature", "The address the browser claims", "The page", "Nobody"], 0, "Proof of control."],
      ["Rules that move money belong in:", ["The smart contract", "The page", "The server", "CSS"], 0, "The final judge."],
      ["An indexer's steps should be:", ["Safe to repeat", "One-off", "Secret", "Random"], 0, "Idempotent."],
      ["Private keys should be stored in:", ["Environment variables or hardware wallets", "The repository", "The web page", "Comments"], 0, "Never in code."],
      ["A fork test uses:", ["A local copy of a real network", "Real funds", "No chain", "A bank"], 0, "Real contracts, no cost."],
      ["A first launch should be:", ["Small and monitored", "Everything at once", "Untested", "Secret"], 0, "Limit harm."],
    ],
  }),
  labs,
  skills: [{ id: SK, label: "Web3 JavaScript" }],
  badges: [
    { id: "unit-wise", title: "Unit-wise", description: "Handled amounts with BigInt and units.", when: { all: ["w1-bigint-units"] } },
    { id: "safe-sender", title: "Safe sender", description: "Understood the transaction lifecycle.", when: { all: ["w5-tx-lifecycle"] } },
    { id: "signature-smith", title: "Signature smith", description: "Judged wallet login designs.", when: { all: ["w7-wallet-auth"] } },
    { id: "app-architect", title: "App architect", description: "Designed a Web3 application end to end.", when: { all: ["cap-web3-app"] } },
  ],
  landing: {
    hero: { eyebrow: "Intermediate · Solidity compiled, JavaScript syntax-checked", title: "Web3 with JavaScript and Node.js: from first read to full application", subtitle: "Read the chain, send transactions with care, connect wallets, build a signed-message login, index events into a database and test it all. Every task is checked and explained.", level: "Intermediate", outcomeLine: "After this course you can build and test the JavaScript side of a Web3 application." },
    outcomes: [
      { icon: "sheet", title: "Handle money safely", text: "BigInt, units and fee calculations." },
      { icon: "docs", title: "Read the chain", text: "Providers, contracts and events with ethers." },
      { icon: "cloud", title: "Send transactions carefully", text: "Simulate, estimate, send, wait and recover." },
      { icon: "safety", title: "Sign in with a wallet", text: "Nonces, domains and verification." },
      { icon: "sort", title: "Build a backend", text: "Indexers, APIs and operations." },
      { icon: "word", title: "Test and release", text: "Hardhat, forks and a security checklist." },
    ],
    projects: [
      { title: "An error-handling plan", text: "What the user sees when things fail.", module: "reading-the-chain" },
      { title: "A wallet login design", text: "Flow, message and checks.", module: "wallets-and-signing" },
      { title: "A security checklist", text: "Keys, signing, server and release.", module: "testing-and-tooling" },
      { title: "A full application design", text: "Contract, login, indexer, API and tests.", module: "capstone" },
    ],
    tools: [{ icon: "docs", title: "Checked code listings", text: "Solidity compiled; JavaScript syntax-checked." }, { icon: "sheet", title: "Spreadsheet lab", text: "Fees, backoff and request load." }, { icon: "word", title: "Document editor", text: "Plans, designs and checklists." }],
    assessment: ["Finish the required labs in each module: they are checked automatically and explained when something is missing.", "Pass each module quiz (70% or more). Short tests inside the lessons give instant feedback.", "Complete the application design and the final assessment."],
    faq: [
      { q: "Does the platform run my JavaScript?", a: "No. The labs check your designs, calculations and plans. You run the code yourself with Node.js on a local or test network." },
      { q: "Which library does the course use?", a: "ethers version 6, which is widely used and well documented. The ideas apply to other libraries too." },
      { q: "Is it safe to try?", a: "Yes, if you only use local nodes and test networks with throw-away accounts. Never use a key that controls real funds." },
    ],
  },
  catalogue: {
    hours: "~14 hrs", weeks: "~5 weeks", pace: "3 hrs/wk", badge: "Web3 JavaScript",
    brief: "BigInt and units, ethers, transactions, wallets and signed logins, Node.js indexers and Hardhat testing.",
    learn: ["Safe amounts with BigInt and units", "Reading balances, calls and events with ethers", "Sending transactions with simulation, gas and error handling", "Wallet connection and signed-message login", "A repeat-safe Node.js indexer and API design", "Hardhat tests, forks and release discipline"],
    handsOn: "Design a Web3 notes application end to end: contract, login, writing, indexing, testing and operations.",
    outcome: "Build and test the JavaScript side of a Web3 application safely.",
  },
});
