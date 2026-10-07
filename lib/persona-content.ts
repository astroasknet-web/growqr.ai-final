import type { Audience } from "./data";

/**
 * Long-form sub-page content — shared shape across the personas.
 *
 * Each persona's sub-page at /solutions/{id} is driven by one of these
 * records. The visual shell (`<PersonaPage>`) renders seven sections in
 * order; field values plug into their matching slots. Pricing and
 * related-personas sections pull from the shared defaults below so a
 * copy change lands in one place.
 */
export interface PersonaPageContent {
  /** Canonical Audience key — used to compute the Related Personas row. */
  id: Audience;
  /** SEO / document head. */
  meta: {
    title: string;
    description: string;
  };
  hero: {
    eyebrow: string;        // e.g. "For Professionals"
    headline: string;       // two-line ambition statement
    subline: string;        // one-line promise
    portrait: string;       // path under /public
    portraitAlt: string;
    primaryCTA: { label: string; href: string };
    secondaryCTA: { label: string; href: string };
  };
  painAmbition: {
    stuck: { eyebrow: string; headline: string; bullets: string[] };
    moving: { eyebrow: string; headline: string; bullets: string[] };
  };
  squad: {
    eyebrow: string;
    headline: string;
    subline: string;
    /** Agent names that appear as cards — resolved against `agents` roster. */
    agentNames: string[];
  };
  howItWorks: {
    eyebrow: string;
    headline: string;
    subline: string;
    steps: {
      number: string;
      title: string;
      subtitle: string;
      description: string;
      duration: string;
    }[];
  };
  outcomes: {
    eyebrow: string;
    headline: string;
    subline: string;
    stats: {
      value: string;
      label: string;
      description: string;
    }[];
    caveat: string;
  };
  pricing: {
    eyebrow: string;
    headline: string;
    subline: string;
    tiers: {
      name: string;
      price: string;
      subtitle: string;
      bullets: string[];
      cta: { label: string; href: string };
      featured?: boolean;
    }[];
  };
  related: {
    eyebrow: string;
    headline: string;
  };
}

// ─── Shared defaults ────────────────────────────────────────────────────────

const CAVEAT = "Results vary. Typical, not guaranteed.";

/** Standard 3-tier pricing — used for every persona except Enterprises
 *  and Institutes (where the Subscribe tier flips to "Contact sales"). */
function pricingFor(persona: Audience): PersonaPageContent["pricing"] {
  const isSalesLed = persona === "enterprises" || persona === "institutes";

  return {
    eyebrow: "Activate",
    headline: "Start Free. Scale When Ready.",
    subline: "Three ways to work with your squad.",
    tiers: [
      {
        name: "Free QR",
        price: "₹0 / $0 forever",
        subtitle: "Your QR is live the day you sign up.",
        bullets: [
          "Your RQ-Score, calibrated",
          "Your living profile, always scannable",
          "Free for life",
        ],
        cta: { label: "Get your QR", href: "https://app.growqr.ai/login" },
      },
      {
        name: "Activate",
        price: "Pay-as-you-go",
        subtitle: "Unlock one squad or one workflow at a time.",
        bullets: [
          "Activate a single agent or a full workflow",
          "No subscription, no commitment",
          "Tokens never expire",
          "Scale up as your goals change",
        ],
        cta: { label: "Start activating", href: "https://app.growqr.ai/login" },
        featured: true,
      },
      isSalesLed
        ? {
          name: "Subscribe",
          price: "Custom pricing",
          subtitle: "Built around your org's scale and roadmap.",
          bullets: [
            "Full squad access across your team",
            "Dedicated deployment + success partner",
            "SSO, audit logs, data-residency controls",
            "Quarterly reviews with the product team",
          ],
          cta: { label: "Contact sales", href: "/contact" },
        }
        : {
          name: "Subscribe",
          price: "Full squad, every month",
          subtitle: "Unlimited access to your full persona squad.",
          bullets: [
            "Every agent always on",
            "Priority queues on every workflow",
            "Human coach session included monthly",
          ],
          cta: { label: "See subscription plans", href: "https://app.growqr.ai/login" },
        },
    ],
  };
}

