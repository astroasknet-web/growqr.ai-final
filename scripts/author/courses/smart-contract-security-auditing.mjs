import { capstone, ck, classifyLab, code, course, def, explorer, flow, list, miniQuiz, mistakes, module_, p, S, sheetLab, table, tip, topic, W, warn, wordLab } from "../kit.mjs";

const SK = "contract-security";

const noAccess = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// FOR LEARNING ONLY: anyone can take over this contract.
contract BrokenWallet {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function setOwner(address newOwner) external { // missing access check
        owner = newOwner;
    }

    function withdrawAll() external {
        require(msg.sender == owner, "Not owner");
        (bool ok, ) = msg.sender.call{value: address(this).balance}("");
        require(ok, "Failed");
    }

    receive() external payable {}
}

contract FixedWallet {
    address public owner;

    error NotOwner();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setOwner(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    function withdrawAll() external onlyOwner {
        (bool ok, ) = msg.sender.call{value: address(this).balance}("");
        require(ok, "Failed");
    }

    receive() external payable {}
}`;

const reent = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// FOR LEARNING ONLY: the balance is zeroed AFTER the money is sent.
contract VulnerableBank {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "Nothing to withdraw");
        (bool ok, ) = msg.sender.call{value: amount}(""); // interaction first: dangerous
        require(ok, "Failed");
        balances[msg.sender] = 0;                          // effect last: too late
    }
}

interface IBank {
    function deposit() external payable;
    function withdraw() external;
}

// What an attacker would deploy: its receive() calls withdraw() again before the balance is cleared.
contract Attacker {
    IBank public immutable bank;
    uint256 public amount;

    constructor(address bankAddress) {
        bank = IBank(bankAddress);
    }

    function attack() external payable {
        amount = msg.value;
        bank.deposit{value: msg.value}();
        bank.withdraw();
    }

    receive() external payable {
        if (address(bank).balance >= amount) {
            bank.withdraw();
        }
    }
}`;

const reentFixed = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SaferBank is ReentrancyGuard {
    mapping(address => uint256) public balances;

    error NothingToWithdraw();
    error TransferFailed();

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external nonReentrant {
        uint256 amount = balances[msg.sender];
        if (amount == 0) revert NothingToWithdraw();
        balances[msg.sender] = 0;                         // 1. effects first
        (bool ok, ) = msg.sender.call{value: amount}(""); // 2. interaction last
        if (!ok) revert TransferFailed();
    }
}`;

const txOrigin = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// FOR LEARNING ONLY: tx.origin is the person who started the transaction, not the direct caller.
contract PhishableWallet {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    receive() external payable {}

    function transferTo(address payable to, uint256 amount) external {
        require(tx.origin == owner, "Not owner"); // wrong: a malicious contract the owner calls passes this
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "Failed");
    }
}

contract Phisher {
    PhishableWallet public immutable target;
    address payable public immutable thief;

    constructor(PhishableWallet t) {
        target = t;
        thief = payable(msg.sender);
    }

    // The owner is tricked into calling this 'free airdrop' function.
    function claimAirdrop() external {
        target.transferTo(thief, address(target).balance);
    }
}

contract SafeWallet {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    receive() external payable {}

    function transferTo(address payable to, uint256 amount) external {
        require(msg.sender == owner, "Not owner"); // correct: the direct caller
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "Failed");
    }
}`;

const randomness = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// FOR LEARNING ONLY: block values are visible and partly controllable, so this is not random.
contract WeakLottery {
    address[] public players;

    function enter() external payable {
        require(msg.value == 0.01 ether, "Wrong fee");
        players.push(msg.sender);
    }

    function pickWinner() external {
        uint256 index = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, players.length))) % players.length;
        (bool ok, ) = players[index].call{value: address(this).balance}("");
        require(ok, "Failed");
        delete players;
    }
}`;

const dos = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// FOR LEARNING ONLY: one rejecting recipient blocks everyone, and the loop can grow beyond the block gas limit.
contract PushPayouts {
    address[] public winners;

    function addWinner(address w) external {
        winners.push(w);
    }

    function payAll() external payable {
        uint256 share = msg.value / winners.length;
        for (uint256 i = 0; i < winners.length; i++) {
            (bool ok, ) = winners[i].call{value: share}("");
            require(ok, "A payout failed"); // one failure reverts all
        }
    }
}

contract PullPayouts {
    mapping(address => uint256) public owed;
    address[] public winners;

    function addWinner(address w) external {
        winners.push(w);
    }

    function fund() external payable {
        uint256 share = msg.value / winners.length;
        for (uint256 i = 0; i < winners.length; i++) {
            owed[winners[i]] += share; // only bookkeeping, no external calls
        }
    }

    function claim() external {
        uint256 amount = owed[msg.sender];
        require(amount > 0, "Nothing owed");
        owed[msg.sender] = 0;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "Failed");
    }
}`;

const oracle = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPool {
    function reserveA() external view returns (uint256);
    function reserveB() external view returns (uint256);
}

interface IFeed {
    function latestAnswer() external view returns (int256 price, uint256 updatedAt);
}

// FOR LEARNING ONLY: a spot price from a pool can be pushed around inside one transaction by a flash loan.
contract SpotPriceLender {
    IPool public immutable pool;

    constructor(IPool p) {
        pool = p;
    }

    function priceOfA() public view returns (uint256) {
        return (pool.reserveB() * 1e18) / pool.reserveA(); // manipulable
    }
}

// Better: use an independent feed, and refuse stale or invalid data.
contract SaferLender {
    IFeed public immutable feed;
    uint256 public constant MAX_AGE = 1 hours;

    error BadPrice();
    error StalePrice();

    constructor(IFeed f) {
        feed = f;
    }

    function priceOfA() public view returns (uint256) {
        (int256 price, uint256 updatedAt) = feed.latestAnswer();
        if (price <= 0) revert BadPrice();
        if (block.timestamp - updatedAt > MAX_AGE) revert StalePrice();
        return uint256(price);
    }
}`;

const rounding = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Integer division rounds down. Always round in the direction that protects the protocol.
contract ShareMath {
    // Shares given to a depositor: round DOWN so the depositor never gets more than they paid for.
    function sharesFor(uint256 assets, uint256 totalAssets, uint256 totalShares) public pure returns (uint256) {
        return (assets * totalShares) / totalAssets;
    }

    // Assets owed to a redeemer: also round DOWN so the vault never pays out more than it should.
    function assetsFor(uint256 shares, uint256 totalAssets, uint256 totalShares) public pure returns (uint256) {
        return (shares * totalAssets) / totalShares;
    }

    // Anything that must cover a debt rounds UP.
    function ceilDiv(uint256 a, uint256 b) public pure returns (uint256) {
        return a == 0 ? 0 : (a - 1) / b + 1;
    }
}`;

