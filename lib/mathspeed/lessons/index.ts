import type { Lesson } from "../curriculum";
import { LESSONS_A } from "./a";

/** Every written lesson, by module key (A-01 ...). A level is playable only when all of its modules appear here. */
export const LESSONS: Record<string, Lesson> = { ...LESSONS_A };