const RELATED = {
  eyebrow: "Explore Other Solutions",
  headline: "Maybe One of These Fits Better.",
};

// ─── Persona records ────────────────────────────────────────────────────────

export const professionalsContent: PersonaPageContent = {
  id: "professionals",
  meta: {
    title: "GrowQR for Professionals - Find the job that fits you",
    description:
      "Your AI squad finds the right role and gets you ready for it. Start with a free QR, activate agents as you need them, or subscribe for full access.",
  },
  hero: {
    eyebrow: "For Professionals",
    headline: "I Want a Job that Suits my Personality and Skills",
    subline: "Match, apply, prep, repeat. Until the offer lands.",
    portrait: "/personas/seeker.jpg",
    portraitAlt: "Professionals — ready to move",
    primaryCTA: { label: "Activate your squad", href: "https://app.growqr.ai/login" },
    secondaryCTA: { label: "Get your QR (Free)", href: "https://app.growqr.ai/login" },
  },
  painAmbition: {
    stuck: {
      eyebrow: "Stuck",
      headline: "Applying into the Void.",
      bullets: [
        "50 applications, 2 responses",
        "Resume tailored by hand, every time",
        "No idea which roles actually fit",
        "Interview prep the night before",
        "Hearing back weeks later, if at all",
      ],
    },
    moving: {
      eyebrow: "Moving",
      headline: "Applying with Purpose.",
      bullets: [
        "Pre-matched to roles that fit your RQ-Score",
        "Resumes auto-tailored to each role",
        "RQ-Scout applies on your behalf, at scale",
        "RQ-Vera runs interview prep calibrated to the role",
        "Progress tracked, momentum visible, daily",
      ],
    },
  },
  squad: {
    eyebrow: "Your Squad",
    headline: "Meet Your Career Squad",
    subline: "Four AI agents working together to find, prepare, position, and propel you forward.",
    agentNames: ["RQ-Scout", "RQ-Mira", "RQ-Vera", "RQ-Sage"],
  },
  howItWorks: {
    eyebrow: "How It Works",
    headline: "From First Scan to First Offer.",
    subline: "Where every step leads forward.",
    steps: [
      {
        number: "01",
        title: "Opportunities",
        subtitle: "Find the Right Opportunity.",
        description: "",
        duration: "RQ-Scout",
      },
      {
        number: "02",
        title: "Profile",
        subtitle: "Stand Out With Confidence.",
        description: "",
        duration: "RQ-Mira",
      },
      {
        number: "03",
        title: "Interviews",
        subtitle: "Walk in Prepared.",
        description: "",
        duration: "RQ-Vera",
      },
      {
        number: "04",
        title: "Brand",
        subtitle: "Be Known for Your Expertise.",
        description: "",
        duration: "RQ-Nova",
      },
    ],
  },
  outcomes: {
    eyebrow: "Results in Motion",
    headline: "What Happens Next.",
    subline:
      "Your profile is live. Your agents are active. The momentum begins.",
    stats: [
      { value: "3×", label: "Faster to shortlist", description: "Than hand-applying yourself." },
      { value: "~75%", label: "Match-fit roles only", description: "Zero spray-and-pray." },
      { value: "24/7", label: "Agents in motion", description: "Even when you're offline." },
    ],
    caveat: CAVEAT,
  },
  pricing: pricingFor("professionals"),
  related: RELATED,
};

