import { capstone, ck, classifyLab, code, course, def, explorer, flow, list, miniQuiz, mistakes, module_, p, S, sheetLab, table, tip, topic, W, warn, wordLab } from "../kit.mjs";

const SK = "enterprise-bc";

const fabricChaincode = `'use strict';
// A Hyperledger Fabric smart contract ("chaincode") written in JavaScript.
// Fabric runs it on endorsing peers of several organisations; a transaction is valid only if enough organisations agree.
const { Contract } = require("fabric-contract-api");

class ShipmentContract extends Contract {
  async createShipment(ctx, shipmentId, origin, destination) {
    const exists = await ctx.stub.getState(shipmentId);
    if (exists && exists.length > 0) {
      throw new Error("Shipment " + shipmentId + " already exists");
    }
    const shipment = {
      id: shipmentId,
      origin,
      destination,
      status: "CREATED",
      owner: ctx.clientIdentity.getMSPID(),    // the organisation that made the call
      history: [{ status: "CREATED", by: ctx.clientIdentity.getMSPID(), at: ctx.stub.getTxTimestamp().seconds.low }],
    };
    await ctx.stub.putState(shipmentId, Buffer.from(JSON.stringify(shipment)));
    return JSON.stringify(shipment);
  }

  async updateStatus(ctx, shipmentId, newStatus) {
    const allowed = ["CREATED", "IN_TRANSIT", "CUSTOMS_CLEARED", "DELIVERED"];
    if (!allowed.includes(newStatus)) {
      throw new Error("Unknown status " + newStatus);
    }
    const data = await ctx.stub.getState(shipmentId);
    if (!data || data.length === 0) {
      throw new Error("Shipment " + shipmentId + " does not exist");
    }
    const shipment = JSON.parse(data.toString());
    // Role rule: only the customs organisation may mark goods as cleared.
    if (newStatus === "CUSTOMS_CLEARED" && ctx.clientIdentity.getMSPID() !== "CustomsMSP") {
      throw new Error("Only customs can clear a shipment");
    }
    shipment.status = newStatus;
    shipment.history.push({ status: newStatus, by: ctx.clientIdentity.getMSPID(), at: ctx.stub.getTxTimestamp().seconds.low });
    await ctx.stub.putState(shipmentId, Buffer.from(JSON.stringify(shipment)));
    return JSON.stringify(shipment);
  }

  async readShipment(ctx, shipmentId) {
    const data = await ctx.stub.getState(shipmentId);
    if (!data || data.length === 0) {
      throw new Error("Shipment " + shipmentId + " does not exist");
    }
    return data.toString();
  }
}

module.exports = ShipmentContract;`;

const consortium = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

// A consortium decision needs approval from a minimum number of DIFFERENT member organisations.
// Each organisation has one voting account here; in real life each would use its own protected, multi-signature wallet.
contract ConsortiumApprovals is AccessControl {
    bytes32 public constant MEMBER_ROLE = keccak256("MEMBER_ROLE");

    struct Proposal {
        bytes32 descriptionHash;   // fingerprint of the full proposal text kept in the consortium's documents
        uint64 deadline;
        uint32 approvals;
        bool executed;
    }

    uint256 public immutable quorum;            // organisations that must approve
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public approvedBy;

    event Proposed(uint256 indexed id, bytes32 descriptionHash, uint64 deadline);
    event Approved(uint256 indexed id, address indexed member);
    event Executed(uint256 indexed id);

    error AlreadyApproved();
    error Expired();
    error NotEnoughApprovals();
    error AlreadyExecuted();

    constructor(address admin, address[] memory members, uint256 requiredApprovals) {
        require(requiredApprovals > 0 && requiredApprovals <= members.length, "Bad quorum");
        quorum = requiredApprovals;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        for (uint256 i = 0; i < members.length; i++) {
            _grantRole(MEMBER_ROLE, members[i]);
        }
    }

    function propose(bytes32 descriptionHash, uint64 votingSeconds) external onlyRole(MEMBER_ROLE) returns (uint256 id) {
        id = proposalCount++;
        proposals[id] = Proposal(descriptionHash, uint64(block.timestamp) + votingSeconds, 0, false);
        emit Proposed(id, descriptionHash, proposals[id].deadline);
    }

    function approve(uint256 id) external onlyRole(MEMBER_ROLE) {
        Proposal storage p = proposals[id];
        if (block.timestamp > p.deadline) revert Expired();
        if (approvedBy[id][msg.sender]) revert AlreadyApproved();
        approvedBy[id][msg.sender] = true;
        p.approvals += 1;
        emit Approved(id, msg.sender);
    }

    // Recording the decision on-chain; the real-world action is taken by the organisations under their agreement.
    function execute(uint256 id) external onlyRole(MEMBER_ROLE) {
        Proposal storage p = proposals[id];
        if (p.executed) revert AlreadyExecuted();
        if (p.approvals < quorum) revert NotEnoughApprovals();
        p.executed = true;
        emit Executed(id);
    }
}`;

const htlc = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// A hashed time-lock contract (HTLC): the building block of atomic swaps between two chains.
// The sender locks funds against the hash of a secret. The receiver can claim them by revealing the secret
// before the deadline. If they do not, the sender can take the funds back after the deadline.
contract HashedTimelock {
    struct Lock {
        address sender;
        address receiver;
        uint256 amount;
        bytes32 hashlock;   // sha256 of the secret
        uint64 deadline;
        bool done;
    }

    mapping(bytes32 => Lock) public locks;

    event Locked(bytes32 indexed lockId, address indexed sender, address indexed receiver, uint256 amount, bytes32 hashlock, uint64 deadline);
    event Claimed(bytes32 indexed lockId, bytes secret);
    event Refunded(bytes32 indexed lockId);

    error Exists();
    error NotFound();
    error Finished();
    error WrongSecret();
    error TooLate();
    error TooEarly();
    error NotSender();
    error TransferFailed();

    function lock(address receiver, bytes32 hashlock, uint64 durationSeconds) external payable returns (bytes32 lockId) {
        lockId = keccak256(abi.encode(msg.sender, receiver, hashlock, msg.value, block.timestamp));
        if (locks[lockId].sender != address(0)) revert Exists();
        uint64 deadline = uint64(block.timestamp) + durationSeconds;
        locks[lockId] = Lock(msg.sender, receiver, msg.value, hashlock, deadline, false);
        emit Locked(lockId, msg.sender, receiver, msg.value, hashlock, deadline);
    }

    // Revealing the secret here makes it public, which lets the other party claim on the other chain.
    function claim(bytes32 lockId, bytes calldata secret) external {
        Lock storage l = locks[lockId];
        if (l.sender == address(0)) revert NotFound();
        if (l.done) revert Finished();
        if (block.timestamp > l.deadline) revert TooLate();
        if (sha256(secret) != l.hashlock) revert WrongSecret();
        l.done = true;
        emit Claimed(lockId, secret);
        (bool ok, ) = l.receiver.call{value: l.amount}("");
        if (!ok) revert TransferFailed();
    }

    function refund(bytes32 lockId) external {
        Lock storage l = locks[lockId];
        if (l.sender == address(0)) revert NotFound();
        if (l.done) revert Finished();
        if (msg.sender != l.sender) revert NotSender();
        if (block.timestamp <= l.deadline) revert TooEarly();
        l.done = true;
        emit Refunded(lockId);
        (bool ok, ) = l.sender.call{value: l.amount}("");
        if (!ok) revert TransferFailed();
    }
}`;

const consent = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// A consent register for data sharing. The chain stores WHO agreed to share WHAT KIND of data with WHOM,
// as hashes and timestamps only. The data itself stays in the organisations' own protected systems.
contract ConsentRegistry {
    struct Consent {
        uint64 grantedAt;
        uint64 expiresAt;   // 0 means no expiry
        bool revoked;
    }

    // subject => recipient => purpose hash => consent
    mapping(address => mapping(address => mapping(bytes32 => Consent))) private consents;

    event ConsentGranted(address indexed subject, address indexed recipient, bytes32 indexed purpose, uint64 expiresAt);
    event ConsentRevoked(address indexed subject, address indexed recipient, bytes32 indexed purpose);

    function grant(address recipient, bytes32 purpose, uint64 validForSeconds) external {
        uint64 expiry = validForSeconds == 0 ? 0 : uint64(block.timestamp) + validForSeconds;
        consents[msg.sender][recipient][purpose] = Consent(uint64(block.timestamp), expiry, false);
        emit ConsentGranted(msg.sender, recipient, purpose, expiry);
    }

    function revoke(address recipient, bytes32 purpose) external {
        consents[msg.sender][recipient][purpose].revoked = true;
        emit ConsentRevoked(msg.sender, recipient, purpose);
    }

    // A data holder calls this before releasing anything.
    function isAllowed(address subject, address recipient, bytes32 purpose) external view returns (bool) {
        Consent memory c = consents[subject][recipient][purpose];
        if (c.grantedAt == 0 || c.revoked) return false;
        if (c.expiresAt != 0 && block.timestamp > c.expiresAt) return false;
        return true;
    }
}`;

const anchor = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

// Anchoring: a company keeps millions of records in its own systems and publishes only the Merkle root of a batch.
// Anyone with a record and its proof can later show that the record existed in that batch at that time.
contract BatchAnchor is AccessControl {
    bytes32 public constant ANCHORER_ROLE = keccak256("ANCHORER_ROLE");

    struct Batch {
        bytes32 root;
        uint64 anchoredAt;
        string label;       // for example "2026-03 invoices"
    }

    Batch[] public batches;

    event Anchored(uint256 indexed batchId, bytes32 root, string label);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function anchor(bytes32 root, string calldata label) external onlyRole(ANCHORER_ROLE) returns (uint256 batchId) {
        batchId = batches.length;
        batches.push(Batch(root, uint64(block.timestamp), label));
        emit Anchored(batchId, root, label);
    }

    function proves(uint256 batchId, bytes32 recordHash, bytes32[] calldata proof) external view returns (bool) {
        return MerkleProof.verify(proof, batches[batchId].root, recordHash);
    }
}`;

const batchScript = `// anchor-batch.js — build a Merkle root over a day's record hashes and publish only the root.
const { keccak256, toUtf8Bytes, concat, Contract, JsonRpcProvider, Wallet } = require("ethers");

// Sorted pairs make the tree match OpenZeppelin's MerkleProof, which hashes each pair in sorted order.
function hashPair(a, b) {
  return a.toLowerCase() < b.toLowerCase() ? keccak256(concat([a, b])) : keccak256(concat([b, a]));
}

function buildTree(leaves) {
  if (leaves.length === 0) throw new Error("No records to anchor");
  const levels = [leaves];
  while (levels[levels.length - 1].length > 1) {
    const current = levels[levels.length - 1];
    const next = [];
    for (let i = 0; i < current.length; i += 2) {
      next.push(i + 1 < current.length ? hashPair(current[i], current[i + 1]) : current[i]);  // an odd one is promoted
    }
    levels.push(next);
  }
  return levels;
}

function proofFor(levels, index) {
  const proof = [];
  for (let level = 0; level < levels.length - 1; level++) {
    const sibling = index ^ 1;
    if (sibling < levels[level].length) proof.push(levels[level][sibling]);
    index = Math.floor(index / 2);
  }
  return proof;
}

async function anchorBatch(records, label) {
  // Each record is turned into a leaf hash. The records themselves never leave the company.
  const leaves = records.map((record) => keccak256(keccak256(toUtf8Bytes(JSON.stringify(record)))));
  const levels = buildTree(leaves);
  const root = levels[levels.length - 1][0];

  const provider = new JsonRpcProvider(process.env.RPC_URL);
  const signer = new Wallet(process.env.ANCHOR_KEY, provider);   // a dedicated low-balance key with only the anchorer role
  const contract = new Contract(process.env.ANCHOR_ADDRESS, ["function anchor(bytes32 root, string label) returns (uint256)"], signer);
  const tx = await contract.anchor(root, label);
  await tx.wait(2);

  return { root, levels, txHash: tx.hash };
}

module.exports = { buildTree, proofFor, anchorBatch };`;

