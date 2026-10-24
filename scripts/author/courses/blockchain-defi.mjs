import { capstone, ck, classifyLab, code, course, def, explorer, flow, list, miniQuiz, mistakes, module_, p, S, sheetLab, table, tip, topic, W, warn, wordLab } from "../kit.mjs";

const SK = "defi";

const pair = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

// A teaching automated market maker for two tokens using the constant-product rule: reserveA * reserveB stays the same
// (apart from fees, which make it grow). FOR LEARNING ONLY: not audited, no protection against odd tokens.
contract SimplePair is ERC20, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant MINIMUM_LIQUIDITY = 1000;   // locked forever so the first provider cannot manipulate share prices

    IERC20 public immutable tokenA;
    IERC20 public immutable tokenB;
    uint256 public reserveA;
    uint256 public reserveB;

    event LiquidityAdded(address indexed provider, uint256 amountA, uint256 amountB, uint256 shares);
    event LiquidityRemoved(address indexed provider, uint256 amountA, uint256 amountB, uint256 shares);
    event Swapped(address indexed trader, address indexed tokenIn, uint256 amountIn, uint256 amountOut);

    error SameToken();
    error ZeroAmount();
    error NoLiquidity();
    error Slippage();
    error UnknownToken();

    constructor(IERC20 a, IERC20 b) ERC20("Simple LP Share", "sLP") {
        if (a == b) revert SameToken();
        tokenA = a;
        tokenB = b;
    }

    // The 0.3% fee stays in the pool: only 99.7% of the input counts toward the price calculation.
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure returns (uint256) {
        if (amountIn == 0) revert ZeroAmount();
        if (reserveIn == 0 || reserveOut == 0) revert NoLiquidity();
        uint256 inWithFee = amountIn * 997;
        return (inWithFee * reserveOut) / (reserveIn * 1000 + inWithFee);
    }

    function addLiquidity(uint256 amountA, uint256 amountB, uint256 minShares) external nonReentrant returns (uint256 shares) {
        if (amountA == 0 || amountB == 0) revert ZeroAmount();
        uint256 supply = totalSupply();
        if (supply == 0) {
            shares = Math.sqrt(amountA * amountB);
            if (shares <= MINIMUM_LIQUIDITY) revert ZeroAmount();
            shares -= MINIMUM_LIQUIDITY;
            _mint(address(0xdead), MINIMUM_LIQUIDITY);
        } else {
            // The provider receives shares for the smaller side, so an unbalanced deposit gifts the difference to the pool.
            shares = Math.min((amountA * supply) / reserveA, (amountB * supply) / reserveB);
        }
        if (shares == 0 || shares < minShares) revert Slippage();

        reserveA += amountA;                  // effects first
        reserveB += amountB;
        _mint(msg.sender, shares);
        emit LiquidityAdded(msg.sender, amountA, amountB, shares);

        tokenA.safeTransferFrom(msg.sender, address(this), amountA);   // interactions last
        tokenB.safeTransferFrom(msg.sender, address(this), amountB);
    }

    function removeLiquidity(uint256 shares, uint256 minA, uint256 minB) external nonReentrant returns (uint256 amountA, uint256 amountB) {
        if (shares == 0) revert ZeroAmount();
        uint256 supply = totalSupply();
        amountA = (shares * reserveA) / supply;
        amountB = (shares * reserveB) / supply;
        if (amountA < minA || amountB < minB) revert Slippage();

        _burn(msg.sender, shares);
        reserveA -= amountA;
        reserveB -= amountB;
        emit LiquidityRemoved(msg.sender, amountA, amountB, shares);

        tokenA.safeTransfer(msg.sender, amountA);
        tokenB.safeTransfer(msg.sender, amountB);
    }

    // minOut protects the trader: if the price moved against them before this transaction was included, it reverts.
    function swap(IERC20 tokenIn, uint256 amountIn, uint256 minOut) external nonReentrant returns (uint256 amountOut) {
        bool aToB;
        if (tokenIn == tokenA) aToB = true;
        else if (tokenIn != tokenB) revert UnknownToken();

        (uint256 reserveIn, uint256 reserveOut) = aToB ? (reserveA, reserveB) : (reserveB, reserveA);
        amountOut = getAmountOut(amountIn, reserveIn, reserveOut);
        if (amountOut < minOut) revert Slippage();

        if (aToB) {
            reserveA += amountIn;
            reserveB -= amountOut;
        } else {
            reserveB += amountIn;
            reserveA -= amountOut;
        }
        emit Swapped(msg.sender, address(tokenIn), amountIn, amountOut);

        tokenIn.safeTransferFrom(msg.sender, address(this), amountIn);
        (aToB ? tokenB : tokenA).safeTransfer(msg.sender, amountOut);
    }
}`;

const ammJs = `// amm.js — the constant-product maths in plain JavaScript, using BigInt so nothing is rounded.
// Run with Node.js. Nothing here talks to a blockchain.

// How much of the output token a trader receives, with a fee in basis points (30 = 0.3%).
function swapOut(amountIn, reserveIn, reserveOut, feeBps = 30n) {
  const inWithFee = amountIn * (10000n - feeBps);
  return (inWithFee * reserveOut) / (reserveIn * 10000n + inWithFee);
}

// The price impact: how much worse the average price is than the price before the trade.
function priceImpactPercent(amountIn, reserveIn, reserveOut, feeBps = 30n) {
  const out = swapOut(amountIn, reserveIn, reserveOut, feeBps);
  const spot = Number(reserveOut) / Number(reserveIn);          // output tokens per input token before the trade
  const paid = Number(out) / Number(amountIn);                   // output tokens per input token actually received
  return (1 - paid / spot) * 100;
}

// Impermanent loss for a 50/50 pool when the relative price moves by 'ratio' (2 means one token doubled against the other).
function impermanentLoss(ratio) {
  return (2 * Math.sqrt(ratio)) / (1 + ratio) - 1;               // negative: the pool position is worth less than just holding
}

// A small simulation: three trades in a row against a pool with 1,000 A and 2,000,000 B.
let reserveA = 1000n * 10n ** 18n;
let reserveB = 2000000n * 10n ** 18n;
for (const spend of [1000n, 10000n, 100000n]) {
  const amountIn = spend * 10n ** 18n;
  const out = swapOut(amountIn, reserveB, reserveA);
  console.log("Spend", spend.toString(), "B ->", Number(out) / 1e18, "A, impact", priceImpactPercent(amountIn, reserveB, reserveA).toFixed(2) + "%");
  reserveB += amountIn;
  reserveA -= out;
  console.log("  product now", (reserveA * reserveB) / 10n ** 36n);
}

for (const ratio of [1, 1.25, 2, 4, 10]) {
  console.log("Price ratio", ratio, "-> impermanent loss", (impermanentLoss(ratio) * 100).toFixed(2) + "%");
}

module.exports = { swapOut, priceImpactPercent, impermanentLoss };`;

const lendingMath = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// The maths at the heart of a lending market, kept as pure functions so you can read them in isolation.
// Amounts use 18-decimal fixed point (WAD): 1e18 means 1.0, and 0.8e18 means 80%.
contract LendingMath {
    uint256 public constant WAD = 1e18;
    uint256 public constant KINK = 0.8e18;           // above 80% utilisation, borrowing gets expensive quickly
    uint256 public constant BASE_RATE = 0.02e18;     // 2% a year at zero utilisation
    uint256 public constant SLOPE_1 = 0.04e18;       // adds 4% a year up to the kink
    uint256 public constant SLOPE_2 = 0.75e18;       // adds 75% a year across the steep part

    // Utilisation = borrowed / deposited. When almost everything is lent out, withdrawals become hard.
    function utilisation(uint256 borrowed, uint256 deposited) public pure returns (uint256) {
        if (deposited == 0) return 0;
        return (borrowed * WAD) / deposited;
    }

    // A "kinked" curve: gentle below the kink to encourage borrowing, steep above it to attract deposits and repayments.
    function borrowRatePerYear(uint256 util) public pure returns (uint256) {
        if (util <= KINK) {
            return BASE_RATE + (util * SLOPE_1) / KINK;
        }
        uint256 excess = util - KINK;
        return BASE_RATE + SLOPE_1 + (excess * SLOPE_2) / (WAD - KINK);
    }

    // Depositors earn what borrowers pay, spread over all deposits, minus the protocol's cut (in WAD, 0.1e18 = 10%).
    function depositRatePerYear(uint256 util, uint256 reserveFactor) public pure returns (uint256) {
        uint256 borrowRate = borrowRatePerYear(util);
        return (((borrowRate * util) / WAD) * (WAD - reserveFactor)) / WAD;
    }

    // Health factor = (collateral value * liquidation threshold) / debt value. Below 1.0 the position can be liquidated.
    function healthFactor(uint256 collateralValue, uint256 liquidationThreshold, uint256 debtValue) public pure returns (uint256) {
        if (debtValue == 0) return type(uint256).max;
        return (collateralValue * liquidationThreshold) / debtValue;
    }

    // The most that can be borrowed against the collateral at a given loan-to-value ratio.
    function maxBorrow(uint256 collateralValue, uint256 ltv) public pure returns (uint256) {
        return (collateralValue * ltv) / WAD;
    }
}`;

const twap = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// A time-weighted average price (TWAP) oracle. A single trade can move a spot price for one moment,
// but moving an average over many minutes costs far more. FOR LEARNING ONLY: a trusted updater feeds prices here;
// real designs read cumulative prices from a liquidity pool or use a decentralised oracle network.
contract SimpleTwap {
    struct Observation {
        uint256 timestamp;
        uint256 cumulative;   // price multiplied by seconds, added up since the start
    }

    address public immutable updater;
    Observation[] public observations;
    uint256 public lastPrice;
    uint256 public lastTimestamp;
    uint256 public cumulative;

    error NotUpdater();
    error NotEnoughHistory();
    error BadWindow();

    constructor(address updater_, uint256 initialPrice) {
        updater = updater_;
        lastPrice = initialPrice;
        lastTimestamp = block.timestamp;
        observations.push(Observation(block.timestamp, 0));
    }

    function update(uint256 newPrice) external {
        if (msg.sender != updater) revert NotUpdater();
        cumulative += lastPrice * (block.timestamp - lastTimestamp);   // the old price held until now
        lastTimestamp = block.timestamp;
        lastPrice = newPrice;
        observations.push(Observation(block.timestamp, cumulative));
    }

    // Average price over (at least) the last windowSeconds.
    function consult(uint256 windowSeconds) external view returns (uint256) {
        if (windowSeconds == 0 || windowSeconds > block.timestamp) revert BadWindow();
        uint256 target = block.timestamp - windowSeconds;
        uint256 i = observations.length;
        for (uint256 k = 0; k < 64 && i > 0; k++) {   // bounded loop: never read an unbounded history on-chain
            i--;
            if (observations[i].timestamp <= target) {
                uint256 nowCumulative = cumulative + lastPrice * (block.timestamp - lastTimestamp);
                uint256 elapsed = block.timestamp - observations[i].timestamp;
                return (nowCumulative - observations[i].cumulative) / elapsed;
            }
        }
        revert NotEnoughHistory();
    }
}`;

const flash = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IFlashBorrower {
    function onFlashLoan(address initiator, address token, uint256 amount, uint256 fee, bytes calldata data) external returns (bytes32);
}

// A flash loan: borrow any amount, with no collateral, as long as it is paid back plus a fee inside the same transaction.
// If it is not repaid, the whole transaction reverts as if it never happened. FOR LEARNING ONLY.
contract FlashLender is ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant CALLBACK_SUCCESS = keccak256("ERC3156FlashBorrower.onFlashLoan");
    uint256 public constant FEE_BPS = 9;        // 0.09%

    IERC20 public immutable token;

    error BadCallback();
    error NotRepaid();

    constructor(IERC20 token_) {
        token = token_;
    }

    function flashLoan(IFlashBorrower borrower, uint256 amount, bytes calldata data) external nonReentrant {
        uint256 balanceBefore = token.balanceOf(address(this));
        uint256 fee = (amount * FEE_BPS) / 10000;

        token.safeTransfer(address(borrower), amount);
        if (borrower.onFlashLoan(msg.sender, address(token), amount, fee, data) != CALLBACK_SUCCESS) revert BadCallback();

        // The borrower must have sent back the amount plus the fee during its callback.
        if (token.balanceOf(address(this)) < balanceBefore + fee) revert NotRepaid();
    }
}`;

