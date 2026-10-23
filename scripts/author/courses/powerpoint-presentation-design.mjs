import { bars, capstone, ck, classifyLab, course, D, def, example, flow, list, mistakes, module_, p, sl, slidesLab, table, tip, topic, tryIt, warn, withShapes } from "../kit.mjs";

const SK = "presentations";

const messy = {
  theme: "clean",
  slides: [
    { id: "m1", layout: "title", title: "Our Recycling Project", body: "Class 9B", body2: "", shapes: [] },
    { id: "m2", layout: "title-content", title: "Everything about recycling", body: "- Recycling is the process of converting waste materials into new materials and objects, which can reduce the use of fresh raw materials\n- Paper, plastic, glass and metal can all be recycled in different ways depending on the facilities available in the town\n- Our school produces about forty kilograms of waste every day, and most of it ends up in a single large bin\n- We measured the waste for two weeks and wrote everything down in a long table that we will not show here\n- Many students did not know which bin to use\n- The municipal truck comes twice a week\n- We think we can do better\n- Thank you for listening", body2: "", shapes: [] },
  ],
};

/* ------------------------------------------------------------------------------------------------------------------ labs */
const labs = [
  classifyLab({
    id: "p0-plan-first", module: "plan-before-you-open", title: "Plan first or build first?", level: "beginner", minutes: 6, xp: 20, skills: [SK], required: true,
    objective: "Tell the planning jobs from the building jobs.", scenario: "Good presenters finish the planning jobs before they open the software.",
    steps: ["Read each job.", "Choose Plan first or Build later.", "Press Check my work."],
    categories: [["plan", "Plan first"], ["build", "Build later"]],
    items: [["Decide who the audience is", "plan", "Everything else depends on who is listening."], ["Write the one-sentence message", "plan", "The message guides every slide."], ["Sketch the headline of each slide on paper", "plan", "A storyboard shows the story before any work is wasted."], ["Choose a font and a colour theme", "build", "Design comes after the message is clear."], ["Add a picture to a slide", "build", "Visuals are built once you know what each slide must say."], ["Choose the three main points", "plan", "Three points give the talk its structure."], ["Set the animation for each line", "build", "Animation is decoration, so it comes last, if at all."], ["Decide what you want the audience to do afterwards", "plan", "The call to action shapes the whole talk."]],
  }),
  slidesLab({
    id: "p1-intro", module: "slide-structure-and-layouts", title: "Introduce yourself in five slides", level: "beginner", minutes: 14, xp: 45, skills: [SK], required: true,
    objective: "Build a short, readable deck with a title slide and clear slide titles.",
    scenario: "Your class is meeting new people. Make five short slides so they can get to know you.",
    steps: ["Make slide 1 a Title slide with your name.", "Add four more slides titled About me, My hobbies, My goals and Thank you.", "Write two or three short bullet points on each content slide.", "Choose a theme other than the default."],
    checks: [
      ck("count", "Five to seven slides", "Use Add slide to make more.", "Five slides are enough to introduce yourself without losing people.", D.count(5, 7)),
      ck("first", "A title slide first", "Choose the Title slide layout for slide 1 and type your name.", "The first slide introduces the talk.", D.titleFirst()),
      ck("titles", "Every slide has a title", "Type a title at the top of each slide.", "Titles tell the audience what each slide is about.", D.titles()),
      ck("hobbies", "A slide about your hobbies", "Make a slide title or text include Hobbies.", "Hobbies give the audience something to connect with.", D.contains("hobbies")),
      ck("goals", "A slide about your goals", "Make a slide title or text include Goals.", "Goals tell people where you are heading.", D.contains("goals")),
      ck("read", "Few words per slide", "Keep to four bullets and about 30 words.", "Slides support what you say; they are not a script.", D.readable(4, 30)),
      ck("theme", "A theme other than the default", "Open the theme list and pick one.", "A theme gives the deck a consistent look.", D.theme()),
    ],
    solution: [sl.title("Asha Rao", "Class 9, City Public School"), sl.bullets("About me", "- I live in Pune\n- I have one brother\n- I love building things"), sl.bullets("My hobbies", "- Drawing\n- Cycling\n- Coding small games"), sl.bullets("My goals", "- Learn two new skills this year\n- Start a school robotics club"), sl.bullets("Thank you", "- Questions are welcome")],
  }),
  slidesLab({
    id: "p2-fix-overload", module: "words-that-work", title: "Rescue an overloaded slide", level: "intermediate", minutes: 14, xp: 50, skills: [SK], required: true,
    objective: "Turn a wall of text into slides people can read while you speak.",
    scenario: "A student wrote everything on one slide. Split it into clear slides with at most four short bullets each.",
    steps: ["Keep slide 1 as the title slide.", "Split the long slide into at least three slides, each with its own clear title.", "Reduce every slide to four bullets or fewer, with about 25 words or fewer.", "Add a final slide that says what you want the audience to do."],
    initialDeck: messy,
    checks: [
      ck("count", "At least five slides in total", "Move the points onto several new slides.", "One idea per slide is easier to follow.", D.count(5)),
      ck("titles", "Every slide has a title", "Give each new slide a title that says what it is about.", "A good title tells the audience the point of the slide.", D.titles()),
      ck("read", "No slide has more than four bullets or about 25 words", "Cut each bullet down to its key words.", "People cannot read and listen at the same time.", D.readable(4, 25)),
      ck("first", "The first slide is still the title slide", "Do not lose the title slide.", "The talk starts with a title.", D.titleFirst("Recycling")),
      ck("action", "A closing slide with a call to action", "Add a slide whose text includes Next steps or Please.", "End by telling people what to do next.", D.contains("next steps")),
    ],
    solution: [sl.title("Our Recycling Project", "Class 9B"), sl.bullets("The problem", "- Forty kilograms of waste a day\n- One big bin for everything"), sl.bullets("What we found", "- Most students did not know which bin to use\n- The truck comes twice a week"), sl.bullets("What we can do", "- Label bins for paper, plastic and glass\n- Train a student monitor in each class"), sl.bullets("Next steps", "- Vote for the new bins on Friday\n- Join the green team")],
  }),
  slidesLab({
    id: "p3-pitch", module: "visuals-and-data", title: "Add a diagram and a bold look", level: "intermediate", minutes: 15, xp: 55, skills: [SK], required: true,
    objective: "Use shapes to show a process, and keep layouts varied but consistent.",
    scenario: "Explain how a school canteen order moves from the student to the kitchen, using shapes to draw the steps.",
    steps: ["Make slide 1 a Title slide: Canteen orders.", "Add a Section slide called The journey.", "Add a Title and bullets slide, then add at least three shapes (boxes and an arrow) to draw the steps: Order, Cook, Collect.", "Add a Two columns slide comparing Before and After.", "Pick a theme other than the default."],
    checks: [
      ck("first", "A title slide first", "Choose the Title slide layout and type Canteen orders.", "Start with a clear title.", D.titleFirst("Canteen")),
      ck("layouts", "At least three different layouts", "Use a title, a section and a two-column slide.", "Different layouts keep a deck from looking monotonous.", D.layouts(3)),
      ck("shapes", "At least three shapes to draw the steps", "Use the Shape button for boxes and an arrow.", "A simple diagram can replace a paragraph.", D.shapes(3)),
      ck("steps", "The steps Order, Cook and Collect appear", "Write the three step names on the slide.", "Name each step so the diagram is understood.", D.contains("collect")),
      ck("theme", "A non-default theme", "Pick a theme from the list.", "A theme keeps fonts and colours consistent.", D.theme()),
      ck("titles", "Every slide has a title", "Give each slide a title.", "Titles help the audience keep track.", D.titles()),
    ],
    solutionTheme: "forest",
    solution: [sl.title("Canteen orders", "How a lunch order reaches the kitchen"), sl.section("The journey"), withShapes(sl.bullets("Three steps", "- Order\n- Cook\n- Collect"), 3), sl.two("Before and after", "- Paper slips\n- Long queues", "- Online orders\n- Short queues")],
  }),
  slidesLab({
    id: "p4-story", module: "story-and-delivery", title: "Tell a story in seven slides", level: "intermediate", minutes: 18, xp: 60, skills: [SK], required: true,
    objective: "Give a talk a beginning, middle and end, with one idea per slide and a strong close.",
    scenario: "You must persuade the principal to start a morning reading half hour. Build the deck.",
    steps: ["Slide 1: a Title slide with a clear title.", "Slide 2: the problem. Slide 3: evidence. Slide 4: your idea.", "Slides 5 and 6: benefits and cost.", "Slide 7: a clear request, titled Our request.", "Keep every slide to four bullets or fewer."],
    checks: [
      ck("count", "Six to eight slides", "Plan the story before you type.", "A short deck keeps attention.", D.count(6, 8)),
      ck("first", "A title slide first", "Choose the Title layout for slide 1.", "The first slide frames the talk.", D.titleFirst()),
      ck("titles", "Every slide has a title", "A title for each slide.", "Titles carry the story if someone only reads the headlines.", D.titles()),
      ck("problem", "A slide about the problem", "Include the word problem on a slide.", "Say what is wrong before you offer a fix.", D.contains("problem")),
      ck("ask", "A final request slide", "Include Our request on the last slide.", "End with a specific ask.", D.contains("our request")),
      ck("read", "Readable slides", "Four bullets and about 30 words or fewer per slide.", "People should read each slide in seconds.", D.readable(4, 30)),
    ],
    solution: [sl.title("Thirty Minutes to Read", "A proposal for the morning"), sl.bullets("The problem", "- Many students read very little\n- Mornings feel rushed"), sl.bullets("The evidence", "- Our survey: 6 in 10 read nothing for fun\n- Readers score higher in English"), sl.bullets("Our idea", "- A quiet reading half hour\n- Start of the day, three days a week"), sl.bullets("The benefits", "- Calmer mornings\n- Better vocabulary"), sl.bullets("The cost", "- Fifty books from the library\n- No extra staff"), sl.bullets("Our request", "- Approve a one-term trial")],
  }),
  classifyLab({
    id: "p5-critique", module: "words-that-work", title: "Good slide or bad slide?", level: "beginner", minutes: 7, xp: 25, skills: [SK], required: true,
    objective: "Spot the habits that make slides easy or hard to follow.", scenario: "Judge each slide habit.",
    steps: ["Read each habit.", "Choose Helps or Hurts.", "Press Check my work."],
    categories: [["helps", "Helps the audience"], ["hurts", "Hurts the audience"]],
    items: [["One idea per slide", "helps", "A single idea is easy to take in."], ["Full paragraphs copied from a report", "hurts", "People read ahead and stop listening."], ["A headline written as a full sentence that states the point", "helps", "The title carries the message."], ["Text smaller than the audience can read from the back", "hurts", "If they cannot read it, it is wasted."], ["A clear contrast between text and background", "helps", "Contrast makes text readable in any room."], ["Ten bullet points with sub-bullets", "hurts", "Too much to read, so the audience stops following."], ["The same fonts and colours on every slide", "helps", "Consistency looks professional and avoids distraction."], ["Flashy animations on every line", "hurts", "Movement pulls attention from your message."]],
  }),
  classifyLab({
    id: "p6-layouts", module: "slide-structure-and-layouts", title: "Pick the layout", level: "beginner", minutes: 6, xp: 20, skills: [SK], required: false,
    objective: "Match each purpose to the best slide layout.", scenario: "Each layout has a job. Choose the best one for each slide.",
    steps: ["Read each purpose.", "Choose a layout.", "Press Check my work."],
    categories: [["title", "Title slide"], ["bullets", "Title and bullets"], ["two", "Two columns"], ["section", "Section heading"]],
    items: [["The first slide with the talk's name and your name", "title", "A title slide opens the talk."], ["A slide listing three reasons for your proposal", "bullets", "A short list of points suits title and bullets."], ["Comparing the old way with the new way side by side", "two", "Two columns make a comparison obvious."], ["A divider before the part of the talk about costs", "section", "A section slide marks a change of topic."], ["Showing pros on the left and cons on the right", "two", "Side-by-side points suit two columns."], ["The slide that thanks the audience and gives your contact", "title", "A closing slide can reuse the title layout."]],
  }),
  classifyLab({
    id: "p8-review", module: "review-and-present", title: "Review checklist: fix or leave?", level: "intermediate", minutes: 7, xp: 25, skills: [SK], required: true,
    objective: "Decide which problems a review should fix.", scenario: "You are reviewing a classmate's deck before they present it.",
    steps: ["Read each finding.", "Choose Fix it or Leave it.", "Press Check my work."],
    categories: [["fix", "Fix it"], ["leave", "Leave it"]],
    items: [["A slide with eleven bullet points", "fix", "Too much text: cut it down or split the slide."], ["A spelling mistake in a title", "fix", "Typos in titles are the first thing people notice."], ["A bar chart whose axis starts at 90", "fix", "A cut-off axis exaggerates small differences."], ["Titles in the same place on every slide", "leave", "Consistency is what you want."], ["A plain white background with dark text", "leave", "High contrast is easy to read; plain is fine."], ["Light grey text on a white background", "fix", "Low contrast cannot be read from the back of a room."], ["A closing slide that says what the audience should do", "leave", "A clear request is a strength."], ["A picture with no description", "fix", "Add alternative text so everyone can understand it."]],
  }),
  classifyLab({
    id: "p7-delivery", module: "story-and-delivery", title: "Delivery dos and don'ts", level: "intermediate", minutes: 7, xp: 25, skills: [SK], required: true,
    objective: "Choose habits that make a talk clear and confident.", scenario: "Good delivery matters as much as good slides.",
    steps: ["Read each habit.", "Choose Do or Don't.", "Press Check my work."],
    categories: [["do", "Do"], ["dont", "Don't"]],
    items: [["Rehearse out loud at least twice", "do", "Practice reveals awkward phrases and timing problems."], ["Read the slides word for word", "dont", "The audience can read faster than you speak."], ["Look at the audience, not the screen", "do", "Eye contact builds trust."], ["Apologise at the start for being nervous", "dont", "It draws attention to nerves and lowers confidence."], ["Pause after an important point", "do", "A pause lets the point sink in."], ["Go over your time", "dont", "Finishing late loses goodwill; trim content instead."], ["Prepare an answer for the likely questions", "do", "Preparation turns difficult questions into easy ones."], ["Stand in front of the screen", "dont", "You block the slide and your face is in shadow."]],
  }),
  slidesLab({
    id: "cap-deck", module: "capstone", title: "Final project: a ten-minute talk", level: "challenge", minutes: 30, xp: 130, skills: [SK], required: true,
    objective: "Bring structure, readable slides, visuals and a strong close together.",
    scenario: "Present a plan to improve something at your school or in your community. Build a deck of seven to nine slides.",
    steps: ["Slide 1: a Title slide naming your plan.", "Include a slide called The problem and a slide called Our plan.", "Draw one simple diagram with at least three shapes.", "Use at least three different layouts.", "Keep every slide to four bullets or fewer and about 30 words.", "Finish with a slide titled Next steps."],
    checks: [
      ck("count", "Seven to nine slides", "Plan the talk before you type.", "A ten-minute talk needs about eight slides.", D.count(7, 9)),
      ck("first", "A title slide first", "Choose the Title layout.", "The deck opens with its title.", D.titleFirst()),
      ck("titles", "Every slide has a title", "Check each slide.", "Titles carry the structure.", D.titles()),
      ck("problem", "A slide called The problem", "Include The problem as a title.", "State the problem before the plan.", D.contains("the problem")),
      ck("plan", "A slide called Our plan", "Include Our plan as a title.", "Say clearly what you propose.", D.contains("our plan")),
      ck("shapes", "A diagram with at least three shapes", "Use the Shape button on one slide.", "A simple diagram helps people see the process.", D.shapes(3)),
      ck("layouts", "At least three layouts", "Use title, bullets and two-column layouts.", "Variety keeps the audience interested.", D.layouts(3)),
      ck("read", "Readable slides", "Four bullets and about 30 words or fewer per slide.", "Each slide should be read in seconds.", D.readable(4, 30)),
      ck("next", "A closing Next steps slide", "End with Next steps.", "Tell the audience what happens now.", D.contains("next steps")),
    ],
    solutionTheme: "slate",
    solution: [sl.title("A Greener Schoolyard", "A plan from Class 9"), sl.bullets("The problem", "- The yard is bare and hot\n- Few students use it at lunch"), sl.bullets("What we found", "- Temperature is 6 degrees higher than in the garden\n- Only 1 in 5 students use the yard"), withShapes(sl.bullets("Our plan", "- Plant\n- Shade\n- Seat"), 3), sl.two("Before and after", "- Bare concrete\n- Nowhere to sit", "- Trees and shade\n- Benches in groups"), sl.bullets("Cost and effort", "- Saplings from the council\n- Volunteer planting day"), sl.bullets("Next steps", "- Approve the plan\n- Choose the planting date")],
  }),
];

