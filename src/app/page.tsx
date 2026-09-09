"use client";

import { ChevronRight, Clock3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { AppBottomNav } from "@/components/app-bottom-nav";
import { useRoutineStore } from "@/components/routine-store-provider";
import { exercises } from "@/data/exercises";
import {
  formatRoutineDuration,
  getRoutineDurationSeconds,
} from "@/lib/routines";

export default function Home() {
  const { routines } = useRoutineStore();
  const routineCards = routines.map((routine) => {
    const previewExercises = routine.steps.slice(0, 3).map((step) => {
      const exercise = exercises[step.exerciseId];
      if (!exercise) {
        throw new Error(`Missing exercise "${step.exerciseId}" in the library.`);
      }
      return exercise;
    });

    return {
      routine,
      previewExercises,
      duration: getRoutineDurationSeconds(routine),
    };
  });

  return (
    <div className="min-h-dvh bg-slate-100 sm:py-5">
      <main className="mx-auto min-h-dvh w-full max-w-[440px] bg-white pb-[calc(5.5rem+env(safe-area-inset-bottom))] shadow-xl shadow-slate-300/30 sm:min-h-[calc(100dvh-2.5rem)] sm:rounded-[2rem]">
        <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 px-5 pb-5 pt-[calc(1.25rem+env(safe-area-inset-top))] backdrop-blur">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            My routines
          </h1>
          <p className="mt-1 text-base font-medium text-slate-500">
            Choose a routine and start moving.
          </p>
        </header>

        <section className="space-y-5 px-5 py-6" aria-label="Routines">
          {routineCards.map(({ routine, previewExercises, duration }) => (
            <Link
              key={routine.id}
              href={`/routines/${routine.id}`}
              className="group block overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_12px_35px_rgb(15_23_42/0.08)] transition active:scale-[0.99]"
            >
              <div className="flex h-44 items-center justify-center overflow-hidden bg-sky-50 px-4">
                {previewExercises.map((exercise, index) => (
                  <div
                    key={exercise.id}
                    className={`relative size-28 shrink-0 overflow-hidden rounded-full border-4 border-white bg-white shadow-md ${
                      index > 0 ? "-ml-4" : ""
                    }`}
                  >
                    <Image
                      src={exercise.image}
                      alt=""
                      fill
                      sizes="112px"
                      className="object-cover"
                      loading="eager"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-xl font-bold tracking-tight text-slate-950">
                    {routine.name}
                  </h2>
                  <div className="mt-2 flex items-center gap-3 text-sm font-semibold text-slate-500">
                    <span>{routine.steps.length} exercises</span>
                    <span className="flex items-center gap-1.5">
                      <Clock3 className="size-4" aria-hidden="true" />
                      <span className="timer-digits">
                        {formatRoutineDuration(duration)}
                      </span>
                    </span>
                  </div>
                </div>
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 transition group-hover:bg-sky-50 group-hover:text-[var(--brand)]">
                  <ChevronRight className="size-5" aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </section>
      </main>
      <AppBottomNav />
    </div>
  );
}
