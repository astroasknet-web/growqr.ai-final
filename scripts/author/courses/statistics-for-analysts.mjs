import { bars, capstone, ck, classifyLab, course, def, example, explorer, flow, formula, list, mistakes, module_, p, S, sheetLab, table, tip, topic, tryIt, warn } from "../kit.mjs";

const SK = "statistics";

/* Expected values are computed here, in plain JavaScript, so the labs never rely on hand arithmetic. The tests then check that the sheet engine agrees. */
const sum = (a) => a.reduce((x, y) => x + y, 0);
const mean = (a) => sum(a) / a.length;
const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const variance = (a) => { const m = mean(a); return sum(a.map((x) => (x - m) ** 2)) / (a.length - 1); };
const sd = (a) => Math.sqrt(variance(a));
const slope = (y, x) => { const mx = mean(x), my = mean(y); return sum(x.map((v, i) => (v - mx) * (y[i] - my))) / sum(x.map((v) => (v - mx) ** 2)); };
const cells = (col, start, vals) => Object.fromEntries(vals.map((v, i) => [`${col}${start + i}`, String(v)]));

const SAL = [24, 26, 25, 27, 26, 28, 25, 90];
const SPR = [4, 8, 6, 5, 3, 10];
const ZS = [60, 70, 80, 90, 100];
const SCORES = [45, 52, 58, 61, 63, 64, 66, 68, 71, 72, 73, 75, 76, 78, 81, 83, 85, 88, 92, 97];
const HRS = [1, 2, 3, 4, 5, 6, 7, 8];
const MARKS = [45, 50, 52, 60, 64, 70, 72, 80];
const bin = (lo, hi) => SCORES.filter((v) => v >= lo && v < hi).length;