const adrTemplate = `# ADR-007: Use a permissioned consortium network for shipment tracking

Status: Accepted (2026-03-14)
Deciders: Architecture board; customs, carrier and port representatives

## Context
Four organisations that do not fully trust each other need one shared, tamper-evident record of shipment status.
Today each keeps its own database and reconciles by e-mail; disputes cost about 900,000 rupees a year.

## Options considered
1. A shared database run by one party. Cheapest, but the others must trust the operator.
2. A public blockchain. Very transparent, but data would be public and costs unpredictable.
3. A permissioned consortium network (Hyperledger Fabric). Shared record, known members, private channels.

## Decision
Option 3, with each organisation operating its own peer.

## Consequences
- Good: no single operator; every status change is signed by the organisation that made it.
- Good: private data stays within channels.
- Bad: higher running cost and operational skill; governance meetings are needed.
- Bad: if the consortium dissolves, the network must be wound down; an exit plan is part of the agreement.

## Review
Revisit after 12 months, or if membership changes by more than one organisation.`;

const labs = [
  classifyLab({
    id: "e1-fit", module: "when-blockchain-fits", title: "Does blockchain fit this problem?", level: "advanced", minutes: 14, xp: 50, skills: [SK], required: true,
    objective: "Apply an honest decision test to enterprise use cases.", scenario: "Most failed blockchain pilots used the technology where a database would have done. Judge each case.",
    steps: ["Read each case.", "Choose the verdict.", "Press Check my work."],
    categories: [["fits", "Blockchain may fit"], ["database", "A shared or ordinary database is better"], ["maybe", "Needs more analysis"]],
    items: [["Four competing companies need one shared record that none of them controls", "fits", "Multiple parties who do not trust a single operator."], ["One company tracks its own warehouse stock", "database", "One owner, so a database is simpler and cheaper."], ["Several organisations reconcile the same data by e-mail and argue about it", "maybe", "Plausible, but first try a shared service."], ["A bank wants to store customer personal data permanently on a shared ledger", "database", "Privacy law and the need to correct data argue against it."], ["Parties need proof that a document existed at a certain time, without revealing it", "fits", "Anchoring hashes is a good fit."], ["A single regulator can already force everyone to use its central system", "database", "A trusted authority exists."], ["Cross-border payments among institutions with different systems", "maybe", "Depends on regulation, partners and alternatives."], ["Speed above all: thousands of transactions per second with one operator", "database", "A database is far faster."]],
  }),
  sheetLab({
    id: "e2-tco", module: "when-blockchain-fits", title: "Compare three-year costs", level: "advanced", minutes: 16, xp: 55, skills: [SK], required: false,
    objective: "Compare the total cost of a consortium blockchain with a shared database, including the savings that justify it.",
    scenario: "A blockchain costs more to build and run but avoids reconciliation work. Compare the costs over the years in B5, and find how long it takes to pay off. (Teaching figures in rupees.)",
    steps: ["In B7 work out the blockchain total: setup plus (yearly running cost minus yearly reconciliation avoided) times the years.", "In B8 work out the database total in the same way (column C).", "In B9 work out the difference: blockchain minus database.", "In B10 show Blockchain cheaper if B9 is below zero, otherwise Database cheaper.", "In B11 work out the years to break even: the extra setup cost divided by the yearly saving difference, rounded up."],
    cells: { A1: "Item", B1: "Blockchain", C1: "Database", A2: "Setup cost", B2: "3000000", C2: "800000", A3: "Yearly running cost", B3: "1200000", C3: "400000", A4: "Yearly reconciliation cost avoided", B4: "900000", C4: "0", A5: "Years", B5: "3", A7: "Total cost, blockchain", A8: "Total cost, database", A9: "Difference", A10: "Verdict", A11: "Break-even (years)" }, view: { cols: 3, rows: 13 },
    checks: [
      ck("b7", "B7 is the blockchain total", "=B2+(B3-B4)*B5", "Setup plus net yearly cost.", S.formula("B7", { equals: 3900000 })),
      ck("b8", "B8 is the database total", "=C2+(C3-C4)*B5", "Same method with column C.", S.formula("B8", { equals: 2000000 })),
      ck("b9", "B9 is the difference", "=B7-B8", "Blockchain minus database.", S.formula("B9", { equals: 1900000 })),
      ck("b10", "B10 is the verdict", "=IF(B9<0,\"Blockchain cheaper\",\"Database cheaper\")", "Negative means cheaper.", S.formula("B10", { fns: ["IF"], equals: "Database cheaper" })),
      ck("b11", "B11 is the break-even", "=ROUNDUP((B2-C2)/((C3-C4)-(B3-B4)),0)", "Extra setup over the yearly saving difference.", S.formula("B11", { fns: ["ROUNDUP"], equals: 22 })),
    ],
    solution: { cells: { B7: "=B2+(B3-B4)*B5", B8: "=C2+(C3-C4)*B5", B9: "=B7-B8", B10: "=IF(B9<0,\"Blockchain cheaper\",\"Database cheaper\")", B11: "=ROUNDUP((B2-C2)/((C3-C4)-(B3-B4)),0)" } },
  }),
  classifyLab({
    id: "e3-network-type", module: "permissioned-and-consortium-networks", title: "Public, permissioned or consortium?", level: "advanced", minutes: 12, xp: 45, skills: [SK], required: true,
    objective: "Choose the network model that fits each requirement.", scenario: "The kind of network decides who can read, write and operate it. Match each requirement.",
    steps: ["Read each requirement.", "Choose the model.", "Press Check my work."],
    categories: [["public", "Public network"], ["permissioned", "Permissioned network run by one organisation"], ["consortium", "Consortium network run by several organisations"]],
    items: [["Anyone in the world must be able to verify records without asking permission", "public", "Open participation."], ["One company wants a tamper-evident internal log with known members only", "permissioned", "Controlled by one operator."], ["Five banks share a settlement ledger and none should control it alone", "consortium", "Shared operation."], ["Members must be identified and legally bound by an agreement", "consortium", "Governed by contract between members."], ["Users should not need to know anything about the operators", "public", "Neutral infrastructure."], ["Data must be visible only to the parties in a transaction", "permissioned", "Private channels or private transactions."], ["Operators must be able to remove a misbehaving member", "consortium", "Governance rules allow exclusion."], ["Maximum censorship resistance", "public", "Nobody can block participants."]],
  }),
  wordLab({
    id: "e4-charter", module: "permissioned-and-consortium-networks", title: "Draft a consortium governance charter", level: "advanced", minutes: 20, xp: 70, skills: [SK], required: false,
    objective: "Write the main rules that let competing organisations run a shared network fairly.",
    scenario: "Four organisations plan a shipment-tracking network. Draft the governance charter.",
    steps: ["Add Heading 2 sections: Members, Decisions, Costs, Disputes, Leaving.", "Under Decisions state how many members must approve changes.", "Under Leaving describe how data and keys are handled when a member exits.", "Under Members write a bulleted list of at least three obligations.", "Keep it between 130 and 290 words."],
    checks: [
      ck("heads", "Five sections", "Use Heading 2.", "A clear charter.", W.heading(5, 2)),
      ck("order", "In order", "Members, Decisions, Costs, Disputes, Leaving.", "From joining to leaving.", W.order(["Members", "Decisions", "Costs", "Disputes", "Leaving"])),
      ck("oblig", "Three obligations", "Use the bullet button.", "What members must do.", W.list(3, "ul")),
      ck("quorum", "States an approval threshold", "Mention majority, two thirds or approval by a number of members.", "A rule for decisions.", W.pattern("majority|two thirds|two-thirds|three of four|all members|unanim", "an approval threshold")),
      ck("exit", "Describes leaving", "Mention data, keys or access when leaving.", "Plan the exit.", W.pattern("keys|access|data|copy|export", "what happens to data and access")),
      ck("len", "Between 130 and 290 words", "Concise.", "A usable charter.", W.words(130, 290)),
    ],
    solution: "<h2>Members</h2><p>Each member organisation operates its own peer and is identified by a legal entity. Members must:</p><ul><li>Keep their keys in protected hardware and report any suspected leak at once.</li><li>Keep their peer available and updated within the agreed windows.</li><li>Follow the data-protection rules and share costs as agreed.</li></ul><h2>Decisions</h2><p>Ordinary changes to the application need approval by a majority of members. Changes to membership, the rules of the network or the consensus settings need approval by three of four members. Every approval is recorded on the network.</p><h2>Costs</h2><p>Running costs are shared equally, and each member pays for its own infrastructure. A yearly budget is agreed in advance.</p><h2>Disputes</h2><p>Disagreements go first to the members' representatives, then to mediation, then to the courts named in the agreement. Technical evidence comes from the shared record.</p><h2>Leaving</h2><p>A member may leave with ninety days' notice. Its keys are revoked, its access is removed, and it receives an export of the data it is entitled to. The remaining members keep the network running.</p>",
  }),
  classifyLab({
    id: "e5-scaling", module: "scalability-and-performance", title: "Which scaling technique?", level: "advanced", minutes: 12, xp: 45, skills: [SK], required: true,
    objective: "Match each scaling need to the technique that fits.", scenario: "There are several ways to increase throughput, each with trade-offs. Match the need to the technique.",
    steps: ["Read each need.", "Choose the technique.", "Press Check my work."],
    categories: [["optimistic", "Optimistic rollup"], ["zk", "Zero-knowledge rollup"], ["channel", "State channel"], ["sidechain", "Sidechain"], ["batch", "Batching or anchoring"]],
    items: [["Execute transactions off the main chain and assume they are correct unless challenged during a dispute window", "optimistic", "Fraud proofs."], ["Prove with mathematics that a batch of transactions was computed correctly", "zk", "Validity proofs."], ["Two parties exchange many payments privately and settle only the final balance on-chain", "channel", "Only open and close touch the chain."], ["A separate chain with its own validators, linked to the main chain by a bridge", "sidechain", "Its security is its own."], ["A company publishes only one root hash per day for millions of records", "batch", "Anchoring."], ["Withdrawals must wait for a challenge period", "optimistic", "Time for fraud proofs."], ["Heavy computation to produce proofs, but fast finality of withdrawals", "zk", "Proofs are verified immediately."], ["Security depends on the sidechain's own validators", "sidechain", "A different trust model."]],
  }),
  sheetLab({
    id: "e6-throughput", module: "scalability-and-performance", title: "Estimate the throughput gain", level: "advanced", minutes: 14, xp: 50, skills: [SK], required: false,
    objective: "Estimate how many simple transfers fit on the main chain and with a rollup that publishes compressed data.",
    scenario: "A block has 30,000,000 gas and arrives every 12 seconds. A plain transfer costs 21,000 gas. A rollup transaction costs about 1,600 gas of published data. (A teaching model.)",
    steps: ["In B7 work out how many plain transfers fit in a block, rounded down.", "In B8 work out the transfers per second on the main chain.", "In B9 work out the rollup transactions per second: the number that fit in a block (rounded down) over the block time.", "In B10 work out the improvement ratio: B9 over B8.", "In B11 show Large improvement if the ratio is above 10, otherwise Modest improvement."],
    cells: { A1: "Input", B1: "Value", A2: "Block gas limit", B2: "30000000", A3: "Gas per plain transfer", B3: "21000", A4: "Gas per rollup transaction", B4: "1600", A5: "Seconds per block", B5: "12", A7: "Transfers per block", A8: "Transfers per second", A9: "Rollup transactions per second", A10: "Improvement ratio", A11: "Verdict" }, view: { cols: 2, rows: 13 },
    checks: [
      ck("b7", "B7 is the transfers per block", "=INT(B2/B3)", "Divide and round down.", S.formula("B7", { fns: ["INT"], equals: 1428 })),
      ck("b8", "B8 is the transfers per second", "=B7/B5", "Per block over block time.", S.formula("B8", { equals: 119 })),
      ck("b9", "B9 is the rollup rate", "=INT(B2/B4)/B5", "Fit in a block, then per second.", S.formula("B9", { fns: ["INT"], equals: 1562.5 })),
      ck("b10", "B10 is the ratio", "=B9/B8", "Rollup over main chain.", S.formula("B10", { equals: 1562.5 / 119 })),
      ck("b11", "B11 is the verdict", "=IF(B10>10,\"Large improvement\",\"Modest improvement\")", "Compare with 10.", S.formula("B11", { fns: ["IF"], equals: "Large improvement" })),
    ],
    solution: { cells: { B7: "=INT(B2/B3)", B8: "=B7/B5", B9: "=INT(B2/B4)/B5", B10: "=B9/B8", B11: "=IF(B10>10,\"Large improvement\",\"Modest improvement\")" } },
  }),
  classifyLab({
    id: "e7-bridge-risks", module: "interoperability", title: "Bridge risk or sound design?", level: "advanced", minutes: 12, xp: 45, skills: [SK], required: true,
    objective: "Judge cross-chain designs by the trust they assume.", scenario: "Cross-chain bridges have lost more money than almost any other kind of system. Judge each design.",
    steps: ["Read each design.", "Choose the verdict.", "Press Check my work."],
    categories: [["sound", "Sound practice"], ["risky", "High risk"], ["context", "Depends on context"]],
    items: [["Funds on a bridge are controlled by a small set of operators with one key each", "risky", "A few keys guard a huge pool."], ["An atomic swap using hashed time-locks so neither party can cheat", "sound", "Trust-minimised by design."], ["A bridge that locks assets on one chain and mints wrapped copies on another", "context", "Safe only if the lock is secure and verification is strong."], ["No limits on how much can pass through the bridge in a day", "risky", "A single flaw can drain everything."], ["Rate limits, monitoring and a pause on the bridge", "sound", "Limits the damage."], ["Verification by a light client that checks the other chain's consensus", "sound", "Strong trust assumptions."], ["Using one data provider with no fallback to confirm cross-chain messages", "risky", "A single point of failure."], ["Keeping the bridge contract upgradeable by one developer key", "risky", "Whoever holds the key controls everything."]],
  }),
  sheetLab({
    id: "e8-htlc-timing", module: "interoperability", title: "Set safe timelocks for an atomic swap", level: "advanced", minutes: 12, xp: 45, skills: [SK], required: false,
    objective: "Check that the timelocks in a two-chain atomic swap leave a safe margin.",
    scenario: "Alice locks funds on chain A for 48 hours. Bob locks funds on chain B for 24 hours against the same secret. Alice reveals the secret on chain B first, so Bob needs time to use it on chain A. (A teaching model.)",
    steps: ["In B7 work out the margin between the two timelocks in hours.", "In B8 show Safe margin if the margin is at least the required margin in B4, otherwise Too tight.", "In B9 work out the spare time beyond the required margin.", "In B10 show the worst-case lock-up for Alice in hours.", "In B11 convert that lock-up to days."],
    cells: { A1: "Input", B1: "Value", A2: "Alice's timelock on chain A (hours)", B2: "48", A3: "Bob's timelock on chain B (hours)", B3: "24", A4: "Margin Bob needs (hours)", B4: "12", A7: "Margin between locks (hours)", A8: "Verdict", A9: "Spare time (hours)", A10: "Alice's worst-case lock-up (hours)", A11: "Alice's worst-case lock-up (days)" }, view: { cols: 2, rows: 13 },
    checks: [
      ck("b7", "B7 is the margin", "=B2-B3", "The longer lock minus the shorter.", S.formula("B7", { equals: 24 })),
      ck("b8", "B8 is the verdict", "=IF(B7>=B4,\"Safe margin\",\"Too tight\")", "Compare margin with the requirement.", S.formula("B8", { fns: ["IF"], equals: "Safe margin" })),
      ck("b9", "B9 is the spare time", "=B7-B4", "Margin minus the requirement.", S.formula("B9", { equals: 12 })),
      ck("b10", "B10 is Alice's lock-up", "=B2", "The long lock is her worst case.", S.formula("B10", { equals: 48 })),
      ck("b11", "B11 is in days", "=B10/24", "Hours over 24.", S.formula("B11", { equals: 2 })),
    ],
    solution: { cells: { B7: "=B2-B3", B8: "=IF(B7>=B4,\"Safe margin\",\"Too tight\")", B9: "=B7-B4", B10: "=B2", B11: "=B10/24" } },
  }),
  classifyLab({
    id: "e9-privacy", module: "privacy-governance-and-compliance", title: "Privacy and compliance decisions", level: "advanced", minutes: 14, xp: 50, skills: [SK], required: true,
    objective: "Choose compliant ways to handle personal and confidential data in a ledger design.", scenario: "Data-protection laws give people rights, such as correction and erasure, that an immutable ledger can conflict with. Judge each design.",
    steps: ["Read each design.", "Choose the verdict.", "Press Check my work."],
    categories: [["good", "Good practice"], ["bad", "Likely to breach rules"], ["care", "Needs careful legal review"]],
    items: [["Store personal data in a protected database and put only a hash on the ledger", "good", "Erasure is possible off-chain."], ["Write names and national identity numbers directly onto a shared ledger", "bad", "Permanent and widely visible."], ["Encrypt personal data and keep it on-chain, relying on deleting the key to 'erase' it", "care", "Legal views differ; take advice."], ["Record only consent and purpose hashes, with the data held by the data owner", "good", "Data minimisation."], ["Share business-confidential prices on a channel visible to all consortium members", "bad", "Visibility to competitors."], ["Use private channels so that only the parties to a deal see its terms", "good", "Need-to-know."], ["Keep an audit trail of who accessed which record", "good", "Accountability."], ["Move data across countries without checking transfer rules", "bad", "Cross-border rules apply."]],
  }),
  wordLab({
    id: "e10-dpia", module: "privacy-governance-and-compliance", title: "Write a data-protection note", level: "advanced", minutes: 18, xp: 65, skills: [SK], required: false,
    objective: "Document what personal data a design touches and how the risks are reduced.",
    scenario: "Your shipment network records the names of drivers who handle deliveries. Write a data-protection note for the architecture board.",
    steps: ["Add Heading 2 sections: Data involved, Where it is stored, Rights of individuals, Risks and controls.", "Under Risks and controls write a bulleted list of at least three controls.", "State that names are not written to the shared ledger.", "Mention erasure or correction.", "Keep it between 120 and 270 words."],
    checks: [
      ck("heads", "Four sections", "Use Heading 2.", "A clear note.", W.heading(4, 2)),
      ck("order", "In order", "Data involved, Where it is stored, Rights of individuals, Risks and controls.", "From data to controls.", W.order(["Data involved", "Where it is stored", "Rights of individuals", "Risks and controls"])),
      ck("ctrl", "Three controls", "Use the bullet button.", "List the controls.", W.list(3, "ul")),
      ck("names", "States names are not on the ledger", "Say names are not written to the ledger.", "Data minimisation.", W.pattern("not (written|stored|recorded|put)[\\s\\S]*ledger|ledger[\\s\\S]*(does not|never)[\\s\\S]*(name|personal)|only a (hash|pseudonym|identifier)", "that names are not written to the ledger")),
      ck("erase", "Mentions erasure or correction", "Mention erasure, deletion or correction.", "Individual rights.", W.pattern("erasure|erase|delet|correct", "erasure or correction")),
      ck("len", "Between 120 and 270 words", "Concise.", "A usable note.", W.words(120, 270)),
    ],
    solution: "<h2>Data involved</h2><p>The network records which driver handled a shipment so that disputes can be resolved. Driver names, licence numbers and phone numbers are personal data.</p><h2>Where it is stored</h2><p>Names are not written to the shared ledger. Each carrier keeps its drivers' personal data in its own protected database. The ledger holds only a pseudonymous driver identifier and a hash of the delivery record.</p><h2>Rights of individuals</h2><p>A driver can ask the carrier to correct or delete their personal data. Because the ledger holds no names, the carrier can honour erasure by deleting the database entry and the link between the identifier and the person, while the ledger entries remain as anonymous operational records.</p><h2>Risks and controls</h2><ul><li>Linking identifiers back to people is possible if the carrier's database leaks, so the database is encrypted and access is logged.</li><li>Other members might see more than they need, so private channels share details only with the parties involved.</li><li>Records might be kept longer than necessary, so a retention period is set and personal data is deleted when it ends.</li></ul>",
  }),
  wordLab({
    id: "e11-adr", module: "architecture-decisions", title: "Write an architecture decision record", level: "advanced", minutes: 20, xp: 70, skills: [SK], required: true,
    objective: "Record a decision with its context, options, reasons and consequences so that future teams can understand and revisit it.",
    scenario: "Your consortium must decide how to handle large documents such as bills of lading. Options: store them on the ledger, store them in a shared file system with hashes on the ledger, or each party keeps its own copy with hashes on the ledger. Write the record.",
    steps: ["Add a Heading 1 'ADR: where to store shipping documents'.", "Add Heading 2 sections: Context, Options considered, Decision, Consequences, Review.", "Under Options considered write a numbered list of exactly the three options or more.", "Under Consequences list at least two good and two bad outcomes in bullets.", "Keep it between 150 and 330 words."],
    checks: [
      ck("title", "A title", "Use Heading 1.", "Name the record.", W.heading(1, 1)),
      ck("secs", "Five sections", "Use Heading 2.", "The ADR format.", W.heading(5, 2)),
      ck("order", "In order", "Context, Options considered, Decision, Consequences, Review.", "The standard flow.", W.order(["Context", "Options considered", "Decision", "Consequences", "Review"])),
      ck("opts", "Three options", "Use the numbered list button.", "Compare real alternatives.", W.list(3, "ol")),
      ck("cons", "Four consequences", "Use the bullet button.", "Good and bad.", W.list(4, "ul")),
      ck("hash", "Mentions hashes", "Mention hash or hashes.", "Fits the problem.", W.pattern("hash", "hashes")),
      ck("review", "Names a review trigger", "Say when the decision will be reviewed.", "Decisions age.", W.pattern("review[\\s\\S]*(months|year|if|when)|(months|year)[\\s\\S]*review", "a review trigger")),
      ck("len", "Between 150 and 330 words", "Concise.", "Short enough to be read.", W.words(150, 330)),
    ],
    solution: "<h1>ADR: where to store shipping documents</h1><h2>Context</h2><p>Carriers, customs and ports exchange scanned bills of lading and certificates of several megabytes each. Documents contain commercial secrets and some personal data, and they must be checkable for tampering years later.</p><h2>Options considered</h2><ol><li>Store the documents themselves on the ledger.</li><li>Store them in one shared file system and put their hashes on the ledger.</li><li>Let each party keep its own copy and put only the hashes and access rules on the ledger.</li></ol><h2>Decision</h2><p>We choose option 3. Documents stay with the parties who are entitled to them, and the ledger keeps a hash, the owner and the sharing permissions for each document.</p><h2>Consequences</h2><ul><li>Good: large files never burden the ledger, and confidential content is not visible to every member.</li><li>Good: any change to a document is detectable because its hash would differ.</li><li>Bad: each party must keep its copies safe and available, and a lost copy cannot be restored from the ledger.</li><li>Bad: sharing a document with a new party needs a request and a check against the access rules, which adds a step.</li></ul><h2>Review</h2><p>We will review this decision after twelve months, or if a new member needs automatic access to all documents, or if storage costs change significantly.</p>",
  }),
  sheetLab({
    id: "e12-risk-register", module: "architecture-decisions", title: "Score and rank project risks", level: "advanced", minutes: 14, xp: 50, skills: [SK], required: false,
    objective: "Rank project risks by likelihood times impact and count the serious ones.",
    scenario: "A blockchain programme has five risks. Score each from 1 (low) to 5 (high) for likelihood and impact.",
    steps: ["In D2 work out the score: likelihood times impact. Fill down to D6.", "In E2 show High if the score is 15 or more, Medium if it is 8 or more, otherwise Low. Fill down to E6.", "In B8 count the High risks.", "In B9 find the highest score.", "In B10 work out the average score."],
    cells: { A1: "Risk", B1: "Likelihood", C1: "Impact", D1: "Score", E1: "Rating", A2: "A member leaves the consortium", B2: "3", C2: "4", A3: "Key management failure", B3: "2", C3: "5", A4: "Regulator rejects the design", B4: "2", C4: "5", A5: "Performance too low", B5: "4", C5: "2", A6: "No agreement on governance", B6: "4", C6: "5", A8: "Number of High risks", A9: "Highest score", A10: "Average score" }, view: { cols: 5, rows: 12 },
    checks: [
      ck("d2", "D2 is the score", "=B2*C2", "Likelihood times impact.", S.formula("D2", { equals: 12 })),
      ck("d6", "D6 is the score", "=B6*C6", "Fill down.", S.formula("D6", { equals: 20 })),
      ck("e2", "E2 is the rating", "=IF(D2>=15,\"High\",IF(D2>=8,\"Medium\",\"Low\"))", "Nest two IFs.", S.formula("E2", { fns: ["IF"], equals: "Medium" })),
      ck("e6", "E6 is the rating", "=IF(D6>=15,\"High\",IF(D6>=8,\"Medium\",\"Low\"))", "Fill down.", S.formula("E6", { fns: ["IF"], equals: "High" })),
      ck("b8", "B8 counts the High risks", "=COUNTIF(E2:E6,\"High\")", "COUNTIF over the rating column.", S.formula("B8", { fns: ["COUNTIF"], equals: 1 })),
      ck("b9", "B9 is the highest score", "=MAX(D2:D6)", "Largest score.", S.formula("B9", { fns: ["MAX"], equals: 20 })),
      ck("b10", "B10 is the average score", "=AVERAGE(D2:D6)", "Average of the scores.", S.formula("B10", { fns: ["AVERAGE"], equals: (12 + 10 + 10 + 8 + 20) / 5 })),
    ],
    solution: { cells: Object.assign({ B8: "=COUNTIF(E2:E6,\"High\")", B9: "=MAX(D2:D6)", B10: "=AVERAGE(D2:D6)" }, ...[2, 3, 4, 5, 6].map((r) => ({ [`D${r}`]: `=B${r}*C${r}`, [`E${r}`]: `=IF(D${r}>=15,"High",IF(D${r}>=8,"Medium","Low"))` }))) },
  }),
  wordLab({
    id: "cap-architecture", module: "capstone", title: "Final project: write an enterprise architecture and decision document", level: "challenge", minutes: 45, xp: 180, skills: [SK], required: true,
    objective: "Produce a professional architecture and decision document for a real enterprise use case, including an honest test of whether blockchain is the right tool.",
    scenario: "Choose a real multi-party use case such as supply-chain tracking, trade finance, certificate verification or cross-institution records, and write the document an architecture board would review.",
    steps: ["Add a Heading 1 with the use case and 'architecture and decision document'.", "Add Heading 2 sections: Business problem, Is blockchain the right tool, Architecture, Scalability, Privacy and compliance, Governance, Risks and cost, Recommendation.", "Under Is blockchain the right tool compare it with at least one alternative.", "Under Architecture list at least four components in bullets.", "Under Risks and cost list at least four risks in bullets.", "Give a clear recommendation, which may be not to use blockchain.", "Keep it between 380 and 760 words."],
    checks: [
      ck("t", "A title", "Use Heading 1.", "Name the use case.", W.heading(1, 1)),
      ck("secs", "Eight sections", "Use Heading 2.", "A complete document.", W.heading(8, 2)),
      ck("order", "In order", "Business problem, Is blockchain the right tool, Architecture, Scalability, Privacy and compliance, Governance, Risks and cost, Recommendation.", "A logical flow.", W.order(["Business problem", "Is blockchain the right tool", "Architecture", "Scalability", "Privacy and compliance", "Governance", "Risks and cost", "Recommendation"])),
      ck("alt", "Compares with an alternative", "Mention a database or another alternative.", "An honest test.", W.pattern("database|alternative|shared service|central", "an alternative")),
      ck("comp", "Four components", "Use the bullet button.", "Name the parts.", W.list(4, "ul")),
      ck("priv", "Mentions personal data or hashes", "Mention personal data, hashes or privacy.", "Responsible design.", W.pattern("personal data|hash|privacy", "privacy")),
      ck("gov", "Mentions governance of members", "Mention members, consortium or governance.", "Who decides.", W.pattern("member|consortium|governance", "governance")),
      ck("rec", "Gives a recommendation", "Say recommend, proceed, pilot or do not.", "A clear decision.", W.pattern("recommend|proceed|pilot|do not|should not|not use", "a recommendation")),
      ck("len", "Between 380 and 760 words", "Two to three pages.", "Readable by a board.", W.words(380, 760)),
    ],
    solution: "<h1>Cross-border shipment tracking: architecture and decision document</h1><h2>Business problem</h2><p>Four organisations (a shipper, a carrier, a port and customs) each keep their own record of every container and reconcile by e-mail. Disputes about who changed a status and when cost about 900,000 rupees a year and delay clearance by days.</p><h2>Is blockchain the right tool</h2><p>The parties do not fully trust each other and none wants another to run the shared record. A shared database run by one party is the main alternative: it is cheaper and faster, but the other three would have to trust its operator and could not prove that records were not changed. Anchoring hashes of a central database is a second alternative that proves integrity but not who signed each change. A consortium ledger gives signed, shared and tamper-evident records without a single operator, at higher cost and with governance effort. For this case, with four equal parties and recurring disputes, a consortium ledger is justified, but only because of the lack of a trusted operator.</p><h2>Architecture</h2><ul><li>A permissioned consortium network with one peer per organisation and a rule that two organisations must endorse each change.</li><li>Chaincode that models the shipment states and allows only customs to mark a shipment as cleared.</li><li>Off-chain document storage in each party's own systems, with only hashes and access rules on the ledger.</li><li>An integration layer with application programming interfaces for each party's existing systems, and an event feed for notifications.</li></ul><h2>Scalability</h2><p>We expect about 50 transactions per minute, far below what a permissioned network can handle, so throughput is not a concern. Document batches are anchored as Merkle roots to keep the ledger small.</p><h2>Privacy and compliance</h2><p>No personal data is written to the ledger; driver identities are pseudonymous identifiers, and names stay in each carrier's database so that erasure requests can be honoured. Commercial terms are shared only through private channels between the parties involved, and cross-border transfer rules are checked by legal counsel.</p><h2>Governance</h2><p>A consortium charter defines that changes need approval by three of four members, costs are shared equally, disputes go to mediation first, and a leaving member's keys are revoked with an export of its data. The charter is signed before the network starts.</p><h2>Risks and cost</h2><ul><li>A member leaves or fails to maintain its peer, which weakens the network, so the charter requires notice and shared hosting as a fallback.</li><li>Key management failure at one organisation, mitigated by hardware security modules and tested recovery procedures.</li><li>No agreement on governance delaying the project, mitigated by agreeing the charter first.</li><li>Cost overruns: the three-year cost is estimated at 3.9 million rupees against 2 million for a shared database, so the saving rests on avoiding disputes.</li></ul><h2>Recommendation</h2><p>We recommend a twelve-month pilot with the four organisations on a limited trade lane, with explicit success measures: dispute cost, clearance time and operating cost. If the measures are not met, we will not extend the network and will fall back to the shared database option.</p>",
  }),
];

