import type { Routine } from "@/data/routines";

export function getRoutineDurationSeconds(routine: Routine): number {
  const activeSeconds = routine.steps.reduce(
    (total, step) => total + step.duration,
    0,
  );
  const sideTransitions =
    routine.steps.filter((step) => step.switchSides).length *
    routine.sideTransitionSeconds;
  const exerciseTransitions =
    Math.max(0, routine.steps.length - 1) * routine.exerciseTransitionSeconds;

  return activeSeconds + sideTransitions + exerciseTransitions;
}

export function formatRoutineDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}
