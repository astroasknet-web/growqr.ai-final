import { bars, capstone, ck, classifyLab, course, def, example, explorer, flow, formula, list, mistakes, module_, p, S, sheetLab, table, tip, topic, tryIt, W, warn, wordLab } from "../kit.mjs";

const SK = "seo";

const labs = [
  classifyLab({
    id: "s1-intent", module: "how-search-works", title: "What does the searcher want?", level: "beginner", minutes: 7, xp: 25, skills: [SK], required: true,
    objective: "Sort search queries by the intent behind them.", scenario: "Every search has a purpose. Matching your page to that purpose is the heart of SEO.",
    steps: ["Read each search query.", "Choose its intent.", "Press Check my work."],
    categories: [["info", "Informational (wants to learn)"], ["nav", "Navigational (wants a site)"], ["comm", "Commercial (comparing options)"], ["trans", "Transactional (ready to act)"]],
    items: [["how to remove a coffee stain", "info", "The searcher wants an explanation."], ["facebook login", "nav", "They want a particular site."], ["best running shoes for flat feet", "comm", "They are comparing before buying."], ["buy running shoes size 9 online", "trans", "They are ready to buy."], ["what is a mortgage", "info", "A learning query."], ["amazon customer care number", "nav", "They want a specific page."], ["laptop under 50000 reviews", "comm", "They compare options."], ["book train ticket mumbai delhi", "trans", "They want to complete a task."]],
  }),
  wordLab({
    id: "s2-title-meta", module: "keywords-and-content", title: "Write a title and description", level: "beginner", minutes: 12, xp: 45, skills: [SK], required: true,
    objective: "Write a page title and meta description that match the topic and invite a click.",
    scenario: "A home bakery in Pune sells eggless birthday cakes and wants to rank for 'eggless birthday cake in Pune'. Write the title and the description for its page.",
    steps: ["Write a line starting with Title: using the main phrase.", "Write a line starting with Description: of one or two sentences.", "Keep the title under 60 characters (about 10 words) and the description under 160 characters.", "Mention a benefit and end the description with a call to action."],
    checks: [
      ck("t", "A title line", "Start the line with Title:.", "The title is the clickable headline in search results.", W.contains("Title")),
      ck("d", "A description line", "Start the line with Description:.", "The description is the short text below the title.", W.contains("Description")),
      ck("kw", "The main phrase appears", "Include eggless birthday cake and Pune.", "Telling the engine what the page is about helps it match searches.", W.pattern("eggless birthday cake", "the phrase eggless birthday cake")),
      ck("city", "The place is mentioned", "Include Pune.", "Local searches need a place.", W.contains("Pune")),
      ck("cta", "A call to action", "End with something like Order today.", "A clear next step raises clicks.", W.pattern("\\b(order|book|call|visit|get|shop|buy)\\b", "a call to action")),
      ck("len", "Short enough to display", "Keep it under 45 words in total.", "Search results cut long titles and descriptions.", W.words(15, 45)),
    ],
    solution: "<p>Title: Eggless Birthday Cake in Pune | Fresh Home Bakery</p><p>Description: Order a soft, fresh eggless birthday cake in Pune, baked to order with free local delivery. Choose your flavour and order today.</p>",
  }),
  classifyLab({
    id: "s3-onpage", module: "on-page-and-technical", title: "On-page, off-page or technical?", level: "intermediate", minutes: 7, xp: 25, skills: [SK], required: true,
    objective: "Place SEO tasks in the right group.", scenario: "SEO work falls into three areas. Knowing which is which tells you who should do the work.",
    steps: ["Read each task.", "Choose its area.", "Press Check my work."],
    categories: [["on", "On-page (content and HTML)"], ["off", "Off-page (reputation)"], ["tech", "Technical (crawl and speed)"]],
    items: [["Write a clear heading that includes the topic", "on", "Content on the page."], ["Earn a link from a local news site", "off", "Others pointing to you."], ["Compress images so the page loads faster", "tech", "Page speed is technical."], ["Add descriptive alt text to images", "on", "It is part of the page's HTML."], ["Fix pages that return a 404 error", "tech", "A crawl and server issue."], ["Get featured in a respected industry directory", "off", "Reputation from elsewhere."], ["Submit an XML sitemap", "tech", "It helps crawlers find pages."], ["Answer the reader's question in the first paragraph", "on", "Content quality."]],
  }),
  wordLab({
    id: "s4-outline", module: "keywords-and-content", title: "Outline a page that deserves to rank", level: "intermediate", minutes: 15, xp: 55, skills: [SK], required: true,
    objective: "Structure a helpful page with a single H1 and clear subheadings.",
    scenario: "Plan a guide called 'How to choose a school bag for a child'. Write the outline with headings and a short opening paragraph.",
    steps: ["Add one Heading 1 with the guide's title.", "Write an opening paragraph of two or three sentences that answers the main question.", "Add at least four Heading 2 sections (for example size, weight, straps, material).", "Add a short list of checks under one of the sections."],
    checks: [
      ck("h1", "One main heading", "Use Heading 1 once.", "A single clear H1 tells readers and engines the topic.", W.heading(1, 1)),
      ck("h2", "Four or more subheadings", "Use Heading 2 for each section.", "Subheadings make a page scannable and cover subtopics.", W.heading(4, 2)),
      ck("para", "An opening paragraph that answers the question", "Write at least two full sentences.", "Answering early satisfies the searcher.", W.paragraphs(1, 12)),
      ck("list", "A short checklist", "Use the bullet button.", "Lists are easy to read and often shown in results.", W.list(3, "ul")),
      ck("kw", "The topic phrase appears", "Include school bag.", "The page should clearly be about the topic.", W.contains("school bag")),
      ck("len", "Between 80 and 300 words", "Enough to be useful, short enough to outline.", "Depth matters, but this is an outline.", W.words(80, 300)),
    ],
    solution: "<h1>How to choose a school bag for a child</h1><p>The best school bag fits the child's back, weighs little when empty and has padded straps. Check the size, the weight and the quality before you buy, and let your child try it on with books inside.</p><h2>Size</h2><p>The bag should not be wider than the child's shoulders and should end above the hips so it does not pull backwards.</p><h2>Weight</h2><p>An empty bag should be light because books add weight quickly. A full bag should stay below about ten percent of the child's body weight.</p><h2>Straps and back</h2><ul><li>Wide padded shoulder straps</li><li>An adjustable chest or waist belt</li><li>A cushioned back panel</li></ul><h2>Material and care</h2><p>Look for strong stitching and a fabric that can be washed, with a zip that moves smoothly.</p>",
  }),
  sheetLab({
    id: "s5-keywords", module: "keywords-and-content", title: "Prioritise keywords", level: "intermediate", minutes: 15, xp: 55, skills: [SK], required: true,
    objective: "Score keywords by opportunity so you can target the best ones first.",
    scenario: "A bakery has researched five phrases. Opportunity is monthly searches times the chance of winning, divided by difficulty.",
    steps: ["In E2 enter =B2*C2/D2 for opportunity, and fill down to E6.", "In B8 find the highest opportunity with MAX.", "In B9 count how many phrases have more than 500 searches using COUNTIF.", "In B10 show the phrase with the top score using IF on the first and second rows only: IF(E2=B8,A2,A3) is enough for a model answer.", "Make the heading A1 bold."],
    cells: { A1: "Keyword", B1: "Searches", C1: "Win chance", D1: "Difficulty", E1: "Opportunity", A2: "eggless cake pune", B2: "900", C2: "0.5", D2: "30", A3: "birthday cake", B3: "40000", C3: "0.02", D3: "90", A4: "cake delivery near me", B4: "6000", C4: "0.1", D4: "60", A5: "eggless chocolate cake recipe", B5: "3000", C5: "0.05", D5: "40", A6: "custom photo cake pune", B6: "400", C6: "0.6", D6: "20", A8: "Best opportunity", A9: "Phrases over 500 searches", A10: "Top phrase" }, view: { cols: 6, rows: 12 },
    checks: [
      ck("e2", "E2 is the opportunity score", "=B2*C2/D2", "More searches and a better chance raise it; difficulty lowers it.", S.formula("E2", { equals: 15 })),
      ck("e6", "E6 is filled", "Fill the formula down to row 6.", "The same rule applies to every keyword.", S.formula("E6", { equals: 12 })),
      ck("max", "B8 is the highest score", "=MAX(E2:E6)", "It finds the best opportunity.", S.formula("B8", { fns: ["MAX"], cover: "E2:E6", equals: 15 })),
      ck("cnt", "B9 counts phrases over 500 searches", "=COUNTIF(B2:B6,\">500\")", "COUNTIF counts the rows that meet a condition.", S.formula("B9", { fns: ["COUNTIF"], equals: 4 })),
      ck("top", "B10 shows the top phrase", "=IF(E2=B8,A2,A3)", "IF compares each score with the maximum.", S.formula("B10", { fns: ["IF"], equals: "eggless cake pune" })),
      ck("fmt", "Heading A1 is bold", "Click A1 and press the bold button.", "Bold headings separate labels from data.", S.format("A1", "bold")),
    ],
    solution: { cells: { E2: "=B2*C2/D2", E3: "=B3*C3/D3", E4: "=B4*C4/D4", E5: "=B5*C5/D5", E6: "=B6*C6/D6", B8: "=MAX(E2:E6)", B9: "=COUNTIF(B2:B6,\">500\")", B10: "=IF(E2=B8,A2,A3)" }, formats: { A1: { bold: true } } },
  }),
  classifyLab({
    id: "s6-white-black", module: "links-and-authority", title: "Good practice or spam?", level: "intermediate", minutes: 7, xp: 25, skills: [SK], required: true,
    objective: "Tell ethical SEO from tactics that risk penalties.", scenario: "Shortcuts can win quickly and then lose everything when a search engine updates its rules.",
    steps: ["Read each tactic.", "Choose Good practice or Risky.", "Press Check my work."],
    categories: [["good", "Good practice"], ["bad", "Risky or against the rules"]],
    items: [["Publishing a helpful guide other sites want to cite", "good", "Earns links naturally."], ["Buying hundreds of links from a link farm", "bad", "Paid link schemes can bring penalties."], ["Writing titles that describe each page honestly", "good", "Accurate titles help users."], ["Repeating the keyword dozens of times in one paragraph", "bad", "Keyword stuffing reads badly and is penalised."], ["Showing search engines different content than visitors", "bad", "Cloaking is deceptive."], ["Fixing broken links and slow pages", "good", "It helps visitors and crawlers."], ["Copying another site's articles word for word", "bad", "Duplicate content adds no value."], ["Asking happy customers to leave honest reviews", "good", "Honest reviews build trust."]],
  }),
  sheetLab({
    id: "s7-traffic", module: "measure-and-improve", title: "Read the search report", level: "intermediate", minutes: 15, xp: 55, skills: [SK], required: true,
    objective: "Work out click-through rate and spot pages with potential.",
    scenario: "A search console report shows five pages. Compute each page's click-through rate and find the ones worth improving.",
    steps: ["In E2 enter clicks divided by impressions, fill down to E6.", "In F2 write IF(AND(D2>=4,D2<=10,E2<0.03),\"Improve\",\"OK\") and fill down.", "In B8 total the clicks and in B9 count the pages marked Improve using COUNTIF.", "Create a bar chart of clicks by page."],
    cells: { A1: "Page", B1: "Impressions", C1: "Clicks", D1: "Avg position", E1: "CTR", F1: "Action", A2: "/eggless-cakes", B2: "12000", C2: "300", D2: "5.2", A3: "/cake-delivery", B3: "8000", C3: "480", D3: "2.1", A4: "/custom-photo-cake", B4: "5000", C4: "75", D4: "7.8", A5: "/cake-recipes", B5: "20000", C5: "200", D5: "12.5", A6: "/contact", B6: "1000", C6: "90", D6: "1.8", A8: "Total clicks", A9: "Pages to improve" }, view: { cols: 6, rows: 11 },
    checks: [
      ck("e2", "E2 is the click-through rate", "=C2/B2", "CTR shows how often the result was clicked.", S.formula("E2", { equals: 0.025 })),
      ck("f2", "F2 flags page 1", "=IF(AND(D2>=4,D2<=10,E2<0.03),\"Improve\",\"OK\")", "Pages on page one with a low CTR need a better title.", S.formula("F2", { fns: ["IF", "AND"], equals: "Improve" })),
      ck("f4", "F4 flags page 3", "Fill the formula down.", "The same rule applies to every page.", S.formula("F4", { equals: "Improve" })),
      ck("tot", "B8 totals the clicks", "=SUM(C2:C6)", "Add all clicks.", S.formula("B8", { fns: ["SUM"], cover: "C2:C6", equals: 1145 })),
      ck("cnt", "B9 counts pages to improve", "=COUNTIF(F2:F6,\"Improve\")", "COUNTIF counts matching text.", S.formula("B9", { fns: ["COUNTIF"], equals: 2 })),
      ck("ch", "A bar chart of clicks", "Chart type bar with labels A2:A6 and values C2:C6.", "A chart shows which pages bring visitors.", S.chart({ type: "bar", labels: "A2:A6", values: "C2:C6" })),
    ],
    solution: { cells: { E2: "=C2/B2", E3: "=C3/B3", E4: "=C4/B4", E5: "=C5/B5", E6: "=C6/B6", F2: "=IF(AND(D2>=4,D2<=10,E2<0.03),\"Improve\",\"OK\")", F3: "=IF(AND(D3>=4,D3<=10,E3<0.03),\"Improve\",\"OK\")", F4: "=IF(AND(D4>=4,D4<=10,E4<0.03),\"Improve\",\"OK\")", F5: "=IF(AND(D5>=4,D5<=10,E5<0.03),\"Improve\",\"OK\")", F6: "=IF(AND(D6>=4,D6<=10,E6<0.03),\"Improve\",\"OK\")", B8: "=SUM(C2:C6)", B9: "=COUNTIF(F2:F6,\"Improve\")" }, charts: [{ type: "bar", labels: "A2:A6", values: "C2:C6", title: "Clicks by page" }] },
  }),
  classifyLab({
    id: "s8-speed", module: "on-page-and-technical", title: "What slows a page down?", level: "intermediate", minutes: 6, xp: 20, skills: [SK], required: false,
    objective: "Separate things that slow a page from things that speed it up.", scenario: "Fast pages keep visitors and rank better on phones.",
    steps: ["Read each item.", "Choose Slows or Speeds.", "Press Check my work."],
    categories: [["slow", "Slows the page"], ["fast", "Speeds the page"]],
    items: [["A 6 MB photo uploaded at full size", "slow", "Large images take long to download."], ["Compressing and resizing images", "fast", "Smaller files load quicker."], ["Ten tracking scripts loaded at once", "slow", "Each script adds work."], ["Caching files in the browser", "fast", "Repeat visits reuse files."], ["Autoplay video at the top of the page", "slow", "It adds weight."], ["Lazy-loading images below the fold", "fast", "Images load only when needed."]],
  }),
  wordLab({
    id: "s9-audit", module: "seo-in-practice", title: "Write a short SEO audit", level: "challenge", minutes: 20, xp: 70, skills: [SK], required: true,
    objective: "Report findings in priority order so an owner knows what to fix first.",
    scenario: "You audited a small furniture shop's website. Write the summary for the owner.",
    steps: ["Add headings: Summary, Findings, Priorities.", "Under Findings, list at least four problems (for example slow images, missing titles, broken links, thin pages).", "Under Priorities, write a numbered list of actions in order, most valuable first.", "Keep the report between 100 and 300 words."],
    checks: [
      ck("heads", "Three headings", "Use Heading 2 for Summary, Findings and Priorities.", "A clear structure helps the owner decide.", W.heading(3, 2)),
      ck("order", "Sections in order", "Summary, Findings, Priorities.", "Start with the overview and end with action.", W.order(["Summary", "Findings", "Priorities"])),
      ck("find", "At least four findings in a bullet list", "Use the bullet button.", "Specific findings are easier to act on.", W.list(4, "ul")),
      ck("pri", "A numbered list of priorities", "Use the numbered list button.", "Numbers show the order of importance.", W.list(3, "ol")),
      ck("kw", "Mentions titles or speed", "Mention titles, speed or links in your report.", "Use SEO vocabulary precisely.", W.pattern("\\b(title|speed|links?|mobile|sitemap)\\b", "an SEO term such as title or speed")),
      ck("len", "Between 100 and 300 words", "Concise but complete.", "Owners read short reports.", W.words(100, 300)),
    ],
    solution: "<h2>Summary</h2><p>The shop's website has good products but is hard for search engines to understand and slow on phones. Fixing four issues should bring more visitors who are ready to buy.</p><h2>Findings</h2><ul><li>Product photos are very large, so pages load slowly on mobile.</li><li>Many pages share the same title, so results look identical.</li><li>Eleven links lead to pages that no longer exist.</li><li>Category pages have almost no text describing what is sold.</li><li>The shop has no listing with its address and opening hours.</li></ul><h2>Priorities</h2><ol><li>Compress the product images to improve speed on phones.</li><li>Write a unique title and description for each category and product.</li><li>Repair or remove the broken links.</li><li>Add helpful text to the category pages and create a local listing.</li></ol>",
  }),
  sheetLab({
    id: "cap-seo-plan", module: "capstone", title: "Final project: build a 3-month SEO plan", level: "challenge", minutes: 25, xp: 130, skills: [SK], required: true,
    objective: "Estimate traffic and value from improving rankings, and choose which pages to start with.",
    scenario: "Five pages could be improved. Estimate extra monthly visits from moving up, then the value of those visits.",
    steps: ["In D2 compute extra visits: searches times the new click rate minus the old click rate (E2 minus C2 pattern: B2*(D2-C2) is not correct here; use the columns as labelled).", "In F2 enter extra visits = B2*(E2-D2) and fill to F6.", "In G2 enter value = F2*$B$9 (value per visit) and fill to G6.", "In F8 and G8 total extra visits and value.", "In B11 show the page with the most extra value using INDEX-free logic: use IF(G2=MAX(G2:G6),A2,...) for the first two rows.", "Chart the extra visits by page."],
    cells: { A1: "Page", B1: "Monthly searches", C1: "Position now", D1: "CTR now", E1: "CTR target", F1: "Extra visits", G1: "Extra value", A2: "Eggless cakes", B2: "9000", C2: "6", D2: "0.03", E2: "0.10", A3: "Cake delivery", B3: "6000", C3: "4", D3: "0.07", E3: "0.15", A4: "Photo cakes", B4: "2500", C4: "9", D4: "0.01", E4: "0.08", A5: "Cake recipes", B5: "20000", C5: "14", D5: "0.005", E5: "0.03", A6: "Wedding cakes", B6: "3000", C6: "8", D6: "0.02", E6: "0.09", A8: "Totals", A9: "Value per visit (rupees)", B9: "12", A11: "Best page to start" }, view: { cols: 7, rows: 13 },
    checks: [
      ck("f2", "F2 is extra visits for page 1", "=B2*(E2-D2)", "More clicks from the same searches.", S.formula("F2", { equals: 630 })),
      ck("f5", "F5 is filled", "Fill down to row 6.", "The same rule applies to each page.", S.formula("F5", { equals: 500 })),
      ck("g2", "G2 is the value of those visits", "=F2*$B$9", "Lock the value-per-visit cell with dollar signs.", S.formula("G2", { equals: 7560 })),
      ck("tf", "F8 totals the extra visits", "=SUM(F2:F6)", "Add the five pages.", S.formula("F8", { fns: ["SUM"], cover: "F2:F6", equals: 630 + 480 + 175 + 500 + 210 })),
      ck("tg", "G8 totals the value", "=SUM(G2:G6)", "Add the values.", S.formula("G8", { fns: ["SUM"], cover: "G2:G6", equals: (630 + 480 + 175 + 500 + 210) * 12 })),
      ck("best", "B11 names the starting page", "=IF(G2=MAX(G2:G6),A2,A5)", "Pick the page with the most extra value; here the first or the fourth leads.", S.formula("B11", { fns: ["IF", "MAX"], equals: "Eggless cakes" })),
      ck("ch", "A bar chart of extra visits", "Chart type bar with labels A2:A6 and values F2:F6.", "A chart makes priorities obvious.", S.chart({ type: "bar", labels: "A2:A6", values: "F2:F6" })),
    ],
    solution: { cells: { F2: "=B2*(E2-D2)", F3: "=B3*(E3-D3)", F4: "=B4*(E4-D4)", F5: "=B5*(E5-D5)", F6: "=B6*(E6-D6)", G2: "=F2*$B$9", G3: "=F3*$B$9", G4: "=F4*$B$9", G5: "=F5*$B$9", G6: "=F6*$B$9", F8: "=SUM(F2:F6)", G8: "=SUM(G2:G6)", B11: "=IF(G2=MAX(G2:G6),A2,A5)" }, charts: [{ type: "bar", labels: "A2:A6", values: "F2:F6", title: "Extra visits by page" }] },
  }),
];

