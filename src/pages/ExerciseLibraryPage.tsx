import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import BottomNavigation from "../components/BottomNavigation";
import GifPlayer from "../components/GifPlayer";
import { useExerciseLibraryStore } from "../store/exerciseLibraryStore";
import type { Exercise } from "../types";

type ExerciseForm = Pick<
  Exercise,
  | "name"
  | "targetBodyPart"
  | "purpose"
  | "alternativeExercises"
  | "referenceVideoUrl"
  | "notes"
  | "gifUrl"
>;

const emptyForm: ExerciseForm = {
  name: "",
  targetBodyPart: "",
  purpose: "",
  alternativeExercises: [],
  referenceVideoUrl: "",
  notes: "",
  gifUrl: "",
};

function createExerciseId(): string {
  return `exercise-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toForm(exercise: Exercise): ExerciseForm {
  return {
    name: exercise.name,
    targetBodyPart: exercise.targetBodyPart,
    purpose: exercise.purpose,
    alternativeExercises: exercise.alternativeExercises ?? [],
    referenceVideoUrl: exercise.referenceVideoUrl ?? "",
    notes: exercise.notes,
    gifUrl: exercise.gifUrl ?? exercise.imageUrl ?? "",
  };
}

function isValidHttpUrl(value: string, required = false): boolean {
  if (!value.trim()) return !required;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getExerciseGroup(exercise: Exercise): string {
  const bodyPart = exercise.targetBodyPart;
  if (bodyPart.includes("肩袖") || bodyPart.includes("全身张力")) {
    return "专项与防伤";
  }
  if (bodyPart.includes("胸")) return "胸部训练";
  if (
    bodyPart.includes("背阔") ||
    bodyPart.includes("上背") ||
    bodyPart.includes("下背")
  ) {
    return "背部训练";
  }
  if (bodyPart.includes("股四头")) return "腿部前侧";
  if (bodyPart.includes("臀") || bodyPart.includes("腘绳")) {
    return "腿部后侧与臀部";
  }
  if (bodyPart.includes("小腿")) return "小腿训练";
  if (bodyPart.includes("三角肌")) return "肩部训练";
  if (bodyPart.includes("肱")) return "手臂训练";
  if (
    bodyPart.includes("核心") ||
    bodyPart.includes("下腹") ||
    bodyPart.includes("深层")
  ) {
    return "核心训练";
  }
  return "专项与防伤";
}

const exerciseGroupOrder = [
  "胸部训练",
  "背部训练",
  "腿部前侧",
  "腿部后侧与臀部",
  "小腿训练",
  "肩部训练",
  "手臂训练",
  "核心训练",
  "专项与防伤",
];

function getExerciseTip(exercise: Exercise): string {
  return exercise.notes.match(/^.*?[。！？]/)?.[0] ?? exercise.purpose;
}

function parseExerciseImport(value: unknown): Exercise[] {
  if (!Array.isArray(value)) {
    throw new Error("JSON 顶层必须是动作数组。");
  }

  const seenIds = new Set<string>();
  return value.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`第 ${index + 1} 项不是有效动作对象。`);
    }

    const exercise = item as Partial<Exercise>;
    if (
      typeof exercise.id !== "string" ||
      !exercise.id.trim() ||
      typeof exercise.name !== "string" ||
      !exercise.name.trim() ||
      typeof exercise.targetBodyPart !== "string" ||
      typeof exercise.purpose !== "string" ||
      typeof exercise.notes !== "string" ||
      typeof exercise.plannedReps !== "string" ||
      typeof exercise.plannedSets !== "number" ||
      !Number.isInteger(exercise.plannedSets) ||
      exercise.plannedSets < 1 ||
      typeof exercise.rpe !== "number" ||
      !Number.isFinite(exercise.rpe) ||
      exercise.rpe < 1 ||
      exercise.rpe > 10 ||
      typeof exercise.restTime !== "number" ||
      !Number.isFinite(exercise.restTime) ||
      exercise.restTime < 0
    ) {
      throw new Error(`第 ${index + 1} 项缺少有效的动作必需字段。`);
    }

    if (seenIds.has(exercise.id)) {
      throw new Error(`动作 ID 重复：${exercise.id}`);
    }
    seenIds.add(exercise.id);
    return exercise as Exercise;
  });
}

export default function ExerciseLibraryPage() {
  const exercises = useExerciseLibraryStore((state) => state.exercises);
  const addExercise = useExerciseLibraryStore((state) => state.addExercise);
  const importExercises = useExerciseLibraryStore(
    (state) => state.importExercises,
  );
  const updateExercise = useExerciseLibraryStore(
    (state) => state.updateExercise,
  );
  const deleteExercise = useExerciseLibraryStore(
    (state) => state.deleteExercise,
  );
  const resetExerciseLibrary = useExerciseLibraryStore(
    (state) => state.resetExerciseLibrary,
  );

  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(
    null,
  );
  const [expandedGroups, setExpandedGroups] = useState<string[]>([
    "胸部训练",
    "背部训练",
  ]);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<ExerciseForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [isReplacingGif, setIsReplacingGif] = useState(false);
  const [replacementGifUrl, setReplacementGifUrl] = useState("");
  const [replacementError, setReplacementError] = useState("");
  const [toast, setToast] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selectedExercise = exercises.find(
    (exercise) => exercise.id === selectedExerciseId,
  );
  const groupedExercises = useMemo(() => {
    const groups = new Map<string, Exercise[]>();
    for (const exercise of exercises) {
      const group = getExerciseGroup(exercise);
      const groupExercises = groups.get(group) ?? [];
      groupExercises.push(exercise);
      groups.set(group, groupExercises);
    }

    return [...groups.entries()].sort(
      ([first], [second]) =>
        exerciseGroupOrder.indexOf(first) - exerciseGroupOrder.indexOf(second),
    );
  }, [exercises]);

  const toggleGroup = (group: string) => {
    setExpandedGroups((current) =>
      current.includes(group)
        ? current.filter((item) => item !== group)
        : [...current, group],
    );
  };

  const openAddForm = () => {
    setSelectedExerciseId(null);
    setEditingExercise(null);
    setForm(emptyForm);
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditForm = (exercise: Exercise) => {
    setSelectedExerciseId(null);
    setEditingExercise(exercise);
    setForm(toForm(exercise));
    setFormError("");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingExercise(null);
    setFormError("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = form.name.trim();
    const targetBodyPart = form.targetBodyPart.trim();
    const purpose = form.purpose.trim();
    const referenceVideoUrl = form.referenceVideoUrl?.trim() ?? "";
    const gifUrl = form.gifUrl?.trim() ?? "";

    if (!name || !targetBodyPart || !purpose) {
      setFormError("请填写动作名称、目标部位和训练目的。");
      return;
    }
    if (!isValidHttpUrl(referenceVideoUrl)) {
      setFormError("教学链接必须是有效的 HTTP 或 HTTPS 地址。");
      return;
    }
    if (!isValidHttpUrl(gifUrl)) {
      setFormError("配图链接必须是有效的 HTTP 或 HTTPS 地址。");
      return;
    }

    const exerciseData: ExerciseForm = {
      name,
      targetBodyPart,
      purpose,
      alternativeExercises: (form.alternativeExercises ?? [])
        .map((alternative) => alternative.trim())
        .filter(Boolean),
      referenceVideoUrl,
      notes: form.notes.trim(),
      gifUrl,
    };

    if (editingExercise) {
      updateExercise(editingExercise.id, {
        ...exerciseData,
        imageUrl: undefined,
      });
    } else {
      addExercise({
        ...exerciseData,
        id: createExerciseId(),
        plannedSets: 3,
        plannedReps: "8-12",
        rpe: 7,
        restTime: 60,
      });
    }
    closeForm();
  };

  const handleReplaceGif = () => {
    if (!selectedExercise) return;
    if (!isValidHttpUrl(replacementGifUrl, true)) {
      setReplacementError("请输入有效的 HTTP 或 HTTPS 图片网址。");
      return;
    }

    updateExercise(selectedExercise.id, {
      gifUrl: replacementGifUrl.trim(),
      imageUrl: undefined,
    });
    setIsReplacingGif(false);
    setReplacementError("");
    setToast({ kind: "success", message: "动作配图已更新。" });
  };

  const handleDelete = (exercise: Exercise) => {
    if (!window.confirm(`确定删除标准动作“${exercise.name}”吗？`)) return;
    deleteExercise(exercise.id);
    setSelectedExerciseId(null);
  };

  const handleReset = () => {
    if (
      !window.confirm(
        "确定清空当前动作库并重新导入 50 个精选动作吗？自定义动作将被删除。",
      )
    ) {
      return;
    }

    try {
      resetExerciseLibrary();
      setSelectedExerciseId(null);
      setExpandedGroups(exerciseGroupOrder);
      setToast({ kind: "success", message: "已重置为 50 个精选动作。" });
    } catch (error) {
      setToast({
        kind: "error",
        message:
          error instanceof Error
            ? `重置失败：${error.message}`
            : "重置失败，请检查浏览器存储设置后重试。",
      });
    }
  };

  const handleExport = () => {
    try {
      const contents = JSON.stringify(exercises, null, 2);
      const blob = new Blob([contents], { type: "application/json" });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `exercise-library-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      setToast({ kind: "success", message: `已导出 ${exercises.length} 个动作。` });
    } catch (error) {
      setToast({
        kind: "error",
        message:
          error instanceof Error ? `导出失败：${error.message}` : "导出动作库失败。",
      });
    }
  };

  const handleImportFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onerror = () => {
      setToast({ kind: "error", message: "读取文件失败，请重新选择 JSON 文件。" });
    };
    reader.onabort = () => {
      setToast({ kind: "error", message: "文件读取已取消，请重试。" });
    };
    reader.onload = () => {
      try {
        const imported = parseExerciseImport(
          JSON.parse(String(reader.result)),
        );
        if (imported.length === 0) {
          throw new Error("文件中没有可导入的动作。");
        }
        importExercises(imported);
        setExpandedGroups(exerciseGroupOrder);
        setToast({
          kind: "success",
          message: `已导入 ${imported.length} 个动作；相同 ID 的动作已更新，其余动作已追加。`,
        });
      } catch (error) {
        setToast({
          kind: "error",
          message:
            error instanceof Error
              ? `导入失败：${error.message}`
              : "导入失败，请检查 JSON 格式和动作字段。",
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <main className="min-h-screen bg-gray-950 px-4 pb-44 pt-8 text-white sm:px-6 sm:pt-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <p className="text-xs font-semibold tracking-[0.2em] text-emerald-400">
            训练配置
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            细分精选动作
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            按肌群精准训练 · 共 {exercises.length} 个动作
          </p>
        </header>

        <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={handleReset}
            className="min-h-12 rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-left text-sm font-semibold text-gray-200 transition hover:border-emerald-500/60 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            🔄 重置精选动作库
          </button>
          <button
            type="button"
            onClick={() => importFileRef.current?.click()}
            className="min-h-12 rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-left text-sm font-semibold text-gray-200 transition hover:border-emerald-500/60 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            📥 导入 JSON
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="min-h-12 rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-left text-sm font-semibold text-gray-200 transition hover:border-emerald-500/60 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            📤 导出 JSON
          </button>
          <input
            ref={importFileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              handleImportFile(file);
              event.currentTarget.value = "";
            }}
          />
        </div>

        {toast && (
          <p
            role={toast.kind === "error" ? "alert" : "status"}
            className={`mb-5 rounded-xl border p-4 text-sm ${
              toast.kind === "error"
                ? "border-red-500/40 bg-red-500/10 text-red-200"
                : "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
            }`}
          >
            {toast.message}
          </p>
        )}

        {groupedExercises.length > 0 ? (
          <div className="space-y-4">
            {groupedExercises.map(([group, groupExercises]) => {
              const isExpanded = expandedGroups.includes(group);
              const panelId = `exercise-group-${exerciseGroupOrder.indexOf(group)}`;

              return (
                <section
                  key={group}
                  className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900"
                >
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={panelId}
                    onClick={() => toggleGroup(group)}
                    className="flex min-h-16 w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-gray-800/70 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-400"
                  >
                    <span className="min-w-0">
                      <span className="block text-base font-bold text-white">
                        {group === "专项与防伤" ? "🛡️" : "💪"} {group}
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        {groupExercises.length} 个动作
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={`text-xl text-gray-400 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    >
                      ⌄
                    </span>
                  </button>

                  {isExpanded && (
                    <div
                      id={panelId}
                      className="grid grid-cols-2 gap-3 border-t border-gray-800 p-3 sm:gap-5 sm:p-4"
                    >
                      {groupExercises.map((exercise) => (
                        <article
                          key={exercise.id}
                          className="min-w-0 overflow-hidden rounded-xl border border-gray-800 bg-gray-950"
                        >
                          <GifPlayer
                            exerciseId={exercise.id}
                            title={exercise.name}
                            targetBodyPart={exercise.targetBodyPart}
                            gifUrl={exercise.gifUrl ?? exercise.imageUrl}
                            canExpand={false}
                          />
                          <div className="p-3">
                            <h2 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-white sm:text-base">
                              {exercise.name}
                            </h2>
                            <span className="mt-2 inline-flex max-w-full truncate rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-200 sm:text-xs">
                              {exercise.targetBodyPart}
                            </span>
                            <p className="mt-2 line-clamp-2 text-xs leading-5 text-gray-400">
                              {getExerciseTip(exercise)}
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setIsReplacingGif(false);
                                setReplacementGifUrl(
                                  exercise.gifUrl ??
                                    exercise.imageUrl ??
                                    "",
                                );
                                setReplacementError("");
                                setSelectedExerciseId(exercise.id);
                              }}
                              className="mt-3 min-h-10 w-full rounded-lg border border-gray-700 text-xs font-semibold text-gray-300 transition hover:border-emerald-400/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                            >
                              查看详情
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        ) : (
          <p className="rounded-2xl border border-gray-800 bg-gray-900 p-6 text-center text-sm text-gray-400">
            动作库为空，点击上方按钮恢复细分精选动作。
          </p>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-800 bg-gray-950/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
        <BottomNavigation activeTab="settings" />
      </div>
      <button
        type="button"
        onClick={openAddForm}
        className="fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-20 mx-auto min-h-14 max-w-3xl rounded-2xl bg-emerald-400 px-5 py-4 text-lg font-bold text-gray-950 shadow-xl shadow-emerald-950/40 hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200"
      >
        + 添加新动作
      </button>

      {selectedExercise && (
        <div
          className="fixed inset-0 z-40 flex items-end bg-black/75"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedExerciseId(null);
              setIsReplacingGif(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="exercise-detail-title"
            className="max-h-[88dvh] w-full overflow-y-auto rounded-t-3xl border border-gray-700 bg-gray-900 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:mx-auto sm:max-w-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-gray-900/95 px-5 py-3 backdrop-blur">
              <span className="text-xs font-semibold tracking-[0.2em] text-emerald-300">
                动作详情
              </span>
              <button
                type="button"
                onClick={() => setSelectedExerciseId(null)}
                aria-label="关闭动作详情"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-2xl text-gray-400 hover:bg-gray-800 hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="space-y-5 px-5 pt-4">
              <GifPlayer
                exerciseId={selectedExercise.id}
                title={selectedExercise.name}
                targetBodyPart={selectedExercise.targetBodyPart}
                gifUrl={selectedExercise.gifUrl ?? selectedExercise.imageUrl}
                className="h-48 w-full"
              />
              <div>
                <h2 id="exercise-detail-title" className="text-2xl font-bold">
                  {selectedExercise.name}
                </h2>
                <p className="mt-2 text-sm font-medium text-emerald-300">
                  {selectedExercise.targetBodyPart}
                </p>
              </div>
              <DetailSection title="训练目的">
                {selectedExercise.purpose}
              </DetailSection>
              <DetailSection title="注意事项">
                {selectedExercise.notes || "暂无注意事项。"}
              </DetailSection>
              <p className="text-xs text-gray-500">
                建议训练：{selectedExercise.plannedSets} 组 ·{" "}
                {selectedExercise.plannedReps} 次 · 组间休息{" "}
                {selectedExercise.restTime} 秒
              </p>

              {isReplacingGif && (
                <div className="space-y-2 rounded-xl border border-gray-700 bg-gray-950 p-4">
                  <label className="block text-sm font-medium text-gray-300">
                    图片或动图网址
                    <input
                      type="url"
                      value={replacementGifUrl}
                      onChange={(event) => {
                        setReplacementGifUrl(event.target.value);
                        setReplacementError("");
                      }}
                      placeholder="粘贴图片或 GIF 网址"
                      className="mt-2 min-h-12 w-full rounded-xl border border-gray-700 bg-gray-900 px-4 text-base text-white placeholder:text-gray-500 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                    />
                  </label>
                  {replacementError && (
                    <p role="alert" className="text-sm text-red-300">
                      {replacementError}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleReplaceGif}
                      className="min-h-11 flex-1 rounded-xl bg-emerald-400 px-4 font-semibold text-gray-950 hover:bg-emerald-300"
                    >
                      保存配图
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsReplacingGif(false)}
                      className="min-h-11 rounded-xl border border-gray-700 px-4 font-semibold text-gray-300 hover:bg-gray-800"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => openEditForm(selectedExercise)}
                  className="min-h-12 rounded-xl border border-gray-600 px-4 font-semibold text-gray-200 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                >
                  编辑动作
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReplacementGifUrl(
                      selectedExercise.gifUrl ??
                        selectedExercise.imageUrl ??
                        "",
                    );
                    setReplacementError("");
                    setIsReplacingGif((value) => !value);
                  }}
                  className="min-h-12 rounded-xl border border-emerald-400/40 px-4 font-semibold text-emerald-200 hover:bg-emerald-400/10 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                >
                  替换配图
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(selectedExercise)}
                className="min-h-11 w-full rounded-xl px-4 text-sm font-semibold text-red-300 hover:bg-red-500/10"
              >
                删除此动作
              </button>
            </div>
          </section>
        </div>
      )}

      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/80 sm:items-center sm:justify-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="exercise-form-title"
            className="max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl border border-gray-700 bg-gray-900 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:max-w-lg sm:rounded-2xl sm:pb-5"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 id="exercise-form-title" className="text-xl font-bold">
                {editingExercise ? "编辑动作" : "添加动作"}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                aria-label="关闭"
                className="flex min-h-12 min-w-12 items-center justify-center rounded-xl text-2xl text-gray-400 hover:bg-gray-800 hover:text-white"
              >
                ×
              </button>
            </div>
            {formError && (
              <p
                role="alert"
                className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300"
              >
                {formError}
              </p>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField
                label="动作名称"
                value={form.name}
                required
                onChange={(name) => setForm((current) => ({ ...current, name }))}
              />
              <FormField
                label="目标部位"
                value={form.targetBodyPart}
                required
                onChange={(targetBodyPart) =>
                  setForm((current) => ({ ...current, targetBodyPart }))
                }
              />
              <FormField
                label="训练目的"
                value={form.purpose}
                required
                multiline
                onChange={(purpose) =>
                  setForm((current) => ({ ...current, purpose }))
                }
              />
              <FormField
                label="注意事项"
                value={form.notes}
                multiline
                onChange={(notes) =>
                  setForm((current) => ({ ...current, notes }))
                }
              />
              <FormField
                label="图片或动图网址"
                value={form.gifUrl ?? ""}
                type="url"
                placeholder="粘贴图片或 GIF 网址"
                onChange={(gifUrl) =>
                  setForm((current) => ({ ...current, gifUrl }))
                }
              />
              <FormField
                label="教学视频网址"
                value={form.referenceVideoUrl ?? ""}
                type="url"
                placeholder="可选"
                onChange={(referenceVideoUrl) =>
                  setForm((current) => ({ ...current, referenceVideoUrl }))
                }
              />
              <button
                type="submit"
                className="min-h-14 w-full rounded-xl bg-emerald-400 px-5 py-4 text-lg font-bold text-gray-950 hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                保存动作
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: string;
}) {
  return (
    <section>
      <h3 className="mb-1 text-xs font-bold tracking-widest text-gray-500">
        {title}
      </h3>
      <p className="whitespace-pre-line text-sm leading-7 text-gray-300">
        {children}
      </p>
    </section>
  );
}

interface FormFieldProps {
  label: string;
  value: string;
  required?: boolean;
  multiline?: boolean;
  type?: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

function FormField({
  label,
  value,
  required = false,
  multiline = false,
  type = "text",
  placeholder,
  onChange,
}: FormFieldProps) {
  const className =
    "mt-2 w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-base text-white placeholder:text-gray-500 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20";

  return (
    <label className="block text-sm font-medium text-gray-300">
      {label}
      {multiline ? (
        <textarea
          value={value}
          required={required}
          rows={3}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={className}
        />
      ) : (
        <input
          type={type}
          value={value}
          required={required}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`${className} min-h-12`}
        />
      )}
    </label>
  );
}
