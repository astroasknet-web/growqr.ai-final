import { bars, capstone, ck, classifyLab, code, course, def, example, explorer, flow, formula, list, miniQuiz, mistakes, module_, p, S, sheetLab, table, tip, topic, W, warn, wordLab } from "../kit.mjs";

const SK = "adv-solidity";

const packing = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Three storage slots: the uint256 in the middle forces each uint128 into its own slot.
contract Unpacked {
    uint128 public a;
    uint256 public b;
    uint128 public c;
}

// Two storage slots: the two uint128 values share one 32-byte slot.
contract Packed {
    uint128 public a;
    uint128 public c;
    uint256 public b;
}`;

const sums = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SumHelper {
    // Copies the whole array from calldata into memory first.
    function sumMemory(uint256[] memory xs) external pure returns (uint256 total) {
        for (uint256 i = 0; i < xs.length; i++) {
            total += xs[i];
        }
    }

    // Reads straight from calldata, caches the length and skips overflow checks on the counter.
    function sumCalldata(uint256[] calldata xs) external pure returns (uint256 total) {
        uint256 n = xs.length;
        for (uint256 i = 0; i < n; ) {
            total += xs[i];
            unchecked {
                ++i;
            }
        }
    }
}`;

const auction = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Auction {
    enum Stage { Open, Ended }

    Stage public stage = Stage.Open;
    address public immutable seller;
    uint256 public immutable endTime;
    address public highestBidder;
    uint256 public highestBid;
    mapping(address => uint256) public pendingReturns;

    event NewBid(address indexed bidder, uint256 amount);
    event Ended(address indexed winner, uint256 amount);

    error WrongStage();
    error TooLow();
    error NotEnded();
    error NothingToWithdraw();
    error TransferFailed();

    modifier atStage(Stage s) {
        if (stage != s) revert WrongStage();
        _;
    }

    constructor(uint256 durationSeconds) {
        seller = msg.sender;
        endTime = block.timestamp + durationSeconds;
    }

    function bid() external payable atStage(Stage.Open) {
        if (block.timestamp >= endTime) revert WrongStage();
        if (msg.value <= highestBid) revert TooLow();
        if (highestBidder != address(0)) {
            pendingReturns[highestBidder] += highestBid; // pull payment: the loser withdraws later
        }
        highestBidder = msg.sender;
        highestBid = msg.value;
        emit NewBid(msg.sender, msg.value);
    }

    function end() external atStage(Stage.Open) {
        if (block.timestamp < endTime) revert NotEnded();
        stage = Stage.Ended; // effects first
        emit Ended(highestBidder, highestBid);
        (bool ok, ) = seller.call{value: highestBid}("");
        if (!ok) revert TransferFailed();
    }

    function withdraw() external {
        uint256 amount = pendingReturns[msg.sender];
        if (amount == 0) revert NothingToWithdraw();
        pendingReturns[msg.sender] = 0;
        (bool ok, ) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}`;

const factory = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/Clones.sol";

contract Wallet {
    address public owner;
    bool private initialised;

    function init(address newOwner) external {
        require(!initialised, "Already initialised");
        initialised = true;
        owner = newOwner;
    }
}

// Each wallet is a tiny clone that delegates to one shared implementation: far cheaper than deploying full code each time.
contract WalletFactory {
    address public immutable implementation;

    event Created(address indexed wallet, address indexed owner);

    constructor() {
        implementation = address(new Wallet());
    }

    function create() external returns (address clone) {
        clone = Clones.clone(implementation);
        Wallet(clone).init(msg.sender);
        emit Created(clone, msg.sender);
    }
}`;

const roles = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract Treasury is AccessControl {
    bytes32 public constant SPENDER_ROLE = keccak256("SPENDER_ROLE");

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    receive() external payable {}

    function spend(address payable to, uint256 amount) external onlyRole(SPENDER_ROLE) {
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "Transfer failed");
    }
}`;

const brokenProxy = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LogicV1 {
    uint256 public value; // slot 0
    function set(uint256 newValue) external {
        value = newValue;
    }
}

// FOR LEARNING ONLY: this proxy has a storage collision.
// Its slot 0 is 'implementation', but LogicV1's slot 0 is 'value'.
// Running set() through the proxy would overwrite the implementation address.
contract BrokenProxy {
    address public implementation; // slot 0 (collides with LogicV1.value)
    uint256 public stored;         // slot 1

    constructor(address impl) {
        implementation = impl;
    }

    fallback() external payable {
        (bool ok, bytes memory data) = implementation.delegatecall(msg.data);
        require(ok, "Call failed");
        assembly {
            return(add(data, 32), mload(data))
        }
    }

    receive() external payable {}
}`;

const uups = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract BoxV1 is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    uint256 public value;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers(); // the implementation itself must never be initialised
    }

    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
    }

    function set(uint256 newValue) external {
        value = newValue;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}

// Version 2 only adds a function; it must not reorder or remove existing state variables.
contract BoxV2 is BoxV1 {
    function increment() external {
        value += 1;
    }
}`;

const voucher = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

// A trusted signer signs vouchers off-chain; anyone holding one can redeem it once.
contract SignedVoucher {
    address public immutable signer;
    mapping(bytes32 => bool) public used;

    constructor(address trustedSigner) {
        signer = trustedSigner;
    }

    receive() external payable {}

    function redeem(address to, uint256 amount, uint256 nonce, bytes calldata signature) external {
        // Bind the signature to this contract, this chain, the recipient, the amount and a unique nonce.
        bytes32 digest = keccak256(abi.encodePacked(address(this), block.chainid, to, amount, nonce));
        require(!used[digest], "Voucher already used");
        bytes32 ethSigned = MessageHashUtils.toEthSignedMessageHash(digest);
        require(ECDSA.recover(ethSigned, signature) == signer, "Bad signature");
        used[digest] = true; // effects before interactions
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "Transfer failed");
    }
}`;

const typed = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract OrderBook is EIP712 {
    bytes32 private constant ORDER_TYPEHASH =
        keccak256("Order(address maker,uint256 amount,uint256 nonce)");

    mapping(address => uint256) public nonces;

    constructor() EIP712("OrderBook", "1") {}

    // The hash a wallet shows the user as structured, readable data when asking for a signature.
    function hashOrder(address maker, uint256 amount, uint256 nonce) public view returns (bytes32) {
        return _hashTypedDataV4(keccak256(abi.encode(ORDER_TYPEHASH, maker, amount, nonce)));
    }
}`;

const natspec = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title A documented counter
/// @author Course example
/// @notice Counts upwards and lets callers read the total
/// @dev Uses checked arithmetic, so it reverts instead of overflowing
contract DocCounter {
    /// @notice The current total
    uint256 public total;

    /// @notice Add an amount to the total
    /// @dev Reverts on overflow because Solidity 0.8 checks arithmetic
    /// @param by The amount to add
    /// @return newTotal The total after adding
    function add(uint256 by) external returns (uint256 newTotal) {
        total += by;
        return total;
    }
}`;

const foundryTest = `// A Foundry test (uses the forge-std library, which this platform does not compile).
// Run it on your own computer with: forge test
import "forge-std/Test.sol";

contract SumHelperTest is Test {
    function testFuzz_sumsMatch(uint96 a, uint96 b, uint96 c) public {
        // 'a', 'b' and 'c' are random inputs chosen by the fuzzer, 256 runs by default
        uint256[] memory xs = new uint256[](3);
        xs[0] = a; xs[1] = b; xs[2] = c;
        uint256 expected = uint256(a) + uint256(b) + uint256(c);
        assertEq(helper.sumMemory(xs), expected);
        assertEq(helper.sumCalldata(xs), expected);
    }
}`;