const labs = [
  classifyLab({
    id: "d1-building-blocks", module: "defi-foundations", title: "Which DeFi building block?", level: "intermediate", minutes: 10, xp: 40, skills: [SK], required: true,
    objective: "Match each financial function to the DeFi building block that provides it.", scenario: "DeFi products are built from a small set of pieces that plug into one another. Match each job to its piece.",
    steps: ["Read each job.", "Choose the building block.", "Press Check my work."],
    categories: [["dex", "Decentralised exchange"], ["lending", "Lending market"], ["stable", "Stablecoin"], ["oracle", "Oracle"], ["aggregator", "Yield aggregator"]],
    items: [["Swap one token for another without an order book or a company in the middle", "dex", "Pools and pricing rules."], ["Deposit tokens to earn interest paid by borrowers", "lending", "Supply and borrow markets."], ["A token designed to hold a steady value in a currency", "stable", "A unit of account for the system."], ["Bring an outside price onto the chain", "oracle", "Contracts cannot see prices alone."], ["Move deposits automatically between protocols to chase better returns", "aggregator", "Strategies built on other protocols."], ["Borrow against collateral and be liquidated if its value falls", "lending", "Over-collateralised credit."], ["Price a trade using the ratio of two reserves", "dex", "An automated market maker."], ["Report a time-weighted average price to resist manipulation", "oracle", "Safer data."]],
  }),
  sheetLab({
    id: "d2-reserves", module: "defi-foundations", title: "Read a stablecoin reserve statement", level: "intermediate", minutes: 14, xp: 50, skills: [SK], required: false,
    objective: "Calculate whether a stablecoin is fully backed and how good its reserves are. (Educational: not an assessment of any real coin.)",
    scenario: "An issuer reports its reserves and the number of tokens in circulation. Work out the backing ratio and the quality of the reserves.",
    steps: ["In B7 add up the reserves.", "In B8 work out the backing ratio: reserves divided by tokens in circulation, as a percentage.", "In B9 work out the percentage of reserves held in cash and treasury bills.", "In B10 show Fully backed if the ratio is at least 100, otherwise Under-backed.", "In B11 work out the surplus or shortfall."],
    cells: { A1: "Item", B1: "Value", A2: "Cash", B2: "40000000", A3: "Short-term government bills", B3: "55000000", A4: "Other assets", B4: "8000000", A5: "Tokens in circulation (each redeemable for 1 unit)", B5: "100000000", A7: "Total reserves", A8: "Backing ratio (%)", A9: "Cash and bills share of reserves (%)", A10: "Verdict", A11: "Surplus or shortfall" }, view: { cols: 2, rows: 13 },
    checks: [
      ck("b7", "B7 is the total reserves", "=SUM(B2:B4)", "Add the three assets.", S.formula("B7", { fns: ["SUM"], equals: 103000000 })),
      ck("b8", "B8 is the backing ratio", "=B7/B5*100", "Reserves over tokens, times 100.", S.formula("B8", { equals: 103 })),
      ck("b9", "B9 is the cash and bills share", "=(B2+B3)/B7*100", "Cash plus bills, over total reserves.", S.formula("B9", { equals: 95000000 / 103000000 * 100 })),
      ck("b10", "B10 is the verdict", "=IF(B8>=100,\"Fully backed\",\"Under-backed\")", "100 or more is fully backed.", S.formula("B10", { fns: ["IF"], equals: "Fully backed" })),
      ck("b11", "B11 is the surplus", "=B7-B5", "Reserves minus tokens.", S.formula("B11", { equals: 3000000 })),
    ],
    solution: { cells: { B7: "=SUM(B2:B4)", B8: "=B7/B5*100", B9: "=(B2+B3)/B7*100", B10: "=IF(B8>=100,\"Fully backed\",\"Under-backed\")", B11: "=B7-B5" } },
  }),
  classifyLab({
    id: "d3-amm-price", module: "automated-market-makers", title: "What happens to the price?", level: "advanced", minutes: 10, xp: 40, skills: [SK], required: true,
    objective: "Predict how events change the price of token A in a constant-product pool.", scenario: "In a pool of token A and token B, the price of A is the ratio reserve B divided by reserve A. Predict the effect of each event.",
    steps: ["Read each event.", "Choose the effect on the price of A.", "Press Check my work."],
    categories: [["rises", "Price of A rises"], ["falls", "Price of A falls"], ["same", "Price of A does not change"]],
    items: [["A trader buys token A with token B", "rises", "Reserve A falls and reserve B rises."], ["A trader sells token A for token B", "falls", "Reserve A rises and reserve B falls."], ["A provider adds liquidity in exactly the current ratio", "same", "Both reserves grow proportionally."], ["A provider removes liquidity in the current ratio", "same", "Both reserves shrink proportionally."], ["An arbitrageur buys A here because it is cheaper than on another exchange", "rises", "Buying A pushes its price up toward the other exchange."], ["A very large holder dumps token A into the pool", "falls", "A large sale pushes the price down."], ["Fees accumulate in the pool without any trade in the opposite direction", "same", "Fees raise the reserves, not a one-sided price move."], ["A trader buys token B with token A", "falls", "A flows in, so A becomes cheaper in terms of B."]],
  }),
  sheetLab({
    id: "d4-swap-maths", module: "automated-market-makers", title: "Work out a swap and its price impact", level: "advanced", minutes: 16, xp: 55, skills: [SK], required: false,
    objective: "Use the constant-product formula to find the output of a swap and how much worse than the quoted price it was.",
    scenario: "A pool holds 1,000 A and 2,000,000 B. A trader sells 20,000 B for A. The fee is 0.3%, so 99.7% of the input counts. (Teaching figures.)",
    steps: ["In B7 work out the input after the fee: input times 997 over 1,000.", "In B8 work out the output of A: reserve A times B7, divided by (reserve B plus B7).", "In B9 work out the average price paid: input divided by output.", "In B10 work out the price before the trade: reserve B over reserve A.", "In B11 work out the slippage as a percentage: (B9 over B10 minus 1) times 100."],
    cells: { A1: "Input", B1: "Value", A2: "Reserve of A", B2: "1000", A3: "Reserve of B", B3: "2000000", A4: "Fee kept by the pool (per 1000)", B4: "3", A6: "B sold by the trader", B6: "20000", A7: "Input after fee", A8: "A received", A9: "Average price paid (B per A)", A10: "Price before the trade", A11: "Slippage (%)" }, view: { cols: 2, rows: 13 },
    checks: [
      ck("b7", "B7 is the input after fee", "=B6*997/1000", "Multiply by 997 over 1,000.", S.formula("B7", { equals: 19940 })),
      ck("b8", "B8 is the A received", "=B2*B7/(B3+B7)", "Reserve A times input over (reserve B plus input).", S.formula("B8", { equals: 1000 * 19940 / (2000000 + 19940) })),
      ck("b9", "B9 is the average price", "=B6/B8", "Input over output.", S.formula("B9", { equals: 20000 / (1000 * 19940 / (2000000 + 19940)) })),
      ck("b10", "B10 is the price before", "=B3/B2", "Reserve B over reserve A.", S.formula("B10", { equals: 2000 })),
      ck("b11", "B11 is the slippage", "=(B9/B10-1)*100", "How much worse than the starting price.", S.formula("B11", { equals: (20000 / (1000 * 19940 / (2000000 + 19940)) / 2000 - 1) * 100 })),
    ],
    solution: { cells: { B7: "=B6*997/1000", B8: "=B2*B7/(B3+B7)", B9: "=B6/B8", B10: "=B3/B2", B11: "=(B9/B10-1)*100" } },
  }),
  classifyLab({
    id: "d5-il", module: "liquidity-and-impermanent-loss", title: "Impermanent loss: when does it happen?", level: "advanced", minutes: 10, xp: 40, skills: [SK], required: true,
    objective: "Recognise when a liquidity provider loses relative to simply holding.", scenario: "Impermanent loss is the gap between holding two tokens in a wallet and holding them in a pool. Judge each situation.",
    steps: ["Read each situation.", "Choose the outcome.", "Press Check my work."],
    categories: [["loss", "Impermanent loss occurs"], ["none", "No impermanent loss"], ["offset", "Fees may offset it"]],
    items: [["One token doubles in price against the other", "loss", "The pool sells the winner as it rises."], ["The relative price returns to exactly where it started", "none", "The loss disappears if the ratio returns."], ["Two tokens that both track the same currency stay close together", "none", "Almost no price divergence."], ["A pool with heavy trading volume where fees exceed the divergence loss", "offset", "Fees can outweigh it."], ["One token falls to a tenth of its value against the other", "loss", "Large divergence, large loss."], ["The relative price never moves at all", "none", "No divergence."], ["A moderate price move in a pool that earns high fees", "offset", "Net result depends on fees and volume."], ["A provider withdraws after a big move and the price has not returned", "loss", "The loss becomes real once they withdraw."]],
  }),
  sheetLab({
    id: "d6-il-calc", module: "liquidity-and-impermanent-loss", title: "Calculate impermanent loss", level: "advanced", minutes: 16, xp: 55, skills: [SK], required: false,
    objective: "Use the standard formula to compare a pool position with holding, and see how much fee income would offset the gap.",
    scenario: "A provider deposits 10,000 rupees worth of two tokens, half in each. The price of one token doubles relative to the other. (Teaching figures; real pools differ.)",
    steps: ["In B7 work out the impermanent loss as a fraction: 2 times the square root of the ratio, divided by (1 plus the ratio), minus 1.", "In B8 show it as a percentage.", "In B9 work out the value if the tokens had simply been held: half the deposit times (1 plus the ratio).", "In B10 work out the value of the pool position: B9 times (1 plus B7).", "In B11 work out the gap, which is the fee income needed to break even against holding."],
    cells: { A1: "Input", B1: "Value", A2: "Price ratio (new relative to old)", B2: "2", A3: "Deposit (rupees)", B3: "10000", A7: "Impermanent loss (fraction)", A8: "Impermanent loss (%)", A9: "Value if held (rupees)", A10: "Value in the pool (rupees)", A11: "Gap to make up with fees (rupees)" }, view: { cols: 2, rows: 13 },
    checks: [
      ck("b7", "B7 is the loss fraction", "=2*SQRT(B2)/(1+B2)-1", "The standard formula.", S.formula("B7", { fns: ["SQRT"], equals: 2 * Math.sqrt(2) / 3 - 1 })),
      ck("b8", "B8 is the loss in percent", "=B7*100", "Times 100.", S.formula("B8", { equals: (2 * Math.sqrt(2) / 3 - 1) * 100 })),
      ck("b9", "B9 is the value if held", "=B3/2*(1+B2)", "Half the deposit times one plus the ratio.", S.formula("B9", { equals: 15000 })),
      ck("b10", "B10 is the pool value", "=B9*(1+B7)", "Held value times one plus the loss.", S.formula("B10", { equals: 15000 * (1 + (2 * Math.sqrt(2) / 3 - 1)) })),
      ck("b11", "B11 is the gap", "=B9-B10", "Held minus pool.", S.formula("B11", { equals: 15000 - 15000 * (1 + (2 * Math.sqrt(2) / 3 - 1)) })),
    ],
    solution: { cells: { B7: "=2*SQRT(B2)/(1+B2)-1", B8: "=B7*100", B9: "=B3/2*(1+B2)", B10: "=B9*(1+B7)", B11: "=B9-B10" } },
  }),
  classifyLab({
    id: "d7-lending-terms", module: "lending-and-borrowing", title: "Lending vocabulary", level: "advanced", minutes: 10, xp: 40, skills: [SK], required: true,
    objective: "Match each lending term to its meaning.", scenario: "Lending markets use a small vocabulary. Match each description to its term.",
    steps: ["Read each description.", "Choose the term.", "Press Check my work."],
    categories: [["ltv", "Loan-to-value"], ["threshold", "Liquidation threshold"], ["health", "Health factor"], ["util", "Utilisation"], ["bonus", "Liquidation bonus"], ["collateral", "Collateral"]],
    items: [["The most you may borrow as a share of your collateral's value", "ltv", "Sets the borrowing limit."], ["The share of collateral value at which a position becomes unsafe", "threshold", "Above it, liquidation starts."], ["Collateral value times threshold divided by debt: below 1 means liquidation", "health", "A single number for safety."], ["The share of deposited funds that is currently lent out", "util", "Drives interest rates."], ["The discount a liquidator receives for repaying someone's debt", "bonus", "Pays for risk and promptness."], ["Assets you lock to secure a loan", "collateral", "Security for lenders."], ["It rises toward 100% when almost everything is borrowed", "util", "Withdrawals become hard."], ["A value of 1.1 means a small price drop could trigger liquidation", "health", "Thin safety margin."]],
  }),
  sheetLab({
    id: "d8-health", module: "lending-and-borrowing", title: "How safe is this loan?", level: "advanced", minutes: 16, xp: 55, skills: [SK], required: false,
    objective: "Calculate borrowing capacity, health factor and the price fall that would trigger liquidation. (Education only.)",
    scenario: "A user deposits collateral worth 100,000 rupees. The market allows borrowing up to 75% of its value and liquidates at 80%. They have borrowed 60,000 rupees.",
    steps: ["In B7 work out the maximum borrowing allowed.", "In B8 work out the health factor: collateral times liquidation threshold over 100, divided by the debt.", "In B9 work out the percentage fall in the collateral's value that would trigger liquidation.", "In B10 work out how much more could still be borrowed.", "In B11 show Liquidatable below 1, Risky below 1.5, otherwise Comfortable."],
    cells: { A1: "Input", B1: "Value", A2: "Collateral value (rupees)", B2: "100000", A3: "Maximum loan-to-value (%)", B3: "75", A4: "Liquidation threshold (%)", B4: "80", A5: "Amount borrowed (rupees)", B5: "60000", A7: "Maximum borrowing", A8: "Health factor", A9: "Price fall that triggers liquidation (%)", A10: "Further borrowing possible", A11: "Status" }, view: { cols: 2, rows: 13 },
    checks: [
      ck("b7", "B7 is the maximum borrowing", "=B2*B3/100", "Collateral times the ratio.", S.formula("B7", { equals: 75000 })),
      ck("b8", "B8 is the health factor", "=B2*B4/100/B5", "Collateral times threshold, over debt.", S.formula("B8", { equals: 100000 * 80 / 100 / 60000 })),
      ck("b9", "B9 is the price fall", "=(1-B5/(B2*B4/100))*100", "How far collateral can fall before the threshold is reached.", S.formula("B9", { equals: (1 - 60000 / (100000 * 80 / 100)) * 100 })),
      ck("b10", "B10 is the headroom", "=B7-B5", "Maximum minus borrowed.", S.formula("B10", { equals: 15000 })),
      ck("b11", "B11 is the status", "=IF(B8<1,\"Liquidatable\",IF(B8<1.5,\"Risky\",\"Comfortable\"))", "Nest two IFs.", S.formula("B11", { fns: ["IF"], equals: "Risky" })),
    ],
    solution: { cells: { B7: "=B2*B3/100", B8: "=B2*B4/100/B5", B9: "=(1-B5/(B2*B4/100))*100", B10: "=B7-B5", B11: "=IF(B8<1,\"Liquidatable\",IF(B8<1.5,\"Risky\",\"Comfortable\"))" } },
  }),
  classifyLab({
    id: "d9-oracle-stable", module: "oracles-stablecoins-and-yield", title: "Safe design or red flag?", level: "advanced", minutes: 12, xp: 45, skills: [SK], required: true,
    objective: "Judge oracle, stablecoin and yield designs by the risks they carry.", scenario: "Many failures in DeFi came from weak oracles, fragile stablecoins and unsustainable yields. Judge each design.",
    steps: ["Read each design.", "Choose the verdict.", "Press Check my work."],
    categories: [["sound", "Reasonable design"], ["risky", "Serious risk"], ["context", "Depends on conditions"]],
    items: [["A lending market that reads the spot price from a single small pool", "risky", "A flash loan can move it."], ["A time-weighted average price over many minutes from a deep pool", "sound", "Costly to manipulate."], ["A stablecoin backed by cash and short-term government bills, with regular published reports", "sound", "Transparent and liquid."], ["A stablecoin whose stability relies only on a sister token that rises forever", "risky", "A confidence spiral can collapse it."], ["A crypto-collateralised stablecoin with 150% collateral and automatic liquidations", "context", "Safe only if collateral is liquid and liquidations work in a crash."], ["A yield of 40% a year with no explanation of where it comes from", "risky", "Unexplained yield is usually paid by new deposits or hidden risk."], ["Yield paid from trading fees and borrower interest, with the sources documented", "sound", "A real source of income."], ["An oracle with no check for stale or zero prices", "risky", "Bad data leads to wrong liquidations."]],
  }),
  wordLab({
    id: "d10-yield-offer", module: "oracles-stablecoins-and-yield", title: "Analyse a yield offer", level: "advanced", minutes: 18, xp: 65, skills: [SK], required: false,
    objective: "Practise asking where a promised return comes from and what could go wrong. (Education only; not advice about any real product.)",
    scenario: "A protocol advertises a 35% annual yield on a stablecoin deposit. Write a short analysis of what you would need to know before trusting it.",
    steps: ["Add Heading 2 sections: Where could the yield come from, Risks, Questions I would ask, Conclusion.", "Under Risks write a bulleted list of at least four risks.", "Mention smart contract risk and the possibility of losing the deposit.", "State that this is education and not financial advice.", "Keep it between 130 and 280 words."],
    checks: [
      ck("heads", "Four sections", "Use Heading 2.", "A clear analysis.", W.heading(4, 2)),
      ck("order", "In order", "Where could the yield come from, Risks, Questions I would ask, Conclusion.", "From source to conclusion.", W.order(["Where could the yield come from", "Risks", "Questions I would ask", "Conclusion"])),
      ck("risks", "Four risks", "Use the bullet button.", "List the risks.", W.list(4, "ul")),
      ck("sc", "Mentions smart contract risk", "Mention smart contract bugs or risk.", "Code can fail.", W.pattern("smart contract|bug|exploit", "smart contract risk")),
      ck("loss", "Mentions losing the deposit", "Mention losing the deposit or money.", "Principal can be lost.", W.pattern("lose|loss|lost", "losing money")),
      ck("adv", "States it is not financial advice", "Say this is not financial advice.", "Be honest.", W.pattern("not (financial |investment )?advice|education", "that this is not financial advice")),
      ck("len", "Between 130 and 280 words", "Concise.", "A short analysis.", W.words(130, 280)),
    ],
    solution: "<h2>Where could the yield come from</h2><p>A return of 35% on a stablecoin has to be paid by someone. It could come from trading fees, from interest paid by borrowers, from newly issued reward tokens, or from the deposits of newer users. Only the first two are sustainable income; rewards in a token depend on that token keeping its price.</p><h2>Risks</h2><ul><li>Smart contract risk: a bug or exploit could drain the pool, and audits reduce but do not remove it.</li><li>Reward-token risk: if the reward token falls, the real yield may be much lower than advertised.</li><li>Stablecoin risk: the deposited coin could lose its peg.</li><li>Governance or admin risk: the team might change the rules or take funds, and I could lose my deposit entirely.</li></ul><h2>Questions I would ask</h2><p>Who has audited the code and what did they find? How long has it run with real money? What do the borrowers pay? What are the admin powers, and are they time-locked?</p><h2>Conclusion</h2><p>Without a clear, sustainable source the offer looks too good to trust. This is education and not financial advice, and nobody should deposit money they cannot afford to lose.</p>",
  }),
  wordLab({
    id: "d11-due-diligence", module: "defi-risk-and-responsibility", title: "Write a protocol due-diligence summary", level: "advanced", minutes: 20, xp: 70, skills: [SK], required: true,
    objective: "Evaluate a DeFi protocol the way a careful analyst would, and state the limits of your review.",
    scenario: "Review the SimplePair automated market maker described in this course as if a team wanted to deploy it for real. (Education only.)",
    steps: ["Add Heading 2 sections: What it does, Strengths, Weaknesses and risks, What would be needed before real use.", "Under Weaknesses and risks write a bulleted list of at least four items.", "Mention oracle or price manipulation, odd tokens and the need for an audit.", "State that this is education and not financial advice.", "Keep it between 150 and 320 words."],
    checks: [
      ck("heads", "Four sections", "Use Heading 2.", "A structured review.", W.heading(4, 2)),
      ck("order", "In order", "What it does, Strengths, Weaknesses and risks, What would be needed before real use.", "From purpose to readiness.", W.order(["What it does", "Strengths", "Weaknesses and risks", "What would be needed before real use"])),
      ck("weak", "Four weaknesses", "Use the bullet button.", "List the problems.", W.list(4, "ul")),
      ck("oracle", "Mentions price manipulation or oracles", "Mention oracle or price manipulation.", "A known risk.", W.pattern("oracle|manipulat|flash", "price manipulation")),
      ck("tokens", "Mentions unusual tokens", "Mention fee-on-transfer, rebasing or unusual tokens.", "Assumptions about tokens.", W.pattern("fee-on-transfer|rebas|unusual token|odd token|non-standard|callback", "unusual tokens")),
      ck("audit", "Mentions an audit", "Mention an audit.", "Required for real value.", W.pattern("audit", "an audit")),
      ck("adv", "States it is not financial advice", "Say this is not financial advice.", "Be honest.", W.pattern("not (financial |investment )?advice|education", "that this is not financial advice")),
      ck("len", "Between 150 and 320 words", "Concise.", "A readable summary.", W.words(150, 320)),
    ],
    solution: "<h2>What it does</h2><p>SimplePair is a small automated market maker for two tokens. Providers deposit both tokens and receive shares; traders swap against the pool at a price set by the constant-product rule with a 0.3% fee that stays in the pool.</p><h2>Strengths</h2><p>The code is short and readable, updates reserves before external calls, uses a reentrancy guard and safe transfers, protects traders with a minimum output and locks a small amount of the first liquidity to limit share-price tricks.</p><h2>Weaknesses and risks</h2><ul><li>It uses its own recorded reserves, so tokens sent directly to the contract are not accounted for, and the owner of such tokens cannot recover them.</li><li>Fee-on-transfer, rebasing or other unusual tokens would break the accounting because the contract assumes it receives exactly the amount sent.</li><li>Any other protocol that reads this pool's spot price as an oracle could be attacked with a flash loan and price manipulation.</li><li>There is no protocol fee, no pause and no upgrade path, and an unbalanced deposit gifts value to the pool.</li></ul><h2>What would be needed before real use</h2><p>Extensive tests, fuzzing and invariants, a full independent audit, legal advice and monitoring. This is education and not financial advice, and it must not hold real funds as it stands.</p>",
  }),
  classifyLab({
    id: "d12-exploits", module: "defi-risk-and-responsibility", title: "Match the exploit to its cause", level: "advanced", minutes: 10, xp: 40, skills: [SK], required: false,
    objective: "Recognise the root cause behind common DeFi attacks.", scenario: "Most DeFi losses fall into a few patterns. Match each story to its root cause.",
    steps: ["Read each story.", "Choose the root cause.", "Press Check my work."],
    categories: [["reentrancy", "Reentrancy"], ["oracle", "Oracle manipulation"], ["governance", "Governance attack"], ["rug", "Rug pull or admin abuse"], ["logic", "Logic or rounding error"], ["key", "Compromised keys"]],
    items: [["An attacker borrows a huge amount, moves a pool price and borrows against the inflated price", "oracle", "The price source was manipulable."], ["A withdrawal function sends funds before updating the balance and is called again from the receiver", "reentrancy", "State updated too late."], ["Someone borrows enough voting tokens for one block to pass a harmful proposal", "governance", "Voting power could be rented."], ["The team removes liquidity and disappears", "rug", "Admin power was abused."], ["Share maths rounds in the attacker's favour for tiny deposits", "logic", "Precision and rounding."], ["A single operator key signs everything for a bridge and is stolen", "key", "Too much power behind one key."], ["An upgradeable contract is changed by its owner to take user funds", "rug", "Unchecked admin power."], ["A price feed stops updating and liquidations use a very old price", "oracle", "Stale data."]],
  }),
  wordLab({
    id: "cap-defi-review", module: "capstone", title: "Final project: write a DeFi protocol design and risk review", level: "challenge", minutes: 45, xp: 180, skills: [SK], required: true,
    objective: "Produce a professional design and risk review of a simple DeFi component, with numbers, safeguards and honest limits.",
    scenario: "Choose a simple component such as a swap pool, a lending market or a vault, and write the design and risk review you would give a team before they build it on a test network.",
    steps: ["Add a Heading 1 with the component's name and 'design and risk review'.", "Add Heading 2 sections: Purpose, How it works, Key numbers, Safeguards, Threats and failure cases, What is out of scope, Limits of this review.", "Under Key numbers include at least three figures such as fees, ratios or limits.", "Under Safeguards list at least four in bullets.", "Under Threats and failure cases mention an oracle or price risk, a liquidity risk and a smart contract risk.", "State that it is for a test network, not audited and not financial advice.", "Keep it between 350 and 700 words."],
    checks: [
      ck("t", "A title", "Use Heading 1.", "Name the component.", W.heading(1, 1)),
      ck("secs", "Seven sections", "Use Heading 2.", "A complete review.", W.heading(7, 2)),
      ck("order", "In order", "Purpose, How it works, Key numbers, Safeguards, Threats and failure cases, Out of scope, Limits.", "A logical flow.", W.order(["Purpose", "How it works", "Key numbers", "Safeguards", "Threats and failure cases", "What is out of scope", "Limits of this review"])),
      ck("nums", "Includes figures", "Include numbers or percentages.", "Be concrete.", W.pattern("\\d+ ?%|\\d{2,}", "figures")),
      ck("guards", "Four safeguards", "Use the bullet button.", "List safeguards.", W.list(4, "ul")),
      ck("oracle", "Mentions oracle or price risk", "Mention oracle or price risk.", "A top DeFi risk.", W.pattern("oracle|price (manipulation|risk)|flash", "oracle or price risk")),
      ck("liq", "Mentions liquidity risk", "Mention liquidity risk.", "Exits can be hard.", W.pattern("liquidity", "liquidity risk")),
      ck("sc", "Mentions smart contract risk", "Mention smart contract risk or bugs.", "Code can fail.", W.pattern("smart contract|bug|exploit", "smart contract risk")),
      ck("audit", "States not audited and test network", "Say it is not audited and for a test network.", "Honest scope.", W.pattern("not (been )?audited[\\s\\S]*test|test[\\s\\S]*not (been )?audited|unaudited", "that it is not audited and for a test network")),
      ck("adv", "States it is not financial advice", "Say this is not financial advice.", "Education only.", W.pattern("not (financial |investment )?advice", "that this is not financial advice")),
      ck("len", "Between 350 and 700 words", "Two pages at most.", "Readable.", W.words(350, 700)),
    ],
    solution: "<h1>Savings Pool design and risk review</h1><h2>Purpose</h2><p>A small lending market for a student community on a test network. Members deposit a stablecoin and earn interest paid by borrowers who lock another token as collateral. It exists to learn how lending markets behave, not to hold real money.</p><h2>How it works</h2><p>Depositors supply the stablecoin and receive shares. Borrowers lock collateral and borrow up to a set share of its value. Interest follows a kinked curve that rises steeply when most funds are lent out. If a borrower's health factor falls below one, anyone can repay part of the debt and receive the collateral at a small discount.</p><h2>Key numbers</h2><p>The maximum loan-to-value is 60% and the liquidation threshold is 70%. Interest starts at 2% a year, rises gently to 6% at 80% utilisation and then steeply to 80% at full utilisation. The liquidation bonus is 5%, the protocol keeps 10% of interest as a reserve, and deposits are capped at 100,000 test units.</p><h2>Safeguards</h2><ul><li>Prices come from a time-weighted average over thirty minutes with checks for stale or zero values, not from a single spot price.</li><li>A guardian can pause new borrowing, but withdrawals and repayments always stay open.</li><li>Admin changes pass through a two-day time-lock controlled by a multi-signature wallet.</li><li>Deposit and borrow caps limit the effect of any bug.</li><li>Rounding always favours the protocol, and tests include fuzzing and invariants such as solvency.</li></ul><h2>Threats and failure cases</h2><p>Oracle risk: an attacker could try to move the price with a flash loan, which the time-weighted average makes costly. Liquidity risk: if utilisation approaches 100%, depositors cannot withdraw until borrowers repay, which the steep rate curve is designed to discourage. Smart contract risk: a bug in the interest or liquidation code could lead to loss of funds. A fast crash in collateral value could produce bad debt if liquidators cannot act in time.</p><h2>What is out of scope</h2><p>Governance tokens, cross-chain collateral, flash loans and front-end design are not covered.</p><h2>Limits of this review</h2><p>This is a design review for a test network. The code has not been audited, and this review is not financial advice and not a promise of safety or return. Real value would need independent audits, legal advice and continuous monitoring.</p>",
  }),
];

