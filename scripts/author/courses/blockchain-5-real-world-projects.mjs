import { capstone, ck, classifyLab, code, course, def, explorer, flow, list, miniQuiz, mistakes, module_, p, S, sheetLab, table, tip, topic, W, warn, wordLab } from "../kit.mjs";

const SK = "bc-projects";

const tokenAndVault = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Project 1, part A: the token. A fixed supply is minted once to the treasury and never again.
contract ProjectToken is ERC20, ERC20Burnable {
    constructor(address treasury, uint256 supply) ERC20("Project Token", "PRJ") {
        _mint(treasury, supply);
    }
}

// Project 1, part B: a vault that releases tokens to several people on their own schedules.
contract VestingVault {
    using SafeERC20 for IERC20;

    struct Grant {
        uint128 total;
        uint128 claimed;
        uint64 cliff;      // seconds after the vault's start
        uint64 duration;   // seconds after the vault's start when everything is vested
    }

    IERC20 public immutable token;
    address public immutable admin;
    uint256 public immutable start;
    uint256 public totalAllocated;
    mapping(address => Grant) public grants;

    event GrantCreated(address indexed beneficiary, uint256 total, uint64 cliffSeconds, uint64 durationSeconds);
    event Claimed(address indexed beneficiary, uint256 amount);

    error NotAdmin();
    error AlreadyGranted();
    error BadSchedule();
    error Underfunded();
    error NothingToClaim();

    constructor(IERC20 token_, address admin_) {
        token = token_;
        admin = admin_;
        start = block.timestamp;
    }

    function createGrant(address beneficiary, uint256 total, uint64 cliffSeconds, uint64 durationSeconds) external {
        if (msg.sender != admin) revert NotAdmin();
        if (grants[beneficiary].total != 0) revert AlreadyGranted();
        if (total == 0 || total > type(uint128).max || durationSeconds == 0 || cliffSeconds > durationSeconds) revert BadSchedule();
        // The vault must already hold enough tokens to honour every promise it makes.
        if (token.balanceOf(address(this)) < totalAllocated + total) revert Underfunded();
        totalAllocated += total;
        grants[beneficiary] = Grant(uint128(total), 0, cliffSeconds, durationSeconds);
        emit GrantCreated(beneficiary, total, cliffSeconds, durationSeconds);
    }

    function vested(address beneficiary) public view returns (uint256) {
        Grant memory g = grants[beneficiary];
        if (g.total == 0) return 0;
        uint256 elapsed = block.timestamp - start;
        if (elapsed < g.cliff) return 0;
        if (elapsed >= g.duration) return g.total;
        return (uint256(g.total) * elapsed) / g.duration;
    }

    function claim() external {
        Grant storage g = grants[msg.sender];
        uint256 amount = vested(msg.sender) - g.claimed;
        if (amount == 0) revert NothingToClaim();
        g.claimed += uint128(amount);
        emit Claimed(msg.sender, amount);
        token.safeTransfer(msg.sender, amount);
    }
}`;

const registry = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

// Project 2: certificate verification. Only a fingerprint (hash) of each certificate is stored, never the document or personal data.
contract CertificateRegistry is AccessControl {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    struct Record {
        bytes32 docHash;
        uint64 issuedAt;
        address issuer;
        bool revoked;
    }

    mapping(bytes32 => Record) private records;

    event Issued(bytes32 indexed certId, bytes32 docHash, address indexed issuer);
    event Revoked(bytes32 indexed certId, address indexed by);

    error AlreadyExists();
    error Unknown();

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function issue(bytes32 certId, bytes32 docHash) external onlyRole(ISSUER_ROLE) {
        if (records[certId].issuedAt != 0) revert AlreadyExists();
        records[certId] = Record(docHash, uint64(block.timestamp), msg.sender, false);
        emit Issued(certId, docHash, msg.sender);
    }

    function revoke(bytes32 certId) external onlyRole(ISSUER_ROLE) {
        Record storage r = records[certId];
        if (r.issuedAt == 0) revert Unknown();
        r.revoked = true;
        emit Revoked(certId, msg.sender);
    }

    // Anyone can check: does this certificate id exist, does the document match, and has it been revoked?
    function verify(bytes32 certId, bytes32 docHash)
        external
        view
        returns (bool valid, bool revoked, address issuer, uint64 issuedAt)
    {
        Record memory r = records[certId];
        if (r.issuedAt == 0) return (false, false, address(0), 0);
        return (r.docHash == docHash && !r.revoked, r.revoked, r.issuer, r.issuedAt);
    }
}`;

const verifyPage = `// verify.js — a verification page that never uploads the certificate anywhere.
// The browser computes the fingerprint locally and compares it with the chain.
const { Contract, JsonRpcProvider, id } = require("ethers");

const REGISTRY_ABI = [
  "function verify(bytes32 certId, bytes32 docHash) view returns (bool valid, bool revoked, address issuer, uint64 issuedAt)"
];

async function sha256Hex(file) {
  const bytes = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", bytes);          // built into every modern browser
  return "0x" + Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyCertificate(registryAddress, rpcUrl, certNumber, file) {
  const provider = new JsonRpcProvider(rpcUrl);
  const registry = new Contract(registryAddress, REGISTRY_ABI, provider);

  const certId = id(certNumber);               // keccak256 of the printed certificate number, as a bytes32
  const docHash = await sha256Hex(file);       // fingerprint of the exact file the holder presents

  const [valid, revoked, issuer, issuedAt] = await registry.verify(certId, docHash);
  if (revoked) return { status: "revoked", message: "This certificate was revoked by the issuer." };
  if (valid) {
    return { status: "valid", message: "Matches the record issued on " + new Date(Number(issuedAt) * 1000).toDateString() + " by " + issuer };
  }
  return { status: "not-found-or-changed", message: "No matching record. The number is wrong or the document was altered." };
}`;

const ballot = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Project 3: a simple ballot. Teaching version only: votes are PUBLIC, so it must not be used for real elections.
contract Ballot {
    address public immutable chair;
    uint256 public immutable deadline;
    string[] private _options;
    mapping(address => bool) public eligible;
    mapping(address => bool) public hasVoted;
    mapping(uint256 => uint256) public tally;

    event Registered(address indexed voter);
    event Voted(address indexed voter, uint256 indexed option);

    error NotChair();
    error VotingClosed();
    error NotEligible();
    error AlreadyVoted();
    error BadOption();

    constructor(string[] memory options, uint256 durationSeconds) {
        require(options.length >= 2, "Need at least two options");
        chair = msg.sender;
        deadline = block.timestamp + durationSeconds;
        for (uint256 i = 0; i < options.length; i++) {
            _options.push(options[i]);
        }
    }

    function optionCount() external view returns (uint256) {
        return _options.length;
    }

    function optionName(uint256 i) external view returns (string memory) {
        return _options[i];
    }

    function register(address[] calldata voters) external {
        if (msg.sender != chair) revert NotChair();
        if (block.timestamp >= deadline) revert VotingClosed();
        for (uint256 i = 0; i < voters.length; i++) {
            eligible[voters[i]] = true;
            emit Registered(voters[i]);
        }
    }

    function vote(uint256 option) external {
        if (block.timestamp >= deadline) revert VotingClosed();
        if (!eligible[msg.sender]) revert NotEligible();
        if (hasVoted[msg.sender]) revert AlreadyVoted();
        if (option >= _options.length) revert BadOption();
        hasVoted[msg.sender] = true;
        tally[option] += 1;
        emit Voted(msg.sender, option);
    }
}`;

const commitReveal = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// A commit-and-reveal ballot hides the choice while voting is open, so early results cannot influence later voters.
// It still reveals every choice afterwards and links it to an address; it is NOT a secret ballot.
contract CommitRevealBallot {
    uint256 public immutable commitEnd;
    uint256 public immutable revealEnd;
    uint256 public immutable optionCount;
    mapping(address => bytes32) public commitments;
    mapping(address => bool) public revealed;
    mapping(uint256 => uint256) public tally;

    error WrongPhase();
    error AlreadyCommitted();
    error NoCommitment();
    error AlreadyRevealed();
    error BadReveal();
    error BadOption();

    constructor(uint256 numberOfOptions, uint256 commitSeconds, uint256 revealSeconds) {
        optionCount = numberOfOptions;
        commitEnd = block.timestamp + commitSeconds;
        revealEnd = block.timestamp + commitSeconds + revealSeconds;
    }

    // The commitment is hash(voter, option, salt). Without the salt, nobody can work out the option.
    function commit(bytes32 commitment) external {
        if (block.timestamp >= commitEnd) revert WrongPhase();
        if (commitments[msg.sender] != bytes32(0)) revert AlreadyCommitted();
        commitments[msg.sender] = commitment;
    }

    function reveal(uint256 option, bytes32 salt) external {
        if (block.timestamp < commitEnd || block.timestamp >= revealEnd) revert WrongPhase();
        if (commitments[msg.sender] == bytes32(0)) revert NoCommitment();
        if (revealed[msg.sender]) revert AlreadyRevealed();
        if (option >= optionCount) revert BadOption();
        if (keccak256(abi.encode(msg.sender, option, salt)) != commitments[msg.sender]) revert BadReveal();
        revealed[msg.sender] = true;
        tally[option] += 1;
    }
}`;

const ticket = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