const labs = [
  sheetLab({
    id: "v1-packing", module: "storage-and-gas", title: "How much does packing save?", level: "intermediate", minutes: 16, xp: 60, skills: [SK], required: true,
    objective: "Calculate storage slots and the gas saved when related variables share a slot.",
    scenario: "Writing a variable into a fresh storage slot costs about 22,100 gas. Two uint128 values can share one 32-byte slot if they sit next to each other. Compare the Unpacked and Packed layouts. (Teaching figures.)",
    steps: ["In B6 work out the slots used by the unpacked layout: 3.", "In B7 work out the slots used by the packed layout: 2.", "In B8 work out the first-write gas for the unpacked layout: slots times the gas per new slot (B2).", "In B9 work out the first-write gas for the packed layout.", "In B10 work out the gas saved by packing: B8 minus B9.", "In B11 work out the saving over the number of contracts deployed in a year (B3): B10 times B3.", "In B12 convert the yearly saving to ETH at the gas price in B4 (gwei): B11 times B4 divided by 1,000,000,000."],
    cells: { A1: "Input", B1: "Value", A2: "Gas for writing a new slot", B2: "22100", A3: "Contracts or structs written per year", B3: "10000", A4: "Gas price (gwei)", B4: "30", A6: "Slots, unpacked", B6: "3", A7: "Slots, packed", B7: "2", A8: "First-write gas, unpacked", A9: "First-write gas, packed", A10: "Gas saved per write", A11: "Gas saved per year", A12: "Saved per year (ETH)" }, view: { cols: 2, rows: 14 },
    checks: [
      ck("b8", "B8 is the unpacked gas", "=B6*B2", "Slots times the gas per slot.", S.formula("B8", { equals: 66300 })),
      ck("b9", "B9 is the packed gas", "=B7*B2", "Two slots only.", S.formula("B9", { equals: 44200 })),
      ck("b10", "B10 is the gas saved", "=B8-B9", "Difference of the two.", S.formula("B10", { equals: 22100 })),
      ck("b11", "B11 is the yearly saving", "=B10*B3", "Saving per write times the number of writes.", S.formula("B11", { equals: 221000000 })),
      ck("b12", "B12 is the saving in ETH", "=B11*B4/1000000000", "Gas times gwei, converted to ETH.", S.formula("B12", { equals: 221000000 * 30 / 1e9 })),
    ],
    solution: { cells: { B8: "=B6*B2", B9: "=B7*B2", B10: "=B8-B9", B11: "=B10*B3", B12: "=B11*B4/1000000000" } },
  }),
  classifyLab({
    id: "v2-optimise", module: "storage-and-gas", title: "Safe optimisation, premature or dangerous?", level: "advanced", minutes: 10, xp: 40, skills: [SK], required: false,
    objective: "Judge gas optimisations by their benefit and their risk.", scenario: "Cheaper code is good only if it stays correct and readable. Judge each idea.",
    steps: ["Read each idea.", "Choose the verdict.", "Press Check my work."],
    categories: [["safe", "Safe and worthwhile"], ["premature", "Premature (little gain, less clarity)"], ["danger", "Dangerous"]],
    items: [["Using calldata instead of memory for external array parameters you only read", "safe", "A clear saving with no loss of safety."], ["Packing two uint128 values that are always used together into one slot", "safe", "Fewer storage writes."], ["Rewriting every line in assembly to save a few gas", "premature", "Hard to read and audit for small gains."], ["Using unchecked around arithmetic that could overflow on user input", "danger", "Removes the safety net."], ["Caching an array's length in a local variable before a loop", "safe", "Avoids repeated reads."], ["Removing a require check on input to save gas", "danger", "Trades safety for pennies."], ["Using unchecked for a loop counter that cannot overflow", "safe", "The overflow is impossible."], ["Shortening variable names to save bytecode", "premature", "No effect on gas and hurts clarity."]],
  }),
  classifyLab({
    id: "v3-patterns", module: "design-patterns", title: "Which design pattern?", level: "advanced", minutes: 10, xp: 40, skills: [SK], required: true,
    objective: "Name the design pattern behind each snippet of behaviour.", scenario: "Experienced developers reuse a small set of patterns. Recognising them makes code easier to read and review.",
    steps: ["Read each description.", "Choose the pattern.", "Press Check my work."],
    categories: [["state", "State machine"], ["pull", "Pull payment"], ["factory", "Factory and clones"], ["roles", "Role-based access control"], ["checks", "Checks-effects-interactions"]],
    items: [["A contract moves from Open to Ended and some functions work only in one stage", "state", "Explicit stages."], ["Losing bidders withdraw their own money instead of the contract paying them in a loop", "pull", "Recipients pull."], ["One contract creates many cheap copies of a shared implementation", "factory", "Cheap deployment."], ["Separate SPENDER and ADMIN permissions held by different accounts", "roles", "Granular permissions."], ["The balance is zeroed before the ETH is sent", "checks", "Prevents reentrancy."], ["A modifier atStage(Stage.Open) guards bid()", "state", "Stage checks."], ["A mapping pendingReturns records what each address may withdraw", "pull", "Accounting for withdrawals."], ["WalletFactory.create() deploys a minimal proxy for each user", "factory", "Clones."]],
  }),
  wordLab({
    id: "v4-state-machine", module: "design-patterns", title: "Design a state machine", level: "advanced", minutes: 18, xp: 65, skills: [SK], required: false,
    objective: "Describe the stages of a contract and which functions work in each.",
    scenario: "A scholarship contract collects donations, then the committee awards the money to a student, who may then claim it. Design the stages.",
    steps: ["Add Heading 2 sections: Stages, Allowed actions, Transitions, Risks.", "Under Stages list at least three stages in bullets.", "Under Allowed actions say which functions work in which stage.", "Under Risks mention at least two issues, such as a committee that never acts.", "Keep it between 110 and 260 words."],
    checks: [
      ck("heads", "Four sections", "Use Heading 2.", "A clear design.", W.heading(4, 2)),
      ck("order", "In order", "Stages, Allowed actions, Transitions, Risks.", "From states to risks.", W.order(["Stages", "Allowed actions", "Transitions", "Risks"])),
      ck("stages", "Three stages", "Use the bullet button.", "List the stages.", W.list(3, "ul")),
      ck("terms", "Mentions donate, award and claim", "Mention all three actions.", "The business functions.", W.pattern("donat[\\s\\S]*award[\\s\\S]*claim|donat[\\s\\S]*claim[\\s\\S]*award|award[\\s\\S]*donat[\\s\\S]*claim", "donate, award and claim")),
      ck("risk", "A risk about inaction or deadlines", "Mention a deadline, timeout or never acts.", "State machines can get stuck.", W.pattern("deadline|timeout|never acts|stuck|expire|refund", "a stuck-state risk")),
      ck("len", "Between 110 and 260 words", "Concise.", "A short design.", W.words(110, 260)),
    ],
    solution: "<h2>Stages</h2><ul><li>Collecting: donations are accepted.</li><li>Awarded: the committee has chosen a student and the amount is locked.</li><li>Claimed: the student has withdrawn and the contract is finished.</li></ul><h2>Allowed actions</h2><p>donate works only while Collecting. award, restricted to the committee, works only while Collecting and moves to Awarded. claim, restricted to the chosen student, works only while Awarded.</p><h2>Transitions</h2><p>Collecting moves to Awarded when the committee calls award, and Awarded moves to Claimed when the student calls claim. No stage can be skipped and none can go backwards.</p><h2>Risks</h2><ul><li>The committee never acts, so donations stay locked, which needs a deadline after which donors can take a refund.</li><li>The student never claims, so the money sits idle, which needs a timeout that returns it to the pool.</li></ul>",
  }),
  classifyLab({
    id: "v5-delegatecall", module: "low-level-and-proxies", title: "Call, staticcall or delegatecall?", level: "advanced", minutes: 10, xp: 40, skills: [SK], required: true,
    objective: "Predict whose storage and identity a low-level call uses.", scenario: "Low-level calls differ in whose code runs and whose storage changes. Proxies depend on the difference.",
    steps: ["Read each situation.", "Choose the call type.", "Press Check my work."],
    categories: [["call", "call"], ["static", "staticcall"], ["delegate", "delegatecall"]],
    items: [["The target's code runs and changes the target's own storage", "call", "A normal external call."], ["The target's code runs but changes the caller's storage", "delegate", "Code from one place, state from another."], ["The call is guaranteed not to change any state", "static", "Used for reads."], ["msg.sender inside the target is the original caller", "delegate", "The context is preserved."], ["Used by a proxy to run the implementation's logic against the proxy's data", "delegate", "The core of upgradeable proxies."], ["msg.sender inside the target is the calling contract", "call", "A new context."], ["A state change in the target makes it revert", "static", "It forbids writes."], ["Sending ETH to another account's code with call{value: x}", "call", "A value-carrying call."]],
  }),
  wordLab({
    id: "v6-upgrade-plan", module: "low-level-and-proxies", title: "Write an upgrade safety plan", level: "advanced", minutes: 20, xp: 70, skills: [SK], required: false,
    objective: "Set the rules for upgrading an upgradeable contract without breaking users.",
    scenario: "Your team will deploy a vault as a UUPS proxy. Write the rules for how upgrades will be done.",
    steps: ["Add Heading 2 sections: Who can upgrade, How we prepare, How we test, How we announce.", "Under each, write at least two bullet points.", "Mention storage layout, a time-lock or multi-signature wallet, and the initialiser.", "Keep it between 130 and 300 words."],
    checks: [
      ck("heads", "Four sections", "Use Heading 2.", "A structured plan.", W.heading(4, 2)),
      ck("order", "In order", "Who can upgrade, How we prepare, How we test, How we announce.", "From control to communication.", W.order(["Who can upgrade", "How we prepare", "How we test", "How we announce"])),
      ck("lists", "Bullet points", "Use the bullet button.", "Short rules.", W.list(2, "ul")),
      ck("layout", "Mentions storage layout", "Mention storage layout.", "The classic upgrade bug.", W.pattern("storage layout|storage slots|reorder|append", "storage layout")),
      ck("gov", "Mentions a time-lock or multi-signature", "Mention time-lock, timelock or multi-sig.", "Control of upgrades.", W.pattern("time-?lock|multi-?sig|multisig|multi-signature", "a time-lock or multi-signature wallet")),
      ck("init", "Mentions the initialiser", "Mention initialiser or initialize.", "Proxies use it instead of constructors.", W.pattern("initiali[sz]", "the initialiser")),
      ck("len", "Between 130 and 300 words", "Concise.", "A usable plan.", W.words(130, 300)),
    ],
    solution: "<h2>Who can upgrade</h2><ul><li>Only a multi-signature wallet of five members, three of whom must sign, can call the upgrade function.</li><li>Every upgrade passes through a time-lock of 48 hours so users can see it coming and exit if they disagree.</li></ul><h2>How we prepare</h2><ul><li>We keep the storage layout compatible: new variables are only appended, and existing ones are never reordered or removed.</li><li>Any new initialisation uses a reinitialiser with a version number, and the implementation's own initialiser stays disabled.</li></ul><h2>How we test</h2><ul><li>We run the old and new versions side by side in a fork test and compare the storage layout with a checking tool.</li><li>We rehearse the whole upgrade on a test network before the real one.</li></ul><h2>How we announce</h2><ul><li>We publish the new implementation's verified source and a change summary at least a week before the proposal.</li><li>After the upgrade we post the transaction and confirm that user balances are unchanged.</li></ul>",
  }),
  classifyLab({
    id: "v7-replay", module: "signatures-and-off-chain-data", title: "What stops a signature being reused?", level: "advanced", minutes: 10, xp: 40, skills: [SK], required: true,
    objective: "Match each attack to the protection that blocks it.", scenario: "An off-chain signature is just bytes. Without protection, it can be replayed. Match the attack to the defence.",
    steps: ["Read each attack.", "Choose the protection.", "Press Check my work."],
    categories: [["nonce", "A unique nonce or used-flag"], ["chain", "The chain id in the signed data"], ["contract", "The contract address in the signed data"], ["expiry", "A deadline in the signed data"], ["domain", "A typed-data domain (EIP-712)"]],
    items: [["The same voucher is redeemed twice on the same contract", "nonce", "Mark each one as used."], ["A signature made for the test network is submitted on the main network", "chain", "The chain id differs."], ["A signature for contract A is replayed on contract B", "contract", "Include the verifying contract."], ["An old signature is used a year later", "expiry", "A deadline invalidates it."], ["A user is shown unreadable hex instead of what they are agreeing to", "domain", "Typed data is displayed clearly."], ["A signed approval is submitted again after it was already used", "nonce", "Each approval is single-use."], ["Two different dApps ask for look-alike signatures and one reuses the other's", "domain", "The domain separates them."], ["A signature intended for a short sale window is used after the sale ended", "expiry", "Time-limit it."]],
  }),
  sheetLab({
    id: "v8-meta-tx", module: "signatures-and-off-chain-data", title: "Who pays for a gasless transaction?", level: "advanced", minutes: 16, xp: 55, skills: [SK], required: false,
    objective: "Model the cost of a service that pays gas for users using signed messages.",
    scenario: "A game lets players sign actions off-chain and a relayer submits them in batches. Compare the cost with players sending their own transactions. (Teaching figures.)",
    steps: ["In B7 work out the cost if every action is its own transaction: actions times the gas for one transaction, times the gas price.", "In B8 work out the cost when the relayer batches actions: batches times the gas for a batch (B4), plus the extra gas per action (B5) times actions, times the gas price.", "In B9 work out how many actions fit in one batch: the batch limit (B6) divided by the extra gas per action, rounded down with INT.", "In B10 work out the saving: B7 minus B8.", "In B11 show Worth it if the saving is above zero, else Not worth it."],
    cells: { A1: "Input", B1: "Value", A2: "Actions per day", B2: "10000", A3: "Gas for one separate transaction", B3: "60000", A4: "Gas overhead of one batch transaction", B4: "50000", A5: "Extra gas per action inside a batch", B5: "25000", A6: "Gas limit per batch", B6: "15000000", A7: "Cost (gas units) as separate transactions", A8: "Cost (gas units) as batches", A9: "Actions that fit in one batch", A10: "Gas saved", A11: "Verdict", A13: "Number of batches needed", B13: "17" }, view: { cols: 2, rows: 15 },
    checks: [
      ck("b7", "B7 is the separate cost", "=B2*B3", "Actions times gas each.", S.formula("B7", { equals: 600000000 })),
      ck("b8", "B8 is the batched cost", "=B13*B4+B2*B5", "Batch overhead plus per-action gas.", S.formula("B8", { equals: 17 * 50000 + 10000 * 25000 })),
      ck("b9", "B9 is the actions per batch", "=INT(B6/B5)", "The limit divided by the per-action gas.", S.formula("B9", { fns: ["INT"], equals: 600 })),
      ck("b10", "B10 is the gas saved", "=B7-B8", "Separate minus batched.", S.formula("B10", { equals: 600000000 - (17 * 50000 + 10000 * 25000) })),
      ck("b11", "B11 is the verdict", "=IF(B10>0,\"Worth it\",\"Not worth it\")", "A positive saving is worth it.", S.formula("B11", { fns: ["IF"], equals: "Worth it" })),
    ],
    solution: { cells: { B7: "=B2*B3", B8: "=B13*B4+B2*B5", B9: "=INT(B6/B5)", B10: "=B7-B8", B11: "=IF(B10>0,\"Worth it\",\"Not worth it\")" } },
  }),
  classifyLab({
    id: "v9-test-types", module: "advanced-testing", title: "Which kind of test?", level: "advanced", minutes: 10, xp: 40, skills: [SK], required: true,
    objective: "Choose the right kind of test for each risk.", scenario: "Different tests find different bugs. Match the risk to the test.",
    steps: ["Read each need.", "Choose the test type.", "Press Check my work."],
    categories: [["unit", "Unit test"], ["fuzz", "Fuzz test"], ["invariant", "Invariant test"], ["fork", "Fork test"], ["integration", "Integration test"]],
    items: [["Check that one function reverts when the caller is not the owner", "unit", "A single behaviour."], ["Try thousands of random amounts to see if arithmetic ever breaks", "fuzz", "Random inputs find edge cases."], ["After any sequence of deposits and withdrawals, total deposits equal the contract's balance", "invariant", "A property that must always hold."], ["Run your code against a copy of the real main network state to test against live contracts", "fork", "Realistic dependencies."], ["Deploy the factory, create a wallet and use it end to end", "integration", "Parts working together."], ["Test one modifier's logic", "unit", "Small and focused."], ["Random sequences of calls try to break the 'no stage can go backwards' rule", "invariant", "Stateful property testing."], ["Check behaviour when a real token contract on the main network is used", "fork", "Uses the real thing."]],
  }),
  wordLab({
    id: "v10-invariants", module: "advanced-testing", title: "State the invariants of the Auction", level: "advanced", minutes: 18, xp: 65, skills: [SK], required: false,
    objective: "Write properties that must always be true, so they can be tested with random sequences of calls.",
    scenario: "The Auction contract takes bids, keeps the highest, records pending returns for losers, ends once, and pays the seller. Write its invariants.",
    steps: ["Write a numbered list of at least five invariants.", "Include one about money (the balance covers what is owed), one about stage, and one about the highest bid.", "For two of them, say how a test would try to break them.", "Keep it between 100 and 240 words."],
    checks: [
      ck("list", "Five invariants", "Use the numbered list button.", "A list of properties.", W.list(5, "ol")),
      ck("money", "A money invariant", "Mention balance and pending returns or owed.", "Solvency matters most.", W.pattern("balance[\\s\\S]*(pending|owed|returns)|(pending|owed|returns)[\\s\\S]*balance", "a balance invariant")),
      ck("stage", "A stage invariant", "Mention stage or Ended.", "States only move forward.", W.pattern("stage|ended|open", "a stage invariant")),
      ck("high", "A highest bid invariant", "Mention highest bid.", "It only goes up.", W.pattern("highest", "a highest bid invariant")),
      ck("break", "How a test would break it", "Mention random, sequence, fuzz or attack.", "Say how to test.", W.pattern("random|sequence|fuzz|attack|try to", "how a test would try to break it")),
      ck("len", "Between 100 and 240 words", "Concise.", "Keep them crisp.", W.words(100, 240)),
    ],
    solution: "<ol><li>The contract's ETH balance is always at least the sum of all pending returns plus the current highest bid while the auction is open, so everyone can be paid.</li><li>The highest bid never decreases: a test would try a random sequence of bids of different sizes and check it after each.</li><li>The stage only moves from Open to Ended and never back, and a test would try calling bid and end in every order.</li><li>After the auction ends, no new bid is accepted, so highestBid and highestBidder stay fixed.</li><li>A bidder's pending return is zero immediately after they withdraw, and a fuzz test would repeat withdraw calls to try to take it twice.</li></ol>",
  }),
  wordLab({
    id: "v11-threat-model", module: "production-practice", title: "Threat-model the Auction", level: "advanced", minutes: 22, xp: 75, skills: [SK], required: true,
    objective: "Identify assets, attackers and mitigations in a structured threat model.",
    scenario: "Threat-model the Auction contract shown in the course: bidders send ETH, the seller is paid at the end, and losers withdraw their bids.",
    steps: ["Add Heading 2 sections: Assets, Actors, Threats and mitigations, Residual risks.", "Under Threats and mitigations write a bulleted list of at least five threats, each with its mitigation.", "Include reentrancy, a seller who is a contract that rejects ETH, and miners or validators influencing the timestamp.", "Keep it between 150 and 340 words."],
    checks: [
      ck("heads", "Four sections", "Use Heading 2.", "A structured model.", W.heading(4, 2)),
      ck("order", "In order", "Assets, Actors, Threats and mitigations, Residual risks.", "From what to protect to what remains.", W.order(["Assets", "Actors", "Threats and mitigations", "Residual risks"])),
      ck("threats", "Five threats", "Use the bullet button.", "List the threats.", W.list(5, "ul")),
      ck("reent", "Mentions reentrancy", "Include reentrancy.", "A core risk.", W.pattern("reentran", "reentrancy")),
      ck("reject", "Mentions a seller that rejects ETH", "Mention a seller contract that reverts or rejects.", "A denial-of-service risk.", W.pattern("reject|revert|cannot receive|denial", "a seller that rejects ETH")),
      ck("time", "Mentions timestamp manipulation", "Mention the timestamp or block time.", "Validators can nudge it a little.", W.pattern("timestamp|block time|validators? can", "timestamp influence")),
      ck("len", "Between 150 and 340 words", "Concise.", "A usable page.", W.words(150, 340)),
    ],
    solution: "<h2>Assets</h2><p>The ETH held by the contract: the highest bid and the pending returns owed to losing bidders. Also the integrity of the result: the right winner and the right seller payment.</p><h2>Actors</h2><p>Bidders, the seller, other contracts that may call the Auction and block producers who order transactions.</p><h2>Threats and mitigations</h2><ul><li>Reentrancy on withdraw: the pending return is set to zero before sending the ETH, following checks-effects-interactions.</li><li>A seller that is a contract rejecting ETH could make end() revert and lock the auction: the seller is the deployer, so tests include a rejecting seller, and a fallback that stores the proceeds for the seller to pull would remove the risk.</li><li>Validators can nudge the timestamp by a few seconds, which could let someone place a last-second bid: the effect is small, and the rules must not depend on exact seconds.</li><li>A bidder contract that rejects refunds could block others if refunds were pushed: the Auction uses pull payments, so a bad bidder only blocks itself.</li><li>Front-running: a bidder sees a pending bid and outbids it just before the end, which is part of how open auctions work, so it is documented, and a commit-and-reveal scheme could be added.</li></ul><h2>Residual risks</h2><p>The seller payment could still fail for a contract seller, front-running remains possible, and the code has not been audited, so it must not hold real funds.</p>",
  }),
  sheetLab({
    id: "v12-gas-report", module: "production-practice", title: "Read a gas report and decide", level: "advanced", minutes: 16, xp: 55, skills: [SK], required: false,
    objective: "Compare gas before and after an optimisation and decide whether it pays for the extra complexity.",
    scenario: "A gas report shows the cost of three functions before and after optimisation. Each is called a different number of times per month. Work out the saving and the cost in rupees. (Teaching figures.)",
    steps: ["In E2 work out the gas saved per call: before minus after. Fill down to E4.", "In F2 work out the gas saved per month: saved per call times calls. Fill down.", "In F6 total the monthly saving.", "In F7 convert to rupees using the gas price in B8 (gwei) and the ETH price in B9.", "In F8 show Worth the effort if the monthly saving is above the engineer's cost of the change in B10, otherwise Skip it."],
    cells: { A1: "Function", B1: "Gas before", C1: "Gas after", D1: "Calls per month", E1: "Saved per call", F1: "Saved per month", A2: "deposit", B2: "92000", C2: "68000", D2: "20000", A3: "withdraw", B3: "64000", C3: "52000", D3: "8000", A4: "admin update", B4: "45000", C4: "44000", D4: "10", A6: "Total saved per month (gas)", A7: "Value per month (rupees)", A8: "Gas price (gwei)", B8: "30", A9: "ETH price (rupees)", B9: "250000", A10: "Engineer cost of the change (rupees)", B10: "50000", A11: "Verdict" }, view: { cols: 6, rows: 13 },
    checks: [
      ck("e2", "E2 is the saving per deposit", "=B2-C2", "Before minus after.", S.formula("E2", { equals: 24000 })),
      ck("f2", "F2 is the monthly saving for deposit", "=E2*D2", "Saving per call times calls.", S.formula("F2", { equals: 480000000 })),
      ck("f6", "F6 is the total saving", "=SUM(F2:F4)", "Add all three.", S.formula("F6", { fns: ["SUM"], equals: 480000000 + 96000000 + 10000 })),
      ck("f7", "F7 is the value in rupees", "=F6*B8/1000000000*B9", "Gas, gwei, ETH, rupees.", S.formula("F7", { equals: (480000000 + 96000000 + 10000) * 30 / 1e9 * 250000 })),
      ck("f8", "F8 is the verdict", "=IF(F7>B10,\"Worth the effort\",\"Skip it\")", "Compare with the cost.", S.formula("F8", { fns: ["IF"], equals: "Worth the effort" })),
    ],
    solution: { cells: Object.assign({ F6: "=SUM(F2:F4)", F7: "=F6*B8/1000000000*B9", F8: "=IF(F7>B10,\"Worth the effort\",\"Skip it\")" }, ...[2, 3, 4].map((r) => ({ [`E${r}`]: `=B${r}-C${r}`, [`F${r}`]: `=E${r}*D${r}` }))) },
  }),
  wordLab({
    id: "cap-vault", module: "capstone", title: "Final project: design an upgradeable vault", level: "challenge", minutes: 40, xp: 170, skills: [SK], required: true,
    objective: "Produce a professional design for an upgradeable, role-controlled vault, covering architecture, upgrade policy, signatures, tests and a threat model.",
    scenario: "Design a VaultV1 that holds ETH for depositors, lets a SPENDER role pay out approved withdrawals, supports gasless withdrawal requests signed by users, and can be upgraded under a governance policy.",
    steps: ["Add a Heading 1 'VaultV1: design document'.", "Add Heading 2 sections: Architecture, Roles, State layout, Signed requests, Upgrade policy, Tests, Threats.", "Under State layout list at least four variables in bullets.", "Under Signed requests mention a nonce, the chain id, the contract address and an expiry.", "Under Tests write a numbered list of at least six tests including a fuzz or invariant test.", "Under Threats list at least four risks in bullets.", "Keep it between 320 and 640 words."],
    checks: [
      ck("t", "A title", "Use Heading 1.", "Name the document.", W.heading(1, 1)),
      ck("secs", "Seven sections", "Use Heading 2.", "A complete design.", W.heading(7, 2)),
      ck("order", "In order", "Architecture, Roles, State layout, Signed requests, Upgrade policy, Tests, Threats.", "A logical flow.", W.order(["Architecture", "Roles", "State layout", "Signed requests", "Upgrade policy", "Tests", "Threats"])),
      ck("layout", "Four state variables", "Use the bullet button.", "List the variables.", W.list(4, "ul")),
      ck("sig", "Replay protections in signed requests", "Mention nonce, chain id, contract address and expiry.", "All four defences.", W.pattern("nonce[\\s\\S]*chain|chain[\\s\\S]*nonce", "nonce and chain id")),
      ck("addr", "Contract address and expiry", "Mention the contract address and a deadline or expiry.", "Complete the set.", W.pattern("expir|deadline", "an expiry or deadline")),
      ck("tests", "Six tests", "Use the numbered list button.", "A test plan.", W.list(6, "ol")),
      ck("fuzz", "A fuzz or invariant test", "Mention fuzz or invariant.", "Property-based testing.", W.pattern("fuzz|invariant", "a fuzz or invariant test")),
      ck("upg", "Upgrade policy covers a time-lock", "Mention time-lock or multi-signature.", "Upgrade control.", W.pattern("time-?lock|multi-?sig|multi-signature", "a time-lock or multi-signature wallet")),
      ck("len", "Between 320 and 640 words", "Two pages at most.", "A design should be readable.", W.words(320, 640)),
    ],
    solution: "<h1>VaultV1: design document</h1><h2>Architecture</h2><p>An ERC-1967 proxy using the UUPS pattern delegates to VaultV1, the implementation. Users deposit ETH, a SPENDER role pays approved withdrawals, and users may sign withdrawal requests that a relayer submits. The implementation's constructor disables initialisers and the proxy is initialised once with the admin address.</p><h2>Roles</h2><p>DEFAULT_ADMIN_ROLE is held by a multi-signature wallet and can grant roles and authorise upgrades. SPENDER_ROLE is held by an operations account with a daily limit. PAUSER_ROLE can stop deposits and withdrawals in an emergency but cannot move funds.</p><h2>State layout</h2><ul><li>mapping(address => uint256) balances: what each depositor is owed.</li><li>mapping(address => uint256) nonces: the next valid nonce for each user's signed requests.</li><li>uint256 totalDeposits: the sum of all balances, used by the solvency invariant.</li><li>bool paused: set by the pauser.</li><li>uint256[46] __gap: reserved slots so that later versions can add variables without shifting the layout.</li></ul><h2>Signed requests</h2><p>A withdrawal request is signed as EIP-712 typed data containing the user, the amount, the user's nonce, an expiry time, the chain id and the contract address through the signing domain. The contract rejects any request that has expired, reuses a nonce, or was signed for another chain or contract.</p><h2>Upgrade policy</h2><p>Upgrades are proposed through the multi-signature wallet, pass a 48-hour time-lock, and are announced with the verified source and a storage-layout comparison. New variables are only appended and the layout is checked automatically before every release.</p><h2>Tests</h2><ol><li>A deposit increases the user's balance and totalDeposits.</li><li>A withdrawal above the balance reverts.</li><li>A non-spender cannot pay out a withdrawal.</li><li>An expired or replayed signed request reverts.</li><li>An invariant test checks that the contract balance is always at least totalDeposits after any random sequence of calls.</li><li>A fuzz test sends random amounts and checks that no balance underflows.</li><li>An upgrade test checks that balances and roles are unchanged after upgrading to V2.</li></ol><h2>Threats</h2><ul><li>Reentrancy on withdrawal, mitigated by updating balances first and using a reentrancy guard.</li><li>A compromised admin key, mitigated by the multi-signature wallet and the time-lock.</li><li>Storage collisions in a later upgrade, mitigated by the gap, the layout check and rehearsals on a test network.</li><li>Signature replay across chains or contracts, mitigated by the typed-data domain, nonces and expiry.</li></ul>",
  }),
];

