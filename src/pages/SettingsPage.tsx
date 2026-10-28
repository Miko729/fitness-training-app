import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BottomNavigation from "../components/BottomNavigation";
import GifPlayer from "../components/GifPlayer";
import { useExerciseLibraryStore } from "../store/exerciseLibraryStore";
import { useModuleStore } from "../store/moduleStore";
import type { Exercise, WorkoutModule } from "../types";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createBlankModule(): WorkoutModule {
  return {
    id: createId("module"),
    name: "新训练模块",
    type: "strength",
    category: "strength",
    goal: "",
    description: "",
    exercises: [],
  };
}

export default function SettingsPage() {
  const modules = useModuleStore((state) => state.modules);
  const saveModule = useModuleStore((state) => state.saveModule);
  const exerciseLibrary = useExerciseLibraryStore((state) => state.exercises);
  const [draft, setDraft] = useState<WorkoutModule>(
    () => modules[0] ?? createBlankModule(),
  );
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [selectedLibraryExerciseIds, setSelectedLibraryExerciseIds] = useState<
    string[]
  >([]);
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const availableLibraryExercises = useMemo(() => {
    const query = exerciseSearch.trim().toLocaleLowerCase();
    return exerciseLibrary.filter((exercise) => {
      const alreadyAdded = draft.exercises.some(
        (item) => item.id === exercise.id || item.name === exercise.name,
      );
      const matchesSearch =
        !query ||
        `${exercise.name} ${exercise.targetBodyPart}`
          .toLocaleLowerCase()
          .includes(query);
      return !alreadyAdded && matchesSearch;
    });
  }, [draft.exercises, exerciseLibrary, exerciseSearch]);

  useEffect(() => {
    const storedModule = modules.find((module) => module.id === draft.id);
    if (storedModule) setDraft(structuredClone(storedModule));
  }, [modules, draft.id]);

  const updateDraft = (updates: Partial<WorkoutModule>) => {
    setDraft((current) => ({ ...current, ...updates }));
    setSaveError("");
    setSaveMessage("");
  };

  const updateExercise = (exerciseId: string, updates: Partial<Exercise>) => {
    updateDraft({
      exercises: draft.exercises.map((exercise) =>
        exercise.id === exerciseId ? { ...exercise, ...updates } : exercise,
      ),
    });
  };

  const handleSelectModule = (moduleId: string) => {
    const selected = modules.find((module) => module.id === moduleId);
    if (!selected) return;
    setDraft(structuredClone(selected));
    setSaveError("");
    setSaveMessage("");
    setExercisePickerOpen(false);
    setSelectedLibraryExerciseIds([]);
  };

  const handleAddLibraryExercises = () => {
    const alreadyAddedIds = new Set(draft.exercises.map((item) => item.id));
    const alreadyAddedNames = new Set(
      draft.exercises.map((item) => item.name),
    );
    const selectedExercises = exerciseLibrary.filter(
      (exercise) =>
        selectedLibraryExerciseIds.includes(exercise.id) &&
        !alreadyAddedIds.has(exercise.id) &&
        !alreadyAddedNames.has(exercise.name),
    );
    if (selectedExercises.length === 0) return;

    updateDraft({
      exercises: [
        ...draft.exercises,
        ...selectedExercises.map((exercise) => ({
          ...exercise,
          id: createId("exercise"),
        })),
      ],
    });
    setSelectedLibraryExerciseIds([]);
    setExerciseSearch("");
    setExercisePickerOpen(false);
  };

  const openExercisePicker = () => {
    setExerciseSearch("");
    setSelectedLibraryExerciseIds([]);
    setExercisePickerOpen(true);
  };

  const toggleLibraryExercise = (exerciseId: string) => {
    setSelectedLibraryExerciseIds((selected) =>
      selected.includes(exerciseId)
        ? selected.filter((id) => id !== exerciseId)
        : [...selected, exerciseId],
    );
  };

  const handleSave = () => {
    if (draft.category === "strength" && draft.exercises.length < 4) {
      setSaveMessage("");
      setSaveError(
        `⚠️ 力量训练模块至少需要配置 4 个动作，当前仅有 ${draft.exercises.length} 个。`,
      );
      return;
    }

    if (!draft.name.trim()) {
      setSaveMessage("");
      setSaveError("请填写训练模块名称。");
      return;
    }

    saveModule({ ...draft, name: draft.name.trim() });
    setSaveError("");
    setSaveMessage("模块配置已保存。");
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-28 pt-8 text-white sm:px-6 sm:pt-12">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <p className="text-sm font-medium tracking-wide text-emerald-300">
            应用偏好
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">设置</h1>
        </header>

        <section className="mb-6 rounded-2xl border border-slate-700 bg-slate-900 p-5">
          <h2 className="font-semibold">数据存储</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            训练安排、模块配置和打卡记录保存在此设备的浏览器本地存储中。清除浏览器数据可能会删除这些记录。
          </p>
        </section>

        <Link
          to="/exercise-library"
          className="mb-6 flex min-h-14 items-center justify-between rounded-2xl border border-emerald-400/40 bg-emerald-400/10 px-5 py-4 font-semibold text-emerald-200 hover:bg-emerald-400/15 focus:outline-none focus:ring-2 focus:ring-emerald-300"
        >
          <span>标准动作库管理</span>
          <span aria-hidden="true">→</span>
        </Link>

        <section className="space-y-5 rounded-2xl border border-slate-700 bg-slate-900 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 text-sm font-medium text-slate-300">
              编辑训练模块
              <select
                value={modules.some((module) => module.id === draft.id) ? draft.id : ""}
                onChange={(event) => handleSelectModule(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-base text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              >
                {!modules.some((module) => module.id === draft.id) && (
                  <option value="">当前新建模块（未保存）</option>
                )}
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => {
                setDraft(createBlankModule());
                setSaveError("");
                setSaveMessage("");
                setExercisePickerOpen(false);
              }}
              className="min-h-12 rounded-xl border border-slate-600 px-4 font-semibold text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              + 新建模块
            </button>
          </div>

          {saveError && (
            <div
              role="alert"
              className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm font-medium text-red-300"
            >
              {saveError}
            </div>
          )}
          {saveMessage && (
            <p role="status" className="text-sm font-medium text-emerald-300">
              {saveMessage}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-300">
              模块名称
              <input
                value={draft.name}
                onChange={(event) => updateDraft({ name: event.target.value })}
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-base text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              />
            </label>
            <label className="text-sm font-medium text-slate-300">
              模块类型
              <select
                value={draft.category ?? "functional"}
                onChange={(event) =>
                  updateDraft({
                    type: event.target.value as NonNullable<
                      WorkoutModule["type"]
                    >,
                    category: event.target.value as WorkoutModule["category"],
                  })
                }
                className="mt-2 min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-base text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              >
                <option value="strength">力量训练</option>
                <option value="functional">功能性</option>
                <option value="cardio">有氧</option>
                <option value="rest">休息</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-300 sm:col-span-2">
              模块目标
              <textarea
                value={draft.description ?? ""}
                onChange={(event) =>
                  updateDraft({ description: event.target.value })
                }
                rows={2}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              />
            </label>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">
                动作配置
                <span className="ml-2 text-sm font-normal text-slate-400">
                  {draft.exercises.length} 个动作
                  {draft.category === "strength" ? " · 力量训练至少 4 个" : ""}
                </span>
              </h2>
            </div>

            <div className="space-y-4">
              {draft.exercises.map((exercise, index) => (
                <article
                  key={exercise.id}
                  className="rounded-xl border border-slate-700 bg-slate-950 p-4"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="font-semibold">动作 {index + 1}</h3>
                    <button
                      type="button"
                      aria-label={`删除动作 ${exercise.name || index + 1}`}
                      onClick={() =>
                        updateDraft({
                          exercises: draft.exercises.filter(
                            (item) => item.id !== exercise.id,
                          ),
                        })
                      }
                      className="flex min-h-12 min-w-12 items-center justify-center rounded-xl text-xl text-red-300 hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-300"
                    >
                      🗑
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="text-sm">
                      <p className="font-semibold text-white">{exercise.name}</p>
                      <p className="mt-1 text-slate-400">
                        {exercise.targetBodyPart}
                      </p>
                      <p className="mt-1 text-slate-500">{exercise.purpose}</p>
                    </div>
                    <ExerciseField
                      label="计划次数"
                      value={exercise.plannedReps}
                      onChange={(value) =>
                        updateExercise(exercise.id, { plannedReps: value })
                      }
                    />
                    <NumberExerciseField
                      label="组数"
                      value={exercise.plannedSets}
                      min={1}
                      onChange={(value) =>
                        updateExercise(exercise.id, { plannedSets: value })
                      }
                    />
                  </div>
                </article>
              ))}
            </div>

            <button
              type="button"
              onClick={openExercisePicker}
              className="mt-4 min-h-14 w-full rounded-xl border border-emerald-400/50 bg-emerald-400/10 px-5 py-4 text-lg font-semibold text-emerald-200 hover:bg-emerald-400/20 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              + 从动作库添加
            </button>

            {exercisePickerOpen && (
              <div
                className="fixed inset-0 z-40 flex items-end bg-black/70 sm:items-center sm:justify-center sm:p-4"
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) {
                    setExercisePickerOpen(false);
                  }
                }}
              >
                <section
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="module-exercise-picker-title"
                  className="flex max-h-[85vh] w-full flex-col rounded-t-3xl border border-slate-700 bg-slate-900 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:max-w-lg sm:rounded-2xl sm:pb-5"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3
                      id="module-exercise-picker-title"
                      className="text-lg font-semibold"
                    >
                      从动作库选择
                    </h3>
                    <button
                      type="button"
                      onClick={() => setExercisePickerOpen(false)}
                      aria-label="关闭"
                      className="flex min-h-12 min-w-12 items-center justify-center rounded-xl text-2xl text-slate-400 hover:bg-slate-800"
                    >
                      ×
                    </button>
                  </div>
                  <input
                    type="search"
                    value={exerciseSearch}
                    onChange={(event) => setExerciseSearch(event.target.value)}
                    placeholder="搜索动作名称或目标部位"
                    className="mb-4 min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-base text-white placeholder:text-slate-500 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                  />
                  <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
                    {availableLibraryExercises.map((exercise) => {
                      const checked = selectedLibraryExerciseIds.includes(
                        exercise.id,
                      );
                      return (
                        <div
                          key={exercise.id}
                          className={`flex min-h-20 items-center gap-3 rounded-xl border p-3 transition ${
                            checked
                              ? "border-emerald-400/60 bg-emerald-400/10"
                              : "border-slate-700 bg-slate-950 hover:bg-slate-800"
                          }`}
                        >
                          <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                toggleLibraryExercise(exercise.id)
                              }
                              className="h-5 w-5 accent-emerald-400"
                            />
                            <span className="min-w-0">
                              <span className="block font-semibold text-white">
                                {exercise.name}
                              </span>
                              <span className="mt-1 block text-sm text-slate-400">
                                {exercise.targetBodyPart}
                              </span>
                            </span>
                          </label>
                          <GifPlayer
                            exerciseId={exercise.id}
                            title={exercise.name}
                            targetBodyPart={exercise.targetBodyPart}
                            gifUrl={exercise.gifUrl ?? exercise.imageUrl}
                            className="w-28 shrink-0"
                            canExpand={false}
                          />
                        </div>
                      );
                    })}
                    {availableLibraryExercises.length === 0 && (
                      <p className="rounded-xl bg-slate-950 p-4 text-center text-sm text-slate-400">
                        {exerciseLibrary.length === 0
                          ? "动作库暂无动作，请先到标准动作库添加。"
                          : "没有可添加的匹配动作。"}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setExercisePickerOpen(false)}
                      className="min-h-12 rounded-xl border border-slate-600 px-4 font-semibold text-slate-200 hover:bg-slate-800"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      disabled={selectedLibraryExerciseIds.length === 0}
                      onClick={handleAddLibraryExercises}
                      className="min-h-12 rounded-xl bg-emerald-400 px-4 font-semibold text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      确认添加
                      {selectedLibraryExerciseIds.length > 0 &&
                        ` (${selectedLibraryExerciseIds.length})`}
                    </button>
                  </div>
                </section>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="min-h-14 w-full rounded-xl bg-emerald-400 px-5 py-4 text-lg font-bold text-slate-950 hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            保存模块
          </button>
        </section>
      </div>
      <div className="fixed inset-x-0 bottom-0 border-t border-slate-800 bg-slate-950/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
        <BottomNavigation activeTab="settings" />
      </div>
    </main>
  );
}

interface ExerciseFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ExerciseField({ label, value, onChange }: ExerciseFieldProps) {
  return (
    <label className="text-sm text-slate-400">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 min-h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-base text-white outline-none focus:border-emerald-400"
      />
    </label>
  );
}

interface NumberExerciseFieldProps {
  label: string;
  value: number;
  min: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}

function NumberExerciseField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: NumberExerciseFieldProps) {
  return (
    <label className="text-sm text-slate-400">
      {label}
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => {
          const parsed = Number(event.target.value);
          if (Number.isFinite(parsed)) onChange(parsed);
        }}
        className="mt-1 min-h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-base text-white outline-none focus:border-emerald-400"
      />
    </label>
  );
}
