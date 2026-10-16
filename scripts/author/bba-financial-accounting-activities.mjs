/**
 * Authoring script for the interactive activities of "Financial Accounting for BBA".
 *   node scripts/author/bba-financial-accounting-activities.mjs
 * writes lib/learn/data/bba-financial-accounting.activities.json. Every number below is taken from a worked example in the course
 * (content/course-sources/BBA-FIN-ACC.json), and lib/learn/bba-financial-accounting.activities.test.ts solves each activity to prove
 * the checks are neither impossible nor already satisfied.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";

const out = path.resolve(import.meta.dirname, "../../lib/learn/data/bba-financial-accounting.activities.json");
const sheetOf = (cells, formats = {}) => ({ cells, formats, charts: [] });
const bold = (...refs) => Object.fromEntries(refs.map((r) => [r, { bold: true }]));
const chk = (id, label, hint, explain, spec) => ({ id, label, hint, explain, spec });
const f = (ref, equals, extra = {}) => ({ k: "sheet.formula", ref, equals, ...extra });
const noerr = () => chk("noerr", "No error messages anywhere", "Read the red message under the cell to see what is wrong.", "A formula error always has a reason: a missing bracket, a wrong cell name or text where a number should be.", { k: "sheet.noerrors" });

const sheetAct = (o) => ({ kind: "sheet", required: false, ...o });

const activities = [
  /* ---------- Unit 1 ---------- */
  {
    id: "c2-debit-credit", kind: "classify", module: "accounting-fundamentals", title: "Debit or credit?", level: "beginner", minutes: 6, xp: 30, skills: ["concepts"], required: false,
    objective: "Decide which side records an increase in each kind of account.",
    scenario: "Under the modern approach assets and expenses are increased by debits; liabilities, capital and incomes are increased by credits.",
    steps: ["Read each account and ask: is it an asset, liability, capital, expense or income?", "Choose the side that records an INCREASE in it.", "Press Check my work to see which are right."],
    classify: {
      categories: [{ id: "debit", label: "Debit to increase" }, { id: "credit", label: "Credit to increase" }],
      items: [
        { id: "i1", text: "Cash", answer: "debit", why: "Cash is an asset. Assets increase on the debit side." },
        { id: "i2", text: "Creditors (money we owe suppliers)", answer: "credit", why: "A creditor is a liability. Liabilities increase on the credit side." },
        { id: "i3", text: "Capital introduced by the owner", answer: "credit", why: "Capital is the owner's claim. It increases on the credit side." },
        { id: "i4", text: "Rent paid", answer: "debit", why: "Rent is an expense. Expenses increase on the debit side." },
        { id: "i5", text: "Sales", answer: "credit", why: "Sales are income. Income increases on the credit side." },
        { id: "i6", text: "Furniture bought", answer: "debit", why: "Furniture is an asset, so the debit side records the increase." },
        { id: "i7", text: "Drawings by the owner", answer: "debit", why: "Drawings reduce capital. A reduction in a credit-balance account is recorded as a debit." },
        { id: "i8", text: "Commission received", answer: "credit", why: "Commission received is income, which increases on the credit side." },
      ],
    },
    checks: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => chk("i" + n, `Item ${n} is on the right side`, "Ask whether the account is an asset, liability, capital, expense or income.", "See the reason shown with the item.", { k: "classify.item", item: "i" + n })),
  },

  /* ---------- Unit 2 ---------- */
  sheetAct({
    id: "t1-trial-balance", module: "recording-and-trial-balance", title: "Build a trial balance", level: "beginner", minutes: 12, xp: 60, skills: ["recording"],
    objective: "Total the debit and credit columns of Rohan Stationers' trial balance and prove that they agree.",
    scenario: "At 30 April 2026 the ledger balances of Rohan Stationers are listed. A trial balance is correct only if total debits equal total credits.",
    steps: ["Click B9 and type =SUM(B2:B8), then press Enter.", "Click C9 and total the credit column the same way.", "Click B10 and type =B9-C9. A difference of 0 means the books agree."],
    view: { cols: 3, rows: 11 },
    initial: { sheet: sheetOf({ A1: "Account", B1: "Debit", C1: "Credit", A2: "Cash", B2: "255000", A3: "Purchases", B3: "140000", A4: "Gupta (debtor)", B4: "15000", A5: "Rent", B5: "10000", A6: "Capital", C6: "300000", A7: "Sales", C7: "90000", A8: "Verma & Co (creditor)", C8: "30000", A9: "Total", A10: "Difference" }, bold("A1", "B1", "C1", "A9", "A10")) },
    checks: [
      chk("dr", "B9 totals the debit column with SUM", "Type =SUM(B2:B8). The range B2:B8 runs from the first to the last debit balance.", "The debit balances add up to 255000 + 140000 + 15000 + 10000 = 420000.", f("B9", 420000, { fns: ["SUM"], cover: "B2:B8" })),
      chk("cr", "C9 totals the credit column with SUM", "Use the same idea for column C.", "The credit balances add up to 300000 + 90000 + 30000 = 420000.", f("C9", 420000, { fns: ["SUM"], cover: "C2:C8" })),
      chk("diff", "B10 shows the difference as a formula", "Type =B9-C9 so the cell updates if a balance changes.", "420000 - 420000 = 0. The trial balance agrees.", f("B10", 0)),
      noerr(),
    ],
  }),

  /* ---------- Unit 3 ---------- */
  sheetAct({
    id: "d1-depreciation", module: "depreciation-inventory-adjustments", title: "Straight-line vs written-down value", level: "intermediate", minutes: 15, xp: 80, skills: ["adjustments"],
    objective: "Build a three-year depreciation schedule for a machine under both methods using formulas.",
    scenario: "A machine costs 5,00,000 with scrap value 50,000 and a life of 5 years. WDV depreciation is 20%. Fill the schedule so it recalculates when the inputs change.",
    steps: ["B7: straight-line depreciation =(B1-B2)/B3. Copy the same idea to B8 and B9.", "C7: book value =B1-B7. C8 =C7-B8, and so on.", "D7: WDV depreciation =B1*B4. D8 uses the previous book value: =E7*B4.", "E7: =B1-D7, E8 =E7-D8, E9 =E8-D9."],
    view: { cols: 5, rows: 10 },
    initial: { sheet: sheetOf({ A1: "Cost", B1: "500000", A2: "Residual value", B2: "50000", A3: "Useful life (years)", B3: "5", A4: "WDV rate", B4: "0.2", A6: "Year", B6: "SLM depreciation", C6: "SLM book value", D6: "WDV depreciation", E6: "WDV book value", A7: "1", A8: "2", A9: "3" }, { ...bold("A6", "B6", "C6", "D6", "E6"), B4: { num: "percent" } }) },
    checks: [
      chk("b7", "B7 is straight-line depreciation (cost - residual) / life", "Type =(B1-B2)/B3.", "(5,00,000 - 50,000) / 5 = 90,000 every year.", f("B7", 90000)),
      chk("c9", "C9 is the SLM book value after three years", "C9 should be C8 minus the third year's depreciation.", "5,00,000 - 3 x 90,000 = 2,30,000.", f("C9", 230000)),
      chk("d7", "D7 is year-1 WDV depreciation (rate x cost)", "Type =B1*B4.", "20% of 5,00,000 = 1,00,000.", f("D7", 100000)),
      chk("d8", "D8 is year-2 WDV depreciation on the new book value", "The rate applies to E7, the book value at the start of year 2.", "20% of 4,00,000 = 80,000.", f("D8", 80000)),
      chk("d9", "D9 is year-3 WDV depreciation", "Rate times E8.", "20% of 3,20,000 = 64,000.", f("D9", 64000)),
      chk("e9", "E9 is the WDV book value after three years", "E9 = E8 - D9.", "3,20,000 - 64,000 = 2,56,000.", f("E9", 256000)),
      noerr(),
    ],
  }),
  sheetAct({
    id: "d2-stock-valuation", module: "depreciation-inventory-adjustments", title: "Value closing stock", level: "intermediate", minutes: 12, xp: 70, skills: ["adjustments"],
    objective: "Work out closing stock and cost of goods sold by weighted average and FIFO.",
    scenario: "Opening stock is 100 units at 50. On 10 January 200 units were bought at 55 and on 20 January 100 units at 60. 250 units were sold.",
    steps: ["Column D: total cost for each line, for example D2 =B2*C2.", "B5 and D5: total units and total cost with SUM.", "B8: closing units =B5-B7. B9: weighted average cost =D5/B5. B10: closing stock =B8*B9.", "B11: FIFO closing stock. The 150 unsold units are the latest ones: 100 at 60 and 50 at 55.", "B12: cost of goods sold under FIFO =D5-B11."],
    view: { cols: 4, rows: 13 },
    initial: { sheet: sheetOf({ A1: "Lot", B1: "Units", C1: "Cost per unit", D1: "Total cost", A2: "Opening stock", B2: "100", C2: "50", A3: "Purchase 10 Jan", B3: "200", C3: "55", A4: "Purchase 20 Jan", B4: "100", C4: "60", A5: "Total available", A7: "Units sold", B7: "250", A8: "Closing units", A9: "Weighted average cost per unit", A10: "Closing stock (weighted average)", A11: "Closing stock (FIFO)", A12: "Cost of goods sold (FIFO)" }, bold("A1", "B1", "C1", "D1", "A5")) },
    checks: [
      chk("d2", "D2 multiplies units by cost", "Type =B2*C2.", "100 x 50 = 5,000.", f("D2", 5000)),
      chk("d5", "D5 totals the cost with SUM", "Type =SUM(D2:D4).", "5,000 + 11,000 + 6,000 = 22,000.", f("D5", 22000, { fns: ["SUM"], cover: "D2:D4" })),
      chk("b5", "B5 totals the units with SUM", "Type =SUM(B2:B4).", "100 + 200 + 100 = 400 units available.", f("B5", 400, { fns: ["SUM"], cover: "B2:B4" })),
      chk("b8", "B8 gives closing units", "Total available minus units sold.", "400 - 250 = 150.", f("B8", 150)),
      chk("b9", "B9 is the weighted average cost per unit", "Total cost divided by total units.", "22,000 / 400 = 55.", f("B9", 55)),
      chk("b10", "B10 values closing stock at average cost", "Closing units times the average cost.", "150 x 55 = 8,250.", f("B10", 8250)),
      chk("b11", "B11 values closing stock under FIFO", "100 units at 60 plus 50 units at 55.", "6,000 + 2,750 = 8,750.", { k: "sheet.result", ref: "B11", equals: 8750 }),
      chk("b12", "B12 is FIFO cost of goods sold", "Total cost less FIFO closing stock.", "22,000 - 8,750 = 13,250.", f("B12", 13250)),
      noerr(),
    ],
  }),
  {
    id: "c1-capital-revenue", kind: "classify", module: "depreciation-inventory-adjustments", title: "Capital or revenue expenditure?", level: "beginner", minutes: 6, xp: 30, skills: ["concepts"], required: false,
    objective: "Tell spending that creates a long-term asset from spending that is used up in the year.",
    scenario: "Capital expenditure goes on the balance sheet as an asset. Revenue expenditure is charged to the profit and loss account this year.",
    steps: ["Ask: does the benefit last beyond this year, or does it improve what the business can do?", "Choose Capital if yes, Revenue if no.", "Press Check my work."],
    classify: {
      categories: [{ id: "capital", label: "Capital expenditure" }, { id: "revenue", label: "Revenue expenditure" }],
      items: [
        { id: "i1", text: "Purchase of a delivery van", answer: "capital", why: "A van serves the business for years, so it is an asset." },
        { id: "i2", text: "Repairs to keep a machine running", answer: "revenue", why: "Repairs maintain existing capacity and are used up in the year." },
        { id: "i3", text: "Wages paid to install a new machine", answer: "capital", why: "Installation is part of the cost of getting the machine ready for use." },
        { id: "i4", text: "Purchase of goods for resale", answer: "revenue", why: "Goods bought for resale are charged against sales." },
        { id: "i5", text: "Legal fees paid to buy land", answer: "capital", why: "Costs of acquiring an asset are added to its cost." },
        { id: "i6", text: "Salaries of office staff", answer: "revenue", why: "Salaries are a running cost of the year." },
        { id: "i7", text: "Major overhaul that extends a machine's life", answer: "capital", why: "It improves the asset beyond its original capacity." },
        { id: "i8", text: "Routine repainting of the shop", answer: "revenue", why: "Routine upkeep is consumed in the year." },
      ],
    },
    checks: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => chk("i" + n, `Item ${n} is in the right group`, "Ask whether the benefit lasts beyond one year or improves the asset.", "See the reason shown with the item.", { k: "classify.item", item: "i" + n })),
  },

  /* ---------- Unit 4 ---------- */
  sheetAct({
    id: "f1-final-accounts", module: "final-accounts", title: "Prepare Meera Garments' accounts", level: "intermediate", minutes: 20, xp: 100, skills: ["statements"],
    objective: "Work out gross profit and net profit from the adjusted figures of Meera Garments.",
    scenario: "The year-end adjustments (outstanding salaries, prepaid insurance, depreciation and provision) are already included in the expenses listed. Complete the trading and profit and loss calculation.",
    steps: ["B20: net sales =B2-B3. B21: net purchases =B4-B5.", "B22: cost of goods sold = opening stock + net purchases + wages + carriage inwards - closing stock.", "B23: gross profit =B20-B22.", "B24: total expenses with =SUM(B10:B17).", "B25: net profit = gross profit + commission earned - total expenses."],
    view: { cols: 2, rows: 26 },
    initial: { sheet: sheetOf({ A1: "Item", B1: "Rupees", A2: "Sales", B2: "1160000", A3: "Sales returns", B3: "20000", A4: "Purchases", B4: "640000", A5: "Purchase returns", B5: "30000", A6: "Opening stock", B6: "80000", A7: "Closing stock", B7: "95000", A8: "Wages", B8: "60000", A9: "Carriage inwards", B9: "10000", A10: "Salaries (with outstanding)", B10: "130000", A11: "Rent", B11: "48000", A12: "Office expenses", B12: "36000", A13: "Insurance (after prepaid)", B13: "9000", A14: "Advertising", B14: "24000", A15: "Bad debts", B15: "11000", A16: "Provision for doubtful debts", B16: "3250", A17: "Depreciation", B17: "40000", A18: "Commission earned (adjusted)", B18: "10000", A20: "Net sales", A21: "Net purchases", A22: "Cost of goods sold", A23: "Gross profit", A24: "Total expenses", A25: "Net profit" }, bold("A1", "B1", "A23", "A25")) },
    checks: [
      chk("b20", "B20 is net sales (sales less returns)", "Type =B2-B3.", "11,60,000 - 20,000 = 11,40,000.", f("B20", 1140000)),
      chk("b21", "B21 is net purchases", "Purchases less purchase returns.", "6,40,000 - 30,000 = 6,10,000.", f("B21", 610000)),
      chk("b22", "B22 is cost of goods sold", "Opening stock + net purchases + wages + carriage inwards - closing stock.", "80,000 + 6,10,000 + 60,000 + 10,000 - 95,000 = 6,65,000.", f("B22", 665000)),
      chk("b23", "B23 is gross profit", "Net sales less cost of goods sold.", "11,40,000 - 6,65,000 = 4,75,000.", f("B23", 475000)),
      chk("b24", "B24 totals the expenses with SUM", "Type =SUM(B10:B17).", "1,30,000 + 48,000 + 36,000 + 9,000 + 24,000 + 11,000 + 3,250 + 40,000 = 3,01,250.", f("B24", 301250, { fns: ["SUM"], cover: "B10:B17" })),
      chk("b25", "B25 is net profit", "Gross profit plus commission earned, less total expenses.", "4,75,000 + 10,000 - 3,01,250 = 1,83,750.", f("B25", 183750)),
      noerr(),
    ],
  }),

  /* ---------- Unit 6 ---------- */
  sheetAct({
    id: "a1-ratios", module: "ratios-cash-flow-and-gst", title: "Ratio dashboard for Kiran Foods", level: "intermediate", minutes: 15, xp: 80, skills: ["analysis"],
    objective: "Compute liquidity, profitability, activity and solvency ratios from the statements.",
    scenario: "Use the figures of Kiran Foods Ltd. (2025-26) to build a small ratio dashboard a banker could read.",
    steps: ["B13: current ratio =B6/B8.", "B14: quick ratio =(B6-B7)/B8.", "B15 and B16: gross profit and net profit as a share of net sales.", "B17: debtors collection period in days =365/(B2/B11).", "B18: debt-equity =B10/B9. B19: interest cover =(B4+B5)/B5. B20: return on equity =B4/B9."],
    view: { cols: 2, rows: 21 },
    initial: { sheet: sheetOf({ A1: "Item", B1: "Rupees", A2: "Net sales (all on credit)", B2: "1200000", A3: "Cost of goods sold", B3: "840000", A4: "Net profit (after interest)", B4: "120000", A5: "Interest", B5: "20000", A6: "Current assets", B6: "450000", A7: "Stock", B7: "150000", A8: "Current liabilities", B8: "250000", A9: "Shareholders' funds", B9: "500000", A10: "Long-term loan", B10: "300000", A11: "Debtors", B11: "120000", A13: "Current ratio", A14: "Quick ratio", A15: "Gross profit %", A16: "Net profit %", A17: "Collection period (days)", A18: "Debt-equity ratio", A19: "Interest cover (times)", A20: "Return on equity" }, { ...bold("A1", "B1"), B15: { num: "percent" }, B16: { num: "percent" }, B20: { num: "percent" } }) },
    checks: [
      chk("cr", "Current ratio is 1.8", "Current assets divided by current liabilities.", "4,50,000 / 2,50,000 = 1.8.", f("B13", 1.8)),
      chk("qr", "Quick ratio excludes stock", "(Current assets - stock) / current liabilities.", "(4,50,000 - 1,50,000) / 2,50,000 = 1.2.", f("B14", 1.2)),
      chk("gp", "Gross profit % is 30%", "(Net sales - COGS) / net sales.", "3,60,000 / 12,00,000 = 30%.", f("B15", 0.3)),
      chk("np", "Net profit % is 10%", "Net profit / net sales.", "1,20,000 / 12,00,000 = 10%.", f("B16", 0.1)),
      chk("cp", "Collection period is 36.5 days", "365 divided by debtors turnover (sales / debtors).", "Turnover 10 times, so 365 / 10 = 36.5 days.", f("B17", 36.5)),
      chk("de", "Debt-equity ratio is 0.6", "Long-term loan / shareholders' funds.", "3,00,000 / 5,00,000 = 0.6.", f("B18", 0.6)),
      chk("ic", "Interest cover is 7 times", "EBIT (profit + interest) / interest.", "(1,20,000 + 20,000) / 20,000 = 7.", f("B19", 7)),
      chk("roe", "Return on equity is 24%", "Net profit / shareholders' funds.", "1,20,000 / 5,00,000 = 24%.", f("B20", 0.24)),
      noerr(),
    ],
  }),
  sheetAct({
    id: "g1-gst", module: "ratios-cash-flow-and-gst", title: "GST on a purchase and a sale", level: "beginner", minutes: 8, xp: 50, skills: ["gst"],
    objective: "Calculate input GST, output GST and the net amount payable.",
    scenario: "A registered trader buys goods for 1,00,000 and sells goods for 1,50,000, all within one state. GST is 18% on both (the rate is illustrative).",
    steps: ["B5: input GST =B1*B3.", "B6: output GST =B2*B3.", "B7: net payable =B6-B5.", "B8: the CGST half of the net payable. B9: the amount the customer pays."],
    view: { cols: 2, rows: 10 },
    initial: { sheet: sheetOf({ A1: "Purchases (before GST)", B1: "100000", A2: "Sales (before GST)", B2: "150000", A3: "GST rate", B3: "0.18", A5: "Input GST", A6: "Output GST", A7: "Net GST payable", A8: "CGST payable (half)", A9: "Customer pays (sale + GST)" }, { B3: { num: "percent" } }) },
    checks: [
      chk("in", "Input GST is 18,000", "Purchases times the GST rate.", "1,00,000 x 18% = 18,000.", f("B5", 18000)),
      chk("out", "Output GST is 27,000", "Sales times the GST rate.", "1,50,000 x 18% = 27,000.", f("B6", 27000)),
      chk("net", "Net payable is 9,000", "Output GST less input GST.", "27,000 - 18,000 = 9,000.", f("B7", 9000)),
      chk("cgst", "CGST payable is 4,500", "Half of the net payable (the other half is SGST).", "9,000 / 2 = 4,500.", f("B8", 4500)),
      chk("cust", "The customer pays 1,77,000", "Sale plus output GST.", "1,50,000 + 27,000 = 1,77,000.", f("B9", 177000)),
      noerr(),
    ],
  }),

  /* ---------- Capstone ---------- */
  sheetAct({
    id: "cap-brs", module: "capstone", title: "Reconcile the bank balance", level: "challenge", minutes: 15, xp: 120, skills: ["recording"], required: false,
    objective: "Prepare a bank reconciliation statement and find the balance the bank shows.",
    scenario: "On 31 March 2026 the cash book bank column shows a debit balance of 85,000. Bank charges of 500 and a customer's direct deposit of 6,000 appear only in the pass book. Cheques of 12,000 were issued but not yet presented, and cheques of 8,000 were deposited but not yet credited.",
    steps: ["B7: correct the cash book first =B1-B2+B3.", "B8: reach the pass book balance =B7+B4-B5."],
    view: { cols: 2, rows: 9 },
    initial: { sheet: sheetOf({ A1: "Cash book balance (debit)", B1: "85000", A2: "Bank charges (only in pass book)", B2: "500", A3: "Direct deposit (only in pass book)", B3: "6000", A4: "Cheques issued, not yet presented", B4: "12000", A5: "Cheques deposited, not yet credited", B5: "8000", A7: "Adjusted cash book balance", A8: "Balance as per pass book" }, bold("A7", "A8")) },
    checks: [
      chk("adj", "B7 is the adjusted cash book balance", "Deduct the bank charges and add the direct deposit.", "85,000 - 500 + 6,000 = 90,500.", f("B7", 90500)),
      chk("pb", "B8 is the pass book balance", "Add cheques issued but not presented, deduct cheques deposited but not credited.", "90,500 + 12,000 - 8,000 = 94,500.", f("B8", 94500)),
      noerr(),
    ],
  }),
].map((a) => ({ level: "beginner", required: false, ...a }));