/* ---------------------------------------------------------------------------------------------------------------- lessons */
const M1 = module_({
  slug: "plan-before-you-open", title: "Plan before you open the software", hours: 1, level: "Foundations",
  summary: "Decide who the talk is for, what they should do afterwards, and the three points that get them there.",
  outcome: "You can write a one-sentence message, choose three supporting points and outline a talk on paper before opening any slide software.",
  intro: "Most bad presentations are not bad because of the slides. They are bad because the speaker never decided what the point was. Spend your first ten minutes with a pen and paper, and the slides will almost build themselves.",
  topics: [
    topic({
      title: "Audience, purpose and the one-sentence message", slug: "audience-and-message",
      blocks: [
        p("Start with three questions. **Who** is listening, and what do they already know? **Why** are you speaking: to inform, persuade or teach? **What** should they think, feel or do when you finish?"),
        table("Answer these before you start", ["Question", "Example"], [["Who is the audience?", "Teachers and the principal, busy, not technical"], ["What do they know?", "That students are often late, but not why"], ["What do I want them to do?", "Approve a trial of a new gate timetable"], ["How long do I have?", "Ten minutes plus questions"]]),
        def("Core message", "The one sentence you want the audience to remember. If they forgot everything else, this is what they should leave with."),
        example("Write the core message", "A student wants to ask for a bicycle shed.", ["Weak: Bicycles at our school.", "Better: Our school needs a covered bicycle shed so more students can cycle safely.", "Test: could the audience repeat it? If not, make it shorter."], "A good core message is a complete sentence that states what you want and why."),
        tip("Write your message on a sticky note and keep it in view while you build the deck. Every slide should serve it."),
      ],
      points: ["Know your audience, purpose and the action you want.", "A core message is one complete sentence."],
      check: [["What is a core message?", ["The longest slide", "The one sentence you want remembered", "The title of the file", "The speaker's name"], 1, "It is the single idea the audience should leave with."], ["Which is the best first step in preparing a talk?", ["Choose a theme", "Decide the audience and purpose", "Add animations", "Pick fonts"], 1, "Purpose comes before decoration."]],
    }),
    topic({
      title: "Structure: beginning, middle and end", slug: "structure",
      blocks: [
        flow("A simple talk structure", ["Hook: why this matters", "Problem or context", "Your idea or evidence", "What to do next"]),
        p("Most talks work with **three main points**. People remember three things; they forget ten. Group your material under three headings and cut what does not fit."),
        table("A ten-minute talk", ["Part", "Time", "Slides"], [["Opening: hook and message", "1 minute", "1 to 2"], ["Three main points", "7 minutes", "4 to 5"], ["Close: summary and request", "2 minutes", "1 to 2"]]),
        bars("Where the time goes (minutes)", [["Opening", 1], ["Point one", 2], ["Point two", 2.5], ["Point three", 2.5], ["Close", 2]]),
        warn("A rough rule is one slide per minute or less. Fifteen slides in ten minutes means you are rushing."),
        mistakes(["Starting with your name, your school and an apology.", "Reading out a list of what you will cover for two minutes.", "Ending with Thank you and nothing else."]),
      ],
      points: ["Hook, problem, idea, next step.", "Three main points; about one slide per minute."],
      check: [["How many main points does a short talk usually need?", ["Ten", "Three", "One slide only", "As many as possible"], 1, "Three is memorable."], ["Fifteen slides for ten minutes is:", ["Ideal", "Probably too many", "Required", "Too few"], 1, "More than about one slide a minute means rushing."]],
    }),
    topic({
      title: "Storyboarding on paper", slug: "storyboarding",
      blocks: [
        p("A **storyboard** is a row of rough boxes, one per slide, where you write each slide's headline and sketch what it will show. It takes ten minutes and saves hours of rework."),
        list("How to storyboard", ["Fold a sheet of paper into eight boxes.", "Write the headline of each slide at the top of its box.", "Sketch the picture, chart or diagram, or write the three key words.", "Read just the headlines in order: do they tell the whole story?", "Cut or merge any slide that does not help the message."], true),
        example("Headlines that tell the story", "A talk about plastic waste.", ["1. Our school throws away 40 kilograms a day", "2. Most of it could be recycled", "3. Students do not know which bin to use", "4. Clear bins and a monitor can fix that", "5. Please approve the trial"], "If the headlines read like a short argument, the talk will be easy to follow."),
        tryIt("Why should the headlines read like a story on their own?", "Because the audience mostly remembers the headlines, and a reader skimming the file should still get the argument."),
      ],
      points: ["Storyboard on paper before using software.", "The headlines alone should tell the story."],
      check: [["What is a storyboard?", ["A finished deck", "A rough plan of each slide's headline and picture", "A theme", "A script"], 1, "It is a rough sketch plan."]],
    }),
  ],
  terms: [["Audience", "The people you are speaking to"], ["Core message", "The one sentence to remember"], ["Hook", "The opening that shows why it matters"], ["Storyboard", "A rough plan of each slide"], ["Call to action", "What you want people to do next"]],
  practical: { title: "Practical: plan a talk on paper", intro: "Choose a topic you know well.", steps: ["Write the audience, purpose and your core message.", "Choose three main points.", "Storyboard eight boxes with a headline in each.", "Read just the headlines and fix any gaps."] },
  quiz: [
    ["Why plan before opening the software?", ["To avoid the computer", "A clear plan prevents rambling slides", "Software is slow", "It is a rule"], 1, "Planning gives the talk a point."],
    ["A good core message is:", ["A single word", "A complete sentence stating the idea", "A list of facts", "A quote"], 1, "A sentence people can repeat."],
    ["A common structure is:", ["Hook, problem, idea, next step", "Name, name, name", "Thanks only", "Random"], 0, "It moves from why to what to now."],
    ["How many slides for a ten-minute talk?", ["About 8", "About 30", "About 2", "About 60"], 0, "Around one slide a minute or fewer."],
    ["What should the headlines do when read alone?", ["Be blank", "Tell the story", "Be jokes", "Repeat the title"], 1, "They carry the argument."],
    ["What is a call to action?", ["A theme", "What you want the audience to do", "An animation", "A font"], 1, "It states the next step."],
    ["Which is the weakest opening?", ["A surprising number", "A short story", "Reading the agenda and apologising", "A direct question"], 2, "Agenda and apology lose attention."],
  ],
});

