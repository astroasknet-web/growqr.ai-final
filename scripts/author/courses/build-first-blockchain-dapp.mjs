import { bars, capstone, ck, classifyLab, code, course, def, example, explorer, flow, formula, list, miniQuiz, mistakes, module_, p, S, sheetLab, table, tip, topic, W, warn, wordLab } from "../kit.mjs";

const SK = "dapp";

const guestbook = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Guestbook {
    struct Entry {
        address author;
        string message;
        uint64 timestamp;
    }

    uint256 public constant MAX_LENGTH = 140;
    Entry[] private entries;

    event Posted(address indexed author, uint256 indexed id, string message);

    error EmptyMessage();
    error TooLong();

    function post(string calldata message) external {
        uint256 len = bytes(message).length;
        if (len == 0) revert EmptyMessage();
        if (len > MAX_LENGTH) revert TooLong();
        entries.push(Entry(msg.sender, message, uint64(block.timestamp)));
        emit Posted(msg.sender, entries.length - 1, message);
    }

    function count() external view returns (uint256) {
        return entries.length;
    }

    function latest(uint256 limit) external view returns (Entry[] memory result) {
        uint256 total = entries.length;
        if (limit > total) limit = total;
        if (limit > 50) limit = 50;
        result = new Entry[](limit);
        for (uint256 i = 0; i < limit; i++) {
            result[i] = entries[total - limit + i];
        }
    }
}`;

const gbTest = `const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Guestbook", function () {
  it("stores a message and emits an event", async function () {
    const [alice] = await ethers.getSigners();
    const book = await ethers.deployContract("Guestbook");

    await expect(book.connect(alice).post("Hello from Asha"))
      .to.emit(book, "Posted")
      .withArgs(alice.address, 0, "Hello from Asha");

    expect(await book.count()).to.equal(1n);
    const entries = await book.latest(10);
    expect(entries.length).to.equal(1);
    expect(entries[0].message).to.equal("Hello from Asha");
  });

  it("rejects empty and over-long messages", async function () {
    const book = await ethers.deployContract("Guestbook");
    await expect(book.post("")).to.be.revertedWithCustomError(book, "EmptyMessage");
    await expect(book.post("x".repeat(141))).to.be.revertedWithCustomError(book, "TooLong");
  });

  it("never returns more than 50 entries at once", async function () {
    const book = await ethers.deployContract("Guestbook");
    for (let i = 0; i < 60; i++) {
      await book.post("message " + i);
    }
    const entries = await book.latest(100);
    expect(entries.length).to.equal(50);
    expect(entries[49].message).to.equal("message 59");
  });
});`;

const hhConfig = `require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { SEPOLIA_RPC_URL, DEPLOYER_PRIVATE_KEY } = process.env;

const networks = { hardhat: {} };
if (SEPOLIA_RPC_URL && DEPLOYER_PRIVATE_KEY) {
  networks.sepolia = { url: SEPOLIA_RPC_URL, accounts: [DEPLOYER_PRIVATE_KEY] };
}

module.exports = {
  solidity: "0.8.24",
  networks,
};`;

const deploy = `const { ethers } = require("hardhat");

async function main() {
  const guestbook = await ethers.deployContract("Guestbook");
  await guestbook.waitForDeployment();
  console.log("Guestbook deployed to", await guestbook.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});`;

const appJs = `import { BrowserProvider, Contract } from "https://cdn.jsdelivr.net/npm/ethers@6.13.2/+esm";

const ADDRESS = "0xYourDeployedContractAddress";
const SEPOLIA_CHAIN_ID = 11155111n;
const ABI = [
  "function post(string message)",
  "function count() view returns (uint256)",
  "function latest(uint256 limit) view returns (tuple(address author, string message, uint64 timestamp)[])",
  "event Posted(address indexed author, uint256 indexed id, string message)",
];

const statusEl = document.getElementById("status");
const listEl = document.getElementById("entries");
let provider;
let guestbook;

function setStatus(text) {
  statusEl.textContent = text;
}

async function connect() {
  if (!window.ethereum) {
    setStatus("No wallet found. Install a wallet extension and reload.");
    return;
  }
  provider = new BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const network = await provider.getNetwork();
  if (network.chainId !== SEPOLIA_CHAIN_ID) {
    setStatus("Please switch your wallet to the Sepolia test network.");
    return;
  }
  const signer = await provider.getSigner();
  guestbook = new Contract(ADDRESS, ABI, signer);
  setStatus("Connected as " + (await signer.getAddress()));
  await refresh();
  guestbook.on("Posted", refresh);
}

async function refresh() {
  const entries = await guestbook.latest(20);
  listEl.replaceChildren();
  for (const entry of [...entries].reverse()) {
    const li = document.createElement("li");
    li.textContent = entry.author.slice(0, 8) + ": " + entry.message; // textContent, never innerHTML
    listEl.appendChild(li);
  }
}

async function post(message) {
  try {
    setStatus("Waiting for you to confirm in your wallet...");
    const tx = await guestbook.post(message);
    setStatus("Sent. Waiting for confirmation...");
    await tx.wait();
    setStatus("Posted!");
  } catch (error) {
    if (error.code === "ACTION_REJECTED") {
      setStatus("You cancelled the transaction.");
    } else {
      setStatus("Something went wrong: " + (error.shortMessage || error.message));
    }
  }
}

document.getElementById("connect").addEventListener("click", connect);
document.getElementById("form").addEventListener("submit", (event) => {
  event.preventDefault();
  post(document.getElementById("message").value.trim());
});`;

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>On-chain Guestbook</title>
</head>
<body>
  <h1>On-chain Guestbook</h1>
  <button id="connect">Connect wallet</button>
  <p id="status" role="status">Not connected.</p>
  <form id="form">
    <label for="message">Your message (up to 140 characters)</label>
    <input id="message" maxlength="140" required>
    <button type="submit">Post</button>
  </form>
  <ul id="entries"></ul>
  <script type="module" src="app.js"></script>
</body>
</html>`;