const labs = [
  sheetLab({
    id: "t1-centre", module: "describing-data", title: "Mean, median and the outlier", level: "beginner", minutes: 10, xp: 40, skills: [SK], required: true,
    objective: "Calculate the mean and median of a list and see how one extreme value pulls them apart.",
    scenario: "Eight people in a small firm earn (in thousands of rupees a month) the salaries below. One is the owner.",
    steps: ["In B11 find the mean with AVERAGE.", "In B12 find the median with MEDIAN.", "In B13 find the largest value with MAX.", "In B14 work out the mean minus the median."],
    cells: { A1: "Person", B1: "Salary (000)", ...cells("B", 2, SAL), A2: "Clerk", A3: "Clerk", A4: "Clerk", A5: "Analyst", A6: "Analyst", A7: "Manager", A8: "Clerk", A9: "Owner", A11: "Mean", A12: "Median", A13: "Highest", A14: "Mean minus median" }, view: { cols: 4, rows: 16 },
    checks: [
      ck("mean", "B11 is the mean", "=AVERAGE(B2:B9)", "The mean adds everything and divides by the count.", S.formula("B11", { fns: ["AVERAGE"], cover: "B2:B9", equals: mean(SAL) })),
      ck("median", "B12 is the median", "=MEDIAN(B2:B9)", "The median is the middle value when the numbers are in order.", S.formula("B12", { fns: ["MEDIAN"], cover: "B2:B9", equals: median(SAL) })),
      ck("max", "B13 is the highest salary", "=MAX(B2:B9)", "MAX finds the extreme value that is pulling the mean up.", S.formula("B13", { fns: ["MAX"], equals: 90 })),
      ck("gap", "B14 is mean minus median", "=B11-B12", "A big gap between mean and median warns of skewed data.", S.formula("B14", { equals: mean(SAL) - median(SAL) })),
    ],
    solution: { cells: { B11: "=AVERAGE(B2:B9)", B12: "=MEDIAN(B2:B9)", B13: "=MAX(B2:B9)", B14: "=B11-B12" } },
  }),
  sheetLab({
    id: "t2-spread", module: "spread-and-variation", title: "Variance and standard deviation by hand", level: "intermediate", minutes: 14, xp: 55, skills: [SK], required: true,
    objective: "Build variance and standard deviation step by step, then confirm with the built-in functions.",
    scenario: "Six daily temperature readings are in B2:B7. Work out how spread out they are.",
    steps: ["In B9 find the mean.", "In C2:C7 work out each deviation: the value minus the mean (use $B$9).", "In D2:D7 square each deviation.", "In B10 add the squares. In B11 divide by the count minus one to get the sample variance.", "In B12 use STDEV and in B13 find the range (largest minus smallest)."],
    cells: { A1: "Reading", B1: "Value", C1: "Deviation", D1: "Squared", ...cells("B", 2, SPR), A9: "Mean", A10: "Sum of squares", A11: "Variance", A12: "Std deviation", A13: "Range" }, view: { cols: 5, rows: 15 },
    checks: [
      ck("mean", "B9 is the mean", "=AVERAGE(B2:B7)", "Deviations are measured from the mean.", S.formula("B9", { fns: ["AVERAGE"], equals: mean(SPR) })),
      ck("dev", "C2 is the first deviation", "=B2-$B$9", "A deviation says how far a value is from the mean.", S.formula("C2", { equals: SPR[0] - mean(SPR) })),
      ck("dev7", "C7 is the last deviation", "Same idea for row 7.", "Every row needs its own deviation.", S.formula("C7", { equals: SPR[5] - mean(SPR) })),
      ck("sq", "D7 is the squared deviation", "Square the deviation: =C7^2", "Squaring removes minus signs so deviations cannot cancel.", S.formula("D7", { equals: (SPR[5] - mean(SPR)) ** 2 })),
      ck("ss", "B10 adds the squares", "=SUM(D2:D7)", "The sum of squares measures total variation.", S.formula("B10", { fns: ["SUM"], cover: "D2:D7", equals: sum(SPR.map((x) => (x - mean(SPR)) ** 2)) })),
      ck("var", "B11 is the sample variance", "=B10/(COUNT(B2:B7)-1)", "For a sample we divide by n minus one, not n.", S.formula("B11", { equals: variance(SPR) })),
      ck("sd", "B12 is the standard deviation", "=STDEV(B2:B7)", "The standard deviation is the square root of the variance, back in the original units.", S.formula("B12", { fns: ["STDEV"], equals: sd(SPR) })),
      ck("range", "B13 is the range", "=MAX(B2:B7)-MIN(B2:B7)", "The range is the gap between the largest and smallest values.", S.formula("B13", { fns: ["MAX", "MIN"], equals: 7 })),
    ],
    solution: { cells: { B9: "=AVERAGE(B2:B7)", ...Object.fromEntries([2, 3, 4, 5, 6, 7].flatMap((r) => [[`C${r}`, `=B${r}-$B$9`], [`D${r}`, `=C${r}^2`]])), B10: "=SUM(D2:D7)", B11: "=B10/(COUNT(B2:B7)-1)", B12: "=STDEV(B2:B7)", B13: "=MAX(B2:B7)-MIN(B2:B7)" } },
  }),
  sheetLab({
    id: "t3-zscores", module: "spread-and-variation", title: "Standardise scores with z-scores", level: "intermediate", minutes: 12, xp: 50, skills: [SK], required: true,
    objective: "Convert raw scores to z-scores so different tests can be compared.",
    scenario: "Five students took a test. Find each student's z-score: how many standard deviations above or below the mean they are.",
    steps: ["In B8 find the mean and in B9 the standard deviation (STDEV).", "In C2 write a formula for the first z-score: (score minus mean) divided by standard deviation, with the mean and SD locked.", "Write the other four z-scores."],
    cells: { A1: "Student", B1: "Score", C1: "z-score", A2: "Anu", A3: "Binu", A4: "Chitra", A5: "Dev", A6: "Esha", ...cells("B", 2, ZS), A8: "Mean", A9: "Std deviation" }, view: { cols: 4, rows: 11 },
    checks: [
      ck("mean", "B8 is the mean", "=AVERAGE(B2:B6)", "The mean of the scores is the centre.", S.formula("B8", { fns: ["AVERAGE"], equals: mean(ZS) })),
      ck("sd", "B9 is the standard deviation", "=STDEV(B2:B6)", "The standard deviation is the typical distance from the mean.", S.formula("B9", { fns: ["STDEV"], equals: sd(ZS) })),
      ck("z1", "C2 is Anu's z-score", "=(B2-$B$8)/$B$9", "A z-score is (value minus mean) divided by standard deviation.", S.formula("C2", { equals: (ZS[0] - mean(ZS)) / sd(ZS) })),
      ck("z4", "C5 is Dev's z-score", "Same formula in row 5.", "Dev scored above the mean, so the z-score is positive.", S.formula("C5", { equals: (ZS[3] - mean(ZS)) / sd(ZS) })),
      ck("z3", "C4 is zero (Chitra scored the mean)", "Chitra's score equals the mean, so her z-score is 0.", "A z-score of 0 means exactly average.", S.formula("C4", { equals: 0 })),
    ],
    solution: { cells: { B8: "=AVERAGE(B2:B6)", B9: "=STDEV(B2:B6)", C2: "=(B2-$B$8)/$B$9", C3: "=(B3-$B$8)/$B$9", C4: "=(B4-$B$8)/$B$9", C5: "=(B5-$B$8)/$B$9", C6: "=(B6-$B$8)/$B$9" } },
  }),
  sheetLab({
    id: "t4-histogram", module: "distributions-and-the-normal-curve", title: "Build a frequency table and histogram", level: "intermediate", minutes: 16, xp: 60, skills: [SK], required: true,
    objective: "Count values into bins with COUNTIF and show the shape with a chart.",
    scenario: "Twenty students' marks are in B2:B21. Group them into ten-mark bins and chart the result.",
    steps: ["Bins are labelled in D2:D7. In E2 count marks below 50.", "For each other bin subtract two COUNTIFs: for 60 to 69, count marks of 60 or more, minus marks of 70 or more.", "Fill all six bins; the counts must add up to 20.", "Add a bar chart with the bin labels as labels and the counts as values."],
    cells: { A1: "Student", B1: "Marks", ...cells("B", 2, SCORES), D1: "Marks band", E1: "Students", D2: "Below 50", D3: "50 to 59", D4: "60 to 69", D5: "70 to 79", D6: "80 to 89", D7: "90 to 99", D8: "Total" }, view: { cols: 6, rows: 22 },
    checks: [
      ck("b1", "E2 counts marks below 50", "=COUNTIF(B2:B21,\"<50\")", "COUNTIF counts the values that meet one condition.", S.formula("E2", { fns: ["COUNTIF"], equals: bin(0, 50) })),
      ck("b3", "E4 counts marks from 60 to 69", "=COUNTIF(B2:B21,\">=60\")-COUNTIF(B2:B21,\">=70\")", "Subtract the count above the band from the count at or above its start.", S.formula("E4", { fns: ["COUNTIF"], equals: bin(60, 70) })),
      ck("b4", "E5 counts marks from 70 to 79", "Use the same pattern with 70 and 80.", "Each band uses two COUNTIFs.", S.formula("E5", { fns: ["COUNTIF"], equals: bin(70, 80) })),
      ck("b6", "E7 counts marks from 90 to 99", "=COUNTIF(B2:B21,\">=90\")", "The top band needs only one COUNTIF.", S.formula("E7", { fns: ["COUNTIF"], equals: bin(90, 100) })),
      ck("tot", "E8 totals 20 students", "=SUM(E2:E7)", "Every student must fall in exactly one band.", S.formula("E8", { fns: ["SUM"], cover: "E2:E7", equals: 20 })),
      ck("chart", "A bar chart of the bands", "Chart type bar, labels D2:D7, values E2:E7.", "A histogram shows the shape of the data at a glance.", S.chart({ type: "bar", labels: "D2:D7", values: "E2:E7" })),
    ],
    solution: {
      cells: { E2: "=COUNTIF(B2:B21,\"<50\")", E3: "=COUNTIF(B2:B21,\">=50\")-COUNTIF(B2:B21,\">=60\")", E4: "=COUNTIF(B2:B21,\">=60\")-COUNTIF(B2:B21,\">=70\")", E5: "=COUNTIF(B2:B21,\">=70\")-COUNTIF(B2:B21,\">=80\")", E6: "=COUNTIF(B2:B21,\">=80\")-COUNTIF(B2:B21,\">=90\")", E7: "=COUNTIF(B2:B21,\">=90\")", E8: "=SUM(E2:E7)" },
      charts: [{ type: "bar", labels: "D2:D7", values: "E2:E7", title: "Marks distribution" }],
    },
  }),
  sheetLab({
    id: "t5-expected", module: "probability", title: "Expected value of a game", level: "intermediate", minutes: 12, xp: 50, skills: [SK], required: true,
    objective: "Combine outcomes and probabilities into an expected value.",
    scenario: "A school fair game costs 10 rupees to play. The prize (after paying 10) and the chance of each outcome are in the table.",
    steps: ["In D2:D5 multiply each outcome's value by its probability.", "In C6 check the probabilities add to 1.", "In D6 add the products to get the expected value.", "In B8 use IF to show Good for the player if the expected value is positive, otherwise Poor."],
    cells: { A1: "Outcome", B1: "Gain (Rs)", C1: "Probability", D1: "Gain times probability", A2: "No prize", B2: "-10", C2: "0.5", A3: "Small prize", B3: "5", C3: "0.3", A4: "Medium prize", B4: "20", C4: "0.15", A5: "Jackpot", B5: "100", C5: "0.05", A6: "Total", A8: "Verdict" }, view: { cols: 5, rows: 10 },
    checks: [
      ck("d2", "D2 is the first product", "=B2*C2", "Each outcome contributes its value times its chance.", S.formula("D2", { equals: -5 })),
      ck("d5", "D5 is the jackpot product", "=B5*C5", "A rare big prize still adds to the total.", S.formula("D5", { equals: 5 })),
      ck("p", "C6 shows the probabilities add to 1", "=SUM(C2:C5)", "Probabilities of all outcomes must add to 1.", S.formula("C6", { fns: ["SUM"], cover: "C2:C5", equals: 1 })),
      ck("ev", "D6 is the expected value", "=SUM(D2:D5)", "Expected value is the long-run average gain per play.", S.formula("D6", { fns: ["SUM"], cover: "D2:D5", equals: 4.5 })),
      ck("v", "B8 says Good because the expected value is positive", "=IF(D6>0,\"Good\",\"Poor\")", "A positive expected value means players win on average (an unusual fair-game result).", S.formula("B8", { fns: ["IF"], equals: "Good" })),
    ],
    solution: { cells: { D2: "=B2*C2", D3: "=B3*C3", D4: "=B4*C4", D5: "=B5*C5", C6: "=SUM(C2:C5)", D6: "=SUM(D2:D5)", B8: "=IF(D6>0,\"Good\",\"Poor\")" } },
  }),
  sheetLab({
    id: "t6-ci", module: "sampling-and-estimation", title: "A confidence interval for a mean", level: "intermediate", minutes: 12, xp: 55, skills: [SK], required: true,
    objective: "Turn a sample into a range that probably contains the true mean.",
    scenario: "A survey of 36 students found they sleep 52 hours... wait, weekly study time: mean 52 minutes a day, standard deviation 12. Give a 95% confidence interval for the true mean.",
    steps: ["In B5 work out the standard error: standard deviation divided by the square root of the sample size.", "In B6 work out the margin of error: 1.96 times the standard error.", "In B7 and B8 find the lower and upper limits of the interval.", "In B9 show the interval width (upper minus lower)."],
    cells: { A1: "Sample size (n)", B1: "36", A2: "Sample mean (minutes)", B2: "52", A3: "Sample SD (minutes)", B3: "12", A5: "Standard error", A6: "Margin of error (95%)", A7: "Lower limit", A8: "Upper limit", A9: "Interval width" }, view: { cols: 3, rows: 11 },
    checks: [
      ck("se", "B5 is the standard error", "=B3/SQRT(B1)", "The standard error shrinks as the sample grows.", S.formula("B5", { fns: ["SQRT"], equals: 2 })),
      ck("me", "B6 is the margin of error", "=1.96*B5", "1.96 standard errors covers 95% of a normal distribution.", S.formula("B6", { equals: 3.92 })),
      ck("lo", "B7 is the lower limit", "=B2-B6", "The interval is the mean minus and plus the margin.", S.formula("B7", { equals: 48.08 })),
      ck("hi", "B8 is the upper limit", "=B2+B6", "Upper limit: the mean plus the margin.", S.formula("B8", { equals: 55.92 })),
      ck("w", "B9 is the width", "=B8-B7", "A narrower interval means a more precise estimate.", S.formula("B9", { equals: 7.84 })),
    ],
    solution: { cells: { B5: "=B3/SQRT(B1)", B6: "=1.96*B5", B7: "=B2-B6", B8: "=B2+B6", B9: "=B8-B7" } },
  }),
  sheetLab({
    id: "t7-regression", module: "relationships-and-testing", title: "Correlation and a line of best fit", level: "intermediate", minutes: 16, xp: 60, skills: [SK], required: true,
    objective: "Measure how two variables move together and predict one from the other.",
    scenario: "Eight students recorded hours of revision per week and their exam marks. Find how strongly they are related and predict a mark.",
    steps: ["In B11 find the correlation of hours (B2:B9) and marks (C2:C9) with CORREL.", "In B12 find the slope of marks against hours (SLOPE, marks first).", "In B13 find the intercept with INTERCEPT.", "In B14 predict the mark for 5.5 hours: intercept plus slope times 5.5."],
    cells: { A1: "Student", B1: "Hours", C1: "Marks", ...cells("B", 2, HRS), ...cells("C", 2, MARKS), A2: "1", A3: "2", A4: "3", A5: "4", A6: "5", A7: "6", A8: "7", A9: "8", A11: "Correlation", A12: "Slope", A13: "Intercept", A14: "Predicted mark at 5.5 hours" }, view: { cols: 4, rows: 16 },
    checks: [
      ck("r", "B11 is the correlation", "=CORREL(B2:B9,C2:C9)", "Correlation runs from -1 to +1; near +1 means they rise together.", S.formula("B11", { fns: ["CORREL"], equals: (() => { const mx = mean(HRS), my = mean(MARKS); return sum(HRS.map((v, i) => (v - mx) * (MARKS[i] - my))) / Math.sqrt(sum(HRS.map((v) => (v - mx) ** 2)) * sum(MARKS.map((v) => (v - my) ** 2))); })() })),
      ck("m", "B12 is the slope", "=SLOPE(C2:C9,B2:B9)", "The slope is the extra marks per extra hour.", S.formula("B12", { fns: ["SLOPE"], equals: slope(MARKS, HRS) })),
      ck("c", "B13 is the intercept", "=INTERCEPT(C2:C9,B2:B9)", "The intercept is the predicted mark at zero hours.", S.formula("B13", { fns: ["INTERCEPT"], equals: mean(MARKS) - slope(MARKS, HRS) * mean(HRS) })),
      ck("pred", "B14 predicts the mark at 5.5 hours", "=B13+B12*5.5", "A prediction uses the line: intercept plus slope times the input.", S.formula("B14", { equals: mean(MARKS) - slope(MARKS, HRS) * mean(HRS) + slope(MARKS, HRS) * 5.5 })),
    ],
    solution: { cells: { B11: "=CORREL(B2:B9,C2:C9)", B12: "=SLOPE(C2:C9,B2:B9)", B13: "=INTERCEPT(C2:C9,B2:B9)", B14: "=B13+B12*5.5" } },
  }),
  classifyLab({
    id: "t8-data-types", module: "describing-data", title: "Name the type of data", level: "beginner", minutes: 6, xp: 20, skills: [SK], required: true,
    objective: "Classify variables as categorical or numerical.", scenario: "The right statistic depends on the kind of data.",
    steps: ["Read each variable.", "Choose its type.", "Press Check my work."],
    categories: [["cat", "Categorical (groups)"], ["disc", "Numerical: counted (discrete)"], ["cont", "Numerical: measured (continuous)"]],
    items: [["Favourite colour of each student", "cat", "Colours are groups with no numerical meaning."], ["Number of siblings", "disc", "You count siblings: whole numbers only."], ["Height in centimetres", "cont", "Height is measured and can take any value."], ["Blood group", "cat", "Blood group is a category."], ["Number of goals in a match", "disc", "Goals are counted."], ["Time taken to run 100 metres", "cont", "Time is measured on a continuous scale."], ["Type of phone: Android or iPhone", "cat", "Two groups."], ["Daily rainfall in millimetres", "cont", "Rainfall is measured."]],
  }),
  classifyLab({
    id: "t9-which-average", module: "describing-data", title: "Mean, median or mode?", level: "intermediate", minutes: 7, xp: 25, skills: [SK], required: false,
    objective: "Choose the best measure of centre for each situation.", scenario: "Different questions need different averages.",
    steps: ["Read each situation.", "Choose the best measure.", "Press Check my work."],
    categories: [["mean", "Mean"], ["median", "Median"], ["mode", "Mode"]],
    items: [["Typical house price in a city with a few mansions", "median", "A few extremes pull the mean up; the median is robust."], ["Most common shoe size to stock", "mode", "The most frequent value is the mode."], ["Average marks in a class with no extreme scores", "mean", "With no outliers, the mean uses all the information."], ["Typical income in a village with one very rich family", "median", "Skewed data suits the median."], ["Which pizza topping is ordered most", "mode", "The mode works for categories."], ["Average daily temperature over a month", "mean", "Measurements without outliers suit the mean."]],
  }),
  classifyLab({
    id: "t10-bias", module: "sampling-and-estimation", title: "Spot the sampling bias", level: "intermediate", minutes: 7, xp: 25, skills: [SK], required: true,
    objective: "Tell a fair sample from a biased one.", scenario: "A sample is only useful if it represents the population.",
    steps: ["Read each sampling method.", "Choose Fair or Biased.", "Press Check my work."],
    categories: [["fair", "Fair sample"], ["bias", "Biased sample"]],
    items: [["Choosing 100 students at random from the school list", "fair", "Everyone has an equal chance."], ["Asking only students who come to the library about reading habits", "bias", "Library visitors read more than average."], ["An online poll where anyone can vote many times", "bias", "Self-selection and repeat votes distort results."], ["Randomly choosing households from the electoral roll", "fair", "Random selection from a complete list."], ["Surveying only your friends about a school rule", "bias", "Friends are not representative."], ["Picking every tenth name from a full class register", "fair", "A systematic sample from the whole population."]],
  }),
  classifyLab({
    id: "t11-causation", module: "relationships-and-testing", title: "Correlation is not causation", level: "intermediate", minutes: 7, xp: 25, skills: [SK], required: true,
    objective: "Recognise when a link may not be causal.", scenario: "Two things moving together does not mean one causes the other.",
    steps: ["Read each statement.", "Choose whether the evidence shows cause or only a link.", "Press Check my work."],
    categories: [["link", "A link only"], ["cause", "Good evidence of cause"]],
    items: [["Ice cream sales and drownings rise together in summer", "link", "Hot weather drives both; ice cream does not cause drowning."], ["A randomised trial finds a new medicine lowers blood pressure", "cause", "Random assignment supports a causal claim."], ["Cities with more churches also have more crime", "link", "Both increase with population size."], ["Students who sleep more score higher", "link", "Other factors, such as motivation or health, may drive both."], ["A controlled experiment shows plants given extra light grow taller", "cause", "Controlled changes isolate the effect."], ["Shoe size and reading ability both rise across primary school", "link", "Age drives both."]],
  }),
  sheetLab({
    id: "cap-survey", module: "capstone", title: "Final project: analyse a survey", level: "challenge", minutes: 30, xp: 140, skills: [SK], required: true,
    objective: "Describe a data set, measure its spread, find a confidence interval and test a relationship.",
    scenario: "A school surveyed eight students on weekly screen time (hours, column B) and sleep (hours, column C). Report the main findings.",
    steps: ["Find the mean and median screen time (B11, B12).", "Find the standard deviation of screen time (B13).", "Find the standard error (B14) and a 95% margin of error (B15) for the mean screen time.", "Find the correlation between screen time and sleep (B16).", "Find the slope of sleep against screen time (B17).", "Chart screen time by student with a bar chart."],
    cells: { A1: "Student", B1: "Screen (hrs/week)", C1: "Sleep (hrs/night)", ...cells("B", 2, [14, 22, 9, 30, 18, 25, 12, 28]), ...cells("C", 2, [8.5, 7.5, 9, 6.5, 8, 7, 8.5, 6.5]), A2: "S1", A3: "S2", A4: "S3", A5: "S4", A6: "S5", A7: "S6", A8: "S7", A9: "S8", A11: "Mean screen time", A12: "Median screen time", A13: "Std deviation", A14: "Standard error", A15: "Margin of error (95%)", A16: "Correlation", A17: "Slope (sleep on screen)" }, view: { cols: 4, rows: 19 },
    checks: [
      ck("mean", "B11 is the mean", "=AVERAGE(B2:B9)", "The mean describes the centre.", S.formula("B11", { fns: ["AVERAGE"], equals: mean([14, 22, 9, 30, 18, 25, 12, 28]) })),
      ck("med", "B12 is the median", "=MEDIAN(B2:B9)", "The median is the middle value.", S.formula("B12", { fns: ["MEDIAN"], equals: median([14, 22, 9, 30, 18, 25, 12, 28]) })),
      ck("sd", "B13 is the standard deviation", "=STDEV(B2:B9)", "The standard deviation describes the spread.", S.formula("B13", { fns: ["STDEV"], equals: sd([14, 22, 9, 30, 18, 25, 12, 28]) })),
      ck("se", "B14 is the standard error", "=B13/SQRT(COUNT(B2:B9))", "Standard error is standard deviation over the square root of n.", S.formula("B14", { fns: ["SQRT"], equals: sd([14, 22, 9, 30, 18, 25, 12, 28]) / Math.sqrt(8) })),
      ck("me", "B15 is the margin of error", "=1.96*B14", "Roughly 95% confidence uses 1.96 standard errors.", S.formula("B15", { equals: 1.96 * (sd([14, 22, 9, 30, 18, 25, 12, 28]) / Math.sqrt(8)) })),
      ck("r", "B16 is the correlation", "=CORREL(B2:B9,C2:C9)", "Correlation measures how the two move together.", S.formula("B16", { fns: ["CORREL"] })),
      ck("m", "B17 is the slope of sleep on screen time", "=SLOPE(C2:C9,B2:B9)", "A negative slope means sleep falls as screen time rises.", S.formula("B17", { fns: ["SLOPE"] })),
      ck("chart", "A bar chart of screen time", "Chart type bar with labels A2:A9 and values B2:B9.", "A chart shows each student's hours at a glance.", S.chart({ type: "bar", labels: "A2:A9", values: "B2:B9" })),
    ],
    solution: { cells: { B11: "=AVERAGE(B2:B9)", B12: "=MEDIAN(B2:B9)", B13: "=STDEV(B2:B9)", B14: "=B13/SQRT(COUNT(B2:B9))", B15: "=1.96*B14", B16: "=CORREL(B2:B9,C2:C9)", B17: "=SLOPE(C2:C9,B2:B9)" }, charts: [{ type: "bar", labels: "A2:A9", values: "B2:B9", title: "Weekly screen time" }] },
  }),
];