const M2 = module_({
  slug: "slide-structure-and-layouts", title: "Slide structure and layouts", hours: 1, level: "Core skills",
  summary: "Use layouts, themes and consistency to give every slide a clear job and a consistent look.",
  outcome: "You can choose the right layout for a slide, apply a theme and keep fonts, colours and positions consistent.",
  intro: "A deck should look like one object, not a collection of separate pages. Layouts and themes do most of that work for you, as long as you use them instead of working against them.",
  topics: [
    topic({
      title: "The four layouts you need", slug: "layouts",
      blocks: [
        table("Layouts and their jobs", ["Layout", "Job", "Example"], [["Title slide", "Opens or closes the talk", "Canteen orders: a plan from Class 9"], ["Title and bullets", "A point with a few supports", "Three benefits of a reading hour"], ["Two columns", "A comparison or a pair", "Before and after"], ["Section heading", "Divides the talk", "Part two: the cost"]]),
        p("Use **title and bullets** for most slides, and keep the others for moments where they add meaning. Do not change layouts only for variety: each change should signal that something is different."),
        example("Choose the layouts for an eight-slide talk", "A talk proposing a school garden has eight slides.", ["Slide 1 uses the title layout for the talk's name.", "Slides 2 to 4 use title and bullets for the problem, the evidence and the idea.", "Slide 5 uses a section heading to mark the move from why to how.", "Slide 6 uses two columns to compare the costs and the benefits.", "Slides 7 and 8 use title and bullets for the plan and the request."], "Mostly title and bullets, with the other layouts used only where they signal something: a start, a change of topic or a comparison."),
        tip("If you find yourself fighting a layout, you probably chose the wrong one. Change it rather than moving boxes by hand."),
      ],
      points: ["Title, bullets, two columns and section cover most needs.", "Choose a layout for its job, not for variety."],
      check: [["Which layout suits a before-and-after comparison?", ["Title slide", "Two columns", "Section heading", "Blank"], 1, "Two columns put the two sides together."]],
    }),
    topic({
      title: "Themes, fonts and colour", slug: "themes",
      blocks: [
        p("A **theme** sets the fonts, colours and background for the whole deck. Choose one at the start and keep it. Change a colour or font in the theme, not slide by slide, so every slide changes together."),
        list("Rules for a clean look", ["One theme for the whole deck.", "Two fonts at most: one for titles, one for body text.", "A small palette: one main colour, one accent, plus black, white and grey.", "Strong contrast between text and background.", "Dark text on a light background for rooms with lights on; light on dark for dim rooms."], true),
        warn("Red text on a green background, or light grey on white, may be unreadable for people with colour vision differences or on a bright projector."),
      ],
      points: ["One theme, two fonts, a small palette, strong contrast.", "Change fonts and colours in the theme so every slide updates together."],
      check: [["Where should you change fonts for the whole deck?", ["On every slide", "In the theme", "In the footer", "In the file name"], 1, "Theme settings apply across the deck."]],
    }),
    topic({
      title: "Consistency and alignment", slug: "consistency",
      blocks: [
        p("The audience notices when a title jumps a few pixels between slides, even if they cannot say why. Keep titles in the same place, with the same size and colour, and keep margins consistent."),
        table("A consistency checklist", ["Check", "Why"], [["Titles in the same position", "The eye does not need to search"], ["Same bullet style everywhere", "Looks designed, not assembled"], ["Same margin around content", "A tidy frame"], ["Same style for images and shapes", "Feels like one deck"], ["Slide numbers (if used) in the same corner", "Helps people refer to slides"]]),
        mistakes(["Moving a title by hand on one slide.", "Mixing three kinds of bullet.", "Pasting from another deck without matching its look."]),
      ],
      points: ["Keep titles, margins and styles identical across slides.", "A tidy, consistent deck lets the audience focus on what you say."],
      check: [["Why keep titles in the same place?", ["It is a rule of the software", "The audience does not have to search for them", "It saves ink", "It makes slides longer"], 1, "A stable layout lets people focus on content."]],
    }),
  ],
  terms: [["Layout", "The arrangement of boxes on a slide"], ["Theme", "A set of fonts, colours and backgrounds"], ["Contrast", "Difference between text and background"], ["Consistency", "Using the same style everywhere"]],
  practical: { title: "Practical: five slides about yourself", intro: "Use the first lab.", steps: ["Choose a theme first.", "Use a title slide, then title and bullets for the rest.", "Check every title is in the same position.", "Keep to four bullets per slide."] },
  quiz: [
    ["A theme controls:", ["Only the title", "Fonts, colours and background", "File size", "Slide count"], 1, "It sets the look of the whole deck."],
    ["How many fonts at most?", ["One per slide", "Two", "Ten", "As many as you like"], 1, "Two keeps a deck tidy."],
    ["The best layout for a divider between parts:", ["Two columns", "Section heading", "Blank", "Title"], 1, "A section slide marks a change of topic."],
    ["Why use strong contrast?", ["It looks bold", "Text stays readable in any room", "It saves memory", "It is a rule"], 1, "Contrast makes text readable."],
    ["What should you do if a layout does not fit?", ["Fight it with manual moves", "Choose a better layout", "Delete the slide", "Make the text smaller"], 1, "Change the layout instead."],
    ["Inconsistent title positions will:", ["Go unnoticed", "Make the deck feel messy", "Speed up the talk", "Improve contrast"], 1, "The eye notices movement."],
    ["What belongs in the theme?", ["Your speech", "Fonts and colours", "Questions", "Notes"], 1, "Theme settings are global."],
  ],
});