// Project 4: event tickets. Each ticket is an NFT; gate staff mark it used; a used ticket can no longer be sold or moved.
contract EventTicket is ERC721, AccessControl {
    bytes32 public constant GATE_ROLE = keccak256("GATE_ROLE");

    uint256 public immutable maxSupply;
    uint256 public immutable price;
    uint256 public sold;
    mapping(uint256 => bool) public used;

    event CheckedIn(uint256 indexed tokenId, address indexed holder);

    error SoldOut();
    error WrongPayment();
    error TicketUsed();
    error AlreadyUsed();
    error WithdrawFailed();

    constructor(address admin, uint256 supply, uint256 ticketPrice) ERC721("Campus Event Ticket", "TIX") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        maxSupply = supply;
        price = ticketPrice;
    }

    function buy() external payable returns (uint256 id) {
        if (sold >= maxSupply) revert SoldOut();
        if (msg.value != price) revert WrongPayment();
        id = sold++;
        _safeMint(msg.sender, id);
    }

    function checkIn(uint256 id) external onlyRole(GATE_ROLE) {
        address holder = _requireOwned(id);
        if (used[id]) revert AlreadyUsed();
        used[id] = true;
        emit CheckedIn(id, holder);
    }

    // Every transfer, sale and burn passes through _update. A used ticket is frozen.
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        if (used[tokenId]) revert TicketUsed();
        return super._update(to, tokenId, auth);
    }

    function withdraw() external onlyRole(DEFAULT_ADMIN_ROLE) {
        (bool ok, ) = msg.sender.call{value: address(this).balance}("");
        if (!ok) revert WithdrawFailed();
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}`;

const assetRegistry = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

// Project 5: an asset register run by a trusted registrar. The chain keeps a tamper-evident history;
// whether an entry has legal force is decided by law and by the registrar, not by this code.
contract AssetRegistry is AccessControl {
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    struct Asset {
        address owner;
        bytes32 detailsHash;   // fingerprint of the paper or scanned record kept off-chain
        address pendingBuyer;
    }

    uint256 public nextId;
    mapping(uint256 => Asset) public assets;

    event Registered(uint256 indexed id, address indexed owner, bytes32 detailsHash);
    event TransferProposed(uint256 indexed id, address indexed from, address indexed to);
    event Transferred(uint256 indexed id, address indexed from, address indexed to);

    error NotOwner();
    error NothingPending();

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function register(address owner, bytes32 detailsHash) external onlyRole(REGISTRAR_ROLE) returns (uint256 id) {
        id = nextId++;
        assets[id] = Asset(owner, detailsHash, address(0));
        emit Registered(id, owner, detailsHash);
    }

    // The owner names the buyer...
    function proposeTransfer(uint256 id, address buyer) external {
        if (assets[id].owner != msg.sender) revert NotOwner();
        assets[id].pendingBuyer = buyer;
        emit TransferProposed(id, msg.sender, buyer);
    }

    // ...and the registrar completes it only after checking the real-world paperwork.
    function approveTransfer(uint256 id) external onlyRole(REGISTRAR_ROLE) {
        Asset storage a = assets[id];
        address buyer = a.pendingBuyer;
        if (buyer == address(0)) revert NothingPending();
        address previous = a.owner;
        a.owner = buyer;
        a.pendingBuyer = address(0);
        emit Transferred(id, previous, buyer);
    }
}`;

const readmeSample = `# Campus Certificates — verifiable certificates on a test network

A small system for issuing certificates that anyone can check in seconds, without calling the college.

## What it does
- The registrar issues a certificate: only its fingerprint (SHA-256) and a certificate number are stored on-chain.
- Anyone can drop the PDF on the verification page; the browser computes the fingerprint locally and asks the contract.
- The issuer can revoke a certificate; the page then shows "revoked".

## What it is NOT
- Not a replacement for the college's legal records.
- No personal data is stored on the blockchain.
- Deployed to a public test network only. Not audited.

## Run it
    npm install
    npx hardhat test
    npx hardhat run scripts/deploy.js --network sepolia

## Architecture
Browser verification page -> RegistryCertificate contract (roles: admin, issuer) -> events -> small indexer for an issuer dashboard.

## Security notes
- Roles: admin is a multi-signature wallet; issuers are staff accounts.
- Threat model: see docs/threats.md (forged documents, stolen issuer key, wrong certificate number).
- Known limits: if the issuer key is stolen, fake certificates can be issued until it is revoked.`;

