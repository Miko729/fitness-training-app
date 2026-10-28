import dayjs from "dayjs";
import { useState } from "react";
import BottomNavigation from "../components/BottomNavigation";
import {
  generateWeeklySchedule,
  getCycleWeekStartDate,
  getCurrentCycleWeek,
  monthlyCycleTemplate,
} from "../data/monthlyCycleTemplate";
import { weeklyTemplate } from "../data/weeklyTemplate";
import { useModuleStore } from "../store/moduleStore";
import { useScheduleStore } from "../store/scheduleStore";
import type { MonthlyCycleWeekNumber } from "../data/monthlyCycleTemplate";
import type { WorkoutModule } from "../types";

const weekdayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function getModuleName(
  modules: WorkoutModule[],
  moduleId: string,
): string {
  return (
    modules.find((module) => module.id === moduleId)?.name ??
    weeklyTemplate.find((item) => item.moduleId === moduleId)?.notes ??
    "训练安排"
  );
}

export default function WeeklyPage() {
  const workoutModules = useModuleStore((state) => state.modules);
  const cycleStartDate = useScheduleStore((state) => state.cycleStartDate);
  const setCycleStartDate = useScheduleStore(
    (state) => state.setCycleStartDate,
  );
  const [cycleStartDateError, setCycleStartDateError] = useState<string | null>(
    null,
  );
  const currentCycleWeek = getCurrentCycleWeek(cycleStartDate);
  const cycleWeeks = monthlyCycleTemplate.map((cycleInfo) => {
    const week = cycleInfo.week as MonthlyCycleWeekNumber;
    const weekStartDate = getCycleWeekStartDate(cycleStartDate, week);
    const weekEndDate = dayjs(weekStartDate)
      .add(6, "day")
      .format("YYYY-MM-DD");
    return {
      cycleInfo,
      week,
      weekStartDate,
      weekEndDate,
      schedule: generateWeeklySchedule(week, weekStartDate),
    };
  });

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-24 pt-8 text-white sm:px-6 sm:pt-12">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <p className="text-sm font-medium tracking-wide text-emerald-300">
            月度安排
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            四周训练计划
          </h1>
          <p className="mt-2 text-slate-400">
            计划开始：{dayjs(cycleStartDate).format("YYYY年M月D日")} · 按四周循环展示
          </p>
          <label className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <span>设置计划开始日期</span>
            <input
              type="date"
              value={cycleStartDate}
              onChange={(event) => {
                const nextDate = event.currentTarget.value;
                if (!nextDate) return;
                try {
                  setCycleStartDate(nextDate);
                  setCycleStartDateError(null);
                } catch (error) {
                  setCycleStartDateError(
                    error instanceof Error
                      ? error.message
                      : "计划开始日期无效。",
                  );
                }
              }}
              className="min-h-11 rounded-lg border border-slate-700 bg-slate-950 px-3 text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            />
          </label>
          {cycleStartDateError && (
            <p role="alert" className="mt-2 text-sm text-rose-300">
              {cycleStartDateError}
            </p>
          )}
        </header>

        <div className="space-y-6">
          {cycleWeeks.map(
            ({ cycleInfo, week, weekStartDate, weekEndDate, schedule }) => (
              <section
                key={week}
                aria-label={`第 ${week} 周安排`}
                className={`rounded-2xl border bg-slate-900 p-5 ${
                  week === currentCycleWeek
                    ? "border-emerald-400/50 shadow-lg shadow-emerald-950/20"
                    : "border-slate-700"
                }`}
              >
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">
                      第 {week} 周 · {cycleInfo.name}
                      {week === currentCycleWeek && (
                        <span className="ml-2 rounded-full bg-emerald-400/10 px-2 py-1 align-middle text-xs font-medium text-emerald-300">
                          当前周
                        </span>
                      )}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      {dayjs(weekStartDate).format("YYYY年M月D日")} –{" "}
                      {dayjs(weekEndDate).format("M月D日")}
                    </p>
                  </div>
                  <p className="text-sm text-emerald-200">
                    {cycleInfo.prompt}
                  </p>
                </div>

                <div className="space-y-3">
                  {Array.from({ length: 7 }, (_, dayOffset) => {
                    const date = dayjs(weekStartDate)
                      .add(dayOffset, "day")
                      .format("YYYY-MM-DD");
                    const weekday = weekdayNames[dayjs(date).day()];
                    const entries = schedule.filter((item) => item.date === date);
                    return (
                      <div
                        key={`${week}-${date}`}
                        className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
                      >
                        <h3 className="mb-2 font-medium text-slate-200">
                          {weekday}
                          <span className="ml-2 text-sm font-normal text-slate-500">
                            {dayjs(date).format("M月D日")}
                          </span>
                        </h3>
                        {entries.length > 0 ? (
                          <ul className="space-y-3">
                            {entries.map((entry) => (
                              <li
                                key={entry.id}
                                className="flex items-start justify-between gap-3 border-t border-slate-800 pt-3 first:border-0 first:pt-0"
                              >
                                <div>
                                  <p className="text-sm text-slate-400">
                                    {entry.timeSlot}
                                  </p>
                                  <p className="mt-1 font-medium text-white">
                                    {entry.name ??
                                      getModuleName(workoutModules, entry.moduleId)}
                                  </p>
                                  <p className="mt-1 text-sm text-slate-400">
                                    {entry.exerciseSelections
                                      ?.map((exercise) => exercise.name)
                                      .join("、") ??
                                      weeklyTemplate.find(
                                        (template) =>
                                          template.moduleId === entry.moduleId,
                                      )?.notes ??
                                      (entry.isFixed ? "固定安排" : "可调整")}
                                  </p>
                                </div>
                                <span className="shrink-0 rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                                  {entry.isFixed ? "固定" : "可调整"}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-slate-500">
                            休息 / 自由安排
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ),
          )}
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 border-t border-slate-800 bg-slate-950/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
        <BottomNavigation activeTab="weekly" />
      </div>
    </main>
  );
}