const M1 = module_({
  slug: "when-blockchain-fits", title: "When blockchain fits the enterprise", hours: 2.5, level: "Foundations",
  summary: "An honest decision test, the alternatives, stakeholders and total cost of ownership.",
  outcome: "You can test whether blockchain suits a use case, compare it with alternatives and estimate costs honestly.",
  intro: "Many enterprise blockchain pilots ended without reaching production, and a common reason was that a shared database would have done the job. Senior architects are valued for saying 'no' when it is the right answer. This module teaches the decision test and the cost thinking behind it.",
  topics: [
    topic({
      title: "An honest decision test", slug: "decision-test",
      blocks: [
        flow("A decision path", ["Do multiple parties need to write to shared data?", "Do they distrust a single operator or each other?", "Is there no trusted party who could run a shared database?", "Do records need to be tamper-evident over many years?", "Can you accept the cost, speed and complexity?", "If all answers are yes, consider a ledger; otherwise use a database or a shared service"]),
        table("The classic test, with comments", ["Question", "If the answer is no"], [["Do you need shared state across organisations?", "A normal database owned by one organisation will do"], ["Do the parties have conflicting interests?", "Standard integration may be enough"], ["Is there no trusted central party?", "Let the trusted party operate the database"], ["Do you need a verifiable, ordered history?", "Logs and backups may be enough"], ["Do you really need to avoid reconciliation?", "Better data exchange standards may solve it"]]),
        p("The test is deliberately demanding. The cases that pass are real, but fewer than the enthusiasm of the last decade suggested: supply chains with competing parties, consortium settlement, shared registries without a central owner. Many problems blamed on 'lack of blockchain' were really lack of data standards, incentives or governance."),
        miniQuiz("fit-mini", [["Which signal most strongly suggests a ledger may help?", ["A single company wants faster reports", "Several parties who do not trust one another need a shared, tamper-evident record with no neutral operator", "The marketing team likes the idea", "The data is private to one team"], 1, "Distrust among parties with no neutral operator."]]),
      ],
      points: ["Use a structured test: shared writes, distrust, no neutral operator, tamper evidence.", "Fewer problems need a ledger than hype suggested."],
      check: [["If one trusted party can run the database, you should:", ["Use a database", "Always use blockchain", "Build a token", "Avoid technology"], 0, "Simpler and cheaper."]],
    }),
    topic({
      title: "Alternatives to consider first", slug: "alternatives",
      blocks: [
        table("Options on the table", ["Option", "Strength", "Weakness"], [["Shared database run by one party", "Cheap, fast, simple", "Others must trust the operator"], ["Standard APIs and data formats", "Fixes reconciliation without new infrastructure", "No tamper evidence across parties"], ["Event streaming platform", "High throughput and ordered logs", "Still run by an operator"], ["Notarisation: hashes anchored on a public chain", "Cheap proof that a record existed, without revealing it", "Does not manage shared state"], ["Permissioned consortium ledger", "Shared state, signed changes, no single operator", "Cost, complexity and governance"], ["Public blockchain", "Open verification and censorship resistance", "Public data, variable cost and limited privacy"]]),
        list("Questions to ask each stakeholder", ["What exactly goes wrong today, and what does it cost?", "Who would run the system, and who would worry about that?", "What data may never be shared, and with whom?", "Which laws and standards apply?", "What would make you leave the network?", "How will we know the pilot succeeded?"], true),
        miniQuiz("alt-mini", [["Why look at standard APIs before a ledger?", ["APIs are fashionable", "Many reconciliation problems are caused by inconsistent data formats, which a ledger does not fix", "Ledgers cannot use APIs", "APIs are always cheaper"], 1, "Fix the real cause."]]),
      ],
      points: ["Compare with databases, APIs, streams and notarisation before choosing a ledger.", "Ask each stakeholder what exactly goes wrong today."],
      check: [["Notarisation proves:", ["That a record existed at a time", "That the record is true", "Who owns it", "That it is private"], 0, "Existence and integrity only."]],
    }),
    topic({
      title: "Cost, value and honest business cases", slug: "business-case",
      blocks: [
        explorer({ id: "ent-tco", title: "Total cost comparison", intro: "Change setup, running costs and the yearly reconciliation cost avoided to compare a consortium ledger with a shared database. A teaching model with made-up figures (rupees).", inputs: [{ id: "setup", label: "Extra setup for the ledger", min: 0, max: 10000000, step: 100000, value: 2200000 }, { id: "run", label: "Extra yearly running cost for the ledger", min: 0, max: 5000000, step: 100000, value: 800000 }, { id: "save", label: "Yearly reconciliation cost avoided", min: 0, max: 5000000, step: 100000, value: 900000 }, { id: "yrs", label: "Years", min: 1, max: 10, step: 1, value: 3 }], outputs: [{ label: "Net extra cost of the ledger over the period", expr: "setup + (run - save) * yrs", unit: "rs" }] }),
        table("Costs that business cases forget", ["Cost", "Why it matters"], [["Governance and legal set-up", "Agreeing rules among organisations takes months"], ["Integration with existing systems", "Often larger than the ledger itself"], ["Operations skills and on-call support", "Each member must run infrastructure"], ["Key management and security", "Hardware, procedures and audits"], ["Change management", "People must use the new process"], ["Exit and wind-down", "Every network needs a plan for the end"]]),
        mistakes(["Counting only the benefits of the technology and ignoring governance cost.", "Running a pilot with no success measures.", "Treating a successful demo as proof of a viable network."]),
        miniQuiz("case-mini", [["Why define success measures before a pilot?", ["For marketing", "Without them nobody can decide honestly whether to continue", "Auditors require it", "They lower cost"], 1, "Decide with evidence."]]),
      ],
      points: ["Count governance, integration, operations and exit costs.", "Define success measures before a pilot."],
      check: [["A pilot without success measures produces:", ["Opinions, not evidence", "Savings", "Certainty", "Standards"], 0, "Hard to decide."]],
    }),
  ],
  terms: [["Permissioned network", "A network where members are known and approved"], ["Consortium", "A group of organisations sharing a network"], ["Notarisation", "Anchoring a hash to prove existence"], ["Reconciliation", "Making two records agree"], ["TCO", "Total cost of ownership"], ["Pilot", "A limited trial with success measures"]],
  practical: { title: "Practical: run the test on three ideas", intro: "On paper.", steps: ["Pick three enterprise ideas you have heard about.", "Apply the decision path to each.", "List two alternatives for each.", "Write your verdicts and reasons."] },
  quiz: [
    ["A ledger may help when:", ["Parties distrust each other and no neutral operator exists", "One company wants speed", "Marketing wants buzz", "Data is private to one team"], 0, "The decisive condition."],
    ["A trusted central operator suggests:", ["A database", "A token", "A bridge", "A fork"], 0, "Simpler and cheaper."],
    ["Notarisation proves:", ["Existence and integrity", "Truth", "Ownership", "Privacy"], 0, "Notarisation proves existence and integrity, not more."],
    ["Total cost includes:", ["Governance, integration and operations", "Only software", "Only gas", "Only licences"], 0, "Often larger than the technology."],
    ["A pilot needs:", ["Success measures", "Only a demo", "A logo", "A press release"], 0, "Decide on evidence."],
    ["Many reconciliation issues come from:", ["Inconsistent data standards", "Missing tokens", "Slow blocks", "Cold weather"], 0, "Fix the cause."],
    ["Good architects:", ["Say no when it is right", "Always say yes", "Avoid analysis", "Hide costs"], 0, "Honest advice."],
  ],
});