const M1 = module_({
  slug: "how-search-works", title: "How search works", hours: 1.25, level: "Foundations",
  summary: "How search engines find, store and rank pages, and why intent matters.",
  outcome: "You can explain crawling, indexing and ranking and identify the intent behind a query.",
  intro: "Search engine optimisation (SEO) is the work of making your pages easy for search engines to understand and worth showing to people. To do that well you first need a clear picture of what a search engine actually does.",
  topics: [
    topic({
      title: "Crawl, index, rank", slug: "crawl-index-rank",
      blocks: [
        flow("What a search engine does", ["Crawl: bots follow links to find pages", "Index: the pages are analysed and stored", "Rank: for each search, the best answers are ordered"]),
        def("SEO", "The practice of improving a website so that it appears higher in unpaid (organic) search results for searches that matter to its audience."),
        table("The three steps", ["Step", "What happens", "What can go wrong"], [["Crawl", "Automated bots (crawlers) follow links and read pages", "No links to the page, blocked by a rule, slow server"], ["Index", "The engine stores and understands the content", "Thin, duplicate or unreadable content; marked 'do not index'"], ["Rank", "Pages are ordered for each query", "Weak match to intent, low quality or low trust"]]),
        p("A page cannot rank if it was never crawled, and it cannot be crawled if nothing links to it. Many SEO problems are simply visibility problems earlier in this chain."),
        tip("To see whether a page is indexed, search for its exact address or use the free search console tool from the search engine."),
      ],
      points: ["Search engines crawl, index and rank pages.", "A page must be found and understood before it can rank."],
      check: [["Which step stores and analyses pages?", ["Crawl", "Index", "Rank", "Click"], 1, "Indexing builds the library."]],
    }),
    topic({
      title: "Search intent", slug: "search-intent",
      blocks: [
        p("The most important idea in modern SEO is **intent**: why the person typed the query. A page that matches the intent has a chance; a page that does not will not rank however well it is optimised."),
        table("Four kinds of intent", ["Intent", "Example query", "Best page type"], [["Informational", "how to remove a coffee stain", "Guide, article, video"], ["Navigational", "facebook login", "The official site"], ["Commercial", "best running shoes for flat feet", "Comparison, review"], ["Transactional", "buy running shoes size 9", "Product or category page"]]),
        example("Reading the results", "You search for 'eggless birthday cake pune' and the top results are local bakeries with order buttons.", ["The intent is transactional and local.", "A long article about the history of cake would not match.", "A page with photos, prices, flavours and an order button would."], "Look at what already ranks to learn what the engine thinks people want."),
        mistakes(["Writing a long article for a query where people want to buy.", "Putting a product page where people want to learn.", "Ignoring the place in local searches."]),
      ],
      points: ["Intent is why someone searched.", "Match the page type to the intent by studying the results."],
      check: [["'best laptop under 50000' is mostly which intent?", ["Navigational", "Commercial", "Informational only", "None"], 1, "The searcher is comparing options."]],
    }),
    topic({
      title: "What the results page shows", slug: "results-page",
      blocks: [
        p("A results page is more than ten blue links. Understanding its parts shows where you can appear."),
        table("Parts of a results page", ["Part", "Description", "Opportunity"], [["Paid adverts", "Marked as ads at the top and bottom", "Pay per click"], ["Organic results", "Title, address and description", "Good titles and content"], ["Local pack", "A map with nearby businesses", "A complete business profile and reviews"], ["Featured answer", "A short direct answer", "Clear, concise answers to questions"], ["Images, video, news", "Other result types", "Good media with descriptions"]]),
        list("Why this matters", ["Fewer people click when the answer is shown directly, so aim to be the answer or give a reason to click.", "Local searches reward a complete, accurate business profile.", "The title and description decide whether a ranked page gets the click."]),
        warn("Nobody can promise a first-place ranking. Rankings depend on the engine's rules, your competitors and your quality, and they change. Be sceptical of anyone who guarantees results."),
      ],
      points: ["Results include ads, organic links, local packs and answers.", "No honest SEO guarantees rankings."],
      check: [["Which part rewards a complete business profile and reviews?", ["Paid ads", "The local pack", "Featured answer", "Images"], 1, "Local results use profiles."]],
    }),
  ],
  terms: [["Crawler", "A bot that reads pages by following links"], ["Index", "The engine's stored library of pages"], ["Rank", "Position in the results"], ["Organic", "Unpaid results"], ["Search intent", "Why someone searched"]],
  practical: { title: "Practical: study a results page", intro: "Search for something you might buy.", steps: ["Note how many ads appear.", "Note the types of page in the organic results.", "Say what the intent is.", "Describe the page you would build to rank."] },
  quiz: [
    ["Crawlers find pages by:", ["Guessing", "Following links", "Phoning owners", "Reading minds"], 1, "Links connect the web."],
    ["The indexing step:", ["Orders results", "Stores and analyses pages", "Pays for clicks", "Deletes pages"], 1, "It builds the library."],
    ["Intent means:", ["The keyword count", "Why the person searched", "The page length", "The ad budget"], 1, "The purpose behind the query."],
    ["'buy running shoes size 9' is:", ["Informational", "Transactional", "Navigational", "None"], 1, "The person is ready to buy."],
    ["Organic means:", ["Paid", "Unpaid", "Local only", "Video"], 1, "You did not pay per click."],
    ["A promise of guaranteed first place is:", ["Honest", "A warning sign", "Required", "Free"], 1, "Rankings cannot be guaranteed."],
    ["Local searches reward:", ["Long articles", "A complete business profile", "Hidden text", "Big images"], 1, "Profiles and reviews matter."],
  ],
});

