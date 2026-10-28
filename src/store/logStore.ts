import dayjs from "dayjs";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  TrainingExerciseLog,
  TrainingLog,
  TrainingSetLog,
} from "../types";

const STORAGE_KEY = "training-log-store";

export interface AddSetLogInput {
  scheduleItemId: string;
  moduleId: string;
  exerciseId: string;
  setIndex: number;
  weight?: number;
  reps?: number;
  rpe?: number;
  actualExerciseName?: string;
  note?: string;
  date?: string;
}

interface LogStore {
  logs: TrainingLog[];
  addSetLog: (input: AddSetLogInput) => void;
  updateSessionCalories: (
    scheduleItemId: string,
    calories: number,
    duration: number,
  ) => void;
  finishTraining: (
    scheduleItemId: string,
    moduleId: string,
    date?: string,
  ) => void;
  cancelSetCompletion: (
    scheduleItemId: string,
    exerciseId: string,
    setIndex: number,
  ) => void;
  getLogByScheduleItemId: (
    scheduleItemId: string,
  ) => TrainingLog | undefined;
  getLogsByDate: (date: string) => TrainingLog[];
}

function updateExercise(
  exercises: TrainingExerciseLog[],
  exerciseId: string,
  updateSets: (sets: TrainingSetLog[]) => TrainingSetLog[],
): TrainingExerciseLog[] {
  const existingExercise = exercises.find(
    (exercise) => exercise.exerciseId === exerciseId,
  );

  if (!existingExercise) {
    return [...exercises, { exerciseId, sets: updateSets([]) }];
  }

  return exercises.map((exercise) =>
    exercise.exerciseId === exerciseId
      ? { ...exercise, sets: updateSets(exercise.sets) }
      : exercise,
  );
}

function validateSetInput(input: AddSetLogInput): void {
  if (!input.scheduleItemId.trim()) {
    throw new Error("scheduleItemId must not be empty.");
  }
  if (!input.moduleId.trim() || !input.exerciseId.trim()) {
    throw new Error("moduleId and exerciseId must not be empty.");
  }
  if (!Number.isInteger(input.setIndex) || input.setIndex < 0) {
    throw new Error("setIndex must be a non-negative integer.");
  }
  if (
    input.weight !== undefined &&
    (!Number.isFinite(input.weight) || input.weight < 0)
  ) {
    throw new Error("weight must be a non-negative number.");
  }
  if (
    input.reps !== undefined &&
    (!Number.isInteger(input.reps) || input.reps < 1)
  ) {
    throw new Error("reps must be a positive integer.");
  }
  if (
    input.rpe !== undefined &&
    (!Number.isFinite(input.rpe) || input.rpe < 1 || input.rpe > 10)
  ) {
    throw new Error("rpe must be between 1 and 10.");
  }
}

function validateSessionMetrics(
  scheduleItemId: string,
  calories: number,
  duration: number,
): void {
  if (!scheduleItemId.trim()) {
    throw new Error("scheduleItemId must not be empty.");
  }
  if (!Number.isFinite(calories) || calories < 0) {
    throw new Error("calories must be a non-negative number.");
  }
  if (!Number.isFinite(duration) || duration < 0) {
    throw new Error("duration must be a non-negative number.");
  }
}