export const studentsContent: PersonaPageContent = {
  id: "students",
  meta: {
    title: "GrowQR for Students - Find the career that fits you",
    description:
      "Your AI squad maps your strengths to the careers where you'll thrive. Start with a free QR, explore paths, and land your first internship.",
  },
  hero: {
    eyebrow: "For Students",
    headline: "Find the Career That Actually Fits You.",
    subline: "Strengths mapped. Paths ranked. First internship found.",
    portrait: "/personas/student.jpg",
    portraitAlt: "A student exploring career paths with GrowQR",
    primaryCTA: { label: "Activate your squad", href: "https://app.growqr.ai/login" },
    secondaryCTA: { label: "Get your QR (Free)", href: "https://app.growqr.ai/login" },
  },
  painAmbition: {
    stuck: {
      eyebrow: "Stuck",
      headline: "Picking a Path Blindfolded.",
      bullets: [
        "Career tests that feel like horoscopes",
        "Advice from everyone, direction from no one",
        "A degree that might not match what you love",
        "Internships that teach you what to avoid",
        "Graduating without a clear next",
      ],
    },
    moving: {
      eyebrow: "Moving",
      headline: "Picking a Path with Real Data.",
      bullets: [
        "Your strengths mapped across 25 signals",
        "Career options matched to how you actually work",
        "Skill gaps closed before your first job hunt",
        "Internships found by RQ-Scout, not luck",
        "Graduate with a plan. Not panic.",
      ],
    },
  },
  squad: {
    eyebrow: "Your Squad",
    headline: "Built for Your Future.",
    subline: "AI experts helping students learn, prepare, and succeed with confidence.",
    agentNames: ["RQ-Scout", "RQ-Mira", "RQ-Vera", "RQ-Sage"],
  },
  howItWorks: {
    eyebrow: "How It Works",
    headline: "From Unsure to On-Track.",
    subline: "A workflow built for your decision moment.",
    steps: [
      {
        number: "01",
        title: "Discover",
        subtitle: "Find the Right Opportunities.",
        description: "",
        duration: "RQ-Scout",
      },
      {
        number: "02",
        title: "Profile",
        subtitle: "Make Your First Impression Count.",
        description: "",
        duration: "RQ-Mira",
      },
      {
        number: "03",
        title: "Learn",
        subtitle: "Build Skills That Matter.",
        description: "",
        duration: "RQ-Sage",
      },
      {
        number: "04",
        title: "Interviews",
        subtitle: "Walk in Prepared.",
        description: "",
        duration: "RQ-Vera",
      },
    ],
  },
  outcomes: {
    eyebrow: "What You Get",
    headline: "Typically, Before Graduation.",
    subline: "Here's what most Students see by their final year.",
    stats: [
      { value: "7+", label: "Career paths explored", description: "Beyond the obvious choices." },
      { value: "~65%", label: "Confidence in direction", description: "Up from ~25% at signup." },
      { value: "3×", label: "Internship interviews", description: "Compared to cold applications." },
    ],
    caveat: CAVEAT,
  },
  pricing: pricingFor("students"),
  related: RELATED,
};

export const coachesContent: PersonaPageContent = {
  id: "coaches",
  meta: {
    title: "GrowQR for Coaches - Clients who pay you what you're worth",
    description:
      "Your AI squad fills your calendar with the right clients at the right rates. Grow your practice without growing your headcount.",
  },
  hero: {
    eyebrow: "For Coaches",
    headline: "Attract Clients Who Value Your Expertise.",
    subline: "Better-fit clients. Better engagements. Better outcomes.",
    portrait: "/personas/expert.jpg",
    portraitAlt: "A coach running her practice with GrowQR",
    primaryCTA: { label: "Activate Your Squad", href: "https://app.growqr.ai/login" },
    secondaryCTA: { label: "Get your QR (Free)", href: "https://app.growqr.ai/login" },
  },
  painAmbition: {
    stuck: {
      eyebrow: "Stuck",
      headline: "Running a One-Person Business Alone.",
      bullets: [
        "Empty calendar weeks, overbooked weeks",
        "Leads from referrals only, never from marketing",
        "Proposals written from scratch every time",
        "Pricing by feel, not by fit",
        "Clients ghosting after the discovery call",
      ],
    },
    moving: {
      eyebrow: "Moving",
      headline: "Running Your Practice with a Team Behind you.",
      bullets: [
        "A steady pipeline of pre-qualified leads",
        "Your brand voice working while you coach",
        "Proposals tailored to each client, on autopilot",
        "Pricing informed by market benchmarks",
        "Follow-ups that actually close",
      ],
    },
  },
  squad: {
    eyebrow: "Your Squad",
    headline: "Built for the Business of you.",
    subline: "Four agents, one mission: grow your practice without growing your headcount.",
    agentNames: ["RQ-Nova", "RQ-Mira", "RQ-Drape"],
  },
  howItWorks: {
    eyebrow: "How It Works",
    headline: "From Referrals to a Real Pipeline.",
    subline: "A workflow that turns your expertise into a business.",
    steps: [
      {
        number: "01",
        title: "Brand",
        subtitle: "Be Known for Your Expertise.",
        description: "",
        duration: "RQ-Nova",
      },
      {
        number: "02",
        title: "Coach",
        subtitle: "Create Lasting Impact.",
        description: "",
        duration: "RQ-Eva",
      },
      {
        number: "03",
        title: "Connect",
        subtitle: "Reach the Right People.",
        description: "",
        duration: "RQ-Maya",
      },
      {
        number: "04",
        title: "Decide",
        subtitle: "Turn Data Into Direction.",
        description: "",
        duration: "RQ-Rohan",
      },
    ],
  },
  outcomes: {
    eyebrow: "What You Get",
    headline: "Typically, Within 60 Days.",
    subline: "Your practice, with the admin taken off your plate.",
    stats: [
      { value: "2×", label: "Pipeline depth", description: "More qualified leads in motion." },
      { value: "~40%", label: "Time back", description: "Less admin, more coaching." },
      { value: "~30%", label: "Higher close rate", description: "Because only fit clients reach you." },
    ],
    caveat: CAVEAT,
  },
  pricing: pricingFor("coaches"),
  related: RELATED,
};