const M1 = module_({
  slug: "storage-and-gas", title: "Storage, packing and gas", hours: 2.5, level: "Foundations",
  summary: "How the EVM lays out storage, what each operation costs and which optimisations are worth their risk.",
  outcome: "You can predict storage slots, pack variables, choose calldata and unchecked blocks wisely and measure the gas saved.",
  intro: "Gas is the currency of correctness on Ethereum: wasteful code costs users money every time it runs. But optimising too early produces code nobody can verify. This module teaches what to optimise, how to measure it and when to stop.",
  topics: [
    topic({
      title: "How storage is laid out", slug: "storage-layout",
      blocks: [
        p("Contract storage is an enormous array of 32-byte **slots** numbered from zero. State variables are assigned to slots in the order they are declared. Several small variables can share one slot, but only when they are neighbours and fit together. Reading or writing a slot is one of the most expensive things a contract does."),
        code("solidity", packing, "Packing.sol"),
        table("What happens", ["Contract", "Layout", "Slots"], [["Unpacked", "a (16 bytes) in slot 0, b (32 bytes) needs a whole slot so goes to slot 1, c (16 bytes) goes to slot 2", "3"], ["Packed", "a and c together in slot 0 (16 + 16 = 32 bytes), b in slot 1", "2"]]),
        table("Approximate storage costs", ["Operation", "Gas (order of magnitude)"], [["First access to a slot in a transaction ('cold')", "About 2,100 for a read"], ["Writing zero to non-zero", "About 22,100 including the cold access"], ["Changing a non-zero value to another", "About 5,000"], ["Setting non-zero to zero", "Costs gas but earns a partial refund"]]),
        miniQuiz("layout-mini", [["Why does the Packed contract use fewer slots?", ["It uses fewer functions", "The two uint128 values sit next to each other and share one slot", "It has no events", "It is a library"], 1, "Order matters for packing."]]),
        warn("Packing helps only when the packed variables are read or written together. Mixing unrelated values into one slot can make each write more expensive because the EVM must read and mask the neighbours."),
      ],
      points: ["Storage is 32-byte slots assigned in declaration order.", "Neighbouring small variables can share a slot; order matters."],
      check: [["A new storage slot written for the first time costs roughly:", ["21 gas", "2,100 gas", "22,100 gas", "1 million gas"], 2, "It is by far the dearest common operation."]],
    }),
    topic({
      title: "Cheaper code, safely", slug: "cheaper-code",
      blocks: [
        code("solidity", sums, "SumHelper.sol"),
        table("Techniques shown", ["Technique", "Why it saves gas", "Risk"], [["calldata instead of memory", "No copy of the array", "Read-only, so you cannot modify it"], ["Cache the length in a local variable", "Avoids re-reading xs.length", "None"], ["unchecked { ++i; }", "Skips an overflow check that can never trigger for a loop counter bounded by the array length", "Dangerous if the bound is not truly safe"], ["Custom errors", "Cheaper than string messages", "None"], ["constant and immutable", "No storage read", "Fixed at compile or deployment time"], ["Short-circuit cheap checks first", "Fails early before expensive work", "None"]]),
        explorer({ id: "adv-gas", title: "Loop gas, roughly", intro: "Change the number of items to see a teaching estimate of gas for the memory version (about 180 gas per item) and the calldata version with unchecked counter (about 120 gas per item). Measure real values with a gas report.", inputs: [{ id: "n", label: "Items", min: 1, max: 1000, step: 1, value: 100 }], outputs: [{ label: "Memory version (rough gas)", expr: "n * 180", unit: "n" }, { label: "Calldata and unchecked (rough gas)", expr: "n * 120", unit: "n" }, { label: "Saving (rough gas)", expr: "n * 60", unit: "n" }] }),
        list("A sensible order of work", ["First make it correct and clear.", "Measure with a gas report to find the expensive functions.", "Fix the big things: storage writes, unnecessary loops and copies.", "Re-measure and keep only changes that pay for their complexity.", "Never trade away a safety check for a few gas."], true),
        miniQuiz("cheaper-mini", [["When is unchecked arithmetic appropriate?", ["Always, to save gas", "Only when overflow is provably impossible", "For user-supplied amounts", "Never"], 1, "Otherwise you remove a safety net."]]),
      ],
      points: ["calldata, cached lengths and constants are safe wins.", "unchecked is only for provably safe arithmetic."],
      check: [["The best first step in optimising gas is to:", ["Rewrite in assembly", "Measure where gas goes", "Remove checks", "Shorten names"], 1, "Optimise what matters."]],
    }),
    topic({
      title: "Measuring and deciding", slug: "measuring",
      blocks: [
        p("Tools such as Hardhat's gas reporter and Foundry's gas snapshots show the gas used by each function in your tests. Use them to compare versions instead of guessing. A rule of thumb: spend effort where the gas is large and the function is called often."),
        formula("Value of a gas saving", "yearly value = gas saved per call × calls per year × gas price × ETH price", "Saving 24,000 gas per deposit on 20,000 deposits a month at 30 gwei is 14.4 ETH a month in aggregate user savings."),
        table("Questions to ask before optimising", ["Question", "Why"], [["How often is this called?", "Rare functions are not worth the effort"], ["Who pays?", "Users pay for every call; a small saving across thousands of users adds up"], ["How much clarity do I lose?", "Unreadable code hides bugs"], ["Can I prove the change is safe?", "Tests and reasoning"], ["Will an audit be harder?", "Complexity costs review time"]]),
        mistakes(["Optimising before the code works.", "Believing gas figures from articles instead of measuring.", "Removing events to save gas and breaking the front end."]),
        miniQuiz("measure-mini", [["Why check gas with a report rather than guessing?", ["Reports are free", "Intuition about gas is often wrong", "Law requires it", "It makes code faster"], 1, "Measure, then decide."]]),
      ],
      points: ["Measure with gas reports and weigh value against complexity.", "Optimise frequently called, expensive functions first."],
      check: [["A small saving is most worthwhile when the function is:", ["Never called", "Called very often", "Private", "Internal only"], 1, "Savings multiply."]],
    }),
  ],
  terms: [["Storage slot", "A 32-byte unit of persistent storage"], ["Packing", "Placing several small variables in one slot"], ["Cold access", "The first access to a slot in a transaction"], ["calldata", "Read-only input data"], ["unchecked", "A block that skips overflow checks"], ["Gas report", "A table of gas used by each function"]],
  practical: { title: "Practical: measure packing", intro: "On your own computer with Hardhat.", steps: ["Deploy Unpacked and Packed and set all three values.", "Compare the gas of the transactions.", "Swap the order of variables and measure again.", "Write what you learned."] },
  quiz: [
    ["Storage slots are:", ["16 bytes", "32 bytes", "1 byte", "1 kilobyte"], 1, "Numbered from zero."],
    ["Packing works when variables are:", ["Far apart", "Neighbours that fit in one slot", "Public", "Strings"], 1, "Order matters."],
    ["Writing a new slot costs about:", ["22,100 gas", "5 gas", "1 gas", "Nothing"], 0, "It is the dearest common operation."],
    ["calldata saves gas because:", ["It avoids copying inputs", "It is stored", "It is signed", "It is public"], 0, "No copy to memory."],
    ["unchecked should be used:", ["Everywhere", "Only when overflow is impossible", "On user input", "Never"], 1, "Keep the safety net."],
    ["Always before optimising:", ["Measure", "Rewrite everything", "Delete tests", "Add events"], 0, "Find the real cost."],
    ["Safety checks should be removed:", ["To save gas whenever possible", "Almost never", "Always", "On Fridays"], 1, "Do not trade safety for pennies."],
  ],
});