export const useLogStore = create<LogStore>()(
  persist(
    (set, get) => ({
      logs: [],

      updateSessionCalories: (scheduleItemId, calories, duration) => {
        validateSessionMetrics(scheduleItemId, calories, duration);
        const existingLog = get().logs.find(
          (log) => log.scheduleItemId === scheduleItemId,
        );
        if (!existingLog) {
          throw new Error(
            `Training log for schedule item "${scheduleItemId}" was not found.`,
          );
        }

        set((state) => ({
          logs: state.logs.map((log) =>
            log.scheduleItemId === scheduleItemId
              ? {
                  ...log,
                  actualCalories: calories,
                  durationMinutes: duration,
                }
              : log,
          ),
        }));
      },

      addSetLog: (input) => {
        validateSetInput(input);

        const date = input.date ?? dayjs().format("YYYY-MM-DD");
        set((state) => {
          const existingLog = state.logs.find(
            (log) => log.scheduleItemId === input.scheduleItemId,
          );
          const previousSets =
            existingLog?.exercises.find(
              (exercise) => exercise.exerciseId === input.exerciseId,
            )?.sets ?? [];
          if (input.setIndex > previousSets.length) {
            throw new Error(
              "Complete set logs in order without skipping a set.",
            );
          }
          const setLog: TrainingSetLog = {
            weight: input.weight,
            reps: input.reps,
            rpe: input.rpe,
            actualExerciseName: input.actualExerciseName,
            note: input.note,
            completed: true,
          };
          const nextSets = [...previousSets];
          nextSets[input.setIndex] = setLog;

          const exercises = updateExercise(
            existingLog?.exercises ?? [],
            input.exerciseId,
            () => nextSets,
          );
          const now = dayjs().toISOString();
          const nextLog: TrainingLog = {
            id: existingLog?.id ?? input.scheduleItemId,
            scheduleItemId: input.scheduleItemId,
            date,
            moduleId: input.moduleId,
            exercises,
            startedAt: existingLog?.startedAt ?? now,
            completedAt: existingLog?.completedAt,
            actualCalories: existingLog?.actualCalories,
            durationMinutes: existingLog?.durationMinutes,
            note: existingLog?.note,
          };

          return {
            logs: existingLog
              ? state.logs.map((log) =>
                  log.scheduleItemId === input.scheduleItemId ? nextLog : log,
                )
              : [...state.logs, nextLog],
          };
        });
      },

      finishTraining: (
        scheduleItemId,
        moduleId,
        date = dayjs().format("YYYY-MM-DD"),
      ) => {
        if (!scheduleItemId.trim() || !moduleId.trim()) {
          throw new Error("scheduleItemId and moduleId must not be empty.");
        }

        const existingLog = get().logs.find(
          (log) => log.scheduleItemId === scheduleItemId,
        );
        const now = dayjs().toISOString();
        const completedLog: TrainingLog = {
          id: existingLog?.id ?? scheduleItemId,
          scheduleItemId,
          moduleId,
          date,
          exercises: existingLog?.exercises ?? [],
          startedAt: existingLog?.startedAt ?? now,
          completedAt: now,
          actualCalories: existingLog?.actualCalories,
          durationMinutes: existingLog?.durationMinutes,
          note: existingLog?.note,
        };

        set((state) => ({
          logs: existingLog
            ? state.logs.map((log) =>
                log.scheduleItemId === scheduleItemId ? completedLog : log,
              )
            : [...state.logs, completedLog],
        }));
      },

      cancelSetCompletion: (scheduleItemId, exerciseId, setIndex) => {
        if (!Number.isInteger(setIndex) || setIndex < 0) {
          throw new Error("setIndex must be a non-negative integer.");
        }

        set((state) => ({
          logs: state.logs.map((log) => {
            if (log.scheduleItemId !== scheduleItemId) return log;

            return {
              ...log,
              completedAt: undefined,
              exercises: log.exercises.map((exercise) => {
                if (exercise.exerciseId !== exerciseId) return exercise;

                return {
                  ...exercise,
                  sets: exercise.sets.map((setLog, index) =>
                    index === setIndex
                      ? { ...setLog, completed: false }
                      : setLog,
                  ),
                };
              }),
            };
          }),
        }));
      },

      getLogByScheduleItemId: (scheduleItemId) =>
        get().logs.find((log) => log.scheduleItemId === scheduleItemId),

      getLogsByDate: (date) =>
        get().logs.filter((log) => log.date === date),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ logs: state.logs }),
    },
  ),
);
