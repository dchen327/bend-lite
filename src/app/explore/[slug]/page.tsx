import { ChevronLeft, Clock3 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AddBendRoutineButton } from "@/components/add-bend-routine-button";
import { AppBottomNav } from "@/components/app-bottom-nav";
import { ExerciseListItem } from "@/components/exercise-list-item";
import { bendRoutines } from "@/data/bendRoutines";
import { exercises } from "@/data/exercises";

export const dynamicParams = false;

export function generateStaticParams() {
  return bendRoutines.map((routine) => ({ slug: routine.slug }));
}

export default async function BendRoutinePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { slug } = await params;
  const { q } = await searchParams;
  const searchQuery = typeof q === "string" ? q.trim() : "";
  const backHref = searchQuery
    ? `/explore?q=${encodeURIComponent(searchQuery)}`
    : "/explore";
  const routine = bendRoutines.find((candidate) => candidate.slug === slug);

  if (!routine) {
    notFound();
  }

  const routineExercises = routine.steps.map((step) => {
    const exercise = exercises[step.exerciseId];
    if (!exercise) {
      throw new Error(`Missing exercise "${step.exerciseId}" in the library.`);
    }
    return { exercise, step };
  });

  return (
    <div className="min-h-dvh bg-slate-100 sm:py-5">
      <main className="mx-auto min-h-dvh w-full max-w-[440px] bg-white pb-[calc(5.5rem+env(safe-area-inset-bottom))] shadow-xl shadow-slate-300/30 sm:min-h-[calc(100dvh-2.5rem)] sm:rounded-[2rem]">
        <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 px-4 pb-4 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur">
          <div className="flex items-center gap-2">
            <Link
              href={backHref}
              aria-label="Back to Explore"
              className="grid size-11 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100"
            >
              <ChevronLeft className="size-6" aria-hidden="true" />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-2xl font-bold tracking-tight text-slate-950">
                {routine.name}
              </h1>
              <div className="mt-1 flex items-center gap-4 text-sm font-medium text-slate-500">
                <span>{routine.steps.length} exercises</span>
                <span className="flex items-center gap-1.5">
                  <Clock3 className="size-4" aria-hidden="true" />
                  {routine.totalMinutes} min
                </span>
              </div>
            </div>
            <div className="size-11 shrink-0" aria-hidden="true" />
          </div>
        </header>

        <div className="px-5 pt-5">
          <p className="text-sm leading-6 text-slate-500">
            {routine.description}
          </p>
          <div className="mt-4">
            <AddBendRoutineButton slug={routine.slug} />
          </div>
        </div>

        <ol className="px-4 py-3">
          {routineExercises.map(({ exercise, step }, index) => (
            <ExerciseListItem
              key={`${exercise.id}-${index}`}
              exercise={exercise}
              durationSeconds={step.durationSeconds}
              eager={index === 0}
            />
          ))}
        </ol>
      </main>
      <AppBottomNav />
    </div>
  );
}