const M3 = module_({
  slug: "words-that-work", title: "Words that work on a slide", hours: 1, level: "Core skills",
  summary: "Write headlines that make a point and keep text short enough to read in seconds.",
  outcome: "You can write headline sentences, trim bullets to key words and decide what goes on the slide and what you say aloud.",
  intro: "A slide is not a document. The audience will read it in about five seconds and then look back at you. This module is about saying less on the slide so that more of your message gets through.",
  topics: [
    topic({
      title: "Headlines that make a point", slug: "headlines",
      blocks: [
        p("A label tells the audience the **topic**: Sales. A headline tells them the **point**: Sales rose 20% after we changed the menu. Write your slide titles as short sentences that state the message of the slide."),
        table("Label versus headline", ["Label (weak)", "Headline (strong)"], [["Recycling", "Most of our school waste could be recycled"], ["Results", "Reading time doubled in one term"], ["Cost", "The shed costs less than one new computer"], ["Plan", "Three steps get bins in every class by May"]]),
        tip("Test a headline by covering the rest of the slide. If the title alone gives the point, it works."),
        tryIt("Rewrite the label Our survey as a headline for a survey where 6 in 10 students read nothing for fun.", "Six in ten students read nothing for fun."),
      ],
      points: ["A headline states the point; a label only names the topic.", "Keep headlines to one short line."],
      check: [["Which is a headline rather than a label?", ["Results", "Profit rose 12% this year", "Next steps", "Introduction"], 1, "It states the point."]],
    }),
    topic({
      title: "Less text, bigger text", slug: "less-text",
      blocks: [
        list("Rules of readable text", ["No more than four bullets per slide.", "No more than about six words per bullet.", "Body text at 24 points or larger so people at the back can read it.", "One idea per slide: if you need 'and', you probably need two slides.", "Full sentences go in your notes, not on the slide."], true),
        example("Cut a bullet", "Before: Recycling is the process of converting waste materials into new objects.", ["Find the key idea: waste becomes new things.", "Cut the filler words: the process of, converting.", "Result: Waste becomes new things."], "Short bullets point to your idea; you say the rest aloud."),
        warn("If you could hand out the slide as a document and nobody would need you, it has too much text for a talk."),
        bars("Words per slide: aim low", [["Overloaded slide", 120], ["Typical bad slide", 70], ["Readable slide", 25]]),
      ],
      points: ["Four bullets, six words each, body text 24 points or larger.", "Put the detail in notes or a handout, not on the slide."],
      check: [["What is a sensible limit for bullets on a slide?", ["Twelve", "Four", "Thirty", "None"], 1, "Four is about the most people can scan at once."], ["Where do full sentences belong?", ["On the slide", "In your notes", "In the footer", "In the theme"], 1, "Speak them, or keep them in your notes."]],
    }),
    topic({
      title: "Notes and handouts", slug: "notes-and-handouts",
      blocks: [
        p("Because slides are short, your detail needs a home. Put it in the **speaker notes** (for you) and in a **handout** (for the audience, given after the talk). Never hand it out before: people read ahead and stop listening."),
        table("What goes where", ["Place", "Contents"], [["The slide", "A headline, a picture, three to four key words"], ["Speaker notes", "What you will say, numbers to remember, sources"], ["Handout", "Full data, references and contact details"]]),
        tip("Practise from your notes once, then try to speak from the slides alone. Notes are a safety net, not a script to read out."),
      ],
      points: ["Notes are for you; handouts are for the audience, after the talk.", "Keep the slide short and put the detail where it belongs."],
      check: [["When should a handout be given?", ["Before you start", "After the talk", "During every slide", "Never"], 1, "Give it afterwards so people listen first."]],
    }),
  ],
  terms: [["Headline", "A title that states the point"], ["Label", "A title that only names the topic"], ["Speaker notes", "Notes only the speaker sees"], ["Handout", "A document given to the audience after the talk"]],
  practical: { title: "Practical: fix your own slide", intro: "Take a slide you have made or the overloaded one in the lab.", steps: ["Rewrite the title as a headline.", "Cut to four bullets of six words each.", "Move the detail into notes.", "Check that you can read it from three metres away."] },
  quiz: [
    ["Which title is a headline?", ["Introduction", "Sales fell because the shop closed", "Overview", "Contents"], 1, "It states the point."],
    ["How many bullets is sensible?", ["Four or fewer", "Twelve", "Twenty", "As many as fit"], 0, "Four or fewer."],
    ["Where do the full details belong?", ["On the slide", "In speaker notes or a handout", "In the footer", "Nowhere"], 1, "Slides carry key words only."],
    ["A good body font size is at least:", ["8 points", "12 points", "24 points", "4 points"], 2, "24 points can be read from the back."],
    ["Why give handouts after the talk?", ["It is polite", "People read instead of listening if given earlier", "Printers are slow", "It saves paper"], 1, "Early handouts compete with you."],
    ["If you need 'and' in a slide idea you probably need:", ["Bigger text", "Two slides", "A new theme", "A video"], 1, "One idea per slide."],
    ["What do speaker notes help with?", ["Hiding slides", "Reminding you what to say", "Printing", "Adding colour"], 1, "They remind you of detail."],
  ],
});

