import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { seedExerciseLibrary } from "../data/seedExerciseLibrary";
import type { Exercise } from "../types";

const EXERCISE_LIBRARY_SEED_VERSION = 8;

interface ExerciseLibraryStore {
  exercises: Exercise[];
  seedVersion: number;
  addExercise: (exercise: Exercise) => void;
  importExercises: (exercises: Exercise[]) => void;
  updateExercise: (id: string, updates: Partial<Exercise>) => void;
  deleteExercise: (id: string) => void;
  resetExerciseLibrary: () => void;
  getExerciseById: (id: string) => Exercise | undefined;
}

export const useExerciseLibraryStore = create<ExerciseLibraryStore>()(
  persist(
    (set, get) => ({
      exercises: seedExerciseLibrary,
      seedVersion: EXERCISE_LIBRARY_SEED_VERSION,
      addExercise: (exercise) =>
        set((state) => ({
          exercises: [...state.exercises, exercise],
        })),
      importExercises: (importedExercises) =>
        set((state) => {
          const importedById = new Map(
            importedExercises.map((exercise) => [exercise.id, exercise]),
          );
          const existingIds = new Set(state.exercises.map(({ id }) => id));
          return {
            exercises: [
              ...state.exercises.map(
                (exercise) => importedById.get(exercise.id) ?? exercise,
              ),
              ...importedExercises.filter(
                (exercise) => !existingIds.has(exercise.id),
              ),
            ],
          };
        }),
      updateExercise: (id, updates) =>
        set((state) => ({
          exercises: state.exercises.map((exercise) =>
            exercise.id === id ? { ...exercise, ...updates, id } : exercise,
          ),
        })),
      deleteExercise: (id) =>
        set((state) => ({
          exercises: state.exercises.filter((exercise) => exercise.id !== id),
        })),
      resetExerciseLibrary: () => {
        localStorage.removeItem("fitness.exerciseLibrary");
        set({
          exercises: seedExerciseLibrary,
          seedVersion: EXERCISE_LIBRARY_SEED_VERSION,
        });
      },
      getExerciseById: (id) =>
        get().exercises.find((exercise) => exercise.id === id),
    }),
    {
      name: "fitness.exerciseLibrary",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        exercises: state.exercises,
        seedVersion: state.seedVersion,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as
          | Partial<Pick<ExerciseLibraryStore, "exercises" | "seedVersion">>
          | undefined;
        const exercises = Array.isArray(persisted?.exercises)
          ? persisted.exercises
          : currentState.exercises;
        const seedVersion = persisted?.seedVersion ?? 0;
        return {
          ...currentState,
          ...persisted,
          exercises:
            seedVersion < EXERCISE_LIBRARY_SEED_VERSION
              ? seedExerciseLibrary
              : exercises,
          seedVersion: EXERCISE_LIBRARY_SEED_VERSION,
        };
      },
    },
  ),
);
