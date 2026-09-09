"use client";

import { ChevronRight, Clock3, Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";

import { AddBendRoutineButton } from "@/components/add-bend-routine-button";
import { AppBottomNav } from "@/components/app-bottom-nav";
import { bendRoutines } from "@/data/bendRoutines";
import { exercises } from "@/data/exercises";

const SEARCH_CHANGE_EVENT = "bend-lite:explore-search";

function subscribeToSearch(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener(SEARCH_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener(SEARCH_CHANGE_EVENT, callback);
  };
}

function getSearchSnapshot() {
  return new URLSearchParams(window.location.search).get("q") ?? "";
}

function getServerSearchSnapshot() {
  return "";
}

export default function ExplorePage() {
  const query = useSyncExternalStore(
    subscribeToSearch,
    getSearchSnapshot,
    getServerSearchSnapshot,
  );

  function updateQuery(value: string) {
    const normalizedValue = value.trim();
    window.history.replaceState(
      null,
      "",
      normalizedValue
        ? `/explore?q=${encodeURIComponent(normalizedValue)}`
        : "/explore",
    );
    window.dispatchEvent(new Event(SEARCH_CHANGE_EVENT));
  }

  function getRoutineHref(slug: string) {
    return normalizedQuery
      ? `/explore/${slug}?q=${encodeURIComponent(query.trim())}`
      : `/explore/${slug}`;
  }

  const routineCards = useMemo(
    () =>
      bendRoutines.map((routine) => {
        const previewExercises = routine.steps.slice(0, 3).map((step) => {
          const exercise = exercises[step.exerciseId];
          if (!exercise) {
            throw new Error(
              `Missing exercise "${step.exerciseId}" in the library.`,
            );
          }
          return exercise;
        });

        return { routine, previewExercises };
      }),
    [],
  );
  const normalizedQuery = query.trim().toLowerCase();
  const filteredCards = useMemo(() => {
    if (!normalizedQuery) {
      return routineCards;
    }

    return routineCards
      .map((card) => {
        const name = card.routine.name.toLowerCase();
        const description = card.routine.description.toLowerCase();
        const matchingMuscleSteps = card.routine.steps.filter((step) =>
          exercises[step.exerciseId]?.benefits.some((muscle) =>
            muscle.toLowerCase().includes(normalizedQuery),
          ),
        ).length;
        const muscleCoverage =
          matchingMuscleSteps / Math.max(1, card.routine.steps.length);
        const nameMatch = name.includes(normalizedQuery);
        const descriptionMatch = description.includes(normalizedQuery);
        const relevantMuscleMatch = muscleCoverage >= 0.6;

        return {
          ...card,
          matches: nameMatch || descriptionMatch || relevantMuscleMatch,
          score:
            (name === normalizedQuery ? 1_000 : nameMatch ? 700 : 0) +
            (descriptionMatch ? 300 : 0) +
            muscleCoverage * 100,
        };
      })
      .filter((card) => card.matches)
      .sort((left, right) => right.score - left.score);
  }, [normalizedQuery, routineCards]);

  const resultLabel = normalizedQuery
    ? `${filteredCards.length} matching ${
        filteredCards.length === 1 ? "routine" : "routines"
      }`
    : `All ${bendRoutines.length} Bend routines`;

  return (
    <div className="min-h-dvh bg-slate-100 sm:py-5">
      <main className="mx-auto min-h-dvh w-full max-w-[440px] bg-white pb-[calc(5.5rem+env(safe-area-inset-bottom))] shadow-xl shadow-slate-300/30 sm:min-h-[calc(100dvh-2.5rem)] sm:rounded-[2rem]">
        <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 px-5 pb-5 pt-[calc(1.25rem+env(safe-area-inset-top))] backdrop-blur">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Explore
          </h1>
          <p className="mt-1 text-base font-medium text-slate-500">
            {resultLabel}.
          </p>
          <label className="relative mt-4 block">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <span className="sr-only">
              Search routine names, descriptions, and muscle groups
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => updateQuery(event.target.value)}
              placeholder="Search routines or muscle groups"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-11 text-base font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-sky-400 focus:bg-white"
            />
            {query ? (
              <button
                type="button"
                onClick={() => updateQuery("")}
                className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-slate-400"
                aria-label="Clear search"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            ) : null}
          </label>
        </header>

        <section className="px-5 py-3" aria-label="Bend routines">
          {filteredCards.map(({ routine, previewExercises }, routineIndex) => (
            <article
              key={routine.slug}
              className="border-b border-slate-100 py-5 last:border-0"
            >
              <div className="flex items-center gap-2">
                <Link
                  href={getRoutineHref(routine.slug)}
                  className="flex min-w-0 flex-1 items-center gap-4"
                >
                  <div className="flex w-[104px] shrink-0 items-center">
                    {previewExercises.map((exercise, exerciseIndex) => (
                      <div
                        key={`${exercise.id}-${exerciseIndex}`}
                        className={`relative size-14 shrink-0 overflow-hidden rounded-full border-2 border-white bg-slate-100 shadow-sm ${
                          exerciseIndex > 0 ? "-ml-8" : ""
                        }`}
                        style={{
                          zIndex: previewExercises.length - exerciseIndex,
                        }}
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
                </Link>
                <AddBendRoutineButton slug={routine.slug} />
              </div>
              <Link
                href={getRoutineHref(routine.slug)}
                className="mt-3 block"
              >
                <p className="line-clamp-2 text-sm leading-6 text-slate-500">
                  {routine.description}
                </p>
              </Link>
            </article>
          ))}
          {filteredCards.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <p className="text-lg font-bold text-slate-900">
                No routines found
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Try a routine name or muscle group.
              </p>
            </div>
          ) : null}
        </section>
      </main>
      <AppBottomNav />
    </div>
  );
}