const labs = [
  classifyLab({
    id: "d1-layers", module: "plan-the-dapp", title: "Which layer does the job?", level: "beginner", minutes: 9, xp: 35, skills: [SK], required: true,
    objective: "Put each part of a dApp project in the right layer.", scenario: "A dApp has a contract, a front end, a wallet and developer tooling. Each task belongs in one of them.",
    steps: ["Read each task.", "Choose the layer.", "Press Check my work."],
    categories: [["contract", "Smart contract"], ["frontend", "Front end"], ["wallet", "Wallet"], ["tooling", "Developer tooling"]],
    items: [["Reject messages longer than 140 characters", "contract", "Rules that must always hold live on-chain."], ["Show a spinner while a transaction is pending", "frontend", "A user-interface concern."], ["Ask the user to approve and sign the transaction", "wallet", "Keys and signing stay in the wallet."], ["Run automated tests on a local chain", "tooling", "Hardhat does this."], ["Format an address as 0x12ab... for display", "frontend", "Presentation."], ["Store the author's address with each message", "contract", "On-chain data."], ["Deploy the contract to a test network", "tooling", "A script run by the developer."], ["Hold the private key and never show it to the page", "wallet", "The page asks; the wallet decides."]],
  }),
  wordLab({
    id: "d2-stories", module: "plan-the-dapp", title: "Write the user stories and scope", level: "intermediate", minutes: 15, xp: 55, skills: [SK], required: false,
    objective: "Define what the first version will and will not do.",
    scenario: "You will build an on-chain guestbook. Anyone with a wallet can post a short message, and everyone can read the latest messages. Write the scope.",
    steps: ["Add Heading 2 sections: User stories, In scope, Out of scope.", "Write at least three user stories in the form 'As a ..., I want ..., so that ...'.", "List in-scope and out-of-scope items in bullets.", "Keep it between 100 and 240 words."],
    checks: [
      ck("heads", "Three sections", "Use Heading 2.", "A clear scope.", W.heading(3, 2)),
      ck("order", "In order", "User stories, In scope, Out of scope.", "From who to what.", W.order(["User stories", "In scope", "Out of scope"])),
      ck("as", "At least three stories", "Write 'As a ... I want ...'.", "Stories keep focus on users.", W.pattern("as an? [\\s\\S]*as an? [\\s\\S]*as an? ", "three As a stories")),
      ck("lists", "Bullets for scope", "Use the bullet button.", "A scope is a list.", W.list(3, "ul")),
      ck("len", "Between 100 and 240 words", "Concise.", "Keep it short.", W.words(100, 240)),
    ],
    solution: "<h2>User stories</h2><p>As a visitor, I want to read the latest messages, so that I can see who has signed the guestbook.</p><p>As a wallet owner, I want to post a short message, so that I leave my mark on the chain.</p><p>As a reader, I want new messages to appear without reloading, so that the page feels alive.</p><h2>In scope</h2><ul><li>One contract with post and read functions and an event.</li><li>A single-page front end that connects a wallet and shows the latest 20 messages.</li><li>Deployment to a test network.</li></ul><h2>Out of scope</h2><ul><li>Deleting or editing messages, because the chain is permanent.</li><li>User profiles, images and likes.</li><li>Deploying to the main network.</li></ul>",
  }),
  classifyLab({
    id: "d3-contract-review", module: "write-and-test-the-contract", title: "Good design or a problem?", level: "intermediate", minutes: 10, xp: 40, skills: [SK], required: true,
    objective: "Judge design decisions in the Guestbook contract.", scenario: "A good contract limits what users can do so that it stays cheap and safe. Judge these decisions.",
    steps: ["Read each decision.", "Choose Good design or Problem.", "Press Check my work."],
    categories: [["good", "Good design"], ["problem", "Problem"]],
    items: [["A maximum message length of 140 bytes", "good", "Limits storage cost and abuse."], ["No limit on message length", "problem", "Anyone could store huge data at your users' expense."], ["The latest() function returns at most 50 entries", "good", "Bounded work for a read."], ["A function that returns every message ever posted in one call", "problem", "It will eventually become too large."], ["Emitting an event for each post", "good", "Apps can follow activity cheaply."], ["Letting the contract owner delete any message", "problem", "Adds central power to a system meant to be permanent; needs a clear policy."], ["Using custom errors for empty and too-long messages", "good", "Cheap and clear."], ["Storing the full text of images inside messages", "problem", "Too large; keep big data off-chain."]],
  }),
  sheetLab({
    id: "d4-post-cost", module: "write-and-test-the-contract", title: "What does a post cost?", level: "intermediate", minutes: 16, xp: 55, skills: [SK], required: false,
    objective: "Estimate the gas and cost of posting messages of different lengths.",
    scenario: "Storage is charged by 32-byte slots. A rough teaching model: a post costs 21,000 gas for the transaction, 22,100 gas for each new 32-byte slot of message text, and about 70,000 gas for the other fields and the event. Gas price is 30 gwei and 1 ETH is 250,000 rupees (illustrative).",
    steps: ["In C2 work out the slots needed: the message length divided by 32, rounded up with ROUNDUP.", "In D2 work out the gas: 21,000 plus slots times 22,100 plus 70,000.", "In E2 work out the cost in rupees: gas times the gas price in gwei (B8), divided by a billion, times the ETH price (B9).", "Fill down rows 2 to 5.", "In B11 find how many times more expensive the longest message is than the shortest: E5 divided by E2."],
    cells: { A1: "Message", B1: "Length (bytes)", C1: "Slots", D1: "Gas", E1: "Cost (rupees)", A2: "A greeting", B2: "20", A3: "A sentence", B3: "60", A4: "A tweet", B4: "140", A5: "A long note (if allowed)", B5: "1000", A8: "Gas price (gwei)", B8: "30", A9: "ETH price (rupees)", B9: "250000", A11: "Longest versus shortest (times)" }, view: { cols: 5, rows: 13 },
    checks: [
      ck("c2", "C2 is the slots for 20 bytes", "=ROUNDUP(B2/32,0)", "Round up to whole slots.", S.formula("C2", { fns: ["ROUNDUP"], equals: 1 })),
      ck("d2", "D2 is the gas for the greeting", "=21000+C2*22100+70000", "Add the three parts.", S.formula("D2", { equals: 113100 })),
      ck("e2", "E2 is the cost in rupees", "=D2*$B$8/1000000000*$B$9", "Gas times price, to ETH, to rupees.", S.formula("E2", { equals: 113100 * 30 / 1e9 * 250000 })),
      ck("d5", "D5 is the gas for the long note", "Fill down.", "32 slots is much more.", S.formula("D5", { equals: 21000 + 32 * 22100 + 70000 })),
      ck("b11", "B11 is the ratio", "=E5/E2", "Longest over shortest.", S.formula("B11", { equals: (21000 + 32 * 22100 + 70000) / 113100 })),
    ],
    solution: { cells: Object.assign({ B11: "=E5/E2" }, ...[2, 3, 4, 5].map((r) => ({ [`C${r}`]: `=ROUNDUP(B${r}/32,0)`, [`D${r}`]: `=21000+C${r}*22100+70000`, [`E${r}`]: `=D${r}*$B$8/1000000000*$B$9` }))) },
  }),
  classifyLab({
    id: "d5-environments", module: "deploy-to-a-test-network", title: "Local, testnet or mainnet?", level: "beginner", minutes: 9, xp: 35, skills: [SK], required: true,
    objective: "Choose the right environment for each development step.", scenario: "Developers use three kinds of environment. Matching the step to the environment avoids costly mistakes.",
    steps: ["Read each step.", "Choose the environment.", "Press Check my work."],
    categories: [["local", "Local development chain"], ["testnet", "Public test network"], ["mainnet", "Main network"]],
    items: [["Running hundreds of automated tests in seconds", "local", "Instant blocks and free fake ETH."], ["Letting a friend try your app with a wallet and free test ETH", "testnet", "Realistic and costs nothing."], ["Launching the finished, audited product for real users", "mainnet", "Real value; only when ready."], ["Quickly trying a change to the contract", "local", "Fast feedback."], ["Checking how the wallet and your front end behave on a real network", "testnet", "Real tools, fake money."], ["Anything that involves real money", "mainnet", "Be sure first."], ["Time-travelling to test a deadline", "local", "Only possible on a local chain."], ["Verifying the contract on an explorer to practise", "testnet", "Same process as mainnet."]],
  }),
  wordLab({
    id: "d6-secrets", module: "deploy-to-a-test-network", title: "Write your secrets rules", level: "intermediate", minutes: 14, xp: 50, skills: [SK], required: false,
    objective: "Set rules for handling private keys and API URLs in a project.",
    scenario: "Your project needs a deployer private key and an RPC URL with an API key. Write the rules you will follow to keep them safe.",
    steps: ["Write a bulleted list of at least five rules.", "Mention a .env file and .gitignore.", "Say that the deployer key must hold only test funds and be separate from your main wallet.", "Say what to do if a key leaks.", "Keep it between 80 and 200 words."],
    checks: [
      ck("list", "Five rules", "Use the bullet button.", "A checklist of rules.", W.list(5, "ul")),
      ck("env", "Mentions .env and .gitignore", "Include both.", "Keep secrets out of git.", W.pattern("\\.env[\\s\\S]*gitignore|gitignore[\\s\\S]*\\.env", ".env and .gitignore")),
      ck("test", "Test funds only", "Mention test funds or a separate wallet.", "Limit the harm of a leak.", W.pattern("separate|test funds|test-only|only test|dedicated", "a separate, test-only key")),
      ck("leak", "Says what to do on a leak", "Mention rotate, revoke or move funds.", "Plan for failure.", W.pattern("rotate|revoke|replace|move funds|move the funds|new key", "what to do on a leak")),
      ck("len", "Between 80 and 200 words", "Concise.", "Rules should be short.", W.words(80, 200)),
    ],
    solution: "<ul><li>Keep the private key and the RPC URL in a .env file and never in the source code.</li><li>Add .env to .gitignore before the first commit, and check the repository history for accidental commits.</li><li>Use a separate deployer wallet that holds only test funds, never my main wallet or its recovery phrase.</li><li>Use a different key for the main network, stored in a hardware wallet or a secrets manager.</li><li>Never paste a key into a chat, an issue or a screenshot.</li><li>If a key leaks, rotate it immediately by creating a new key, move any funds and revoke the exposed API key.</li></ul>",
  }),
  classifyLab({
    id: "d7-front-end-code", module: "connect-the-front-end", title: "What does this front-end line do?", level: "intermediate", minutes: 10, xp: 40, skills: [SK], required: true,
    objective: "Read the ethers code in the front end and say what each line is for.", scenario: "The front end uses a provider to read, a signer to send transactions and a contract object to call functions.",
    steps: ["Read each line.", "Choose its purpose.", "Press Check my work."],
    categories: [["provider", "Connects to the wallet or network"], ["signer", "Represents the account that signs"], ["contract", "Creates a handle for calling the contract"], ["read", "Reads data (free call)"], ["write", "Sends a transaction"]],
    items: [["provider = new BrowserProvider(window.ethereum);", "provider", "Wraps the wallet's connection."], ["const signer = await provider.getSigner();", "signer", "Gets the connected account."], ["guestbook = new Contract(ADDRESS, ABI, signer);", "contract", "A typed handle for the contract."], ["const entries = await guestbook.latest(20);", "read", "A view function, no gas."], ["const tx = await guestbook.post(message);", "write", "Asks the wallet to sign and send."], ["await provider.send(\"eth_requestAccounts\", []);", "provider", "Asks the wallet to connect."], ["const total = await guestbook.count();", "read", "A free read."], ["await tx.wait();", "write", "Waits for the transaction to be mined."]],
  }),
  wordLab({
    id: "d8-error-table", module: "connect-the-front-end", title: "Plan friendly error messages", level: "intermediate", minutes: 16, xp: 55, skills: [SK], required: false,
    objective: "Turn technical failures into clear messages and next steps for users.",
    scenario: "List the errors a Guestbook user may meet and what the app should tell them.",
    steps: ["Write a bulleted list of at least five situations.", "For each, write what happened and the message shown.", "Include: no wallet, wrong network, user rejected, empty or too-long message, and a network failure.", "Keep it between 100 and 240 words."],
    checks: [
      ck("list", "Five situations", "Use the bullet button.", "One bullet per case.", W.list(5, "ul")),
      ck("wallet", "No wallet case", "Mention no wallet.", "A common first failure.", W.pattern("no wallet|install a wallet|without a wallet", "the no-wallet case")),
      ck("network", "Wrong network case", "Mention wrong network or Sepolia.", "Users forget to switch.", W.pattern("wrong network|switch|sepolia", "the wrong-network case")),
      ck("reject", "User rejected case", "Mention rejected or cancelled.", "Not an error to blame them for.", W.pattern("reject|cancel", "the user-rejected case")),
      ck("len", "Between 100 and 240 words", "Concise.", "Keep it brief.", W.words(100, 240)),
    ],
    solution: "<ul><li>No wallet found: the page cannot see window.ethereum. Message: 'No wallet found. Install a wallet extension and reload the page.'</li><li>Wrong network: the wallet is on another chain. Message: 'Please switch your wallet to the Sepolia test network.' with a button to switch.</li><li>User rejected: they pressed cancel in the wallet. Message: 'You cancelled the transaction. Nothing was sent.' without treating it as a failure.</li><li>Empty or too-long message: the contract would revert. Message: 'Please enter between 1 and 140 characters', checked before sending.</li><li>Network failure or the node is slow: Message: 'We could not reach the network. Please try again in a moment.'</li></ul>",
  }),
  classifyLab({
    id: "d9-ux-states", module: "events-ux-and-states", title: "Which state is the app in?", level: "intermediate", minutes: 9, xp: 35, skills: [SK], required: true,
    objective: "Name the stage of a transaction from what has happened so far.", scenario: "Good dApps show clearly what is going on. Match each moment to a state.",
    steps: ["Read each moment.", "Choose the state.", "Press Check my work."],
    categories: [["idle", "Idle (nothing sent)"], ["signing", "Waiting for the wallet signature"], ["pending", "Sent and pending"], ["confirmed", "Confirmed"], ["failed", "Failed or cancelled"]],
    items: [["The user has not pressed Post yet", "idle", "Nothing has happened."], ["The wallet popup is open and the user has not yet decided", "signing", "The app waits for the wallet."], ["The transaction hash exists but no block contains it yet", "pending", "It is in the mempool."], ["The receipt shows status 1 and the Posted event", "confirmed", "It succeeded."], ["The user closed the wallet popup", "failed", "Cancelled; nothing sent."], ["The receipt shows status 0", "failed", "The transaction reverted."], ["tx.wait() is awaiting the receipt", "pending", "Waiting for a block."], ["Messages are loaded and the form is empty", "idle", "Ready."]],
  }),
  sheetLab({
    id: "d10-timeline", module: "events-ux-and-states", title: "How long should the user wait?", level: "intermediate", minutes: 14, xp: 50, skills: [SK], required: false,
    objective: "Plan how long loading states last and when to show a 'taking longer than usual' message.",
    scenario: "Blocks arrive every 12 seconds on average. After a transaction is sent it usually joins the next block or two. Plan the waiting messages. (Teaching figures.)",
    steps: ["In B6 work out the typical wait for inclusion: the average block time (B2) times the number of blocks expected (B3).", "In B7 work out the time after which to show 'taking longer than usual': twice the typical wait.", "In B8 work out the time for the required confirmations: confirmations (B4) times the block time.", "In B9 work out the polling checks needed if you check every 4 seconds (B5) until the confirmation time: round up B8 divided by B5.", "In B10 show Show hint when the elapsed time (B11) is above B7, else Keep waiting."],
    cells: { A1: "Input", B1: "Value", A2: "Average block time (seconds)", B2: "12", A3: "Blocks expected for inclusion", B3: "2", A4: "Confirmations wanted", B4: "3", A5: "Polling interval (seconds)", B5: "4", A6: "Typical wait for inclusion (seconds)", A7: "Show the long-wait hint after (seconds)", A8: "Time for the confirmations (seconds)", A9: "Polling checks needed", A10: "Message at the time below", A11: "Elapsed time so far (seconds)", B11: "50" }, view: { cols: 2, rows: 13 },
    checks: [
      ck("b6", "B6 is the typical wait", "=B2*B3", "Block time times blocks.", S.formula("B6", { equals: 24 })),
      ck("b7", "B7 is the hint threshold", "=B6*2", "Twice the typical wait.", S.formula("B7", { equals: 48 })),
      ck("b8", "B8 is the confirmation time", "=B4*B2", "Confirmations times the block time.", S.formula("B8", { equals: 36 })),
      ck("b9", "B9 is the polling checks", "=ROUNDUP(B8/B5,0)", "Round up to whole checks.", S.formula("B9", { fns: ["ROUNDUP"], equals: 9 })),
      ck("b10", "B10 is the message", "=IF(B11>B7,\"Show hint\",\"Keep waiting\")", "Compare with the threshold.", S.formula("B10", { fns: ["IF"], equals: "Show hint" })),
    ],
    solution: { cells: { B6: "=B2*B3", B7: "=B6*2", B8: "=B4*B2", B9: "=ROUNDUP(B8/B5,0)", B10: "=IF(B11>B7,\"Show hint\",\"Keep waiting\")" } },
  }),
  classifyLab({
    id: "d11-front-end-safety", module: "ship-and-secure", title: "Safe or unsafe front-end habit?", level: "intermediate", minutes: 10, xp: 40, skills: [SK], required: true,
    objective: "Spot habits that put users at risk in a dApp front end.", scenario: "A dApp page runs in the user's browser next to their wallet. Mistakes here can cost users money.",
    steps: ["Read each habit.", "Choose Safe or Unsafe.", "Press Check my work."],
    categories: [["safe", "Safe"], ["unsafe", "Unsafe"]],
    items: [["Showing a user's message with textContent", "safe", "Text is never run as code."], ["Putting a user's message into innerHTML", "unsafe", "Cross-site scripting: a message could run code."], ["Asking users to approve only the exact action and amount needed", "safe", "Least privilege."], ["Asking users to approve unlimited spending 'to save them a step'", "unsafe", "A compromised contract could drain them."], ["Checking the network and showing the address before sending", "safe", "Reduces mistakes."], ["Loading a script from an unknown site without a version or check", "unsafe", "A supply-chain risk."], ["Pinning dependency versions and reviewing updates", "safe", "Controls change."], ["Putting a private key in the front-end code", "unsafe", "Anyone can read it."]],
  }),
  wordLab({
    id: "d12-launch", module: "ship-and-secure", title: "Write the launch checklist", level: "intermediate", minutes: 16, xp: 55, skills: [SK], required: false,
    objective: "List what must be true before sharing your dApp with real users.",
    scenario: "The Guestbook works on the test network. Write a checklist for sharing it publicly.",
    steps: ["Add Heading 2 sections: Contract, Front end, Operations.", "Under each, write at least three numbered items.", "Mention verifying the contract, textContent or escaping, and a way to contact you.", "Keep it between 110 and 260 words."],
    checks: [
      ck("heads", "Three sections", "Use Heading 2.", "Group the list.", W.heading(3, 2)),
      ck("order", "In order", "Contract, Front end, Operations.", "From chain to people.", W.order(["Contract", "Front end", "Operations"])),
      ck("steps", "Numbered items", "Use the numbered list button.", "Numbered checks.", W.list(3, "ol")),
      ck("verify", "Mentions verifying the contract", "Include verify or verified.", "Transparency.", W.pattern("verif", "verifying the contract")),
      ck("xss", "Mentions safe rendering", "Include textContent, escape or sanitise.", "Messages are user content.", W.pattern("textContent|escape|sanitis|sanitiz", "safe rendering of messages")),
      ck("len", "Between 110 and 260 words", "Concise.", "Keep it short.", W.words(110, 260)),
    ],
    solution: "<h2>Contract</h2><ol><li>All tests pass, including the empty, too-long and limit cases.</li><li>The contract is deployed on the test network and its source is verified on the explorer.</li><li>I have documented the address, the compiler version and the constructor arguments.</li></ol><h2>Front end</h2><ol><li>Messages are shown with textContent so that no message can run code.</li><li>The page checks the network, shows clear states for every step and handles a cancelled transaction.</li><li>Dependencies are pinned to the versions I tested and the site is served over HTTPS.</li></ol><h2>Operations</h2><ol><li>The contract address and the explorer link are published on the page.</li><li>There is a way for users to contact me and report a problem.</li><li>I have a written plan for what I will do if a bug or abuse appears.</li></ol>",
  }),
  wordLab({
    id: "cap-dapp-plan", module: "capstone", title: "Final project: a dApp plan and README", level: "challenge", minutes: 35, xp: 160, skills: [SK], required: true,
    objective: "Plan your own small dApp from idea to launch, in the form of a README another developer could follow.",
    scenario: "Choose a small dApp idea of your own (a voting board, a tip jar, a ticket registry, a certificate verifier) and write its plan and README.",
    steps: ["Add a Heading 1 with the dApp's name.", "Add Heading 2 sections: What it does, Architecture, Contract design, Front end, Testing, Deploying, Security, Limits.", "Under Architecture mention wallet, RPC and contract.", "Under Contract design list at least four functions in bullets.", "Under Testing write a numbered list of at least four tests including a failing case.", "Under Limits list at least three honest limitations.", "Keep it between 280 and 560 words."],
    checks: [
      ck("t", "A title", "Use Heading 1.", "Name the dApp.", W.heading(1, 1)),
      ck("secs", "Eight sections", "Use Heading 2.", "A README has parts.", W.heading(8, 2)),
      ck("order", "In order", "What it does, Architecture, Contract design, Front end, Testing, Deploying, Security, Limits.", "From idea to limits.", W.order(["What it does", "Architecture", "Contract design", "Front end", "Testing", "Deploying", "Security", "Limits"])),
      ck("arch", "Architecture mentions wallet, RPC and contract", "Mention all three.", "The key layers.", W.pattern("wallet[\\s\\S]*(rpc|node)[\\s\\S]*contract|wallet[\\s\\S]*contract[\\s\\S]*(rpc|node)", "wallet, RPC and contract")),
      ck("fns", "Four functions", "Use the bullet button.", "List the contract's functions.", W.list(4, "ul")),
      ck("tests", "Four numbered tests", "Use the numbered list button.", "A test plan.", W.list(4, "ol")),
      ck("fail", "Includes a failing case", "Mention revert, fail or reject.", "Test the bad paths.", W.pattern("revert|fail|reject", "a failing case")),
      ck("len", "Between 280 and 560 words", "Two pages at most.", "READMEs must be readable.", W.words(280, 560)),
    ],
    solution: "<h1>CertCheck</h1><h2>What it does</h2><p>CertCheck lets a college publish the hash of each graduation certificate on a test network, and lets anyone check a certificate by uploading it and comparing its hash with the record.</p><h2>Architecture</h2><p>A static web page talks to the user's wallet to sign transactions, reads the chain through an RPC provider with a backup provider, and calls one smart contract that stores hashes and the issuer. The certificate files stay off-chain with the college.</p><h2>Contract design</h2><ul><li>issue(bytes32 certHash): only the college owner records a hash and emits Issued.</li><li>revoke(bytes32 certHash): only the college owner marks a hash as revoked and emits Revoked.</li><li>isValid(bytes32 certHash): a view function returning whether the hash is issued and not revoked.</li><li>issuedAt(bytes32 certHash): a view function returning the time of issue.</li></ul><h2>Front end</h2><p>The page hashes the uploaded file in the browser, calls isValid and shows Valid, Revoked or Not found. It checks the network, handles a missing wallet and shows messages with textContent.</p><h2>Testing</h2><ol><li>The owner issues a hash and isValid returns true.</li><li>A non-owner issuing a hash reverts with NotOwner.</li><li>Revoking a hash makes isValid return false.</li><li>Issuing the same hash twice reverts with AlreadyIssued.</li></ol><h2>Deploying</h2><p>Run the tests locally, deploy with Hardhat to Sepolia using a deployer key kept in a .env file that is listed in .gitignore, verify the source on the explorer, and publish the front end on a static host over HTTPS.</p><h2>Security</h2><p>Only hashes are stored on-chain, so no personal data is public. The owner key is a hardware wallet. Dependencies are pinned and messages are never inserted as HTML.</p><h2>Limits</h2><ul><li>If the college loses the owner key, nobody can issue or revoke certificates.</li><li>A hash proves a file is unchanged, not that its content was true.</li><li>The prototype lives on a test network and is not audited, so it must not be used for real certificates.</li></ul>",
  }),
];