const labs = [
  classifyLab({
    id: "r1-scope", module: "project-craft", title: "Scope a portfolio project", level: "intermediate", minutes: 12, xp: 45, skills: [SK], required: true,
    objective: "Decide what belongs in a project that must be finished, understandable and honest.", scenario: "Portfolio projects fail by trying to do everything. Decide what belongs in a one-month project.",
    steps: ["Read each feature.", "Choose where it belongs.", "Press Check my work."],
    categories: [["must", "Must have"], ["later", "Later (list under future work)"], ["never", "Do not include"]],
    items: [["One contract that does the main job with tests", "must", "The core of the project."], ["A simple page that lets people use it", "must", "Shows the idea to non-developers."], ["A README that explains what it is and is not", "must", "Honesty and clarity."], ["Support for five different blockchains", "later", "Breadth before depth."], ["Real user money on the main network with no audit", "never", "Irresponsible."], ["A custom token launched to the public as an investment", "never", "Misleading and risky."], ["A short threat model and known limits", "must", "Shows judgement."], ["A mobile app version", "later", "Not needed to prove the idea."]],
  }),
  wordLab({
    id: "r2-brief", module: "project-craft", title: "Write a one-page project brief", level: "intermediate", minutes: 16, xp: 55, skills: [SK], required: false,
    objective: "Describe a project clearly enough that someone else could judge it and build it.",
    scenario: "Choose one of the five projects and write the brief you would give a reviewer before you start.",
    steps: ["Add Heading 2 sections: Problem, Users, What it does, What it does not do, Success looks like.", "Under What it does list at least three features in bullets.", "Under What it does not do state at least two limits.", "Mention that it will run on a test network.", "Keep it between 110 and 250 words."],
    checks: [
      ck("heads", "Five sections", "Use Heading 2.", "A clear brief.", W.heading(5, 2)),
      ck("order", "In order", "Problem, Users, What it does, What it does not do, Success looks like.", "From need to outcome.", W.order(["Problem", "Users", "What it does", "What it does not do", "Success looks like"])),
      ck("feat", "Three features", "Use the bullet button.", "List the features.", W.list(3, "ul")),
      ck("limits", "States limits", "Mention not, no or cannot in the limits.", "Be honest.", W.pattern("does not|not a |no real|cannot|only a test|not for", "limits")),
      ck("test", "Mentions a test network", "Mention a test network.", "No real value.", W.pattern("test network|testnet|test-network", "a test network")),
      ck("len", "Between 110 and 250 words", "Concise.", "One page.", W.words(110, 250)),
    ],
    solution: "<h2>Problem</h2><p>Employers cannot easily check whether a graduate's certificate is genuine, so they phone the college or trust a PDF that anyone could edit.</p><h2>Users</h2><p>Registrars who issue certificates, graduates who share them, and employers who check them.</p><h2>What it does</h2><ul><li>Lets the registrar issue a certificate by storing a fingerprint of the document on a blockchain.</li><li>Lets anyone check a PDF against the record from a web page, without uploading the file.</li><li>Lets the registrar revoke a certificate if it was issued by mistake.</li></ul><h2>What it does not do</h2><p>It does not store names or marks on the chain, it is not a replacement for the college's legal records, and it does not decide who is allowed to issue certificates in the real world.</p><h2>Success looks like</h2><p>A reviewer can run the tests, deploy the contract on a test network, issue a sample certificate and verify it, then see a changed copy rejected.</p>",
  }),
  classifyLab({
    id: "r3-token-decisions", module: "project-1-token-system", title: "Token system decisions", level: "advanced", minutes: 12, xp: 45, skills: [SK], required: true,
    objective: "Judge design decisions in a token with a vesting vault.", scenario: "The ProjectToken and VestingVault pair makes several design decisions. Judge each as a reviewer would.",
    steps: ["Read each decision.", "Choose the verdict.", "Press Check my work."],
    categories: [["good", "Good"], ["risky", "Risky"], ["improve", "Could be improved"]],
    items: [["The token supply is minted once and there is no mint function", "good", "No dilution is possible."], ["createGrant refuses to promise more tokens than the vault holds", "good", "Promises are always funded."], ["One admin address can create grants", "improve", "Use a multi-signature wallet."], ["Grants cannot be cancelled or reduced", "improve", "Needs a considered policy for leavers."], ["The vault pays out using safeTransfer", "good", "Handles unusual tokens safely."], ["Claim updates the claimed amount before the transfer", "good", "Checks-effects-interactions."], ["An owner who can mint more of the token whenever they like", "risky", "Not present here, and it would be a red flag."], ["Vesting measured from the vault's start for all grants", "improve", "Per-person start dates are often needed."]],
  }),
  sheetLab({
    id: "r4-vesting-plan", module: "project-1-token-system", title: "Plan the vesting schedule", level: "advanced", minutes: 14, xp: 50, skills: [SK], required: false,
    objective: "Calculate the monthly release of a multi-person vesting plan and check how much insiders hold.",
    scenario: "Three groups receive tokens over different periods. The total supply is 100,000,000. (A teaching model.)",
    steps: ["In D2 work out the monthly release for the first group: tokens divided by months. Fill down to D4.", "In B6 add up the tokens granted.", "In B7 add up the monthly releases.", "In B8 find the longest schedule in months.", "In B9 work out the percentage of the total supply granted (B10 holds the supply).", "In B11 show Too much to insiders if B9 is above 10, otherwise Reasonable."],
    cells: { A1: "Group", B1: "Tokens", C1: "Months", D1: "Monthly", A2: "Founders", B2: "4800000", C2: "48", A3: "Advisers", B3: "1200000", C3: "24", A4: "Early staff", B4: "600000", C4: "12", A6: "Total granted", A7: "Total released per month", A8: "Longest schedule (months)", A9: "Share of supply (%)", A10: "Total supply", B10: "100000000", A11: "Verdict" }, view: { cols: 4, rows: 13 },
    checks: [
      ck("d2", "D2 is the monthly release", "=B2/C2", "Tokens over months.", S.formula("D2", { equals: 100000 })),
      ck("d4", "D4 is the monthly release", "=B4/C4", "Fill down.", S.formula("D4", { equals: 50000 })),
      ck("b6", "B6 is the total granted", "=SUM(B2:B4)", "Add the tokens.", S.formula("B6", { fns: ["SUM"], equals: 6600000 })),
      ck("b7", "B7 is the monthly total", "=SUM(D2:D4)", "Add the monthly column.", S.formula("B7", { fns: ["SUM"], equals: 200000 })),
      ck("b8", "B8 is the longest schedule", "=MAX(C2:C4)", "Largest number of months.", S.formula("B8", { fns: ["MAX"], equals: 48 })),
      ck("b9", "B9 is the share of supply", "=B6/B10*100", "Granted over supply, times 100.", S.formula("B9", { equals: 6600000 / 100000000 * 100 })),
      ck("b11", "B11 is the verdict", "=IF(B9>10,\"Too much to insiders\",\"Reasonable\")", "Compare with 10.", S.formula("B11", { fns: ["IF"], equals: "Reasonable" })),
    ],
    solution: { cells: Object.assign({ B6: "=SUM(B2:B4)", B7: "=SUM(D2:D4)", B8: "=MAX(C2:C4)", B9: "=B6/B10*100", B11: "=IF(B9>10,\"Too much to insiders\",\"Reasonable\")" }, ...[2, 3, 4].map((r) => ({ [`D${r}`]: `=B${r}/C${r}` }))) },
  }),
  classifyLab({
    id: "r5-cert-data", module: "project-2-certificate-verification", title: "On the chain or kept off it?", level: "advanced", minutes: 12, xp: 45, skills: [SK], required: true,
    objective: "Decide what a certificate system should put on a public blockchain.", scenario: "A public blockchain is permanent and readable by everyone. Decide what belongs on it.",
    steps: ["Read each item.", "Choose where it belongs.", "Press Check my work."],
    categories: [["chain", "On the blockchain"], ["off", "Kept off the blockchain"], ["both", "A fingerprint on-chain, the data off-chain"]],
    items: [["The graduate's full name and date of birth", "off", "Personal data must not be public and permanent."], ["The SHA-256 fingerprint of the certificate PDF", "chain", "Proves the exact document without revealing it."], ["The student's marks", "off", "Private information."], ["The certificate number and its revoked flag", "chain", "Needed for public verification."], ["The PDF file itself", "both", "Keep the file off-chain; store only its fingerprint."], ["The issuer's address", "chain", "Shows who issued it."], ["The student's home address", "off", "Never public."], ["A record that the college revoked the certificate", "chain", "Verifiers must be able to see it."]],
  }),
  wordLab({
    id: "r6-verification-policy", module: "project-2-certificate-verification", title: "Write the verification and privacy policy", level: "advanced", minutes: 18, xp: 60, skills: [SK], required: false,
    objective: "Explain to graduates and employers what the system records, what it does not and how mistakes are corrected.",
    scenario: "Write the policy page for the certificate verification system.",
    steps: ["Add Heading 2 sections: What is recorded, What is not recorded, How to verify, Mistakes and revocation.", "Under What is not recorded write a bulleted list of at least three items.", "Mention that the record cannot be erased from the blockchain.", "Mention a contact for corrections.", "Keep it between 120 and 260 words."],
    checks: [
      ck("heads", "Four sections", "Use Heading 2.", "A clear policy.", W.heading(4, 2)),
      ck("order", "In order", "What is recorded, What is not recorded, How to verify, Mistakes and revocation.", "From facts to fixes.", W.order(["What is recorded", "What is not recorded", "How to verify", "Mistakes and revocation"])),
      ck("not", "Three items not recorded", "Use the bullet button.", "Privacy.", W.list(3, "ul")),
      ck("erase", "States records cannot be erased", "Say the blockchain record cannot be erased.", "Permanence.", W.pattern("cannot be (erased|deleted|removed)|permanent", "that the record cannot be erased")),
      ck("contact", "Mentions a contact", "Mention a contact or e-mail.", "Corrections.", W.pattern("contact|e-?mail|registrar", "a contact")),
      ck("len", "Between 120 and 260 words", "Concise.", "Readable.", W.words(120, 260)),
    ],
    solution: "<h2>What is recorded</h2><p>For each certificate we record a certificate number, a fingerprint of the document, the date of issue and the address of the issuing office. We also record if it is later revoked.</p><h2>What is not recorded</h2><ul><li>Your name or date of birth.</li><li>Your marks, grades or courses.</li><li>Your address or any contact details.</li></ul><p>The blockchain record is public and permanent, so it cannot be erased. That is why it holds only a fingerprint, which does not reveal the document.</p><h2>How to verify</h2><p>Open the verification page, enter the certificate number and choose the file. Your browser computes the fingerprint on your own device, and nothing is uploaded. The page says valid, revoked or not found.</p><h2>Mistakes and revocation</h2><p>If a certificate was issued by mistake, the registrar revokes it, and the page then shows revoked. To report a problem, contact the registrar's office by e-mail with the certificate number.</p>",
  }),
  classifyLab({
    id: "r7-voting-properties", module: "project-3-voting-demonstration", title: "What does this voting design guarantee?", level: "advanced", minutes: 12, xp: 45, skills: [SK], required: true,
    objective: "Judge which voting properties a simple blockchain ballot does and does not provide.", scenario: "Voting looks easy but has many requirements. Decide which of them the simple Ballot contract meets.",
    steps: ["Read each property.", "Choose the verdict.", "Press Check my work."],
    categories: [["yes", "Provided"], ["no", "Not provided"], ["partial", "Partly, with conditions"]],
    items: [["Only registered voters can vote", "yes", "The eligible mapping checks it."], ["Nobody can vote twice from the same address", "yes", "hasVoted blocks it."], ["Votes are secret", "no", "Every vote and voter address is public."], ["The tally cannot be altered after voting", "yes", "Counts are on-chain and transparent."], ["Nobody can sell or coerce a vote", "no", "A public vote can be proved to a buyer."], ["One person cannot register many addresses", "partial", "Depends entirely on how the chair checks identity."], ["Early results cannot influence later voters", "no", "Running tallies are visible while voting is open."], ["The deadline is enforced", "yes", "The contract compares with the block time."]],
  }),
  sheetLab({
    id: "r8-tally", module: "project-3-voting-demonstration", title: "Count the votes and check validity", level: "advanced", minutes: 14, xp: 50, skills: [SK], required: false,
    objective: "Compute turnout, the winner and whether the result meets the rules.",
    scenario: "A society election has 500 registered voters. The rules: at least 50% turnout; a clear majority means the winner has more than half of the votes cast. (A teaching model.)",
    steps: ["In B7 add up the votes cast.", "In B8 work out the turnout as a percentage of eligible voters.", "In B9 find the winner's votes.", "In B10 work out the winner's share of the votes cast.", "In B11 show Invalid: no quorum if turnout is below 50, otherwise Valid: clear majority if the winner has more than half the votes cast, otherwise Valid: plurality only."],
    cells: { A1: "Input", B1: "Value", A2: "Registered voters", B2: "500", A3: "Votes for Option A", B3: "180", A4: "Votes for Option B", B4: "120", A5: "Votes for Option C", B5: "40", A7: "Votes cast", A8: "Turnout (%)", A9: "Winner's votes", A10: "Winner's share (%)", A11: "Result" }, view: { cols: 2, rows: 13 },
    checks: [
      ck("b7", "B7 is the votes cast", "=SUM(B3:B5)", "Add the three options.", S.formula("B7", { fns: ["SUM"], equals: 340 })),
      ck("b8", "B8 is the turnout", "=B7/B2*100", "Cast over registered, times 100.", S.formula("B8", { equals: 68 })),
      ck("b9", "B9 is the winner's votes", "=MAX(B3:B5)", "The largest count.", S.formula("B9", { fns: ["MAX"], equals: 180 })),
      ck("b10", "B10 is the winner's share", "=B9/B7*100", "Winner over cast, times 100.", S.formula("B10", { equals: 180 / 340 * 100 })),
      ck("b11", "B11 is the result", "=IF(B8<50,\"Invalid: no quorum\",IF(B9>B7/2,\"Valid: clear majority\",\"Valid: plurality only\"))", "Check quorum first, then the majority.", S.formula("B11", { fns: ["IF"], equals: "Valid: clear majority" })),
    ],
    solution: { cells: { B7: "=SUM(B3:B5)", B8: "=B7/B2*100", B9: "=MAX(B3:B5)", B10: "=B9/B7*100", B11: "=IF(B8<50,\"Invalid: no quorum\",IF(B9>B7/2,\"Valid: clear majority\",\"Valid: plurality only\"))" } },
  }),
  classifyLab({
    id: "r9-ticket-rules", module: "project-4-nft-ticketing", title: "Should the ticket contract allow it?", level: "advanced", minutes: 12, xp: 45, skills: [SK], required: true,
    objective: "Decide which actions the EventTicket contract should allow or refuse.", scenario: "The contract has rules about buying, checking in and moving tickets. Decide what should be allowed.",
    steps: ["Read each situation.", "Choose the outcome.", "Press Check my work."],
    categories: [["allow", "Allow"], ["refuse", "Refuse"], ["role", "Only gate staff"]],
    items: [["A buyer sends exactly the ticket price", "allow", "The normal purchase."], ["A buyer sends less than the price", "refuse", "WrongPayment."], ["The 501st ticket is bought when supply is 500", "refuse", "SoldOut."], ["Marking a ticket as used at the entrance", "role", "Only GATE_ROLE may call checkIn."], ["A holder gives an unused ticket to a friend", "allow", "Transfers before use are fine."], ["A holder sells a ticket that was already used", "refuse", "A used ticket is frozen."], ["Checking in the same ticket twice", "refuse", "AlreadyUsed."], ["The admin withdraws the ticket sales", "role", "Only the admin may withdraw."]],
  }),
  sheetLab({
    id: "r10-ticket-revenue", module: "project-4-nft-ticketing", title: "Ticket revenue with resale royalties", level: "advanced", minutes: 14, xp: 50, skills: [SK], required: false,
    objective: "Estimate primary sales and royalty income from resales.",
    scenario: "500 tickets are sold at 1,500 rupees each. Around 20% of them are resold at an average of 2,000 rupees, and the organiser receives a 5% royalty on resales. (A teaching model.)",
    steps: ["In B7 work out the primary sales.", "In B8 work out how many tickets are resold, rounded to a whole number.", "In B9 work out the total resale value.", "In B10 work out the royalty income.", "In B11 work out the total income."],
    cells: { A1: "Input", B1: "Value", A2: "Tickets sold", B2: "500", A3: "Ticket price (rupees)", B3: "1500", A4: "Share resold (%)", B4: "20", A5: "Average resale price (rupees)", B5: "2000", A6: "Royalty on resales (%)", B6: "5", A7: "Primary sales", A8: "Tickets resold", A9: "Resale value", A10: "Royalty income", A11: "Total income" }, view: { cols: 2, rows: 13 },
    checks: [
      ck("b7", "B7 is the primary sales", "=B2*B3", "Tickets times price.", S.formula("B7", { equals: 750000 })),
      ck("b8", "B8 is the tickets resold", "=ROUND(B2*B4/100,0)", "Share of tickets, rounded.", S.formula("B8", { fns: ["ROUND"], equals: 100 })),
      ck("b9", "B9 is the resale value", "=B8*B5", "Tickets resold times average price.", S.formula("B9", { equals: 200000 })),
      ck("b10", "B10 is the royalty", "=B9*B6/100", "Percentage of resale value.", S.formula("B10", { equals: 10000 })),
      ck("b11", "B11 is the total income", "=B7+B10", "Primary plus royalty.", S.formula("B11", { equals: 760000 })),
    ],
    solution: { cells: { B7: "=B2*B3", B8: "=ROUND(B2*B4/100,0)", B9: "=B8*B5", B10: "=B9*B6/100", B11: "=B7+B10" } },
  }),
  classifyLab({
    id: "r11-registry-claims", module: "project-5-records-registry-and-portfolio", title: "Technical claim or legal claim?", level: "advanced", minutes: 12, xp: 45, skills: [SK], required: true,
    objective: "Separate what a registry contract can honestly claim from what only law can decide.", scenario: "A blockchain registry can be tamper-evident, but it cannot decide who legally owns something. Sort each statement.",
    steps: ["Read each statement.", "Choose the kind of claim.", "Press Check my work."],
    categories: [["technical", "A technical claim the contract can support"], ["legal", "A legal claim the contract cannot make"], ["trust", "Depends on trusting the registrar"]],
    items: [["The history of changes to an entry cannot be secretly rewritten", "technical", "The chain keeps a visible history."], ["The person listed is the lawful owner of the land", "legal", "Law and the government register decide."], ["The record matches the paper deed", "trust", "Only as good as the registrar's check."], ["Only the registrar can approve a transfer", "technical", "Role-based access control."], ["A transfer on the chain legally ends the previous owner's rights", "legal", "Requires legal recognition."], ["Anyone can see who registered the entry and when", "technical", "Events are public."], ["The registrar will not register false entries", "trust", "No code can promise it."], ["The details fingerprint matches the document someone presents", "technical", "A hash comparison."]],
  }),
  wordLab({
    id: "r12-readme", module: "project-5-records-registry-and-portfolio", title: "Write a portfolio README", level: "advanced", minutes: 18, xp: 60, skills: [SK], required: false,
    objective: "Present a project honestly and clearly enough that a recruiter understands it in two minutes.",
    scenario: "Write the README for your best project of the five.",
    steps: ["Add a Heading 1 with the project name.", "Add Heading 2 sections: What it does, What it is not, How to run it, Architecture, Security notes.", "Under How to run it write a numbered list of at least three steps.", "Mention tests and a test network.", "Keep it between 130 and 280 words."],
    checks: [
      ck("title", "A title", "Use Heading 1.", "Name the project.", W.heading(1, 1)),
      ck("secs", "Five sections", "Use Heading 2.", "A complete README.", W.heading(5, 2)),
      ck("order", "In order", "What it does, What it is not, How to run it, Architecture, Security notes.", "From purpose to security.", W.order(["What it does", "What it is not", "How to run it", "Architecture", "Security notes"])),
      ck("run", "Three run steps", "Use the numbered list button.", "Reproducible.", W.list(3, "ol")),
      ck("tests", "Mentions tests", "Mention tests.", "Evidence.", W.pattern("test", "tests")),
      ck("net", "Mentions a test network", "Mention a test network.", "Honest scope.", W.pattern("test network|testnet|sepolia", "a test network")),
      ck("len", "Between 130 and 280 words", "Concise.", "Two minutes to read.", W.words(130, 280)),
    ],
    solution: "<h1>Campus Certificates</h1><h2>What it does</h2><p>Lets a college issue certificates whose fingerprints are stored on a blockchain, so that employers can verify a document in seconds. A verification page checks a file against the record without uploading it, and the registrar can revoke a certificate.</p><h2>What it is not</h2><p>It is not the college's legal record, it stores no personal data on the chain, and it runs on a test network only. It has not been audited.</p><h2>How to run it</h2><ol><li>Install the dependencies with npm install.</li><li>Run the test suite with npx hardhat test.</li><li>Deploy to a test network with the deploy script and open the verification page.</li></ol><h2>Architecture</h2><p>A browser page calls the CertificateRegistry contract, which has an admin role held by a multi-signature wallet and an issuer role held by staff. Events feed a small dashboard for the registrar.</p><h2>Security notes</h2><p>The threat model covers forged documents, stolen issuer keys and wrong certificate numbers. A stolen issuer key could issue fake certificates until it is removed, which is listed under known limits together with ideas for future work.</p>",
  }),
  wordLab({
    id: "cap-case-study", module: "capstone", title: "Final project: write a portfolio case study", level: "challenge", minutes: 40, xp: 170, skills: [SK], required: true,
    objective: "Present one of the five projects as a professional case study that shows judgement as well as code.",
    scenario: "Choose one project and write the case study you would put on your portfolio site.",
    steps: ["Add a Heading 1 with the project name and 'case study'.", "Add Heading 2 sections: The problem, My approach, Design decisions, Security and privacy, Testing, What I would do next, Honest limits.", "Under Design decisions list at least four decisions in bullets, each with its reason.", "Under Testing mention unit tests and at least one unusual case.", "Under Honest limits say that it is not audited and runs on a test network.", "Keep it between 340 and 680 words."],
    checks: [
      ck("t", "A title", "Use Heading 1.", "Name the case study.", W.heading(1, 1)),
      ck("secs", "Seven sections", "Use Heading 2.", "A complete case study.", W.heading(7, 2)),
      ck("order", "In order", "The problem, My approach, Design decisions, Security and privacy, Testing, What I would do next, Honest limits.", "A logical flow.", W.order(["The problem", "My approach", "Design decisions", "Security and privacy", "Testing", "What I would do next", "Honest limits"])),
      ck("dec", "Four decisions", "Use the bullet button.", "Each with a reason.", W.list(4, "ul")),
      ck("because", "Gives reasons", "Use because, so that or to.", "Decisions need reasons.", W.pattern("because|so that|in order to|which means", "reasons")),
      ck("priv", "Mentions privacy or personal data", "Mention privacy or personal data.", "Responsible design.", W.pattern("privacy|personal data", "privacy")),
      ck("tests", "Mentions tests", "Mention tests.", "Evidence.", W.pattern("test", "tests")),
      ck("audit", "States it is not audited", "Say it is not audited.", "Honest limits.", W.pattern("not (been )?audited|unaudited|no audit", "that it is not audited")),
      ck("net", "States it runs on a test network", "Say it runs on a test network.", "Honest scope.", W.pattern("test network|testnet|sepolia", "a test network")),
      ck("len", "Between 340 and 680 words", "Two pages at most.", "Readable.", W.words(340, 680)),
    ],
    solution: "<h1>Campus Certificates case study</h1><h2>The problem</h2><p>Employers cannot easily tell whether a certificate is genuine, so they either trust a PDF that anyone could edit or phone the college. Colleges lose time answering these calls.</p><h2>My approach</h2><p>I built a small registry on an Ethereum test network. The registrar stores a fingerprint of each certificate, and a web page lets anyone check a file against the record without uploading it. The registrar can revoke a certificate if it was issued by mistake.</p><h2>Design decisions</h2><ul><li>Only a SHA-256 fingerprint is stored, because the blockchain is public and permanent and personal data should never be written there.</li><li>Issuing and revoking are limited to an issuer role, so that a stranger cannot create or cancel records.</li><li>The admin role belongs to a multi-signature wallet, because a single stolen key should not be able to appoint new issuers.</li><li>The verification page computes the fingerprint in the browser, so that the document never leaves the visitor's device.</li><li>Revocation is a flag rather than a deletion, so the history stays visible.</li></ul><h2>Security and privacy</h2><p>I wrote a short threat model covering forged documents, a stolen issuer key and mistyped certificate numbers. No names or marks are stored on the chain, and the policy page explains that blockchain records cannot be erased.</p><h2>Testing</h2><p>Unit tests cover issuing, duplicate numbers, revocation and verification, and tests try unusual cases such as a changed document with a real certificate number, a revoked certificate and a stranger calling issue. The tests run in the pipeline on every change, so a mistake in a later edit is caught the same day it is made.</p><h2>What I would do next</h2><p>I would add a dashboard for the registrar fed by events, support batches of certificates, and ask an experienced reviewer to examine the contract and the page.</p><h2>Honest limits</h2><p>The project is not audited and runs on a test network only. If an issuer key is stolen, fake certificates could be issued until the role is removed, and the system cannot prove that a person truly earned a qualification, only that the college recorded it.</p>",
  }),
];