const M2 = module_({
  slug: "permissioned-and-consortium-networks", title: "Permissioned and consortium networks", hours: 3, level: "Core skills",
  summary: "Known members, endorsement, consensus choices, chaincode and on-chain approvals among organisations.",
  outcome: "You can describe how permissioned networks work, read chaincode and design multi-organisation approvals.",
  intro: "When the parties are known companies, the design choices change. You do not need anonymous strangers to validate transactions; you need the right organisations to endorse them. This module explains the platforms, the consensus options and the way approvals are modelled.",
  topics: [
    topic({
      title: "How permissioned platforms work", slug: "how-they-work",
      blocks: [
        table("Typical platforms (examples, not recommendations)", ["Platform", "Style", "Notable ideas"], [["Hyperledger Fabric", "Modular; chaincode in Go, JavaScript or Java", "Channels for private data; endorsement policies; separate ordering service"], ["Hyperledger Besu", "Ethereum-compatible permissioned or public client", "Solidity smart contracts; QBFT or IBFT consensus; privacy options"], ["Corda", "Peer-to-peer ledgers shared only between parties to a deal", "Contracts in JVM languages; notary services"]]),
        flow("A Fabric-style transaction", ["Client sends a proposal to endorsing peers of the required organisations", "Each peer runs the chaincode and signs the result", "The client sends the endorsed transaction to the ordering service", "Orderers put transactions into blocks in a fixed order", "Peers validate the endorsements and commit the block", "The ledger updates and an event is emitted"]),
        def("Endorsement policy", "A rule stating which organisations must sign a transaction for it to be valid, for example 'at least two of the four members' or 'customs must always sign'."),
        miniQuiz("how-mini", [["What does an endorsement policy decide?", ["The price of gas", "Which organisations must sign a transaction for it to be valid", "The block size", "The programming language"], 1, "Business rules about agreement."]]),
      ],
      points: ["Permissioned platforms use known members, endorsement and an ordering service.", "Different platforms make different trade-offs."],
      check: [["Channels in Fabric let:", ["A subset of members share private data", "Anyone read everything", "Gas fall", "Blocks grow"], 0, "Need-to-know separation."]],
    }),
    topic({
      title: "Chaincode: business rules on a shared ledger", slug: "chaincode",
      blocks: [
        code("javascript", fabricChaincode, "shipment-chaincode.js"),
        table("What the chaincode shows", ["Feature", "Reason"], [["Existence check before creating", "Prevents overwriting a record"], ["Allowed status list", "Rejects invalid states"], ["Organisation identity from the transaction context", "Records and checks who acted"], ["Only customs may clear a shipment", "A role rule in the application"], ["History array with identity and time", "A tamper-evident audit trail"], ["Deterministic code only", "Every endorsing peer must compute the same result"]]),
        warn("Chaincode must be deterministic. Using random numbers, local time or external calls can make endorsing peers disagree and reject the transaction."),
        miniQuiz("code-mini", [["Why must chaincode be deterministic?", ["It is faster", "Different peers run it and must reach the same result", "Judges require it", "It uses less memory"], 1, "Agreement depends on identical results."]]),
      ],
      points: ["Chaincode implements business rules and uses the caller's organisation identity.", "It must be deterministic."],
      check: [["The organisation making a call is available from:", ["The transaction context", "A global variable", "The browser", "A comment"], 0, "Client identity."]],
    }),
    topic({
      title: "Consensus and approvals among organisations", slug: "consensus-approvals",
      blocks: [
        table("Consensus in permissioned settings", ["Approach", "Idea", "Tolerates"], [["Raft (crash fault tolerant)", "A leader orders transactions; followers replicate", "Machines that stop, but not machines that lie"], ["IBFT / QBFT (Byzantine fault tolerant)", "Validators vote in rounds and need two thirds agreement", "Up to a third of validators misbehaving"], ["Proof of authority", "Named validators take turns", "Depends on honest authorities"]]),
        p("The right choice depends on trust. Members of a consortium who trust each other not to lie, but fear crashes, may choose Raft. Members who worry that one participant might act maliciously need a Byzantine fault tolerant algorithm, which tolerates fewer failures per validator but costs more messages."),
        code("solidity", consortium, "ConsortiumApprovals.sol"),
        table("What the approval contract adds", ["Feature", "Reason"], [["Quorum of different organisations", "No single organisation can decide alone"], ["One approval per member per proposal", "No double counting"], ["Deadline", "Proposals do not stay open forever"], ["Hash of the proposal text", "The decision is tied to an exact document"], ["Events", "Monitoring and audit"]]),
        miniQuiz("cons-mini", [["Which consensus fits members who fear a malicious participant?", ["Raft", "A Byzantine fault tolerant algorithm such as QBFT", "A random draw", "A single leader forever"], 1, "Raft assumes participants do not lie."]]),
      ],
      points: ["Choose Raft for crashes and BFT algorithms for possible malice.", "Record multi-organisation approvals with quorums and deadlines."],
      check: [["A quorum of different organisations prevents:", ["One member deciding alone", "All fees", "All delays", "All disputes"], 0, "Shared control."]],
    }),
  ],
  terms: [["Endorsement", "A signature by an organisation that approves a transaction"], ["Chaincode", "Smart contract code on Fabric"], ["Channel", "A private sub-ledger among some members"], ["Ordering service", "The component that sequences transactions"], ["Raft", "A crash-fault-tolerant consensus algorithm"], ["QBFT", "A Byzantine-fault-tolerant consensus algorithm"]],
  practical: { title: "Practical: model endorsement", intro: "On paper.", steps: ["List four organisations and their roles.", "Write an endorsement policy for status changes.", "Write one rule only one organisation may perform.", "Choose a consensus algorithm and justify it."] },
  quiz: [
    ["Permissioned networks have:", ["Known members", "Anonymous members only", "No rules", "No ledger"], 0, "Identity matters."],
    ["An endorsement policy states:", ["Who must sign", "The gas price", "The block size", "The font"], 0, "Business agreement."],
    ["Chaincode must be:", ["Deterministic", "Random", "Secret", "Slow"], 0, "Same result on every peer."],
    ["Raft tolerates:", ["Crashes", "Liars", "Nothing", "Everything"], 0, "Crash faults."],
    ["QBFT tolerates:", ["Up to a third misbehaving", "All misbehaving", "None", "Only crashes"], 0, "Byzantine faults."],
    ["Channels provide:", ["Private data for some members", "Faster gas", "Public data", "Free fees"], 0, "Need to know."],
    ["Consortium approvals use:", ["A quorum of organisations", "One key", "A coin toss", "A browser"], 0, "Shared decisions."],
  ],
});

