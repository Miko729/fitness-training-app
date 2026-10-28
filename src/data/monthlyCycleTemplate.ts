import type {
  DailyScheduleExercise,
  DailyScheduleItem,
  WeeklyTemplate,
} from "../types";
import { workoutModules } from "./workoutModules";

export type MonthlyCycleWeekNumber = 1 | 2 | 3 | 4;

export interface DailySchedule extends DailyScheduleItem {
  name: string;
  exerciseSelections?: DailyScheduleExercise[];
}

export interface MonthlyCycleWeek {
  week: MonthlyCycleWeekNumber;
  name: string;
  plannedSets: number;
  setRange?: {
    min: number;
    max: number;
  };
  setsMultiplier?: number;
  weightMultiplier: number;
  rpe?: {
    min: number;
    max: number;
  };
  prompt: string;
}

export const standardWeekTemplate: WeeklyTemplate[] = [
  {
    weekday: "周一",
    timeSlot: "中午",
    moduleId: "strength-a",
    isFixed: false,
    canAdjust: true,
    notes: "力量 A：攀岩拉力、胸推、肩中束/后束与肩胛控制。",
    estimatedDurationMinutes: 60,
  },
  {
    weekday: "周二",
    timeSlot: "中午",
    moduleId: "yoga",
    isFixed: true,
    canAdjust: true,
    notes: "周二中午按月度周次交替：第 1、3 周瑜伽，第 2、4 周低强度有氧散步。",
    estimatedDurationMinutes: 60,
  },
  {
    weekday: "周二",
    timeSlot: "中午",
    moduleId: "cardio-walk",
    isFixed: true,
    canAdjust: true,
    notes: "第 2、4 周低强度平地快走 30 分钟；避免间歇和陡坡，为晚间攀岩留力。",
    estimatedDurationMinutes: 30,
  },
  {
    weekday: "周二",
    timeSlot: "晚上",
    moduleId: "climbing-1",
    isFixed: true,
    canAdjust: true,
    notes: "攀岩 1。",
    estimatedDurationMinutes: 60,
  },
  {
    weekday: "周三",
    timeSlot: "中午",
    moduleId: "strength-b",
    isFixed: false,
    canAdjust: true,
    notes: "力量训练（下肢/臀，按月度循环轮换）。",
    estimatedDurationMinutes: 60,
  },
  {
    weekday: "周四",
    timeSlot: "中午",
    moduleId: "functional-c",
    isFixed: false,
    canAdjust: true,
    notes: "低疲劳肩胛控制与核心抗旋，为晚间攀岩做技术性辅助。",
    estimatedDurationMinutes: 45,
  },
  {
    weekday: "周四",
    timeSlot: "晚上",
    moduleId: "climbing-2",
    isFixed: true,
    canAdjust: true,
    notes: "攀岩 2。",
    estimatedDurationMinutes: 60,
  },
  {
    weekday: "周五",
    timeSlot: "中午",
    moduleId: "strength-b",
    isFixed: false,
    canAdjust: true,
    notes: "射箭前轻量核心与髋部稳定：2 个动作、低强度激活，为周六射箭保留体力。",
    estimatedDurationMinutes: 30,
  },
  {
    weekday: "周六",
    timeSlot: "10:00-14:00",
    moduleId: "recurve-archery",
    isFixed: true,
    canAdjust: true,
    notes: "反曲弓射箭。",
  },
];

export const monthlyCycleTemplate: MonthlyCycleWeek[] = [
  {
    week: 1,
    name: "适应周",
    plannedSets: 3,
    weightMultiplier: 1,
    rpe: { min: 7, max: 7 },
    prompt: "熟悉动作，保留余力",
  },
  {
    week: 2,
    name: "强化周",
    plannedSets: 4,
    weightMultiplier: 1,
    rpe: { min: 8, max: 8 },
    prompt: "增加容量，强化核心",
  },
  {
    week: 3,
    name: "递增周",
    plannedSets: 4,
    weightMultiplier: 1.05,
    rpe: { min: 7, max: 8 },
    prompt: "稳步递增，保留 1–2 次余力",
  },
  {
    week: 4,
    name: "减负周",
    plannedSets: 2,
    weightMultiplier: 0.5,
    prompt: "超量恢复，多做拉伸",
  },
];

const exerciseSelection = (
  name: string,
  exerciseName = name,
): DailyScheduleExercise => ({ name, exerciseName });

const weeklyExerciseRotations: Record<
  MonthlyCycleWeekNumber,
  {
    upperPull: DailyScheduleExercise[];
    lowerBody: DailyScheduleExercise[];
    shoulderAndCore: DailyScheduleExercise[];
    preArchery: DailyScheduleExercise[];
  }