const M2 = module_({
  slug: "design-patterns", title: "Design patterns for contracts", hours: 2.5, level: "Core skills",
  summary: "State machines, pull payments, factories and clones, and role-based access control.",
  outcome: "You can implement a state machine, pull payments, a clone factory and roles, and explain when each fits.",
  intro: "Most production contracts are combinations of a handful of well-known patterns. Knowing them by name makes your code easier to read and your reviews faster. This module shows each in a complete contract.",
  topics: [
    topic({
      title: "State machines and pull payments: an auction", slug: "auction",
      blocks: [
        code("solidity", auction, "Auction.sol"),
        table("Patterns at work", ["Pattern", "Where", "Why"], [["State machine", "enum Stage and the atStage modifier", "Functions only work in the right stage"], ["Pull payment", "pendingReturns and withdraw()", "A losing bidder who cannot receive ETH cannot block the auction"], ["Checks-effects-interactions", "stage is updated before sending ETH; pendingReturns is zeroed before the call", "Prevents reentrancy"], ["Custom errors", "WrongStage, TooLow and others", "Cheap and clear"], ["Immutables", "seller and endTime", "Cheap to read"]]),
        p("Why not refund the previous bidder inside bid()? If that bidder is a contract that always rejects ETH, every later bid would revert and the auction could never move on. With pull payments, a bad actor only harms itself."),
        miniQuiz("auction-mini", [["Why are refunds pulled rather than pushed in the Auction?", ["To save gas only", "So a bidder that rejects ETH cannot block the auction", "Because call is banned", "To hide bids"], 1, "A denial-of-service defence."]]),
      ],
      points: ["Use explicit stages to restrict functions.", "Pull payments stop one bad recipient blocking everyone."],
      check: [["A state machine in Solidity is commonly built with:", ["An enum and a modifier", "A library only", "Events only", "A string"], 0, "Stage plus a check."]],
    }),
    topic({
      title: "Factories and clones", slug: "factories",
      blocks: [
        code("solidity", factory, "WalletFactory.sol"),
        p("Deploying a full contract costs gas in proportion to its code size. When many copies are needed, such as one wallet per user, a **minimal proxy** (also called a clone, defined in the standard EIP-1167) is far cheaper: a tiny contract that forwards every call to a shared implementation using delegatecall. Each clone has its own storage but shares the code."),
        table("Full deployment versus a clone", ["", "New full contract", "Minimal proxy clone"], [["Code stored per copy", "All of it", "About 45 bytes"], ["Deployment gas", "High and grows with code size", "Low and roughly constant"], ["Call cost", "Direct", "A little extra for the delegatecall"], ["Upgrades", "Each copy is separate", "All clones follow the implementation unless it is fixed (clones are not upgradeable by themselves)"], ["Initialisation", "Constructor", "An init function that must be protected against being called twice"]]),
        warn("A clone has no constructor logic, so you must use an initialiser and guard it against re-initialisation, or anyone could take ownership of the wallet."),
        miniQuiz("factory-mini", [["Why use clones for one wallet per user?", ["They are more secure by default", "Deployment is far cheaper than full copies", "They hide code", "They need no initialiser"], 1, "One shared implementation."]]),
      ],
      points: ["Minimal proxies share one implementation, so each copy is cheap.", "Clones need a protected initialiser instead of a constructor."],
      check: [["A clone shares with its implementation:", ["Storage", "Code", "Owner", "Balance"], 1, "Each has its own storage."]],
    }),
    topic({
      title: "Roles instead of a single owner", slug: "roles",
      blocks: [
        code("solidity", roles, "Treasury.sol"),
        p("A single owner is a single point of failure and a single target. **Role-based access control** splits powers: one role may spend, another may pause, another may manage roles. OpenZeppelin's AccessControl provides roles identified by a hash such as keccak256(\"SPENDER_ROLE\"), a default admin role that can grant and revoke them, and a modifier onlyRole."),
        table("A sensible split for a treasury", ["Role", "Power", "Held by"], [["DEFAULT_ADMIN_ROLE", "Grant and revoke other roles", "A multi-signature wallet"], ["SPENDER_ROLE", "Pay out approved amounts", "An operations account with limits"], ["PAUSER_ROLE", "Stop activity in an emergency", "A fast-response security account"]]),
        list("Good practice", ["Give each role the least power it needs.", "Keep the admin role in a multi-signature wallet.", "Emit events when roles change (AccessControl does).", "Document who holds each role on a public page.", "Plan for losing or rotating a key."]),
        miniQuiz("roles-mini", [["Why separate PAUSER and ADMIN roles?", ["It costs less gas", "A fast emergency stop does not need the power to move funds or change roles", "It hides owners", "The compiler requires it"], 1, "Least privilege."]]),
      ],
      points: ["Roles split powers across accounts.", "Keep admin power in a multi-signature wallet."],
      check: [["onlyRole(SPENDER_ROLE) lets:", ["Anyone call the function", "Only accounts holding that role call it", "Only the deployer call it", "Nobody call it"], 1, "A role check."]],
    }),
  ],
  terms: [["State machine", "A contract with explicit stages"], ["Pull payment", "Recipients withdraw their own funds"], ["Minimal proxy", "A tiny clone that delegates to an implementation"], ["Factory", "A contract that creates other contracts"], ["Role", "A named permission"], ["Least privilege", "Giving only the power needed"]],
  practical: { title: "Practical: break the auction on paper", intro: "Study the Auction code.", steps: ["List every external call that sends ETH.", "For each, write what state is updated before it.", "Imagine a bidder that rejects ETH and trace the effect.", "Add one more check you would include."] },
  quiz: [
    ["A state machine uses:", ["Stages that restrict functions", "Only loops", "Only events", "No state"], 0, "An enum plus modifiers."],
    ["Pull payment means:", ["The contract pays everyone", "Recipients withdraw themselves", "No payment", "Owner pays"], 1, "Avoids failing loops."],
    ["A clone costs:", ["More than a full copy", "Far less to deploy", "Nothing", "The same"], 1, "Clones are tiny, so deployment is cheap."],
    ["Clones must be initialised with:", ["A constructor", "A protected init function", "Nothing", "A fee"], 1, "Guard against reuse."],
    ["AccessControl roles are identified by:", ["A hash of a name", "A number only", "A colour", "An address"], 0, "keccak256 of the role name."],
    ["The admin role should be held by:", ["A hot wallet", "A multi-signature wallet", "Anyone", "The pauser"], 1, "Protect the power to grant roles."],
    ["Least privilege means:", ["Everyone is admin", "Each role gets only the power it needs", "No roles", "One owner"], 1, "Limit the blast radius."],
  ],
});