const M1 = module_({
  slug: "describing-data", title: "Describing data", hours: 1, level: "Foundations",
  summary: "Know what kind of data you have, and summarise it with the mean, median and mode.",
  outcome: "You can classify variables, choose the right average for the situation and explain why the mean and median can disagree.",
  intro: "Statistics begins with a simple question: what does this data look like? Before any test or model, an analyst summarises: what kind of data is it, where is its centre and how does it spread? This module covers the first two.",
  topics: [
    topic({
      title: "Types of data", slug: "types-of-data",
      blocks: [
        p("Data comes in kinds, and the kind decides what you may calculate. You cannot average a favourite colour."),
        table("Kinds of variable", ["Kind", "Meaning", "Examples", "Useful summaries"], [["Categorical", "Groups or labels", "Blood group, city, phone brand", "Counts, percentages, mode"], ["Numerical, discrete", "Counted, whole numbers", "Siblings, goals, orders", "Mean, median, counts"], ["Numerical, continuous", "Measured on a scale", "Height, time, temperature", "Mean, median, spread"]]),
        p("Within categories, an **ordinal** variable has a natural order (small, medium, large; rating 1 to 5) while a **nominal** one does not (colours). Numbers used as labels, such as roll numbers or phone numbers, are really categorical: averaging them is meaningless."),
        warn("Always ask what a number means before you average it. The average of PIN codes tells you nothing."),
        tryIt("Is the number of items in a shopping basket discrete or continuous?", "Discrete: you count whole items."),
      ],
      points: ["Categorical data is groups; numerical data is counted or measured.", "Numbers used as labels are not real numbers for averaging."],
      check: [["Which is continuous?", ["Number of pets", "Weight of a bag", "Shoe colour", "Roll number"], 1, "Weight is measured and can take any value in a range."], ["Which summary suits categorical data?", ["Mean", "Counts and percentages", "Standard deviation", "Correlation"], 1, "For groups you count how many fall in each."]],
    }),
    topic({
      title: "Mean, median and mode", slug: "mean-median-mode",
      blocks: [
        formula("Mean", "mean = (sum of values) / (number of values)", "In a sheet: =AVERAGE(range)."),
        table("Three averages", ["Measure", "How to find it", "Best when"], [["Mean", "Add all and divide by the count", "Data is roughly symmetric, with no extreme values"], ["Median", "The middle value after sorting", "Data is skewed or has outliers"], ["Mode", "The most frequent value", "Categories, or the most common value matters"]]),
        example("Salaries in a small firm", "Salaries (thousands a month): 24, 26, 25, 27, 26, 28, 25 and 90.", ["Total: 271, count 8, so the mean is 33.9.", "Sorted: 24, 25, 25, 26, 26, 27, 28, 90. The middle two are 26 and 26, so the median is 26.", "Seven of eight people earn between 24 and 28, so the median describes them better than the mean."], "One very high value pulls the mean up. The median stays close to the typical person."),
        bars("Same data: median versus mean (thousands)", [["Median", 26], ["Mean", 33.9]]),
        tip("When the mean is far above the median, the data is skewed to the right, as incomes and house prices usually are."),
      ],
      points: ["Mean uses every value; median is the middle; mode is the most frequent.", "A gap between mean and median signals skewed data or outliers."],
      check: [["Which average resists extreme values best?", ["Mean", "Median", "Sum", "Range"], 1, "The median depends only on the middle of the data."], ["The mode of 2, 3, 3, 4, 3, 5 is:", ["2", "3", "4", "5"], 1, "3 appears three times."]],
    }),
    topic({
      title: "Percentages, percentiles and quartiles", slug: "percentiles-quartiles",
      blocks: [
        p("A **percentage** compares a part with a whole. A **percentile** says what share of the data lies *below* a value: if you scored at the 90th percentile, 90% of people scored lower."),
        table("Quartiles split sorted data into four equal parts", ["Name", "Meaning"], [["Q1 (25th percentile)", "A quarter of values lie below"], ["Q2 (median)", "Half lie below"], ["Q3 (75th percentile)", "Three quarters lie below"], ["IQR", "Q3 minus Q1: the spread of the middle half"]]),
        example("Find the quartiles by hand", "Sorted marks: 40, 45, 52, 58, 63, 70, 75, 82.", ["Median: between 58 and 63, so 60.5.", "Lower half 40, 45, 52, 58: median 48.5, so Q1 = 48.5.", "Upper half 63, 70, 75, 82: median 72.5, so Q3 = 72.5.", "IQR = 72.5 - 48.5 = 24."], "The middle half of students scored within a 24-mark range, a measure of spread that ignores extremes."),
        tip("In a spreadsheet you can find Q1 and Q3 by applying MEDIAN to the lower half and the upper half of the sorted data."),
      ],
      points: ["A percentile tells you the share of data below a value.", "IQR is Q3 minus Q1 and ignores extremes."],
      check: [["A student at the 80th percentile scored:", ["80 marks", "Higher than 80% of students", "Lower than 80%", "Exactly average"], 1, "Percentile is about position within the group."]],
    }),
  ],
  terms: [["Categorical", "Data in groups"], ["Discrete", "Counted numbers"], ["Continuous", "Measured numbers"], ["Mean", "Total divided by the count"], ["Median", "The middle value"], ["Mode", "The most frequent value"], ["Quartile", "A cut point dividing sorted data into quarters"]],
  practical: { title: "Practical: describe your class", intro: "Collect something simple about ten people: shoe size, siblings, height.", steps: ["Say what kind of data each variable is.", "Compute the mean, median and mode of one variable.", "Check whether the mean and median differ.", "Explain which average you would report and why."] },
  quiz: [
    ["Which is categorical?", ["Height", "City of birth", "Time", "Weight"], 1, "City is a label."],
    ["The mean of 2, 4, 6 is:", ["3", "4", "6", "12"], 1, "12 divided by 3 is 4."],
    ["When is the median better than the mean?", ["When data has extreme values", "Never", "When data is categorical", "Always"], 0, "The median resists outliers."],
    ["The mode is:", ["The middle value", "The most frequent value", "The average", "The range"], 1, "It is the most common value."],
    ["Q3 minus Q1 is called:", ["The range", "The IQR", "The mean", "The mode"], 1, "Interquartile range."],
    ["A 90th percentile score means:", ["Scored 90", "Scored higher than 90% of others", "Failed", "Is the median"], 1, "It describes relative position."],
    ["Averaging phone numbers is:", ["Useful", "Meaningless", "Required", "Efficient"], 1, "They are labels."],
  ],
});