export const freelancersContent: PersonaPageContent = {
  id: "freelancers",
  meta: {
    title: "GrowQR for Freelancers - Gigs that pay what you deserve",
    description:
      "Your AI squad finds better gigs, builds your network, and negotiates the rates. Raise your floor and fill your pipeline.",
  },
  hero: {
    eyebrow: "For Freelancers",
    headline: "I Want Gigs That Pay\nWhat I Deserve.",
    subline: "Better gigs. Stronger rates. No cold pitching.",
    portrait: "/personas/freelancer.jpg",
    portraitAlt: "A freelancer winning better gigs with GrowQR",
    primaryCTA: { label: "Activate your squad", href: "https://app.growqr.ai/login" },
    secondaryCTA: { label: "Get your QR (Free)", href: "https://app.growqr.ai/login" },
  },
  painAmbition: {
    stuck: {
      eyebrow: "Stuck",
      headline: "Hustling Gig-to-Gig.",
      bullets: [
        "Finding work through job boards and luck",
        "Undercharging to win the gig",
        "No steady network, no steady referrals",
        "Losing the good gigs to someone with better positioning",
        "Feast-or-famine income cycles",
      ],
    },
    moving: {
      eyebrow: "Moving",
      headline: "Building a Business, Not Chasing Work.",
      bullets: [
        "Premium gigs matched to your portfolio",
        "Pricing benchmarks so you charge what you're worth",
        "Network-building that actually compounds",
        "A brand that makes clients come to you",
        "Contracts that protect you, written right",
      ],
    },
  },
  squad: {
    eyebrow: "Your Squad",
    headline: "Your Career Dream Team",
    subline: "Four agents. One mission: get you hired smarter, faster, and better.",
    agentNames: ["RQ-Scout", "RQ-Nova", "RQ-Mira", "RQ-Drape"],
  },
  howItWorks: {
    eyebrow: "How It Works",
    headline: "From Gig-to-Gig to Month-to-Month Revenue.",
    subline: "A workflow built for the independent work you do.",
    steps: [
      {
        number: "01",
        title: "Brand",
        subtitle: "Be the First Choice.",
        description: "",
        duration: "RQ-Nova",
      },
      {
        number: "02",
        title: "Opportunities",
        subtitle: "Find Your Next Client.",
        description: "",
        duration: "RQ-Scout",
      },
      {
        number: "03",
        title: "Grow",
        subtitle: "Never Stop Improving.",
        description: "",
        duration: "RQ-Eva",
      },
      {
        number: "04",
        title: "Decide",
        subtitle: "Turn Data Into Direction.",
        description: "",
        duration: "RQ-Rohan",
      },
    ],
  },
  outcomes: {
    eyebrow: "What You Get",
    headline: "Typically, Within 90 Days.",
    subline: "Your work, priced and positioned properly.",
    stats: [
      { value: "~35%", label: "Average rate lift", description: "Matched to market benchmarks." },
      { value: "2×", label: "Pipeline visibility", description: "Know what's coming, not just what's now." },
      { value: "4×", label: "Inbound leads", description: "As RQ-Nova builds your presence." },
    ],
    caveat: CAVEAT,
  },
  pricing: pricingFor("freelancers"),
  related: RELATED,
};