const M1 = module_({
  slug: "defi-foundations", title: "DeFi foundations", hours: 2.5, level: "Foundations",
  summary: "What decentralised finance is, its building blocks, composability, stablecoins and honest comparisons with traditional finance.",
  outcome: "You can describe the main DeFi building blocks, explain composability and judge a stablecoin's reserves.",
  intro: "Decentralised finance rebuilds financial functions such as trading, lending and saving as smart contracts that anyone can use. It has produced genuine innovation and spectacular losses. This course explains how the pieces work so you can build and judge them with open eyes. It is education only and not financial advice.",
  topics: [
    topic({
      title: "Financial functions as code", slug: "functions-as-code",
      blocks: [
        p("Traditional finance relies on institutions: exchanges, banks and clearing houses that hold your assets and enforce rules. DeFi moves some of those functions into smart contracts. You keep your assets in your own wallet until you choose to interact, and the rules are public code rather than private agreements. This removes some kinds of trust and adds others: you must now trust the code, its authors and its dependencies."),
        table("Traditional finance and DeFi, compared honestly", ["Feature", "Traditional finance", "DeFi"], [["Who holds your assets", "An institution", "You, until you deposit into a contract"], ["Opening hours", "Business hours", "All day, every day"], ["Access", "Accounts, identity checks, geography", "Anyone with a wallet (subject to local law)"], ["Transparency", "Limited", "Code and transactions are public"], ["Protections", "Deposit insurance, courts, regulators", "Mostly none: mistakes and exploits are usually final"], ["Speed of settlement", "Days", "Seconds to minutes"], ["Typical failure", "Fraud, mismanagement, runs", "Bugs, oracle attacks, key theft, rug pulls"]]),
        miniQuiz("func-mini", [["What new trust does DeFi require?", ["No trust at all", "Trust in the code, its authors and its dependencies", "Trust in a central bank", "Trust in the weather"], 1, "Trust moves; it does not vanish."]]),
        warn("This course is educational and not financial advice. DeFi can lose all your money, and most people should not use it with money they cannot afford to lose."),
      ],
      points: ["DeFi turns financial functions into public smart contracts.", "It removes some trust and adds trust in code."],
      check: [["In DeFi, deposit insurance is usually:", ["Absent", "Automatic", "Guaranteed by law", "Free"], 0, "Few protections exist."]],
    }),
    topic({
      title: "Building blocks and composability", slug: "building-blocks",
      blocks: [
        table("The main blocks", ["Block", "Job", "Example behaviour"], [["Decentralised exchange (DEX)", "Swap tokens", "Pools priced by a formula"], ["Lending market", "Lend and borrow against collateral", "Interest follows supply and demand"], ["Stablecoin", "A steady unit of account", "Backed by assets or collateral"], ["Oracle", "Bring outside data on-chain", "Prices, interest rates, events"], ["Derivatives", "Trade exposure to prices", "Futures, options"], ["Aggregators and vaults", "Automate strategies across protocols", "Move funds to the best return"]]),
        p("DeFi pieces are open, so one protocol can use another as a component. A vault may deposit into a lending market, which uses an oracle that reads a DEX, whose pools hold stablecoins. This **composability** is powerful, because new products appear without permission, and dangerous, because a failure in one piece can travel through every piece built on it."),
        flow("A chain of dependencies", ["A yield vault", "deposits into a lending market", "which values collateral using an oracle", "which reads prices from a DEX pool", "whose assets include a stablecoin"]),
        miniQuiz("block-mini", [["What risk does composability create?", ["Nothing, it is only good", "A failure in one component can spread through everything built on it", "Higher gas only", "Lower transparency"], 1, "Dependencies chain risks together."]]),
      ],
      points: ["Exchanges, lending, stablecoins, oracles and vaults are the main blocks.", "Composability creates opportunity and chains risk."],
      check: [["Composability means protocols can:", ["Use one another as components", "Merge into one", "Hide from users", "Print money"], 0, "Open building blocks."]],
    }),
    topic({
      title: "Stablecoins: promises of stability", slug: "stablecoins",
      blocks: [
        table("Kinds of stablecoin", ["Kind", "How it aims to hold its value", "Main risks"], [["Fiat-backed", "Reserves of cash and short-term government debt back each token", "Issuer honesty, bank and custody risk, freezing, regulation"], ["Crypto-collateralised", "Over-collateralised loans in volatile crypto; automatic liquidations", "Sharp crashes, oracle failures, liquidation congestion"], ["Algorithmic", "Supply is adjusted by rules or a companion token", "Confidence spirals; several have collapsed to zero"], ["Commodity-backed", "Tied to a physical asset such as gold", "Custody, audit and redemption difficulty"]]),
        explorer({ id: "defi-reserve", title: "Reserve backing", intro: "Change the reserves and tokens in circulation to see the backing ratio. A teaching tool, not an assessment of any real coin.", inputs: [{ id: "cash", label: "Cash and bills (millions)", min: 0, max: 200, step: 1, value: 95 }, { id: "other", label: "Other assets (millions)", min: 0, max: 100, step: 1, value: 8 }, { id: "tokens", label: "Tokens in circulation (millions)", min: 10, max: 200, step: 1, value: 100 }], outputs: [{ label: "Backing ratio (%)", expr: "(cash + other) / tokens * 100", unit: "n" }, { label: "Cash and bills as a share of tokens (%)", expr: "cash / tokens * 100", unit: "n" }] }),
        list("What to look for in a stablecoin", ["Who issues it and under what regulation?", "What backs it, and how liquid are those assets?", "Are there regular, independent attestations or audits?", "Can holders redeem directly, and at what cost?", "What happens in a crisis: freezes, delays, liquidations?", "How has it behaved during past market stress?"], true),
        miniQuiz("stable-mini", [["Why are algorithmic stablecoins considered especially risky?", ["They are too transparent", "Their stability can depend on confidence and a companion token, and a loss of confidence can collapse them", "They cost too much", "They have too many reserves"], 1, "Several have failed."]]),
      ],
      points: ["Fiat-backed, crypto-collateralised and algorithmic coins carry different risks.", "Check reserves, redemption and past stress behaviour."],
      check: [["A backing ratio under 100% means:", ["Reserves do not cover all tokens", "Fully backed", "Overbacked", "Nothing"], 0, "A shortfall."]],
    }),
  ],
  terms: [["DeFi", "Decentralised finance built from smart contracts"], ["Composability", "Protocols usable as parts of one another"], ["Stablecoin", "A token designed to hold a steady value"], ["Oracle", "A source of outside data for contracts"], ["Reserve", "Assets held to back tokens"], ["Peg", "The target price a stablecoin aims to hold"]],
  practical: { title: "Practical: map a dependency chain", intro: "Using public documentation.", steps: ["Pick one DeFi product and list what it depends on.", "Draw the chain of dependencies.", "Mark the weakest link.", "Write what would happen if that link failed."] },
  quiz: [
    ["DeFi puts financial functions in:", ["Smart contracts", "Banks", "Paper", "Post offices"], 0, "Public code."],
    ["Composability means:", ["Protocols building on each other", "Hiding code", "Printing coins", "Banking hours"], 0, "Open building blocks."],
    ["A stablecoin aims to:", ["Hold a steady value", "Double every year", "Hide balances", "Mine blocks"], 0, "A unit of account."],
    ["Fiat-backed coins rely on:", ["Reserves and an issuer", "Mining", "Luck", "Algorithms only"], 0, "Issuer and custody risk."],
    ["Algorithmic coins have been:", ["Fragile in crises", "Always safe", "Insured", "Free"], 0, "Several collapsed."],
    ["Deposit insurance in DeFi is:", ["Generally absent", "Automatic", "Guaranteed", "Mandatory"], 0, "Few protections."],
    ["This course gives:", ["Education, not financial advice", "Investment tips", "Guaranteed returns", "Legal advice"], 0, "Be careful."],
  ],
});

