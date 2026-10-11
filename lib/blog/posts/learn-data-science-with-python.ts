import type { LocalPost } from "../local";

const course = (slug: string, label: string): string => `<a href="/courses/${slug}">${label}</a>`;
const wrap = (label: string, table: string): string => `<div class="table-wrap" role="region" tabindex="0" aria-label="${label}">${table}</div>`;

const post: LocalPost = {
  slug: "learn-data-science-with-python",
  title: "Learn Data Science With Python: A Realistic 12-Week Plan for Beginners",
  seoTitle: "Learn Data Science With Python: A Realistic 12-Week Plan",
  description: "Learn data science with python in 12 weeks: what to study each phase, the mistakes that stall beginners, and a short quiz to test yourself. Start now.",
  focusKeyword: "learn data science with python",
  secondaryKeywords: ["data science roadmap for beginners", "python for data science", "pandas and scikit-learn", "data science study plan"],
  category: "Data Science",
  author: "Sachin Sharma",
  published: "2026-10-12 09:00:00",
  updated: "2026-10-12 09:00:00",
  excerpt: "A 12-week plan to learn data science with Python: what to study in what order, the three mistakes that stall beginners, and a six-question check you can take inside the article.",
  cover: {
    src: "/blog/learn-data-science-with-python.png",
    alt: "Learn data science with Python: a code window and a practice question about splitting data into training and test sets",
    width: 1200,
    height: 630,
  },
  coverStyle: { art: "code", footer: "Course: Data Science using Python", chips: ["A 12-week plan", "Practice quiz inside"] },
  content: `
<p>Picture someone who has finished a Python course, written a few loops and a calculator, and then opens a real spreadsheet of 50,000 rows. Nothing in the course prepared them for it. They close the laptop. This is where most people who try to <strong>learn data science with Python</strong> quietly stop, and it is almost never about talent. It is about the order they learned things in.</p>
<p>This guide gives you an order that works if you want to learn data science with Python without burning out: twelve weeks, five phases, one small project at the end. It is honest about what twelve weeks buys you, which is the ability to take a messy dataset from raw file to a model you can explain. It does not buy you a job offer on its own. Somewhere in the middle there is a short quiz to test yourself, because reading about data science and doing it are different skills.</p>

<h2 id="what-it-means">What it means to learn data science with Python, and what it does not</h2>
<p>Data science is the work of answering questions with data. Python is the tool most people use for it, mainly because of four libraries: NumPy for fast arrays of numbers, pandas for tables, Matplotlib for charts and scikit-learn for machine learning. Learn those four well and you can do most of what a junior analyst or data scientist does in a week.</p>
<p>Here is the part that surprises beginners. The modelling, the bit everyone imagines, is a small slice of the job. Most of the hours go on getting data into a usable shape: fixing types, finding missing values, joining tables that do not quite match. If you plan to learn data science with Python and expect to spend your days tuning neural networks, you will be disappointed in the first month and bored by the second.</p>
<p>A typical week looks like this: a lesson, an hour of exercises, then a stubborn bug that eats your Thursday evening. That is normal.</p>
<p>How much maths do you need? School algebra, comfortable arithmetic with averages and percentages, and a willingness to learn basic statistics as you go. Calculus helps later for understanding why models train the way they do, but nobody needs it to start.</p>

<h2 id="the-plan">A 12-week plan to learn data science with Python</h2>
<p>The plan below assumes about ten hours a week. It follows the first five modules of the ${course("data-science-python", "Data Science using Python course")}, then ends with a project you build yourself. The full course has eleven modules and roughly 160 hours, so treat these twelve weeks as the foundation, not the whole building.</p>
${wrap("A 12-week plan to learn data science with Python", `<table>
<thead><tr><th>Weeks</th><th>Focus</th><th>What you should be able to show</th></tr></thead>
<tbody>
<tr><td>1 to 2</td><td>Scientific Python and the maths you need</td><td>A script that reads numbers, loops over them and plots a result with NumPy and Matplotlib</td></tr>
<tr><td>3 to 4</td><td>Data wrangling with pandas</td><td>A messy CSV turned into a clean table: types fixed, blanks handled, two files merged</td></tr>
<tr><td>5 to 6</td><td>Exploratory analysis and visualisation</td><td>Five charts that each answer a question, with a sentence under each saying what you learned</td></tr>
<tr><td>7 to 8</td><td>Statistics and probability</td><td>You can explain a confidence interval and a p-value without reading the definition</td></tr>
<tr><td>9 to 10</td><td>Machine learning foundations</td><td>A baseline model and a better one, compared on data the model never saw</td></tr>
<tr><td>11 to 12</td><td>Your own project, written up</td><td>One dataset taken from question to conclusion, in a notebook someone else can follow</td></tr>
</tbody></table>`)}
<p>Block out two sessions a week of two or three hours each. Short daily bursts also work, provided every session ends with you running code and not just reading about it.</p>
<h3 id="stats-first">Why statistics comes before machine learning</h3>
<p>Many courses jump to models in week three because models are exciting. Resist that. A model is a statistical claim about data, and if you cannot judge whether the data supports the claim, you will produce confident nonsense. When you learn data science with Python, the maths is not a gate you clear first and then forget. It is something you learn in context. Spend the two weeks on distributions, sampling and hypothesis testing. It pays off the moment you meet your first model that scores well on paper and fails on new data.</p>
<p>That is the whole trick.</p>
<p>After week twelve the course continues into deep learning, language processing, forecasting and deployment. Do not rush towards those. A person who can wrangle data and build a sound baseline is more useful than one who has copied a neural network from a tutorial.</p>

<h2 id="quiz">Check yourself: a six-question data science warm-up</h2>
<p>Try these cold, before you read the explanations. They cover the habits the plan above is trying to build: handling blanks, choosing the right tool, and not fooling yourself with a good-looking score.</p>
<!--quiz-->

<h2 id="mistakes">Three mistakes that stall people who learn data science with Python</h2>
<p>None of these is about intelligence. All three are habits, and habits can be changed.</p>
<h3 id="tutorial-loop">Copying notebooks instead of asking questions</h3>
<p>Following a tutorial feels like progress because everything works. The trouble is that the tutorial chose the dataset, the question and the method for you, and those three choices are the actual skill. After each lesson, change one of them: swap the dataset, ask a different question, or try a second method and compare.</p>
<h3 id="accuracy-trap">Trusting a single accuracy number</h3>
<p>Imagine a fraud model that is right 99 times out of 100. Sounds excellent until you learn that only 1 transaction in 100 is fraud. A model that always says "not fraud" scores exactly that. Always look at what the model gets wrong, and compare it against a dull baseline before you celebrate.</p>
<h3 id="leakage">Letting the test data leak in</h3>
<p>The test set exists to tell you the truth about new data. Anything you do using the whole dataset before splitting, such as scaling, filling blanks with the overall average or picking features, lets information from the test rows seep into training. Your score then looks better than it will ever be in use. Split first, then fit every step on the training portion only. Scikit-learn pipelines exist precisely to make this automatic.</p>

<h2 id="practise">How to practise so it sticks</h2>
<p>Pick one dataset you care about, such as cricket scores, local rainfall, or the marks data your school keeps, and take it through the whole loop: frame a question, clean the data, explore it, model it, test it honestly and write up what you found. The course capstone follows the CRISP-DM lifecycle for the same reason, because real projects run in that loop and not in separate lessons.</p>
<p>The best way to learn data science with Python is to build something small that is slightly beyond you, then finish it. A finished small project teaches more than three abandoned big ones.</p>
<p>Write the result as if a stranger will read it. Short notebook, plain headings, a chart for each claim, and a final paragraph on what you would do next and what could be wrong. That write-up is also your first portfolio piece. If you want company while you learn, the sister course on ${course("data-analytics-python", "Data Analytics using Python")} covers SQL and reporting, and ${course("statistics-for-analysts", "Statistics for Analysts and Data Science")} goes deeper on the maths from weeks seven and eight.</p>
<h3 id="stuck">What to do when you are stuck</h3>
<p>Everybody gets stuck, and the first hour of confusion is part of the work. Read the error message from the bottom up, because the last line usually names the real problem. Shrink the example until the bug has nowhere to hide: three rows of data instead of 50,000. If that does not help, write down the question as if you were posting it on a forum. About half the time, the act of writing it out shows you the answer.</p>
<p>Keep it small.</p>
`,
  quiz: {
    title: "Data science warm-up: 6 questions",
    intro: "Pick one answer for each question, then press Check my score. Your score is worked out in your browser and is not sent anywhere.",
    questions: [
      { q: "You load a CSV and find that 8 rows have a blank age. What is the sensible first step?", options: ["Delete the whole column", "Find out why they are blank, then decide to fill, drop or flag them", "Fill every blank with 0", "Ignore it, because models cope with blanks"], answer: 1, explain: "A blank can mean 'not asked', 'not recorded' or 'unknown', and each needs different handling. Filling with 0 would invent a newborn, and deleting the column throws away good data." },
      { q: "Which Python library is the usual home for tables of data with labelled rows and columns?", options: ["Matplotlib", "NumPy", "scikit-learn", "pandas"], answer: 3, explain: "pandas gives you the DataFrame, a table you can filter, group and join. NumPy holds the numbers underneath, Matplotlib draws charts and scikit-learn builds models." },
      { q: "A fraud model is 99% accurate, and only 1% of transactions are fraud. What should you suspect first?", options: ["It says 'not fraud' almost every time, so accuracy hides the problem", "The dataset is too small", "Python is the wrong language", "Nothing, 99% is excellent"], answer: 0, explain: "Always answering 'not fraud' also scores 99%. With imbalanced classes you need to look at recall and precision for the rare class, not accuracy alone." },
      { q: "Why do you split data into training and test sets?", options: ["To make training faster", "To make the model more complex", "To measure performance on data the model has not seen", "To remove outliers"], answer: 2, explain: "A model can memorise its training data. The test set is the honest exam: rows the model never saw during training." },
      { q: "You scale the full dataset and then split it into train and test. What went wrong?", options: ["Nothing, that is standard practice", "Information from the test rows leaked into the scaling, so your score looks better than it should", "The training set is now too small", "Scaling should never be used"], answer: 1, explain: "The scaling used the mean and spread of all rows, including the test rows. Split first, learn the scaling from the training rows only, then apply it to the test rows." },
      { q: "Which question suits a regression model?", options: ["Is this email spam?", "Which group does this customer belong to?", "Which of these images shows a cat?", "What price will this house sell for?"], answer: 3, explain: "Regression predicts a number. Spam, customer groups and image labels are categories, which are classification or clustering problems." },
    ],
  },
  faq: [
    { q: "How long does it take to learn data science with Python?", a: "Twelve focused weeks at about ten hours a week gets you to a first end-to-end project. If you only have five hours a week, double the timeline. Becoming job-ready usually takes several months more, because you need a few projects, some SQL and practice explaining your work. The full Data Science using Python course is about 160 hours." },
    { q: "Do I need a maths degree?", a: "No. School algebra and comfort with averages and percentages are enough to begin, and you pick up statistics as part of the plan. Calculus and linear algebra help later, once you want to understand why models train the way they do." },
    { q: "Should I learn pandas before machine learning?", a: "Yes, and the order matters. Most real projects spend far more time cleaning and reshaping data than modelling it, so pandas is the skill you will use every day. Models built on badly prepared data are the most common source of wrong answers." },
    { q: "Is Python or R better for a beginner?", a: "Both work, but Python has the wider job market and is useful outside data science, for web apps, automation and scripting. R is strong in academic statistics. If you are unsure, start with Python and revisit R later if your field uses it." },
    { q: "Can I do this on a laptop without a powerful graphics card?", a: "Yes. Everything in the first five modules runs comfortably on an ordinary laptop. A graphics card only starts to matter for large deep-learning projects, and cloud notebooks can cover those when you reach them." },
  ],
  cta: {
    title: "Turn this plan into a portfolio project",
    text: "Data Science using Python has 11 modules, hands-on exercises with a quiz after every module, and a capstone that follows the CRISP-DM lifecycle.",
    href: "/courses/data-science-python",
    label: "See the course",
  },
  related: [
    { label: "Data Science using Python", href: "/courses/data-science-python", note: "The 11-module course this plan follows, ending in a full capstone project." },
    { label: "Data Analytics using Python", href: "/courses/data-analytics-python", note: "A gentler route that adds SQL and reporting, good if you want an analyst role first." },
    { label: "Programming Foundations with Python", href: "/courses/python-foundations", note: "Start here if loops and functions still feel shaky before you touch pandas." },
    { label: "Statistics for Analysts & Data Science", href: "/courses/statistics-for-analysts", note: "Goes deeper on the statistics in weeks seven and eight." },
    { label: "Machine Learning with Python", href: "/courses/machine-learning-python", note: "A focused follow-up on models, evaluation and avoiding leakage." },
    { label: "Git & GitHub for Developers", href: "/courses/git-github", note: "Put your project online so employers can see it." },
  ],
};

export default post;