const M4 = module_({
  slug: "visuals-and-data", title: "Visuals, shapes and data", hours: 1, level: "Applied skills",
  summary: "Use pictures, diagrams and charts to show what words cannot, and keep them clean.",
  outcome: "You can choose a visual that suits the message, draw a simple process diagram with shapes and present numbers honestly.",
  intro: "People remember pictures better than words. But a picture must carry the message, not decorate it. This module is about choosing the visual that does the job, and drawing it simply.",
  topics: [
    topic({
      title: "Choosing a visual", slug: "choosing-visuals",
      blocks: [
        table("Match the visual to the message", ["Message", "Visual"], [["How a process works", "A flow of boxes and arrows"], ["How two things compare", "A bar chart or two columns"], ["How something changes over time", "A line chart"], ["What something looks like", "A photograph"], ["How parts make up a whole", "A pie chart with few parts"]]),
        warn("Decoration is not visual. Clip art that only fills space distracts from your point; leave white space instead."),
        example("Pick a visual", "You want to show that a new bus route cut travel time from 50 minutes to 30.", ["Message: the new route is faster.", "Comparison of two numbers, so use two bars or two columns.", "Label the bars with the minutes and start the axis at zero.", "Headline: The new route saves twenty minutes."], "The right visual is the simplest one that shows the comparison without extra decoration."),
        tip("Ask of every picture: what does it show that my words do not? If the answer is nothing, delete it."),
      ],
      points: ["Choose the visual for the message.", "Delete decoration."],
      check: [["Which visual shows how a process works?", ["A pie chart", "Boxes joined by arrows", "A photo of a face", "A table of names"], 1, "A flow diagram follows the steps."]],
    }),
    topic({
      title: "Drawing a simple diagram", slug: "simple-diagrams",
      blocks: [
        flow("A three-step process", ["Order", "Cook", "Collect"]),
        list("How to draw a clean diagram", ["Use one shape for one idea: a box for a step, an arrow for the flow.", "Keep the same size and spacing between boxes.", "Put short words inside the shapes, not sentences.", "Use one accent colour to highlight the most important step.", "Align shapes in a row or a column, never at random angles."], true),
        mistakes(["Shapes of many colours with no meaning.", "Long text inside a box that does not fit.", "Arrows that cross each other."]),
      ],
      points: ["One shape, one idea; align and space evenly.", "Keep words inside shapes to one or two, and highlight only the key step."],
      check: [["What should text inside a diagram box be?", ["A paragraph", "A few words", "Empty", "A URL"], 1, "Keep text inside shapes short."]],
    }),
    topic({
      title: "Showing numbers honestly", slug: "numbers-honestly",
      blocks: [
        p("A chart is persuasive, so it carries a duty to be fair. Start bars at zero, label what is measured and give the source."),
        bars("Students who cycle to school (out of 100)", [["Last year", 6], ["This year", 8]]),
        list("Honest charts", ["Bars start at zero, or the difference is exaggerated.", "Label the axis or the bars with the unit.", "One message per chart; state it in the headline.", "Avoid 3D effects; they distort sizes.", "Cite the source of the data."]),
        example("A headline for a chart", "A bar chart shows 8 cyclists this year and 6 last year.", ["Do not write Cycling numbers.", "Write: Cycling rose from 6 to 8 students out of 100.", "Say aloud that it is a small change but a start."], "A chart headline states the finding and the scale, so the audience is not misled."),
      ],
      points: ["Start bars at zero, label units, one message per chart.", "Write the chart headline as the finding, and cite the source."],
      check: [["Why start a bar chart at zero?", ["It looks tidier", "A cut-off axis exaggerates differences", "It is faster", "It adds colour"], 1, "Truncated bars mislead."]],
    }),
  ],
  terms: [["Diagram", "A picture of how something works"], ["Alignment", "Lining up shapes along a line"], ["Chart", "A picture of numbers"], ["Source", "Where the data came from"]],
  practical: { title: "Practical: draw a process", intro: "Pick any three-step process you know (making tea, logging in, applying for a card).", steps: ["Sketch it as boxes and arrows.", "Rebuild it with shapes in the lab.", "Keep words to one or two per box.", "Highlight the key step in an accent colour."] },
  quiz: [
    ["The best visual for a sequence of steps is:", ["A pie chart", "Boxes and arrows", "A photo", "A table"], 1, "A flow shows order."],
    ["Chart bars should start at:", ["Any number", "Zero", "The smallest value", "Ten"], 1, "Zero keeps the comparison honest."],
    ["Decorative clip art is:", ["Always useful", "Usually a distraction", "Required", "Better than white space"], 1, "Leave white space instead."],
    ["A chart headline should:", ["Name the chart", "State the finding", "Be blank", "Be a joke"], 1, "It should tell the audience the point."],
    ["In a diagram, text inside boxes should be:", ["Long", "Short", "Hidden", "Italic"], 1, "A few words."],
    ["3D charts are a problem because they:", ["Look too simple", "Distort sizes", "Cost money", "Are too fast"], 1, "Perspective distorts comparison."],
    ["Why cite a source?", ["To fill space", "It builds trust", "It is required by software", "It changes the colour"], 1, "A source lets people check."],
  ],
});