const M1 = module_({
  slug: "project-craft", title: "Project craft: scope, build, present", hours: 2.5, level: "Foundations",
  summary: "How to choose a project that can be finished, structure the repository, document honestly and show your judgement.",
  outcome: "You can scope a project, set up a repository that others can run and write about it honestly.",
  intro: "A portfolio is not a collection of code; it is evidence of how you think. Reviewers look for finished work, clear scope, tests, honest limits and signs that you understand risk. This module sets the habits that make the five projects count.",
  topics: [
    topic({
      title: "What reviewers look for", slug: "what-reviewers-want",
      blocks: [
        table("Signals that impress", ["Signal", "Why it matters"], [["The project works and a stranger can run it", "Finished beats ambitious"], ["A short, clear README", "Shows you can communicate"], ["Tests, including the awkward cases", "Shows you think about failure"], ["Honest limits and a threat model", "Shows judgement and maturity"], ["Small, focused scope", "Shows you can decide"], ["A live demo on a test network", "Proof, not claims"], ["Clean commits and structure", "Shows professional habits"]]),
        table("Signals that hurt", ["Signal", "Why it hurts"], [["Claims of 'secure' or 'production-ready' without proof", "Overclaiming destroys trust"], ["A token launched to the public as an investment", "Irresponsible and often unlawful"], ["Copied code you do not understand", "Interviewers will ask"], ["No tests", "Suggests you have not thought about failure"], ["Secrets in the repository", "A basic security failure"], ["Ten half-finished projects", "Breadth without depth"]]),
        miniQuiz("review-mini", [["Which impresses reviewers more?", ["A huge unfinished platform", "A small project that works, is tested and states its limits", "A token with a big logo", "A project with no README"], 1, "Finished and honest wins."]]),
      ],
      points: ["Reviewers value finished, tested, honest and clearly explained work.", "Overclaiming and unfinished sprawl hurt."],
      check: [["A threat model shows:", ["Judgement about risk", "A logo", "A token", "Speed"], 0, "You thought about what could go wrong."]],
    }),
    topic({
      title: "Scoping and structure", slug: "scoping",
      blocks: [
        flow("A one-month project", ["Write a one-page brief", "List must-haves and later items", "Design the contract and the data", "Write tests first for the risky parts", "Build the contract, then the page", "Deploy to a test network", "Write the README and the threat model"]),
        table("A repository others can run", ["Folder or file", "Purpose"], [["contracts/", "Solidity source"], ["test/", "Automated tests"], ["scripts/", "Deployment and helper scripts"], ["web/ or app/", "The user interface"], ["docs/", "Brief, threat model and decisions"], ["README.md", "What it is, what it is not, how to run it"], [".env.example", "Names of required variables, never real secrets"], [".gitignore", "Keeps secrets and build output out of the repository"]]),
        list("Scoping rules", ["One clear user and one clear job.", "A written list of what the project will not do.", "A finish line you can describe in one sentence.", "Cut features, never tests.", "Prefer depth in one project to breadth across five."], true),
        mistakes(["Starting with the user interface and discovering the contract does not fit.", "Adding features because they are interesting rather than needed.", "Skipping the README until the end, when you are tired."]),
        miniQuiz("scope-mini", [["What should be cut first when time runs short?", ["Tests", "Nice-to-have features", "The README", "The threat model"], 1, "Protect quality, cut scope."]]),
      ],
      points: ["Scope small, write what you will not do, and keep a repository others can run.", "Cut features, never tests."],
      check: [[".env.example contains:", ["Variable names without real secrets", "Private keys", "Passwords", "Nothing"], 0, "It documents configuration safely."]],
    }),
    topic({
      title: "Writing it up honestly", slug: "writing-up",
      blocks: [
        code("markdown", readmeSample, "README.md (sample)"),
        table("What a good README answers", ["Question", "Where"], [["What is it?", "First paragraph"], ["Why does it exist?", "The problem statement"], ["What is it not?", "A clear limits section"], ["How do I run it?", "Numbered steps"], ["How does it work?", "A short architecture note"], ["How secure is it?", "Threat model and known limits"], ["What is next?", "Future work"]]),
        p("Honesty about limits is a strength, not a weakness. A reviewer who sees 'not audited, test network only, key compromise is the main risk' knows you understand the field. A reviewer who sees 'unhackable' knows you do not."),
        miniQuiz("write-mini", [["Why state what a project is not?", ["To reduce marketing", "It shows honesty and prevents misuse", "It is required by Git", "It makes the README longer"], 1, "Limits build trust."]]),
      ],
      points: ["A README says what it is, is not, how to run it and the known limits.", "Honest limits earn trust."],
      check: [["Claims such as 'unhackable' are:", ["Red flags", "Impressive", "Required", "Expected"], 0, "No honest builder says that."]],
    }),
  ],
  terms: [["Scope", "What a project will and will not do"], ["Threat model", "A structured list of what could go wrong"], ["README", "The project's front page"], ["Repository", "The folder of project files under version control"], ["Test network", "A public network without real value"], ["Portfolio", "A collection of evidence of your skills"]],
  practical: { title: "Practical: set up your repository", intro: "On your computer.", steps: ["Create a repository with the folder structure shown.", "Write a one-page brief in docs/.", "Add .env.example and .gitignore.", "Write the first draft of the README."] },
  quiz: [
    ["Reviewers prefer:", ["Finished, tested work", "Sprawling drafts", "Big claims", "No tests"], 0, "Evidence of finished, honest work."],
    ["Scope should be:", ["Small and written down", "Unlimited", "Secret", "Random"], 0, "Decide what you will not do."],
    ["A README states:", ["What it is and is not", "Only a logo", "Only a price", "Nothing"], 0, "Honesty builds trust with reviewers."],
    ["Secrets belong:", ["Outside the repository", "In the README", "In commits", "In the issue list"], 0, "Use environment variables."],
    ["A threat model lists:", ["What could go wrong", "Colours", "Prices", "Names"], 0, "Risk thinking."],
    ["If time runs short, cut:", ["Features", "Tests", "Security notes", "The README"], 0, "Protect quality."],
    ["A live demo should use:", ["A test network", "The main network with real money", "No network", "A bank"], 0, "Safe proof."],
  ],
});

