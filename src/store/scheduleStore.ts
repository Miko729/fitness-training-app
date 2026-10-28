import dayjs from "dayjs";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  generateWeeklySchedule,
  getWeekInfoForDate,
} from "../data/monthlyCycleTemplate";
import type {
  DailyScheduleItem,
  ScheduleDay,
} from "../types";

const STORAGE_KEY = "schedule-store";

export type TodayReplacementModuleId =
  | "cardio-walk"
  | "full-rest";

function createScheduleForDate(
  date: string,
  cycleStartDate = dates.todayDate,
  deferredScheduleItems: DailyScheduleItem[] = [],
  suppressedScheduleSlots: string[] = [],
): DailyScheduleItem[] {
  const templatesForDate = (targetDate: string) =>
    generateWeeklySchedule(
      getWeekInfoForDate(cycleStartDate, targetDate).week,
      targetDate,
    ).filter((item) => item.date === targetDate);
  const todaysTemplates = templatesForDate(date);
  const suppressedSlots = new Set(suppressedScheduleSlots);
  const scheduledTemplates = todaysTemplates
    .filter(
      (item) =>
        !suppressedSlots.has(getScheduleSlotKey(date, item.timeSlot)),
    )
    .map((item, index): DailyScheduleItem => ({
      id: `${date}-${index}-${item.moduleId}`,
      date,
      moduleId: item.moduleId,
      name: item.name,
      exerciseSelections: item.exerciseSelections,
      isFixed: item.isFixed,
      timeSlot: item.timeSlot,
      estimatedDurationMinutes: item.estimatedDurationMinutes,
      trainingLoadProfile: item.trainingLoadProfile,
      status: "pending",
    }));
  const deferredForDate = deferredScheduleItems.filter(
    (item) => item.date === date,
  );

  return [...scheduledTemplates, ...deferredForDate];
}

function getScheduleSlotKey(date: string, timeSlot?: string): string {
  return `${date}|${timeSlot ?? "全天"}`;
}

function isFixedScheduleItem(
  item: DailyScheduleItem,
  cycleStartDate = useScheduleStore.getState().cycleStartDate,
): boolean {
  if (item.isFixed !== undefined) return item.isFixed;

  return generateWeeklySchedule(
    getWeekInfoForDate(cycleStartDate, item.date).week,
    item.date,
  ).some(
    (template) =>
      template.timeSlot === item.timeSlot && template.isFixed,
  );
}

function isPendingScheduleItem(item: DailyScheduleItem): boolean {
  return item.status === undefined || item.status === "pending";
}

interface ScheduleStore {
  cycleStartDate: string;
  todayDate: string;
  tomorrowDate: string;
  todaySchedule: DailyScheduleItem[];
  tomorrowSchedule: DailyScheduleItem[];
  deferredScheduleItems: DailyScheduleItem[];
  suppressedScheduleSlots: string[];
  setCycleStartDate: (date: string) => void;
  getTodaySchedule: () => DailyScheduleItem[];
  getTomorrowSchedule: () => DailyScheduleItem[];
  postponeAllFromToday: (scheduleItemIds?: string[]) => void;
  swapTodayAndTomorrow: (reason?: string) => void;
  completeSchedule: (scheduleItemId: string) => void;
  replaceSchedule: (
    day: ScheduleDay,
    moduleId: string,
    reason: string,
    scheduleItemId?: string,
  ) => void;
  updateScheduleTime: (
    day: ScheduleDay,
    scheduleItemId: string,
    timeSlot: string,
  ) => void;
  swapScheduleItems: (
    day: ScheduleDay,
    scheduleItemId: string,
    otherScheduleItemId: string,
    reason: string,
  ) => void;
  addCustomSchedule: (
    day: ScheduleDay,
    item: Omit<DailyScheduleItem, "id" | "date" | "isFixed" | "isCustom">,
  ) => void;
  replaceTodayWith: (
    moduleId: TodayReplacementModuleId,
    reason?: string,
  ) => void;
}

function currentDates() {
  const today = dayjs();
  return {
    todayDate: today.format("YYYY-MM-DD"),
    tomorrowDate: today.add(1, "day").format("YYYY-MM-DD"),
  };
}