const M2 = module_({
  slug: "spread-and-variation", title: "Spread and variation", hours: 1.25, level: "Core skills",
  summary: "Measure how spread out data is with range, variance, standard deviation and z-scores.",
  outcome: "You can calculate variance and standard deviation step by step, interpret them and compare values on different scales with z-scores.",
  intro: "Two classes can have the same average mark and be completely different: one where everyone scored about 60, another where half scored 30 and half scored 90. Spread is what separates them.",
  topics: [
    topic({
      title: "Range and interquartile range", slug: "range-and-iqr",
      blocks: [
        p("The simplest measure of spread is the **range**: largest minus smallest. It is quick but fragile: one extreme value changes it completely. The **interquartile range** (IQR) is steadier because it ignores the extremes."),
        table("Two spread measures", ["Measure", "Formula", "Weakness"], [["Range", "max - min", "Depends on two values only"], ["IQR", "Q3 - Q1", "Ignores the tails entirely"]]),
        example("Same mean, different spread", "Class A marks: 58, 60, 60, 62. Class B marks: 30, 50, 70, 90.", ["Both means are 60.", "Range A = 4; range B = 60.", "Class A is consistent; class B is mixed."], "The mean alone hides the difference: spread must be reported with it."),
        bars("Range of each class", [["Class A", 4], ["Class B", 60]]),
      ],
      points: ["Range is max minus min; IQR is Q3 minus Q1.", "Report a measure of spread together with the average."],
      check: [["Which spread measure is least affected by one extreme value?", ["Range", "IQR", "Maximum", "Sum"], 1, "The IQR ignores the tails."]],
    }),
    topic({
      title: "Variance and standard deviation", slug: "variance-and-sd",
      blocks: [
        flow("How the standard deviation is built", ["Find the mean", "Subtract the mean from each value", "Square each deviation", "Add and divide by n minus 1, then take the root"]),
        formula("Sample variance", "s squared = sum of (x - mean) squared / (n - 1)", "The standard deviation s is the square root of the variance, so it is in the same units as the data."),
        example("Six readings", "Readings: 4, 8, 6, 5, 3, 10.", ["Mean = 36 / 6 = 6.", "Deviations: -2, 2, 0, -1, -3, 4.", "Squares: 4, 4, 0, 1, 9, 16, sum 34.", "Variance = 34 / 5 = 6.8; standard deviation = square root of 6.8 = 2.61."], "A typical reading is about 2.6 away from the mean of 6."),
        p("Why **n minus 1**? A sample varies a little less than the whole population, so dividing by n slightly underestimates the spread. Using n minus 1 corrects that. In a spreadsheet, STDEV and VAR already do this."),
        tip("A rough guide: in bell-shaped data most values lie within two standard deviations of the mean."),
      ],
      points: ["Standard deviation is the typical distance from the mean.", "Use n minus 1 for a sample; STDEV does this for you."],
      check: [["Why are deviations squared?", ["To make them bigger", "So positives and negatives cannot cancel", "To save time", "To round them"], 1, "Without squaring the deviations would sum to zero."], ["The standard deviation has the same units as:", ["The data", "The variance", "Nothing", "Percentages"], 0, "It is the root of the variance, back in the original units."]],
    }),
    topic({
      title: "Z-scores", slug: "z-scores",
      blocks: [
        formula("Z-score", "z = (value - mean) / standard deviation", "It says how many standard deviations a value is above (positive) or below (negative) the mean."),
        table("Reading a z-score", ["z", "Meaning"], [["0", "Exactly average"], ["+1", "One standard deviation above the mean"], ["-2", "Two standard deviations below: fairly unusual"], ["beyond +/-3", "Very unusual: check for an error or outlier"]]),
        example("Two tests, one comparison", "Asha scored 78 on a maths test (mean 70, SD 8). Her friend scored 82 in English (mean 76, SD 3).", ["Asha: z = (78 - 70) / 8 = 1.0.", "Friend: z = (82 - 76) / 3 = 2.0.", "Her friend did relatively better compared with their own class."], "Z-scores put different scales side by side."),
        tryIt("A value is exactly one standard deviation below the mean. What is its z-score?", "-1."),
      ],
      points: ["z = (value - mean) / SD.", "Z-scores let you compare values from different scales."],
      check: [["A z-score of -2 means:", ["Two above the mean", "Two standard deviations below the mean", "Average", "A mistake"], 1, "The sign gives the direction."]],
    }),
  ],
  terms: [["Range", "Largest minus smallest"], ["IQR", "Q3 minus Q1"], ["Variance", "Average squared distance from the mean (n minus 1)"], ["Standard deviation", "Square root of the variance"], ["Z-score", "Distance from the mean in standard deviations"]],
  practical: { title: "Practical: compare two classes", intro: "Use two small sets of marks.", steps: ["Compute the mean for each set.", "Compute the range and standard deviation for each.", "Say which is more consistent.", "Give one value's z-score in each set."] },
  quiz: [
    ["The range of 3, 9, 4 is:", ["6", "9", "3", "16"], 0, "The range is the largest value minus the smallest: 9 minus 3."],
    ["A larger standard deviation means:", ["Data is more spread out", "Data is more tightly packed", "A larger mean", "More data"], 0, "Larger SD, wider spread."],
    ["The sample variance divides by:", ["n", "n minus 1", "n plus 1", "2"], 1, "A sample uses n minus 1."],
    ["A z-score of 0 means:", ["Average", "Very high", "Very low", "Missing"], 0, "It equals the mean."],
    ["Standard deviation is the root of:", ["The mean", "The variance", "The range", "The mode"], 1, "SD is the square root of variance."],
    ["Why use IQR rather than range for skewed data?", ["It is longer", "It ignores extremes", "It is the mean", "It uses colour"], 1, "Extremes distort the range."],
    ["What do z-scores allow?", ["Comparing different scales", "Sorting", "Counting", "Rounding"], 0, "They standardise values."],
  ],
});