const M2 = module_({
  slug: "keywords-and-content", title: "Keywords and content", hours: 1.5, level: "Core skills",
  summary: "Find the phrases people use, choose the best ones and write pages that answer them well.",
  outcome: "You can research keywords, score opportunities and plan a helpful page structure.",
  intro: "Keywords are the bridge between what people type and what you offer. But modern SEO is not about repeating words; it is about covering a topic so well that the searcher needs nothing more.",
  topics: [
    topic({
      title: "Keyword research", slug: "keyword-research",
      blocks: [
        p("Start with the language of customers, not the language of your industry. A plumber says 'leak repair'; a customer types 'tap dripping at night'."),
        list("Where to find ideas", ["Ask customers how they describe the problem.", "Use the suggestions that appear as you type in a search box.", "Look at the 'people also ask' questions.", "Use free tools from search engines to see volumes.", "Look at the headings of pages that already rank."], true),
        table("What to record for each phrase", ["Item", "Meaning"], [["Searches per month", "How many people look"], ["Difficulty", "How strong the competition is"], ["Intent", "What the searcher wants"], ["Relevance", "How well it fits what you offer"]]),
        p("Keep a simple spreadsheet of every phrase you consider, with the page you plan to use for it. Review it every quarter: search behaviour shifts with seasons, news and new products, and a phrase that mattered last year may now be replaced by a different way of asking the same question."),
        tip("A phrase with few searches but a high chance of winning and clear buying intent is often better than a huge, difficult one."),
      ],
      points: ["Use the customers' words.", "Record volume, difficulty, intent and relevance."],
      check: [["A keyword with low volume can still be valuable when:", ["It never is", "Intent is strong and competition is low", "It has many letters", "It is capitalised"], 1, "Fit and winnability matter."]],
    }),
    topic({
      title: "Choosing and scoring keywords", slug: "scoring-keywords",
      blocks: [
        formula("A simple opportunity score", "opportunity = searches × win chance ÷ difficulty", "Higher searches and a better chance raise the score; tougher competition lowers it."),
        explorer({ id: "kw-explorer", title: "Which keyword to target?", intro: "Change the numbers and watch how the opportunity score changes.", inputs: [{ id: "searches", label: "Monthly searches", min: 100, max: 40000, step: 100, value: 900 }, { id: "chance", label: "Win chance (percent)", min: 1, max: 100, step: 1, value: 50 }, { id: "diff", label: "Difficulty (1-100)", min: 1, max: 100, step: 1, value: 30 }], outputs: [{ label: "Opportunity score", expr: "searches * chance / 100 / diff", unit: "num" }, { label: "Expected visits if you win", expr: "searches * chance / 100", unit: "num" }] }),
        table("Short-tail and long-tail", ["Type", "Example", "Volume", "Competition", "Intent"], [["Short-tail", "cake", "Very high", "Very high", "Unclear"], ["Long-tail", "eggless birthday cake in pune", "Low", "Low", "Clear"]]),
        mistakes(["Chasing the biggest phrase and ignoring winnable ones.", "Choosing keywords with no link to what you sell.", "Using one page to target ten different intents."]),
      ],
      points: ["Score keywords, then target winnable long-tail phrases first.", "One main intent per page."],
      check: [["Long-tail phrases are usually:", ["Higher competition", "More specific with clearer intent", "Always useless", "Single words"], 1, "They are specific and winnable."]],
    }),
    topic({
      title: "Content that deserves to rank", slug: "helpful-content",
      blocks: [
        p("Search engines aim to show **helpful, reliable, people-first content**. That means pages written to serve a reader, by someone who knows the subject, not pages stuffed to please a machine."),
        list("Marks of a helpful page", ["It answers the question early and completely.", "It shows real experience or expertise, with sources where they matter.", "It is clearly organised with one H1 and logical subheadings.", "It is original: it says something that other pages do not.", "It is up to date and easy to read on a phone.", "It tells the reader what to do next."]),
        flow("A page plan", ["Name the one main intent", "Answer it in the first paragraph", "Add sections for related questions", "Add examples, images or tools", "Finish with a next step"]),
        example("Title and description", "Page: eggless birthday cakes in Pune.", ["Title: Eggless Birthday Cake in Pune | Fresh Home Bakery (under 60 characters).", "Description: a one- or two-sentence summary with a benefit and a call to action, under about 160 characters.", "Each page needs its own pair."], "These are the shop window of a result: they decide whether your ranking turns into a click."),
        warn("Writing with the sole aim of ranking, copying other pages or generating many thin pages is exactly what quality systems try to filter out."),
      ],
      points: ["Write people-first content that answers early and completely.", "Give every page a unique title and description."],
      check: [["Which is most likely to be penalised?", ["A guide with original examples", "Many thin pages written only to rank", "A clear FAQ", "A well-labelled image"], 1, "Thin, search-first pages are filtered."]],
    }),
  ],
  terms: [["Keyword", "A word or phrase people search for"], ["Long-tail", "A specific, lower-volume phrase"], ["Difficulty", "How hard it is to outrank others"], ["Title tag", "The clickable headline of a result"], ["Meta description", "The summary under the title"]],
  practical: { title: "Practical: plan three pages", intro: "Pick a business you know.", steps: ["List ten phrases customers might type.", "Score them for volume, difficulty and intent.", "Choose three, one per page.", "Write a title and description for each."] },
  quiz: [
    ["Keyword research should begin with:", ["Industry jargon", "Customers' own words", "A random list", "A competitor's logo"], 1, "Use their language."],
    ["Opportunity rises with:", ["Higher difficulty", "More searches and better chance", "More ads", "Longer titles"], 1, "Volume and winnability."],
    ["Long-tail phrases are:", ["Longer and more specific", "Always more competitive", "Single words", "Banned"], 0, "They show clear intent."],
    ["A page should target:", ["Ten intents", "One main intent", "No intent", "Only brand names"], 1, "Focus helps."],
    ["A title should be under about:", ["60 characters", "300 characters", "5 characters", "1000 characters"], 0, "Longer ones get cut."],
    ["People-first content is:", ["Written for readers", "Written only for bots", "Copied", "Hidden"], 0, "Readers come first."],
    ["The meta description should include:", ["A benefit and a call to action", "Only keywords", "Nothing", "A password"], 0, "It invites the click."],
  ],
});

