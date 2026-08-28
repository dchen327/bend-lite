"use client";

import { Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { unlockAudio } from "@/lib/audio";

export function StartRoutineButton() {
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  async function startRoutine() {
    if (starting) {
      return;
    }

    setStarting(true);
    await unlockAudio();
    window.sessionStorage.setItem("bend-lite-autostart", "true");
    router.push("/play");
  }

  return (
    <button
      type="button"
      onClick={startRoutine}
      disabled={starting}
      className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[var(--brand)] px-6 text-base font-bold tracking-[0.08em] text-white shadow-lg shadow-sky-900/15 transition active:scale-[0.99] disabled:opacity-70"
    >
      <Play className="size-5 fill-current" aria-hidden="true" />
      {starting ? "STARTING…" : "START"}
    </button>
  );
}