const M3 = module_({
  slug: "distributions-and-the-normal-curve", title: "Distributions and the normal curve", hours: 1.25, level: "Core skills",
  summary: "Picture the shape of data with frequency tables and histograms, and use the normal curve to judge how unusual a value is.",
  outcome: "You can build a frequency table, read a histogram, describe skew and use the 68-95-99.7 rule.",
  intro: "Numbers summarise; shapes explain. A histogram shows at a glance whether data is symmetric, skewed, or has two peaks. The normal distribution is the most important shape in statistics because so many measurements follow it.",
  topics: [
    topic({
      title: "Frequency tables and histograms", slug: "frequency-tables",
      blocks: [
        p("A **frequency table** counts how many values fall in each band. A **histogram** draws those counts as touching bars, so the shape of the data appears."),
        table("Marks of 20 students grouped in bands", ["Band", "Students"], [["Below 50", "1"], ["50 to 59", "2"], ["60 to 69", "5"], ["70 to 79", "6"], ["80 to 89", "4"], ["90 to 99", "2"]]),
        bars("Histogram of the same data", [["<50", 1], ["50s", 2], ["60s", 5], ["70s", 6], ["80s", 4], ["90s", 2]]),
        list("Choosing bands", ["Use equal-width bands that do not overlap.", "Five to twelve bands suit most data sets.", "Say clearly whether the upper end is included, such as 60 to under 70.", "Check the counts add up to the total."], true),
        tip("In a spreadsheet, COUNTIF at or above a start minus COUNTIF at or above the next start gives the count for one band."),
      ],
      points: ["A frequency table counts values per band; a histogram draws it.", "Use equal, non-overlapping bands and check the total."],
      check: [["What is the purpose of a histogram?", ["To list names", "To show the shape of the data", "To find the mean exactly", "To round values"], 1, "It reveals the distribution's shape."]],
    }),
    topic({
      title: "The normal distribution", slug: "normal-distribution",
      blocks: [
        p("The **normal distribution** is the symmetric bell curve. Heights, exam marks and measurement errors often follow it. It is fully described by two numbers: the mean (its centre) and the standard deviation (its width)."),
        table("The 68-95-99.7 rule", ["Within", "Share of values"], [["1 standard deviation of the mean", "About 68%"], ["2 standard deviations", "About 95%"], ["3 standard deviations", "About 99.7%"]]),
        explorer({ id: "normal-explorer", title: "How much lies near the mean", intro: "Choose a mean and standard deviation and see the range that holds about 95% of values.", inputs: [{ id: "mean", label: "Mean", min: 40, max: 100, step: 1, value: 70 }, { id: "sd", label: "Standard deviation", min: 1, max: 20, step: 1, value: 8 }], outputs: [{ label: "Lower limit (mean minus 2 SD)", expr: "mean - 2 * sd" }, { label: "Upper limit (mean plus 2 SD)", expr: "mean + 2 * sd" }, { label: "Range holding about 95% of values", expr: "4 * sd" }] }),
        example("Exam marks", "Marks are roughly normal with mean 70 and SD 8.", ["About 68% of students scored between 62 and 78.", "About 95% scored between 54 and 86.", "A mark of 94 is three SDs above the mean: very rare."], "The rule gives a quick feel for what is typical and what is unusual."),
        warn("Not all data is normal. Incomes, queue times and city sizes are usually skewed. Always look at the histogram before you use the rule."),
      ],
      points: ["A normal curve is set by its mean and standard deviation.", "About 68%, 95% and 99.7% lie within 1, 2 and 3 SDs."],
      check: [["About what share of normal data lies within two standard deviations of the mean?", ["50%", "68%", "95%", "100%"], 2, "About 95%."], ["Which two numbers describe a normal distribution?", ["Mode and range", "Mean and standard deviation", "Median and IQR", "Min and max"], 1, "Centre and width."]],
    }),
    topic({
      title: "Skew and outliers", slug: "skew-and-outliers",
      blocks: [
        table("Shapes you will meet", ["Shape", "What it means", "Mean versus median"], [["Symmetric", "Balanced either side", "About equal"], ["Right (positive) skew", "A long tail of high values (incomes)", "Mean above median"], ["Left (negative) skew", "A long tail of low values (easy exam marks)", "Mean below median"], ["Two peaks", "Two groups mixed together", "Neither describes either group"]]),
        p("An **outlier** is a value far from the rest. Do not delete it just because it is awkward. First ask: is it an error (a typed 900 instead of 90), or a real extreme (an outstanding result)? Errors are fixed; real values are reported, with the analysis shown both with and without them."),
        list("Dealing with an outlier", ["Check the source: was it typed or measured wrongly?", "If it is an error, correct it; if not, keep it.", "Report the median and IQR, which resist outliers.", "Show the result with and without the outlier."], true),
      ],
      points: ["Right skew puts the mean above the median.", "Investigate outliers before removing anything."],
      check: [["In right-skewed data the mean is usually:", ["Below the median", "Above the median", "Equal to the median", "Zero"], 1, "High values pull the mean up."]],
    }),
  ],
  terms: [["Frequency", "How many values fall in a band"], ["Histogram", "A chart of frequencies"], ["Normal distribution", "The symmetric bell curve"], ["Skew", "A lopsided shape with a long tail"], ["Outlier", "A value far from the others"]],
  practical: { title: "Practical: shape of your own data", intro: "Use 20 values you can measure, such as steps per day or minutes of travel.", steps: ["Group them into five or six bands.", "Draw the histogram.", "Describe its shape in one sentence.", "Say whether the 68-95-99.7 rule would be sensible."] },
  quiz: [
    ["A histogram shows:", ["Names", "The shape of the data", "Only the mean", "Formulas"], 1, "Shape is the point."],
    ["About 68% of normal data lies within:", ["1 SD", "2 SD", "3 SD", "0.5 SD"], 0, "One standard deviation."],
    ["In right-skewed data the long tail is:", ["High values", "Low values", "In the middle", "Missing"], 0, "Right means high values."],
    ["What should you do first about an outlier?", ["Delete it", "Check whether it is an error", "Double it", "Ignore the rest"], 1, "Investigate before acting."],
    ["Bands in a frequency table should be:", ["Overlapping", "Equal width and non-overlapping", "Random", "Single values"], 1, "Equal, distinct bands."],
    ["Heights of adult men are roughly:", ["Normal", "Exponential", "Uniform", "Binary"], 0, "Many natural measures are normal."],
    ["Two peaks in a histogram usually mean:", ["Two groups mixed together", "A mistake", "Normal data", "A small sample"], 0, "Two clusters."],
  ],
});