const M3 = module_({
  slug: "on-page-and-technical", title: "On-page and technical SEO", hours: 1.5, level: "Core skills",
  summary: "Structure pages clearly, make sites fast and mobile-friendly and help crawlers find everything.",
  outcome: "You can structure a page with headings and descriptive media, and check speed, mobile friendliness and crawlability.",
  intro: "On-page SEO is about what is on the page. Technical SEO is about whether the site works well for crawlers and visitors. They overlap, and both are mostly common sense applied carefully.",
  topics: [
    topic({
      title: "Structuring a page", slug: "page-structure",
      blocks: [
        table("The parts of a well-built page", ["Part", "Guidance"], [["Title tag", "Unique, under about 60 characters, includes the main phrase naturally"], ["H1 heading", "One per page; says what the page is about"], ["Subheadings (H2, H3)", "Organise sections in a logical outline"], ["Body text", "Clear, helpful, easy to scan"], ["Images", "Descriptive file names and alt text; compressed"], ["Internal links", "Link to related pages with descriptive words"], ["Address (URL)", "Short, readable and lowercase with hyphens"]]),
        example("Alt text", "Image of a chocolate cake with candles.", ["Weak alt text: image1.", "Better alt text: eggless chocolate birthday cake with candles.", "Alt text helps screen-reader users first and search second."], "Write alt text for people who cannot see the image."),
        list("Internal links", ["Use words that describe the destination: 'eggless cake flavours', not 'click here'.", "Link related pages so crawlers and visitors can move between them.", "Make sure every important page is linked from somewhere."]),
        tip("An outline of headings should read like a table of contents. If it does not, the page is probably unclear."),
      ],
      points: ["Use one H1, logical subheadings, descriptive alt text and internal links.", "Readable addresses help people and engines."],
      check: [["Good alt text is:", ["image1", "A short description of the image", "A list of keywords", "Empty always"], 1, "It describes what is shown."]],
    }),
    topic({
      title: "Speed and mobile", slug: "speed-and-mobile",
      blocks: [
        p("Most searches happen on phones, often on slow connections. A slow or awkward page loses visitors before they read a word, and engines notice."),
        table("Common speed fixes", ["Problem", "Fix"], [["Huge images", "Resize and compress; use modern formats"], ["Too many scripts", "Remove the ones you do not need"], ["No caching", "Let browsers keep files they already downloaded"], ["Everything loads at once", "Load images lower on the page only when needed"], ["Slow hosting", "Choose a better server or a content delivery network"]]),
        list("Mobile checks", ["Text readable without zooming.", "Buttons large enough to tap.", "No horizontal scrolling.", "Pop-ups that do not cover the content.", "Same important content as on a computer."]),
        warn("Do not hide content on mobile that you want ranked: search engines mainly use the mobile version of your page."),
      ],
      points: ["Fast, mobile-friendly pages keep visitors and rank better.", "Compress images, trim scripts, cache and lazy-load."],
      check: [["A common first fix for a slow page is:", ["More images", "Compressing images", "More pop-ups", "Longer titles"], 1, "Images are often the heaviest part."]],
    }),
    topic({
      title: "Crawlability, indexing and structure", slug: "crawlability",
      blocks: [
        table("Technical tools", ["Tool", "Purpose"], [["XML sitemap", "A list of important pages for crawlers"], ["robots.txt", "Tells crawlers which areas to avoid"], ["Canonical tag", "Names the main version of duplicate pages"], ["HTTPS", "Secure connection; expected by users and engines"], ["Redirects (301)", "Send visitors and engines to a page's new address"], ["Structured data", "Labels such as product, review or event so engines understand the page"]]),
        mistakes(["Blocking the whole site in robots.txt by accident.", "Leaving a staging site open to indexing, or a live site marked 'do not index'.", "Changing addresses without redirects, creating broken links.", "Having many duplicate pages with no main version."]),
        flow("When a page does not appear in search", ["Is it linked from somewhere?", "Is it blocked or marked do-not-index?", "Is it in the sitemap and reported by the search console?", "Is the content unique and useful?", "Is it slow or broken on phones?"]),
        tip("After any redesign, crawl the old and new sites and check that every old address redirects to a sensible new one."),
      ],
      points: ["Sitemaps, robots rules, canonical tags, HTTPS and redirects help crawlers.", "Debug missing pages step by step."],
      check: [["A 301 redirect is used when:", ["A page is deleted for ever", "A page has moved permanently", "A page is slow", "A page has a typo"], 1, "It points to the new address."]],
    }),
  ],
  terms: [["H1", "The main heading of a page"], ["Alt text", "A text description of an image"], ["Sitemap", "A list of pages for crawlers"], ["Canonical", "The preferred version of a page"], ["301 redirect", "A permanent move"]],
  practical: { title: "Practical: audit one page", intro: "Choose any page from a small website.", steps: ["Check the title, H1 and headings.", "Check image alt text.", "Test speed and mobile display.", "Note three fixes in priority order."] },
  quiz: [
    ["How many H1 headings should a page have?", ["Zero", "One", "Ten", "Any number"], 1, "One main heading."],
    ["Alt text mainly helps:", ["Screen-reader users and image understanding", "Only advertisers", "Nothing", "Servers"], 0, "It describes images."],
    ["A sitemap helps:", ["Crawlers find pages", "Pay bills", "Make colours", "Block users"], 0, "It lists important pages."],
    ["Moving a page permanently needs:", ["A 301 redirect", "Deleting it", "A pop-up", "A new logo"], 0, "Preserve links and visitors."],
    ["The mobile version of a page:", ["Is mainly what engines use", "Is ignored", "Must be hidden", "Is always identical in design"], 0, "Mobile-first indexing."],
    ["Large uncompressed images:", ["Speed up pages", "Slow pages down", "Improve security", "Create sitemaps"], 1, "They are heavy."],
    ["Good internal link text is:", ["click here", "Descriptive of the destination", "Empty", "The URL only"], 1, "It tells people and engines what to expect."],
  ],
});

