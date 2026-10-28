import type { WorkoutModule } from "../types";

export function getEstimatedDurationMinutes(
  module: Pick<WorkoutModule, "exercises" | "estimatedDurationMinutes">,
  fallbackMinutes?: number,
): number {
  if (
    module.estimatedDurationMinutes !== undefined &&
    Number.isFinite(module.estimatedDurationMinutes) &&
    module.estimatedDurationMinutes > 0
  ) {
    return module.estimatedDurationMinutes;
  }

  if (
    fallbackMinutes !== undefined &&
    Number.isFinite(fallbackMinutes) &&
    fallbackMinutes > 0
  ) {
    return fallbackMinutes;
  }

  const workSeconds = module.exercises.reduce(
    (total, exercise) => total + exercise.plannedSets * 45,
    0,
  );
  const restSeconds = module.exercises.reduce(
    (total, exercise) =>
      total + Math.max(0, exercise.plannedSets - 1) * exercise.restTime,
    0,
  );

  return Math.max(1, Math.ceil((workSeconds + restSeconds) / 60));
}
