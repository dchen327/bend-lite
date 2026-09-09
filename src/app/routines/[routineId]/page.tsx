import { SavedRoutinePage } from "@/components/saved-routine-page";
import { routines } from "@/data/routines";

export function generateStaticParams() {
  return routines.map((routine) => ({ routineId: routine.id }));
}

export default async function RoutinePage({
  params,
}: {
  params: Promise<{ routineId: string }>;
}) {
  const { routineId } = await params;
  return <SavedRoutinePage routineId={routineId} />;
}
