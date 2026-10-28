import { useEffect, useState } from "react";
import { useModuleStore } from "../store/moduleStore";
import { useScheduleStore } from "../store/scheduleStore";
import type { ScheduleDay } from "../types";

type AdjustmentOption =
  | "swap"
  | "time"
  | "cardio-walk"
  | "full-rest"
  | "custom";

type AdjustmentReason =
  | "太疲劳"
  | "时间不够"
  | "肩臂不适"
  | "手指不适"
  | "工作临时变化"
  | "其他";

export interface AdjustModalProps {
  isOpen: boolean;
  day: ScheduleDay;
  scheduleItemId: string;
  onClose: () => void;
}

const adjustmentOptions: { value: AdjustmentOption; label: string }[] = [
  { value: "swap", label: "与另一天指定安排对调" },
  { value: "time", label: "调整训练时间" },
  { value: "cardio-walk", label: "替换为有氧与恢复" },
  { value: "full-rest", label: "替换为完全休息" },
  { value: "custom", label: "自定义选择模块" },
];

const adjustmentReasons: AdjustmentReason[] = [
  "太疲劳",
  "时间不够",
  "肩臂不适",
  "手指不适",
  "工作临时变化",
  "其他",
];

export default function AdjustModal({
  isOpen,
  day,
  scheduleItemId,
  onClose,
}: AdjustModalProps) {
  const workoutModules = useModuleStore((state) => state.modules);
  const replaceSchedule = useScheduleStore((state) => state.replaceSchedule);
  const swapScheduleItems = useScheduleStore(
    (state) => state.swapScheduleItems,
  );
  const updateScheduleTime = useScheduleStore(
    (state) => state.updateScheduleTime,
  );
  const todaySchedule = useScheduleStore((state) => state.todaySchedule);
  const tomorrowSchedule = useScheduleStore((state) => state.tomorrowSchedule);
  const [option, setOption] = useState<AdjustmentOption>("swap");
  const [reason, setReason] = useState<AdjustmentReason | "">("");
  const [otherReason, setOtherReason] = useState("");
  const [moduleId, setModuleId] = useState(workoutModules[0]?.id ?? "");
  const [otherScheduleItemId, setOtherScheduleItemId] = useState("");
  const [time, setTime] = useState("");
  const otherSchedule = day === "today" ? tomorrowSchedule : todaySchedule;
  const selectedSchedule = (day === "today" ? todaySchedule : tomorrowSchedule)
    .find((item) => item.id === scheduleItemId);

  useEffect(() => {
    setOtherScheduleItemId(otherSchedule[0]?.id ?? "");
    const timeMatch = selectedSchedule?.timeSlot?.match(/(\d{2}):(\d{2})/);
    setTime(timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : "19:00");
  }, [
    day,
    otherSchedule[0]?.id,
    scheduleItemId,
    selectedSchedule?.timeSlot,
  ]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const resolvedReason =
    reason === "其他" ? otherReason.trim() : reason;
  const canSave =
    resolvedReason.length > 0 &&
    (option !== "custom" || moduleId.length > 0) &&
    (option !== "swap" || otherScheduleItemId.length > 0) &&
    (option !== "time" || time.length > 0);

  const handleSave = () => {
    if (!canSave) return;

    const adjustmentReason =
      reason === "其他" ? `其他：${resolvedReason}` : resolvedReason;

    if (option === "swap") {
      swapScheduleItems(
        day,
        scheduleItemId,
        otherScheduleItemId,
        adjustmentReason,
      );
    } else if (option === "time") {
      const hour = Number(time.slice(0, 2));
      const timeOfDay = hour >= 17 ? "晚上" : hour < 11 ? "上午" : "中午";
      updateScheduleTime(day, scheduleItemId, `${timeOfDay} ${time}`);
    } else {
      const replacementModuleId =
        option === "custom" ? moduleId : option;
      replaceSchedule(
        day,
        replacementModuleId,
        adjustmentReason,
        scheduleItemId,
      );
    }

    onClose();
  };

  const otherDayLabel = day === "today" ? "明天" : "今天";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="adjust-modal-title"
        aria-modal="true"
        className="max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl border border-slate-700 bg-slate-900 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-6"
        role="dialog"
      >
        <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-slate-700 sm:hidden" />
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-emerald-300">
              调整{day === "today" ? "今天" : "明天"}的训练
            </p>
            <h2
              id="adjust-modal-title"
              className="mt-1 text-xl font-bold text-white"
            >
              训练安排调整
            </h2>
          </div>
          <button
            type="button"
            aria-label="关闭调整弹窗"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl leading-none text-slate-400 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            ×
          </button>
        </header>

        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-slate-300">
            选择调整方式
          </legend>
          <div className="space-y-2">
            {adjustmentOptions.map(({ value, label }) => (
              <label
                key={value}
                className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                  option === value
                    ? "border-emerald-400 bg-emerald-400/10 text-white"
                    : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500"
                }`}
              >
                <input
                  type="radio"
                  name="adjustment-option"
                  value={value}
                  checked={option === value}
                  onChange={() => setOption(value)}
                  className="h-4 w-4 accent-emerald-400"
                />
                {value === "swap"
                  ? `与${otherDayLabel}对调`
                  : label}
              </label>
            ))}
          </div>
        </fieldset>

        {option === "swap" && (
          <label className="mt-4 block text-sm font-semibold text-slate-300">
            选择与哪项安排对调
            <select
              value={otherScheduleItemId}
              onChange={(event) => setOtherScheduleItemId(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-base font-normal text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
            >
              {otherSchedule.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.timeSlot ?? "全天"} ·{" "}
                  {item.name ??
                    workoutModules.find((module) => module.id === item.moduleId)
                      ?.name ??
                    item.moduleId}
                </option>
              ))}
            </select>
            {otherSchedule.length === 0 && (
              <span className="mt-2 block text-sm font-normal text-amber-300">
                另一天暂无安排可供对调。
              </span>
            )}
          </label>
        )}

        {option === "time" && (
          <label className="mt-4 block text-sm font-semibold text-slate-300">
            新训练时间
            <input
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-base font-normal text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
            />
          </label>
        )}

        {option === "custom" && (
          <label className="mt-4 block text-sm font-semibold text-slate-300">
            选择训练模块
            <select
              value={moduleId}
              onChange={(event) => setModuleId(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-base font-normal text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
            >
              {workoutModules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <fieldset className="mt-5">
          <legend className="mb-3 text-sm font-semibold text-slate-300">
            调整原因
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {adjustmentReasons.map((item) => (
              <label
                key={item}
                className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                  reason === item
                    ? "border-emerald-400 bg-emerald-400/10 text-white"
                    : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500"
                }`}
              >
                <input
                  type="radio"
                  name="adjustment-reason"
                  value={item}
                  checked={reason === item}
                  onChange={() => setReason(item)}
                  className="h-4 w-4 accent-emerald-400"
                />
                {item}
              </label>
            ))}
          </div>
          {reason === "其他" && (
            <textarea
              value={otherReason}
              onChange={(event) => setOtherReason(event.target.value)}
              placeholder="请填写调整原因"
              rows={2}
              className="mt-3 w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base text-white placeholder:text-slate-500 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
            />
          )}
        </fieldset>

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
            disabled={!canSave}
            className="min-h-12 rounded-xl bg-emerald-400 px-4 py-3 font-bold text-slate-950 hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            保存调整
          </button>
        </div>
      </section>
    </div>
  );
}