const M3 = module_({
  slug: "low-level-and-proxies", title: "Low-level calls and upgradeable proxies", hours: 3, level: "Core skills",
  summary: "call, staticcall and delegatecall, how proxies work, why storage collisions happen and how UUPS upgrades are done safely.",
  outcome: "You can explain delegatecall, spot a storage collision, write an initialiser and describe a safe upgrade process.",
  intro: "Contract code is immutable, yet products must change. Proxies resolve the contradiction: the address and data stay the same while the logic behind them is replaced. They are powerful and dangerous. This module explains how they work and how to avoid the classic mistakes.",
  topics: [
    topic({
      title: "call, staticcall and delegatecall", slug: "low-level-calls",
      blocks: [
        table("Three low-level calls", ["Call", "Whose code runs", "Whose storage changes", "msg.sender in the target"], [["call", "The target's", "The target's", "The calling contract"], ["staticcall", "The target's", "None (writes are forbidden)", "The calling contract"], ["delegatecall", "The target's", "The caller's", "The original caller (context preserved)"]]),
        p("**delegatecall** is the building block of proxies. The proxy holds the data. When a user calls the proxy, the proxy delegatecalls the implementation: the implementation's code runs, but it reads and writes the proxy's storage and sees the original msg.sender and msg.value. Replace the implementation's address and the same data is now handled by new code."),
        flow("A call through a proxy", ["User calls the proxy", "The proxy's fallback runs", "It delegatecalls the implementation", "Implementation code runs on the proxy's storage", "Result returns to the user"]),
        warn("Never delegatecall to an address you do not fully control or trust. The target's code can do anything to your storage, including overwriting your owner and draining funds."),
        miniQuiz("delegate-mini", [["With delegatecall, whose storage does the executed code change?", ["The target's", "The caller's", "Nobody's", "The miner's"], 1, "The code is borrowed; the data stays."]]),
      ],
      points: ["delegatecall runs another contract's code on your own storage.", "Proxies use it to separate data from replaceable logic."],
      check: [["In a delegatecall, msg.sender is:", ["The proxy", "The original caller", "The implementation", "Zero"], 1, "The context is preserved."]],
    }),
    topic({
      title: "Storage collisions", slug: "storage-collisions",
      blocks: [
        p("Because the implementation's code uses the proxy's storage, both must agree on what each slot means. If the proxy keeps its own variables, such as the implementation address, in slot 0 and the implementation also uses slot 0 for something else, the two will overwrite each other. This is a **storage collision**."),
        code("solidity", brokenProxy, "BrokenProxy.sol (learning only)"),
        table("What goes wrong", ["Step", "Effect"], [["User calls set(7) through the proxy", "The implementation's code writes 7 to its slot 0"], ["In the proxy, slot 0 is the implementation address", "The address is overwritten by the number 7"], ["Next call", "The proxy delegatecalls address 0x07, which has no code; the contract is bricked"]]),
        table("How the standard avoids it", ["Technique", "Idea"], [["EIP-1967 storage slots", "The proxy keeps its admin and implementation address at pseudo-random slots (derived from a hash) that normal variables never use"], ["Inherited layout", "Implementation versions only append variables and never reorder or remove them"], ["Storage gaps", "Reserved empty slots in base contracts so later versions can add variables"], ["Layout checking tools", "Plugins compare old and new layouts before an upgrade"]]),
        miniQuiz("collision-mini", [["What fixes the BrokenProxy collision in the standard design?", ["More gas", "Keeping proxy variables at special hashed slots that implementations do not use", "A longer name", "Making it payable"], 1, "EIP-1967 slots."]]),
      ],
      points: ["Slots must mean the same thing to the proxy and the implementation.", "EIP-1967 slots, append-only layouts and gaps prevent collisions."],
      check: [["An upgrade that reorders state variables will:", ["Be fine", "Corrupt stored data", "Save gas", "Reduce fees"], 1, "Old data is read as the wrong variable."]],
    }),
    topic({
      title: "UUPS upgrades done carefully", slug: "uups",
      blocks: [
        code("solidity", uups, "BoxV1.sol and BoxV2"),
        table("Parts of a UUPS implementation", ["Piece", "Purpose"], [["Initializable and initializer", "Replaces the constructor: runs once through the proxy to set up state"], ["_disableInitializers() in the constructor", "Stops anyone initialising the implementation contract itself"], ["OwnableUpgradeable", "An owner whose state lives in the proxy's storage"], ["UUPSUpgradeable and _authorizeUpgrade", "The upgrade function lives in the implementation and must be protected"], ["BoxV2 is BoxV1", "A new version adds a function and keeps the old layout"]]),
        table("UUPS compared with the transparent proxy", ["", "Transparent proxy", "UUPS"], [["Where upgrade logic lives", "In the proxy", "In the implementation"], ["Cost of each call", "Slightly higher (admin checks)", "Lower"], ["Risk", "A bug in the proxy is hard to fix", "If you forget the upgrade function in a new version, the contract can never be upgraded again"]]),
        list("Safe upgrade rules", ["Protect _authorizeUpgrade with strong access control, ideally a multi-signature wallet and a time-lock.", "Only append state variables; never reorder or remove them.", "Use reinitialisers with version numbers for new setup.", "Keep the upgrade function in every new version.", "Run layout-compatibility checks and rehearse on a test network and on a fork.", "Verify the new implementation's source before the upgrade."], true),
        warn("Upgradeability means the code's owner can change the rules after users have deposited. Users must trust the governance, so publish it, delay it with a time-lock and keep the power in more than one hand."),
        miniQuiz("uups-mini", [["What does _disableInitializers() in the constructor prevent?", ["Upgrades", "Anyone initialising the implementation contract directly", "Fees", "Events"], 1, "The logic contract itself must stay inert."]]),
      ],
      points: ["UUPS puts upgrade logic in the implementation; guard it well.", "Initialisers replace constructors; layouts only grow."],
      check: [["If a new UUPS version omits the upgrade function:", ["Nothing happens", "The contract can never be upgraded again", "It upgrades itself", "Gas is refunded"], 1, "A classic mistake."]],
    }),
  ],
  terms: [["delegatecall", "Run another contract's code on your storage"], ["Proxy", "A contract that forwards calls to an implementation"], ["Implementation", "The logic contract behind a proxy"], ["Storage collision", "Two contracts using the same slot differently"], ["Initialiser", "A function replacing a constructor in upgradeable contracts"], ["UUPS", "A proxy pattern with upgrade logic in the implementation"]],
  practical: { title: "Practical: trace the collision", intro: "Use the BrokenProxy code.", steps: ["Write what each slot holds in the proxy and in LogicV1.", "Trace a call to set(7).", "Say what the proxy does next.", "Write how EIP-1967 slots would prevent it."] },
  quiz: [
    ["delegatecall changes:", ["The caller's storage", "The target's storage", "No storage", "The miner's storage"], 0, "Borrowed code, own data."],
    ["staticcall forbids:", ["Reads", "State changes", "Events", "Calls"], 1, "Used for safe reads."],
    ["A storage collision is:", ["Two meanings for one slot", "A fee", "A kind of block", "An event"], 0, "Data gets corrupted."],
    ["EIP-1967 slots are:", ["Pseudo-random slots for proxy data", "Slot zero", "Public variables", "Gas"], 0, "Derived from a hash."],
    ["initialize() replaces the:", ["Constructor", "Event", "Fallback", "Modifier"], 0, "State is in the proxy."],
    ["Upgrades should only:", ["Append variables", "Reorder variables", "Delete variables", "Rename storage"], 0, "Keep old slots intact."],
    ["The upgrade function must be protected by:", ["Strong access control and ideally a time-lock", "A comment", "Nothing", "A long name"], 0, "Otherwise anyone can replace the logic."],
  ],
});