const M1 = module_({
  slug: "plan-the-dapp", title: "Plan the dApp", hours: 2, level: "Foundations",
  summary: "Choosing a small idea, writing user stories and sketching the architecture before writing code.",
  outcome: "You can scope a small dApp, divide the work between contract, front end and tooling and set up a sensible project layout.",
  intro: "The fastest way to learn Web3 development is to build one small thing all the way through. In this course you will build an on-chain guestbook: a contract that stores short messages and a web page where anyone with a wallet can read and post them. Before writing code, we plan.",
  topics: [
    topic({
      title: "Choosing a good first project", slug: "first-project",
      blocks: [
        p("A good first dApp is small enough to finish in a weekend and complete enough to teach every layer. It has one contract with a handful of functions, one page, a wallet connection and an event."),
        table("Good first ideas and why", ["Idea", "What it teaches"], [["Guestbook (this course)", "Storing data, events, input limits, reading lists, rendering user content safely"], ["Tip jar", "Receiving and withdrawing ETH"], ["Voting board", "Mappings, one-vote rules and access control"], ["Certificate verifier", "Hashes on-chain and files off-chain"], ["Simple crowdfund", "Deadlines, refunds and state machines"]]),
        table("Signs of a project that is too big", ["Sign", "Fix"], [["Needs its own token and a market", "Leave tokens for later courses"], ["Needs random numbers or price feeds", "Choose an idea without outside data"], ["Needs user accounts and private data", "Keep private data off-chain; start without it"], ["Needs upgrades or governance", "Ship v1 immutable"]]),
        miniQuiz("first-mini", [["Why choose a small first project?", ["It is boring", "You can finish it and learn every layer", "It earns more", "Large projects are illegal"], 1, "Completing the loop teaches the most."]]),
        tip("Write down the one sentence that describes your dApp: 'Anyone can ___ so that ___.' If you cannot, narrow the idea."),
      ],
      points: ["Pick a small idea you can finish; complete the whole loop.", "Avoid tokens, outside data and upgrades in a first project."],
      check: [["A good first dApp needs:", ["A custom token and an exchange", "One contract and one page", "Machine learning", "Price oracles"], 1, "Keep it small."]],
    }),
    topic({
      title: "Stories, scope and architecture", slug: "stories-architecture",
      blocks: [
        table("User stories for the guestbook", ["As a", "I want", "So that"], [["Visitor", "to read the latest messages", "I can see who has signed"], ["Wallet owner", "to post a short message", "I leave my mark on the chain"], ["Reader", "new messages to appear without reloading", "the page feels alive"]]),
        flow("The architecture we will build", ["User's browser: plain HTML and JavaScript", "Wallet (signs transactions)", "RPC provider or the wallet's own connection", "Guestbook contract on a test network", "Events feed the page"]),
        table("Our tool choices", ["Need", "Tool", "Why"], [["Write, compile, test and deploy contracts", "Hardhat", "Mature, JavaScript-based, local test chain"], ["Talk to the chain from JavaScript", "ethers (version 6)", "A small, widely used library"], ["Wallet", "Any browser wallet that supports the standard window.ethereum interface", "Users bring their own"], ["Front end", "Plain HTML and a JavaScript module", "No build step; easy to understand"], ["Network", "Sepolia test network", "Free test ETH, realistic behaviour"]]),
        list("Project layout", ["contracts/ holds Guestbook.sol.", "test/ holds the tests.", "scripts/ holds the deploy script.", "frontend/ holds index.html and app.js.", "hardhat.config.js, package.json and .env (never committed)."]),
        miniQuiz("stories-mini", [["What belongs in the .env file?", ["The front-end code", "The deployer key and RPC URL, which are secrets", "The README", "The tests"], 1, "And .env must be in .gitignore."]]),
      ],
      points: ["Write user stories, then sketch contract, wallet, RPC and page.", "Use Hardhat, ethers, a plain page and a test network."],
      check: [["Which tool runs your tests on a local chain?", ["Hardhat", "A wallet", "A browser", "A bank"], 0, "A development environment."]],
    }),
    topic({
      title: "Setting up the tools", slug: "setup",
      blocks: [
        p("You need Node.js (a current long-term-support version), a code editor and a browser wallet. The commands below create a Hardhat project. They run on your own computer; this platform does not run code, so follow along locally."),
        list("Setup steps", ["Install Node.js and check with node --version.", "Create a folder and run npm init -y.", "Install Hardhat and its toolbox with npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox.", "Install dotenv with npm install dotenv for loading secrets.", "Run npx hardhat init and choose a JavaScript project.", "Delete the sample contract and create contracts/Guestbook.sol."], true),
        warn("Package versions and commands change. Follow the current Hardhat documentation if a step differs from what you see, and pin the versions you use in package.json."),
        table("What each package does", ["Package", "Job"], [["hardhat", "Compile, test, run a local chain and deploy"], ["@nomicfoundation/hardhat-toolbox", "A bundle with ethers, Chai matchers and more"], ["dotenv", "Loads the .env file into process.env"]]),
        miniQuiz("setup-mini", [["Why pin package versions?", ["To save disk space", "So your project builds the same way later", "Because npm requires it", "To hide code"], 1, "APIs change between versions."]]),
      ],
      points: ["Install Node.js, Hardhat and dotenv and start a JavaScript project.", "Pin versions and follow current documentation."],
      check: [["dotenv is used to:", ["Compile Solidity", "Load secrets from a .env file", "Send ETH", "Style the page"], 1, "Keeps secrets out of the code."]],
    }),
  ],
  terms: [["dApp", "A decentralised application"], ["Hardhat", "A development environment for Ethereum"], ["ethers", "A JavaScript library for Ethereum"], ["RPC", "How apps talk to nodes"], ["User story", "A short description of a need from a user's view"], [".env", "A file holding secrets for a project"]],
  practical: { title: "Practical: plan and set up", intro: "Do this on your own computer.", steps: ["Write your one-sentence description.", "Create the project folder and layout.", "Install Hardhat and dotenv.", "Add .env to .gitignore."] },
  quiz: [
    ["A good first dApp is:", ["Huge", "Small and complete", "Secret", "Token-based"], 1, "Finish the loop."],
    ["A user story has the form:", ["As a, I want, so that", "Yes or no", "Hash and nonce", "Gas and fee"], 0, "It keeps focus on users."],
    ["Hardhat is used to:", ["Compile, test and deploy contracts", "Hold your private key", "Store coins", "Mine blocks"], 0, "A developer toolkit."],
    ["ethers is a:", ["JavaScript library for talking to Ethereum", "Wallet", "Token", "Coin"], 0, "Used in tests and the front end."],
    ["Secrets go in:", ["The source code", ".env, ignored by git", "The README", "The page"], 1, "Never commit them."],
    ["The wallet's job is:", ["Hold keys and sign", "Compile code", "Store contracts", "Set fees"], 0, "The page asks; the wallet signs."],
    ["Pinning versions helps:", ["Reproducibility", "Speed", "Fees", "Colours"], 0, "Same build later."],
  ],
});

