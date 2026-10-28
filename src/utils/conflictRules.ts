import dayjs from "dayjs";
import {
  generateWeeklySchedule,
  getWeekInfoForDate,
} from "../data/monthlyCycleTemplate";
import { useModuleStore } from "../store/moduleStore";
import { useScheduleStore } from "../store/scheduleStore";
import type { DailyScheduleItem, WorkoutModule } from "../types";

function getScheduleForDate(date: string): DailyScheduleItem[] {
  const store = useScheduleStore.getState();

  if (date === store.todayDate) return store.todaySchedule;
  if (date === store.tomorrowDate) return store.tomorrowSchedule;

  return generateWeeklySchedule(
    getWeekInfoForDate(store.cycleStartDate, date).week,
    date,
  ).filter((item) => item.date === date);
}

function getModule(item: DailyScheduleItem): WorkoutModule | undefined {
  return useModuleStore
    .getState()
    .modules.find((module) => module.id === item.moduleId);
}

function isUpperPull(item: DailyScheduleItem): boolean {
  const module = getModule(item);
  return Boolean(
    module?.category === "strength" &&
      module.exercises.some((exercise) =>
        /背|肱二头/.test(exercise.targetBodyPart),
      ),
  );
}

function isHighIntensity(item: DailyScheduleItem): boolean {
  const module = getModule(item);
  return Boolean(
    module &&
      (module.category === "strength" || module.category === "functional") &&
      module.exercises.some((exercise) => exercise.rpe >= 8),
  );
}

function hasModule(schedule: DailyScheduleItem[], moduleId: string): boolean {
  return schedule.some((item) => item.moduleId === moduleId);
}

export function checkScheduleConflict(item: DailyScheduleItem): string[] {
  const date = dayjs(item.date);
  if (!date.isValid()) return [];

  const dateKey = date.format("YYYY-MM-DD");
  const previousDateKey = date.subtract(1, "day").format("YYYY-MM-DD");
  const nextDateKey = date.add(1, "day").format("YYYY-MM-DD");
  const todaySchedule = getScheduleForDate(dateKey);
  const previousSchedule = getScheduleForDate(previousDateKey);
  const nextSchedule = getScheduleForDate(nextDateKey);
  const currentItems = todaySchedule.some(
    (scheduleItem) => scheduleItem.id === item.id,
  )
    ? todaySchedule
    : [...todaySchedule, item];
  const reminders: string[] = [];
  const isNoonUpperPull = item.timeSlot === "中午" && isUpperPull(item);
  const isIntenseUpperPull = isUpperPull(item) && isHighIntensity(item);

  if (
    isNoonUpperPull &&
    currentItems.some((scheduleItem) =>
      scheduleItem.moduleId.startsWith("climbing"),
    )
  ) {
    reminders.push("今天有攀岩安排，中午不建议进行上肢拉力训练。");
  }

  if (
    isIntenseUpperPull &&
    hasModule(nextSchedule, "recurve-archery") &&
    date.day() !== 5
  ) {
    reminders.push("明天安排了反曲弓射箭，今天不建议进行高强度上肢拉力训练。");
  }

  if (
    item.timeSlot === "中午" &&
    item.moduleId.startsWith("functional-") &&
    currentItems.some(
      (scheduleItem) =>
        scheduleItem.timeSlot === "晚上" &&
        scheduleItem.moduleId.startsWith("climbing"),
    )
  ) {
    reminders.push("今天中午有球类、晚上有攀岩，请注意控制训练强度。");
  }

  const itemIsHighIntensity = isHighIntensity(item);
  const hasAdjacentHighIntensity =
    (previousSchedule.some(isHighIntensity) &&
      currentItems.some(isHighIntensity)) ||
    (currentItems.some(isHighIntensity) &&
      nextSchedule.some(isHighIntensity));

  if (itemIsHighIntensity && hasAdjacentHighIntensity) {
    reminders.push("检测到连续两天高强度训练，建议将其中一天替换为有氧或休息。");
  }

  if (
    date.day() === 5 &&
    isIntenseUpperPull &&
    hasModule(nextSchedule, "recurve-archery")
  ) {
    reminders.push("周五安排了大强度背部训练，可能影响周六射箭表现。");
  }

  return reminders;
}