export const startupsContent: PersonaPageContent = {
  id: "startups",
  meta: {
    title: "GrowQR for Startups - Build the right team from day one",
    description:
      "Your AI squad helps you hire, assess, and close candidates without a recruiter in the loop. Hire like you have a recruiter, without hiring one.",
  },
  hero: {
    eyebrow: "For Startups",
    headline: "I Want to Build the Right Team\nfrom Day One.",
    subline: "Source, screen, and close. No recruiter needed.",
    portrait: "/personas/startups.jpg",
    portraitAlt: "A startup founder hiring the right team",
    primaryCTA: { label: "Activate your squad", href: "https://app.growqr.ai/login" },
    secondaryCTA: { label: "Get your QR (Free)", href: "https://app.growqr.ai/login" },
  },
  painAmbition: {
    stuck: {
      eyebrow: "Stuck",
      headline: "Hiring by Gut, Hoping It Works.",
      bullets: [
        "Sifting through 200 resumes in your spare time",
        "First hires picked on who you know, not who fits",
        "No bandwidth to run real interviews",
        "Losing candidates to faster-moving competitors",
        "Culture drift because culture wasn't hired for",
      ],
    },
    moving: {
      eyebrow: "Moving",
      headline: "Hiring with Rigour, Without a Recruiter.",
      bullets: [
        "Pre-screened candidates matched to your role",
        "Role-specific interview loops running automatically",
        "Culture and judgment assessed, not guessed",
        "Fast offers to the best candidates",
        "Team built on signal, not just pedigree",
      ],
    },
  },
  squad: {
    eyebrow: "Your Squad",
    headline: "Built for Founder-Led Hiring.",
    subline: "Four agents, one mission: help you hire like you have a recruiter, without hiring one.",
    agentNames: ["RQ-Rita", "RQ-Vera", "RQ-Kai", "RQ-Finn"],
  },
  howItWorks: {
    eyebrow: "How It Works",
    headline: "From Brand to Real Momentum.",
    subline: "One connected workflow across your startup's key moves.",
    steps: [
      {
        number: "01",
        title: "Brand",
        subtitle: "Be Remembered.",
        description: "",
        duration: "RQ-Nova",
      },
      {
        number: "02",
        title: "Grow",
        subtitle: "Find What's Next.",
        description: "",
        duration: "RQ-Scout",
      },
      {
        number: "03",
        title: "Keep",
        subtitle: "Build a Team That Stays.",
        description: "",
        duration: "RQ-Eva",
      },
      {
        number: "04",
        title: "Decide",
        subtitle: "Turn Data Into Direction.",
        description: "",
        duration: "RQ-Rohan",
      },
    ],
  },
  outcomes: {
    eyebrow: "What You Get",
    headline: "Typically, a Hire Within 4 Weeks.",
    subline: "Your first hires, made with real process.",
    stats: [
      { value: "4×", label: "Faster to offer", description: "Compared to traditional founder-led hiring." },
      { value: "~85%", label: "Culture-fit retention", description: "One-year retention of AI-assessed hires." },
      { value: "0", label: "Recruiters required", description: "Full cycle, without the middleman." },
    ],
    caveat: CAVEAT,
  },
  pricing: pricingFor("startups"),
  related: RELATED,
};

