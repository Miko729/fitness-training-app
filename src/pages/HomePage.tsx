import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import AdjustModal from "../components/AdjustModal";
import BottomNavigation from "../components/BottomNavigation";
import CustomScheduleModal from "../components/CustomScheduleModal";
import {
  TodayTrainingCard,
  TomorrowTrainingCard,
} from "../components/ScheduleCard";
import {
  getCurrentCycleWeek,
  monthlyCycleTemplate,
} from "../data/monthlyCycleTemplate";
import { useLogStore } from "../store/logStore";
import { useModuleStore } from "../store/moduleStore";
import { useScheduleStore } from "../store/scheduleStore";
import type { DailyScheduleItem, ScheduleDay } from "../types";

const weekdayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function getScheduleTime(item: DailyScheduleItem): number {
  const time = item.timeSlot ?? "";
  const clockTime = time.match(/(\d{1,2}):(\d{2})/);
  if (clockTime) {
    return Number(clockTime[1]) * 60 + Number(clockTime[2]);
  }

  if (time.includes("凌晨")) return 3 * 60;
  if (time.includes("早上") || time.includes("上午")) return 8 * 60;
  if (time.includes("中午")) return 12 * 60;
  if (time.includes("下午")) return 15 * 60;
  if (time.includes("晚上")) return 17 * 60;
  return Number.MAX_SAFE_INTEGER;
}

function sortScheduleByTime(
  schedule: DailyScheduleItem[],
): DailyScheduleItem[] {
  return [...schedule].sort(
    (first, second) => getScheduleTime(first) - getScheduleTime(second),
  );
}