const M4 = module_({
  slug: "signatures-and-off-chain-data", title: "Signatures and off-chain data", hours: 2.5, level: "Applied skills",
  summary: "Verifying signatures on-chain, EIP-712 typed data, vouchers and meta-transactions, and defending against replay.",
  outcome: "You can verify a signature in Solidity, bind it against replay and explain how gasless transactions work.",
  intro: "Not everything has to be a transaction. A user can sign a message off-chain, for free, and anyone can submit it later. This powers permits, vouchers, allow-lists and gasless apps, but a signature without careful design can be reused by an attacker.",
  topics: [
    topic({
      title: "Verifying a signature on-chain", slug: "verify-signature",
      blocks: [
        code("solidity", voucher, "SignedVoucher.sol"),
        flow("The voucher flow", ["A trusted signer signs details off-chain", "The recipient receives the signature", "They submit it to the contract", "The contract recomputes the digest", "ECDSA.recover returns the signer", "If it matches and is unused, pay out"]),
        table("What each part does", ["Part", "Purpose"], [["keccak256(abi.encodePacked(...))", "Builds the digest of the data being approved"], ["Includes address(this) and block.chainid", "Ties the signature to one contract on one chain"], ["Includes the nonce", "Makes every voucher unique"], ["toEthSignedMessageHash", "Applies the standard prefix wallets add when signing text"], ["ECDSA.recover", "Returns the address that produced the signature"], ["used[digest] = true before sending", "Blocks reuse and follows checks-effects-interactions"]]),
        miniQuiz("verify-mini", [["Why does the voucher's digest include the contract address and chain id?", ["To save gas", "So the signature cannot be replayed on another contract or chain", "To hide data", "To set fees"], 1, "Replay protection."]]),
        warn("Use well-reviewed libraries such as OpenZeppelin's ECDSA, which also reject malleable signatures. Never write your own signature code."),
      ],
      points: ["Recompute the digest on-chain and recover the signer.", "Bind signatures to the contract, chain and a unique nonce."],
      check: [["ECDSA.recover returns:", ["The signer's address", "The amount", "The nonce", "The fee"], 0, "Compare it with the expected signer."]],
    }),
    topic({
      title: "EIP-712 typed data", slug: "eip712",
      blocks: [
        p("Signing a raw hash shows the user a meaningless string of hex. **EIP-712** defines a way to sign structured data so that a wallet can show the user exactly what they are approving: the fields, the values and the application and chain. It also adds a **domain separator** binding the signature to one application, version, chain and contract."),
        code("solidity", typed, "OrderBook.sol"),
        table("Parts of EIP-712", ["Part", "Meaning"], [["Domain", "name, version, chainId and verifyingContract: stops cross-application and cross-chain replay"], ["Type hash", "A hash of the structure's definition, such as Order(address maker,uint256 amount,uint256 nonce)"], ["Struct hash", "A hash of the actual values under that type"], ["Digest", "The final hash that is signed, combining a prefix, the domain and the struct hash"]]),
        list("Why typed data is safer", ["Users can read what they sign.", "The domain prevents reuse across apps and chains.", "Standard libraries handle the hashing correctly.", "Wallets can warn about suspicious requests."]),
        miniQuiz("typed-mini", [["What does the domain separator add?", ["Speed", "Binding to one app, version, chain and contract", "Encryption", "A fee"], 1, "Replay protection and clarity."]]),
      ],
      points: ["EIP-712 lets users read what they sign and binds it to a domain.", "Use libraries to compute typed-data hashes."],
      check: [["EIP-712 is mainly about:", ["Mining", "Signing structured, readable data", "Gas prices", "Token supply"], 1, "Safer signatures."]],
    }),
    topic({
      title: "Replay protection and meta-transactions", slug: "replay-meta",
      blocks: [
        table("Replay defences", ["Defence", "Blocks"], [["Nonce or used flag", "The same signature used twice"], ["Chain id", "Reuse on another network"], ["Contract address", "Reuse on another contract"], ["Expiry", "Use long after intended"], ["Typed domain", "Reuse across different applications"]]),
        p("A **meta-transaction** lets a user sign an action off-chain and a relayer submit it and pay the gas. The contract checks the user's signature, then acts as if the user had called. Wallet-free sign-ups and gasless games use this. Standards such as ERC-2771 let contracts trust a designated forwarder to tell them who the real sender is."),
        explorer({ id: "adv-meta", title: "Batching gasless actions", intro: "Change the number of actions to see the gas of sending each separately versus in batches. Teaching figures.", inputs: [{ id: "n", label: "Actions", min: 100, max: 20000, step: 100, value: 10000 }, { id: "single", label: "Gas per separate transaction", min: 21000, max: 200000, step: 1000, value: 60000 }, { id: "extra", label: "Gas per action inside a batch", min: 5000, max: 100000, step: 1000, value: 25000 }, { id: "overhead", label: "Overhead per batch", min: 21000, max: 200000, step: 1000, value: 50000 }, { id: "per", label: "Actions per batch", min: 10, max: 600, step: 10, value: 600 }], outputs: [{ label: "Separate transactions (gas)", expr: "n * single", unit: "n" }, { label: "Batched (gas)", expr: "n * extra + ceil(n / per) * overhead", unit: "n" }] }),
        warn("A relayer that pays gas can be abused. Limit what it will sponsor, rate-limit users and consider who pays in the long run."),
        miniQuiz("meta-mini", [["Who pays the gas in a meta-transaction?", ["The signer", "A relayer who submits it", "The miner", "Nobody"], 1, "The user only signs."]]),
      ],
      points: ["Nonces, chain id, contract address, expiry and domain stop replay.", "Meta-transactions let a relayer pay gas for signed actions."],
      check: [["A nonce in a signed message prevents:", ["Reuse of the same signature", "Gas costs", "Fees", "Mining"], 0, "Each message is single-use."]],
    }),
  ],
  terms: [["ECDSA", "The signature scheme used by Ethereum accounts"], ["Digest", "The hash that is signed"], ["Nonce", "A single-use number"], ["EIP-712", "A standard for signing typed data"], ["Domain separator", "Data binding a signature to one app and chain"], ["Meta-transaction", "A signed action submitted by someone else"]],
  practical: { title: "Practical: list the replay risks", intro: "Study the voucher contract.", steps: ["List what is signed.", "For each replay attack, name the defence.", "Add an expiry field in your own words.", "Describe what the wallet should show the user."] },
  quiz: [
    ["A signature proves:", ["Who authorised exact data", "The price", "The speed", "The block"], 0, "If verified correctly."],
    ["The chain id in a digest stops:", ["Cross-chain replay", "Gas costs", "Reentrancy", "Overflow"], 0, "Network-specific."],
    ["A used-flag prevents:", ["Reusing a signature", "Events", "Fees", "Reads"], 0, "Single use."],
    ["EIP-712 helps users by:", ["Showing readable data to sign", "Hiding details", "Lowering gas", "Mining"], 0, "Clearer approvals."],
    ["A relayer in a meta-transaction:", ["Pays gas and submits", "Signs for the user", "Holds the user's key", "Verifies nothing"], 0, "The user only signs."],
    ["You should write your own signature code:", ["Always", "Never; use audited libraries", "Only for tokens", "When bored"], 1, "Crypto is easy to get wrong."],
    ["An expiry in signed data:", ["Limits how long it is valid", "Raises gas", "Hides it", "Burns tokens"], 0, "No valid signature lasts forever."],
  ],
});