const M2 = module_({
  slug: "automated-market-makers", title: "Automated market makers", hours: 3, level: "Core skills",
  summary: "The constant-product rule, quotes, slippage and fees, with a complete teaching contract.",
  outcome: "You can calculate a swap by hand, explain slippage and read a simple AMM contract.",
  intro: "The automated market maker replaced the order book with a formula. It is simple enough to understand completely, which makes it the ideal first DeFi contract to read and the foundation for much of what follows.",
  topics: [
    topic({
      title: "The constant-product rule", slug: "constant-product",
      blocks: [
        p("A pool holds reserves of two tokens, A and B. The rule is that the product reserve A times reserve B stays constant when someone trades (apart from fees, which make it grow). If a trader adds some B to the pool, the pool must give out enough A to keep the product the same. The price of A in terms of B is simply reserve B divided by reserve A, so it moves as the reserves move."),
        table("An example with numbers", ["Step", "Reserve A", "Reserve B", "Product", "Price of A"], [["Start", "1,000", "2,000,000", "2,000,000,000", "2,000 B"], ["Trader adds 20,000 B (ignoring fees)", "about 990.1", "2,020,000", "about 2,000,000,000", "about 2,040 B"], ["Trader receives", "about 9.9 A", "", "", "Average price paid about 2,020 B"]]),
        explorer({ id: "defi-swap", title: "Constant-product swap", intro: "Change the pool size and the amount you spend to see what you receive and the price impact. Fee 0.3%.", inputs: [{ id: "ra", label: "Reserve of A", min: 100, max: 10000, step: 100, value: 1000 }, { id: "rb", label: "Reserve of B", min: 100000, max: 10000000, step: 100000, value: 2000000 }, { id: "spend", label: "B spent", min: 1000, max: 500000, step: 1000, value: 20000 }], outputs: [{ label: "A received", expr: "ra * (spend * 0.997) / (rb + spend * 0.997)", unit: "n" }, { label: "Price impact (%)", expr: "(1 - (ra * (spend * 0.997) / (rb + spend * 0.997) / spend) / (ra / rb)) * 100", unit: "n" }] }),
        miniQuiz("cp-mini", [["What happens to the price of A when a trader buys A with B?", ["It falls", "It rises", "It stays the same", "It becomes zero"], 1, "The pool has less A and more B."]]),
      ],
      points: ["Reserve A times reserve B stays constant; the price is the reserve ratio.", "Bigger trades relative to the pool move the price more."],
      check: [["The price of A in the pool equals:", ["Reserve B divided by reserve A", "Reserve A divided by reserve B", "Reserve A plus reserve B", "The product"], 0, "The ratio of reserves."]],
    }),
    topic({
      title: "A teaching AMM contract", slug: "amm-contract",
      blocks: [
        code("solidity", pair, "SimplePair.sol"),
        table("Key ideas in the code", ["Idea", "Where and why"], [["getAmountOut", "Applies the fee and the formula; a pure function everyone can check"], ["MINIMUM_LIQUIDITY burned at the start", "Stops the first provider manipulating the share price"], ["Shares for the smaller side", "An unbalanced deposit gifts the extra to the pool"], ["minOut and minShares", "Protect users when the price moves before inclusion"], ["Reserves recorded in storage", "The contract does not trust its raw balance"], ["Effects before transfers and nonReentrant", "Defence against reentrancy"], ["SafeERC20", "Handles tokens that do not return values"]]),
        warn("This is a teaching contract. It does not handle fee-on-transfer or rebasing tokens, has no protocol fee and has not been audited. Never deploy it with real funds."),
        miniQuiz("amm-mini", [["Why take shares from the smaller side of a deposit?", ["It saves gas", "So a provider cannot claim more of the pool than they put in", "Because tokens are equal", "It is a Solidity rule"], 1, "Protect existing providers."]]),
      ],
      points: ["The contract tracks reserves, mints shares and enforces the formula.", "Slippage limits protect users from price moves."],
      check: [["A minimum output on a swap protects against:", ["The price moving before inclusion", "Gas", "Events", "Roles"], 0, "Slippage and front-running."]],
    }),
    topic({
      title: "The maths in code, and what traders face", slug: "maths-and-traders",
      blocks: [
        code("javascript", ammJs, "amm.js"),
        table("What traders must watch", ["Issue", "Explanation", "Defence"], [["Slippage", "Large trades relative to the pool get a worse average price", "Check the quoted impact; split trades; use deeper pools"], ["Front-running", "A bot sees your pending trade and trades first to profit from the price move", "Set a tight minimum output; use private submission services"], ["Sandwich attack", "A bot trades before and after you, taking value from your slippage allowance", "Keep slippage tolerance small"], ["Fake tokens", "Scam tokens with the same name", "Use verified addresses only"], ["Approvals", "Unlimited allowances to a router", "Approve only what you need"]]),
        miniQuiz("trader-mini", [["Why does a wide slippage tolerance help attackers?", ["It does not", "A bot can move the price within your tolerance and keep the difference", "It raises gas", "It blocks trades"], 1, "Your tolerance is their profit margin."]]),
        tip("Always compare the price impact with the fee. A trade with 3% impact in a 0.3% fee pool is really a 3% cost."),
      ],
      points: ["Slippage, front-running and sandwich attacks are real costs for traders.", "Keep tolerances tight and approvals small."],
      check: [["A sandwich attack profits from:", ["Your allowed slippage", "Your gas", "Your name", "Your wallet brand"], 0, "Tighten it."]],
    }),
  ],
  terms: [["AMM", "Automated market maker"], ["Constant product", "The rule that reserve A times reserve B stays constant"], ["Slippage", "The gap between the expected and the received price"], ["Liquidity", "Tokens in a pool available for trading"], ["Sandwich attack", "Trading before and after a victim's trade"], ["Fee tier", "The percentage of each trade kept by the pool"]],
  practical: { title: "Practical: swap on paper and on a test network", intro: "With SimplePair and two test tokens.", steps: ["Calculate a swap by hand with the formula.", "Deploy SimplePair and two test tokens and add liquidity.", "Swap and compare with your calculation.", "Try a swap with a minimum output that is too high."] },
  quiz: [
    ["The constant-product rule says:", ["A times B stays constant", "A plus B stays constant", "A equals B", "Price is fixed"], 0, "Apart from fees."],
    ["Price of A is:", ["Reserve B over reserve A", "Reserve A over reserve B", "A times B", "Zero"], 0, "Reserve ratio."],
    ["Larger trades cause:", ["More slippage", "Less slippage", "No change", "Free tokens"], 0, "Relative to the pool."],
    ["Fees stay:", ["In the pool", "With the trader", "With the bank", "Nowhere"], 0, "They grow the reserves."],
    ["minOut protects against:", ["Price moving before inclusion", "Gas", "Events", "Roles"], 0, "A minimum output limits slippage."],
    ["Burning the first minimum liquidity:", ["Limits share-price manipulation", "Costs fees", "Is required by ERC-20", "Prints tokens"], 0, "A safeguard."],
    ["Teaching contracts should:", ["Never hold real funds", "Be used live", "Be unlimited", "Be secret"], 0, "Not audited."],
  ],
});

