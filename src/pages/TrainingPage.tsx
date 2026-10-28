import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import BottomNavigation from "../components/BottomNavigation";
import ExerciseCard, {
  type ExerciseSetDraft,
} from "../components/ExerciseCard";
import {
  getFunctionalModuleForWeek,
  getWeekInfoForDate,
} from "../data/monthlyCycleTemplate";
import { weeklyTemplate } from "../data/weeklyTemplate";
import { useLogStore } from "../store/logStore";
import { useExerciseLibraryStore } from "../store/exerciseLibraryStore";
import { useModuleStore } from "../store/moduleStore";
import { useScheduleStore } from "../store/scheduleStore";
import type { TrainingLog, WorkoutModule } from "../types";
import { getEstimatedDurationMinutes } from "../utils/trainingDuration";

export interface TrainingPageProps {
  moduleId?: string;
  onBack?: () => void;
}

type ExerciseDrafts = Record<string, ExerciseSetDraft[]>;

function getModuleIdFromLocation(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return new URLSearchParams(window.location.search).get("moduleId") ?? undefined;
}

function createInitialDrafts(
  module: WorkoutModule | undefined,
  log?: TrainingLog,
  historicalLogs: TrainingLog[] = [],
  trainingDate = dayjs().format("YYYY-MM-DD"),
): ExerciseDrafts {
  if (!module) return {};
  const loggedExercises = log?.exercises ?? [];
  const priorLogs = historicalLogs
    .filter(
      (item) =>
        item.date < trainingDate &&
        (!log?.scheduleItemId || item.scheduleItemId !== log.scheduleItemId),
    )
    .sort((left, right) => right.date.localeCompare(left.date));

  return Object.fromEntries(
    module.exercises.map((exercise) => [
      exercise.id,
      Array.from({ length: exercise.plannedSets }, (_, index) => {
        const loggedSet = loggedExercises.find(
          (loggedExercise) => loggedExercise.exerciseId === exercise.id,
        )?.sets[index];
        const previousWeight = priorLogs
          .flatMap((trainingLog) =>
            trainingLog.exercises
              .filter((loggedExercise) => loggedExercise.exerciseId === exercise.id)
              .flatMap((loggedExercise) => loggedExercise.sets),
          )
          .find(
            (set) => set.completed && set.weight !== undefined,
          )?.weight;
        const suggestedWeight =
          previousWeight === undefined
            ? exercise.targetWeight
            : Math.round(
                previousWeight * (exercise.targetWeightMultiplier ?? 1) * 100,
              ) / 100;
        return {
          weight:
            loggedSet?.weight !== undefined
              ? String(loggedSet.weight)
              : suggestedWeight === undefined
                ? ""
                : String(suggestedWeight),
          reps: loggedSet?.reps === undefined ? "" : String(loggedSet.reps),
          rpe: loggedSet?.rpe === undefined ? "" : String(loggedSet.rpe),
          actualExerciseName: loggedSet?.actualExerciseName,
          completed: loggedSet?.completed === true,
        };
      }),
    ]),
  );
}

function getIntensity(
  exercises: WorkoutModule["exercises"],
): string {
  if (exercises.length === 0) return "休息";

  const min = Math.min(...exercises.map((exercise) => exercise.rpe));
  const max = Math.max(...exercises.map((exercise) => exercise.rpe));
  return min === max ? `RPE ${min}` : `RPE ${min}–${max}`;
}