const M2 = module_({
  slug: "project-1-token-system", title: "Project 1: a token system with distribution", hours: 3, level: "Core skills",
  summary: "A fixed-supply token and a vesting vault that releases tokens on schedules, with tests, risks and honest limits.",
  outcome: "You can build, test and explain a token with a funded vesting vault.",
  intro: "The first project is the classic: a token and the rules for handing it out. The twist is professionalism: a supply that cannot grow, promises that are always funded, schedules that people can verify and a clear statement that it is a learning project and not an investment.",
  topics: [
    topic({
      title: "Design and contracts", slug: "design-contracts",
      blocks: [
        code("solidity", tokenAndVault, "ProjectToken.sol and VestingVault"),
        table("Design decisions", ["Decision", "Reason"], [["Supply minted once; no mint function", "Nobody can dilute holders"], ["Burnable by holders", "People may destroy their own tokens"], ["Vault checks funding before each grant", "Every promise is already backed by tokens in the vault"], ["Per-person cliff and duration", "Different roles need different schedules"], ["claim() pulls the vested amount minus claimed", "No loops, no batches, no failure for others"], ["Claimed is updated before the transfer", "Prevents reentrancy"], ["Custom errors", "Cheaper and clearer failures"]]),
        miniQuiz("t1-mini", [["Why must the vault be funded before creating a grant?", ["To save gas", "A grant is a promise; an unfunded promise could never be kept", "The compiler requires it", "To hide balances"], 1, "Promises must be backed."]]),
      ],
      points: ["Fixed supply and funded promises build trust.", "Pull-based claims avoid loops and failures."],
      check: [["A claim function that pulls its own vested amount avoids:", ["Loops over many beneficiaries", "All gas costs", "Events", "Roles"], 0, "Simple and safe."]],
    }),
    topic({
      title: "Testing and risks", slug: "tests-risks",
      blocks: [
        list("Tests for the vault", ["A grant fails if the vault is not funded.", "Nothing can be claimed before the cliff.", "Exactly the right amount can be claimed halfway through.", "Everything can be claimed at the end, and not more.", "A second grant for the same address is refused.", "Only the admin can create grants.", "Claiming twice in a row pays nothing the second time.", "A fuzz test checks that claimed never exceeds total."], true),
        table("Risks and mitigations", ["Risk", "Mitigation"], [["Admin key stolen: attacker creates a grant to themselves", "Fund the vault only with what is planned; use a multi-signature admin; grants are limited by the funding"], ["A beneficiary loses their key", "Decide in advance whether a recovery policy exists; none is built here, and that is stated"], ["Rounding in the vesting formula", "Round down in favour of the vault; test the edge cases"], ["Strange tokens (fees, callbacks)", "Use SafeERC20 and test with the real token only"], ["Misleading marketing", "State plainly that this is a learning project, not an investment"]]),
        explorer({ id: "bcp-vest", title: "Vesting calculator", intro: "Change the grant, cliff and elapsed months to see what is claimable. A teaching tool.", inputs: [{ id: "grant", label: "Grant (tokens)", min: 1000, max: 10000000, step: 1000, value: 4800000 }, { id: "cliff", label: "Cliff (months)", min: 0, max: 24, step: 1, value: 12 }, { id: "dur", label: "Duration (months)", min: 6, max: 60, step: 6, value: 48 }, { id: "m", label: "Months elapsed", min: 0, max: 60, step: 1, value: 24 }], outputs: [{ label: "Vested tokens (ignoring the cliff rule)", expr: "min(grant, grant * m / dur)", unit: "n" }, { label: "Monthly release", expr: "grant / dur", unit: "n" }] }),
        miniQuiz("t1b-mini", [["Why test that claimed never exceeds total?", ["It is easy", "A bug there would pay out more than was promised", "Tests must be long", "Fees depend on it"], 1, "An invariant protects the funds."]]),
      ],
      points: ["Test cliffs, edges, repeated claims and permissions.", "State recovery and key risks honestly."],
      check: [["Tokens that nobody should be able to create more of need:", ["No mint function", "A faster chain", "More roles", "Bigger fees"], 0, "Fixed supply."]],
    }),
    topic({
      title: "Distribution and presentation", slug: "distribution-presentation",
      blocks: [
        table("Ways to hand out tokens in a learning project", ["Method", "Use", "Care"], [["Vesting vault", "Team and adviser grants", "Funded, scheduled, transparent"], ["Merkle claim", "A community airdrop to a known list", "Eligibility rules and deadlines"], ["Direct transfers from the treasury", "A few recipients", "Gas and record keeping"], ["Faucet on a test network", "Letting visitors try the token", "Rate limits"]]),
        list("What to show in the portfolio", ["A diagram of token flows from treasury to holders.", "A table of allocations and schedules.", "The tests and what they cover.", "A statement that the token has no value and is not an investment.", "A short video or live link on a test network.", "The risks you considered."]),
        warn("Do not launch a token to the public as part of a portfolio project. Treat it as a learning exercise on a test network."),
        miniQuiz("t1c-mini", [["Where should a portfolio token live?", ["On the main network with a marketing campaign", "On a test network with a clear statement that it has no value", "In a bank", "Nowhere"], 1, "Responsible practice."]]),
      ],
      points: ["Show allocations, schedules, tests and honest statements.", "Keep portfolio tokens on test networks."],
      check: [["A faucet is useful on:", ["A test network", "A bank", "A phone", "The main network"], 0, "Free test tokens."]],
    }),
  ],
  terms: [["Fixed supply", "A total that can never grow"], ["Vesting vault", "A contract that releases tokens over time"], ["Funded", "Backed by tokens already held"], ["Invariant", "A property that must always hold"], ["Faucet", "A service giving free test tokens"], ["Allocation", "How tokens are divided"]],
  practical: { title: "Practical: build and test Project 1", intro: "In Hardhat or Remix.", steps: ["Deploy ProjectToken and VestingVault.", "Fund the vault and create three grants.", "Fast-forward time and claim.", "Write the allocation table for your README."] },
  quiz: [
    ["A fixed supply is created by:", ["Minting once and having no mint function", "A promise", "A comment", "A fee"], 0, "Code enforces it."],
    ["A funded vault means:", ["Every grant is backed by tokens", "It has ETH", "It has a logo", "It has an admin"], 0, "Promises are kept."],
    ["Claim functions should:", ["Pay only the caller", "Pay everyone in a loop", "Do nothing", "Mint"], 0, "Pull, not push."],
    ["Update claimed:", ["Before the transfer", "After the transfer", "Never", "Randomly"], 0, "Prevent reentrancy."],
    ["A multi-signature admin reduces:", ["Single-key risk", "Gas", "Supply", "Time"], 0, "Spread control."],
    ["A token in a portfolio is:", ["A learning project", "An investment", "A currency", "A bank"], 0, "State it plainly."],
    ["Use SafeERC20 to:", ["Handle unusual tokens safely", "Mint", "Burn", "Pause"], 0, "Robust transfers."],
  ],
});

