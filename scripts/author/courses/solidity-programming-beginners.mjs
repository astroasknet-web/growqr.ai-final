import { bars, capstone, ck, classifyLab, code, course, def, example, explorer, flow, formula, list, miniQuiz, mistakes, module_, p, S, sheetLab, table, tip, topic, W, warn, wordLab } from "../kit.mjs";

const SK = "solidity";

const basics = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Basics {
    uint256 public constant MAX_SEATS = 100;   // fixed at compile time
    uint256 public immutable createdAt;        // fixed at deployment
    address public owner;
    bool public open = true;
    string public name = "Basics";
    int256 public delta = -5;
    bytes32 public tag = "hello";

    constructor() {
        createdAt = block.timestamp;
        owner = msg.sender;
    }
}`;

const controlFlow = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ControlFlow {
    function grade(uint256 score) external pure returns (string memory) {
        if (score >= 90) {
            return "A";
        } else if (score >= 75) {
            return "B";
        } else if (score >= 50) {
            return "C";
        }
        return "Fail";
    }

    function sumTo(uint256 n) external pure returns (uint256 total) {
        require(n <= 100, "Too big");
        for (uint256 i = 1; i <= n; i++) {
            total += i;
        }
    }
}`;

const guarded = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Guarded {
    address public owner;
    bool public paused;
    uint256 public value;

    error NotOwner();
    error IsPaused();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert IsPaused();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setValue(uint256 newValue) external onlyOwner whenNotPaused {
        value = newValue;
    }

    function setPaused(bool state) external onlyOwner {
        paused = state;
    }
}`;

const registry = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Registry {
    enum Status { Pending, Active, Closed }

    struct Student {
        string name;
        uint8 grade;
        Status status;
    }

    mapping(address => Student) public students;
    address[] public ids;

    event Enrolled(address indexed who, string name);

    function enrol(string calldata name, uint8 grade) external {
        require(bytes(name).length > 0, "Name needed");
        require(grade >= 1 && grade <= 12, "Grade must be 1 to 12");
        require(bytes(students[msg.sender].name).length == 0, "Already enrolled");
        students[msg.sender] = Student(name, grade, Status.Active);
        ids.push(msg.sender);
        emit Enrolled(msg.sender, name);
    }

    function count() external view returns (uint256) {
        return ids.length;
    }

    function close() external {
        students[msg.sender].status = Status.Closed;
    }
}`;