const M3 = module_({
  slug: "scalability-and-performance", title: "Scalability and performance", hours: 2.5, level: "Core skills",
  summary: "Throughput limits, rollups, channels, sidechains and anchoring, with simple numbers to compare them.",
  outcome: "You can explain the scaling techniques, estimate throughput and choose an approach for a given need.",
  intro: "Scalability is a trade between speed, cost, security and decentralisation. Enterprise needs are usually modest compared with public networks, which changes the answer. This module explains the techniques and gives you the arithmetic to judge them.",
  topics: [
    topic({
      title: "Why chains are slow, and what you can do", slug: "limits-and-options",
      blocks: [
        p("Every node in a public chain processes every transaction, so throughput is limited by what an ordinary computer can verify. Block size or gas limits, block time and the time to spread data all matter. Increasing them helps, but makes it harder for ordinary participants to run nodes, which weakens decentralisation. This is the heart of the scalability trade-off."),
        table("Options and what they trade", ["Option", "How it scales", "What you give up"], [["Larger blocks or faster blocks", "More data per second on the base chain", "Fewer people can run nodes"], ["Rollups", "Execute off-chain, post compressed data and proofs on the base chain", "More complex systems, withdrawal delays or proving cost"], ["State channels", "Parties exchange signed updates off-chain, settle only at the end", "Only for a fixed set of participants"], ["Sidechains", "A separate chain with its own validators", "Weaker security than the base chain"], ["Permissioned networks", "Fewer, known validators agree quickly", "Less decentralisation by design"], ["Batching and anchoring", "Publish only a hash of many records", "Records live elsewhere"]]),
        miniQuiz("limits-mini", [["Why not simply make blocks huge?", ["It is illegal", "Fewer participants could run nodes, weakening decentralisation", "Blocks cannot grow", "Fees would be zero"], 1, "Scalability is a trade-off."]]),
      ],
      points: ["Throughput is limited by what nodes can verify.", "Every scaling option trades something away."],
      check: [["State channels suit:", ["A fixed group exchanging many updates", "Anonymous crowds", "One-off payments", "Voting"], 0, "Fixed participants."]],
    }),
    topic({
      title: "Rollups explained with numbers", slug: "rollups",
      blocks: [
        flow("How a rollup works", ["Users send transactions to the rollup's sequencer", "The sequencer orders them and executes them off the base chain", "It posts compressed transaction data and a state summary to the base chain", "Optimistic rollups allow a window for anyone to prove fraud", "Zero-knowledge rollups attach a mathematical proof that the execution was correct", "The base chain enforces the result"]),
        table("Optimistic versus zero-knowledge", ["", "Optimistic rollup", "Zero-knowledge rollup"], [["How correctness is ensured", "Assume correct; challenge if fraud is shown", "Prove correct with a validity proof"], ["Withdrawal to the base chain", "Wait for the challenge period", "As soon as the proof is verified"], ["Computation cost", "Lower", "Higher to generate proofs"], ["Maturity of tools", "Longer track record", "Rapidly improving"]]),
        explorer({ id: "ent-roll", title: "Throughput estimator", intro: "Change the block gas limit and per-transaction gas to compare plain transfers on the base chain with compressed rollup data. A teaching model.", inputs: [{ id: "limit", label: "Block gas limit", min: 10000000, max: 100000000, step: 5000000, value: 30000000 }, { id: "plain", label: "Gas per plain transfer", min: 21000, max: 100000, step: 1000, value: 21000 }, { id: "roll", label: "Gas per rollup transaction", min: 500, max: 5000, step: 100, value: 1600 }, { id: "secs", label: "Seconds per block", min: 1, max: 15, step: 1, value: 12 }], outputs: [{ label: "Plain transfers per second", expr: "floor(limit / plain) / secs", unit: "n" }, { label: "Rollup transactions per second", expr: "floor(limit / roll) / secs", unit: "n" }] }),
        miniQuiz("roll-mini", [["What posting does a rollup need on the base chain?", ["Nothing at all", "Compressed transaction data and a state summary or proof", "Private keys", "Full node software"], 1, "That is how the base chain keeps the final say."]]),
      ],
      points: ["Rollups execute off-chain and post compressed data to the base chain.", "Optimistic rollups wait for challenges; zero-knowledge rollups use proofs."],
      check: [["Optimistic rollups rely on:", ["Fraud proofs", "Validity proofs", "Private keys", "Trust in one operator forever"], 0, "A challenge window."]],
    }),
    topic({
      title: "Choosing for enterprise needs", slug: "choosing",
      blocks: [
        table("Typical enterprise numbers", ["Use case", "Rough scale", "Implication"], [["Cross-organisation shipment events", "Tens to thousands of events per minute", "A permissioned network is more than enough"], ["Document anchoring", "Millions of records per day, one root per batch", "Batching makes throughput irrelevant"], ["Consumer micro-payments", "Many tiny transfers", "A rollup or off-chain scheme may be needed"], ["High-frequency trading", "Thousands per second with microsecond latency", "A blockchain is the wrong tool"]]),
        code("javascript", batchScript, "anchor-batch.js"),
        code("solidity", anchor, "BatchAnchor.sol"),
        list("Anchoring rules", ["Hash each record twice or with a type prefix to avoid confusing leaves and inner nodes.", "Keep the records and the proofs in your own system.", "Use a dedicated low-balance key with only the anchorer role.", "Wait for confirmations before telling anyone a batch is anchored.", "Test a proof end to end before you rely on it."], true),
        miniQuiz("choose-mini", [["Why is throughput rarely a problem for anchoring?", ["Chains are infinitely fast", "Only one small root is posted per batch, however many records it covers", "Records are free", "Roots are not hashes"], 1, "One transaction covers millions of records."]]),
      ],
      points: ["Most enterprise use cases need modest throughput.", "Anchoring a Merkle root scales to any number of records."],
      check: [["A Merkle proof shows:", ["A record was part of an anchored batch", "The record is true", "Who owns it", "The price"], 0, "Inclusion only."]],
    }),
  ],
  terms: [["Throughput", "Transactions per second"], ["Rollup", "Off-chain execution with data posted on-chain"], ["Sequencer", "The party ordering rollup transactions"], ["State channel", "Off-chain exchange between fixed parties"], ["Sidechain", "A separate chain with its own security"], ["Anchoring", "Publishing a hash that commits to many records"]],
  practical: { title: "Practical: compute your need", intro: "For a use case you know.", steps: ["Estimate daily events and peak per second.", "Compare with the capacity of a permissioned network.", "Decide if anchoring is enough.", "Write your conclusion in two sentences."] },
  quiz: [
    ["Bigger blocks risk:", ["Fewer people running nodes", "Lower fees", "No change", "More privacy"], 0, "Decentralisation suffers."],
    ["Rollups post:", ["Compressed data and proofs", "Private keys", "Nothing", "Passwords"], 0, "Back to the base chain."],
    ["Zero-knowledge rollups use:", ["Validity proofs", "Fraud proofs", "Trust", "Chance"], 0, "Mathematics."],
    ["Optimistic rollups have:", ["A challenge window", "No delay", "No proofs", "No data"], 0, "Time for fraud proofs."],
    ["State channels need:", ["Fixed participants", "Anonymous crowds", "No signatures", "No chain"], 0, "Opening and closing."],
    ["Anchoring posts:", ["One root for many records", "All records", "Keys", "Fees"], 0, "Scalable proof of existence."],
    ["High-frequency trading is:", ["A poor fit for blockchains", "Ideal", "Required", "Free"], 0, "Latency and speed limits."],
  ],
});

