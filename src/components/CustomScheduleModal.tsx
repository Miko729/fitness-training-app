import { useState } from "react";
import { useModuleStore } from "../store/moduleStore";
import { useScheduleStore } from "../store/scheduleStore";
import type { ScheduleDay, WorkoutModule } from "../types";

type ActivityPreset = "散步" | "乒乓球" | "羽毛球" | "网球" | "自定义";

const presets: ActivityPreset[] = ["散步", "乒乓球", "羽毛球", "网球", "自定义"];

function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export interface CustomScheduleModalProps {
  onClose: () => void;
}

export default function CustomScheduleModal({
  onClose,
}: CustomScheduleModalProps) {
  const saveModule = useModuleStore((state) => state.saveModule);
  const addCustomSchedule = useScheduleStore(
    (state) => state.addCustomSchedule,
  );
  const todayDate = useScheduleStore((state) => state.todayDate);
  const tomorrowDate = useScheduleStore((state) => state.tomorrowDate);
  const [day, setDay] = useState<ScheduleDay>("today");
  const [preset, setPreset] = useState<ActivityPreset>("散步");
  const [customName, setCustomName] = useState("");
  const [time, setTime] = useState("19:00");
  const [duration, setDuration] = useState("60");
  const [error, setError] = useState<string | null>(null);

  const activityName = preset === "自定义" ? customName.trim() : preset;

  const handleSave = () => {
    const durationMinutes = Number(duration);
    if (!activityName) {
      setError("请填写活动名称。");
      return;
    }
    if (!Number.isInteger(durationMinutes) || durationMinutes < 1) {
      setError("时长必须是大于 0 的整数分钟。");
      return;
    }

    const moduleId = `custom-activity-${createId()}`;
    const module: WorkoutModule = {
      id: moduleId,
      name: activityName,
      type: "cardio",
      category: "cardio",
      goal: `${activityName}，按当日体力安排强度。`,
      description: `${activityName}临时安排。`,
      estimatedDurationMinutes: durationMinutes,
      estimatedCaloriesPerMinute: preset === "散步" ? 4 : 7,
      exercises: [],
    };
    const hour = Number(time.slice(0, 2));
    const period = hour >= 17 ? "晚上" : hour < 11 ? "上午" : "中午";
    const date = day === "today" ? todayDate : tomorrowDate;
    try {
      saveModule(module);
      addCustomSchedule(day, {
        moduleId,
        name: activityName,
        timeSlot: `${period} ${time}`,
        estimatedDurationMinutes: durationMinutes,
      });
      setError(null);
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : `无法添加 ${date} 的活动安排。`,
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="custom-schedule-title"
        aria-modal="true"
        className="max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl border border-slate-700 bg-slate-900 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-6"
        role="dialog"
      >
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-emerald-300">临时安排</p>
            <h2 id="custom-schedule-title" className="mt-1 text-xl font-bold">
              添加额外活动
            </h2>
          </div>
          <button
            type="button"
            aria-label="关闭添加活动弹窗"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl leading-none text-slate-400 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            ×
          </button>
        </header>

        <div className="space-y-4">
          <label className="block text-sm font-semibold text-slate-300">
            安排日期
            <select
              value={day}
              onChange={(event) => setDay(event.target.value as ScheduleDay)}
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-base font-normal text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
            >
              <option value="today">今天 · {todayDate}</option>
              <option value="tomorrow">明天 · {tomorrowDate}</option>
            </select>
          </label>

          <label className="block text-sm font-semibold text-slate-300">
            活动
            <select
              value={preset}
              onChange={(event) => setPreset(event.target.value as ActivityPreset)}
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-base font-normal text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
            >
              {presets.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          {preset === "自定义" && (
            <label className="block text-sm font-semibold text-slate-300">
              活动名称
              <input
                type="text"
                value={customName}
                onChange={(event) => setCustomName(event.target.value)}
                placeholder="例如：室内单车"
                maxLength={40}
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-base font-normal text-white outline-none placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
              />
            </label>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-semibold text-slate-300">
              开始时间
              <input
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-base font-normal text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-300">
              时长（分钟）
              <input
                type="number"
                min="1"
                step="1"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-base font-normal text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
              />
            </label>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-rose-300">
            {error}
          </p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 rounded-xl border border-slate-600 px-4 py-3 font-semibold text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="min-h-12 rounded-xl bg-emerald-400 px-4 py-3 font-bold text-slate-950 hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            添加安排
          </button>
        </div>
      </section>
    </div>
  );
}