const M3 = module_({
  slug: "liquidity-and-impermanent-loss", title: "Liquidity provision and impermanent loss", hours: 2.5, level: "Core skills",
  summary: "Why providers earn fees, how impermanent loss arises and how to calculate it honestly.",
  outcome: "You can calculate impermanent loss, compare it with fee income and describe the risks of providing liquidity.",
  intro: "Pools need people to supply tokens. Providers earn fees, but they carry risks that are easy to miss: the pool automatically sells the winning token as its price rises, so a provider can end up with less than they would have by simply holding. This module puts numbers on that.",
  topics: [
    topic({
      title: "Why providers get paid, and what they give up", slug: "providers",
      blocks: [
        flow("A provider's journey", ["Deposit both tokens in the current ratio", "Receive pool shares that represent a fraction of the pool", "Earn a fraction of every trading fee", "Prices move; the pool rebalances the mix of tokens", "Withdraw shares for the current mix of tokens plus accumulated fees"]),
        table("Sources of return and risk", ["Item", "Direction", "Notes"], [["Trading fees", "Income", "Depends on trading volume and the share of the pool"], ["Reward tokens", "Income, if the token holds value", "May fall in price quickly"], ["Impermanent loss", "Cost", "Arises when relative prices diverge"], ["Smart contract risk", "Cost", "A bug can lose everything"], ["Token risk", "Cost", "One token might collapse or be a scam"], ["Gas costs", "Cost", "Entering and exiting cost fees"]]),
        miniQuiz("prov-mini", [["What do pool shares represent?", ["A loan", "A fraction of the pool's reserves and future fees", "A vote", "A guarantee of profit"], 1, "Your slice of the pool."]]),
        warn("Educational only. Providing liquidity can lose money, and promised yields are not guaranteed."),
      ],
      points: ["Providers earn fees and face impermanent loss and contract risk.", "Pool shares represent a fraction of the reserves."],
      check: [["Fees are earned in proportion to:", ["Your share of the pool", "Your wallet age", "Your gas", "Your luck"], 0, "Fees are shared in proportion to each share."]],
    }),
    topic({
      title: "Impermanent loss, with numbers", slug: "il-numbers",
      blocks: [
        formulaBlock(),
        table("Impermanent loss for a 50/50 pool", ["Relative price change", "Loss versus holding"], [["1.25 times", "About 0.6%"], ["1.5 times", "About 2.0%"], ["2 times", "About 5.7%"], ["3 times", "About 13.4%"], ["5 times", "About 25.5%"], ["Falls to a tenth (ratio 0.1)", "About 42%"]]),
        explorer({ id: "defi-il", title: "Impermanent loss calculator", intro: "Change the relative price ratio to see the loss compared with holding. A teaching model for a 50/50 constant-product pool.", inputs: [{ id: "r", label: "Price ratio (new relative to old)", min: 0.1, max: 10, step: 0.1, value: 2 }, { id: "dep", label: "Deposit (rupees)", min: 1000, max: 100000, step: 1000, value: 10000 }], outputs: [{ label: "Impermanent loss (%)", expr: "(2 * sqrt(r) / (1 + r) - 1) * 100", unit: "n" }, { label: "Value if held (rupees)", expr: "dep / 2 * (1 + r)", unit: "rs" }, { label: "Value in the pool before fees (rupees)", expr: "dep / 2 * (1 + r) * (2 * sqrt(r) / (1 + r))", unit: "rs" }] }),
        miniQuiz("il-mini", [["When does impermanent loss disappear?", ["Never", "If the relative price returns to its starting value", "When fees are paid", "After a week"], 1, "It is a function of the price ratio."]]),
      ],
      points: ["Loss is a function of the price ratio: small for small moves, large for big ones.", "It becomes real only when you withdraw after divergence."],
      check: [["A price ratio of 1 gives:", ["No impermanent loss", "Total loss", "Double value", "A fee"], 0, "No divergence."]],
    }),
    topic({
      title: "Fees versus loss, and honest expectations", slug: "fees-vs-loss",
      blocks: [
        p("Whether providing liquidity pays depends on whether fee income exceeds the loss from price divergence plus costs. Stable pairs, where both tokens track the same value, have little divergence and modest fees. Volatile pairs have bigger fees if trading is busy, but larger divergence. There is no universal answer, and past fee income does not predict the future."),
        table("Typical pair types", ["Pair type", "Divergence", "Fee income", "Special risk"], [["Two stablecoins", "Very small", "Low", "A peg failure"], ["Major token with a stablecoin", "Moderate to large", "Moderate to high", "Large price swings"], ["Two correlated tokens", "Small", "Moderate", "Correlation can break"], ["A new small token with a stablecoin", "Very large", "Variable", "Scams and collapse"]]),
        list("Questions to ask before providing liquidity (for study)", ["What is the pool's trading volume compared with its size?", "How large could price divergence be?", "Are the tokens and the contract trustworthy?", "What are the entry and exit costs?", "Can I explain the risks in my own words?", "Can I afford to lose this money?"], true),
        miniQuiz("fvl-mini", [["Why is the past fee yield a poor guide to the future?", ["It is secret", "Volume and prices change, so yields change", "Fees are fixed", "It is always lower"], 1, "Conditions move."]]),
      ],
      points: ["Providing liquidity pays only if fees exceed divergence loss and costs.", "Past yields do not predict future yields."],
      check: [["A pool of two stablecoins has:", ["Little divergence but also lower fees", "Huge divergence", "No risk", "No fees"], 0, "A different risk profile."]],
    }),
  ],
  terms: [["Liquidity provider", "Someone who deposits tokens into a pool"], ["Pool share", "A token representing a fraction of a pool"], ["Impermanent loss", "The shortfall of a pool position versus holding"], ["Volume", "The amount traded in a period"], ["Divergence", "A change in the relative price of the two tokens"], ["Peg", "The intended steady price"]],
  practical: { title: "Practical: compute losses", intro: "With a calculator.", steps: ["Compute the loss for ratios 1.5, 2 and 4.", "Estimate the fees needed to offset each for a one-month deposit.", "Explain why the loss is called impermanent.", "Write a one-paragraph summary for a friend."] },
  quiz: [
    ["Providers receive:", ["Pool shares", "A loan", "A vote", "A guarantee"], 0, "A fraction of the pool."],
    ["Impermanent loss arises from:", ["Relative price changes", "Gas", "Names", "Events"], 0, "Divergence."],
    ["With a ratio of 1 the loss is:", ["Zero", "Total", "50%", "Unknown"], 0, "No divergence."],
    ["Fees can:", ["Offset the loss", "Never offset", "Cause the loss", "Hide the loss"], 0, "Depends on volume."],
    ["Stable pairs have:", ["Low divergence", "No fees", "No risk", "High divergence"], 0, "But a peg risk."],
    ["Past yields:", ["Do not guarantee future yields", "Guarantee yields", "Are fixed", "Are secret"], 0, "Conditions change."],
    ["Advice on what to buy is:", ["Not given here", "Given here", "Required", "Free"], 0, "Education only."],
  ],
});