const pausable = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Defence in depth: validated inputs, a pause switch, a reentrancy guard and a deposit cap.
contract GuardedVault is Ownable, Pausable, ReentrancyGuard {
    mapping(address => uint256) public balances;
    uint256 public totalDeposits;
    uint256 public immutable cap;

    error ZeroAmount();
    error CapExceeded();
    error Insufficient();
    error TransferFailed();

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    constructor(uint256 depositCap) Ownable(msg.sender) {
        cap = depositCap;
    }

    function deposit() external payable whenNotPaused {
        if (msg.value == 0) revert ZeroAmount();
        if (totalDeposits + msg.value > cap) revert CapExceeded();
        balances[msg.sender] += msg.value;
        totalDeposits += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (balances[msg.sender] < amount) revert Insufficient();
        balances[msg.sender] -= amount;
        totalDeposits -= amount;
        emit Withdrawn(msg.sender, amount);
        (bool ok, ) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}`;

const labs = [
  classifyLab({
    id: "s1-bug-types", module: "the-threat-landscape", title: "Name the vulnerability", level: "intermediate", minutes: 12, xp: 45, skills: [SK], required: true,
    objective: "Recognise the main classes of smart contract bug from a description.", scenario: "Auditors keep a mental catalogue of bug classes. Match each description to its class.",
    steps: ["Read each description.", "Choose the class.", "Press Check my work."],
    categories: [["access", "Missing access control"], ["reentrancy", "Reentrancy"], ["math", "Arithmetic or rounding"], ["oracle", "Oracle or price manipulation"], ["dos", "Denial of service"], ["origin", "tx.origin misuse"]],
    items: [["Anyone can call setOwner and become the owner", "access", "No permission check on a powerful function."], ["The balance is cleared after the ETH is sent, so a receive function calls withdraw again", "reentrancy", "State updated too late."], ["A vault mints zero shares for a small deposit because division rounds down", "math", "Integer division truncates."], ["A lender reads a price from a pool that a flash loan can distort", "oracle", "Spot prices are manipulable."], ["One recipient that always reverts blocks a loop paying all winners", "dos", "A single failure blocks everyone."], ["A wallet checks tx.origin and a phishing contract the owner calls drains it", "origin", "The origin is the human, not the direct caller."], ["An initialiser can be called again by anyone after deployment", "access", "Missing protection on setup."], ["An array loop grows until the transaction runs out of gas", "dos", "Unbounded loops."]],
  }),
  wordLab({
    id: "s2-incident", module: "the-threat-landscape", title: "Write a plain-English incident summary", level: "intermediate", minutes: 16, xp: 55, skills: [SK], required: false,
    objective: "Explain a vulnerability, its impact and the lesson in a way a non-expert can follow.",
    scenario: "A wallet contract had an unprotected setOwner function. An attacker called it, became the owner and withdrew all funds. Write a short summary for the community.",
    steps: ["Add Heading 2 sections: What happened, Why it happened, What users should do, Lessons.", "Under Lessons write a bulleted list of at least three points.", "Mention access control and a test or review that would have caught it.", "Keep it between 100 and 240 words."],
    checks: [
      ck("heads", "Four sections", "Use Heading 2.", "A clear summary.", W.heading(4, 2)),
      ck("order", "In order", "What happened, Why it happened, What users should do, Lessons.", "From events to lessons.", W.order(["What happened", "Why it happened", "What users should do", "Lessons"])),
      ck("lessons", "Three lessons", "Use the bullet button.", "Short lessons.", W.list(3, "ul")),
      ck("access", "Mentions access control", "Mention access control or permission check.", "The root cause.", W.pattern("access control|permission|onlyOwner|authori[sz]", "access control")),
      ck("test", "Mentions a test or review", "Mention a test, review or audit.", "How it could have been caught.", W.pattern("test|review|audit", "a test or review")),
      ck("len", "Between 100 and 240 words", "Concise.", "Keep it readable.", W.words(100, 240)),
    ],
    solution: "<h2>What happened</h2><p>An attacker called the setOwner function of a wallet contract, made themselves the owner and then withdrew all the funds held there.</p><h2>Why it happened</h2><p>The setOwner function had no access control. Any address could call it, although it changes who controls the money. The withdraw function checked the owner correctly, but that check was meaningless once the owner could be replaced by anyone.</p><h2>What users should do</h2><p>Stop depositing into the contract and move any remaining funds elsewhere if a safe path exists. Watch the team's official channels for updates and ignore messages from strangers offering recovery help.</p><h2>Lessons</h2><ul><li>Every function that changes ownership or settings needs an explicit permission check such as onlyOwner.</li><li>A unit test that tries each privileged function from a stranger's account would have failed immediately.</li><li>A short independent review or audit of the permissions would have found the gap before launch.</li></ul>",
  }),
  classifyLab({
    id: "s3-cei-order", module: "reentrancy-and-state", title: "Checks, effects or interactions?", level: "intermediate", minutes: 10, xp: 40, skills: [SK], required: true,
    objective: "Sort statements into the three stages of checks-effects-interactions.", scenario: "The safe order inside a function is: first checks, then effects, then interactions. Classify each statement.",
    steps: ["Read each statement.", "Choose its stage.", "Press Check my work."],
    categories: [["checks", "Check"], ["effects", "Effect"], ["interactions", "Interaction"]],
    items: [["require(balances[msg.sender] >= amount)", "checks", "A validation."], ["balances[msg.sender] -= amount", "effects", "A change to this contract's state."], ["msg.sender.call{value: amount}(\"\")", "interactions", "Control passes to another account."], ["if (amount == 0) revert ZeroAmount()", "checks", "Input validation."], ["totalDeposits -= amount", "effects", "State update."], ["token.transfer(to, amount)", "interactions", "An external call."], ["emit Withdrawn(msg.sender, amount)", "effects", "Logging before the external call keeps state and events consistent."], ["require(!paused)", "checks", "A precondition."]],
  }),
  sheetLab({
    id: "s4-drain", module: "reentrancy-and-state", title: "How fast could a reentrancy drain a vault?", level: "advanced", minutes: 16, xp: 60, skills: [SK], required: false,
    objective: "Model a reentrancy attack to see why it is so serious. (A teaching model.)",
    scenario: "A vulnerable vault holds other people's money. The attacker deposits a small amount and recursion lets them withdraw it many times per transaction, limited by gas.",
    steps: ["In B7 work out what is withdrawn per transaction: the smaller of attacker deposit times recursion depth, and all funds in the vault (including the attacker's deposit).", "In B8 work out how many transactions drain the vault: total funds divided by B7, rounded up.", "In B9 work out the fees paid: transactions times the fee per transaction.", "In B10 work out the attacker's profit: the funds of other people (B2) minus the fees.", "In B11 show Exploit pays if the profit is above zero, else Exploit fails."],
    cells: { A1: "Input", B1: "Value", A2: "Other people's funds in the vault (ETH)", B2: "1000", A3: "Attacker deposit (ETH)", B3: "1", A4: "Reentrant calls per transaction", B4: "40", A5: "Fee per transaction (ETH)", B5: "0.5", A7: "Withdrawn per transaction (ETH)", A8: "Transactions to drain", A9: "Fees paid (ETH)", A10: "Attacker profit (ETH)", A11: "Verdict" }, view: { cols: 2, rows: 13 },
    checks: [
      ck("b7", "B7 is the withdrawal per transaction", "=MIN(B3*B4,B2+B3)", "The smaller of the two amounts.", S.formula("B7", { fns: ["MIN"], equals: 40 })),
      ck("b8", "B8 is the transactions needed", "=ROUNDUP((B2+B3)/B7,0)", "Round up: a partial transaction is still a transaction.", S.formula("B8", { fns: ["ROUNDUP"], equals: 26 })),
      ck("b9", "B9 is the fees", "=B8*B5", "Transactions times fee.", S.formula("B9", { equals: 13 })),
      ck("b10", "B10 is the profit", "=B2-B9", "Stolen funds minus costs.", S.formula("B10", { equals: 987 })),
      ck("b11", "B11 is the verdict", "=IF(B10>0,\"Exploit pays\",\"Exploit fails\")", "A positive profit pays.", S.formula("B11", { fns: ["IF"], equals: "Exploit pays" })),
    ],
    solution: { cells: { B7: "=MIN(B3*B4,B2+B3)", B8: "=ROUNDUP((B2+B3)/B7,0)", B9: "=B8*B5", B10: "=B2-B9", B11: "=IF(B10>0,\"Exploit pays\",\"Exploit fails\")" } },
  }),
  classifyLab({
    id: "s5-math-bugs", module: "arithmetic-logic-and-design", title: "Safe or unsafe arithmetic?", level: "advanced", minutes: 10, xp: 40, skills: [SK], required: true,
    objective: "Judge arithmetic and rounding choices in contract code.", scenario: "Solidity 0.8 checks for overflow, but logic and rounding errors remain. Judge each snippet.",
    steps: ["Read each snippet.", "Choose the verdict.", "Press Check my work."],
    categories: [["safe", "Safe"], ["unsafe", "Unsafe"], ["context", "Depends on context"]],
    items: [["Shares for a deposit are rounded down in favour of the vault", "safe", "The protocol is protected."], ["A fee is calculated as amount * rate / 10000 after multiplying first", "safe", "Multiply before dividing to keep precision."], ["A fee is calculated as amount / 10000 * rate", "unsafe", "Dividing first loses precision."], ["unchecked { total += userAmount; } with a user-controlled amount", "unsafe", "Overflow becomes possible."], ["unchecked { ++i; } in a loop bounded by the array length", "context", "Safe only because overflow is impossible."], ["Using a timestamp to decide a winner by a few seconds", "unsafe", "Validators can nudge timestamps."], ["Converting uint256 to uint8 without checking the range", "unsafe", "Silent truncation."], ["Rounding up the amount a borrower must repay", "safe", "Debt should cover the true amount."]],
  }),
  sheetLab({
    id: "s6-rounding", module: "arithmetic-logic-and-design", title: "Measure a rounding loss", level: "advanced", minutes: 14, xp: 55, skills: [SK], required: false,
    objective: "Show how integer division can cheat a small depositor.",
    scenario: "A vault holds 1,000,000 units of assets against 1,000 shares. A user deposits 1,500 units. The contract gives INT(deposit × shares ÷ assets) shares.",
    steps: ["In B7 work out the shares minted, rounded down with INT.", "In B8 work out the value of those shares: shares times assets divided by total shares.", "In B9 work out the loss: the deposit minus B8.", "In B10 work out the loss as a fraction of the deposit.", "In B11 show Rounding loss if B9 is above zero, else No loss."],
    cells: { A1: "Input", B1: "Value", A2: "Total assets in vault", B2: "1000000", A3: "Total shares", B3: "1000", A4: "Deposit", B4: "1500", A7: "Shares minted", A8: "Value of those shares", A9: "Loss", A10: "Loss as a fraction", A11: "Verdict" }, view: { cols: 2, rows: 13 },
    checks: [
      ck("b7", "B7 is the shares minted", "=INT(B4*B3/B2)", "Multiply first, then divide and round down.", S.formula("B7", { fns: ["INT"], equals: 1 })),
      ck("b8", "B8 is the value", "=B7*B2/B3", "Shares times price per share.", S.formula("B8", { equals: 1000 })),
      ck("b9", "B9 is the loss", "=B4-B8", "Deposit minus value.", S.formula("B9", { equals: 500 })),
      ck("b10", "B10 is the fraction", "=B9/B4", "Loss over deposit.", S.formula("B10", { equals: 500 / 1500 })),
      ck("b11", "B11 is the verdict", "=IF(B9>0,\"Rounding loss\",\"No loss\")", "A positive loss is a loss.", S.formula("B11", { fns: ["IF"], equals: "Rounding loss" })),
    ],
    solution: { cells: { B7: "=INT(B4*B3/B2)", B8: "=B7*B2/B3", B9: "=B4-B8", B10: "=B9/B4", B11: "=IF(B9>0,\"Rounding loss\",\"No loss\")" } },
  }),
  classifyLab({
    id: "s7-external", module: "external-interactions", title: "Spot the external-interaction risk", level: "advanced", minutes: 10, xp: 40, skills: [SK], required: true,
    objective: "Match behaviour involving other contracts and data feeds to its risk.", scenario: "Most large losses involve how a contract trusts or calls something outside itself. Match each situation to its risk.",
    steps: ["Read each situation.", "Choose the risk.", "Press Check my work."],
    categories: [["oracle", "Price manipulation"], ["stale", "Stale or invalid data"], ["callback", "Untrusted callback"], ["delegate", "Dangerous delegatecall"], ["replay", "Signature replay"], ["front", "Front-running"]],
    items: [["A lender uses the current pool price, which a flash loan can move within one transaction", "oracle", "A manipulable spot price."], ["A feed has not updated for three days but the contract still uses its price", "stale", "Check freshness."], ["A token with hooks calls back into your contract during a transfer", "callback", "Treat external calls as untrusted."], ["A contract delegatecalls an address supplied by a user", "delegate", "The target can rewrite your storage."], ["The same signed voucher is redeemed on two chains", "replay", "No chain id or nonce."], ["A bot sees your pending trade and buys first to profit from the price move", "front", "Transactions are public before they are included."], ["A feed returns zero or a negative number and the contract divides by it", "stale", "Reject invalid data."], ["An attacker flash-borrows a huge amount, moves a price and profits in the same transaction", "oracle", "Capital is free for one transaction."]],
  }),
  sheetLab({
    id: "s8-flash", module: "external-interactions", title: "Would a flash-loan attack pay?", level: "advanced", minutes: 14, xp: 55, skills: [SK], required: false,
    objective: "Work out whether a price-manipulation attack is profitable after fees.",
    scenario: "An attacker flash-borrows funds, distorts a pool price and gains from a lender that trusts it. (A teaching model, made-up figures.)",
    steps: ["In B7 work out the flash loan fee: the amount borrowed times the fee rate.", "In B8 work out the gain after the fee: the gross gain minus the flash loan fee.", "In B9 work out the profit after the transaction cost: B8 minus the gas cost.", "In B10 show Profitable attack if B9 is above zero, else Not profitable.", "In B11 work out the profit as a percentage of the gross gain."],
    cells: { A1: "Input", B1: "Value", A2: "Amount flash-borrowed", B2: "1000000", A3: "Flash loan fee rate", B3: "0.001", A4: "Gross gain from the manipulation", B4: "5000", A5: "Gas and tip cost", B5: "300", A7: "Flash loan fee", A8: "Gain after fee", A9: "Profit", A10: "Verdict", A11: "Profit as % of gross gain" }, view: { cols: 2, rows: 13 },
    checks: [
      ck("b7", "B7 is the fee", "=B2*B3", "Amount times rate.", S.formula("B7", { equals: 1000 })),
      ck("b8", "B8 is the gain after fee", "=B4-B7", "Gross minus fee.", S.formula("B8", { equals: 4000 })),
      ck("b9", "B9 is the profit", "=B8-B5", "Subtract the transaction cost.", S.formula("B9", { equals: 3700 })),
      ck("b10", "B10 is the verdict", "=IF(B9>0,\"Profitable attack\",\"Not profitable\")", "Positive means worth attacking.", S.formula("B10", { fns: ["IF"], equals: "Profitable attack" })),
      ck("b11", "B11 is the percentage", "=B9/B4*100", "Profit over gross gain, times 100.", S.formula("B11", { equals: 3700 / 5000 * 100 })),
    ],
    solution: { cells: { B7: "=B2*B3", B8: "=B4-B7", B9: "=B8-B5", B10: "=IF(B9>0,\"Profitable attack\",\"Not profitable\")", B11: "=B9/B4*100" } },
  }),
  classifyLab({
    id: "s9-tools", module: "tools-and-methodology", title: "Which tool or technique?", level: "advanced", minutes: 10, xp: 40, skills: [SK], required: true,
    objective: "Choose the right tool or technique for a security task.", scenario: "No tool finds everything. Match the task to the technique that fits.",
    steps: ["Read each task.", "Choose the technique.", "Press Check my work."],
    categories: [["static", "Static analysis"], ["fuzz", "Fuzzing and invariants"], ["manual", "Manual review"], ["formal", "Formal verification"], ["threat", "Threat modelling"]],
    items: [["Automatically scan for known bad patterns such as unchecked low-level calls", "static", "Fast and cheap, but pattern-based."], ["Throw millions of random call sequences at the contract and check the accounting still adds up", "fuzz", "Property-based testing."], ["Read the code against the specification to find logic flaws tools miss", "manual", "Human judgement."], ["Mathematically prove that a property holds for all inputs", "formal", "Strongest assurance on chosen properties."], ["List assets, attackers and entry points before reading any code", "threat", "Frame the review."], ["Run a detector in continuous integration on every commit", "static", "Automated and repeatable."], ["Decide whether the business logic matches what the docs promise", "manual", "Requires understanding of intent."], ["Check that total supply always equals the sum of balances after any sequence of actions", "fuzz", "An invariant."]],
  }),
  wordLab({
    id: "s10-checklist", module: "tools-and-methodology", title: "Write a pre-deployment security checklist", level: "advanced", minutes: 18, xp: 65, skills: [SK], required: false,
    objective: "Turn the lessons into a checklist your team can use before launch.",
    scenario: "Your team is about to deploy a vault. Write a checklist that must be fully ticked before release.",
    steps: ["Add Heading 2 sections: Access and upgrades, Funds flow, External dependencies, Testing and review.", "Under each section write at least two bullet points.", "Mention reentrancy, an oracle or external data, and an audit.", "Keep it between 130 and 300 words."],
    checks: [
      ck("heads", "Four sections", "Use Heading 2.", "A structured checklist.", W.heading(4, 2)),
      ck("order", "In order", "Access and upgrades, Funds flow, External dependencies, Testing and review.", "Follow the money and the trust.", W.order(["Access and upgrades", "Funds flow", "External dependencies", "Testing and review"])),
      ck("lists", "Bullet points", "Use the bullet button.", "Short items.", W.list(2, "ul")),
      ck("reent", "Mentions reentrancy", "Mention reentrancy.", "A core check.", W.pattern("reentran", "reentrancy")),
      ck("oracle", "Mentions an oracle or external data", "Mention oracle, price feed or external call.", "Trust boundaries.", W.pattern("oracle|price feed|external", "an oracle or external dependency")),
      ck("audit", "Mentions an audit", "Mention an audit or independent review.", "Fresh eyes.", W.pattern("audit|independent review", "an audit")),
      ck("len", "Between 130 and 300 words", "Concise.", "A usable list.", W.words(130, 300)),
    ],
    solution: "<h2>Access and upgrades</h2><ul><li>Every function that changes settings, roles or funds has an explicit permission check, and each is tested from a stranger's account.</li><li>Admin powers sit in a multi-signature wallet with a time-lock, and any upgrade path is documented.</li></ul><h2>Funds flow</h2><ul><li>All state is updated before any external call, and withdrawal functions are protected against reentrancy.</li><li>Payouts use pull payments so one failing recipient cannot block the rest, and a deposit cap limits the first launch.</li></ul><h2>External dependencies</h2><ul><li>Prices come from a trusted oracle with freshness and sanity checks, never from a single pool's spot price.</li><li>Every external call and token is treated as untrusted, including tokens with callbacks.</li></ul><h2>Testing and review</h2><ul><li>Unit, fuzz and invariant tests pass, static analysis shows no unexplained warnings, and coverage gaps are reviewed.</li><li>An independent audit is complete, its findings are fixed or accepted in writing, and the exact audited code is what is deployed.</li></ul>",
  }),
  wordLab({
    id: "s11-report", module: "audit-practice", title: "Write one audit finding", level: "advanced", minutes: 20, xp: 70, skills: [SK], required: true,
    objective: "Write a finding the way a professional auditor does: clear, specific and actionable.",
    scenario: "You have found that VulnerableBank.withdraw sends ETH before it sets the balance to zero. Write the finding for the client.",
    steps: ["Add a Heading 1 'Finding: reentrancy in withdraw'.", "Add Heading 2 sections: Severity, Description, Impact, Proof of concept, Recommendation.", "State the severity as High and give the reason.", "Under Recommendation list at least two fixes in bullets, including checks-effects-interactions and a reentrancy guard.", "Keep it between 130 and 300 words."],
    checks: [
      ck("title", "A title", "Use Heading 1.", "Name the finding.", W.heading(1, 1)),
      ck("secs", "Five sections", "Use Heading 2.", "A standard layout.", W.heading(5, 2)),
      ck("order", "In order", "Severity, Description, Impact, Proof of concept, Recommendation.", "The usual order.", W.order(["Severity", "Description", "Impact", "Proof of concept", "Recommendation"])),
      ck("high", "Severity is High", "Say High.", "Draining funds is high severity.", W.contains("High")),
      ck("cei", "Recommends checks-effects-interactions", "Mention checks-effects-interactions.", "The standard fix.", W.pattern("checks-effects-interactions|effects before|update.*before", "checks-effects-interactions")),
      ck("guard", "Recommends a reentrancy guard", "Mention nonReentrant or reentrancy guard.", "Defence in depth.", W.pattern("nonReentrant|reentrancy guard|ReentrancyGuard", "a reentrancy guard")),
      ck("fixes", "Two fixes as bullets", "Use the bullet button.", "Actionable.", W.list(2, "ul")),
      ck("len", "Between 130 and 300 words", "Concise.", "Clients read short reports.", W.words(130, 300)),
    ],
    solution: "<h1>Finding: reentrancy in withdraw</h1><h2>Severity</h2><p>High. An attacker can take funds belonging to other users.</p><h2>Description</h2><p>The withdraw function reads the caller's balance, sends the ETH with a low-level call and only then sets the balance to zero. The recipient's receive function runs during the call and can call withdraw again while the balance is still non-zero.</p><h2>Impact</h2><p>An attacker who deposits a small amount can repeat the withdrawal many times in one transaction and drain the funds of all other depositors, limited only by gas and the balance of the contract.</p><h2>Proof of concept</h2><p>An attacker contract deposits one ETH, calls withdraw, and in its receive function calls withdraw again while the vault still holds enough ETH. The test shows the vault empty and the attacker holding all of it.</p><h2>Recommendation</h2><ul><li>Follow checks-effects-interactions: set the balance to zero before sending the ETH.</li><li>Add a reentrancy guard such as OpenZeppelin's nonReentrant modifier as a second layer of defence.</li></ul>",
  }),
  sheetLab({
    id: "s12-severity", module: "audit-practice", title: "Score and rank findings", level: "advanced", minutes: 14, xp: 50, skills: [SK], required: false,
    objective: "Rank findings by impact times likelihood and count how many are serious.",
    scenario: "An audit found four issues. Score each from 1 (low) to 3 (high) for impact and likelihood, then label them.",
    steps: ["In D2 work out the score: impact times likelihood. Fill down to D5.", "In E2 show High if the score is 6 or more, Medium if it is 3 or more, otherwise Low. Fill down to E5.", "In B7 count how many findings are High.", "In B8 work out the average score.", "In B9 find the highest score."],
    cells: { A1: "Finding", B1: "Impact", C1: "Likelihood", D1: "Score", E1: "Severity", A2: "Reentrancy in withdraw", B2: "3", C2: "2", A3: "Missing event on a change", B3: "1", C3: "3", A4: "Typo in a comment", B4: "1", C4: "1", A5: "Unprotected initialiser", B5: "3", C5: "3", A7: "Number of High findings", A8: "Average score", A9: "Highest score" }, view: { cols: 5, rows: 11 },
    checks: [
      ck("d2", "D2 is the score", "=B2*C2", "Impact times likelihood.", S.formula("D2", { equals: 6 })),
      ck("d5", "D5 is the score", "=B5*C5", "Fill down.", S.formula("D5", { equals: 9 })),
      ck("e2", "E2 is the severity", "=IF(D2>=6,\"High\",IF(D2>=3,\"Medium\",\"Low\"))", "Nest two IFs.", S.formula("E2", { fns: ["IF"], equals: "High" })),
      ck("e3", "E3 is the severity", "=IF(D3>=6,\"High\",IF(D3>=3,\"Medium\",\"Low\"))", "Fill down.", S.formula("E3", { fns: ["IF"], equals: "Medium" })),
      ck("e4", "E4 is the severity", "=IF(D4>=6,\"High\",IF(D4>=3,\"Medium\",\"Low\"))", "Fill down.", S.formula("E4", { fns: ["IF"], equals: "Low" })),
      ck("b7", "B7 counts the High findings", "=COUNTIF(E2:E5,\"High\")", "COUNTIF over the severity column.", S.formula("B7", { fns: ["COUNTIF"], equals: 2 })),
      ck("b8", "B8 is the average score", "=AVERAGE(D2:D5)", "Average of the scores.", S.formula("B8", { fns: ["AVERAGE"], equals: (6 + 3 + 1 + 9) / 4 })),
      ck("b9", "B9 is the highest score", "=MAX(D2:D5)", "Largest score.", S.formula("B9", { fns: ["MAX"], equals: 9 })),
    ],
    solution: { cells: Object.assign({ B7: "=COUNTIF(E2:E5,\"High\")", B8: "=AVERAGE(D2:D5)", B9: "=MAX(D2:D5)" }, ...[2, 3, 4, 5].map((r) => ({ [`D${r}`]: `=B${r}*C${r}`, [`E${r}`]: `=IF(D${r}>=6,"High",IF(D${r}>=3,"Medium","Low"))` }))) },
  }),
  wordLab({
    id: "cap-review", module: "capstone", title: "Final project: review a vault and write the report", level: "challenge", minutes: 40, xp: 170, skills: [SK], required: true,
    objective: "Produce a professional security review of a vault design covering scope, threats, findings and recommendations.",
    scenario: "A client asks you to review a small vault that accepts ETH deposits, lets users withdraw, has an owner who can pause and a price-based borrowing feature that uses a pool's spot price. Write your review.",
    steps: ["Add a Heading 1 'Security review: client vault'.", "Add Heading 2 sections: Scope, Method, Findings, Recommendations, Limits of this review.", "Under Findings write a numbered list of at least four findings, each with a severity.", "Include reentrancy, access control and the spot-price oracle.", "Under Limits of this review state that this is not a guarantee of safety.", "Keep it between 280 and 600 words."],
    checks: [
      ck("t", "A title", "Use Heading 1.", "Name the review.", W.heading(1, 1)),
      ck("secs", "Five sections", "Use Heading 2.", "A complete report.", W.heading(5, 2)),
      ck("order", "In order", "Scope, Method, Findings, Recommendations, Limits of this review.", "A logical flow.", W.order(["Scope", "Method", "Findings", "Recommendations", "Limits of this review"])),
      ck("find", "Four findings", "Use the numbered list button.", "List and rank findings.", W.list(4, "ol")),
      ck("reent", "Mentions reentrancy", "Include reentrancy.", "A core risk.", W.pattern("reentran", "reentrancy")),
      ck("access", "Mentions access control", "Include access control.", "Who can do what.", W.pattern("access control|permission|onlyOwner|owner", "access control")),
      ck("oracle", "Mentions the spot-price oracle", "Include spot price or oracle manipulation.", "Flash loan risk.", W.pattern("spot|oracle|flash", "the spot-price oracle")),
      ck("sev", "Gives severities", "Say High, Medium or Low.", "Rank them.", W.pattern("High|Medium|Low", "severities")),
      ck("limits", "States it is not a guarantee", "Say this is not a guarantee.", "Be honest about limits.", W.pattern("not a guarantee|no guarantee|cannot guarantee", "that this is not a guarantee")),
      ck("len", "Between 280 and 600 words", "Two pages at most.", "Readable.", W.words(280, 600)),
    ],
    solution: "<h1>Security review: client vault</h1><h2>Scope</h2><p>The vault contract at the commit supplied by the client: deposit, withdraw, pause and the borrowing function that values collateral using a price from a liquidity pool. Front end, deployment scripts and the pool itself were out of scope.</p><h2>Method</h2><p>We first built a threat model listing assets, actors and entry points. We then read the code line by line against the written specification, ran static analysis, and wrote fuzz and invariant tests for the accounting.</p><h2>Findings</h2><ol><li>High: reentrancy in withdraw, because the ETH is sent before the balance is updated, which lets an attacker drain other users' funds.</li><li>High: the borrowing function reads the pool's spot price, which an attacker can move within a single transaction using a flash loan, allowing under-collateralised borrowing.</li><li>Medium: the pause function has access control, but the owner is a single externally owned account, so one stolen key could pause or change settings.</li><li>Low: important state changes emit no events, which makes monitoring and incident response harder.</li></ol><h2>Recommendations</h2><p>Update the balance before sending and add a reentrancy guard. Replace the spot price with an independent oracle that checks freshness and rejects invalid values, or use a time-weighted price. Move the owner role to a multi-signature wallet with a time-lock. Emit events for deposits, withdrawals, pauses and parameter changes so that monitoring can raise an alert quickly. Launch with a deposit cap so that any bug we missed can only cost a limited amount, and add a bug bounty so that researchers are rewarded for reporting rather than exploiting.</p><h2>Limits of this review</h2><p>This review is limited to the stated scope and time. It is not a guarantee that the code is free of bugs, and any change after the reviewed commit needs a new review.</p>",
  }),
];

const M1 = module_({
  slug: "the-threat-landscape", title: "The threat landscape", hours: 2.5, level: "Foundations",
  summary: "Why contracts are different to secure, how attackers think and the bug classes behind most losses.",
  outcome: "You can explain why contract security is hard, name the main bug classes and fix a missing access check.",
  intro: "Smart contracts are public programs that hold money and cannot easily be patched. Anyone can read the code, call it in any order and fund an attack with a flash loan. This module explains the mindset and the catalogue of common bugs that the rest of the course explores in depth.",
  topics: [
    topic({
      title: "Why contract security is different", slug: "why-different",
      blocks: [
        p("A web application sits behind a server you control. You can patch it tonight, roll back, block an address and call the bank. A deployed contract is different on every count: the code is visible to everyone, it holds value directly, it is often immutable, and transactions are final. A bug can be found and exploited by anyone in the world within minutes of deployment."),
        table("Web application versus smart contract", ["Property", "Typical web app", "Smart contract"], [["Code visibility", "Private", "Public (or easily decompiled)"], ["Fixing a bug", "Deploy a patch", "Hard or impossible without a planned upgrade path"], ["Holds value", "Usually through a bank", "Directly in the contract"], ["Attacker's tools", "Probing a live service", "Exact local copies, simulations and free flash loans"], ["Undo a mistake", "Refunds and rollbacks", "Final: no central undo"], ["Cost of an attack", "Time and effort", "Often one transaction"]]),
        def("Attack surface", "Every way an outsider can interact with your system: each external function, each signature check, each admin power, each token or contract you call and each price you read."),
        miniQuiz("why-mini", [["Why is a deployed contract bug so serious?", ["The code is hidden", "The code is public, holds value and is often hard to patch", "Bugs are impossible", "Nobody can call it"], 1, "Public and final."]]),
        tip("Think like an attacker with unlimited free capital for one transaction. If that attacker can profit, assume someone will try."),
      ],
      points: ["Contracts are public, hold value and are hard to patch.", "The attack surface is every way outsiders can interact with them."],
      check: [["An attacker's biggest advantage against a contract is that:", ["They know your password", "The code is public and capital can be borrowed free for a transaction", "Contracts are slow", "Contracts are private"], 1, "Public code and flash loans."]],
    }),
    topic({
      title: "Access control failures", slug: "access-control",
      blocks: [
        code("solidity", noAccess, "BrokenWallet.sol and FixedWallet"),
        p("The first wallet checks the owner when withdrawing, which looks careful. But setOwner has no check, so a stranger calls it, becomes the owner and withdraws. A permission check is only as strong as the weakest function that can change who has permission."),
        table("Where access control goes wrong", ["Mistake", "Example", "Fix"], [["No check on a sensitive function", "setOwner, mint, pause, upgrade", "onlyOwner or a role check on every privileged function"], ["Unprotected initialiser", "initialize() can be called by anyone after deployment", "Use initialiser guards and call it in the same transaction as deployment"], ["Default visibility surprises", "An internal helper accidentally made public or external", "Be explicit and review every public function"], ["Single powerful key", "One externally owned account holds all admin power", "Multi-signature wallet and time-lock"], ["Role mix-ups", "The pauser can also move funds", "Separate roles with least privilege"]]),
        list("A quick test for any function", ["What does this change?", "Who is allowed to call it?", "Where is that enforced in the code?", "Can that permission itself be changed, and by whom?", "Is there a test that calls it from a stranger's account and expects a revert?"], true),
        miniQuiz("access-mini", [["What is wrong with BrokenWallet?", ["withdrawAll has a check", "setOwner can be called by anyone", "It has a constructor", "It accepts ETH"], 1, "Ownership can be taken."]]),
      ],
      points: ["Every privileged function needs an enforced permission check.", "A check is only as strong as the weakest way to change who may pass it."],
      check: [["The best test for access control is to:", ["Call each privileged function from a stranger and expect a revert", "Read the comments", "Check gas", "Rename the owner"], 0, "Test the negative case."]],
    }),
    topic({
      title: "A catalogue of bug classes", slug: "catalogue",
      blocks: [
        table("The main classes", ["Class", "One-line summary", "Covered in"], [["Access control", "Anyone can do what only an admin should", "This module"], ["Reentrancy", "An external call lets an attacker re-enter before state is updated", "Module 2"], ["Arithmetic and rounding", "Truncation, precision loss, unsafe casts", "Module 3"], ["Logic and design flaws", "The code does what it says but not what was intended", "Module 3"], ["Denial of service", "One failing recipient or a growing loop blocks everyone", "Module 3"], ["Oracle and price manipulation", "Trusting a price an attacker can move", "Module 4"], ["Signature and replay bugs", "Reusing a valid signature where it should not work", "Module 4"], ["Upgrade and proxy bugs", "Storage collisions and unprotected initialisers", "Module 4"]]),
        p("Most large losses are not exotic cryptography failures. They are the same handful of mistakes: a missing check, an unsafe order of operations, a trusted price or a misunderstood assumption about someone else's contract. Knowing the catalogue lets you spot them quickly in unfamiliar code."),
        flow("A reviewer's first pass", ["Read the specification", "List every entry point", "List every place value moves", "List every external call and data source", "Check permissions on each", "Look for the catalogue's patterns"]),
        mistakes(["Assuming a well-known library makes your own code safe.", "Believing the compiler version solves logic bugs.", "Reviewing only the main function and ignoring helpers and admin paths."]),
        miniQuiz("cat-mini", [["Most big contract losses come from:", ["Broken cryptography", "A handful of familiar mistakes", "Slow blocks", "Short names"], 1, "The same classes keep recurring."]]),
      ],
      points: ["A handful of bug classes cause most losses.", "A reviewer lists entry points, value flows and external dependencies first."],
      check: [["A good first step in a review is to:", ["Optimise gas", "List entry points and where value moves", "Rename functions", "Add comments"], 1, "Map the surface first."]],
    }),
  ],
  terms: [["Attack surface", "All the ways outsiders can interact with a system"], ["Access control", "Rules about who may call what"], ["Initialiser", "A function that sets up state after deployment"], ["Least privilege", "Giving each account only the power it needs"], ["Multi-signature wallet", "A wallet needing several approvals"], ["Flash loan", "An uncollateralised loan repaid within one transaction"]],
  practical: { title: "Practical: break your own wallet", intro: "On your own computer in Remix.", steps: ["Deploy BrokenWallet and send it some test ETH.", "From a second account, call setOwner then withdrawAll.", "Deploy FixedWallet and try the same attack.", "Write down what changed."] },
  quiz: [
    ["Deployed contracts are hard to fix because:", ["Code is often immutable", "They are slow", "They are private", "They have no gas"], 0, "No easy patching."],
    ["A permission check should exist on:", ["Every privileged function", "Only withdraw", "Only the constructor", "No function"], 0, "Including setters."],
    ["An unprotected initialiser lets:", ["Anyone take control", "Only the owner act", "Nobody act", "Gas be saved"], 0, "Classic upgrade bug."],
    ["Least privilege means:", ["Each role has only the power it needs", "Everyone is admin", "No roles", "One key does everything"], 0, "Limit the blast radius."],
    ["A multi-signature wallet:", ["Needs several approvals", "Has no owner", "Costs nothing", "Hides balances"], 0, "Reduces single-key risk."],
    ["The attack surface includes:", ["Every way outsiders can interact", "Only the front end", "Only the owner", "Only events"], 0, "Functions, signatures, dependencies."],
    ["A reviewer should start by:", ["Reading the specification and listing entry points", "Fixing style", "Deploying", "Marketing"], 0, "Understand intent first."],
  ],
});

const M2 = module_({
  slug: "reentrancy-and-state", title: "Reentrancy and state discipline", hours: 2.5, level: "Core skills",
  summary: "How reentrancy works, how to fix it in order and with guards, and the subtler cross-function forms.",
  outcome: "You can trace a reentrancy attack, apply checks-effects-interactions and explain when a guard is also needed.",
  intro: "Reentrancy is the best-known contract bug because it can drain a whole system from one small mistake. It is simple to fix once you understand it, which makes it a perfect first case study in how an attacker thinks.",
  topics: [
    topic({
      title: "Anatomy of a reentrancy attack", slug: "anatomy",
      blocks: [
        code("solidity", reent, "VulnerableBank.sol and Attacker"),
        flow("The attack, step by step", ["Attacker deposits 1 ETH", "Attacker calls withdraw", "Bank reads the balance: 1 ETH", "Bank sends 1 ETH to the attacker", "Attacker's receive function runs", "It calls withdraw again; the balance is still 1 ETH", "The loop repeats until the bank is empty", "Only then does the first call finish and set the balance to zero"]),
        p("The bug is not in the arithmetic. It is in the **order**: the bank hands control to an outsider before it has finished recording what it just did. While the outsider is running, the bank's books are still wrong."),
        explorer({ id: "sec-reent", title: "Drain simulator", intro: "Change how much the attacker deposits and the number of recursive calls to see how much leaves the vault. A teaching model.", inputs: [{ id: "vault", label: "Other people's funds (ETH)", min: 10, max: 5000, step: 10, value: 1000 }, { id: "dep", label: "Attacker deposit (ETH)", min: 1, max: 20, step: 1, value: 1 }, { id: "depth", label: "Reentrant calls in one transaction", min: 1, max: 100, step: 1, value: 40 }], outputs: [{ label: "Taken in one transaction (ETH)", expr: "min(dep * depth, vault + dep)", unit: "n" }, { label: "Transactions to empty the vault", expr: "ceil((vault + dep) / min(dep * depth, vault + dep))", unit: "n" }] }),
        miniQuiz("anat-mini", [["What makes reentrancy possible in VulnerableBank?", ["Overflow", "The balance is cleared after the ETH is sent", "Missing events", "A long name"], 1, "Control is handed over too early."]]),
      ],
      points: ["Reentrancy exploits handing over control before state is updated.", "The attacker's receive function calls back in while the books are stale."],
      check: [["During the external call, the bank's balance record for the attacker is:", ["Already zero", "Still the old value", "Negative", "Deleted"], 1, "That is the flaw."]],
    }),
    topic({
      title: "Fixes: order first, guard second", slug: "fixes",
      blocks: [
        code("solidity", reentFixed, "SaferBank.sol"),
        table("Two layers of defence", ["Layer", "How it helps", "Weakness alone"], [["Checks-effects-interactions", "State is correct before control leaves the contract, so a re-entry sees the updated balance and fails", "Easy to break by mistake when code is changed later"], ["nonReentrant guard", "A lock that reverts any second entry into guarded functions", "Does not protect other, unguarded functions that share state"], ["Pull payments", "Money moves only when the recipient asks, in a function that follows the pattern", "Needs consistent bookkeeping"]]),
        list("Rules of thumb", ["Update every piece of state the function depends on before any external call.", "Treat every call to an unknown address as hostile, including token transfers.", "Use a guard on functions that move value, as a second layer.", "Prefer the pull-payment pattern for distributing money.", "Never rely on a fixed gas stipend to stop reentrancy."], true),
        miniQuiz("fix-mini", [["Why use both CEI and a nonReentrant guard?", ["They are the same thing", "Each protects where the other can fail", "Guards cost nothing", "CEI is deprecated"], 1, "Defence in depth."]]),
        warn("Do not write clever reentrancy defences of your own. Use the well-reviewed order of operations and an audited guard."),
      ],
      points: ["Update state before external calls: checks, effects, interactions.", "Add a guard as a second layer and prefer pull payments."],
      check: [["Checks-effects-interactions means:", ["Interact, then check", "Validate, update state, then call out", "Update nothing", "Call out first"], 1, "The order of work."]],
    }),
    topic({
      title: "Subtler forms: cross-function and read-only", slug: "subtle-forms",
      blocks: [
        table("Beyond the simple case", ["Form", "How it works", "Defence"], [["Cross-function reentrancy", "During a call from function A, the attacker calls function B that shares the same stale state", "Apply the guard or the order to every function touching that state"], ["Cross-contract reentrancy", "Two contracts of the same system share assumptions; one is re-entered through the other", "Treat the whole system's state as one unit and order updates accordingly"], ["Read-only reentrancy", "During an external call, another contract reads a view function whose values are temporarily wrong", "Guard view functions that other protocols rely on, or update state before calls"], ["Token hook reentrancy", "Token standards with callbacks call your contract during transfers", "Assume any token call may call back"]]),
        p("These variants share one root cause: somewhere, a value is read while the system is in the middle of changing it. The cure is also the same: finish changing the system's state before anyone else is given control, and keep the number of places where state can be seen mid-update as small as possible."),
        mistakes(["Guarding one function but not another that reads or changes the same variable.", "Updating a balance but not the total that other code relies on, before calling out.", "Assuming ERC-20 transfers can never call back."]),
        miniQuiz("sub-mini", [["Read-only reentrancy happens when:", ["A view function is read mid-update by another contract", "Nothing is read", "Gas is low", "An event is missing"], 0, "Temporarily wrong values are observed."]]),
      ],
      points: ["Reentrancy can cross functions and contracts.", "Finish all state updates before handing over control."],
      check: [["Cross-function reentrancy means the attacker calls:", ["The same function only", "A different function that shares stale state", "Nothing", "A library"], 1, "Shared state is the target."]],
    }),
  ],
  terms: [["Reentrancy", "Calling back into a contract before it has finished"], ["Checks-effects-interactions", "Validate, update state, then call out"], ["nonReentrant", "A modifier that blocks nested entry"], ["Pull payment", "Recipients withdraw their own funds"], ["Cross-function reentrancy", "Re-entry through a different function"], ["Callback", "An external call that returns control to you"]],
  practical: { title: "Practical: drain and fix a bank", intro: "In Remix with test ETH.", steps: ["Deploy VulnerableBank and deposit from two accounts.", "Deploy Attacker, fund it and call attack.", "Watch the bank's balance fall.", "Deploy SaferBank and repeat the attack to see it fail."] },
  quiz: [
    ["Reentrancy is mainly a problem of:", ["Order of operations", "Rounding", "Naming", "Gas"], 0, "State updated too late."],
    ["A receive function can:", ["Call back into the sender", "Do nothing at all", "Only receive", "Mint tokens"], 0, "It runs code."],
    ["The safe order is:", ["Checks, effects, interactions", "Interactions, effects, checks", "Effects, checks, interactions", "Any order"], 0, "State first."],
    ["nonReentrant provides:", ["A second layer of defence", "A refund", "Privacy", "A fee"], 0, "Locks nested entry."],
    ["Pull payments help because:", ["Recipients withdraw themselves", "The contract pays all", "They cost nothing", "They are private"], 0, "No external calls in loops."],
    ["Read-only reentrancy involves:", ["Temporarily wrong view values", "A missing event", "A fee", "A role"], 0, "Observed mid-update."],
    ["Calls to unknown addresses should be treated as:", ["Hostile", "Safe", "Free", "Private"], 0, "Assume the worst."],
  ],
});

const M3 = module_({
  slug: "arithmetic-logic-and-design", title: "Arithmetic, logic and design flaws", hours: 2.5, level: "Core skills",
  summary: "Rounding and precision, unsafe casts, tx.origin, weak randomness, denial of service and front-running.",
  outcome: "You can spot rounding and precision bugs, avoid tx.origin and weak randomness, and design out denial of service.",
  intro: "Not all bugs are exotic. Many come from arithmetic that looks fine, from using the wrong piece of blockchain data, or from designs that let one participant block the rest. This module covers the most common ones.",
  topics: [
    topic({
      title: "Rounding, precision and casts", slug: "rounding",
      blocks: [
        code("solidity", rounding, "ShareMath.sol"),
        p("Solidity has no decimals. Division drops the remainder, so 5 / 2 is 2. That is predictable, but it matters when the number is money or shares. If a user deposits 1,500 into a vault with 1,000,000 of assets and 1,000 shares, the shares they receive are 1500 × 1000 ÷ 1,000,000 = 1.5, which rounds down to 1. That one share is worth 1,000, so the depositor silently loses 500."),
        table("Rules for safe division", ["Rule", "Why"], [["Multiply before dividing", "Dividing first throws away precision that multiplication cannot recover"], ["Round in the protocol's favour", "Down for what you pay out, up for what you must receive"], ["Use fixed-point scaling (for example 1e18)", "Keeps fractions as whole numbers"], ["Guard against division by zero", "An empty pool or vault has no valid price"], ["Avoid casting to smaller types without checks", "uint8(x) silently truncates in older code; use safe casting libraries"], ["Think about tiny and huge values", "Rounding bugs live at the extremes"]]),
        miniQuiz("round-mini", [["Why multiply before dividing?", ["It is cheaper", "It keeps precision that division would discard", "It is required by the compiler", "It avoids events"], 1, "Do divisions last."]]),
        tip("Write down for every division which party benefits from the rounding. If you cannot answer, you do not understand the bug risk yet."),
      ],
      points: ["Integer division drops the remainder; multiply first and round to protect the protocol.", "Scale fractions and check the extremes."],
      check: [["5 / 2 in Solidity equals:", ["2.5", "2", "3", "1"], 1, "The remainder is dropped."]],
    }),
    topic({
      title: "tx.origin, randomness and timestamps", slug: "blockchain-data",
      blocks: [
        code("solidity", txOrigin, "PhishableWallet.sol"),
        table("Why tx.origin is dangerous", ["Fact", "Consequence"], [["tx.origin is the account that began the transaction", "It stays the same through a chain of contract calls"], ["The owner calls a harmless-looking malicious contract", "That contract calls the wallet; tx.origin is still the owner"], ["The wallet checks tx.origin == owner", "The check passes and funds move to the thief"], ["Use msg.sender instead", "It is the direct caller, so the malicious contract is rejected"]]),
        code("solidity", randomness, "WeakLottery.sol"),
        p("Values such as block.timestamp, block.prevrandao and the player count are visible to everyone and can be influenced by the block producer or predicted by another contract. A lottery that uses them can be gamed. Real randomness needs a verifiable random function (VRF) from an oracle network, or a commit-and-reveal scheme in which participants first commit a hidden value and later reveal it."),
        list("Rules", ["Never use tx.origin for authorisation.", "Never use block values as a source of randomness for anything valuable.", "Treat timestamps as accurate to a few seconds at best.", "Use a verifiable random function for fair draws."]),
        miniQuiz("origin-mini", [["Why does the phishing attack work?", ["The wallet checks msg.sender", "tx.origin is still the owner even though a malicious contract made the call", "The owner has no keys", "Gas is low"], 1, "tx.origin does not change along the chain."]]),
      ],
      points: ["Authorise with msg.sender, never tx.origin.", "Block data is not random: use a verifiable random function."],
      check: [["A safe source of randomness for a valuable lottery is:", ["block.timestamp", "A verifiable random function", "The player count", "The gas price"], 1, "Block data can be predicted or nudged."]],
    }),
    topic({
      title: "Denial of service and front-running", slug: "dos-front",
      blocks: [
        code("solidity", dos, "PushPayouts.sol and PullPayouts"),
        table("Denial-of-service patterns", ["Pattern", "How it blocks", "Fix"], [["Push payments in a loop", "One recipient that reverts stops the whole loop", "Pull payments: record what is owed and let users claim"], ["Unbounded loops", "The array grows until the loop cannot fit in one block", "Bound the work or process in batches"], ["Dependence on a call succeeding", "An external contract is paused or removed", "Handle failure gracefully or isolate it"], ["Forced ETH", "Someone sends ETH to break a strict balance check", "Do not assume the balance equals your own accounting"]]),
        p("**Front-running** is different: transactions wait in a public pool before they are included, so anyone can see them and pay a higher fee to go first. A bot that sees your large purchase can buy before you and sell after you. Defences include slippage limits, commit-and-reveal designs, private submission services and designs where the order of transactions matters less."),
        miniQuiz("dos-mini", [["Why are pull payments safer?", ["They use less gas always", "One failing recipient cannot block the rest", "They need no state", "They are private"], 1, "Isolation of failure."]]),
        warn("A pull-payment design shifts the responsibility to the recipient. Make sure the bookkeeping is right before any claim is paid."),
      ],
      points: ["Avoid loops that depend on every external call succeeding.", "Transactions are public before inclusion, so design with front-running in mind."],
      check: [["Front-running is possible because:", ["Pending transactions are public", "Blocks are private", "Gas is free", "Contracts are slow"], 0, "Anyone can see and react."]],
    }),
  ],
  terms: [["Precision loss", "Information lost when integer division drops remainders"], ["tx.origin", "The account that started the transaction"], ["VRF", "A verifiable random function"], ["Commit-and-reveal", "Hide a value, then show it later"], ["Denial of service", "Blocking others from using a contract"], ["Front-running", "Acting first on a visible pending transaction"]],
  practical: { title: "Practical: find the rounding loss", intro: "Use the ShareMath example.", steps: ["Call sharesFor(1500, 1000000, 1000).", "Call assetsFor on the result.", "Calculate the loss by hand.", "Propose a safer design for tiny deposits."] },
  quiz: [
    ["Integer division in Solidity:", ["Drops the remainder", "Rounds to nearest", "Keeps decimals", "Fails"], 0, "5 / 2 is 2."],
    ["Multiply before dividing keeps:", ["Precision", "Gas", "Events", "Roles"], 0, "Do divisions last."],
    ["tx.origin should be used for:", ["Never for authorisation", "Always", "Roles", "Tokens"], 0, "Use msg.sender."],
    ["block.timestamp as randomness is:", ["Unsafe", "Safe", "Free", "Private"], 0, "Predictable or nudgeable."],
    ["Pull payments avoid:", ["One recipient blocking all", "All gas costs", "All events", "All checks"], 0, "Failure is isolated."],
    ["Unbounded loops risk:", ["Running out of gas", "More privacy", "Cheaper code", "Fewer bugs"], 0, "Denial of service."],
    ["Front-running uses:", ["Visible pending transactions", "Hidden keys", "Free tokens", "Old blocks"], 0, "Public mempool."],
  ],
});

const M4 = module_({
  slug: "external-interactions", title: "Oracles, flash loans and external dependencies", hours: 2.5, level: "Applied skills",
  summary: "Price manipulation, oracle checks, flash loans, delegatecall risks, signature replay and upgrade bugs.",
  outcome: "You can explain a flash-loan price attack, apply oracle sanity checks and name the risks of delegatecall, replay and upgrades.",
  intro: "Contracts rarely stand alone: they read prices, call tokens, accept signatures and sit behind proxies. Each dependency is a place where an assumption can fail. Many of the largest losses came from trusting something an attacker could change.",
  topics: [
    topic({
      title: "Price manipulation and oracles", slug: "oracles",
      blocks: [
        code("solidity", oracle, "SpotPriceLender.sol and SaferLender"),
        flow("A flash-loan price attack", ["Borrow a huge amount with no collateral, repayable in the same transaction", "Swap it in a small pool to push the price", "Use the lender that trusts that pool's spot price to borrow too much against inflated collateral", "Reverse the swap to recover the borrowed amount", "Repay the flash loan with its fee", "Keep the difference, all in one transaction"]),
        table("Oracle design checks", ["Check", "Why"], [["Use an independent, manipulation-resistant source", "A single pool's spot price can be moved"], ["Prefer time-weighted averages for on-chain prices", "A single transaction cannot move an average over many blocks"], ["Reject zero or negative prices", "A broken feed can return nonsense"], ["Reject stale prices", "Old data may not reflect the market"], ["Sanity-check against a bound or a second source", "Detect large unexplained jumps"], ["Plan for feed failure", "Pause or fall back safely"]]),
        miniQuiz("oracle-mini", [["Why is a single pool's spot price a bad oracle?", ["It is slow", "A flash loan can move it within one transaction", "It is too accurate", "It is private"], 1, "Manipulable."]]),
      ],
      points: ["Spot prices can be moved in one transaction using flash loans.", "Use robust oracles and check freshness and validity."],
      check: [["A flash loan must be:", ["Repaid in the same transaction", "Repaid next year", "Never repaid", "Secured by a house"], 0, "Otherwise the transaction reverts."]],
    }),
    topic({
      title: "Delegatecall, signatures and untrusted tokens", slug: "calls-and-signatures",
      blocks: [
        table("Three more trust boundaries", ["Boundary", "Risk", "Defence"], [["delegatecall to a user-supplied address", "The target's code runs on your storage and can rewrite the owner", "Only delegatecall to fixed, trusted implementations"], ["Off-chain signatures", "A valid signature reused on another chain, contract or time", "Include chain id, contract address, nonce and expiry; use EIP-712"], ["Arbitrary tokens", "Fee-on-transfer tokens deliver less than requested; hooks call back; some tokens do not return values", "Measure the balance change; use safe transfer wrappers; guard against callbacks"], ["Low-level call results", "A call can fail silently if you ignore the returned boolean", "Always check success"], ["Self-destruct and forced ETH", "Balance changes without your code running", "Do not rely on address(this).balance for accounting"]]),
        p("The thread through all of these is that you must not assume anything about code you did not write. If a token behaves strangely, if a signature is replayed, if a delegate target is hostile, your contract's guarantees only hold if you designed for it."),
        list("Defensive habits", ["Make a list of every external contract your code calls and what you assume about each.", "Check every returned value.", "Compute balances by what you recorded, not what you observe.", "Include domain data in everything that is signed.", "Prefer well-audited wrappers to hand-written low-level code."], true),
        miniQuiz("calls-mini", [["Why is delegatecall to a user-supplied address dangerous?", ["It costs gas", "The target's code runs against your storage and can change anything", "It emits no events", "It is deprecated"], 1, "Your storage becomes theirs to edit."]]),
      ],
      points: ["Every external dependency is an assumption that can fail.", "Bind signatures, check results and never delegatecall to unknown code."],
      check: [["A fee-on-transfer token means:", ["You receive less than the amount sent", "You receive more", "Nothing changes", "It is free"], 0, "Measure the balance change."]],
    }),
    topic({
      title: "Upgrade and proxy risks", slug: "upgrades",
      blocks: [
        table("Where upgradeable systems fail", ["Failure", "How it happens", "Defence"], [["Unprotected initialiser", "Anyone calls initialize on the proxy or implementation and becomes owner", "Initialiser guards, disabling initialisers in the implementation, and initialising in the deployment transaction"], ["Storage collision", "A new version changes the order or type of variables", "Append-only layouts, storage gaps, layout checks in tests"], ["Upgrade by a single key", "A stolen key replaces the logic with a malicious one", "Multi-signature wallet and time-lock, with public notice"], ["Self-destruct in an implementation", "A destroyed implementation breaks every proxy using it", "Avoid self-destruct; protect and disable the implementation"], ["Missing upgrade function in a UUPS version", "The system can never be upgraded again", "Tests that run an upgrade of the upgrade"]]),
        p("Upgradeability trades immutability for flexibility. Users must trust whoever can upgrade. For many systems the right answer is a clear, limited upgrade path with delay and public visibility; for others it is no upgrade path at all. Whichever you choose, say so openly."),
        warn("An upgrade is a new deployment of your risk. Every upgrade deserves its own review, rehearsal and announcement."),
        miniQuiz("up-mini", [["Why do upgrade keys deserve a time-lock?", ["To save gas", "To give users time to react before logic changes", "To hide upgrades", "To rename contracts"], 1, "Transparency and exit."]]),
      ],
      points: ["Initialisers, storage layout and upgrade keys are the main risks.", "Use time-locks, multi-signature control and rehearsals."],
      check: [["An unprotected initialiser lets:", ["Anyone become the owner", "Nobody act", "Gas fall", "Events vanish"], 0, "Set-up functions are privileged."]],
    }),
  ],
  terms: [["Oracle", "A source of outside data for a contract"], ["Spot price", "The current price in a single pool"], ["TWAP", "A time-weighted average price"], ["Flash loan", "A loan borrowed and repaid in one transaction"], ["Stale data", "Old data that no longer reflects reality"], ["Fee-on-transfer token", "A token that takes a cut when moved"]],
  practical: { title: "Practical: trace a flash-loan attack on paper", intro: "Use the six steps shown.", steps: ["Assume a pool of 1,000 A and 1,000 B.", "Compute the price before and after a large swap.", "Decide how much extra a lender would lend at the inflated price.", "Write two defences."] },
  quiz: [
    ["A flash loan needs collateral:", ["No", "Yes, always", "Only on weekends", "A house"], 0, "It is repaid within one transaction."],
    ["Spot prices are:", ["Manipulable", "Unchangeable", "Private", "Free"], 0, "Within one transaction."],
    ["A good oracle check rejects:", ["Stale or invalid data", "All data", "All users", "Gas"], 0, "Freshness and sanity."],
    ["Include in signed data:", ["Chain id, contract and nonce", "Only the amount", "Nothing", "The gas price"], 0, "Prevents replay."],
    ["delegatecall to unknown code:", ["Should be avoided", "Is required", "Is free", "Is private"], 0, "It can rewrite your storage."],
    ["Upgrade keys should be:", ["Multi-signature and time-locked", "Held by one person", "Public", "Unused"], 0, "Reduce single-key risk."],
    ["Do not rely on address(this).balance for accounting because:", ["ETH can be forced in", "It is hidden", "It costs gas", "It is a string"], 0, "Balance can change without your code running."],
  ],
});

const M5 = module_({
  slug: "tools-and-methodology", title: "Tools and methodology", hours: 2.5, level: "Applied skills",
  summary: "Static analysis, fuzzing and invariants, manual review, threat modelling and defence in depth.",
  outcome: "You can combine tools and human review into a repeatable process and defend a design in depth.",
  intro: "No single technique finds everything. Professionals combine fast automated tools, deep randomised testing and careful human reading, and they build their designs so that one failure is not fatal.",
  topics: [
    topic({
      title: "Automated tools and their limits", slug: "automated-tools",
      blocks: [
        table("What each technique is good for", ["Technique", "Good at", "Weak at"], [["Static analysis (for example Slither)", "Known patterns, bad practice, quick feedback", "Business logic and novel bugs; false positives"], ["Fuzzing", "Edge cases, arithmetic and unexpected inputs", "Needs good properties to check"], ["Invariant testing", "Accounting and state rules across call sequences", "Quality depends on how the handlers are written"], ["Symbolic execution", "Exploring paths to find assertion failures", "Slow on large systems"], ["Formal verification", "Proving chosen properties for all inputs", "Specialist skill; only covers what you specify"], ["Manual review", "Intent, design and logic flaws", "Slow, depends on the reviewer"]]),
        p("Run static analysis on every commit: it is cheap and catches careless mistakes. Treat its output as hints to investigate, not a verdict. A clean report does not mean a safe contract, and a long report does not mean a broken one."),
        list("Make tools part of the routine", ["Run the compiler with warnings treated seriously.", "Run static analysis in continuous integration.", "Write fuzz and invariant tests for money and state.", "Track coverage and look hard at untested branches.", "Triage every finding: fix, explain or accept in writing."]),
        miniQuiz("tools-mini", [["A clean static-analysis report means:", ["The contract is safe", "No known patterns were found, but logic bugs may remain", "It is audited", "Gas is low"], 1, "Tools find patterns, not intent."]]),
      ],
      points: ["Combine static analysis, fuzzing, invariants and review.", "Treat tool output as hints, not a verdict."],
      check: [["Static analysis is best at finding:", ["Business-logic flaws", "Known bad patterns quickly", "Intent", "Market risk"], 1, "Pattern-based."]],
    }),
    topic({
      title: "Manual review: how auditors read code", slug: "manual-review",
      blocks: [
        flow("A review method", ["Understand what the system is for", "Read the documentation and tests", "Draw the contracts, roles and money flows", "Review each function with the question 'what if this is called by anyone, at any time, with any input?'", "Trace every external call and every piece of external data", "Write down assumptions and test them", "Report findings with severity and fixes"]),
        table("Questions for every function", ["Question", "Looks for"], [["Who can call this?", "Missing access control"], ["What state does it read and change?", "Wrong order and stale reads"], ["What can the caller control?", "Unsafe inputs and arithmetic"], ["What does it call?", "Reentrancy and trust assumptions"], ["What if it is called twice, or never?", "Replay and stuck states"], ["What happens at zero, one and maximum?", "Edge cases"]]),
        tip("Read the code the way an attacker would: not 'does this work?' but 'how could I make this do something nobody intended?'"),
        miniQuiz("manual-mini", [["Why is understanding the specification the first step?", ["It is easy", "You cannot find logic bugs without knowing the intended behaviour", "Auditors dislike code", "It saves gas"], 1, "Bugs are differences from intent."]]),
      ],
      points: ["Auditors understand intent first, then question every function.", "Ask who, what, when and what if for each entry point."],
      check: [["A logic bug is found by comparing code to:", ["Its intended behaviour", "Its gas cost", "Its length", "Its name"], 0, "Specification versus code."]],
    }),
    topic({
      title: "Defence in depth", slug: "defence-in-depth",
      blocks: [
        code("solidity", pausable, "GuardedVault.sol"),
        table("Layers in GuardedVault", ["Layer", "Where"], [["Input validation", "ZeroAmount, Insufficient"], ["Deposit cap", "totalDeposits plus msg.value must not exceed the cap"], ["Order of operations", "Balances change before the external call"], ["Reentrancy guard", "nonReentrant on withdraw"], ["Emergency brake", "Pausable stops new deposits"], ["Events", "Deposits and withdrawals are logged for monitoring"], ["Limited admin power", "The owner can pause, but cannot move users' funds"]]),
        p("Notice that the owner can pause new deposits but cannot withdraw anyone's money, and withdrawals are never blocked by the pause. A safety feature that also lets a compromised key steal funds is not a safety feature. Design emergency powers to stop damage, not to create new ways to cause it."),
        miniQuiz("depth-mini", [["Why should the pause not block withdrawals in GuardedVault?", ["It saves gas", "Users must always be able to get their money out", "Withdrawals are free", "It hides state"], 1, "A pause should limit damage, not trap users."]]),
        warn("Layers help, but each new feature is also new attack surface. Keep the design as small as the job allows."),
      ],
      points: ["Layer validation, ordering, guards, caps and monitoring.", "Emergency powers should stop damage, not create new risks."],
      check: [["A deposit cap limits:", ["The harm from an undiscovered bug", "Gas", "Events", "Names"], 0, "A smaller prize and a smaller loss."]],
    }),
  ],
  terms: [["Static analysis", "Automated scanning of code for patterns"], ["Fuzzing", "Testing with many random inputs"], ["Invariant", "A property that must always hold"], ["Formal verification", "Mathematical proof of properties"], ["Defence in depth", "Several independent layers of protection"], ["Triage", "Sorting findings by importance"]],
  practical: { title: "Practical: review a function", intro: "Choose any function from this course.", steps: ["Answer the six questions for it.", "List the assumptions it makes.", "Write one test that would break an assumption.", "Say which technique would find it fastest."] },
  quiz: [
    ["Static analysis finds:", ["Known patterns", "All bugs", "Only logic bugs", "Nothing"], 0, "Fast, shallow checks."],
    ["Fuzzing needs:", ["Properties to check", "Nothing", "A bank", "A wallet"], 0, "Otherwise it finds only crashes."],
    ["Formal verification proves:", ["Specified properties", "Everything", "Nothing", "Gas"], 0, "Only what you specify."],
    ["A review starts with:", ["Understanding intent", "Typing", "Deploying", "Marketing"], 0, "Specification first."],
    ["Defence in depth means:", ["Several independent layers", "One strong lock", "No locks", "A long name"], 0, "One failure is not fatal."],
    ["An emergency pause should:", ["Stop damage without trapping users", "Take user funds", "Hide state", "Cost gas"], 0, "Do no harm."],
    ["Triage means:", ["Sorting findings by importance", "Deleting findings", "Hiding findings", "Renaming"], 0, "Fix the biggest risks first."],
  ],
});

const M6 = module_({
  slug: "audit-practice", title: "Audit practice and careers", hours: 2.5, level: "Applied skills",
  summary: "How audits run, how to write findings, severity ranking, bug bounties and incident response.",
  outcome: "You can write a clear finding, rank severity, prepare for an audit and describe incident response honestly.",
  intro: "Finding a bug is half the job; explaining it so that someone can fix it is the other half. This module covers the audit process, the language of findings, bug bounties and what to do when something goes wrong.",
  topics: [
    topic({
      title: "How an audit runs", slug: "audit-process",
      blocks: [
        flow("A typical engagement", ["Scoping: which code, which version, how long", "Kick-off: specification, documents, contacts", "Review: reading, tools and testing", "Interim findings shared early", "Report delivered with severities and recommendations", "Fixes made by the team", "Re-check of the fixes", "Final report published"]),
        table("What clients can do to get more from an audit", ["Action", "Benefit"], [["Freeze the code before the audit starts", "Reviewers examine what will be deployed"], ["Provide a clear specification and diagrams", "Reviewers find logic flaws, not just style issues"], ["Pass all tests and run static analysis first", "Time goes to hard problems"], ["List assumptions and areas of doubt", "Reviewers focus where help is needed"], ["Leave time to fix and re-check", "Findings are verified, not just marked fixed"]]),
        p("An audit is a snapshot: it examines one version of the code for a limited time. It reduces risk but cannot remove it. Any change after the audit needs fresh review, and a clean report never means 'bug-free'."),
        miniQuiz("process-mini", [["Why freeze the code before an audit?", ["It saves paper", "Reviewers must examine exactly what will be deployed", "Auditors prefer it", "It lowers gas"], 1, "A moving target cannot be reviewed."]]),
      ],
      points: ["Audits are scoped, time-boxed snapshots of one code version.", "Preparation and re-checking make audits more valuable."],
      check: [["An audit report means the code is:", ["Bug-free", "Reviewed at one version for a limited time", "Insured", "Immutable"], 1, "It reduces risk."]],
    }),
    topic({
      title: "Writing findings and ranking severity", slug: "findings",
      blocks: [
        table("Anatomy of a finding", ["Part", "Purpose"], [["Title", "Short and specific: 'Reentrancy in withdraw'"], ["Severity", "How serious: High, Medium, Low or informational"], ["Description", "What is wrong, where, and why"], ["Impact", "What an attacker can achieve in plain terms"], ["Proof of concept", "A test or steps showing it is real"], ["Recommendation", "A concrete fix"], ["Status", "Open, fixed, acknowledged or disputed"]]),
        table("A simple severity matrix", ["", "Low likelihood", "Medium likelihood", "High likelihood"], [["High impact", "Medium", "High", "High"], ["Medium impact", "Low", "Medium", "High"], ["Low impact", "Low", "Low", "Medium"]]),
        list("Writing tips", ["Lead with the impact so a busy reader sees why it matters.", "Show, do not just claim: include a proof of concept.", "Give a fix, not just a problem.", "Be precise about conditions: who, when and how much.", "Be fair: say what is good as well as what is wrong."]),
        miniQuiz("find-mini", [["Why include a proof of concept?", ["To lengthen the report", "It shows the bug is real and reproducible", "It is required by law", "It hides the bug"], 1, "Evidence beats assertion."]]),
      ],
      points: ["A finding has a title, severity, description, impact, proof and fix.", "Severity combines impact and likelihood."],
      check: [["High impact and low likelihood is usually:", ["Medium", "Informational", "Nothing", "Critical always"], 0, "Per the matrix."]],
    }),
    topic({
      title: "Bounties, incidents and honest limits", slug: "bounties-incidents",
      blocks: [
        table("Bug bounties", ["Element", "Good practice"], [["Scope", "Say exactly what is in and out of scope"], ["Rewards", "Scale with severity and with the funds at risk"], ["Safe harbour", "Promise not to pursue good-faith researchers"], ["Contact", "A clear, monitored way to report privately"], ["Response", "Acknowledge fast, fix, then pay and thank"]]),
        list("When an incident happens", ["Pause what you can to stop the loss.", "Tell users what you know and what you do not know, quickly and honestly.", "Preserve evidence: transactions, logs and code versions.", "Involve security experts and, where it is appropriate, law enforcement.", "Fix, test and rehearse before redeploying.", "Publish a post-mortem that explains what happened and what will change."], true),
        explorer({ id: "sec-bounty", title: "Bounty versus loss", intro: "Change the funds at risk and the size of the bounty to see why a generous reward is often the cheapest security. A teaching model.", inputs: [{ id: "risk", label: "Funds at risk (rupees)", min: 1000000, max: 1000000000, step: 1000000, value: 100000000 }, { id: "bounty", label: "Bounty (% of funds at risk)", min: 1, max: 20, step: 1, value: 10 }], outputs: [{ label: "Bounty paid (rupees)", expr: "risk * bounty / 100", unit: "rs" }, { label: "Saved if the bug is reported rather than exploited (rupees)", expr: "risk - risk * bounty / 100", unit: "rs" }] }),
        warn("This course teaches concepts and good practice. It does not by itself qualify anyone as an auditor, and it does not make any contract safe. Real value needs experienced independent reviewers."),
        miniQuiz("bounty-mini", [["Why offer a bounty?", ["To avoid fixing bugs", "Researchers are rewarded for reporting rather than exploiting", "To lower gas", "To hide code"], 1, "Good incentives."]]),
      ],
      points: ["Bounties give researchers a reason to report instead of exploit.", "In an incident: pause, communicate honestly, preserve evidence, fix and publish a post-mortem."],
      check: [["After an incident you should publish:", ["A post-mortem", "Nothing", "A new token", "A discount"], 0, "Transparency builds trust."]],
    }),
  ],
  terms: [["Audit", "An independent security review"], ["Finding", "A reported issue with severity and fix"], ["Proof of concept", "A demonstration that a bug is real"], ["Severity", "How serious an issue is"], ["Bug bounty", "A reward for responsibly reported bugs"], ["Post-mortem", "A written account of an incident"]],
  practical: { title: "Practical: rank five issues", intro: "Use the severity matrix.", steps: ["List five issues from this course.", "Estimate impact and likelihood for each.", "Place them on the matrix.", "Write a one-line fix for each."] },
  quiz: [
    ["A finding includes:", ["Severity, impact, proof and fix", "Only a title", "Only a fix", "Only a name"], 0, "Complete and actionable."],
    ["Severity is based on:", ["Impact and likelihood", "Gas only", "Length", "Colour"], 0, "Two dimensions."],
    ["A proof of concept:", ["Shows the bug is real", "Hides the bug", "Fixes the bug", "Costs gas"], 0, "Evidence makes a finding credible."],
    ["A bounty rewards:", ["Responsible disclosure", "Exploits", "Silence", "Delay"], 0, "Aligns incentives."],
    ["In an incident, first:", ["Pause if possible", "Argue", "Delete logs", "Wait"], 0, "Stop the loss."],
    ["An audit is:", ["A snapshot of one version", "A guarantee", "Insurance", "Forever"], 0, "Changes need new review."],
    ["Re-checking fixes ensures:", ["Findings are really resolved", "Gas is saved", "Events appear", "Names change"], 0, "Fixed means verified."],
  ],
});

export default course({
  slug: "smart-contract-security-auditing", title: "Smart Contract Security & Auditing", tagline: "Think like an attacker: bug classes, reentrancy, oracles, tools, audit reports and incident response", level: "Advanced", hours: 15,
  summary: "A hands-on introduction to smart contract security and the audit process: access control, reentrancy, arithmetic and rounding, tx.origin, weak randomness, denial of service, oracles and flash loans, signatures and upgrades, tools and manual review, writing findings and responding to incidents. Every Solidity listing was compiled against OpenZeppelin 5. You run the code in your own tools; this course does not by itself qualify you as an auditor.",
  modules: [M1, M2, M3, M4, M5, M6],
  capstone: capstone({
    title: "Final project: review a vault and write the report", summary: "Produce a professional security review and pass the final assessment.",
    intro: "You can now read a contract the way an attacker does and report what you find the way an auditor does. In this final step you review a small vault design, rank its findings and write a report that states its own limits. Then take the final assessment covering the whole course.",
    steps: ["Work through the **Final project: review a vault and write the report** lab.", "Check that every finding has a severity and a fix.", "Take the final assessment below."], projectTitle: "A security review report",
    quiz: [
      ["A function that changes the owner should be:", ["Protected by a permission check", "Public to all", "Hidden", "Free"], 0, "Access control."],
      ["Reentrancy exploits:", ["State updated after an external call", "Overflow", "Names", "Events"], 0, "Order of operations."],
      ["The safe order is:", ["Checks, effects, interactions", "Interactions first", "Effects last", "Any order"], 0, "State before calls."],
      ["Division in Solidity:", ["Drops the remainder", "Keeps decimals", "Rounds to nearest", "Fails"], 0, "Multiply first."],
      ["Authorisation should use:", ["msg.sender", "tx.origin", "block.timestamp", "gas price"], 0, "The direct caller."],
      ["A flash loan attack uses:", ["A manipulable spot price", "A hidden key", "A slow block", "A fee holiday"], 0, "Borrow, move the price, profit, repay."],
      ["Pull payments protect against:", ["One recipient blocking everyone", "Gas", "Names", "Events"], 0, "Isolated failure."],
      ["A good oracle check rejects:", ["Stale or invalid prices", "All prices", "Users", "Gas"], 0, "Freshness and validity."],
      ["Signed data should include:", ["Chain id, contract address and nonce", "Only the amount", "Nothing", "A colour"], 0, "Replay protection."],
      ["A clean static-analysis report means:", ["No known patterns found, logic bugs may remain", "The contract is safe", "It is audited", "It is cheap"], 0, "Tools are not verdicts."],
      ["A finding should include:", ["Severity, impact, proof and fix", "Only a title", "Only a guess", "Only a name"], 0, "Actionable."],
      ["An audit is:", ["A time-boxed snapshot, not a guarantee", "A guarantee", "Insurance", "Permanent"], 0, "It reduces risk."],
    ],
  }),
  labs,
  skills: [{ id: SK, label: "Contract security" }],
  badges: [
    { id: "bug-hunter", title: "Bug hunter", description: "Recognised the main bug classes.", when: { all: ["s1-bug-types"] } },
    { id: "order-keeper", title: "Order keeper", description: "Applied checks-effects-interactions.", when: { all: ["s3-cei-order"] } },
    { id: "finding-writer", title: "Finding writer", description: "Wrote a professional audit finding.", when: { all: ["s11-report"] } },
    { id: "reviewer", title: "Reviewer", description: "Completed a full security review.", when: { all: ["cap-review"] } },
  ],
  landing: {
    hero: { eyebrow: "Advanced · Eleven compiled listings checked against OpenZeppelin 5", title: "Smart contract security: think like an attacker, report like an auditor", subtitle: "Break and fix real vulnerable contracts, model attacks with numbers, learn the tools and write the audit findings that clients can act on. Every task is checked and explained.", level: "Advanced", outcomeLine: "After this course you can review a small contract for common vulnerabilities and report your findings clearly." },
    outcomes: [
      { icon: "safety", title: "Know the bug classes", text: "Access control, reentrancy, arithmetic, oracles and more." },
      { icon: "sheet", title: "Model attacks", text: "Put numbers on drains, rounding losses and flash loans." },
      { icon: "docs", title: "Read code like an attacker", text: "Ask who, what, when and what if for every function." },
      { icon: "cloud", title: "Use tools well", text: "Static analysis, fuzzing and invariants, with their limits." },
      { icon: "word", title: "Write professional findings", text: "Severity, impact, proof and fix." },
      { icon: "sort", title: "Plan for incidents", text: "Bounties, pausing, communication and post-mortems." },
    ],
    projects: [
      { title: "An incident summary", text: "A plain-English account of a missing access check.", module: "the-threat-landscape" },
      { title: "A reentrancy drain model", text: "A spreadsheet of an attack.", module: "reentrancy-and-state" },
      { title: "An audit finding", text: "A professional report on a reentrancy bug.", module: "audit-practice" },
      { title: "A full security review", text: "Scope, method, findings and limits.", module: "capstone" },
    ],
    tools: [{ icon: "docs", title: "Compiled code listings", text: "Vulnerable and fixed contracts verified with solc." }, { icon: "sheet", title: "Spreadsheet lab", text: "Attack economics and severity scoring." }, { icon: "word", title: "Document editor", text: "Findings, checklists and reports." }],
    assessment: ["Finish the required labs in each module: they are checked automatically and explained when something is missing.", "Pass each module quiz (70% or more). Short tests inside the lessons give instant feedback.", "Complete the security review and the final assessment."],
    faq: [
      { q: "Does the platform run exploits or tests?", a: "No. The labs check your analysis, calculations and writing. You run the code yourself in your own tools, on test networks only." },
      { q: "Will this make me a qualified auditor?", a: "No. It teaches the concepts and the process. Becoming an auditor takes much more practice on real code and mentoring." },
      { q: "Is it safe to try attacks?", a: "Only on your own contracts on local or test networks. Never attack contracts you do not own or have permission to test." },
    ],
  },
  catalogue: {
    hours: "~15 hrs", weeks: "~6 weeks", pace: "4 hrs/wk", badge: "Smart Contract Security",
    brief: "Bug classes, reentrancy, rounding, oracles and flash loans, tools and methodology, audit reports and incident response.",
    learn: ["Access control, reentrancy and checks-effects-interactions", "Rounding, tx.origin, weak randomness and denial of service", "Oracle manipulation, flash loans, signatures and upgrade risks", "Static analysis, fuzzing, invariants and manual review", "Writing findings and ranking severity", "Bug bounties and incident response"],
    handsOn: "Review a vault design and write a professional report with ranked findings and fixes.",
    outcome: "Review small contracts for common vulnerabilities and report findings clearly.",
  },
});