const M4 = module_({
  slug: "probability", title: "Probability", hours: 1.25, level: "Applied skills",
  summary: "Work with chance: simple rules, conditional probability and expected value.",
  outcome: "You can calculate probabilities with the addition and multiplication rules, handle conditional probability from a table, and find an expected value.",
  intro: "Probability measures how likely something is, from 0 (impossible) to 1 (certain). It is the bridge from describing data to making statements about the world beyond the data.",
  topics: [
    topic({
      title: "Basic rules of probability", slug: "basic-rules",
      blocks: [
        formula("Probability of an event", "P(event) = favourable outcomes / total equally likely outcomes", "For a fair die, P(even number) = 3 / 6 = 0.5."),
        table("Rules", ["Rule", "Formula", "Use when"], [["Complement", "P(not A) = 1 - P(A)", "It is easier to find the chance it does not happen"], ["Addition (or)", "P(A or B) = P(A) + P(B) - P(A and B)", "Either event is enough"], ["Multiplication (and)", "P(A and B) = P(A) x P(B) for independent events", "Both events must happen and do not affect each other"]]),
        example("Two dice", "What is the chance of getting a six on both of two fair dice?", ["The throws are independent.", "P(six) = 1/6 each time.", "P(both six) = 1/6 x 1/6 = 1/36."], "About 2.8%. Independent events multiply."),
        mistakes(["Adding probabilities of independent 'and' events.", "Forgetting to subtract the overlap in an 'or' question.", "Assuming a coin is more likely to land tails after four heads in a row: each throw is independent."]),
      ],
      points: ["Probabilities run from 0 to 1.", "'Or' adds (minus the overlap); 'and' multiplies for independent events."],
      check: [["P(not A) equals:", ["P(A)", "1 minus P(A)", "P(A) squared", "0"], 1, "The complement rule."], ["The chance of two heads in two fair coin tosses is:", ["1/2", "1/4", "1/3", "1"], 1, "1/2 times 1/2."]],
    }),
    topic({
      title: "Conditional probability from a table", slug: "conditional-probability",
      blocks: [
        p("A **conditional probability** is the chance of something *given* that something else is already known: P(A given B). Restrict your attention to the cases where B is true, then see what share also have A."),
        table("A survey of 200 students", ["", "Plays sport", "Does not", "Total"], [["Uses a bike", "50", "30", "80"], ["Does not use a bike", "40", "80", "120"], ["Total", "90", "110", "200"]]),
        example("Reading the table", "What is the probability a student plays sport, given that they use a bike?", ["Look only at the bike row: 80 students.", "Of them, 50 play sport.", "P = 50 / 80 = 0.625."], "Among cyclists, 62.5% play sport, against 90 / 200 = 45% overall: the two are linked."),
        tryIt("Using the table, what is P(uses a bike given plays sport)?", "50 out of the 90 who play sport: 50 / 90, about 0.56."),
        tip("The order matters: P(A given B) and P(B given A) are usually different."),
      ],
      points: ["Conditional probability looks only at the cases where the condition holds.", "P(A given B) is not the same as P(B given A)."],
      check: [["P(A given B) means:", ["The chance of A and B", "The chance of A among cases where B is true", "The chance of B", "Always 0.5"], 1, "Restrict to B, then look at A."]],
    }),
    topic({
      title: "Expected value", slug: "expected-value",
      blocks: [
        formula("Expected value", "E = sum of (value x probability)", "The long-run average result of repeating a chance process many times."),
        example("A fair-ground game", "A game costs 10 rupees. Outcomes (net gain): lose 10 with probability 0.5; win 5 with 0.3; win 20 with 0.15; win 100 with 0.05.", ["-10 x 0.5 = -5.", "5 x 0.3 = 1.5.", "20 x 0.15 = 3.", "100 x 0.05 = 5.", "Sum = 4.5 rupees."], "On average a player gains 4.5 rupees a game. Real games are set so the expected value is negative for the player."),
        p("Expected value does not predict one game: you will never win exactly 4.5 rupees. It describes what happens on average across many plays, which is what insurers, casinos and decision-makers care about."),
        warn("Do not confuse expected value with the most likely outcome. In the game above the most likely outcome is losing 10 rupees."),
      ],
      points: ["Expected value is the sum of value times probability.", "It describes the long-run average, not a single result."],
      check: [["A bet pays 6 with probability 0.5 and loses 2 otherwise. The expected value is:", ["2", "4", "1", "6"], 0, "6 x 0.5 + (-2) x 0.5 = 2."]],
    }),
  ],
  terms: [["Probability", "A number from 0 to 1 for how likely an event is"], ["Independent events", "One does not change the other's chance"], ["Conditional probability", "The chance of A given B"], ["Expected value", "The long-run average of a chance process"]],
  practical: { title: "Practical: a dice game", intro: "Roll two dice thirty times.", steps: ["Count how often the total is 7.", "Compare with the expected 1 in 6.", "Work out the expected value of a game that pays 5 for a 7 and costs 1 to play.", "Explain why the real result differs from the expected one."] },
  quiz: [
    ["P(rolling an even number on a fair die) is:", ["1/6", "1/2", "1/3", "2/3"], 1, "3 even faces out of 6."],
    ["Two independent events A and B. P(A and B) is:", ["P(A) + P(B)", "P(A) x P(B)", "P(A) - P(B)", "1"], 1, "Independent events multiply."],
    ["P(A or B) when they overlap needs:", ["Subtracting the overlap", "Doubling", "Dividing by 2", "Nothing"], 0, "Otherwise the overlap is counted twice."],
    ["Conditional probability restricts to:", ["All cases", "The cases where the condition is true", "Random cases", "No cases"], 1, "That is its meaning."],
    ["Expected value is:", ["The most likely result", "The long-run average", "Always zero", "The median"], 1, "The average over many repeats."],
    ["After four heads in a row, the chance of tails on a fair coin is:", ["More than 1/2", "Exactly 1/2", "Less than 1/2", "Zero"], 1, "Tosses are independent."],
    ["P(not A) is 0.3. P(A) is:", ["0.3", "0.7", "1", "0"], 1, "1 minus 0.3."],
  ],
});

