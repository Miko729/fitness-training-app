import type { ExerciseSetDraft } from "./ExerciseCard";

export interface SetCheckInProps {
  set: ExerciseSetDraft;
  index: number;
  isActive: boolean;
  disabled?: boolean;
  targetRpe: number;
  actualExerciseName?: string;
  onChange: (value: ExerciseSetDraft) => void;
}

export default function SetCheckIn({
  set,
  index,
  isActive,
  disabled = false,
  targetRpe,
  actualExerciseName,
  onChange,
}: SetCheckInProps) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        set.completed
          ? "border-emerald-500/50 bg-emerald-500/5"
          : isActive
            ? "border-emerald-400/60 bg-emerald-400/5"
            : "border-slate-700 bg-slate-950"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-200">
          第 {index + 1} 组
        </span>
        {set.completed && (
          <span className="text-xs font-medium text-emerald-300">已完成</span>
        )}
      </div>
      {actualExerciseName && (
        <p className="mb-3 text-xs text-emerald-300">
          实际动作：{actualExerciseName}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-slate-400">
          重量（kg，可选）
          <input
            type="number"
            min="0"
            step="0.5"
            inputMode="decimal"
            value={set.weight}
            disabled={set.completed || disabled}
            onChange={(event) =>
              onChange({ ...set, weight: event.target.value })
            }
            placeholder="选填"
            className="mt-1 min-h-12 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-base text-white placeholder:text-slate-600 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 disabled:text-slate-400"
          />
        </label>
        <label className="text-xs text-slate-400">
          次数（可选）
          <input
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={set.reps}
            disabled={set.completed || disabled}
            onChange={(event) =>
              onChange({ ...set, reps: event.target.value })
            }
            placeholder="选填"
            className="mt-1 min-h-12 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-base text-white placeholder:text-slate-600 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 disabled:text-slate-400"
          />
        </label>
      </div>
      <label className="mt-3 block text-xs text-slate-400">
        RPE（可选）
        <input
          type="number"
          min="1"
          max="10"
          step="0.5"
          inputMode="decimal"
          value={set.rpe}
          disabled={set.completed || disabled}
          onChange={(event) => onChange({ ...set, rpe: event.target.value })}
          placeholder={`目标 RPE ${targetRpe}`}
          className="mt-1 min-h-12 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-base text-white placeholder:text-slate-600 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 disabled:text-slate-400"
        />
      </label>
    </div>
  );
}