const dates = currentDates();

function reconcileSchedule(
  date: string,
  cycleStartDate: string,
  existing: DailyScheduleItem[],
  deferredScheduleItems: DailyScheduleItem[],
  suppressedScheduleSlots: string[],
): DailyScheduleItem[] {
  const generated = createScheduleForDate(
    date,
    cycleStartDate,
    deferredScheduleItems,
    suppressedScheduleSlots,
  );
  const previousItems = [...existing];
  const reconciled = generated.map((item) => {
    const previousIndex = previousItems.findIndex(
      (previous) =>
        previous.id === item.id ||
        (previous.date === date &&
          previous.timeSlot === item.timeSlot &&
          previous.moduleId === item.moduleId),
    );
    if (previousIndex < 0) return item;
    const [previous] = previousItems.splice(previousIndex, 1);
    return {
      ...item,
      id: previous.id,
      status: previous.status,
      updatedAt: previous.updatedAt,
    };
  });

  return [...reconciled, ...previousItems];
}

function moveDuplicateSlotsToDeferred(
  date: string,
  items: DailyScheduleItem[],
  cycleStartDate: string,
  deferredScheduleItems: DailyScheduleItem[],
  suppressedScheduleSlots: string[],
): DailyScheduleItem[] {
  const isFixedForCycle = (item: DailyScheduleItem) =>
    isFixedScheduleItem(item, cycleStartDate);
  const sortedItems = [...items].sort(
    (first, second) =>
      Number(isFixedForCycle(second)) - Number(isFixedForCycle(first)) ||
      Number(Boolean(first.adjustType)) - Number(Boolean(second.adjustType)),
  );
  const occupiedSlots = new Set<string>();
  const uniqueItems: DailyScheduleItem[] = [];

  for (const item of sortedItems) {
    const slotKey = getScheduleSlotKey(date, item.timeSlot);
    if (!occupiedSlots.has(slotKey)) {
      occupiedSlots.add(slotKey);
      uniqueItems.push(item);
      continue;
    }

    if (isFixedForCycle(item)) {
      uniqueItems.push(item);
      continue;
    }

    let targetDate = dayjs(date).add(1, "day").format("YYYY-MM-DD");
    let deferred = false;
    for (let attempt = 0; attempt < 28; attempt += 1) {
      const targetSchedule = createScheduleForDate(
        targetDate,
        cycleStartDate,
        deferredScheduleItems,
        suppressedScheduleSlots,
      );
      if (
        targetSchedule.some(
          (scheduled) => scheduled.timeSlot === item.timeSlot,
        )
      ) {
        targetDate = dayjs(targetDate)
          .add(1, "day")
          .format("YYYY-MM-DD");
        continue;
      }

      deferredScheduleItems.push({
        ...item,
        id: `${targetDate}-postponed-${item.id}`,
        date: targetDate,
        isFixed: false,
        originalModuleId: item.originalModuleId ?? item.moduleId,
        adjustType: "deferred",
        adjustReason: "迁移时发现时段冲突，已移至最近空闲日程",
        status: "pending",
      });
      deferred = true;
      break;
    }

    if (!deferred) {
      throw new Error(
        `无法为“${item.name ?? item.moduleId}”找到未来 28 天内可安排的时段。`,
      );
    }
  }

  return uniqueItems;
}

function refreshSchedules(
  state: ScheduleStore,
): Pick<
  ScheduleStore,
  | "todayDate"
  | "tomorrowDate"
  | "todaySchedule"
  | "tomorrowSchedule"
  | "deferredScheduleItems"
  | "suppressedScheduleSlots"
