import { capstone, ck, classifyLab, code, course, def, explorer, flow, list, miniQuiz, mistakes, module_, p, S, sheetLab, table, tip, topic, W, warn, wordLab } from "../kit.mjs";

const SK = "php-node-chain";

const rpcClient = `<?php
declare(strict_types=1);

// Needs PHP 8.1 or newer with the curl extension. Reads from the chain; holds no keys.
final class ChainRpc
{
    public function __construct(
        private string $url,
        private int $timeoutSeconds = 10
    ) {}

    /** @return mixed the "result" field of the JSON-RPC answer */
    public function call(string $method, array $params = [])
    {
        $payload = json_encode(
            ['jsonrpc' => '2.0', 'id' => 1, 'method' => $method, 'params' => $params],
            JSON_THROW_ON_ERROR
        );

        $ch = curl_init($this->url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $this->timeoutSeconds,
        ]);
        $body = curl_exec($ch);
        if ($body === false) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new RuntimeException('Could not reach the RPC server: ' . $error);
        }
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($status !== 200) {
            throw new RuntimeException('RPC server answered with HTTP ' . $status);
        }
        $data = json_decode($body, true, 512, JSON_THROW_ON_ERROR);
        if (isset($data['error'])) {
            throw new RuntimeException('RPC error: ' . ($data['error']['message'] ?? 'unknown'));
        }
        return $data['result'];
    }
}

// Usage
$rpc = new ChainRpc(getenv('RPC_URL'));
$blockHex = $rpc->call('eth_blockNumber');          // for example "0x10d4f"
echo 'Latest block: ' . hexdec($blockHex) . PHP_EOL;  // hexdec is safe here because block numbers are small`;

const hexMath = `<?php
declare(strict_types=1);

// Chain amounts are huge whole numbers written in hexadecimal. PHP integers and floats cannot hold them.
// Use GMP (or strings with bcmath) and never floating point.

function hexToDecimalString(string $hex): string
{
    $clean = strtolower(preg_replace('/^0x/i', '', $hex));
    if ($clean === '') {
        return '0';
    }
    return gmp_strval(gmp_init($clean, 16), 10);
}

// 1 ETH in wei is 10^18; a 6-decimals stablecoin uses 10^6.
function baseUnitsToDecimal(string $baseUnits, int $decimals): string
{
    return bcdiv($baseUnits, bcpow('10', (string) $decimals), $decimals);
}

function decimalToBaseUnits(string $amount, int $decimals): string
{
    // bcmul with scale 0 truncates anything beyond the allowed decimals; check the input first.
    if (!preg_match('/^\\d+(\\.\\d{1,' . $decimals . '})?$/', $amount)) {
        throw new InvalidArgumentException('Invalid amount');
    }
    return bcmul($amount, bcpow('10', (string) $decimals), 0);
}

echo hexToDecimalString('0xde0b6b3a7640000') . PHP_EOL;     // 1000000000000000000 (1 ETH in wei)
echo baseUnitsToDecimal('59870000', 6) . PHP_EOL;            // 59.870000
echo decimalToBaseUnits('59.87', 6) . PHP_EOL;               // 59870000`;

const keccakNote = `<?php
// PHP has hash('sha3-256', ...), which is the standardised SHA-3.
// Ethereum uses the ORIGINAL Keccak-256, which differs. They give different answers for the same input:
//
//   hash('sha3-256', '')  =  a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a
//   Ethereum keccak256('') =  c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470
//
// Never use hash('sha3-256') to compute Ethereum function selectors, addresses or signatures.
// Do those jobs in the Node.js service (ethers.keccak256), or use a reviewed Keccak library.`;

const nodeService = `// chain-service.mjs — a small Node.js service that does the blockchain work for the PHP application.
// Run with: node chain-service.mjs   (needs: npm install express ethers)
import express from "express";
import crypto from "node:crypto";
import { JsonRpcProvider, Contract, formatUnits, isAddress, getAddress } from "ethers";

const provider = new JsonRpcProvider(process.env.RPC_URL);
const API_KEY = process.env.SERVICE_API_KEY;
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

const app = express();
app.use(express.json({ limit: "10kb" }));

// Only the PHP application may call this service: compare keys in constant time.
function requireKey(req, res, next) {
  const supplied = Buffer.from(String(req.get("x-api-key") || ""));
  const expected = Buffer.from(String(API_KEY || ""));
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
    return res.status(401).json({ error: "unauthorised" });
  }
  next();
}
app.use(requireKey);

app.get("/balance/:token/:holder", async (req, res) => {
  const { token, holder } = req.params;
  if (!isAddress(token) || !isAddress(holder)) {
    return res.status(400).json({ error: "invalid address" });
  }
  try {
    const contract = new Contract(getAddress(token), ERC20_ABI, provider);
    const [raw, decimals, symbol] = await Promise.all([
      contract.balanceOf(getAddress(holder)),
      contract.decimals(),
      contract.symbol()
    ]);
    // Return the exact integer as a string, plus a readable version for people.
    res.json({ raw: raw.toString(), decimals: Number(decimals), symbol, display: formatUnits(raw, decimals) });
  } catch (err) {
    res.status(502).json({ error: "chain read failed" });
  }
});

app.get("/health", async (req, res) => {
  const head = await provider.getBlockNumber();
  res.json({ ok: true, head });
});

app.listen(Number(process.env.PORT || 4000), "127.0.0.1");   // listen on localhost only; put a proxy in front if needed`;

const receiver = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Customers pay for an order by calling pay(orderId, amount). The money goes straight to the shop's treasury,
// so this contract never holds funds. The Paid event tells the shop which order was paid, by whom and how much.
contract PaymentReceiver {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    address public immutable treasury;

    event Paid(bytes32 indexed orderId, address indexed payer, uint256 amount);

    error ZeroAmount();

    constructor(IERC20 paymentToken, address shopTreasury) {
        token = paymentToken;
        treasury = shopTreasury;
    }

    function pay(bytes32 orderId, uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        token.safeTransferFrom(msg.sender, treasury, amount);
        emit Paid(orderId, msg.sender, amount);
    }
}`;

const watcher = `// watcher.mjs — watches Paid events and tells the PHP application, safely.
import crypto from "node:crypto";
import { JsonRpcProvider, Contract } from "ethers";

const provider = new JsonRpcProvider(process.env.RPC_URL);
const ABI = ["event Paid(bytes32 indexed orderId, address indexed payer, uint256 amount)"];
const receiver = new Contract(process.env.RECEIVER, ABI, provider);

const CONFIRMATIONS = Number(process.env.CONFIRMATIONS || 12);
const WEBHOOK_URL = process.env.PHP_WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

async function sendWebhook(event) {
  const body = JSON.stringify(event);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = crypto.createHmac("sha256", WEBHOOK_SECRET).update(timestamp + "." + body).digest("hex");

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Timestamp": timestamp, "X-Signature": signature },
        body,
        signal: AbortSignal.timeout(10000)
      });
      if (response.ok) return true;
    } catch (err) {
      // fall through to retry
    }
    await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** attempt));  // 2s, 4s, 8s, 16s, 32s
  }
  return false;
}

export async function scan(fromBlock) {
  const head = (await provider.getBlockNumber()) - CONFIRMATIONS;   // only confirmed blocks
  if (fromBlock > head) return fromBlock;

  const events = await receiver.queryFilter(receiver.filters.Paid(), fromBlock, head);
  for (const e of events) {
    const ok = await sendWebhook({
      txHash: e.transactionHash,
      logIndex: e.index,
      orderId: e.args.orderId,
      payer: e.args.payer,
      amountBase: e.args.amount.toString(),   // a string, because the number can be too big for JSON numbers
      blockNumber: e.blockNumber
    });
    if (!ok) return fromBlock;                // stop here and try again next time; PHP ignores repeats
  }
  return head + 1;                            // the next block to scan
}`;

const webhookPhp = `<?php
declare(strict_types=1);

// webhook.php — the PHP side. Verify who sent it, reject old messages, then record it exactly once.
$secret = getenv('WEBHOOK_SECRET');
$raw = file_get_contents('php://input');
$timestamp = $_SERVER['HTTP_X_TIMESTAMP'] ?? '';
$signature = $_SERVER['HTTP_X_SIGNATURE'] ?? '';

if (!ctype_digit($timestamp) || abs(time() - (int) $timestamp) > 300) {
    http_response_code(400);
    exit('Stale or missing timestamp');
}
$expected = hash_hmac('sha256', $timestamp . '.' . $raw, $secret);
if (!hash_equals($expected, $signature)) {       // constant-time comparison
    http_response_code(401);
    exit('Bad signature');
}

$event = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
foreach (['txHash', 'logIndex', 'orderId', 'amountBase'] as $field) {
    if (!isset($event[$field])) {
        http_response_code(422);
        exit('Missing field ' . $field);
    }
}
if (!preg_match('/^0x[0-9a-f]{64}$/i', $event['txHash']) || !ctype_digit((string) $event['amountBase'])) {
    http_response_code(422);
    exit('Malformed event');
}

$pdo = new PDO(getenv('DB_DSN'), getenv('DB_USER'), getenv('DB_PASS'), [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
]);
$pdo->beginTransaction();

// The unique key (tx_hash, log_index) means a repeated message changes nothing.
$insert = $pdo->prepare(
    'INSERT IGNORE INTO chain_payments (tx_hash, log_index, order_ref, amount_base) VALUES (?, ?, ?, ?)'
);
$insert->execute([$event['txHash'], (int) $event['logIndex'], $event['orderId'], (string) $event['amountBase']]);

if ($insert->rowCount() === 1) {
    // First time we see this payment: mark the order as paid only if it was waiting and the amount is right.
    $update = $pdo->prepare(
        "UPDATE orders SET status = 'paid', paid_at = NOW()
         WHERE order_ref = ? AND status = 'awaiting_payment' AND CAST(? AS DECIMAL(65,0)) >= price_base"
    );
    $update->execute([$event['orderId'], (string) $event['amountBase']]);
}
$pdo->commit();
echo 'ok';`;

const schema = `-- Two tables: what the customer ordered, and what the chain told us.
CREATE TABLE orders (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_ref    CHAR(66)       NOT NULL UNIQUE,      -- 0x + 64 hex digits, the same value sent to the contract
  status       ENUM('awaiting_payment','paid','expired','needs_review') NOT NULL DEFAULT 'awaiting_payment',
  price_base   DECIMAL(65,0)  NOT NULL,             -- the price in token base units, never a float
  created_at   DATETIME       NOT NULL,
  expires_at   DATETIME       NOT NULL,
  paid_at      DATETIME       NULL
);