const M4 = module_({
  slug: "links-and-authority", title: "Links, authority and local SEO", hours: 1.25, level: "Applied skills",
  summary: "Earn trust through links and reviews, work with local search and avoid shortcuts that cost you later.",
  outcome: "You can describe how links signal trust, set up the basics of local SEO and tell good practice from spam.",
  intro: "Search engines treat a link from one site to another as a recommendation. But a recommendation is only worth something when it is earned. This module covers how to earn trust, locally and online, and how to avoid the shortcuts that backfire.",
  topics: [
    topic({
      title: "Links as recommendations", slug: "links",
      blocks: [
        def("Backlink", "A link from another website to yours. Links from relevant, trusted sites are worth far more than many links from poor ones."),
        table("Good and poor links", ["Good", "Poor"], [["From a relevant, respected site", "From unrelated or spammy pages"], ["Earned because your content is useful", "Bought or exchanged in bulk"], ["Placed naturally in an article", "Hidden in a footer or comments"], ["Varied, descriptive anchor text", "The same keyword phrase every time"]]),
        list("Ethical ways to earn links", ["Publish original research, guides or tools others want to cite.", "Be useful to journalists and bloggers in your field.", "Get listed in genuine industry directories and associations.", "Sponsor or contribute to local events and organisations.", "Fix broken links on sites by offering your relevant page (politely)."]),
        warn("Buying links, running link farms and hidden manipulation can bring a penalty that removes your site from results. Recovery can take months."),
      ],
      points: ["Links are recommendations; quality and relevance beat quantity.", "Earn links by being useful; do not buy them."],
      check: [["Which link is most valuable?", ["From a bulk-bought directory", "From a respected relevant site that cites your guide", "From a hidden footer", "From a spam comment"], 1, "Relevance and trust matter."]],
    }),
    topic({
      title: "Local SEO", slug: "local-seo",
      blocks: [
        p("For shops, clinics, restaurants and services with a place, local search is often the biggest opportunity. The local pack shows a map and a few nearby businesses."),
        table("Local ranking foundations", ["Factor", "How to improve it"], [["Relevance", "Choose the right categories and describe services clearly"], ["Distance", "You cannot move, but you can make sure your address is accurate"], ["Prominence", "Reviews, mentions and a strong website"]]),
        list("The local checklist", ["Claim and complete your business profile: name, address, phone, hours, photos.", "Keep your name, address and phone number identical everywhere.", "Ask happy customers for honest reviews and reply to all of them.", "Create pages for each service and each area you serve.", "Add the city to titles and headings where it is natural."], true),
        mistakes(["Different phone numbers or addresses on different sites.", "Creating fake locations to appear in more areas.", "Buying reviews or writing your own."]),
      ],
      points: ["Local ranking depends on relevance, distance and prominence.", "Keep profile details consistent and earn honest reviews."],
      check: [["Which is a legitimate way to improve local ranking?", ["Fake reviews", "Asking real customers for honest reviews", "Creating fake addresses", "Hiding your phone number"], 1, "Honest reviews build prominence."]],
    }),
    topic({
      title: "Trust, quality and staying safe", slug: "trust-and-safety",
      blocks: [
        p("Search engines look for signs that a site is reliable, especially for topics that affect health, money or safety. These signs are often summarised as experience, expertise, authoritativeness and trustworthiness."),
        table("Showing trust on a page", ["Signal", "Example"], [["Who wrote it", "An author name and a short real biography"], ["Why they know", "Qualifications or direct experience"], ["Where it comes from", "Links to sources and dates"], ["How to contact", "A real address, phone number and email"], ["Safety", "HTTPS and clear privacy information"]]),
        list("Staying out of trouble", ["Never copy content; always add something original.", "Do not hide text or links from visitors.", "Do not promise or buy rankings.", "Keep up with official guidance from the search engines.", "Be patient: SEO normally takes months, not days."]),
        tip("If a tactic would embarrass you if the search engine's staff explained it to your customers, do not use it."),
      ],
      points: ["Show who wrote the page, why they know and where facts come from.", "Avoid shortcuts; SEO takes months."],
      check: [["SEO results typically take:", ["Minutes", "Weeks to months", "One hour", "They never come"], 1, "Rankings build slowly."]],
    }),
  ],
  terms: [["Backlink", "A link from another site"], ["Anchor text", "The clickable words of a link"], ["Local pack", "The map and nearby businesses in results"], ["Review", "A customer's public rating and comment"], ["Penalty", "A loss of rankings for breaking the rules"]],
  practical: { title: "Practical: find ten honest link opportunities", intro: "Choose a local business or a hobby site.", steps: ["List directories and associations it belongs in.", "List local organisations it could help.", "List one piece of content that might earn links.", "Say which tactic you would never use and why."] },
  quiz: [
    ["A backlink is:", ["A link from another site to yours", "A broken link", "A redirect", "An ad"], 0, "A recommendation."],
    ["Bought links can lead to:", ["Better trust", "A penalty", "Guaranteed ranking", "Free reviews"], 1, "They break the rules."],
    ["Local ranking uses relevance, distance and:", ["Prominence", "Colour", "Font", "Slogan"], 0, "Reviews and mentions."],
    ["Name, address and phone should be:", ["Different on each site", "Consistent everywhere", "Hidden", "Secret"], 1, "Consistency builds trust."],
    ["Fake reviews are:", ["Smart", "Against the rules and misleading", "Free marketing", "Required"], 1, "Honesty matters."],
    ["Showing an author and sources helps:", ["Trust", "Nothing", "Speed only", "Colours"], 0, "It supports reliability."],
    ["SEO usually takes:", ["Months", "One minute", "A day", "It is instant"], 0, "Be patient."],
  ],
});

