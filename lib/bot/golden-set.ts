/**
 * Golden regression set for the deterministic bot.
 *
 * Every case is a real phrasing paired with the answer we believe is CORRECT,
 * independent of what the bot does today. `passing: false` marks the ones that
 * are wrong right now, so the file doubles as the backlog: the pass rate is a
 * number we can actually move, and a fix is provably a fix.
 *
 * Deliberately written BEFORE the scoring rewrite, per the standing
 * instruction to measure first. Nothing here asserts an implementation detail
 * — only the observable outcome (which act, which intent, which article) — so
 * the scoring internals can change freely underneath it.
 *
 * See lib/bot/golden.test.ts for the two rules this file is held to:
 * a passing case may never regress, and a failing case that starts passing
 * must be promoted rather than silently absorbed.
 */

import type { ConversationalAct } from "@/lib/bot/smalltalk";
import type { BotIntent } from "@/lib/bot/intents";

/** KB article ids, from lib/bot/kb-snapshot.json. */
export const A = {
  WHAT_IS_GROWQR: "227090000000032003",
  WHO_IS_FOR: "227090000000013003",
  VS_CHATGPT: "227090000000009082",
  GET_A_JOB: "227090000000015015",
  SWITCH_CAREERS: "227090000000033003",
  UNIVERSITIES: "227090000000016005",
  RECRUITERS: "227090000000027005",
  ENTERPRISE_OFFER: "227090000000013007",
  ENTERPRISE_PRICING: "227090000000030018",
  BOOK_DEMO: "227090000000030016",
  CONTACT: "227090000000031008",
  NOT_FOUND: "227090000000075001",
  RQ_IMPROVE: "227090000000032005",
  RQ_WHAT: "227090000000030010",
  AGENTS_ALL: "227090000000030012",
  VERA: "227090000000031006",
  NOVA: "227090000000032009",
  LYRA: "227090000000014021",
  SCOUT: "227090000000027025",
  MIRA: "227090000000029004",
  KAI: "227090000000013009",
  SAGE: "227090000000027027",
  PRIVACY_PERSONAL: "227090000000030014",
  PRIVACY_ORG: "227090000000014023",
  BILLING: "227090000000009086",
  REFUND: "227090000000027007",
  OFFERINGS: "227090000000027009",
  PRICING_MAIN: "227090000000033001",
  FREE_PLAN: "227090000000009084",
  WHICH_PLAN: "227090000000013005",
} as const;

export type GoldenExpectation =
  | { act: ConversationalAct }
  | { intent: BotIntent }
  | { article: string }
  | { fallback: true };

export interface GoldenCase {
  text: string;
  /** Solution slug for page context, when the case depends on it. */
  page?: string;
  expect: GoldenExpectation;
  /** Why this is the right answer, when it is not self-evident. */
  note?: string;
  /**
   * False when the bot gets this wrong TODAY. Calibrated against real
   * behaviour, never hand-guessed. Flip to true (or delete the field) as part
   * of the change that fixes it.
   */
  passing?: boolean;
}