const M2 = module_({
  slug: "write-and-test-the-contract", title: "Write and test the contract", hours: 2.5, level: "Core skills",
  summary: "The Guestbook contract, line by line, with a test suite that checks the rules.",
  outcome: "You can explain every part of the Guestbook, write tests for happy and failing paths and estimate the cost of storing data.",
  intro: "The contract is the heart of the dApp: it holds the rules that nobody can bypass. We write it small, with limits, and test it before anything else is built on top.",
  topics: [
    topic({
      title: "The Guestbook contract", slug: "guestbook-contract",
      blocks: [
        code("solidity", guestbook, "contracts/Guestbook.sol"),
        table("Design decisions", ["Decision", "Reason"], [["Entry struct with author, message and timestamp", "Groups one post's data"], ["MAX_LENGTH of 140 bytes", "Limits storage cost and abuse"], ["Custom errors EmptyMessage and TooLong", "Cheap, clear failures"], ["Posted event with indexed author and id", "The front end can follow and filter posts"], ["latest(limit) returns at most 50 entries", "A read that cannot grow without limit"], ["entries is private and has no delete function", "Posts are permanent; there is no admin to abuse"]]),
        p("Notice what is missing: no owner, no editing and no deleting. That keeps the contract simple and trustworthy, but it also means a posted message stays forever, so the front end must be careful what it asks users to publish."),
        miniQuiz("gb-mini", [["Why does latest() cap the number of entries it returns?", ["To hide data", "So a read never becomes too large as the list grows", "To save storage", "Because mappings require it"], 1, "Bounded work."]]),
      ],
      points: ["The contract is small, bounded and without admin powers.", "Posted data is permanent."],
      check: [["A message of 141 bytes causes:", ["A success", "A revert with TooLong", "A fee refund", "A new event"], 1, "The limit is 140."]],
    }),
    topic({
      title: "Testing the contract", slug: "testing",
      blocks: [
        code("javascript", gbTest, "test/Guestbook.js"),
        table("What the tests cover", ["Test", "Why"], [["Posting stores a message and emits the event with the right arguments", "The happy path and the event the front end relies on"], ["Empty and over-long messages revert with the correct error", "The input limits"], ["latest() never returns more than 50 entries and returns the newest", "The bound and the ordering"]]),
        p("Run the tests with npx hardhat test. A passing result means these specific rules hold. It does not prove the contract is perfect, so add tests whenever you think of a new case, and especially for each bug you ever find."),
        list("More tests worth adding", ["A message of exactly 140 bytes succeeds.", "Two different accounts can both post.", "count() increases by one for each post.", "latest(0) returns an empty list.", "A multi-byte character message is limited by bytes, not characters."]),
        miniQuiz("gbtest-mini", [["Why test a message of exactly 140 bytes?", ["It is trivial", "Edge values are where off-by-one bugs hide", "It costs less", "Required by law"], 1, "Boundaries matter."]]),
      ],
      points: ["Tests check the happy path, the failures and the bounds.", "Add a test for every edge and every bug."],
      check: [["Tests prove:", ["The contract is perfect", "The tested rules hold", "The contract is audited", "Nothing"], 1, "Only what they check."]],
    }),
    topic({
      title: "What storing data costs", slug: "storage-cost",
      blocks: [
        p("Every message written to storage costs gas, and the cost grows with its length because storage is charged per 32-byte slot. A 20-byte greeting fits in one slot, a 140-byte message needs five, and a 1,000-byte note needs thirty-two."),
        formula("A rough cost model", "gas ≈ 21,000 + (slots × 22,100) + about 70,000 for the other fields and event", "Slots = message length ÷ 32, rounded up."),
        explorer({ id: "dapp-cost", title: "Cost of a post", intro: "Change the message length, gas price and ETH price to see the rough gas and cost. This is a teaching model, not a quote.", inputs: [{ id: "len", label: "Message length (bytes)", min: 1, max: 1000, step: 1, value: 140 }, { id: "gwei", label: "Gas price (gwei)", min: 1, max: 200, step: 1, value: 30 }, { id: "eth", label: "ETH price (rupees)", min: 50000, max: 500000, step: 10000, value: 250000 }], outputs: [{ label: "Slots used", expr: "ceil(len / 32)", unit: "n" }, { label: "Rough gas", expr: "21000 + ceil(len / 32) * 22100 + 70000", unit: "n" }, { label: "Rough cost (rupees)", expr: "(21000 + ceil(len / 32) * 22100 + 70000) * gwei / 1000000000 * eth", unit: "rs" }] }),
        warn("If you let users store unlimited text, you let them waste their own money, but you also let them fill the chain with junk that every node must carry. Always set limits."),
        miniQuiz("cost-mini", [["Why does a longer message cost more?", ["It is slower", "It needs more 32-byte storage slots", "It uses more events", "It has a higher gas price"], 1, "Storage is charged per slot."]]),
      ],
      points: ["Storage is charged per 32-byte slot.", "Set length limits to protect users and the chain."],
      check: [["A 140-byte message needs about:", ["1 slot", "5 slots", "32 slots", "0 slots"], 1, "140 divided by 32, rounded up."]],
    }),
  ],
  terms: [["Struct", "A custom record type"], ["Custom error", "A cheap named failure"], ["Indexed event argument", "A searchable log field"], ["Test suite", "A set of automated checks"], ["Edge case", "A value at the boundary of a rule"], ["Storage slot", "A 32-byte unit of contract storage"]],
  practical: { title: "Practical: run the tests", intro: "In your Hardhat project.", steps: ["Add Guestbook.sol and the test file.", "Run npx hardhat test.", "Add the boundary test for 140 bytes.", "Break a rule on purpose and watch a test fail."] },
  quiz: [
    ["MAX_LENGTH prevents:", ["Fees", "Unlimited, costly or abusive messages", "Events", "Reads"], 1, "A sensible bound."],
    ["The Posted event has indexed fields so that:", ["Apps can filter by author or id", "Gas is free", "Messages are encrypted", "Nobody can read"], 0, "Cheap searching."],
    ["There is no delete function because:", ["It was forgotten", "Posts are meant to be permanent and no admin is needed", "Solidity forbids it", "Gas is high"], 1, "A deliberate design."],
    ["latest() is limited to 50 so that:", ["Reads stay bounded", "Writes are cheaper", "Events fire", "Mapping works"], 0, "No unbounded growth."],
    ["A test should include:", ["Only happy paths", "Failures and boundaries too", "Nothing", "Only events"], 1, "Edges matter."],
    ["Storage cost depends on:", ["Slots used", "The wallet", "The browser", "The date"], 0, "Per 32-byte slot."],
    ["A passing test suite means:", ["The contract is safe", "The tested rules hold", "It is audited", "It is free"], 1, "No more than that."],
  ],
});

