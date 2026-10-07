export interface EventData {
  slug: string;
  title: string;
  subtitle: string;
  date: string;
  isoDate: string;
  time: string;
  duration: string;
  format: string;
  badge: "Free" | "Paid";
  price?: string;
  image: string;
  badgeClass: string;
  seats: string;
  status: "upcoming" | "past";
  description: string;
  learnings: string[];
  agenda: { time: string; title: string; desc: string }[];
  speaker: {
    name: string;
    role: string;
    image: string;
    bg: string;
    bio: string;
  };
}

export const eventsData: EventData[] = [
  {
    slug: "adapt-upgrade-connect-ai-driven-world",
    title: "Adapt, Upgrade, Connect: Thriving Professionally in an AI-Driven World",
    subtitle: "A practical workshop on building adaptability, continuous learning, and professional growth in the age of AI.",
    date: "May 16, 2026",
    isoDate: "2026-05-16",
    time: "5:00 PM IST",
    duration: "1 hr",
    format: "In-Person",
    badge: "Free",
    image: "/events/events-ai-driven-world-opt.webp",
    badgeClass: "bg-slate-50 text-slate-700 border border-slate-200",
    seats: "Open",
    status: "past",
    description:
      "This workshop explored how professionals can remain relevant and future-ready in a rapidly evolving AI-driven landscape. Participants learned strategies for adaptability, continuous learning, professional communication, and leveraging emerging technologies to accelerate career growth and create meaningful opportunities.",
    learnings: [
      "Develop an adaptable and future-ready professional mindset",
      "Build continuous learning habits for long-term career growth",
      "Strengthen professional communication and networking skills",
      "Leverage AI-driven opportunities to stay competitive",
      "Create a resilient career strategy in a changing job market",
      "Improve career visibility and professional positioning",
    ],
    agenda: [
      { time: "5:00 PM", title: "Welcome & Context Setting", desc: "Understanding the impact of AI on careers and professional growth." },
      { time: "5:10 PM", title: "Adaptability in the AI Era", desc: "Key mindset shifts required for future-ready professionals." },
      { time: "5:25 PM", title: "Upgrade Your Skills", desc: "Continuous learning strategies and career development frameworks." },
      { time: "5:40 PM", title: "Connect & Grow", desc: "Building meaningful professional relationships and opportunities." },
      { time: "5:55 PM", title: "Q&A & Takeaways", desc: "Action plan for thriving in an AI-driven world." },
    ],
    speaker: {
      name: "Ms. Kanika Mishra",
      role: "NLP Master Practitioner",
      image: "/experts/portraits/kanika-mishra.webp",
      bg: "from-orange-50 to-amber-100",
      bio: "Kanika Mishra is an NLP Master Practitioner focused on personal transformation, communication excellence, and professional development. She helps individuals build confidence, improve adaptability, and unlock growth opportunities through mindset development and practical career strategies.",
    },
  },
  {
    slug: "linkedin-personal-branding-strategic-positioning",
    title: "LinkedIn Personal Branding & Strategic Positioning",
    subtitle: "Build a compelling professional identity and position yourself strategically on LinkedIn in the AI-driven era.",
    date: "May 23, 2026",
    isoDate: "2026-05-23",
    time: "5:00 PM IST",
    duration: "1 hr",
    format: "Online",
    badge: "Free",
    image: "/events/events-linkedin-branding.webp",
    badgeClass: "bg-slate-50 text-slate-700 border border-slate-200",
    seats: "Open",
    status: "past",
    description:
      "This workshop focused on helping students, professionals, academicians, and emerging leaders strengthen their LinkedIn presence and build a strategic personal brand. Participants learned how to optimize their profiles, increase professional visibility, position themselves effectively for recruiters, and leverage AI-powered tools to enhance their digital professional identity.",
    learnings: [
      "Build a compelling and recruiter-friendly LinkedIn profile",
      "Develop a strong personal branding strategy",
      "Increase professional visibility and career opportunities",
      "Use AI-assisted tools for profile enhancement and optimization",
      "Position yourself as a thought leader in your domain",
      "Create meaningful professional connections and networks",
    ],
    agenda: [
      { time: "5:00 PM", title: "Welcome & Introduction", desc: "Overview of personal branding and professional positioning." },
      { time: "5:10 PM", title: "LinkedIn Profile Essentials", desc: "Key components of a high-impact LinkedIn profile." },
      { time: "5:25 PM", title: "Strategic Personal Branding", desc: "Building credibility, authority, and visibility online." },
      { time: "5:40 PM", title: "AI-Powered Profile Enhancement", desc: "Using AI tools to improve profile quality and engagement." },
      { time: "5:55 PM", title: "Q&A & Closing", desc: "Discussion, networking insights, and actionable takeaways." },
    ],
    speaker: {
      name: "Dr. Ruchi Sharma",
      role: "Communication Coach",
      image: "/experts/portraits/ruchi.webp",
      bg: "from-blue-50 to-sky-100",
      bio: "Dr. Ruchi Sharma is a communication coach specializing in personal branding, professional communication, and career positioning. She helps professionals build impactful digital identities, strengthen executive presence, and create meaningful opportunities through strategic networking and personal branding.",
    },
  },
  {
    slug: "aligning-strategy-and-execution",
    title: "A Framework for Aligning Strategy and Execution",
    subtitle:
      "A practical workshop focused on bridging the gap between strategy, execution, and measurable business outcomes.",
    date: "May 30, 2026",
    isoDate: "2026-05-30",
    time: "5:00 PM IST",
    duration: "1 hr",
    format: "In-Person",
    badge: "Free",
    image: "/events/events1.webp",
    badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    seats: "Open",
    status: "upcoming",
    description:
      "In today's rapidly evolving professional landscape, organisations often struggle not with creating strategy but with effectively executing it. This workshop explores practical frameworks that enable stronger alignment between business strategy, operational execution, and measurable outcomes.",
    learnings: [],
    agenda: [],
    speaker: {
      name: "Kharanshu Sharma",
      role: "Senior Program Manager · NTT Data Inc.",
      image: "",
      bg: "from-sky-50 to-blue-100",
      bio: "Senior Program Manager specialising in Business Strategy & Service Portfolio Management at NTT Data Inc.",
    },
  },
  {
    slug: "rewire-to-rise",
    title: "Rewire To Rise",
    subtitle:
      "An immersive NLP and executive growth workshop focused on mindset rewiring, goals, and balanced growth.",
    date: "June 6, 2026",
    isoDate: "2026-06-06",
    time: "5:00 PM IST",
    duration: "1 hr",
    format: "In-Person",
    badge: "Free",
    image: "/events/events1.webp",
    badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    seats: "Open",
    status: "upcoming",
    description:
      "Rewire To Rise is an experience-led corporate workshop designed for professionals ready to stop talking about change and start wiring it in. Participants will explore NLP techniques, goal frameworks, and practical growth systems focused on personal and professional transformation.",
    learnings: [],
    agenda: [],
    speaker: {
      name: "Amandeep Singh Bhateja",
      role: "Accredited NLP Trainer & Executive Growth Coach",
      image: "",
      bg: "from-violet-50 to-indigo-100",
      bio: "Accredited NLP Trainer and Executive Growth Coach helping professionals unlock mindset shifts and sustainable growth.",
    },
  },
  {
    slug: "financial-intelligence-ai-era",
    title: "Financial Intelligence in the AI Era",
    subtitle:
      "A strategic workshop exploring financial intelligence, valuation, risk assessment, and decision-making in the AI era.",
    date: "June 20, 2026",
    isoDate: "2026-06-20",
    time: "5:00 PM IST",
    duration: "1 hr",
    format: "In-Person",
    badge: "Free",
    image: "/events/events1.webp",
    badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    seats: "Open",
    status: "upcoming",
    description:
      "Join GrowQR for an insightful workshop exploring the intersection of finance, risk assessment, valuation, and strategic decision-making in today's AI-driven professional landscape.",
    learnings: [],
    agenda: [],
    speaker: {
      name: "CA (Dr.) Ankur Bansal",
      role: "Registered Valuer & Forensic Auditor · Bansal AV & Associates",
      image: "",
      bg: "from-amber-50 to-yellow-100",
      bio: "Registered Valuer (S & FA - IBBI), Forensic Auditor, and Surveyor & Loss Assessor at Bansal AV & Associates.",
    },
  },
];