export const recruitersContent: PersonaPageContent = {
  id: "recruiters",
  meta: {
    title: "GrowQR for Recruiters - The right candidate, fast",
    description:
      "Your AI squad screens at scale, interviews at scale, and hands you the shortlist that's actually worth seeing.",
  },
  hero: {
    eyebrow: "For Recruiters",
    headline: "Precision Hiring Starts Here.",
    subline: "Brief in. Verified shortlist out. Fast.",
    portrait: "/personas/recruiter.jpg",
    portraitAlt: "A recruiter running placements with GrowQR",
    primaryCTA: { label: "Activate your squad", href: "https://app.growqr.ai/login" },
    secondaryCTA: { label: "Get your QR (Free)", href: "https://app.growqr.ai/login" },
  },
  painAmbition: {
    stuck: {
      eyebrow: "Stuck",
      headline: "Reading Resumes to Find Needles.",
      bullets: [
        "200 applications for every placement",
        "Screening calls that burn a week",
        "Candidates ghosting mid-funnel",
        "Clients pushing back on the shortlist",
        "Margin squeezed by time-to-fill",
      ],
    },
    moving: {
      eyebrow: "Moving",
      headline: "Reading Signal, Not Noise.",
      bullets: [
        "Pre-screened candidates, ranked by fit",
        "First-round interviews run automatically",
        "Skills verified before the shortlist lands",
        "Clients impressed by the calibration, not the CV count",
        "More placements, less pavement",
      ],
    },
  },
  squad: {
    eyebrow: "Your Squad",
    headline: "Built for the Placement Game.",
    subline: "Four agents, one mission: raise your placement rate and protect your margin.",
    agentNames: ["RQ-Rita", "RQ-Vera", "RQ-Mira", "RQ-Rohan"],
  },
  howItWorks: {
    eyebrow: "How It Works",
    headline: "From Source to Successful Placement.",
    subline: "One connected workflow across your agency's key moves.",
    steps: [
      {
        number: "01",
        title: "Source",
        subtitle: "Find Exceptional Talent.",
        description: "",
        duration: "RQ-Scout",
      },
      {
        number: "02",
        title: "Assess",
        subtitle: "Hire With Confidence.",
        description: "",
        duration: "RQ-Vera",
      },
      {
        number: "03",
        title: "Place",
        subtitle: "Move Placements Faster.",
        description: "",
        duration: "RQ-Rita",
      },
      {
        number: "04",
        title: "Grow",
        subtitle: "Win More Business.",
        description: "",
        duration: "RQ-Nova",
      },
      {
        number: "05",
        title: "Optimize",
        subtitle: "Turn Data Into Direction.",
        description: "",
        duration: "RQ-Rohan",
      },
    ],
  },
  outcomes: {
    eyebrow: "Placement Intelligence",
    headline: "More Time Closing. Less Time Screening.",
    subline: "AI handles the search so your recruiters can focus on relationships.",
    stats: [
      { value: "3×", label: "Faster shortlist", description: "Than manual screening." },
      { value: "~80%", label: "Client acceptance", description: "Of first-shortlist candidates." },
      { value: "2×", label: "Placements per month", description: "With the same bandwidth." },
    ],
    caveat: CAVEAT,
  },
  pricing: pricingFor("recruiters"),
  related: RELATED,
};

