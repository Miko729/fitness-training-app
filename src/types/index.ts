export interface WorkoutModule {
  id: string;
  name: string;
  type: "strength" | "functional" | "cardio" | "rest";
  goal: string;
  description?: string;
  category?: "strength" | "functional" | "cardio" | "rest";
  estimatedDurationMinutes?: number;
  estimatedCaloriesPerMinute?: number;
  exercises: Exercise[];
  weeklyRotations?: ExerciseRotation[];
}

export interface ExerciseRotation {
  week: 1 | 2 | 3 | 4;
  exercises: Exercise[];
}

export interface Exercise {
  id: string;
  name: string;
  targetBodyPart: string;
  purpose: string;
  plannedSets: number;
  plannedReps: string;
  rpe: number;
  restTime: number;
  notes: string;
  enDirName?: string;
  alternativeExercises?: string[];
  referenceVideoUrl?: string;
  gifUrl?: string;
  imageUrl?: string;
  sourceUrl?: string;
  license?: string;
  description?: string;
  targetSets?: number;
  targetReps?: number;
  targetWeight?: number;
  targetWeightMultiplier?: number;
  restSeconds?: number;
}

export type ScheduleAdjustType =
  | "today"
  | "tomorrow"
  | "deferred"
  | "swap"
  | "replace";
export type ScheduleDay = "today" | "tomorrow";

export interface DailyScheduleItem {
  id: string;
  date: string;
  moduleId: string;
  name?: string;
  estimatedDurationMinutes?: number;
  exerciseSelections?: DailyScheduleExercise[];
  isFixed?: boolean;
  isCustom?: boolean;
  functionalSlot?: 1 | 2;
  trainingLoadProfile?: "low-fatigue" | "pre-archery";
  status?: "pending" | "skipped" | "completed";
  timeSlot?: string;
  originalModuleId?: string;
  adjustType?: ScheduleAdjustType;
  adjustReason?: string;
  updatedAt?: string;
}

export interface DailyScheduleExercise {
  name: string;
  exerciseName: string;
}

export type Weekday =
  | "周一"
  | "周二"
  | "周三"
  | "周四"
  | "周五"
  | "周六"
  | "周日";

export interface WeeklyTemplate {
  weekday: Weekday;
  timeSlot: string;
  moduleId: string;
  isFixed: boolean;
  canAdjust: boolean;
  notes: string;
  estimatedDurationMinutes?: number;
}

export interface TrainingSetLog {
  weight?: number;
  reps?: number;
  rpe?: number;
  actualExerciseName?: string;
  note?: string;
  completed?: boolean;
}

export interface TrainingExerciseLog {
  exerciseId: string;
  sets: TrainingSetLog[];
  note?: string;
}

export interface TrainingLog {
  id: string;
  date: string;
  moduleId: string;
  scheduleItemId?: string;
  exercises: TrainingExerciseLog[];
  actualCalories?: number;
  durationMinutes?: number;
  note?: string;
  startedAt?: string;
  completedAt?: string;
}
