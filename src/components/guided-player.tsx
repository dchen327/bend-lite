"use client";

import {
  Check,
  ChevronDown,
  ChevronLeft,
  Info,
  Pause,
  Play,
  Repeat2,
  RotateCcw,
  SkipBack,
  SkipForward,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { Exercise } from "@/data/exercises";
import type { Routine } from "@/data/routines";
import {
  playTone,
  playTransitionChime,
  speak,
  unlockAudio,
} from "@/lib/audio";

type PlayerStatus = "idle" | "running" | "paused" | "complete";
type SegmentKind =
  | "start-countdown"
  | "exercise"
  | "side-transition"
  | "exercise-transition";

type PlayerSegment = {
  kind: SegmentKind;
  durationMs: number;
  exerciseId: string;
  nextExerciseId?: string;
  stepIndex: number;
  side?: 1 | 2;
};

type WakeLockHandle = {
  released: boolean;
  release: () => Promise<void>;
};

type GuidedPlayerProps = {
  routine: Routine;
  exerciseMap: Record<string, Exercise>;
};

const CIRCLE_RADIUS = 47;
const CIRCLE_LENGTH = 2 * Math.PI * CIRCLE_RADIUS;
const START_COUNTDOWN_MS = 5_000;
const NEXT_UP_CUE_MS = 4_000;

function buildSegments(routine: Routine): PlayerSegment[] {
  const segments: PlayerSegment[] = [];
  const firstStep = routine.steps[0];

  if (firstStep) {
    segments.push({
      kind: "start-countdown",
      durationMs: START_COUNTDOWN_MS,
      exerciseId: firstStep.exerciseId,
      stepIndex: 0,
    });
  }

  routine.steps.forEach((step, stepIndex) => {
    if (step.switchSides) {
      const halfDurationMs = (step.duration * 1000) / 2;
      segments.push({
        kind: "exercise",
        durationMs: halfDurationMs,
        exerciseId: step.exerciseId,
        stepIndex,
        side: 1,
      });
      segments.push({
        kind: "side-transition",
        durationMs: routine.sideTransitionSeconds * 1000,
        exerciseId: step.exerciseId,
        stepIndex,
      });
      segments.push({
        kind: "exercise",
        durationMs: halfDurationMs,
        exerciseId: step.exerciseId,
        stepIndex,
        side: 2,
      });
    } else {
      segments.push({
        kind: "exercise",
        durationMs: step.duration * 1000,
        exerciseId: step.exerciseId,
        stepIndex,
      });
    }

    const nextStep = routine.steps[stepIndex + 1];
    if (nextStep) {
      segments.push({
        kind: "exercise-transition",
        durationMs: routine.exerciseTransitionSeconds * 1000,
        exerciseId: nextStep.exerciseId,
        nextExerciseId: nextStep.exerciseId,
        stepIndex: stepIndex + 1,
      });
    }
  });

  return segments;
}

function formatRemaining(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

function RoutineProgressBar({ progress }: { progress: number }) {
  const percentage = Math.round(progress * 100);

  return (
    <div
      className="absolute inset-x-0 top-0 z-30 h-1.5 bg-slate-100"
      role="progressbar"
      aria-label="Routine progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percentage}
    >
      <div
        className="h-full bg-[var(--brand)] transition-[width] duration-75"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}

export function GuidedPlayer({
  routine,
  exerciseMap,
}: GuidedPlayerProps) {
  const segments = useMemo(() => buildSegments(routine), [routine]);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [remainingMs, setRemainingMs] = useState(
    segments[0]?.durationMs ?? 0,
  );
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [showDetails, setShowDetails] = useState(false);
  const deadlineRef = useRef(0);
  const remainingRef = useRef(segments[0]?.durationMs ?? 0);
  const frameRef = useRef<number | null>(null);
  const announcedSegmentRef = useRef(-1);
  const beepSecondRef = useRef<number | null>(null);
  const nextCuePlayedRef = useRef(false);
  const wakeLockRef = useRef<WakeLockHandle | null>(null);

  const segment = segments[segmentIndex];
  const exercise = segment ? exerciseMap[segment.exerciseId] : undefined;
  const upcomingExercise = segment?.nextExerciseId
    ? exerciseMap[segment.nextExerciseId]
    : undefined;
  const routineDurationMs = useMemo(
    () =>
      segments.reduce(
        (total, candidate) =>
          candidate.kind === "start-countdown"
            ? total
            : total + candidate.durationMs,
        0,
      ),
    [segments],
  );
  const elapsedBeforeSegmentMs = useMemo(
    () =>
      segments.slice(0, segmentIndex).reduce(
        (total, candidate) =>
          candidate.kind === "start-countdown"
            ? total
            : total + candidate.durationMs,
        0,
      ),
    [segmentIndex, segments],
  );
  const elapsedInSegmentMs =
    segment && segment.kind !== "start-countdown"
      ? Math.max(0, segment.durationMs - remainingMs)
      : 0;
  const routineProgress =
    routineDurationMs > 0
      ? Math.min(
          1,
          (elapsedBeforeSegmentMs + elapsedInSegmentMs) / routineDurationMs,
        )
      : 0;

  const finishRoutine = useCallback(() => {
    setStatus("complete");
    remainingRef.current = 0;
    setRemainingMs(0);
    playTransitionChime();
    speak("Routine complete. Great work.");
  }, []);

  const advanceSegment = useCallback(
    (overrunMs = 0) => {
      let nextIndex = segmentIndex + 1;
      let remainingOverrun = overrunMs;

      while (
        nextIndex < segments.length &&
        remainingOverrun >= segments[nextIndex].durationMs
      ) {
        remainingOverrun -= segments[nextIndex].durationMs;
        nextIndex += 1;
      }

      if (nextIndex >= segments.length) {
        finishRoutine();
        return;
      }

      const nextRemaining = Math.max(
        0,
        segments[nextIndex].durationMs - remainingOverrun,
      );
      remainingRef.current = nextRemaining;
      announcedSegmentRef.current = -1;
      beepSecondRef.current = null;
      nextCuePlayedRef.current = false;
      setRemainingMs(nextRemaining);
      setShowDetails(false);
      setSegmentIndex(nextIndex);
    },
    [finishRoutine, segmentIndex, segments],
  );

  useEffect(() => {
    if (status !== "running") {
      return;
    }

    deadlineRef.current = performance.now() + remainingRef.current;
    let lastPaintAt = 0;

    const tick = (now: number) => {
      const currentRemaining = deadlineRef.current - performance.now();
      if (currentRemaining <= 0) {
        advanceSegment(Math.abs(currentRemaining));
        return;
      }

      remainingRef.current = currentRemaining;
      const followingSegment = segments[segmentIndex + 1];
      if (
        segment?.kind === "exercise" &&
        followingSegment?.kind === "exercise-transition" &&
        followingSegment.nextExerciseId &&
        currentRemaining <= NEXT_UP_CUE_MS &&
        !nextCuePlayedRef.current
      ) {
        const nextExercise = exerciseMap[followingSegment.nextExerciseId];
        if (nextExercise) {
          nextCuePlayedRef.current = true;
          speak(`Next up, ${nextExercise.name}.`);
        }
      }

      const beepSecond = Math.ceil(currentRemaining / 1000);
      if (
        (segment?.kind === "exercise" ||
          segment?.kind === "start-countdown") &&
        beepSecond <= 3 &&
        beepSecond > 0 &&
        beepSecondRef.current !== beepSecond
      ) {
        beepSecondRef.current = beepSecond;
        playTone(beepSecond === 1 ? 920 : 760, 90);
      }

      if (now - lastPaintAt >= 50) {
        lastPaintAt = now;
        setRemainingMs(currentRemaining);
      }
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [
    advanceSegment,
    exerciseMap,
    segment?.kind,
    segmentIndex,
    segments,
    status,
  ]);

  useEffect(() => {
    if (status !== "running" || !segment || !exercise) {
      return;
    }
    if (announcedSegmentRef.current === segmentIndex) {
      return;
    }

    announcedSegmentRef.current = segmentIndex;
    beepSecondRef.current = null;

    if (segment.kind === "start-countdown") {
      speak(`Get ready. Starting with ${exercise.name}.`);
    } else if (segment.kind === "side-transition") {
      playTransitionChime();
      speak("Switch sides.");
    } else if (segment.kind === "exercise-transition") {
      playTransitionChime();
    } else if (segment.side === 2) {
      // The preceding transition already announces the side switch.
    } else {
      speak(exercise.name);
    }
  }, [exercise, segment, segmentIndex, status]);

  const requestWakeLock = useCallback(async () => {
    const wakeLockNavigator = navigator as Navigator & {
      wakeLock?: {
        request: (type: "screen") => Promise<WakeLockHandle>;
      };
    };

    if (!wakeLockNavigator.wakeLock || document.visibilityState !== "visible") {
      return;
    }

    try {
      wakeLockRef.current = await wakeLockNavigator.wakeLock.request("screen");
    } catch {
      // Wake lock is best-effort and can be denied by low-power modes.
    }
  }, []);

  useEffect(() => {
    if (status !== "running") {
      return;
    }

    void requestWakeLock();
    const reacquireWakeLock = () => {
      if (document.visibilityState === "visible") {
        void requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", reacquireWakeLock);

    return () => {
      document.removeEventListener("visibilitychange", reacquireWakeLock);
      if (wakeLockRef.current && !wakeLockRef.current.released) {
        void wakeLockRef.current.release();
      }
      wakeLockRef.current = null;
    };
  }, [requestWakeLock, status]);

  useEffect(() => {
    const shouldStart =
      window.sessionStorage.getItem("bend-lite-autostart") === "true";
    if (!shouldStart) {
      return;
    }

    window.sessionStorage.removeItem("bend-lite-autostart");
    void unlockAudio().finally(() => setStatus("running"));
  }, []);

  async function startOrResume() {
    await unlockAudio();
    setStatus("running");
  }

  function pause() {
    if (status !== "running") {
      return;
    }
    const currentRemaining = Math.max(
      0,
      deadlineRef.current - performance.now(),
    );
    remainingRef.current = currentRemaining;
    setRemainingMs(currentRemaining);
    window.speechSynthesis?.cancel();
    setStatus("paused");
  }

  function goToStep(stepIndex: number) {
    if (stepIndex < 0) {
      return;
    }
    if (stepIndex >= routine.steps.length) {
      finishRoutine();
      return;
    }

    const targetIndex = segments.findIndex(
      (candidate) =>
        candidate.kind === "exercise" && candidate.stepIndex === stepIndex,
    );
    if (targetIndex < 0) {
      return;
    }

    const targetDuration = segments[targetIndex].durationMs;
    remainingRef.current = targetDuration;
    announcedSegmentRef.current = -1;
    beepSecondRef.current = null;
    nextCuePlayedRef.current = false;
    setRemainingMs(targetDuration);
    setShowDetails(false);
    setSegmentIndex(targetIndex);
  }

  async function restart() {
    await unlockAudio();
    const firstDuration = segments[0]?.durationMs ?? 0;
    remainingRef.current = firstDuration;
    announcedSegmentRef.current = -1;
    beepSecondRef.current = null;
    nextCuePlayedRef.current = false;
    setRemainingMs(firstDuration);
    setSegmentIndex(0);
    setStatus("running");
  }

  if (status === "complete") {
    return (
      <main className="relative mx-auto flex h-dvh w-full max-w-[440px] flex-col items-center justify-center overflow-hidden bg-white px-8 text-center sm:my-5 sm:h-[calc(100dvh-2.5rem)] sm:rounded-[2rem] sm:shadow-xl">
        <RoutineProgressBar progress={1} />
        <div className="grid size-28 place-items-center rounded-full bg-sky-50 text-[var(--brand)]">
          <Check className="size-14" strokeWidth={2.5} aria-hidden="true" />
        </div>
        <p className="mt-8 text-sm font-bold tracking-[0.18em] text-[var(--brand)] uppercase">
          Complete
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
          Great work
        </h1>
        <p className="mt-3 max-w-xs text-base leading-7 text-slate-500">
          You finished all {routine.steps.length} exercises in{" "}
          {routine.name}.
        </p>
        <div className="mt-12 flex w-full flex-col gap-3">
          <button
            type="button"
            onClick={restart}
            className="flex h-14 items-center justify-center gap-2 rounded-full bg-[var(--brand)] font-bold text-white"
          >
            <RotateCcw className="size-5" aria-hidden="true" />
            Run it again
          </button>
          <Link
            href="/"
            className="flex h-12 items-center justify-center rounded-full font-semibold text-slate-500"
          >
            Back to routine
          </Link>
        </div>
      </main>
    );
  }

  if (!segment || !exercise) {
    return null;
  }

  const displayExercise =
    segment.kind === "exercise-transition" && upcomingExercise
      ? upcomingExercise
      : exercise;
  const activeStep = routine.steps[segment.stepIndex];
  const isSplitExercise =
    segment.kind === "exercise" && activeStep.switchSides && segment.side;
  const halfDurationMs = (activeStep.duration * 1000) / 2;
  const displayRemainingMs =
    isSplitExercise && segment.side === 1
      ? remainingMs + halfDurationMs
      : remainingMs;
  const progress = isSplitExercise
    ? segment.side === 1
      ? (halfDurationMs - remainingMs) / (halfDurationMs * 2)
      : (halfDurationMs + (halfDurationMs - remainingMs)) /
        (halfDurationMs * 2)
    : segment.durationMs > 0
      ? 1 - Math.min(1, remainingMs / segment.durationMs)
      : 1;
  const isStartCountdown = segment.kind === "start-countdown";
  const isTransition =
    segment.kind === "side-transition" ||
    segment.kind === "exercise-transition";
  const followingSegment = segments[segmentIndex + 1];
  const cornerPreviewExercise = isStartCountdown
    ? exercise
    : segment.kind === "exercise" &&
        remainingMs <= NEXT_UP_CUE_MS &&
        followingSegment?.kind === "exercise-transition" &&
        followingSegment.nextExerciseId
      ? exerciseMap[followingSegment.nextExerciseId]
      : undefined;
  const phaseLabel =
    isStartCountdown
      ? "Get ready"
      : segment.kind === "side-transition"
      ? "Switch sides"
      : segment.kind === "exercise-transition"
        ? "Up next"
        : segment.side
          ? `Side ${segment.side} of 2`
          : "Stretch";

  return (
    <div className="h-dvh overflow-hidden bg-slate-100 sm:py-5">
      <main className="relative mx-auto flex h-full w-full max-w-[440px] flex-col overflow-hidden bg-white sm:rounded-[2rem] sm:shadow-xl">
        <RoutineProgressBar progress={routineProgress} />
        <header className="flex items-center justify-between border-b border-slate-100 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <Link
            href="/"
            aria-label="Exit routine"
            className="grid size-11 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100"
          >
            <ChevronLeft className="size-6" aria-hidden="true" />
          </Link>
          <div className="text-center">
            <p className="text-2xl font-bold tabular-nums text-slate-900">
              {segment.stepIndex + 1} of {routine.steps.length}
            </p>
            <p className="mt-0.5 text-lg font-bold tracking-[0.06em] text-slate-500 uppercase">
              {phaseLabel}
            </p>
          </div>
          <div className="size-11" aria-hidden="true" />
        </header>

        <div className="flex flex-1 flex-col items-center px-5 pb-32 pt-7">
          <div className="relative aspect-square w-[calc(100%_-_2rem)] max-w-[350px]">
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 z-10 size-full -rotate-90"
              aria-hidden="true"
            >
              <circle
                cx="50"
                cy="50"
                r={CIRCLE_RADIUS}
                fill="none"
                stroke="rgb(226 232 240)"
                strokeWidth="2.5"
              />
              {!isTransition ? (
                <circle
                  cx="50"
                  cy="50"
                  r={CIRCLE_RADIUS}
                  fill="none"
                  stroke="var(--brand)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={CIRCLE_LENGTH}
                  strokeDashoffset={CIRCLE_LENGTH * (1 - progress)}
                  className="transition-[stroke-dashoffset] duration-75"
                />
              ) : null}
            </svg>
            <div className="absolute inset-[6%] overflow-hidden rounded-full bg-slate-100">
              <Image
                src={exercise.image}
                alt={`${exercise.name} illustration`}
                fill
                sizes="(max-width: 440px) 88vw, 350px"
                className={`object-cover ${isStartCountdown ? "opacity-0" : "opacity-100"}`}
                loading={segment.stepIndex === 0 ? "eager" : "lazy"}
              />
              {isStartCountdown ? (
                <div className="absolute inset-0 grid place-items-center bg-sky-50">
                  <span
                    className="timer-digits text-8xl font-bold text-[var(--brand)]"
                    aria-live="polite"
                  >
                    {Math.max(1, Math.ceil(remainingMs / 1000))}
                  </span>
                </div>
              ) : null}
            </div>
            {cornerPreviewExercise ? (
              <span className="absolute -right-5 top-0 z-20 size-20 overflow-hidden rounded-full border-4 border-white bg-white shadow-lg">
                <Image
                  src={cornerPreviewExercise.image}
                  alt={
                    isStartCountdown
                      ? `Starting with ${cornerPreviewExercise.name}`
                      : `Next: ${cornerPreviewExercise.name}`
                  }
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </span>
            ) : activeStep.switchSides && !isStartCountdown ? (
              <span
                className="absolute -right-5 top-0 z-20 grid size-12 place-items-center rounded-full border-2 border-white bg-white text-[var(--brand)] shadow-md"
                title="Switch sides halfway"
              >
                <Repeat2 className="size-6" strokeWidth={2.5} aria-hidden="true" />
                <span className="sr-only">Switch sides halfway</span>
              </span>
            ) : null}
          </div>

          <div className="mt-7 text-center">
            {isStartCountdown ? (
              <>
                <p className="text-3xl font-bold tracking-tight text-slate-950">
                  Get ready
                </p>
                <p className="mt-3 text-xl font-semibold text-slate-500">
                  Starting with {displayExercise.name}
                </p>
              </>
            ) : (
              <>
                {isTransition ? (
                  <p className="mb-2 text-xl font-bold tracking-[0.1em] text-[var(--brand)] uppercase">
                    {phaseLabel}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => setShowDetails((visible) => !visible)}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[2rem] font-bold tracking-tight text-slate-950"
                  aria-expanded={showDetails}
                >
                  {displayExercise.name}
                  <Info className="size-5 text-slate-300" aria-hidden="true" />
                </button>
                {!isTransition ? (
                  <p
                    className="timer-digits mt-6 text-7xl font-bold tracking-tight text-slate-400"
                    aria-live="off"
                  >
                    {formatRemaining(displayRemainingMs)}
                  </p>
                ) : (
                  <div className="h-[4.5rem]" aria-hidden="true" />
                )}
              </>
            )}
          </div>

          {showDetails && !isStartCountdown ? (
            <section className="mt-7 w-full rounded-3xl bg-slate-50 p-5 text-left">
              <button
                type="button"
                onClick={() => setShowDetails(false)}
                className="flex w-full items-center justify-between text-sm font-bold text-slate-900"
              >
                Instructions
                <ChevronDown className="size-4" aria-hidden="true" />
              </button>
              <ol className="mt-3 space-y-2 pl-5 text-sm leading-6 text-slate-600">
                {displayExercise.instructions.map((instruction) => (
                  <li key={instruction} className="list-decimal pl-1">
                    {instruction}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </div>

        {status === "idle" ? (
          <div className="absolute inset-0 z-30 flex items-end bg-white/70 p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] backdrop-blur-sm">
            <button
              type="button"
              onClick={startOrResume}
              className="flex h-16 w-full items-center justify-center gap-3 rounded-full bg-[var(--brand)] text-lg font-bold text-white shadow-xl"
            >
              <Play className="size-6 fill-current" aria-hidden="true" />
              Begin routine
            </button>
          </div>
        ) : null}

        {!isStartCountdown ? (
          <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-white via-white to-white/0 px-7 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-10">
            <div className="flex items-center justify-center gap-8">
              <button
                type="button"
                onClick={() => goToStep(segment.stepIndex - 1)}
                disabled={segment.stepIndex === 0}
                aria-label="Previous exercise"
                className="grid size-16 place-items-center rounded-full bg-white text-slate-800 shadow-[0_10px_35px_rgb(15_23_42/0.14)] disabled:opacity-30"
              >
                <SkipBack className="size-7 fill-current" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={status === "running" ? pause : startOrResume}
                aria-label={
                  status === "running" ? "Pause routine" : "Resume routine"
                }
                className="grid size-24 place-items-center rounded-full bg-white text-slate-900 shadow-[0_14px_45px_rgb(15_23_42/0.18)]"
              >
                {status === "running" ? (
                  <Pause className="size-10 fill-current" aria-hidden="true" />
                ) : (
                  <Play className="ml-1 size-10 fill-current" aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                onClick={() => goToStep(segment.stepIndex + 1)}
                aria-label="Next exercise"
                className="grid size-16 place-items-center rounded-full bg-white text-slate-800 shadow-[0_10px_35px_rgb(15_23_42/0.14)]"
              >
                <SkipForward className="size-7 fill-current" aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
