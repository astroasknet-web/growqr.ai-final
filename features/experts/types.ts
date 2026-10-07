export type ExpertPackage = {
  id: "starter" | "standard" | "deep-dive";
  label: string;
  minutes: number;
  price: string;
  note?: string;
};

export type ExpertTestimonial = {
  quote: string;
  name: string;
  role: string;
  outcome?: string;
};

export type ExpertFAQ = {
  q: string;
  a: string;
};

export type ExpertData = {
  slug: string;
  name: string;
  /** Expert's @growqr.ai address — used as calendar attendee + booking notification target. */
  email?: string;
  title: string;
  headline: string;
  intro: string;
  image: string;
  bg: string; // tailwind gradient classes

  expertise: string[];
  socialProof: {
    companies: string[];
    rating: number;
    reviewsCount: number;
    sessionsHosted: number;
    repeatRate?: string;
  };

  startingPrice: string;
  availabilityLabel: string;

  about: {
    paragraphs: string[];
    highlights: string[];
  };

  outcomes: string[];

  packages: ExpertPackage[];

  testimonials: ExpertTestimonial[];

  faq: ExpertFAQ[];

  relatedEventSlugs?: string[];
  similarExpertSlugs?: string[];
};