const M5 = module_({
  slug: "sampling-and-estimation", title: "Sampling and estimation", hours: 1.25, level: "Applied skills",
  summary: "Learn from a sample: how to choose one fairly, and how to put a margin of error on an estimate.",
  outcome: "You can recognise sampling bias, calculate a standard error and a 95% confidence interval and see how sample size affects precision.",
  intro: "We rarely measure everyone. We measure a sample and use it to say something about the whole population. This is powerful, but only if the sample is fair, and only if we say honestly how uncertain we are.",
  topics: [
    topic({
      title: "Populations, samples and bias", slug: "populations-and-samples",
      blocks: [
        def("Population and sample", "The population is everyone or everything you want to learn about. A sample is the part of it you actually measure."),
        table("Sampling methods", ["Method", "How it works", "Good for"], [["Simple random", "Everyone has an equal chance", "Small, listed populations"], ["Systematic", "Every k-th item from a list", "Long lists"], ["Stratified", "Random samples from each group", "Groups differ and all matter"], ["Convenience", "Whoever is easy to reach", "Rarely good: usually biased"]]),
        list("Common sources of bias", ["Selection bias: some people are more likely to be chosen.", "Non-response: those who answer differ from those who do not.", "Self-selection: only motivated people volunteer for a poll.", "Leading questions: the wording pushes an answer."]),
        warn("A big biased sample is worse than a small fair one: it gives a precise wrong answer."),
      ],
      points: ["A sample must represent the population.", "Convenience and self-selected samples are usually biased."],
      check: [["Which sampling method is most likely to be biased?", ["Simple random", "Convenience", "Stratified", "Systematic"], 1, "Whoever is easy to reach is rarely representative."]],
    }),
    topic({
      title: "Standard error and confidence intervals", slug: "confidence-intervals",
      blocks: [
        formula("Standard error of a mean", "SE = s / square root of n", "It measures how much sample means vary from sample to sample."),
        formula("95% confidence interval for a mean", "mean plus or minus 1.96 x SE", "Valid for reasonably large samples (about 30 or more) from roughly normal data."),
        example("Study time", "36 students: mean 52 minutes a day, SD 12.", ["SE = 12 / square root of 36 = 2.", "Margin of error = 1.96 x 2 = 3.92.", "Interval: 52 plus or minus 3.92, so 48.08 to 55.92."], "We are 95% confident the true mean lies between about 48 and 56 minutes."),
        p("The **confidence level** is a statement about the method: if we repeated the survey many times and built an interval each time, about 95% of those intervals would contain the true mean. It is not the probability that this one interval is right."),
        explorer({ id: "ci-explorer", title: "How sample size shrinks the margin", intro: "Keep the spread fixed and watch the margin of error as the sample size changes.", inputs: [{ id: "sd", label: "Standard deviation", min: 2, max: 30, step: 1, value: 12 }, { id: "n", label: "Sample size", min: 4, max: 400, step: 4, value: 36 }], outputs: [{ label: "Standard error", expr: "sd / sqrt(n)" }, { label: "Margin of error (95%)", expr: "1.96 * sd / sqrt(n)" }] }),
      ],
      points: ["SE is s over the square root of n; the 95% margin is 1.96 SE.", "A confidence interval describes the method, not one result."],
      check: [["What happens to the margin of error if the sample size grows?", ["It grows", "It shrinks", "It stays the same", "It becomes zero"], 1, "More data gives more precision."], ["With SD 10 and n = 25 the standard error is:", ["2", "0.4", "10", "5"], 0, "10 divided by 5."]],
    }),
    topic({
      title: "How big a sample do you need?", slug: "sample-size",
      blocks: [
        p("Precision costs data. To halve the margin of error you need **four times** as many people, because the margin depends on the square root of n."),
        table("Margin of error for a mean with SD 12", ["Sample size", "Standard error", "Margin (95%)"], [["25", "2.40", "4.70"], ["100", "1.20", "2.35"], ["400", "0.60", "1.18"], ["1600", "0.30", "0.59"]]),
        bars("Margin of error shrinks slowly (minutes)", [["n = 25", 4.7], ["n = 100", 2.35], ["n = 400", 1.18], ["n = 1600", 0.59]]),
        tip("Decide in advance the margin you can accept, then work backwards to the sample size: n is about (1.96 x SD / margin) squared."),
        warn("A larger sample cannot fix bias. It only reduces random error."),
      ],
      points: ["Four times the sample halves the margin of error.", "More data cannot repair a biased design."],
      check: [["To halve the margin of error you need:", ["Twice the sample", "Four times the sample", "Ten times the sample", "The same sample"], 1, "The margin depends on the square root of n."]],
    }),
  ],
  terms: [["Population", "Everyone you want to learn about"], ["Sample", "The part you measure"], ["Bias", "A systematic error in the sample"], ["Standard error", "How much sample means vary"], ["Confidence interval", "A range likely to contain the true value"], ["Margin of error", "Half the width of the interval"]],
  practical: { title: "Practical: estimate with a margin", intro: "Collect 30 values of something measurable, such as minutes of travel.", steps: ["Compute the mean and the standard deviation.", "Work out the standard error and the 95% margin.", "Write the interval in a sentence.", "Say how many values you would need to halve the margin."] },
  quiz: [
    ["A sample should be:", ["Large only", "Representative of the population", "Easy to reach", "Volunteers only"], 1, "Representativeness matters most."],
    ["The standard error of a mean uses:", ["s over n", "s over the square root of n", "s times n", "n only"], 1, "SE = s / sqrt(n)."],
    ["The 95% interval is the mean plus or minus:", ["1 SE", "1.96 SE", "5 SE", "0.5 SE"], 1, "1.96 standard errors."],
    ["A bigger sample reduces:", ["Bias", "Random error", "The population", "The mean"], 1, "It only reduces chance variation."],
    ["Self-selected online polls are usually:", ["Fair", "Biased", "Perfect", "Random"], 1, "Motivated people choose to answer."],
    ["To cut the margin to a quarter you need about:", ["4 times the sample", "16 times the sample", "2 times", "The same"], 1, "A quarter needs 16 times."],
    ["A 95% confidence level describes:", ["The probability the true mean is in this interval", "How the method performs in repeated use", "The sample size", "The population"], 1, "It is a property of the method."],
  ],
});

const M6 = module_({
  slug: "relationships-and-testing", title: "Relationships and testing", hours: 1.25, level: "Applied skills",
  summary: "Measure how two variables move together, fit a line and understand what a significance test is really asking.",
  outcome: "You can calculate and interpret correlation, build a line of best fit for prediction and explain the logic of hypothesis testing in plain language.",
  intro: "Analysts are rarely asked only to describe: they are asked whether two things are related, and whether a difference is real or just chance. This final module introduces the tools and the cautions that go with them.",
  topics: [
    topic({
      title: "Correlation", slug: "correlation",
      blocks: [
        p("The **correlation coefficient** r measures the strength and direction of a straight-line relationship, from -1 (perfect fall) to +1 (perfect rise). 0 means no straight-line pattern."),
        table("Reading r", ["r", "Meaning"], [["0.9 to 1.0", "Very strong positive"], ["0.5 to 0.9", "Moderate to strong positive"], ["-0.2 to 0.2", "Almost none"], ["-0.5 to -0.9", "Moderate to strong negative"]]),
        warn("Correlation is not causation. Two things can move together because a third thing drives both, or by coincidence. Always plot the data: a curve can have r near zero and still be a perfect relationship."),
        example("Revision and marks", "Hours of revision against exam marks for eight students give r of about 0.99.", ["Strong positive: more revision goes with higher marks.", "That does not prove revision causes the marks: motivated students may do both.", "A study that assigns revision at random could test cause."], "Correlation tells you that a link exists, not why."),
      ],
      points: ["r runs from -1 to +1.", "Correlation does not prove causation; always plot the data."],
      check: [["r = -0.9 suggests:", ["A strong rise together", "A strong inverse relationship", "No relationship", "Perfect"], 1, "Strong and negative."], ["Correlation shows:", ["A cause", "A link, not necessarily a cause", "Nothing", "A prediction"], 1, "It does not prove cause."]],
    }),
    topic({
      title: "A line of best fit", slug: "line-of-best-fit",
      blocks: [
        p("The **regression line** is the straight line that fits the points best, with equation y = a + bx. The slope b says how much y changes for each one-unit rise in x; the intercept a is the predicted y when x is zero."),
        formula("The line", "y = intercept + slope x x", "In a sheet: =INTERCEPT(known_y, known_x) + SLOPE(known_y, known_x) * x"),
        example("Predict a mark", "The line for hours (x) and marks (y) has slope about 5 and intercept about 39.", ["For 5.5 hours: 39 + 5 x 5.5 = 66.5.", "The line says each extra hour of revision goes with about 5 more marks.", "Only predict inside the range of the data you have: 20 hours may not follow the pattern."], "Predictions are reliable inside the range of the data and risky outside it."),
        mistakes(["Predicting far beyond the range (extrapolating).", "Treating the slope as a causal effect.", "Ignoring a curved pattern in the plot."]),
      ],
      points: ["The slope is the change in y per unit of x.", "Do not extrapolate far beyond the data."],
      check: [["What does the slope tell you?", ["The average", "The change in y for each unit of x", "The spread", "The sample size"], 1, "It is the rate of change."]],
    }),
    topic({
      title: "The logic of a significance test", slug: "significance-tests",
      blocks: [
        flow("Hypothesis test in four steps", ["State a null hypothesis: no effect", "Collect data", "Ask: how surprising is this if the null were true?", "Decide and report honestly"]),
        p("A test begins with a **null hypothesis** (nothing is going on, for example the new method makes no difference). It asks how likely we would be to see data at least this extreme if the null were true. That probability is the **p-value**."),
        table("Reading a p-value", ["p-value", "Plain reading"], [["Small (below 0.05)", "The data would be rare if there were no effect, so there is evidence of an effect"], ["Large", "The data are consistent with no effect; this is not proof there is none"]]),
        list("Cautions", ["A p-value is not the probability the null is true.", "Statistically significant does not mean important: check the size of the effect.", "A small study can miss a real effect; a huge study can flag a trivial one.", "Testing many things finds false alarms: report how many you tried."]),
        tip("Always report the size of the difference and its confidence interval alongside any p-value."),
      ],
      points: ["A p-value measures surprise under the null, not the chance the null is true.", "Report effect size and interval, not just significance."],
      check: [["A small p-value means:", ["The null is certainly false", "The data would be unusual if there were no effect", "The effect is large", "The sample is small"], 1, "It measures surprise under the null."], ["Which should you report with a test?", ["Only the p-value", "The effect size and a confidence interval", "Nothing", "The sample colour"], 1, "Significance without size is incomplete."]],
    }),
  ],
  terms: [["Correlation", "Strength of a straight-line link"], ["Regression line", "The line of best fit"], ["Slope", "Change in y per unit of x"], ["Null hypothesis", "The 'no effect' starting assumption"], ["p-value", "How surprising the data is if the null were true"]],
  practical: { title: "Practical: two variables of your own", intro: "Pick two measurable things you suspect are linked, such as hours of sleep and mood score.", steps: ["Record ten pairs of values.", "Compute the correlation and the line of best fit.", "Write one sentence describing the link, without claiming cause.", "Say what extra evidence would be needed to show a cause."] },
  quiz: [
    ["Correlation of +1 means:", ["No link", "A perfect rising straight line", "A perfect falling line", "A curve"], 1, "Perfect positive."],
    ["Correlation proves:", ["Cause", "Nothing about cause", "That x is bigger", "A sample"], 1, "It does not prove cause."],
    ["The regression intercept is:", ["The predicted y when x is 0", "The slope", "The mean", "The error"], 0, "Where the line crosses the y axis."],
    ["Extrapolating means:", ["Predicting outside the data range", "Averaging", "Sorting", "Plotting"], 0, "Beyond the observed range."],
    ["A p-value below 0.05 is conventionally called:", ["Proof", "Statistically significant", "Impossible", "A mistake"], 1, "It is evidence, not proof."],
    ["Which statement about p-values is true?", ["It is the chance the null is true", "It measures surprise if the null were true", "It is the effect size", "It is the sample size"], 1, "That is its definition."],
    ["Why plot data before computing r?", ["It is a rule", "A curve can hide behind a low r", "Plots are faster", "To change units"], 1, "r only measures straight-line links."],
  ],
});

