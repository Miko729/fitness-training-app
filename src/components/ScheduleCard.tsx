import { useState } from "react";
import { Link } from "react-router-dom";
import { weeklyTemplate } from "../data/weeklyTemplate";
import { useModuleStore } from "../store/moduleStore";
import type { DailyScheduleItem, WorkoutModule } from "../types";
import { getEstimatedDurationMinutes } from "../utils/trainingDuration";

const fallbackNames: Record<string, string> = {
  yoga: "瑜伽",
  "climbing-1": "攀岩 1",
  "climbing-2": "攀岩 2",
  "ball-or-functional": "球类或功能性",
  "recurve-archery": "反曲弓射箭",
  "weekend-elective": "周末选修",
};

export interface ScheduleCardProps {
  item: DailyScheduleItem;
  onAdjust: () => void;
  onPostpone?: () => void;
}

function findModule(
  modules: WorkoutModule[],
  moduleId: string,
): WorkoutModule | undefined {
  return modules.find((module) => module.id === moduleId);
}

function getModuleName(modules: WorkoutModule[], moduleId: string): string {
  return (
    findModule(modules, moduleId)?.name ??
    fallbackNames[moduleId] ??
    weeklyTemplate.find((entry) => entry.moduleId === moduleId)?.notes ??
    "训练安排"
  );
}

function getTarget(module: WorkoutModule | undefined): string {
  if (!module) return "按计划完成今日活动";
  if (module.exercises.length === 0) return module.description ?? "休息与恢复";
  return [...new Set(module.exercises.map((exercise) => exercise.purpose))]
    .slice(0, 2)
    .join("；");
}

function getIntensity(module: WorkoutModule | undefined): string {
  if (!module || module.exercises.length === 0) return "轻松";
  const rpes = module.exercises.map((exercise) => exercise.rpe);
  const min = Math.min(...rpes);
  const max = Math.max(...rpes);
  return min === max ? `RPE ${min}` : `RPE ${min}–${max}`;
}

function getEstimatedDuration(
  module: WorkoutModule | undefined,
  moduleId: string,
  scheduleDuration?: number,
): number | undefined {
  if (scheduleDuration !== undefined) return scheduleDuration;
  const templateDuration = weeklyTemplate.find(
    (entry) => entry.moduleId === moduleId,
  )?.estimatedDurationMinutes;
  if (!module && templateDuration === undefined) return undefined;
  return getEstimatedDurationMinutes(
    module ?? { exercises: [] },
    templateDuration,
  );
}

function StatusBadge({ item }: { item: DailyScheduleItem }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs ${
        item.status === "skipped"
          ? "bg-slate-700 text-slate-300"
          : item.status === "completed"
            ? "bg-emerald-400/10 text-emerald-300"
          : item.adjustType
          ? "bg-amber-400/10 text-amber-300"
          : "bg-slate-800 text-slate-300"
      }`}
    >
      {item.status === "skipped"
        ? "已跳过 · 休息"
        : item.status === "completed"
          ? "已完成"
        : item.adjustType
          ? "已调整"
          : "已安排"}
    </span>
  );
}

function ModuleBadge({ module }: { module?: WorkoutModule }) {
  if (!module?.category) return null;

  const label = {
    strength: "力量",
    functional: "功能性",
    cardio: "有氧",
    rest: "休息",
  }[module.category];

  return (
    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
      {label}
    </span>
  );
}

export function TodayTrainingCard({
  item,
  onAdjust,
  onPostpone,
}: ScheduleCardProps) {
  const modules = useModuleStore((state) => state.modules);
  const module = findModule(modules, item.moduleId);

  return (
    <article className="rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-lg shadow-black/10">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-400">
            {item.timeSlot ?? "全天"}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">
            {item.name ?? getModuleName(modules, item.moduleId)}
          </h3>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <ModuleBadge module={module} />
          <StatusBadge item={item} />
        </div>
      </div>
      <div className="mb-5 space-y-3 text-sm">
        {item.status !== "skipped" &&
          getEstimatedDuration(
            module,
            item.moduleId,
            item.estimatedDurationMinutes,
          ) !== undefined && (
            <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 font-semibold text-emerald-200">
              ⏱️ 预计时长：
              {getEstimatedDuration(
                module,
                item.moduleId,
                item.estimatedDurationMinutes,
              )}分钟
            </p>
          )}
        <p className="leading-relaxed text-slate-300">
          <span className="mr-2 text-slate-500">目标</span>
          {item.status === "skipped"
            ? "休息与恢复"
            : item.exerciseSelections?.map((exercise) => exercise.name).join("、") ??
              getTarget(module)}
        </p>
        <p className="text-slate-300">
          <span className="mr-2 text-slate-500">强度</span>
          {item.status === "skipped" ? "休息" : getIntensity(module)}
        </p>
        {item.status === "skipped" && item.adjustReason && (
          <p className="text-slate-400">原因：{item.adjustReason}</p>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        {item.status !== "skipped" && item.status !== "completed" && (
          <Link
            to={`/training?moduleId=${encodeURIComponent(item.moduleId)}&scheduleItemId=${encodeURIComponent(item.id)}`}
            className="flex min-h-12 flex-1 items-center justify-center rounded-xl bg-emerald-400 px-4 py-3 text-center font-semibold text-slate-950 transition hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            开始训练
          </Link>
        )}
        <button
          type="button"
          onClick={onAdjust}
          className="min-h-12 rounded-xl border border-slate-600 px-4 py-3 font-semibold text-slate-200 transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          调整
        </button>
        {onPostpone &&
          item.status !== "skipped" &&
          item.status !== "completed" && (
            <button
              type="button"
              onClick={onPostpone}
              className="min-h-12 rounded-xl border border-orange-400/40 px-4 py-3 font-semibold text-orange-200 transition hover:bg-orange-400/10 focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              顺延一天
            </button>
          )}
      </div>
    </article>
  );
}

export function TomorrowTrainingCard({ item, onAdjust }: ScheduleCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const modules = useModuleStore((state) => state.modules);
  const module = findModule(modules, item.moduleId);

  return (
    <article className="rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-lg shadow-black/10">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-400">
            {item.timeSlot ?? "全天"}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">
            {item.name ?? getModuleName(modules, item.moduleId)}
          </h3>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <ModuleBadge module={module} />
          <StatusBadge item={item} />
        </div>
      </div>
      {detailsOpen && (
        <div className="mb-5 space-y-2 text-sm text-slate-300">
          <p>{module?.description ?? "按周训练模板安排。"}</p>
          {item.exerciseSelections ? (
            <ul className="list-inside list-disc text-slate-400">
              {item.exerciseSelections.map((exercise) => (
                <li key={exercise.exerciseName}>{exercise.name}</li>
              ))}
            </ul>
          ) : module && module.exercises.length > 0 ? (
            <ul className="list-inside list-disc text-slate-400">
              {module.exercises.map((exercise) => (
                <li key={exercise.id}>{exercise.name}</li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setDetailsOpen((open) => !open)}
          className="min-h-12 flex-1 rounded-xl bg-slate-700 px-4 py-3 font-semibold text-white transition hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          {detailsOpen ? "收起详情" : "查看详情"}
        </button>
        <button
          type="button"
          onClick={onAdjust}
          className="min-h-12 rounded-xl border border-slate-600 px-4 py-3 font-semibold text-slate-200 transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          调整
        </button>
      </div>
    </article>
  );
}