const M3 = module_({
  slug: "project-2-certificate-verification", title: "Project 2: on-chain certificate verification", hours: 2.5, level: "Core skills",
  summary: "A registry that stores only fingerprints, roles for issuers, revocation and a verification page that never uploads the document.",
  outcome: "You can build and explain a privacy-respecting certificate verification system.",
  intro: "Certificates are the most honest use of a blockchain: public verification of a fact issued by a known authority. The craft is in what you leave out: no personal data, no pretence of replacing the law, and clear handling of mistakes.",
  topics: [
    topic({
      title: "The registry contract", slug: "registry-contract",
      blocks: [
        code("solidity", registry, "CertificateRegistry.sol"),
        table("Design decisions", ["Decision", "Reason"], [["Store a hash, never the document", "The chain is public and permanent; fingerprints reveal nothing"], ["ISSUER_ROLE for issue and revoke", "Only authorised staff can create or cancel records"], ["Admin role separate from issuers", "A multi-signature wallet manages staff"], ["certId duplicates revert", "A record cannot be overwritten"], ["Revoke is a flag, not a delete", "History stays visible and verifiers see the revocation"], ["verify is a free view call", "Anyone can check at no cost"], ["Events for issue and revoke", "Dashboards and monitoring"]]),
        miniQuiz("c1-mini", [["Why mark a certificate revoked instead of deleting it?", ["Deleting is impossible", "The history stays visible and verifiers can see it was revoked", "It saves gas", "It hides the issuer"], 1, "Transparency about corrections."]]),
      ],
      points: ["Store fingerprints, not documents or personal data.", "Revocation is a visible flag."],
      check: [["A fingerprint reveals:", ["Nothing about the document's content", "The full document", "The student's marks", "The address"], 0, "A hash is one-way."]],
    }),
    topic({
      title: "The verification page", slug: "verification-page",
      blocks: [
        code("javascript", verifyPage, "verify.js"),
        flow("What happens when someone verifies", ["The visitor types the certificate number and picks the file", "The browser computes the file's SHA-256 fingerprint locally", "The page asks the contract to verify the number and fingerprint", "The contract replies valid, revoked or not found", "The page shows a clear message"]),
        table("Why it is built this way", ["Choice", "Reason"], [["Hash in the browser", "The document never leaves the visitor's device"], ["Read-only provider", "The page needs no wallet and no gas"], ["Clear statuses: valid, revoked, not found or changed", "People know what to do next"], ["Certificate number hashed with keccak256", "Fits the bytes32 key in the contract"]]),
        miniQuiz("c2-mini", [["Why compute the hash in the browser?", ["It is faster", "The document stays private on the visitor's device", "It is required by the chain", "To save gas"], 1, "Privacy by design."]]),
      ],
      points: ["Hash locally, query read-only and show clear statuses.", "No wallet or gas is needed to verify."],
      check: [["A changed document produces:", ["A different fingerprint", "The same fingerprint", "No fingerprint", "A token"], 0, "Any change alters the hash."]],
    }),
    topic({
      title: "Threats, privacy and honest claims", slug: "threats-privacy",
      blocks: [
        table("Threat model", ["Threat", "Mitigation", "Remaining risk"], [["Forged PDF", "Fingerprint will not match the record", "None for this check"], ["Fake issuer key", "Role control; multi-signature admin; monitoring Issued events", "A stolen issuer key can issue fakes until removed"], ["Wrong certificate number typed", "Page says not found", "Users may be confused; improve messages"], ["Fake verification site", "Publish one official address; sign the page", "Phishing remains possible"], ["Privacy of the holder", "No personal data on-chain", "Certificate numbers could be linked to identities elsewhere"], ["Issuing to the wrong person by mistake", "Revocation", "A window of misuse before revocation"]]),
        list("Honest claims for the README", ["Proves that the college issued a document with this exact fingerprint.", "Does not prove the education was good or that the holder earned it fairly.", "Does not replace the college's legal records.", "Depends on the security of the issuer's keys.", "Records on a public chain cannot be erased."]),
        miniQuiz("c3-mini", [["What does the system actually prove?", ["The graduate is clever", "This exact document was recorded by an authorised issuer and not revoked", "The college is accredited", "Nothing"], 1, "A narrow, honest claim."]]),
      ],
      points: ["A threat model lists each risk, mitigation and what remains.", "Claim only what the system proves."],
      check: [["A stolen issuer key could:", ["Issue fake certificates until removed", "Delete the chain", "Change old records silently", "Mint tokens"], 0, "A real, stated limit."]],
    }),
  ],
  terms: [["Fingerprint", "A hash that identifies exact content"], ["Registry", "A contract that records entries"], ["Issuer", "An authorised creator of records"], ["Revocation", "Marking a record as no longer valid"], ["SHA-256", "A common hash function"], ["Verification", "Checking a claim against the record"]],
  practical: { title: "Practical: issue and verify", intro: "On a local chain.", steps: ["Deploy the registry and grant the issuer role.", "Issue a certificate for a sample PDF.", "Verify the same file and then a modified copy.", "Revoke it and verify again."] },
  quiz: [
    ["The registry stores:", ["Fingerprints", "Documents", "Names", "Marks"], 0, "Personal data stays off the chain."],
    ["Issuing is limited to:", ["The issuer role", "Anyone", "The browser", "Nobody"], 0, "Access control."],
    ["Revocation is:", ["A visible flag", "A deletion", "A secret", "A token"], 0, "History stays."],
    ["Verification costs:", ["No gas", "A lot", "A token", "A fee"], 0, "A view call."],
    ["Hashing in the browser:", ["Keeps the file private", "Uploads the file", "Costs gas", "Needs a wallet"], 0, "Local computation."],
    ["The system proves:", ["The college recorded this document", "The student is skilled", "Law is satisfied", "Nothing"], 0, "A narrow claim."],
    ["Chain records:", ["Cannot be erased", "Can be erased", "Are private", "Are free"], 0, "Think before writing."],
  ],
});

const M4 = module_({
  slug: "project-3-voting-demonstration", title: "Project 3: a decentralised voting demonstration", hours: 2.5, level: "Applied skills",
  summary: "A simple ballot, a commit-and-reveal variant and an honest account of what blockchain voting can and cannot do.",
  outcome: "You can build a teaching ballot, explain commit-and-reveal and say clearly why this is not a secure election system.",
  intro: "Voting is where enthusiasm for blockchains meets the hardest requirements: secrecy, coercion resistance and trust in identity. This project builds a transparent ballot for low-stakes decisions and teaches you to explain precisely where it falls short of a real election.",
  topics: [
    topic({
      title: "A simple transparent ballot", slug: "simple-ballot",
      blocks: [
        code("solidity", ballot, "Ballot.sol"),
        table("What the contract guarantees", ["Property", "How"], [["Only registered voters vote", "eligible mapping, set by the chair"], ["One vote per address", "hasVoted flag"], ["A deadline", "Compared with the block time"], ["Public, auditable counts", "tally mapping and Voted events"], ["Valid options only", "BadOption check"]]),
        table("What it does not guarantee", ["Missing property", "Why"], [["Secrecy", "Every vote and address is public"], ["Resistance to vote-selling and coercion", "A voter can prove how they voted"], ["One person, one vote", "The chair decides who is registered; identity is not solved"], ["Protection from the chair", "The chair registers voters and could add fake ones"], ["Fairness of timing", "Running totals are visible while voting is open"]]),
        miniQuiz("v1-mini", [["Why is this ballot unsuitable for a real election?", ["It uses Solidity", "Votes are public, identities are not verified and the chair is trusted", "It is too fast", "It has events"], 1, "Missing secrecy and identity."]]),
      ],
      points: ["A transparent ballot enforces eligibility, one vote and a deadline.", "It cannot give secrecy, coercion resistance or identity."],
      check: [["hasVoted prevents:", ["The same address voting twice", "Fake addresses", "Secrecy loss", "Vote buying"], 0, "Not different addresses of the same person."]],
    }),
    topic({
      title: "Commit-and-reveal", slug: "commit-reveal",
      blocks: [
        code("solidity", commitReveal, "CommitRevealBallot.sol"),
        flow("Two phases", ["Commit phase: each voter submits hash(voter, option, salt)", "Nobody can learn the option from the hash", "Reveal phase: voters submit option and salt", "The contract recomputes the hash and counts the vote only if it matches", "After the reveal phase the tally is final"]),
        table("What commit-and-reveal improves, and what it does not", ["Improves", "Does not fix"], [["Early results cannot influence later voters", "Choices become public after the reveal"], ["Voters cannot change their mind after seeing others", "Voters can still prove their choice to a buyer by sharing the salt"], ["The tally is verifiable", "Voters who forget to reveal lose their vote"], ["", "Identity of voters is still unsolved"]]),
        explorer({ id: "bcp-vote", title: "Turnout and result", intro: "Change the registered voters and votes to see turnout and whether the result is valid under the rule: at least 50% turnout and a majority of votes cast. A teaching model.", inputs: [{ id: "reg", label: "Registered voters", min: 50, max: 2000, step: 10, value: 500 }, { id: "a", label: "Votes for A", min: 0, max: 1000, step: 5, value: 180 }, { id: "b", label: "Votes for B", min: 0, max: 1000, step: 5, value: 120 }, { id: "c", label: "Votes for C", min: 0, max: 1000, step: 5, value: 40 }], outputs: [{ label: "Turnout (%)", expr: "(a + b + c) / reg * 100", unit: "n" }, { label: "Leader's share of votes cast (%)", expr: "max(a, max(b, c)) / (a + b + c) * 100", unit: "n" }] }),
        miniQuiz("v2-mini", [["What does the salt do in a commitment?", ["Makes the vote cheaper", "Stops others guessing the option by hashing each possibility", "Encrypts the chain", "Identifies the voter"], 1, "Without it the options are easy to try."]]),
      ],
      points: ["Commit-and-reveal hides choices until voting closes.", "It does not make the ballot secret or coercion-proof."],
      check: [["A voter who never reveals:", ["Is not counted", "Is counted twice", "Wins", "Is fined"], 0, "A drawback of the scheme."]],
    }),
    topic({
      title: "Responsible framing", slug: "responsible-framing",
      blocks: [
        table("When it is reasonable to use such a ballot", ["Suitable", "Unsuitable"], [["A student society choosing a name", "A national or local election"], ["A hobby group deciding a meeting date", "Votes with legal consequences"], ["A demonstration for a class", "Decisions where coercion or secrecy matter"]]),
        list("What the README must say", ["It is a teaching demonstration for low-stakes decisions.", "Votes and voter addresses are public.", "The chair controls eligibility and must be trusted.", "Real elections need legal frameworks, verified identity, secrecy and independent audit.", "Computer scientists broadly consider internet and blockchain voting for public elections unsolved and risky."], true),
        p("Saying clearly what your project is not will make it more credible. Interviewers will test whether you understand the gap between a smart-contract ballot and a trustworthy election."),
        miniQuiz("v3-mini", [["Why is it a strength to document the limits of your voting project?", ["It makes the project longer", "It shows you understand real election requirements", "It hides bugs", "It is required by law"], 1, "It shows maturity and real understanding."]]),
        warn("Never present a blockchain voting demo as suitable for real elections."),
      ],
      points: ["Use such ballots only for low-stakes decisions.", "State the missing properties plainly."],
      check: [["Real elections need:", ["Secrecy, verified identity and audit", "Only speed", "Only a smart contract", "Only a website"], 0, "Far beyond a contract."]],
    }),
  ],
  terms: [["Ballot", "A collection of votes on options"], ["Eligibility", "Who is allowed to vote"], ["Commit-and-reveal", "Hide a choice first and show it later"], ["Salt", "Random data mixed into a hash"], ["Quorum", "The minimum participation for validity"], ["Coercion", "Forcing or paying someone to vote a certain way"]],
  practical: { title: "Practical: run a ballot", intro: "On a local chain.", steps: ["Deploy Ballot with three options.", "Register five voters and vote from each.", "Try voting twice and as a stranger.", "Write the list of missing properties for your README."] },
  quiz: [
    ["A transparent ballot makes votes:", ["Public", "Secret", "Encrypted", "Free"], 0, "Auditable but not private."],
    ["One vote per address does not stop:", ["One person using many addresses", "Double counting of one address", "A deadline", "Events"], 0, "Identity is unsolved."],
    ["Commit-and-reveal hides choices:", ["During voting", "Forever", "From the voter", "From the chain"], 0, "Until the reveal."],
    ["The salt prevents:", ["Guessing the option from the hash", "Gas costs", "Reorgs", "Deadlines"], 0, "Brute force."],
    ["Quorum is:", ["Minimum participation", "A winner", "A fee", "A role"], 0, "Validity rule."],
    ["Real elections need:", ["Far more than a contract", "Only a contract", "Only a page", "Nothing"], 0, "Law, identity, secrecy and audit."],
    ["Your README should state:", ["The limits clearly", "That it is perfectly secure", "Nothing", "A promise"], 0, "Honesty builds trust with reviewers."],
  ],
});

