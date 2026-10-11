import type { LocalPost } from "../local";

const course = (slug: string, label: string): string => `<a href="/courses/${slug}">${label}</a>`;
const test = (path: string, label: string): string => `<a href="/practice-tests/${path}">${label}</a>`;
const wrap = (label: string, table: string): string => `<div class="table-wrap" role="region" tabindex="0" aria-label="${label}">${table}</div>`;

const post: LocalPost = {
  slug: "ielts-reading-tips",
  title: "IELTS Reading Tips: How to Finish All 40 Questions in 60 Minutes",
  seoTitle: "IELTS Reading Tips: Finish All 40 Questions in 60 Minutes",
  description: "IELTS reading tips that work: plan your 60 minutes, beat True, False and Not Given, avoid trap answers, then check yourself. Take a timed practice test.",
  focusKeyword: "ielts reading tips",
  secondaryKeywords: ["ielts reading true false not given", "ielts academic reading strategy", "how to finish ielts reading on time", "ielts reading band score"],
  category: "IELTS",
  author: "Sachin Sharma",
  published: "2026-10-12 15:00:00",
  updated: "2026-10-12 15:00:00",
  excerpt: "IELTS reading tips for the clock and for the question types that cost the most marks, with a quiz you can take inside the article and a way to turn your raw score into a band estimate.",
  cover: {
    src: "/blog/ielts-reading-tips.png",
    alt: "IELTS reading tips: a practice question about True, False and Not Given beside a quote mark and a clock",
    width: 1200,
    height: 630,
  },
  coverStyle: { art: "docs", footer: "Practice: IELTS Reading tests", chips: ["Beat the clock", "Practice quiz inside"] },
  content: `
<p>Here is a pattern that shows up in almost every IELTS Reading class. A student reads the first passage slowly, understands everything, and answers well. The second passage goes fine too. Then the third, the hardest, arrives with fifteen minutes left and half the marks are lost to the clock. The English was never the problem. The plan was. These <strong>IELTS reading tips</strong> are about the plan: how to spend 60 minutes and 40 questions, and how to stop three question types from quietly costing you a band.</p>
<p>A short quiz sits in the middle of the article so you can test the ideas on the spot. Everything in these IELTS reading tips applies to the Academic test. General Training uses the same question types but easier texts and a different scoring table.</p>

<h2 id="the-clock">IELTS reading tips for the clock: how to spend 60 minutes</h2>
<p>The test has three passages, 40 questions and exactly 60 minutes. Nobody gives you extra time at the end to copy your answers, so write them on the answer sheet as you go. Each correct answer is worth one mark, and wrong answers lose nothing. That last fact changes how you behave: never leave a blank.</p>
${wrap("A time plan for the three IELTS Reading passages", `<table>
<thead><tr><th>Passage</th><th>Suggested time</th><th>Why</th></tr></thead>
<tbody>
<tr><td>1</td><td>About 17 minutes</td><td>Usually the easiest, so bank the marks quickly</td></tr>
<tr><td>2</td><td>About 20 minutes</td><td>Longer, with more matching and heading questions</td></tr>
<tr><td>3</td><td>About 23 minutes</td><td>The densest text and the most opinion-based questions</td></tr>
</tbody></table>`)}
<p>Now the habit that surprises people: do not read the whole passage first. Read the title, the headings and the first line of each paragraph for about a minute, to learn how the text is organised. Then read the questions and go hunting for the answers. Reading every word first feels thorough, but it burns five minutes you do not have.</p>
<p>There is an honest exception. For matching headings you need the main idea of each paragraph, so read those paragraphs more fully. And if a question stumps you for more than about a minute, write a guess, put a mark beside it and move on. You can return if time allows.</p>
<p>For most question types the answers appear in the passage in the same order as the questions. Use that. If question 7 is answered in paragraph B, then question 8 will not be hiding in paragraph A.</p>

<h3 id="last-minutes">What to do in the last five minutes</h3>
<p>Count your blanks. Fill every one, even with a guess. Then check the answers you were least sure of, starting with any you marked, and compare your spelling against the passage. Many of the best IELTS reading tips come down to this: protect the easy marks you already earned before chasing a hard one.</p>
<p>Do not leave a blank.</p>

<h2 id="tfng">IELTS reading tips for True, False and Not Given</h2>
<p>This is the question type that costs the most marks, and it confuses native speakers as well. The statement is compared with the passage, and you choose one of three answers.</p>
${wrap("How True, False and Not Given work", `<table>
<thead><tr><th>Answer</th><th>Meaning</th><th>Example</th></tr></thead>
<tbody>
<tr><td>True</td><td>The passage says the same thing, in different words</td><td>Passage: the museum opened in 1998. Statement: the museum opened in the late 1990s.</td></tr>
<tr><td>False</td><td>The passage says the opposite</td><td>Passage: most of the group studied in London. Statement: all of the group studied in London.</td></tr>
<tr><td>Not Given</td><td>The passage does not say either way</td><td>Passage: the method was published in 2010. Statement: the method was tested on children.</td></tr>
</tbody></table>`)}
<p>Two rules cover most of the trouble. First, answer only from the passage, never from what you happen to know. If you know the statement is true in real life but the passage is silent, the answer is Not Given. Second, watch the small words. All, most, some, only, always, never and may each change the meaning, and the examiner builds False answers out of them.</p>
<p>Yes, No and Not Given questions work the same way, except the statement is about the writer's opinion or claims rather than facts.</p>

<h2 id="quiz">Check yourself: a six-question IELTS reading warm-up</h2>
<p>These test the habits above, not your vocabulary. Answer first, then read the explanation for each one, including those you got right.</p>
<!--quiz-->

<h2 id="traps">IELTS reading tips for spelling, word limits and trap answers</h2>
<p>You can understand the passage perfectly and still lose marks on how you write the answer. Three things to check every time.</p>
<h3 id="word-limit">Respect the word limit</h3>
<p>If the instruction says NO MORE THAN TWO WORDS AND/OR A NUMBER, then three words is wrong even if the idea is right. A hyphenated word counts as one. Copy words exactly as they appear in the passage and never change them to fit your own grammar.</p>
<h3 id="spelling">Spelling counts</h3>
<p>A misspelt correct answer earns nothing. The word is printed in the passage, so copy it letter for letter. Check singular and plural, because the question's grammar will tell you which fits.</p>
<h3 id="paraphrase">Expect paraphrase, not copying</h3>
<p>The wrong answers are often the words that match the question most closely. The right answer usually says the same thing in different words. If you find a sentence that repeats the question word for word, be suspicious and read the sentence next to it.</p>

<p>Vocabulary quietly sits under every item on this list. The test rewards students who recognise a synonym instantly, because the question and the passage almost never use the same word. Keep a notebook of paraphrases you meet in practice: <em>rise</em> and <em>increase</em>, <em>cause</em> and <em>lead to</em>, <em>most</em> and <em>the majority</em>. Ten minutes a day with that notebook helps more than a long weekend cram.</p>

<h2 id="routine">A practice routine that raises your IELTS reading band</h2>
<p>Take a full timed test once a week, in one sitting, with no pauses. Then spend more time reviewing than you did testing. For every wrong answer, write down why: you ran out of time, you did not know a word, you misread the statement, or you fell for a trap. These IELTS reading tips only pay off with repetition. After three tests the same one or two reasons will keep appearing, and those are your real study list.</p>
<p>You can turn a raw score into a rough band. The table below is for Academic Reading and is only an estimate, because the exact conversion changes between test versions.</p>
${wrap("Approximate raw score to band for IELTS Academic Reading", `<table>
<thead><tr><th>Correct answers out of 40</th><th>Approximate band</th></tr></thead>
<tbody>
<tr><td>39 to 40</td><td>9</td></tr>
<tr><td>35 to 36</td><td>8</td></tr>
<tr><td>30 to 32</td><td>7</td></tr>
<tr><td>27 to 29</td><td>6.5</td></tr>
<tr><td>23 to 26</td><td>6</td></tr>
<tr><td>19 to 22</td><td>5.5</td></tr>
<tr><td>15 to 18</td><td>5</td></tr>
</tbody></table>`)}
<p>This site has 30 full ${test("ielts-reading", "IELTS Reading practice tests")}, each with 40 questions and a 60-minute timer, marked instantly with an indicative band and an explanation for every answer. If your listening is the weaker skill, try the ${test("ielts-listening", "IELTS Listening practice tests")} as well. For lessons on strategy and all four skills, see the ${course("ielts-toefl-prep", "IELTS / TOEFL Preparation course")}.</p>
`,
  quiz: {
    title: "IELTS reading warm-up: 6 questions",
    intro: "Pick one answer for each question, then press Check my score. Your score is worked out in your browser and is not sent anywhere.",
    questions: [
      { q: "The passage says: 'Most of the group studied in London.' The statement says: 'All of the group studied in London.' What is the answer?", options: ["True", "Not Given", "False", "Yes"], answer: 2, explain: "'Most' and 'all' are different, so the statement contradicts the passage. That makes it False. Yes and No belong to opinion questions, not True/False/Not Given." },
      { q: "The passage never says whether the writer tested the method. The statement says the writer tested the method. What is the answer?", options: ["Not Given", "False", "True", "Yes"], answer: 0, explain: "Silence in the passage means Not Given. It would only be False if the passage said the writer did not test it." },
      { q: "How many marks is each correct answer worth in IELTS Reading?", options: ["It depends on how hard the question is", "Two", "Half a mark", "One"], answer: 3, explain: "Every question is worth one mark, and wrong answers lose nothing. That is why you should never leave an answer blank." },
      { q: "You finish passage 1 in 28 minutes. What is the best adjustment?", options: ["Spend longer on passage 1 so it is perfect", "Speed up on passages 2 and 3, because passage 3 usually needs the most time", "Skip passage 3", "Guess the remaining answers"], answer: 1, explain: "You have 60 minutes in total and no time to transfer answers. Recover the minutes you overspent by moving faster through the later passages, which are harder." },
      { q: "Which is the quickest way to find the answer to a sentence-completion question?", options: ["Read the whole passage again", "Read the last paragraph first", "Find the question's keywords in the passage, then read around them", "Look for the longest paragraph"], answer: 2, explain: "Scan for the keywords or their synonyms, then read the sentences around them closely. Rereading everything wastes time." },
      { q: "You are not sure of an answer. What should you do?", options: ["Leave it blank, because wrong answers lose marks", "Leave it blank and return to it after the test", "Leave blanks only in matching questions", "Write your best guess, because there is no negative marking"], answer: 3, explain: "There is no penalty for a wrong answer in IELTS, so a guess can only help you." },
    ],
  },
  faq: [
    { q: "How many passages and questions are in IELTS Reading?", a: "There are three passages with 40 questions in total, to be completed in 60 minutes. Each question is worth one mark. Academic and General Training have the same layout but different texts." },
    { q: "Is there negative marking in IELTS Reading?", a: "No. A wrong answer scores the same as a blank, which is zero. That is why you should write an answer for every question, even if you have to guess." },
    { q: "Why is True, False and Not Given so hard?", a: "Because the difference between False and Not Given is subtle. False means the passage contradicts the statement, while Not Given means the passage does not address it at all. Many students let their own knowledge decide, which is how they lose marks." },
    { q: "How many correct answers do I need for band 7?", a: "On the Academic test, roughly 30 correct answers out of 40 gives band 7, though the exact table varies between test versions. General Training needs a few more correct answers for the same band, so check the table for the version you are sitting." },
    { q: "Can I write on the question paper in a paper-based test?", a: "Yes, you can underline and annotate the question booklet. Only the answer sheet is marked, and you are not given extra time to copy answers across, so write on the answer sheet as you go." },
  ],
  cta: {
    title: "Practise under real conditions",
    text: "Take a full 40-question reading test with a 60-minute timer. You get an indicative band and an explanation for every answer.",
    href: "/practice-tests/ielts-reading",
    label: "Take a practice test",
  },
  related: [
    { label: "IELTS Reading practice tests", href: "/practice-tests/ielts-reading", note: "30 timed tests of 40 questions each, marked instantly with an indicative band." },
    { label: "IELTS Listening practice tests", href: "/practice-tests/ielts-listening", note: "Four sections, played once, for the other half of your preparation." },
    { label: "IELTS / TOEFL Preparation", href: "/courses/ielts-toefl-prep", note: "A six-module course covering strategy for all four skills." },
    { label: "Spoken English & Accent Neutralization", href: "/courses/spoken-english", note: "Build fluency for the Speaking test." },
    { label: "All practice tests", href: "/practice-tests", note: "IELTS and GRE tests in one place." },
  ],
};

export default post;