const M5 = module_({
  slug: "measure-and-improve", title: "Measure and improve", hours: 1.5, level: "Applied skills",
  summary: "Read the reports, spot opportunities and report to a client or owner.",
  outcome: "You can read click-through and ranking reports, find quick wins and write a short audit.",
  intro: "SEO is a loop: measure, change, measure again. The free search console and analytics tools give you most of what you need.",
  topics: [
    topic({
      title: "Key reports and metrics", slug: "reports",
      blocks: [
        table("Core metrics", ["Metric", "Meaning", "Where"], [["Impressions", "Times your page appeared in results", "Search console"], ["Clicks", "Times it was clicked", "Search console"], ["CTR", "clicks / impressions", "Search console"], ["Average position", "Typical rank for the queries", "Search console"], ["Sessions", "Visits to your site", "Analytics"], ["Conversions", "Visitors who did what you wanted", "Analytics"]]),
        formula("Click-through rate", "CTR = clicks / impressions", "If a page appears 12,000 times and gets 300 clicks, CTR is 2.5%."),
        bars("Typical click-through rate by position (illustrative, percent)", [["1", 28], ["2", 15], ["3", 11], ["5", 6], ["10", 2]]),
        p("These shares are illustrative and vary by query and result layout, but the pattern is real: the top places get far more clicks than the rest."),
      ],
      points: ["Impressions, clicks, CTR and position tell the search story.", "Conversions tell the business story."],
      check: [["CTR is calculated as:", ["Clicks / impressions", "Impressions / clicks", "Position / clicks", "Sales / clicks"], 0, "Share of appearances that were clicked."]],
    }),
    topic({
      title: "Finding quick wins", slug: "quick-wins",
      blocks: [
        list("Three easy-to-find opportunities", ["Pages on the first page with a low click-through rate: rewrite the title and description.", "Pages in positions 8 to 20: improve and expand the content, add internal links.", "Pages with many impressions but few clicks for a specific query: check the intent."], true),
        example("Using the lab", "A page ranks at position 5.2 with a CTR of 2.5%.", ["It appears often and is near the top, but few click.", "The title may be dull or may not match the intent.", "Rewrite the title with the benefit and test it for a few weeks."], "A better title can raise clicks without any ranking change."),
        mistakes(["Changing many things at once, so you cannot tell what worked.", "Judging the results after a few days.", "Chasing total traffic instead of conversions."]),
        tip("Keep a change log with dates. When something moves, you will know what you did before it."),
      ],
      points: ["Look for high-impression, low-CTR pages and pages just off page one.", "Change one thing at a time and log it."],
      check: [["A page at position 6 with low CTR most likely needs:", ["A new site", "A better title and description", "Deleting", "More ads"], 1, "It is visible but unappealing."]],
    }),
    topic({
      title: "Reporting and planning", slug: "reporting",
      blocks: [
        flow("The SEO loop", ["Audit the site", "Prioritise by value and effort", "Make changes", "Measure results", "Report and repeat"]),
        table("Prioritising work", ["Priority", "Typical item"], [["High value, low effort", "Fix titles, broken links, big images"], ["High value, high effort", "New cornerstone pages, redesign"], ["Low value, low effort", "Minor cleanups when convenient"], ["Low value, high effort", "Skip"]]),
        list("A good report", ["Starts with a short summary in plain words.", "Shows two or three numbers that matter to the business.", "Lists what was done and what it changed.", "States what comes next and what the owner must decide.", "Is honest about what is unknown."]),
        warn("Avoid reporting only rankings. A first-page ranking for a phrase nobody buys with is worth little."),
      ],
      points: ["Prioritise by value and effort.", "Report on business results in plain language."],
      check: [["Which work should be done first?", ["Low value, high effort", "High value, low effort", "Neither", "Random"], 1, "Quick wins first."]],
    }),
  ],
  terms: [["Impression", "One appearance in results"], ["CTR", "Click-through rate"], ["Average position", "Typical rank"], ["Conversion", "A desired action"], ["Audit", "A structured review"]],
  practical: { title: "Practical: a one-page report", intro: "Use the report lab.", steps: ["Identify the pages worth improving.", "State one change per page.", "Predict the effect.", "Write the owner summary in three sentences."] },
  quiz: [
    ["Impressions measure:", ["Appearances in results", "Sales", "Links", "Speed"], 0, "How often you were shown."],
    ["Average position of 1 means:", ["Top on average", "Bottom", "No clicks", "Paid"], 0, "Highest rank."],
    ["A quick win is often:", ["A rewritten title", "A redesign", "A new brand", "A new server"], 0, "It is cheap and fast."],
    ["Change one thing at a time to:", ["See what worked", "Save time", "Hide results", "Confuse rivals"], 0, "Isolate the cause."],
    ["Which matters most to a business owner?", ["Conversions", "Impressions only", "Vanity ranks", "Page count"], 0, "Sales and leads."],
    ["High value, low effort work is:", ["Done first", "Skipped", "Done last", "Hidden"], 0, "Best return."],
    ["A good report is:", ["Short, honest and action-led", "Jargon heavy", "Secret", "Only charts"], 0, "Clarity wins."],
  ],
});

