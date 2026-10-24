import { capstone, ck, classifyLab, code, course, def, explorer, flow, list, miniQuiz, mistakes, module_, p, S, sheetLab, table, tip, topic, W, warn, wordLab } from "../kit.mjs";

const SK = "token-standards";

const minimal = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// A tiny ERC-20 written from scratch so you can see every moving part. Use OpenZeppelin in real projects.
contract MiniToken {
    string public constant name = "Mini Token";
    string public constant symbol = "MINI";
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(uint256 initialSupply) {
        totalSupply = initialSupply;
        balanceOf[msg.sender] = initialSupply;
        emit Transfer(address(0), msg.sender, initialSupply);
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _move(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= value, "Allowance too low");
        allowance[from][msg.sender] = allowed - value;
        _move(from, to, value);
        return true;
    }

    function _move(address from, address to, uint256 value) internal {
        require(to != address(0), "Zero address");
        require(balanceOf[from] >= value, "Balance too low");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
    }
}`;

const oz20 = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// A capped, burnable token that only the owner can mint.
contract CampusCoin is ERC20, ERC20Burnable, ERC20Capped, Ownable {
    constructor(address initialOwner)
        ERC20("Campus Coin", "CAMP")
        ERC20Capped(1_000_000 ether)
        Ownable(initialOwner)
    {
        _mint(initialOwner, 100_000 ether);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount); // reverts if the cap would be exceeded
    }

    // Required because two parent contracts both define _update.
    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Capped) {
        super._update(from, to, value);
    }
}`;

const permitVotes = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/utils/Nonces.sol";

// Permit: approvals by signature (no separate approve transaction). Votes: delegated voting power with history.
contract GovernanceToken is ERC20, ERC20Permit, ERC20Votes {
    constructor() ERC20("Governance", "GOV") ERC20Permit("Governance") {
        _mint(msg.sender, 1_000_000 ether);
    }

    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}`;

const blocklist = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// LEARNING EXAMPLE OF A RISKY DESIGN: the owner can freeze any holder at will.
// Some regulated tokens need this power; an anonymous token that has it is a warning sign for buyers.
contract FreezableToken is ERC20, Ownable {
    mapping(address => bool) public frozen;

    event Frozen(address indexed account, bool isFrozen);

    constructor() ERC20("Freezable", "FRZ") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000 ether);
    }

    function setFrozen(address account, bool isFrozen) external onlyOwner {
        frozen[account] = isFrozen;
        emit Frozen(account, isFrozen);
    }

    function _update(address from, address to, uint256 value) internal override {
        require(!frozen[from] && !frozen[to], "Account frozen");
        super._update(from, to, value);
    }
}`;

const vesting = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Linear vesting with a cliff: nothing before the cliff, then a steady release until the end.
contract LinearVesting {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    address public immutable beneficiary;
    uint256 public immutable start;
    uint256 public immutable cliff;
    uint256 public immutable duration;
    uint256 public released;

    event Released(uint256 amount);

    constructor(IERC20 token_, address beneficiary_, uint256 cliffSeconds, uint256 durationSeconds) {
        require(cliffSeconds <= durationSeconds, "Cliff longer than duration");
        token = token_;
        beneficiary = beneficiary_;
        start = block.timestamp;
        cliff = block.timestamp + cliffSeconds;
        duration = durationSeconds;
    }

    function vested() public view returns (uint256) {
        uint256 total = token.balanceOf(address(this)) + released;
        if (block.timestamp < cliff) return 0;
        if (block.timestamp >= start + duration) return total;
        return (total * (block.timestamp - start)) / duration;
    }

    function release() external {
        uint256 amount = vested() - released;
        require(amount > 0, "Nothing to release");
        released += amount;
        emit Released(amount);
        token.safeTransfer(beneficiary, amount);
    }
}`;

const airdrop = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

// Store one 32-byte root instead of thousands of addresses; each person proves their own entry when claiming.
contract MerkleAirdrop {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    bytes32 public immutable merkleRoot;
    mapping(address => bool) public claimed;

    event Claimed(address indexed account, uint256 amount);

    error AlreadyClaimed();
    error InvalidProof();

    constructor(IERC20 token_, bytes32 root) {
        token = token_;
        merkleRoot = root;
    }

    function claim(uint256 amount, bytes32[] calldata proof) external {
        if (claimed[msg.sender]) revert AlreadyClaimed();
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender, amount))));
        if (!MerkleProof.verify(proof, merkleRoot, leaf)) revert InvalidProof();
        claimed[msg.sender] = true;
        emit Claimed(msg.sender, amount);
        token.safeTransfer(msg.sender, amount);
    }
}`;

const nft = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Each token id is unique: this is the standard for one-of-a-kind items such as certificates or tickets.
contract CertificateNFT is ERC721, Ownable {
    uint256 private _nextId;

    constructor() ERC721("Course Certificate", "CERT") Ownable(msg.sender) {}

    function issue(address to) external onlyOwner returns (uint256 id) {
        id = _nextId++;
        _safeMint(to, id);
    }
}`;

const multi = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// One contract can hold many kinds of item: fungible (many copies of id 1) and unique (one copy of id 2).
contract GameItems is ERC1155, Ownable {
    uint256 public constant GOLD = 1;
    uint256 public constant LEGENDARY_SWORD = 2;

    constructor() ERC1155("https://example.com/items/{id}.json") Ownable(msg.sender) {}

    function mintGold(address to, uint256 amount) external onlyOwner {
        _mint(to, GOLD, amount, "");
    }

    function mintSword(address to) external onlyOwner {
        _mint(to, LEGENDARY_SWORD, 1, "");
    }
}`;

const vault4626 = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";

