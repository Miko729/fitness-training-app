import { useMemo, useState } from "react";
import dayjs from "dayjs";
import BottomNavigation from "../components/BottomNavigation";
import { useLogStore } from "../store/logStore";
import { useModuleStore } from "../store/moduleStore";

export default function HistoryPage() {
  const logs = useLogStore((state) => state.logs);
  const workoutModules = useModuleStore((state) => state.modules);
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD"),
  );
  const visibleLogs = useMemo(
    () =>
      logs
        .filter((log) => log.date === selectedDate)
        .sort((a, b) => (b.startedAt ?? "").localeCompare(a.startedAt ?? "")),
    [logs, selectedDate],
  );

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-24 pt-8 text-white sm:px-6 sm:pt-12">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <p className="text-sm font-medium tracking-wide text-emerald-300">
            训练回顾
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">历史记录</h1>
        </header>

        <label className="mb-5 block text-sm font-medium text-slate-300">
          选择日期
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="mt-2 min-h-12 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 text-base text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
          />
        </label>

        <div className="space-y-4">
          {visibleLogs.length > 0 ? (
            visibleLogs.map((log) => {
              const module = workoutModules.find(
                (item) => item.id === log.moduleId,
              );
              const setCount = log.exercises.reduce(
                (total, exercise) =>
                  total +
                  exercise.sets.filter((set) => set.completed !== false).length,
                0,
              );

              return (
                <article
                  key={log.id}
                  className="rounded-2xl border border-slate-700 bg-slate-900 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-400">
                        {log.startedAt
                          ? dayjs(log.startedAt).format("HH:mm")
                          : "训练"}
                        {log.completedAt ? " · 已完成" : " · 进行中"}
                      </p>
                      <h2 className="mt-1 text-lg font-semibold">
                        {module?.name ?? log.moduleId}
                      </h2>
                    </div>
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                      {setCount} 组
                    </span>
                  </div>
                  <ul className="mt-4 space-y-3">
                    {log.exercises.map((exerciseLog) => {
                      const exercise = module?.exercises.find(
                        (item) => item.id === exerciseLog.exerciseId,
                      );
                      return (
                        <li
                          key={exerciseLog.exerciseId}
                          className="border-t border-slate-800 pt-3 first:border-0 first:pt-0"
                        >
                          <p className="font-medium text-slate-200">
                            {exercise?.name ?? exerciseLog.exerciseId}
                          </p>
                          <p className="mt-1 text-sm text-slate-400">
                            {exerciseLog.sets.map((set, index) => {
                              const details = [
                                set.actualExerciseName
                                  ? `动作：${set.actualExerciseName}`
                                  : null,
                                set.weight !== undefined
                                  ? `${set.weight} kg`
                                  : null,
                                set.reps !== undefined
                                  ? `${set.reps} 次`
                                  : null,
                                set.rpe !== undefined ? `RPE ${set.rpe}` : null,
                              ].filter(Boolean);
                              return `第${index + 1}组 ${details.join(" · ") || "已完成"}`;
                            }).join("；")}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                </article>
              );
            })
          ) : (
            <p className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-slate-400">
              该日期还没有训练记录。
            </p>
          )}
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 border-t border-slate-800 bg-slate-950/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
        <BottomNavigation activeTab="history" />
      </div>
    </main>
  );
}