export default course({
  slug: "statistics-for-analysts", title: "Statistics for Analysts", tagline: "Describe, estimate and test, with a working spreadsheet in every module", level: "Intermediate", hours: 7.5,
  summary: "Learn the statistics an analyst uses every week: describing data, spread, distributions, probability, sampling and confidence intervals, and relationships. Every module has a spreadsheet lab that checks your calculations.",
  modules: [M1, M2, M3, M4, M5, M6],
  capstone: capstone({
    title: "Final project: analyse a survey", summary: "Analyse a small data set end to end and pass the final assessment.",
    intro: "You now have the core toolkit. In this final step you analyse a small survey in the spreadsheet lab: centre, spread, a margin of error and a relationship. Then take the final assessment covering the course.",
    steps: ["Work through the **Final project: analyse a survey** lab: mean, median, standard deviation, standard error, margin of error, correlation and slope, and a chart.", "Write two sentences that report your findings honestly, including what you cannot conclude.", "Take the final assessment below."], projectTitle: "Analyse a survey of screen time and sleep",
    quiz: [
      ["Which average suits skewed data best?", ["Mean", "Median", "Mode", "Sum"], 1, "The median resists extremes."],
      ["The sample standard deviation divides by:", ["n", "n minus 1", "n plus 1", "2"], 1, "Use n minus 1 for a sample."],
      ["A z-score of +2 means:", ["Two SDs above the mean", "Two units above", "Average", "Two percent"], 0, "Direction and distance in SDs."],
      ["About 95% of normal data lies within:", ["1 SD", "2 SD", "3 SD", "4 SD"], 1, "Two standard deviations."],
      ["P(A and B) for independent events is:", ["P(A) + P(B)", "P(A) x P(B)", "1", "0"], 1, "Independent events multiply."],
      ["A convenience sample is usually:", ["Fair", "Biased", "Random", "Stratified"], 1, "Easy-to-reach people are rarely representative."],
      ["The standard error of a mean is:", ["s x n", "s over the square root of n", "n over s", "s squared"], 1, "SE = s / sqrt(n)."],
      ["To halve a margin of error you need:", ["Double the sample", "Four times the sample", "The same sample", "Ten times"], 1, "The margin depends on the square root of n."],
      ["Correlation of -0.8 means:", ["A strong rise together", "A strong inverse relationship", "No link", "A causal link"], 1, "Strong and negative."],
      ["A small p-value tells you:", ["The effect is large", "The data would be unusual if there were no effect", "The null is certain", "The sample is large"], 1, "It measures surprise under the null."],
      ["Expected value is:", ["The most likely result", "The long-run average", "The median", "A guess"], 1, "Average over many repeats."],
      ["Why plot data first?", ["To waste time", "Shape and outliers are visible in a chart", "It is required", "To pick colours"], 1, "Plots reveal what statistics hide."],
    ],
  }),
  labs,
  skills: [{ id: SK, label: "Statistics" }],
  badges: [
    { id: "centre-and-spread", title: "Centre and spread", description: "Found averages and measures of spread.", when: { all: ["t1-centre", "t2-spread"] } },
    { id: "shape-reader", title: "Shape reader", description: "Built a frequency table and histogram.", when: { all: ["t4-histogram"] } },
    { id: "estimator", title: "Estimator", description: "Built a confidence interval.", when: { all: ["t6-ci"] } },
    { id: "analyst", title: "Analyst", description: "Finished the survey analysis project.", when: { all: ["cap-survey"] } },
  ],
  landing: {
    hero: { eyebrow: "Analytics skills · No software to install", title: "Statistics for Analysts: learn by doing", subtitle: "Describe data, measure spread, read distributions, work with probability, build confidence intervals and test relationships in a working spreadsheet. Every calculation is checked.", level: "Intermediate", outcomeLine: "After this course you can summarise a data set, quantify uncertainty and judge whether a link is worth believing." },
    outcomes: [
      { icon: "sheet", title: "Describe data", text: "Mean, median, mode, percentiles and the right choice for each." },
      { icon: "sort", title: "Measure spread", text: "Range, IQR, variance, standard deviation and z-scores." },
      { icon: "web", title: "Read shapes", text: "Frequency tables, histograms, the normal curve and skew." },
      { icon: "ai", title: "Work with chance", text: "Probability rules, conditional probability and expected value." },
      { icon: "cloud", title: "Estimate honestly", text: "Samples, bias, standard error and confidence intervals." },
      { icon: "safety", title: "Test relationships", text: "Correlation, a line of best fit and what a p-value really means." },
    ],
    projects: [
      { title: "Salaries and the outlier", text: "See how one value pulls the mean away from the median.", module: "describing-data" },
      { title: "A histogram of marks", text: "Bins, counts and a chart.", module: "distributions-and-the-normal-curve" },
      { title: "A confidence interval", text: "Turn a sample into a range with a margin of error.", module: "sampling-and-estimation" },
      { title: "A survey analysis", text: "Summary statistics, uncertainty and a relationship.", module: "capstone" },
    ],
    tools: [{ icon: "sheet", title: "Spreadsheet lab", text: "Real formulas including STDEV, MEDIAN, CORREL, SLOPE and COUNTIF." }, { icon: "ai", title: "Explorer sliders", text: "Change the mean, spread or sample size and watch the result move." }, { icon: "sort", title: "Sort and decide", text: "Data types, bias and correlation versus causation." }],
    assessment: ["Finish the required labs in each module: every number is checked automatically and explained when something is missing.", "Pass each module quiz (70% or more). You can retry as often as you like.", "Complete the survey project and the final assessment."],
    faq: [
      { q: "Do I need to know advanced maths?", a: "No. You need arithmetic and the willingness to read a formula. Every formula is built step by step." },
      { q: "Which software?", a: "A spreadsheet in your browser. The same formulas work in Excel and Google Sheets." },
      { q: "Is this enough to be a data analyst?", a: "It is the statistical core. Analysts also need data cleaning, a query language and visualisation, which are covered in other GrowQR courses." },
    ],
  },
  catalogue: {
    hours: "~7.5 hrs", weeks: "~3 weeks", pace: "3 hrs/wk", badge: "Applied Statistics",
    brief: "Describe data, measure spread, read distributions, work with probability, estimate with confidence intervals and test relationships.",
    learn: ["Data types and the right average for the situation", "Variance, standard deviation and z-scores", "Frequency tables, histograms and the normal curve", "Probability rules, conditional probability and expected value", "Sampling, bias, standard error and confidence intervals", "Correlation, regression and the logic of significance tests"],
    handsOn: "Analyse a small survey end to end in a spreadsheet and report the findings honestly.",
    outcome: "Summarise data, quantify uncertainty and judge claims about relationships with care.",
  },
});