const M5 = module_({
  slug: "project-4-nft-ticketing", title: "Project 4: an NFT ticketing application", hours: 2.5, level: "Applied skills",
  summary: "Tickets as NFTs with check-in, frozen used tickets, resale royalties and a realistic look at fraud and support.",
  outcome: "You can build a ticket contract with gate staff, explain its rules and budget the income.",
  intro: "Tickets are an honest use for NFTs: each is unique, ownership matters and verification at the door is a real problem. This project builds a ticket contract with a check-in role, freezes used tickets and looks at the practical issues that decide whether it would work.",
  topics: [
    topic({
      title: "The ticket contract", slug: "ticket-contract",
      blocks: [
        code("solidity", ticket, "EventTicket.sol"),
        table("Rules and why", ["Rule", "Reason"], [["Exact price and a supply cap", "No overselling and no accidental overpayment"], ["GATE_ROLE can check tickets in", "Only staff can mark tickets used"], ["Used tickets are frozen in _update", "A scanned ticket cannot be resold or reused"], ["Unused tickets can be transferred", "Friends can share tickets before the event"], ["Admin-only withdrawal", "Only the organiser takes the proceeds"], ["supportsInterface override", "Both ERC-721 and AccessControl interfaces are visible"]]),
        miniQuiz("k1-mini", [["Why freeze a ticket after check-in?", ["To save gas", "A used ticket must not be sold or reused", "To hide the holder", "It is required by ERC-721"], 1, "Prevent resale of used tickets."]]),
      ],
      points: ["Tickets are unique NFTs with a supply cap and exact price.", "Used tickets are frozen so they cannot be resold."],
      check: [["Only GATE_ROLE can:", ["Check tickets in", "Buy tickets", "View tickets", "Burn tickets"], 0, "Role-controlled."]],
    }),
    topic({
      title: "Practical problems of real ticketing", slug: "practical-problems",
      blocks: [
        table("Problems and ideas", ["Problem", "Idea"], [["Gate staff need to verify ownership quickly", "A signed, time-limited QR code made by the holder's wallet that the scanner checks against the chain"], ["Screenshots and copies", "Rotating codes tied to a signature rather than a static image"], ["Lost wallets", "Decide the policy before launch: no recovery, or a managed recovery with identity checks"], ["Scalpers and bots", "Per-wallet limits, allowlists and price caps on resale"], ["Refunds and cancelled events", "A refund function or a documented off-chain process"], ["Non-technical buyers", "Provide wallet creation help and card payments through a provider if appropriate"], ["Network fees", "Choose a low-cost network and show total costs honestly"]]),
        p("These problems matter more than the Solidity. Many ticketing projects fail on the day because the entrance queue cannot verify tickets quickly or because buyers cannot get a wallet working. When you write about this project, spend time on the human flow."),
        list("Fraud thinking", ["What if two people show the same screenshot?", "What if the scanner is offline?", "What if a ticket is sold twice off-platform?", "What if a gate staff account is compromised?", "What if the event is cancelled?"]),
        miniQuiz("k2-mini", [["Why does a rotating, signed code beat a screenshot?", ["It is prettier", "A static image can be copied; a fresh signature proves control of the wallet right now", "It uses less gas", "It hides the ticket id"], 1, "Prove control, not possession of a picture."]]),
      ],
      points: ["Real ticketing fails on verification speed, wallets, fraud and support.", "Use signed, rotating codes instead of static images."],
      check: [["A cancelled event needs:", ["A refund plan", "A new logo", "More gas", "A faster chain"], 0, "Decide before launch."]],
    }),
    topic({
      title: "Economics and presentation", slug: "economics-presentation",
      blocks: [
        explorer({ id: "bcp-tix", title: "Ticket income", intro: "Change tickets, price, resale share and royalty to estimate income. A teaching model with made-up figures.", inputs: [{ id: "n", label: "Tickets sold", min: 50, max: 5000, step: 50, value: 500 }, { id: "price", label: "Ticket price (rupees)", min: 100, max: 10000, step: 100, value: 1500 }, { id: "resold", label: "Share resold (%)", min: 0, max: 100, step: 5, value: 20 }, { id: "resale", label: "Average resale price (rupees)", min: 100, max: 20000, step: 100, value: 2000 }, { id: "roy", label: "Royalty (%)", min: 0, max: 15, step: 1, value: 5 }], outputs: [{ label: "Primary sales (rupees)", expr: "n * price", unit: "rs" }, { label: "Royalty income (rupees)", expr: "round(n * resold / 100) * resale * roy / 100", unit: "rs" }] }),
        list("What to show in the portfolio", ["The flow from purchase to check-in as a diagram.", "A short video of buying and scanning on a test network.", "The tests, including double check-in and transfer after use.", "A page that lists the problems above and your answers.", "Honest limits: no real money, no audit, no legal advice."]),
        table("Honest claims", ["You can say", "You should not say"], [["Tickets are unique and verifiable on-chain", "Fraud is impossible"], ["Used tickets cannot be resold through the contract", "Screenshots can never be copied"], ["Royalties are declared and can be enforced by the organiser's own marketplace", "Every marketplace will pay royalties"]]),
        miniQuiz("k3-mini", [["Which statement is honest?", ["Fraud is impossible with NFT tickets", "Tickets are verifiable on-chain, and fraud is reduced but not eliminated", "Nobody can copy a ticket", "Support is not needed"], 1, "Avoid absolutes."]]),
      ],
      points: ["Budget primary sales and royalties and show the human flow.", "Claim only what the contract guarantees."],
      check: [["Royalties are guaranteed when:", ["Sales happen on your own marketplace", "Always everywhere", "Never", "On any chain"], 0, "Otherwise they are optional."]],
    }),
  ],
  terms: [["Check-in", "Marking a ticket as used"], ["Gate role", "Permission for staff to check tickets in"], ["Scalping", "Buying tickets to resell at a high price"], ["Royalty", "A share of resale price paid to the organiser"], ["Allowlist", "A list of addresses allowed to buy"], ["Frozen", "Unable to move"]],
  practical: { title: "Practical: sell and scan", intro: "On a local chain.", steps: ["Deploy EventTicket and grant GATE_ROLE to a second account.", "Buy tickets from two accounts.", "Check one in and try to transfer it.", "Try to check in twice and as a stranger."] },
  quiz: [
    ["Tickets as NFTs are:", ["Unique", "Identical", "Free", "Private"], 0, "Each has an id."],
    ["Used tickets should be:", ["Frozen", "Resold", "Burned always", "Hidden"], 0, "A used ticket cannot be reused."],
    ["Static screenshots can be:", ["Copied", "Never copied", "Signed", "Encrypted"], 0, "Use signed codes."],
    ["Lost wallets need:", ["A policy decided in advance", "Nothing", "A bigger supply", "A new logo"], 0, "Plan ahead."],
    ["A supply cap prevents:", ["Overselling", "Resale", "Check-in", "Refunds"], 0, "Fixed number of tickets."],
    ["Royalties are:", ["Optional on many marketplaces", "Always paid", "Illegal", "Free"], 0, "Declared, not enforced everywhere."],
    ["Honest projects avoid:", ["Absolute claims", "Tests", "READMEs", "Diagrams"], 0, "Fraud is reduced, not removed."],
  ],
});

