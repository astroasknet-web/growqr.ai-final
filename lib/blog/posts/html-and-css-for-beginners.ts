import type { LocalPost } from "../local";

const course = (slug: string, label: string): string => `<a href="/courses/${slug}">${label}</a>`;
const wrap = (label: string, table: string): string => `<div class="table-wrap" role="region" tabindex="0" aria-label="${label}">${table}</div>`;

const post: LocalPost = {
  slug: "html-and-css-for-beginners",
  title: "HTML and CSS for Beginners: Build Your First Responsive Web Page, Step by Step",
  seoTitle: "HTML and CSS for Beginners: Build Your First Responsive Page",
  description: "HTML and CSS for beginners: build a responsive page from a real example, learn the box model and flexbox, then test yourself. Try the live playground.",
  focusKeyword: "html and css for beginners",
  secondaryKeywords: ["how to build a website with html and css", "css box model", "flexbox for beginners", "responsive web design basics"],
  category: "Web Development",
  author: "Sachin Sharma",
  published: "2026-10-12 13:00:00",
  updated: "2026-10-12 13:00:00",
  excerpt: "HTML and CSS for beginners, with code you can copy: build a small page, fix the three layout problems that trip everyone up, and check what you learned with a six-question quiz.",
  cover: {
    src: "/blog/html-and-css-for-beginners.png",
    alt: "HTML and CSS for beginners: a browser window with a page layout beside a practice question about the CSS box model",
    width: 1200,
    height: 630,
  },
  coverStyle: { art: "web", footer: "Course: HTML & CSS Academy", chips: ["Code you can copy", "Practice quiz inside"] },
  content: `
<p>You type a heading, save the file, refresh the browser, and the text is jammed against the left edge of the screen. You add a picture and it spills off the side of your phone. Nobody warns you about this when you start. Almost everyone who tries <strong>HTML and CSS for beginners</strong> tutorials hits the same three or four layout problems in the first week, and almost every one of them has a short, learnable fix.</p>
<p>This guide to HTML and CSS for beginners builds one small page from nothing, explains each decision, and then shows you how to fix the problems that trip people up. You can copy the code and run it in any browser. There is a short quiz in the middle to check that it has stuck.</p>

<h2 id="two-jobs">HTML and CSS for beginners: two languages, two different jobs</h2>
<p>HTML describes what things are. This is a heading, this is a paragraph, this is a list of links, this is a picture. CSS describes how those things look: colours, spacing, size, position. Keeping the two jobs apart is the single most useful idea in web design, and it is why you can change a whole site's look without touching its content.</p>
<p>The order matters in HTML and CSS for beginners projects, too. Write the HTML first and look at it with no styling at all. If it already reads sensibly, with sensible headings and a clear order, you are building on solid ground. If you reach for CSS to rescue a page that is a heap of identical boxes, the problems will follow you.</p>
<p>JavaScript is a third language that makes pages react to clicks. You do not need it yet. Learn HTML and CSS for beginners first, and add behaviour afterwards with a course like ${course("front-end-development", "Front-End Development")}.</p>

<h2 id="first-page">Build your first page: the HTML</h2>
<p>Save this as <code>index.html</code>. It has a header, a main area with two sections, and a footer. Those words are real HTML tags, and they tell browsers and screen readers what each part is for.</p>
<pre><code>&lt;!DOCTYPE html&gt;
&lt;html lang="en"&gt;
&lt;head&gt;
  &lt;meta charset="utf-8"&gt;
  &lt;meta name="viewport" content="width=device-width, initial-scale=1"&gt;
  &lt;title&gt;My Study Page&lt;/title&gt;
  &lt;link rel="stylesheet" href="style.css"&gt;
&lt;/head&gt;
&lt;body&gt;
  &lt;header&gt;
    &lt;h1&gt;My Study Page&lt;/h1&gt;
    &lt;nav&gt;&lt;a href="#plan"&gt;Plan&lt;/a&gt; &lt;a href="#goals"&gt;Goals&lt;/a&gt;&lt;/nav&gt;
  &lt;/header&gt;
  &lt;main&gt;
    &lt;section id="plan"&gt;
      &lt;h2&gt;This week's plan&lt;/h2&gt;
      &lt;p&gt;Two hours of maths each evening.&lt;/p&gt;
    &lt;/section&gt;
    &lt;section id="goals"&gt;
      &lt;h2&gt;My goals&lt;/h2&gt;
      &lt;img src="goal.jpg" alt="A notebook with a list of goals" width="600" height="400"&gt;
    &lt;/section&gt;
  &lt;/main&gt;
  &lt;footer&gt;&lt;p&gt;Made by me&lt;/p&gt;&lt;/footer&gt;
&lt;/body&gt;
&lt;/html&gt;</code></pre>
<h3 id="why-semantic">Why the tags and the alt text matter</h3>
<p>You could build the same page with nothing but <code>div</code> tags and it would look identical. It would be worse in every other way. Screen readers use <code>nav</code> and <code>main</code> to let people jump around. Search engines use headings to understand the page. And the <code>alt</code> text on the image is what a blind user hears and what shows if the file fails to load. The <code>width</code> and <code>height</code> attributes reserve the space so the page does not jump while the image arrives.</p>
<p>Check each page with one question: could someone understand it without seeing it?</p>

<h2 id="three-ideas">The three CSS ideas that fix most layout problems</h2>
<p>Add a file called <code>style.css</code> next to the HTML. These dozen lines solve the problems from the start of this guide.</p>
<pre><code>*, *::before, *::after { box-sizing: border-box; }
body { font-family: system-ui, sans-serif; line-height: 1.6; margin: 0; }
img { max-width: 100%; height: auto; }
header, main, footer { padding: 1rem; max-width: 60rem; margin: 0 auto; }
nav { display: flex; gap: 1rem; }
main { display: grid; gap: 1.5rem; }
@media (min-width: 48rem) {
  main { grid-template-columns: 1fr 1fr; }
}</code></pre>
<p>Every good lesson in HTML and CSS for beginners reaches this point sooner or later. The first line is the one almost every professional stylesheet starts with. By default a box that is 200 pixels wide becomes wider once you add padding and a border, which is why layouts mysteriously overflow. Setting <code>box-sizing: border-box</code> makes the width include them, so 200 means 200. Learn the box model of content, padding, border and margin and you will understand most spacing bugs.</p>
<p>The <code>img</code> rule stops pictures spilling off a small screen. The <code>nav</code> rule uses flexbox, which lines items up in a row and spaces them for you. The last block is mobile-first design: the base styles suit a phone, and the media query adds a second column only when the screen is at least 48rem wide.</p>
<p>When should you pick grid over flexbox? Use flexbox when you are arranging items in one line, such as a menu. Use grid when you are arranging in rows and columns together, such as a page layout. Many real pages use both.</p>
${wrap("Common layout problems and their usual fixes", `<table>
<thead><tr><th>What you see</th><th>Usual cause</th><th>Fix</th></tr></thead>
<tbody>
<tr><td>A box is wider than the width you set</td><td>Padding and border added on top of the width</td><td>box-sizing: border-box</td></tr>
<tr><td>An image runs off the side of a phone</td><td>The image is wider than the screen</td><td>max-width: 100%; height: auto</td></tr>
<tr><td>Text touches the edge of the screen</td><td>No padding on the container</td><td>Add padding to the container, not margins to each child</td></tr>
<tr><td>Items will not sit side by side</td><td>They are block elements</td><td>display: flex on the parent</td></tr>
<tr><td>The page looks tiny on a phone</td><td>Missing viewport meta tag</td><td>Add the viewport tag from the HTML above</td></tr>
</tbody></table>`)}

<h2 id="quiz">Check yourself: a six-question HTML and CSS warm-up</h2>
<p>Answer before you read the explanations. If you build the page above and keep the table open beside you, the answers will feel familiar.</p>
<!--quiz-->

<h2 id="practise">How to practise HTML and CSS for beginners without getting stuck</h2>
<p>Open your browser's developer tools by right-clicking any element and choosing Inspect. You can see the box model drawn around the element, switch rules on and off, and change values live. It is the fastest way to find out why something looks wrong, and professionals use it daily.</p>
<p>Then rebuild a page you like, such as a school website or a simple shop front, from the top down. Do not copy its code. Look at it, break it into header, main and footer, and write the HTML yourself, then style it. You will get things wrong. That is the point.</p>
<p>Three habits to avoid: building everything from <code>div</code> tags, setting fixed pixel widths that break on a phone, and leaving the layout until the end. Check your page at a narrow width after every few changes instead.</p>
<p>When you want a guided path, the ${course("html-css-academy", "HTML & CSS Academy")} course covers this in 32 lessons, from how the web works through forms, accessibility, flexbox, grid and responsive design, with a live editor so you see your code run as you type. Once your pages are good, a course on ${course("seo", "Search Engine Optimization")} shows how the headings and meta tags you wrote here help people find them.</p>
`,
  quiz: {
    title: "HTML and CSS warm-up: 6 questions",
    intro: "Pick one answer for each question, then press Check my score. Your score is worked out in your browser and is not sent anywhere.",
    questions: [
      { q: "Which tag should hold the main heading of a page, normally used once?", options: ["<header>", "<p>", "<h6>", "<h1>"], answer: 3, explain: "<h1> is the top-level heading and tells browsers, screen readers and search engines what the page is about. <header> is a container for introductory content, not a heading." },
      { q: "You leave out the alt attribute on an informative image. Who is most affected?", options: ["Nobody, it is optional", "Screen-reader users, and anyone whose image fails to load", "Only search engines", "Only people on slow phones"], answer: 1, explain: "Alt text is what a screen reader reads aloud and what appears when the picture cannot load. It also helps search engines understand the image." },
      { q: "A box has width: 200px, padding: 20px on each side and a 5px border on each side. With the default box-sizing, how wide is it on screen?", options: ["250px", "200px", "240px", "225px"], answer: 0, explain: "By default the width covers only the content. Add 20 + 20 for padding and 5 + 5 for the border and you get 250px. With box-sizing: border-box it would stay 200px." },
      { q: "Which declaration on a parent element lays its children out in a flexible row?", options: ["position: absolute", "float: left", "display: flex", "display: block"], answer: 2, explain: "display: flex turns the parent into a flex container, so its children sit in a row and can be spaced and aligned with a few more properties." },
      { q: "What does 'mobile-first' CSS mean?", options: ["Hiding the page on desktop screens", "Using only pixel units", "Writing the desktop layout first and then shrinking it", "Writing base styles for small screens and adding min-width media queries for larger ones"], answer: 3, explain: "Small screens get the simple base layout. Media queries with min-width then add columns and extra spacing as the screen grows, which keeps the phone version light." },
      { q: "Which is the best choice for a site's main navigation menu?", options: ["A div with the class menu and nothing else", "A nav element containing a list of links", "A row of span tags", "A table"], answer: 1, explain: "<nav> tells assistive technology this is navigation, and a list of links inside it is easy to read and to style. Tables are for data, not layout." },
    ],
  },
  faq: [
    { q: "How long does it take to learn HTML and CSS?", a: "Most people can build a simple, well-structured page within a few weeks of steady practice. Becoming confident with responsive layouts, flexbox and grid usually takes two to three months. The HTML & CSS Academy course is about 90 hours across 32 lessons." },
    { q: "Should I learn HTML before CSS?", a: "Yes. In HTML and CSS for beginners, structure always comes first. HTML gives a page its structure and meaning, and CSS only makes sense when you have something to style. Start with a plain, readable HTML page and add CSS gradually." },
    { q: "Is HTML a programming language?", a: "No. HTML is a markup language: it describes content rather than giving instructions. CSS is a style language. JavaScript is the programming language of the web, and you can add it after you are comfortable with the other two." },
    { q: "Do I need to buy software to practise?", a: "No. A plain text editor and any browser are enough, and many beginners use a free editor such as Visual Studio Code. The live playground in the course lets you write and run code without installing anything." },
    { q: "When should I use flexbox and when should I use grid?", a: "Use flexbox to line items up along one direction, for example a menu or a row of cards. Use grid to arrange things in rows and columns together, such as a whole page layout. You can use both on the same page." },
  ],
  cta: {
    title: "Build real pages with a live editor",
    text: "HTML & CSS Academy has 32 lessons that take you from your first tag to a responsive, accessible site, each with a live code playground.",
    href: "/courses/html-css-academy",
    label: "Start the course",
  },
  related: [
    { label: "HTML & CSS Academy", href: "/courses/html-css-academy", note: "The 32-lesson course this guide is based on, with a live playground." },
    { label: "Front-End Development (HTML, CSS, JavaScript)", href: "/courses/front-end-development", note: "The next step: add JavaScript so pages react to clicks and forms." },
    { label: "UI/UX Design with Figma", href: "/courses/ui-ux-design-figma", note: "Plan layouts and spacing before you write the code." },
    { label: "Search Engine Optimization (SEO)", href: "/courses/seo", note: "How headings, meta tags and page speed help people find your pages." },
    { label: "Git & GitHub for Developers", href: "/courses/git-github", note: "Save your work safely and publish your pages online." },
  ],
};

export default post;