function formulaBlock() {
  return table("The idea in one line", ["Quantity", "Formula"], [["Impermanent loss for a 50/50 constant-product pool", "2 × √r ÷ (1 + r) − 1, where r is the new price divided by the old price"], ["Value of the pool position compared with holding", "Held value × (1 + loss), where the loss is negative"]]);
}

const M4 = module_({
  slug: "lending-and-borrowing", title: "Lending and borrowing", hours: 2.5, level: "Applied skills",
  summary: "Collateral, interest curves, health factors and liquidations.",
  outcome: "You can compute borrowing limits and health factors, read an interest-rate curve and explain how liquidations protect lenders.",
  intro: "DeFi lending is almost always over-collateralised: you must lock more value than you borrow, because there is no way to chase a borrower who walks away. This module covers the maths of safety, the curve that sets interest, and the mechanism that keeps lenders whole.",
  topics: [
    topic({
      title: "Collateral, limits and health", slug: "collateral-health",
      blocks: [
        code("solidity", lendingMath, "LendingMath.sol"),
        table("Terms", ["Term", "Meaning", "Example"], [["Collateral", "Assets locked to secure a loan", "100,000 rupees of a volatile token"], ["Loan-to-value (LTV)", "The most you can borrow as a share of collateral", "75% gives 75,000 rupees"], ["Liquidation threshold", "The ratio at which the position becomes unsafe", "80%"], ["Health factor", "Collateral × threshold ÷ debt", "100,000 × 0.8 ÷ 60,000 = 1.33"], ["Liquidation bonus", "The discount a liquidator earns", "5%"], ["Utilisation", "Borrowed ÷ deposited", "80% means 80 of every 100 are lent out"]]),
        miniQuiz("coll-mini", [["What does a health factor below 1 mean?", ["The loan is safe", "The position can be liquidated", "Interest is zero", "The loan is repaid"], 1, "Collateral no longer covers the debt with a margin."]]),
      ],
      points: ["Over-collateralisation and health factors protect lenders.", "Health factor below 1 means liquidation is allowed."],
      check: [["LTV caps:", ["How much you can borrow", "Your gas", "Your fees", "Your votes"], 0, "A share of collateral value."]],
    }),
    topic({
      title: "Interest rates that follow utilisation", slug: "interest-curve",
      blocks: [
        p("A lending pool must keep enough unlent funds so depositors can withdraw. Interest rates are therefore set by **utilisation**. When little is borrowed, rates are low to encourage borrowing. When utilisation gets close to 100%, rates climb steeply so that borrowers repay and new deposits arrive. The kinked curve in the contract does exactly this."),
        explorer({ id: "defi-rate", title: "Interest rate curve", intro: "Move utilisation to see the borrow rate and the deposit rate. The curve: 2% base, 4% slope below an 80% kink, 75% slope above. Reserve factor 10%. A teaching model.", inputs: [{ id: "u", label: "Utilisation (%)", min: 0, max: 100, step: 1, value: 80 }], outputs: [{ label: "Borrow rate (% a year)", expr: "2 + min(u, 80) / 80 * 4 + max(u - 80, 0) / 20 * 75", unit: "n" }] }),
        table("What the curve achieves", ["Region", "Rate behaviour", "Purpose"], [["Below the kink", "Gentle rise", "Cheap borrowing keeps the pool useful"], ["Above the kink", "Very steep rise", "Pull funds back before withdrawals become impossible"], ["At 100%", "Very high", "Depositors cannot withdraw; the market is stressed"]]),
        miniQuiz("rate-mini", [["Why does the rate rise steeply above the kink?", ["To raise profits", "To pull funds back so depositors can still withdraw", "To discourage deposits", "To confuse users"], 1, "Protect liquidity."]]),
      ],
      points: ["Rates follow utilisation along a kinked curve.", "Steep rates near full utilisation protect withdrawals."],
      check: [["Utilisation is:", ["Borrowed divided by deposited", "Deposited minus borrowed", "Fees divided by gas", "Price times supply"], 0, "The share lent out."]],
    }),
    topic({
      title: "Liquidations and flash loans", slug: "liquidations",
      blocks: [
        flow("A liquidation", ["Collateral falls in price", "The health factor drops below 1", "A liquidator repays part of the debt", "They receive collateral worth the repayment plus a bonus", "The lender is protected from bad debt", "The borrower loses some collateral"]),
        p("Liquidations rely on market participants noticing and acting quickly. In a sharp crash, prices can fall faster than liquidators can act, networks can congest, and oracles can lag. The result can be **bad debt**: debt that exceeds collateral and falls on depositors."),
        code("solidity", flash, "FlashLender.sol"),
        table("Flash loans in context", ["Fact", "Explanation"], [["Borrow any amount with no collateral", "Repayment is checked inside the same transaction"], ["If not repaid, the transaction reverts", "As if it never happened"], ["Legitimate uses", "Refinancing, arbitrage, self-liquidation, swapping collateral"], ["Attack uses", "Moving prices to manipulate oracles, or voting power for governance attacks"], ["Defence", "Do not use a single spot price; use time-weighted averages and sanity checks"]]),
        miniQuiz("liq-mini", [["How does a flash loan avoid needing collateral?", ["It uses a bank", "Repayment is verified inside the same transaction, or everything is undone", "It trusts the borrower", "It charges a deposit"], 1, "Atomicity makes it safe for the lender."]]),
        warn("Education only. Never use flash loans or liquidation bots with real funds without deep understanding and professional review."),
      ],
      points: ["Liquidators repay debt for collateral plus a bonus; crashes can still cause bad debt.", "Flash loans work because of atomicity; they also power attacks."],
      check: [["Bad debt is:", ["Debt exceeding collateral", "Old debt", "A kind of interest", "A fee"], 0, "Falls on depositors."]],
    }),
  ],
  terms: [["Over-collateralised", "Locking more value than you borrow"], ["Health factor", "A safety measure for a position"], ["Liquidation", "Forced repayment through sale of collateral"], ["Utilisation", "The share of deposits that is lent out"], ["Bad debt", "Debt not covered by collateral"], ["Flash loan", "A loan repaid in the same transaction"]],
  practical: { title: "Practical: stress-test a position", intro: "With a spreadsheet.", steps: ["Choose collateral, LTV, threshold and debt.", "Compute the health factor.", "Find the price drop that triggers liquidation.", "Repeat for three different debts."] },
  quiz: [
    ["Over-collateralisation means:", ["More collateral than debt", "Less collateral than debt", "No collateral", "Equal amounts"], 0, "A buffer for lenders."],
    ["Health factor below 1:", ["Allows liquidation", "Is safe", "Is rewarded", "Is impossible"], 0, "Unsafe position."],
    ["Rates rise with:", ["Utilisation", "Date", "Colour", "Gas price"], 0, "Supply and demand."],
    ["Liquidators earn:", ["A bonus", "Nothing", "A loan", "A vote"], 0, "For acting."],
    ["Bad debt falls on:", ["Depositors", "Liquidators", "Borrowers", "Oracles"], 0, "Shared losses."],
    ["Flash loans need:", ["Repayment in the same transaction", "Collateral", "A bank", "A password"], 0, "Atomicity means the whole transaction is undone if repayment fails."],
    ["Using flash loans live needs:", ["Deep understanding and review", "Nothing", "Luck", "Haste"], 0, "Using them live is risky without deep understanding."],
  ],
});