const M3 = module_({
  slug: "deploy-to-a-test-network", title: "Deploy to a test network", hours: 2, level: "Core skills",
  summary: "Local chain, configuration, secrets, the deployment script and verification.",
  outcome: "You can configure Hardhat for a test network, deploy safely and record the address and source for your front end.",
  intro: "Deployment turns your code into a live contract at an address. Done carelessly, it is also where private keys leak. This module shows the safe, repeatable way.",
  topics: [
    topic({
      title: "Configuration and secrets", slug: "config-secrets",
      blocks: [
        code("javascript", hhConfig, "hardhat.config.js"),
        p("The configuration reads the RPC URL and the deployer key from environment variables, so no secret appears in the code. Your .env file looks like this (with your own values), and it must be listed in .gitignore:"),
        code("text", "SEPOLIA_RPC_URL=https://your-rpc-provider.example/your-key\nDEPLOYER_PRIVATE_KEY=0xyour-test-only-private-key", ".env (never commit this file)"),
        list("Rules for secrets", ["Use a brand-new wallet with only test ETH for deployment.", "Never reuse a key that controls real funds.", "Add .env to .gitignore before your first commit.", "Never paste keys into chats, tickets or screenshots.", "If a key leaks, treat it as compromised: stop using it and move anything it held."], true),
        warn("Automated scanners watch public code repositories for private keys and drain them within minutes. A key committed even once should be considered lost."),
        miniQuiz("config-mini", [["Where should the deployer key be stored?", ["In hardhat.config.js", "In a .env file listed in .gitignore", "In the README", "In the contract"], 1, "Keep it out of the code and out of git."]]),
      ],
      points: ["Load secrets from environment variables; never commit them.", "Use a separate, test-only deployer wallet."],
      check: [["A leaked private key should be treated as:", ["Fine", "Compromised", "Encrypted", "Public information only"], 1, "Replace it."]],
    }),
    topic({
      title: "The deploy script", slug: "deploy-script",
      blocks: [
        code("javascript", deploy, "scripts/deploy.js"),
        table("Running it", ["Command", "What it does"], [["npx hardhat run scripts/deploy.js", "Deploys to Hardhat's in-memory network; good for a quick check"], ["npx hardhat node", "Starts a persistent local chain with funded test accounts"], ["npx hardhat run scripts/deploy.js --network localhost", "Deploys to that local chain"], ["npx hardhat run scripts/deploy.js --network sepolia", "Deploys to the Sepolia test network using your .env settings"]]),
        flow("Deploying to a public test network", ["Get test ETH from a faucet for the deployer address", "Run the deploy script on the test network", "Copy the printed address", "Verify the source code on the explorer", "Paste the address into the front end"]),
        tip("Write the deployed address into a small JSON file or the README each time. You will need it for the front end and for anyone who wants to check your work."),
        miniQuiz("deploy-mini", [["What does the deploy script print that the front end needs?", ["The private key", "The contract address", "The nonce", "The fee"], 1, "The page needs to know where the contract lives."]]),
      ],
      points: ["Deploy locally first, then to a test network with a faucet-funded key.", "Record the contract address."],
      check: [["The first place to run a deploy script is:", ["The main network", "A local chain", "A friend's wallet", "A bank"], 1, "Cheap and quick."]],
    }),
    topic({
      title: "Verifying the source", slug: "verify",
      blocks: [
        p("A deployed contract is just bytecode. To let people read what it does, you publish the source code and compiler settings to a block explorer, which recompiles it and checks that the result matches the deployed bytecode. This is called **verification**."),
        table("Why verify", ["Benefit", "Detail"], [["Trust", "Users can read exactly what the contract does"], ["Convenience", "Explorers show readable functions and let users call them"], ["Review", "Auditors and curious users can check your work"], ["Tools", "Wallets and indexers can decode events and errors"]]),
        p("Hardhat has a verification plugin that does this from the command line with the contract address and constructor arguments. Explorer websites also offer a form where you paste your source. Whichever you use, record the exact compiler version and settings."),
        mistakes(["Verifying with different compiler settings than you deployed with, which fails.", "Forgetting constructor arguments.", "Not verifying and then asking users to trust an unreadable contract."]),
        miniQuiz("verify-mini", [["What does a block explorer do when you verify a contract?", ["Changes the contract", "Recompiles your source and checks it matches the deployed bytecode", "Moves the funds", "Sets the fee"], 1, "It proves the source matches."]]),
      ],
      points: ["Verification publishes source that provably matches the deployed bytecode.", "Record compiler settings and constructor arguments."],
      check: [["Verified source lets users:", ["Edit the contract", "Read what the contract really does", "Mint tokens", "Skip gas"], 1, "Transparency."]],
    }),
  ],
  terms: [["Faucet", "A site giving free test ETH"], ["Deployer", "The account that deploys a contract"], ["Network config", "Settings for a chain in Hardhat"], ["Verification", "Publishing matching source code"], ["Environment variable", "A setting passed to a program from outside"], ["Private key", "The secret that controls an account"]],
  practical: { title: "Practical: deploy locally", intro: "On your own computer.", steps: ["Start npx hardhat node in one terminal.", "Deploy to localhost in another.", "Note the address.", "Call count() from the Hardhat console."] },
  quiz: [
    ["Secrets belong in:", ["Source code", ".env ignored by git", "README", "Contract"], 1, "Never committed."],
    ["A faucet gives:", ["Test ETH", "Real ETH", "Tokens", "Gas"], 0, "Free and worthless."],
    ["A local node is started with:", ["npx hardhat node", "npm test", "git push", "ls"], 0, "A persistent test chain."],
    ["Verification requires:", ["Source, compiler settings and constructor arguments", "A password", "A new wallet", "A fee"], 0, "They must match."],
    ["The deployer wallet should hold:", ["Your savings", "Only test funds", "Your recovery phrase", "Nothing"], 1, "Limit the harm."],
    ["After deployment you should record:", ["The address", "The wifi password", "Nothing", "The colour"], 0, "The front end needs it."],
    ["Deploying first to a local chain is:", ["Wasteful", "A cheap way to catch mistakes", "Illegal", "Slow"], 1, "Fast feedback."],
  ],
});