const M5 = module_({
  slug: "story-and-delivery", title: "Story and delivery", hours: 1.5, level: "Applied skills",
  summary: "Open with a hook, move through your points with clear transitions, and speak with confidence.",
  outcome: "You can open a talk strongly, link ideas smoothly, rehearse effectively and handle questions.",
  intro: "The best deck cannot rescue a poor delivery, and a confident speaker can survive an ordinary deck. This module covers what you say and how you say it.",
  topics: [
    topic({
      title: "Openings and closings", slug: "openings-and-closings",
      blocks: [
        table("Ways to open", ["Opening", "Example"], [["A surprising number", "Forty kilograms of waste leave our school every day."], ["A short story", "Last Monday I watched a student carry a full lunch to the bin."], ["A question", "How many of you have ever been unsure which bin to use?"], ["A bold promise", "In ten minutes I will show you how to halve our waste."]]),
        p("Your close matters as much as your opening. End with a **summary of your three points** and a **specific request**. Do not trail off with 'that is all'; finish on your ask, then say thank you."),
        tip("Memorise your first and last sentences. Starting and finishing strongly makes the middle easier."),
      ],
      points: ["Open with a number, story, question or promise.", "Close with a summary and a request."],
      check: [["Which is a strong opening?", ["Sorry, I am nervous", "Forty kilograms of waste leave our school every day", "Today I will talk about waste", "Um, hello"], 1, "A striking fact grabs attention."]],
    }),
    topic({
      title: "Transitions and signposting", slug: "signposting",
      blocks: [
        p("**Signposts** tell the audience where they are in the talk: 'First, the problem. Second, our plan. Third, the cost.' **Transitions** link one slide to the next: 'That is the problem. So what can we do?'"),
        list("Useful signposts", ["First, second and finally.", "That is the problem. Now the solution.", "So what does this mean for us?", "Let me summarise the three points."]),
        example("Link two slides", "Slide 3 ends the problem; slide 4 starts the plan.", ["Say: So that is what is wrong. Here is what we can do about it.", "Click to the next slide only after saying it.", "The audience hears the link before the new slide appears."], "A one-sentence bridge keeps the talk flowing."),
      ],
      points: ["Signposts tell people where they are; transitions link the slides.", "Say the bridge sentence before you click to the next slide."],
      check: [["What is a signpost?", ["A slide number", "A phrase that tells people where you are in the talk", "A theme", "An animation"], 1, "It orients the audience."]],
    }),
    topic({
      title: "Voice, rehearsal and questions", slug: "voice-and-rehearsal",
      blocks: [
        list("Delivery habits", ["Speak a little slower than feels natural.", "Pause after each key point.", "Look at people, not at the screen.", "Stand to one side so nobody's view is blocked.", "Use your hands naturally; do not hide them."], true),
        flow("A rehearsal plan", ["Read through alone", "Time it out loud", "Cut what is too long", "Practise in front of a friend"]),
        table("Handling questions", ["Situation", "What to do"], [["You know the answer", "Answer briefly, then check you answered it"], ["You do not know", "Say so, and promise to find out"], ["A long or off-topic question", "Offer to talk afterwards"], ["A hostile question", "Stay calm; thank them; answer the fair part"]]),
        p("Nerves are normal and mostly invisible to the audience. Slow your breathing before you start, plant your feet, and focus on helping the audience rather than on being judged. A speaker who is slightly nervous but well prepared always beats one who is fluent but has nothing to say."),
        warn("Never apologise for your slides. If something goes wrong, carry on calmly: the audience will follow your lead."),
      ],
      points: ["Speak slowly, pause, look up, rehearse aloud.", "It is fine to say you do not know."],
      check: [["What is the best response to a question you cannot answer?", ["Make something up", "Say you do not know and promise to find out", "Ignore it", "Change the subject"], 1, "Honesty builds trust."], ["How can rehearsal help?", ["It changes the theme", "It shows timing and awkward phrases", "It deletes slides", "It is optional"], 1, "Spoken rehearsal reveals problems."]],
    }),
  ],
  terms: [["Hook", "A strong opening"], ["Signpost", "A phrase that tells people where they are"], ["Transition", "A link between two ideas"], ["Rehearsal", "Practising out loud"]],
  practical: { title: "Practical: record yourself", intro: "Use your phone.", steps: ["Deliver your three-minute talk once and record it.", "Watch it: note where you rushed or looked away.", "Fix two things and record again.", "Write the opening and closing sentences down."] },
  quiz: [
    ["A signpost is:", ["A theme", "A phrase that tells people where you are", "A shape", "A chart"], 1, "It orients the audience."],
    ["The best way to end a talk is with:", ["That's all", "A summary and a clear request", "An apology", "Silence"], 1, "A clear ask drives action."],
    ["If you do not know an answer you should:", ["Guess", "Say so and promise to find out", "Skip it", "Leave"], 1, "Honesty is best."],
    ["Where should you look while speaking?", ["At the screen", "At the audience", "At the floor", "At your notes"], 1, "Eye contact builds trust."],
    ["Why rehearse out loud?", ["It is a rule", "To find awkward phrases and check timing", "To use more slides", "To change the font"], 1, "Silent reading hides problems."],
    ["A transition helps:", ["Move between ideas", "Change the theme", "Count words", "Save the file"], 0, "It links ideas."],
    ["What should you do if something goes wrong?", ["Apologise repeatedly", "Carry on calmly", "Stop the talk", "Leave"], 1, "Calm is contagious."],
  ],
});

