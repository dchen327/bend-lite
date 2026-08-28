import { notFound } from "next/navigation";

import { GuidedPlayer } from "@/components/guided-player";
import { exercises, type Exercise } from "@/data/exercises";
import { routines } from "@/data/routines";

export const dynamicParams = false;

export function generateStaticParams() {
  return routines.map((routine) => ({ routineId: routine.id }));
}

export default async function PlayRoutinePage({
  params,
}: {
  params: Promise<{ routineId: string }>;
}) {
  const { routineId } = await params;
  const routine = routines.find((candidate) => candidate.id === routineId);

  if (!routine) {
    notFound();
  }

  const exerciseMap: Record<string, Exercise> = {};

  for (const step of routine.steps) {
    const exercise = exercises[step.exerciseId];
    if (!exercise) {
      throw new Error(`Missing exercise "${step.exerciseId}" in the library.`);
    }
    exerciseMap[step.exerciseId] = exercise;
  }

  return <GuidedPlayer routine={routine} exerciseMap={exerciseMap} />;
}