const M4 = module_({
  slug: "connect-the-front-end", title: "Connect the front end", hours: 2.5, level: "Applied skills",
  summary: "Connecting a wallet, reading the chain and sending a transaction from a web page.",
  outcome: "You can connect a wallet, check the network, read from and write to a contract with ethers and handle errors gracefully.",
  intro: "The page is where users meet your contract. It must connect to their wallet, make sure they are on the right network, read data for them and ask for their signature to write, always in clear language.",
  topics: [
    topic({
      title: "The page and the script", slug: "page-and-script",
      blocks: [
        p("The front end is two small files. The HTML defines the interface; the JavaScript module connects to the wallet and the contract. Study the page first: it has a connect button, a status line that screen readers announce, a form and a list for messages."),
        code("html", html, "frontend/index.html"),
        p("Notice the accessibility details: the form field has a label, the status line has role=\"status\" so changes are announced, and everything works with a keyboard."),
        miniQuiz("page-mini", [["Why give the status element role=\"status\"?", ["For colour", "So assistive technology announces changes", "To store data", "For speed"], 1, "Everyone should know what is happening."]]),
        tip("Open index.html through a simple local web server rather than by double-clicking it, because browsers restrict some features for local files. Hardhat is not needed for this; any static server works."),
      ],
      points: ["The page has a connect button, a status line, a form and a list.", "Use labels and live regions so it is accessible."],
      check: [["A label on the message input helps:", ["Only designers", "Screen reader users and everyone clicking the label", "Nobody", "Gas"], 1, "Basic accessibility."]],
    }),
    topic({
      title: "Connecting and reading", slug: "connect-read",
      blocks: [
        code("javascript", appJs, "frontend/app.js"),
        table("Walking through the script", ["Part", "What it does"], [["BrowserProvider(window.ethereum)", "Wraps the wallet's standard connection"], ["provider.send(\"eth_requestAccounts\", [])", "Asks the wallet to let the page see an account; the user must approve"], ["provider.getNetwork() and the chain id check", "Makes sure the wallet is on Sepolia (chain id 11155111) before doing anything"], ["getSigner()", "Gets the connected account, which can sign"], ["new Contract(ADDRESS, ABI, signer)", "A handle that turns JavaScript calls into encoded transactions and reads"], ["guestbook.latest(20)", "A read: free and instant"], ["guestbook.on(\"Posted\", refresh)", "Listens for the event and refreshes the list"], ["li.textContent = ...", "Shows the message as plain text, never as HTML"]]),
        def("Human-readable ABI", "ethers lets you list only the functions and events you need as readable strings instead of the full JSON ABI. That keeps the page small and the code easy to read."),
        warn("Pin the version of ethers in the import URL to the one you tested, and check the current documentation. APIs and CDN paths change over time."),
        miniQuiz("connect-mini", [["What does eth_requestAccounts do?", ["Sends ETH", "Asks the wallet to share an account with the page, after user approval", "Deploys a contract", "Signs a message"], 1, "Connecting requires consent."]]),
      ],
      points: ["Provider, signer and contract are the three objects of ethers.", "Always check the network and render text safely."],
      check: [["A provider in ethers is:", ["A signature", "A connection to the network or wallet", "A token", "A fee"], 1, "It is how the page reaches the chain."]],
    }),
    topic({
      title: "Writing and handling errors", slug: "write-errors",
      blocks: [
        p("Reading is free and instant; writing needs the user's approval and takes time. The post function in the script shows the complete life of a write: ask, wait for the wallet, wait for the network, report success or failure."),
        flow("A write from the user's point of view", ["Press Post", "Wallet pops up", "Approve or cancel", "Transaction sent", "Wait for a block", "See the new message"]),
        table("Errors and what to tell the user", ["What happened", "How it shows in code", "Message"], [["User cancelled in the wallet", "error.code is ACTION_REJECTED", "You cancelled the transaction. Nothing was sent."], ["Contract rejected the input", "A custom error such as TooLong in the error data", "Your message is too long. Please use 140 characters or fewer."], ["Wrong network", "Chain id check fails", "Please switch to the Sepolia test network."], ["Not enough ETH for gas", "Insufficient funds error", "You need a little test ETH to pay the network fee."], ["Network trouble", "Timeout or connection error", "We could not reach the network. Please try again."]]),
        mistakes(["Showing raw error text such as 'execution reverted' to ordinary users.", "Treating a cancelled transaction as a failure.", "Not disabling the Post button while a transaction is pending, which allows double posting."]),
        miniQuiz("write-mini", [["How should the page treat a user cancelling in the wallet?", ["As a bug to report", "As a normal choice, with a calm message", "By retrying automatically", "By crashing"], 1, "Cancelling is not an error."]]),
      ],
      points: ["A write has several steps; show each.", "Translate errors into plain language and treat cancel as normal."],
      check: [["To prevent double posting you should:", ["Hide the wallet", "Disable the button while a transaction is pending", "Increase gas", "Reload the page"], 1, "One action at a time."]],
    }),
  ],
  terms: [["Provider", "A connection to a node or wallet"], ["Signer", "An account that can sign"], ["Contract object", "A JavaScript handle for a deployed contract"], ["Chain id", "A number identifying a network"], ["ABI", "The interface description of a contract"], ["EIP-1193", "The standard wallet interface that window.ethereum follows"]],
  practical: { title: "Practical: run the page", intro: "Serve the frontend folder locally and use a test wallet on Sepolia.", steps: ["Put your deployed address into app.js.", "Open the page and connect.", "Post a message and watch the status text.", "Cancel one transaction and see the message."] },
  quiz: [
    ["The wallet's standard browser interface is exposed as:", ["window.ethereum", "window.bank", "document.wallet", "window.keys"], 0, "Wallets expose the standard EIP-1193 provider as window.ethereum."],
    ["A signer is needed to:", ["Read data", "Send transactions", "Load the page", "Change the ABI"], 1, "Writes need signing."],
    ["A chain id check helps:", ["Prevent actions on the wrong network", "Increase speed", "Hide errors", "Lower gas"], 0, "Do it before sending."],
    ["ACTION_REJECTED means:", ["The user cancelled", "The node failed", "The contract reverted", "Gas ran out"], 0, "Not an error to blame."],
    ["textContent is used to:", ["Show text safely", "Run scripts", "Style the page", "Sign messages"], 0, "Prevents script injection."],
    ["Reads from view functions:", ["Cost gas", "Are free", "Need a signature", "Change state"], 1, "Reading with a call needs no signature and costs the caller no gas."],
    ["A human-readable ABI is:", ["A list of function and event signatures as strings", "A secret", "A password", "A wallet"], 0, "Short and clear."],
  ],
});