export default function TrainingPage({
  moduleId: moduleIdProp,
  onBack,
}: TrainingPageProps) {
  const workoutModules = useModuleStore((state) => state.modules);
  const libraryExercises = useExerciseLibraryStore((state) => state.exercises);
  const [searchParams] = useSearchParams();
  const scheduleItemId = searchParams.get("scheduleItemId") ?? undefined;
  const moduleId =
    moduleIdProp ?? searchParams.get("moduleId") ?? getModuleIdFromLocation();
  const configuredModule = workoutModules.find((item) => item.id === moduleId);
  const todaySchedule = useScheduleStore((state) => state.todaySchedule);
  const tomorrowSchedule = useScheduleStore((state) => state.tomorrowSchedule);
  const cycleStartDate = useScheduleStore((state) => state.cycleStartDate);
  const scheduleItem = [...todaySchedule, ...tomorrowSchedule].find(
    (item) => item.id === scheduleItemId,
  );
  const logs = useLogStore((state) => state.logs);
  const trainingDate =
    scheduleItem?.date ?? dayjs().format("YYYY-MM-DD");
  const cycleWeek = getWeekInfoForDate(
    cycleStartDate,
    trainingDate,
  );
  const logsRef = useRef(logs);
  logsRef.current = logs;
  const module = useMemo<WorkoutModule | undefined>(() => {
    if (scheduleItem?.exerciseSelections?.length) {
      const exerciseCatalog = [
        ...libraryExercises,
        ...workoutModules.flatMap((workoutModule) => [
          ...workoutModule.exercises,
          ...(workoutModule.weeklyRotations?.flatMap(
            (rotation) => rotation.exercises,
          ) ?? []),
        ]),
      ];
      const exercises = scheduleItem.exerciseSelections.map((selection) => {
        const exercise = exerciseCatalog.find(
          (item) => item.name === selection.exerciseName,
        );
        if (!exercise) {
          throw new Error(
            `动作库中找不到计划动作“${selection.exerciseName}”。`,
          );
        }
        const lowFatigue =
          scheduleItem.trainingLoadProfile === "low-fatigue" ||
          scheduleItem.trainingLoadProfile === "pre-archery";
        const cardio = configuredModule?.category === "cardio";
        return {
          ...exercise,
          name: selection.name,
          ...(cardio && scheduleItem.estimatedDurationMinutes !== undefined
            ? {
                plannedReps: `${scheduleItem.estimatedDurationMinutes} 分钟`,
              }
            : {}),
          plannedSets: cardio
            ? exercise.plannedSets
            : lowFatigue
              ? 2
              : cycleWeek.plannedSets,
          rpe: cardio
            ? exercise.rpe
            : lowFatigue
              ? Math.min(exercise.rpe, 6)
              : exercise.rpe,
          ...(!cardio
            ? {
                targetWeightMultiplier: lowFatigue
                  ? Math.min(cycleWeek.weightMultiplier, 0.75)
                  : cycleWeek.weightMultiplier,
              }
            : {}),
        };
      });
      return configuredModule
        ? {
            ...configuredModule,
            name: scheduleItem.name ?? configuredModule.name,
            ...(scheduleItem.estimatedDurationMinutes !== undefined
              ? {
                  estimatedDurationMinutes:
                    scheduleItem.estimatedDurationMinutes,
                }
              : {}),
            exercises,
          }
        : undefined;
    }

    if (scheduleItem?.functionalSlot) {
      return getFunctionalModuleForWeek(
        cycleWeek.week,
        scheduleItem.functionalSlot,
      );
    }

    return (
      configuredModule ??
      (weeklyTemplate.find((item) => item.moduleId === moduleId)
        ? {
            id: moduleId ?? "unknown",
            name:
              weeklyTemplate.find((item) => item.moduleId === moduleId)?.notes ??
              "训练安排",
            type: "functional" as const,
            goal:
              weeklyTemplate.find((item) => item.moduleId === moduleId)?.notes ??
              "按计划完成训练。",
            category: "functional" as const,
            description:
              weeklyTemplate.find((item) => item.moduleId === moduleId)?.notes,
            estimatedDurationMinutes: weeklyTemplate.find(
              (item) => item.moduleId === moduleId,
            )?.estimatedDurationMinutes,
            exercises: [],
          }
        : undefined)
    );
  }, [
    configuredModule,
    cycleWeek.plannedSets,
    cycleWeek.weightMultiplier,
    cycleWeek.week,
    libraryExercises,
    moduleId,
    scheduleItem?.exerciseSelections,
    scheduleItem?.functionalSlot,
    scheduleItem?.name,
    workoutModules,
  ]);
  const templateEntry = weeklyTemplate.find(
    (item) =>
      item.moduleId === moduleId ||
      (scheduleItem?.functionalSlot !== undefined &&
        item.moduleId === `functional-slot-${scheduleItem.functionalSlot}`),
  );
  const fallbackModule: WorkoutModule | undefined =
    !module && templateEntry
      ? {
          id: templateEntry.moduleId,
          name: templateEntry.notes,
          type: "functional",
          category: "functional",
          goal: templateEntry.notes,
          description: templateEntry.notes,
          estimatedDurationMinutes: templateEntry.estimatedDurationMinutes,
          exercises: [],
        }
      : undefined;
  const activeModule = module ?? fallbackModule;
  const sessionId = useMemo(
    () =>
      scheduleItemId ??
      `${moduleId ?? "unknown"}-${dayjs().format("YYYY-MM-DD")}-${Date.now()}`,
    [moduleId, scheduleItemId],
  );
  const addSetLog = useLogStore((state) => state.addSetLog);
  const finishTraining = useLogStore((state) => state.finishTraining);
  const updateSessionCalories = useLogStore(
    (state) => state.updateSessionCalories,
  );
  const completeSchedule = useScheduleStore(
    (state) => state.completeSchedule,
  );
  const getLogByScheduleItemId = useLogStore(
    (state) => state.getLogByScheduleItemId,
  );
  const draftRef = useRef<ExerciseDrafts>(
    createInitialDrafts(activeModule, undefined, logsRef.current, trainingDate),
  );
  const [drafts, setDrafts] = useState<ExerciseDrafts>(draftRef.current);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [calorieModalOpen, setCalorieModalOpen] = useState(false);
  const [actualCaloriesInput, setActualCaloriesInput] = useState("");
  const [durationInput, setDurationInput] = useState("");

  useEffect(() => {
    const existingLog = getLogByScheduleItemId(sessionId);
    const initialDrafts = createInitialDrafts(
      activeModule,
      existingLog,
      logsRef.current,
      trainingDate,
    );
    draftRef.current = initialDrafts;
    setDrafts(initialDrafts);
    setSaveError(null);
    setSaved(Boolean(existingLog));
    setIsFinished(Boolean(existingLog?.completedAt));
    setActiveExerciseIndex(0);
    setActualCaloriesInput(
      existingLog?.actualCalories === undefined
        ? ""
        : String(existingLog.actualCalories),
    );
    setDurationInput(
      existingLog?.durationMinutes === undefined
        ? String(
            getEstimatedDurationMinutes(
              activeModule ?? {
                exercises: [],
              },
              templateEntry?.estimatedDurationMinutes,
            ),
          )
        : String(existingLog.durationMinutes),
    );
  }, [
    activeModule,
    getLogByScheduleItemId,
    moduleId,
    sessionId,
    templateEntry?.estimatedDurationMinutes,
    trainingDate,
  ]);

  if (!moduleId) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 pb-24 pt-8 text-white sm:px-6 sm:pt-12">
        <div className="mx-auto max-w-2xl">
          <header className="mb-8">
            <p className="text-sm font-medium tracking-wide text-emerald-300">
              选择训练
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">训练模块</h1>
          </header>
          <div className="space-y-3">
            {workoutModules.map((workoutModule) => (
              <Link
                key={workoutModule.id}
                to={`/training?moduleId=${encodeURIComponent(workoutModule.id)}`}
                className="block min-h-12 rounded-2xl border border-slate-700 bg-slate-900 p-5 transition hover:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              >
                <span className="font-semibold text-white">
                  {workoutModule.name}
                </span>
                {workoutModule.description && (
                  <span className="mt-1 block text-sm text-slate-400">
                    {workoutModule.description}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
        <div className="fixed inset-x-0 bottom-0 border-t border-slate-800 bg-slate-950/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
          <BottomNavigation activeTab="training" />
        </div>
      </main>
    );
  }

  if (!activeModule) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h1 className="text-xl font-bold">找不到训练模块</h1>
          <p className="mt-2 text-slate-400">
            请检查 moduleId 是否有效，再打开训练详情页。
          </p>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mt-5 min-h-12 rounded-xl bg-slate-700 px-5 py-3 font-semibold hover:bg-slate-600"
            >
              返回
            </button>
          )}
        </div>
      </main>
    );
  }

  const trainingModule = activeModule;
  const completedSetCount = Object.values(drafts).reduce(
    (total, sets) => total + sets.filter((set) => set.completed).length,
    0,
  );
  const totalSetCount = trainingModule.exercises.reduce(
    (total, exercise) => total + exercise.plannedSets,
    0,
  );
  const duration = getEstimatedDurationMinutes(
    trainingModule,
    templateEntry?.estimatedDurationMinutes,
  );
  const caloriesPerMinute =
    trainingModule.estimatedCaloriesPerMinute ??
    (trainingModule.category === "cardio"
      ? 10
      : trainingModule.category === "strength" || trainingModule.category === "functional"
        ? 6
        : 0);
  const estimatedCalories = Math.round(duration * caloriesPerMinute);
  const activeExercise = trainingModule.exercises[activeExerciseIndex];
  const activeExerciseSets = activeExercise
    ? drafts[activeExercise.id] ?? []
    : [];
  const activeSetIndex = activeExerciseSets.findIndex((set) => !set.completed);
  const selectedExerciseName =
    activeExerciseSets.find((set) => !set.completed)?.actualExerciseName ??
    [...activeExerciseSets]
      .reverse()
      .find((set) => set.completed && set.actualExerciseName)
      ?.actualExerciseName ??
    activeExercise?.name;

  const updateDrafts = (nextDrafts: ExerciseDrafts) => {
    draftRef.current = nextDrafts;
    setDrafts(nextDrafts);
  };

  const persistTrainingLog = () => {
    const calories = Number(actualCaloriesInput);
    const actualDuration = Number(durationInput);
    if (
      actualCaloriesInput.trim() === "" ||
      !Number.isFinite(calories) ||
      calories < 0
    ) {
      setSaveError("请输入有效的实际消耗卡路里（非负数）。");
      return;
    }
    if (
      durationInput.trim() === "" ||
      !Number.isFinite(actualDuration) ||
      actualDuration <= 0
    ) {
      setSaveError("请输入有效的实际训练时长（大于 0 分钟）。");
      return;
    }

    try {
      finishTraining(sessionId, trainingModule.id);
      updateSessionCalories(sessionId, calories, actualDuration);
      if (scheduleItemId) completeSchedule(scheduleItemId);
      setSaved(true);
      setSaveError(null);
      setIsFinished(true);
      setCalorieModalOpen(false);
    } catch (error) {
      setSaved(false);
      setSaveError(
        error instanceof Error
          ? `保存失败：${error.message}`
          : "保存训练记录失败，请检查浏览器本地存储设置。",
      );
    }
  };

  const openCompletionModal = () => {
    const existingLog = getLogByScheduleItemId(sessionId);
    setActualCaloriesInput(
      existingLog?.actualCalories === undefined
        ? ""
        : String(existingLog.actualCalories),
    );
    setDurationInput(
      existingLog?.durationMinutes === undefined
        ? String(duration)
        : String(existingLog.durationMinutes),
    );
    setSaveError(null);
    setCalorieModalOpen(true);
  };

  const handleSetChange = (
    exerciseId: string,
    setIndex: number,
    value: ExerciseSetDraft,
  ) => {
    const nextDrafts = {
      ...draftRef.current,
      [exerciseId]: draftRef.current[exerciseId].map((set, index) =>
        index === setIndex ? value : set,
      ),
    };
    updateDrafts(nextDrafts);
  };

  const handleAlternativeChange = (
    exerciseId: string,
    exerciseName: string,
  ) => {
    const originalExercise = trainingModule.exercises.find(
      (exercise) => exercise.id === exerciseId,
    );
    if (!originalExercise) return;

    const nextDrafts = {
      ...draftRef.current,
      [exerciseId]: draftRef.current[exerciseId].map((set) =>
        set.completed
          ? set
          : {
              ...set,
              actualExerciseName:
                exerciseName === originalExercise.name
                  ? undefined
                  : exerciseName,
            },
      ),
    };
    updateDrafts(nextDrafts);
  };

  const handleSetComplete = () => {
    if (!activeExercise || activeSetIndex < 0 || isFinished) return;
    const currentSet = activeExerciseSets[activeSetIndex];
    const weight = currentSet.weight.trim();
    const reps = currentSet.reps.trim();
    const rpe = currentSet.rpe.trim();
    if (
      (weight !== "" &&
        (!Number.isFinite(Number(weight)) || Number(weight) < 0)) ||
      (reps !== "" &&
        (!Number.isInteger(Number(reps)) || Number(reps) < 1)) ||
      (rpe !== "" &&
        (!Number.isFinite(Number(rpe)) ||
          Number(rpe) < 1 ||
          Number(rpe) > 10))
    ) {
      setSaveError("请检查选填数据：重量需为非负数、次数需为正整数、RPE 需为 1–10。");
      return;
    }

    try {
      addSetLog({
        scheduleItemId: sessionId,
        moduleId: trainingModule.id,
        exerciseId: activeExercise.id,
        setIndex: activeSetIndex,
        ...(weight !== "" ? { weight: Number(weight) } : {}),
        ...(reps !== "" ? { reps: Number(reps) } : {}),
        ...(rpe !== "" ? { rpe: Number(rpe) } : {}),
        ...(currentSet.actualExerciseName
          ? { actualExerciseName: currentSet.actualExerciseName }
          : {}),
      });
      const nextDrafts = {
        ...draftRef.current,
        [activeExercise.id]: activeExerciseSets.map((set, index) =>
          index === activeSetIndex ? { ...set, completed: true } : set,
        ),
      };
      updateDrafts(nextDrafts);
      setSaved(true);
      setSaveError(null);
    } catch (error) {
      setSaved(false);
      setSaveError(
        error instanceof Error
          ? `保存失败：${error.message}`
          : "保存打卡记录失败，请检查浏览器本地存储设置。",
      );
    }
  };

  const handleNextExercise = () => {
    if (activeExerciseIndex < trainingModule.exercises.length - 1) {
      setActiveExerciseIndex((index) => index + 1);
    }
  };

  const handlePreviousExercise = () => {
    if (activeExerciseIndex > 0) {
      setActiveExerciseIndex((index) => index - 1);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-64 pt-6 text-white sm:px-6 sm:pt-10">
      <div className="mx-auto max-w-2xl">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-5 min-h-11 rounded-xl px-3 text-sm font-semibold text-slate-300 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            ← 返回
          </button>
        )}

        <header className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
          <p className="text-sm font-medium text-emerald-300">训练详情</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            {trainingModule.name}
          </h1>
          <p className="mt-3 leading-relaxed text-slate-300">
            {trainingModule.description ?? "按计划完成本次训练。"}
          </p>
          {scheduleItem?.functionalSlot && (
            <p className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-100">
              月度循环：第 {cycleWeek.week} 周 · {cycleWeek.name} · 每个动作{" "}
              {cycleWeek.plannedSets} 组
              {cycleWeek.weightMultiplier !== 1 &&
                ` · 建议重量 ×${cycleWeek.weightMultiplier}`}
              <span className="mt-1 block text-emerald-100/80">
                {cycleWeek.prompt}
              </span>
            </p>
          )}
          <dl className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-950 p-3">
              <dt className="text-xs text-slate-500">预计时间</dt>
              <dd className="mt-1 font-semibold text-white">约 {duration} 分钟</dd>
            </div>
            <div className="rounded-xl bg-slate-950 p-3">
              <dt className="text-xs text-slate-500">强度</dt>
              <dd className="mt-1 font-semibold text-white">
                {getIntensity(trainingModule.exercises)}
              </dd>
            </div>
          </dl>
        </header>

        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">当前动作</h2>
            <p className="mt-1 text-sm text-slate-400">
              {activeExercise
                ? `动作 ${activeExerciseIndex + 1} / ${trainingModule.exercises.length}`
                : "所有动作已完成"}
            </p>
          </div>
          <span className="text-sm text-slate-400">
            {completedSetCount} / {totalSetCount} 组完成
          </span>
        </div>

        {activeExercise ? (
          <div className="space-y-4">
            <ExerciseCard
              key={activeExercise.id}
              exercise={activeExercise}
              sets={activeExerciseSets}
              activeSetIndex={activeSetIndex}
              selectedExerciseName={selectedExerciseName}
              disabled={isFinished}
              onSetChange={(setIndex, value) =>
                handleSetChange(activeExercise.id, setIndex, value)
              }
              onAlternativeChange={(exerciseName) =>
                handleAlternativeChange(activeExercise.id, exerciseName)
              }
            />
          </div>
        ) : trainingModule.exercises.length === 0 ? (
          <p className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-slate-400">
            此模块没有安排动作。
          </p>
        ) : (
          <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 text-emerald-200">
            本次训练的所有组数均已完成。
          </p>
        )}

        {saveError && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200"
          >
            {saveError}
          </p>
        )}
        {saved && !saveError && (
          <p role="status" className="mt-4 text-center text-sm text-emerald-300">
            训练记录已保存到本地
          </p>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-800 bg-slate-950/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto mb-2 grid w-full max-w-2xl grid-cols-2 gap-2">
          <button
            type="button"
            disabled={isFinished || !activeExercise || activeSetIndex < 0}
            onClick={handleSetComplete}
            className="col-span-2 min-h-12 rounded-xl bg-emerald-400 px-4 py-3 text-base font-bold text-slate-950 transition hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            {activeSetIndex < 0 && activeExercise
              ? "当前动作已完成"
              : "完成本组"}
          </button>
          <button
            type="button"
            disabled={
              isFinished ||
              (completedSetCount === 0 && trainingModule.exercises.length > 0)
            }
            onClick={openCompletionModal}
            className="min-h-12 rounded-xl border border-slate-600 px-3 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isFinished ? "训练已保存" : "保存并完成"}
          </button>
          <button
            type="button"
            disabled={isFinished || activeExerciseIndex <= 0}
            onClick={handlePreviousExercise}
            className="min-h-12 rounded-xl border border-slate-600 px-3 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            上一个动作
          </button>
          <button
            type="button"
            disabled={
              isFinished ||
              activeExerciseIndex >= trainingModule.exercises.length - 1
            }
            onClick={handleNextExercise}
            className="min-h-12 rounded-xl border border-slate-600 px-3 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            下一动作
          </button>
          {activeExerciseIndex < trainingModule.exercises.length - 1 &&
            activeSetIndex >= 0 && (
              <p className="col-span-2 text-center text-xs text-slate-500">
                可提前切换动作，当前未完成组会保留
              </p>
            )}
        </div>
        <BottomNavigation
          activeTab="training"
          trainingHref={`/training?moduleId=${encodeURIComponent(trainingModule.id)}&scheduleItemId=${encodeURIComponent(sessionId)}`}
        />
      </div>
      {calorieModalOpen && (
        <div
          className="fixed inset-0 z-40 flex items-end bg-black/70 sm:items-center sm:justify-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setCalorieModalOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="training-summary-title"
            className="w-full rounded-t-3xl border border-slate-700 bg-slate-900 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:max-w-lg sm:rounded-2xl sm:pb-5"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-emerald-300">训练总结</p>
                <h2
                  id="training-summary-title"
                  className="mt-1 text-xl font-bold"
                >
                  完成本次训练
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setCalorieModalOpen(false)}
                aria-label="关闭"
                className="flex min-h-12 min-w-12 items-center justify-center rounded-xl text-2xl text-slate-400 hover:bg-slate-800"
              >
                ×
              </button>
            </div>

            <p className="mb-5 rounded-xl border border-orange-400/20 bg-orange-400/10 p-4 text-sm text-orange-100">
              系统预估消耗：
              <span className="font-bold">{estimatedCalories} kcal</span>
              （基于 {duration} 分钟）
            </p>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-300">
                ⌚️ 运动手表实际消耗 (kcal)
                <input
                  type="number"
                  min="0"
                  step="1"
                  inputMode="decimal"
                  value={actualCaloriesInput}
                  onChange={(event) =>
                    setActualCaloriesInput(event.target.value)
                  }
                  placeholder={`填写手表数据（预估 ${estimatedCalories}）`}
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-base text-white placeholder:text-slate-500 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                />
              </label>
              <label className="block text-sm font-medium text-slate-300">
                ⏱️ 实际训练时长 (分钟)
                <input
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={durationInput}
                  onChange={(event) => setDurationInput(event.target.value)}
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-base text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                />
              </label>
            </div>
            {saveError && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200"
              >
                {saveError}
              </p>
            )}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCalorieModalOpen(false)}
                className="min-h-12 rounded-xl border border-slate-600 px-4 font-semibold text-slate-200 hover:bg-slate-800"
              >
                继续训练
              </button>
              <button
                type="button"
                onClick={persistTrainingLog}
                className="min-h-12 rounded-xl bg-emerald-400 px-4 font-bold text-slate-950 hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                保存并完成
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