> = {
  1: {
    upperPull: [
      exerciseSelection("引体向上"),
      exerciseSelection("坐姿划船", "坐姿器械划船"),
      exerciseSelection("上斜哑铃卧推"),
      exerciseSelection("哑铃侧平举"),
      exerciseSelection("绳索面拉"),
    ],
    lowerBody: [
      exerciseSelection("深蹲", "杠铃深蹲"),
      exerciseSelection("罗马尼亚硬拉"),
      exerciseSelection("俯卧腿弯举"),
      exerciseSelection("站姿器械提踵"),
    ],
    shoulderAndCore: [
      exerciseSelection("帕洛夫推"),
      exerciseSelection("弹力带肩外旋"),
      exerciseSelection("前锯肌推"),
    ],
    preArchery: [
      exerciseSelection("死虫式"),
      exerciseSelection("坐姿器械髋外展"),
    ],
  },
  2: {
    upperPull: [
      exerciseSelection("高位下拉"),
      exerciseSelection("单臂哑铃划船"),
      exerciseSelection("俯卧撑"),
      exerciseSelection("蝴蝶机反向飞鸟"),
      exerciseSelection("哑铃侧平举"),
    ],
    lowerBody: [
      exerciseSelection("腿举机"),
      exerciseSelection("杠铃臀推"),
      exerciseSelection("保加利亚分腿蹲"),
      exerciseSelection("坐姿器械提踵"),
    ],
    shoulderAndCore: [
      exerciseSelection("帕洛夫推"),
      exerciseSelection("俯卧 Y-W-T 伸展", "俯卧Y-W-T伸展"),
      exerciseSelection("平板支撑"),
    ],
    preArchery: [
      exerciseSelection("鸟狗式"),
      exerciseSelection("死虫式"),
    ],
  },
  3: {
    upperPull: [
      exerciseSelection("负重引体", "引体向上"),
      exerciseSelection("T杠划船"),
      exerciseSelection("杠铃平板卧推"),
      exerciseSelection("绳索面拉"),
      exerciseSelection("哑铃侧平举"),
    ],
    lowerBody: [
      exerciseSelection("保加利亚蹲", "保加利亚分腿蹲"),
      exerciseSelection("单腿RDL", "单腿罗马尼亚硬拉（徒手/轻负重）"),
      exerciseSelection("坐姿腿屈伸"),
      exerciseSelection("坐姿器械提踵"),
    ],
    shoulderAndCore: [
      exerciseSelection("帕洛夫推"),
      exerciseSelection("弹力带肩外旋"),
      exerciseSelection("前锯肌推"),
    ],
    preArchery: [
      exerciseSelection("死虫式"),
      exerciseSelection("坐姿器械髋外展"),
    ],
  },
  4: {
    upperPull: [
      exerciseSelection("轻重量引体", "引体向上"),
      exerciseSelection("轻重量划船", "坐姿器械划船"),
      exerciseSelection("轻重量卧推", "上斜哑铃卧推"),
      exerciseSelection("蝴蝶机反向飞鸟"),
      exerciseSelection("轻重量侧平举", "哑铃侧平举"),
    ],
    lowerBody: [
      exerciseSelection("轻重量深蹲", "杠铃深蹲"),
      exerciseSelection("俯卧腿弯举"),
      exerciseSelection("杠铃臀推"),
      exerciseSelection("站姿器械提踵"),
    ],
    shoulderAndCore: [
      exerciseSelection("帕洛夫推"),
      exerciseSelection("弹力带肩外旋"),
      exerciseSelection("俯卧 Y-W-T 伸展", "俯卧Y-W-T伸展"),
    ],
    preArchery: [
      exerciseSelection("平板支撑"),
      exerciseSelection("坐姿器械髋外展"),
    ],
  },
};

function toUtcDay(date: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new RangeError(`Invalid date "${date}"; expected YYYY-MM-DD.`);
  }

  const timestamp = Date.parse(`${date}T00:00:00.000Z`);
  if (
    Number.isNaN(timestamp) ||
    new Date(timestamp).toISOString().slice(0, 10) !== date
  ) {
    throw new RangeError(`Invalid calendar date "${date}".`);
  }

  return timestamp;
}