export const enterprisesContent: PersonaPageContent = {
  id: "enterprises",
  meta: {
    title: "GrowQR for Enterprises - Keep your best people happy",
    description:
      "Your AI squad reads team signals, spots flight risk, and helps you grow the people worth keeping. Retention treated like revenue.",
  },
  hero: {
    eyebrow: "The Advantage",
    headline: "Stop Applying. Start Advancing.",
    subline: "Your QR is live. Your squad is in motion.",
    portrait: "/personas/enterprise.jpg",
    portraitAlt: "An enterprise leader running people operations with GrowQR",
    primaryCTA: { label: "Activate your squad", href: "https://app.growqr.ai/login" },
    secondaryCTA: { label: "Talk to sales", href: "/contact" },
  },
  painAmbition: {
    stuck: {
      eyebrow: "Stuck",
      headline: "Finding Out People Left, After They've Left.",
      bullets: [
        "Resignations that catch you off guard",
        "Engagement surveys that ask the wrong questions, annually",
        "High performers quietly drifting",
        "L&D budgets that don't reach the right people",
        "Internal mobility nobody knows how to find",
      ],
    },
    moving: {
      eyebrow: "Moving",
      headline: "Seeing Retention before Resignation.",
      bullets: [
        "Flight-risk signals, surfaced early",
        "Growth paths mapped to every high-performer",
        "L&D personalised, not generic",
        "Internal mobility made visible",
        "Retention treated like revenue",
      ],
    },
  },
  squad: {
    eyebrow: "Your AI Workforce Team",
    headline: "Built for Talent That Thrives.",
    subline: "Four agents working behind the scenes to strengthen engagement and reduce attrition.",
    agentNames: ["RQ-Theo", "RQ-Rohan", "RQ-Eva"],
  },
  howItWorks: {
    eyebrow: "How It Works",
    headline: "From First Hire to Real Growth.",
    subline: "One connected workflow across your whole business.",
    steps: [
      {
        number: "01",
        title: "Hire",
        subtitle: "Hire Better",
        description: "",
        duration: "RQ-Rita",
      },
      {
        number: "02",
        title: "Decide",
        subtitle: "Decide Faster",
        description: "",
        duration: "RQ-Rohan",
      },
      {
        number: "03",
        title: "Represent",
        subtitle: "Build Trust",
        description: "",
        duration: "RQ-Nova",
      },
      {
        number: "04",
        title: "Develop",
        subtitle: "Develop Your People",
        description: "",
        duration: "RQ-Eva",
      },
    ],
  },
  outcomes: {
    eyebrow: "Measurable Impact",
    headline: "Results You Can See. Growth You Can Measure.",
    subline: "AI-powered people intelligence that drives better workforce decisions.",
    stats: [
      { value: "~30%", label: "Attrition reduction", description: "For high-performers flagged by RQ-Theo." },
      { value: "2×", label: "Internal mobility", description: "As RQ-Rohan surfaces paths people didn't see." },
      { value: "~40%", label: "L&D efficiency", description: "Personalised plans beat generic catalogues." },
    ],
    caveat: CAVEAT,
  },
  pricing: pricingFor("enterprises"),
  related: RELATED,
};

export const institutesContent: PersonaPageContent = {
  id: "institutes",
  meta: {
    title: "GrowQR for Institutes - Every student placement-ready",
    description:
      "Your AI squad runs skill-gap analysis, mock interviews, and cohort tracking at scale. Raise your placement rate across the cohort.",
  },
  hero: {
    eyebrow: "For Institutes",
    headline: "I Want every Student\nPlacement-Ready.",
    subline: "Skill gaps closed. Mock interviews done. Cohort ready.",
    portrait: "/personas/institute.jpg",
    portraitAlt: "An institute leader preparing cohorts with GrowQR",
    primaryCTA: { label: "Activate your squad", href: "https://app.growqr.ai/login" },
    secondaryCTA: { label: "Book a demo", href: "/contact" },
  },
  painAmbition: {
    stuck: {
      eyebrow: "Stuck",
      headline: "Training Cohorts without a Feedback Loop.",
      bullets: [
        "Placement reports that arrive too late",
        "Students with degrees, without portfolios",
        "Mock interviews only for the top 10%",
        "Skill gaps discovered at the placement interview",
        "No visibility into which students are actually ready",
      ],
    },
    moving: {
      eyebrow: "Moving",
      headline: "Training Cohorts with Real-Time Calibration.",
      bullets: [
        "Placement readiness tracked cohort-wide",
        "Every student with a verified portfolio",
        "Mock interviews at scale, for everyone",
        "Skill gaps closed before graduation week",
        "A dashboard that shows the cohort's heartbeat",
      ],
    },
  },
  squad: {
    eyebrow: "Your Squad",
    headline: "Built for Cohort-Scale Preparation.",
    subline: "Four agents, one mission: raise your placement rate across the cohort.",
    agentNames: ["RQ-Rohan", "RQ-Vera", "RQ-Mira", "RQ-Eva"],
  },
  howItWorks: {
    eyebrow: "How It Works",
    headline: "From Inspire to Institutional Impact.",
    subline: "One connected workflow across your institution's key moves.",
    steps: [
      {
        number: "01",
        title: "Inspire",
        subtitle: "Build A Reputation That Attracts.",
        description: "",
        duration: "RQ-Nova",
      },
      {
        number: "02",
        title: "Develop",
        subtitle: "Every Learner Is Different.",
        description: "",
        duration: "RQ-Eva",
      },
      {
        number: "03",
        title: "Improve",
        subtitle: "Know What Needs Attention.",
        description: "",
        duration: "RQ-Rohan",
      },
    ],
  },
  outcomes: {
    eyebrow: "What You Get",
    headline: "Typically, by Placement Season.",
    subline: "Your cohort, genuinely prepared.",
    stats: [
      { value: "~85%", label: "Placement-ready by graduation", description: "Up from baseline ~50%." },
      { value: "3×", label: "Mock interviews per student", description: "Scaled equally across the cohort." },
      { value: "1", label: "Dashboard for the full cohort", description: "Replace 5 different reports." },
    ],
    caveat: CAVEAT,
  },
  pricing: pricingFor("institutes"),
  related: RELATED,
};

