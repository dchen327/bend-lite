export type RoutineStep = {
  /** Must match an id in src/data/exercises.ts. */
  exerciseId: string;
  /** Total active stretch time in seconds, excluding transitions. */
  duration: number;
  /** Whether the player pauses to switch sides halfway through. */
  switchSides: boolean;
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
  name: "Full Body 8/27",
  exerciseTransitionSeconds: 3,
  sideTransitionSeconds: 3,
  steps: [
    { exerciseId: "upward-salute", duration: 22, switchSides: false },
    { exerciseId: "rag-doll", duration: 27, switchSides: false },
    { exerciseId: "standing-chest-opener", duration: 22, switchSides: false },
    { exerciseId: "wide-leg-bend", duration: 25, switchSides: false },
    { exerciseId: "side-lunge", duration: 37, switchSides: true },
    { exerciseId: "lunge", duration: 40, switchSides: true },
    { exerciseId: "upward-dog", duration: 18, switchSides: false },
    { exerciseId: "childs-pose", duration: 18, switchSides: false },
    { exerciseId: "downward-dog", duration: 21, switchSides: false },
    { exerciseId: "pigeon", duration: 45, switchSides: true },
    { exerciseId: "seated-twist", duration: 40, switchSides: true },
    { exerciseId: "lying-figure-four", duration: 38, switchSides: true },
    { exerciseId: "lying-hamstring", duration: 39, switchSides: true },
    { exerciseId: "reclined-butterfly", duration: 20, switchSides: false },
    { exerciseId: "spinal-twist", duration: 40, switchSides: true },
    { exerciseId: "kneeling-quad", duration: 40, switchSides: true },
    { exerciseId: "squat-stretch", duration: 18, switchSides: false },
    { exerciseId: "seated-fold", duration: 15, switchSides: false },
  ],
};

export const badmintonRoutine: Routine = {
  id: "badminton",
  name: "Badminton",
  exerciseTransitionSeconds: 3,
  sideTransitionSeconds: 3,
  steps: [
    { exerciseId: "upward-salute", duration: 17, switchSides: false },
    { exerciseId: "rag-doll", duration: 22, switchSides: false },
    { exerciseId: "doorway-pecs", duration: 34, switchSides: false },
    { exerciseId: "trunk-twist", duration: 50, switchSides: true },
    { exerciseId: "wide-leg-side-bend", duration: 34, switchSides: true },
    { exerciseId: "side-lunge", duration: 30, switchSides: true },
    { exerciseId: "lunge", duration: 40, switchSides: true },
    { exerciseId: "wrist-extension", duration: 20, switchSides: false },
    { exerciseId: "wrist-flexion", duration: 20, switchSides: false },
    { exerciseId: "downward-dog", duration: 21, switchSides: false },
    { exerciseId: "pigeon", duration: 45, switchSides: true },
    { exerciseId: "90-90-hip-switch", duration: 38, switchSides: false },
    { exerciseId: "lying-hamstring", duration: 39, switchSides: true },
    { exerciseId: "reclined-butterfly", duration: 20, switchSides: false },
    { exerciseId: "spinal-twist", duration: 40, switchSides: true },
    { exerciseId: "kneeling-quad", duration: 40, switchSides: true },
    { exerciseId: "squat-stretch", duration: 18, switchSides: false },
    { exerciseId: "neck-laterals", duration: 30, switchSides: true },
    { exerciseId: "neck-rotation", duration: 30, switchSides: true },
  ],
};

export const routines: Routine[] = [fullBodyRoutine, badmintonRoutine];