> {
  const dates = currentDates();
  if (
    state.todayDate === dates.todayDate &&
    state.tomorrowDate === dates.tomorrowDate
  ) {
    return {
      todayDate: state.todayDate,
      tomorrowDate: state.tomorrowDate,
      todaySchedule: state.todaySchedule,
      tomorrowSchedule: state.tomorrowSchedule,
      deferredScheduleItems: state.deferredScheduleItems,
      suppressedScheduleSlots: state.suppressedScheduleSlots,
    };
  }

  return {
    ...dates,
    deferredScheduleItems: state.deferredScheduleItems.filter(
      (item) => !dayjs(item.date).isBefore(dates.todayDate, "day"),
    ),
    suppressedScheduleSlots: state.suppressedScheduleSlots.filter((slot) => {
      const [date] = slot.split("|");
      return date !== undefined && !dayjs(date).isBefore(dates.todayDate, "day");
    }),
    todaySchedule: reconcileSchedule(
      dates.todayDate,
      state.cycleStartDate,
      state.tomorrowSchedule,
      state.deferredScheduleItems,
      state.suppressedScheduleSlots,
    ),
    tomorrowSchedule: createScheduleForDate(
      dates.tomorrowDate,
      state.cycleStartDate,
      state.deferredScheduleItems,
      state.suppressedScheduleSlots,
    ),
  };
}