const M6 = module_({
  slug: "project-5-records-registry-and-portfolio", title: "Project 5: a records registry, and your portfolio", hours: 2.5, level: "Applied skills",
  summary: "A registry with a trusted registrar, the line between technical and legal claims, and packaging all five projects.",
  outcome: "You can build a registrar-controlled registry, explain what it can and cannot claim and present five projects as a portfolio.",
  intro: "The final project is the one most tempting to oversell: records of ownership. A blockchain can keep a tamper-evident history, but ownership in the real world is decided by law and institutions. Building it honestly, and then packaging all five projects, is the last step of this course.",
  topics: [
    topic({
      title: "A registry with a trusted registrar", slug: "registry-project",
      blocks: [
        code("solidity", assetRegistry, "AssetRegistry.sol"),
        flow("A transfer", ["The registrar registers an asset to an owner with the fingerprint of the paper record", "The owner proposes a transfer to a named buyer", "Both parties complete the real-world paperwork", "The registrar checks it and approves the transfer on-chain", "The registry updates the owner and emits Transferred", "Anyone can read the full history from events"]),
        table("Design decisions", ["Decision", "Reason"], [["A REGISTRAR_ROLE approves", "The institution stays responsible; the chain records its decisions"], ["Owner proposes, registrar approves", "Both the owner's intent and the registrar's checks are recorded"], ["Details hash, not details", "Privacy and permanence"], ["Events for every step", "A visible, tamper-evident history"], ["No direct owner-to-owner transfer", "Real-world rules must be satisfied first"]]),
        miniQuiz("g1-mini", [["Why does the registrar approve transfers?", ["To earn fees", "Legal and paperwork checks happen off-chain and the institution stays accountable", "The compiler requires it", "To save gas"], 1, "The chain records decisions; it does not replace them."]]),
      ],
      points: ["Owner proposes, registrar approves, events record the history.", "Store fingerprints, not details."],
      check: [["The registry's history comes from:", ["Events", "Colours", "Fees", "Names"], 0, "Public and permanent."]],
    }),
    topic({
      title: "Technical claims and legal claims", slug: "claims",
      blocks: [
        table("What the code can and cannot say", ["Statement", "Can the contract support it?"], [["This history of entries has not been secretly rewritten", "Yes: the chain is tamper-evident"], ["Only the registrar approved this transfer", "Yes: role-based access control and events"], ["This record matches the paper deed", "Only as far as the registrar's check was honest"], ["This person legally owns the land", "No: law and the government register decide"], ["The previous owner has lost all rights", "No: needs legal recognition"]]),
        p("Many 'land on the blockchain' announcements promised more than they delivered because they skipped this table. A registry is valuable when it makes records transparent and harder to tamper with and when the surrounding institution and law recognise it. The code alone cannot create that recognition."),
        list("Questions to answer in your README", ["Who is the registrar and why should anyone trust them?", "What happens if the registrar is dishonest or loses their key?", "Which law or rule makes the record meaningful?", "How are disputes and mistakes handled?", "What is stored publicly, and is that acceptable?"], true),
        miniQuiz("g2-mini", [["Can a smart contract make someone the legal owner of land?", ["Yes, always", "No: law and institutions decide; the contract can only record decisions", "Yes if the fee is paid", "Only on weekends"], 1, "Do not confuse records with rights."]]),
      ],
      points: ["Separate technical claims from legal claims.", "Name the registrar, the governing law and the dispute process."],
      check: [["A tamper-evident history means changes are:", ["Visible", "Impossible to see", "Free", "Secret"], 0, "Not necessarily impossible, but detectable."]],
    }),
    topic({
      title: "Packaging the portfolio", slug: "portfolio",
      blocks: [
        code("markdown", readmeSample, "README.md (sample)"),
        table("For each of the five projects", ["Item", "Content"], [["One-line summary", "What it does in plain words"], ["Link to the code and a live test-network demo", "Proof it runs"], ["A diagram", "How the parts connect"], ["Tests", "What they cover and a coverage figure"], ["Threat model", "Top risks and mitigations"], ["Honest limits", "Not audited, test network only, what it cannot claim"], ["What I learned", "One or two sentences of reflection"]]),
        list("Presenting yourself", ["Lead with the project that best shows judgement, not the flashiest.", "Keep every repository tidy, with no secrets.", "Write short case studies for your best two.", "Be ready to explain every line you wrote.", "Say what you would do differently.", "Link to the course badges and certificate if you have them."]),
        warn("Never publish private keys, API keys or personal data in a portfolio. Check your repository history, not just the latest files."),
        miniQuiz("g3-mini", [["Which should lead a portfolio?", ["The flashiest project", "The project that best shows judgement and finished quality", "The largest repository", "The newest"], 1, "Quality of thinking."]]),
      ],
      points: ["Each project needs a summary, demo, diagram, tests, threat model and honest limits.", "Check history for secrets and lead with your best judgement."],
      check: [["Before publishing a repository you should check for:", ["Leaked secrets in history", "Spelling only", "Colours", "Fonts"], 0, "Secrets stay in history."]],
    }),
  ],
  terms: [["Registrar", "The trusted party that approves entries"], ["Tamper-evident", "Changes would be visible"], ["Legal recognition", "Acceptance of a record by law"], ["Dispute process", "How disagreements are resolved"], ["Case study", "A story of a project and its lessons"], ["Portfolio", "A showcase of your work"]],
  practical: { title: "Practical: package your portfolio", intro: "With your finished projects.", steps: ["Write a summary and a diagram for each.", "Search the repositories for secrets.", "Add honest limits to every README.", "Choose two projects for case studies."] },
  quiz: [
    ["A registrar approving transfers keeps:", ["Institutional accountability", "Gas low", "Secrets", "Speed"], 0, "The institution stays responsible."],
    ["Records on-chain are:", ["Tamper-evident", "Legally conclusive by themselves", "Private", "Free"], 0, "Not a legal title."],
    ["Legal ownership is decided by:", ["Law and institutions", "A contract alone", "A wallet", "A fee"], 0, "The code only records."],
    ["Details should be:", ["Hashed, not stored", "Published in full", "Hidden in comments", "Mailed"], 0, "Personal data stays off the chain."],
    ["A README should name:", ["The registrar and the governing rules", "Only the author", "Only a logo", "Nothing"], 0, "Trust and law."],
    ["Portfolio repositories must not contain:", ["Secrets", "Tests", "Diagrams", "READMEs"], 0, "Check history too."],
    ["Lead with:", ["Your best judgement", "Your longest code", "Your oldest project", "Your logo"], 0, "Show how you think."],
  ],
});

export default course({
  slug: "blockchain-5-real-world-projects", title: "Blockchain Projects: Build 5 Real-World Applications", tagline: "A token system, certificate verification, a voting demonstration, NFT ticketing and a records registry, packaged as an honest portfolio", level: "Professional", hours: 16,
  summary: "A project-based course that builds five complete applications as learning projects on a test network: a token system with a funded vesting vault, privacy-respecting certificate verification, a transparent and a commit-and-reveal ballot, NFT event tickets with check-in, and a registrar-controlled records registry. Each project comes with compiled Solidity, tests to write, a threat model and honest claims, and the course ends with packaging your work as a portfolio. These are learning projects: none is audited or suitable for real value, real elections or legal records.",
  modules: [M1, M2, M3, M4, M5, M6],
  capstone: capstone({
    title: "Final project: write a portfolio case study", summary: "Produce a professional case study of one project and pass the final assessment.",
    intro: "You have built five systems and learned what each can and cannot claim. In this final step you present one of them as a professional case study: the problem, your approach, your design decisions and their reasons, your security and privacy thinking, your tests, your next steps and the honest limits. Then take the final assessment covering the whole course.",
    steps: ["Work through the **Final project: write a portfolio case study** lab.", "Check that every claim in your case study is something your project can support.", "Take the final assessment below."], projectTitle: "A portfolio case study",
    quiz: [
      ["Reviewers value most:", ["Finished, tested and honest projects", "Large unfinished platforms", "Big claims", "No tests"], 0, "Evidence of judgement."],
      ["A token with a fixed supply has:", ["No mint function", "An owner who can mint freely", "A secret", "A fee"], 0, "No dilution."],
      ["A funded vesting vault means:", ["Every grant is backed by tokens it holds", "It has ETH", "It has an admin", "It has a logo"], 0, "Promises can be kept."],
      ["A certificate registry should store:", ["A fingerprint, not personal data", "The full document", "Marks", "Home addresses"], 0, "The chain is public and permanent."],
      ["Revocation is best a:", ["Visible flag", "Deletion", "Secret", "Fee"], 0, "History stays visible."],
      ["A simple blockchain ballot does not give:", ["Secrecy", "A deadline", "One vote per address", "Public counts"], 0, "Votes and addresses are public."],
      ["Commit-and-reveal hides choices:", ["Until voting closes", "Forever", "From the chain", "From the voter"], 0, "Then all are revealed."],
      ["Used tickets are frozen so they:", ["Cannot be resold", "Are free", "Are hidden", "Are burned always"], 0, "Prevent reuse."],
      ["A static ticket screenshot can be:", ["Copied", "Never copied", "Signed", "Encrypted"], 0, "Use signed rotating codes."],
      ["A registry can claim:", ["A tamper-evident history", "Legal ownership by itself", "Perfect honesty", "Nothing"], 0, "Technical, not legal."],
      ["Legal ownership of land is decided by:", ["Law and institutions", "A contract alone", "A wallet", "A fee"], 0, "The code records decisions."],
      ["A good README states:", ["What it is not and its limits", "That it is unhackable", "Nothing", "Only a logo"], 0, "Honesty builds trust with reviewers."],
    ],
  }),
  labs,
  skills: [{ id: SK, label: "Blockchain projects" }],
  badges: [
    { id: "scope-setter", title: "Scope setter", description: "Scoped a finishable portfolio project.", when: { all: ["r1-scope"] } },
    { id: "privacy-first", title: "Privacy first", description: "Kept personal data off the chain.", when: { all: ["r5-cert-data"] } },
    { id: "honest-builder", title: "Honest builder", description: "Separated technical claims from legal claims.", when: { all: ["r11-registry-claims"] } },
    { id: "case-study-author", title: "Case study author", description: "Wrote a professional portfolio case study.", when: { all: ["cap-case-study"] } },
  ],
  landing: {
    hero: { eyebrow: "Professional · Eight compiled contracts across five projects", title: "Five blockchain projects, built honestly, ready for your portfolio", subtitle: "A token system with vesting, certificate verification, a voting demonstration, NFT ticketing and a records registry, each with tests to write, a threat model and an honest statement of what it cannot do. Every task is checked and explained.", level: "Professional", outcomeLine: "After this course you can present five finished, well-scoped, honestly described blockchain projects." },
    outcomes: [
      { icon: "docs", title: "Scope and structure", text: "Finishable projects with clear repositories." },
      { icon: "sheet", title: "Token systems", text: "Fixed supply, funded vesting and honest distribution." },
      { icon: "safety", title: "Privacy-respecting verification", text: "Fingerprints on-chain, documents off it." },
      { icon: "sort", title: "Ballots and tickets", text: "Eligibility, commit-and-reveal, check-in and frozen tickets." },
      { icon: "cloud", title: "Registries", text: "A registrar, role control and tamper-evident history." },
      { icon: "word", title: "Portfolio craft", text: "READMEs, threat models and case studies." },
    ],
    projects: [
      { title: "A vesting plan", text: "Schedules and the share held by insiders.", module: "project-1-token-system" },
      { title: "A verification policy", text: "What is recorded and what is not.", module: "project-2-certificate-verification" },
      { title: "A portfolio README", text: "What it is, is not and how to run it.", module: "project-5-records-registry-and-portfolio" },
      { title: "A portfolio case study", text: "A professional write-up of one project.", module: "capstone" },
    ],
    tools: [{ icon: "docs", title: "Compiled contracts", text: "Token, vault, registry, ballots, tickets and asset registry verified with solc." }, { icon: "sheet", title: "Spreadsheet lab", text: "Vesting, tallies and ticket income." }, { icon: "word", title: "Document editor", text: "Briefs, policies and case studies." }],
    assessment: ["Finish the required labs in each module: they are checked automatically and explained when something is missing.", "Pass each module quiz (70% or more). Short tests inside the lessons give instant feedback.", "Complete the case study and the final assessment."],
    faq: [
      { q: "Does the platform build or run the projects for me?", a: "No. The labs check your designs, calculations and writing. You build and test the code in your own tools on a test network." },
      { q: "Are these suitable for real use?", a: "No. They are learning projects, not audited and not suitable for real value, real elections or legal records." },
      { q: "Will they help my portfolio?", a: "They can, if you finish them, test them, document their limits honestly and present your judgement as well as your code." },
    ],
  },
  catalogue: {
    hours: "~16 hrs", weeks: "~6 weeks", pace: "3 hrs/wk", badge: "Blockchain Projects Portfolio",
    brief: "Five honest, finishable blockchain projects: tokens with vesting, certificate verification, voting, NFT ticketing and a records registry.",
    learn: ["Scoping, repositories and honest READMEs", "A token system with a funded vesting vault", "Certificate verification that keeps personal data off the chain", "Transparent and commit-and-reveal ballots and their limits", "NFT tickets with check-in and frozen used tickets", "A registrar-controlled registry and packaging a portfolio"],
    handsOn: "Write a professional portfolio case study for one of the five projects, with decisions, tests, privacy and honest limits.",
    outcome: "Present five finished, honestly described blockchain projects.",
  },
});
