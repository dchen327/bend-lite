"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getDefaultSavedRoutines,
  loadSavedRoutines,
  saveRoutines,
  type SavedRoutine,
} from "@/lib/routine-storage";

type RoutineStoreValue = {
  ready: boolean;
  routines: SavedRoutine[];
  addRoutine: (routine: SavedRoutine) => void;
  updateRoutine: (routine: SavedRoutine) => void;
};

const RoutineStoreContext = createContext<RoutineStoreValue | null>(null);

export function RoutineStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [routines, setRoutines] = useState<SavedRoutine[]>(
    getDefaultSavedRoutines,
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setRoutines(loadSavedRoutines());
      setReady(true);
    };

    refresh();
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  const commit = useCallback(
    (update: (current: SavedRoutine[]) => SavedRoutine[]) => {
      setRoutines((current) => {
        const next = update(current);
        saveRoutines(next);
        return next;
      });
    },
    [],
  );

  const addRoutine = useCallback(
    (routine: SavedRoutine) => {
      commit((current) =>
        current.some(({ id }) => id === routine.id)
          ? current
          : [...current, routine],
      );
    },
    [commit],
  );

  const updateRoutine = useCallback(
    (routine: SavedRoutine) => {
      commit((current) =>
        current.map((candidate) =>
          candidate.id === routine.id ? routine : candidate,
        ),
      );
    },
    [commit],
  );

  const value = useMemo(
    () => ({ ready, routines, addRoutine, updateRoutine }),
    [addRoutine, ready, routines, updateRoutine],
  );

  return (
    <RoutineStoreContext.Provider value={value}>
      {children}
    </RoutineStoreContext.Provider>
  );
}

export function useRoutineStore(): RoutineStoreValue {
  const value = useContext(RoutineStoreContext);
  if (!value) {
    throw new Error("useRoutineStore must be used inside RoutineStoreProvider.");
  }
  return value;
}