export const GOLDEN_CASES: GoldenCase[] = [
  // ── Conversational acts ───────────────────────────────────────────────────
  { text: "Hi", expect: { act: "greeting" } },
  { text: "Hii", expect: { act: "greeting" } },
  { text: "Hello", expect: { act: "greeting" } },
  { text: "hello there", expect: { act: "greeting" } },
  { text: "Hey", expect: { act: "greeting" } },
  { text: "heyy", expect: { act: "greeting" } },
  { text: "hey there", expect: { act: "greeting" } },
  { text: "Good morning", expect: { act: "greeting" } },
  { text: "good evening", expect: { act: "greeting" } },
  { text: "namaste", expect: { act: "greeting" } },
  { text: "hola", expect: { act: "greeting" } },
  { text: "howdy", expect: { act: "greeting" } },
  { text: "yo", expect: { act: "greeting" } },
  { text: "how are you", expect: { act: "greeting" } },
  { text: "how are you?", expect: { act: "greeting" } },
  { text: "how are you doing", expect: { act: "greeting" } },
  { text: "how's it going", expect: { act: "greeting" } },
  { text: "how is it going", expect: { act: "greeting" } },
  { text: "how's things", expect: { act: "greeting" } },
  { text: "what's up", expect: { act: "greeting" } },
  { text: "all good?", expect: { act: "greeting" } },
  { text: "all good", expect: { act: "greeting" } },
  { text: "Hi!", expect: { act: "greeting" } },
  { text: "hello 👋", expect: { act: "greeting" } },

  { text: "Thanks", expect: { act: "thanks" } },
  { text: "thanks!", expect: { act: "thanks" } },
  { text: "Thank you", expect: { act: "thanks" } },
  { text: "thank you so much", expect: { act: "thanks" } },
  { text: "thankyou", expect: { act: "thanks" } },
  { text: "thx", expect: { act: "thanks" } },
  { text: "ty", expect: { act: "thanks" } },
  { text: "thanks a lot", expect: { act: "thanks" } },
  { text: "many thanks", expect: { act: "thanks" } },
  { text: "appreciate it", expect: { act: "thanks" } },
  { text: "ok thanks", expect: { act: "thanks" } },
  { text: "great thanks", expect: { act: "thanks" } },
  { text: "perfect thanks", expect: { act: "thanks" } },

  { text: "Okay", expect: { act: "acknowledge" } },
  { text: "ok", expect: { act: "acknowledge" } },
  { text: "kk", expect: { act: "acknowledge" } },
  { text: "Cool", expect: { act: "acknowledge" } },
  { text: "nice", expect: { act: "acknowledge" } },
  { text: "great", expect: { act: "acknowledge" } },
  { text: "awesome", expect: { act: "acknowledge" } },
  { text: "perfect", expect: { act: "acknowledge" } },
  { text: "got it", expect: { act: "acknowledge" } },
  { text: "understood", expect: { act: "acknowledge" } },
  { text: "i see", expect: { act: "acknowledge" } },
  { text: "makes sense", expect: { act: "acknowledge" } },
  { text: "sounds good", expect: { act: "acknowledge" } },
  { text: "yes", expect: { act: "acknowledge" } },
  { text: "yeah", expect: { act: "acknowledge" } },
  { text: "sure", expect: { act: "acknowledge" } },
  { text: "alright", expect: { act: "acknowledge" } },
  { text: "noted", expect: { act: "acknowledge" } },
  { text: "hmm", expect: { act: "acknowledge" } },
  { text: "👍", expect: { act: "acknowledge" } },
  { text: "🙏", expect: { act: "acknowledge" } },
  { text: "😊", expect: { act: "acknowledge" } },

  { text: "Bye", expect: { act: "farewell" } },
  { text: "bye bye", expect: { act: "farewell" } },
  { text: "byee", expect: { act: "farewell" } },
  { text: "goodbye", expect: { act: "farewell" } },
  { text: "see you", expect: { act: "farewell" } },
  { text: "see you later", expect: { act: "farewell" } },
  { text: "see ya", expect: { act: "farewell" } },
  { text: "catch you later", expect: { act: "farewell" } },
  { text: "talk later", expect: { act: "farewell" } },
  { text: "ttyl", expect: { act: "farewell" } },
  { text: "gtg", expect: { act: "farewell" } },
  { text: "that's all", expect: { act: "farewell" } },
  { text: "nothing else", expect: { act: "farewell" } },
  { text: "thanks bye", expect: { act: "farewell" } },
  { text: "ok bye", expect: { act: "farewell" } },

  { text: "no", expect: { act: "decline" } },
  { text: "nope", expect: { act: "decline" } },
  { text: "no thanks", expect: { act: "decline" } },
  { text: "not now", expect: { act: "decline" } },
  { text: "i'm good", expect: { act: "decline" } },

  // Acts must NOT swallow a real question that follows.
  { text: "thanks, what is growqr", expect: { article: A.WHAT_IS_GROWQR } },
  { text: "hi, how much does it cost", expect: { intent: "pricing" } },
  { text: "hello, book a demo", expect: { intent: "demo_request" } },
  { text: "ok but what is the refund policy", expect: { article: A.REFUND } },
  { text: "bye for now, one last question about pricing", expect: { intent: "pricing" } },

  // ── The core identity question, many phrasings ────────────────────────────
  { text: "What is GrowQR?", expect: { article: A.WHAT_IS_GROWQR } },
  { text: "what is growqr", expect: { article: A.WHAT_IS_GROWQR } },
  { text: "Tell me about GrowQR.", expect: { article: A.WHAT_IS_GROWQR } },
  { text: "Explain GrowQR.", expect: { article: A.WHAT_IS_GROWQR } },
  { text: "explain growqr to me", expect: { article: A.WHAT_IS_GROWQR } },
  { text: "what does growqr do", expect: { article: A.WHAT_IS_GROWQR } },
  { text: "introduce growqr", expect: { article: A.WHAT_IS_GROWQR } },
  { text: "What do you do?", expect: { article: A.WHAT_IS_GROWQR } },
  { text: "what do you guys do", expect: { article: A.WHAT_IS_GROWQR } },
  { text: "who are you", expect: { article: A.WHAT_IS_GROWQR } },
  { text: "what's this", expect: { article: A.WHAT_IS_GROWQR } },
  { text: "what is this platform", expect: { article: A.WHAT_IS_GROWQR } },
  { text: "what is this website about", expect: { article: A.WHAT_IS_GROWQR } },
  { text: "How does GrowQR work?", expect: { article: A.WHAT_IS_GROWQR } },
  { text: "how does it work", expect: { article: A.WHAT_IS_GROWQR } },
  { text: "how it works", expect: { article: A.WHAT_IS_GROWQR } },
  { text: "What problem are you solving?", expect: { article: A.WHAT_IS_GROWQR } },
  { text: "what problem do you solve", expect: { article: A.WHAT_IS_GROWQR } },
  { text: "give me an overview", expect: { article: A.WHAT_IS_GROWQR } },
  { text: "explain the product", expect: { article: A.WHAT_IS_GROWQR } },
  { text: "tell me about the platform", expect: { article: A.WHAT_IS_GROWQR } },
  { text: "what is growqr about", expect: { article: A.WHAT_IS_GROWQR } },

  { text: "who is growqr for", expect: { article: A.WHO_IS_FOR } },
  { text: "who uses growqr", expect: { article: A.WHO_IS_FOR } },
  { text: "is this for me", expect: { article: A.WHO_IS_FOR } },
  { text: "how is growqr different from chatgpt", expect: { article: A.VS_CHATGPT } },
  { text: "why not just use chatgpt", expect: { article: A.VS_CHATGPT } },
  { text: "how are you different", expect: { article: A.VS_CHATGPT } },

  // ── RQ Score ──────────────────────────────────────────────────────────────
  { text: "what is rq", expect: { article: A.RQ_WHAT } },
  { text: "what is rq score", expect: { article: A.RQ_WHAT } },
  { text: "what is readiness quotient", expect: { article: A.RQ_WHAT } },
  { text: "rq score", expect: { article: A.RQ_WHAT } },
  { text: "explain rq", expect: { article: A.RQ_WHAT } },
  { text: "how is rq calculated", expect: { article: A.RQ_WHAT } },
  { text: "how do i improve my rq score", expect: { article: A.RQ_IMPROVE } },
  { text: "how do i raise my score", expect: { article: A.RQ_IMPROVE } },
  { text: "improve my readiness", expect: { article: A.RQ_IMPROVE } },
  { text: "how to increase rq", expect: { article: A.RQ_IMPROVE } },

  // ── AI agents ─────────────────────────────────────────────────────────────
  { text: "what ai agents does growqr offer", expect: { article: A.AGENTS_ALL } },
  { text: "what agents do you have", expect: { article: A.AGENTS_ALL } },
  { text: "list your ai agents", expect: { article: A.AGENTS_ALL } },
  { text: "tell me about your agents", expect: { article: A.AGENTS_ALL } },
  { text: "how many agents are there", expect: { article: A.AGENTS_ALL } },
  { text: "tell me about vera", expect: { article: A.VERA } },
  { text: "what does vera do", expect: { article: A.VERA } },
  { text: "who is nova", expect: { article: A.NOVA } },
  { text: "what does mira do", expect: { article: A.MIRA } },
  { text: "tell me about scout", expect: { article: A.SCOUT } },
  { text: "what is sage", expect: { article: A.SAGE } },
  { text: "who is kai", expect: { article: A.KAI } },
  { text: "what does lyra do", expect: { article: A.LYRA } },
  { text: "how does the ai interviewer work", expect: { article: A.VERA } },
  { text: "resume expert", expect: { article: A.MIRA } },
  { text: "interview practice", expect: { article: A.VERA } },

  // ── Pricing ───────────────────────────────────────────────────────────────
  { text: "pricing", expect: { intent: "pricing" } },
  { text: "how much does it cost", expect: { intent: "pricing" } },
  { text: "what are your plans", expect: { intent: "pricing" } },
  { text: "subscription cost", expect: { intent: "pricing" } },
  { text: "price list", expect: { intent: "pricing" } },
  { text: "what does growqr cost", expect: { intent: "pricing" } },
  { text: "is it free", expect: { article: A.PRICING_MAIN } },
  { text: "is there a free plan", expect: { intent: "pricing" } },
  { text: "what's included in the free forever plan", expect: { intent: "pricing" } },
  { text: "which plan is right for me", expect: { intent: "pricing" } },
  { text: "which plan should i pick", expect: { intent: "pricing" } },
  // "for enterprises" used to win as a keyword-detected enterprise_inquiry
  // (a lead-form trigger, never an actual price); removed 2026-08-03 along
  // with recruiter/university/enterprise keyword detection (see
  // lib/bot/intents.ts) — pricing keywords ("cost") now win, same as any
  // other pricing question.
  { text: "how much does growqr cost for enterprises", expect: { intent: "pricing" } },

  // ── Audience solutions ────────────────────────────────────────────────────
  // recruiter_inquiry/university_inquiry/enterprise_inquiry are no longer
  // keyword-detected (2026-08-03) — these used to short-circuit straight to
  // the B2B qualification form without answering anything. Removing that
  // interception lets the deterministic KB scorer answer them directly,
  // which is strictly better: real content instead of a lead form.
  { text: "does growqr work for universities", expect: { article: A.UNIVERSITIES } },
  { text: "do you work with colleges", expect: { article: A.UNIVERSITIES } },
  { text: "do you work with institutes", expect: { article: A.UNIVERSITIES } },
  // No KB article shares enough vocabulary with this one for the deterministic
  // scorer to find it — expected: this is exactly the kind of phrasing AI-first
  // is meant to carry (not tested by this harness, which only measures the
  // deterministic floor). Not a gap to close with a new alias/keyword.
  { text: "campus placements", expect: { fallback: true } },
  { text: "what do recruiters get from growqr", expect: { article: A.RECRUITERS } },
  { text: "how does this help recruiters", expect: { article: A.RECRUITERS } },
  { text: "what does growqr offer companies", expect: { article: A.ENTERPRISE_OFFER } },
  { text: "what do you offer hr teams", expect: { article: A.ENTERPRISE_OFFER } },
  { text: "can growqr help me get a job", expect: { article: A.GET_A_JOB } },
  { text: "will this help me find work", expect: { article: A.GET_A_JOB } },
  { text: "how does growqr help me switch careers", expect: { article: A.SWITCH_CAREERS } },
  { text: "i want to change careers", expect: { article: A.SWITCH_CAREERS } },
  { text: "what are q-ryze and q-skale", expect: { article: A.OFFERINGS } },
  { text: "what is q-kampus", expect: { article: A.OFFERINGS } },
  { text: "what is q-kalyber", expect: { article: A.OFFERINGS } },

  // ── Privacy, billing, support ─────────────────────────────────────────────
  { text: "how is my personal data protected", expect: { article: A.PRIVACY_PERSONAL } },
  { text: "is my data safe", expect: { article: A.PRIVACY_PERSONAL } },
  // Promoted 2026-08-03: these used to be swallowed by the enterprise_inquiry
  // keyword ("our organisation" / "our company") before ever reaching the KB
  // scorer. Now that keyword is gone (see the audience-solutions note above),
  // the scorer finds the right article on its own.
  { text: "how is our organisation's data secured", expect: { article: A.PRIVACY_ORG } },
  { text: "is our company data secure", expect: { article: A.PRIVACY_ORG } },
  { text: "what is the refund policy", expect: { article: A.REFUND } },
  { text: "can i get a refund", expect: { article: A.REFUND } },
  { text: "i have a billing problem", expect: { article: A.BILLING } },
  { text: "my payment failed", expect: { article: A.BILLING } },
  { text: "how do i contact the growqr team", expect: { article: A.CONTACT } },
  // CHANGED by P6: "support" now escalates rather than answering from the KB.
  // Someone asking to reach support wants a person, and the contact article was
  // a slower route to the same place.
  { text: "how do i reach support", expect: { intent: "human_request" } },

  // ── Routing intents ───────────────────────────────────────────────────────
  { text: "book a demo", expect: { intent: "demo_request" } },
  { text: "i want a demo", expect: { intent: "demo_request" } },
  { text: "schedule a call", expect: { intent: "demo_request" } },
  { text: "can i see it in action", expect: { intent: "demo_request" } },
  // The B2B chip itself (router.ts B2B_SUGGESTIONS) — clicking it sends this
  // exact text back, so it must route here or the chip is a dead end.
  { text: "enquire now", expect: { intent: "demo_request" } },
  { text: "talk to a human", expect: { intent: "human_request" } },
  { text: "talk to our team", expect: { intent: "human_request" } },
  { text: "speak to someone", expect: { intent: "human_request" } },
  { text: "customer support", expect: { intent: "human_request" } },
  { text: "i want a real person", expect: { intent: "human_request" } },
  { text: "talk to an agent", expect: { intent: "human_request" } },
  { text: "change email", expect: { intent: "change_email" } },
  { text: "wrong email", expect: { intent: "change_email" } },
  { text: "use a different email", expect: { intent: "change_email" } },

  // ── Known content gaps: must NOT answer confidently ───────────────────────
  { text: "do you integrate with our ats", expect: { fallback: true }, note: "no article exists" },
  {
    text: "can someone help me",
    expect: { fallback: true },
    note: "known gap 2026-08-02: matches 'Can GrowQR help me get a job?' on 'help' (score 2.0). Not worth hand-tuning the scorer per-phrasing — falls to AI's conversational mode instead once it's this deployment's turn.",
    passing: false,
  },
  { text: "can anyone help me", expect: { fallback: true }, passing: false },
  { text: "which countries do you support", expect: { fallback: true }, note: "no article exists", passing: false },
  { text: "do you have a mobile app", expect: { fallback: true }, note: "no article exists" },
  { text: "do you have case studies", expect: { fallback: true }, note: "no article exists" },
  { text: "who are your customers", expect: { fallback: true }, note: "no article exists" },
  { text: "how long does onboarding take", expect: { fallback: true }, note: "no article exists" },
  { text: "are you soc 2 certified", expect: { fallback: true }, note: "no article exists" },
  { text: "asdfghjkl qwerty", expect: { fallback: true } },
  { text: "zzzz zzzz zzzz", expect: { fallback: true } },
];