export default function HomePage() {
  const logs = useLogStore((state) => state.logs);
  const modules = useModuleStore((state) => state.modules);
  const todaySchedule = useScheduleStore((state) => state.todaySchedule);
  const tomorrowSchedule = useScheduleStore((state) => state.tomorrowSchedule);
  const cycleStartDate = useScheduleStore((state) => state.cycleStartDate);
  const getTodaySchedule = useScheduleStore((state) => state.getTodaySchedule);
  const getTomorrowSchedule = useScheduleStore(
    (state) => state.getTomorrowSchedule,
  );
  const postponeAllFromToday = useScheduleStore(
    (state) => state.postponeAllFromToday,
  );
  const [adjustingSchedule, setAdjustingSchedule] = useState<{
    day: ScheduleDay;
    scheduleItemId: string;
  } | null>(null);
  const [postponeToast, setPostponeToast] = useState(false);
  const [postponeError, setPostponeError] = useState<string | null>(null);
  const [addingCustomSchedule, setAddingCustomSchedule] = useState(false);
  const postponeToastTimer = useRef<number | null>(null);
  useEffect(() => {
    getTodaySchedule();
    getTomorrowSchedule();
  }, [getTodaySchedule, getTomorrowSchedule]);

  useEffect(
    () => () => {
      if (postponeToastTimer.current !== null) {
        window.clearTimeout(postponeToastTimer.current);
      }
    },
    [],
  );

  const today = dayjs();
  const todayDate = today.format("YYYY-MM-DD");
  const todayLogs = logs.filter((log) => log.date === todayDate);
  const caloriesBurned = todayLogs.reduce((total, log) => {
    if (log.actualCalories !== undefined) {
      return total + log.actualCalories;
    }

    if (log.durationMinutes === undefined) return total;
    const caloriesPerMinute = modules.find(
      (module) => module.id === log.moduleId,
    )?.estimatedCaloriesPerMinute;
    return caloriesPerMinute === undefined
      ? total
      : total + log.durationMinutes * caloriesPerMinute;
  }, 0);
  const completedTrainingCount = todayLogs.filter(
    (log) => log.completedAt !== undefined,
  ).length;
  const dateLabel = `${today.format("YYYY年M月D日")} ${weekdayNames[today.day()]}`;
  const tomorrow = today.add(1, "day");
  const todayHeading = `今天 · ${today.format("M月D日")} ${weekdayNames[today.day()]}`;
  const tomorrowHeading = `明天 · ${tomorrow.format("M月D日")} ${weekdayNames[tomorrow.day()]}`;
  const sortedTodaySchedule = sortScheduleByTime(todaySchedule);
  const sortedTomorrowSchedule = sortScheduleByTime(tomorrowSchedule);
  const currentCycleWeek = getCurrentCycleWeek(cycleStartDate);
  const currentCycleInfo = monthlyCycleTemplate[currentCycleWeek - 1];

  const handlePostpone = (scheduleItemIds?: string[]) => {
    const confirmed = window.confirm(
      scheduleItemIds
        ? "确定顺延这项安排吗？如下一天同一时段已有非固定安排，冲突安排会依次后移；固定项目不会移动。"
        : "确定顺延今天所有未完成安排吗？如遇同一时段冲突，非固定安排会依次后移；固定项目不会移动。",
    );
    if (!confirmed) return;

    try {
      postponeAllFromToday(scheduleItemIds);
      setPostponeError(null);
      setPostponeToast(true);
    } catch (error) {
      setPostponeError(
        error instanceof Error ? error.message : "顺延失败，请稍后重试。",
      );
      return;
    }
    if (postponeToastTimer.current !== null) {
      window.clearTimeout(postponeToastTimer.current);
    }
    postponeToastTimer.current = window.setTimeout(() => {
      postponeToastTimer.current = null;
      setPostponeToast(false);
    }, 3000);
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-40 pt-8 text-white sm:px-6 sm:pt-12">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <p className="text-sm font-medium tracking-wide text-emerald-300">
            个人训练
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">训练计划</h1>
          <p className="mt-2 text-slate-400">{dateLabel}</p>
        </header>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-300/20 bg-emerald-400/5 px-4 py-3">
          <div>
            <p className="font-semibold text-emerald-100">
              📅 第 {currentCycleWeek} 周 · {currentCycleInfo.name}
            </p>
            <p className="mt-1 text-sm text-slate-400">{currentCycleInfo.prompt}</p>
          </div>
          <Link
            to="/weekly"
            className="min-h-10 rounded-lg border border-emerald-400/30 px-3 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-400/10 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            查看四周计划
          </Link>
        </div>

        <div className="mb-5 flex justify-end">
          <button
            type="button"
            onClick={() => setAddingCustomSchedule(true)}
            className="min-h-11 rounded-lg border border-emerald-400/40 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-400/10 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            + 添加活动（今天或明天）
          </button>
        </div>

        <section aria-labelledby="today-heading" className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="today-heading" className="text-xl font-semibold">
              {todayHeading}
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">
                {todaySchedule.length} 项安排
              </span>
            </div>
          </div>
          <div className="space-y-4">
            {todaySchedule.length > 0 ? (
              sortedTodaySchedule.map((item) => (
                <TodayTrainingCard
                  key={item.id}
                  item={item}
                  onAdjust={() =>
                    setAdjustingSchedule({
                      day: "today",
                      scheduleItemId: item.id,
                    })
                  }
                  onPostpone={() => handlePostpone([item.id])}
                />
              ))
            ) : (
              <p className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-slate-400">
                今天暂无训练安排。
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => handlePostpone()}
            disabled={!todaySchedule.some((item) => item.status !== "completed" && item.status !== "skipped")}
            className="mt-4 min-h-14 w-full rounded-xl border border-orange-400/50 bg-orange-400/10 px-5 py-4 text-base font-semibold text-orange-200 transition hover:bg-orange-400/20 focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            🛌 将所有未完成安排顺延一天
          </button>
          {postponeError && (
            <p role="alert" className="mt-3 text-sm text-rose-300">
              {postponeError}
            </p>
          )}
        </section>

        <section aria-labelledby="tomorrow-heading">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="tomorrow-heading" className="text-xl font-semibold">
              {tomorrowHeading}
            </h2>
            <span className="text-sm text-slate-500">
              {tomorrowSchedule.length} 项安排
            </span>
          </div>
          <div className="space-y-4">
            {tomorrowSchedule.length > 0 ? (
              sortedTomorrowSchedule.map((item) => (
                <TomorrowTrainingCard
                  key={item.id}
                  item={item}
                  onAdjust={() =>
                    setAdjustingSchedule({
                      day: "tomorrow",
                      scheduleItemId: item.id,
                    })
                  }
                />
              ))
            ) : (
              <p className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-slate-400">
                明天暂无训练安排。
              </p>
            )}
          </div>
        </section>

        <section
          aria-label="今日运动消耗"
          className="mt-8 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="font-medium text-slate-300">🔥 今日运动消耗</p>
            <p className="font-semibold text-orange-200">
              {new Intl.NumberFormat("zh-CN", {
                maximumFractionDigits: 0,
              }).format(Math.round(caloriesBurned))}{" "}
              kcal
            </p>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            已完成 {completedTrainingCount} 项训练
          </p>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-800 bg-slate-950/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
        <BottomNavigation
          activeTab="home"
          trainingHref={
            todaySchedule[0]
              ? `/training?moduleId=${encodeURIComponent(todaySchedule[0].moduleId)}&scheduleItemId=${encodeURIComponent(todaySchedule[0].id)}`
              : "/training"
          }
        />
      </div>
      {adjustingSchedule && (
        <AdjustModal
          isOpen
          day={adjustingSchedule.day}
          scheduleItemId={adjustingSchedule.scheduleItemId}
          onClose={() => setAdjustingSchedule(null)}
        />
      )}
      {addingCustomSchedule && (
        <CustomScheduleModal onClose={() => setAddingCustomSchedule(false)} />
      )}
      {postponeToast && (
        <div
          role="status"
          className="fixed left-1/2 top-5 z-50 -translate-x-1/2 rounded-xl border border-emerald-400/40 bg-slate-800 px-5 py-3 font-semibold text-emerald-200 shadow-xl"
        >
          顺延完成；冲突安排已依次后移
        </div>
      )}
    </main>
  );
}