const M6 = module_({
  slug: "review-and-present", title: "Review and present", hours: 1, level: "Applied skills",
  summary: "Check a deck against a simple list, make it accessible, and present it well in person or online.",
  outcome: "You can review a deck against a checklist, export it for sharing and present confidently face to face or remotely.",
  intro: "The last ten percent of the work decides how professional a talk looks. This module gives you a checklist and some habits for the day itself.",
  topics: [
    topic({
      title: "A review checklist", slug: "review-checklist",
      blocks: [
        list("Review checklist", ["Does the deck serve one core message?", "Do the headlines alone tell the story?", "Is any slide overloaded? Cut it.", "Are fonts and colours consistent, and is the contrast strong?", "Is every chart honest and labelled?", "Are spelling, names and numbers correct?", "Does the first slide say what the talk is, and the last say what to do?"], true),
        table("Typical problems and fixes", ["Problem", "Fix"], [["Too many slides", "Merge or delete the weakest"], ["Dense text", "Cut to key words; move detail to notes"], ["Inconsistent look", "Apply the theme; fix positions"], ["Typos", "Read aloud; ask a friend"]]),
        example("Review one slide", "A slide titled Recycling has nine bullets in small text and a clip-art bin.", ["Message check: what is the point? The title does not say.", "Density check: nine bullets is too many; keep the strongest three.", "Visual check: the clip art decorates only; replace it with a number such as 40 kg a day.", "New headline: Our school throws away 40 kilograms a day."], "A good review leaves a slide with one point, a few words and one purposeful visual."),
        tip("Review with a friend who has not seen it. If they cannot tell you the message after one pass, the deck needs work."),
      ],
      points: ["Check message, headlines, density, consistency, honesty and typos.", "Ask someone new to the deck to state the message after one pass."],
      check: [["What is a quick test of a deck's clarity?", ["Count the colours", "Ask someone new to state the message", "Check file size", "Time the animations"], 1, "A fresh viewer reveals unclear points."]],
    }),
    topic({
      title: "Accessible and shareable decks", slug: "accessible-decks",
      blocks: [
        list("Make a deck accessible", ["Use real layouts so titles are readable by screen readers.", "Add a short description to every picture.", "Use large text and strong contrast.", "Do not put key information in colour alone.", "Provide the handout or notes for people who need more time."], true),
        table("Sharing choices", ["Goal", "Choose"], [["People will present it", "Share the editable deck"], ["People will read it", "Export a PDF handout"], ["Large audience", "Share a link with view-only access"]]),
        warn("Remove speaker notes with private comments before you share the file."),
      ],
      points: ["Accessible decks use real layouts, picture descriptions and strong contrast.", "Share a PDF to read, an editable file to present, a view-only link for large groups."],
      check: [["What should every picture have for accessibility?", ["A frame", "A short description", "A border", "A shadow"], 1, "It lets screen readers describe it."]],
    }),
    topic({
      title: "Presenting in a room and online", slug: "room-and-online",
      blocks: [
        table("In person and online", ["Situation", "Tips"], [["In a room", "Arrive early, test the projector and a spare cable; stand beside the screen; keep eye contact"], ["Online", "Test sound and camera; close other tabs; look at the camera; keep slides even simpler; invite questions in chat"]]),
        flow("The day of the talk", ["Arrive early", "Test the equipment", "Open with your hook", "Finish with the request"]),
        mistakes(["Not checking the equipment before the audience arrives.", "Talking to the screen.", "Running over time."]),
      ],
      points: ["Test equipment early; online, look at the camera and simplify.", "Never apologise for your slides; carry on calmly if something fails."],
      check: [["When presenting online you should look at:", ["Your own face", "The camera", "The keyboard", "The ceiling"], 1, "The camera feels like eye contact."]],
    }),
  ],
  terms: [["Checklist", "A list of things to verify"], ["Alt text", "A description of an image"], ["Handout", "A document for the audience"], ["View-only link", "A link that does not allow edits"]],
  practical: { title: "Practical: peer review", intro: "Swap decks with a friend.", steps: ["Use the checklist on their deck.", "Give three kind, specific comments.", "Read your own comments and apply them.", "Present once more to a different person."] },
  quiz: [
    ["Which is on a good review checklist?", ["The file name font", "Do the headlines tell the story", "Number of animations", "Colour of the desktop"], 1, "Headlines should tell the story."],
    ["A PDF handout is for:", ["Presenters only", "Readers who want detail", "Editing", "Hiding notes"], 1, "A PDF is for reading."],
    ["Accessibility includes:", ["Picture descriptions", "More decoration", "Smaller text", "Colour-only signals"], 0, "Describing pictures helps people who cannot see them."],
    ["When presenting online, you should:", ["Look at the camera", "Read from the slides", "Mute everyone always", "Skip the test"], 0, "Looking at the camera creates contact."],
    ["Why arrive early?", ["To waste time", "To test equipment", "To avoid questions", "To print"], 1, "Test equipment first."],
    ["What should you remove before sharing?", ["The title", "Private speaker notes", "The first slide", "The theme"], 1, "Notes can contain private comments."],
    ["The best fix for dense text is:", ["Smaller font", "Cut to key words and move detail to notes", "More colours", "More slides of the same"], 1, "Less text, bigger text."],
  ],
});

