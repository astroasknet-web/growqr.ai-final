import { capstone, ck, classifyLab, code, course, def, explorer, flow, list, miniQuiz, mistakes, module_, p, S, sheetLab, table, tip, topic, W, warn, wordLab } from "../kit.mjs";

const SK = "bc-capstone";

const proposalTemplate = `# Project proposal: <name>

## Problem
Who has what problem today? What does it cost them? (Two or three sentences with a real example.)

## Users
Name two or three user types and what each wants to do.

## User stories (minimum viable product)
- As a <user>, I want to <action> so that <benefit>.
- ... (five to eight stories, each testable)

## Not in scope
Things this project will NOT do. (At least three.)

## Why a blockchain? (and why not)
What does a ledger give that a database does not? What would a database do better?

## Architecture sketch
Contracts, back end, front end, storage, third-party services.

## Risks
Top five risks and what you will do about each.

## Plan
Milestones by week, with a demo at the end of each.

## Success measures
How will you and a reviewer decide it worked?`;

const registryV2 = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

// A reference design for a capstone: a credential registry with expiry, reasons for revocation, batch issuing,
// separate roles and an emergency pause that never blocks revocation. Only fingerprints are stored, never personal data.
contract CredentialRegistryV2 is AccessControl, Pausable {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public constant MAX_BATCH = 100;

    enum Status { None, Valid, Revoked }
    enum Check { Unknown, Valid, Revoked, Expired, Mismatch }

    struct Credential {
        bytes32 docHash;
        address issuer;
        uint64 issuedAt;
        uint64 expiresAt;   // 0 means it never expires
        Status status;
        uint8 reason;       // 0 = none, 1 = issued in error, 2 = fraud, 3 = withdrawn by holder, 4 = other
    }

    mapping(bytes32 => Credential) private credentials;

    event Issued(bytes32 indexed id, address indexed issuer, bytes32 docHash, uint64 expiresAt);
    event Revoked(bytes32 indexed id, address indexed by, uint8 reason);

    error AlreadyExists();
    error Unknown();
    error AlreadyRevoked();
    error NotYourCredential();
    error BadBatch();

    constructor(address admin, address pauser) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, pauser);
    }

    function issue(bytes32 id, bytes32 docHash, uint64 validForSeconds) external onlyRole(ISSUER_ROLE) whenNotPaused {
        _issue(id, docHash, validForSeconds);
    }

    function issueBatch(bytes32[] calldata ids, bytes32[] calldata hashes, uint64 validForSeconds)
        external
        onlyRole(ISSUER_ROLE)
        whenNotPaused
    {
        if (ids.length == 0 || ids.length != hashes.length || ids.length > MAX_BATCH) revert BadBatch();
        for (uint256 i = 0; i < ids.length; i++) {
            _issue(ids[i], hashes[i], validForSeconds);
        }
    }

    // Revocation is deliberately allowed while paused: a pause must never stop corrections.
    function revoke(bytes32 id, uint8 reason) external onlyRole(ISSUER_ROLE) {
        Credential storage c = credentials[id];
        if (c.status == Status.None) revert Unknown();
        if (c.status == Status.Revoked) revert AlreadyRevoked();
        if (c.issuer != msg.sender && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) revert NotYourCredential();
        c.status = Status.Revoked;
        c.reason = reason;
        emit Revoked(id, msg.sender, reason);
    }

    function check(bytes32 id, bytes32 docHash) external view returns (Check) {
        Credential memory c = credentials[id];
        if (c.status == Status.None) return Check.Unknown;
        if (c.status == Status.Revoked) return Check.Revoked;
        if (c.docHash != docHash) return Check.Mismatch;
        if (c.expiresAt != 0 && block.timestamp > c.expiresAt) return Check.Expired;
        return Check.Valid;
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function _issue(bytes32 id, bytes32 docHash, uint64 validForSeconds) internal {
        if (credentials[id].status != Status.None) revert AlreadyExists();
        uint64 expiry = validForSeconds == 0 ? 0 : uint64(block.timestamp) + validForSeconds;
        credentials[id] = Credential(docHash, msg.sender, uint64(block.timestamp), expiry, Status.Valid, 0);
        emit Issued(id, msg.sender, docHash, expiry);
    }
}`;

const hardhatTest = `// test/registry.test.js — run with: npx hardhat test
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

const CHECK = { Unknown: 0, Valid: 1, Revoked: 2, Expired: 3, Mismatch: 4 };

describe("CredentialRegistryV2", function () {
  let registry, admin, issuer, other, pauser;
  const id = ethers.id("CERT-2026-0001");
  const hash = ethers.id("the exact bytes of the certificate");

  beforeEach(async function () {
    [admin, issuer, other, pauser] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("CredentialRegistryV2");
    registry = await Registry.deploy(admin.address, pauser.address);
    await registry.waitForDeployment();
    await registry.connect(admin).grantRole(await registry.ISSUER_ROLE(), issuer.address);
  });

  it("lets an issuer issue and anyone check", async function () {
    await expect(registry.connect(issuer).issue(id, hash, 0)).to.emit(registry, "Issued");
    expect(await registry.check(id, hash)).to.equal(CHECK.Valid);
  });

  it("detects a changed document", async function () {
    await registry.connect(issuer).issue(id, hash, 0);
    expect(await registry.check(id, ethers.id("an edited certificate"))).to.equal(CHECK.Mismatch);
  });

  it("refuses strangers", async function () {
    await expect(registry.connect(other).issue(id, hash, 0)).to.be.reverted;
  });

  it("refuses duplicate ids", async function () {
    await registry.connect(issuer).issue(id, hash, 0);
    await expect(registry.connect(issuer).issue(id, hash, 0)).to.be.revertedWithCustomError(registry, "AlreadyExists");
  });

  it("expires after the validity period", async function () {
    await registry.connect(issuer).issue(id, hash, 3600);
    await time.increase(3601);
    expect(await registry.check(id, hash)).to.equal(CHECK.Expired);
  });

  it("revokes with a reason and reports it", async function () {
    await registry.connect(issuer).issue(id, hash, 0);
    await expect(registry.connect(issuer).revoke(id, 1)).to.emit(registry, "Revoked").withArgs(id, issuer.address, 1);
    expect(await registry.check(id, hash)).to.equal(CHECK.Revoked);
  });

  it("allows revocation while paused but not issuing", async function () {
    await registry.connect(issuer).issue(id, hash, 0);
    await registry.connect(pauser).pause();
    await expect(registry.connect(issuer).issue(ethers.id("another"), hash, 0)).to.be.reverted;
    await registry.connect(issuer).revoke(id, 2);
    expect(await registry.check(id, hash)).to.equal(CHECK.Revoked);
  });

  it("limits batch size", async function () {
    const ids = Array.from({ length: 101 }, (_, i) => ethers.id("id" + i));
    await expect(registry.connect(issuer).issueBatch(ids, ids, 0)).to.be.revertedWithCustomError(registry, "BadBatch");
  });
});`;

const deployScript = `// scripts/deploy.js — a deployment you can rehearse and repeat.
const fs = require("fs");
const { ethers, network, run } = require("hardhat");

async function main() {
  const admin = process.env.ADMIN_ADDRESS;      // a multi-signature wallet
  const pauser = process.env.PAUSER_ADDRESS;    // a fast-response security account
  if (!admin || !pauser) throw new Error("Set ADMIN_ADDRESS and PAUSER_ADDRESS");
  if (network.name === "mainnet" && process.env.I_UNDERSTAND_THE_RISKS !== "yes") {
    throw new Error("Refusing to deploy to mainnet without explicit confirmation");
  }

  const [deployer] = await ethers.getSigners();
  console.log("Deploying to", network.name, "from", deployer.address);

  const Registry = await ethers.getContractFactory("CredentialRegistryV2");
  const registry = await Registry.deploy(admin, pauser);
  await registry.waitForDeployment();
  const address = await registry.getAddress();
  console.log("Registry deployed at", address);

  // The deployer holds no powers: the constructor gave all roles to the admin and the pauser.
  if (await registry.hasRole(await registry.DEFAULT_ADMIN_ROLE(), deployer.address)) {
    console.warn("Warning: the deployer still holds the admin role");
  }

  if (network.name !== "hardhat" && network.name !== "localhost") {
    await new Promise((resolve) => setTimeout(resolve, 30000));
    await run("verify:verify", { address, constructorArguments: [admin, pauser] });
  }

  fs.mkdirSync("deployments", { recursive: true });
  fs.writeFileSync("deployments/" + network.name + ".json", JSON.stringify({ address, admin, pauser, block: await ethers.provider.getBlockNumber() }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});`;

const frontendCheck = `// check.js — the heart of the public verification page.
const { Contract, JsonRpcProvider, id } = require("ethers");

const ABI = ["function check(bytes32 id, bytes32 docHash) view returns (uint8)"];
const MESSAGES = [
  { tone: "warn", text: "No record with this number. Check the number and try again." },     // Unknown
  { tone: "ok", text: "Valid. This document matches the record and has not been revoked." },  // Valid
  { tone: "bad", text: "Revoked. The issuer has withdrawn this credential." },               // Revoked
  { tone: "warn", text: "Expired. It was valid but the validity period has ended." },         // Expired
  { tone: "bad", text: "Does not match. This document differs from the one that was issued." } // Mismatch
];

async function sha256Hex(file) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return "0x" + Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verify(config, certificateNumber, file) {
  const provider = new JsonRpcProvider(config.rpcUrl);
  const network = await provider.getNetwork();
  if (network.chainId !== BigInt(config.chainId)) {
    return { tone: "warn", text: "The page is connected to the wrong network. Please contact the issuer." };
  }
  const contract = new Contract(config.address, ABI, provider);
  const code = Number(await contract.check(id(certificateNumber), await sha256Hex(file)));
  return MESSAGES[code] || { tone: "warn", text: "Unexpected answer from the contract." };
}

module.exports = { verify };`;

const propertyTest = `// test/properties.test.js — a simple randomised test: whatever order things happen in, the rules must hold.
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Registry properties (randomised)", function () {
  it("a revoked credential never becomes valid again, whatever happens next", async function () {
    const [admin, issuer, pauser] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("CredentialRegistryV2");
    const registry = await Registry.deploy(admin.address, pauser.address);
    await registry.connect(admin).grantRole(await registry.ISSUER_ROLE(), issuer.address);

    const ids = Array.from({ length: 10 }, (_, i) => ethers.id("credential-" + i));
    const hash = ethers.id("document");
    const revoked = new Set();

    for (let step = 0; step < 200; step++) {
      const i = Math.floor(Math.random() * ids.length);
      const action = Math.floor(Math.random() * 4);
      try {
        if (action === 0) await registry.connect(issuer).issue(ids[i], hash, 0);
        if (action === 1) { await registry.connect(issuer).revoke(ids[i], 1); revoked.add(i); }
        if (action === 2) await registry.connect(pauser).pause();
        if (action === 3) await registry.connect(admin).unpause();
      } catch (err) {
        // Reverts are fine: the rules said no. We only care that the rules are never broken.
      }
      for (const r of revoked) {
        expect(await registry.check(ids[r], hash)).to.equal(2, "a revoked credential came back to life");
      }
    }
  });
});`;

const demoScript = `# Demo script (five minutes)

