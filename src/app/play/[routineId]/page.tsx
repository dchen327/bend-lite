import { SavedRoutinePlayer } from "@/components/saved-routine-player";
import { routines } from "@/data/routines";

export function generateStaticParams() {
  return routines.map((routine) => ({ routineId: routine.id }));
}

export default async function PlayRoutinePage({
  params,
}: {
  params: Promise<{ routineId: string }>;
}) {
  const { routineId } = await params;
  return <SavedRoutinePlayer routineId={routineId} />;
}