const M5 = module_({
  slug: "events-ux-and-states", title: "Events, UX and states", hours: 2, level: "Applied skills",
  summary: "Making the page feel alive and trustworthy: live updates, clear states, formatting and accessibility.",
  outcome: "You can follow events for live updates, design clear states for each stage of a transaction and make the page accessible.",
  intro: "Blockchains are slow and sometimes unpredictable. The difference between a dApp people trust and one they abandon is how well it explains what is happening. This module is about those details.",
  topics: [
    topic({
      title: "Live updates with events", slug: "live-updates",
      blocks: [
        p("Instead of asking the chain again and again whether anything changed, the page can subscribe to the contract's Posted event. When anyone posts, the event arrives and the page refreshes. The same pattern powers dashboards, notifications and activity feeds across Web3."),
        table("Reading history versus listening", ["Approach", "Use when"], [["Call a view function such as latest()", "Showing the current state when the page loads"], ["Query past events", "Building a history from a known block number"], ["Subscribe to new events", "Keeping the page up to date while it is open"], ["Use an indexer service", "Large histories, search and analytics"]]),
        list("Good habits", ["Load the current list first, then listen for new events.", "Remember the page can miss events if the connection drops; refresh on reconnect.", "Avoid duplicates: use the event's id to skip entries you already show.", "Limit how many entries you hold in memory."], true),
        miniQuiz("events-mini", [["What should the page do first when it loads?", ["Wait for an event", "Load the current list, then subscribe to new events", "Delete the list", "Ask the user to refresh"], 1, "Current state first."]]),
      ],
      points: ["Load current state, then subscribe to events.", "Handle dropped connections and duplicates."],
      check: [["An indexer is useful for:", ["Tiny histories", "Large histories and search", "Signing", "Hashing"], 1, "Raw logs get unwieldy."]],
    }),
    topic({
      title: "Designing the states", slug: "states",
      blocks: [
        table("The states of a write", ["State", "What the user sees", "Next"], [["Idle", "A ready form", "User presses Post"], ["Signing", "A message: Waiting for you to confirm in your wallet", "Approve or cancel"], ["Pending", "A message: Sent. Waiting for confirmation, with a link to the explorer", "A block includes it"], ["Confirmed", "A message: Posted, and the new entry appears", "Idle"], ["Failed", "A clear reason and a button to try again", "Idle"], ["Cancelled", "A calm note that nothing was sent", "Idle"]]),
        explorer({ id: "dapp-wait", title: "How long should the spinner last?", intro: "Change the block time and the number of blocks expected to see how long the wait is, and when to show a 'taking longer than usual' hint.", inputs: [{ id: "bt", label: "Average block time (seconds)", min: 1, max: 30, step: 1, value: 12 }, { id: "nb", label: "Blocks expected before inclusion", min: 1, max: 5, step: 1, value: 2 }], outputs: [{ label: "Typical wait (seconds)", expr: "bt * nb", unit: "n" }, { label: "Show a hint after (seconds)", expr: "bt * nb * 2", unit: "n" }] }),
        tip("Always show the transaction hash with a link to a block explorer once it exists. It lets users check the status themselves and reduces support questions."),
        miniQuiz("states-mini", [["What should the page show if the transaction is pending for a long time?", ["Nothing", "A hint that it is taking longer and a link to the explorer", "An error that it failed", "A new form"], 1, "Honest, helpful waiting."]]),
      ],
      points: ["Design idle, signing, pending, confirmed, failed and cancelled states.", "Show the hash and an explorer link while pending."],
      check: [["Cancelled in the wallet is best shown as:", ["A crash", "A calm note that nothing was sent", "A fee", "A success"], 1, "No harm done."]],
    }),
    topic({
      title: "Formatting, accessibility and trust", slug: "formatting-accessibility",
      blocks: [
        table("Presenting blockchain data to humans", ["Data", "Show it as"], [["Address", "A short form such as 0x12ab…89ef, with a copy button and a link to the explorer"], ["Amount in wei", "ETH with sensible decimals; never raw wei"], ["Timestamp", "A local, readable date and 'x minutes ago'"], ["Transaction hash", "Short with a link"], ["Network", "A clear name and a warning if wrong"]]),
        list("Accessibility checklist", ["Every control is reachable and operable by keyboard.", "Status changes are announced with a live region.", "Text has enough contrast and does not rely on colour alone.", "Buttons say what they do: 'Post message', not just 'Submit'.", "Error messages say what to do next.", "The page works on a phone screen."]),
        warn("A dApp page asks users to trust it with their wallet. Never ask for more permission than needed, never auto-open wallet popups on page load, and show exactly what each request does."),
        miniQuiz("access-mini", [["Why show amounts in ETH rather than wei?", ["Wei is illegal", "Humans cannot read 18-digit numbers easily", "ETH is faster", "Wei is hidden"], 1, "Use human units."]]),
      ],
      points: ["Format addresses, amounts and times for humans.", "Make the page accessible and never ask for more permission than needed."],
      check: [["Which is a trust-building habit?", ["Auto-opening wallet popups", "Explaining each request before the wallet appears", "Hiding addresses", "Asking for unlimited approvals"], 1, "Be clear and minimal."]],
    }),
  ],
  terms: [["Event subscription", "Listening for new logs from a contract"], ["Indexer", "A service that organises on-chain events for queries"], ["Live region", "An element whose changes screen readers announce"], ["Pending state", "A transaction sent but not yet included"], ["Confirmation", "A block built on the one with your transaction"], ["Explorer link", "A link to view a transaction on a block explorer"]],
  practical: { title: "Practical: add the states", intro: "In your own copy of the front end.", steps: ["Add a pending message with a hash link.", "Disable the button while waiting.", "Add a hint after 48 seconds.", "Test with a very low gas price to see a long wait."] },
  quiz: [
    ["Events let the page:", ["Update without polling", "Mine blocks", "Hold keys", "Hide data"], 0, "Cheap live updates."],
    ["A live region:", ["Announces changes to assistive technology", "Is a map", "Is a database", "Stores data"], 0, "role=status."],
    ["Pending means:", ["Sent but not yet included", "Failed", "Finalised", "Cancelled"], 0, "In the mempool."],
    ["Raw wei should be:", ["Shown to users", "Converted to ETH for display", "Hidden always", "Doubled"], 1, "Human units."],
    ["Never ask for:", ["Only the permission needed", "Unlimited approvals without need", "Network checks", "A readable status"], 1, "Least privilege."],
    ["After pressing Post the button should:", ["Stay clickable", "Be disabled while pending", "Disappear", "Change colour only"], 1, "Avoid double posts."],
    ["Showing the transaction hash helps users:", ["Check status themselves", "Mine", "Sign", "Pay less"], 0, "Transparency."],
  ],
});

const M6 = module_({
  slug: "ship-and-secure", title: "Ship it and keep it secure", hours: 2, level: "Applied skills",
  summary: "Hosting the front end, protecting users from common attacks and keeping an eye on the contract after launch.",
  outcome: "You can host a static front end, protect it against cross-site scripting and phishing risks and write a launch and monitoring plan.",
  intro: "A dApp is only as safe as its weakest part. The contract may be perfect and the page can still hurt users. This final module covers hosting, front-end security and the habits that keep a live project healthy.",
  topics: [
    topic({
      title: "Hosting the front end", slug: "hosting",
      blocks: [
        table("Options for hosting a static page", ["Option", "Pros", "Cons"], [["A static hosting service", "Simple, fast, free tiers, HTTPS", "A company controls the host"], ["Your own web server", "Full control", "You maintain it"], ["IPFS with a gateway or name", "Content-addressed and hard to censor", "Updates need new addresses or name records; users may need a gateway"], ["Both: a normal site and an IPFS copy", "Redundancy", "Two things to keep in step"]]),
        list("Hosting checklist", ["Serve over HTTPS only.", "Put the contract address and network name on the page, with a link to the verified source.", "Pin your dependencies and avoid loading scripts from unknown sites.", "Keep the deployed files in version control so you can compare what is live.", "Set up a way for users to contact you."], true),
        warn("Phishing sites copy popular dApps and trick people into signing malicious transactions. Make your official address easy to find and tell users to bookmark it."),
        miniQuiz("hosting-mini", [["What should every dApp page be served over?", ["HTTP", "HTTPS", "FTP", "Email"], 1, "Encryption and integrity for the page."]]),
      ],
      points: ["Static hosting is simple; IPFS is more censorship-resistant but harder to update.", "Serve over HTTPS and publish the official address."],
      check: [["Phishing dApps are a risk because:", ["They are faster", "They copy real sites to trick users into signing harmful transactions", "They are free", "They use gas"], 1, "Users must check addresses."]],
    }),
    topic({
      title: "Front-end security", slug: "front-end-security",
      blocks: [
        p("Because the Guestbook shows messages written by strangers, it must treat every message as untrusted. If the page inserted messages as HTML, a malicious message such as an image tag with a script handler could run code in every visitor's browser, next to their wallet. This is **cross-site scripting (XSS)**."),
        table("Safe and unsafe", ["Unsafe", "Safe"], [["element.innerHTML = message", "element.textContent = message"], ["Building HTML strings from user text", "Creating elements with document.createElement and setting textContent"], ["Trusting data from the chain as safe", "Treating all on-chain text as hostile input"], ["Loading scripts from unknown URLs", "Self-host or pin and verify what you load"], ["Asking for unlimited token approvals", "Asking for the exact amount needed"]]),
        list("More habits", ["Content Security Policy headers where your host allows them.", "No private keys, ever, in front-end code.", "Show the exact action, contract and amount before asking for a signature.", "Warn users about approvals and let them revoke old ones.", "Keep dependencies updated and review changes."]),
        miniQuiz("xss-mini", [["Why is element.innerHTML = message dangerous for user messages?", ["It is slow", "A malicious message could run code in the visitor's browser", "It costs gas", "It changes the contract"], 1, "Cross-site scripting."]]),
      ],
      points: ["Treat on-chain text as hostile; render with textContent.", "Ask for the least permission and never put keys in the page."],
      check: [["The safe way to show user text is:", ["innerHTML", "textContent", "eval", "document.write"], 1, "Plain text only."]],
    }),
    topic({
      title: "After launch: monitor and maintain", slug: "operate",
      blocks: [
        table("What to watch", ["Thing", "How"], [["Contract activity", "Subscribe to events; alert on unusual spikes"], ["Page availability", "An uptime monitor that checks the page and the RPC provider"], ["Dependencies", "Security advisories for packages you use"], ["Abuse", "Spam or offensive messages in a permanent guestbook: decide in advance what the page will filter or hide"], ["User reports", "A contact address and a clear process"]]),
        p("A permanent, open contract makes moderation interesting. The chain keeps everything, but your page need not show everything. A common design is to let the page hide messages from a blocklist maintained off-chain, while the contract stays neutral. Decide your policy and publish it."),
        list("A launch-day routine", ["Test the live page from a clean browser profile.", "Post and read a message yourself on the test network.", "Check the explorer shows the verified source.", "Share the link with a few testers first.", "Write down what you will do if something goes wrong."], true),
        warn("This course teaches building on a test network. Anything involving real money needs far more testing, an independent audit and legal advice."),
        miniQuiz("operate-mini", [["How can a page deal with offensive messages stored on a permanent chain?", ["Delete them from the chain", "Choose not to display them, using a published policy", "Ignore all messages", "Shut down the chain"], 1, "The chain keeps data; the page chooses what to show."]]),
      ],
      points: ["Monitor events, uptime and dependencies; publish a moderation policy.", "Test the live page from a clean browser profile."],
      check: [["On a permanent chain, moderation usually means:", ["Deleting data", "Choosing what the page displays", "Rewriting history", "Banning the chain"], 1, "The page filters; the chain does not."]],
    }),
  ],
  terms: [["Static hosting", "Serving unchanging files"], ["HTTPS", "Encrypted web connections"], ["XSS", "Cross-site scripting"], ["Phishing", "A fake site that tricks users"], ["Content Security Policy", "Browser rules limiting what a page can load or run"], ["Monitoring", "Watching a system for problems"]],
  practical: { title: "Practical: threat model your page", intro: "Use your front end.", steps: ["List every piece of text from the chain.", "Check each is shown with textContent.", "List every permission you ask for.", "Write what a phisher would copy."] },
  quiz: [
    ["XSS stands for:", ["Cross-site scripting", "Extra secure signing", "External state storage", "Cross-state sharing"], 0, "Running attacker code in the page."],
    ["Safe text display uses:", ["textContent", "innerHTML", "eval", "document.write"], 0, "No HTML parsing."],
    ["Private keys in front-end code are:", ["Fine", "Visible to everyone", "Encrypted", "Needed"], 1, "Never do it."],
    ["HTTPS gives:", ["Encryption and integrity for the page", "Free gas", "Faster blocks", "Verified source"], 0, "Always use it."],
    ["Moderation on a chain means:", ["Rewriting history", "Choosing what your page shows", "Deleting blocks", "Changing fees"], 1, "The chain stays neutral."],
    ["A phishing site copies:", ["Your page to trick users", "Your contract's bytecode into your wallet", "Your gas", "Your blocks"], 0, "Publish and bookmark the official address."],
    ["Before a real-money launch you need:", ["Nothing more", "More testing, an audit and legal advice", "A new logo", "A faster server"], 1, "Real value, real responsibility."],
  ],
});

