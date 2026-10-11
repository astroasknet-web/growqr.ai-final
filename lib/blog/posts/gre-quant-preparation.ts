import type { LocalPost } from "../local";

const course = (slug: string, label: string): string => `<a href="/courses/${slug}">${label}</a>`;
const test = (path: string, label: string): string => `<a href="/practice-tests/${path}">${label}</a>`;
const wrap = (label: string, table: string): string => `<div class="table-wrap" role="region" tabindex="0" aria-label="${label}">${table}</div>`;

const post: LocalPost = {
  slug: "gre-quant-preparation",
  title: "GRE Quant Preparation: A Study Plan Built Around the 27 Questions That Count",
  seoTitle: "GRE Quant Preparation: A Study Plan for 27 Questions",
  description: "GRE quant preparation made practical: the 27-question format, a six-week plan, the traps in quantitative comparison, and a quiz. Take a timed mock test.",
  focusKeyword: "gre quant preparation",
  secondaryKeywords: ["gre quantitative reasoning study plan", "gre quantitative comparison tips", "gre quant practice test", "how to score 165 in gre quant"],
  category: "GRE",
  author: "Sachin Sharma",
  published: "2026-10-12 19:00:00",
  updated: "2026-10-12 19:00:00",
  excerpt: "GRE quant preparation without the panic: what the 27 questions actually test, a six-week plan, the traps built into quantitative comparison questions and a six-question quiz to try inside the article.",
  cover: {
    src: "/blog/gre-quant-preparation.png",
    alt: "GRE quant preparation: maths symbols beside a practice question comparing two quantities",
    width: 1200,
    height: 630,
  },
  coverStyle: { art: "math", footer: "Practice: GRE Quant tests", chips: ["A six-week plan", "Practice quiz inside"] },
  content: `
<p>A student who has been solving algebra since Class 8 sits her first GRE mock and scores far lower than she expected. She knew every formula. What she did not know was the format: the question that looks like a fraction problem but is really testing whether you notice a negative number, and a clock that allows under two minutes per question. Good <strong>GRE quant preparation</strong> is mostly about those two things. The maths is school-level. The skill is working out which question you are being asked, quickly.</p>
<p>This guide shows you the format, a six-week plan, the traps in the most unusual question type and a way to turn mock tests into real improvement. There is a short quiz in the middle, with worked explanations, so you can see how the question types behave.</p>

<h2 id="format">GRE quant preparation starts with the format: 27 questions, 47 minutes</h2>
<p>The Quantitative Reasoning part of the current GRE has two sections, and the first one affects how hard the second is. Your score runs from 130 to 170 in one-point steps.</p>
${wrap("The structure of GRE Quantitative Reasoning", `<table>
<thead><tr><th>Section</th><th>Questions</th><th>Time</th></tr></thead>
<tbody>
<tr><td>Quantitative Reasoning, section 1</td><td>12</td><td>21 minutes</td></tr>
<tr><td>Quantitative Reasoning, section 2</td><td>15</td><td>26 minutes</td></tr>
<tr><td>Total</td><td>27</td><td>47 minutes</td></tr>
</tbody></table>`)}
<p>That works out to about one minute and forty-five seconds per question. You can skip a question and come back to it within the same section, and an on-screen calculator is provided. Those two facts are a gift, as long as you do not waste time on a single stubborn problem.</p>
<p>The questions come in five types: quantitative comparison, multiple choice with one answer, multiple choice where you select every correct answer, numeric entry where you type a number, and questions about data in a chart or table. The topics are arithmetic, algebra, geometry and data analysis, all taught before college.</p>
<p>Here is the idea that changes how people study. The hard part is rarely the mathematics. It is reading the question accurately and choosing the fastest method. Plan your GRE quant preparation around speed and accuracy together, not around learning new theorems.</p>

<h2 id="plan">A six-week GRE quant preparation plan</h2>
<p>This plan assumes about ninety minutes a day. If you are aiming for a very high score, or you have not touched maths for years, stretch each phase by a week.</p>
${wrap("A six-week GRE quant preparation plan", `<table>
<thead><tr><th>Week</th><th>Focus</th><th>Goal for the week</th></tr></thead>
<tbody>
<tr><td>1</td><td>Arithmetic and number properties</td><td>Fractions, percentages, ratios, factors and remainders without a calculator</td></tr>
<tr><td>2</td><td>Algebra</td><td>Linear and quadratic equations, inequalities and word problems</td></tr>
<tr><td>3</td><td>Geometry</td><td>Triangles, circles, coordinate geometry and area and volume formulas</td></tr>
<tr><td>4</td><td>Data analysis</td><td>Averages, median, standard deviation, counting and probability, and reading charts</td></tr>
<tr><td>5</td><td>Mixed timed sets</td><td>Twelve questions in 21 minutes, then fifteen in 26</td></tr>
<tr><td>6</td><td>Full mock tests and review</td><td>Two or three complete tests, with every mistake classified</td></tr>
</tbody></table>`)}
<p>Speed in arithmetic is worth practising on its own. If percentages and fractions feel slow, a short course in ${course("vedic-mathematics", "Vedic Mathematics and Speed Calculation")} can help, and the data analysis week connects naturally to ${course("statistics-for-analysts", "Statistics for Analysts and Data Science")}.</p>
<p>Do not leave timed practice until the end. Many students finish their GRE quant preparation having never once worked under the real clock, and the first full test is where the surprise arrives.</p>

<h3 id="target">What score should you aim for?</h3>
<p>It depends on where you are applying, and no article can answer that for you. Engineering and quantitative programmes tend to look closely at the Quant score, while many other programmes care more about the verbal and writing parts. Check the admissions pages of the programmes you want and work backwards from their stated expectations. Then set your GRE quant preparation target a little above that, so one bad day does not sink the application.</p>

<h2 id="quiz">Check yourself: a six-question GRE quant warm-up</h2>
<p>Try these without a calculator first. Each one is a typical example of its type, and the explanations show the shortest route to the answer.</p>
<!--quiz-->

<h2 id="traps">GRE quant preparation and the traps in quantitative comparison</h2>
<p>A quantitative comparison gives you two quantities and four fixed choices: A is greater, B is greater, they are equal, or the relationship cannot be determined. The last choice is where students lose points, because it means more than "I do not know how to solve it".</p>
<h3 id="try-cases">Test more than one case</h3>
<p>If the problem contains a variable, try different kinds of numbers: positive and negative, whole numbers and fractions, zero and one. If two cases push the answer in opposite directions, the relationship cannot be determined, and you are finished in thirty seconds. Squares are the classic trap: if x squared equals 49, then x could be 7 or negative 7.</p>
<h3 id="compare-dont-compute">Compare, do not compute</h3>
<p>You rarely need an exact value. If you must decide which of two fractions is larger, convert to decimals or cross-multiply and look only at the comparison. Simplify both sides by the same operation and see which survives. Estimation is often faster than the calculator.</p>
<h3 id="calculator">The calculator is a tool, not a plan</h3>
<p>Typing a long calculation is slower than it feels, and a single mistyped digit gives a plausible wrong answer. Use the calculator to confirm arithmetic you have already set up, not to explore. For questions that say to select all correct answers, remember that there is no partial credit, so check every option.</p>
<p>Strong GRE quant preparation turns these checks into habits you do not have to think about.</p>
<p>One habit pays off across the whole section: before you start, read what the question actually asks. A question for the value of x might ask for 2x.</p>

<h2 id="mocks">How to use mock tests in your GRE quant preparation</h2>
<p>A mock test is only useful if you study it afterwards. Take it in one sitting with a timer, then spend at least as long reviewing as you did testing. For each mistake, write one of four labels: concept gap, careless error, time pressure or misread question. After three mocks the pattern is usually obvious, and it tells you whether to study more or just slow down and read.</p>
<p>The site has 30 timed ${test("gre-quant", "GRE Quant practice tests")}, each with 27 questions, a 47-minute timer, instant marking and an explanation for every question. They cover all the topic areas in the plan above, so you can use them for timed practice in week five and as full mocks in week six. If you are also preparing for English, the ${test("ielts-reading", "IELTS Reading practice tests")} follow the same timed style.</p>
`,
  quiz: {
    title: "GRE quant warm-up: 6 questions",
    intro: "Pick one answer for each question, then press Check my score. Your score is worked out in your browser and is not sent anywhere.",
    questions: [
      { q: "Quantity A: 3/7. Quantity B: 0.4. Which is correct?", options: ["Quantity A is greater", "Quantity B is greater", "The two quantities are equal", "The relationship cannot be determined"], answer: 0, explain: "3 divided by 7 is about 0.43, which is more than 0.4. Or cross-multiply: 3 x 10 = 30 is greater than 7 x 4 = 28, so 3/7 is larger." },
      { q: "A jacket costs 800 after a 20% discount. What was the original price?", options: ["960", "1,000", "1,040", "1,600"], answer: 1, explain: "800 is 80% of the original price, so the original is 800 divided by 0.8, which is 1,000. The tempting 960 comes from adding 20% to 800, which gives the wrong base." },
      { q: "Given that x squared equals 49. Quantity A: x. Quantity B: 7.", options: ["Quantity A is greater", "Quantity B is greater", "The two quantities are equal", "The relationship cannot be determined"], answer: 3, explain: "x could be 7, making the quantities equal, or negative 7, making Quantity B greater. Two cases give different results, so the relationship cannot be determined." },
      { q: "The average of five numbers is 12. Four of them are 10, 11, 13 and 14. What is the fifth?", options: ["10", "11", "12", "13"], answer: 2, explain: "The total must be 5 x 12 = 60. The four known numbers add to 48, so the fifth is 60 minus 48, which is 12." },
      { q: "A rectangle has a perimeter of 30 and a length of 9. What is its area?", options: ["54", "45", "60", "135"], answer: 0, explain: "Length plus width is half the perimeter, so 15. The width is 15 minus 9, which is 6, and the area is 9 x 6 = 54." },
      { q: "In how many ways can you choose a team of 2 from 5 people, when the order does not matter?", options: ["20", "10", "5", "25"], answer: 1, explain: "Choose 2 from 5: (5 x 4) divided by (2 x 1) = 10. The 20 would count each pair twice, once for each order." },
    ],
  },
  faq: [
    { q: "How long is the GRE Quantitative Reasoning section?", a: "There are two quantitative sections: one with 12 questions in 21 minutes and one with 15 questions in 26 minutes. That makes 27 questions in 47 minutes. Your score is reported between 130 and 170." },
    { q: "Do I get a calculator on the GRE?", a: "Yes, an on-screen calculator is provided for the Quantitative Reasoning sections. It helps with arithmetic but slows you down if you lean on it, so practise estimating and simplifying first." },
    { q: "How many weeks should I spend on GRE quant preparation?", a: "Six weeks at about ninety minutes a day is a sensible target if your school maths is in decent shape. Add weeks if it has been a long time since you did algebra or if you want a very high score. Quality of review matters more than the number of hours." },
    { q: "Is the GRE section adaptive?", a: "It is adaptive between sections. How you perform in the first Quantitative section influences how difficult the second one is. Within a section you can move back and forth between questions." },
    { q: "What is the best way to practise quantitative comparison?", a: "Always test several kinds of numbers: positive, negative, fractions, zero and one. If two cases give different answers, the relationship cannot be determined. After each practice set, review the questions where you chose the wrong option and find the case you missed." },
  ],
  cta: {
    title: "Take a timed GRE Quant mock",
    text: "Each practice test has 27 questions and a 47-minute timer, with instant marking and an explanation for every question.",
    href: "/practice-tests/gre-quant",
    label: "Take a practice test",
  },
  related: [
    { label: "GRE Quant practice tests", href: "/practice-tests/gre-quant", note: "30 timed mocks of 27 questions each, covering every topic area." },
    { label: "All practice tests", href: "/practice-tests", note: "IELTS and GRE tests in one place." },
    { label: "Vedic Mathematics & Speed Calculation", href: "/courses/vedic-mathematics", note: "Faster mental arithmetic for percentages, fractions and squares." },
    { label: "Statistics for Analysts & Data Science", href: "/courses/statistics-for-analysts", note: "Averages, spread and probability for the data-analysis questions." },
    { label: "IELTS Reading practice tests", href: "/practice-tests/ielts-reading", note: "More timed practice if you are also preparing for an English test." },
  ],
};

export default post;