const M5 = module_({
  slug: "advanced-testing", title: "Advanced testing", hours: 2.5, level: "Applied skills",
  summary: "Unit, fuzz, invariant, fork and integration tests, and how to choose among them.",
  outcome: "You can choose the right kind of test, write invariants for a contract and read a fuzzing example.",
  intro: "A handful of hand-written examples proves little about contracts that handle money in unforeseeable ways. Professional teams add randomised and stateful testing that explores the situations nobody thought of.",
  topics: [
    topic({
      title: "A map of test types", slug: "test-map",
      blocks: [
        table("Test types", ["Type", "What it does", "Finds"], [["Unit test", "Checks one behaviour with chosen inputs", "Logic errors in a single function"], ["Fuzz test", "The tool generates many random inputs for a function", "Edge cases and arithmetic problems"], ["Invariant test", "The tool calls random sequences of functions and checks properties that must always hold", "Broken accounting, stage violations, unexpected interactions"], ["Fork test", "Runs against a copy of real network state", "Problems with real dependencies such as real tokens"], ["Integration test", "Several contracts working together", "Wiring and permission mistakes"]]),
        code("foundry", foundryTest, "A Foundry fuzz test (not run here)"),
        p("In the example, the fuzzer supplies a, b and c, and the test asserts that both sum functions give the same answer for all of them. If any random case disagreed, the tool would report the exact failing input and let you replay it."),
        miniQuiz("map-mini", [["Which test explores random sequences of calls to check a property?", ["Unit test", "Invariant test", "Fork test", "Integration test"], 1, "Stateful property testing."]]),
        tip("Fuzzing is cheap to start: turn function arguments into test parameters and add bounds so that inputs are meaningful."),
      ],
      points: ["Unit, fuzz, invariant, fork and integration tests each find different bugs.", "Fuzzers report the exact failing input."],
      check: [["A fork test is useful because it:", ["Is faster", "Uses a copy of real network state", "Needs no code", "Hides bugs"], 1, "Realistic dependencies."]],
    }),
    topic({
      title: "Thinking in invariants", slug: "invariants",
      blocks: [
        def("Invariant", "A property that must be true at all times, whatever sequence of actions has happened. Examples: the contract holds enough ETH to cover what it owes; a token's total supply equals the sum of balances; a state machine never moves backwards."),
        table("Invariants for the Auction", ["Invariant", "Meaning"], [["Solvency", "contract balance ≥ sum of pending returns + current highest bid (while open)"], ["Monotonic bid", "highestBid never decreases"], ["Forward-only stage", "stage never returns from Ended to Open"], ["One payout", "the seller is paid exactly once"], ["No double withdrawal", "after a withdrawal, the user's pending return is zero"]]),
        list("How to find invariants", ["Ask what must never happen.", "Ask what quantity should always add up.", "Look at every state variable and ask what relationship it has with others.", "Write the property as a function that returns true or false.", "Let the tool call random functions and check it after each call."], true),
        miniQuiz("inv-mini", [["Which is a good invariant for a token?", ["The price is high", "The total supply equals the sum of all balances", "Gas is low", "The name is short"], 1, "A conservation property."]]),
        warn("An invariant test is only as good as its properties and its handlers. Weak or missing properties give false confidence."),
      ],
      points: ["Invariants are properties that must always hold.", "Look for conservation, ordering and forward-only rules."],
      check: [["A solvency invariant says:", ["The contract owes nothing", "The contract can always pay what it owes", "The contract is cheap", "The contract is public"], 1, "Assets cover liabilities."]],
    }),
    topic({
      title: "Coverage, mutation and review", slug: "coverage-review",
      blocks: [
        table("Other quality tools", ["Tool", "What it tells you"], [["Coverage report", "Which lines and branches your tests ran; unrun code is untested code"], ["Mutation testing", "Small deliberate changes to the code (mutants); if tests still pass, they are weak"], ["Static analysis", "Automated scans for known bug patterns"], ["Formal verification", "Mathematical proof of selected properties (specialised)"], ["Code review", "Humans reading the code against the specification"], ["Independent audit", "Experienced reviewers examining design and code"]]),
        p("High coverage does not prove correctness, but low coverage proves the opposite: some code was never exercised. Use coverage to find gaps, then think about what each gap could hide."),
        list("A layered approach", ["Write unit tests as you code.", "Add fuzz tests for arithmetic and parsing.", "Add invariants for accounting and state.", "Run static analysis in continuous integration.", "Review in pairs and prepare a threat model.", "Commission an audit for anything holding real value."]),
        miniQuiz("cov-mini", [["What does a mutation that survives (tests still pass) tell you?", ["The code is perfect", "Your tests did not notice a change in behaviour", "The compiler is broken", "Gas is low"], 1, "The tests are weak there."]]),
      ],
      points: ["Coverage finds untested code; mutation testing finds weak tests.", "Layer tests, tools, review and audit."],
      check: [["High coverage proves:", ["Correctness", "Nothing by itself about correctness", "Security", "Low gas"], 1, "It shows what ran, not what was checked."]],
    }),
  ],
  terms: [["Fuzzing", "Testing with many random inputs"], ["Invariant", "A property that must always hold"], ["Fork test", "A test against copied real network state"], ["Coverage", "How much code the tests execute"], ["Mutation testing", "Checking that tests catch small code changes"], ["Static analysis", "Automated scanning for bug patterns"]],
  practical: { title: "Practical: write five invariants", intro: "Pick any contract from the course.", steps: ["List what must always add up.", "List what must never happen.", "Write each as a true or false statement.", "Say how a random call sequence might break each."] },
  quiz: [
    ["A fuzz test:", ["Uses chosen inputs only", "Uses many random inputs", "Runs on mainnet", "Needs no code"], 1, "It explores edge cases."],
    ["An invariant test:", ["Runs one call", "Runs random sequences and checks properties", "Deploys to mainnet", "Replaces audits"], 1, "It tests stateful behaviour."],
    ["A fork test uses:", ["Copied real network state", "No chain", "A bank", "A wallet"], 0, "Realistic dependencies."],
    ["Coverage shows:", ["Which code your tests ran", "That code is correct", "Gas", "Security"], 0, "Gaps in testing."],
    ["Mutation testing checks:", ["That tests catch small changes", "Gas", "Names", "Fees"], 0, "Test quality."],
    ["Audits are needed for:", ["Anything holding real value", "Toy projects only", "Never", "Only tokens"], 0, "Independent review."],
    ["A good invariant describes:", ["What must always be true", "A single value", "A name", "A colour"], 0, "A conservation or ordering rule."],
  ],
});