const M5 = module_({
  slug: "oracles-stablecoins-and-yield", title: "Oracles, stablecoin design and yield", hours: 2.5, level: "Applied skills",
  summary: "Manipulation-resistant prices, how stablecoins fail and where yield really comes from.",
  outcome: "You can read a TWAP oracle, explain stablecoin failure modes and test a yield claim.",
  intro: "Three questions sit under almost every large DeFi loss: where did the price come from, what actually backed the stable asset, and who was paying the yield? This module teaches you to ask them.",
  topics: [
    topic({
      title: "Prices contracts can trust", slug: "oracles",
      blocks: [
        code("solidity", twap, "SimpleTwap.sol"),
        table("Oracle design choices", ["Choice", "Strength", "Weakness"], [["Spot price from one pool", "Simple and always available", "A flash loan can move it in one transaction"], ["Time-weighted average from a deep pool", "Costly to manipulate over many blocks", "Lags real moves; useless for thin pools"], ["Decentralised oracle network", "Many independent reporters and sources", "Cost, latency and the trust placed in the network"], ["Multiple sources compared", "Resists a single failure", "More code and complexity"], ["Circuit breakers", "Stop on strange jumps", "Can freeze markets when prices move for real"]]),
        list("Checks any price consumer should make", ["The price is not zero or negative.", "The price is fresh: updated within an agreed time.", "The change from the last price is plausible.", "A second source agrees within a tolerance.", "What happens when the oracle fails: pause or fallback, not guess."], true),
        miniQuiz("oracle2-mini", [["Why is a TWAP harder to manipulate than a spot price?", ["It is secret", "An attacker would need to hold the distorted price for the whole averaging period, which is costly", "It uses more gas", "It is a different token"], 1, "Time is expensive for an attacker."]]),
      ],
      points: ["Spot prices can be manipulated; averages and multiple sources raise the cost.", "Always check freshness, sanity and failure behaviour."],
      check: [["A stale price is dangerous because:", ["Liquidations may use wrong values", "It is slower", "It is private", "It is free"], 0, "Old data, wrong decisions."]],
    }),
    topic({
      title: "How stable assets fail", slug: "stablecoin-failure",
      blocks: [
        flow("A run on an algorithmic stablecoin", ["The coin trades slightly below its peg", "Holders lose confidence and sell", "The system mints more of the companion token to absorb the sales", "The companion token's price falls as supply explodes", "Confidence collapses further and the peg breaks completely"]),
        table("Failure modes", ["Kind", "How it fails", "Warning signs"], [["Algorithmic", "A confidence spiral where the backing token loses value as it is created", "Stability depends on a rising companion token"], ["Crypto-collateralised", "Collateral crashes faster than liquidations can run", "Illiquid collateral, one oracle, congestion"], ["Fiat-backed", "Reserves are not what is claimed, or a custodian fails", "Vague reserve reporting, concentration in one bank"], ["Any", "A smart contract exploit or key compromise", "Unaudited code, single admin key"]]),
        p("The common thread is that stability is a promise, and promises are only as good as the assets and mechanisms behind them in the worst moment. Study how a coin behaved in the worst week of its history, not its calm months."),
        miniQuiz("fail-mini", [["What is a warning sign of an algorithmic stablecoin?", ["Fully published reserves", "Stability that relies on constant growth of a companion token", "Regular audits", "Redemption in cash"], 1, "Reflexive designs are fragile."]]),
      ],
      points: ["Stablecoins fail through spirals, crashes, hidden reserves or exploits.", "Study behaviour in stress, not in calm."],
      check: [["A confidence spiral is:", ["Selling causing more selling", "A price chart", "A fee", "An audit"], 0, "Self-reinforcing."]],
    }),
    topic({
      title: "Where does yield come from?", slug: "yield-sources",
      blocks: [
        table("Sources of yield", ["Source", "Sustainable?", "Notes"], [["Trading fees", "Yes, if there is real volume", "Varies with markets"], ["Borrower interest", "Yes, if demand is real", "Falls when borrowing is low"], ["Staking rewards of a network", "Yes, funded by network design", "Locked funds and slashing risk"], ["Reward tokens issued by the protocol", "Only as long as the token holds value", "Often inflates away"], ["Deposits of new users", "No", "Depends on endless growth: a Ponzi structure"], ["Hidden risk", "Looks like yield until it fails", "Selling insurance without saying so"]]),
        list("Questions to ask about any yield (for study)", ["Who is paying this, and why?", "What happens to the yield if prices fall or users leave?", "What risks am I taking that are not shown?", "Has it survived a market crash?", "Can the team change the rules or take the funds?", "If it is far above other rates, what is the catch?"], true),
        explorer({ id: "defi-real", title: "Real yield after reward-token losses", intro: "Change the advertised yield, the share paid in reward tokens and how much those tokens fall to see the real yield. A teaching model.", inputs: [{ id: "adv", label: "Advertised yield (% a year)", min: 1, max: 100, step: 1, value: 35 }, { id: "share", label: "Share paid in reward tokens (%)", min: 0, max: 100, step: 5, value: 80 }, { id: "fall", label: "Reward-token price fall (%)", min: 0, max: 100, step: 5, value: 50 }], outputs: [{ label: "Real yield after the fall (% a year)", expr: "adv * (1 - share / 100) + adv * share / 100 * (1 - fall / 100)", unit: "n" }] }),
        miniQuiz("yield-mini", [["A very high yield with no explained source is usually:", ["Free money", "Paid by new deposits, reward-token printing or hidden risk", "Guaranteed", "Insured"], 1, "Ask who pays."]]),
      ],
      points: ["Sustainable yield comes from fees, borrower interest or network rewards.", "Reward tokens and new deposits are fragile sources."],
      check: [["Yield paid from new users' deposits is:", ["Unsustainable", "Sustainable", "Insured", "Guaranteed"], 0, "A Ponzi structure."]],
    }),
  ],
  terms: [["TWAP", "Time-weighted average price"], ["Peg", "The intended price of a stablecoin"], ["Reflexivity", "A system whose price affects its own backing"], ["Reward token", "A token paid to users as an incentive"], ["Circuit breaker", "A rule that halts activity on odd data"], ["Real yield", "Return from genuine fees or interest"]],
  practical: { title: "Practical: test a yield claim", intro: "Using public information.", steps: ["Pick a published yield.", "Identify each source of the return.", "Recalculate it if the reward token falls by half.", "Write whether you would trust it and why (for study only)."] },
  quiz: [
    ["Spot prices can be:", ["Manipulated in one transaction", "Never changed", "Private", "Free"], 0, "Flash loans."],
    ["A TWAP averages:", ["Prices over time", "Names", "Fees", "Blocks"], 0, "Harder to manipulate."],
    ["Oracle checks include:", ["Freshness and sanity", "Colour", "Length", "Luck"], 0, "Reject bad data."],
    ["Algorithmic stablecoins are:", ["Fragile in crises", "Always safe", "Insured", "Backed by cash"], 0, "Reflexive risk."],
    ["Fiat-backed coins depend on:", ["Reserves and custodians", "Mining", "Chance", "Memes"], 0, "Transparency matters."],
    ["Sustainable yield comes from:", ["Real fees and interest", "New deposits", "Hype", "Luck"], 0, "Someone real pays."],
    ["Unexplained 40% yields are:", ["A red flag", "Normal", "Guaranteed", "Required"], 0, "Ask who pays."],
  ],
});