const M6 = module_({
  slug: "seo-in-practice", title: "SEO in practice", hours: 1, level: "Applied skills",
  summary: "Put it together: plan a project, avoid common myths and keep up with change.",
  outcome: "You can plan a three-month SEO programme, separate myths from facts and keep learning.",
  intro: "SEO is a long game played with changing rules. This final module turns the pieces into a plan and prepares you to keep up.",
  topics: [
    topic({
      title: "A three-month plan", slug: "three-month-plan",
      blocks: [
        table("A starter plan", ["Month", "Focus", "Typical tasks"], [["1", "Foundation", "Audit; fix technical issues; set up search console and analytics; complete the business profile"], ["2", "Content", "Keyword plan; improve top pages; write the first new helpful pages; fix titles"], ["3", "Authority and review", "Earn links and reviews; add internal links; measure and plan the next quarter"]]),
        p("In a short project you cannot expect big movements in rankings for competitive phrases. You can, however, fix problems, improve titles and publish content that begins to earn impressions."),
        list("Set expectations honestly", ["Rankings improve gradually over months.", "Competitive phrases may take a year.", "Technical fixes show faster than new content.", "Algorithm updates can change results; focus on durable quality."]),
        tip("Choose a small set of target pages and a small set of numbers to track, then protect them from distractions."),
      ],
      points: ["Foundation, content, then authority.", "Be honest about timing."],
      check: [["What is a sensible month-one focus?", ["Buying links", "Fixing foundations", "Hiding content", "Copying a rival"], 1, "Fix technical basics first."]],
    }),
    topic({
      title: "Myths and facts", slug: "myths",
      blocks: [
        table("Common myths", ["Myth", "Fact"], [["Keyword stuffing helps", "It makes pages unreadable and can be penalised"], ["More pages always mean more traffic", "Thin pages dilute quality"], ["SEO is a one-off task", "It is ongoing: competitors and engines change"], ["Paid ads improve organic rank", "They are separate systems"], ["Meta keywords matter", "They are ignored by major engines"], ["Anyone can guarantee page one", "No one controls the engine"]]),
        classifyHint(),
      ],
      points: ["Many popular beliefs are myths.", "Rely on official guidance and your own measurement."],
      check: [["Which statement is true?", ["Paid ads boost organic rank", "SEO is ongoing", "Meta keywords drive rank", "Guarantees are honest"], 1, "SEO needs continuing attention."]],
    }),
    topic({
      title: "Ethics, careers and staying current", slug: "ethics-and-careers",
      blocks: [
        p("The best SEO professionals are essentially good communicators and careful analysts. They build sites that people find helpful and that are easy for machines to read."),
        list("Staying current", ["Read the official guidance and documentation from the search engines.", "Follow a few respected industry sources and test claims yourself.", "Run small experiments on your own sites.", "Learn the basics of web writing, analytics and page speed."]),
        table("Roles that use SEO", ["Role", "SEO tasks"], [["Content writer", "Intent, structure, titles"], ["Web developer", "Speed, crawlability, markup"], ["Marketer", "Strategy, reporting, local SEO"], ["Shop owner", "Local profile, reviews, key pages"]]),
        warn("Do not take shortcuts that hurt other people or break rules: fake reviews, scraped content and hidden text harm users and, in the end, your clients."),
      ],
      points: ["Stay current with official guidance and your own tests.", "Ethical SEO serves people first."],
      check: [["The best foundation for long-term SEO is:", ["Tricks", "Helpful pages that serve people", "Hidden text", "Bought links"], 1, "Durable value."]],
    }),
  ],
  terms: [["Algorithm update", "A change to how engines rank"], ["Keyword stuffing", "Overusing a phrase"], ["Guideline", "Official advice from a search engine"], ["Cornerstone page", "A key page on an important topic"]],
  practical: { title: "Practical: plan three months", intro: "Pick a website you know.", steps: ["List five fixes for month one.", "Choose three pages to improve in month two.", "Choose two ways to earn links ethically in month three.", "Say which numbers you will watch."] },
  quiz: [
    ["Month one should start with:", ["Foundation fixes", "Buying links", "Copying rivals", "Deleting everything"], 0, "Technical basics first."],
    ["Keyword stuffing:", ["Helps ranking", "Can be penalised", "Is required", "Is safe"], 1, "It harms readability."],
    ["SEO is:", ["One-off", "Ongoing", "Finished in a day", "Paid-only"], 1, "Competitors keep moving."],
    ["Which is reliable guidance?", ["Official documentation", "Guaranteed rank promises", "Random forum rumours only", "Hidden text"], 0, "Prefer primary sources."],
    ["Technical fixes often show results:", ["Faster than new content", "Never", "After ten years", "Only with ads"], 0, "They remove blockers."],
    ["Fake reviews:", ["Break the rules and mislead", "Help trust", "Are free", "Are required"], 0, "They are dishonest."],
    ["Thin pages usually:", ["Dilute quality", "Always help", "Guarantee rank", "Cost nothing"], 0, "Quality beats quantity."],
  ],
});

