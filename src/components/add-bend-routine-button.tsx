"use client";

import { Check, Plus } from "lucide-react";

import { useRoutineStore } from "@/components/routine-store-provider";
import { bendRoutines } from "@/data/bendRoutines";
import { convertBendRoutine } from "@/lib/routine-storage";

export function AddBendRoutineButton({ slug }: { slug: string }) {
  const { routines, addRoutine } = useRoutineStore();
  const id = `bend-${slug}`;
  const added = routines.some((routine) => routine.id === id);

  function add() {
    const routine = bendRoutines.find((candidate) => candidate.slug === slug);
    if (!routine) {
      return;
    }
    addRoutine(convertBendRoutine(routine));
  }

  return (
    <button
      type="button"
      onClick={add}
      disabled={added}
      className={`flex h-9 shrink-0 items-center gap-1 rounded-full px-3 text-xs font-bold transition ${
        added
          ? "bg-emerald-50 text-emerald-600"
          : "bg-sky-50 text-[var(--brand)] active:scale-95"
      }`}
      aria-label={added ? "Routine added" : "Add routine to My Routines"}
    >
      {added ? (
        <Check className="size-4" aria-hidden="true" />
      ) : (
        <Plus className="size-4" aria-hidden="true" />
      )}
      {added ? "Added" : "Add"}
    </button>
  );
}