export default course({
  slug: "build-first-blockchain-dapp", title: "Build Your First Blockchain DApp", tagline: "Plan, write, test, deploy and ship an on-chain guestbook, with every code listing compiled and checked", level: "Intermediate", hours: 15,
  summary: "A guided build of a complete decentralised application: plan it, write and test the Guestbook contract, deploy it to a test network with Hardhat, connect a plain-JavaScript front end with ethers, design the transaction states and ship it safely. The Solidity compiles with solc and the JavaScript passes a syntax check; you run everything yourself on your own computer with a test wallet. Labs check your planning, reading, design and review work.",
  modules: [M1, M2, M3, M4, M5, M6],
  capstone: capstone({
    title: "Final project: a dApp plan and README", summary: "Plan your own small dApp as a README and pass the final assessment.",
    intro: "You have followed one dApp from idea to launch checklist. In this final step you do it for an idea of your own on paper: what it does, its architecture, contract functions, front end, tests, deployment, security and limits. Then take the final assessment covering the whole course.",
    steps: ["Work through the **Final project: a dApp plan and README** lab.", "If you wish, build it with the same tools on a test network.", "Take the final assessment below."], projectTitle: "A dApp plan and README",
    quiz: [
      ["A good first dApp is:", ["Small and complete", "Huge", "Token-based", "Secret"], 0, "Finish the whole loop."],
      ["A user story has the form:", ["As a, I want, so that", "Yes or no", "Hash and nonce", "Gas and fee"], 0, "Focus on users."],
      ["The Guestbook limits messages to 140 bytes to:", ["Limit cost and abuse", "Make it faster", "Hide data", "Avoid events"], 0, "Bounded storage."],
      ["Secrets belong in:", [".env ignored by git", "The source code", "The README", "The page"], 0, "Never committed."],
      ["Deploy first to:", ["A local chain, then a test network", "The main network", "A friend's wallet", "A bank"], 0, "Cheap mistakes first."],
      ["Verifying a contract means:", ["Publishing source that matches the bytecode", "Hiding it", "Changing it", "Paying a fee"], 0, "Transparency."],
      ["A signer in ethers is needed to:", ["Send transactions", "Read data", "Load the page", "Hash text"], 0, "Writes need signing."],
      ["A cancelled transaction should be shown as:", ["A calm note that nothing was sent", "A crash", "A fee", "A success"], 0, "Not an error."],
      ["The safe way to show chain text is:", ["textContent", "innerHTML", "eval", "document.write"], 0, "Prevents XSS."],
      ["Events let the page:", ["Update without polling", "Mine", "Hold keys", "Hide data"], 0, "Cheap live updates."],
      ["Moderation on a permanent chain means:", ["Choosing what your page shows", "Rewriting history", "Deleting blocks", "Banning the chain"], 0, "The chain stays neutral."],
      ["For real money you need:", ["More testing, an audit and legal advice", "Nothing more", "A new logo", "A faster page"], 0, "This course uses test networks."],
    ],
  }),
  labs,
  skills: [{ id: SK, label: "dApp development" }],
  badges: [
    { id: "layer-mapper", title: "Layer mapper", description: "Put each task in the right dApp layer.", when: { all: ["d1-layers"] } },
    { id: "contract-critic", title: "Contract critic", description: "Judged the Guestbook's design decisions.", when: { all: ["d3-contract-review"] } },
    { id: "safe-front-end", title: "Safe front end", description: "Recognised safe and unsafe front-end habits.", when: { all: ["d11-front-end-safety"] } },
    { id: "dapp-planner", title: "dApp planner", description: "Planned a dApp with a full README.", when: { all: ["cap-dapp-plan"] } },
  ],
  landing: {
    hero: { eyebrow: "Build · Code listings compiled and checked", title: "Build Your First DApp: from idea to launch checklist", subtitle: "Follow one complete project: an on-chain guestbook with a tested contract, a Hardhat deploy script and a wallet-connected web page. Plan, review, calculate costs and write the README, with every lab checked and explained.", level: "Intermediate", outcomeLine: "After this course you can plan, build and ship a small dApp on a test network and explain every layer." },
    outcomes: [
      { icon: "docs", title: "Plan the project", text: "User stories, scope and architecture." },
      { icon: "safety", title: "Write and test a contract", text: "Limits, events, custom errors and a test suite." },
      { icon: "cloud", title: "Deploy safely", text: "Local chain, test network, secrets and verification." },
      { icon: "web", title: "Connect a front end", text: "Wallet, provider, signer, reads, writes and errors." },
      { icon: "sheet", title: "Design the experience", text: "States, live events and accessibility." },
      { icon: "word", title: "Ship and secure it", text: "Hosting, XSS, phishing and monitoring." },
    ],
    projects: [
      { title: "A scoped plan", text: "User stories, in scope and out of scope.", module: "plan-the-dapp" },
      { title: "A cost model", text: "What a post costs at different lengths.", module: "write-and-test-the-contract" },
      { title: "A launch checklist", text: "Contract, front end and operations.", module: "ship-and-secure" },
      { title: "A dApp README", text: "Your own idea, planned end to end.", module: "capstone" },
    ],
    tools: [{ icon: "docs", title: "Code listings", text: "Solidity, Hardhat and front-end code you can copy." }, { icon: "sheet", title: "Spreadsheet lab", text: "Gas, cost and waiting-time calculations." }, { icon: "word", title: "Document editor", text: "For plans, checklists and READMEs." }],
    assessment: ["Finish the required labs in each module: they are checked automatically and explained when something is missing.", "Pass each module quiz (70% or more). Short tests inside the lessons give instant feedback.", "Complete the dApp plan and the final assessment."],
    faq: [
      { q: "Does this platform run my code?", a: "No. You write and run the code on your own computer with free tools. The platform's labs check your plans, reviews, calculations and documents." },
      { q: "Do I need real money?", a: "No. Everything uses a local chain and the Sepolia test network with free test ETH." },
      { q: "Do I need to know JavaScript?", a: "Basic JavaScript helps, and the course explains each line of the code it shows." },
    ],
  },
  catalogue: {
    hours: "~15 hrs", weeks: "~5 weeks", pace: "3 hrs/wk", badge: "DApp Builder",
    brief: "Plan, write, test, deploy and ship an on-chain guestbook with Hardhat, ethers and a plain JavaScript front end.",
    learn: ["Scoping a small dApp and choosing tools", "Writing and testing a bounded Solidity contract", "Deploying with Hardhat, managing secrets and verifying source", "Connecting a wallet and reading and writing with ethers", "Transaction states, live events and accessibility", "Hosting, XSS, phishing risks and a launch plan"],
    handsOn: "Plan your own small dApp as a complete README with architecture, contract functions, tests, deployment and limits.",
    outcome: "Plan, build and ship a small dApp on a test network and explain every layer.",
  },
});