const M4 = module_({
  slug: "interoperability", title: "Interoperability and cross-chain communication", hours: 2.5, level: "Applied skills",
  summary: "Atomic swaps, bridges, messaging and the trust assumptions of each.",
  outcome: "You can explain how chains communicate, build and read an HTLC and judge a bridge design by its trust assumptions.",
  intro: "Real systems rarely live on one chain. Assets, messages and proofs need to cross boundaries, and each crossing is a place where trust assumptions hide. This module explains the main approaches and why bridges have been so heavily attacked.",
  topics: [
    topic({
      title: "Atomic swaps and hashed time-locks", slug: "htlc",
      blocks: [
        code("solidity", htlc, "HashedTimelock.sol"),
        flow("An atomic swap", ["Alice chooses a secret and shares its hash", "Alice locks funds on chain A for Bob against the hash with a long deadline", "Bob locks funds on chain B for Alice against the same hash with a shorter deadline", "Alice claims on chain B by revealing the secret", "The secret is now public, so Bob claims on chain A", "If anyone stops, deadlines let each party take their funds back"]),
        table("Why the deadlines differ", ["Point", "Reason"], [["Bob's lock is shorter than Alice's", "Alice reveals the secret on chain B; Bob must still have time to use it on chain A"], ["A margin between the two", "Absorbs delays and congestion"], ["Refund only after the deadline", "Nobody can take funds back early"], ["The secret is public once revealed", "It can never be reused for another swap"]]),
        miniQuiz("htlc-mini", [["Why is the second lock shorter than the first?", ["To save gas", "The first party reveals the secret on the second chain, and the second party still needs time to claim on the first", "It is random", "It is required by sha256"], 1, "Safe ordering of deadlines."]]),
      ],
      points: ["Hashed time-locks make swaps trust-minimised: claim with the secret or refund after the deadline.", "Deadlines must leave a safe margin."],
      check: [["After a claim, the secret is:", ["Public on that chain", "Private", "Deleted", "Encrypted"], 0, "That lets the other side claim."]],
    }),
    topic({
      title: "Bridges and why they fail", slug: "bridges",
      blocks: [
        table("Kinds of bridge", ["Kind", "How it works", "Trust assumption"], [["Lock and mint", "Lock assets on chain A, mint wrapped copies on chain B", "The locking contract and the party attesting to deposits"], ["Burn and release", "Burn wrapped copies, release the originals", "The same"], ["Liquidity network", "Providers hold funds on both sides and swap", "The providers' honesty and capital"], ["Light-client bridge", "Chain B verifies chain A's consensus directly", "Cryptography and the security of both chains"], ["Messaging layer", "Relayers carry signed messages between chains", "The relayer set or oracle network"]]),
        p("Bridges concentrate enormous value in one place and depend on complex code and small sets of keys. They have been among the most attacked systems in the field. A bridge is only as secure as its weakest link: the contract on either side, the verification, the keys of the attesters or the upgrade authority."),
        list("Defensive design", ["Prefer verification by cryptography over trust in a few operators.", "Limit the value that can pass in a given period.", "Add monitoring and the ability to pause.", "Protect upgrade authority with multi-signature control and a time-lock.", "Use separate audits for each chain's contracts and the off-chain components.", "Plan how users are made whole if something fails."], true),
        miniQuiz("bridge-mini", [["Why are bridges attractive targets?", ["They are slow", "They hold large pools of assets guarded by complex code and a few keys", "They are public", "They have no contracts"], 1, "A big prize behind a narrow door."]]),
      ],
      points: ["Bridges move value across chains but concentrate risk.", "Prefer cryptographic verification, limits, monitoring and strong upgrade control."],
      check: [["Rate limits on a bridge:", ["Reduce the damage of a flaw", "Raise fees", "Hide transfers", "Delay all blocks"], 0, "Cap the loss."]],
    }),
    topic({
      title: "Messaging, standards and enterprise integration", slug: "messaging",
      blocks: [
        table("Integration patterns", ["Pattern", "Use", "Care"], [["Event listeners and webhooks", "Tell internal systems when something happens on-chain", "Confirmations, retries and idempotence"], ["Oracles", "Bring outside data on-chain", "Source quality and manipulation"], ["Anchoring", "Connect private systems to a public chain by hash", "Only proves existence"], ["Cross-chain messaging protocols", "Send instructions between chains", "Trust in relayers and verification"], ["Standard token and identity formats", "Make assets and credentials portable", "Governance of the standard"]]),
        list("Enterprise checklist for interoperability", ["Which systems must exchange data, and in which direction?", "Which standards do the partners already use?", "What happens if the other side is down or compromised?", "Who is liable for cross-system failures?", "How are keys and secrets shared safely?", "What is the exit plan if a connector is retired?"], true),
        explorer({ id: "ent-htlc", title: "Timelock margin", intro: "Change the two timelocks and the margin needed to see whether the swap leaves a safe gap. A teaching tool.", inputs: [{ id: "a", label: "First lock (hours)", min: 6, max: 96, step: 6, value: 48 }, { id: "b", label: "Second lock (hours)", min: 3, max: 72, step: 3, value: 24 }, { id: "m", label: "Margin needed (hours)", min: 1, max: 24, step: 1, value: 12 }], outputs: [{ label: "Margin between locks (hours)", expr: "a - b", unit: "n" }, { label: "Spare margin (hours)", expr: "a - b - m", unit: "n" }] }),
        miniQuiz("msg-mini", [["Why make integration steps idempotent?", ["It is fashionable", "Messages are retried and may arrive more than once", "Chains require it", "To save gas"], 1, "Repeats must be harmless."]]),
      ],
      points: ["Use events, oracles, anchoring and messaging with idempotence.", "Plan for the other side failing and for exit."],
      check: [["Oracle risk comes from:", ["Source quality and manipulation", "Block size", "Gas price", "Colour"], 0, "Garbage in, garbage out."]],
    }),
  ],
  terms: [["Atomic swap", "An exchange that either completes for both or for neither"], ["HTLC", "Hashed time-lock contract"], ["Bridge", "A system moving assets or messages across chains"], ["Wrapped asset", "A token representing an asset on another chain"], ["Relayer", "A party carrying messages between chains"], ["Light client", "A verifier of another chain's consensus"]],
  practical: { title: "Practical: run a swap on paper", intro: "With two imaginary chains.", steps: ["Write the six steps of an atomic swap.", "Choose timelocks with a margin.", "List what happens if Bob disappears.", "List what happens if Alice never reveals the secret."] },
  quiz: [
    ["An HTLC releases funds when:", ["The secret is revealed in time", "A fee is paid", "A password is typed", "A coin is tossed"], 0, "Claim with the secret."],
    ["Refund happens:", ["After the deadline", "Immediately", "Never", "Randomly"], 0, "Funds return only after the deadline, not early."],
    ["Bridges concentrate:", ["Risk", "Privacy", "Speed", "Fees"], 0, "Big pools, few keys."],
    ["Light-client bridges rely on:", ["Cryptographic verification", "A few operators", "Luck", "Passwords"], 0, "Strongest trust assumption."],
    ["Rate limits:", ["Cap the damage of a flaw", "Raise fees", "Hide data", "Slow blocks"], 0, "Defence in depth."],
    ["Upgrade keys on bridges should be:", ["Multi-signature and time-locked", "One developer's", "Public", "Unused"], 0, "Protect the pool."],
    ["Integration steps should be:", ["Idempotent", "Random", "Secret", "Fast only"], 0, "Retries are normal."],
  ],
});

