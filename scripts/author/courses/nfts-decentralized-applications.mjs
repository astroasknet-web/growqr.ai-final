import { capstone, ck, classifyLab, code, course, def, explorer, flow, list, miniQuiz, mistakes, module_, p, S, sheetLab, table, tip, topic, W, warn, wordLab } from "../kit.mjs";

const SK = "nft-dapps";

const collection = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// A small, honest collection: fixed supply, fixed price, a per-wallet limit, royalties and owner withdrawal.
contract CampusCollection is ERC721, ERC2981, Ownable {
    uint256 public constant MAX_SUPPLY = 1000;
    uint256 public constant MAX_PER_WALLET = 5;
    uint256 public immutable mintPrice;

    uint256 public totalMinted;
    string private _baseTokenURI;
    mapping(address => uint256) public mintedBy;

    error SoldOut();
    error WrongPayment();
    error WalletLimit();
    error WithdrawFailed();

    constructor(uint256 price, string memory baseURI, address royaltyReceiver)
        ERC721("Campus Collection", "CAMPUS")
        Ownable(msg.sender)
    {
        mintPrice = price;
        _baseTokenURI = baseURI;
        _setDefaultRoyalty(royaltyReceiver, 500); // 500 out of 10,000 = 5%
    }

    function mint(uint256 quantity) external payable {
        if (totalMinted + quantity > MAX_SUPPLY) revert SoldOut();
        if (msg.value != mintPrice * quantity) revert WrongPayment();
        if (mintedBy[msg.sender] + quantity > MAX_PER_WALLET) revert WalletLimit();
        mintedBy[msg.sender] += quantity;
        for (uint256 i = 0; i < quantity; i++) {
            _safeMint(msg.sender, totalMinted++);
        }
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function withdraw() external onlyOwner {
        (bool ok, ) = owner().call{value: address(this).balance}("");
        if (!ok) revert WithdrawFailed();
    }

    // Both ERC721 and ERC2981 declare supportsInterface, so we combine them.
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}`;

const allowlist = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

// Early supporters get a guaranteed spot: their addresses are in a Merkle tree and each may mint once.
contract AllowlistMint is ERC721, Ownable {
    bytes32 public immutable allowlistRoot;
    mapping(address => bool) public hasMinted;
    uint256 public nextId;

    error NotOnAllowlist();
    error AlreadyMinted();

    constructor(bytes32 root) ERC721("Early Supporter", "EARLY") Ownable(msg.sender) {
        allowlistRoot = root;
    }

    function mint(bytes32[] calldata proof) external {
        if (hasMinted[msg.sender]) revert AlreadyMinted();
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender))));
        if (!MerkleProof.verify(proof, allowlistRoot, leaf)) revert NotOnAllowlist();
        hasMinted[msg.sender] = true;
        _safeMint(msg.sender, nextId++);
    }
}`;

const onchain = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

// The artwork and its description are built inside the contract, so the NFT does not depend on any website staying online.
contract OnChainBadge is ERC721 {
    using Strings for uint256;

    uint256 public nextId;
    mapping(uint256 => uint256) public level;

    constructor() ERC721("On-chain Badge", "OCB") {}

    function mint(uint256 badgeLevel) external {
        uint256 id = nextId++;
        level[id] = badgeLevel;
        _safeMint(msg.sender, id);
    }

    function tokenURI(uint256 id) public view override returns (string memory) {
        _requireOwned(id);
        string memory svg = string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">',
            '<rect width="200" height="200" fill="#1d4ed8"/>',
            '<text x="100" y="110" font-size="48" text-anchor="middle" fill="white">L', level[id].toString(), '</text></svg>'
        );
        string memory json = string.concat(
            '{"name":"Badge #', id.toString(),
            '","description":"A level badge stored fully on-chain.","image":"data:image/svg+xml;base64,',
            Base64.encode(bytes(svg)), '"}'
        );
        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }
}`;

const market = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// A minimal fixed-price marketplace. The seller keeps the NFT until it sells and approves this contract to move it.
contract SimpleMarket is ReentrancyGuard {
    struct Listing {
        address seller;
        uint256 price;
    }

    // collection address => token id => listing
    mapping(address => mapping(uint256 => Listing)) public listings;
    mapping(address => uint256) public proceeds;

    event Listed(address indexed collection, uint256 indexed tokenId, address indexed seller, uint256 price);
    event Cancelled(address indexed collection, uint256 indexed tokenId);
    event Sold(address indexed collection, uint256 indexed tokenId, address indexed buyer, uint256 price);

    error NotOwner();
    error NotApproved();
    error NotListed();
    error WrongPrice();
    error NothingToWithdraw();
    error TransferFailed();

    function list(address collection, uint256 tokenId, uint256 price) external {
        IERC721 nft = IERC721(collection);
        if (nft.ownerOf(tokenId) != msg.sender) revert NotOwner();
        if (nft.getApproved(tokenId) != address(this) && !nft.isApprovedForAll(msg.sender, address(this))) revert NotApproved();
        listings[collection][tokenId] = Listing(msg.sender, price);
        emit Listed(collection, tokenId, msg.sender, price);
    }

    function cancel(address collection, uint256 tokenId) external {
        if (listings[collection][tokenId].seller != msg.sender) revert NotOwner();
        delete listings[collection][tokenId];
        emit Cancelled(collection, tokenId);
    }

    function buy(address collection, uint256 tokenId) external payable nonReentrant {
        Listing memory item = listings[collection][tokenId];
        if (item.seller == address(0)) revert NotListed();
        if (msg.value != item.price) revert WrongPrice();
        delete listings[collection][tokenId];                 // effects first
        proceeds[item.seller] += msg.value;                   // seller withdraws later (pull payment)
        IERC721(collection).safeTransferFrom(item.seller, msg.sender, tokenId); // interaction last
        emit Sold(collection, tokenId, msg.sender, item.price);
    }

    function withdraw() external nonReentrant {
        uint256 amount = proceeds[msg.sender];
        if (amount == 0) revert NothingToWithdraw();
        proceeds[msg.sender] = 0;
        (bool ok, ) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}`;

const soulbound = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// A credential that cannot be sold or traded: it can be issued and revoked by the issuer, never transferred.
contract SoulboundCredential is ERC721, Ownable {
    uint256 public nextId;

    error NonTransferable();

    constructor() ERC721("Course Credential", "CRED") Ownable(msg.sender) {}

    function issue(address to) external onlyOwner returns (uint256 id) {
        id = nextId++;
        _safeMint(to, id);
    }

    function revoke(uint256 id) external onlyOwner {
        _burn(id);
    }

    // In OpenZeppelin 5 every mint, burn and transfer passes through _update.
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert NonTransferable();
        return super._update(to, tokenId, auth);
    }
}`;

const metadataJson = `{
  "name": "Campus Collection #7",
  "description": "A member card for the Campus Collection community.",
  "image": "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/7.png",
  "external_url": "https://example.com/collection/7",
  "attributes": [
    { "trait_type": "Faculty", "value": "Engineering" },
    { "trait_type": "Year", "value": "2026" },
    { "display_type": "number", "trait_type": "Level", "value": 3 }
  ]
}`;

const frontend = `// A browser front end using ethers v6 (installed with: npm install ethers)
const { ethers } = require("ethers");