CREATE TABLE chain_payments (
  tx_hash      CHAR(66)       NOT NULL,
  log_index    INT UNSIGNED   NOT NULL,
  order_ref    CHAR(66)       NOT NULL,
  amount_base  DECIMAL(65,0)  NOT NULL,
  received_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (tx_hash, log_index)                  -- makes webhook repeats harmless
);`;

const orderRef = `<?php
declare(strict_types=1);

// Create an order and the reference the customer must use when paying.
function createOrder(PDO $pdo, string $priceBase): string
{
    $orderRef = '0x' . bin2hex(random_bytes(32));    // unguessable 32-byte reference, fits bytes32 in the contract
    $stmt = $pdo->prepare(
        "INSERT INTO orders (order_ref, price_base, created_at, expires_at)
         VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 30 MINUTE))"
    );
    $stmt->execute([$orderRef, $priceBase]);
    return $orderRef;
}`;

const labs = [
  classifyLab({
    id: "p1-who-does-what", module: "why-two-languages", title: "PHP, Node.js or contract?", level: "intermediate", minutes: 12, xp: 45, skills: [SK], required: true,
    objective: "Decide which part of the system should do each job.", scenario: "A shop built in PHP wants to accept stablecoin payments. Decide where each responsibility belongs.",
    steps: ["Read each responsibility.", "Choose where it belongs.", "Press Check my work."],
    categories: [["php", "PHP application"], ["node", "Node.js chain service"], ["contract", "Smart contract"], ["db", "Database"]],
    items: [["Showing the cart and the checkout page", "php", "The web application's job."], ["Computing Ethereum function selectors and event hashes", "node", "Needs Keccak-256 and ethers."], ["Moving the customer's tokens to the shop's treasury", "contract", "On-chain rules that move money."], ["Remembering which order is paid and when", "db", "Business records."], ["Listening for Paid events block after block", "node", "A long-running process."], ["Deciding whether the order is valid and can be shipped", "php", "Business logic."], ["Holding the private key that signs refunds", "node", "Keys stay out of the web application, in the most protected place."], ["Making sure a payment is recorded only once", "db", "A unique key does it."]],
  }),
  sheetLab({
    id: "p2-price-conversion", module: "why-two-languages", title: "Convert a price to token base units", level: "intermediate", minutes: 14, xp: 50, skills: [SK], required: false,
    objective: "Convert a rupee price into a stablecoin amount and the exact whole number the contract needs, and decide whether a payment is acceptable.",
    scenario: "An order costs 4,999 rupees. One stablecoin unit is 83.5 rupees and the token has 6 decimals. A customer paid 59,600,000 base units. Your shop accepts up to 0.5% under the price. (A teaching model.)",
    steps: ["In B7 work out the price in tokens, rounded to 2 decimals.", "In B8 work out the price in base units: B7 times 10 to the power of the decimals, rounded to a whole number.", "In B9 work out the lowest amount you will accept: B8 times (100 minus the tolerance) over 100, rounded.", "In B10 show Accept if the amount paid (B6) is at least B9, otherwise Underpaid.", "In B11 work out how much was overpaid, zero if nothing."],
    cells: { A1: "Input", B1: "Value", A2: "Order price (rupees)", B2: "4999", A3: "Rupees per token", B3: "83.5", A4: "Token decimals", B4: "6", A5: "Tolerance below the price (%)", B5: "0.5", A6: "Amount paid (base units)", B6: "59600000", A7: "Price in tokens", A8: "Price in base units", A9: "Lowest accepted", A10: "Verdict", A11: "Overpaid (base units)" }, view: { cols: 2, rows: 13 },
    checks: [
      ck("b7", "B7 is the price in tokens", "=ROUND(B2/B3,2)", "Divide and round to 2 places.", S.formula("B7", { fns: ["ROUND"], equals: 59.87 })),
      ck("b8", "B8 is the price in base units", "=ROUND(B7*POWER(10,B4),0)", "Multiply by 10 to the decimals and round.", S.formula("B8", { fns: ["ROUND", "POWER"], equals: 59870000 })),
      ck("b9", "B9 is the lowest accepted", "=ROUND(B8*(100-B5)/100,0)", "Apply the tolerance.", S.formula("B9", { fns: ["ROUND"], equals: 59570650 })),
      ck("b10", "B10 is the verdict", "=IF(B6>=B9,\"Accept\",\"Underpaid\")", "Compare the payment with the lowest accepted.", S.formula("B10", { fns: ["IF"], equals: "Accept" })),
      ck("b11", "B11 is the overpayment", "=MAX(0,B6-B8)", "Never negative.", S.formula("B11", { fns: ["MAX"], equals: 0 })),
    ],
    solution: { cells: { B7: "=ROUND(B2/B3,2)", B8: "=ROUND(B7*POWER(10,B4),0)", B9: "=ROUND(B8*(100-B5)/100,0)", B10: "=IF(B6>=B9,\"Accept\",\"Underpaid\")", B11: "=MAX(0,B6-B8)" } },
  }),
  classifyLab({
    id: "p3-rpc-methods", module: "php-and-json-rpc", title: "Read, write or wallet-only?", level: "intermediate", minutes: 10, xp: 40, skills: [SK], required: true,
    objective: "Classify JSON-RPC methods by what they need and what they change.", scenario: "PHP can call a node over HTTP. Some methods only read, some need a signed transaction and some belong to a wallet.",
    steps: ["Read each method.", "Choose its type.", "Press Check my work."],
    categories: [["read", "Read-only, free to call"], ["write", "Writes: needs a signed transaction"], ["wallet", "Wallet-only, not for a PHP server"]],
    items: [["eth_blockNumber", "read", "Returns the latest block number."], ["eth_getBalance", "read", "Returns an account's balance."], ["eth_call", "read", "Runs a view function with no changes."], ["eth_getLogs", "read", "Reads past events."], ["eth_sendRawTransaction", "write", "Submits an already signed transaction."], ["eth_requestAccounts", "wallet", "A browser wallet asks the user to share accounts."], ["personal_sign", "wallet", "Asks a wallet to sign; the user approves."], ["eth_estimateGas", "read", "Estimates the cost without sending."]],
  }),
  wordLab({
    id: "p4-api-contract", module: "php-and-json-rpc", title: "Write the contract between PHP and the Node service", level: "advanced", minutes: 18, xp: 60, skills: [SK], required: false,
    objective: "Specify the interface between two services clearly enough that two people can build each side separately.",
    scenario: "The PHP shop will call a Node.js chain service. Write the interface description.",
    steps: ["Add Heading 2 sections: Authentication, Endpoints, Errors, Rules for amounts.", "Under Endpoints list at least three endpoints in bullets, each with its purpose.", "Under Rules for amounts state that amounts are strings of base units, never floating point.", "Mention timeouts.", "Keep it between 120 and 270 words."],
    checks: [
      ck("heads", "Four sections", "Use Heading 2.", "A clear contract.", W.heading(4, 2)),
      ck("order", "In order", "Authentication, Endpoints, Errors, Rules for amounts.", "From access to data.", W.order(["Authentication", "Endpoints", "Errors", "Rules for amounts"])),
      ck("ends", "Three endpoints", "Use the bullet button.", "List the endpoints.", W.list(3, "ul")),
      ck("str", "Amounts as strings", "Say amounts are strings.", "Avoid precision loss.", W.pattern("string", "amounts as strings")),
      ck("float", "Says no floating point", "Mention floating point or floats.", "The classic bug.", W.pattern("floating|float", "floating point")),
      ck("time", "Mentions timeouts", "Mention timeout.", "Services fail slowly.", W.pattern("timeout", "timeouts")),
      ck("len", "Between 120 and 270 words", "Concise.", "One page.", W.words(120, 270)),
    ],
    solution: "<h2>Authentication</h2><p>Every request carries a secret API key in a header. The key is kept in an environment variable on both sides and compared in constant time. The service listens only on the local network.</p><h2>Endpoints</h2><ul><li>GET /balance/:token/:holder returns the token balance of a holder as exact base units plus a readable text.</li><li>GET /health returns whether the service is alive and the latest block it can see.</li><li>POST /orders/:ref/watch tells the service to watch for payments for an order reference.</li></ul><h2>Errors</h2><p>The service answers with a clear status code and a short error text. The PHP side treats any failure as temporary, shows the customer a calm message and retries later. Both sides use a timeout of ten seconds so a slow request cannot freeze checkout.</p><h2>Rules for amounts</h2><p>Amounts are always strings of whole base units, such as 59870000, never floating point numbers, because floats lose precision. Display text is for people only, and the database stores exact whole numbers.</p>",
  }),
  classifyLab({
    id: "p5-webhook-checks", module: "the-node-chain-service", title: "Which webhook check stops which attack?", level: "advanced", minutes: 12, xp: 45, skills: [SK], required: true,
    objective: "Match each defence on the PHP webhook to the attack it stops.", scenario: "Anyone on the internet can send a request to your webhook address. Each check in webhook.php exists for a reason.",
    steps: ["Read each attack.", "Choose the defence.", "Press Check my work."],
    categories: [["hmac", "HMAC signature check"], ["time", "Timestamp window"], ["unique", "Unique key on tx hash and log index"], ["validate", "Input validation"], ["compare", "hash_equals comparison"], ["status", "Update only if awaiting payment"]],
    items: [["A stranger posts a fake 'paid' event for an order", "hmac", "Only the holder of the secret can sign."], ["An attacker records a real message and resends it an hour later", "time", "Old messages are rejected."], ["The chain service retries and the same payment arrives twice", "unique", "A second insert changes nothing."], ["A message contains a txHash that is not a valid hash", "validate", "Malformed data is rejected."], ["An attacker guesses the signature one character at a time by measuring response time", "compare", "A constant-time comparison hides timing."], ["A payment for an already expired order arrives", "status", "Only orders still waiting are marked paid."], ["The amountBase field contains letters", "validate", "ctype_digit rejects it."], ["A real message is replayed immediately", "unique", "The unique key makes the repeat harmless."]],
  }),
  sheetLab({
    id: "p6-webhook-reliability", module: "the-node-chain-service", title: "How reliable is your webhook?", level: "advanced", minutes: 12, xp: 50, skills: [SK], required: false,
    objective: "Calculate how retries reduce the chance of losing a notification.",
    scenario: "Your PHP server is unreachable half the time during a bad hour. The Node service retries 4 times. (A teaching model.)",
    steps: ["In B7 work out the chance that all attempts fail: the failure chance (as a fraction) to the power of the attempts.", "In B8 work out the chance that at least one attempt succeeds.", "In B9 work out how many of the orders are expected to lose their notification.", "In B10 show Add more attempts if B7 is 0.01 or more, otherwise Reliable enough.", "In B11 show the success chance as a percentage."],
    cells: { A1: "Input", B1: "Value", A2: "Chance one attempt fails (%)", B2: "50", A3: "Attempts", B3: "4", A4: "Orders in the hour", B4: "10000", A7: "Chance all attempts fail", A8: "Chance of success", A9: "Orders expected to lose it", A10: "Verdict", A11: "Success chance (%)" }, view: { cols: 2, rows: 13 },
    checks: [
      ck("b7", "B7 is the all-fail chance", "=POWER(B2/100,B3)", "The fraction to the power of the attempts.", S.formula("B7", { fns: ["POWER"], equals: 0.0625 })),
      ck("b8", "B8 is the success chance", "=1-B7", "One minus failing every time.", S.formula("B8", { equals: 0.9375 })),
      ck("b9", "B9 is the expected loss", "=B7*B4", "Chance times orders.", S.formula("B9", { equals: 625 })),
      ck("b10", "B10 is the verdict", "=IF(B7<0.01,\"Reliable enough\",\"Add more attempts\")", "Below one percent is reliable.", S.formula("B10", { fns: ["IF"], equals: "Add more attempts" })),
      ck("b11", "B11 is the percentage", "=B8*100", "Times 100.", S.formula("B11", { equals: 93.75 })),
    ],
    solution: { cells: { B7: "=POWER(B2/100,B3)", B8: "=1-B7", B9: "=B7*B4", B10: "=IF(B7<0.01,\"Reliable enough\",\"Add more attempts\")", B11: "=B8*100" } },
  }),
  classifyLab({
    id: "p7-payment-outcomes", module: "payments-and-orders", title: "What should the shop do?", level: "advanced", minutes: 12, xp: 45, skills: [SK], required: true,
    objective: "Choose the right response to each unusual payment outcome.", scenario: "Real payments are messy. Decide what the shop should do in each case.",
    steps: ["Read each case.", "Choose the action.", "Press Check my work."],
    categories: [["accept", "Accept and fulfil"], ["review", "Hold for manual review"], ["refund", "Refund"], ["ignore", "Ignore (already handled)"]],
    items: [["The exact price arrives with enough confirmations", "accept", "The normal case."], ["The same payment event arrives a second time", "ignore", "Repeats must change nothing."], ["The customer paid a little more than the price", "accept", "Accept; any large excess may be refunded."], ["The customer paid much less than the price", "review", "Partial payments need a person."], ["A payment arrives after the order expired", "review", "The price or stock may have changed."], ["The wrong token was sent to the contract", "review", "The shop cannot accept it automatically."], ["The customer paid twice for one order", "refund", "Return the duplicate."], ["An order is cancelled by the shop after payment", "refund", "Return the money."]],
  }),
  wordLab({
    id: "p8-checkout-wording", module: "payments-and-orders", title: "Write the checkout page wording", level: "advanced", minutes: 16, xp: 55, skills: [SK], required: false,
    objective: "Tell customers exactly how to pay, how long it takes and what to do if something goes wrong.",
    scenario: "Your store accepts a stablecoin on a test network for a student project. Write the text on the payment page.",
    steps: ["Add Heading 2 sections: How to pay, How long it takes, If something goes wrong, Refunds.", "Under How to pay write a numbered list of at least four steps.", "Under How long it takes mention confirmations.", "Under If something goes wrong give at least two bullets.", "State that the network fee is paid by the customer.", "Keep it between 120 and 270 words."],
    checks: [
      ck("heads", "Four sections", "Use Heading 2.", "A clear page.", W.heading(4, 2)),
      ck("order", "In order", "How to pay, How long it takes, If something goes wrong, Refunds.", "From action to refund.", W.order(["How to pay", "How long it takes", "If something goes wrong", "Refunds"])),
      ck("steps", "Four steps", "Use the numbered list button.", "A simple sequence.", W.list(4, "ol")),
      ck("probs", "Two problems", "Use the bullet button.", "Common trouble.", W.list(2, "ul")),
      ck("conf", "Mentions confirmations", "Mention confirmations.", "Why payments are not instant.", W.pattern("confirmation", "confirmations")),
      ck("fee", "Mentions the network fee", "Say the customer pays the network fee.", "No surprises.", W.pattern("network fee|gas fee|fee", "the network fee")),
      ck("len", "Between 120 and 270 words", "Concise.", "Easy to read.", W.words(120, 270)),
    ],
    solution: "<h2>How to pay</h2><ol><li>Press Pay with stablecoin and connect your wallet.</li><li>Check that your wallet is on the network named on this page.</li><li>Approve the token and confirm the payment in your wallet.</li><li>Keep this page open until it says your order is paid.</li></ol><h2>How long it takes</h2><p>After you confirm, the network needs a few confirmations before we treat the payment as final. This usually takes a few minutes. We show the status, and we send an e-mail as soon as your order is paid.</p><h2>If something goes wrong</h2><ul><li>If you paid but the page still says waiting after thirty minutes, send us your transaction link and order number.</li><li>If you paid the wrong amount or the wrong token, do not pay again; contact us and we will review it.</li></ul><h2>Refunds</h2><p>You pay the network fee, and the shop cannot return it. Refunds of the price are sent to the same wallet that paid, and we never ask for your recovery phrase.</p>",
  }),
  classifyLab({
    id: "p9-money-handling", module: "security-and-money-handling", title: "Safe or unsafe money handling?", level: "advanced", minutes: 12, xp: 45, skills: [SK], required: true,
    objective: "Judge how PHP code handles amounts, secrets and trust.", scenario: "Most payment bugs are ordinary programming mistakes. Judge each practice.",
    steps: ["Read each practice.", "Choose the verdict.", "Press Check my work."],
    categories: [["safe", "Safe"], ["unsafe", "Unsafe"], ["care", "Needs care"]],
    items: [["Storing prices as DECIMAL(65,0) base units", "safe", "Exact whole numbers."], ["Storing a token amount in a PHP float", "unsafe", "Floats lose precision."], ["Using bcmath or GMP for chain amounts", "safe", "Arbitrary precision."], ["Keeping the shop's private key in a PHP file on the web server", "unsafe", "A web bug could expose it."], ["Trusting the browser's claim that a payment was made", "unsafe", "Only the chain and your service are trustworthy."], ["Waiting for confirmations before fulfilling an order", "safe", "Protects against reorganisations."], ["Using one confirmation for a very expensive order", "care", "Higher value needs more confirmations."], ["Logging full webhook bodies including secrets", "unsafe", "Logs leak."]],
  }),
  sheetLab({
    id: "p10-confirmations", module: "security-and-money-handling", title: "How many confirmations, and how long?", level: "advanced", minutes: 12, xp: 50, skills: [SK], required: false,
    objective: "Balance waiting time against reorganisation risk by order value.",
    scenario: "Blocks arrive every 12 seconds. Small orders wait 2 confirmations and large orders wait 12. An order is large above 10,000 rupees. (A teaching model.)",
    steps: ["In B7 work out the wait for small orders in seconds.", "In B8 work out the wait for large orders in seconds.", "In B9 work out the large-order wait in minutes.", "In B10 work out how many extra seconds large orders wait.", "In B11 show Use 12 confirmations if the order value (B5) is above the threshold (B6), otherwise Use 2 confirmations."],
    cells: { A1: "Input", B1: "Value", A2: "Seconds per block", B2: "12", A3: "Confirmations for small orders", B3: "2", A4: "Confirmations for large orders", B4: "12", A5: "This order (rupees)", B5: "20000", A6: "Large-order threshold (rupees)", B6: "10000", A7: "Small-order wait (seconds)", A8: "Large-order wait (seconds)", A9: "Large-order wait (minutes)", A10: "Extra wait (seconds)", A11: "Policy for this order" }, view: { cols: 2, rows: 13 },
    checks: [
      ck("b7", "B7 is the small wait", "=B2*B3", "Seconds per block times confirmations.", S.formula("B7", { equals: 24 })),
      ck("b8", "B8 is the large wait", "=B2*B4", "Same idea.", S.formula("B8", { equals: 144 })),
      ck("b9", "B9 is the wait in minutes", "=B8/60", "Seconds over 60.", S.formula("B9", { equals: 144 / 60 })),
      ck("b10", "B10 is the extra wait", "=B8-B7", "Difference.", S.formula("B10", { equals: 120 })),
      ck("b11", "B11 is the policy", "=IF(B5>B6,\"Use 12 confirmations\",\"Use 2 confirmations\")", "Compare value with the threshold.", S.formula("B11", { fns: ["IF"], equals: "Use 12 confirmations" })),
    ],
    solution: { cells: { B7: "=B2*B3", B8: "=B2*B4", B9: "=B8/60", B10: "=B8-B7", B11: "=IF(B5>B6,\"Use 12 confirmations\",\"Use 2 confirmations\")" } },
  }),
  classifyLab({
    id: "p11-hosting", module: "running-it-for-real", title: "Does it fit this hosting?", level: "advanced", minutes: 12, xp: 45, skills: [SK], required: true,
    objective: "Match each component to hosting that can really run it.", scenario: "Cheap shared hosting is great for PHP but cannot run long-lived processes. Decide what fits where.",
    steps: ["Read each component.", "Choose where it can run.", "Press Check my work."],
    categories: [["shared", "Shared PHP hosting"], ["vps", "A small server (VPS) you control"], ["managed", "A managed service"], ["none", "Should not run on a public server at all"]],
    items: [["The PHP shop pages and the webhook receiver", "shared", "Short requests fit shared hosting."], ["A Node.js process that watches the chain 24 hours a day", "vps", "Needs a long-running process."], ["A hosted RPC provider with an API key", "managed", "Run by a provider."], ["The database holding orders", "shared", "Usually available with the hosting plan."], ["A hardware wallet used to deploy contracts", "none", "Keep deployment keys offline."], ["A cron job that calls a PHP script every minute to poll the chain", "shared", "Possible for light use, but fragile."], ["Monitoring that alerts when the watcher falls behind", "managed", "Use an external monitor."], ["A private key that signs refunds, stored in plain text in the web root", "none", "Never expose keys."]],
  }),
  wordLab({
    id: "p12-runbook", module: "running-it-for-real", title: "Write an operations runbook", level: "advanced", minutes: 18, xp: 60, skills: [SK], required: false,
    objective: "Prepare the instructions for the person on call when a payment problem happens.",
    scenario: "At 2 a.m. a customer reports that they paid but the order is not marked paid. Write the runbook for the person who handles it.",
    steps: ["Add Heading 2 sections: Check the chain, Check the service, Check the shop, Fix and tell the customer.", "Under each, write at least two bullet points.", "Mention the transaction hash, the watcher falling behind and the unique key that prevents duplicates.", "Keep it between 130 and 280 words."],
    checks: [
      ck("heads", "Four sections", "Use Heading 2.", "A usable runbook.", W.heading(4, 2)),
      ck("order", "In order", "Check the chain, Check the service, Check the shop, Fix and tell the customer.", "From facts to fix.", W.order(["Check the chain", "Check the service", "Check the shop", "Fix and tell the customer"])),
      ck("bul", "Bullet points", "Use the bullet button.", "Short steps.", W.list(2, "ul")),
      ck("hash", "Mentions the transaction hash", "Mention the transaction hash.", "The starting point.", W.pattern("transaction hash|tx hash", "the transaction hash")),
      ck("behind", "Mentions the watcher falling behind", "Mention the watcher, lag or behind.", "A common cause.", W.pattern("watcher|behind|lag", "the watcher falling behind")),
      ck("unique", "Mentions the unique key or repeats", "Mention duplicates, repeats or the unique key.", "Safe to replay.", W.pattern("unique|duplicate|repeat|replay|twice", "duplicate protection")),
      ck("len", "Between 130 and 280 words", "Concise.", "Readable at 2 a.m.", W.words(130, 280)),
    ],
    solution: "<h2>Check the chain</h2><ul><li>Ask the customer for the transaction hash and open it in a block explorer to see whether it succeeded and which contract and order reference it used.</li><li>Check how many confirmations it has and that the network matches the shop's configuration.</li></ul><h2>Check the service</h2><ul><li>Look at the health page to see whether the watcher is running and how far behind the latest block it is.</li><li>Read the service log for failed webhook attempts for this order reference.</li></ul><h2>Check the shop</h2><ul><li>Find the order and its status. If the payment is already in the payments table, the unique key shows it was recorded and the status rule explains why the order did not change, for example because it had expired.</li><li>If it is missing, replay the block range from the watcher; repeats are safe because duplicates are ignored.</li></ul><h2>Fix and tell the customer</h2><ul><li>Mark the order paid through the normal path, never by editing the database by hand without a note.</li><li>Tell the customer what happened in plain words, thank them for waiting, and record the cause so it can be prevented.</li></ul>",
  }),
  wordLab({
    id: "cap-checkout", module: "capstone", title: "Final project: design a crypto checkout for a PHP shop", level: "challenge", minutes: 40, xp: 170, skills: [SK], required: true,
    objective: "Produce a professional design for accepting stablecoin payments in a PHP shop using a Node.js chain service.",
    scenario: "A small online shop built in PHP wants to accept a stablecoin on a test network first. Design the whole flow, the safety rules and the operations.",
    steps: ["Add a Heading 1 'Crypto checkout: design document'.", "Add Heading 2 sections: Architecture, Order and payment flow, Data model, Security rules, Failure cases, Operations, Limits.", "Under Architecture list at least four components in bullets.", "Under Order and payment flow write a numbered list of at least six steps.", "Under Data model mention base units and a unique key.", "Under Security rules mention HMAC, confirmations and that no private key is stored in PHP.", "Under Limits state that this is a test-network design and legal and tax advice are needed before real use.", "Keep it between 330 and 660 words."],
    checks: [
      ck("t", "A title", "Use Heading 1.", "Name the design.", W.heading(1, 1)),
      ck("secs", "Seven sections", "Use Heading 2.", "A complete design.", W.heading(7, 2)),
      ck("order", "In order", "Architecture, Order and payment flow, Data model, Security rules, Failure cases, Operations, Limits.", "A logical flow.", W.order(["Architecture", "Order and payment flow", "Data model", "Security rules", "Failure cases", "Operations", "Limits"])),
      ck("comp", "Four components", "Use the bullet button.", "Name the parts.", W.list(4, "ul")),
      ck("steps", "Six steps", "Use the numbered list button.", "The full flow.", W.list(6, "ol")),
      ck("base", "Mentions base units", "Mention base units.", "No floats.", W.pattern("base unit", "base units")),
      ck("uniq", "Mentions a unique key", "Mention a unique key.", "Idempotence.", W.pattern("unique", "a unique key")),
      ck("hmac", "Mentions HMAC and confirmations", "Mention HMAC and confirmations.", "Security rules.", W.pattern("HMAC[\\s\\S]*confirmation|confirmation[\\s\\S]*HMAC", "HMAC and confirmations")),
      ck("key", "Says no private key in PHP", "Say no private key is stored in PHP.", "Key custody.", W.pattern("no private key|never (store|keep)[\\s\\S]*private key|private key[\\s\\S]*(not|never)", "that no private key is stored in PHP")),
      ck("legal", "Mentions legal or tax advice", "Mention legal or tax advice.", "Honest limits.", W.pattern("legal|tax", "legal or tax advice")),
      ck("len", "Between 330 and 660 words", "Two pages at most.", "Readable.", W.words(330, 660)),
    ],
    solution: "<h1>Crypto checkout: design document</h1><h2>Architecture</h2><ul><li>The PHP shop with its own database for orders.</li><li>A PaymentReceiver smart contract that moves tokens straight to the shop's treasury and emits a Paid event.</li><li>A Node.js chain service that watches events, waits for confirmations and calls the shop's webhook.</li><li>A hosted RPC provider that the Node.js service uses to read the chain.</li></ul><h2>Order and payment flow</h2><ol><li>The customer checks out and the shop creates an order with a random reference and a price in token base units.</li><li>The page shows the amount, the network and a Pay button.</li><li>The customer's wallet approves the token and calls pay with the order reference and amount.</li><li>The contract moves the tokens to the treasury and emits Paid.</li><li>The Node.js service waits for twelve confirmations and sends a signed webhook to the shop.</li><li>The shop verifies the webhook, records the payment and marks the order paid, then sends the confirmation e-mail.</li></ol><h2>Data model</h2><p>Prices and payments are stored as whole base units in DECIMAL columns, never as floats. The payments table has a unique key on transaction hash and log index so a repeated webhook changes nothing. Orders have statuses and an expiry time.</p><h2>Security rules</h2><p>Webhooks carry an HMAC signature and a timestamp, and the shop rejects old or unsigned messages. Orders are fulfilled only after the required confirmations. No private key is stored in PHP, and the treasury is a multi-signature wallet outside the web server. Secrets live in environment variables.</p><h2>Failure cases</h2><p>Underpayments, late payments, wrong tokens and duplicate payments go to manual review or refund. If the webhook fails, the service retries with growing delays, and the shop can replay a block range safely.</p><h2>Operations</h2><p>A monitor alerts us when the watcher falls behind the chain or the webhook error rate rises. A runbook explains how to check a transaction, the service and the order.</p><h2>Limits</h2><p>This is a test-network design for a student project. Before real money is involved the shop needs legal and tax advice, a security review and a refund policy.</p>",
  }),
];

const M1 = module_({
  slug: "why-two-languages", title: "Why PHP and Node.js together", hours: 2, level: "Foundations",
  summary: "What PHP does well, what the chain needs, and how a small Node.js service bridges them.",
  outcome: "You can explain the architecture, decide where each job belongs and describe the trust boundaries.",
  intro: "Millions of websites run on PHP, and many owners want to add blockchain features without rewriting everything. The practical answer is a clean split: PHP keeps doing what it does well, and a small Node.js service handles the blockchain. This module explains the design and the reasons behind it.",
  topics: [
    topic({
      title: "A split that works", slug: "the-split",
      blocks: [
        p("PHP is built to answer short web requests: a page is requested, PHP runs, the page is sent and the process ends. Blockchain work often needs the opposite: a process that stays alive, listens to new blocks as they arrive, signs messages and talks to many libraries written in JavaScript. Trying to force one language to do both is where many projects get stuck."),
        flow("The architecture", ["Customer's browser", "PHP application (pages, orders, database)", "Node.js chain service (reads the chain, watches events)", "RPC provider or your own node", "The blockchain and the smart contract"]),
        table("Who does what", ["Job", "PHP", "Node.js service", "Contract"], [["Pages, accounts, carts, e-mail", "Yes", "No", "No"], ["Remember orders and statuses", "Yes (database)", "No", "No"], ["Watch for new blocks and events", "Poor fit", "Yes", "No"], ["Compute Ethereum hashes and decode logs", "Needs extra libraries", "Yes (ethers)", "No"], ["Move tokens and enforce payment rules", "No", "No", "Yes"], ["Hold keys that control large value", "Never", "Avoid; use a protected signer", "Not applicable"]]),
        miniQuiz("split-mini", [["Why add a Node.js service rather than do everything in PHP?", ["PHP is banned", "Chain work needs long-running processes and mature libraries", "Node.js is always faster", "PHP cannot connect to the internet"], 1, "Use each tool for what it does best."]]),
        tip("The goal is not to be fashionable. It is to keep the money-moving logic small, the web application simple and the secrets few."),
      ],
      points: ["PHP serves requests; a Node.js service handles long-running chain work.", "Keep money rules in the contract and secrets out of the web application."],
      check: [["Watching blocks continuously is best done by:", ["A long-running Node.js process", "A single PHP page view", "The browser alone", "The database"], 0, "It needs a process that stays alive."]],
    }),
    topic({
      title: "Trust boundaries", slug: "trust-boundaries",
      blocks: [
        table("Who can you trust?", ["Party", "Trust level", "Reason"], [["The customer's browser", "None", "Anyone can modify what a page sends"], ["The customer's wallet", "Limited", "It proves who signed, not that the payment is right for your order"], ["The smart contract on-chain", "High, once audited", "Public rules that nobody can bend"], ["Your Node.js service", "High", "Under your control, but it must be protected"], ["Your PHP application", "High", "Under your control"], ["The RPC provider", "Moderate", "It could be wrong or down; important facts can be cross-checked"]]),
        p("A good design makes every important decision on the side that cannot be tricked. The browser may say 'I paid', but only the chain, observed by your service with enough confirmations, can confirm it. A webhook may say 'order 17 is paid', but only if it carries a valid signature from your own service."),
        list("Rules that follow", ["Never fulfil an order because the browser says the payment succeeded.", "Never accept a webhook without verifying its signature.", "Never put API keys or private keys in code the browser can read.", "Treat all input from the internet as hostile and validate it.", "Decide what happens when any link in the chain is slow or down."]),
        miniQuiz("trust-mini", [["Who should confirm that a payment happened?", ["The customer's browser", "The chain, observed by your service after confirmations", "The wallet app", "A screenshot"], 1, "Only the chain is authoritative."]]),
      ],
      points: ["Make each decision where it cannot be faked.", "The browser is never trusted; the chain is the authority."],
      check: [["A webhook is trusted when it:", ["Has a valid signature from your service", "Says 'paid'", "Comes from any address", "Is long"], 0, "Authenticity first."]],
    }),
    topic({
      title: "Planning the project", slug: "planning",
      blocks: [
        table("Choices to make early", ["Question", "A sensible default for a first project"], [["Which network?", "A public test network, then a low-cost mainnet-compatible chain only after review"], ["Which token?", "A well-known stablecoin on the chosen network, to avoid price swings"], ["Who holds the money?", "A treasury wallet outside the web server, ideally multi-signature"], ["Who runs the node?", "A hosted RPC provider with an API key kept on the server"], ["Who pays the network fee?", "The customer, who sends the payment"], ["What about refunds?", "Decided and written before launch"], ["What about law and tax?", "Take advice for your country first"]]),
        explorer({ id: "php-plan", title: "Order volume and chain requests", intro: "Change the daily orders to see how a watcher that reads once per block compares with page-triggered polling. A teaching model.", inputs: [{ id: "orders", label: "Orders per day", min: 1, max: 5000, step: 10, value: 200 }, { id: "polls", label: "Status polls per order", min: 1, max: 120, step: 1, value: 30 }], outputs: [{ label: "Chain requests if each page polls the chain", expr: "orders * polls", unit: "n" }, { label: "Chain requests if one service reads each block", expr: "7200", unit: "n" }] }),
        mistakes(["Starting on the main network with real money.", "Letting the page ask the chain directly on every refresh.", "Leaving refunds and legal questions until after launch."]),
        miniQuiz("plan-mini", [["Why start with a test network?", ["It is mandatory", "You can make mistakes without losing real money", "It is faster to read", "Customers prefer it"], 1, "Practice is free."]]),
      ],
      points: ["Choose network, token, treasury, provider and refund policy first.", "Start on a test network."],
      check: [["A stablecoin is chosen to:", ["Avoid price swings", "Avoid fees", "Avoid wallets", "Avoid confirmations"], 0, "Prices stay stable."]],
    }),
  ],
  terms: [["Microservice", "A small separate program with one job"], ["RPC", "Remote procedure call: the interface to a node"], ["Webhook", "A message one service sends another over HTTP"], ["Trust boundary", "A line across which data must be checked"], ["Treasury", "The wallet that receives the money"], ["Stablecoin", "A token designed to hold a steady value"]],
  practical: { title: "Practical: draw the architecture", intro: "On paper.", steps: ["Draw the five boxes of the architecture.", "Mark the trust boundaries.", "Write which secret lives where.", "List what happens if the Node.js service is down."] },
  quiz: [
    ["PHP is built for:", ["Short web requests", "Long-running watchers", "Mining", "Signing keys"], 0, "A request, a response, done."],
    ["A Node.js service is good for:", ["Long-running chain work", "Rendering HTML only", "Printing", "Nothing"], 0, "Listeners and ethers."],
    ["Smart contracts enforce:", ["Rules that move money", "Page layouts", "E-mails", "Cookies"], 0, "These rules live on the blockchain."],
    ["The browser should be:", ["Never trusted", "Fully trusted", "The authority", "The database"], 0, "Anyone can edit it."],
    ["A webhook needs:", ["A signature check", "Nothing", "A long URL", "A password in the URL"], 0, "Authentic messages only."],
    ["A treasury should be:", ["Outside the web server", "In the PHP file", "In the browser", "Public"], 0, "Protect the money."],
    ["First launch on:", ["A test network", "The main network", "Nowhere", "A phone"], 0, "No real loss."],
  ],
});

const M2 = module_({
  slug: "php-and-json-rpc", title: "PHP and JSON-RPC", hours: 2.5, level: "Core skills",
  summary: "Talking to a node from PHP, handling hexadecimal and huge numbers correctly, and knowing what PHP should not do.",
  outcome: "You can write a small PHP client for read-only chain calls and convert amounts exactly.",
  intro: "PHP can read the chain directly with plain HTTP and JSON. That is enough for simple needs such as showing a balance. This module builds a careful client and explains the traps: hexadecimal numbers, amounts too big for PHP integers and the difference between two similar hash functions.",
  topics: [
    topic({
      title: "A JSON-RPC client in PHP", slug: "rpc-client",
      blocks: [
        code("php", rpcClient, "ChainRpc.php"),
        table("What the class does", ["Part", "Why"], [["JSON body with method and params", "JSON-RPC is simply JSON sent over HTTP"], ["curl with a timeout", "A slow server must not hang your page"], ["Check for connection failure and HTTP status", "Handle problems in the open"], ["JSON_THROW_ON_ERROR", "Bad JSON becomes an exception, not a silent null"], ["The error field", "Nodes report problems inside a normal-looking answer"], ["No private keys anywhere", "This client can only read"]]),
        warn("The RPC URL usually contains an API key. Keep it in an environment variable on the server and never print it in a page or log."),
        miniQuiz("rpc-mini", [["Why set a timeout on the request?", ["Nodes need it", "A slow node should not freeze your page", "It speeds up the node", "It is required by JSON"], 1, "A slow request should fail quickly."]]),
      ],
      points: ["JSON-RPC is JSON over HTTP; a short class is enough for reads.", "Set timeouts, check errors and keep the URL secret."],
      check: [["JSON-RPC answers carry problems in:", ["An error field", "The page colour", "The URL", "The cookie"], 0, "Check it every time."]],
    }),
    topic({
      title: "Hex, big numbers and exact money", slug: "hex-bcmath",
      blocks: [
        code("php", hexMath, "amounts.php"),
        table("Why PHP integers and floats are not enough", ["Type", "Limit", "Problem for chain amounts"], [["int", "About 9.2 quintillion on 64-bit systems", "1 ETH is 10^18 wei; 10 ETH is already over the limit"], ["float", "About 15 to 16 significant digits", "Rounds large amounts and cannot store exact fractions"], ["string with bcmath", "Arbitrary length, exact", "Correct for money"], ["GMP", "Arbitrary length integers", "Correct for hex conversions"]]),
        list("Rules", ["Keep chain amounts as strings of whole base units.", "Convert with GMP or bcmath only.", "Format for display at the very end.", "Reject user input that has more decimals than the token allows.", "Store in DECIMAL(65,0) columns, never FLOAT or DOUBLE."], true),
        miniQuiz("hex-mini", [["Why is 1 ETH in wei a problem for a float?", ["It is too small", "It needs more exact digits than a float can hold reliably", "Floats cannot hold zero", "It is negative"], 1, "Exactness matters with money."]]),
      ],
      points: ["Chain amounts are exact whole numbers: use GMP or bcmath.", "Never use float for money."],
      check: [["A safe database type for base units is:", ["DECIMAL(65,0)", "FLOAT", "DOUBLE", "TEXT of words"], 0, "Exact whole numbers never round."]],
    }),
    topic({
      title: "What PHP should leave to others", slug: "leave-to-node",
      blocks: [
        code("php", keccakNote, "keccak-note.php"),
        table("Jobs best left to the Node.js service", ["Job", "Reason"], [["Keccak-256 hashing (selectors, event topics, addresses)", "PHP's built-in sha3 is a different function"], ["Decoding event logs and call results", "ethers does it correctly from an ABI"], ["Signing transactions or messages", "Keys should not live in the web application"], ["Watching blocks in a loop", "Needs a long-running process"], ["Retries, batching and back-off", "Mature libraries and patterns exist"]]),
        p("PHP can still do useful reading: the latest block, a balance, a simple call. But once you need event decoding or signatures, it is safer and quicker to ask a Node.js service, which uses well-tested libraries, than to translate everything yourself."),
        miniQuiz("leave-mini", [["Why not use PHP's sha3-256 for Ethereum selectors?", ["It is slow", "Ethereum uses the original Keccak, which gives different results", "It is deprecated", "It needs a key"], 1, "Same name family, different function."]]),
      ],
      points: ["PHP's sha3-256 is not Ethereum's Keccak-256.", "Leave hashing, decoding and signing to the Node.js service."],
      check: [["Event decoding is best done by:", ["ethers in Node.js", "A CSS file", "A cookie", "A guess"], 0, "Tested libraries."]],
    }),
  ],
  terms: [["JSON-RPC", "A protocol of JSON requests over HTTP"], ["Hexadecimal", "Base 16 numbers shown with 0x"], ["GMP", "A PHP extension for big integers"], ["bcmath", "A PHP extension for exact decimal arithmetic"], ["Keccak-256", "The hash function Ethereum uses"], ["Timeout", "A limit on how long to wait"]],
  practical: { title: "Practical: read a balance from PHP", intro: "Locally with PHP 8.1 or newer.", steps: ["Save ChainRpc.php and set RPC_URL.", "Call eth_blockNumber and print it.", "Call eth_getBalance for a test address and convert it with the amount helpers.", "Break the URL and see the error handling work."] },
  quiz: [
    ["JSON-RPC runs over:", ["HTTP with JSON", "E-mail", "FTP", "Printers"], 0, "Simple requests."],
    ["Chain amounts in PHP should be:", ["Strings of whole numbers", "Floats", "Booleans", "Arrays of words"], 0, "Exact whole numbers never round."],
    ["GMP and bcmath handle:", ["Big numbers exactly", "Colours", "Cookies", "Sessions"], 0, "Use them for money."],
    ["A float for money is:", ["A bug waiting to happen", "Best practice", "Required", "Faster and safer"], 0, "Floats round large and fractional amounts."],
    ["hash('sha3-256') equals Ethereum keccak256:", ["No", "Yes", "Only for strings", "Only on Mondays"], 0, "Different functions."],
    ["Private keys in a PHP page:", ["Must never be there", "Are recommended", "Are required", "Are faster"], 0, "A web bug exposes them."],
    ["Request timeouts:", ["Prevent hung pages", "Slow nodes", "Hide errors", "Lower fees"], 0, "A slow request should fail quickly."],
  ],
});

const M3 = module_({
  slug: "the-node-chain-service", title: "The Node.js chain service", hours: 2.5, level: "Core skills",
  summary: "A small authenticated service that reads the chain, a watcher that sends signed webhooks, and the checks that make them safe.",
  outcome: "You can build a protected Node.js service and a webhook sender, and explain each security check on the PHP receiver.",
  intro: "The Node.js service is the bridge. It speaks to the chain with ethers, offers a small authenticated API to your PHP application, and notifies PHP when payments arrive. The details of authentication and retries decide whether it is safe in practice.",
  topics: [
    topic({
      title: "A small authenticated API", slug: "api",
      blocks: [
        code("javascript", nodeService, "chain-service.mjs"),
        table("Design choices", ["Choice", "Reason"], [["Listens only on 127.0.0.1", "Not exposed to the internet; use a protected proxy if the PHP app is on another machine"], ["API key compared with timingSafeEqual", "Constant-time comparison avoids leaking the key through timing"], ["isAddress and getAddress", "Validate input and normalise addresses"], ["Balances returned as strings", "No precision loss in JSON"], ["Errors return a generic message", "Do not leak internals"], ["Body size limit", "Stops oversized requests"]]),
        miniQuiz("api-mini", [["Why return balances as strings?", ["Strings are shorter", "JSON numbers cannot hold big integers exactly", "PHP requires it", "It is faster"], 1, "Exactness matters when handling money."]]),
      ],
      points: ["Authenticate every request and validate every input.", "Return amounts as exact strings."],
      check: [["Listening on 127.0.0.1 means:", ["Only this machine can connect", "Everyone can connect", "No one can connect", "Only browsers"], 0, "Not public."]],
    }),
    topic({
      title: "The payment contract and the watcher", slug: "contract-watcher",
      blocks: [
        code("solidity", receiver, "PaymentReceiver.sol"),
        p("The contract is intentionally tiny. It does one thing: pull the approved tokens from the customer to the treasury and announce it with an event that carries the order reference. It never holds money, so there is little to steal and little to audit."),
        code("javascript", watcher, "watcher.mjs"),
        flow("From payment to webhook", ["Customer calls pay(orderId, amount)", "Contract moves tokens to the treasury and emits Paid", "Watcher reads events up to head minus confirmations", "It signs a message with a timestamp and HMAC", "It posts the webhook to PHP, retrying with growing delays", "It moves on only when PHP says ok"]),
        miniQuiz("watch-mini", [["Why does the watcher scan only up to head minus confirmations?", ["To save requests", "So events from blocks that could be replaced are not reported", "To hide events", "Because PHP is slow"], 1, "Reorganisation safety."]]),
      ],
      points: ["A tiny contract emits Paid; the watcher reports confirmed events.", "Retry webhooks with growing delays and move on only after success."],
      check: [["The contract never holds funds because:", ["Tokens go straight to the treasury", "It is empty", "It is broken", "Gas is zero"], 0, "Less to steal."]],
    }),
    topic({
      title: "Receiving the webhook in PHP", slug: "webhook-php",
      blocks: [
        code("php", webhookPhp, "webhook.php"),
        table("Each check and the attack it stops", ["Check", "Attack stopped"], [["HMAC of timestamp and body", "A stranger forging a message"], ["Timestamp within five minutes", "Replaying a recorded old message"], ["hash_equals", "Guessing the signature by timing"], ["Field and format validation", "Malformed or malicious data"], ["INSERT IGNORE with a unique key", "Duplicates from retries"], ["UPDATE only when awaiting payment and amount is enough", "Marking expired or underpaid orders as paid"], ["Database transaction", "Half-saved state after a crash"]]),
        warn("Webhook secrets must be long random strings kept in environment variables on both sides. Rotate them if you suspect a leak."),
        miniQuiz("webhook-mini", [["Why use hash_equals rather than === to compare signatures?", ["It is shorter", "It takes the same time whatever the input, so it leaks nothing about the signature", "PHP requires it", "It is faster"], 1, "Timing attacks are real."]]),
      ],
      points: ["Verify signature and time, validate fields, and record each event once.", "Update orders only from the expected state."],
      check: [["A repeated webhook should:", ["Change nothing", "Charge again", "Fail", "Delete the order"], 0, "Idempotent."]],
    }),
  ],
  terms: [["HMAC", "A keyed hash that proves a message came from a secret holder"], ["Idempotent", "Safe to repeat"], ["Constant-time comparison", "A comparison whose speed does not reveal data"], ["Webhook", "An HTTP message sent from one service to another"], ["Replay", "Resending a captured message"], ["Confirmation depth", "How many blocks must follow"]],
  practical: { title: "Practical: run the pieces locally", intro: "With a local chain.", steps: ["Deploy a test token and PaymentReceiver.", "Run the Node.js service and call /health.", "Run the watcher against the local webhook.php.", "Replay the same webhook and check nothing changes."] },
  quiz: [
    ["The service API key is compared:", ["In constant time", "With plain ==", "Never", "In the URL"], 0, "Avoid timing leaks."],
    ["Addresses should be:", ["Validated", "Ignored", "Guessed", "Shortened"], 0, "isAddress rejects malformed input."],
    ["The watcher waits for:", ["Confirmations", "Nothing", "A holiday", "A password"], 0, "Reorg safety."],
    ["An HMAC proves:", ["The message came from a secret holder", "The price", "The weather", "The order"], 0, "Authenticity."],
    ["The unique key is:", ["Transaction hash and log index", "The date", "The price", "The payer name"], 0, "Each event has its own hash and index."],
    ["Retries should use:", ["Growing delays", "No delay", "Random orders", "The same second"], 0, "Wait longer after each failed attempt."],
    ["The webhook secret belongs in:", ["Environment variables", "The URL", "The page", "A comment"], 0, "Keep it private."],
  ],
});

const M4 = module_({
  slug: "payments-and-orders", title: "Payments and orders", hours: 2.5, level: "Applied skills",
  summary: "Order references, a data model that cannot double-count, and what to do with underpayments, late payments and duplicates.",
  outcome: "You can design the order lifecycle, write the tables and decide how to treat every unusual payment.",
  intro: "The happy path is easy: the exact amount arrives and the order is shipped. The craft is in everything else. This module designs the data and the rules so that odd cases are handled calmly and the books always balance.",
  topics: [
    topic({
      title: "Order references and the data model", slug: "data-model",
      blocks: [
        code("sql", schema, "schema.sql"),
        code("php", orderRef, "createOrder.php"),
        table("Why it is designed this way", ["Decision", "Reason"], [["order_ref is a random 32-byte value", "Cannot be guessed, and it fits the contract's bytes32 field"], ["price_base is DECIMAL(65,0)", "Exact whole base units; wide enough for any token amount"], ["Status is an enum with an expiry time", "Clear states; orders do not wait forever"], ["chain_payments has a composite primary key", "A payment can be recorded only once"], ["No float columns anywhere", "Money is exact"]]),
        miniQuiz("model-mini", [["What makes a repeated webhook harmless?", ["A longer URL", "The primary key on transaction hash and log index", "A faster server", "A bigger table"], 1, "Duplicates are ignored."]]),
      ],
      points: ["Use unguessable references and exact base units.", "Make payments unique by transaction hash and log index."],
      check: [["bytes32 in the contract matches:", ["A 32-byte order reference", "A date", "A price", "A name"], 0, "Both are exactly 32 bytes."]],
    }),
    topic({
      title: "Messy payments", slug: "messy",
      blocks: [
        table("Cases and responses", ["Case", "Suggested response"], [["Exact amount, enough confirmations", "Mark paid and fulfil"], ["Slightly more than the price", "Accept; refund large excess by policy"], ["Slightly less, within tolerance", "Accept if the policy allows"], ["Much less", "Hold for review; do not fulfil"], ["Paid after expiry", "Hold for review: price or stock may have changed"], ["Wrong token", "The contract only accepts its token, so this case is stopped on-chain; tokens sent directly to the treasury need manual matching"], ["Paid twice", "Mark paid once; refund the duplicate"], ["Webhook never arrives", "A reconciliation job compares the chain with the database"]]),
        explorer({ id: "php-tol", title: "Payment tolerance", intro: "Change the price and tolerance to see the lowest amount accepted, in base units for a 6-decimal token.", inputs: [{ id: "price", label: "Price in tokens", min: 1, max: 1000, step: 1, value: 60 }, { id: "tol", label: "Tolerance (%)", min: 0, max: 5, step: 0.5, value: 0.5 }], outputs: [{ label: "Price in base units", expr: "price * 1000000", unit: "n" }, { label: "Lowest accepted (base units)", expr: "round(price * 1000000 * (100 - tol) / 100)", unit: "n" }] }),
        mistakes(["Assuming every payment will be exact.", "Fulfilling an order before the required confirmations.", "Having no way to compare the database with the chain."]),
        miniQuiz("messy-mini", [["Why run a reconciliation job?", ["It is fun", "It finds payments or orders that disagree, such as missed webhooks", "It lowers fees", "It speeds up blocks"], 1, "Trust but verify."]]),
      ],
      points: ["Decide in advance what to do with each odd payment.", "Reconcile the chain and the database regularly."],
      check: [["A payment after the order expired should be:", ["Reviewed", "Ignored forever", "Doubled", "Deleted"], 0, "Conditions may have changed."]],
    }),
    topic({
      title: "Customer experience", slug: "customer-experience",
      blocks: [
        p("The payment may be technically perfect and still confuse people. A customer who has never used a wallet needs clear steps, honest timing and calm error messages. Write the page the way you would explain it to a friend."),
        list("Good practice for the payment page", ["Show the amount in both rupees and tokens, and the network name.", "Explain in one line what each step does.", "Show live status: waiting, confirming, paid.", "Explain that the customer pays the network fee.", "Offer help with a clear contact and the order reference.", "Never ask for a recovery phrase and say so.", "Give a countdown for the order expiry."]),
        table("Wording that helps", ["Instead of", "Say"], [["Transaction failed", "Your wallet did not have enough currency for the network fee. Add a little and try again."], ["Pending", "Waiting for confirmations (about 3 minutes)."], ["Error 502", "We could not check the payment yet. Your money is safe; we will keep trying and e-mail you."]]),
        miniQuiz("cx-mini", [["Why show a countdown on the payment page?", ["To pressure customers", "The order's price and stock are only held for a limited time", "It looks modern", "It lowers fees"], 1, "Be clear about expiry."]]),
      ],
      points: ["Explain each step, show live status and speak plainly.", "Never ask for recovery phrases."],
      check: [["A good error message tells the user:", ["What happened and what to do next", "A code only", "Nothing", "A joke"], 0, "Actionable."]],
    }),
  ],
  terms: [["Order reference", "A unique code tying a payment to an order"], ["Base units", "The smallest whole units of a token"], ["Reconciliation", "Comparing two records to find differences"], ["Tolerance", "A small allowed shortfall"], ["Expiry", "The time an order stops waiting"], ["Underpayment", "Paying less than the price"]],
  practical: { title: "Practical: handle five cases", intro: "On a local test setup.", steps: ["Pay the exact price and see the order become paid.", "Pay too little and see it held.", "Replay the webhook and see no change.", "Let an order expire and then pay it."] },
  quiz: [
    ["order_ref should be:", ["Unguessable", "The customer's name", "Sequential", "Empty"], 0, "Random 32 bytes."],
    ["Money in the database is:", ["Exact base units", "Floats", "Words", "Images"], 0, "DECIMAL(65,0)."],
    ["A duplicate payment is:", ["Marked once, extra refunded", "Fulfilled twice", "Ignored silently", "Deleted"], 0, "Handle with care."],
    ["Late payments go to:", ["Review", "Nowhere", "The browser", "A friend"], 0, "Conditions changed."],
    ["Reconciliation compares:", ["Chain and database", "Colours", "Fonts", "Emails"], 0, "Find mismatches."],
    ["Payment pages should show:", ["Amount, network and status", "Only a logo", "Nothing", "Secrets"], 0, "Clear pages help customers finish paying."],
    ["The customer pays the network fee:", ["Yes, say so clearly", "No, never", "Only on Sundays", "Hidden"], 0, "No surprises."],
  ],
});

const M5 = module_({
  slug: "security-and-money-handling", title: "Security and money handling", hours: 2.5, level: "Applied skills",
  summary: "Keys and custody, confirmations by order value, secret handling and the common mistakes in payment code.",
  outcome: "You can set confirmation policies, keep keys out of web code and review payment code against a checklist.",
  intro: "Payment code attracts attackers because the prize is direct. Most successful attacks are not clever; they use ordinary mistakes. This module lists the mistakes to avoid and the habits that prevent them.",
  topics: [
    topic({
      title: "Keys, custody and secrets", slug: "keys",
      blocks: [
        table("Who should hold which key", ["Key or secret", "Where it belongs", "Never"], [["Private key that receives the money (treasury)", "A hardware wallet or multi-signature wallet, controlled by people", "In PHP, in a database or in a repository"], ["Deployment key for the contract", "A hardware wallet used briefly", "On the web server"], ["RPC API key", "An environment variable on the Node.js service", "In the browser"], ["Webhook secret", "Environment variables on both services", "In the URL or a log"], ["Service API key", "Environment variables", "In the page source"]]),
        p("The design in this course never needs the web application to hold a spending key. Customers pay a contract, the contract sends the money to a treasury, and the treasury is controlled elsewhere. If you add refunds that are sent automatically, the key needed for that is the most dangerous secret in the system: limit its balance, use a separate small wallet and add limits and approvals."),
        miniQuiz("keys-mini", [["Why is it good that the web application never holds a spending key?", ["It saves memory", "A bug in the web application cannot directly steal the money", "PHP forbids it", "It is cheaper"], 1, "Reduce the blast radius."]]),
        warn("If a private key was ever pasted into code, a chat, a ticket or a repository, treat it as stolen and move the funds."),
      ],
      points: ["Keep spending keys out of web code entirely.", "Treat any exposed secret as compromised."],
      check: [["A treasury wallet should be controlled by:", ["Hardware or multi-signature wallets", "A PHP file", "The browser", "A database row"], 0, "Protect the money."]],
    }),
    topic({
      title: "Confirmations and reorganisations", slug: "confirmations",
      blocks: [
        p("A block that was just produced can be replaced if the network briefly disagrees. A payment seen in it can disappear. The more blocks that follow, the less likely a replacement becomes. So the right number of confirmations depends on the network and on how much you would lose."),
        table("A simple policy by value", ["Order value", "Confirmations", "Reason"], [["Small", "A few", "A rare loss costs little"], ["Large", "Many more", "A reversal would hurt"], ["Very large", "Wait for the network's own finality guarantee and ask for manual review", "Avoid even rare risks"]]),
        explorer({ id: "php-conf", title: "Waiting time by confirmations", intro: "Change the confirmations and block time to see the wait. A teaching model.", inputs: [{ id: "c", label: "Confirmations", min: 1, max: 64, step: 1, value: 12 }, { id: "b", label: "Seconds per block", min: 1, max: 15, step: 1, value: 12 }], outputs: [{ label: "Wait (seconds)", expr: "c * b", unit: "n" }, { label: "Wait (minutes)", expr: "c * b / 60", unit: "n" }] }),
        mistakes(["Fulfilling immediately on the first sighting of a transaction.", "Using the same confirmations for a 100-rupee order and a 1,00,000-rupee order.", "Not storing the block number, so a reorganisation cannot be detected later."]),
        miniQuiz("conf2-mini", [["Why wait for more confirmations on large orders?", ["To annoy customers", "A reversal costs more, so you want less chance of one", "It lowers gas", "It is required by PHP"], 1, "Match caution to loss."]]),
      ],
      points: ["More confirmations mean less reorganisation risk.", "Scale confirmations to the value at stake."],
      check: [["A reorganisation can make a payment:", ["Disappear", "Double", "Faster", "Free"], 0, "Recent blocks can be replaced."]],
    }),
    topic({
      title: "A review checklist", slug: "checklist",
      blocks: [
        table("Review the payment code against this list", ["Area", "Question"], [["Amounts", "Is any money handled as a float or int? Are inputs checked for decimals?"], ["Trust", "Does any decision rely on what the browser says?"], ["Webhooks", "Signature, timestamp, validation, unique key and state checks all present?"], ["Secrets", "Any key in code, logs, URLs or the repository?"], ["Errors", "Do failures leave orders in a defined state?"], ["Repeats", "Can every step be run twice safely?"], ["Limits", "Are inputs, body sizes and rates limited?"], ["Logs", "Do logs avoid secrets and personal data?"], ["Dependencies", "Are libraries updated and from trusted sources?"], ["Contract", "Is the contract minimal, reviewed and verified on the explorer?"]]),
        list("Habits", ["Review every change to payment code with a second person.", "Write tests for the odd cases, not only the happy path.", "Rehearse a failure: stop the watcher and see what customers see.", "Keep a log of manual overrides.", "Plan for an incident before it happens."]),
        miniQuiz("check-mini", [["Why test the odd cases?", ["Happy paths never fail", "Bugs and attacks live in the odd cases", "Tests are free", "It is required by law"], 1, "That is where trouble is."]]),
      ],
      points: ["Use a written checklist for every payment change.", "Test odd cases and rehearse failure."],
      check: [["A second reviewer helps because:", ["Fresh eyes spot mistakes", "It is faster", "It is cheaper", "It is required"], 0, "Independent review."]],
    }),
  ],
  terms: [["Custody", "Who controls the keys"], ["Multi-signature wallet", "A wallet needing several approvals"], ["Confirmation", "A block built on top of a transaction's block"], ["Reorganisation", "Replacement of recent blocks"], ["Finality", "The point after which a block will not change"], ["Blast radius", "How much damage one failure can do"]],
  practical: { title: "Practical: audit your code", intro: "Take your own webhook and service code.", steps: ["Go through the ten checklist questions.", "Mark each pass, fail or unsure.", "Fix the fails.", "Write a test for one unsure."] },
  quiz: [
    ["Spending keys belong:", ["In protected hardware or multi-signature wallets", "In PHP", "In the page", "In the repo"], 0, "Away from web code."],
    ["An exposed secret should be:", ["Treated as compromised", "Ignored", "Kept", "Shared"], 0, "Rotate immediately."],
    ["More confirmations:", ["Reduce reorg risk", "Raise gas", "Lower security", "Hide events"], 0, "At the cost of time."],
    ["Confirmation policy should depend on:", ["Order value", "Colour", "Browser", "Day of week"], 0, "Risk-based."],
    ["Logs must avoid:", ["Secrets", "Order numbers", "Status codes", "Timestamps"], 0, "Never log keys."],
    ["Second-person review:", ["Catches mistakes", "Wastes time", "Is banned", "Is optional never"], 0, "Fresh eyes."],
    ["Rehearsing failure helps:", ["Find problems early", "Raise fees", "Lose data", "Delete orders"], 0, "Rehearsal exposes weak spots early."],
  ],
});

const M6 = module_({
  slug: "running-it-for-real", title: "Running it for real", hours: 2, level: "Applied skills",
  summary: "Hosting reality, monitoring, reconciliation, backups and the honest limits of a first project.",
  outcome: "You can choose suitable hosting for each part, monitor the system, write a runbook and state the project's limits.",
  intro: "A working demo is not a running service. Real systems need places to run, ways to know they are healthy and a plan for the day something breaks. This module is about running your checkout calmly.",
  topics: [
    topic({
      title: "Where each part runs", slug: "hosting",
      blocks: [
        table("Hosting options", ["Component", "Shared PHP hosting", "Small VPS", "Managed service"], [["PHP pages and webhook", "Fits well", "Fits", "Possible"], ["Database", "Usually included", "You manage it", "Managed database"], ["Long-running Node.js watcher", "Usually not allowed", "Fits", "Possible with a worker service"], ["RPC node", "No", "Heavy; not for beginners", "Use a hosted provider"], ["Monitoring and alerts", "Limited", "You set up", "External monitor is easiest"]]),
        p("Cheap shared hosting is common for PHP sites, but it normally cannot run a process that never stops. You then have two choices: add a small server just for the Node.js service, or use a scheduled job that wakes up, scans the new blocks, reports payments and exits. The scheduled job is simpler to host but less timely and easy to break when it overlaps with itself or is delayed."),
        list("If you must use a scheduled job", ["Store the last scanned block in the database.", "Prevent two runs from overlapping with a lock.", "Scan in batches and stop before the time limit.", "Make the whole job safe to repeat.", "Alert when it has not run for several minutes."]),
        miniQuiz("host-mini", [["Why is a scheduled scan weaker than a continuous watcher?", ["It is illegal", "Payments are noticed later and the job can overlap or be delayed", "It uses more keys", "It cannot read events"], 1, "Less timely and easier to break."]]),
      ],
      points: ["Continuous watchers need a process that stays alive.", "Scheduled jobs work for light use if they are repeat-safe and monitored."],
      check: [["A lock on a scheduled job prevents:", ["Two overlapping runs", "Payments", "Fees", "Confirmations"], 0, "One at a time."]],
    }),
    topic({
      title: "Monitoring, backups and reconciliation", slug: "monitoring",
      blocks: [
        table("What to watch", ["Signal", "Meaning", "Action"], [["Watcher lag (latest block minus last scanned)", "Payments may be delayed", "Alert above a few minutes"], ["Webhook failures", "PHP unreachable or rejecting", "Check logs and secrets"], ["Orders stuck in awaiting_payment after payment", "A missed event", "Run reconciliation"], ["RPC errors or slow answers", "Provider trouble", "Switch to a backup provider"], ["Large unexpected payments or refunds", "Possible abuse", "Review immediately"]]),
        flow("A nightly reconciliation", ["Take the day's orders marked paid or waiting", "Ask the chain service for every Paid event of the day", "Compare by transaction hash and log index", "List differences", "Fix with the normal path and record notes", "Report totals to the owner"]),
        list("Backups", ["Back up the database daily and test a restore.", "Back up configuration but not secrets in plain text.", "Remember that the chain is the source of truth for payments: the database can be rebuilt from events.", "Keep a copy of the contract address, ABI and deployment details."]),
        miniQuiz("mon-mini", [["What can rebuild the payments table if it is lost?", ["Nothing", "The Paid events on the chain", "The browser cache", "A screenshot"], 1, "The chain remembers."]]),
      ],
      points: ["Watch lag, failures and stuck orders; reconcile every night.", "Back up the database and rehearse restores."],
      check: [["Watcher lag means:", ["How far behind the chain it is", "How fast it is", "Its memory", "Its cost"], 0, "Latest minus scanned."]],
    }),
    topic({
      title: "Honest limits and next steps", slug: "limits",
      blocks: [
        table("What this course does and does not give you", ["It gives you", "It does not give you"], [["A clear architecture for PHP shops", "A guarantee of security"], ["Code patterns for safe webhooks and exact money", "A finished product for real customers"], ["A checklist and a runbook habit", "Legal or tax advice"], ["A way to practise on test networks", "Permission to handle other people's money"]]),
        list("Before using real money", ["Get a security review of the contract and the services.", "Take legal and tax advice for your country.", "Write refund and dispute rules.", "Start with very small limits.", "Monitor daily for the first weeks.", "Tell customers plainly what to expect."], true),
        p("Many shops decide, after this exercise, that a regulated payment provider is a better choice for real customers. That is a fine outcome. What you gain is the knowledge to judge providers, ask good questions and build integrations that do not break."),
        miniQuiz("limits-mini", [["What is a sensible attitude to a first crypto checkout?", ["Launch at full scale", "Start tiny, review, take advice and monitor closely", "Skip testing", "Hide risks"], 1, "Careful and honest."]]),
        warn("Nothing in this course is legal, tax or investment advice."),
      ],
      points: ["Treat this as a learning project until reviewed and advised.", "Start small, monitor and be honest with customers."],
      check: [["Before taking real money you need:", ["Security review and legal advice", "A logo", "Nothing", "A faster server"], 0, "Real money, real duty."]],
    }),
  ],
  terms: [["Shared hosting", "Low-cost hosting where many sites share a server"], ["VPS", "A virtual private server"], ["Cron job", "A scheduled task"], ["Reconciliation", "Comparing records to find differences"], ["Runbook", "Step-by-step instructions for handling an incident"], ["Lag", "How far a processor is behind the chain"]],
  practical: { title: "Practical: write your monitoring plan", intro: "For your own project.", steps: ["List the five signals you will watch.", "Write the alert threshold for each.", "Describe the nightly reconciliation.", "Write what you will tell customers during an outage."] },
  quiz: [
    ["Long-running watchers need:", ["A process that stays alive", "Shared hosting only", "A browser", "A cookie"], 0, "Not a single request."],
    ["Scheduled scans must be:", ["Safe to repeat and locked", "Random", "Secret", "Overlapping"], 0, "Avoid double runs."],
    ["Watcher lag should:", ["Trigger alerts", "Be ignored", "Be hidden", "Be public"], 0, "Delayed payments."],
    ["Reconciliation finds:", ["Differences between chain and database", "Colours", "Fonts", "Cookies"], 0, "Trust but verify."],
    ["Backups should be:", ["Tested by restoring", "Never tested", "Public", "Secret words"], 0, "Untested backups are hopes."],
    ["The chain is the source of truth for:", ["Payments", "Passwords", "E-mails", "Themes"], 0, "Rebuild from events."],
    ["Before real money:", ["Take advice and review", "Skip", "Hurry", "Hide"], 0, "Duty of care."],
  ],
});

export default course({
  slug: "blockchain-php-nodejs", title: "Blockchain Development with PHP & Node.js", tagline: "Add blockchain payments to a PHP application with a safe Node.js chain service", level: "Intermediate", hours: 14,
  summary: "A practical course for PHP developers who want blockchain features without rewriting their application: the architecture that splits PHP and Node.js, a careful JSON-RPC client in PHP, exact money handling, a protected Node.js chain service, a minimal payment contract, signed webhooks, order data models, security, hosting and operations. Solidity and JavaScript listings were compiled or syntax-checked; the PHP and SQL listings were reviewed by hand and should be tested in your own environment. This course gives education, not legal, tax or investment advice.",
  modules: [M1, M2, M3, M4, M5, M6],
  capstone: capstone({
    title: "Final project: design a crypto checkout for a PHP shop", summary: "Produce a professional checkout design and pass the final assessment.",
    intro: "You now have every piece: a PHP application, a Node.js chain service, a small payment contract, signed webhooks, exact money handling, a security checklist and an operations plan. In this final step you design a complete crypto checkout for a PHP shop on a test network and state its limits honestly. Then take the final assessment covering the whole course.",
    steps: ["Work through the **Final project: design a crypto checkout for a PHP shop** lab.", "Check every step against the trust boundaries and the checklist.", "Take the final assessment below."], projectTitle: "A crypto checkout design",
    quiz: [
      ["PHP is best suited to:", ["Short web requests", "Watching blocks forever", "Mining", "Holding spending keys"], 0, "Request in, response out."],
      ["Who confirms a payment?", ["The chain, seen after confirmations", "The browser", "The wallet screenshot", "A guess"], 0, "Only the chain is authoritative."],
      ["Chain amounts in PHP are:", ["Strings of whole base units", "Floats", "Integers always", "Words"], 0, "Use GMP or bcmath."],
      ["Ethereum uses:", ["Original Keccak-256", "PHP's sha3-256", "MD5", "CRC32"], 0, "They differ."],
      ["A webhook must have:", ["A valid signature and fresh timestamp", "A long URL", "A cookie", "A guess"], 0, "Authentic and recent."],
      ["A repeated webhook should:", ["Change nothing", "Charge twice", "Fail", "Delete the order"], 0, "Idempotent."],
      ["Spending keys belong:", ["Away from the web application", "In PHP", "In the page", "In the repo"], 0, "Reduce the blast radius."],
      ["Large orders should wait:", ["More confirmations", "Fewer confirmations", "None", "A day always"], 0, "Scale caution to value."],
      ["A late payment goes to:", ["Review", "Nowhere", "Double fulfilment", "Deletion"], 0, "Conditions may have changed."],
      ["A scheduled scan must be:", ["Locked and safe to repeat", "Overlapping", "Secret", "Random"], 0, "Avoid double runs."],
      ["The database can be rebuilt from:", ["Chain events", "Screenshots", "Cookies", "Fonts"], 0, "The chain is the source of truth."],
      ["Before taking real money:", ["Security review and legal and tax advice", "Nothing", "A new logo", "A faster server"], 0, "Real money, real duty."],
    ],
  }),
  labs,
  skills: [{ id: SK, label: "PHP and Node.js chain integration" }],
  badges: [
    { id: "bridge-builder", title: "Bridge builder", description: "Decided where each job belongs.", when: { all: ["p1-who-does-what"] } },
    { id: "webhook-guard", title: "Webhook guard", description: "Matched webhook checks to attacks.", when: { all: ["p5-webhook-checks"] } },
    { id: "careful-with-money", title: "Careful with money", description: "Judged money-handling practices.", when: { all: ["p9-money-handling"] } },
    { id: "checkout-designer", title: "Checkout designer", description: "Designed a crypto checkout for a PHP shop.", when: { all: ["cap-checkout"] } },
  ],
  landing: {
    hero: { eyebrow: "Intermediate · Solidity compiled, JavaScript syntax-checked", title: "Blockchain for PHP developers: a safe bridge with Node.js", subtitle: "Keep your PHP application, add a small Node.js chain service, a tiny payment contract and signed webhooks, and learn to handle money exactly and calmly. Every task is checked and explained.", level: "Intermediate", outcomeLine: "After this course you can design and build a careful blockchain integration for an existing PHP application." },
    outcomes: [
      { icon: "docs", title: "Design the architecture", text: "PHP, Node.js, contract and database, each with one job." },
      { icon: "sheet", title: "Handle money exactly", text: "Base units, GMP, bcmath and no floats." },
      { icon: "cloud", title: "Build the bridge", text: "A protected Node.js service and watcher." },
      { icon: "safety", title: "Secure the webhooks", text: "HMAC, timestamps and unique keys." },
      { icon: "sort", title: "Handle messy payments", text: "Underpaid, late, duplicate and wrong." },
      { icon: "word", title: "Operate calmly", text: "Hosting, monitoring, runbooks and honest limits." },
    ],
    projects: [
      { title: "An interface contract", text: "A clear PHP and Node.js agreement.", module: "php-and-json-rpc" },
      { title: "Checkout page wording", text: "Words that guide a new customer.", module: "payments-and-orders" },
      { title: "An operations runbook", text: "What to do at 2 a.m.", module: "running-it-for-real" },
      { title: "A crypto checkout design", text: "Architecture, flow, data, security and operations.", module: "capstone" },
    ],
    tools: [{ icon: "docs", title: "Checked code listings", text: "Solidity compiled and JavaScript syntax-checked. PHP and SQL reviewed by hand." }, { icon: "sheet", title: "Spreadsheet lab", text: "Price conversion, reliability and confirmations." }, { icon: "word", title: "Document editor", text: "Contracts, runbooks and designs." }],
    assessment: ["Finish the required labs in each module: they are checked automatically and explained when something is missing.", "Pass each module quiz (70% or more). Short tests inside the lessons give instant feedback.", "Complete the checkout design and the final assessment."],
    faq: [
      { q: "Does the platform run PHP or Node.js?", a: "No. The labs check your designs, calculations and writing. You run the code in your own environment on a test network." },
      { q: "Were the PHP listings tested?", a: "They were written and reviewed by hand but not executed by the platform. Test them in your own environment with PHP 8.1 or newer before relying on them." },
      { q: "Can I take real payments after this?", a: "Not without a security review and legal and tax advice for your country. This is education, and a regulated payment provider may suit a real shop better." },
    ],
  },
  catalogue: {
    hours: "~14 hrs", weeks: "~5 weeks", pace: "3 hrs/wk", badge: "PHP and Node.js Chain Integration",
    brief: "Architecture for PHP shops, JSON-RPC, exact money, a Node.js chain service, signed webhooks, order data models and operations.",
    learn: ["Why and how to split PHP and Node.js", "A careful PHP JSON-RPC client and exact money handling", "A protected Node.js service, a payment contract and a watcher", "Signed webhooks with timestamps and idempotent storage", "Handling underpaid, late and duplicate payments", "Hosting, monitoring, reconciliation and honest limits"],
    handsOn: "Design a complete crypto checkout for a PHP shop on a test network, with flow, data model, security rules and operations.",
    outcome: "Design a careful blockchain integration for an existing PHP application.",
  },
});