const M6 = module_({
  slug: "defi-risk-and-responsibility", title: "DeFi risk, security and responsibility", hours: 2.5, level: "Applied skills",
  summary: "The patterns behind exploits, how to review a protocol, and the legal and ethical care that builders and users owe.",
  outcome: "You can review a protocol's risks, explain the common exploit patterns and state what responsible building and honest communication require.",
  intro: "DeFi has lost billions to a small number of repeating mistakes. Knowing them is the best protection, whether you build, audit or merely use these systems. This module gathers the patterns, a due-diligence method and the responsibilities that come with handling other people's money.",
  topics: [
    topic({
      title: "The patterns behind the losses", slug: "exploit-patterns",
      blocks: [
        table("Common exploit patterns", ["Pattern", "How it works", "Defence"], [["Oracle manipulation", "Attacker moves a price source, then profits from a protocol that trusts it", "Time-weighted or multi-source prices, sanity checks"], ["Reentrancy", "A callback re-enters before state is updated", "Checks-effects-interactions and guards"], ["Flash-loan governance attack", "Borrow voting power for one transaction to pass a proposal", "Snapshots of voting power taken before proposals, time delays"], ["Rounding and share-price attacks", "First depositor or tiny amounts exploit integer division", "Minimum liquidity, virtual shares, rounding in the protocol's favour"], ["Admin key compromise", "A stolen key upgrades or drains contracts", "Multi-signature control, time-locks, key custody"], ["Bridge failures", "Verification flaws or few keys guard a huge pool", "Strong verification, limits and monitoring"], ["Rug pulls", "Creators drain liquidity or mint endlessly", "Locked liquidity, capped admin powers, transparency"]]),
        miniQuiz("pat-mini", [["Which defence best addresses flash-loan governance attacks?", ["Faster blocks", "Snapshotting voting power before a proposal so borrowed tokens cannot vote", "Lower fees", "Public chat"], 1, "Voting power must not be rentable for a moment."]]),
      ],
      points: ["A few patterns cause most losses: oracles, reentrancy, governance, rounding, keys, bridges and rug pulls.", "Each has a known defence."],
      check: [["A rug pull depends on:", ["Unchecked admin or creator power", "Slow blocks", "Low fees", "Public code"], 0, "Limit the powers."]],
    }),
    topic({
      title: "Reviewing a protocol", slug: "reviewing",
      blocks: [
        table("A due-diligence checklist (for study)", ["Area", "Questions"], [["Code and audits", "Who audited it, when, with what findings? Was the audited code the deployed code?"], ["Admin powers", "Who can upgrade or pause? Is it multi-signature and time-locked? Are parameters bounded?"], ["Dependencies", "Which oracles, bridges and tokens does it rely on? What if they fail?"], ["Economics", "Where does the yield come from? What happens in a crash?"], ["Track record", "How long has it run with real value? How did it behave in stress?"], ["Transparency", "Is the team known? Is documentation honest about risks?"], ["Monitoring and response", "Is there a bug bounty, a security contact and an incident plan?"], ["Limits", "Are there caps that bound the damage of a failure?"]]),
        list("How to read an audit report", ["Read the scope: what was and was not reviewed.", "Look at the number and severity of findings.", "See whether serious findings were fixed and re-checked.", "Check that the deployed code matches the audited commit.", "Remember that an audit is a snapshot and not a guarantee."], true),
        code("javascript", ammJs, "amm.js (reused for experiments)"),
        miniQuiz("review-mini", [["Why check that deployed code matches the audited commit?", ["It is a tradition", "Changes after the audit are unreviewed and may contain bugs", "Auditors insist", "It saves gas"], 1, "Only the audited code was reviewed."]]),
      ],
      points: ["Review code and audits, admin powers, dependencies, economics, history and response plans.", "An audit is a snapshot, not a guarantee."],
      check: [["A protocol with unlimited upgrade power in one key is:", ["High risk", "Safe", "Audited", "Insured"], 0, "A single point of failure."]],
    }),
    topic({
      title: "Building and speaking responsibly", slug: "responsibility",
      blocks: [
        list("Responsibilities of builders", ["Start on test networks and keep caps small at launch.", "Limit and delay admin power, and publish it.", "Get independent audits for anything holding value.", "Never promise returns; explain risks plainly.", "Publish a security contact and a bug bounty.", "Have an incident plan and use it honestly.", "Take legal advice: rules on exchanges, lending and tokens differ by country."]),
        table("Honest and misleading communication", ["Honest", "Misleading"], [["Past performance is not a guide to the future", "Guaranteed 40% yearly returns"], ["You can lose all of your deposit", "Risk-free yield"], ["Audited by X on this date; findings are listed here", "Fully audited and totally safe"], ["The team can pause the contract", "Completely decentralised, nobody controls anything (when an admin key exists)"]]),
        p("DeFi is sometimes marketed as 'trustless'. In practice, users trust code, authors, oracles, admins and governance. Honest builders name those trust assumptions instead of hiding them."),
        miniQuiz("resp-mini", [["Why is 'trustless' often misleading?", ["It is a technical term only", "Users still trust code, authors, oracles and administrators", "Contracts are never trusted", "It means free"], 1, "Name the real trust assumptions."]]),
        warn("Education only. Nothing in this course is financial, legal or investment advice, and DeFi can lose all of your money."),
      ],
      points: ["Builders owe users honesty, small launches, limited powers, audits and response plans.", "Name the trust assumptions instead of claiming 'trustless'."],
      check: [["Promising guaranteed returns is:", ["Misleading and often unlawful", "Good practice", "Required", "Normal"], 0, "Never promise returns."]],
    }),
  ],
  terms: [["Exploit", "An attack that takes advantage of a flaw"], ["Rug pull", "A creator abandoning a project after taking funds"], ["Due diligence", "Careful investigation before relying on something"], ["Audit", "An independent security review"], ["Bug bounty", "A reward for reporting flaws responsibly"], ["Trust assumption", "A thing you must rely on being honest or correct"]],
  practical: { title: "Practical: review a protocol", intro: "For study, using public documents.", steps: ["Pick a well-known protocol.", "Work through the due-diligence table.", "List its three biggest trust assumptions.", "Write a one-page summary of its risks."] },
  quiz: [
    ["Many losses come from:", ["A few repeating patterns", "Random events", "Slow blocks", "Low fees"], 0, "Learn them."],
    ["A governance flash-loan attack is stopped by:", ["Snapshotting voting power", "Lower fees", "Faster chains", "More tokens"], 0, "Borrowed votes should not count."],
    ["An audit is:", ["A snapshot, not a guarantee", "A guarantee", "Insurance", "Permanent"], 0, "Changes need review."],
    ["Admin keys should be:", ["Multi-signature and time-locked", "Single and instant", "Public", "Unused"], 0, "Limit power."],
    ["Honest marketing never:", ["Guarantees returns", "Mentions risk", "Names admins", "Cites audits"], 0, "Avoid false promises."],
    ["Trustless often hides:", ["Trust in code, oracles and administrators", "Nothing", "Savings", "Speed"], 0, "Be precise."],
    ["Legal rules are:", ["Different by country", "Identical everywhere", "Absent", "Optional"], 0, "Take advice."],
  ],
});

export default course({
  slug: "blockchain-defi", title: "Blockchain & Decentralized Finance (DeFi)", tagline: "Automated market makers, liquidity, lending, oracles, stablecoins and the risks, explained with working teaching contracts", level: "Intermediate", hours: 14,
  summary: "A rigorous, honest introduction to decentralised finance for developers: the building blocks and composability, stablecoin designs and their failures, the constant-product automated market maker with a complete teaching contract, liquidity provision and impermanent loss with real numbers, lending markets with health factors, interest curves and liquidations, flash loans, oracles and time-weighted prices, the sources of yield, the patterns behind major exploits and a due-diligence method. All Solidity listings were compiled with solc against OpenZeppelin 5. The course is educational only: it is not financial, investment or legal advice, and the contracts are not audited and must not hold real funds.",
  modules: [M1, M2, M3, M4, M5, M6],
  capstone: capstone({
    title: "Final project: write a DeFi protocol design and risk review", summary: "Produce a design and risk review of a simple DeFi component and pass the final assessment.",
    intro: "You have built, calculated and criticised the main pieces of DeFi. In this final step you write the design and risk review for a simple component on a test network: its purpose, mechanics, key numbers, safeguards, threats, scope and the honest limits of your review. Then take the final assessment covering the whole course. Everything here is education and not financial advice.",
    steps: ["Work through the **Final project: write a DeFi protocol design and risk review** lab.", "Make sure each threat has a safeguard or a stated limit.", "Take the final assessment below."], projectTitle: "A DeFi protocol design and risk review",
    quiz: [
      ["DeFi moves financial functions into:", ["Public smart contracts", "Private ledgers", "Paper", "Banks"], 0, "Code anyone can inspect."],
      ["Composability creates:", ["Opportunity and chained risk", "Only opportunity", "Only risk", "Nothing"], 0, "Dependencies matter."],
      ["The constant-product rule keeps constant:", ["Reserve A times reserve B", "Reserve A plus reserve B", "The price", "The fee"], 0, "Apart from fees."],
      ["The price of A in a pool is:", ["Reserve B over reserve A", "Reserve A over reserve B", "A times B", "Zero"], 0, "The reserve ratio."],
      ["Slippage is:", ["The gap between expected and received price", "A fee", "A token", "An audit"], 0, "Bigger trades cause more."],
      ["Impermanent loss depends on:", ["The change in relative price", "Gas", "The date", "The wallet"], 0, "It is zero when the ratio is 1."],
      ["A health factor below 1 allows:", ["Liquidation", "Withdrawal of all funds", "Free borrowing", "Nothing"], 0, "The position is unsafe."],
      ["Interest rates rise steeply near full utilisation to:", ["Protect withdrawals", "Raise profit", "Confuse users", "Reduce deposits"], 0, "Pull funds back."],
      ["A flash loan works because:", ["Repayment is checked inside the same transaction", "It has collateral", "A bank approves it", "It trusts the borrower"], 0, "Atomicity means the whole transaction is undone if repayment fails."],
      ["A time-weighted average price resists manipulation because:", ["An attacker must hold the price for a long time", "It is secret", "It uses gas", "It is free"], 0, "Time is costly."],
      ["Sustainable yield comes from:", ["Real fees and borrower interest", "New deposits", "Hype", "Luck"], 0, "Ask who pays."],
      ["A responsible builder:", ["States risks and never promises returns", "Guarantees returns", "Hides admin keys", "Skips audits"], 0, "Honesty protects users and the builder."],
    ],
  }),
  labs,
  skills: [{ id: SK, label: "DeFi" }],
  badges: [
    { id: "block-builder", title: "Block builder", description: "Matched jobs to DeFi building blocks.", when: { all: ["d1-building-blocks"] } },
    { id: "price-predictor", title: "Price predictor", description: "Predicted how pool events move prices.", when: { all: ["d3-amm-price"] } },
    { id: "protocol-reviewer", title: "Protocol reviewer", description: "Wrote a due-diligence summary.", when: { all: ["d11-due-diligence"] } },
    { id: "defi-analyst", title: "DeFi analyst", description: "Wrote a protocol design and risk review.", when: { all: ["cap-defi-review"] } },
  ],
  landing: {
    hero: { eyebrow: "Intermediate · Four teaching contracts compiled · Educational only", title: "DeFi from first principles: build the pieces, understand the risks", subtitle: "Calculate swaps by hand, read an automated market maker line by line, put numbers on impermanent loss and liquidation, test a yield claim and learn the patterns that keep repeating in exploits. Every task is checked and explained.", level: "Intermediate", outcomeLine: "After this course you can explain, calculate and critically review core DeFi mechanisms. It does not give financial advice." },
    outcomes: [
      { icon: "docs", title: "Know the building blocks", text: "Exchanges, lending, stablecoins, oracles and vaults." },
      { icon: "sheet", title: "Do the maths", text: "Swaps, slippage, impermanent loss and health factors." },
      { icon: "safety", title: "Read real contracts", text: "A complete AMM, interest and health maths, a TWAP and a flash lender." },
      { icon: "cloud", title: "Judge oracles and stablecoins", text: "Manipulation, peg failures and reserve checks." },
      { icon: "sort", title: "Test every yield", text: "Where does the money really come from?" },
      { icon: "word", title: "Review and report", text: "Due-diligence and design and risk reviews." },
    ],
    projects: [
      { title: "A swap calculation", text: "Output and slippage by hand.", module: "automated-market-makers" },
      { title: "A yield analysis", text: "Where could 35% come from?", module: "oracles-stablecoins-and-yield" },
      { title: "A due-diligence summary", text: "Review of a teaching AMM.", module: "defi-risk-and-responsibility" },
      { title: "A design and risk review", text: "A simple component, its numbers, safeguards and limits.", module: "capstone" },
    ],
    tools: [{ icon: "docs", title: "Compiled teaching contracts", text: "Four contracts verified with solc against OpenZeppelin 5." }, { icon: "sheet", title: "Spreadsheet lab", text: "Reserves, swaps, impermanent loss and health factors." }, { icon: "word", title: "Document editor", text: "Yield analyses, reviews and risk papers." }],
    assessment: ["Finish the required labs in each module: they are checked automatically and explained when something is missing.", "Pass each module quiz (70% or more). Short tests inside the lessons give instant feedback.", "Complete the design and risk review and the final assessment."],
    faq: [
      { q: "Is this financial or investment advice?", a: "No. It is education. It does not recommend any product, and DeFi can lose all your money. Never use money you cannot afford to lose." },
      { q: "Can I deploy the contracts?", a: "Only on a test network, for learning. They are not audited and omit protections that real protocols need." },
      { q: "What should I know first?", a: "You should be comfortable with basic Solidity and tokens, for example from the earlier courses in this series." },
    ],
  },
  catalogue: {
    hours: "~14 hrs", weeks: "~5 weeks", pace: "3 hrs/wk", badge: "DeFi Fundamentals",
    brief: "DeFi building blocks, automated market makers, liquidity and impermanent loss, lending, oracles, stablecoins, yield and risk.",
    learn: ["DeFi building blocks, composability and stablecoin designs", "The constant-product AMM, swaps and slippage with a full contract", "Liquidity provision and impermanent loss with real numbers", "Lending, health factors, interest curves and liquidations", "Oracles, TWAPs, stablecoin failure modes and yield sources", "Exploit patterns, due diligence and responsible communication"],
    handsOn: "Write a design and risk review of a simple DeFi component for a test network, with numbers, safeguards and honest limits.",
    outcome: "Understand and build DeFi components responsibly. Educational only, not financial advice.",
  },
});