0:00  One sentence: who has the problem and what my project does.
0:30  Show the problem: a PDF anyone could edit (or the current manual process).
1:00  Issue a credential as the registrar (live, on the test network). Show the transaction link.
2:00  Verify it as a stranger: valid. Change one letter in the file: "does not match".
3:00  Revoke it with a reason. Verify again: revoked. Pause the contract: show that revoking still works.
4:00  Show the architecture diagram, the tests passing, and the threat model.
4:30  State the limits: test network only, not audited, what it cannot prove.
5:00  Questions.

Rehearse twice. Record a backup video in case the network is slow. Keep the contract address and links in a text file.`;

const labs = [
  classifyLab({
    id: "c1-scope-mvp", module: "choose-and-scope", title: "MVP or later?", level: "advanced", minutes: 12, xp: 45, skills: [SK], required: true,
    objective: "Decide what belongs in a minimum viable capstone and what to defer.", scenario: "A credential-verification capstone has many possible features. A good plan commits to a small core that can be finished and defended.",
    steps: ["Read each feature.", "Choose where it belongs.", "Press Check my work."],
    categories: [["mvp", "In the minimum viable project"], ["later", "Later (future work)"], ["out", "Out of scope on purpose"]],
    items: [["Issuing a credential and verifying it from a web page", "mvp", "The core user journey."], ["Revoking a credential", "mvp", "A correction path is essential."], ["Tests for the contract, including failures", "mvp", "Evidence of quality."], ["A mobile app", "later", "Not needed to prove the idea."], ["Batch issuing for hundreds of credentials", "later", "Useful but secondary."], ["Storing graduates' marks on the blockchain", "out", "Privacy risk; deliberately excluded."], ["Launching on the main network with real users", "out", "Needs an audit and legal review."], ["A threat model and a list of known limits", "mvp", "Shows judgement."]],
  }),
  wordLab({
    id: "c2-proposal", module: "choose-and-scope", title: "Write your project proposal", level: "advanced", minutes: 25, xp: 80, skills: [SK], required: false,
    objective: "Turn an idea into a proposal that a reviewer can approve.",
    scenario: "Choose a real problem you care about and write the proposal for your capstone.",
    steps: ["Add Heading 2 sections: Problem, Users, User stories, Not in scope, Why a blockchain, Risks, Success measures.", "Under User stories write a numbered list of at least five stories.", "Under Not in scope list at least three items in bullets.", "Under Why a blockchain compare with a database honestly.", "Keep it between 220 and 480 words."],
    checks: [
      ck("heads", "Seven sections", "Use Heading 2.", "A full proposal.", W.heading(7, 2)),
      ck("order", "In order", "Problem, Users, User stories, Not in scope, Why a blockchain, Risks, Success measures.", "From need to measure.", W.order(["Problem", "Users", "User stories", "Not in scope", "Why a blockchain", "Risks", "Success measures"])),
      ck("stories", "Five stories", "Use the numbered list button.", "Testable stories.", W.list(5, "ol")),
      ck("out", "Three exclusions", "Use the bullet button.", "What you will not do.", W.list(3, "ul")),
      ck("db", "Compares with a database", "Mention a database.", "An honest comparison.", W.pattern("database", "a comparison with a database")),
      ck("len", "Between 220 and 480 words", "Concise.", "A proposal, not a thesis.", W.words(220, 480)),
    ],
    solution: "<h2>Problem</h2><p>Employers cannot easily tell whether a graduate's certificate is genuine. They either trust a PDF that anyone could edit or phone the college, which takes days and costs both sides time.</p><h2>Users</h2><p>The registrar who issues certificates, the graduate who shares them, and the employer who checks them.</p><h2>User stories</h2><ol><li>As a registrar, I want to issue a certificate so that it can be verified later.</li><li>As an employer, I want to check a PDF against the record so that I know it is genuine.</li><li>As a registrar, I want to revoke a certificate with a reason so that mistakes can be corrected.</li><li>As a graduate, I want my personal details kept off the public record so that my privacy is protected.</li><li>As an administrator, I want to pause issuing in an emergency so that damage can be limited.</li></ol><h2>Not in scope</h2><ul><li>Storing names, marks or contact details on the blockchain.</li><li>A mobile application or automated e-mail sending.</li><li>Use on the main network with real money or legal force.</li></ul><h2>Why a blockchain</h2><p>A shared database run by the college would be simpler and cheaper, and it would be the right answer if employers trusted the college's server. A public ledger adds a tamper-evident history that does not depend on the college staying online or honest in the future, so it is a reasonable option, but a database remains a strong alternative.</p><h2>Risks</h2><p>A stolen issuer key, a mistake when issuing, and users confusing a valid fingerprint with proof of quality. Each has a mitigation in the design.</p><h2>Success measures</h2><p>A reviewer can run the tests, deploy to a test network, issue, verify, change the file and see it rejected, and revoke.</p>",
  }),
  classifyLab({
    id: "c3-design-features", module: "architecture-and-contract-design", title: "Match the requirement to the design feature", level: "advanced", minutes: 12, xp: 45, skills: [SK], required: true,
    objective: "Connect each requirement to the feature of the reference contract that satisfies it.", scenario: "CredentialRegistryV2 has several features. Match each requirement to the feature that provides it.",
    steps: ["Read each requirement.", "Choose the feature.", "Press Check my work."],
    categories: [["roles", "Separate roles"], ["pause", "Pause that spares revocation"], ["expiry", "Expiry time"], ["reason", "Revocation reason"], ["batch", "Batch limit"], ["hash", "Hash-only storage"], ["status", "Check result enum"]],
    items: [["Only registered staff can issue; an admin manages staff", "roles", "ISSUER_ROLE and the admin role."], ["Issuing can stop in an emergency, but mistakes can still be corrected", "pause", "Revocation is not paused."], ["A credential should stop being valid after a date", "expiry", "expiresAt is checked."], ["Verifiers should know why a credential was withdrawn", "reason", "A reason code is recorded."], ["Issuing hundreds at once must not hit the block gas limit", "batch", "MAX_BATCH limits the loop."], ["No personal data may be written to a public chain", "hash", "Only a fingerprint is stored."], ["The verification page needs a clear answer: valid, revoked, expired, mismatch or unknown", "status", "check returns an enum."], ["A security account can pause but cannot issue or change roles", "roles", "PAUSER_ROLE is separate."]],
  }),
  sheetLab({
    id: "c4-estimate", module: "architecture-and-contract-design", title: "Estimate effort and check the plan fits", level: "advanced", minutes: 16, xp: 55, skills: [SK], required: false,
    objective: "Adjust task estimates for risk, compare them with the time you have and decide whether to cut scope.",
    scenario: "A capstone has five task groups. Each estimate is multiplied by a risk factor. You have 10 hours a week for 12 weeks. (A teaching model.)",
    steps: ["In D2 work out the adjusted hours: estimate times risk factor. Fill down to D6.", "In B11 add up the adjusted hours.", "In B12 work out the hours available.", "In B13 work out the shortfall, never below zero.", "In B14 show Cut scope if there is a shortfall, otherwise Fits.", "In B15 work out the weeks needed at your weekly hours, rounded up."],
    cells: { A1: "Task group", B1: "Estimate (hours)", C1: "Risk factor", D1: "Adjusted (hours)", A2: "Requirements and proposal", B2: "8", C2: "1.25", A3: "Contract design", B3: "12", C3: "1.5", A4: "Implementation", B4: "40", C4: "1.5", A5: "Testing and security review", B5: "24", C5: "1.25", A6: "Documentation, deployment and demo", B6: "16", C6: "1.25", A8: "Hours per week available", B8: "10", A9: "Weeks until the deadline", B9: "12", A11: "Total adjusted hours", A12: "Hours available", A13: "Shortfall", A14: "Verdict", A15: "Weeks needed" }, view: { cols: 4, rows: 17 },
    checks: [
      ck("d2", "D2 is the adjusted hours", "=B2*C2", "Estimate times risk.", S.formula("D2", { equals: 10 })),
      ck("d4", "D4 is the adjusted hours", "=B4*C4", "Fill down.", S.formula("D4", { equals: 60 })),
      ck("b11", "B11 is the total", "=SUM(D2:D6)", "Add the column.", S.formula("B11", { fns: ["SUM"], equals: 138 })),
      ck("b12", "B12 is the hours available", "=B8*B9", "Per week times weeks.", S.formula("B12", { equals: 120 })),
      ck("b13", "B13 is the shortfall", "=MAX(0,B11-B12)", "Never negative.", S.formula("B13", { fns: ["MAX"], equals: 18 })),
      ck("b14", "B14 is the verdict", "=IF(B13>0,\"Cut scope\",\"Fits\")", "A shortfall means cut.", S.formula("B14", { fns: ["IF"], equals: "Cut scope" })),
      ck("b15", "B15 is the weeks needed", "=ROUNDUP(B11/B8,0)", "Round up.", S.formula("B15", { fns: ["ROUNDUP"], equals: 14 })),
    ],
    solution: { cells: Object.assign({ B11: "=SUM(D2:D6)", B12: "=B8*B9", B13: "=MAX(0,B11-B12)", B14: "=IF(B13>0,\"Cut scope\",\"Fits\")", B15: "=ROUNDUP(B11/B8,0)" }, ...[2, 3, 4, 5, 6].map((r) => ({ [`D${r}`]: `=B${r}*C${r}` }))) },
  }),
  classifyLab({
    id: "c5-tests-first", module: "build-the-system", title: "Which test do I write?", level: "advanced", minutes: 12, xp: 45, skills: [SK], required: true,
    objective: "Choose the right test for each rule in the registry.", scenario: "Good tests mirror the rules of the system. Decide which kind of test each rule needs.",
    steps: ["Read each rule.", "Choose the test.", "Press Check my work."],
    categories: [["unit", "Unit test of one behaviour"], ["permission", "Permission test from a stranger's account"], ["boundary", "Boundary test"], ["property", "Randomised property test"], ["integration", "End-to-end test"]],
    items: [["A valid certificate checks as Valid", "unit", "Core behaviour."], ["A stranger cannot issue", "permission", "Negative access test."], ["A batch of exactly 100 works and 101 is refused", "boundary", "Edges of the rule."], ["Whatever sequence of actions happens, a revoked credential never becomes valid again", "property", "Many random sequences."], ["A user picks a file on the web page and sees 'Valid' for the right file", "integration", "From click to result."], ["An expired credential checks as Expired", "unit", "One behaviour with time moved forward."], ["Only the admin can unpause", "permission", "Role check."], ["A credential valid for exactly the expiry second", "boundary", "Edge of the time rule."]],
  }),
  sheetLab({
    id: "c6-progress", module: "build-the-system", title: "Track progress honestly", level: "advanced", minutes: 14, xp: 50, skills: [SK], required: false,
    objective: "Compare planned and actual hours, see how far behind you are and decide what to do.",
    scenario: "You planned 62 hours across six weeks and logged what really happened. (A teaching model.)",
    steps: ["In D2 work out the difference: actual minus planned. Fill down to D7.", "In B9 add up the planned hours.", "In B10 add up the actual hours.", "In B11 work out the progress as a percentage of the plan.", "In B12 show Behind: cut scope or add time if progress is below 80, otherwise On track."],
    cells: { A1: "Week", B1: "Planned hours", C1: "Actual hours", D1: "Difference", A2: "Week 1", B2: "10", C2: "8", A3: "Week 2", B3: "10", C3: "12", A4: "Week 3", B4: "12", C4: "6", A5: "Week 4", B5: "12", C5: "10", A6: "Week 5", B6: "10", C6: "10", A7: "Week 6", B7: "8", C7: "0", A9: "Planned total", A10: "Actual total", A11: "Progress (%)", A12: "Verdict" }, view: { cols: 4, rows: 14 },
    checks: [
      ck("d2", "D2 is the difference", "=C2-B2", "Actual minus planned.", S.formula("D2", { equals: -2 })),
      ck("d7", "D7 is the difference", "=C7-B7", "Fill down.", S.formula("D7", { equals: -8 })),
      ck("b9", "B9 is the planned total", "=SUM(B2:B7)", "Add the column.", S.formula("B9", { fns: ["SUM"], equals: 62 })),
      ck("b10", "B10 is the actual total", "=SUM(C2:C7)", "Add the column.", S.formula("B10", { fns: ["SUM"], equals: 46 })),
      ck("b11", "B11 is the progress", "=B10/B9*100", "Actual over planned, times 100.", S.formula("B11", { equals: 46 / 62 * 100 })),
      ck("b12", "B12 is the verdict", "=IF(B11<80,\"Behind: cut scope or add time\",\"On track\")", "Compare with 80.", S.formula("B12", { fns: ["IF"], equals: "Behind: cut scope or add time" })),
    ],
    solution: { cells: Object.assign({ B9: "=SUM(B2:B7)", B10: "=SUM(C2:C7)", B11: "=B10/B9*100", B12: "=IF(B11<80,\"Behind: cut scope or add time\",\"On track\")" }, ...[2, 3, 4, 5, 6, 7].map((r) => ({ [`D${r}`]: `=C${r}-B${r}` }))) },
  }),
  classifyLab({
    id: "c7-findings", module: "security-and-quality", title: "Rate the finding", level: "advanced", minutes: 12, xp: 45, skills: [SK], required: true,
    objective: "Assign a sensible severity to issues found in a self-review.", scenario: "During your own security review of the registry you list issues. Rate each one.",
    steps: ["Read each issue.", "Choose the severity.", "Press Check my work."],
    categories: [["high", "High: fix before any launch"], ["medium", "Medium: fix or accept in writing"], ["low", "Low: note and improve later"]],
    items: [["Any account can call issue, so strangers can create credentials", "high", "A direct break of the core promise."], ["The admin role is held by a single personal key", "medium", "A single point of failure, but mitigable."], ["Events do not include the credential's expiry in some cases", "low", "Monitoring convenience."], ["Revocation does not work while the contract is paused", "medium", "Corrections must stay possible."], ["The README has a typo", "low", "Cosmetic."], ["A bug lets a revoked credential become valid again", "high", "Defeats the point of revocation."], ["No deadline on how long an issuer key stays valid", "medium", "Operational policy gap."], ["The test suite has no test for the maximum batch size", "low", "Add the test."]],
  }),
  wordLab({
    id: "c8-threat-model", module: "security-and-quality", title: "Write your capstone's threat model", level: "advanced", minutes: 25, xp: 80, skills: [SK], required: false,
    objective: "Identify assets, attackers and mitigations for your own project in a structured document.",
    scenario: "Write the threat model for the credential registry capstone (or for your own project).",
    steps: ["Add Heading 2 sections: Assets, Actors, Threats and mitigations, Residual risks.", "Under Threats and mitigations write a bulleted list of at least five threats, each with a mitigation.", "Include a stolen issuer key, a fake verification website and a mistake when issuing.", "Keep it between 180 and 380 words."],
    checks: [
      ck("heads", "Four sections", "Use Heading 2.", "A structured model.", W.heading(4, 2)),
      ck("order", "In order", "Assets, Actors, Threats and mitigations, Residual risks.", "From what to protect to what remains.", W.order(["Assets", "Actors", "Threats and mitigations", "Residual risks"])),
      ck("threats", "Five threats", "Use the bullet button.", "Each with a mitigation.", W.list(5, "ul")),
      ck("key", "Mentions a stolen issuer key", "Mention a stolen or compromised key.", "A top risk.", W.pattern("stolen|compromised|leaked", "a stolen issuer key")),
      ck("fake", "Mentions a fake website", "Mention a fake or copied website.", "Phishing.", W.pattern("fake[\\s\\S]{0,30}(site|website|page)|copied|phishing|impersonat", "a fake website")),
      ck("mistake", "Mentions a mistake when issuing", "Mention a mistake or error in issuing.", "Humans err.", W.pattern("mistake|error|wrong person|wrongly", "a mistake when issuing")),
      ck("len", "Between 180 and 380 words", "Concise.", "Usable.", W.words(180, 380)),
    ],
    solution: "<h2>Assets</h2><p>The integrity of the registry (no fake or altered credentials), the availability of verification, the privacy of graduates, and the trust that employers place in the result.</p><h2>Actors</h2><p>Registrars and other issuers, graduates, employers, the administrator, the security pauser, attackers who want to forge credentials, and anyone who might copy the verification page.</p><h2>Threats and mitigations</h2><ul><li>A stolen issuer key could create fake credentials: issuer keys are held in hardware wallets, the admin can remove the role quickly, and the Issued events are monitored for unusual activity.</li><li>A fake verification website could tell employers that a forged document is valid: the official address is published on the college site, the page shows the contract address and network, and employers are told to use the official link.</li><li>A mistake when issuing to the wrong person: revocation with a reason code lets the issuer correct it, and a review step precedes issuing in batches.</li><li>A changed document presented as genuine: the fingerprint will not match, and the page says it does not match.</li><li>Personal data leaking onto the chain: only fingerprints and certificate numbers are stored, and the policy explains that records cannot be erased.</li></ul><h2>Residual risks</h2><p>A malicious or careless registrar can still issue a false credential, and the system proves only what was recorded, not the quality of the education. The code has not been audited and runs on a test network.</p>",
  }),
  classifyLab({
    id: "c9-release-ready", module: "deploy-and-document", title: "Ready to release, or not yet?", level: "advanced", minutes: 12, xp: 45, skills: [SK], required: true,
    objective: "Judge release readiness for a test-network deployment of the capstone.", scenario: "Before you present your capstone, check it against a release checklist. Judge each item.",
    steps: ["Read each situation.", "Choose the verdict.", "Press Check my work."],
    categories: [["ready", "Ready"], ["notyet", "Not yet"], ["na", "Not applicable for a test-network capstone"]],
    items: [["All tests pass and the failure cases are covered", "ready", "Evidence of quality."], ["The deployment script has never been run twice from scratch", "notyet", "Rehearse it."], ["The source code is verified on the block explorer", "ready", "Anyone can read it."], ["The README does not say what the project cannot do", "notyet", "Add honest limits."], ["A private key is committed in the repository history", "notyet", "Treat it as stolen and clean up."], ["A professional external audit has been completed", "na", "Not expected for a capstone, but state that it has not been done."], ["The addresses and links are in the README", "ready", "Reproducible."], ["A user guide explains the verification steps to a non-technical person", "ready", "Documentation for users."]],
  }),
  sheetLab({
    id: "c10-costs", module: "deploy-and-document", title: "What would it cost to run for a year?", level: "advanced", minutes: 14, xp: 50, skills: [SK], required: false,
    objective: "Estimate running costs and cost per user so your documentation can be honest about sustainability.",
    scenario: "If the project were run for real, it would need hosting, an RPC provider, monitoring, a domain and a one-off security review. (A teaching model in rupees.)",
    steps: ["In B9 add up the monthly running costs (hosting, RPC provider and monitoring).", "In B10 work out the yearly running cost: monthly times 12 plus the domain.", "In B11 add the one-off review to get the first-year total.", "In B12 work out the first-year cost per user.", "In B13 show Seek funding or reduce scope if the cost per user is above 300, otherwise Affordable."],
    cells: { A1: "Input", B1: "Value", A2: "Hosting per month", B2: "800", A3: "RPC provider per month", B3: "1500", A4: "Monitoring per month", B4: "500", A5: "Domain per year", B5: "1200", A6: "One-off security review", B6: "150000", A7: "Active users", B7: "500", A9: "Monthly running cost", A10: "Yearly running cost", A11: "First-year total", A12: "First-year cost per user", A13: "Verdict" }, view: { cols: 2, rows: 15 },
    checks: [
      ck("b9", "B9 is the monthly cost", "=B2+B3+B4", "Add three costs.", S.formula("B9", { equals: 2800 })),
      ck("b10", "B10 is the yearly cost", "=B9*12+B5", "Monthly times 12 plus the domain.", S.formula("B10", { equals: 34800 })),
      ck("b11", "B11 is the first-year total", "=B10+B6", "Add the review.", S.formula("B11", { equals: 184800 })),
      ck("b12", "B12 is the cost per user", "=B11/B7", "Total over users.", S.formula("B12", { equals: 184800 / 500 })),
      ck("b13", "B13 is the verdict", "=IF(B12>300,\"Seek funding or reduce scope\",\"Affordable\")", "Compare with 300.", S.formula("B13", { fns: ["IF"], equals: "Seek funding or reduce scope" })),
    ],
    solution: { cells: { B9: "=B2+B3+B4", B10: "=B9*12+B5", B11: "=B10+B6", B12: "=B11/B7", B13: "=IF(B12>300,\"Seek funding or reduce scope\",\"Affordable\")" } },
  }),
  wordLab({
    id: "c11-demo-script", module: "defence-and-career", title: "Write your demo and defence notes", level: "advanced", minutes: 25, xp: 80, skills: [SK], required: true,
    objective: "Prepare a five-minute demonstration and answers to the questions a reviewer is most likely to ask.",
    scenario: "Plan the presentation of your capstone. Write the demo script and prepare your answers.",
    steps: ["Add Heading 2 sections: Demo script, Likely questions, Honest limits.", "Under Demo script write a numbered list of at least six steps with times.", "Under Likely questions write a bulleted list of at least four questions with a short answer each.", "Mention a backup plan if the network is slow.", "Keep it between 200 and 420 words."],
    checks: [
      ck("heads", "Three sections", "Use Heading 2.", "A clear plan.", W.heading(3, 2)),
      ck("order", "In order", "Demo script, Likely questions, Honest limits.", "Show, defend, admit limits.", W.order(["Demo script", "Likely questions", "Honest limits"])),
      ck("steps", "Six steps", "Use the numbered list button.", "A rehearsed sequence.", W.list(6, "ol")),
      ck("qs", "Four questions", "Use the bullet button.", "Prepare answers.", W.list(4, "ul")),
      ck("backup", "Mentions a backup plan", "Mention a backup, recording or fallback.", "Networks fail at the worst time.", W.pattern("backup|recording|recorded video|fallback|plan b", "a backup plan")),
      ck("why", "Answers why a blockchain", "Mention why a blockchain or a database.", "The first question.", W.pattern("database", "the blockchain-versus-database question")),
      ck("len", "Between 200 and 420 words", "Concise.", "Usable on the day.", W.words(200, 420)),
    ],
    solution: "<h2>Demo script</h2><ol><li>0:00 In one sentence: employers cannot easily check certificates, and my project lets them do it in seconds.</li><li>0:30 Show an ordinary PDF and how easily it could be edited.</li><li>1:00 As the registrar, issue a credential on the test network and show the transaction link.</li><li>2:00 As a stranger, verify the real file and see Valid, then change one letter and see Does not match.</li><li>3:00 Revoke the credential with a reason, verify again and see Revoked, then pause the contract and show that revoking still works.</li><li>4:00 Show the architecture diagram, the passing tests and the threat model.</li><li>4:30 State the limits and take questions. If the network is slow I will play the backup recording I made yesterday.</li></ol><h2>Likely questions</h2><ul><li>Why a blockchain and not a database? A database would be simpler and cheaper if everyone trusted the college server; the ledger adds a tamper-evident history that does not depend on the college staying honest or online.</li><li>What if the issuer key is stolen? The admin removes the role, Issued events are monitored, and affected credentials are revoked.</li><li>What about privacy? Only fingerprints and certificate numbers are stored, never names or marks.</li><li>Is it audited? No. It runs on a test network and an audit would be required before real use.</li></ul><h2>Honest limits</h2><p>It proves that this exact document was recorded by an authorised issuer and has not been revoked. It does not prove the quality of the education or replace the college's legal records.</p>",
  }),
  classifyLab({
    id: "c12-defence-answers", module: "defence-and-career", title: "Strong or weak answer?", level: "advanced", minutes: 10, xp: 40, skills: [SK], required: false,
    objective: "Recognise the difference between answers that build and answers that damage trust in a defence.", scenario: "Reviewers test your understanding with hard questions. Judge each possible answer.",
    steps: ["Read each answer.", "Choose the verdict.", "Press Check my work."],
    categories: [["strong", "Strong answer"], ["weak", "Weak answer"], ["improve", "Good start, needs more"]],
    items: [["Why not a database? A database would be cheaper if everyone trusted one operator; here the point is a tamper-evident record, and I list that trade-off in my proposal.", "strong", "Honest and specific."], ["It is unhackable because it uses a blockchain.", "weak", "Absolute claims destroy credibility."], ["I do not know. I did not test that case, but I would test it by creating a revoked credential and trying to reissue it.", "strong", "Honest and constructive."], ["It is secure because I used OpenZeppelin.", "improve", "A good practice, but not a proof; explain the threat model."], ["I copied this part from a tutorial and I am not sure how it works.", "weak", "Understand everything you present."], ["The main risk is the issuer key, so the admin can remove it and I monitor Issued events.", "strong", "Risk, mitigation and monitoring."], ["Nobody would ever attack a university project.", "weak", "Dismisses risk."], ["I would add an audit before mainnet and keep the caps small at first.", "strong", "Realistic next steps."]],
  }),
  wordLab({
    id: "cap-report", module: "capstone", title: "Final project: write your capstone report", level: "challenge", minutes: 60, xp: 220, skills: [SK], required: true,
    objective: "Write the final report of a complete blockchain capstone: what you built, why, how, how you checked it and what remains.",
    scenario: "Write the capstone report for a project you have designed (the credential registry is a fine choice). It is the document a reviewer reads before your defence.",
    steps: ["Add a Heading 1 with the project name and 'capstone report'.", "Add Heading 2 sections: Summary, Problem and users, Requirements, Architecture, Implementation, Security and testing, Deployment and operations, Results, Limits and future work.", "Under Requirements write a numbered list of at least five requirements.", "Under Security and testing mention a threat model, tests and the fact that it has not been audited.", "Under Deployment and operations mention the test network and the verified source code.", "Under Limits and future work be honest about what the project cannot do.", "Keep it between 420 and 860 words."],
    checks: [
      ck("t", "A title", "Use Heading 1.", "Name the report.", W.heading(1, 1)),
      ck("secs", "Nine sections", "Use Heading 2.", "A complete report.", W.heading(9, 2)),
      ck("order", "In order", "Summary, Problem and users, Requirements, Architecture, Implementation, Security and testing, Deployment and operations, Results, Limits and future work.", "A logical flow.", W.order(["Summary", "Problem and users", "Requirements", "Architecture", "Implementation", "Security and testing", "Deployment and operations", "Results", "Limits and future work"])),
      ck("reqs", "Five requirements", "Use the numbered list button.", "Testable requirements.", W.list(5, "ol")),
      ck("threat", "Mentions a threat model", "Mention a threat model.", "Security thinking.", W.pattern("threat model", "a threat model")),
      ck("tests", "Mentions tests", "Mention tests.", "Evidence.", W.pattern("test", "tests")),
      ck("audit", "States it is not audited", "Say it has not been audited.", "Honest limits.", W.pattern("not (been )?audited|unaudited|no audit", "that it has not been audited")),
      ck("net", "Mentions the test network", "Mention a test network.", "Honest scope.", W.pattern("test network|testnet|sepolia", "a test network")),
      ck("verified", "Mentions verified source code", "Mention verified source code.", "Transparency.", W.pattern("verified|verify", "verified source code")),
      ck("future", "Mentions future work", "Mention future work or next steps.", "Where next.", W.pattern("future|next step|would add", "future work")),
      ck("len", "Between 420 and 860 words", "Three pages at most.", "A report, not a book.", W.words(420, 860)),
    ],
    solution: "<h1>Verifiable credentials registry: capstone report</h1><h2>Summary</h2><p>I built a registry on an Ethereum test network that lets a college issue credentials whose fingerprints are recorded publicly, so that employers can verify a document in seconds without phoning the college. The system has a smart contract, a verification page, tests, a deployment script and documentation. It is a learning project: it is not audited and not for real use.</p><h2>Problem and users</h2><p>Employers cannot easily tell whether a certificate is genuine. Registrars spend time answering checks, and graduates wait. The users are registrars who issue and revoke, graduates who share documents, and employers who verify.</p><h2>Requirements</h2><ol><li>An authorised issuer can record a credential's fingerprint, an identifier and an optional expiry.</li><li>Anyone can check a document against the record and see valid, revoked, expired, mismatch or unknown.</li><li>An issuer can revoke a credential with a reason, even when issuing is paused.</li><li>No personal data is stored on the chain.</li><li>An administrator manages issuers, and a separate account can pause issuing in an emergency.</li></ol><h2>Architecture</h2><p>A single CredentialRegistryV2 contract holds the records and enforces roles. A static verification page computes the SHA-256 fingerprint of the chosen file in the browser and reads the contract through a public RPC provider. Events feed a small dashboard for the registrar.</p><h2>Implementation</h2><p>The contract uses OpenZeppelin's AccessControl and Pausable, custom errors, a batch limit of one hundred and enumerations for status. The page shows plain-language messages for each result. The code and tests are in one repository with a README and a user guide.</p><h2>Security and testing</h2><p>I wrote a threat model covering a stolen issuer key, a fake verification site and a mistake when issuing. Unit tests cover issuing, duplicates, expiry, revocation, permissions, pausing and batch limits, and a randomised test checks that a revoked credential never becomes valid again. Static analysis shows no unexplained warnings. The contract has not been audited.</p><h2>Deployment and operations</h2><p>I rehearsed the deployment script on a local network and then deployed to a public test network, where the source code is verified on the block explorer. The roles belong to a multi-signature wallet and a pauser account, and the deployer holds none. Monitoring watches Issued and Revoked events.</p><h2>Results</h2><p>All tests pass. In the demonstration a real file verifies as valid, a one-letter change is rejected, and a revoked credential is reported as revoked, including while the contract is paused. Estimated running costs would be about 34,800 rupees a year plus a one-off review.</p><h2>Limits and future work</h2><p>The registry proves only that this exact document was recorded by an authorised issuer and has not been revoked. It does not prove the quality of the education or replace legal records, and a stolen issuer key could create fake credentials until removed. Next steps would be an independent audit, legal advice on privacy, a dashboard for registrars and support for batches from the college's student system.</p>",
  }),
];

const M1 = module_({
  slug: "choose-and-scope", title: "Choose and scope your project", hours: 2.5, level: "Foundations",
  summary: "Picking a problem worth solving, writing user stories, deciding what is in and out, and an honest test of whether a blockchain belongs.",
  outcome: "You can pick a problem, write testable user stories, define a minimum viable scope and defend the choice of technology.",
  intro: "Most capstones are won or lost before a line of code is written. A well-chosen problem, a small scope and an honest answer to 'why a blockchain?' make the rest manageable. This module shows how to do that, with a concrete reference project that you can follow or adapt.",
  topics: [
    topic({
      title: "Picking a problem worth solving", slug: "pick-a-problem",
      blocks: [
        table("What makes a good capstone problem", ["Quality", "Why it matters", "Example"], [["A real person has the problem", "You can describe a user, not just a technology", "A registrar who answers verification calls every week"], ["It involves more than one party", "Shared records are where ledgers help", "Issuer, holder and verifier"], ["It can be finished in the time you have", "A finished small project beats an unfinished large one", "Issue, verify and revoke"], ["It can be demonstrated in five minutes", "You will present it", "A live verification of a real file"], ["Risks are manageable", "You can handle them responsibly", "No personal data, test network only"], ["You can explain why not a database", "Honest reasoning earns trust", "A tamper-evident public record"]]),
        table("Ideas that fit, and ideas to avoid", ["Fits well", "Avoid"], [["Credential or document verification", "Anything holding real money for real strangers"], ["Supply-chain status tracking among a few parties", "Anything requiring unsolved problems such as secret national voting"], ["A transparent donation tracker for a student fund", "A token sold as an investment"], ["A ticketing or membership system with check-in", "A system that needs personal data on the chain"], ["A registry of items with a trusted registrar", "Anything you cannot test thoroughly"]]),
        miniQuiz("pick-mini", [["Which is the best sign of a good capstone problem?", ["It uses the newest technology", "A real person has the problem and it can be finished and demonstrated", "It needs a token", "It is very large"], 1, "Problem first, technology second."]]),
      ],
      points: ["Choose a real problem with several parties, a finishable scope and a five-minute demo.", "Avoid projects that hold real money or put personal data on a public chain."],
      check: [["A capstone should be:", ["Finishable and demonstrable", "As large as possible", "Secret", "Untested"], 0, "Finished beats ambitious."]],
    }),
    topic({
      title: "User stories and a minimum viable scope", slug: "stories-mvp",
      blocks: [
        code("markdown", proposalTemplate, "proposal.md"),
        table("Writing user stories that can be tested", ["Poor", "Better"], [["The system is secure", "As a registrar, I want only authorised staff to issue so that strangers cannot create credentials. (Test: a stranger's call reverts.)"], ["Users can verify", "As an employer, I want to drop a PDF on a page and see valid, revoked or does not match so that I can decide in seconds."], ["Fast and scalable", "As a registrar, I want to issue up to 100 credentials in one transaction so that graduation season is manageable."]]),
        list("Defining the minimum viable project", ["List every feature you can imagine.", "Mark those the demo cannot work without.", "Move everything else to 'later'.", "Write at least three things you will not do on purpose.", "Estimate the effort and compare it with the time you have.", "Cut until it fits with a buffer."], true),
        miniQuiz("story-mini", [["What makes a user story testable?", ["It is short", "It states an observable result that a test can check", "It uses technical words", "It names a library"], 1, "If you cannot test it, you cannot demonstrate it."]]),
      ],
      points: ["Write testable stories and a minimum viable scope.", "State what you will not do."],
      check: [["Features outside the MVP go to:", ["A 'later' list", "The trash with no record", "The demo", "The contract"], 0, "Keep them as future work."]],
    }),
    topic({
      title: "Why a blockchain, and why not", slug: "why-blockchain",
      blocks: [
        table("An honest comparison for the reference project", ["Question", "Database run by the college", "Public ledger with a registry contract"], [["Who must be trusted to keep records unchanged?", "The college, its staff and its servers, now and in the future", "No single party: past entries cannot be silently changed"], ["Who can verify without asking permission?", "Anyone the college lets use its system", "Anyone with an internet connection"], ["What if the college closes or its website goes down?", "Verification stops", "Records and verification continue, provided someone runs a page"], ["Cost and complexity", "Low", "Higher: keys, fees, a contract and monitoring"], ["Privacy", "Easier to protect and to correct", "Public and permanent: only fingerprints may be stored"], ["Speed to build", "Quick", "Slower"]]),
        p("A good capstone report says plainly that a database is a strong alternative and explains what the ledger adds in this case. A reviewer who sees that comparison trusts the rest of your work. A reviewer who sees 'because blockchain is secure' does not."),
        miniQuiz("why-mini", [["How should you answer 'why not a database?'", ["Databases are bad", "Give the trade-off honestly and say what the ledger adds in your case", "Say it is more secure", "Avoid the question"], 1, "Honesty is credible."]]),
        warn("Education only. A capstone on a test network is not a product, and real deployments need security review and legal advice."),
      ],
      points: ["Compare with a database honestly.", "State what the ledger adds and what it costs."],
      check: [["A public ledger adds:", ["A tamper-evident record independent of one operator", "Secrecy", "Lower cost", "Faster building"], 0, "That is the case for it."]],
    }),
  ],
  terms: [["Capstone", "A final project that integrates what you have learned"], ["User story", "A short description of what a user wants and why"], ["MVP", "Minimum viable product"], ["Scope", "What the project will and will not do"], ["Non-goal", "Something deliberately left out"], ["Stakeholder", "Anyone affected by the project"]],
  practical: { title: "Practical: write your proposal", intro: "Using the template.", steps: ["Choose a problem and name the users.", "Write five testable user stories.", "List three non-goals.", "Write the 'why a blockchain, and why not' paragraph."] },
  quiz: [
    ["A good capstone problem has:", ["A real user and a finishable scope", "A token", "A huge scope", "No users"], 0, "Problem first."],
    ["User stories should be:", ["Testable", "Vague", "Secret", "Long"], 0, "Observable results."],
    ["MVP means:", ["Minimum viable product", "Maximum value project", "Main version plan", "Mobile version"], 0, "The smallest thing that works."],
    ["Non-goals are:", ["Things you will not do", "Goals", "Bugs", "Tests"], 0, "Written down on purpose."],
    ["Why not a database must be:", ["Answered honestly", "Avoided", "Ridiculed", "Ignored"], 0, "Show the trade-off."],
    ["Personal data on a public chain is:", ["Avoided", "Encouraged", "Required", "Free"], 0, "Permanent and public."],
    ["A capstone demo should take:", ["About five minutes", "An hour", "A day", "No time"], 0, "Short and clear."],
  ],
});

const M2 = module_({
  slug: "architecture-and-contract-design", title: "Architecture and contract design", hours: 3, level: "Core skills",
  summary: "From user stories to a design: components, data, roles, states and a complete reference contract.",
  outcome: "You can turn stories into a design, read a reference contract and estimate the effort honestly.",
  intro: "A good design makes the build straightforward and the review fast. This module walks from user stories to a component diagram, a data model, roles and a reference contract, and ends with a realistic estimate of the effort.",
  topics: [
    topic({
      title: "From stories to components", slug: "components",
      blocks: [
        flow("The reference architecture", ["Registrar's admin tool", "CredentialRegistryV2 contract on a test network", "Public RPC provider", "Verification web page", "Event monitor and dashboard"]),
        table("Mapping stories to components", ["Story", "Component", "Notes"], [["Issue a credential", "Contract function plus admin tool", "Role-protected; batch option"], ["Verify a document", "Verification page plus contract view", "Hash in the browser; read-only call"], ["Revoke with a reason", "Contract function plus admin tool", "Allowed even when paused"], ["Pause in an emergency", "Contract role plus runbook", "Separate pauser account"], ["Notice unusual activity", "Event monitor", "Alert on Issued spikes and role changes"], ["Keep personal data private", "Design rule", "Only fingerprints on-chain"]]),
        miniQuiz("comp-mini", [["Why is the verification step a read-only call?", ["It is secret", "It needs no wallet, costs no gas and anyone can do it", "It signs the document", "It writes to the chain"], 1, "Easy and free for verifiers."]]),
      ],
      points: ["Map each story to a component.", "Verification is a free read; issuing and revoking are role-protected writes."],
      check: [["A view call costs:", ["No gas", "A lot", "A token", "A fee"], 0, "Reads are free."]],
    }),
    topic({
      title: "The reference contract", slug: "reference-contract",
      blocks: [
        code("solidity", registryV2, "CredentialRegistryV2.sol"),
        table("Design decisions to be able to explain", ["Decision", "Reason"], [["Only a document hash is stored", "Public, permanent chain: no personal data"], ["ISSUER_ROLE, PAUSER_ROLE and the admin role are separate", "Least privilege; the deployer holds no power"], ["Revoke ignores the pause", "Corrections must remain possible in an emergency"], ["Revoke needs the original issuer or an admin", "One issuer cannot cancel another's records"], ["Batch size is limited to 100", "Avoids hitting the block gas limit"], ["check returns an enum", "The page can show a precise message"], ["Custom errors and events", "Cheap failures and monitoring"], ["Expiry is optional", "Some credentials do not expire"]]),
        miniQuiz("ref-mini", [["Why separate the pauser role from the admin?", ["It saves gas", "A fast-response account can stop damage without power to change roles or issue", "Roles are required", "It hides the admin"], 1, "Narrow, fast powers for emergencies."]]),
      ],
      points: ["Hash-only storage, separate roles, pausing that spares revocation, a batch limit and a clear check result.", "Be ready to explain every design decision."],
      check: [["The deployer after deployment should hold:", ["No roles", "All roles", "Only the pause", "The keys of the issuers"], 0, "Power goes to the admin and pauser."]],
    }),
    topic({
      title: "Estimating and planning", slug: "estimating",
      blocks: [
        table("Typical effort for the reference project (hours)", ["Task group", "Estimate", "Risk factor", "Adjusted"], [["Requirements and proposal", "8", "1.25", "10"], ["Contract design", "12", "1.5", "18"], ["Implementation", "40", "1.5", "60"], ["Testing and security review", "24", "1.25", "30"], ["Documentation, deployment and demo", "16", "1.25", "20"], ["Total", "100", "", "138"]]),
        explorer({ id: "cap-plan", title: "Does your plan fit?", intro: "Change your hours per week and weeks available to see whether the adjusted estimate fits. Cut scope if not.", inputs: [{ id: "hpw", label: "Hours per week", min: 2, max: 40, step: 1, value: 10 }, { id: "weeks", label: "Weeks until the deadline", min: 2, max: 30, step: 1, value: 12 }, { id: "need", label: "Adjusted hours needed", min: 40, max: 300, step: 5, value: 138 }], outputs: [{ label: "Hours available", expr: "hpw * weeks", unit: "n" }, { label: "Shortfall (hours)", expr: "max(0, need - hpw * weeks)", unit: "n" }, { label: "Weeks needed", expr: "ceil(need / hpw)", unit: "n" }] }),
        list("Planning habits", ["Plan in weekly milestones, each with something you can demonstrate.", "Do the riskiest parts first.", "Reserve the last two weeks for testing, documentation and rehearsal.", "Review progress each week against the plan.", "Cut scope early, not late."], true),
        miniQuiz("est-mini", [["Why add a risk factor to estimates?", ["To impress", "Estimates are usually optimistic, and unknowns take longer than expected", "Because tasks are easy", "To reduce work"], 1, "Plan for reality."]]),
      ],
      points: ["Adjust estimates for risk and compare them with the time you have.", "Do risky parts first and cut scope early."],
      check: [["If the plan does not fit, you should:", ["Cut scope", "Work all night", "Skip tests", "Hide it"], 0, "Reduce the plan, not the quality."]],
    }),
  ],
  terms: [["Component", "A distinct part of the system"], ["Role", "A named permission"], ["Least privilege", "Giving only the power needed"], ["Enum", "A fixed set of named values"], ["Estimate", "A prediction of effort"], ["Milestone", "A checkpoint with something to show"]],
  practical: { title: "Practical: draw your design", intro: "On paper or a diagramming tool.", steps: ["Draw the components and the data flow.", "Write the roles and what each can do.", "List five design decisions and their reasons.", "Estimate each task and adjust for risk."] },
  quiz: [
    ["Stories map to:", ["Components", "Colours", "Fonts", "Fees"], 0, "Design from needs."],
    ["Personal data is kept:", ["Off the chain", "On the chain", "In the contract name", "In events"], 0, "Fingerprints only."],
    ["Separate roles provide:", ["Least privilege", "Speed", "Gas", "Secrecy"], 0, "Limit power."],
    ["Revocation during a pause is:", ["Allowed", "Blocked", "Secret", "Random"], 0, "Corrections must remain possible."],
    ["Batch limits prevent:", ["Hitting the gas limit", "Revocation", "Verification", "Expiry"], 0, "Bounded loops."],
    ["Estimates should include:", ["A risk factor", "Nothing", "A logo", "A guess only"], 0, "Unknowns take time."],
    ["Do the riskiest work:", ["First", "Last", "Never", "Randomly"], 0, "Learn early."],
  ],
});

const M3 = module_({
  slug: "build-the-system", title: "Build the system", hours: 3, level: "Applied skills",
  summary: "Tests first, a deployable script, a verification page, a repeat-safe workflow and weekly progress tracking.",
  outcome: "You can write tests that mirror requirements, create a rehearsable deployment, build a verification page and track progress honestly.",
  intro: "Building is easiest when the rules are already written as tests. This module shows a test suite for the reference contract, a deployment script and the verification page, and a simple way to track your progress each week without fooling yourself.",
  topics: [
    topic({
      title: "Tests that mirror the requirements", slug: "tests",
      blocks: [
        code("javascript", hardhatTest, "test/registry.test.js"),
        table("Tests and the requirements they protect", ["Test", "Requirement"], [["Issue and check Valid", "Authorised issuers can record credentials; anyone can check"], ["Changed document is a Mismatch", "Tampering is detected"], ["Strangers are refused", "Only authorised issuers can issue"], ["Duplicate ids are refused", "A record cannot be overwritten"], ["Expiry", "Credentials can stop being valid after a date"], ["Revoke with a reason", "Corrections are possible and explained"], ["Revoke while paused", "Emergencies cannot block corrections"], ["Batch limit", "A loop cannot exceed a safe size"]]),
        list("Habits", ["Write each test from a user story or requirement.", "Test failures as carefully as successes.", "Test the edges: zero, one, maximum and one over.", "Move time forward to test expiry.", "Run all tests before every commit."], true),
        miniQuiz("test-mini", [["Why test that revocation works while paused?", ["It is easy", "A requirement says corrections must remain possible in an emergency", "Pausing is rare", "Tests must be long"], 1, "Tests protect requirements."]]),
      ],
      points: ["Write each test from a requirement and test failures and edges.", "Move time forward to test expiry."],
      check: [["Edge tests check:", ["Zero, one, maximum and one over", "Colours", "Fonts", "Fees"], 0, "Bugs hide at boundaries."]],
    }),
    topic({
      title: "Properties, deployment and the verification page", slug: "deploy-page",
      blocks: [
        code("javascript", propertyTest, "test/properties.test.js"),
        p("A property test states a rule that must always hold and then tries to break it with random sequences of actions. Here: once revoked, a credential never becomes valid again, whatever else happens. Reverts are fine. Breaking the rule is not."),
        code("javascript", deployScript, "scripts/deploy.js"),
        code("javascript", frontendCheck, "check.js"),
        table("What these three files protect", ["File", "Protects against"], [["Property test", "Surprising sequences that hand-written tests miss"], ["Deploy script", "Mistakes made by hand: wrong roles, wrong network, unverified source"], ["Check script", "Misleading messages and wrong-network confusion on the public page"]]),
        miniQuiz("deploy-mini", [["Why does the deployment script warn if the deployer still has the admin role?", ["Deployers are not allowed", "Power should rest with the multi-signature admin, not the deployment account", "It saves gas", "It is a compile rule"], 1, "Check the result of every deployment."]]),
      ],
      points: ["Property tests try to break always-true rules with random actions.", "Scripts and clear messages remove human error."],
      check: [["A property test checks:", ["A rule that must always hold", "One example", "Gas", "Names"], 0, "Randomised rules."]],
    }),
    topic({
      title: "Working weekly and tracking honestly", slug: "weekly-tracking",
      blocks: [
        flow("A good week", ["Plan: pick this week's milestone", "Build: work on the riskiest part first", "Test: add tests as you go", "Demo: show something working to someone", "Review: compare hours and progress with the plan", "Adjust: cut scope or move deadlines if behind"]),
        explorer({ id: "cap-progress", title: "Progress check", intro: "Enter the planned and actual hours to see how far along you are. A teaching tool.", inputs: [{ id: "plan", label: "Planned hours so far", min: 10, max: 150, step: 1, value: 62 }, { id: "done", label: "Actual hours so far", min: 0, max: 150, step: 1, value: 46 }], outputs: [{ label: "Progress against plan (%)", expr: "done / plan * 100", unit: "n" }] }),
        table("What to do when behind", ["Situation", "Response"], [["Slightly behind early on", "Add a little time or trim a small feature"], ["Behind with the riskiest part unfinished", "Cut features now; protect testing and documentation"], ["Far behind close to the end", "Present what works, state the limits honestly, and list the rest as future work"]]),
        mistakes(["Hiding delay from your supervisor until the last week.", "Cutting tests to keep features.", "Adding new features while behind."]),
        miniQuiz("week-mini", [["What should you protect when time runs short?", ["The nicest features", "Testing, documentation and the core journey", "The logo", "The newest library"], 1, "Quality and honesty over breadth."]]),
      ],
      points: ["Plan, build, test, demo, review and adjust every week.", "When behind, cut features and protect tests and documentation."],
      check: [["Being behind should be:", ["Reported early", "Hidden", "Ignored", "Blamed on others"], 0, "Early is cheaper."]],
    }),
  ],
  terms: [["Test-first", "Writing tests from requirements before or while building"], ["Property test", "A randomised test of an always-true rule"], ["Deployment script", "Repeatable code that performs a deployment"], ["Milestone", "A planned checkpoint"], ["Burn-down", "Tracking remaining work"], ["Regression", "A bug that returns after being fixed"]],
  practical: { title: "Practical: build your first milestone", intro: "In your own repository.", steps: ["Write three tests from your user stories.", "Make them pass with the smallest contract.", "Add a deployment script and run it on a local network.", "Log your hours and compare them with the plan."] },
  quiz: [
    ["Tests come from:", ["Requirements", "Guesses", "Colours", "Fees"], 0, "Mirror the stories."],
    ["Boundary tests check:", ["Edges of rules", "Nothing", "Logos", "Names"], 0, "Where bugs live."],
    ["Property tests use:", ["Random sequences", "One example", "No data", "Fixed order"], 0, "To try to break a rule."],
    ["Deployment scripts reduce:", ["Human error", "Gas", "Roles", "Tests"], 0, "Repeatable."],
    ["The deployer after deployment:", ["Holds no power", "Holds everything", "Holds the pause", "Holds the keys"], 0, "Power goes to the admin."],
    ["When behind, cut:", ["Features", "Tests", "The README", "The threat model"], 0, "Protect quality."],
    ["Weekly reviews compare:", ["Plan and actual", "Fonts", "Colours", "Fees"], 0, "Honest tracking."],
  ],
});

const M4 = module_({
  slug: "security-and-quality", title: "Security and quality review", hours: 2.5, level: "Applied skills",
  summary: "A threat model, self-review, severity ratings, tools and the discipline of fixing what you find.",
  outcome: "You can write a threat model, review your own contract, rate findings and prepare for an external review.",
  intro: "A capstone that has been attacked by its author is stronger than one that has only been admired. This module teaches a structured self-review: model the threats, check the code against a list, rate what you find and fix or explain each item.",
  topics: [
    topic({
      title: "Threat modelling your own project", slug: "threat-model",
      blocks: [
        flow("A threat model in six steps", ["List the assets (integrity, privacy, availability, reputation)", "List the actors (users, admins, attackers, other contracts)", "List the entry points (functions, signatures, pages, keys)", "For each, ask what could go wrong", "Decide a mitigation or an accepted risk", "Write what remains"]),
        table("Threat model for the reference project", ["Threat", "Mitigation", "Remaining risk"], [["Stolen issuer key creates fake credentials", "Hardware wallets, role removal by admin, event monitoring", "A window between theft and detection"], ["Fake verification website", "Official address published; contract and network shown on the page", "Users who do not check the address"], ["Mistaken issue to the wrong person", "Revocation with reason, review before batches", "Short period of misuse"], ["Changed document", "Fingerprint mismatch is reported", "None for this check"], ["Personal data leaking on-chain", "Only fingerprints stored", "Certificate numbers linked to identities elsewhere"], ["Admin key loss", "Multi-signature admin and a recovery procedure", "Operational mistakes"]]),
        miniQuiz("tm-mini", [["What is a residual risk?", ["A fixed bug", "A risk that remains after mitigation", "A type of fee", "A role"], 1, "Honesty about what is left."]]),
      ],
      points: ["List assets, actors and entry points, then ask what could go wrong.", "Write the residual risks."],
      check: [["A mitigation should be:", ["Specific and checkable", "A hope", "Secret", "Long"], 0, "Do something real."]],
    }),
    topic({
      title: "Self-review, tools and severity", slug: "self-review",
      blocks: [
        table("A self-review checklist for the registry", ["Area", "Question"], [["Access control", "Does every state-changing function have the right role? Is there a test from a stranger?"], ["Roles", "Who holds each role after deployment? Does the deployer hold none?"], ["Pause", "What does pausing stop and not stop? Is that intended?"], ["Inputs", "Are lengths, ids and reasons validated? Are loops bounded?"], ["Events", "Does every state change emit an event that monitoring needs?"], ["Privacy", "Is anything personal written on-chain or in events?"], ["Upgrades", "Is the contract meant to be immutable? Is that stated?"], ["Tools", "Does static analysis show unexplained warnings? Do coverage gaps hide untested code?"]]),
        table("A severity guide", ["Severity", "Meaning", "Action"], [["High", "Breaks a core promise or can lose value or integrity", "Fix before any launch"], ["Medium", "A weakness with mitigations or limited impact", "Fix or accept in writing"], ["Low", "Minor or cosmetic", "Note and improve later"]]),
        list("Using tools", ["Run the compiler with warnings visible and read them.", "Run a static analyser and triage every finding.", "Check test coverage and look at untested branches.", "Use fuzz or property tests for rules that must always hold.", "Ask a classmate to try to break it for an hour."], true),
        miniQuiz("self-mini", [["Why ask someone else to try to break your project?", ["It is tradition", "You are too close to your own work to see its weak points", "Tools cannot run", "Tests are optional"], 1, "Fresh eyes find different problems."]]),
      ],
      points: ["Review access control, roles, pause, inputs, events, privacy and upgrades.", "Rate findings and fix or accept them in writing."],
      check: [["A medium finding should be:", ["Fixed or accepted in writing", "Ignored", "Hidden", "Deleted"], 0, "A recorded decision."]],
    }),
    topic({
      title: "Preparing for an external review", slug: "external-review",
      blocks: [
        list("What a reviewer needs from you", ["A frozen version, tagged in the repository.", "A one-page specification and the threat model.", "Instructions to build and run the tests.", "A list of known issues and assumptions.", "Your own findings, rated and addressed.", "Time to fix and re-check afterwards."], true),
        table("How to respond to feedback", ["Feedback", "Good response"], [["A confirmed bug", "Thank them, fix it, add a test and record it"], ["A design disagreement", "Explain the reasoning and the trade-off; change if the argument is better"], ["A request you cannot meet in time", "State it as a known limit and future work"], ["A misunderstanding", "Improve the documentation so the next reader does not make it"]]),
        p("The attitude matters as much as the code. Reviewers respect students who welcome criticism, record decisions and do not defend mistakes. You are practising for a profession where this is the daily work."),
        miniQuiz("ext-mini", [["How should you respond to a confirmed bug?", ["Argue", "Thank them, fix it, add a test and record it", "Ignore it", "Delete the code"], 1, "Learn and improve."]]),
        warn("A capstone review is not a professional audit. Real value needs independent experts."),
      ],
      points: ["Provide a frozen version, spec, threat model and known issues.", "Welcome feedback and record decisions."],
      check: [["Known issues should be:", ["Listed honestly", "Hidden", "Deleted", "Blamed on tools"], 0, "Trust grows from honesty."]],
    }),
  ],
  terms: [["Threat model", "A structured list of what could go wrong"], ["Residual risk", "A risk that remains after mitigation"], ["Static analysis", "Automated scanning for patterns"], ["Coverage", "How much code tests run"], ["Severity", "How serious an issue is"], ["Audit", "An independent professional review"]],
  practical: { title: "Practical: break your own project", intro: "With a friend if possible.", steps: ["Write your threat model.", "Walk through the checklist and rate each finding.", "Fix the high and medium findings or write why you accept them.", "Ask someone else to try to break it."] },
  quiz: [
    ["A threat model lists:", ["Assets, actors and threats", "Colours", "Fonts", "Prices"], 0, "A structured way to think."],
    ["High findings must be:", ["Fixed before launch", "Accepted silently", "Ignored", "Renamed"], 0, "Core promises."],
    ["Residual risks are:", ["Written down", "Hidden", "Ignored", "Deleted"], 0, "Be honest about what a mitigation leaves behind."],
    ["Coverage shows:", ["Which code tests run", "That code is correct", "Gas", "Security"], 0, "Gaps in testing."],
    ["Fresh eyes help because:", ["You are too close to your work", "Tools fail", "Tests are slow", "Rules require"], 0, "Different problems."],
    ["A capstone review is:", ["Not a professional audit", "A full audit", "Insurance", "Legal advice"], 0, "State this clearly."],
    ["Feedback should be:", ["Welcomed and recorded", "Fought", "Ignored", "Hidden"], 0, "Professional attitude."],
  ],
});

const M5 = module_({
  slug: "deploy-and-document", title: "Deploy and document", hours: 2.5, level: "Applied skills",
  summary: "A rehearsed test-network deployment, verified source, a README, a user guide and an honest cost estimate.",
  outcome: "You can deploy to a test network repeatably, verify the source, write documentation that others can follow and estimate running costs.",
  intro: "Code that nobody can run or understand has little value. This module covers the last mile: deploying the same way every time, proving what is deployed, and writing the documents that make your work usable and credible.",
  topics: [
    topic({
      title: "A rehearsed deployment", slug: "deployment",
      blocks: [
        flow("Deployment path", ["Run all tests", "Deploy to a local network", "Deploy to a public test network", "Wait, then verify the source on the block explorer", "Check roles and settings on the explorer", "Save addresses and links in the repository", "Run the demo against the deployed contract"]),
        table("Deployment checklist", ["Check", "Why"], [["Network name and chain id confirmed on screen", "Avoid deploying to the wrong network"], ["Admin and pauser addresses typed twice and compared", "A typo here is permanent"], ["Deployer holds no roles afterwards", "Power sits with the intended accounts"], ["Source verified on the explorer", "Anyone can read what runs"], ["Addresses saved to a file in the repository", "Reproducibility"], ["Demo run against the deployed contract", "Proof that it works"]]),
        miniQuiz("depl-mini", [["Why type the admin address twice?", ["It is traditional", "A typo in a permanent role assignment cannot be undone", "Wallets require it", "It lowers gas"], 1, "Check what cannot be undone."]]),
      ],
      points: ["Rehearse locally, deploy to a test network, verify source and save addresses.", "Check roles and settings after deployment."],
      check: [["Verified source lets anyone:", ["Read what the contract does", "Withdraw funds", "Change roles", "Pause it"], 0, "Transparency."]],
    }),
    topic({
      title: "Documentation people will read", slug: "documentation",
      blocks: [
        table("The documents a reviewer expects", ["Document", "Contents"], [["README", "What it is, what it is not, how to run it, links, limits"], ["User guide", "How a registrar issues and revokes; how an employer verifies"], ["Design document", "Architecture, data, roles, decisions with reasons"], ["Threat model", "Assets, threats, mitigations and residual risks"], ["Test report", "What is tested, coverage figure and how to run the tests"], ["Deployment record", "Network, addresses, roles, transaction links"]]),
        list("Writing tips", ["Write for a smart person who has never seen the project.", "Put the most important thing first.", "Use short sentences and plain words.", "Show screenshots or a short video.", "State limits in the first screen of the README.", "Test your instructions by asking someone to follow them."], true),
        explorer({ id: "cap-cost", title: "Running cost", intro: "Change the costs to see the first-year cost per user. A teaching model in rupees.", inputs: [{ id: "monthly", label: "Monthly running cost", min: 0, max: 20000, step: 100, value: 2800 }, { id: "review", label: "One-off review", min: 0, max: 500000, step: 5000, value: 150000 }, { id: "users", label: "Active users", min: 10, max: 5000, step: 10, value: 500 }], outputs: [{ label: "First-year cost per user (rupees)", expr: "(monthly * 12 + review) / users", unit: "rs" }] }),
        miniQuiz("doc-mini", [["How do you know your instructions work?", ["You wrote them", "Someone else can follow them successfully", "They are long", "They have screenshots"], 1, "Test the documentation."]]),
      ],
      points: ["Provide README, user guide, design, threat model, test report and deployment record.", "Test your instructions on someone else."],
      check: [["The first screen of the README should state:", ["What it is and its limits", "Only a logo", "Only a version", "Only a licence"], 0, "Honesty first."]],
    }),
    topic({
      title: "Operations and honest sustainability", slug: "operations",
      blocks: [
        table("If the project were real", ["Area", "Need"], [["Hosting", "A place for the verification page and the dashboard"], ["RPC provider", "Reliable chain access with a fallback"], ["Monitoring", "Alerts for lag, errors and unusual events"], ["Key management", "Hardware wallets and a multi-signature admin"], ["Support", "Someone to answer users and handle disputes"], ["Legal and privacy", "Advice for the country and the data involved"], ["Security review", "An independent audit before real value or legal weight"]]),
        p("A capstone does not need all of this, but your report should show you know what a real deployment would require. Estimating the costs and naming the responsibilities is part of professional maturity."),
        mistakes(["Presenting a test-network demo as production-ready.", "Forgetting that someone must pay for hosting and keys to be looked after.", "Ignoring privacy law because it is 'only a student project'."]),
        miniQuiz("ops-mini", [["Why describe real-world operations in a capstone?", ["To make it longer", "It shows you understand what a real deployment requires", "It is required by law", "It replaces testing"], 1, "It shows professional maturity."]]),
      ],
      points: ["Name the operational needs of a real deployment.", "State clearly that the capstone is not production-ready."],
      check: [["A student project still needs:", ["Honest statements of limits", "No documentation", "No tests", "A press release"], 0, "Integrity means stating limits plainly."]],
    }),
  ],
  terms: [["Deployment record", "A file with network, addresses and transaction links"], ["Verified source", "Source code matching the deployed bytecode"], ["User guide", "Instructions for people who use the system"], ["README", "The project's front page"], ["RPC provider", "A service giving access to a node"], ["Runbook", "Instructions for handling incidents"]],
  practical: { title: "Practical: deploy and document", intro: "On a public test network.", steps: ["Deploy with your script and verify the source.", "Save the addresses and links.", "Write the README and the user guide.", "Ask someone to follow your instructions and fix what confuses them."] },
  quiz: [
    ["Verify the source so that:", ["Anyone can read it", "It is hidden", "It costs gas", "It is private"], 0, "Transparency."],
    ["Deployment should be:", ["Rehearsed and scripted", "Improvised", "Secret", "Rushed"], 0, "Repeatable."],
    ["A README states:", ["What it is and is not", "Only a logo", "Only a licence", "Nothing"], 0, "Honest limits."],
    ["User guides are for:", ["People who use the system", "Only developers", "Only auditors", "Nobody"], 0, "Plain language."],
    ["A deployment record contains:", ["Addresses and links", "Passwords", "Private keys", "Jokes"], 0, "Reproducibility."],
    ["A capstone is:", ["Not production-ready", "Always production-ready", "Insured", "Audited"], 0, "Say clearly that it is not production-ready."],
    ["Instructions should be tested:", ["On someone else", "Never", "Only by you", "By bots only"], 0, "Real feedback."],
  ],
});

const M6 = module_({
  slug: "defence-and-career", title: "Defence, presentation and career", hours: 2.5, level: "Applied skills",
  summary: "A five-minute demo, answering hard questions honestly, and turning the capstone into a story for employers.",
  outcome: "You can present a clear demo, defend your decisions with integrity and describe your project and skills to employers.",
  intro: "The defence is where a capstone becomes a credential. Reviewers are not looking for perfection; they are looking for understanding, honesty and professional habits. This module prepares you to show them all three, and to carry the project into your career.",
  topics: [
    topic({
      title: "The five-minute demo", slug: "demo",
      blocks: [
        code("markdown", demoScript, "demo-script.md"),
        table("Demo principles", ["Principle", "Practice"], [["One story", "Follow one user from problem to result"], ["Show, do not describe", "Live actions on the test network"], ["Break something on purpose", "Change a file and show the mismatch"], ["Have a backup", "A recorded video and the links in a text file"], ["Keep to time", "Rehearse twice with a timer"], ["Finish with limits", "State what it cannot do before they ask"]]),
        miniQuiz("demo-mini", [["Why prepare a backup recording?", ["Live demos always work", "Networks can be slow or fail at the worst moment", "It is required", "It is shorter"], 1, "Plan for failure."]]),
      ],
      points: ["Follow one user story, show it live, break something on purpose and keep a backup.", "State limits before the questions."],
      check: [["A good demo shows:", ["One clear story", "Every feature", "Only slides", "Only code"], 0, "Clarity beats volume."]],
    }),
    topic({
      title: "Defending your decisions", slug: "defence",
      blocks: [
        table("Questions you should expect", ["Question", "What a strong answer includes"], [["Why a blockchain and not a database?", "The trade-off, honestly, and what the ledger adds in your case"], ["What is your biggest risk?", "A specific risk, your mitigation and what remains"], ["How do you know it works?", "Your tests, including failure cases and a property test"], ["What would you do with more time?", "A realistic list: audit, dashboard, privacy review"], ["What did you get wrong?", "A real mistake and what you learned"], ["How would this fail in the real world?", "Operational, legal and human failure modes"]]),
        list("Habits of a strong defence", ["Answer the question asked, briefly.", "Say 'I do not know' when you do not, and say how you would find out.", "Never claim your project is unhackable or perfectly secure.", "Admit mistakes and explain the fix.", "Know every line you present; do not show what you cannot explain.", "Thank the reviewers for hard questions."], true),
        miniQuiz("def-mini", [["What should you say when you do not know an answer?", ["Invent something", "That you do not know and how you would find out", "Change the subject", "Say it does not matter"], 1, "Honesty builds credibility."]]),
      ],
      points: ["Prepare for the standard questions and answer honestly.", "Never claim perfect security."],
      check: [["Claims of 'unhackable' are:", ["A red flag", "Impressive", "Required", "Expected"], 0, "Overclaiming destroys trust."]],
    }),
    topic({
      title: "Telling the story to employers", slug: "career",
      blocks: [
        table("Turning a capstone into career material", ["Material", "What to include"], [["CV bullet", "Built and tested a credential registry on an Ethereum test network with role-based access, revocation and a hash-only privacy design; 15 tests including a randomised property test"], ["Portfolio page", "Problem, screenshot or video, architecture diagram, link to code and the threat model"], ["Interview story", "A decision you made and why, a mistake you fixed, and a risk you managed"], ["Short pitch", "One sentence on the problem, one on your solution, one on the honest limits"]]),
        list("Next steps after the course", ["Read audit reports of real projects and compare them with your threat model.", "Contribute a small fix to an open-source project.", "Try capture-the-flag exercises on contract security.", "Build a second project that uses a different pattern.", "Join local communities and ask for reviews.", "Keep your portfolio tidy and your claims honest."], true),
        p("Employers in this field have seen many projects that overclaim. The ones that stand out are small, finished, tested and honest. Your capstone is evidence that you can be trusted with more."),
        miniQuiz("career-mini", [["What makes a capstone stand out to an employer?", ["Big claims", "It is finished, tested, well documented and honest about its limits", "A token with a logo", "A very long README"], 1, "Quality and honesty."]]),
        warn("This course is education and not a guarantee of employment. Keep learning, and treat security with humility."),
      ],
      points: ["Turn the project into a CV bullet, a portfolio page and an interview story.", "Honest, finished and tested work stands out."],
      check: [["An interview story should include:", ["A decision, a mistake and a managed risk", "Only success", "Only code", "A joke"], 0, "Shows judgement."]],
    }),
  ],
  terms: [["Defence", "Explaining and justifying your project to reviewers"], ["Demo", "A live demonstration"], ["Backup plan", "What you do if the live demo fails"], ["Overclaiming", "Claiming more than you can show"], ["Portfolio", "A showcase of your work"], ["Interview story", "A short narrative that shows your judgement"]],
  practical: { title: "Practical: rehearse", intro: "With a timer and a friend.", steps: ["Run the five-minute demo twice.", "Ask your friend to challenge you with six questions.", "Write your answers after each rehearsal.", "Record the backup video."] },
  quiz: [
    ["A demo should follow:", ["One story", "All features", "Only slides", "Only code"], 0, "Clear and short."],
    ["Break something on purpose to:", ["Show the system catches it", "Impress", "Waste time", "Hide bugs"], 0, "It proves the system really catches problems."],
    ["A backup protects against:", ["Network or demo failure", "Questions", "Bugs", "Fees"], 0, "Plan for trouble."],
    ["When you do not know:", ["Say so and how you would find out", "Invent", "Argue", "Leave"], 0, "Honesty builds credibility with reviewers."],
    ["Never claim:", ["Perfect security", "You tested it", "It has limits", "It is a project"], 0, "Overclaiming."],
    ["CV bullets should be:", ["Specific and honest", "Vague", "Inflated", "Long"], 0, "Facts and numbers."],
    ["Keep learning by:", ["Reading audits and building more", "Stopping", "Hiding work", "Avoiding feedback"], 0, "Practice builds reliable skills."],
  ],
});

export default course({
  slug: "blockchain-capstone-project", title: "Blockchain Capstone Project", tagline: "Plan, design, build, secure, deploy, document and defend one complete blockchain project", level: "Professional", hours: 16,
  summary: "The finishing course of the Blockchain & Web3 track. It guides you through one complete project from a real problem to a defended result: choosing and scoping with testable user stories and an honest comparison with a database, designing the architecture and a complete reference contract, building with tests first and randomised property tests, reviewing your own security with a threat model, deploying to a test network with verified source, writing documentation, and preparing a five-minute demonstration and a confident, honest defence. The reference contract compiles with solc against OpenZeppelin 5 and the JavaScript is syntax-checked. The platform does not run your project: you build and test it in your own tools on a test network, and nothing here is a security audit.",
  modules: [M1, M2, M3, M4, M5, M6],
  capstone: capstone({
    title: "Final project: write your capstone report", summary: "Write the report of your complete project and pass the final assessment.",
    intro: "This is the culmination of the track. Your capstone report is the document a reviewer reads before your defence: what you built and why, the requirements, the architecture and implementation, how you checked security and quality, how you deployed it, the results and your honest limits. Write it about the project you have built in your own tools; the reference registry is a fine choice. Then take the final assessment covering the whole course.",
    steps: ["Work through the **Final project: write your capstone report** lab.", "Check each claim against your tests, your threat model and your deployment record.", "Take the final assessment below."], projectTitle: "A capstone report",
    quiz: [
      ["A good capstone problem has:", ["A real user and a finishable scope", "A token", "A huge scope", "No users"], 0, "Problem first, technology second."],
      ["A testable user story states:", ["An observable result", "A library name", "A colour", "A fee"], 0, "If you cannot test it, you cannot demonstrate it."],
      ["The honest answer to 'why not a database?' is:", ["The trade-off and what the ledger adds here", "Databases are bad", "Blockchain is more secure", "No answer"], 0, "Honesty is credible."],
      ["Personal data in the reference design is kept:", ["Off the chain", "On the chain", "In event names", "In role names"], 0, "Only fingerprints are stored."],
      ["Revocation during a pause is:", ["Allowed so corrections remain possible", "Blocked", "Random", "Secret"], 0, "A pause must not stop corrections."],
      ["A property test:", ["Tries to break an always-true rule with random actions", "Checks one example", "Measures gas", "Checks names"], 0, "Randomised rules."],
      ["After deployment, the deployer should hold:", ["No powerful roles", "All roles", "The keys of issuers", "The pause only"], 0, "Power goes to the admin and the pauser."],
      ["Severity high means:", ["Fix before any launch", "Fix someday", "Ignore", "Rename"], 0, "It breaks a core promise."],
      ["Residual risks should be:", ["Written down", "Hidden", "Ignored", "Deleted"], 0, "Be honest about what remains."],
      ["Verified source on the explorer lets:", ["Anyone read what the contract does", "Anyone withdraw", "Anyone mint", "Anyone pause"], 0, "Transparency."],
      ["In a defence, if you do not know an answer you:", ["Say so and how you would find out", "Invent one", "Change the subject", "Argue"], 0, "Honesty builds credibility."],
      ["A capstone on a test network is:", ["Not production-ready and not audited", "A finished product", "An investment", "A bank"], 0, "State this clearly."],
    ],
  }),
  labs,
  skills: [{ id: SK, label: "Blockchain capstone" }],
  badges: [
    { id: "scope-keeper", title: "Scope keeper", description: "Defined a minimum viable capstone.", when: { all: ["c1-scope-mvp"] } },
    { id: "test-first", title: "Test first", description: "Matched rules to the right tests.", when: { all: ["c5-tests-first"] } },
    { id: "defender", title: "Defender", description: "Prepared a demo and defence.", when: { all: ["c11-demo-script"] } },
    { id: "capstone-complete", title: "Capstone complete", description: "Wrote a complete capstone report.", when: { all: ["cap-report"] } },
  ],
  landing: {
    hero: { eyebrow: "Professional · Reference contract compiled, tests and scripts included", title: "Your blockchain capstone: from problem to defended project", subtitle: "Choose a problem, write testable stories, design with a complete reference contract, build test-first, review your own security, deploy to a test network, document and defend. Every task is checked and explained.", level: "Professional", outcomeLine: "After this course you have one complete, tested, documented and honestly described blockchain project and the story to present it." },
    outcomes: [
      { icon: "docs", title: "Scope with discipline", text: "Stories, an MVP and non-goals." },
      { icon: "safety", title: "Design with roles", text: "A reference contract with least privilege and safe pausing." },
      { icon: "sheet", title: "Plan with numbers", text: "Estimates, progress tracking and running costs." },
      { icon: "cloud", title: "Build test-first", text: "Unit, boundary and property tests, plus a repeatable deployment." },
      { icon: "sort", title: "Review yourself", text: "Threat models, severities and honest residual risks." },
      { icon: "word", title: "Present and defend", text: "A demo script, answers and a capstone report." },
    ],
    projects: [
      { title: "A project proposal", text: "Problem, users, stories, non-goals and risks.", module: "choose-and-scope" },
      { title: "A threat model", text: "Assets, actors, threats and residual risks.", module: "security-and-quality" },
      { title: "A demo and defence plan", text: "Script, answers and limits.", module: "defence-and-career" },
      { title: "A capstone report", text: "The complete story of your project.", module: "capstone" },
    ],
    tools: [{ icon: "docs", title: "Compiled reference contract and checked scripts", text: "Solidity compiled with solc; tests, deployment and verification code syntax-checked." }, { icon: "sheet", title: "Spreadsheet lab", text: "Effort, progress and running costs." }, { icon: "word", title: "Document editor", text: "Proposals, threat models, scripts and reports." }],
    assessment: ["Finish the required labs in each module: they are checked automatically and explained when something is missing.", "Pass each module quiz (70% or more). Short tests inside the lessons give instant feedback.", "Write the capstone report and pass the final assessment."],
    faq: [
      { q: "Does the platform build or run my project?", a: "No. The labs check your plans, calculations and writing. You build, test and deploy in your own tools on a test network." },
      { q: "Do I have to use the credential registry?", a: "No. It is a reference you can follow or adapt. Any well-scoped project of your own works, as long as you can test and defend it." },
      { q: "Is this a security audit or a job guarantee?", a: "No. Your self-review is good practice but not a professional audit, and no course guarantees employment." },
    ],
  },
  catalogue: {
    hours: "~16 hrs", weeks: "~6 weeks", pace: "3 hrs/wk", badge: "Blockchain Capstone",
    brief: "Plan, design, build, secure, deploy, document and defend one complete blockchain project with a reference design to follow.",
    learn: ["Scoping a real problem with testable user stories and an MVP", "Architecture and a complete reference contract with roles and safe pausing", "Test-first building, property tests and repeatable deployment", "A threat model, self-review and honest severity ratings", "Test-network deployment, verified source and documentation", "A five-minute demo, a confident defence and career material"],
    handsOn: "Write the capstone report for a complete, tested, deployed and documented blockchain project.",
    outcome: "Finish one complete blockchain project and present it with integrity.",
  },
});