function classifyHint() {
  return tip("Test claims: if someone says a trick works, ask for the evidence, the date and whether the engine's own guidance agrees.");
}

export default course({
  slug: "seo", title: "SEO: Search Engine Optimization", tagline: "Be found by the right people, honestly, with hands-on labs in every module", level: "Beginner", hours: 8,
  summary: "Learn practical search engine optimisation: how search works, keywords and helpful content, on-page and technical SEO, links and local SEO, measurement and a three-month plan. Every module has a hands-on lab.",
  modules: [M1, M2, M3, M4, M5, M6],
  capstone: capstone({
    title: "Final project: a 3-month SEO plan", summary: "Estimate the value of improvements and pass the final assessment.",
    intro: "You now know how search works and how to improve a site honestly. In this final step you estimate the extra visits and value from improving five pages and choose where to start. Then take the final assessment covering the whole course.",
    steps: ["Work through the **Final project: build a 3-month SEO plan** lab.", "Write two sentences explaining your choice of starting page.", "Take the final assessment below."], projectTitle: "A three-month SEO plan",
    quiz: [
      ["The three steps of a search engine are:", ["Crawl, index, rank", "Buy, sell, rent", "Read, write, print", "Click, view, close"], 0, "Find, store, order."],
      ["Search intent means:", ["Why the person searched", "How many words", "The ad budget", "The page colour"], 0, "Match the purpose."],
      ["A good keyword target is often:", ["Specific and winnable", "The biggest phrase", "A random word", "Your brand only"], 0, "Long-tail phrases convert."],
      ["A page should have:", ["One H1", "Ten H1s", "No headings", "Only images"], 0, "One main heading."],
      ["Good alt text:", ["Describes the image", "Is empty", "Is a list of keywords", "Is image1"], 0, "It helps users."],
      ["A slow page is often caused by:", ["Huge images", "Short titles", "Good alt text", "A sitemap"], 0, "Compress them."],
      ["Backlinks are best when:", ["Earned from relevant sites", "Bought in bulk", "Hidden", "Faked"], 0, "Quality and relevance."],
      ["Local ranking uses:", ["Relevance, distance, prominence", "Colour only", "Font only", "Price only"], 0, "Three factors."],
      ["CTR equals:", ["Clicks / impressions", "Position / clicks", "Sales / ads", "Links / pages"], 0, "Share who clicked."],
      ["A quick win is:", ["Rewriting a weak title", "Rebuilding the site", "Buying links", "Hiding content"], 0, "Cheap and visible."],
      ["Can anyone guarantee first place?", ["No", "Yes", "Only with ads", "Only for a fee"], 0, "Nobody controls rankings."],
      ["SEO is best described as:", ["Ongoing", "One-off", "Instant", "Impossible"], 0, "Rules and rivals change."],
    ],
  }),
  labs,
  skills: [{ id: SK, label: "Search engine optimisation" }],
  badges: [
    { id: "intent-reader", title: "Intent reader", description: "Sorted queries by search intent.", when: { all: ["s1-intent"] } },
    { id: "keyword-planner", title: "Keyword planner", description: "Scored keywords by opportunity.", when: { all: ["s5-keywords"] } },
    { id: "auditor", title: "SEO auditor", description: "Wrote a prioritised audit.", when: { all: ["s9-audit"] } },
    { id: "seo-planner", title: "SEO planner", description: "Built a three-month plan.", when: { all: ["cap-seo-plan"] } },
  ],
  landing: {
    hero: { eyebrow: "SEO skills · No software to install", title: "SEO: learn to be found, honestly", subtitle: "Practise keyword scoring and reports in a working spreadsheet, and write titles, outlines and audits in a document editor. Every task is checked and explained.", level: "Beginner", outcomeLine: "After this course you can audit a small site, plan content and report results in plain language." },
    outcomes: [
      { icon: "web", title: "Understand how search works", text: "Crawling, indexing, ranking and intent." },
      { icon: "word", title: "Plan helpful content", text: "Keyword research, titles, descriptions and page outlines." },
      { icon: "cloud", title: "Fix on-page and technical basics", text: "Headings, alt text, speed, mobile and crawlability." },
      { icon: "ai", title: "Earn trust and local visibility", text: "Links, reviews and business profiles, without shortcuts." },
      { icon: "sheet", title: "Measure and report", text: "CTR, position, quick wins and clear reports." },
      { icon: "safety", title: "Avoid penalties", text: "Spot risky tactics and myths." },
    ],
    projects: [
      { title: "A title and description", text: "A search result that invites the click.", module: "keywords-and-content" },
      { title: "A keyword opportunity table", text: "Scoring phrases by value and difficulty.", module: "keywords-and-content" },
      { title: "A short SEO audit", text: "Findings and priorities for an owner.", module: "measure-and-improve" },
      { title: "A three-month plan", text: "Estimated visits and value by page.", module: "capstone" },
    ],
    tools: [{ icon: "word", title: "Document editor", text: "For titles, outlines and audit reports." }, { icon: "sheet", title: "Spreadsheet lab", text: "For keyword scoring, reports and plans." }, { icon: "sort", title: "Sort and decide", text: "Intent, SEO areas, speed factors and risky tactics." }],
    assessment: ["Finish the required labs in each module: they are checked automatically and explained when something is missing.", "Pass each module quiz (70% or more). You can retry as often as you like.", "Complete the three-month plan and the final assessment."],
    faq: [
      { q: "Will this get me to number one on a search engine?", a: "No course can promise that. It teaches the methods that improve your chances honestly and how to measure the results." },
      { q: "Do I need a website to practise?", a: "No. The labs use a sample business, and the practical tasks suggest auditing any small site you know." },
      { q: "Is the content up to date?", a: "It focuses on principles that last. Search engines change details often, so the course points you to official guidance." },
    ],
  },
  catalogue: {
    hours: "~8 hrs", weeks: "~3 weeks", pace: "3 hrs/wk", badge: "SEO Foundations",
    brief: "How search works, keywords and helpful content, on-page and technical SEO, links and local SEO, reports and a plan.",
    learn: ["Crawling, indexing, ranking and search intent", "Keyword research, scoring and helpful content", "Titles, descriptions, headings, alt text and internal links", "Speed, mobile friendliness and crawlability", "Links, local SEO and trust without shortcuts", "Reading reports, quick wins and a three-month plan"],
    handsOn: "Estimate extra visits and value from improving five pages, choose where to start and chart the opportunity.",
    outcome: "Audit a small website, plan content and report results honestly.",
  },
});