const M5 = module_({
  slug: "privacy-governance-and-compliance", title: "Privacy, governance and compliance", hours: 3, level: "Applied skills",
  summary: "Data minimisation on immutable ledgers, consent, auditability, key management and consortium governance.",
  outcome: "You can design a ledger that respects data protection, record consent, protect keys and set up governance.",
  intro: "The hardest enterprise questions are not technical. They are: who may see this, who decides, what the law requires and what happens when people disagree. This module covers privacy and compliance design, and the human structures that make a consortium work.",
  topics: [
    topic({
      title: "Privacy on a ledger that cannot forget", slug: "privacy",
      blocks: [
        p("Data-protection laws often give people rights to correct and erase data about them. A shared ledger is designed so that history cannot be rewritten. The conflict is real, and the safest resolution is to keep personal data out of the ledger altogether. Store it where it can be corrected and deleted, and put on the ledger only what is needed for shared agreement: pseudonymous identifiers, hashes, permissions and status."),
        table("Data minimisation patterns", ["Pattern", "How it works", "Limit"], [["Hash on-chain, data off-chain", "The ledger holds a fingerprint; the data lives in a protected store", "Hashes of low-entropy data can be guessed; add random salt"], ["Pseudonymous identifiers", "A random identifier links ledger entries to a person in a private table", "Linkage risk if the table leaks"], ["Private channels or private transactions", "Only parties to a deal see its terms", "Still visible to those parties and operators"], ["Encryption with managed keys", "Data on-chain is encrypted", "Law may still treat it as personal data; keys must last as long as the data"], ["Zero-knowledge proofs", "Prove a fact (for example 'over 18') without revealing the data", "Specialised and complex"]]),
        miniQuiz("priv-mini", [["What is the safest way to respect erasure rights on a ledger?", ["Encrypt everything on-chain", "Keep personal data off the ledger and store only hashes or pseudonymous identifiers", "Delete blocks", "Ignore the law"], 1, "Design the conflict away."]]),
        warn("This is not legal advice. Data-protection law differs by country, so involve counsel early."),
      ],
      points: ["Keep personal data off the ledger; store hashes, pseudonyms and permissions.", "Add salt to hashes of guessable data."],
      check: [["Hashing a phone number without salt is risky because:", ["It can be guessed by trying all numbers", "Hashes are slow", "Hashes are long", "It is free"], 0, "Low-entropy inputs."]],
    }),
    topic({
      title: "Consent, audit and identity", slug: "consent-audit",
      blocks: [
        code("solidity", consent, "ConsentRegistry.sol"),
        table("What the registry does", ["Feature", "Why"], [["Hashes of purposes, not text", "The record shows what kind of use without revealing details"], ["Per recipient and purpose", "Consent is specific, not blanket"], ["Expiry", "Consent should not last forever by accident"], ["Revoke by the subject", "People can withdraw"], ["isAllowed is a free view call", "Data holders can check before sharing"], ["Events for grant and revoke", "An audit trail"]]),
        list("Audit and accountability", ["Log who accessed which record, when and for what purpose.", "Keep logs tamper-evident, for example by anchoring them.", "Separate the duties of those who operate systems and those who review them.", "Test restore and recovery, not only backups.", "Prepare for regulators' questions in advance."]),
        miniQuiz("consent-mini", [["Why make consent specific to a purpose?", ["Gas is lower", "Blanket consent is not meaningful and rarely lawful", "Hashes need it", "Contracts require it"], 1, "Informed and specific."]]),
      ],
      points: ["A consent register stores who agreed to what, as hashes and timestamps.", "Audit trails should be tamper-evident and reviewed."],
      check: [["Data holders should call isAllowed:", ["Before releasing data", "After releasing data", "Never", "Once a year"], 0, "Check first."]],
    }),
    topic({
      title: "Keys, roles and consortium governance", slug: "keys-governance",
      blocks: [
        table("Key management at enterprise scale", ["Practice", "Reason"], [["Hardware security modules for signing keys", "Keys cannot be copied out"], ["Separate keys per role and environment", "A leak has limited reach"], ["Multi-person approval for sensitive actions", "No single insider can act alone"], ["Rotation and revocation procedures, tested", "You will need them one day"], ["Backup and recovery with split custody", "Loss must not be fatal"], ["Logs of every use of a key", "Detect misuse"]]),
        table("Questions a governance charter answers", ["Question", "Typical answer"], [["Who may join and on what conditions?", "Approved by a majority, bound by an agreement and technical standards"], ["How are changes approved?", "Quorum rules, with higher thresholds for the rules themselves"], ["How are costs shared?", "Equal shares or by usage, agreed yearly"], ["How are disputes settled?", "Escalation to mediation, then courts, using the ledger as evidence"], ["How does a member leave or get removed?", "Notice, key revocation, data export and a wind-down plan"], ["Who is liable when something fails?", "Defined in the agreement, not left to chance"]]),
        mistakes(["Building the network before agreeing the governance.", "Letting one member control the ordering service or the keys.", "Forgetting an exit plan until a member wants to leave."]),
        miniQuiz("gov-mini", [["Why agree governance before building?", ["It is traditional", "Technical choices depend on who decides and who pays, and late disagreement can end the project", "Auditors demand it", "It lowers gas"], 1, "People problems sink more networks than technology."]]),
      ],
      points: ["Use hardware-protected keys, separate roles and multi-person approval.", "Agree governance, costs, disputes and exit before building."],
      check: [["A governance charter should include:", ["How members leave", "A logo", "A token", "Nothing"], 0, "Every consortium needs an agreed exit plan."]],
    }),
  ],
  terms: [["Data minimisation", "Collecting and storing only what is needed"], ["Pseudonym", "An identifier that does not directly name a person"], ["Consent register", "A record of agreements to share data"], ["HSM", "A hardware security module for keys"], ["Governance", "How a group makes and enforces decisions"], ["Charter", "The written rules of a consortium"]],
  practical: { title: "Practical: classify your data", intro: "For a use case you know.", steps: ["List every data field.", "Mark each as personal, confidential or open.", "Decide where each is stored.", "Write the single sentence that explains what the ledger holds."] },
  quiz: [
    ["Personal data on an immutable ledger:", ["Is hard to erase", "Is always safe", "Is free", "Is private"], 0, "Keep it off."],
    ["A salt added to a hash:", ["Prevents guessing", "Removes the hash", "Raises gas", "Encrypts"], 0, "For low-entropy data."],
    ["Consent should be:", ["Specific and revocable", "Blanket", "Permanent", "Hidden"], 0, "Informed choices."],
    ["Audit trails should be:", ["Tamper-evident", "Editable", "Private to one admin", "Optional"], 0, "Anchor them."],
    ["HSMs keep keys:", ["Uncopyable", "Public", "In e-mails", "On paper"], 0, "Hardware protection."],
    ["Governance should be agreed:", ["Before building", "After a crisis", "Never", "By one member"], 0, "Decide who decides."],
    ["Legal questions go to:", ["Counsel", "A forum", "The compiler", "A chatbot only"], 0, "Rules differ by country."],
  ],
});