const M6 = module_({
  slug: "production-practice", title: "Production practice", hours: 2.5, level: "Applied skills",
  summary: "Documentation, threat modelling, audit preparation and the discipline of safe releases.",
  outcome: "You can document contracts with NatSpec, threat-model a design, prepare for an audit and run a safe release.",
  intro: "Code that holds other people's money needs more than correctness: it needs documentation, a threat model, a release process and a plan for when things go wrong. This module covers the habits of teams who ship contracts for a living.",
  topics: [
    topic({
      title: "Documentation that helps reviewers", slug: "natspec",
      blocks: [
        code("solidity", natspec, "DocCounter.sol"),
        table("NatSpec tags", ["Tag", "Use"], [["@title, @author", "Describe the contract"], ["@notice", "Plain-language description for users, shown by wallets and explorers"], ["@dev", "Notes for developers: assumptions and warnings"], ["@param", "What each input means"], ["@return", "What the function returns"], ["@custom:...", "Project-specific tags, such as security contacts"]]),
        list("What good documentation includes", ["A one-page specification that says what the system must do and what it must never do.", "NatSpec on every external function.", "A list of roles and what each can do.", "A diagram of contracts and how they call each other.", "A list of trust assumptions: oracles, admins and external contracts.", "A known issues list."], true),
        tip("If an auditor has to guess what you meant, they will spend your money on guessing. Clear documentation makes reviews faster, cheaper and better."),
        miniQuiz("natspec-mini", [["Which tag describes a function for end users in wallets and explorers?", ["@dev", "@notice", "@param", "@custom"], 1, "@notice is user-facing."]]),
      ],
      points: ["Use NatSpec, a specification and a trust-assumption list.", "Clear documentation makes audits faster."],
      check: [["@param documents:", ["Each input", "The licence", "The gas", "The owner"], 0, "One line per parameter."]],
    }),
    topic({
      title: "Threat modelling and audit preparation", slug: "threat-model",
      blocks: [
        flow("A simple threat model", ["List the assets (money, data, trust)", "List the actors (users, admins, attackers, other contracts)", "List the entry points (functions, signatures, upgrades)", "Ask 'what could go wrong?' for each", "Decide and record the mitigations", "Note the residual risks"]),
        table("Common threat questions", ["Question", "Example"], [["What if this external call re-enters?", "Reentrancy on withdraw"], ["What if this admin key is stolen?", "Role compromise and time-lock"], ["What if this oracle is wrong or late?", "Price manipulation"], ["What if this input is extreme?", "Zero, maximum, very long arrays"], ["What if the order of transactions changes?", "Front-running and sandwiching"], ["What if gas costs rise or a loop grows?", "Denial of service"], ["What if an upgrade breaks storage?", "Layout corruption"]]),
        list("Preparing for an audit", ["Freeze the code and tag the version.", "Provide the specification, diagrams and test instructions.", "Make sure tests pass and coverage is high.", "Run static analysis and fix the easy findings first.", "Explain the assumptions and the areas you are least sure about.", "Reserve time to fix findings and have them re-checked."]),
        miniQuiz("threat-mini", [["What is a residual risk?", ["A fixed bug", "A risk that remains after mitigations", "A type of fee", "A role"], 1, "Record what you could not remove."]]),
      ],
      points: ["Threat modelling lists assets, actors, entry points and what could go wrong.", "Prepare an audit with a frozen version, documents and tests."],
      check: [["Before an audit you should:", ["Keep changing the code", "Freeze the version and supply documentation", "Remove tests", "Hide risks"], 1, "Auditors need a stable target."]],
    }),
    topic({
      title: "Release and incident discipline", slug: "release",
      blocks: [
        table("A release process", ["Stage", "Checks"], [["Prepare", "Tests green, audit findings fixed, version tagged"], ["Rehearse", "Deploy to a test network and to a fork; run the full upgrade or launch script"], ["Announce", "Publish the verified source, addresses and a change summary"], ["Launch gradually", "Deposit caps, allow-lists or a small first phase"], ["Monitor", "Alerts on large transfers, role changes, pauses and unusual calls"], ["Respond", "A written incident plan: who pauses, who communicates, who investigates"]]),
        explorer({ id: "adv-cap", title: "Why start with a cap", intro: "Change the cap and the chance of a serious bug to see the expected loss. A teaching model with made-up numbers.", inputs: [{ id: "cap", label: "Deposit cap (rupees)", min: 100000, max: 100000000, step: 100000, value: 5000000 }, { id: "p", label: "Chance of a serious bug (%)", min: 1, max: 50, step: 1, value: 10 }], outputs: [{ label: "Expected loss if bugs are exploited fully (rupees)", expr: "cap * p / 100", unit: "rs" }] }),
        list("When something goes wrong", ["Pause if you can. Stop the loss first.", "Tell users clearly and quickly what you know and do not know.", "Preserve the evidence: transactions, logs and code versions.", "Fix, test and rehearse the fix before applying it.", "Publish a post-mortem: what happened, why and what will change."], true),
        warn("This course teaches concepts and habits. It does not make a contract safe. Real deployments need professional audits, legal advice and continuing operations."),
        miniQuiz("release-mini", [["Why launch with deposit caps?", ["To look small", "To limit the harm if an undiscovered bug exists", "To save gas", "To avoid events"], 1, "A cap limits the blast radius."]]),
      ],
      points: ["Prepare, rehearse, announce, launch gradually, monitor and respond.", "Pause first, communicate honestly, then fix and learn."],
      check: [["After an incident you should publish:", ["Nothing", "A post-mortem", "A new token", "A fee"], 1, "Trust grows from honesty."]],
    }),
  ],
  terms: [["NatSpec", "Structured documentation comments in Solidity"], ["Threat model", "A structured list of what could go wrong"], ["Residual risk", "A risk that remains after mitigation"], ["Audit", "An independent security review"], ["Deposit cap", "A limit on funds a contract may hold"], ["Post-mortem", "A written account of an incident"]],
  practical: { title: "Practical: document and model", intro: "Use the Auction contract.", steps: ["Add NatSpec to each function.", "List assets and actors.", "Write five threats and mitigations.", "List the residual risks."] },
  quiz: [
    ["NatSpec is:", ["Documentation comments in Solidity", "A wallet", "A token", "A fee"], 0, "Used by wallets and explorers."],
    ["A threat model lists:", ["Assets, actors and what could go wrong", "Only gas", "Only colours", "Only fees"], 0, "A structured way to think."],
    ["Before an audit:", ["Freeze the code", "Keep editing", "Delete tests", "Hide docs"], 0, "A stable target."],
    ["Deposit caps help:", ["Limit harm from unknown bugs", "Reduce fees", "Speed up blocks", "Hide balances"], 0, "A gradual launch."],
    ["In an incident, first:", ["Pause if possible", "Argue", "Wait a week", "Delete logs"], 0, "Stop the loss."],
    ["A post-mortem explains:", ["What happened, why and what changes", "Who to blame", "The gas price", "The ETH price"], 0, "Learn openly."],
    ["Professional deployments need:", ["Only tests", "Audits, legal advice and operations", "A fast launch", "Luck"], 1, "Real value, real duty."],
  ],
});

export default course({
  slug: "advanced-solidity-development", title: "Advanced Solidity & Smart Contract Development", tagline: "Storage and gas, design patterns, proxies and upgrades, signatures, advanced testing and production discipline", level: "Advanced", hours: 16,
  summary: "An advanced, design-led course for developers who already write Solidity: storage layout and gas, state machines, pull payments, clones and roles, delegatecall and UUPS upgrades, signatures and EIP-712, fuzz and invariant testing, documentation, threat modelling and release practice. All Solidity listings were compiled with solc 0.8 against OpenZeppelin 5, and you run them yourself in your own tools.",
  modules: [M1, M2, M3, M4, M5, M6],
  capstone: capstone({
    title: "Final project: design an upgradeable vault", summary: "Produce a professional design document and pass the final assessment.",
    intro: "You can now reason about storage, patterns, proxies, signatures, testing and release practice. In this final step you design an upgradeable, role-controlled vault with signed withdrawal requests: its architecture, roles, state layout, signature scheme, upgrade policy, tests and threats. Then take the final assessment covering the whole course.",
    steps: ["Work through the **Final project: design an upgradeable vault** lab.", "Check each defence against the threats you listed.", "Take the final assessment below."], projectTitle: "An upgradeable vault design document",
    quiz: [
      ["Neighbouring small variables can share:", ["A storage slot", "A function", "An event", "A block"], 0, "Order matters."],
      ["unchecked is appropriate when:", ["Overflow is provably impossible", "Always", "For user input", "Never"], 0, "Otherwise keep checks."],
      ["Pull payments protect against:", ["A recipient blocking everyone", "Gas costs", "Events", "Reads"], 0, "Denial of service."],
      ["Clones share with the implementation:", ["Code", "Storage", "Owner", "Balance"], 0, "Storage is separate."],
      ["delegatecall changes:", ["The caller's storage", "The target's storage", "No storage", "The miner's storage"], 0, "Borrowed code, own data."],
      ["A storage collision is:", ["Two meanings for one slot", "A fee", "A block", "An event"], 0, "It corrupts data."],
      ["A UUPS upgrade function must be:", ["Protected and kept in every version", "Public to all", "Removed", "Hidden"], 0, "Otherwise upgrade control is lost."],
      ["A nonce in signed data prevents:", ["Reusing the same signature", "Gas costs", "Mining", "Fees"], 0, "Single use."],
      ["The chain id in a digest prevents:", ["Cross-chain replay", "Overflow", "Reentrancy", "Gas"], 0, "Network binding."],
      ["An invariant test:", ["Checks properties over random call sequences", "Runs one call", "Replaces audits", "Deploys to mainnet"], 0, "It tests stateful behaviour."],
      ["A threat model starts with:", ["Assets and actors", "Gas", "Colours", "Fees"], 0, "What to protect and from whom."],
      ["For a first launch you should:", ["Use caps and monitoring", "Hold everything at once", "Skip tests", "Hide the code"], 0, "Limit the blast radius."],
    ],
  }),
  labs,
  skills: [{ id: SK, label: "Advanced Solidity" }],
  badges: [
    { id: "slot-saver", title: "Slot saver", description: "Calculated the gas saved by packing.", when: { all: ["v1-packing"] } },
    { id: "pattern-spotter", title: "Pattern spotter", description: "Named contract design patterns.", when: { all: ["v3-patterns"] } },
    { id: "threat-modeller", title: "Threat modeller", description: "Threat-modelled the Auction.", when: { all: ["v11-threat-model"] } },
    { id: "vault-designer", title: "Vault designer", description: "Designed an upgradeable vault.", when: { all: ["cap-vault"] } },
  ],
  landing: {
    hero: { eyebrow: "Advanced · Eleven compiled listings checked against OpenZeppelin 5", title: "Advanced Solidity: design contracts that survive contact with reality", subtitle: "Pack storage and measure gas, build state machines, factories and role systems, reason about proxies and upgrades, verify signatures, write invariants and threat-model your own design. Every task is checked and explained.", level: "Advanced", outcomeLine: "After this course you can design, review and plan the release of non-trivial smart contract systems." },
    outcomes: [
      { icon: "sheet", title: "Optimise with evidence", text: "Storage layout, gas measurement and safe savings." },
      { icon: "sort", title: "Use proven patterns", text: "State machines, pull payments, clones and roles." },
      { icon: "cloud", title: "Understand proxies", text: "delegatecall, collisions, initialisers and UUPS." },
      { icon: "safety", title: "Work with signatures", text: "ECDSA, EIP-712 and replay protection." },
      { icon: "docs", title: "Test like a professional", text: "Fuzz, invariant, fork and integration tests." },
      { icon: "word", title: "Ship responsibly", text: "NatSpec, threat models, audits and incidents." },
    ],
    projects: [
      { title: "A packing and gas calculation", text: "What a storage layout costs.", module: "storage-and-gas" },
      { title: "A state machine design", text: "Stages, actions and risks.", module: "design-patterns" },
      { title: "A threat model", text: "Assets, actors, threats and mitigations.", module: "production-practice" },
      { title: "An upgradeable vault design", text: "Roles, layout, signatures, upgrade policy and tests.", module: "capstone" },
    ],
    tools: [{ icon: "docs", title: "Compiled code listings", text: "Contracts verified with solc against OpenZeppelin 5." }, { icon: "sheet", title: "Spreadsheet lab", text: "Gas, savings and batching calculations." }, { icon: "word", title: "Document editor", text: "Designs, plans and threat models." }],
    assessment: ["Finish the required labs in each module: they are checked automatically and explained when something is missing.", "Pass each module quiz (70% or more). Short tests inside the lessons give instant feedback.", "Complete the vault design and the final assessment."],
    faq: [
      { q: "Does the platform run my Solidity or tests?", a: "No. The labs check your design, analysis and calculations. You run the code in your own tools, and the lessons show what to run." },
      { q: "What should I know first?", a: "You should be comfortable with basic Solidity and the Ethereum model, for example from the earlier courses in this series." },
      { q: "Will it make my contracts safe?", a: "It teaches habits that reduce risk. Contracts holding real value still need professional audits, legal advice and ongoing monitoring." },
    ],
  },
  catalogue: {
    hours: "~16 hrs", weeks: "~6 weeks", pace: "3 hrs/wk", badge: "Advanced Solidity",
    brief: "Storage and gas, design patterns, delegatecall and proxies, signatures and EIP-712, advanced testing and production practice.",
    learn: ["Storage layout, packing and measured gas optimisation", "State machines, pull payments, clones and role-based access", "delegatecall, storage collisions and UUPS upgrade safety", "ECDSA, EIP-712 typed data and replay protection", "Unit, fuzz, invariant and fork testing", "NatSpec, threat modelling, audit preparation and release discipline"],
    handsOn: "Write a full design document for an upgradeable, role-controlled vault with signed withdrawals, tests and a threat model.",
    outcome: "Design, review and plan the release of non-trivial smart contract systems.",
  },
});
