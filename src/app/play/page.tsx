import { GuidedPlayer } from "@/components/guided-player";
import { exercises, type Exercise } from "@/data/exercises";
import { fullBodyRoutine } from "@/data/routines";

export default function PlayPage() {
  const exerciseMap: Record<string, Exercise> = {};

  for (const step of fullBodyRoutine.steps) {
    const exercise = exercises[step.exerciseId];
    if (!exercise) {
      throw new Error(`Missing exercise "${step.exerciseId}" in the library.`);
    }
    exerciseMap[step.exerciseId] = exercise;
  }

  return (
    <GuidedPlayer routine={fullBodyRoutine} exerciseMap={exerciseMap} />
  );
}
