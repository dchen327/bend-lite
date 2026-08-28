import { ChevronLeft, Clock3, GripVertical, Repeat2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StartRoutineButton } from "@/components/start-routine-button";
import { exercises } from "@/data/exercises";
import { routines } from "@/data/routines";
import {
  formatRoutineDuration,
  getRoutineDurationSeconds,
} from "@/lib/routines";

export const dynamicParams = false;

export function generateStaticParams() {
  return routines.map((routine) => ({ routineId: routine.id }));
}

export default async function RoutinePage({
  params,
}: {
  params: Promise<{ routineId: string }>;
}) {
  const { routineId } = await params;
  const routine = routines.find((candidate) => candidate.id === routineId);

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
  const totalSeconds = getRoutineDurationSeconds(routine);

  return (
    <div className="min-h-dvh bg-slate-100 sm:py-5">
      <main className="mx-auto min-h-dvh w-full max-w-[440px] bg-white pb-32 shadow-xl shadow-slate-300/30 sm:min-h-[calc(100dvh-2.5rem)] sm:overflow-hidden sm:rounded-[2rem]">
        <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 px-4 pb-4 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              aria-label="Back to routines"
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
                  <span className="timer-digits">
                    {formatRoutineDuration(totalSeconds)}
                  </span>
                </span>
              </div>
            </div>
            <div className="size-11 shrink-0" aria-hidden="true" />
          </div>
        </header>

        <ol className="px-4 py-3">
          {routineExercises.map(({ exercise, step }, index) => (
            <li
              key={`${exercise.id}-${index}`}
              className="flex min-h-24 items-center gap-3 border-b border-slate-100 py-3 last:border-0"
            >
              <GripVertical
                className="size-4 shrink-0 text-slate-300"
                aria-hidden="true"
              />
              <div className="relative shrink-0">
                <Image
                  src={exercise.image}
                  alt=""
                  width={72}
                  height={72}
                  className="size-[72px] rounded-full object-cover ring-1 ring-slate-200"
                  loading={index === 0 ? "eager" : "lazy"}
                />
                {step.switchSides ? (
                  <span
                    className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm"
                    title="Switch sides halfway"
                  >
                    <Repeat2 className="size-3.5" aria-hidden="true" />
                    <span className="sr-only">Switch sides halfway</span>
                  </span>
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-[15px] font-semibold text-slate-900">
                  {exercise.name}
                </h2>
                {step.switchSides ? (
                  <p className="mt-1 text-xs font-medium text-slate-400">
                    Switch halfway
                  </p>
                ) : null}
              </div>
              <span className="timer-digits shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-500">
                {formatRoutineDuration(step.duration)}
              </span>
            </li>
          ))}
        </ol>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[440px] bg-gradient-to-t from-white via-white to-white/0 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-8 sm:bottom-5">
        <StartRoutineButton routineId={routine.id} />
      </div>
    </div>
  );
}
