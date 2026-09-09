import type { BendRoutine } from "@/data/bendRoutines";
import { exercises, type Exercise } from "@/data/exercises";
import { routines as defaultRoutines, type Routine } from "@/data/routines";

export const ROUTINE_STORAGE_KEY = "bend-lite:routines:v1";

export type SavedRoutine = Routine & {
  source?: {
    type: "bend";
    slug: string;
  };
};

type StoredRoutineData = {
  version: 1;
  routines: SavedRoutine[];
};

function copyRoutine(routine: SavedRoutine): SavedRoutine {
  return {
    ...routine,
    source: routine.source ? { ...routine.source } : undefined,
    steps: routine.steps.map((step) => ({ ...step })),
  };
}

export function getDefaultSavedRoutines(): SavedRoutine[] {
  return defaultRoutines.map(copyRoutine);
}

function isSavedRoutine(value: unknown): value is SavedRoutine {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<SavedRoutine>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.exerciseTransitionSeconds === "number" &&
    typeof candidate.sideTransitionSeconds === "number" &&
    Array.isArray(candidate.steps) &&
    candidate.steps.every(
      (step) =>
        step &&
        typeof step.exerciseId === "string" &&
        typeof step.duration === "number" &&
        typeof step.switchSides === "boolean",
    )
  );
}

export function loadSavedRoutines(): SavedRoutine[] {
  const defaults = getDefaultSavedRoutines();

  try {
    const raw = window.localStorage.getItem(ROUTINE_STORAGE_KEY);
    if (!raw) {
      return defaults;
    }

    const stored = JSON.parse(raw) as Partial<StoredRoutineData>;
    if (
      stored.version !== 1 ||
      !Array.isArray(stored.routines) ||
      !stored.routines.every(isSavedRoutine)
    ) {
      return defaults;
    }

    const storedById = new Map(
      stored.routines.map((routine) => [routine.id, copyRoutine(routine)]),
    );
    const mergedDefaults = defaults.map(
      (routine) => storedById.get(routine.id) ?? routine,
    );
    const importedRoutines = stored.routines
      .filter((routine) => !defaultRoutines.some(({ id }) => id === routine.id))
      .map(copyRoutine);

    return [...mergedDefaults, ...importedRoutines];
  } catch {
    return defaults;
  }
}

export function saveRoutines(routines: SavedRoutine[]): void {
  const payload: StoredRoutineData = {
    version: 1,
    routines: routines.map(copyRoutine),
  };
  window.localStorage.setItem(ROUTINE_STORAGE_KEY, JSON.stringify(payload));
}

function suggestsSideSwitch(exercise: Exercise): boolean {
  const text = exercise.instructions.join(" ");
  return /\b(one|same|opposite|other|each|left|right)\s+(side|arm|hand|wrist|shoulder|leg|knee|ankle|foot|hip)\b|\bswitch sides\b|\brepeat\b.{0,30}\bside\b/i.test(
    text,
  );
}

export function convertBendRoutine(routine: BendRoutine): SavedRoutine {
  return {
    id: `bend-${routine.slug}`,
    name: routine.name,
    source: {
      type: "bend",
      slug: routine.slug,
    },
    exerciseTransitionSeconds: 3,
    sideTransitionSeconds: 3,
    steps: routine.steps.map((step) => {
      const exercise = exercises[step.exerciseId];
      if (!exercise) {
        throw new Error(`Missing exercise "${step.exerciseId}" in the library.`);
      }

      return {
        exerciseId: step.exerciseId,
        duration: step.durationSeconds,
        switchSides: suggestsSideSwitch(exercise),
      };
    }),
  };
}
