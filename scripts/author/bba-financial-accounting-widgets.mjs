/**
 * Interactive widget specs for BBA Financial Accounting (BBA-FIN-ACC). Writes `lesson.widgets` into content/course-sources/BBA-FIN-ACC.json.
 * Run: node scripts/author/bba-financial-accounting-widgets.mjs, then re-run scripts/build-course-pages.mjs on that file.
 * Spec shapes are documented in lib/learn/widgets/types.ts; every spec is checked by validateSpec (and by lib/learn/widgets/course-widgets.test.ts).
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const file = path.join(root, "content/course-sources/BBA-FIN-ACC.json");
const c = JSON.parse(readFileSync(file, "utf8"));
const gloss = Object.fromEntries(c.glossary.map((g) => [g.term, g.definition]));
const cards = (title, id, terms) => ({ type: "flashcards", id, title, cards: terms.map((t) => { if (!gloss[t]) throw new Error("glossary term missing: " + t); return { front: t, back: gloss[t] }; }) });

const W = {
  "L1.2": [cards("Key terms: concepts and standards", "terms-concepts", ["Accounting period", "Accrual", "GAAP", "Ind AS", "Asset", "Liability", "Contingent liability"])],

  "L1.3": [{
    type: "equation", id: "equation-lab-rohan", title: "Watch the accounting equation hold, transaction by transaction",
    items: [
      { key: "cash", label: "Cash", side: "A" }, { key: "furn", label: "Furniture", side: "A" }, { key: "stock", label: "Stock", side: "A" },
      { key: "cred", label: "Creditors", side: "L" }, { key: "cap", label: "Capital", side: "C" },
    ],
    start: { cash: 0, furn: 0, stock: 0, cred: 0, cap: 0 },
    moves: [
      { text: "Rohan brings 5,00,000 in cash to start the stationery shop.", delta: { cash: 500000, cap: 500000 }, why: "Cash comes in, and the owner's claim on the business grows by the same amount." },
      { text: "He buys furniture for 80,000 and pays cash.", delta: { furn: 80000, cash: -80000 }, why: "One asset swaps for another, so total assets do not move." },
      { text: "He buys goods worth 1,50,000 on credit from Sharma Traders.", delta: { stock: 150000, cred: 150000 }, why: "Assets and a liability both rise by 1,50,000. Nothing has been paid yet." },
      { text: "He sells goods that cost 60,000 for 90,000 cash.", delta: { cash: 90000, stock: -60000, cap: 30000 }, why: "Cash rises by 90,000 and stock falls by 60,000, so assets gain 30,000. That profit belongs to the owner, so capital rises by 30,000." },
      { text: "He pays shop rent of 20,000 in cash.", delta: { cash: -20000, cap: -20000 }, why: "An expense uses up cash and reduces what the owner is entitled to, so assets and capital both fall." },
      { text: "He pays Sharma Traders 1,00,000.", delta: { cash: -100000, cred: -100000 }, why: "Cash and the amount owed both fall by 1,00,000." },
    ],
  }],

  "L2.1": [{
    type: "journal", id: "journal-rohan", title: "Journalise Rohan's first six transactions",
    intro: "Pick the account to debit and the account to credit for each transaction. Your ledger and trial balance build up as you post.",
    accounts: ["Cash", "Capital", "Furniture", "Purchases", "Sharma Traders", "Sales", "Rent"],
    txns: [
      { text: "Rohan brings 5,00,000 in cash as capital.", dr: [["Cash", 500000]], cr: [["Capital", 500000]], why: "Cash is an asset that increased, so debit it. Capital is what the business owes the owner and it increased, so credit it." },
      { text: "Bought furniture for 80,000 and paid cash.", dr: [["Furniture", 80000]], cr: [["Cash", 80000]], why: "Furniture (an asset) comes in, so debit it. Cash (an asset) goes out, so credit it." },
      { text: "Bought goods for 1,50,000 on credit from Sharma Traders.", dr: [["Purchases", 150000]], cr: [["Sharma Traders", 150000]], why: "Purchases is an expense-type account that increased, so debit it. Sharma Traders is now owed money, a liability that increased, so credit it." },
      { text: "Sold goods for 90,000 cash.", dr: [["Cash", 90000]], cr: [["Sales", 90000]], why: "Cash comes in, so debit it. Sales is income, and income increases with a credit." },
      { text: "Paid shop rent of 20,000 in cash.", dr: [["Rent", 20000]], cr: [["Cash", 20000]], why: "Rent is an expense, and expenses increase with a debit. Cash goes out, so credit it." },
      { text: "Paid Sharma Traders 1,00,000 in cash.", dr: [["Sharma Traders", 100000]], cr: [["Cash", 100000]], why: "The amount owed to Sharma Traders falls, and liabilities decrease with a debit. Cash goes out, so credit it." },
    ],
  }],

  "L2.3": [cards("Key terms: ledger and trial balance", "terms-ledger", ["Journal", "Ledger", "Double entry", "Trial balance", "Suspense account", "Debtor", "Creditor"])],

  "L3.2": [{
    type: "explorer", id: "explorer-depreciation", title: "Straight-line against written-down value",
    intro: "Change the machine's cost, scrap value, life or the WDV rate and watch how the two methods write the asset down.",
    inputs: [
      { id: "cost", label: "Cost of the machine", min: 100000, max: 1000000, step: 10000, value: 500000, unit: "rs" },
      { id: "scrap", label: "Scrap value", min: 0, max: 100000, step: 5000, value: 50000, unit: "rs" },
      { id: "life", label: "Useful life", min: 2, max: 10, step: 1, value: 5, unit: "yrs" },
      { id: "rate", label: "WDV rate", min: 5, max: 40, step: 1, value: 20, unit: "pct" },
    ],
    outputs: [
      { label: "SLM charge every year", expr: "(cost - scrap) / life", unit: "rs", hint: "Same amount each year" },
      { label: "WDV charge in year 1", expr: "cost * rate / 100", unit: "rs", hint: "The heaviest year" },
      { label: "WDV charge in year 2", expr: "cost * (1 - rate / 100) * rate / 100", unit: "rs", hint: "Lighter, because the base has shrunk" },
    ],
    chart: {
      xmax: "life", xlabel: "Year",
      series: [
        { label: "Book value, SLM", expr: "cost - (cost - scrap) / life * k", color: "orange" },
        { label: "Book value, WDV", expr: "cost * pow(1 - rate / 100, k)", color: "blue" },
      ],
    },
  }, cards("Key terms: depreciation", "terms-depreciation", ["Depreciation", "Accumulated depreciation", "Book value", "Residual value", "Useful life", "Written-down value"])],

  "L4.2": [cards("Key terms: the balance sheet", "terms-balance-sheet", ["Balance sheet", "Current asset", "Prepaid expense", "Provision", "Drawings", "Final accounts", "Gross profit"])],

  "L5.1": [cards("Key terms: bills of exchange", "terms-bills", ["Bill of exchange", "Drawer", "Drawee", "Discount allowed", "Discount received"])],

  "L5.2": [cards("Key terms: consignment", "terms-consignment", ["Consignment", "Account sales", "Closing stock", "Net realisable value"])],

  "L6.2": [{
    type: "explorer", id: "explorer-liquidity", title: "How liquidity ratios react",
    intro: "Move the sliders to see why a business stuffed with unsold stock can look safe on the current ratio and weak on the quick ratio.",
    inputs: [
      { id: "ca", label: "Current assets", min: 100000, max: 2000000, step: 10000, value: 600000, unit: "rs" },
      { id: "inv", label: "of which stock", min: 0, max: 1000000, step: 10000, value: 250000, unit: "rs" },
      { id: "cl", label: "Current liabilities", min: 100000, max: 1000000, step: 10000, value: 300000, unit: "rs" },
    ],
    outputs: [
      { label: "Current ratio", expr: "ca / cl", unit: "x", hint: "Textbook rule of thumb: about 2 times" },
      { label: "Quick ratio", expr: "(ca - inv) / cl", unit: "x", hint: "Textbook rule of thumb: about 1 time" },
      { label: "Working capital", expr: "ca - cl", unit: "rs", hint: "What is left after short-term dues" },
    ],
  }],

  "L6.5": [{
    type: "explorer", id: "explorer-gst", title: "What GST does to an invoice",
    intro: "Set the price before tax and the GST rate on the invoice. Intrastate, the tax splits equally into CGST and SGST.",
    inputs: [
      { id: "price", label: "Price before tax", min: 1000, max: 200000, step: 500, value: 100000, unit: "rs" },
      { id: "rate", label: "GST rate", min: 0, max: 28, step: 1, value: 18, unit: "pct" },
    ],
    outputs: [
      { label: "Total GST", expr: "price * rate / 100", unit: "rs" },
      { label: "CGST (half)", expr: "price * rate / 200", unit: "rs", hint: "Goes to the Centre" },
      { label: "SGST (half)", expr: "price * rate / 200", unit: "rs", hint: "Goes to the State" },
      { label: "Invoice total", expr: "price * (1 + rate / 100)", unit: "rs", hint: "What the buyer pays" },
    ],
  }],
};

let n = 0;
for (const u of c.units) for (const l of u.lessons) { if (W[l.id]) { l.widgets = W[l.id]; n += W[l.id].length; } else delete l.widgets; }
writeFileSync(file, JSON.stringify(c, null, 2) + "\n", "utf8");
console.log(`wrote ${n} widgets into ${file}`);