export const useScheduleStore = create<ScheduleStore>()(
  persist(
    (set, get) => ({
      cycleStartDate: dates.todayDate,
      ...dates,
      deferredScheduleItems: [],
      suppressedScheduleSlots: [],
      todaySchedule: createScheduleForDate(
        dates.todayDate,
        dates.todayDate,
      ),
      tomorrowSchedule: createScheduleForDate(
        dates.tomorrowDate,
        dates.todayDate,
      ),

      setCycleStartDate: (cycleStartDate) => {
        getWeekInfoForDate(cycleStartDate, cycleStartDate);
        const state = get();
        const schedules = refreshSchedules(state);
        set({
          ...schedules,
          cycleStartDate,
          todaySchedule: reconcileSchedule(
            schedules.todayDate,
            cycleStartDate,
            schedules.todaySchedule,
            schedules.deferredScheduleItems,
            schedules.suppressedScheduleSlots,
          ),
          tomorrowSchedule: reconcileSchedule(
            schedules.tomorrowDate,
            cycleStartDate,
            schedules.tomorrowSchedule,
            schedules.deferredScheduleItems,
            schedules.suppressedScheduleSlots,
          ),
        });
      },

      getTodaySchedule: () => {
        const schedules = refreshSchedules(get());
        if (
          schedules.todayDate !== get().todayDate ||
          schedules.tomorrowDate !== get().tomorrowDate
        ) {
          set(schedules);
        }
        return schedules.todaySchedule;
      },

      getTomorrowSchedule: () => {
        const schedules = refreshSchedules(get());
        if (
          schedules.todayDate !== get().todayDate ||
          schedules.tomorrowDate !== get().tomorrowDate
        ) {
          set(schedules);
        }
        return schedules.tomorrowSchedule;
      },

      postponeAllFromToday: (scheduleItemIds) => {
        const schedules = refreshSchedules(get());
        const updatedAt = dayjs().toISOString();
        const selectedToday = schedules.todaySchedule.filter(
          (item) =>
            isPendingScheduleItem(item) &&
            (scheduleItemIds === undefined || scheduleItemIds.includes(item.id)),
        );
        if (selectedToday.length === 0) return;

        const deferredScheduleItems = [...schedules.deferredScheduleItems];
        const suppressedScheduleSlots = new Set(
          schedules.suppressedScheduleSlots,
        );
        const queue = selectedToday.map((item) => ({
          item,
          targetDate: dayjs(schedules.todayDate)
            .add(1, "day")
            .format("YYYY-MM-DD"),
        }));

        while (queue.length > 0) {
          const next = queue.shift();
          if (!next) break;

          let targetDate = next.targetDate;
          let placed = false;
          for (let attempt = 0; attempt < 28; attempt += 1) {
            const targetSchedule =
              targetDate === schedules.tomorrowDate
                ? schedules.tomorrowSchedule
                : createScheduleForDate(
                    targetDate,
                    get().cycleStartDate,
                    deferredScheduleItems,
                    [...suppressedScheduleSlots],
                  );
            const matchingSlot = targetSchedule.filter(
              (item) => item.timeSlot === next.item.timeSlot,
            );
            if (
              targetSchedule.some(
                (item) =>
                  item.timeSlot === next.item.timeSlot &&
                  isFixedScheduleItem(item),
              )
            ) {
              targetDate = dayjs(targetDate)
                .add(1, "day")
                .format("YYYY-MM-DD");
              continue;
            }

            if (matchingSlot.length > 0) {
              suppressedScheduleSlots.add(
                getScheduleSlotKey(targetDate, next.item.timeSlot),
              );
              for (const displacedItem of matchingSlot) {
                const deferredIndex = deferredScheduleItems.findIndex(
                  (item) =>
                    item.id === displacedItem.id &&
                    item.date === displacedItem.date,
                );
                if (deferredIndex >= 0) {
                  deferredScheduleItems.splice(deferredIndex, 1);
                }
                queue.push({
                  item: displacedItem,
                  targetDate: dayjs(targetDate)
                    .add(1, "day")
                    .format("YYYY-MM-DD"),
                });
              }
            }

            const movedItem: DailyScheduleItem = {
              ...next.item,
              id: `${targetDate}-postponed-${next.item.id}`,
              date: targetDate,
              isFixed: false,
              originalModuleId:
                next.item.originalModuleId ?? next.item.moduleId,
              adjustType:
                targetDate ===
                dayjs(schedules.todayDate).add(1, "day").format("YYYY-MM-DD")
                  ? "tomorrow"
                  : "deferred",
              status: "pending",
              adjustReason:
                targetDate === dayjs(schedules.todayDate).add(1, "day").format("YYYY-MM-DD")
                  ? "用户选择顺延一天"
                  : "因时段冲突，与后续安排依次顺延",
              updatedAt,
            };
            deferredScheduleItems.push(movedItem);
            placed = true;
            break;
          }

          if (!placed) {
            throw new Error(
              `无法为“${next.item.name ?? next.item.moduleId}”找到未来 28 天内可安排的时段。`,
            );
          }
        }

        const selectedIds = new Set(selectedToday.map((item) => item.id));
        const skippedToday = schedules.todaySchedule.map((item) =>
          selectedIds.has(item.id)
            ? {
                ...item,
                status: "skipped" as const,
                adjustReason: "已顺延，冲突安排依次后移",
                updatedAt,
              }
            : item,
        );

        set({
          ...schedules,
          todaySchedule: skippedToday,
          deferredScheduleItems,
          suppressedScheduleSlots: [...suppressedScheduleSlots],
          tomorrowSchedule: createScheduleForDate(
            schedules.tomorrowDate,
            get().cycleStartDate,
            deferredScheduleItems,
            [...suppressedScheduleSlots],
          ),
        });
      },

      swapTodayAndTomorrow: (reason = "与另一天的训练安排对调") => {
        const schedules = refreshSchedules(get());
        const updatedAt = dayjs().toISOString();
        const matchedTomorrowIndexes = new Set<number>();
        const todayItems = [...schedules.todaySchedule];
        const tomorrowItems = [...schedules.tomorrowSchedule];

        todayItems.forEach((todayItem, todayIndex) => {
          let tomorrowIndex = tomorrowItems.findIndex(
            (tomorrowItem, index) =>
              !matchedTomorrowIndexes.has(index) &&
              todayItem.timeSlot !== undefined &&
              tomorrowItem.timeSlot === todayItem.timeSlot,
          );

          if (
            tomorrowIndex < 0 &&
            todayIndex < tomorrowItems.length &&
            !matchedTomorrowIndexes.has(todayIndex)
          ) {
            tomorrowIndex = todayIndex;
          }
          if (tomorrowIndex < 0) return;

          matchedTomorrowIndexes.add(tomorrowIndex);
          const tomorrowItem = tomorrowItems[tomorrowIndex];
          todayItems[todayIndex] = {
            ...todayItem,
            moduleId: tomorrowItem.moduleId,
            name: tomorrowItem.name,
            exerciseSelections: tomorrowItem.exerciseSelections,
            functionalSlot: tomorrowItem.functionalSlot,
            originalModuleId: todayItem.originalModuleId ?? todayItem.moduleId,
            adjustType: "swap",
            adjustReason: reason,
            updatedAt,
          };
          tomorrowItems[tomorrowIndex] = {
            ...tomorrowItem,
            moduleId: todayItem.moduleId,
            name: todayItem.name,
            exerciseSelections: todayItem.exerciseSelections,
            functionalSlot: todayItem.functionalSlot,
            originalModuleId:
              tomorrowItem.originalModuleId ?? tomorrowItem.moduleId,
            adjustType: "swap",
            adjustReason: reason,
            updatedAt,
          };
        });

        set({
          ...schedules,
          todaySchedule: todayItems,
          tomorrowSchedule: tomorrowItems,
        });
      },

      completeSchedule: (scheduleItemId) => {
        const schedules = refreshSchedules(get());
        const updatedAt = dayjs().toISOString();
        const complete = (items: DailyScheduleItem[]) =>
          items.map((item) =>
            item.id === scheduleItemId
              ? { ...item, status: "completed" as const, updatedAt }
              : item,
          );

        set({
          ...schedules,
          todaySchedule: complete(schedules.todaySchedule),
          tomorrowSchedule: complete(schedules.tomorrowSchedule),
        });
      },

      replaceSchedule: (day, moduleId, reason, scheduleItemId) => {
        const schedules = refreshSchedules(get());
        const isToday = day === "today";
        const targetSchedule = isToday
          ? schedules.todaySchedule
          : schedules.tomorrowSchedule;
        const targetDate = isToday
          ? schedules.todayDate
          : schedules.tomorrowDate;
        const targetIndex = scheduleItemId
          ? targetSchedule.findIndex((item) => item.id === scheduleItemId)
          : targetSchedule.length > 0
            ? 0
            : -1;

        if (scheduleItemId && targetIndex < 0) {
          throw new Error(`Schedule item "${scheduleItemId}" was not found.`);
        }

        const updatedAt = dayjs().toISOString();
        const replacement: DailyScheduleItem[] =
          targetIndex >= 0
            ? targetSchedule.map((item, index) =>
                index === targetIndex
                  ? {
                      ...item,
                      moduleId,
                      name: undefined,
                      exerciseSelections: undefined,
                      functionalSlot: undefined,
                      originalModuleId: item.moduleId,
                      adjustType: "replace",
                      adjustReason: reason,
                      updatedAt,
                    }
                  : item,
              )
            : [
                {
                  id: `${targetDate}-replacement-${moduleId}`,
                  date: targetDate,
                  moduleId,
                  timeSlot: "全天",
                  adjustType: "replace",
                  adjustReason: reason,
                  updatedAt,
                },
              ];

        set({
          ...schedules,
          ...(isToday
            ? { todaySchedule: replacement }
            : { tomorrowSchedule: replacement }),
        });
      },

      updateScheduleTime: (day, scheduleItemId, timeSlot) => {
        const schedules = refreshSchedules(get());
        const scheduleKey =
          day === "today" ? "todaySchedule" : "tomorrowSchedule";
        const schedule = schedules[scheduleKey];
        if (!schedule.some((item) => item.id === scheduleItemId)) {
          throw new Error(`Schedule item "${scheduleItemId}" was not found.`);
        }
        set({
          ...schedules,
          [scheduleKey]: schedule.map((item) =>
            item.id === scheduleItemId
              ? {
                  ...item,
                  timeSlot,
                  isFixed: false,
                  updatedAt: dayjs().toISOString(),
                  adjustReason: "临时调整训练时间",
                }
              : item,
          ),
        });
      },

      swapScheduleItems: (day, scheduleItemId, otherScheduleItemId, reason) => {
        const schedules = refreshSchedules(get());
        const sourceKey =
          day === "today" ? "todaySchedule" : "tomorrowSchedule";
        const targetKey =
          day === "today" ? "tomorrowSchedule" : "todaySchedule";
        const sourceItems = [...schedules[sourceKey]];
        const targetItems = [...schedules[targetKey]];
        const sourceIndex = sourceItems.findIndex(
          (item) => item.id === scheduleItemId,
        );
        const targetIndex = targetItems.findIndex(
          (item) => item.id === otherScheduleItemId,
        );
        if (sourceIndex < 0 || targetIndex < 0) {
          throw new Error("无法对调：找不到所选的日程安排。");
        }

        const sourceItem = sourceItems[sourceIndex];
        const targetItem = targetItems[targetIndex];
        const updatedAt = dayjs().toISOString();
        const swapContents = (
          item: DailyScheduleItem,
          other: DailyScheduleItem,
        ): DailyScheduleItem => ({
          ...item,
          moduleId: other.moduleId,
          name: other.name,
          exerciseSelections: other.exerciseSelections,
          functionalSlot: other.functionalSlot,
          isCustom: other.isCustom,
          estimatedDurationMinutes: other.estimatedDurationMinutes,
          timeSlot: other.timeSlot,
          isFixed: false,
          originalModuleId: item.originalModuleId ?? item.moduleId,
          adjustType: "swap",
          adjustReason: reason,
          updatedAt,
        });

        sourceItems[sourceIndex] = swapContents(sourceItem, targetItem);
        targetItems[targetIndex] = swapContents(targetItem, sourceItem);
        set({
          ...schedules,
          [sourceKey]: sourceItems,
          [targetKey]: targetItems,
        });
      },

      addCustomSchedule: (day, item) => {
        const schedules = refreshSchedules(get());
        const isToday = day === "today";
        const scheduleKey = isToday ? "todaySchedule" : "tomorrowSchedule";
        const date = isToday ? schedules.todayDate : schedules.tomorrowDate;
        const id =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        set({
          ...schedules,
          [scheduleKey]: [
            ...schedules[scheduleKey],
            {
              ...item,
              id: `${date}-custom-${id}`,
              date,
              isFixed: false,
              isCustom: true,
              status: "pending",
            },
          ],
        });
      },

      replaceTodayWith: (
        moduleId,
        reason = "今天的安排替换为有氧或休息",
      ) => {
        get().replaceSchedule("today", moduleId, reason);
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 12,
      migrate: (persistedState, version) => {
        const persisted = persistedState as Partial<
          Pick<
            ScheduleStore,
            | "cycleStartDate"
            | "todayDate"
            | "tomorrowDate"
            | "todaySchedule"
            | "tomorrowSchedule"
            | "deferredScheduleItems"
            | "suppressedScheduleSlots"
          >
        >;
        const cycleStartDate =
          persisted.cycleStartDate ?? dates.todayDate;
        const deferredScheduleItems = persisted.deferredScheduleItems ?? [];
        const suppressedScheduleSlots = persisted.suppressedScheduleSlots ?? [];
        if (version >= 12) {
          return {
            ...persisted,
            deferredScheduleItems,
            suppressedScheduleSlots,
          } as ScheduleStore;
        }
        const migrateSchedule = (
          date: string | undefined,
          items: DailyScheduleItem[] | undefined,
        ) => {
          if (!date || !items) return items;
          const reconciled = reconcileSchedule(
                date,
                cycleStartDate,
                items,
                deferredScheduleItems,
                suppressedScheduleSlots,
          );
          return moveDuplicateSlotsToDeferred(
            date,
            reconciled,
            cycleStartDate,
            deferredScheduleItems,
            suppressedScheduleSlots,
          );
        };

        return {
          ...persisted,
          cycleStartDate,
          deferredScheduleItems,
          suppressedScheduleSlots,
          todaySchedule: migrateSchedule(
              persisted.todayDate,
              persisted.todaySchedule,
          ),
          tomorrowSchedule: migrateSchedule(
            persisted.tomorrowDate,
            persisted.tomorrowSchedule,
          ),
        };
      },
      partialize: (state) => ({
        cycleStartDate: state.cycleStartDate,
        todayDate: state.todayDate,
        tomorrowDate: state.tomorrowDate,
        todaySchedule: state.todaySchedule,
        tomorrowSchedule: state.tomorrowSchedule,
        deferredScheduleItems: state.deferredScheduleItems,
        suppressedScheduleSlots: state.suppressedScheduleSlots,
      }),
    },
  ),
);