export default course({
  slug: "powerpoint-presentation-design", title: "PowerPoint Presentation Design", tagline: "Plan, design and deliver talks people remember", level: "Beginner to Intermediate", hours: 6.5,
  summary: "Learn the craft of presenting: plan the message, structure the slides, write words that work, use visuals honestly and deliver with confidence. Every module has a slide-studio lab that checks your deck.",
  modules: [M1, M2, M3, M4, M5, M6],
  capstone: capstone({
    title: "Final project: a ten-minute talk", summary: "Build a complete deck and pass the final assessment.",
    intro: "You have the tools of a confident presenter. In this final step you build a complete seven-to-nine-slide talk in the slide studio, then take the final assessment covering the course.",
    steps: ["Work through the **Final project: a ten-minute talk** lab with a clear problem, a plan, a diagram and a next-steps slide.", "Practise it aloud twice and time it.", "Take the final assessment below."], projectTitle: "Build and rehearse a ten-minute talk",
    quiz: [
      ["What should you decide before opening the software?", ["The theme", "Audience, purpose and core message", "The font", "The animation"], 1, "Purpose comes first."],
      ["A slide headline should:", ["Name a topic only", "State the point", "Be empty", "Be long"], 1, "A headline states the point."],
      ["A sensible limit of bullets per slide is:", ["Four", "Twelve", "Thirty", "None"], 0, "Four or fewer."],
      ["Bar charts should start at:", ["The smallest value", "Zero", "Fifty", "Any number"], 1, "Otherwise differences are exaggerated."],
      ["The best layout for a before-and-after comparison is:", ["Section heading", "Two columns", "Title", "Blank"], 1, "Two columns put the sides together."],
      ["Which belongs in speaker notes?", ["Full sentences you will say", "The theme", "The file name", "Page numbers"], 0, "Notes hold detail for the speaker."],
      ["A good way to end a talk:", ["Apologise", "Summarise and make a request", "Say That is all", "Skip to questions"], 1, "End with the ask."],
      ["Why rehearse aloud?", ["It is required", "It reveals timing and awkward phrasing", "It adds slides", "It saves the file"], 1, "Silent reading hides problems."],
      ["For accessibility every picture needs:", ["A shadow", "A short description", "A frame", "A bigger size"], 1, "Alt text is a short description that lets screen readers explain a picture to people who cannot see it."],
      ["Which is a good theme practice?", ["A different theme per slide", "One theme throughout", "Random colours", "No theme"], 1, "Consistency."],
      ["When should a handout be given?", ["Before the talk", "After the talk", "Never", "During questions"], 1, "After, so people listen."],
      ["The first slide should:", ["Be empty", "Introduce the talk's title", "List all the points", "Show a quote only"], 1, "Open with a clear title."],
    ],
  }),
  labs,
  skills: [{ id: SK, label: "Presentations" }],
  badges: [
    { id: "clear-intro", title: "Clear introduction", description: "Built a five-slide introduction.", when: { all: ["p1-intro"] } },
    { id: "less-is-more", title: "Less is more", description: "Turned an overloaded slide into clear slides.", when: { all: ["p2-fix-overload"] } },
    { id: "story-teller", title: "Storyteller", description: "Built a seven-slide persuasive talk.", when: { all: ["p4-story"] } },
    { id: "presenter", title: "Presenter", description: "Finished the ten-minute talk project.", when: { all: ["cap-deck"] } },
  ],
  landing: {
    hero: { eyebrow: "Presentation skills · No software to install", title: "PowerPoint Presentation Design: learn by doing", subtitle: "Plan, build and deliver talks in a working slide studio inside your browser. Every deck is checked and explained.", level: "Beginner to Intermediate", outcomeLine: "After this course you can build a clear, persuasive deck and deliver it with confidence." },
    outcomes: [
      { icon: "slides", title: "Plan the message", text: "Audience, purpose, a one-sentence message and a storyboard." },
      { icon: "computer", title: "Structure the deck", text: "Layouts, themes and consistency." },
      { icon: "word", title: "Write words that work", text: "Headlines that make a point and slides that can be read in seconds." },
      { icon: "sheet", title: "Show data honestly", text: "Diagrams, shapes and charts that are clean and fair." },
      { icon: "ai", title: "Tell the story", text: "Openings, signposts, rehearsal and handling questions." },
      { icon: "safety", title: "Finish professionally", text: "A review checklist, accessible files and strong delivery online or in a room." },
    ],
    projects: [
      { title: "A five-slide introduction", text: "A clean first deck.", module: "slide-structure-and-layouts" },
      { title: "Rescue an overloaded slide", text: "Turn a wall of text into clear slides.", module: "words-that-work" },
      { title: "A persuasive talk", text: "Problem, evidence, idea and request.", module: "story-and-delivery" },
      { title: "A ten-minute talk", text: "A complete deck with a diagram and a close.", module: "capstone" },
    ],
    tools: [{ icon: "slides", title: "Slide studio", text: "Layouts, themes, shapes, slideshow mode and download." }, { icon: "sort", title: "Sort and decide", text: "Short activities on slide habits, layouts and delivery." }],
    assessment: ["Finish the required labs in each module: they are checked automatically and explained when something is missing.", "Pass each module quiz (70% or more). You can retry as often as you like.", "Complete the final talk and the final assessment."],
    faq: [
      { q: "Do I need PowerPoint installed?", a: "No. The slide studio runs in your browser. The ideas carry over to PowerPoint, Google Slides, Keynote and Canva." },
      { q: "How long does it take?", a: "About six and a half hours, in short sessions." },
      { q: "Will my deck be judged on taste?", a: "The checks look at structure: titles, readability, layout variety, shapes and key content. Taste is yours." },
    ],
  },
  catalogue: {
    hours: "~6.5 hrs", weeks: "~2 weeks", pace: "3 to 4 hrs/wk", badge: "Presentation Designer",
    brief: "Plan the message, design clean slides, use visuals honestly and deliver with confidence.",
    learn: ["Audience, purpose, core message and storyboarding", "Layouts, themes and consistency", "Headlines, readable text and speaker notes", "Diagrams, shapes and honest charts", "Openings, signposts, rehearsal and questions", "Review checklists, accessibility and online delivery"],
    handsOn: "Build and rehearse a seven-to-nine-slide talk with a diagram and a clear request.",
    outcome: "Present with clarity and confidence at school, college or work.",
  },
});
