export type RoutineStep = {
  /** Must match an id in src/data/exercises.ts. */
  exerciseId: string;
  /** Total active stretch time in seconds, excluding transitions. */
  duration: number;
  /** "each" switches sides halfway through the total duration. */
  side: "both" | "each";
};

export type Routine = {
  id: string;
  name: string;
  /** Rest/transition shown between exercises. */
  exerciseTransitionSeconds: number;
  /** Transition shown at the midpoint of a per-side exercise. */
  sideTransitionSeconds: number;
  steps: RoutineStep[];
};

/**
 * Edit this file to change exercises, durations, or side behavior.
 * Exercise ids and details are listed in src/data/exercises.ts.
 */
export const fullBodyRoutine: Routine = {
  id: "my-full-body",
  name: "My Full Body",
  exerciseTransitionSeconds: 3,
  sideTransitionSeconds: 3,
  steps: [
    { exerciseId: "upward-salute", duration: 30, side: "both" },
    { exerciseId: "rag-doll", duration: 30, side: "both" },
    { exerciseId: "standing-chest-opener", duration: 30, side: "both" },
    { exerciseId: "wide-leg-bend", duration: 30, side: "both" },
    { exerciseId: "side-lunge", duration: 45, side: "each" },
    { exerciseId: "lunge", duration: 45, side: "each" },
    { exerciseId: "upward-dog", duration: 15, side: "both" },
    { exerciseId: "childs-pose", duration: 15, side: "both" },
    { exerciseId: "downward-dog", duration: 30, side: "both" },
    { exerciseId: "pigeon", duration: 45, side: "each" },
    { exerciseId: "seated-twist", duration: 45, side: "each" },
    { exerciseId: "lying-figure-four", duration: 45, side: "each" },
    { exerciseId: "lying-hamstring", duration: 45, side: "each" },
    { exerciseId: "reclined-butterfly", duration: 30, side: "both" },
    { exerciseId: "spinal-twist", duration: 45, side: "each" },
    { exerciseId: "kneeling-quad", duration: 45, side: "each" },
    { exerciseId: "squat-stretch", duration: 15, side: "both" },
    { exerciseId: "seated-fold", duration: 15, side: "both" },
  ],
};

export const routines: Routine[] = [fullBodyRoutine];
