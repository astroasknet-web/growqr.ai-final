import { slugify } from "./discovery";

/**
 * Author profiles. An author page exists only for a person listed here, and only states facts that are true: no invented titles,
 * degrees or reviewers. Add credentials to `credentials` only when they are genuine and can be shown on request.
 */
export interface Author {
  slug: string;
  name: string;
  role: string;
  bio: string[];
  /** Verified qualifications or experience, each one a plain statement. Empty until the author supplies them. */
  credentials: string[];
  /** Public profiles that really are this person's (used for schema sameAs). */
  sameAs: string[];
}

export const AUTHORS: Author[] = [
  {
    slug: "sachin-sharma",
    name: "Sachin Sharma",
    role: "Author and editor, GrowQR blog",
    bio: [
      "Sachin Sharma writes and edits the GrowQR blog and builds the courses and practice tests the articles link to.",
      "Articles are written to teach one skill clearly, with a quiz or a worked example where it helps, and are updated when something in them changes.",
    ],
    credentials: [],
    sameAs: [],
  },
];

export const authorSlug = (name: string): string => slugify(name);
export const authorFor = (name: string | null | undefined): Author | undefined => (name ? AUTHORS.find((a) => a.slug === authorSlug(name)) : undefined);
