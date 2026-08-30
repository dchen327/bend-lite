import { ChevronDown, Repeat2 } from "lucide-react";
import Image from "next/image";

import type { Exercise } from "@/data/exercises";
import { formatRoutineDuration } from "@/lib/routines";

type ExerciseListItemProps = {
  exercise: Exercise;
  durationSeconds: number;
  switchSides?: boolean;
  eager?: boolean;
};

export function ExerciseListItem({
  exercise,
  durationSeconds,
  switchSides = false,
  eager = false,
}: ExerciseListItemProps) {
  return (
    <li className="border-b border-slate-100 last:border-0">
      <details className="group">
        <summary className="flex min-h-24 cursor-pointer list-none items-center gap-3 py-3 [&::-webkit-details-marker]:hidden">
          <div className="relative shrink-0">
            <Image
              src={exercise.image}
              alt=""
              width={72}
              height={72}
              className="size-[72px] rounded-full object-cover ring-1 ring-slate-200"
              loading={eager ? "eager" : "lazy"}
            />
            {switchSides ? (
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
            <span className="block truncate text-lg font-semibold text-slate-900">
              {exercise.name}
            </span>
            {switchSides ? (
              <span className="mt-1 block text-xs font-medium text-slate-400">
                Switch halfway
              </span>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <span className="timer-digits rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-500">
              {formatRoutineDuration(durationSeconds)}
            </span>
            <ChevronDown
              className="size-4 text-slate-300 transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </div>
        </summary>

        <div className="mb-4 space-y-5 rounded-2xl bg-slate-50 p-5">
          {exercise.instructions.length > 0 ? (
            <section>
              <h2 className="text-xs font-bold tracking-[0.12em] text-slate-400 uppercase">
                Instructions
              </h2>
              <ol className="mt-2 space-y-2 pl-5 text-sm leading-6 text-slate-600">
                {exercise.instructions.map((instruction) => (
                  <li key={instruction} className="list-decimal pl-1">
                    {instruction}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {[
            { title: "Tips", items: exercise.tips },
            { title: "Modifications", items: exercise.modifications },
            { title: "Benefits", items: exercise.benefits },
          ].map(({ title, items }) =>
            items.length > 0 ? (
              <section key={title}>
                <h2 className="text-xs font-bold tracking-[0.12em] text-slate-400 uppercase">
                  {title}
                </h2>
                <ul className="mt-2 space-y-2 pl-5 text-sm leading-6 text-slate-600">
                  {items.map((item) => (
                    <li key={item} className="list-disc pl-1">
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null,
          )}
        </div>
      </details>
    </li>
  );
}
