import { useState } from "react";
import { useExerciseLibraryStore } from "../store/exerciseLibraryStore";
import type { Exercise } from "../types";
import GifPlayer from "./GifPlayer";
import SetCheckIn from "./SetCheckIn";

export interface ExerciseSetDraft {
  weight: string;
  reps: string;
  rpe: string;
  actualExerciseName?: string;
  completed: boolean;
}

export interface ExerciseCardProps {
  exercise: Exercise;
  sets: ExerciseSetDraft[];
  activeSetIndex?: number;
  selectedExerciseName?: string;
  disabled?: boolean;
  onSetChange: (setIndex: number, value: ExerciseSetDraft) => void;
  onAlternativeChange: (exerciseName: string) => void;
}

function normalizeExerciseName(name: string): string {
  return name.toLocaleLowerCase().replace(/[\s/／()（）·_-]/g, "");
}

export default function ExerciseCard({
  exercise,
  sets,
  activeSetIndex,
  selectedExerciseName,
  disabled = false,
  onSetChange,
  onAlternativeChange,
}: ExerciseCardProps) {
  const currentExerciseName = selectedExerciseName ?? exercise.name;
  const libraryExercises = useExerciseLibraryStore((state) => state.exercises);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const libraryNameCandidates = [
    currentExerciseName,
    ...exercise.name.split(/[\/／]/),
  ].map(normalizeExerciseName);
  const libraryExercise =
    libraryExercises.find((item) => item.id === exercise.id) ??
    libraryExercises.find((item) =>
      libraryNameCandidates.includes(normalizeExerciseName(item.name)),
    );
  const demonstrationTitle = currentExerciseName;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-lg shadow-black/10">
      <header className="p-4 sm:p-5">
        <h2 className="text-xl font-bold tracking-tight text-white">
          {exercise.name}
        </h2>
        {currentExerciseName !== exercise.name && (
          <p className="mt-1 text-sm text-emerald-300">
            本次选择：{currentExerciseName}
          </p>
        )}
        <div className="mt-4">
          <GifPlayer
            exerciseId={libraryExercise?.id ?? exercise.id}
            gifUrl={
              libraryExercise?.gifUrl ??
              libraryExercise?.imageUrl ??
              exercise.gifUrl ??
              exercise.imageUrl
            }
            title={demonstrationTitle}
            targetBodyPart={
              libraryExercise?.targetBodyPart ?? exercise.targetBodyPart
            }
            canExpand
          />
        </div>

        <section
          aria-label={`${exercise.name}动作说明`}
          className="mt-4 space-y-3"
        >
          <div>
            <p className="mb-1 text-xs font-medium text-slate-500">
              🎯 目标部位
            </p>
            <span className="inline-flex max-w-full rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm font-medium text-emerald-200">
              {exercise.targetBodyPart}
            </span>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-slate-500">
              💡 训练目的
            </p>
            <p className="text-sm leading-relaxed text-slate-300">
              {exercise.purpose}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-slate-500">
              ⚠️ 注意事项
            </p>
            <p
              className={`text-sm leading-relaxed text-slate-400 ${
                notesExpanded ? "" : "line-clamp-2"
              }`}
            >
              {exercise.notes}
            </p>
            {exercise.notes.length > 80 && (
              <button
                type="button"
                onClick={() => setNotesExpanded((expanded) => !expanded)}
                aria-expanded={notesExpanded}
                className="mt-1 min-h-9 text-sm font-medium text-emerald-300 hover:text-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              >
                {notesExpanded ? "收起" : "展开"}
              </button>
            )}
          </div>
          <p className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-semibold text-slate-200">
            🏋️ 计划{" "}
            {exercise.plannedReps.includes("分钟")
              ? exercise.plannedReps
              : `${exercise.plannedSets} 组 × ${exercise.plannedReps} 次`}
            <span className="mx-2 text-slate-600">|</span>
            RPE {exercise.rpe}
          </p>
        </section>

        <div className="mt-4 flex flex-col gap-3">
          {exercise.referenceVideoUrl && (
            <a
              href={exercise.referenceVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 items-center rounded-xl text-sm font-semibold text-emerald-300 underline decoration-emerald-500/50 underline-offset-4 hover:text-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              📺 查看动作教学
            </a>
          )}
          {exercise.alternativeExercises &&
            exercise.alternativeExercises.length > 0 && (
              <label className="block text-sm font-medium text-slate-300">
                🔄 切换为替代动作
                <select
                  value={currentExerciseName}
                  disabled={disabled}
                  onChange={(event) => onAlternativeChange(event.target.value)}
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-base text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 disabled:opacity-50"
                >
                  <option value={exercise.name}>保持主选动作</option>
                  {exercise.alternativeExercises.map((alternative) => (
                    <option key={alternative} value={alternative}>
                      {alternative}
                    </option>
                  ))}
                </select>
              </label>
            )}
        </div>
      </header>

      <div className="space-y-3 border-t border-slate-800 bg-slate-950/40 p-4 sm:p-5">
        {sets.map((set, index) => (
          <SetCheckIn
            key={index}
            set={set}
            index={index}
            isActive={index === activeSetIndex}
            disabled={disabled}
            targetRpe={exercise.rpe}
            actualExerciseName={set.actualExerciseName}
            onChange={(value) => onSetChange(index, value)}
          />
        ))}
        <p className="pt-1 text-xs text-slate-500">
          组间休息：{exercise.restTime} 秒
        </p>
      </div>
    </article>
  );
}
