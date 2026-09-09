"use client";

import { GuidedPlayer } from "@/components/guided-player";
import { useRoutineStore } from "@/components/routine-store-provider";
import { exercises, type Exercise } from "@/data/exercises";

export function SavedRoutinePlayer({ routineId }: { routineId: string }) {
  const { ready, routines } = useRoutineStore();
  const routine = routines.find((candidate) => candidate.id === routineId);

  if (!ready) {
    return <div className="h-dvh bg-white" />;
  }

  if (!routine) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-white px-8 text-center">
        <p className="text-xl font-bold text-slate-900">Routine not found.</p>
      </main>
    );
  }

  const exerciseMap: Record<string, Exercise> = {};
  for (const step of routine.steps) {
    const exercise = exercises[step.exerciseId];
    if (exercise) {
      exerciseMap[step.exerciseId] = exercise;
    }
  }

  return <GuidedPlayer routine={routine} exerciseMap={exerciseMap} />;
}