const COLLECTION_ABI = [
  "function mintPrice() view returns (uint256)",
  "function totalMinted() view returns (uint256)",
  "function mint(uint256 quantity) payable",
  "function tokenURI(uint256 id) view returns (string)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

async function mintOne(collectionAddress) {
  // 1. Ask the wallet for access (MetaMask or another EIP-1193 provider)
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const collection = new ethers.Contract(collectionAddress, COLLECTION_ABI, signer);

  // 2. Read the price from the contract, never hard-code it in the page
  const price = await collection.mintPrice();

  // 3. Send the transaction and wait for it to be mined
  const tx = await collection.mint(1, { value: price });
  const receipt = await tx.wait();
  return receipt.hash;
}

async function loadMyTokens(collectionAddress, owner) {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const collection = new ethers.Contract(collectionAddress, COLLECTION_ABI, provider);
  // Events are the cheap way to discover which tokens an address received
  const received = await collection.queryFilter(collection.filters.Transfer(null, owner));
  return received.map((e) => e.args.tokenId.toString());
}`;

const labs = [
  classifyLab({
    id: "n1-onchain-offchain", module: "nft-fundamentals", title: "On-chain or off-chain?", level: "intermediate", minutes: 10, xp: 40, skills: [SK], required: true,
    objective: "Separate what an NFT contract really stores from what it only points to.", scenario: "People often think the picture is on the blockchain. Usually it is not. Decide where each piece lives in a typical NFT.",
    steps: ["Read each item.", "Choose where it lives.", "Press Check my work."],
    categories: [["onchain", "On the blockchain"], ["offchain", "Off-chain (a link points to it)"], ["neither", "Not part of the NFT at all"]],
    items: [["Which address owns token #7", "onchain", "Ownership is the contract's ledger."], ["The high-resolution image file", "offchain", "Usually stored on IPFS or a web server."], ["The token's id number", "onchain", "A number in the contract."], ["The name and description in the metadata JSON", "offchain", "Usually in a file the token URI points to."], ["The copyright to the artwork", "neither", "Law and licence terms decide this, not the token."], ["The royalty percentage declared by the contract", "onchain", "ERC-2981 stores it in the contract."], ["The artist's reputation", "neither", "Not part of the token."], ["The URL that tokenURI returns", "onchain", "The pointer is on-chain even if the file is not."]],
  }),
  sheetLab({
    id: "n2-resale-split", module: "nft-fundamentals", title: "Who gets what in a resale?", level: "intermediate", minutes: 12, xp: 45, skills: [SK], required: false,
    objective: "Split a resale price between the marketplace fee, the creator's royalty and the seller.",
    scenario: "An NFT resells for 200,000 rupees. The marketplace charges 2.5% and the creator's royalty is 5%. Work out the split. (A teaching model.)",
    steps: ["In B7 work out the marketplace fee: price times fee percentage over 100.", "In B8 work out the creator royalty.", "In B9 work out what the seller receives.", "In B10 work out the seller's share as a percentage of the price.", "In B11 work out the total taken in fees and royalties."],
    cells: { A1: "Input", B1: "Value", A2: "Sale price (rupees)", B2: "200000", A3: "Marketplace fee (%)", B3: "2.5", A4: "Creator royalty (%)", B4: "5", A7: "Marketplace fee", A8: "Creator royalty", A9: "Seller receives", A10: "Seller share (%)", A11: "Total fees and royalty" }, view: { cols: 2, rows: 13 },
    checks: [
      ck("b7", "B7 is the marketplace fee", "=B2*B3/100", "Price times percentage over 100.", S.formula("B7", { equals: 5000 })),
      ck("b8", "B8 is the royalty", "=B2*B4/100", "Same method with the royalty rate.", S.formula("B8", { equals: 10000 })),
      ck("b9", "B9 is the seller's amount", "=B2-B7-B8", "Price minus both deductions.", S.formula("B9", { equals: 185000 })),
      ck("b10", "B10 is the seller's share", "=B9/B2*100", "Seller amount over price, times 100.", S.formula("B10", { equals: 185000 / 200000 * 100 })),
      ck("b11", "B11 is the total taken", "=B7+B8", "Fee plus royalty.", S.formula("B11", { equals: 15000 })),
    ],
    solution: { cells: { B7: "=B2*B3/100", B8: "=B2*B4/100", B9: "=B2-B7-B8", B10: "=B9/B2*100", B11: "=B7+B8" } },
  }),
  classifyLab({
    id: "n3-mint-protections", module: "building-nft-contracts", title: "Which line protects against what?", level: "advanced", minutes: 12, xp: 45, skills: [SK], required: true,
    objective: "Link each protection in a minting contract to the problem it prevents.", scenario: "Each check in CampusCollection exists for a reason. Match the problem to the protection.",
    steps: ["Read each problem.", "Choose the protection.", "Press Check my work."],
    categories: [["supply", "MAX_SUPPLY check"], ["payment", "Exact payment check"], ["wallet", "Per-wallet limit"], ["owner", "onlyOwner on withdraw"], ["safe", "_safeMint"], ["royalty", "ERC-2981 default royalty"]],
    items: [["More tokens than the promised collection size are created", "supply", "Fixed scarcity."], ["Someone pays less than the price and still mints", "payment", "msg.value must equal price times quantity."], ["One bot buys the entire collection in one go", "wallet", "Limits concentration."], ["A stranger withdraws the sale proceeds", "owner", "Only the owner may withdraw."], ["A token is minted to a contract that cannot handle NFTs and is lost forever", "safe", "The receiver must accept NFTs."], ["The creator earns nothing from later resales on marketplaces that honour it", "royalty", "Declares the royalty."], ["The collection claims 1,000 tokens but has 1,200", "supply", "Counts minted tokens."], ["Overpaying by accident", "payment", "Exact amount avoids stuck money."]],
  }),
  wordLab({
    id: "n4-mint-page", module: "building-nft-contracts", title: "Specify a fair mint", level: "advanced", minutes: 16, xp: 55, skills: [SK], required: false,
    objective: "Describe the rules of a mint in plain language so that buyers and developers agree.",
    scenario: "A university club will mint 500 membership NFTs. Write the rules of the mint.",
    steps: ["Add Heading 2 sections: Supply and price, Limits, Allowlist, Refunds and support.", "Under Supply and price list the supply, the price and the date in bullets.", "Under Limits state the per-wallet limit and how bots are discouraged.", "Mention royalties and that the NFT does not transfer copyright.", "Keep it between 110 and 250 words."],
    checks: [
      ck("heads", "Four sections", "Use Heading 2.", "A clear page.", W.heading(4, 2)),
      ck("order", "In order", "Supply and price, Limits, Allowlist, Refunds and support.", "From what to support.", W.order(["Supply and price", "Limits", "Allowlist", "Refunds and support"])),
      ck("bul", "Three facts in bullets", "Use the bullet button.", "Supply, price, date.", W.list(3, "ul")),
      ck("limit", "A per-wallet limit", "Mention per wallet or per person.", "Fairness.", W.pattern("per wallet|per person|each wallet|each person", "a per-wallet limit")),
      ck("roy", "Mentions royalties", "Mention royalty or royalties.", "Be open about creator income.", W.pattern("royalt", "royalties")),
      ck("copy", "Says copyright is not transferred", "Say the NFT does not transfer copyright.", "Ownership of a token is not ownership of the work.", W.pattern("copyright|licen[cs]e", "that copyright is not transferred")),
      ck("len", "Between 110 and 250 words", "Concise.", "One page.", W.words(110, 250)),
    ],
    solution: "<h2>Supply and price</h2><ul><li>Supply: exactly 500 membership NFTs, enforced in the contract.</li><li>Price: 1,000 rupees worth of ETH each, set in the contract and shown in the page.</li><li>Date: the allowlist opens on 1 March and the public mint on 3 March.</li></ul><h2>Limits</h2><p>Each wallet may mint at most two NFTs so that no single person or bot can take the whole collection. The contract enforces the limit per wallet, and we also publish all addresses that mint.</p><h2>Allowlist</h2><p>Current members are on an allowlist stored as a Merkle root. Each member can mint once during the first two days by proving they are on the list.</p><h2>Refunds and support</h2><p>Minting is final, and there are no refunds. Support is available on the official club page only. A royalty of five percent goes to the club on resales on marketplaces that respect it. Owning the NFT gives club membership benefits but does not transfer the copyright of the artwork, which stays with the artist, who grants holders a licence to display it.</p>",
  }),
  classifyLab({
    id: "n5-storage", module: "metadata-and-storage", title: "How durable is this storage choice?", level: "advanced", minutes: 12, xp: 45, skills: [SK], required: true,
    objective: "Judge where NFT files are stored by how long they are likely to last and who can change them.", scenario: "An NFT that points at a missing file is an empty receipt. Judge each storage approach.",
    steps: ["Read each approach.", "Choose the verdict.", "Press Check my work."],
    categories: [["strong", "Strong: tamper-resistant and durable"], ["fair", "Fair: works but depends on someone"], ["weak", "Weak: can vanish or be changed"]],
    items: [["Image and metadata fully on-chain", "strong", "Lives as long as the chain."], ["A content-addressed IPFS link that is pinned by several services", "strong", "The address is a fingerprint of the content."], ["An IPFS link pinned only by the creator's laptop", "fair", "Content-addressed but easily lost."], ["A normal web address on the creator's server", "weak", "Can be changed or deleted at any time."], ["Metadata that the owner can change at will after minting", "weak", "Holders cannot rely on it."], ["Permanent storage paid for in advance on a network designed for it", "strong", "Built for long-term storage."], ["A link to a social media image", "weak", "Platforms remove and change links."], ["A metadata reveal that is published and then frozen with an on-chain statement", "fair", "Trust until frozen."]],
  }),
  sheetLab({
    id: "n6-onchain-cost", module: "metadata-and-storage", title: "What does on-chain storage cost?", level: "advanced", minutes: 14, xp: 55, skills: [SK], required: false,
    objective: "Estimate the cost of putting an image on-chain and compare it with pinned off-chain storage.",
    scenario: "A 3,200-byte SVG would be stored on-chain in 32-byte words at about 22,100 gas per new word. Compare with paying a pinning service. (Teaching figures.)",
    steps: ["In B7 work out how many 32-byte words are needed, rounding up.", "In B8 work out the gas for storing them.", "In B9 work out the cost in ETH at the gas price in gwei.", "In B10 convert to rupees.", "In B11 show On-chain costs more if B10 is above the pinning cost (B6), otherwise On-chain is cheaper."],
    cells: { A1: "Input", B1: "Value", A2: "Image size (bytes)", B2: "3200", A3: "Gas per new 32-byte word", B3: "22100", A4: "Gas price (gwei)", B4: "20", A5: "ETH price (rupees)", B5: "250000", A6: "Pinning cost for the same file (rupees)", B6: "200", A7: "Words needed", A8: "Gas needed", A9: "Cost (ETH)", A10: "Cost (rupees)", A11: "Verdict" }, view: { cols: 2, rows: 13 },
    checks: [
      ck("b7", "B7 is the words needed", "=ROUNDUP(B2/32,0)", "Round up to whole words.", S.formula("B7", { fns: ["ROUNDUP"], equals: 100 })),
      ck("b8", "B8 is the gas", "=B7*B3", "Words times gas each.", S.formula("B8", { equals: 2210000 })),
      ck("b9", "B9 is the cost in ETH", "=B8*B4/1000000000", "Gas times gwei over a billion.", S.formula("B9", { equals: 2210000 * 20 / 1e9 })),
      ck("b10", "B10 is the cost in rupees", "=B9*B5", "ETH times price.", S.formula("B10", { equals: (2210000 * 20 / 1e9) * 250000 })),
      ck("b11", "B11 is the verdict", "=IF(B10>B6,\"On-chain costs more\",\"On-chain is cheaper\")", "Compare with the pinning cost.", S.formula("B11", { fns: ["IF"], equals: "On-chain costs more" })),
    ],
    solution: { cells: { B7: "=ROUNDUP(B2/32,0)", B8: "=B7*B3", B9: "=B8*B4/1000000000", B10: "=B9*B5", B11: "=IF(B10>B6,\"On-chain costs more\",\"On-chain is cheaper\")" } },
  }),
  classifyLab({
    id: "n7-market-flow", module: "marketplaces-and-dapps", title: "Who does what in a sale?", level: "advanced", minutes: 12, xp: 45, skills: [SK], required: true,
    objective: "Follow the steps of a fixed-price sale and who performs each.", scenario: "In SimpleMarket the seller keeps the NFT until it sells. Decide who performs each step.",
    steps: ["Read each step.", "Choose who does it.", "Press Check my work."],
    categories: [["seller", "The seller"], ["buyer", "The buyer"], ["market", "The marketplace contract"], ["nft", "The NFT contract"]],
    items: [["Approves the marketplace to move the NFT", "seller", "approve or setApprovalForAll on the NFT."], ["Calls list with a price", "seller", "Creates the listing."], ["Sends the exact price with buy", "buyer", "Pays msg.value."], ["Deletes the listing before moving the token", "market", "Effects before interactions."], ["Moves the token from the seller to the buyer", "nft", "Executes safeTransferFrom."], ["Records the seller's proceeds for withdrawal", "market", "Pull payment."], ["Calls withdraw to receive proceeds", "seller", "Pulls their money."], ["Reverts if the price sent is wrong", "market", "WrongPrice."]],
  }),
  wordLab({
    id: "n8-user-journey", module: "marketplaces-and-dapps", title: "Write a dApp user journey", level: "advanced", minutes: 18, xp: 65, skills: [SK], required: false,
    objective: "Describe, step by step, how a first-time user mints an NFT in a dApp, including what could go wrong.",
    scenario: "A student who has never used a wallet wants to claim a membership NFT in your dApp. Describe the journey.",
    steps: ["Add Heading 2 sections: Before you start, Steps, What can go wrong, Staying safe.", "Under Steps write a numbered list of at least six steps.", "Under What can go wrong list at least three problems in bullets with help.", "Mention the recovery phrase and that nobody should ever ask for it.", "Keep it between 130 and 300 words."],
    checks: [
      ck("heads", "Four sections", "Use Heading 2.", "A clear journey.", W.heading(4, 2)),
      ck("order", "In order", "Before you start, Steps, What can go wrong, Staying safe.", "Beginning to end.", W.order(["Before you start", "Steps", "What can go wrong", "Staying safe"])),
      ck("steps", "Six steps", "Use the numbered list button.", "A simple path.", W.list(6, "ol")),
      ck("probs", "Three problems", "Use the bullet button.", "Anticipate trouble.", W.list(3, "ul")),
      ck("phrase", "Mentions the recovery phrase", "Mention the recovery phrase or seed phrase.", "A key safety point.", W.pattern("recovery phrase|seed phrase|secret phrase", "the recovery phrase")),
      ck("never", "Says nobody should ask for it", "Say never share it or nobody should ask.", "Scammers ask.", W.pattern("never share|nobody (will|should)|no one (will|should)|never ask", "that nobody should ask for it")),
      ck("len", "Between 130 and 300 words", "Concise.", "Easy to follow.", W.words(130, 300)),
    ],
    solution: "<h2>Before you start</h2><p>You need a wallet on your phone or browser, a little test or network currency for fees, and the official link from the club page. Write down your recovery phrase on paper and keep it private.</p><h2>Steps</h2><ol><li>Open the official club page and check the address bar.</li><li>Press Connect wallet and approve the connection in your wallet.</li><li>Check that the wallet is on the correct network.</li><li>Press Mint and read the details shown by the wallet.</li><li>Confirm the transaction and wait until it is marked as complete.</li><li>Open the My NFTs section and see your membership card.</li></ol><h2>What can go wrong</h2><ul><li>The transaction fails because there is not enough currency for fees: add a little more and try again.</li><li>The wallet is on the wrong network: switch networks using the button in the dApp.</li><li>The mint is sold out or your wallet has reached its limit: the page shows a clear message.</li></ul><h2>Staying safe</h2><p>Nobody from the club will ever ask for your recovery phrase, so never share it with anyone. Ignore messages from strangers offering help, and only trust the official page.</p>",
  }),
  classifyLab({
    id: "n9-use-fit", module: "utility-and-business", title: "Does an NFT fit this idea?", level: "advanced", minutes: 12, xp: 45, skills: [SK], required: true,
    objective: "Decide whether an NFT genuinely helps in each use case.", scenario: "NFTs are a tool, not a goal. Judge each idea honestly.",
    steps: ["Read each idea.", "Choose the verdict.", "Press Check my work."],
    categories: [["good", "A good fit"], ["maybe", "Possible, with care"], ["poor", "A poor fit"]],
    items: [["A verifiable course certificate that employers can check without calling the college", "good", "Public verification is the point."], ["Event tickets that can be checked at the gate and resold under rules", "good", "Unique, transferable and verifiable."], ["A members-only pass that unlocks a community", "maybe", "Works if access is enforced and the community has real value."], ["A database of internal student marks that must stay private", "poor", "Public chains expose data."], ["A credential that must be revocable and non-transferable", "maybe", "Needs a soulbound design and a privacy review."], ["A promise of guaranteed profits for buyers", "poor", "Dishonest and likely unlawful."], ["A land record where legal ownership is defined by the government register", "maybe", "The token does not change the law."], ["A shared spreadsheet that one team edits", "poor", "No need for a blockchain."]],
  }),
  sheetLab({
    id: "n10-mint-economics", module: "utility-and-business", title: "Will the mint cover its costs?", level: "advanced", minutes: 14, xp: 55, skills: [SK], required: false,
    objective: "Calculate revenue, profit and the break-even point of a mint.",
    scenario: "A project plans to mint 1,000 NFTs at 2,000 rupees each, expects 60% to sell, and has costs for development and art. (A teaching model.)",
    steps: ["In B7 work out the NFTs sold: supply times the sold percentage over 100.", "In B8 work out the revenue.", "In B9 work out the total costs.", "In B10 work out the profit.", "In B11 work out the break-even number of NFTs, rounded up."],
    cells: { A1: "Input", B1: "Value", A2: "Supply", B2: "1000", A3: "Mint price (rupees)", B3: "2000", A4: "Expected sold (%)", B4: "60", A5: "Development cost (rupees)", B5: "500000", A6: "Art and legal cost (rupees)", B6: "300000", A7: "NFTs sold", A8: "Revenue", A9: "Total costs", A10: "Profit", A11: "Break-even NFTs" }, view: { cols: 2, rows: 13 },
    checks: [
      ck("b7", "B7 is the NFTs sold", "=B2*B4/100", "Supply times percentage.", S.formula("B7", { equals: 600 })),
      ck("b8", "B8 is the revenue", "=B7*B3", "Sold times price.", S.formula("B8", { equals: 1200000 })),
      ck("b9", "B9 is the total costs", "=B5+B6", "Add both costs.", S.formula("B9", { equals: 800000 })),
      ck("b10", "B10 is the profit", "=B8-B9", "Revenue minus costs.", S.formula("B10", { equals: 400000 })),
      ck("b11", "B11 is the break-even", "=ROUNDUP(B9/B3,0)", "Costs over price, rounded up.", S.formula("B11", { fns: ["ROUNDUP"], equals: 400 })),
    ],
    solution: { cells: { B7: "=B2*B4/100", B8: "=B7*B3", B9: "=B5+B6", B10: "=B8-B9", B11: "=ROUNDUP(B9/B3,0)" } },
  }),
  wordLab({
    id: "n11-buyer-notice", module: "safety-law-and-ethics", title: "Write an honest buyer notice", level: "advanced", minutes: 18, xp: 65, skills: [SK], required: true,
    objective: "Tell buyers plainly what they get, what they do not get and what could go wrong.",
    scenario: "Your club is selling membership NFTs. Write the notice every buyer sees before paying.",
    steps: ["Add Heading 2 sections: What you get, What you do not get, Risks, Rights and licence.", "Under Risks write a bulleted list of at least four risks.", "State that the NFT has no guaranteed resale value and is not an investment.", "State what licence holders get for the artwork.", "Keep it between 120 and 280 words."],
    checks: [
      ck("heads", "Four sections", "Use Heading 2.", "A clear notice.", W.heading(4, 2)),
      ck("order", "In order", "What you get, What you do not get, Risks, Rights and licence.", "From benefits to rights.", W.order(["What you get", "What you do not get", "Risks", "Rights and licence"])),
      ck("risks", "Four risks", "Use the bullet button.", "Be candid.", W.list(4, "ul")),
      ck("value", "States no guaranteed resale value", "Say there is no guaranteed resale value or the NFT may be worth nothing.", "Honesty first.", W.pattern("no guarantee|not guaranteed|worth nothing|may lose|could lose|no guaranteed", "that resale value is not guaranteed")),
      ck("invest", "States it is not an investment", "Say it is not an investment.", "Avoid misleading buyers.", W.pattern("not an investment|not a financial|not investment", "that it is not an investment")),
      ck("licence", "Describes the licence", "Mention the licence or copyright.", "Be clear about rights.", W.pattern("licen[cs]e|copyright", "the licence")),
      ck("len", "Between 120 and 280 words", "Concise.", "Easy to read.", W.words(120, 280)),
    ],
    solution: "<h2>What you get</h2><p>You get one membership NFT, recorded on a public blockchain, that unlocks access to club events and the members' area for as long as you hold it.</p><h2>What you do not get</h2><p>You do not get the copyright of the artwork, a share in the club or any promise of profit. This is not an investment, and nothing here is financial advice.</p><h2>Risks</h2><ul><li>There is no guaranteed resale value, and the NFT may be worth nothing to anyone else.</li><li>The smart contract could contain bugs even after testing and review.</li><li>If you lose your wallet's recovery phrase, nobody can recover the NFT for you.</li><li>Scammers copy projects, so only trust the official page and contract address.</li><li>Rules for digital assets differ between countries and can change.</li></ul><h2>Rights and licence</h2><p>The artist keeps the copyright. Holders receive a personal, non-exclusive licence to display the artwork for non-commercial purposes while they own the NFT.</p>",
  }),
  classifyLab({
    id: "n12-scams", module: "safety-law-and-ethics", title: "Scam, risky or fine?", level: "advanced", minutes: 10, xp: 40, skills: [SK], required: false,
    objective: "Recognise common NFT scams and unsafe behaviour.", scenario: "NFT communities attract copycats and thieves. Judge each situation.",
    steps: ["Read each situation.", "Choose the verdict.", "Press Check my work."],
    categories: [["scam", "Scam"], ["risky", "Risky"], ["fine", "Fine"]],
    items: [["A stranger sends a free NFT and a link to claim a prize by approving a contract", "scam", "Approval phishing."], ["Support staff ask for your recovery phrase", "scam", "Nobody legitimate asks."], ["Minting from the project's official link on the official website", "fine", "The normal path."], ["Buying from a copy of the collection with a similar name", "risky", "Check the contract address."], ["Approving unlimited access for a marketplace you have never heard of", "risky", "Limit approvals."], ["The same person buying and selling to themselves to fake demand", "scam", "Wash trading."], ["Checking the collection's verified contract on a block explorer before buying", "fine", "Good practice."], ["A mint that promises guaranteed profit", "scam", "No honest guarantee."]],
  }),
  wordLab({
    id: "cap-nft-plan", module: "capstone", title: "Final project: plan an NFT and dApp for a real use", level: "challenge", minutes: 40, xp: 170, skills: [SK], required: true,
    objective: "Produce a professional plan for an NFT project and its dApp, covering purpose, contract design, storage, user journey, economics, safety and honest limits.",
    scenario: "Pick a real use such as certificates, event tickets or memberships, and plan the NFT project. If an NFT is not the right tool, say so honestly.",
    steps: ["Add a Heading 1 with the project name and 'NFT plan'.", "Add Heading 2 sections: Purpose, Contract design, Metadata and storage, dApp journey, Economics, Safety and legal, Limits.", "Under Contract design list at least four features or protections in bullets.", "Under dApp journey write a numbered list of at least five steps.", "Under Economics include numbers such as supply, price or royalty percentages.", "Mention who owns the copyright and that this is not legal advice.", "Keep it between 320 and 640 words."],
    checks: [
      ck("t", "A title", "Use Heading 1.", "Name the project.", W.heading(1, 1)),
      ck("secs", "Seven sections", "Use Heading 2.", "A complete plan.", W.heading(7, 2)),
      ck("order", "In order", "Purpose, Contract design, Metadata and storage, dApp journey, Economics, Safety and legal, Limits.", "A logical flow.", W.order(["Purpose", "Contract design", "Metadata and storage", "dApp journey", "Economics", "Safety and legal", "Limits"])),
      ck("feat", "Four contract features", "Use the bullet button.", "List protections.", W.list(4, "ul")),
      ck("steps", "Five journey steps", "Use the numbered list button.", "Follow the user.", W.list(5, "ol")),
      ck("num", "Numbers in the economics", "Include numbers or percentages.", "Be concrete.", W.pattern("\\d", "numbers")),
      ck("store", "Names a storage choice", "Mention IPFS, on-chain or permanent storage.", "Where do files live?", W.pattern("IPFS|on-chain|permanent|Arweave", "a storage choice")),
      ck("copy", "Mentions copyright", "Say who owns the copyright.", "Token versus work.", W.pattern("copyright|licen[cs]e", "copyright")),
      ck("legal", "States it is not legal advice", "Say this is not legal advice.", "Be honest.", W.pattern("not legal advice|legal advice", "that this is not legal advice")),
      ck("len", "Between 320 and 640 words", "Two pages at most.", "Readable.", W.words(320, 640)),
    ],
    solution: "<h1>Graduation certificates NFT plan</h1><h2>Purpose</h2><p>The college wants employers to verify a graduate's certificate in seconds without writing to the registrar. Each certificate becomes a non-transferable token that only the college can issue or revoke. A normal signed PDF with a verification page may be enough for some courses, so we use a token only where public, long-lived verification matters.</p><h2>Contract design</h2><ul><li>ERC-721 with a soulbound rule so that tokens cannot be sold or transferred.</li><li>Only the registrar's multi-signature wallet can issue or revoke.</li><li>No personal data on the chain, only a certificate number and a hash of the record.</li><li>Events for every issue and revoke so that outside tools can monitor activity.</li></ul><h2>Metadata and storage</h2><p>The certificate image and details are stored on IPFS and pinned by the college and two independent services. The token holds only the content address, and the metadata is frozen after issue so that nobody can change it.</p><h2>dApp journey</h2><ol><li>The graduate opens the official college page and connects a wallet.</li><li>The page checks the graduate's identity using the college login.</li><li>The registrar approves the issue request.</li><li>The token is issued to the graduate's wallet.</li><li>The graduate shares a verification link.</li><li>An employer opens the link and sees the certificate status read from the chain.</li></ol><h2>Economics</h2><p>There is no sale and no royalty. We expect to issue 1,500 certificates a year. At the current network fees of about 30 rupees each, the yearly cost is around 45,000 rupees, plus 100,000 rupees for development and one security review.</p><h2>Safety and legal</h2><p>The college keeps the copyright of the certificate design and grants holders a licence to display it. We take legal advice on privacy law before launch, and this plan is not legal advice. Wallet recovery help and a revoke process for mistakes are published.</p><h2>Limits</h2><p>The token proves what the college recorded; it does not by itself prove that the education was good, and employers still need to trust the college.</p>",
  }),
];

const M1 = module_({
  slug: "nft-fundamentals", title: "NFT fundamentals", hours: 1.5, level: "Foundations",
  summary: "What an NFT really is, what ownership means, what lives on and off the chain and why metadata matters.",
  outcome: "You can explain precisely what an NFT contains, what ownership does and does not mean and where the data lives.",
  intro: "NFTs have been hyped and mocked in equal measure. Strip away both and you find a simple tool: a unique entry in a public ledger. This module explains exactly what that entry is, what it is not, and why the answer matters when you build or buy.",
  topics: [
    topic({
      title: "A unique entry in a ledger", slug: "what-is-nft",
      blocks: [
        p("An **NFT** (non-fungible token) is an entry in a smart contract's ledger that says: token number 7 in this contract is owned by this address. Because the ledger is public and the rules are in the contract, anyone can check who owns token 7, see its full history of owners and know that no copy of that exact entry exists."),
        table("Fungible versus non-fungible", ["", "Fungible (ERC-20)", "Non-fungible (ERC-721)"], [["Example", "A 100-rupee note", "A numbered concert ticket"], ["Interchangeable?", "Yes: any note will do", "No: seat 12A is not seat 40B"], ["Ledger entry", "address → amount", "token id → owner"], ["Typical question", "How much do I have?", "Which ones do I have?"]]),
        def("Smart contract ownership", "Ownership of an NFT means your address is recorded as the owner in the contract. It lets you transfer or use the token. It does not by itself give you the copyright to any picture, any legal title or any promise from the creator."),
        miniQuiz("what-nft-mini", [["What does owning an NFT mean?", ["You own the copyright of the artwork", "Your address is recorded as the owner of that token in the contract", "You own the website", "You own the blockchain"], 1, "A ledger entry, not a legal right by itself."]]),
        tip("Whenever you read about an NFT, ask: what exactly does the owner get? The answer is in the contract and in the written terms, not in the picture."),
      ],
      points: ["An NFT is a unique token id owned by an address in a contract.", "Owning the token is not owning the copyright."],
      check: [["ERC-721 maps:", ["token id to owner", "address to amount", "name to price", "gas to ETH"], 0, "Every id has one owner."]],
    }),
    topic({
      title: "What is on-chain and what is not", slug: "on-off-chain",
      blocks: [
        table("Where the pieces live", ["Piece", "Usually stored", "Why"], [["Token id and owner", "On the chain", "That is the ledger itself"], ["Contract rules (supply, royalty)", "On the chain", "Code and constants"], ["tokenURI (a link)", "On the chain", "A short string"], ["Metadata JSON (name, description, attributes)", "Off-chain, found through the link", "Cheaper"], ["Image, audio or video", "Off-chain, found through the metadata", "Large files cost too much on-chain"], ["Licence terms", "In legal text, linked from the project", "Law is outside the chain"]]),
        flow("Following the chain of pointers", ["Wallet asks the contract for tokenURI(7)", "Contract returns a link", "Wallet downloads the metadata JSON", "The JSON names an image link", "Wallet downloads and shows the image"]),
        p("This chain of pointers is where NFTs break. If the link, the metadata file or the image disappears, the token still exists but shows nothing. The strength of an NFT therefore depends on how well each pointer and file is protected, which the storage module covers in detail."),
        miniQuiz("onoff-mini", [["What happens if the image link stops working?", ["The token is deleted", "The token still exists but may show nothing", "The owner changes", "The contract is destroyed"], 1, "The pointer breaks, not the ledger."]]),
      ],
      points: ["Ownership lives on-chain; large files usually live elsewhere.", "A broken link leaves a token that shows nothing."],
      check: [["tokenURI returns:", ["A link to metadata", "The image bytes", "The owner's key", "The price"], 0, "It returns a pointer, not the file."]],
    }),
    topic({
      title: "Metadata and the marketplace view", slug: "metadata-basics",
      blocks: [
        code("json", metadataJson, "metadata/7.json"),
        table("Fields in the JSON", ["Field", "Purpose"], [["name and description", "Shown by wallets and marketplaces"], ["image", "A link to the artwork; ipfs:// links point to content-addressed storage"], ["external_url", "A page with more details"], ["attributes", "Traits used for filters and rarity, each with a trait type and value"]]),
        p("Marketplaces and wallets look for these standard field names. If you follow the convention, your tokens will display properly almost everywhere. If you invent your own names, tools will not know what to show."),
        miniQuiz("meta-mini", [["Why follow the standard metadata field names?", ["It is required by law", "Wallets and marketplaces know how to display them", "It saves gas", "It hides the image"], 1, "Compatibility."]]),
      ],
      points: ["Metadata JSON has name, description, image and attributes.", "Standard names make tokens display correctly in every app."],
      check: [["The attributes list is used for:", ["Traits and filters", "Fees", "Mining", "Passwords"], 0, "Rarity and search."]],
    }),
  ],
  terms: [["NFT", "A non-fungible token"], ["Token id", "The unique number of a token in a contract"], ["Metadata", "Descriptive data about a token"], ["tokenURI", "A link to a token's metadata"], ["Fungible", "Interchangeable"], ["Attribute", "A trait of a token"]],
  practical: { title: "Practical: inspect a real NFT", intro: "Use a public explorer.", steps: ["Find a public NFT contract on a block explorer.", "Read its tokenURI for one token.", "Open the metadata and the image link.", "Write down which parts are on-chain and which are not."] },
  quiz: [
    ["An NFT is:", ["A unique ledger entry", "A coin", "A photo only", "A bank"], 0, "Token id to owner."],
    ["Fungible means:", ["Interchangeable", "Unique", "Free", "Private"], 0, "Any unit will do."],
    ["Owning an NFT gives:", ["A ledger record, not automatic copyright", "The copyright", "A salary", "The website"], 0, "Read the terms."],
    ["The owner record is stored:", ["On-chain", "On a phone", "In a bank", "In a photo"], 0, "In the contract."],
    ["Large images are usually stored:", ["Off-chain", "In the block header", "In the address", "Nowhere"], 0, "Large files cost too much on-chain."],
    ["tokenURI returns:", ["A link", "A photo", "A key", "A fee"], 0, "A pointer to metadata."],
    ["Attributes describe:", ["Traits", "Gas", "Owners", "Blocks"], 0, "Used for filtering."],
  ],
});

const M2 = module_({
  slug: "building-nft-contracts", title: "Building NFT contracts", hours: 2.5, level: "Core skills",
  summary: "A complete collection contract with supply, price, limits, royalties and withdrawal, plus allowlists and soulbound tokens.",
  outcome: "You can build and explain a capped collection contract, an allowlist mint and a non-transferable credential.",
  intro: "A good NFT contract is short and strict: it enforces the promises made to buyers. This module builds one from the ground up with OpenZeppelin and then shows two common variations.",
  topics: [
    topic({
      title: "A collection contract, line by line", slug: "collection",
      blocks: [
        code("solidity", collection, "CampusCollection.sol"),
        table("What each protection does", ["Line", "Protects against"], [["MAX_SUPPLY and totalMinted", "Creating more tokens than promised"], ["msg.value != mintPrice * quantity", "Underpayment and accidental overpayment"], ["mintedBy and MAX_PER_WALLET", "One buyer taking everything"], ["_safeMint", "Tokens lost in contracts that cannot handle them"], ["onlyOwner on withdraw", "Strangers taking proceeds"], ["_setDefaultRoyalty", "Declares the creator's royalty for marketplaces that honour it"], ["supportsInterface override", "Lets wallets discover that the contract supports both ERC-721 and ERC-2981"]]),
        mistakes(["Setting the price in the front end only and not checking it in the contract.", "Forgetting a supply cap and promising scarcity anyway.", "Letting the owner change the metadata after minting without telling buyers."]),
        miniQuiz("coll-mini", [["Why check the payment in the contract?", ["Front ends can be bypassed by calling the contract directly", "It is cheaper", "It is required by the wallet", "It hides prices"], 0, "The contract is the only enforcer."]]),
      ],
      points: ["A collection contract enforces supply, price and limits itself.", "Never rely on the web page to enforce rules."],
      check: [["MAX_PER_WALLET reduces the risk that:", ["One buyer takes the whole collection", "Gas rises", "Events vanish", "The owner changes"], 0, "It spreads the collection more fairly."]],
    }),
    topic({
      title: "Royalties and their honest limits", slug: "royalties",
      blocks: [
        p("**ERC-2981** lets a contract declare how much the creator should receive on a resale: for example 500 out of 10,000, which is 5%. It is only a declaration. The standard does not move any money. The marketplace must read the value and pay it. Many marketplaces do; some make royalties optional; and a buyer who trades privately pays none."),
        table("Ways to handle royalties", ["Approach", "Strength", "Weakness"], [["Declare with ERC-2981", "Standard and simple", "Optional for marketplaces"], ["Use your own marketplace with enforced royalties", "Full control", "You must build and secure it, and attract users"], ["Restrict transfers to approved marketplaces", "Can enforce royalties", "Limits where holders can sell and has been controversial"], ["Do not rely on royalties", "Honest and simple", "Income must come from the first sale or other services"]]),
        explorer({ id: "nft-roy", title: "Royalty calculator", intro: "Change the sale price and the royalty rate to see the creator's income. A teaching tool.", inputs: [{ id: "price", label: "Sale price (rupees)", min: 1000, max: 1000000, step: 1000, value: 200000 }, { id: "roy", label: "Royalty (%)", min: 0, max: 15, step: 0.5, value: 5 }, { id: "fee", label: "Marketplace fee (%)", min: 0, max: 10, step: 0.5, value: 2.5 }], outputs: [{ label: "Creator royalty (rupees)", expr: "price * roy / 100", unit: "rs" }, { label: "Marketplace fee (rupees)", expr: "price * fee / 100", unit: "rs" }, { label: "Seller receives (rupees)", expr: "price - price * roy / 100 - price * fee / 100", unit: "rs" }] }),
        miniQuiz("roy-mini", [["Does ERC-2981 guarantee that royalties are paid?", ["Yes always", "No: it only declares the rate and marketplaces choose whether to pay it", "Yes on all chains", "Only for art"], 1, "A declaration, not enforcement."]]),
      ],
      points: ["ERC-2981 declares a royalty; it does not enforce it.", "Plan income without depending on royalties."],
      check: [["A 500 out of 10,000 royalty is:", ["5%", "50%", "0.5%", "500%"], 0, "Basis points."]],
    }),
    topic({
      title: "Allowlists and soulbound tokens", slug: "variations",
      blocks: [
        code("solidity", allowlist, "AllowlistMint.sol"),
        p("The allowlist stores only a Merkle root. Each supporter receives a proof for their address from the project's website. This is the same technique as a Merkle airdrop, applied to minting rights."),
        code("solidity", soulbound, "SoulboundCredential.sol"),
        table("Soulbound tokens", ["Feature", "Why"], [["Cannot be transferred", "A credential should stay with the person it was issued to"], ["Issuer can revoke", "Mistakes and fraud need a correction path"], ["Overrides _update", "All transfers pass through it in OpenZeppelin 5"], ["Privacy", "Never put personal data in a public token; use a number or hash"]]),
        miniQuiz("var-mini", [["Why should a certificate be non-transferable?", ["To save gas", "It should stay linked to the person who earned it", "It hides the owner", "It is required by ERC-721"], 1, "Credentials are personal."]]),
        warn("A soulbound token on a public chain makes a person's credentials publicly visible. Consider privacy, consent and what happens if a wallet is lost."),
      ],
      points: ["Merkle allowlists give early supporters guaranteed mints.", "Soulbound tokens block transfers and need privacy care."],
      check: [["An allowlist root stored on-chain is:", ["32 bytes representing the whole list", "A list of every address", "A private key", "A fee"], 0, "A single root stands for the whole list."]],
    }),
  ],
  terms: [["Mint", "Create a token"], ["Supply cap", "The maximum number of tokens"], ["ERC-2981", "The royalty declaration standard"], ["Allowlist", "A list of addresses allowed to mint"], ["Soulbound", "Non-transferable"], ["Basis points", "Hundredths of a percent"]],
  practical: { title: "Practical: mint and test limits", intro: "In Remix on a test network.", steps: ["Deploy CampusCollection with a small price.", "Mint with the wrong payment and watch it revert.", "Mint beyond the per-wallet limit.", "Withdraw from the owner account and from another."] },
  quiz: [
    ["A supply cap is enforced:", ["In the contract", "Only on the website", "By a promise", "By luck"], 0, "The contract is the enforcer."],
    ["_safeMint prevents:", ["Tokens locked in non-compatible contracts", "Gas costs", "Royalties", "Events"], 0, "Receiver check."],
    ["ERC-2981 is:", ["A royalty declaration", "A payment system", "A marketplace", "A wallet"], 0, "Marketplaces choose to honour it."],
    ["A Merkle allowlist stores:", ["A root", "Every address", "A key", "A name"], 0, "Compact proof."],
    ["Soulbound tokens:", ["Cannot be transferred", "Are free", "Are private", "Have no owner"], 0, "Credentials."],
    ["Personal data in tokens should be:", ["Avoided", "Included", "Encouraged", "Required"], 0, "Public chain."],
    ["Withdraw should be:", ["Restricted to the owner", "Open to all", "Hidden", "Free"], 0, "Protect proceeds."],
  ],
});

const M3 = module_({
  slug: "metadata-and-storage", title: "Metadata and storage", hours: 2, level: "Core skills",
  summary: "Content addressing and IPFS, on-chain art, reveals and the honest durability of each approach.",
  outcome: "You can choose a storage strategy, build on-chain metadata and explain its costs and risks.",
  intro: "The most common way an NFT fails is not a hack; it is a missing file. This module shows how to choose storage that lasts and how to build NFTs that carry their own art.",
  topics: [
    topic({
      title: "Content addressing and IPFS", slug: "ipfs",
      blocks: [
        p("A normal web address says **where** a file is: the server and path. If the server changes the file or disappears, the link breaks or shows something else. A **content address** says **what** the file is: it is a cryptographic hash of the content itself. Change one byte and the address changes. IPFS, the InterPlanetary File System, uses content addresses, so a link of the form ipfs:// followed by a hash always refers to exactly the same bytes."),
        table("Location versus content", ["", "Web address", "Content address (IPFS)"], [["Names...", "A place", "The exact content"], ["Can the content change silently?", "Yes", "No: the address would change"], ["Who must keep it available?", "The server owner", "Anyone who stores (pins) it"], ["Failure mode", "Broken link or swapped file", "File not found if nobody keeps a copy"]]),
        p("Content addressing guarantees that a file has not been changed, but it does not guarantee that the file is still available. Someone must **pin** it, which means promising to keep a copy. Serious projects use several independent pinning services, keep their own copies and may use networks designed for long-term storage."),
        miniQuiz("ipfs-mini", [["What does a content address guarantee?", ["The file is always available", "The file has not been changed", "The file is private", "The file is free"], 1, "Integrity, not availability."]]),
      ],
      points: ["Content addresses identify exactly what a file contains.", "Integrity is guaranteed; availability needs pinning."],
      check: [["Pinning means:", ["Keeping a copy available", "Deleting a file", "Encrypting a file", "Selling a file"], 0, "Someone must store it."]],
    }),
    topic({
      title: "Fully on-chain NFTs", slug: "onchain",
      blocks: [
        code("solidity", onchain, "OnChainBadge.sol"),
        flow("How tokenURI builds the NFT", ["Wallet asks tokenURI(id)", "The contract builds an SVG image as text", "It wraps the SVG in a JSON object", "Both are Base64-encoded into data: links", "The wallet decodes and shows the NFT with no outside server"]),
        table("Trade-offs of fully on-chain storage", ["Benefit", "Cost"], [["Survives as long as the chain does", "Storage is expensive: roughly 22,100 gas per new 32-byte word"], ["No dependence on any server", "Limited to small images, usually simple vector art"], ["Art can respond to on-chain data", "More code means more risk"], ["Strongest durability claim", "Harder to build and test"]]),
        miniQuiz("onchain-mini", [["Why is on-chain art usually small vector graphics?", ["It looks better", "Storing large files on-chain is very expensive", "Wallets cannot show photos", "It is a rule"], 1, "Every byte costs gas."]]),
      ],
      points: ["On-chain NFTs build their own metadata and art in tokenURI.", "They are very durable but limited by cost."],
      check: [["Base64 is used to:", ["Encode data into text for data: links", "Encrypt data", "Compress data", "Sign data"], 0, "Text-safe encoding."]],
    }),
    topic({
      title: "Reveals, freezing and trust", slug: "reveal",
      blocks: [
        p("Many collections mint first and **reveal** the artwork later, to stop buyers sorting by rarity before the mint ends. This creates a trust problem: until the reveal, the metadata is a placeholder, and the owner decides when and what to reveal. Buyers have to trust the creator not to swap better tokens for themselves."),
        table("Ways to make a reveal fairer", ["Technique", "How it helps"], [["Commit to a provenance hash in advance", "Publish a hash of all final metadata before minting so it can be checked later"], ["Randomised offset", "Shift token ids by a random number chosen after minting ends"], ["Freeze the metadata", "Once revealed, the contract permanently disables further changes and announces it"], ["Publish the full set openly", "Anyone can compare against the committed hash"]]),
        list("What to tell buyers", ["Whether metadata can change, and who can change it.", "When and how the reveal happens.", "Where files are stored and who pins them.", "Whether and when the metadata will be frozen.", "What happens if a pinning service closes."], true),
        miniQuiz("reveal-mini", [["What does a provenance hash let buyers check?", ["The price", "That the revealed set matches what was committed before minting", "Who minted first", "The gas fee"], 1, "No quiet swapping."]]),
      ],
      points: ["Reveals need trust; provenance hashes and freezing reduce it.", "Tell buyers exactly who can change what."],
      check: [["Freezing metadata means:", ["It can no longer be changed", "It is deleted", "It is hidden", "It is cheaper"], 0, "The change becomes permanent."]],
    }),
  ],
  terms: [["Content address", "A name derived from the content itself"], ["IPFS", "A content-addressed file network"], ["Pinning", "Keeping a copy of a file available"], ["Base64", "A way to write bytes as text"], ["Reveal", "Publishing final metadata after minting"], ["Provenance hash", "A hash of the full collection committed in advance"]],
  practical: { title: "Practical: pin a file", intro: "With a free pinning account.", steps: ["Upload an image and a metadata file.", "Copy the content address.", "Put it in a metadata JSON.", "Open it through two different gateways."] },
  quiz: [
    ["A content address names:", ["The content", "A server", "A person", "A fee"], 0, "A content address is a hash of the data."],
    ["IPFS integrity means:", ["Content cannot silently change", "Files never vanish", "Files are private", "Files are free"], 0, "Not availability."],
    ["Pinning is:", ["Keeping files available", "Deleting files", "Encrypting files", "Selling files"], 0, "Someone must store them."],
    ["On-chain art is:", ["Durable but costly", "Free", "Private", "Large"], 0, "Gas per word."],
    ["Reveals require:", ["Trust in the creator", "No trust", "Luck", "A bank"], 0, "Reduce it with provenance."],
    ["Freezing metadata:", ["Prevents later changes", "Burns tokens", "Hides tokens", "Doubles fees"], 0, "A promise enforced by code."],
    ["A broken image link leaves:", ["The token existing but empty", "No token", "A new token", "A bigger token"], 0, "The ledger is intact."],
  ],
});

const M4 = module_({
  slug: "marketplaces-and-dapps", title: "Marketplaces and dApps", hours: 2, level: "Applied skills",
  summary: "A fixed-price marketplace contract, approvals, a front end with ethers, and reading events.",
  outcome: "You can follow and build a simple marketplace flow, write a minting front end and use events to list tokens.",
  intro: "An NFT contract alone is not a product. People need a page where they can connect a wallet, mint, view and trade. This module builds a small marketplace contract and the front-end code that talks to it.",
  topics: [
    topic({
      title: "A fixed-price marketplace", slug: "market-contract",
      blocks: [
        code("solidity", market, "SimpleMarket.sol"),
        flow("A sale", ["Seller approves the marketplace on the NFT contract", "Seller lists with a price", "Buyer calls buy and sends the exact price", "Marketplace deletes the listing", "It credits the seller's proceeds", "It moves the NFT to the buyer", "Seller withdraws proceeds later"]),
        table("Design decisions", ["Decision", "Reason"], [["The NFT stays with the seller until sold", "No escrow contract holds the token; simpler and safer for sellers"], ["Pull payments for proceeds", "A seller who cannot receive ETH cannot block a sale"], ["Effects before interactions", "The listing is deleted before the transfer, preventing reuse"], ["nonReentrant", "A second layer against reentrancy"], ["Exact price required", "Avoids stuck funds"]]),
        warn("This contract is a teaching example. It does not check that the seller still owns the token at sale time beyond the transfer failing, and it has no royalties, fees or auctions. A real marketplace needs much more design and an audit."),
        miniQuiz("mkt-mini", [["Why delete the listing before transferring the NFT?", ["To save gas", "So the listing cannot be reused during a callback", "To hide the price", "It is optional"], 1, "Checks-effects-interactions."]]),
      ],
      points: ["A marketplace lists, sells and credits proceeds with approvals.", "Delete listings first and use pull payments."],
      check: [["The marketplace needs the seller to:", ["Approve it on the NFT contract", "Give it the private key", "Pay a deposit", "Burn the token"], 0, "Otherwise it cannot move the token."]],
    }),
    topic({
      title: "A front end with ethers", slug: "frontend",
      blocks: [
        code("javascript", frontend, "mint.js"),
        table("What the code does", ["Step", "Why"], [["BrowserProvider(window.ethereum)", "Connects to the wallet the user already has"], ["getSigner", "Asks the wallet for permission to act as the user"], ["Read mintPrice from the contract", "Never hard-code prices that can differ from the contract"], ["Contract call with value", "Sends the transaction; the wallet shows details and asks to confirm"], ["tx.wait()", "Waits until the transaction is mined"], ["queryFilter with Transfer events", "Finds which tokens an address received"]]),
        list("Good dApp habits", ["Show the contract address and the network.", "Handle rejection and errors with friendly messages.", "Disable the button while waiting.", "Never ask for more approvals than needed.", "Never ask for a recovery phrase.", "Link to the verified contract on a block explorer."]),
        miniQuiz("front-mini", [["Why read the price from the contract?", ["It is faster", "The page might show a different price from what the contract requires", "Wallets demand it", "It saves gas"], 1, "The contract is the source of truth."]]),
      ],
      points: ["Connect, read, send, wait and show results.", "The contract is the source of truth; the page is a helper."],
      check: [["tx.wait() waits for:", ["The transaction to be mined", "The wallet to open", "The price to change", "A refund"], 0, "Confirmation."]],
    }),
    topic({
      title: "Events and indexing", slug: "events",
      blocks: [
        p("A contract cannot easily list 'all tokens owned by this address' without loops that cost too much. Instead, apps read **events**. Every mint or transfer emits a Transfer event with the sender, recipient and token id. A front end can ask the node for those events, or use an **indexer**: a service that reads events from the chain and stores them in a database so pages can query quickly."),
        table("Options for reading data", ["Option", "Good for", "Limit"], [["Contract view functions", "Single values: owner of token 7", "Not good for lists"], ["queryFilter on events", "Small projects and recent history", "Slow over long ranges"], ["A hosted indexer or subgraph", "Marketplaces, profile pages and filters", "Another service to run or trust"], ["Your own database fed by events", "Full control", "You maintain it"]]),
        mistakes(["Looping over all token ids in a view function and hitting limits.", "Trusting an indexer without checking the chain for important decisions.", "Forgetting that very recent blocks can be reorganised."]),
        miniQuiz("events-mini", [["Why use events to list a user's tokens?", ["Events are free to read and record transfers", "Contracts cannot store anything", "Wallets ban loops", "Events are encrypted"], 0, "They are the cheap way to build lists."]]),
      ],
      points: ["Events record transfers; apps use them or indexers to build lists.", "For important decisions, verify against the chain."],
      check: [["An indexer is:", ["A service that reads events into a database", "A wallet", "A token", "A fee"], 0, "Fast queries."]],
    }),
  ],
  terms: [["Marketplace", "A contract or site for trading NFTs"], ["Approval", "Permission for a contract to move a token"], ["Listing", "An offer to sell at a price"], ["dApp", "A decentralised application"], ["Event", "A log entry emitted by a contract"], ["Indexer", "A service that organises events for queries"]],
  practical: { title: "Practical: list and buy", intro: "In Remix with two accounts.", steps: ["Mint an NFT from one account.", "Approve SimpleMarket and list the token.", "Buy it from the other account.", "Withdraw the proceeds from the seller account."] },
  quiz: [
    ["A listing needs:", ["An approval", "A deposit", "A burn", "A loan"], 0, "The marketplace must be allowed to move the token."],
    ["Pull payments let:", ["Sellers withdraw themselves", "Buyers pay later", "Anyone steal", "Nobody pay"], 0, "Failure is isolated."],
    ["A front end should read prices from:", ["The contract", "A guess", "A forum", "The wallet"], 0, "The source of truth."],
    ["tx.wait() returns:", ["A receipt after mining", "A price", "A key", "A token"], 0, "Confirmation."],
    ["Transfer events help to:", ["List tokens", "Pay gas", "Mine", "Burn"], 0, "History of movement."],
    ["An indexer:", ["Speeds up queries", "Creates tokens", "Pays gas", "Signs"], 0, "Reads events into a database."],
    ["Teaching marketplaces need:", ["Audits before real use", "Nothing", "Luck", "Ads"], 0, "Real value, real review."],
  ],
});

const M5 = module_({
  slug: "utility-and-business", title: "Utility, business models and honest design", hours: 1.5, level: "Applied skills",
  summary: "Where NFTs genuinely help, how mints make or lose money, and how to design for lasting value.",
  outcome: "You can judge whether an NFT fits a use case and build a simple mint budget.",
  intro: "The best NFT projects solve a real problem; the worst are speculation with a picture attached. This module helps you tell them apart and plan the money honestly.",
  topics: [
    topic({
      title: "Where NFTs genuinely help", slug: "use-cases",
      blocks: [
        table("Use cases and honest assessments", ["Use case", "Why a token helps", "Caution"], [["Certificates and credentials", "Anyone can verify without calling the issuer", "Privacy and revocation; may be soulbound"], ["Event tickets", "Unique, verifiable, resale rules possible", "Lost wallets and fraud support"], ["Memberships and access", "Holding the token unlocks access", "Access must be enforced by the app"], ["Digital art and collectibles", "Provenance and a market", "Copyright and speculation"], ["Game items", "Portable items across games", "Depends on games choosing to support them"], ["Supply-chain records", "Shared, tamper-evident history", "Garbage in, garbage out at the point of entry"]]),
        p("In each case the value comes from something outside the token: an institution that stands behind it, a community that values it or an application that honours it. The token is the verifiable receipt; it is not the value by itself."),
        miniQuiz("use-mini", [["Where does an NFT's lasting value come from?", ["The token itself alone", "What people, institutions or apps do with it", "Its gas cost", "Its id number"], 1, "Value comes from real use."]]),
      ],
      points: ["NFTs help when public verification or portability matters.", "Value comes from what stands behind the token."],
      check: [["A credential NFT is useful because:", ["Anyone can verify it", "It is expensive", "It is secret", "It is random"], 0, "Public verifiability."]],
    }),
    topic({
      title: "Mint economics", slug: "economics",
      blocks: [
        explorer({ id: "nft-econ", title: "Mint budget", intro: "Change the supply, price and sell-through to see revenue and profit. A teaching model with made-up numbers.", inputs: [{ id: "supply", label: "Supply", min: 100, max: 10000, step: 100, value: 1000 }, { id: "price", label: "Price (rupees)", min: 100, max: 10000, step: 100, value: 2000 }, { id: "sold", label: "Sold (%)", min: 5, max: 100, step: 5, value: 60 }, { id: "cost", label: "Costs (rupees)", min: 100000, max: 5000000, step: 50000, value: 800000 }], outputs: [{ label: "Revenue (rupees)", expr: "supply * sold / 100 * price", unit: "rs" }, { label: "Profit (rupees)", expr: "supply * sold / 100 * price - cost", unit: "rs" }, { label: "Break-even NFTs", expr: "ceil(cost / price)", unit: "n" }] }),
        list("Costs that are easy to forget", ["Development and testing.", "Security review.", "Art, writing and design.", "Legal advice and company set-up.", "Storage and pinning for years, not days.", "Support, community management and moderation.", "Network fees for deployment and updates."]),
        mistakes(["Planning for a sold-out mint and ignoring the case where half sells.", "Promising future features you cannot fund.", "Spending the whole raise before delivering the first product."]),
        miniQuiz("econ-mini", [["Why plan for a partial sell-through?", ["Sellouts are impossible", "Real mints often sell less than hoped, and costs still have to be paid", "Gas depends on it", "It is required"], 1, "Budget for the realistic case."]]),
      ],
      points: ["Budget revenue, costs and break-even; plan for partial sales.", "Do not forget storage, support and legal costs."],
      check: [["Break-even is:", ["Costs divided by price, rounded up", "Price minus cost", "Supply", "Royalty"], 0, "Number of sales needed."]],
    }),
    topic({
      title: "Designing for lasting value", slug: "lasting",
      blocks: [
        list("Principles", ["Start with a real need, not with the token.", "Make the promise small and keep it.", "Store files in ways that outlive the project.", "Be open about who can change what.", "Give holders something useful over time, not just at the mint.", "Plan how the project can end gracefully."], true),
        table("Warning signs of an unsustainable project", ["Sign", "Why"], [["Value depends on new buyers arriving", "It fails when they stop"], ["Anonymous team with large insider holdings and no vesting", "No accountability"], ["Roadmaps of grand promises with no budget", "Underdelivery"], ["Pressure to buy now", "Manipulation"], ["Fake volume", "Wash trading hides lack of demand"]]),
        warn("Nothing in this course is investment advice. NFTs can lose all their value, and most do. Never spend money you cannot afford to lose."),
        miniQuiz("last-mini", [["Why plan how a project can end?", ["Projects never end", "Holders deserve a clear outcome, such as frozen metadata and archived files", "Gas requires it", "Marketplaces demand it"], 1, "A graceful end protects holders."]]),
      ],
      points: ["Start with a need; keep small promises; store files durably.", "Plan for the project's end as well as its launch."],
      check: [["Wash trading is:", ["Trading with yourself to fake demand", "Cleaning wallets", "A royalty", "A mint"], 0, "It deceives buyers about real demand."]],
    }),
  ],
  terms: [["Utility", "What a token lets you do"], ["Provenance", "A verifiable history"], ["Sell-through", "The share of supply that sells"], ["Break-even", "The point where income covers costs"], ["Wash trading", "Trading with oneself to fake demand"], ["Roadmap", "A plan of future work"]],
  practical: { title: "Practical: budget a mint", intro: "Use your own idea.", steps: ["List every cost for a year.", "Choose a price and supply.", "Compute break-even.", "Write what you will do if only half sells."] },
  quiz: [
    ["NFTs help when:", ["Public verification matters", "Always", "Never", "Randomly"], 0, "Verifiable receipts."],
    ["Value mostly comes from:", ["What stands behind the token", "Its id", "Its gas", "Its colour"], 0, "People and applications."],
    ["Break-even is:", ["Costs over price", "Price minus cost", "Supply", "Royalty"], 0, "Number of sales needed."],
    ["Hidden costs include:", ["Storage and support", "Nothing", "Only gas", "Only art"], 0, "Plan for years."],
    ["Wash trading:", ["Fakes demand", "Is a royalty", "Is a mint", "Is legal"], 0, "It deceives buyers about real demand."],
    ["A sustainable project:", ["Keeps small promises", "Promises everything", "Hides costs", "Pressures buyers"], 0, "Trust grows from keeping small promises."],
    ["Never invest:", ["More than you can afford to lose", "Time", "Curiosity", "Questions"], 0, "NFTs can lose all value."],
  ],
});

const M6 = module_({
  slug: "safety-law-and-ethics", title: "Safety, law and ethics", hours: 1.5, level: "Applied skills",
  summary: "Scams, security habits, copyright and licences, privacy and environmental and ethical questions.",
  outcome: "You can write an honest buyer notice, recognise common scams and explain rights and licences clearly.",
  intro: "NFTs attract creators, collectors and criminals. A professional project protects its community from scams, tells the truth about what buyers get, respects artists and thinks about its wider effects.",
  topics: [
    topic({
      title: "Scams and safe habits", slug: "scams",
      blocks: [
        table("Common NFT scams", ["Scam", "How it works", "Defence"], [["Approval phishing", "A fake mint site asks you to approve a contract that then drains your NFTs", "Check the site and the contract; use a separate wallet for minting; review approvals"], ["Fake collections", "A copy with the same name and images but a different contract", "Use the official link and verify the contract address"], ["Free airdrop traps", "An unexpected NFT carries a link that leads to a malicious site", "Ignore and never interact with unknown tokens"], ["Impersonation", "Fake support or admins ask for your recovery phrase", "Nobody legitimate will ask for it"], ["Wash trading and fake volume", "Trades between related wallets create false hype", "Look at real, independent holders"], ["Rug pulls", "Creators sell out or abandon the project after the mint", "Check the team, the contract powers and the delivery record"]]),
        list("Personal safety habits", ["Use a hardware wallet for anything valuable.", "Keep a separate wallet for experiments and minting.", "Read every wallet prompt before you sign.", "Revoke old approvals regularly.", "Never share your recovery phrase.", "If something feels rushed, stop."]),
        miniQuiz("scam2-mini", [["Why use a separate wallet for minting?", ["It is cheaper", "A drained experimental wallet does not take your valuable assets with it", "It hides your address", "Wallets require it"], 1, "Limit the damage."]]),
      ],
      points: ["Approval phishing, fake collections and impersonation are common.", "Separate wallets, careful reading and revoking approvals protect you."],
      check: [["A legitimate project will never ask for:", ["Your recovery phrase", "Your public address", "Your feedback", "Your email"], 0, "Never share it."]],
    }),
    topic({
      title: "Copyright, licences and honest sales", slug: "rights",
      blocks: [
        p("Buying an NFT of an artwork does not by default transfer the copyright of that artwork. Unless the seller says otherwise in writing, the buyer owns the token, and the creator keeps the copyright. Good projects publish a clear **licence** stating what holders may do: display the work, make personal copies, perhaps use it commercially within limits."),
        table("Licence ideas", ["Licence idea", "What holders can do"], [["Personal display only", "Show the work in wallets and galleries"], ["Personal and limited commercial", "Use the work in small merchandise or content up to a revenue limit"], ["Full commercial rights", "Use the work freely, which the creator must clearly grant"], ["Public domain dedication", "Anyone can use the work, including non-holders"]]),
        table("Honest sales checklist", ["Item", "Why"], [["State what the buyer gets and does not get", "Avoids misleading buyers"], ["Do not promise profits or price rises", "Such promises are unreliable and often unlawful"], ["Disclose who holds large amounts", "Concentration is a risk"], ["Explain who can change the contract or metadata", "Trust must be informed"], ["Respect other people's work", "Do not sell NFTs of art you do not have the right to sell"], ["Take legal advice for your country", "Rules differ and change"]]),
        miniQuiz("rights-mini", [["Does buying an NFT of an artwork transfer its copyright by default?", ["Yes always", "No: copyright stays with the creator unless the terms say otherwise", "Only on weekends", "Only for photos"], 1, "Read the licence."]]),
        warn("This lesson is educational, not legal advice. Laws about copyright, consumer protection and digital assets differ by country."),
      ],
      points: ["Token ownership is not copyright; a licence defines holder rights.", "Sell honestly: say what buyers get and do not get."],
      check: [["A written licence should state:", ["What holders may do with the work", "The gas price", "The block number", "The wallet brand"], 0, "Clear rights."]],
    }),
    topic({
      title: "Privacy, environment and responsibility", slug: "responsibility",
      blocks: [
        table("Wider questions", ["Question", "Considerations"], [["Privacy", "Public chains are permanent; never put personal data in a token or its metadata, and think about linking wallets to identities"], ["Consent", "Issuing credentials to people publicly needs their agreement"], ["Environment", "Most major chains now use far less energy than earlier proof-of-work designs; still, check the chain you use and say so honestly"], ["Accessibility", "Wallets and fees exclude many people; offer alternatives where it matters"], ["Artists", "Do not copy or sell other people's work; pay creators fairly"], ["Exit and support", "Have a plan for lost wallets, mistakes and project end"]]),
        p("Responsible builders ask not only 'can we do this?' but 'should we, and who might be hurt?' A credential system that makes sensitive information public, or a collection that misleads buyers, can cause real harm even if the code is perfect."),
        miniQuiz("resp-mini", [["Why avoid personal data in token metadata?", ["It costs gas", "Public chains are permanent and anyone can read it", "Wallets cannot show it", "It is slow"], 1, "You cannot take it back."]]),
        tip("A good habit: write down the worst thing that could happen to a user of your project and what you will do to prevent and handle it."),
      ],
      points: ["Public means permanent: protect privacy and get consent.", "Think about who might be harmed and plan for exits."],
      check: [["On a public chain, data you write is:", ["Practically permanent", "Private", "Deletable", "Encrypted by default"], 0, "Think before you write."]],
    }),
  ],
  terms: [["Approval phishing", "Tricking users into approving a malicious contract"], ["Licence", "Written terms of permitted use"], ["Copyright", "The creator's legal rights over a work"], ["Recovery phrase", "The secret words that restore a wallet"], ["Rug pull", "Abandoning a project after taking money"], ["Consent", "Informed agreement"]],
  practical: { title: "Practical: review a project", intro: "Pick a public NFT project.", steps: ["Read its terms and licence.", "Check who can change the contract or metadata.", "Look for any claims about profit.", "Write what you would change."] },
  quiz: [
    ["Approval phishing aims to:", ["Get you to approve a malicious contract", "Teach you", "Lower fees", "Mint art"], 0, "It drains assets."],
    ["A recovery phrase should be:", ["Kept private", "Posted", "Emailed", "Sold"], 0, "Never share."],
    ["Buying an NFT transfers copyright:", ["Not by default", "Always", "Never ever", "On Fridays"], 0, "Read the licence."],
    ["A licence states:", ["What holders may do", "The price", "The block", "The wallet"], 0, "A licence spells out the rights of holders."],
    ["Personal data in metadata is:", ["Risky because it is permanent", "Safe", "Required", "Encrypted"], 0, "Public and lasting."],
    ["Profit promises are:", ["A warning sign", "Normal", "Required", "Legal always"], 0, "Unreliable."],
    ["A separate minting wallet:", ["Limits damage", "Raises fees", "Is banned", "Is slow"], 0, "Defence in depth."],
  ],
});

export default course({
  slug: "nfts-decentralized-applications", title: "NFTs & Decentralized Applications", tagline: "Build, store, sell and sell honestly: ERC-721 collections, metadata, marketplaces, front ends and responsible practice", level: "Intermediate", hours: 10,
  summary: "A practical, honest guide to NFTs: what a token really contains, collection contracts with supply, price, limits and royalties, allowlists and soulbound credentials, IPFS and on-chain storage, a marketplace contract, a front end with ethers, mint economics and the legal, safety and ethical questions around them. All Solidity and JavaScript listings were checked. This course gives education, not legal or investment advice.",
  modules: [M1, M2, M3, M4, M5, M6],
  capstone: capstone({
    title: "Final project: plan an NFT and dApp for a real use", summary: "Produce a professional NFT project plan and pass the final assessment.",
    intro: "You now know what an NFT is, how to build one, where to store its files, how to sell it and how to do all this honestly. In this final step you plan an NFT and dApp for a real use, or explain why a token is not needed, covering purpose, contract design, storage, user journey, economics, safety and limits. Then take the final assessment covering the whole course.",
    steps: ["Work through the **Final project: plan an NFT and dApp for a real use** lab.", "Check that every promise to buyers is enforced by the contract or clearly stated.", "Take the final assessment below."], projectTitle: "An NFT project plan",
    quiz: [
      ["An NFT is:", ["A unique ledger entry", "A coin", "A photo only", "A bank"], 0, "Token id to owner."],
      ["Owning an NFT gives you:", ["A ledger record, not automatic copyright", "The copyright", "A salary", "The website"], 0, "Read the licence."],
      ["Large artwork is usually stored:", ["Off-chain", "In the block header", "Inside the address", "Nowhere"], 0, "Large files cost too much on-chain."],
      ["A supply cap should be enforced:", ["In the contract", "Only on the website", "By promise", "By luck"], 0, "The contract is the enforcer."],
      ["ERC-2981 royalties are:", ["A declaration marketplaces may honour", "Always paid", "A wallet", "A tax"], 0, "Not enforced."],
      ["A content address guarantees:", ["The file has not been changed", "The file always exists", "The file is private", "The file is free"], 0, "Integrity, not availability."],
      ["Pinning means:", ["Keeping a copy available", "Deleting a copy", "Encrypting a copy", "Selling a copy"], 0, "Someone must store it."],
      ["A fully on-chain NFT is:", ["Durable but costly", "Free", "Private", "Large"], 0, "Gas per word."],
      ["A marketplace needs the seller to:", ["Approve it on the NFT contract", "Give it a private key", "Pay a deposit", "Burn the token"], 0, "Otherwise it cannot move the token."],
      ["A front end should read prices from:", ["The contract", "A forum", "A guess", "The wallet"], 0, "The source of truth."],
      ["Approval phishing aims to:", ["Get you to approve a malicious contract", "Teach you", "Lower fees", "Mint art"], 0, "It drains assets."],
      ["Honest NFT sales:", ["State what buyers get and do not get", "Promise profits", "Hide risks", "Pressure buyers"], 0, "Plain and fair."],
    ],
  }),
  labs,
  skills: [{ id: SK, label: "NFTs and dApps" }],
  badges: [
    { id: "ledger-reader", title: "Ledger reader", description: "Separated on-chain from off-chain data.", when: { all: ["n1-onchain-offchain"] } },
    { id: "mint-guardian", title: "Mint guardian", description: "Matched mint protections to problems.", when: { all: ["n3-mint-protections"] } },
    { id: "honest-seller", title: "Honest seller", description: "Wrote an honest buyer notice.", when: { all: ["n11-buyer-notice"] } },
    { id: "nft-planner", title: "NFT planner", description: "Planned an NFT project and dApp.", when: { all: ["cap-nft-plan"] } },
  ],
  landing: {
    hero: { eyebrow: "Intermediate · Solidity and JavaScript listings checked", title: "NFTs and dApps: build them well and sell them honestly", subtitle: "Learn what an NFT really is, write a capped collection with royalties, choose storage that lasts, build a marketplace and a mint page, and plan the money, the rights and the safety. Every task is checked and explained.", level: "Intermediate", outcomeLine: "After this course you can plan and build a small NFT project and judge other projects critically." },
    outcomes: [
      { icon: "docs", title: "Know what an NFT is", text: "Ledger entries, metadata and what ownership means." },
      { icon: "safety", title: "Enforce promises in code", text: "Supply, price, limits, royalties and withdrawal." },
      { icon: "cloud", title: "Store files that last", text: "IPFS, pinning and fully on-chain art." },
      { icon: "sort", title: "Build marketplaces and pages", text: "Listings, approvals, ethers and events." },
      { icon: "sheet", title: "Budget a mint", text: "Royalty splits, storage cost and break-even." },
      { icon: "word", title: "Sell honestly", text: "Buyer notices, licences and scam awareness." },
    ],
    projects: [
      { title: "A mint specification", text: "Rules a buyer can rely on.", module: "building-nft-contracts" },
      { title: "A storage cost comparison", text: "On-chain versus pinned.", module: "metadata-and-storage" },
      { title: "A buyer notice", text: "What you get and do not get.", module: "safety-law-and-ethics" },
      { title: "A full NFT project plan", text: "Contract, storage, journey, economics and safety.", module: "capstone" },
    ],
    tools: [{ icon: "docs", title: "Checked code listings", text: "Solidity compiled with solc; JavaScript syntax-checked." }, { icon: "sheet", title: "Spreadsheet lab", text: "Royalties, storage cost and mint budget." }, { icon: "word", title: "Document editor", text: "Specifications, journeys and notices." }],
    assessment: ["Finish the required labs in each module: they are checked automatically and explained when something is missing.", "Pass each module quiz (70% or more). Short tests inside the lessons give instant feedback.", "Complete the NFT plan and the final assessment."],
    faq: [
      { q: "Does the platform run my contracts or wallet code?", a: "No. The labs check your designs, analysis and calculations. You run the code in your own tools on a test network." },
      { q: "Is this about making money from NFTs?", a: "No. It teaches how NFTs work and how to build and sell them honestly. NFTs can lose all their value, and nothing here is investment advice." },
      { q: "Is it legal advice?", a: "No. Rules differ by country. Take advice from a qualified lawyer before selling anything." },
    ],
  },
  catalogue: {
    hours: "~10 hrs", weeks: "~4 weeks", pace: "3 hrs/wk", badge: "NFTs and dApps",
    brief: "ERC-721 collections, metadata and storage, marketplaces, front ends, mint economics and responsible practice.",
    learn: ["What an NFT really contains and what ownership means", "Collection contracts with supply, price, limits and royalties", "IPFS, pinning and fully on-chain art", "A marketplace contract and a minting front end", "Mint budgets and honest business design", "Scams, licences, privacy and ethics"],
    handsOn: "Plan an NFT project and its dApp, with contract features, storage, user journey, economics and safety.",
    outcome: "Plan and build small NFT projects and judge other projects critically.",
  },
});