// ERC-4626: deposit an asset token, receive share tokens. If the vault earns yield, each share becomes worth more.
contract SavingsVault is ERC4626 {
    constructor(IERC20 asset_)
        ERC20("Savings Vault Share", "svSHR")
        ERC4626(asset_)
    {}
}`;

const labs = [
  classifyLab({
    id: "t1-which-standard", module: "token-fundamentals", title: "Which token standard fits?", level: "intermediate", minutes: 10, xp: 40, skills: [SK], required: true,
    objective: "Choose the standard that fits each use case.", scenario: "Different standards solve different problems. Pick the best fit for each project.",
    steps: ["Read each project.", "Choose the standard.", "Press Check my work."],
    categories: [["erc20", "ERC-20 (fungible token)"], ["erc721", "ERC-721 (unique items)"], ["erc1155", "ERC-1155 (many item types)"], ["erc4626", "ERC-4626 (tokenised vault)"]],
    items: [["A loyalty currency where every unit is identical", "erc20", "Interchangeable units."], ["A university certificate that is unique to one graduate", "erc721", "Each token id is one of a kind."], ["A game with gold coins, potions and a few unique swords in one contract", "erc1155", "Mixes fungible and unique items."], ["A savings pool where deposits get share tokens that grow in value", "erc4626", "Standard for yield vaults."], ["A stable-value payment token", "erc20", "A fungible currency."], ["A concert ticket with its own seat number", "erc721", "Each ticket is unique."], ["Batch-sending 100 different item types in one transaction", "erc1155", "Efficient batches."], ["A deposit receipt that other protocols can plug into with a common interface", "erc4626", "Common vault interface."]],
  }),
  sheetLab({
    id: "t2-decimals", module: "token-fundamentals", title: "Decimals: what the contract really stores", level: "intermediate", minutes: 12, xp: 45, skills: [SK], required: false,
    objective: "Convert between human-friendly token amounts and the whole numbers stored in the contract.",
    scenario: "Tokens store whole numbers only. A token with 6 decimals stores 1.0 as 1,000,000. Work out the stored values for a payment.",
    steps: ["In B7 work out the number of base units in one token: 10 to the power of the decimals (B2).", "In B8 work out the stored amount for the human amount in B3.", "In B9 convert it back to tokens by dividing B8 by B7.", "In B10 work out the smallest possible unit as a fraction of one token.", "In B11 work out the stored amount of a 12.75 fee (B4)."],
    cells: { A1: "Input", B1: "Value", A2: "Decimals", B2: "6", A3: "Human amount", B3: "2500.5", A4: "Fee in tokens", B4: "12.75", A7: "Base units per token", A8: "Stored amount", A9: "Converted back", A10: "Smallest unit (fraction of a token)", A11: "Stored fee" }, view: { cols: 2, rows: 13 },
    checks: [
      ck("b7", "B7 is the base units per token", "=POWER(10,B2)", "Ten to the power of the decimals.", S.formula("B7", { fns: ["POWER"], equals: 1000000 })),
      ck("b8", "B8 is the stored amount", "=B3*B7", "Human amount times base units.", S.formula("B8", { equals: 2500500000 })),
      ck("b9", "B9 is back in tokens", "=B8/B7", "Reverse the conversion.", S.formula("B9", { equals: 2500.5 })),
      ck("b10", "B10 is the smallest unit", "=1/B7", "One base unit.", S.formula("B10", { equals: 0.000001 })),
      ck("b11", "B11 is the stored fee", "=B4*B7", "Fee times base units.", S.formula("B11", { equals: 12750000 })),
    ],
    solution: { cells: { B7: "=POWER(10,B2)", B8: "=B3*B7", B9: "=B8/B7", B10: "=1/B7", B11: "=B4*B7" } },
  }),
  classifyLab({
    id: "t3-allowance", module: "building-erc20-tokens", title: "Transfer, approve or transferFrom?", level: "intermediate", minutes: 10, xp: 40, skills: [SK], required: true,
    objective: "Understand how ERC-20 moves tokens directly and through allowances.", scenario: "ERC-20 has two ways to move tokens. Decide which function fits each situation.",
    steps: ["Read each situation.", "Choose the function.", "Press Check my work."],
    categories: [["transfer", "transfer"], ["approve", "approve"], ["transferFrom", "transferFrom"]],
    items: [["You send tokens from your own wallet straight to a friend", "transfer", "Direct move by the owner."], ["You let an exchange contract spend up to 500 of your tokens", "approve", "Sets an allowance."], ["The exchange contract pulls 200 of your tokens after you approved it", "transferFrom", "A spender moves them."], ["A payment contract collects the exact fee a customer approved", "transferFrom", "Uses the allowance."], ["Reducing a previously granted allowance to zero", "approve", "Allowance changes use approve."], ["A staking contract takes tokens from you, which requires a prior step from you", "transferFrom", "Needs an allowance first."], ["Paying a shop wallet directly with no contract involved", "transfer", "No spender is needed."], ["Granting an unlimited allowance to an unknown contract", "approve", "Risky approval."]],
  }),
  wordLab({
    id: "t4-token-spec", module: "building-erc20-tokens", title: "Write a one-page token specification", level: "advanced", minutes: 18, xp: 65, skills: [SK], required: false,
    objective: "Describe a token precisely enough that a developer and an auditor can work from it.",
    scenario: "A student society wants a points token called Campus Coin (CAMP) to reward event attendance. Specify it.",
    steps: ["Add Heading 2 sections: Purpose, Parameters, Minting and burning, Admin powers.", "Under Parameters list name, symbol, decimals and the supply cap in bullets.", "Under Admin powers say who can mint and how that power is limited.", "Mention that points are not money or an investment.", "Keep it between 110 and 250 words."],
    checks: [
      ck("heads", "Four sections", "Use Heading 2.", "A clear spec.", W.heading(4, 2)),
      ck("order", "In order", "Purpose, Parameters, Minting and burning, Admin powers.", "From why to who.", W.order(["Purpose", "Parameters", "Minting and burning", "Admin powers"])),
      ck("params", "Four parameters", "Use the bullet button.", "Name, symbol, decimals, cap.", W.list(4, "ul")),
      ck("names", "Mentions Campus Coin and CAMP", "Include the name and symbol.", "Be precise.", W.pattern("Campus Coin[\\s\\S]*CAMP|CAMP[\\s\\S]*Campus Coin", "the name and symbol")),
      ck("cap", "Mentions a cap", "Mention the supply cap.", "A limit protects holders.", W.pattern("cap|maximum supply|limit", "a supply cap")),
      ck("money", "States points are not money or an investment", "Say points are not money or an investment.", "Be honest.", W.pattern("not (a |an )?(money|investment|currency|security)|no cash value|not an investment", "that points are not money or an investment")),
      ck("len", "Between 110 and 250 words", "Concise.", "One page.", W.words(110, 250)),
    ],
    solution: "<h2>Purpose</h2><p>Campus Coin rewards students for attending society events. Points can be exchanged for society merchandise. They are not money and not an investment, and they cannot be redeemed for cash.</p><h2>Parameters</h2><ul><li>Name: Campus Coin.</li><li>Symbol: CAMP.</li><li>Decimals: 18, the standard default.</li><li>Supply cap: 1,000,000 CAMP, enforced in the contract so that it can never be exceeded.</li></ul><h2>Minting and burning</h2><p>New points are minted only when an organiser records attendance at an event. Holders may burn their own points when they spend them on merchandise, which reduces the total supply.</p><h2>Admin powers</h2><p>Only the society treasurer's multi-signature wallet can mint, and minting can never go above the cap. Nobody can freeze or take points from a holder. The contract is not upgradeable, so these rules cannot be changed after deployment.</p>",
  }),
  classifyLab({
    id: "t5-red-flags", module: "advanced-token-features", title: "Feature or red flag?", level: "advanced", minutes: 12, xp: 45, skills: [SK], required: true,
    objective: "Judge token powers by how much they risk holders.", scenario: "Owner powers are sometimes necessary and sometimes a trap. Judge each one as a buyer would.",
    steps: ["Read each power.", "Choose the verdict.", "Press Check my work."],
    categories: [["fine", "Reasonable"], ["context", "Depends and must be disclosed"], ["red", "Red flag for holders"]],
    items: [["A fixed supply cap enforced in the contract", "fine", "Protects holders from dilution."], ["Holders can burn their own tokens", "fine", "Only affects their own balance."], ["An owner who can mint unlimited new tokens at any time", "red", "Holders can be diluted to nothing."], ["An owner who can freeze any holder's tokens, in a token that is designed to be regulated", "context", "Needed for some regulated tokens, but must be disclosed."], ["An owner who can change the transfer fee to 100%", "red", "Can trap everyone."], ["A pause switch controlled by a multi-signature wallet that stops trading in an emergency", "context", "Useful but trust-dependent."], ["An upgradeable proxy with no time-lock held by one anonymous key", "red", "The rules can change instantly."], ["A time-locked vesting contract for team tokens", "fine", "Aligns incentives."]],
  }),
  sheetLab({
    id: "t6-vesting", module: "advanced-token-features", title: "Calculate a vesting schedule", level: "advanced", minutes: 15, xp: 55, skills: [SK], required: false,
    objective: "Work out how many tokens are released at a given month under a cliff and linear vesting.",
    scenario: "A team member is granted 1,200,000 tokens, vesting linearly over 48 months with a 12-month cliff. How much is released after 24 months?",
    steps: ["In B7 work out the tokens released at month B5: zero before the cliff, otherwise the grant times months elapsed divided by the total months, never more than the grant.", "In B8 work out the tokens still locked.", "In B9 work out the amount released each month after the cliff.", "In B10 work out the months remaining.", "In B11 work out the percentage released."],
    cells: { A1: "Input", B1: "Value", A2: "Total grant (tokens)", B2: "1200000", A3: "Cliff (months)", B3: "12", A4: "Total vesting period (months)", B4: "48", A5: "Months elapsed", B5: "24", A7: "Released now", A8: "Still locked", A9: "Monthly amount", A10: "Months remaining", A11: "Percentage released" }, view: { cols: 2, rows: 13 },
    checks: [
      ck("b7", "B7 is the released amount", "=IF(B5<B3,0,MIN(B2,B2*B5/B4))", "Zero before the cliff, otherwise a linear share capped at the grant.", S.formula("B7", { fns: ["IF", "MIN"], equals: 600000 })),
      ck("b8", "B8 is the locked amount", "=B2-B7", "Grant minus released.", S.formula("B8", { equals: 600000 })),
      ck("b9", "B9 is the monthly amount", "=B2/B4", "Grant over the months.", S.formula("B9", { equals: 25000 })),
      ck("b10", "B10 is the months remaining", "=B4-B5", "Total minus elapsed.", S.formula("B10", { equals: 24 })),
      ck("b11", "B11 is the percentage", "=B7/B2*100", "Released over grant, times 100.", S.formula("B11", { equals: 50 })),
    ],
    solution: { cells: { B7: "=IF(B5<B3,0,MIN(B2,B2*B5/B4))", B8: "=B2-B7", B9: "=B2/B4", B10: "=B4-B5", B11: "=B7/B2*100" } },
  }),
  classifyLab({
    id: "t7-standard-features", module: "beyond-erc20", title: "Match the feature to the standard", level: "advanced", minutes: 10, xp: 40, skills: [SK], required: true,
    objective: "Connect token features to the standard that provides them.", scenario: "Beyond basic tokens there are standards for signatures, voting and vaults. Match each feature.",
    steps: ["Read each feature.", "Choose the standard.", "Press Check my work."],
    categories: [["permit", "ERC-2612 permit"], ["votes", "ERC20Votes (governance)"], ["erc721", "ERC-721"], ["erc1155", "ERC-1155"], ["erc4626", "ERC-4626"]],
    items: [["Approve a spender with a signed message instead of a separate transaction", "permit", "Saves a transaction and gas."], ["Delegate voting power and read past balances for proposals", "votes", "Historical checkpoints."], ["Every token id is a distinct item with a single owner", "erc721", "Non-fungible."], ["balanceOfBatch and safeBatchTransferFrom for many item types", "erc1155", "Multi-token batches."], ["deposit, redeem and convertToShares functions for a yield pool", "erc4626", "The vault interface."], ["A one-click gasless approval inside a trading app", "permit", "Signed approvals."], ["Counting votes at a past block to stop vote buying after the proposal starts", "votes", "Snapshot of balances."], ["Gold coins and unique swords handled by one contract", "erc1155", "Fungible and unique items."]],
  }),
  sheetLab({
    id: "t8-vault-shares", module: "beyond-erc20", title: "How vault shares grow in value", level: "advanced", minutes: 14, xp: 55, skills: [SK], required: false,
    objective: "Work out share prices and the shares minted for a new deposit in a yield vault.",
    scenario: "A vault holds 100,000 assets against 100,000 shares. It earns 5,000 in yield. A new user deposits 21,000.",
    steps: ["In B7 work out the price per share before the yield.", "In B8 work out the price per share after the yield is added.", "In B9 work out the shares minted for the deposit, rounded down with INT.", "In B10 work out the value of those shares: shares times total assets after yield divided by total shares.", "In B11 work out the rounding difference: deposit minus B10."],
    cells: { A1: "Input", B1: "Value", A2: "Total assets before yield", B2: "100000", A3: "Total shares", B3: "100000", A4: "Yield earned", B4: "5000", A5: "New deposit", B5: "21000", A7: "Price per share before", A8: "Price per share after", A9: "Shares minted", A10: "Value of those shares", A11: "Rounding difference" }, view: { cols: 2, rows: 13 },
    checks: [
      ck("b7", "B7 is the price before", "=B2/B3", "Assets over shares.", S.formula("B7", { equals: 1 })),
      ck("b8", "B8 is the price after", "=(B2+B4)/B3", "Include the yield.", S.formula("B8", { equals: 1.05 })),
      ck("b9", "B9 is the shares minted", "=INT(B5*B3/(B2+B4))", "Deposit times shares over assets, rounded down.", S.formula("B9", { fns: ["INT"], equals: 20000 })),
      ck("b10", "B10 is the value of those shares", "=B9*(B2+B4)/B3", "Shares times the price after yield.", S.formula("B10", { equals: 21000 })),
      ck("b11", "B11 is the rounding difference", "=B5-B10", "Deposit minus value.", S.formula("B11", { equals: 0 })),
    ],
    solution: { cells: { B7: "=B2/B3", B8: "=(B2+B4)/B3", B9: "=INT(B5*B3/(B2+B4))", B10: "=B9*(B2+B4)/B3", B11: "=B5-B10" } },
  }),
  classifyLab({
    id: "t9-tokenomics", module: "tokenomics-and-distribution", title: "Healthy tokenomics or warning sign?", level: "advanced", minutes: 12, xp: 45, skills: [SK], required: true,
    objective: "Judge distribution designs by fairness and sustainability.", scenario: "How tokens are distributed shapes who holds power and who is hurt when things go wrong. Judge each design.",
    steps: ["Read each design.", "Choose the verdict.", "Press Check my work."],
    categories: [["healthy", "Healthy"], ["caution", "Needs explanation"], ["warning", "Warning sign"]],
    items: [["Team tokens vest over four years with a one-year cliff", "healthy", "Aligned with long-term success."], ["Eighty percent of supply sits in a few wallets controlled by insiders", "warning", "Concentrated power and dump risk."], ["Half the supply is reserved for community rewards released gradually", "healthy", "Wide distribution over time."], ["The team can sell all tokens on day one", "warning", "No alignment."], ["A treasury holds 20% with public rules for spending", "healthy", "Transparent."], ["A large 'marketing' allocation with no stated plan", "caution", "Ask what it is for."], ["An airdrop with a claim deadline and a public list", "healthy", "Clear and fair."], ["Promised guaranteed returns to buyers", "warning", "Unrealistic and often unlawful."]],
  }),
  sheetLab({
    id: "t10-allocation", module: "tokenomics-and-distribution", title: "Build a token allocation table", level: "advanced", minutes: 15, xp: 55, skills: [SK], required: false,
    objective: "Turn allocation percentages into token counts and test whether insiders hold too much.",
    scenario: "A project plans a supply of 1,000,000,000 tokens. Work out how many tokens each group receives and whether insiders hold a sensible share.",
    steps: ["In C2 work out the tokens for the first group: percentage times supply (B8) divided by 100. Fill down to C6.", "In B9 add up the percentages to check they total 100.", "In B10 add the percentages of the Team and Investors rows.", "In B11 show Insiders hold too much if B10 is above 40, otherwise Balanced."],
    cells: { A1: "Group", B1: "Percent", C1: "Tokens", A2: "Community", B2: "40", A3: "Team", B3: "15", A4: "Investors", B4: "15", A5: "Treasury", B5: "20", A6: "Liquidity", B6: "10", A8: "Total supply", B8: "1000000000", A9: "Percentages total", A10: "Insider share (Team + Investors)", A11: "Verdict" }, view: { cols: 3, rows: 13 },
    checks: [
      ck("c2", "C2 is the community tokens", "=B2*B8/100", "Percent times supply over 100.", S.formula("C2", { equals: 400000000 })),
      ck("c5", "C5 is the treasury tokens", "=B5*B8/100", "Fill down.", S.formula("C5", { equals: 200000000 })),
      ck("b9", "B9 totals the percentages", "=SUM(B2:B6)", "Add all five.", S.formula("B9", { fns: ["SUM"], equals: 100 })),
      ck("b10", "B10 is the insider share", "=B3+B4", "Team plus investors.", S.formula("B10", { equals: 30 })),
      ck("b11", "B11 is the verdict", "=IF(B10>40,\"Insiders hold too much\",\"Balanced\")", "Compare with 40.", S.formula("B11", { fns: ["IF"], equals: "Balanced" })),
    ],
    solution: { cells: Object.assign({ B9: "=SUM(B2:B6)", B10: "=B3+B4", B11: "=IF(B10>40,\"Insiders hold too much\",\"Balanced\")" }, ...[2, 3, 4, 5, 6].map((r) => ({ [`C${r}`]: `=B${r}*B8/100` }))) },
  }),
  wordLab({
    id: "t11-disclosure", module: "launching-responsibly", title: "Write a plain-language risk disclosure", level: "advanced", minutes: 18, xp: 65, skills: [SK], required: true,
    objective: "Tell prospective holders honestly what the token is, what it is not and what could go wrong.",
    scenario: "Your society is about to publish its points token. Write the page that every user sees before they claim.",
    steps: ["Add Heading 2 sections: What this token is, What it is not, Risks, Who controls it.", "Under Risks write a bulleted list of at least four risks.", "State that the token has no guaranteed value and that this is not financial or legal advice.", "Mention the smart contract risk of bugs.", "Keep it between 120 and 280 words."],
    checks: [
      ck("heads", "Four sections", "Use Heading 2.", "A clear page.", W.heading(4, 2)),
      ck("order", "In order", "What this token is, What it is not, Risks, Who controls it.", "From facts to control.", W.order(["What this token is", "What it is not", "Risks", "Who controls it"])),
      ck("risks", "Four risks", "Use the bullet button.", "List them plainly.", W.list(4, "ul")),
      ck("value", "States no guaranteed value", "Say there is no guaranteed value.", "Honesty first.", W.pattern("no guarantee|not guaranteed|no guaranteed|may be worth nothing|could lose", "that value is not guaranteed")),
      ck("advice", "States it is not financial or legal advice", "Say this is not financial advice or legal advice.", "Avoid giving advice.", W.pattern("not (financial|legal|investment)[\\s\\S]*advice|no (financial|legal) advice", "that this is not financial or legal advice")),
      ck("bug", "Mentions contract bugs", "Mention bugs or smart contract risk.", "Code can have errors.", W.pattern("bug|smart contract risk|vulnerab", "smart contract bugs")),
      ck("len", "Between 120 and 280 words", "Concise.", "Readable by everyone.", W.words(120, 280)),
    ],
    solution: "<h2>What this token is</h2><p>Campus Coin is a points token that the society gives to members for attending events. Points can be exchanged for society merchandise.</p><h2>What it is not</h2><p>It is not money, a share in the society or an investment. It cannot be redeemed for cash, and nobody should buy it expecting a profit. This page is not financial advice or legal advice.</p><h2>Risks</h2><ul><li>There is no guaranteed value, and the points may be worth nothing outside the society.</li><li>The smart contract may contain bugs even though it has been tested, and a bug could cause loss of points.</li><li>If you lose your wallet's recovery phrase, your points cannot be recovered by anyone.</li><li>Scammers may pretend to be the society, so only trust the official page, and never share your recovery phrase.</li></ul><h2>Who controls it</h2><p>The treasurer's multi-signature wallet can mint points up to the published cap. Nobody can freeze or take points from a holder, and the contract cannot be changed after deployment.</p>",
  }),
  sheetLab({
    id: "t12-cost", module: "launching-responsibly", title: "Estimate the cost of an airdrop", level: "advanced", minutes: 14, xp: 50, skills: [SK], required: false,
    objective: "Compare sending tokens to everyone with letting people claim, using gas figures.",
    scenario: "A project wants to give tokens to 20,000 people. Sending them directly costs gas for each transfer; a Merkle claim moves the cost to each claimant and costs one root upload. (Teaching figures.)",
    steps: ["In B7 work out the gas to send to everyone: recipients times gas per transfer.", "In B8 work out the cost in ETH at the gas price (gwei): gas times gwei divided by 1,000,000,000.", "In B9 work out the project's gas cost with a Merkle airdrop: just the root upload (B5).", "In B10 work out the project's saving in ETH.", "In B11 work out the cost in rupees of the direct airdrop at the ETH price (B6)."],
    cells: { A1: "Input", B1: "Value", A2: "Recipients", B2: "20000", A3: "Gas per token transfer", B3: "52000", A4: "Gas price (gwei)", B4: "20", A5: "Gas to upload the Merkle root", B5: "60000", A6: "ETH price (rupees)", B6: "250000", A7: "Gas to send directly", A8: "Direct cost (ETH)", A9: "Merkle cost (ETH)", A10: "Saving (ETH)", A11: "Direct cost (rupees)" }, view: { cols: 2, rows: 13 },
    checks: [
      ck("b7", "B7 is the direct gas", "=B2*B3", "Recipients times gas each.", S.formula("B7", { equals: 1040000000 })),
      ck("b8", "B8 is the direct cost in ETH", "=B7*B4/1000000000", "Gas times gwei over a billion.", S.formula("B8", { equals: 1040000000 * 20 / 1e9 })),
      ck("b9", "B9 is the Merkle cost in ETH", "=B5*B4/1000000000", "Only the root upload.", S.formula("B9", { equals: 60000 * 20 / 1e9 })),
      ck("b10", "B10 is the saving", "=B8-B9", "Direct minus Merkle.", S.formula("B10", { equals: 1040000000 * 20 / 1e9 - 60000 * 20 / 1e9 })),
      ck("b11", "B11 is the rupee cost", "=B8*B6", "ETH times price.", S.formula("B11", { equals: (1040000000 * 20 / 1e9) * 250000 })),
    ],
    solution: { cells: { B7: "=B2*B3", B8: "=B7*B4/1000000000", B9: "=B5*B4/1000000000", B10: "=B8-B9", B11: "=B8*B6" } },
  }),
  wordLab({
    id: "cap-token-design", module: "capstone", title: "Final project: design a token for a real community", level: "challenge", minutes: 40, xp: 170, skills: [SK], required: true,
    objective: "Produce a professional token design document covering purpose, standard, supply, vesting, controls, risks and launch.",
    scenario: "Choose a real community such as a coding club, a local business network or a school alumni group, and design a token for it. If a token is not the right tool, say so honestly.",
    steps: ["Add a Heading 1 with the project name and 'token design'.", "Add Heading 2 sections: Purpose, Standard and parameters, Supply and distribution, Vesting, Controls and risks, Launch plan, Disclosures.", "Under Supply and distribution list at least four allocation groups in bullets with percentages.", "Under Controls and risks list at least four items in bullets.", "State that the design is not legal advice and that legal and security review are needed before launch.", "Mention one reason why a token might not be the right tool.", "Keep it between 320 and 640 words."],
    checks: [
      ck("t", "A title", "Use Heading 1.", "Name the project.", W.heading(1, 1)),
      ck("secs", "Seven sections", "Use Heading 2.", "A complete design.", W.heading(7, 2)),
      ck("order", "In order", "Purpose, Standard and parameters, Supply and distribution, Vesting, Controls and risks, Launch plan, Disclosures.", "A logical flow.", W.order(["Purpose", "Standard and parameters", "Supply and distribution", "Vesting", "Controls and risks", "Launch plan", "Disclosures"])),
      ck("alloc", "Allocation bullets", "Use the bullet button.", "Show the split.", W.list(4, "ul")),
      ck("pct", "Percentages", "Use percentages such as 40%.", "Numbers make it real.", W.pattern("\\d+ ?%", "percentages")),
      ck("std", "Names a standard", "Name ERC-20, ERC-721 or ERC-1155.", "Choose and justify.", W.pattern("ERC-?20|ERC-?721|ERC-?1155", "a token standard")),
      ck("audit", "Mentions an audit or security review", "Mention a security review or audit.", "Before launch.", W.pattern("audit|security review", "a security review")),
      ck("legal", "Mentions legal review", "Mention legal advice or legal review.", "Regulation varies by country.", W.pattern("legal (advice|review)|lawyer|regulat", "legal review")),
      ck("alt", "Mentions when a token is not needed", "Say when a token may not be the right tool.", "Honest design.", W.pattern("not be (the )?right|not (the )?right|not needed|a database|simpler|may not need|unnecessary", "that a token may not be needed")),
      ck("len", "Between 320 and 640 words", "Two pages at most.", "Readable.", W.words(320, 640)),
    ],
    solution: "<h1>Code Club token design</h1><h2>Purpose</h2><p>The Code Club rewards members for helping others, running workshops and fixing issues in the club's projects. The token tracks contributions and unlocks voting on club budgets. A token may not be the right tool if a shared spreadsheet would do the job, so we use one only because members want portable, verifiable records and a transparent vote.</p><h2>Standard and parameters</h2><p>We use ERC-20 with 18 decimals, the name Code Club Points and the symbol CCP. The supply is capped at 1,000,000 CCP in the contract, and members may burn their own tokens. The vote uses the ERC20Votes extension.</p><h2>Supply and distribution</h2><ul><li>Community contributions: 50%, released as members earn them over several years.</li><li>Founding team: 15%, vesting over four years.</li><li>Treasury for events and prizes: 25%, spent by public vote.</li><li>Reserve for partnerships: 10%, locked for one year.</li></ul><h2>Vesting</h2><p>Team tokens vest linearly over 48 months with a 12-month cliff in an audited vesting contract. The reserve is locked by a time-lock and visible on a public dashboard.</p><h2>Controls and risks</h2><ul><li>Minting is limited to the cap and controlled by a multi-signature wallet of five members, three of whom must sign.</li><li>The contract is not upgradeable, so rules cannot be changed after launch.</li><li>Smart contract bugs are possible, so a first release has a small cap and a bug bounty.</li><li>Concentrated voting power is possible, so delegation is public and large holders are disclosed.</li></ul><h2>Launch plan</h2><p>We test on a test network, complete a security review by an independent auditor, publish the verified source, and launch with a small cap that grows after a quiet period. We take legal advice about our country's rules before anything is distributed, and we publish the allocation table, the vesting contract address and the list of admin powers on the club website so that every member can check them for themselves.</p><h2>Disclosures</h2><p>The token has no guaranteed value, is not money and is not an investment. This design is not legal advice, and legal and security review are needed before launch.</p>",
  }),
];

const M1 = module_({
  slug: "token-fundamentals", title: "Token fundamentals", hours: 2.5, level: "Foundations",
  summary: "What a token is, how fungible and non-fungible tokens differ, the ERC-20 interface and how decimals work.",
  outcome: "You can explain what a token is, choose between the main standards and convert between human and stored amounts.",
  intro: "A token is not a coin with its own blockchain. It is a smart contract that keeps a table of who owns how much. This module explains that idea, introduces the standards that make tokens work everywhere and shows why decimals trip up so many beginners.",
  topics: [
    topic({
      title: "A token is a ledger inside a contract", slug: "what-is-token",
      blocks: [
        p("When you hold a token such as a stable-value payment token, your wallet does not contain coins. A smart contract keeps a table, a mapping from addresses to numbers, and your balance is the number stored next to your address. To send tokens, you call a function that subtracts from your row and adds to the recipient's row. That is the whole idea."),
        code("solidity", minimal, "MiniToken.sol"),
        table("The parts of the contract", ["Part", "Role"], [["balanceOf mapping", "The ledger: address to amount"], ["totalSupply", "The sum of all balances"], ["transfer", "Move your own tokens"], ["approve and allowance", "Let another address spend up to a limit"], ["transferFrom", "Spend tokens on someone's behalf, using an allowance"], ["Transfer and Approval events", "Let wallets and explorers track activity"], ["decimals", "How many decimal places to show"]]),
        def("Token standard", "An agreed set of function names and behaviour, such as ERC-20, so that every wallet, exchange and app can work with any token that follows it without custom code."),
        miniQuiz("what-mini", [["Where is a token balance actually stored?", ["In your wallet app", "In a mapping inside the token's smart contract", "On your phone", "In a bank"], 1, "The contract is the ledger."]]),
      ],
      points: ["A token is a ledger kept by a smart contract.", "Standards make tokens work in every wallet and app."],
      check: [["A wallet shows your token balance by:", ["Holding coins", "Asking the contract for balanceOf", "Calling your bank", "Mining"], 1, "It reads the contract."]],
    }),
    topic({
      title: "Fungible, non-fungible and multi-token standards", slug: "families",
      blocks: [
        table("The main families", ["Standard", "Items are...", "Typical use"], [["ERC-20", "Fungible: every unit is identical and interchangeable", "Currencies, points, stablecoins, governance tokens"], ["ERC-721", "Non-fungible: each token id is unique", "Certificates, tickets, collectibles, property records"], ["ERC-1155", "Multi-token: fungible and non-fungible items in one contract", "Games, large collections, batch transfers"], ["ERC-4626", "A vault whose shares are ERC-20 tokens", "Yield pools, savings, lending shares"], ["ERC-2612", "ERC-20 with approvals by signature (permit)", "Gasless approvals"]]),
        p("Pick the simplest standard that fits. A loyalty currency does not need unique ids, and a certificate should not be an interchangeable coin. Using a familiar standard also means that wallets, explorers and other developers already know how your token behaves."),
        flow("Choosing a standard", ["Is every unit identical?", "If yes: ERC-20", "If every item is unique: ERC-721", "If you need many kinds in one contract: ERC-1155", "If it represents shares of a pool: ERC-4626"]),
        miniQuiz("fam-mini", [["Which standard fits a course certificate unique to each graduate?", ["ERC-20", "ERC-721", "ERC-4626", "ERC-2612"], 1, "A unique token for each person."]]),
        tip("Always say what a token is for before choosing a standard. Many projects do not need a token at all."),
      ],
      points: ["ERC-20 is fungible, ERC-721 unique, ERC-1155 mixed, ERC-4626 vault shares.", "Choose the simplest standard that fits the job."],
      check: [["Interchangeable units point to:", ["ERC-20", "ERC-721", "A database", "A photo"], 0, "Fungible tokens."]],
    }),
    topic({
      title: "Decimals and units", slug: "decimals",
      blocks: [
        p("The contract can store only whole numbers. To represent fractions, tokens agree that the stored number is a multiple of a tiny base unit. With 18 decimals, which most tokens use, the amount 1.0 is stored as 1,000,000,000,000,000,000. With 6 decimals, as some payment tokens use, 1.0 is stored as 1,000,000. The decimals value is only a hint for display: the contract itself works only with the raw whole numbers."),
        table("Examples", ["Human amount", "Decimals", "Stored value"], [["1", "18", "1,000,000,000,000,000,000"], ["0.5", "18", "500,000,000,000,000,000"], ["2,500.5", "6", "2,500,500,000"], ["1", "0", "1"]]),
        explorer({ id: "tok-dec", title: "Decimals converter", intro: "Change the human amount and the decimals to see the stored number. A teaching tool: very large numbers are rounded here.", inputs: [{ id: "amt", label: "Human amount", min: 0, max: 1000, step: 0.5, value: 12.5 }, { id: "dec", label: "Decimals", min: 0, max: 8, step: 1, value: 6 }], outputs: [{ label: "Stored whole number", expr: "amt * pow(10, dec)", unit: "n" }, { label: "Smallest possible unit (tokens)", expr: "1 / pow(10, dec)", unit: "n" }] }),
        mistakes(["Mixing tokens with different decimals in one calculation without converting.", "Assuming every token has 18 decimals.", "Writing 100 when you meant 100 × 10^decimals in code or scripts."]),
        miniQuiz("dec-mini", [["A token with 6 decimals stores 1.0 as:", ["1", "1,000", "1,000,000", "1e18"], 2, "10 to the power of 6."]]),
      ],
      points: ["Contracts store whole numbers; decimals are a display hint.", "Always convert when tokens have different decimals."],
      check: [["With 18 decimals, 1 token is stored as:", ["1", "10^18", "18", "0"], 1, "A very large whole number."]],
    }),
  ],
  terms: [["Token", "An entry in a smart contract's ledger"], ["Fungible", "Every unit is identical"], ["Non-fungible", "Each item is unique"], ["ERC-20", "The standard for fungible tokens"], ["Decimals", "How many places to show"], ["Base unit", "The smallest indivisible amount"]],
  practical: { title: "Practical: deploy MiniToken", intro: "In Remix with a test account.", steps: ["Deploy MiniToken with an initial supply.", "Check balanceOf for your account.", "Transfer some tokens to a second account.", "Use approve and transferFrom from the second account."] },
  quiz: [
    ["A token balance lives in:", ["The token contract", "Your wallet", "A bank", "A phone"], 0, "A mapping in the contract."],
    ["ERC-20 tokens are:", ["Fungible", "Unique", "Photos", "Banks"], 0, "Interchangeable."],
    ["ERC-721 tokens are:", ["Unique", "Identical", "Free", "Private"], 0, "Each id is different."],
    ["ERC-1155 supports:", ["Many item types in one contract", "Only one coin", "Only photos", "Nothing"], 0, "Multi-token."],
    ["Standards matter because:", ["Wallets and apps can handle any compliant token", "They are required by law", "They are free", "They hide code"], 0, "Compatibility."],
    ["Decimals tell apps:", ["How to display amounts", "The price", "The owner", "The cap"], 0, "A display hint."],
    ["A contract stores:", ["Whole numbers", "Fractions", "Words only", "Images"], 0, "Raw base units."],
  ],
});

const M2 = module_({
  slug: "building-erc20-tokens", title: "Building ERC-20 tokens", hours: 2.5, level: "Core skills",
  summary: "Using OpenZeppelin to build capped, burnable, mintable tokens, and understanding allowances and their risks.",
  outcome: "You can build a capped, burnable token with OpenZeppelin and explain the approve and transferFrom flow and its dangers.",
  intro: "Writing a token from scratch is a good lesson and a bad idea for production. Professionals build on audited libraries. This module shows how to assemble a real token in a few lines and how allowances work, since they are behind many wallet-draining scams.",
  topics: [
    topic({
      title: "Assembling a token with OpenZeppelin", slug: "openzeppelin-token",
      blocks: [
        code("solidity", oz20, "CampusCoin.sol"),
        table("What each piece gives you", ["Piece", "Adds"], [["ERC20", "Balances, transfers, allowances and events, written and audited by others"], ["ERC20Burnable", "burn and burnFrom so holders can destroy their own tokens"], ["ERC20Capped", "A hard limit on total supply that cannot be exceeded"], ["Ownable", "A single owner address that can call onlyOwner functions"], ["_update override", "Required because both ERC20 and ERC20Capped hook into transfers; you must say how they combine"]]),
        p("Notice what the owner can and cannot do: mint up to the cap and nothing else. They cannot take tokens from anyone or freeze balances. Limiting powers like this is what lets holders trust a token. Every power you add must be justified, disclosed and protected."),
        miniQuiz("oz-mini", [["What does ERC20Capped guarantee?", ["Free gas", "Total supply can never exceed the cap", "No one can sell", "Faster blocks"], 1, "A hard limit."]]),
        warn("Use the official OpenZeppelin Contracts Wizard or documentation for your version. Libraries change between major versions, so copy-pasting old code can break or, worse, compile with different behaviour."),
      ],
      points: ["Build on audited libraries; combine small extensions.", "Keep owner powers as small as the design allows."],
      check: [["Why override _update in CampusCoin?", ["Two parents hook into transfers", "To save gas", "To rename it", "Because it is required for events"], 0, "Solidity needs you to resolve the conflict."]],
    }),
    topic({
      title: "Allowances: the approve and transferFrom flow", slug: "allowances",
      blocks: [
        flow("Paying a shop contract with approve and transferFrom", ["You call approve(shop, 100)", "The token records allowance[you][shop] = 100", "You call shop.pay()", "The shop calls token.transferFrom(you, shop, 100)", "The token checks the allowance, reduces it and moves the tokens"]),
        table("Why allowances are risky", ["Risk", "Explanation", "Safer habit"], [["Unlimited approvals", "Many apps ask for 'infinite' allowance for convenience; if that app is hacked, all your tokens of that kind are exposed", "Approve only what you need"], ["Fake sites", "A scam page asks you to approve its contract and then drains the tokens", "Check the address and the website; read the wallet prompt"], ["Old approvals", "Allowances stay open until you change them", "Review and revoke old ones"], ["Allowance race", "Changing an allowance from 50 to 30 can be front-run so the spender uses both", "Set to zero first, or use increase and decrease functions or permit"]]),
        p("As a developer you must treat the user's approval as a loan of trust. Pull only the amount you will use, never ask for more than the action needs, and explain it in your interface. As a user, remember that signing an approval can be as dangerous as handing over your wallet for one token."),
        miniQuiz("allow-mini", [["Why are unlimited approvals risky?", ["They cost more gas", "If the spender is compromised, all those tokens can be taken", "They are slower", "They expire quickly"], 1, "Limit what you approve."]]),
      ],
      points: ["approve sets an allowance; transferFrom spends it.", "Unlimited and forgotten approvals are common drain risks."],
      check: [["A safer approval is:", ["Unlimited always", "Only the amount needed", "Another wallet's key", "None ever"], 1, "Limit exposure."]],
    }),
    topic({
      title: "Testing and deploying a token", slug: "testing-deploying",
      blocks: [
        list("What to test", ["Total supply after construction equals the initial mint.", "transfer reduces the sender and increases the receiver by exactly the same amount.", "A transfer above the balance reverts.", "transferFrom fails without an allowance and reduces the allowance when it succeeds.", "Minting above the cap reverts, and only the owner can mint.", "burn reduces both balance and total supply.", "Events are emitted with the right values."], true),
        table("Deployment checklist", ["Step", "Why"], [["Deploy first to a test network", "Practise with no real value"], ["Verify the source code on a block explorer", "Anyone can read what the contract does"], ["Check the owner and roles after deployment", "Powers must be where you intended"], ["Move the owner to a multi-signature wallet", "Single-key risk"], ["Publish the contract address on your official site only", "Users can avoid fake tokens"], ["Document the parameters", "Name, symbol, decimals, cap and admin powers"]]),
        p("A test suite that covers these cases takes an hour to write and can save a project. Fuzz tests that send random amounts are especially good at finding arithmetic edge cases."),
        miniQuiz("test-mini", [["Why verify the source code on an explorer?", ["It lowers gas", "Anyone can inspect exactly what the deployed contract does", "It hides the code", "It is required to deploy"], 1, "Transparency builds trust."]]),
      ],
      points: ["Test supply, transfers, allowances, minting, burning and events.", "Verify the source and publish the address officially."],
      check: [["A transfer above the balance should:", ["Succeed", "Revert", "Mint tokens", "Burn tokens"], 1, "The call must fail."]],
    }),
  ],
  terms: [["OpenZeppelin", "A library of audited contracts"], ["Cap", "A maximum total supply"], ["Burn", "Permanently destroy tokens"], ["Allowance", "How much a spender may use"], ["Verified source", "Published code matching the deployed contract"], ["Owner", "An address with special powers"]],
  practical: { title: "Practical: deploy CampusCoin", intro: "In Remix on a test network.", steps: ["Deploy CampusCoin with your address as owner.", "Mint some tokens and try to exceed the cap.", "Burn tokens and watch the supply fall.", "Try minting from a second account."] },
  quiz: [
    ["Building on OpenZeppelin is:", ["Safer than writing everything", "Worse", "Banned", "Slower always"], 0, "Audited and widely used."],
    ["ERC20Burnable lets holders:", ["Destroy their own tokens", "Take others' tokens", "Change the cap", "Freeze others"], 0, "Holders may burn only their own tokens."],
    ["ERC20Capped prevents:", ["Minting beyond the cap", "Transfers", "Burning", "Reading"], 0, "Fixed maximum."],
    ["transferFrom needs:", ["An allowance", "A mining rig", "A loan", "A password"], 0, "Set by approve."],
    ["Unlimited approval risks:", ["Total loss if the spender is hacked", "Higher gas", "Nothing", "Faster blocks"], 0, "Limit exposure."],
    ["The owner should ideally be:", ["A multi-signature wallet", "A hot wallet", "Anonymous", "Unknown"], 0, "Safer control."],
    ["Verifying source on an explorer:", ["Lets anyone read the code", "Hides the code", "Costs tokens", "Burns tokens"], 0, "Transparency."],
  ],
});

const M3 = module_({
  slug: "advanced-token-features", title: "Advanced token features", hours: 2.5, level: "Core skills",
  summary: "Permit signatures, voting power, owner powers and their risks, and vesting contracts.",
  outcome: "You can add permit and voting features, judge owner powers critically and build a linear vesting schedule.",
  intro: "Real tokens often need more than transfers: governance, gasless approvals, time-locked grants and sometimes emergency controls. Each feature is useful and each adds risk. This module shows how to add them thoughtfully.",
  topics: [
    topic({
      title: "Permit and voting power", slug: "permit-votes",
      blocks: [
        code("solidity", permitVotes, "GovernanceToken.sol"),
        table("Two useful extensions", ["Extension", "What it does", "Why it matters"], [["ERC20Permit", "A holder signs an off-chain message that approves a spender; the spender submits it", "No separate approval transaction, so a smoother experience and lower cost"], ["ERC20Votes", "Tracks voting power with checkpoints and lets holders delegate", "Governance can count balances at a past block, preventing last-minute vote buying"]]),
        p("Delegation lets a holder give their voting power to themself or another address. Tokens that are not delegated have no voting power in this design, so users must delegate (even to themselves) to take part."),
        miniQuiz("pv-mini", [["What does permit let a user do?", ["Mint tokens", "Approve a spender by signing a message instead of sending a transaction", "Freeze tokens", "Change decimals"], 1, "A signed approval."]]),
        warn("Signed approvals are powerful. Wallets should show exactly what is being approved, and users should refuse requests they do not understand."),
      ],
      points: ["Permit allows approvals by signature.", "Votes tracks historical voting power and delegation."],
      check: [["ERC20Votes helps governance by:", ["Counting balances at a past block", "Lowering gas", "Hiding votes", "Minting tokens"], 0, "Checkpoints."]],
    }),
    topic({
      title: "Owner powers and honest design", slug: "owner-powers",
      blocks: [
        code("solidity", blocklist, "FreezableToken.sol"),
        table("Common owner powers", ["Power", "Why a team wants it", "Risk to holders"], [["Unlimited minting", "Flexibility", "Dilution of everyone"], ["Freezing accounts", "Compliance or theft response", "Funds can be locked arbitrarily"], ["Pausing transfers", "Emergency stop", "Trading can be halted"], ["Changing fees", "Funding the project", "Fees raised to a punishing level"], ["Upgrading the contract", "Fixing bugs", "Rules can change completely"]]),
        list("Questions a careful buyer or reviewer asks", ["Who holds each power: one person, or several through a multi-signature wallet?", "Is there a time-lock so holders can react?", "Are the powers limited in size (a fee cap, a mint cap)?", "Are they publicly documented?", "Are they truly necessary for the stated purpose?"], true),
        p("For your own designs, apply the same test: give the project only the powers it genuinely needs, cap them, put them behind several keys and a delay, and write them down. A token with no owner powers is the simplest to trust but also the hardest to fix."),
        miniQuiz("op-mini", [["Why can unlimited owner minting be harmful?", ["It costs gas", "It can dilute every holder's share", "It is slow", "It hides balances"], 1, "More tokens, smaller share."]]),
      ],
      points: ["Every owner power is a risk to holders.", "Limit, cap, delay and disclose powers."],
      check: [["A time-lock on owner actions gives holders:", ["Time to react", "Free tokens", "Faster blocks", "Anonymity"], 0, "Notice before change."]],
    }),
    topic({
      title: "Vesting contracts", slug: "vesting",
      blocks: [
        code("solidity", vesting, "LinearVesting.sol"),
        flow("How the vesting contract behaves", ["Deploy with the token, beneficiary, cliff and duration", "Send the granted tokens to the contract", "Before the cliff: nothing is released", "After the cliff: a growing share is vested", "The beneficiary calls release to receive what is vested and not yet taken", "At the end: everything is released"]),
        explorer({ id: "tok-vest", title: "Vesting calculator", intro: "Change the months elapsed to see the released amount for a 1,200,000 token grant over 48 months once the 12-month cliff has passed.", inputs: [{ id: "m", label: "Months elapsed (after the cliff has passed)", min: 12, max: 60, step: 1, value: 24 }], outputs: [{ label: "Released tokens", expr: "min(1200000, 1200000 * m / 48)", unit: "n" }] }),
        mistakes(["Locking tokens in a vesting contract with no way to check the schedule publicly.", "Giving the admin the ability to cancel without notice or limits.", "Forgetting that the contract must hold the full amount before vesting starts."]),
        miniQuiz("vest-mini", [["What does a cliff do?", ["Releases everything at once", "Releases nothing until a date, then starts vesting", "Burns tokens", "Doubles the grant"], 1, "A waiting period."]]),
      ],
      points: ["Vesting releases tokens gradually, optionally after a cliff.", "A public, audited vesting contract builds trust."],
      check: [["Why vest team tokens?", ["To align incentives over time", "To save gas", "To hide them", "To burn them"], 0, "Long-term commitment."]],
    }),
  ],
  terms: [["Permit", "Approval by signature"], ["Delegation", "Giving voting power to an address"], ["Checkpoint", "A recorded balance at a point in time"], ["Cliff", "A period before any tokens vest"], ["Vesting", "Gradual release over time"], ["Time-lock", "A delay before a change takes effect"]],
  practical: { title: "Practical: schedule a grant", intro: "Use the vesting contract.", steps: ["Deploy a token and the vesting contract.", "Send the grant to the contract.", "Call vested and release at different times.", "Describe what happens before the cliff."] },
  quiz: [
    ["Permit lets users:", ["Approve by signature", "Mint", "Burn", "Freeze"], 0, "Gasless approvals."],
    ["Delegation gives:", ["Voting power to an address", "Free tokens", "A refund", "A cap"], 0, "Governance."],
    ["Unlimited owner minting:", ["Dilutes holders", "Is harmless", "Lowers gas", "Is required"], 0, "A red flag."],
    ["A time-lock gives:", ["Notice before changes", "Free gas", "Secrecy", "Speed"], 0, "Time to react."],
    ["Vesting aligns:", ["Incentives over time", "Gas", "Names", "Blocks"], 0, "Long-term commitment."],
    ["A cliff means:", ["Nothing vests until a date", "Everything vests", "Tokens burn", "Tokens double"], 0, "A waiting period."],
    ["Freezing powers should be:", ["Disclosed and limited", "Hidden", "Unlimited", "Anonymous"], 0, "Transparency."],
  ],
});

const M4 = module_({
  slug: "beyond-erc20", title: "Beyond ERC-20: NFTs, multi-tokens and vaults", hours: 2.5, level: "Applied skills",
  summary: "ERC-721, ERC-1155 and ERC-4626: what each is for, how to build them and where they go wrong.",
  outcome: "You can build simple ERC-721, ERC-1155 and ERC-4626 contracts and choose between them.",
  intro: "Not everything is a currency. Certificates, tickets, in-game items and savings pools each have their own standard. Learning them widens the range of problems you can solve and prepares you for the next courses on NFTs, DeFi and applications.",
  topics: [
    topic({
      title: "ERC-721: unique tokens", slug: "erc721",
      blocks: [
        code("solidity", nft, "CertificateNFT.sol"),
        table("Key ERC-721 ideas", ["Idea", "Meaning"], [["Token id", "Each token has a unique number inside the contract"], ["ownerOf(id)", "Exactly one owner per token"], ["safeTransferFrom", "Checks that a contract recipient can handle NFTs, avoiding tokens stuck forever"], ["tokenURI", "A link to metadata: name, description and image"], ["Approvals", "Per-token approval and approve-for-all, the latter being a major scam vector"]]),
        p("Where the image lives matters. The token holds a pointer, not the image. If the pointer is a normal web address and the website disappears, the NFT will show nothing. Content-addressed storage reduces that risk, and the design should say clearly what is stored on the chain and what is not."),
        miniQuiz("721-mini", [["Why use safeMint and safeTransferFrom?", ["They are cheaper", "They check that a receiving contract can handle NFTs", "They hide ids", "They are required for events"], 1, "Avoid stuck tokens."]]),
      ],
      points: ["ERC-721 gives each token a unique id and one owner.", "Metadata lives off-chain; plan where."],
      check: [["ERC-721 ownerOf returns:", ["The single owner of a token id", "The cap", "The price", "The creator's name"], 0, "One owner per id."]],
    }),
    topic({
      title: "ERC-1155: many kinds in one contract", slug: "erc1155",
      blocks: [
        code("solidity", multi, "GameItems.sol"),
        table("Why games and large collections like ERC-1155", ["Feature", "Benefit"], [["One contract, many ids", "Cheaper than deploying a contract per item"], ["Fungible and unique together", "Id 1 can have millions of copies, id 2 only one"], ["Batch transfer and balance functions", "Send many item types in one transaction"], ["Shared metadata template", "A URI pattern with {id} covers every item"]]),
        p("The trade-off is that many marketplaces and tools support ERC-721 more fully than ERC-1155, and per-item features such as royalties and approvals need extra care. Choose the standard that matches the way the items will really be used."),
        miniQuiz("1155-mini", [["Which design suits a game with coins and one-of-a-kind swords?", ["Many ERC-20 contracts", "ERC-1155", "A spreadsheet", "ERC-4626"], 1, "Mixed items in one contract."]]),
      ],
      points: ["ERC-1155 handles fungible and unique items in one contract.", "It supports efficient batch operations."],
      check: [["In ERC-1155, id 1 with 1,000 copies is:", ["Fungible", "Unique", "Impossible", "Burned"], 0, "Copies are interchangeable."]],
    }),
    topic({
      title: "ERC-4626: tokenised vaults", slug: "erc4626",
      blocks: [
        code("solidity", vault4626, "SavingsVault.sol"),
        flow("How a vault works", ["A user deposits an asset token", "The vault mints share tokens in proportion", "The vault earns yield, so total assets grow", "Each share is now worth more", "The user redeems shares for assets, including the yield"]),
        table("Why a standard vault interface matters", ["Without it", "With ERC-4626"], [["Each protocol invents its own deposit and withdraw functions", "deposit, mint, withdraw, redeem and convert functions are the same everywhere"], ["Integrators write custom code per vault", "Wallets, aggregators and other protocols can plug in any vault"]]),
        warn("Vaults have a known attack: if the first depositor can manipulate the share price (an 'inflation' attack), later depositors may lose funds to rounding. The library includes mitigations, but you must understand and test them."),
        miniQuiz("4626-mini", [["What is a vault share?", ["A loan", "An ERC-20 token representing a part of the pool", "A signature", "A cap"], 1, "Shares track a portion of assets."]]),
      ],
      points: ["ERC-4626 standardises deposit, redeem and share conversion.", "Rounding and share-price manipulation are the main risks."],
      check: [["When a vault earns yield, each share becomes:", ["Worth more", "Worth less", "Worthless", "Unique"], 0, "Same shares, more assets."]],
    }),
  ],
  terms: [["NFT", "A non-fungible token"], ["ERC-721", "The standard for unique tokens"], ["ERC-1155", "The multi-token standard"], ["ERC-4626", "The tokenised vault standard"], ["Metadata", "Descriptive data for a token, usually off-chain"], ["Share", "A token representing part of a pool"]],
  practical: { title: "Practical: mint one of each", intro: "In Remix on a test network.", steps: ["Deploy CertificateNFT and issue one.", "Deploy GameItems and mint gold and a sword.", "Deploy a test token and a SavingsVault.", "Deposit and check the share balance."] },
  quiz: [
    ["ERC-721 is for:", ["Unique items", "Identical coins", "Only games", "Only art"], 0, "Each id is unique."],
    ["tokenURI points to:", ["Metadata", "The owner's key", "The cap", "The fee"], 0, "Off-chain description."],
    ["ERC-1155 allows:", ["Many item types in one contract", "Only one coin", "Only NFTs", "Nothing"], 0, "Multi-token."],
    ["ERC-4626 shares are:", ["ERC-20 tokens", "NFTs", "Signatures", "Fees"], 0, "Fungible shares."],
    ["safeMint checks:", ["The receiver can handle NFTs", "The price", "The cap", "The name"], 0, "Avoids stuck tokens."],
    ["A vault earning yield makes shares:", ["Worth more", "Worth less", "Burn", "Disappear"], 0, "Higher assets per share."],
    ["Approve-for-all is:", ["A common scam vector", "Always safe", "Banned", "Free"], 0, "Review approvals."],
  ],
});

const M5 = module_({
  slug: "tokenomics-and-distribution", title: "Tokenomics and distribution", hours: 2.5, level: "Applied skills",
  summary: "Supply design, allocation, airdrops with Merkle proofs and warning signs in token economies.",
  outcome: "You can design a fair allocation table, build a Merkle airdrop and recognise unhealthy token economies.",
  intro: "Code decides what a token can do; tokenomics decides who ends up with it and why anyone cares. Weak or unfair distribution can ruin a technically perfect token. This module covers designing allocations, handing tokens out efficiently and spotting trouble.",
  topics: [
    topic({
      title: "Supply and allocation", slug: "supply",
      blocks: [
        table("Questions of supply design", ["Question", "Considerations"], [["Fixed or growing supply?", "Fixed supply is simple and predictable; growing supply needs rules and limits"], ["How is new supply created?", "Mining rewards, earning rules or governance-approved minting"], ["Can supply shrink?", "Burning can reduce supply; explain who does it and why"], ["Who holds what?", "A fair, publicly documented allocation"], ["When can they sell?", "Vesting schedules, cliffs and locks"]]),
        table("A sample allocation", ["Group", "Share", "Rationale"], [["Community and rewards", "40%", "Released gradually to those who contribute"], ["Team", "15%", "Vests over four years"], ["Investors", "15%", "Vests with a cliff"], ["Treasury", "20%", "Spent by public vote"], ["Liquidity", "10%", "Enables trading in a fair way"]]),
        explorer({ id: "tok-alloc", title: "Allocation explorer", intro: "Change the supply and the team and investor shares to see how many tokens insiders hold. A teaching tool.", inputs: [{ id: "supply", label: "Total supply", min: 1000000, max: 1000000000, step: 1000000, value: 100000000 }, { id: "team", label: "Team %", min: 0, max: 40, step: 1, value: 15 }, { id: "inv", label: "Investors %", min: 0, max: 40, step: 1, value: 15 }], outputs: [{ label: "Insider percentage", expr: "team + inv", unit: "n" }, { label: "Insider tokens", expr: "supply * (team + inv) / 100", unit: "n" }] }),
        miniQuiz("supply-mini", [["Why publish the allocation table?", ["To impress", "So holders can judge how concentrated the supply is", "It is required by the compiler", "It lowers gas"], 1, "Transparency enables trust."]]),
      ],
      points: ["Design supply, creation, burning and allocation deliberately.", "Publish who holds what and when they can sell."],
      check: [["A healthy allocation is usually:", ["Concentrated in a few wallets", "Documented and gradual", "Secret", "Unlimited"], 1, "Transparent and fair."]],
    }),
    topic({
      title: "Airdrops and Merkle proofs", slug: "airdrops",
      blocks: [
        code("solidity", airdrop, "MerkleAirdrop.sol"),
        flow("Merkle airdrop flow", ["The project builds a list of (address, amount) pairs off-chain", "It hashes them into a Merkle tree and stores only the root on-chain", "Each user is shown a proof for their entry", "They call claim with the amount and the proof", "The contract checks the proof against the root and pays out once"]),
        p("Sending tokens to 20,000 addresses costs the project a transaction for each. A Merkle airdrop stores one 32-byte root and lets each recipient pay for their own claim. Only the people who really want the tokens bother to claim, and the project's cost stays small."),
        table("Design choices for airdrops", ["Choice", "Consideration"], [["Eligibility", "Be clear and fair; guard against fake accounts"], ["Deadline", "Allow unclaimed tokens to return to the treasury after a published date"], ["Amount", "Avoid dust, which can cost more in gas than it is worth"], ["Communication", "Official channels only, because scammers imitate airdrops"], ["Law and tax", "Distribution may have legal consequences that vary by country"]]),
        miniQuiz("air-mini", [["Why does a Merkle airdrop save the project money?", ["It skips verification", "It stores one root instead of sending to everyone", "It pays no gas ever", "It burns tokens"], 1, "Claimants pay their own gas."]]),
      ],
      points: ["A Merkle airdrop stores one root; users prove their entries.", "Plan eligibility, deadlines and communication, and take legal advice."],
      check: [["A Merkle proof shows that:", ["An entry belongs to the tree with a given root", "The token is valuable", "The user is rich", "The code is audited"], 0, "Inclusion proof."]],
    }),
    topic({
      title: "Warning signs and sustainable design", slug: "warnings",
      blocks: [
        table("Warning signs", ["Sign", "Why it matters"], [["Most supply held by a few anonymous wallets", "They can sell and crash the price"], ["No vesting for insiders", "No long-term commitment"], ["Guaranteed returns promised", "Unrealistic and often unlawful"], ["Unlimited owner minting or hidden fees", "Holders can be diluted or trapped"], ["Pressure to buy quickly", "A classic manipulation tactic"], ["Unverified contract code", "Nobody can inspect what it does"], ["No clear use for the token", "Value depends only on hype"]]),
        p("Sustainable token design starts with a real purpose that does not depend on the price rising. If the only reason to hold a token is to sell it to someone else later, the design depends on new buyers arriving and will eventually fail. If the token gives access, voting power, payments or rewards that people value, demand has a reason to exist."),
        list("Questions to ask", ["What can someone do with this token other than sell it?", "What happens if nobody new joins?", "Who can change the rules?", "Who benefits first, and who is left last?", "Is it clear and honest about its risks?"]),
        miniQuiz("warn-mini", [["Why is 'guaranteed returns' a warning sign?", ["It is boring", "No honest project can guarantee returns", "It is legal", "It is cheap"], 1, "It is a typical scam claim."]]),
        warn("This course does not give investment or legal advice. Never put in money you cannot afford to lose, and take proper advice before issuing or selling any token."),
      ],
      points: ["Concentration, no vesting, guaranteed returns and pressure are red flags.", "Sustainable design starts with real use beyond price."],
      check: [["A token with value only from new buyers depends on:", ["Real use", "Constant new buyers", "Audits", "Decimals"], 1, "That design is fragile."]],
    }),
  ],
  terms: [["Tokenomics", "The economic design of a token"], ["Allocation", "How supply is divided among groups"], ["Airdrop", "Free distribution of tokens"], ["Merkle root", "A short hash representing a whole list"], ["Treasury", "Funds held for the project"], ["Dilution", "A smaller share caused by new supply"]],
  practical: { title: "Practical: critique a token", intro: "Pick a public token.", steps: ["Find its allocation and vesting.", "Compute the insider share.", "List three warning signs or strengths.", "Write a fair summary."] },
  quiz: [
    ["Tokenomics describes:", ["Economic design of a token", "Only code", "Only art", "Only gas"], 0, "Supply, use and incentives."],
    ["A fair allocation is:", ["Documented and gradual", "Secret", "All to insiders", "Unlimited"], 0, "Transparent."],
    ["A Merkle root:", ["Represents a whole list in 32 bytes", "Holds all tokens", "Is a private key", "Is a fee"], 0, "A compact commitment."],
    ["Claimants in a Merkle airdrop:", ["Pay their own claim gas", "Pay nothing ever", "Pay the project", "Are paid gas"], 0, "Cost moves to claimants."],
    ["Guaranteed returns are:", ["A red flag", "Normal", "Legal", "Required"], 0, "No honest guarantee."],
    ["Vesting for insiders is:", ["A good sign", "A bad sign", "Illegal", "Pointless"], 0, "Commitment."],
    ["A token needs:", ["A real use beyond price", "Only hype", "Only a logo", "Only a name"], 0, "Sustainable demand."],
  ],
});

const M6 = module_({
  slug: "launching-responsibly", title: "Launching responsibly", hours: 2.5, level: "Applied skills",
  summary: "Legal awareness, security preparation, honest disclosure and a launch checklist.",
  outcome: "You can write an honest risk disclosure, plan a safe launch and recognise when a token is the wrong tool.",
  intro: "Launching a token is easy; launching one responsibly is hard. Tokens can be treated as regulated financial products in some places, scams are common, and mistakes are permanent. This module covers the habits that separate serious projects from reckless ones.",
  topics: [
    topic({
      title: "Law, regulation and honesty", slug: "law",
      blocks: [
        p("Rules about tokens vary widely by country and change quickly. A token that is a harmless loyalty point in one place may be treated as a financial instrument in another, especially if it is sold to raise money or if buyers expect profit from the efforts of others. This course cannot tell you which rules apply to you; a qualified lawyer in the relevant place can."),
        table("Questions to take to a lawyer", ["Question", "Why"], [["Does the token have features of a security or collective investment?", "Triggers licensing, disclosure and restrictions"], ["Are we selling it, giving it away or rewarding work?", "Different rules apply"], ["Who may we offer it to, in which countries?", "Cross-border rules differ"], ["Are there anti-money-laundering or know-your-customer duties?", "Some activities require identity checks"], ["What are the tax consequences for us and for recipients?", "Rewards and sales can be taxable"], ["What must we say in marketing?", "Misleading claims can be offences"]]),
        list("Honest communication", ["Say plainly what the token is and is not.", "Never promise profits or guaranteed returns.", "Disclose who holds large amounts and what powers exist.", "Explain the main risks, including bugs and loss of keys.", "Do not pressure people to buy, and never target people who cannot afford losses."]),
        miniQuiz("law-mini", [["Who can tell you which laws apply to your token?", ["Nobody", "A qualified lawyer in the relevant place", "A social media post", "The compiler"], 1, "Rules vary by place."]]),
        warn("This lesson is education, not legal advice."),
      ],
      points: ["Rules vary by country and by how a token is offered.", "Speak honestly and take professional legal advice."],
      check: [["Marketing a token should never:", ["Describe risks", "Promise guaranteed profits", "Name the contract", "State the cap"], 1, "Misleading claims are harmful."]],
    }),
    topic({
      title: "Security and scam awareness", slug: "security-scams",
      blocks: [
        table("Scams you and your users will meet", ["Scam", "How it works", "Defence"], [["Fake token", "A copy with the same name and a different contract address", "Publish the one official address and tell users to check it"], ["Rug pull", "The creators drain the liquidity or mint endlessly and disappear", "Locked liquidity, capped supply, multi-signature control and transparency"], ["Honeypot", "A token that can be bought but not sold, because the code blocks sales", "Read the code and test small; honest projects have nothing to hide"], ["Phishing approval", "A fake site asks users to approve a draining contract", "Educate users and never ask for unlimited approvals"], ["Impersonation", "Fake support accounts offer help and ask for recovery phrases", "Official channels only; nobody ever needs your recovery phrase"]]),
        list("Security habits for builders", ["Use audited libraries and keep the contract small.", "Test thoroughly, including fuzz and invariant tests.", "Get an independent review for anything holding value.", "Use a multi-signature wallet for owner powers.", "Keep deployment keys on hardware wallets, never in code.", "Publish a security contact and consider a bug bounty."]),
        miniQuiz("scam-mini", [["What is a rug pull?", ["A deployment tool", "Creators draining value from users and disappearing", "A kind of test", "A fee"], 1, "A deliberate or reckless exit."]]),
        tip("If your design makes a rug pull technically easy, users have to trust you completely. Design so that they do not have to."),
      ],
      points: ["Fake tokens, rug pulls, honeypots and phishing are common.", "Limit your own powers so users do not have to trust you blindly."],
      check: [["Nobody legitimate will ever ask for:", ["Your recovery phrase", "Your public address", "Your username", "Your feedback"], 0, "Never share it."]],
    }),
    topic({
      title: "A launch checklist", slug: "launch-checklist",
      blocks: [
        table("Before launch", ["Item", "Done when"], [["Purpose and design", "A one-page specification exists and a token is truly needed"], ["Tests", "Unit, fuzz and invariant tests pass, with high coverage"], ["Review", "An independent security review is finished and findings are fixed"], ["Legal", "Advice has been taken for the relevant countries"], ["Controls", "Owner powers sit in a multi-signature wallet; time-lock if upgradeable"], ["Transparency", "Source is verified; allocation, vesting and powers are published"], ["Disclosure", "Risks are written in plain language"], ["Support", "Official channels are announced and monitored"]]),
        table("At launch", ["Item", "Why"], [["Start on a test network, then launch with a small cap", "Limits harm from undiscovered bugs"], ["Publish the official address in one trusted place", "Reduces fake-token confusion"], ["Monitor transfers and admin actions", "Catch unusual activity fast"], ["Have an incident plan", "Know who pauses and communicates"]]),
        explorer({ id: "tok-risk", title: "Cap and expected loss", intro: "Change the launch cap and the chance of a serious bug to see the expected loss. A teaching model with made-up numbers.", inputs: [{ id: "cap", label: "Launch cap (rupees)", min: 100000, max: 100000000, step: 100000, value: 2000000 }, { id: "p", label: "Chance of a serious bug (%)", min: 1, max: 50, step: 1, value: 10 }], outputs: [{ label: "Expected loss (rupees)", expr: "cap * p / 100", unit: "rs" }] }),
        miniQuiz("launch-mini", [["Why launch with a small cap?", ["To look modest", "To limit the harm from undiscovered bugs", "To save gas", "To avoid audits"], 1, "Start small."]]),
      ],
      points: ["Design, test, review, take legal advice, then launch small.", "Publish the official address and monitor after launch."],
      check: [["After launching you should:", ["Stop paying attention", "Monitor and have an incident plan", "Remove the source", "Hide the owner"], 1, "Operations matter."]],
    }),
  ],
  terms: [["Security (in law)", "A regulated kind of investment instrument"], ["Rug pull", "An exit scam draining users' value"], ["Honeypot", "A token that cannot be sold"], ["Phishing", "Tricking users into harmful actions"], ["Disclosure", "A plain statement of facts and risks"], ["Launch cap", "A small first limit on supply or deposits"]],
  practical: { title: "Practical: audit your own launch plan", intro: "Use the checklist.", steps: ["Mark each item done, not done or not applicable.", "For each not done, write who will do it and by when.", "List three scams that could target your users.", "Write your public statement about risks."] },
  quiz: [
    ["Token law:", ["Varies by country", "Is the same everywhere", "Does not exist", "Is only for banks"], 0, "Take local advice."],
    ["A rug pull is:", ["Draining users and disappearing", "A test", "A fee", "A role"], 0, "An exit scam."],
    ["A honeypot token:", ["Cannot be sold", "Is free", "Has no owner", "Is audited"], 0, "It traps buyers who cannot exit."],
    ["Users should never share:", ["Their recovery phrase", "Their address", "Their username", "Their feedback"], 0, "Nobody needs it."],
    ["Launching small helps:", ["Limit harm from bugs", "Raise price", "Skip tests", "Hide code"], 0, "A gradual start."],
    ["Honest marketing:", ["Never promises profits", "Guarantees returns", "Hides risks", "Pressures buyers"], 0, "Plain and fair."],
    ["Owner powers should sit in:", ["A multi-signature wallet", "One anonymous wallet", "A text file", "A social post"], 0, "Reduce single-key risk."],
  ],
});

export default course({
  slug: "token-development-erc-standards", title: "Token Development & ERC Standards", tagline: "ERC-20, ERC-721, ERC-1155 and ERC-4626, with tokenomics, vesting, airdrops and a responsible launch", level: "Intermediate", hours: 14,
  summary: "Build tokens the professional way: understand the ledger inside a token contract, assemble ERC-20 tokens with OpenZeppelin, add permit, voting and vesting, learn ERC-721, ERC-1155 and ERC-4626, design tokenomics and a Merkle airdrop, and plan an honest, secure launch. All Solidity listings were compiled with solc 0.8 against OpenZeppelin 5. This course gives education, not legal or investment advice.",
  modules: [M1, M2, M3, M4, M5, M6],
  capstone: capstone({
    title: "Final project: design a token for a real community", summary: "Produce a professional token design document and pass the final assessment.",
    intro: "You can now build tokens, choose standards, design supply and plan a launch. In this final step you design a token for a real community, or explain honestly why it does not need one, covering purpose, standard, supply, vesting, controls, risks and disclosures. Then take the final assessment covering the whole course.",
    steps: ["Work through the **Final project: design a token for a real community** lab.", "Check that every owner power is justified, limited and disclosed.", "Take the final assessment below."], projectTitle: "A token design document",
    quiz: [
      ["A token balance is stored in:", ["The token contract", "Your wallet app", "A bank", "A phone"], 0, "A mapping in the contract."],
      ["Interchangeable units use:", ["ERC-20", "ERC-721", "ERC-4626 only", "A database"], 0, "Fungible tokens."],
      ["A unique certificate suits:", ["ERC-721", "ERC-20", "ERC-2612", "Nothing"], 0, "One of a kind."],
      ["A token with 6 decimals stores 1.0 as:", ["1,000,000", "1", "1,000", "1e18"], 0, "10 to the 6th."],
      ["ERC20Capped ensures:", ["Supply cannot exceed the cap", "Free gas", "No sales", "Fast blocks"], 0, "A hard limit."],
      ["Unlimited approvals risk:", ["Loss if the spender is compromised", "Higher gas", "Nothing", "Faster blocks"], 0, "Limit exposure."],
      ["Permit allows:", ["Approvals by signature", "Minting", "Freezing", "Burning"], 0, "A signed message."],
      ["A cliff in vesting means:", ["Nothing vests until a date", "Everything vests", "Tokens burn", "Tokens double"], 0, "A waiting period."],
      ["Insiders holding most of the supply is:", ["A warning sign", "Ideal", "Required", "Normal"], 0, "Concentration risk."],
      ["A Merkle airdrop stores:", ["One root on-chain", "Every address on-chain", "Nothing", "Private keys"], 0, "Compact commitment."],
      ["Before launch you need:", ["Testing, security review and legal advice", "Only a logo", "Only hype", "Nothing"], 0, "Responsible practice."],
      ["Guaranteed returns are:", ["A red flag", "Normal", "Legal always", "Required"], 0, "No honest guarantee."],
    ],
  }),
  labs,
  skills: [{ id: SK, label: "Token standards" }],
  badges: [
    { id: "standard-picker", title: "Standard picker", description: "Chose the right token standard.", when: { all: ["t1-which-standard"] } },
    { id: "red-flag-spotter", title: "Red flag spotter", description: "Judged owner powers critically.", when: { all: ["t5-red-flags"] } },
    { id: "honest-launcher", title: "Honest launcher", description: "Wrote a plain-language risk disclosure.", when: { all: ["t11-disclosure"] } },
    { id: "token-designer", title: "Token designer", description: "Designed a token for a real community.", when: { all: ["cap-token-design"] } },
  ],
  landing: {
    hero: { eyebrow: "Intermediate · Eleven compiled listings checked against OpenZeppelin 5", title: "Token development: build, distribute and launch responsibly", subtitle: "Write an ERC-20 from scratch, assemble real tokens with audited libraries, add permit, voting and vesting, learn NFTs and vaults, and design tokenomics that are fair and honest. Every task is checked and explained.", level: "Intermediate", outcomeLine: "After this course you can design, build and plan the launch of a token, or explain honestly why a project does not need one." },
    outcomes: [
      { icon: "docs", title: "Understand tokens", text: "A ledger in a contract, standards and decimals." },
      { icon: "sort", title: "Choose the right standard", text: "ERC-20, 721, 1155 and 4626." },
      { icon: "safety", title: "Judge owner powers", text: "Spot red flags in minting, freezing and fees." },
      { icon: "sheet", title: "Model tokenomics", text: "Allocation, vesting, vault shares and airdrop costs." },
      { icon: "cloud", title: "Distribute efficiently", text: "Merkle airdrops and vesting contracts." },
      { icon: "word", title: "Launch honestly", text: "Disclosures, checklists and scam awareness." },
    ],
    projects: [
      { title: "A token specification", text: "A one-page spec for a points token.", module: "building-erc20-tokens" },
      { title: "A vesting schedule", text: "Cliff and linear release calculated.", module: "advanced-token-features" },
      { title: "A risk disclosure", text: "A plain-language page for holders.", module: "launching-responsibly" },
      { title: "A full token design", text: "Purpose, supply, vesting, controls and launch.", module: "capstone" },
    ],
    tools: [{ icon: "docs", title: "Compiled code listings", text: "Tokens, vesting and airdrops verified with solc." }, { icon: "sheet", title: "Spreadsheet lab", text: "Decimals, allocation, vesting and gas." }, { icon: "word", title: "Document editor", text: "Specifications and disclosures." }],
    assessment: ["Finish the required labs in each module: they are checked automatically and explained when something is missing.", "Pass each module quiz (70% or more). Short tests inside the lessons give instant feedback.", "Complete the token design and the final assessment."],
    faq: [
      { q: "Does the platform run my Solidity?", a: "No. The labs check your designs, analysis and calculations. You run the code in your own tools on a test network." },
      { q: "Is this legal or investment advice?", a: "No. It is education. Rules about tokens vary by country, so take advice from a qualified lawyer before issuing or selling any token." },
      { q: "Should every project have a token?", a: "No. The course teaches you to ask whether a token is needed at all, and it is fine to conclude that a simpler tool is better." },
    ],
  },
  catalogue: {
    hours: "~14 hrs", weeks: "~5 weeks", pace: "3 hrs/wk", badge: "Token Standards",
    brief: "ERC-20, ERC-721, ERC-1155 and ERC-4626 with tokenomics, vesting, airdrops and responsible launch practice.",
    learn: ["How a token contract works and how decimals behave", "Building capped, burnable tokens with OpenZeppelin", "Permit, voting power, vesting and owner-power risks", "ERC-721, ERC-1155 and ERC-4626 basics", "Allocation design, Merkle airdrops and warning signs", "Disclosure, scam awareness and a launch checklist"],
    handsOn: "Write a full token design document for a real community, with supply, vesting, controls, risks and disclosures.",
    outcome: "Design and build tokens responsibly and judge other people's tokens critically.",
  },
});