const vault = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Vault {
    mapping(address => uint256) public deposits;

    event Deposited(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    receive() external payable {
        deposits[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {
        require(deposits[msg.sender] >= amount, "Insufficient deposit");
        deposits[msg.sender] -= amount; // effects first
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "Transfer failed");
        emit Withdrawn(msg.sender, amount);
    }
}`;

const inheritance = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IGreeter {
    function greet() external view returns (string memory);
}

contract Base {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
}

contract Greeter is Base, IGreeter {
    string private greeting = "Hello";

    function greet() external view override returns (string memory) {
        return greeting;
    }

    function setGreeting(string calldata newGreeting) external onlyOwner {
        greeting = newGreeting;
    }
}`;

const ozNotice = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Notice is Ownable {
    string public message;

    constructor() Ownable(msg.sender) {}

    function setMessage(string calldata newMessage) external onlyOwner {
        message = newMessage;
    }
}`;

const crowdfund = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Crowdfund {
    address public immutable creator;
    uint256 public immutable goal;
    uint256 public immutable deadline;
    uint256 public raised;
    bool public withdrawn;
    mapping(address => uint256) public pledged;

    event Pledged(address indexed backer, uint256 amount);
    event Refunded(address indexed backer, uint256 amount);
    event Withdrawn(uint256 amount);

    error TooLate();
    error TooEarly();
    error GoalNotReached();
    error GoalReached();
    error NotCreator();
    error NothingToRefund();
    error AlreadyWithdrawn();
    error TransferFailed();

    constructor(uint256 goalWei, uint256 durationDays) {
        creator = msg.sender;
        goal = goalWei;
        deadline = block.timestamp + durationDays * 1 days;
    }

    function pledge() external payable {
        if (block.timestamp >= deadline) revert TooLate();
        pledged[msg.sender] += msg.value;
        raised += msg.value;
        emit Pledged(msg.sender, msg.value);
    }

    function withdraw() external {
        if (msg.sender != creator) revert NotCreator();
        if (block.timestamp < deadline) revert TooEarly();
        if (raised < goal) revert GoalNotReached();
        if (withdrawn) revert AlreadyWithdrawn();
        withdrawn = true;
        uint256 amount = address(this).balance;
        (bool ok, ) = creator.call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit Withdrawn(amount);
    }

    function refund() external {
        if (block.timestamp < deadline) revert TooEarly();
        if (raised >= goal) revert GoalReached();
        uint256 amount = pledged[msg.sender];
        if (amount == 0) revert NothingToRefund();
        pledged[msg.sender] = 0;
        (bool ok, ) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit Refunded(msg.sender, amount);
    }
}`;

const cfTest = `const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Crowdfund", function () {
  async function setup() {
    const [creator, alice, bob] = await ethers.getSigners();
    const goal = ethers.parseEther("2");
    const fund = await ethers.deployContract("Crowdfund", [goal, 7]);
    return { fund, creator, alice, bob, goal };
  }

  it("pays the creator when the goal is reached after the deadline", async function () {
    const { fund, creator, alice, bob } = await setup();
    await fund.connect(alice).pledge({ value: ethers.parseEther("1.5") });
    await fund.connect(bob).pledge({ value: ethers.parseEther("1") });
    await time.increase(8 * 24 * 60 * 60);
    await expect(fund.connect(creator).withdraw()).to.emit(fund, "Withdrawn");
  });

  it("lets backers refund when the goal is missed", async function () {
    const { fund, alice } = await setup();
    await fund.connect(alice).pledge({ value: ethers.parseEther("1") });
    await time.increase(8 * 24 * 60 * 60);
    await expect(fund.connect(alice).refund()).to.emit(fund, "Refunded");
    await expect(fund.connect(alice).refund()).to.be.revertedWithCustomError(fund, "NothingToRefund");
  });

  it("rejects an early withdrawal", async function () {
    const { fund, creator } = await setup();
    await expect(fund.connect(creator).withdraw()).to.be.revertedWithCustomError(fund, "TooEarly");
  });
});`;

const labs = [
  classifyLab({
    id: "s1-types", module: "setting-up-and-basics", title: "Pick the right type", level: "beginner", minutes: 8, xp: 30, skills: [SK], required: true,
    objective: "Choose the Solidity type that fits each piece of data.", scenario: "Choosing the right type keeps a contract correct and cheap. Match each need to a type.",
    steps: ["Read each need.", "Choose the type.", "Press Check my work."],
    categories: [["uint", "uint256 (unsigned integer)"], ["int", "int256 (signed integer)"], ["bool", "bool"], ["addr", "address"], ["str", "string"], ["map", "mapping"]],
    items: [["A token balance that can never be negative", "uint", "Balances are unsigned."], ["A temperature that may be below zero", "int", "Needs a sign."], ["Whether voting is open", "bool", "True or false."], ["The account that deployed the contract", "addr", "Holds an account address."], ["A person's display name", "str", "A string holds text."], ["How much each address has deposited", "map", "A lookup from address to number."], ["The number of tickets sold", "uint", "Counts are unsigned."], ["Whether a user has already claimed", "bool", "A flag."]],
  }),
  sheetLab({
    id: "s2-int-limits", module: "setting-up-and-basics", title: "How big can an integer be?", level: "beginner", minutes: 12, xp: 40, skills: [SK], required: false,
    objective: "Work out the largest value for each unsigned integer size and see why uint256 is so big.",
    scenario: "A uint of n bits can hold values from 0 to 2^n minus 1. Smaller sizes can save storage when packed together, but they overflow sooner.",
    steps: ["In C2 work out 2 to the power of the bits in B2 with POWER.", "In D2 work out the largest value: C2 minus 1.", "Fill down rows 2 to 6.", "In B9 show Too small if the largest uint8 value (D2) is less than 1,000, using IF."],
    cells: { A1: "Type", B1: "Bits", C1: "Number of values", D1: "Largest value", A2: "uint8", B2: "8", A3: "uint16", B3: "16", A4: "uint32", B4: "32", A5: "uint64", B5: "64", A6: "uint128", B6: "128", A9: "Can uint8 count 1,000 seats?" }, view: { cols: 4, rows: 11 },
    checks: [
      ck("c2", "C2 is 2^8", "=POWER(2,B2)", "Two to the number of bits.", S.formula("C2", { fns: ["POWER"], equals: 256 })),
      ck("d2", "D2 is 255", "=C2-1", "The largest value is one less.", S.formula("D2", { equals: 255 })),
      ck("d4", "D4 is the largest uint32", "Fill down.", "2^32 minus 1.", S.formula("D4", { equals: 4294967295 })),
      ck("v", "B9 is the verdict", "=IF(D2<1000,\"Too small\",\"Fine\")", "255 cannot count to 1,000.", S.formula("B9", { fns: ["IF"], equals: "Too small" })),
    ],
    solution: { cells: Object.assign({ B9: "=IF(D2<1000,\"Too small\",\"Fine\")" }, ...[2, 3, 4, 5, 6].map((r) => ({ [`C${r}`]: `=POWER(2,B${r})`, [`D${r}`]: `=C${r}-1` }))) },
  }),
  classifyLab({
    id: "s3-errors", module: "control-flow-and-functions", title: "require, revert or assert?", level: "intermediate", minutes: 9, xp: 35, skills: [SK], required: true,
    objective: "Pick the right way to stop a transaction.", scenario: "Solidity has three ways to fail. Each fits a different situation.",
    steps: ["Read each situation.", "Choose the best mechanism.", "Press Check my work."],
    categories: [["require", "require(condition, message)"], ["revert", "revert CustomError()"], ["assert", "assert(condition)"]],
    items: [["Reject a user who sent zero ETH, with a readable message", "require", "Input validation."], ["Reject a caller who is not the owner, as cheaply as possible", "revert", "A custom error is cheaper."], ["Check an internal rule that should be impossible to break, such as total equals the sum of parts", "assert", "A broken invariant means a bug."], ["Stop when the deadline has passed", "revert", "Cheap, specific error."], ["Check that an argument is within a range", "require", "Validate input early."], ["Guard a calculation that, if wrong, shows the code itself is faulty", "assert", "Invariants."], ["Reject a withdrawal larger than the balance", "require", "Readable reason."], ["Return the reason NothingToRefund with no text", "revert", "Custom errors save gas."]],
  }),
  wordLab({
    id: "s4-trace-code", module: "control-flow-and-functions", title: "Trace the code by hand", level: "intermediate", minutes: 15, xp: 55, skills: [SK], required: false,
    objective: "Work out what a function returns by following it step by step.",
    scenario: "The function grade(score) returns 'A' for 90 or more, 'B' for 75 to 89, 'C' for 50 to 74 and 'Fail' below 50. The function sumTo(n) adds 1 + 2 + ... + n and reverts with 'Too big' if n is above 100. Write the result of grade(75), grade(89), grade(49), sumTo(4) and sumTo(101), and explain each in a sentence.",
    steps: ["Write five lines, one for each call.", "State the result: A, B, C, Fail, a number, or a revert.", "Explain each in a sentence.", "Keep it between 60 and 160 words."],
    checks: [
      ck("b", "grade(75) is B", "Write that grade(75) returns B.", "75 is at least 75 but below 90.", W.pattern("75[\\s\\S]{0,60}\\bB\\b", "grade(75) returning B")),
      ck("fail", "grade(49) is Fail", "Write that grade(49) returns Fail.", "49 is below 50.", W.pattern("49[\\s\\S]{0,60}fail", "grade(49) returning Fail")),
      ck("sum", "sumTo(4) is 10", "Write that sumTo(4) returns 10.", "1+2+3+4 = 10.", W.pattern("\\b10\\b", "the result 10")),
      ck("rev", "sumTo(101) reverts", "Write that sumTo(101) reverts with Too big.", "The require rejects it.", W.pattern("revert|too big", "a revert for 101")),
      ck("len", "Between 60 and 160 words", "Concise.", "Keep it short.", W.words(60, 160)),
    ],
    solution: "<p>grade(75) returns B, because 75 is not below 75 so the second branch applies.</p><p>grade(89) returns B too, since it is below 90 but at least 75.</p><p>grade(49) returns Fail, because it is below 50 and none of the branches matched.</p><p>sumTo(4) returns 10, because the loop adds 1, 2, 3 and 4 to the total.</p><p>sumTo(101) reverts with the message Too big, because the require checks that n is at most 100 before the loop runs.</p>",
  }),
  classifyLab({
    id: "s5-data-structures", module: "data-structures", title: "Mapping, array, struct or enum?", level: "intermediate", minutes: 9, xp: 35, skills: [SK], required: true,
    objective: "Choose the data structure that fits the job.", scenario: "Each Solidity data structure suits a different pattern of use.",
    steps: ["Read each need.", "Choose the structure.", "Press Check my work."],
    categories: [["map", "mapping"], ["arr", "array"], ["struct", "struct"], ["enum", "enum"]],
    items: [["Look up a user's balance quickly by their address", "map", "Constant-cost lookups."], ["Keep an ordered list you must loop over (kept small)", "arr", "Ordered and enumerable."], ["Group a student's name, grade and status together", "struct", "A custom record type."], ["Name the states Pending, Active and Closed", "enum", "A small fixed set of options."], ["Check whether an address has already voted", "map", "Address to bool."], ["Return the list of all registered addresses to a front end", "arr", "Mappings cannot be listed."], ["Store several related fields about one proposal", "struct", "A record."], ["Make a status impossible to set to an invalid number", "enum", "Limited to the defined values."]],
  }),
  sheetLab({
    id: "s6-loop-cost", module: "data-structures", title: "What does a loop cost?", level: "intermediate", minutes: 16, xp: 55, skills: [SK], required: false,
    objective: "Compare looping over an array with a direct mapping lookup in gas, and see why unbounded loops are dangerous.",
    scenario: "Reading a storage slot for the first time in a transaction costs about 2,100 gas. Looping over n items reads n slots. A mapping lookup reads one. The block gas limit is about 30 million. (Teaching figures.)",
    steps: ["In C2 work out the gas of looping over n items: n times the cost per read (B8).", "In D2 work out the gas of one mapping lookup: just the cost per read.", "In E2 work out how many times more the loop costs: C2 divided by D2.", "Fill down rows 2 to 6.", "In B10 work out the largest n that fits in a block: the block limit (B9) divided by the cost per read, rounded down with INT."],
    cells: { A1: "Items in the array", B1: "n", C1: "Gas to loop", D1: "Gas for one mapping lookup", E1: "Loop costs this many times more", A2: "10 users", B2: "10", A3: "100 users", B3: "100", A4: "1,000 users", B4: "1000", A5: "10,000 users", B5: "10000", A6: "100,000 users", B6: "100000", A8: "Cost per storage read (gas)", B8: "2100", A9: "Block gas limit", B9: "30000000", A10: "Largest n that fits in one block" }, view: { cols: 5, rows: 12 },
    checks: [
      ck("c2", "C2 is the loop cost for 10", "=B2*$B$8", "n times the read cost.", S.formula("C2", { equals: 21000 })),
      ck("d2", "D2 is one lookup", "=$B$8", "A single read.", S.formula("D2", { equals: 2100 })),
      ck("e2", "E2 is the ratio", "=C2/D2", "Loop over lookup.", S.formula("E2", { equals: 10 })),
      ck("c6", "C6 is the loop cost for 100,000", "Fill down.", "210 million gas, far over the limit.", S.formula("C6", { equals: 210000000 })),
      ck("b10", "B10 is the largest n", "=INT(B9/B8)", "The block limit divided by the read cost.", S.formula("B10", { fns: ["INT"], equals: Math.floor(30000000 / 2100) })),
    ],
    solution: { cells: Object.assign({ B10: "=INT(B9/B8)" }, ...[2, 3, 4, 5, 6].map((r) => ({ [`C${r}`]: `=B${r}*$B$8`, [`D${r}`]: `=$B$8`, [`E${r}`]: `=C${r}/D${r}` }))) },
  }),
  classifyLab({
    id: "s7-receive", module: "contracts-and-events", title: "What happens when ETH arrives?", level: "intermediate", minutes: 9, xp: 35, skills: [SK], required: true,
    objective: "Predict what a contract does when ETH is sent in different ways.", scenario: "A contract can receive ETH through a payable function, a receive function or a fallback. Match each situation to what happens.",
    steps: ["Read each situation.", "Choose what happens.", "Press Check my work."],
    categories: [["recv", "The receive function runs"], ["fallback", "The fallback function runs (if payable)"], ["payable", "The named payable function runs"], ["revert", "The transaction reverts"]],
    items: [["Someone sends ETH with empty data to a contract that has a receive function", "recv", "Plain transfers go to receive."], ["Someone calls tip() with 0.1 ETH and tip is payable", "payable", "The named function receives it."], ["Someone sends ETH with empty data to a contract that has no receive or payable fallback", "revert", "It cannot accept the ETH."], ["Someone sends ETH with data that matches no function to a contract with a payable fallback", "fallback", "Unmatched calls go to the fallback."], ["Someone calls a non-payable function and attaches ETH", "revert", "Not payable, so it rejects."], ["Someone sends ETH with empty data and the contract has only a payable fallback", "fallback", "If no receive, the fallback handles it."], ["Someone calls deposit() marked payable with 1 ETH", "payable", "A normal payable function."], ["A call to an unknown function with no fallback at all", "revert", "No function matches."]],
  }),
  wordLab({
    id: "s8-events-plan", module: "contracts-and-events", title: "Design the events for a contract", level: "intermediate", minutes: 14, xp: 50, skills: [SK], required: false,
    objective: "Decide which events a contract should emit and what each should contain.",
    scenario: "A Crowdfund contract accepts pledges, lets the creator withdraw if the goal is met, and lets backers refund if it is not. List the events it should emit.",
    steps: ["Write a bulleted list of at least three events.", "For each event, give its name and its arguments.", "Say which arguments should be indexed and why.", "Keep it between 70 and 180 words."],
    checks: [
      ck("list", "Three events in a list", "Use the bullet button.", "One bullet per event.", W.list(3, "ul")),
      ck("pledged", "A Pledged event", "Include Pledged.", "Backers' contributions.", W.contains("Pledged")),
      ck("refund", "A Refunded event", "Include Refunded.", "Money returning.", W.contains("Refunded")),
      ck("indexed", "Mentions indexed", "Mention indexed.", "Indexed arguments can be searched.", W.contains("indexed")),
      ck("len", "Between 70 and 180 words", "Concise.", "Keep it brief.", W.words(70, 180)),
    ],
    solution: "<ul><li>Pledged(address indexed backer, uint256 amount): emitted on every pledge so a front end can show the live total and the list of backers.</li><li>Withdrawn(uint256 amount): emitted once when the creator takes the funds after a successful campaign.</li><li>Refunded(address indexed backer, uint256 amount): emitted when a backer gets their money back after a failed campaign.</li></ul><p>The backer address is indexed so that an app can quickly find all the events for one person, while the amount is left unindexed because it is just data that is read, not searched.</p>",
  }),
  classifyLab({
    id: "s9-inheritance", module: "inheritance-and-interfaces", title: "Inheritance vocabulary", level: "intermediate", minutes: 9, xp: 35, skills: [SK], required: true,
    objective: "Use the words of inheritance and interfaces correctly.", scenario: "Solidity supports inheritance, interfaces and libraries. Match each description to its keyword or idea.",
    steps: ["Read each description.", "Choose the term.", "Press Check my work."],
    categories: [["is", "contract B is A"], ["interface", "interface"], ["override", "override"], ["abstract", "abstract contract"], ["library", "library"]],
    items: [["B inherits all the state and functions of A", "is", "The is keyword."], ["Lists function signatures only; no bodies and no state", "interface", "A contract's public shape."], ["Marks a function that replaces one from a parent or implements an interface function", "override", "Required explicitly."], ["A contract that is never deployed on its own because it leaves some functions unimplemented", "abstract", "A partial template."], ["Reusable code without its own storage, such as math helpers", "library", "Shared code."], ["Greeter gets onlyOwner from Base", "is", "Inheritance."], ["Lets two contracts talk to each other without knowing the full code", "interface", "A contract at an address can be called through its interface."], ["IERC20 describes the token functions", "interface", "A standard interface."]],
  }),
  wordLab({
    id: "s10-interface-design", module: "inheritance-and-interfaces", title: "Design an interface", level: "intermediate", minutes: 16, xp: 55, skills: [SK], required: false,
    objective: "Write the interface for a vault contract so that other contracts can use it.",
    scenario: "Design the interface IVault for a contract that lets users deposit ETH, check their balance, withdraw and see the total held.",
    steps: ["List at least four function signatures in a bulleted list, such as deposit, balanceOf, withdraw and totalHeld.", "For each, say if it is view, payable or state-changing.", "Add one event that the vault should emit.", "Keep it between 70 and 180 words."],
    checks: [
      ck("list", "Four functions", "Use the bullet button.", "One bullet per function.", W.list(4, "ul")),
      ck("names", "Uses sensible names", "Include deposit and withdraw.", "Clear naming.", W.pattern("deposit[\\s\\S]*withdraw|withdraw[\\s\\S]*deposit", "deposit and withdraw")),
      ck("payable", "Marks deposit payable", "Mention payable.", "Deposit receives ETH.", W.contains("payable")),
      ck("view", "Marks reads as view", "Mention view.", "Reads are view.", W.contains("view")),
      ck("event", "Names an event", "Mention an event.", "Apps follow events.", W.contains("event")),
      ck("len", "Between 70 and 180 words", "Concise.", "Short and clear.", W.words(70, 180)),
    ],
    solution: "<ul><li>deposit() external payable: a state-changing function that accepts ETH and records it for the caller.</li><li>balanceOf(address who) external view returns (uint256): reads the amount held for an address.</li><li>withdraw(uint256 amount) external: a state-changing function that pays the caller up to their balance.</li><li>totalHeld() external view returns (uint256): reads the total ETH in the vault.</li></ul><p>The vault should emit an event Deposited(address indexed from, uint256 amount) and a matching Withdrawn event so that apps can follow activity.</p>",
  }),
  wordLab({
    id: "s11-review", module: "build-a-project", title: "Review a contract for bugs", level: "challenge", minutes: 20, xp: 70, skills: [SK], required: true,
    objective: "Find and explain problems in a contract described in words, and say how to fix each.",
    scenario: "A student's Raffle contract works like this: anyone calls enter() with exactly 0.1 ETH; the owner calls pickWinner(), which chooses the winner using block.timestamp modulo the number of players, then sends the whole balance to the winner with transfer-style code that ignores whether the send worked, and only afterwards clears the players array. The owner can call pickWinner at any time, even with one player. Review it.",
    steps: ["Add Heading 2 sections: Problems, Fixes.", "Under Problems list at least four issues in bullets.", "Under Fixes write a numbered list of at least four fixes matching them.", "Mention randomness and the ignored result of sending ETH.", "Keep it between 120 and 280 words."],
    checks: [
      ck("heads", "Two sections", "Use Heading 2.", "Problems then fixes.", W.heading(2, 2)),
      ck("order", "In order", "Problems, then Fixes.", "Diagnose then repair.", W.order(["Problems", "Fixes"])),
      ck("problems", "Four problems", "Use the bullet button.", "List the issues.", W.list(4, "ul")),
      ck("fixes", "Four fixes", "Use the numbered list button.", "Match each problem.", W.list(4, "ol")),
      ck("random", "Mentions weak randomness", "Mention random or timestamp.", "block.timestamp can be influenced.", W.pattern("random|timestamp", "weak randomness")),
      ck("send", "Mentions the ignored send result", "Mention checking the result or success flag.", "Failed sends must be handled.", W.pattern("result|success|ok flag|return value|check", "checking the send result")),
      ck("len", "Between 120 and 280 words", "Concise.", "Be efficient.", W.words(120, 280)),
    ],
    solution: "<h2>Problems</h2><ul><li>The winner is chosen with block.timestamp, which a block producer can influence, so the randomness is not fair.</li><li>The contract ignores whether the ETH was actually sent, so a failed send leaves the money stuck while the raffle resets.</li><li>The players array is cleared only after the payment, which breaks the safe order of checks, effects and interactions.</li><li>The owner can pick a winner at any time, even with one player or before the raffle ends, so there is no fair deadline.</li></ul><h2>Fixes</h2><ol><li>Use a verifiable randomness service or a commit and reveal scheme instead of block data.</li><li>Check the success flag of the call and revert if the transfer fails.</li><li>Clear the players and set the state before sending any ETH.</li><li>Add a deadline and a minimum number of players before pickWinner can be called.</li></ol>",
  }),
  sheetLab({
    id: "s12-crowdfund-maths", module: "build-a-project", title: "The numbers behind a crowdfund", level: "intermediate", minutes: 16, xp: 55, skills: [SK], required: false,
    objective: "Calculate progress, the funding verdict and refunds for a Crowdfund campaign.",
    scenario: "A campaign has a goal of 5 ETH. Backers pledged the amounts below. Work out progress, whether it succeeded, and what each backer gets back if it fails. (Amounts in ETH.)",
    steps: ["In B8 total the pledges with SUM.", "In B9 work out the progress: raised divided by the goal.", "In B10 show Funded if raised is at least the goal, else Refund.", "In C2 work out each backer's share of the total raised: pledge divided by raised. Fill down.", "In D2 work out each backer's refund if the campaign failed: their pledge if B10 is Refund, otherwise 0. Fill down."],
    cells: { A1: "Backer", B1: "Pledge (ETH)", C1: "Share of total", D1: "Refund", A2: "Asha", B2: "1.2", A3: "Ben", B3: "0.8", A4: "Chitra", B4: "1.5", A5: "Dev", B5: "0.7", A7: "Goal (ETH)", B7: "5", A8: "Total raised", A9: "Progress", A10: "Outcome" }, view: { cols: 4, rows: 12 },
    checks: [
      ck("t", "B8 is the total", "=SUM(B2:B5)", "Add the pledges.", S.formula("B8", { fns: ["SUM"], equals: 4.2 })),
      ck("p", "B9 is the progress", "=B8/B7", "Raised over goal.", S.formula("B9", { equals: 4.2 / 5 })),
      ck("o", "B10 is Refund", "=IF(B8>=B7,\"Funded\",\"Refund\")", "The goal was missed.", S.formula("B10", { fns: ["IF"], equals: "Refund" })),
      ck("c2", "C2 is Asha's share", "=B2/$B$8", "Pledge over total.", S.formula("C2", { equals: 1.2 / 4.2 })),
      ck("d4", "D4 is Chitra's refund", "=IF($B$10=\"Refund\",B4,0)", "A refund equals the pledge when the goal failed.", S.formula("D4", { fns: ["IF"], equals: 1.5 })),
    ],
    solution: { cells: Object.assign({ B8: "=SUM(B2:B5)", B9: "=B8/B7", B10: "=IF(B8>=B7,\"Funded\",\"Refund\")" }, ...[2, 3, 4, 5].map((r) => ({ [`C${r}`]: `=B${r}/$B$8`, [`D${r}`]: `=IF($B$10="Refund",B${r},0)` }))) },
  }),
  wordLab({
    id: "cap-escrow", module: "capstone", title: "Final project: design an Escrow contract", level: "challenge", minutes: 35, xp: 160, skills: [SK], required: true,
    objective: "Design, specify and review a complete small contract before writing any code.",
    scenario: "Design an Escrow contract: a buyer deposits ETH for a seller, the buyer releases the money when happy, the seller can refund the buyer, and if neither acts within 14 days an arbiter chosen at deployment decides.",
    steps: ["Add a Heading 1 'Escrow: design document'.", "Add Heading 2 sections: Purpose, State, Functions, Events and errors, Security review, Tests.", "Under State list at least five variables with their types in bullets.", "Under Functions list at least five functions with who may call each.", "Under Security review mention reentrancy and checks-effects-interactions.", "Under Tests write a numbered list of at least six tests including failures.", "Keep it between 260 and 520 words."],
    checks: [
      ck("t", "A title", "Use Heading 1.", "Name the document.", W.heading(1, 1)),
      ck("secs", "Six sections", "Use Heading 2.", "A design document has structure.", W.heading(6, 2)),
      ck("order", "In order", "Purpose, State, Functions, Events and errors, Security review, Tests.", "From why to tests.", W.order(["Purpose", "State", "Functions", "Events and errors", "Security review", "Tests"])),
      ck("state", "Five or more state variables", "Use the bullet button.", "List state.", W.list(5, "ul")),
      ck("tests", "Six tests", "Use the numbered list button.", "Test plan.", W.list(6, "ol")),
      ck("reent", "Mentions reentrancy", "Mention reentrancy and checks-effects-interactions.", "Security matters.", W.pattern("reentran[\\s\\S]*(checks|effects)|(checks|effects)[\\s\\S]*reentran", "reentrancy and checks-effects-interactions")),
      ck("arb", "Mentions the arbiter and the 14 days", "Mention arbiter and 14 days.", "The business rule.", W.pattern("arbiter[\\s\\S]*14|14[\\s\\S]*arbiter", "the arbiter and 14 days")),
      ck("len", "Between 260 and 520 words", "A page or so.", "Design documents must be readable.", W.words(260, 520)),
    ],
    solution: "<h1>Escrow: design document</h1><h2>Purpose</h2><p>Hold a buyer's ETH until the buyer is satisfied, so neither side has to trust the other. If neither acts within 14 days, an arbiter chosen at deployment decides who receives the money.</p><h2>State</h2><ul><li>address public immutable buyer: who deposits and releases.</li><li>address public immutable seller: who is paid on release.</li><li>address public immutable arbiter: who decides after the deadline.</li><li>uint256 public amount: the deposited amount in wei.</li><li>uint256 public deadline: the time after which the arbiter may decide.</li><li>enum State { Created, Funded, Released, Refunded }: the stage of the deal.</li></ul><h2>Functions</h2><ul><li>constructor(seller, arbiter): sets the parties, called once by the buyer at deployment.</li><li>fund(): payable, only the buyer, once; stores the amount and sets the deadline to 14 days ahead.</li><li>release(): only the buyer, pays the seller.</li><li>refund(): only the seller, returns the money to the buyer.</li><li>arbitrate(bool payTheSeller): only the arbiter and only after the deadline.</li></ul><h2>Events and errors</h2><p>Funded, Released and Refunded events carry the amount. Custom errors: NotBuyer, NotSeller, NotArbiter, WrongState and TooEarly.</p><h2>Security review</h2><p>Every payout sets the state to Released or Refunded before sending any ETH, following checks-effects-interactions, and the result of each call is checked, so a malicious seller contract cannot use reentrancy to take the money twice. The arbiter cannot act before the deadline, and nobody can fund twice.</p><h2>Tests</h2><ol><li>The buyer funds and the state becomes Funded.</li><li>A non-buyer funding the contract reverts.</li><li>The buyer releases and the seller receives exactly the amount.</li><li>The seller refunds and the buyer receives exactly the amount.</li><li>Releasing twice reverts because the state is no longer Funded.</li><li>The arbiter acting before 14 days reverts with TooEarly.</li><li>The arbiter acting after 14 days pays the chosen party.</li></ol>",
  }),
];

const M1 = module_({
  slug: "setting-up-and-basics", title: "Setting up and the basics", hours: 2, level: "Foundations",
  summary: "Your first environment, the structure of a Solidity file, the basic types and the difference between constants, immutables and state variables.",
  outcome: "You can open Remix, read the structure of a contract and choose the right type for a piece of data.",
  intro: "Solidity looks like a blend of JavaScript and C, with a few concepts that exist only because the code runs on a blockchain. This module gets you set up and builds the vocabulary you need to read any contract.",
  topics: [
    topic({
      title: "Your workspace: Remix", slug: "remix",
      blocks: [
        p("You do not need to install anything to start. **Remix** is a free development environment that runs in your web browser (remix.ethereum.org). It has an editor, a compiler, a built-in test blockchain with fake accounts and ETH, and a panel for calling your contracts."),
        table("The parts of Remix you will use", ["Panel", "What it is for"], [["File explorer", "Create and edit .sol files"], ["Solidity compiler", "Pick the compiler version and compile; errors appear with line numbers"], ["Deploy and run", "Choose an environment, deploy a contract and call its functions"], ["Terminal", "Shows transactions, logs, gas and error messages"]]),
        flow("Your edit-compile-deploy loop", ["Edit the code", "Compile (watch for errors)", "Deploy to the built-in test chain", "Call functions and read the logs", "Fix and repeat"]),
        tip("Always check the compiler version matches your pragma. A mismatch is a very common first error."),
        miniQuiz("remix-mini", [["What does the built-in Remix environment give you?", ["Real ETH", "A test blockchain with fake accounts and ETH", "A bank account", "A hardware wallet"], 1, "Safe practice."]]),
      ],
      points: ["Remix is a free browser tool with an editor, compiler and test chain.", "The loop is edit, compile, deploy, call, repeat."],
      check: [["The first thing to check when a compile fails with a version message is:", ["The wallet", "The pragma and the compiler version", "The fee", "The block"], 1, "They must be compatible."]],
    }),
    topic({
      title: "The structure of a contract", slug: "structure",
      blocks: [
        code("solidity", basics, "Basics.sol"),
        table("Parts of the file", ["Line", "What it does"], [["// SPDX-License-Identifier: MIT", "States the licence of the code"], ["pragma solidity ^0.8.20;", "Allowed compiler versions"], ["contract Basics { ... }", "The container for state and functions"], ["constant", "A value fixed when you write the code; costs no storage"], ["immutable", "A value set once in the constructor and fixed afterwards; cheap to read"], ["public", "Creates a free getter for the variable"], ["constructor", "Runs once, at deployment"]]),
        p("Comments start with // or sit between /* and */. Statements end with a semicolon. Blocks use curly braces. Names are case-sensitive, and by convention contracts are in PascalCase and variables in camelCase."),
        miniQuiz("structure-mini", [["When does a constructor run?", ["Every call", "Once, at deployment", "Every block", "Only when ETH arrives"], 1, "It sets up initial state."]]),
      ],
      points: ["A file has a licence line, a pragma and contracts.", "constant and immutable values save gas compared with storage."],
      check: [["An immutable variable is set:", ["In the constructor, then fixed", "Every call", "By users", "In memory"], 0, "It cannot change afterwards."]],
    }),
    topic({
      title: "Types and global variables", slug: "types",
      blocks: [
        table("Value types", ["Type", "Holds", "Example"], [["uint8 ... uint256", "Unsigned whole numbers of a given size", "uint256 balance = 100;"], ["int8 ... int256", "Signed whole numbers", "int256 change = -5;"], ["bool", "true or false", "bool open = true;"], ["address", "A 20-byte account address", "address owner;"], ["address payable", "An address that can receive ETH via transfer-style calls", "address payable seller;"], ["bytes1 ... bytes32", "Fixed-size raw bytes", "bytes32 tag;"], ["enum", "A named list of options", "enum Status { Open, Closed }"]]),
        table("Reference types", ["Type", "Holds", "Where it lives"], [["string", "Text", "Storage, memory or calldata"], ["bytes", "A dynamic byte array", "Storage, memory or calldata"], ["arrays", "Lists of one type", "Storage, memory or calldata"], ["struct", "A group of named fields", "Storage, memory or calldata"], ["mapping", "A lookup table", "Storage only"]]),
        table("Global variables you will use constantly", ["Name", "Meaning"], [["msg.sender", "The address that called the current function"], ["msg.value", "The wei sent with the call"], ["block.timestamp", "The time of the current block, in seconds"], ["block.number", "The current block number"], ["address(this)", "This contract's own address"], ["address(this).balance", "This contract's ETH balance in wei"]]),
        explorer({ id: "sol-uint", title: "How big can an integer be?", intro: "Change the number of bits to see how many values a uint of that size can hold.", inputs: [{ id: "bits", label: "Bits", min: 8, max: 64, step: 8, value: 8 }], outputs: [{ label: "Largest value", expr: "2 ^ bits - 1", unit: "n" }] }),
        warn("Solidity has no decimals. To handle fractions you use whole numbers with an agreed scale: for example, amounts in wei (10^-18 ETH) or percentages in basis points."),
      ],
      points: ["Choose the smallest sensible type; Solidity has no decimals.", "msg.sender, msg.value and block.timestamp are the most-used globals."],
      check: [["address(this).balance is:", ["The caller's balance", "This contract's ETH balance in wei", "The block number", "The gas price"], 1, "The contract's own holdings."]],
    }),
  ],
  terms: [["Remix", "A browser-based IDE for Solidity"], ["pragma", "Sets the compiler version range"], ["constant", "A value fixed in the code"], ["immutable", "A value fixed at deployment"], ["address", "A 20-byte account identifier"], ["wei", "The smallest unit of ETH"]],
  practical: { title: "Practical: your first compile", intro: "Open Remix.", steps: ["Create Basics.sol and paste the code.", "Compile it.", "Deploy and read MAX_SEATS, owner and open.", "Change a value and redeploy."] },
  quiz: [
    ["The pragma line sets:", ["The compiler versions allowed", "The network", "The fee", "The owner"], 0, "Compatibility."],
    ["A constant is fixed:", ["In the code", "At deployment only", "By the owner", "By users"], 0, "At compile time."],
    ["An immutable is fixed:", ["At deployment in the constructor", "At compile time", "By each call", "Never"], 0, "Cheap to read."],
    ["A uint can hold:", ["Negative numbers", "Non-negative whole numbers", "Decimals", "Text"], 1, "Unsigned integers cannot hold negative numbers."],
    ["Solidity has no:", ["Decimals", "Integers", "Booleans", "Addresses"], 0, "Use scaled integers."],
    ["block.timestamp is:", ["The block's time in seconds", "The gas price", "The sender", "The nonce"], 0, "Do not use it for randomness."],
    ["A mapping lives in:", ["Storage only", "Memory only", "Calldata", "The stack"], 0, "It cannot be a local variable."],
  ],
});

const M2 = module_({
  slug: "control-flow-and-functions", title: "Control flow and functions", hours: 2.5, level: "Core skills",
  summary: "Conditions, loops, functions, modifiers and the three ways to stop a transaction.",
  outcome: "You can write functions with the right visibility and mutability, use modifiers for access control and choose between require, revert and assert.",
  intro: "Real contracts are built from small functions with clear rules about who may call them and when they must fail. This module teaches the control structures and the safety tools that go with them.",
  topics: [
    topic({
      title: "Conditions and loops", slug: "conditions-loops",
      blocks: [
        code("solidity", controlFlow, "ControlFlow.sol"),
        p("Conditions use if, else if and else. Loops use for and while, but remember that every iteration costs gas, so loops over data that can grow without limit are dangerous: one day the loop costs more than a block can hold, and the function becomes impossible to call."),
        table("Safe and unsafe loop habits", ["Safe", "Unsafe"], [["Loop a small, fixed number of times", "Loop over every user in an array that anyone can add to"], ["Let users act on their own item (pull)", "Pay everyone in one transaction (push)"], ["Cap the input with require", "Trust the input size"], ["Process in batches across several transactions", "Process everything at once"]]),
        miniQuiz("loops-mini", [["Why is looping over a growing array risky?", ["It is slow only on test networks", "Gas can exceed the block limit, making the function unusable", "Loops are not allowed", "It uses memory"], 1, "Unbounded work is a denial-of-service risk."]]),
        explorer({ id: "sol-sum", title: "The sum loop", intro: "The function sumTo(n) adds 1 to n. Change n to see the result and a rough gas figure (a teaching estimate of about 100 gas per iteration).", inputs: [{ id: "n", label: "n", min: 1, max: 100, step: 1, value: 10 }], outputs: [{ label: "sumTo(n)", expr: "n * (n + 1) / 2", unit: "n" }, { label: "Rough extra gas", expr: "n * 100", unit: "n" }] }),
      ],
      points: ["if/else and for/while work as in other languages.", "Avoid loops whose cost grows without limit."],
      check: [["A safe design usually lets each user:", ["Pay everyone", "Pull their own payment", "Loop over all users", "Wait for the owner"], 1, "Pull over push."]],
    }),
    topic({
      title: "Functions, visibility and mutability", slug: "functions",
      blocks: [
        table("Visibility", ["Keyword", "Callable from"], [["external", "Outside only"], ["public", "Outside and inside"], ["internal", "This contract and children"], ["private", "This contract only"]]),
        table("State mutability", ["Keyword", "Meaning", "Costs gas when called from outside?"], [["(none)", "May read and write state", "Yes, in a transaction"], ["view", "Reads state, does not write it", "No"], ["pure", "Neither reads nor writes state", "No"], ["payable", "May receive ETH", "Yes"]]),
        p("A function signature has the shape: function name(type argument, ...) visibility mutability returns (type). Return values can be named. Functions can return more than one value."),
        example("Reading a signature", "function setValue(uint256 newValue) external onlyOwner whenNotPaused", ["external: callable from outside the contract.", "uint256 newValue: one input.", "onlyOwner and whenNotPaused: two modifiers that run checks first.", "No view or pure, so it changes state and needs a transaction."], "Signatures tell you who can call, what it takes and what it can do."),
        miniQuiz("functions-mini", [["A function marked pure may:", ["Read storage", "Use only its arguments and local variables", "Send ETH", "Emit events"], 1, "No state, no chain data."]]),
      ],
      points: ["Visibility says who can call; mutability says what it can do.", "view and pure functions are free to call from outside."],
      check: [["internal visibility means:", ["Anyone can call", "This contract and its children only", "Only outside", "Nobody"], 1, "Not exposed externally."]],
    }),
    topic({
      title: "Modifiers and errors", slug: "modifiers-errors",
      blocks: [
        code("solidity", guarded, "Guarded.sol"),
        p("A **modifier** is a reusable check. The underscore _ marks where the function body runs. Stacking modifiers keeps functions short: onlyOwner whenNotPaused says everything about who and when."),
        table("Ways to fail", ["Tool", "Use it for", "Notes"], [["require(cond, \"message\")", "Validating inputs and conditions", "Readable messages, slightly more gas"], ["revert CustomError()", "Cheap, specific failures", "Define errors with error Name();"], ["assert(cond)", "Invariants that must never be false", "A failure means a bug in your code"]]),
        miniQuiz("modifiers-mini", [["What does the underscore in a modifier mean?", ["End of file", "The function body runs here", "A comment", "A private variable"], 1, "The body is inserted at that point."]]),
        mistakes(["Putting the whole access check into every function instead of a modifier.", "Using assert for user input, which signals a bug instead of a bad request.", "Forgetting that a revert undoes every change made in the transaction."]),
      ],
      points: ["Modifiers reuse checks; the underscore marks where the body runs.", "Use require for input, custom errors for cheap failures and assert for invariants."],
      check: [["A revert:", ["Keeps partial changes", "Undoes all changes in the transaction", "Mines a block", "Pays a bonus"], 1, "Atomic failure."]],
    }),
  ],
  terms: [["Visibility", "Who may call a function"], ["Mutability", "Whether a function may change state"], ["Modifier", "A reusable pre-check"], ["revert", "Undo the transaction"], ["assert", "Check an invariant"], ["Custom error", "A named, cheap error type"]],
  practical: { title: "Practical: break the guard", intro: "Deploy Guarded in Remix.", steps: ["Call setValue as the owner.", "Switch account and try again.", "Pause, then try setValue as the owner.", "Note which error each case gives."] },
  quiz: [
    ["external functions are called:", ["Only from outside", "Only inside", "By anyone including inside", "Never"], 0, "Not from within the contract directly."],
    ["view means:", ["It may change state", "It does not change state", "It receives ETH", "It is private"], 1, "A view function reads state but never writes it."],
    ["pure means:", ["Reads storage", "Uses neither state nor chain data", "Is payable", "Is slow"], 1, "Only arguments."],
    ["A modifier's underscore marks:", ["Where the body runs", "The end", "A comment", "A type"], 0, "The function body is inserted."],
    ["require is best for:", ["Input validation", "Impossible states", "Comments", "Loops"], 0, "Readable checks."],
    ["assert failing means:", ["Bad input", "A bug in the contract", "A low fee", "A paused state"], 1, "An invariant was broken."],
    ["Unbounded loops are:", ["Safe", "A gas and availability risk", "Required", "Free"], 1, "They can exceed the block limit."],
  ],
});

const M3 = module_({
  slug: "data-structures", title: "Data structures", hours: 2.5, level: "Core skills",
  summary: "Mappings, arrays, structs and enums, and how to use them well.",
  outcome: "You can model real data with structs and mappings, know why mappings cannot be listed and use arrays safely.",
  intro: "Good contracts model their data carefully. Mappings give instant lookups, arrays give ordered lists, structs group related fields and enums name the stages of a process. Choosing among them well is a large part of writing efficient and safe code.",
  topics: [
    topic({
      title: "A registry: structs, mappings and enums", slug: "registry",
      blocks: [
        code("solidity", registry, "Registry.sol"),
        table("What each piece does", ["Piece", "Purpose"], [["enum Status { Pending, Active, Closed }", "Names the stages; internally just numbers 0, 1, 2"], ["struct Student { name; grade; status }", "Groups the fields of one record"], ["mapping(address => Student) public students", "Looks up a student by address in constant cost"], ["address[] public ids", "Keeps a list of registered addresses so a front end can enumerate them"], ["bytes(name).length == 0", "A way to check whether a string is empty or a mapping entry is unused"], ["calldata", "A cheap read-only location for external inputs"]]),
        p("Notice the three require lines. They check the name, the range of the grade and that the sender has not already enrolled. Validating early means the rest of the function can assume the input is good."),
        miniQuiz("registry-mini", [["Why does the Registry keep an ids array as well as the mapping?", ["Mappings cannot be looped over or listed", "Arrays are cheaper", "Mappings are slow", "It is required"], 0, "A mapping has no list of its keys."]]),
      ],
      points: ["Structs group fields; mappings look up by key; arrays keep lists.", "Mappings cannot be listed, so keep an array of keys when you need to."],
      check: [["An enum is stored as:", ["Text", "A small number", "An address", "A struct"], 1, "Names for 0, 1, 2 and so on."]],
    }),
    topic({
      title: "Storage, memory and calldata in practice", slug: "locations",
      blocks: [
        p("For reference types such as arrays, strings and structs, you must say where they live. This matters for both correctness and cost."),
        table("Rules of thumb", ["Location", "Use when", "Remember"], [["storage", "Referring to persistent state, or changing it", "A storage pointer changes the original"], ["memory", "Building or changing temporary data inside a function", "A memory copy does not change storage"], ["calldata", "Reading external function inputs without copying", "Read-only and cheapest"]]),
        example("A common surprise", "A function copies a struct from storage into memory and changes it.", ["Student memory s = students[addr];", "s.grade = 12;", "The change affects only the memory copy, and storage is unchanged.", "To change the stored value use Student storage s = students[addr]; or write students[addr].grade = 12;"], "Copies change nothing in storage."),
        list("Habits", ["Use calldata for external inputs you only read.", "Use storage pointers to modify state without copying.", "Avoid copying large arrays from storage to memory.", "Use delete to clear a value and get a gas refund."], true),
        miniQuiz("locations-mini", [["You copy a struct from storage to memory and edit it. What happens to the stored struct?", ["It changes too", "It stays unchanged", "It is deleted", "It becomes calldata"], 1, "Memory is a separate copy."]]),
      ],
      points: ["storage persists, memory is temporary, calldata is read-only input.", "Editing a memory copy does not change storage."],
      check: [["To modify stored data without copying, use a:", ["memory variable", "storage pointer", "calldata variable", "pure function"], 1, "It refers to the original."]],
    }),
    topic({
      title: "Choosing and using arrays safely", slug: "arrays",
      blocks: [
        table("Choosing a structure", ["Need", "Use"], [["Fast lookup by key", "mapping"], ["Ordered list that you must loop over (small)", "array"], ["A record with several fields", "struct"], ["A fixed set of stages", "enum"], ["Both lookup and listing", "mapping plus an array of keys"]]),
        explorer({ id: "sol-loopcost", title: "The cost of looping", intro: "Change the number of items to see how a loop's gas grows linearly while a mapping lookup stays flat. A teaching estimate: 2,100 gas per first read of a storage slot.", inputs: [{ id: "n", label: "Items in the array", min: 1, max: 20000, step: 1, value: 1000 }], outputs: [{ label: "Gas to loop over all", expr: "n * 2100", unit: "n" }, { label: "Gas for one mapping lookup", expr: "2100", unit: "n" }, { label: "Fits in a 30 million gas block?", expr: "min(1, floor(30000000 / (n * 2100)))", unit: "n" }] }),
        mistakes(["Removing array items by shifting every later item.", "Letting anyone push to an array that you later loop over.", "Using an array when a mapping would do."]),
        tip("A useful trick to remove an item cheaply: move the last item into the gap and pop the array. It changes the order, which is fine when order does not matter."),
        miniQuiz("arrays-mini", [["Which is the cheapest way to check if an address has voted?", ["Loop over an array of voters", "A mapping from address to bool", "A string", "An event"], 1, "Constant-cost lookup."]]),
      ],
      points: ["Use mappings for lookups and arrays for short, ordered lists.", "Never loop over data that outsiders can grow without limit."],
      check: [["To remove an array item cheaply when order does not matter:", ["Shift all items", "Swap in the last item and pop", "Delete the whole array", "Use a string"], 1, "Constant cost."]],
    }),
  ],
  terms: [["struct", "A custom record type"], ["mapping", "A key to value lookup table"], ["enum", "A named set of options"], ["calldata", "Read-only external input"], ["memory", "Temporary data"], ["storage", "Persistent data"]],
  practical: { title: "Practical: use the Registry", intro: "Deploy Registry in Remix.", steps: ["Enrol from two accounts.", "Read students and count.", "Try enrolling twice and see the error.", "Close one account and read its status."] },
  quiz: [
    ["A mapping can be:", ["Listed in full", "Looked up by key but not enumerated", "Passed as calldata", "Looped over"], 1, "Keep a keys array if you need a list."],
    ["A struct is:", ["A record of named fields", "A kind of loop", "A function", "An event"], 0, "Group related data."],
    ["enum values are:", ["Text", "Numbers behind the scenes", "Addresses", "Events"], 1, "0, 1, 2 and so on."],
    ["Calldata is:", ["Writable", "Read-only and cheap", "Permanent", "Secret"], 1, "For external inputs."],
    ["A memory copy:", ["Changes storage", "Does not change storage", "Is permanent", "Is free"], 1, "Separate copy."],
    ["A loop over a growing array is:", ["Safe", "A risk", "Required", "Cheap"], 1, "Gas grows linearly."],
    ["To have lookup and listing:", ["Use only a mapping", "Use a mapping plus an array of keys", "Use only an array", "Use events"], 1, "Combine them."],
  ],
});

const M4 = module_({
  slug: "contracts-and-events", title: "Holding ETH, events and errors", hours: 2.5, level: "Applied skills",
  summary: "Receiving and sending ETH safely, events for apps, and custom errors.",
  outcome: "You can write a contract that accepts and pays out ETH using safe patterns, and emit events that apps can follow.",
  intro: "Most useful contracts handle money. Money handling is where small mistakes become expensive, so this module goes slowly: how ETH arrives, how it leaves, and how to tell the outside world what happened.",
  topics: [
    topic({
      title: "Receiving ETH", slug: "receiving",
      blocks: [
        code("solidity", vault, "Vault.sol"),
        table("Ways a contract can receive ETH", ["Mechanism", "When it runs"], [["A payable function such as deposit()", "When the function is called with ETH"], ["receive() external payable", "When ETH is sent with empty data (a plain transfer)"], ["fallback() external payable", "When ETH or data arrives that matches no function and there is no receive"], ["A constructor marked payable", "Only at deployment"]]),
        p("A contract with none of these rejects incoming ETH. A contract can also be forced to receive ETH by another contract that self-destructs or by a block producer's reward, so you should never rely on address(this).balance being exactly what your own records say."),
        miniQuiz("receive-mini", [["Which function handles a plain ETH transfer with empty data?", ["fallback only", "receive", "constructor", "withdraw"], 1, "That is what receive is for."]]),
        warn("Tracking your own balances in a mapping, rather than trusting address(this).balance, avoids a class of accounting bugs."),
      ],
      points: ["receive handles plain transfers; payable functions handle calls with ETH.", "Track balances in your own state."],
      check: [["A contract with no receive, fallback or payable function:", ["Accepts any ETH", "Rejects ETH sent to it", "Burns the ETH", "Refunds later"], 1, "The call reverts."]],
    }),
    topic({
      title: "Sending ETH safely", slug: "sending",
      blocks: [
        table("Three ways to send ETH", ["Method", "Gas forwarded", "Notes"], [["recipient.transfer(amount)", "2,300 (fixed)", "Older; can fail when the recipient needs more gas; no longer recommended"], ["recipient.send(amount)", "2,300", "Returns a bool; must be checked"], ["recipient.call{value: amount}(\"\")", "All available", "Recommended today; returns a bool you must check; requires reentrancy care"]]),
        flow("The safe withdrawal pattern", ["Check the caller has a balance", "Set their balance to zero (effects)", "Send with call", "Check the result and revert on failure", "Emit an event"]),
        p("The Vault's withdraw follows this order exactly. Because the balance is reduced before the external call, a recipient that calls back finds nothing left to take. The result of call is checked, so a failed payment undoes the whole transaction instead of silently losing track of the funds."),
        mistakes(["Sending before updating balances.", "Ignoring the boolean result of call or send.", "Sending ETH to many addresses in one loop, so one failing recipient blocks everyone."]),
        miniQuiz("sending-mini", [["Which method is generally recommended for sending ETH today?", ["transfer", "send", "call with value, checking the result", "selfdestruct"], 2, "It forwards enough gas and returns a status."]]),
      ],
      points: ["Use call with value, check the result and update state first.", "Prefer pull payments over looping pushes."],
      check: [["The safe order for a withdrawal is:", ["Send, then update", "Update, then send", "Never update", "Emit first"], 1, "Effects before interactions."]],
    }),
    topic({
      title: "Events and custom errors", slug: "events-errors",
      blocks: [
        p("Events are the contract's public log. Apps and explorers read them to show activity and to rebuild history cheaply, because storing history in variables is expensive. Up to three event parameters can be marked **indexed**, which makes them searchable by filters."),
        table("Designing events", ["Principle", "Example"], [["Emit one for every important state change", "Deposited, Withdrawn, OwnerChanged"], ["Index the things people search by", "address indexed user"], ["Include the data an app needs to display the change", "amount, new value"], ["Name them in the past tense", "Paused, not Pause"]]),
        table("Custom errors versus strings", ["", "require with string", "revert CustomError()"], [["Readability for users", "Message shown directly", "Wallets and explorers decode the name using the ABI"], ["Gas", "Stores the text in the bytecode and returns it", "Cheaper"], ["Extra data", "No", "Can carry arguments, such as error Insufficient(uint256 have, uint256 need)"]]),
        miniQuiz("errors-mini", [["What does marking an event parameter indexed allow?", ["Hiding it", "Searching and filtering logs by it", "Making it cheaper to store", "Changing its type"], 1, "Filters can match it."]]),
        tip("A good event list doubles as documentation: reading the events tells you what the contract is for."),
      ],
      points: ["Events are cheap logs; index what people search by.", "Custom errors are cheaper and can carry data."],
      check: [["Event names are conventionally:", ["Future tense", "Past tense", "Numbers", "Random"], 1, "They describe what happened."]],
    }),
  ],
  terms: [["receive", "Function for plain ETH transfers"], ["fallback", "Function for unmatched calls"], ["call", "Low-level call that can carry value"], ["Pull payment", "Recipients withdraw themselves"], ["Indexed", "Searchable event parameter"], ["Custom error", "A named, cheap error"]],
  practical: { title: "Practical: break the Vault in Remix", intro: "Deploy Vault.", steps: ["Send ETH with a plain transfer using the value box and the low-level interactions.", "Check deposits.", "Withdraw part of it.", "Try withdrawing more than you have."] },
  quiz: [
    ["receive() runs when:", ["ETH arrives with empty data", "A function is called with arguments", "A loop ends", "A block is mined"], 0, "A plain transfer."],
    ["call{value: x}(\"\") returns:", ["A bool you must check", "Nothing", "A string", "A hash"], 0, "And revert on failure."],
    ["The safe order is:", ["Interactions, effects", "Checks, effects, interactions", "Effects, checks", "Events, checks"], 1, "Update state before calling out."],
    ["Pull payments mean:", ["The contract pays everyone", "Recipients withdraw their own funds", "No payment", "The owner pays"], 1, "Avoids failing loops."],
    ["Up to how many parameters can be indexed?", ["Three", "One", "Ten", "None"], 0, "A maximum of three parameters can be indexed."],
    ["Custom errors are:", ["More expensive", "Cheaper and can carry data", "Not decodable", "Required for events"], 1, "Preferred in modern code."],
    ["address(this).balance can differ from your records because:", ["ETH can be forced in", "Fees", "Mining", "Nothing"], 0, "Do not rely on it for accounting."],
  ],
});

const M5 = module_({
  slug: "inheritance-and-interfaces", title: "Inheritance, interfaces and libraries", hours: 2.5, level: "Applied skills",
  summary: "Reusing code safely: inheritance, interfaces, libraries and trusted building blocks such as OpenZeppelin.",
  outcome: "You can extend a base contract, program to an interface and use audited building blocks instead of writing everything yourself.",
  intro: "Professional contracts are mostly assembled from reviewed building blocks, with only the unique part written fresh. This module shows how Solidity supports reuse and how to use well-tested libraries instead of reinventing them.",
  topics: [
    topic({
      title: "Inheritance and interfaces", slug: "inheritance",
      blocks: [
        code("solidity", inheritance, "Greeter.sol"),
        table("What is going on", ["Piece", "Meaning"], [["interface IGreeter", "Declares what a greeter must offer: only function signatures"], ["contract Base", "A parent with an owner and an onlyOwner modifier"], ["contract Greeter is Base, IGreeter", "Inherits from both: gets the owner and modifier, and promises to implement greet()"], ["override", "Needed when implementing an interface function or replacing a parent function"], ["onlyOwner on setGreeting", "Uses the inherited modifier"]]),
        p("An **interface** defines what other contracts can call without exposing the code. A contract that knows only the interface of another can talk to it at any address, which is how wallets, exchanges and tokens interact across projects."),
        list("Rules", ["A contract can inherit from several parents, with the order mattering.", "Interface functions are all external and have no bodies.", "Mark parent functions virtual if children may override them.", "Keep inheritance shallow: deep hierarchies are hard to read and audit."]),
        miniQuiz("inherit-mini", [["Why use an interface?", ["To make code run faster", "So contracts can talk to each other without knowing the code", "To store data", "To pay fees"], 1, "It defines a shared shape."]]),
      ],
      points: ["Inheritance reuses parent state and functions; interfaces define shape only.", "Keep hierarchies shallow."],
      check: [["The keyword that marks implementing an interface function is:", ["is", "override", "virtual", "abstract"], 1, "Explicit and required."]],
    }),
    topic({
      title: "Libraries and OpenZeppelin", slug: "libraries",
      blocks: [
        p("A **library** is reusable code without its own storage. Standard building blocks for tokens, access control and security are published as open-source libraries, and the most widely used is **OpenZeppelin Contracts**, which has been audited and used in thousands of projects. Reusing it is almost always safer than writing your own."),
        code("solidity", ozNotice, "Notice.sol (uses OpenZeppelin v5)"),
        table("What OpenZeppelin gives you", ["Module", "Provides"], [["Ownable", "A single owner and an onlyOwner modifier"], ["AccessControl", "Roles such as admin and minter"], ["ReentrancyGuard", "A lock to stop reentrancy"], ["Pausable", "An emergency stop"], ["ERC20, ERC721, ERC1155", "Standard tokens"], ["SafeERC20, Math, Address", "Helper libraries"]]),
        warn("Library versions change their APIs. For example, version 5 of Ownable requires you to pass the initial owner to its constructor, as in the example. Always read the documentation for the exact version you install, and pin that version."),
        miniQuiz("oz-mini", [["Why prefer OpenZeppelin to writing your own access control?", ["It is shorter only", "It is widely reviewed, audited and battle-tested", "It is free of risk", "It runs off-chain"], 1, "Reuse reduces the risk of new bugs."]]),
      ],
      points: ["Libraries share code without storage; OpenZeppelin provides audited building blocks.", "Pin versions and read the documentation."],
      check: [["OpenZeppelin v5's Ownable needs:", ["No constructor argument", "An initial owner passed to its constructor", "A wallet", "A fee"], 1, "Ownable(msg.sender)."]],
    }),
    topic({
      title: "Designing for reuse and safety", slug: "design",
      blocks: [
        table("Principles", ["Principle", "Why"], [["Small, single-purpose contracts", "Easier to test and audit"], ["Depend on interfaces, not implementations", "Swap parts without rewriting"], ["Prefer composition to deep inheritance", "Clarity"], ["Use audited libraries for common features", "Fewer bugs"], ["Document who can do what", "Users and auditors need to know"], ["Plan upgrades deliberately", "Immutable by default; upgrade only with strong governance"]]),
        example("A shape for a token vault", "You want a vault that holds tokens and can be paused.", ["Inherit Ownable for the owner.", "Inherit Pausable for the emergency stop.", "Use ReentrancyGuard on deposit and withdraw.", "Write only the vault's own logic yourself."], "Most of the safety comes from reuse."),
        mistakes(["Copying code from a forum without understanding it.", "Mixing several incompatible library versions.", "Inheriting from a contract whose internals you have not read."]),
        miniQuiz("design-mini", [["Which approach usually gives the safest result?", ["Writing every feature yourself", "Reusing audited libraries for common features", "Copying unknown code", "Skipping tests"], 1, "Less new code, fewer new bugs."]]),
      ],
      points: ["Small, composable, interface-driven designs with audited parts are safer.", "Read and pin every dependency."],
      check: [["A good reason to avoid deep inheritance is that:", ["It is illegal", "It is hard to read and audit", "It is cheap", "It is fast"], 1, "Complexity hides bugs."]],
    }),
  ],
  terms: [["Inheritance", "A contract reusing a parent's code"], ["Interface", "A declaration of functions only"], ["Library", "Reusable code without storage"], ["override", "Implements or replaces a parent function"], ["OpenZeppelin", "A widely used set of audited contract libraries"], ["Composition", "Building by combining parts"]],
  practical: { title: "Practical: deploy Greeter", intro: "Use Remix.", steps: ["Deploy Greeter.", "Call greet.", "Change the greeting as the owner.", "Try again from another account."] },
  quiz: [
    ["An interface contains:", ["Function signatures only", "State variables", "Bodies of functions", "ETH"], 0, "An interface has signatures but no function bodies."],
    ["contract B is A means:", ["B inherits from A", "A inherits from B", "They are unrelated", "B is deleted"], 0, "B reuses A."],
    ["A library has:", ["Its own storage", "No storage of its own", "A wallet", "Events only"], 1, "It is shared code."],
    ["OpenZeppelin is:", ["A wallet", "A set of audited contract libraries", "A blockchain", "A fee"], 1, "Reuse well-tested code."],
    ["virtual marks a function that:", ["May be overridden", "Cannot be called", "Is private", "Is payable"], 0, "Children can replace it."],
    ["ReentrancyGuard helps:", ["Prevent reentrancy", "Reduce fees", "Create tokens", "Send events"], 0, "A lock on functions."],
    ["Pin library versions because:", ["APIs can change between versions", "It is a legal rule", "It is free", "It speeds blocks"], 0, "Read the docs for your version."],
  ],
});

const M6 = module_({
  slug: "build-a-project", title: "Build a project: Crowdfund", hours: 2.5, level: "Applied skills",
  summary: "A complete contract from specification to tests: pledges, deadlines, withdrawals and refunds.",
  outcome: "You can read a full contract, explain each rule, write tests for it and review it for bugs.",
  intro: "This last module brings everything together in one realistic project. You will read a full crowdfunding contract, understand the design, see how to test it and then review a flawed contract for bugs.",
  topics: [
    topic({
      title: "The specification", slug: "spec",
      blocks: [
        p("**Crowdfund** is a contract in which a creator sets a funding goal and a deadline. Backers pledge ETH until the deadline. If the goal is met, the creator withdraws the money; if not, every backer can take their pledge back. Nobody has to trust the creator or the platform: the code enforces the rules."),
        table("The rules", ["Rule", "Who", "When"], [["Pledge any amount", "Anyone", "Before the deadline"], ["Withdraw all funds", "The creator only", "After the deadline, if the goal was reached, once only"], ["Refund a pledge", "Each backer", "After the deadline, if the goal was not reached"], ["Nothing else can move money", "Nobody", "Always"]]),
        flow("The life of a campaign", ["Creator deploys with goal and duration", "Backers pledge", "The deadline passes", "Goal reached: creator withdraws", "Goal missed: backers refund"]),
        miniQuiz("spec-mini", [["When can a backer take a refund?", ["Any time", "After the deadline if the goal was not reached", "Only if the creator agrees", "Never"], 1, "The contract enforces it."]]),
      ],
      points: ["Write the rules as who, what and when before coding.", "The contract enforces the rules without trusting the creator."],
      check: [["Who can withdraw the funds?", ["Anyone", "Only the creator, after the deadline and only if the goal was reached", "Backers", "The owner at any time"], 1, "Rules bind everyone."]],
    }),
    topic({
      title: "The code", slug: "code",
      blocks: [
        code("solidity", crowdfund, "Crowdfund.sol"),
        table("Design choices to notice", ["Choice", "Why"], [["creator, goal and deadline are immutable", "Cheap to read and impossible to change after deployment"], ["pledged mapping records each backer's amount", "Needed for refunds and for a fair history"], ["Custom errors for every failure", "Cheap and clear in wallets and tests"], ["withdrawn flag set before sending", "Stops a second withdrawal and follows checks-effects-interactions"], ["pledged[msg.sender] = 0 before sending a refund", "Stops a repeated refund and blocks reentrancy"], ["The call result is checked in both withdraw and refund", "A failing recipient reverts the whole action"], ["Events for pledge, refund and withdraw", "Apps can show live progress"]]),
        warn("Even this tidy contract is for learning. A real campaign that holds other people's money should be tested far more, reviewed by others and audited before use."),
        miniQuiz("code-mini", [["Why is pledged[msg.sender] set to zero before the refund is sent?", ["To save gas", "To prevent reentrancy and double refunds", "To change the owner", "To emit an event"], 1, "State is updated before the external call."]]),
      ],
      points: ["Immutables, custom errors and checks-effects-interactions make the contract cheap and safe.", "Every state change has a matching event."],
      check: [["The withdrawn flag stops:", ["A second withdrawal", "Pledges", "Events", "Refunds"], 0, "A one-time action."]],
    }),
    topic({
      title: "Testing and reviewing it", slug: "test-review",
      blocks: [
        p("Tests turn the specification into checks. The following Hardhat test uses a helper to move the blockchain's clock forward, which lets us test behaviour that only happens after the deadline. Run it on your own computer after installing Node.js and Hardhat; the course platform does not run code."),
        code("javascript", cfTest, "test/Crowdfund.js"),
        table("Tests you should have", ["Test", "Why"], [["Pledge before the deadline works and emits an event", "Happy path"], ["Pledge after the deadline reverts", "Deadline rule"], ["Withdraw before the deadline reverts", "Timing"], ["Withdraw by a non-creator reverts", "Access control"], ["Withdraw with the goal missed reverts", "Business rule"], ["Withdraw twice reverts", "One-time action"], ["Refund when the goal is reached reverts", "Business rule"], ["Refund twice reverts", "Double refund"], ["A malicious recipient cannot re-enter", "Security"]]),
        list("How to review a contract", ["Read the specification first, then check that every rule appears in code.", "Look at every function that moves ETH: who can call it, and in what order does it act?", "Search for external calls and check what state is updated before them.", "Look for loops, assumptions about exact balances and dependence on block data.", "Ask what an attacker, a careless user and a hostile recipient could each do."], true),
        miniQuiz("test-mini", [["Why use time-manipulation helpers in tests?", ["To cheat", "To test behaviour that depends on deadlines without waiting", "To change the code", "To lower gas"], 1, "Tests need to move the clock."]]),
      ],
      points: ["Test every rule, including the failing cases, and use time helpers for deadlines.", "Review by reading the specification against the code, then thinking like an attacker."],
      check: [["A good review starts with:", ["The gas report", "The specification", "The logo", "The price"], 1, "Check the code against the intent."]],
    }),
  ],
  terms: [["Specification", "A written description of what a contract must do"], ["Immutable", "Set once at deployment"], ["Test fixture", "Reusable test setup"], ["Time travel", "Moving the test chain's clock"], ["Invariant", "A property that must always hold"], ["Code review", "Reading code for bugs against a specification"]],
  practical: { title: "Practical: deploy and test by hand", intro: "Use Remix.", steps: ["Deploy Crowdfund with a goal of 2 ETH (as wei) and 1 day.", "Pledge from two accounts.", "Try withdraw too early.", "Think about how you would test the deadline."] },
  quiz: [
    ["A specification should say:", ["Who can do what and when", "Only the name", "The price", "Nothing"], 0, "Rules in plain words."],
    ["Setting pledged to zero before refunding prevents:", ["Reentrancy and double refunds", "Gas", "Events", "Deposits"], 0, "Effects before interactions."],
    ["The deadline is:", ["Immutable and set at deployment", "Changed by the creator", "Random", "A string"], 0, "Fixed at construction."],
    ["Tests should cover:", ["Successes and failures", "Only successes", "Only events", "Nothing"], 0, "The reverts matter most."],
    ["The withdrawn flag:", ["Allows one withdrawal", "Allows many", "Is public only", "Is an event"], 0, "Stops repeats."],
    ["A malicious recipient is tested for:", ["Reentrancy", "Colour", "Price", "Time zones"], 0, "Can it call back?"],
    ["Real money requires:", ["More testing and an audit", "Less testing", "No review", "A faster launch"], 0, "Professional review."],
  ],
});

export default course({
  slug: "solidity-programming-beginners", title: "Solidity Programming for Beginners", tagline: "Read, reason about and design Solidity contracts: types, functions, data, ETH, inheritance and a full project", level: "Intermediate", hours: 14,
  summary: "A beginner's course in Solidity built around complete, compiled example contracts: types and structure, control flow and modifiers, mappings, arrays and structs, receiving and sending ETH safely, events and custom errors, inheritance and OpenZeppelin, and a full Crowdfund project with a test suite. You read and reason about code in the course labs, and run the examples yourself in the free Remix editor.",
  modules: [M1, M2, M3, M4, M5, M6],
  capstone: capstone({
    title: "Final project: design an Escrow contract", summary: "Design, specify and review an Escrow contract, then pass the final assessment.",
    intro: "You can now read and write the building blocks of Solidity. In this final step you design a complete Escrow contract on paper: its purpose, state, functions, events, security review and tests. Then take the final assessment covering the whole course.",
    steps: ["Work through the **Final project: design an Escrow contract** lab.", "Optionally implement your design in Remix and test it with the Hardhat approach shown in the course.", "Take the final assessment below."], projectTitle: "An Escrow design document",
    quiz: [
      ["A constant is fixed:", ["In the code at compile time", "At deployment", "By users", "By calls"], 0, "Unlike immutable."],
      ["An immutable is fixed:", ["At deployment in the constructor", "At compile time", "By the owner", "Every call"], 0, "Cheap to read."],
      ["A view function:", ["Reads state but does not change it", "Changes state", "Receives ETH", "Is private"], 0, "Free to call from outside."],
      ["A modifier's underscore marks:", ["Where the function body runs", "The end", "A comment", "A type"], 0, "Inserted at that point."],
      ["require is best for:", ["Validating inputs", "Invariants", "Loops", "Comments"], 0, "Readable checks."],
      ["A mapping cannot be:", ["Looked up by key", "Enumerated", "Public", "Used for balances"], 1, "Keep an array of keys."],
      ["A memory copy of a struct:", ["Changes storage", "Does not change storage", "Is permanent", "Is calldata"], 1, "Edit via a storage pointer."],
      ["The safe order is:", ["Checks, effects, interactions", "Interactions first", "Effects last", "Events first"], 0, "Prevents reentrancy."],
      ["Recommended way to send ETH today:", ["call with value, checking the result", "transfer only", "send ignoring the result", "selfdestruct"], 0, "And update state first."],
      ["An interface contains:", ["Function signatures only", "State", "Bodies", "ETH"], 0, "A shared shape."],
      ["OpenZeppelin provides:", ["Audited reusable contracts", "A wallet", "A blockchain", "Fees"], 0, "Reuse reviewed code."],
      ["A malicious recipient in tests checks for:", ["Reentrancy", "Colour", "Fees", "Time zones"], 0, "Can it call back?"],
    ],
  }),
  labs,
  skills: [{ id: SK, label: "Solidity programming" }],
  badges: [
    { id: "type-chooser", title: "Type chooser", description: "Matched data to Solidity types.", when: { all: ["s1-types"] } },
    { id: "structure-selector", title: "Structure selector", description: "Chose the right data structures.", when: { all: ["s5-data-structures"] } },
    { id: "contract-reviewer", title: "Contract reviewer", description: "Found and fixed bugs in a contract.", when: { all: ["s11-review"] } },
    { id: "escrow-designer", title: "Escrow designer", description: "Designed a full Escrow contract.", when: { all: ["cap-escrow"] } },
  ],
  landing: {
    hero: { eyebrow: "Solidity · Every code sample compiled and checked", title: "Solidity for Beginners: read it, reason about it, design it", subtitle: "Work through complete example contracts from types to a full crowdfunding project, classify and review code, calculate gas and write specifications and tests plans. Examples were compiled with Solidity 0.8; you try them in the free Remix editor.", level: "Intermediate", outcomeLine: "After this course you can read most simple contracts, write small ones with safe patterns and review code for common bugs." },
    outcomes: [
      { icon: "docs", title: "Read real Solidity", text: "Types, structure, state and functions." },
      { icon: "safety", title: "Fail safely", text: "require, custom errors, modifiers and invariants." },
      { icon: "sheet", title: "Count the gas", text: "Loops, storage and mappings." },
      { icon: "web", title: "Handle ETH", text: "receive, payable, call and pull payments." },
      { icon: "sort", title: "Reuse safely", text: "Inheritance, interfaces and OpenZeppelin." },
      { icon: "word", title: "Design and review", text: "Specifications, tests and bug reviews." },
    ],
    projects: [
      { title: "A guarded contract", text: "Owner, pause and custom errors.", module: "control-flow-and-functions" },
      { title: "A registry", text: "Structs, mappings, enums and arrays.", module: "data-structures" },
      { title: "A crowdfund", text: "Pledges, deadlines, withdrawals and refunds.", module: "build-a-project" },
      { title: "An escrow design", text: "A complete design document with tests.", module: "capstone" },
    ],
    tools: [{ icon: "docs", title: "Compiled code listings", text: "Every example was compiled with solc 0.8." }, { icon: "sheet", title: "Spreadsheet lab", text: "Integer sizes, loop gas and campaign maths." }, { icon: "word", title: "Document editor", text: "Specs, reviews and design documents." }],
    assessment: ["Finish the required labs in each module: they are checked automatically and explained when something is missing.", "Pass each module quiz (70% or more). Short tests inside the lessons give instant feedback.", "Complete the escrow design and the final assessment."],
    faq: [
      { q: "Does the platform compile or run my Solidity?", a: "No. The course labs check your reading, analysis and design work. You run and edit the examples yourself in Remix, a free browser tool, and the lessons explain how." },
      { q: "Do I need programming experience?", a: "Some basic idea of variables and functions helps, but the lessons explain every construct used." },
      { q: "Is the code safe to deploy?", a: "The examples are for learning. Anything holding real value should be tested far more and professionally audited." },
    ],
  },
  catalogue: {
    hours: "~14 hrs", weeks: "~5 weeks", pace: "3 hrs/wk", badge: "Solidity Beginner",
    brief: "Types and structure, functions and modifiers, mappings and structs, handling ETH, inheritance and OpenZeppelin, and a complete crowdfunding project.",
    learn: ["Contract structure, types and global variables", "Control flow, functions, modifiers and errors", "Mappings, arrays, structs, enums and data locations", "Receiving and sending ETH safely, events and custom errors", "Inheritance, interfaces and audited libraries", "A complete Crowdfund contract with tests and a code review"],
    handsOn: "Design an Escrow contract on paper: state, functions, events, security review and a test plan.",
    outcome: "Read and write small Solidity contracts with safe patterns and review code for common bugs.",
  },
});
