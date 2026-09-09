"use client";

import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  Clock3,
  Pencil,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { ExerciseListItem } from "@/components/exercise-list-item";
import { useRoutineStore } from "@/components/routine-store-provider";
import { StartRoutineButton } from "@/components/start-routine-button";
import { exercises } from "@/data/exercises";
import {
  formatRoutineDuration,
  getRoutineDurationSeconds,
} from "@/lib/routines";
import type { SavedRoutine } from "@/lib/routine-storage";

export function SavedRoutinePage({ routineId }: { routineId: string }) {
  const { ready, routines, updateRoutine } = useRoutineStore();
  const [editing, setEditing] = useState(false);
  const routine = routines.find((candidate) => candidate.id === routineId);

  if (!ready) {
    return <div className="min-h-dvh bg-white" />;
  }

  if (!routine) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col items-center justify-center bg-white px-8 text-center">
        <h1 className="text-2xl font-bold text-slate-950">Routine not found</h1>
        <Link href="/" className="mt-5 font-bold text-[var(--brand)]">
          Back to My Routines
        </Link>
      </main>
    );
  }

  const activeRoutine = routine;
  const totalSeconds = getRoutineDurationSeconds(activeRoutine);

  function changeDuration(stepIndex: number, duration: number) {
    if (!Number.isInteger(duration) || duration < 1 || duration > 3600) {
      return;
    }

    updateRoutine({
      ...activeRoutine,
      steps: activeRoutine.steps.map((step, index) =>
        index === stepIndex ? { ...step, duration } : step,
      ),
    });
  }

  function moveStep(stepIndex: number, offset: -1 | 1) {
    const targetIndex = stepIndex + offset;
    if (targetIndex < 0 || targetIndex >= activeRoutine.steps.length) {
      return;
    }

    const steps = activeRoutine.steps.map((step) => ({ ...step }));
    [steps[stepIndex], steps[targetIndex]] = [
      steps[targetIndex],
      steps[stepIndex],
    ];
    updateRoutine({ ...activeRoutine, steps });
  }

  return (
    <div className="min-h-dvh bg-slate-100 sm:py-5">
      <main
        className={`mx-auto min-h-dvh w-full max-w-[440px] bg-white shadow-xl shadow-slate-300/30 sm:min-h-[calc(100dvh-2.5rem)] sm:rounded-[2rem] ${
          editing ? "pb-8" : "pb-32"
        }`}
      >
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
                {activeRoutine.name}
              </h1>
              <div className="mt-1 flex items-center gap-4 text-sm font-medium text-slate-500">
                <span>{activeRoutine.steps.length} exercises</span>
                <span className="flex items-center gap-1.5">
                  <Clock3 className="size-4" aria-hidden="true" />
                  <span className="timer-digits">
                    {formatRoutineDuration(totalSeconds)}
                  </span>
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEditing((current) => !current)}
              className="grid size-11 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600"
              aria-label={editing ? "Finish editing routine" : "Edit routine"}
            >
              {editing ? (
                <Check className="size-5" aria-hidden="true" />
              ) : (
                <Pencil className="size-5" aria-hidden="true" />
              )}
            </button>
          </div>
          {editing ? (
            <p className="mt-3 text-center text-xs font-semibold text-slate-400">
              Changes save automatically on this device.
            </p>
          ) : null}
        </header>

        <ol className="px-4 py-3">
          {activeRoutine.steps.map((step, index) => {
            const exercise = exercises[step.exerciseId];
            if (!exercise) {
              return null;
            }

            return editing ? (
              <EditableStep
                key={`${exercise.id}-${index}`}
                routine={activeRoutine}
                stepIndex={index}
                onDurationChange={changeDuration}
                onMove={moveStep}
              />
            ) : (
              <ExerciseListItem
                key={`${exercise.id}-${index}`}
                exercise={exercise}
                durationSeconds={step.duration}
                switchSides={step.switchSides}
                eager={index === 0}
              />
            );
          })}
        </ol>
      </main>

      {!editing ? (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[440px] bg-gradient-to-t from-white via-white to-white/0 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-8 sm:bottom-5">
          <StartRoutineButton routineId={activeRoutine.id} />
        </div>
      ) : null}
    </div>
  );
}

function EditableStep({
  routine,
  stepIndex,
  onDurationChange,
  onMove,
}: {
  routine: SavedRoutine;
  stepIndex: number;
  onDurationChange: (stepIndex: number, duration: number) => void;
  onMove: (stepIndex: number, offset: -1 | 1) => void;
}) {
  const step = routine.steps[stepIndex];
  const exercise = exercises[step.exerciseId];
  if (!exercise) {
    return null;
  }

  return (
    <li className="flex min-h-24 items-center gap-3 border-b border-slate-100 py-3 last:border-0">
      <Image
        src={exercise.image}
        alt=""
        width={64}
        height={64}
        className="size-16 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
      />
      <div className="min-w-0 flex-1">
        <span className="block truncate text-base font-semibold text-slate-900">
          {exercise.name}
        </span>
        {step.switchSides ? (
          <span className="mt-1 block text-xs font-medium text-slate-400">
            Switch halfway
          </span>
        ) : null}
      </div>
      <label className="flex shrink-0 items-center gap-1">
        <span className="sr-only">{exercise.name} duration in seconds</span>
        <input
          type="number"
          min={1}
          max={3600}
          step={1}
          inputMode="numeric"
          value={step.duration}
          onChange={(event) =>
            onDurationChange(stepIndex, Number(event.target.value))
          }
          className="timer-digits h-10 w-16 rounded-xl border border-slate-200 bg-white px-2 text-center text-base font-bold text-slate-700 outline-none focus:border-sky-400"
        />
        <span className="text-xs font-semibold text-slate-400">s</span>
      </label>
      <div className="flex shrink-0 flex-col gap-1">
        <button
          type="button"
          onClick={() => onMove(stepIndex, -1)}
          disabled={stepIndex === 0}
          className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-500 disabled:opacity-25"
          aria-label={`Move ${exercise.name} up`}
        >
          <ArrowUp className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onMove(stepIndex, 1)}
          disabled={stepIndex === routine.steps.length - 1}
          className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-500 disabled:opacity-25"
          aria-label={`Move ${exercise.name} down`}
        >
          <ArrowDown className="size-4" aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}