function formatUtcDay(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

export function getCycleWeekStartDate(
  startDate: string,
  week: MonthlyCycleWeekNumber,
): string {
  return formatUtcDay(toUtcDay(startDate) + (week - 1) * 7 * 86_400_000);
}

function currentDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function generateWeeklySchedule(
  week: MonthlyCycleWeekNumber,
  weekStartDate = currentDateString(),
): DailySchedule[] {
  const rotations = weeklyExerciseRotations[week];
  if (!rotations) {
    throw new RangeError(`Invalid monthly cycle week "${week}".`);
  }

  const cycleWeekStart = toUtcDay(weekStartDate);
  const cycleWeekday = (new Date(cycleWeekStart).getUTCDay() + 6) % 7;
  const dayOffset = (weekdayOffset: number) =>
    (weekdayOffset - cycleWeekday + 7) % 7;
  const createItem = (
    weekdayOffset: number,
    timeSlot: string,
    moduleId: string,
    name: string,
    isFixed: boolean,
    exerciseSelections?: DailyScheduleExercise[],
    trainingLoadProfile?: DailySchedule["trainingLoadProfile"],
    estimatedDurationMinutes?: number,
  ): DailySchedule => {
    const date = formatUtcDay(
      cycleWeekStart + dayOffset(weekdayOffset) * 86_400_000,
    );
    return {
      id: `${date}-${moduleId}`,
      date,
      moduleId,
      name,
      timeSlot,
      isFixed,
      ...(exerciseSelections ? { exerciseSelections } : {}),
      ...(trainingLoadProfile ? { trainingLoadProfile } : {}),
      ...(estimatedDurationMinutes !== undefined
        ? { estimatedDurationMinutes }
        : {}),
    };
  };

  return [
    createItem(
      0,
      "中午",
      "strength-a",
      "力量 A：拉力、推力与肩部稳定",
      false,
      rotations.upperPull,
    ),
    createItem(
      1,
      "中午",
      week % 2 === 0 ? "cardio-walk" : "yoga",
      week % 2 === 0 ? "低强度有氧：平地快走" : "瑜伽",
      true,
      week % 2 === 0 ? [exerciseSelection("平地快走", "散步")] : undefined,
      undefined,
      week % 2 === 0 ? 30 : 60,
    ),
    createItem(1, "晚上", "climbing-1", "攀岩 1", true),
    createItem(2, "中午", "strength-b", "力量训练（下肢/臀）", false, rotations.lowerBody),
    createItem(
      3,
      "中午",
      "functional-c",
      "肩胛控制与核心抗旋（低疲劳）",
      false,
      rotations.shoulderAndCore,
      "low-fatigue",
      45,
    ),
    createItem(3, "晚上", "climbing-2", "攀岩 2", true),
    createItem(
      4,
      "中午",
      "strength-b",
      "核心与髋部稳定（射箭前轻量）",
      false,
      rotations.preArchery,
      "pre-archery",
      30,
    ),
    createItem(5, "上午", "recurve-archery", "反曲弓射箭", true),
    createItem(6, "白天", "weekend-elective", "周末选修 / 休息", false),
  ];
}

export function getCurrentWeekInfo(startDate: string): MonthlyCycleWeek {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return getWeekInfoForDate(startDate, today);
}

export function getCurrentCycleWeek(
  startDate: string,
): MonthlyCycleWeekNumber {
  return getCycleWeekForDate(startDate, currentDateString());
}

export function getCycleWeekForDate(
  startDate: string,
  targetDate: string,
): MonthlyCycleWeekNumber {
  const startDay = toUtcDay(startDate);
  const targetDay = toUtcDay(targetDate);
  const daysDiff = (targetDay - startDay) / 86_400_000;
  const elapsedWeeks = Math.floor(daysDiff / 7);
  return (((elapsedWeeks % 4) + 4) % 4 + 1) as MonthlyCycleWeekNumber;
}

export function getWeekInfoForDate(
  startDate: string,
  targetDate: string,
): MonthlyCycleWeek {
  return monthlyCycleTemplate[getCycleWeekForDate(startDate, targetDate) - 1];
}

export function getFunctionalModuleForWeek(
  weekInCycle: MonthlyCycleWeekNumber,
  slot: 1 | 2,
) {
  const moduleIdByWeekAndSlot: Record<
    MonthlyCycleWeekNumber,
    Record<1 | 2, string>
  > = {
    1: { 1: "functional-c", 2: "functional-d" },
    2: { 1: "functional-a", 2: "functional-b" },
    3: { 1: "functional-c", 2: "functional-d" },
    4: { 1: "functional-c", 2: "functional-d" },
  };
  const moduleId = moduleIdByWeekAndSlot[weekInCycle][slot];
  const module = workoutModules.find((item) => item.id === moduleId);
  if (!module) {
    throw new Error(`Functional module "${moduleId}" is not configured.`);
  }

  const rotation = module.weeklyRotations?.find(
    (item) => item.week === weekInCycle,
  );
  if (!rotation) {
    throw new Error(
      `Functional module "${moduleId}" has no rotation for week ${weekInCycle}.`,
    );
  }

  const cycleWeek = monthlyCycleTemplate[weekInCycle - 1];
  return {
    ...module,
    exercises: rotation.exercises.map((exercise) => ({
      ...exercise,
      plannedSets: cycleWeek.plannedSets,
      targetWeightMultiplier: cycleWeek.weightMultiplier,
    })),
  };
}