export const consultantsContent: PersonaPageContent = {
  id: "consultants",
  meta: {
    title: "GrowQR for Consultants - Placeholder",
    description: "Placeholder content for the Consultants solution page.",
  },
  hero: {
    eyebrow: "For Consultants",
    headline: "I Want Engagements that Match my Expertise.",
    subline: "Placeholder subline - content coming soon.",
    portrait: "/personas/expert.jpg",
    portraitAlt: "A consultant running their practice with GrowQR",
    primaryCTA: { label: "Activate your squad", href: "https://app.growqr.ai/login" },
    secondaryCTA: { label: "Get your QR (Free)", href: "https://app.growqr.ai/login" },
  },
  painAmbition: {
    stuck: {
      eyebrow: "Stuck",
      headline: "Placeholder — Stuck State.",
      bullets: [
        "Placeholder bullet one",
        "Placeholder bullet two",
        "Placeholder bullet three",
      ],
    },
    moving: {
      eyebrow: "Moving",
      headline: "Placeholder — Moving State.",
      bullets: [
        "Placeholder bullet one",
        "Placeholder bullet two",
        "Placeholder bullet three",
      ],
    },
  },
  squad: {
    eyebrow: "Your Squad",
    headline: "Placeholder Squad Headline",
    subline: "Placeholder squad subline.",
    agentNames: ["RQ-Nova", "RQ-Mira", "RQ-Drape"],
  },
  howItWorks: {
    eyebrow: "How It Works",
    headline: "Placeholder How It Works Headline.",
    subline: "Placeholder subline.",
    steps: [
      {
        number: "01",
        title: "Onboard",
        subtitle: "Placeholder subtitle.",
        description: "Placeholder step description.",
        duration: "Day 1",
      },
      {
        number: "02",
        title: "Position",
        subtitle: "Placeholder subtitle.",
        description: "Placeholder step description.",
        duration: "Week 1",
      },
      {
        number: "03",
        title: "Engage",
        subtitle: "Placeholder subtitle.",
        description: "Placeholder step description.",
        duration: "Ongoing",
      },
      {
        number: "04",
        title: "Grow",
        subtitle: "Placeholder subtitle.",
        description: "Placeholder step description.",
        duration: "Month 1+",
      },
    ],
  },
  outcomes: {
    eyebrow: "What You Get",
    headline: "Placeholder Outcomes Headline.",
    subline: "Placeholder subline.",
    stats: [
      { value: "—", label: "Placeholder stat", description: "Placeholder description." },
      { value: "—", label: "Placeholder stat", description: "Placeholder description." },
      { value: "—", label: "Placeholder stat", description: "Placeholder description." },
    ],
    caveat: CAVEAT,
  },
  pricing: pricingFor("consultants"),
  related: RELATED,
};

/** Lookup map — every /solutions/{id} page reads its content from here. */
export const personaPageContent: Record<Audience, PersonaPageContent> = {
  students: studentsContent,
  professionals: professionalsContent,
  coaches: coachesContent,
  freelancers: freelancersContent,
  startups: startupsContent,
  recruiters: recruitersContent,
  enterprises: enterprisesContent,
  institutes: institutesContent,
  consultants: consultantsContent,
};