const doc = {
  course: "bba-financial-accounting",
  slug: "bba-financial-accounting",
  skills: [
    { id: "concepts", label: "Concepts and classification" },
    { id: "recording", label: "Recording and verifying" },
    { id: "adjustments", label: "Depreciation and adjustments" },
    { id: "statements", label: "Final accounts" },
    { id: "analysis", label: "Ratio analysis" },
    { id: "gst", label: "GST and software" },
  ],
  levels: [{ min: 0, title: "Beginner" }, { min: 100, title: "Bookkeeper" }, { min: 250, title: "Junior accountant" }, { min: 450, title: "Senior accountant" }, { min: 620, title: "Financial accounting pro" }],
  badges: [
    { id: "trial-balance", title: "Trial balance builder", description: "Totalled a trial balance and proved it agrees.", when: { all: ["t1-trial-balance"] } },
    { id: "depreciation", title: "Depreciation designer", description: "Built depreciation schedules and valued closing stock.", when: { all: ["d1-depreciation", "d2-stock-valuation"] } },
    { id: "capital-revenue", title: "Capital or revenue?", description: "Sorted spending into capital and revenue.", when: { all: ["c1-capital-revenue"] } },
    { id: "final-accounts", title: "Final accounts finisher", description: "Worked out gross and net profit from adjusted figures.", when: { all: ["f1-final-accounts"] } },
    { id: "ratio-reader", title: "Ratio reader", description: "Built a ratio dashboard a banker could read.", when: { all: ["a1-ratios"] } },
    { id: "gst-ready", title: "GST ready", description: "Computed input, output and net GST.", when: { all: ["g1-gst"] } },
    { id: "books-balanced", title: "Books balanced", description: "Reconciled the bank balance.", when: { all: ["cap-brs"] } },
  ],
  activities,
};
writeFileSync(out, JSON.stringify(doc, null, 1));
console.log(`wrote ${activities.length} activities, ${activities.reduce((n, a) => n + a.xp, 0)} XP in total`);
