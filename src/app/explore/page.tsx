import { ChevronRight, Clock3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { AppBottomNav } from "@/components/app-bottom-nav";
import { bendRoutines } from "@/data/bendRoutines";
import { exercises } from "@/data/exercises";

export default function ExplorePage() {
  const routineCards = bendRoutines.map((routine) => {
    const previewExercises = routine.steps.slice(0, 3).map((step) => {
      const exercise = exercises[step.exerciseId];
      if (!exercise) {
        throw new Error(`Missing exercise "${step.exerciseId}" in the library.`);
      }
      return exercise;
    });

    return { routine, previewExercises };
  });

  return (
    <div className="min-h-dvh bg-slate-100 sm:py-5">
      <main className="mx-auto min-h-dvh w-full max-w-[440px] bg-white pb-[calc(5.5rem+env(safe-area-inset-bottom))] shadow-xl shadow-slate-300/30 sm:min-h-[calc(100dvh-2.5rem)] sm:rounded-[2rem]">
        <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 px-5 pb-5 pt-[calc(1.25rem+env(safe-area-inset-top))] backdrop-blur">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Explore
          </h1>
          <p className="mt-1 text-base font-medium text-slate-500">
            All {bendRoutines.length} Bend routines.
          </p>
        </header>

        <section className="px-5 py-3" aria-label="Bend routines">
          {routineCards.map(({ routine, previewExercises }, routineIndex) => (
            <Link
              key={routine.slug}
              href={`/explore/${routine.slug}`}
              className="block border-b border-slate-100 py-5 last:border-0"
            >
              <div className="flex items-center gap-4">
                <div className="flex w-[104px] shrink-0 items-center">
                  {previewExercises.map((exercise, exerciseIndex) => (
                    <div
                      key={`${exercise.id}-${exerciseIndex}`}
                      className={`relative size-14 shrink-0 overflow-hidden rounded-full border-2 border-white bg-slate-100 shadow-sm ${
                        exerciseIndex > 0 ? "-ml-8" : ""
                      }`}
                      style={{ zIndex: previewExercises.length - exerciseIndex }}
                    >
                      <Image
                        src={exercise.image}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                        loading={
                          routineIndex === 0 && exerciseIndex === 0
                            ? "eager"
                            : "lazy"
                        }
                      />
                    </div>
                  ))}
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-bold text-slate-950">
                    {routine.name}
                  </h2>
                  <div className="mt-1.5 flex items-center gap-3 text-sm font-semibold text-slate-500">
                    <span>{routine.steps.length} exercises</span>
                    <span className="flex items-center gap-1.5">
                      <Clock3 className="size-4" aria-hidden="true" />
                      {routine.totalMinutes} min
                    </span>
                  </div>
                </div>
                <ChevronRight
                  className="size-5 shrink-0 text-slate-300"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
                {routine.description}
              </p>
            </Link>
          ))}
        </section>
      </main>
      <AppBottomNav />
    </div>
  );
}
