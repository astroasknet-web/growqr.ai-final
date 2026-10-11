import type { LocalPost } from "../local";

const L = "/courses/digital-literacy-master"; // internal links stay relative so they work on every host
const course = (slug: string, label: string): string => `<a href="/courses/${slug}">${label}</a>`;

const post: LocalPost = {
  slug: "digital-literacy-quiz-with-answers",
  title: "Digital Literacy Quiz With Answers: 15 Free Questions for Students",
  seoTitle: "Digital Literacy Quiz With Answers: 15 Free Questions",
  description: "Take a free digital literacy quiz with answers: 15 questions on files, Excel, email, passwords and AI, each one explained. Check your score now.",
  focusKeyword: "digital literacy quiz",
  secondaryKeywords: ["basic computer skills test", "computer literacy quiz for students", "digital literacy questions and answers", "digital skills test"],
  category: "Digital Literacy",
  author: "Sachin Sharma",
  published: "2026-10-11 09:00:00",
  updated: "2026-10-11 09:00:00",
  excerpt: "A free 15-question digital literacy quiz for students. Every answer is explained, and each section points to the browser practice that fixes the gap.",
  cover: {
    src: "/blog/digital-literacy-quiz-with-answers.png",
    alt: "Digital literacy quiz with answers: a question card beside a document, a spreadsheet and a presentation slide",
    width: 1200,
    height: 630,
  },
  content: `
<p>Ask a Class 9 student who edits reels on her phone to put a total under a table of marks, and many will type the sum in by hand. They can use a device all day and still not know how a computer helps with real work. A good <strong>digital literacy quiz</strong> shows that gap without making anyone feel silly.</p>
<p>This one has 15 questions on files, documents, Excel, slides, email, passwords, the cloud and AI. Every answer comes with a short explanation, because a score on its own teaches you nothing. Take it cold first. Then read the sections below to see why the answers work.</p>
<p>Two things up front. It is a quick check, not a certificate. And it is free with no sign-up, so nobody is collecting your email for the privilege of marking your answers.</p>

<h2 id="what-it-tests">What a digital literacy quiz should actually test</h2>
<p>Most online tests ask vocabulary: what does RAM stand for, what is a CPU. You can memorise those in an evening and still be unable to format a letter. Digital literacy is the ability to find, judge, create and share information with digital tools, safely. Serious frameworks agree on that shape: they put "digital citizen" and "knowledge constructor" beside plain tool use. If the basics are the gap, ${course("basic-computer-internet-literacy", "Basic Computer and Internet Literacy")} is the gentlest place to start.</p>
<p>So this digital literacy quiz leans on situations. Which formula total is wrong. Which message is a scam. Which slide a classroom can actually read. The facts you need are small. The judgement is the point.</p>
<p>The honest limit: multiple choice cannot test typing speed, patience with a slow laptop, or whether you can build a spreadsheet from a blank sheet. For that you have to do the work, which is why the practice links come after the answers.</p>

<h2 id="skill-areas">The five skill areas behind the questions</h2>
<div class="table-wrap" role="region" tabindex="0" aria-label="The five skill areas and the questions that test them"><table>
<thead><tr><th>Area</th><th>Questions</th><th>You should be able to</th><th>The usual slip</th></tr></thead>
<tbody>
<tr><td>Computer basics and files</td><td>Q1 to Q3</td><td>Name what a device does, recognise file types, undo a mistake</td><td>Calling a scanner an output device</td></tr>
<tr><td>Documents, spreadsheets, slides</td><td>Q4 to Q8</td><td>Use heading styles, write SUM, IF and AVERAGE, keep slides readable</td><td>A SUM range that stops one cell short</td></tr>
<tr><td>Internet and email</td><td>Q9 and Q10</td><td>Read a web address, email a group without exposing everyone</td><td>Treating the padlock as proof a site is honest</td></tr>
<tr><td>Online safety</td><td>Q11 to Q13</td><td>Choose a strong password, handle a scam message, use two-step login</td><td>One clever password reused everywhere</td></tr>
<tr><td>Cloud and AI</td><td>Q14 and Q15</td><td>Know where files live, check what an AI tells you</td><td>Trusting an answer because it sounds fluent</td></tr>
</tbody></table></div>

<h2 id="quiz">Take the digital literacy quiz: 15 questions with answers</h2>
<!--quiz-->

<h2 id="mistakes">The three mistakes this quiz catches most</h2>
<p>Three slips are worth knowing before you retake any digital literacy quiz.</p>
<h3 id="range">The range that stops one cell short</h3>
<p>Question 5 looks too easy to get wrong. Five numbers, add them. The trap is the typed range. If the data sits in B2 to B6 and you write <code>=SUM(B2:B5)</code>, Excel does not complain. It hands back a tidy, confident total that is short by whatever sat in B6.</p>
<p>The fix is a habit, not a trick. After you press Enter, click the formula cell and look at the coloured border: it should wrap every number you meant. Then select the column and compare the total with the figure in the status bar. The ${course("basic-microsoft-excel", "Basic Microsoft Excel")} course drills the same range logic, and shows why a pass mark written as ">=40" includes a student who scored exactly 40.</p>

<h3 id="padlock">The padlock is not a verdict</h3>
<p>HTTPS means the connection between your browser and the site is encrypted. It says nothing about who runs the site. Scam pages get padlocks too, because certificates are cheap. Read the domain instead: a bank does not send you to an address with a free-mail name in it, or one with a stray digit such as paypa1.</p>
<p>No real bank asks for your OTP by message. If one arrives, do not reply. The ${course("cyber-hygiene-families", "Cyber Hygiene and Digital Safety for Families")} course walks through spotting phishing, handling OTP requests and what to do after a scam, step by step.</p>

<h3 id="headings">Headings that only look like headings</h3>
<p>A line made big and bold looks right on screen, but Word treats it as ordinary text. Apply a real Heading style and you get a navigation pane, a contents page in one click, and a document a screen reader can move through. On a six-page assignment that is the difference between scrolling and jumping.</p>
<p>The counterintuitive part: formatting by hand feels faster while you do it and costs you time at the end. Styles feel slow for the first ten minutes and then stop mattering.</p>

<h2 id="score">What your score means</h2>
<p>Be honest with your digital literacy quiz score. A 12 you earned beats a 15 you guessed.</p>
<div class="table-wrap" role="region" tabindex="0" aria-label="How to read your score"><table>
<thead><tr><th>Score</th><th>What it suggests</th><th>Your next step</th></tr></thead>
<tbody>
<tr><td>13 to 15</td><td>Solid everyday skills</td><td>Try the challenge activities: the report with a table, and the result analysis</td></tr>
<tr><td>9 to 12</td><td>Good base, a few gaps</td><td>Read the section for each question you missed, then do the matching practice</td></tr>
<tr><td>5 to 8</td><td>You know the ideas but not the habits</td><td>Start with computer basics and Word, and practise instead of rereading</td></tr>
<tr><td>0 to 4</td><td>A fresh start</td><td>Begin at module 1. There is no wrong place to start</td></tr>
</tbody></table></div>

<h2 id="practice">Turn the score into skill: free practice in your browser</h2>
<p>The course behind this digital literacy quiz, <a href="${L}/learn">Digital Literacy: learn by doing</a>, has 27 short activities that run in the browser, so you do not need Word or Excel installed. Pick by what you missed:</p>
<ul>
<li>Missed the spreadsheet questions: <a href="${L}/learn/ms-excel/a/s2-total-average">calculate total and average</a>. You type real formulas, and the checker tells you when a range is one cell short.</li>
<li>Missed the safety questions: <a href="${L}/learn/digital-safety/a/c6-phishing">spot the scam</a> and <a href="${L}/learn/digital-safety/a/c6-passwords">strong or weak password</a>.</li>
<li>Missed the document questions: <a href="${L}/learn/ms-word/a/w1-letter">write a formal letter</a> in the built-in editor.</li>
<li>Missed the slide question: <a href="${L}/learn/ms-powerpoint/a/p1-intro">introduce yourself in five slides</a>.</li>
</ul>
<p>One caveat. The automatic checks judge structure and content, such as whether a list has three items or a total uses SUM. They cannot judge taste, so ask a teacher or a friend to read the finished letter.</p>

<h3 id="plan">A four-week plan from quiz score to confidence</h3>
<p>Thirty to forty-five minutes a day is enough. The aim is a finished piece of work each week, not hours logged. Retake the digital literacy quiz at the end of week four and compare.</p>
<div class="table-wrap" role="region" tabindex="0" aria-label="The four-week plan"><table>
<thead><tr><th>Week</th><th>Focus</th><th>Do this</th><th>You are done when</th></tr></thead>
<tbody>
<tr><td>1</td><td>Basics and files</td><td><a href="${L}/learn/computer-basics">Module 1</a> and the two sorting activities</td><td>You can say where a file lives and why</td></tr>
<tr><td>2</td><td>Documents</td><td><a href="${L}/learn/ms-word">Module 2</a>: the letter and the r&eacute;sum&eacute;</td><td>Your r&eacute;sum&eacute; fits one page with real headings</td></tr>
<tr><td>3</td><td>Spreadsheets</td><td><a href="${L}/learn/ms-excel">Module 3</a>: total and average, then the budget</td><td>Your budget total is a formula, not a typed number</td></tr>
<tr><td>4</td><td>Safety, then slides</td><td><a href="${L}/learn/digital-safety">Module 6</a>, then a five-slide deck</td><td>You can explain two scam signs without notes</td></tr>
</tbody></table></div>
<p>If you want the reasoning behind good passwords and two-step login, the ${course("cyber-hygiene-families", "Cyber Hygiene course")} covers both, and ${course("cybersecurity-essentials", "Cybersecurity Essentials")} goes further once the basics are solid. For using AI tools without handing them private information, try ${course("ai-literacy-productivity", "AI Literacy and Everyday Productivity")}.</p>
`,
  quiz: {
    title: "Digital literacy quiz: 15 questions",
    intro: "Pick one answer for each question, then press Check my score. Your score is worked out in your browser and is not sent anywhere.",
    questions: [
      { q: "Which of these is an output device?", options: ["Keyboard", "Monitor", "Mouse", "Microphone"], answer: 1, explain: "A monitor shows you what the computer produces. The keyboard, mouse and microphone all send information in, so they are input devices." },
      { q: "A file called Budget.xlsx would normally open in which program?", options: ["Word", "PowerPoint", "Notepad", "Excel"], answer: 3, explain: "The .xlsx ending marks an Excel workbook. Word files end in .docx and PowerPoint files in .pptx." },
      { q: "You deleted a sentence by mistake. Which shortcut brings it back?", options: ["Ctrl + Z", "Ctrl + X", "Ctrl + V", "Ctrl + P"], answer: 0, explain: "Ctrl + Z is undo (Command + Z on a Mac). Ctrl + X cuts, Ctrl + V pastes and Ctrl + P prints." },
      { q: "Which gives a line a real heading that shows up in the navigation pane?", options: ["Making the line large and bold", "Typing the title in capital letters", "Applying the Heading 1 style", "Underlining the line"], answer: 2, explain: "Only a Heading style tells the program that the line is a heading. Large bold text just looks like one." },
      { q: "Cells B2 to B6 hold 10, 20, 30, 40 and 50. You type =SUM(B2:B5). What do you get?", options: ["150", "100", "An error message", "0"], answer: 1, explain: "The range stops at B5, so the 50 in B6 is left out. Excel shows 100 with no warning, which is why you check the range after you press Enter." },
      { q: "B2 contains 40. What does =IF(B2>=40,\"Pass\",\"Fail\") show?", options: ["Pass", "Fail", "40", "An error"], answer: 0, explain: "The test is 'greater than or equal to 40'. Exactly 40 meets it, so the result is Pass." },
      { q: "What does =AVERAGE(4,8,6) return?", options: ["18", "8", "6", "4"], answer: 2, explain: "4 + 8 + 6 = 18, and 18 divided by the three numbers is 6." },
      { q: "A slide has 12 lines of small text. What is the best fix?", options: ["Shrink the font so it all fits", "Cut it to a few short points and say the rest aloud", "Add more colours", "Add an animation"], answer: 1, explain: "People cannot read and listen at the same time. A few short points keep their eyes on you, and the detail goes in your voice." },
      { q: "A website address starts with https:// and shows a padlock. What does that tell you for certain?", options: ["The business running it is honest", "The site is approved by the government", "It cannot carry a virus", "The connection between you and the site is encrypted"], answer: 3, explain: "HTTPS protects the connection. It does not prove the site is honest, because scam sites can use it too." },
      { q: "You are emailing 40 parents about a meeting and do not want every address visible to everyone. Which field do you use?", options: ["To", "CC", "BCC", "Subject"], answer: 2, explain: "BCC (blind carbon copy) hides the addresses from the other recipients. Anyone in To or CC can see everyone else." },
      { q: "Which password is strongest?", options: ["Rahul@2005", "password123", "Qwerty!1", "blue-tiger-lamp-orbit-7"], answer: 3, explain: "Four unrelated words and a number make a long password that is easy to remember and hard to guess. The others use names, years or common patterns." },
      { q: "You get an SMS: 'Your bank account will be blocked today. Click the link and enter your OTP.' What should you do?", options: ["Click quickly before it is blocked", "Reply to ask if it is real", "Ignore the link and check with your bank's official app or number", "Forward it to friends with the link as a warning"], answer: 2, explain: "Pressure plus a link plus an OTP request is the classic scam pattern. Go to the bank through a route you already trust, and never share an OTP." },
      { q: "Two-step verification protects you because:", options: ["It makes your password longer", "A stolen password alone is not enough to log in", "It deletes old emails", "It hides your name"], answer: 1, explain: "The second step, such as a code on your phone, means a thief who has your password still cannot get in." },
      { q: "A file is saved in Google Drive. Which statement is true?", options: ["It disappears when your laptop is switched off", "Only the laptop that created it can see it", "You can open it from another device by signing in", "It can never be shared"], answer: 2, explain: "Cloud files live on the provider's servers, so any device where you sign in can reach them, and you choose who else can." },
      { q: "An AI chatbot gives you a statistic for your school project. What is the best next step?", options: ["Check it against a reliable source before using it", "Copy it straight into the project", "Ask the chatbot if it is sure and trust the reply", "Never use AI for anything"], answer: 0, explain: "AI tools can sound certain and still be wrong. Using one is fine, but you are responsible for checking the facts it gives you." },
    ],
  },
  faq: [
    { q: "How many questions should a good digital literacy test have?", a: "A good digital literacy quiz covers each skill area at least twice, so one lucky guess cannot hide a gap. For five areas, fifteen questions is a practical minimum for a self-check. Formal certifications run much longer and also test you on a live computer." },
    { q: "Is this quiz suitable for school students?", a: "Yes. The situations come from a Class 8 to Class 12 student's week: assignments, marks tables, school email and group chats. Adults returning to computers will find it useful too, and you do not need Office installed to answer." },
    { q: "Do you store my score or my answers?", a: "No. The quiz runs in your browser and the score is worked out on your device. Nothing you pick is sent to us." },
    { q: "What is the difference between digital literacy and computer literacy?", a: "Computer literacy is operating the machine and its programs. Digital literacy adds judging online information, staying safe, communicating and creating. This quiz leans digital because that is where people lose the most time and money." },
    { q: "What should I do if I score below 9?", a: "Do not reread the whole article. Find the two areas you missed in the table above and do the matching practice activity, then retake the digital literacy quiz in a week. A short, targeted practice session beats a long reading session." },
  ],
  cta: {
    title: "Practise every skill in this quiz, free",
    text: "Digital Literacy: learn by doing has 8 modules and 27 hands-on activities with a document editor, a spreadsheet and a slide studio built in. Nothing to install. Log in as a student to save your work and earn badges.",
    href: `${L}/learn`,
    label: "Start the free course",
  },
  related: [
    { label: "Digital Literacy Master Course", href: "/courses/digital-literacy-master", note: "The course this quiz is built on: 8 modules and 27 hands-on activities, from files and documents to safety and AI." },
    { label: "Basic Computer & Internet Literacy", href: "/courses/basic-computer-internet-literacy", note: "Start here if you missed the questions on files, folders, browsers and the cloud." },
    { label: "Basic Microsoft Excel", href: "/courses/basic-microsoft-excel", note: "Practice for the SUM, range and IF questions, then build your own sheets." },
    { label: "Microsoft Word: Professional Documents", href: "/courses/microsoft-word", note: "Covers the document questions: headings, styles, lists and a clean layout." },
    { label: "PowerPoint & Presentation Design", href: "/courses/powerpoint-presentation-design", note: "For the slide questions: one idea per slide, readable text and good structure." },
    { label: "Cyber Hygiene & Digital Safety for Families", href: "/courses/cyber-hygiene-families", note: "Passwords, phishing, OTP scams and safe browsing, the area most people lose marks on." },
    { label: "AI Literacy & Everyday Productivity", href: "/courses/ai-literacy-productivity", note: "Using AI tools sensibly and checking what they tell you." },
  ],
};

export default post;