const M6 = module_({
  slug: "architecture-decisions", title: "Architectural decision-making", hours: 2.5, level: "Applied skills",
  summary: "Decision records, non-functional requirements, reference architectures, vendor evaluation, risk registers and the road from pilot to production.",
  outcome: "You can write a decision record, set requirements, evaluate options and plan a pilot honestly.",
  intro: "Architecture is the discipline of making important decisions on purpose, writing down why, and being able to change them later. This module gives you the tools senior architects use, and applies them to a blockchain project.",
  topics: [
    topic({
      title: "Decision records", slug: "adrs",
      blocks: [
        code("markdown", adrTemplate, "ADR-007.md"),
        table("The parts of a good decision record", ["Part", "Purpose"], [["Context", "What forces are at work: the problem, constraints, people"], ["Options considered", "Real alternatives, including doing nothing"], ["Decision", "What was chosen, in one clear sentence"], ["Consequences", "Good and bad results, honestly"], ["Status and date", "Proposed, accepted or superseded"], ["Review trigger", "When to revisit"]]),
        list("Habits", ["Write the record when the decision is made, not months later.", "Keep each record short, one page at most.", "Store records with the code and review them like code.", "Never delete an old decision; mark it superseded.", "Record rejected options, because they will be proposed again."], true),
        miniQuiz("adr-mini", [["Why record rejected options?", ["To fill space", "They will be suggested again, and the reasons for rejecting them save a repeat argument", "Auditors require it", "It is a rule of Git"], 1, "Institutional memory."]]),
      ],
      points: ["A decision record states context, options, decision, consequences and review trigger.", "Keep records short, versioned and honest."],
      check: [["An ADR should be written:", ["When the decision is made", "Years later", "Never", "By a vendor"], 0, "Context is fresh."]],
    }),
    topic({
      title: "Requirements, reference architecture and risks", slug: "requirements-risks",
      blocks: [
        table("Non-functional requirements to pin down", ["Area", "Example question"], [["Performance", "How many transactions per minute at peak, and how fast must each be final?"], ["Availability", "What downtime is acceptable? Which parts can degrade gracefully?"], ["Security", "Which threats matter? Who holds which keys?"], ["Privacy and compliance", "Which laws apply and what data is involved?"], ["Operability", "Who runs it, monitors it and is on call?"], ["Evolvability", "How will we upgrade contracts, rules and members?"], ["Cost", "What is the budget for build and for a year of operation?"]]),
        flow("A layered reference architecture", ["Applications and user interfaces", "Integration layer: APIs, events, adapters to existing systems", "Ledger layer: network, smart contracts or chaincode", "Data layer: off-chain stores, document storage, databases", "Security and identity: keys, roles, audit", "Operations: monitoring, deployment, support"]),
        explorer({ id: "ent-risk", title: "Risk score", intro: "Change likelihood and impact (1 to 5) to see a risk rating. A teaching model.", inputs: [{ id: "l", label: "Likelihood", min: 1, max: 5, step: 1, value: 4 }, { id: "i", label: "Impact", min: 1, max: 5, step: 1, value: 5 }], outputs: [{ label: "Score", expr: "l * i", unit: "n" }] }),
        miniQuiz("req-mini", [["Why define non-functional requirements early?", ["They are optional", "They shape the architecture; discovering them late is costly", "Auditors prefer them", "They reduce code"], 1, "Qualities decide structure."]]),
      ],
      points: ["Pin down performance, availability, security, privacy, operability, evolvability and cost.", "Use a layered reference architecture and a scored risk register."],
      check: [["A risk score multiplies:", ["Likelihood and impact", "Cost and time", "Gas and price", "Users and nodes"], 0, "A simple ranking."]],
    }),
    topic({
      title: "From pilot to production, and when to stop", slug: "pilot-production",
      blocks: [
        table("A staged path", ["Stage", "Goal", "Exit test"], [["Discovery", "Understand the problem and the alternatives", "A clear decision: proceed, change approach or stop"], ["Proof of concept", "Show that the key technical idea works", "Works end to end with realistic data"], ["Pilot", "Run with real partners on a limited scope", "Success measures met: cost, time, disputes"], ["Production", "Operate with service levels and governance", "Stable for a quarter with no major incidents"], ["Scale", "Add members and use cases", "Governance handles growth"], ["Retire", "Wind down or migrate when it no longer fits", "Data exported, members informed"]]),
        list("Vendor and technology evaluation", ["Who else uses it in production, and at what scale?", "How active is the community and the maintenance?", "What are the licence and support terms?", "How easy is it to leave? Is the data portable?", "What does an independent security review say?", "What would we lose if the vendor disappeared?"], true),
        p("A mature organisation treats stopping as a legitimate result. A pilot that shows the problem is better solved with a shared database has succeeded: it saved the cost of a larger mistake. Celebrate that, write it down, and share the lessons."),
        miniQuiz("pilot-mini", [["When is a pilot successful?", ["When it ends with a press release", "When it gives an honest answer to whether to continue, change or stop", "When it uses the newest technology", "When it is the cheapest"], 1, "Evidence beats enthusiasm."]]),
        warn("Education only. Real enterprise projects need legal, security and compliance review."),
      ],
      points: ["Move from discovery to proof of concept, pilot, production and, if needed, retirement.", "Stopping is a legitimate and valuable outcome."],
      check: [["Evaluating a vendor includes asking:", ["How easy it is to leave", "Only the price", "Only the logo", "Nothing"], 0, "Avoid lock-in."]],
    }),
  ],
  terms: [["ADR", "Architecture decision record"], ["NFR", "Non-functional requirement"], ["Reference architecture", "A standard layered design"], ["Risk register", "A scored list of risks"], ["Proof of concept", "A small build showing an idea works"], ["Lock-in", "Difficulty of leaving a vendor or technology"]],
  practical: { title: "Practical: write your first ADR", intro: "For a decision in your own work.", steps: ["Describe the context in three sentences.", "List three real options.", "State the decision and its consequences.", "Set a review trigger."] },
  quiz: [
    ["An ADR records:", ["A decision and its reasons", "Only a name", "Only code", "Only a price"], 0, "For future teams."],
    ["Rejected options should be:", ["Recorded", "Deleted", "Hidden", "Ignored"], 0, "They return."],
    ["NFRs define:", ["Qualities such as performance and security", "Only features", "Only costs", "Only colours"], 0, "Structure depends on them."],
    ["A risk register ranks:", ["Risks by score", "Users", "Blocks", "Keys"], 0, "Likelihood times impact."],
    ["A pilot needs:", ["Success measures", "Only a demo", "A logo", "A token"], 0, "Decide on evidence."],
    ["Stopping a project can be:", ["A successful outcome", "A failure always", "Illegal", "Forbidden"], 0, "Saved cost."],
    ["Vendor evaluation asks about:", ["Exit and portability", "Only features", "Only price", "Nothing"], 0, "Avoid lock-in."],
  ],
});

export default course({
  slug: "blockchain-enterprise-architecture", title: "Blockchain Architecture & Enterprise Solutions", tagline: "When blockchain fits, how to design permissioned networks, scale, connect, protect data and decide like an architect", level: "Professional", hours: 16,
  summary: "A senior-level course on blockchain in organisations: an honest test of when a ledger is the right tool, permissioned and consortium networks with endorsement, chaincode and multi-organisation approvals, scalability with rollups, channels and anchoring, interoperability with atomic swaps and bridges, privacy, consent, key management and consortium governance, and architecture decision records, requirements, risk and staged delivery. Solidity and JavaScript listings were checked. This course teaches architecture judgement; it is not legal advice and names platforms only as examples.",
  modules: [M1, M2, M3, M4, M5, M6],
  capstone: capstone({
    title: "Final project: write an enterprise architecture and decision document", summary: "Produce an architecture and decision document for a real use case and pass the final assessment.",
    intro: "You can now test whether blockchain fits, choose a network model, size the solution, connect it to the world, protect data and record decisions. In this final step you write the document an architecture board would review: the business problem, an honest test of the alternatives, the architecture, scalability, privacy, governance, risks and cost, and a clear recommendation, which may be not to use blockchain. Then take the final assessment covering the whole course.",
    steps: ["Work through the **Final project: write an enterprise architecture and decision document** lab.", "Check that every recommendation follows from your analysis and that alternatives are fairly considered.", "Take the final assessment below."], projectTitle: "An enterprise architecture and decision document",
    quiz: [
      ["A ledger is most justified when:", ["Several parties distrust each other and no neutral operator exists", "One company wants faster reports", "Marketing wants buzz", "Data is private to one team"], 0, "The decisive condition."],
      ["If one trusted party can run the database, you should:", ["Use a database", "Always use a ledger", "Build a token", "Avoid technology"], 0, "Simpler and cheaper."],
      ["An endorsement policy states:", ["Which organisations must sign a transaction", "The gas price", "The block size", "The language"], 0, "Business agreement."],
      ["Chaincode must be:", ["Deterministic", "Random", "Secret", "Slow"], 0, "Every peer must reach the same result."],
      ["Raft tolerates:", ["Crashes but not lies", "Lies", "Nothing", "Everything"], 0, "Crash faults only."],
      ["Optimistic rollups depend on:", ["Fraud proofs within a challenge window", "Validity proofs", "No checks", "A single trusted operator"], 0, "Assume correct, challenge if not."],
      ["Anchoring many records needs:", ["One root hash per batch", "A transaction per record", "Private keys", "Nothing"], 0, "Throughput is irrelevant."],
      ["An HTLC releases funds when:", ["The secret is revealed before the deadline", "A fee is paid", "A password is typed", "Time passes"], 0, "Claim or refund."],
      ["Bridges are risky because they:", ["Concentrate large value behind complex code and few keys", "Are slow", "Are public", "Have no contracts"], 0, "A big prize, a narrow door."],
      ["Personal data on an immutable ledger should be:", ["Kept off it, with only hashes and pseudonyms on it", "Stored in plain text", "Encrypted and ignored", "Published"], 0, "Design the conflict away."],
      ["A governance charter must include:", ["Decision rules, costs, disputes and exit", "A logo", "A token", "Nothing"], 0, "People problems sink networks."],
      ["A pilot succeeds when it:", ["Gives an honest answer to continue, change or stop", "Uses new technology", "Gets press", "Is cheapest"], 0, "Evidence beats enthusiasm."],
    ],
  }),
  labs,
  skills: [{ id: SK, label: "Enterprise blockchain architecture" }],
  badges: [
    { id: "honest-assessor", title: "Honest assessor", description: "Judged when blockchain fits.", when: { all: ["e1-fit"] } },
    { id: "bridge-sceptic", title: "Bridge sceptic", description: "Judged cross-chain designs by their trust.", when: { all: ["e7-bridge-risks"] } },
    { id: "decision-recorder", title: "Decision recorder", description: "Wrote an architecture decision record.", when: { all: ["e11-adr"] } },
    { id: "enterprise-architect", title: "Enterprise architect", description: "Wrote an enterprise architecture and decision document.", when: { all: ["cap-architecture"] } },
  ],
  landing: {
    hero: { eyebrow: "Professional · Solidity compiled, JavaScript syntax-checked", title: "Enterprise blockchain architecture: decide honestly, design carefully", subtitle: "Learn the test that says when a ledger helps and when it does not, design permissioned and consortium networks, scale and connect them, protect data, set up governance and record decisions like a senior architect. Every task is checked and explained.", level: "Professional", outcomeLine: "After this course you can write an architecture board paper that includes an honest recommendation." },
    outcomes: [
      { icon: "docs", title: "Test fitness honestly", text: "Decision path, alternatives and total cost." },
      { icon: "safety", title: "Design consortium networks", text: "Endorsement, consensus, chaincode and approvals." },
      { icon: "sheet", title: "Size and scale", text: "Throughput maths, rollups, channels and anchoring." },
      { icon: "cloud", title: "Connect chains and systems", text: "HTLCs, bridges and integration patterns." },
      { icon: "sort", title: "Protect data and people", text: "Minimisation, consent, keys and governance." },
      { icon: "word", title: "Decide and document", text: "ADRs, requirements, risk registers and pilots." },
    ],
    projects: [
      { title: "A consortium charter", text: "Rules for members, decisions, costs, disputes and leaving.", module: "permissioned-and-consortium-networks" },
      { title: "A data-protection note", text: "Personal data kept off the ledger.", module: "privacy-governance-and-compliance" },
      { title: "An architecture decision record", text: "Context, options, decision and review.", module: "architecture-decisions" },
      { title: "An architecture and decision document", text: "A board-ready paper with a clear recommendation.", module: "capstone" },
    ],
    tools: [{ icon: "docs", title: "Checked code listings", text: "Four contracts compiled with solc; chaincode and anchoring code syntax-checked." }, { icon: "sheet", title: "Spreadsheet lab", text: "Cost comparison, throughput, timelocks and risk scoring." }, { icon: "word", title: "Document editor", text: "Charters, notes, ADRs and board papers." }],
    assessment: ["Finish the required labs in each module: they are checked automatically and explained when something is missing.", "Pass each module quiz (70% or more). Short tests inside the lessons give instant feedback.", "Complete the architecture document and the final assessment."],
    faq: [
      { q: "Does the platform run Hyperledger or other networks?", a: "No. The labs check your analysis, designs and writing. Code listings are for you to read and run in your own environment." },
      { q: "Is the course for or against blockchain?", a: "Neither. It teaches an honest test. A recommendation not to use blockchain is a good outcome when it is the right one." },
      { q: "Is it legal or compliance advice?", a: "No. Data-protection and financial rules differ by country; involve qualified counsel." },
    ],
  },
  catalogue: {
    hours: "~16 hrs", weeks: "~6 weeks", pace: "3 hrs/wk", badge: "Enterprise Blockchain Architect",
    brief: "When blockchain fits, permissioned networks, scalability, interoperability, privacy and governance, and architecture decisions.",
    learn: ["A decision test and alternatives for enterprise use cases", "Permissioned and consortium networks, endorsement and approvals", "Rollups, channels, sidechains and anchoring with throughput arithmetic", "Atomic swaps, bridges and integration patterns", "Data minimisation, consent, key management and governance", "ADRs, requirements, risk registers and staged delivery"],
    handsOn: "Write an enterprise architecture and decision document for a real use case, including an honest recommendation.",
    outcome: "Design and decide on blockchain solutions at enterprise scale with honesty.",
  },
});
