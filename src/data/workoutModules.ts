import { seedExerciseLibrary } from "./seedExerciseLibrary";
import type {
  Exercise,
  ExerciseRotation,
  WorkoutModule,
} from "../types";

export const standardExercises: Exercise[] = [
  {
    id: "library-pull-up",
    name: "引体向上",
    targetBodyPart: "背阔肌、上背部、肱二头肌",
    purpose: "建立垂直拉力，增强背部与手臂力量。",
    plannedSets: 4,
    plannedReps: "6-10",
    rpe: 8,
    restTime: 120,
    notes: "保持躯干稳定，无法完成标准动作时可使用辅助或下拉变式。",
    alternativeExercises: ["高位下拉", "弹力带辅助引体向上"],
  },
  {
    id: "library-squat",
    name: "深蹲",
    targetBodyPart: "股四头肌、臀大肌、核心",
    purpose: "建立下肢蹲姿力量与躯干稳定。",
    plannedSets: 4,
    plannedReps: "8-12",
    rpe: 8,
    restTime: 120,
    notes: "膝盖朝脚尖方向，保持脚掌稳定着地。",
    alternativeExercises: ["高脚杯深蹲", "腿举"],
  },
  {
    id: "library-deadlift",
    name: "硬拉",
    targetBodyPart: "臀大肌、腘绳肌、背部",
    purpose: "训练髋铰链与全身后侧链力量。",
    plannedSets: 3,
    plannedReps: "5-8",
    rpe: 7,
    restTime: 150,
    notes: "保持脊柱中立，重量贴近身体，动作全程可控。",
    alternativeExercises: ["罗马尼亚硬拉", "壶铃硬拉"],
  },
  {
    id: "library-face-pull",
    name: "面拉",
    targetBodyPart: "后三角肌、斜方肌中下部、肩袖",
    purpose: "加强肩后侧与肩胛稳定。",
    plannedSets: 3,
    plannedReps: "12-15",
    rpe: 7,
    restTime: 60,
    notes: "拉向眉眼高度，控制回程，避免耸肩。",
    alternativeExercises: ["弹力带面拉", "反向飞鸟"],
  },
];

const exerciseFallbacks: Record<string, Exercise> = {
  "俯卧Y-W-T伸展": {
    id: "module-exercise-prone-y-w-t",
    name: "俯卧 Y-W-T 伸展",
    targetBodyPart: "斜方肌中下部、菱形肌、后三角肌",
    purpose: "练习肩胛控制与上背部耐力。",
    plannedSets: 2,
    plannedReps: "每个字母 8-10",
    rpe: 6,
    restTime: 60,
    notes: "使用轻重量或徒手，避免耸肩和腰部过度伸展。",
  },
  弹力带肩外旋: {
    id: "functional-band-external-rotation",
    name: "弹力带肩外旋",
    targetBodyPart: "肩袖、后三角肌",
    purpose: "强化肩袖外旋控制与肩关节稳定。",
    plannedSets: 3,
    plannedReps: "12-15",
    rpe: 6,
    restTime: 45,
    notes: "手肘贴近身体并保持约 90 度弯曲，用轻阻力缓慢向外旋转，不要耸肩或借力。",
  },
  前锯肌推: {
    id: "functional-serratus-push",
    name: "前锯肌推",
    targetBodyPart: "前锯肌、肩胛稳定肌群",
    purpose: "改善肩胛上回旋与前伸控制，支持持弓稳定。",
    plannedSets: 3,
    plannedReps: "10-15",
    rpe: 6,
    restTime: 45,
    notes: "可用墙面俯卧撑加肩胛前伸完成，手肘保持伸直，避免耸肩和塌腰。",
  },
  单腿罗马尼亚硬拉: {
    id: "functional-single-leg-romanian-deadlift",
    name: "单腿罗马尼亚硬拉",
    targetBodyPart: "臀部、腘绳肌、髋部稳定肌群",
    purpose: "练习单腿髋铰链、平衡与攀岩踩点稳定。",
    plannedSets: 3,
    plannedReps: "每侧 8-10",
    rpe: 6,
    restTime: 60,
    notes: "先徒手练习，髋部保持朝前，支撑腿微屈，背部中立；平衡稳定后再逐步加轻负重。",
  },
  弓步走: {
    id: "functional-walking-lunge",
    name: "弓步走",
    targetBodyPart: "股四头肌、臀大肌、髋部稳定肌群",
    purpose: "训练动态单腿力量与步态中的髋膝控制。",
    plannedSets: 3,
    plannedReps: "每侧 8-10 步",
    rpe: 6,
    restTime: 60,
    notes: "步幅适中，前脚踩稳，膝盖跟随脚尖方向；必要时先徒手完成。",
  },
  侧向弓步: {
    id: "functional-lateral-lunge",
    name: "侧向弓步",
    targetBodyPart: "臀中肌、内收肌、股四头肌",
    purpose: "增强横向移动中的髋部控制和下肢稳定。",
    plannedSets: 3,
    plannedReps: "每侧 8-10",
    rpe: 6,
    restTime: 60,
    notes: "向侧方坐髋，屈曲侧膝盖朝脚尖方向，另一腿伸直，保持脚掌稳定。",
  },
  弓步转体: {
    id: "functional-lunge-rotation",
    name: "弓步转体",
    targetBodyPart: "臀腿、核心、腹斜肌",
    purpose: "结合单腿稳定与可控躯干旋转。",
    plannedSets: 3,
    plannedReps: "每侧 8",
    rpe: 6,
    restTime: 60,
    notes: "先稳定弓步姿势，再小幅转动胸廓；保持骨盆稳定，避免膝盖内扣。",
  },
  散步: {
    id: "cardio-brisk-walk",
    name: "散步",
    targetBodyPart: "心肺系统、下肢",
    purpose: "以轻松强度提升日常活动量，促进主动恢复。",
    plannedSets: 1,
    plannedReps: "30-45 分钟",
    rpe: 3,
    restTime: 0,
    notes: "保持可轻松交谈的强度，根据体能调整时长。",
  },
  慢跑: {
    id: "cardio-easy-jog",
    name: "慢跑",
    targetBodyPart: "心肺系统、下肢",
    purpose: "以可持续的轻中等强度提升心肺耐力。",
    plannedSets: 1,
    plannedReps: "20-40 分钟",
    rpe: 4,
    restTime: 0,
    notes: "保持能完整说短句的轻松配速，不适时改为步行。",
  },
  爬坡: {
    id: "cardio-incline-walk",
    name: "爬坡",
    targetBodyPart: "心肺系统、臀腿、小腿",
    purpose: "通过坡度提高心肺和下肢持续工作能力。",
    plannedSets: 1,
    plannedReps: "20-30 分钟",
    rpe: 5,
    restTime: 0,
    notes: "从舒适坡度开始，不要依靠扶手支撑体重；不适时降低坡度或停止。",
  },
};

function normalizeExerciseName(name: string): string {
  return name.toLocaleLowerCase().replace(/[\s/／()（）·_-]/g, "");
}

function bindExercise(name: string, aliases: string[] = []): Exercise {
  const candidates = [name, ...aliases].map(normalizeExerciseName);
  const exercise = seedExerciseLibrary.find((item) =>
    candidates.includes(normalizeExerciseName(item.name)),
  );
  const source = exercise ?? exerciseFallbacks[name];

  if (!source) {
    throw new Error(`训练模块缺少动作库动作“${name}”。`);
  }

  return { ...source, name };
}

function createExerciseRotation(
  week: ExerciseRotation["week"],
  exerciseNames: Array<{
    name: string;
    aliases?: string[];
    displayName?: string;
    notes?: string;
  }>,
): ExerciseRotation {
  return {
    week,
    exercises: exerciseNames.map(
      ({ name, aliases, displayName, notes }) => {
        const exercise = bindExercise(name, aliases);
        return {
          ...exercise,
          name: displayName ?? exercise.name,
          ...(notes ? { notes } : {}),
          plannedSets: 3,
        };
      },
    ),
  };
}

function createModule(
  id: string,
  name: string,
  type: NonNullable<WorkoutModule["category"]>,
  goal: string,
  exercises: Exercise[],
  estimatedCaloriesPerMinute?: number,
): WorkoutModule {
  return {
    id,
    name,
    type,
    category: type,
    goal,
    description: goal,
    estimatedDurationMinutes: 60,
    ...(estimatedCaloriesPerMinute === undefined
      ? {}
      : { estimatedCaloriesPerMinute }),
    exercises,
  };
}

export const workoutModules: WorkoutModule[] = [
  createModule(
    "strength-a",
    "力量 A：上肢拉与防圆肩",
    "strength",
    "攀岩拉力、改善圆肩。",
    [
      bindExercise("引体向上"),
      bindExercise("坐姿器械划船"),
      bindExercise("弹力带面拉", ["绳索面拉"]),
      bindExercise("俯卧Y-W-T伸展", ["俯卧 Y-W-T 伸展"]),
    ],
    6,
  ),
  createModule(
    "strength-b",
    "力量 B：下肢底盘与核心基础",
    "strength",
    "下盘稳定、深层核心。",
    [
      bindExercise("杠铃深蹲"),
      bindExercise("罗马尼亚硬拉"),
      bindExercise("杠铃臀推"),
      bindExercise("平板支撑"),
      bindExercise("死虫式"),
    ],
    6,
  ),
  createModule(
    "strength-c",
    "力量 C：上肢推与射箭抗旋",
    "strength",
    "持弓臂稳定、核心抗旋。",
    [
      bindExercise("上斜哑铃卧推"),
      bindExercise("坐姿哑铃推举"),
      bindExercise("绳索下压"),
      bindExercise("帕洛夫推"),
    ],
    6,
  ),
  ...[
    {
      id: "functional-a",
      name: "功能性 A：上肢与肩胛控制",
      goal: "防圆肩、射箭持弓稳定。",
      rotations: [
        createExerciseRotation(1, [
          { name: "弹力带肩外旋" },
          { name: "俯卧Y-W-T伸展", aliases: ["俯卧 Y-W-T 伸展"] },
        ]),
        createExerciseRotation(2, [
          {
            name: "坐姿哑铃推举",
            displayName: "单臂哑铃推举（慢速控制）",
            notes: "单侧站姿或坐姿完成，采用轻重量，推起与下放均保持慢速可控。",
          },
          { name: "绳索面拉", aliases: ["面拉"] },
        ]),
        createExerciseRotation(3, [
          { name: "弹力带肩外旋" },
          { name: "前锯肌推" },
        ]),
        createExerciseRotation(4, [
          {
            name: "绳索面拉",
            aliases: ["面拉"],
            displayName: "绳索面拉（轻）",
            notes: "使用轻重量，专注肩胛控制与肩后侧发力，不要耸肩。",
          },
          {
            name: "弹力带肩外旋",
            displayName: "弹力带肩外旋（轻）",
            notes: "使用轻阻力，动作缓慢平顺，避免肩部不适。",
          },
        ]),
      ],
    },
    {
      id: "functional-b",
      name: "功能性 B：下肢与髋部稳定",
      goal: "攀岩单腿踩点、下盘稳定。",
      rotations: [
        createExerciseRotation(1, [
          {
            name: "单腿罗马尼亚硬拉",
            displayName: "单腿罗马尼亚硬拉（徒手/轻负重）",
          },
          { name: "弓步走" },
        ]),
        createExerciseRotation(2, [
          {
            name: "保加利亚分腿蹲",
            displayName: "保加利亚分腿蹲（功能性）",
          },
          { name: "侧向弓步" },
        ]),
        createExerciseRotation(3, [
          {
            name: "单腿罗马尼亚硬拉",
            displayName: "单腿罗马尼亚硬拉（负重）",
            notes: "在平衡和髋部控制稳定的前提下逐步增加轻负重，不追求力竭。",
          },
          { name: "弓步转体" },
        ]),
        createExerciseRotation(4, [
          {
            name: "弓步走",
            displayName: "弓步走（轻）",
            notes: "徒手或轻负重，步幅舒适，保持动作稳定。",
          },
          { name: "侧向弓步" },
        ]),
      ],
    },
    {
      id: "functional-c",
      name: "功能性 C：核心抗旋与张力",
      goal: "射箭抗旋、攀岩核心贴墙。",
      rotations: [
        createExerciseRotation(1, [
          { name: "帕洛夫推" },
          { name: "死虫式" },
        ]),
        createExerciseRotation(2, [
          { name: "单臂农夫行走" },
          { name: "平板支撑" },
        ]),
        createExerciseRotation(3, [
          {
            name: "帕洛夫推",
            displayName: "帕洛夫推（加重）",
            notes: "仅在躯干可稳定抵抗旋转时小幅增加阻力，避免身体被拉转。",
          },
          { name: "悬垂举腿" },
        ]),
        createExerciseRotation(4, [
          { name: "死虫式" },
          { name: "平板支撑" },
        ]),
      ],
    },
    {
      id: "functional-d",
      name: "功能性 D：全身力量传导",
      goal: "综合爆发、多关节协同。",
      rotations: [
        createExerciseRotation(1, [
          { name: "壶铃摇摆" },
          {
            name: "土耳其起立",
            displayName: "土耳其起立（轻）",
            notes: "先徒手或使用轻重量，分阶段练习动作路线，保持肩部稳定。",
          },
        ]),
        createExerciseRotation(2, [
          { name: "单臂农夫行走" },
          { name: "俄罗斯转体", aliases: ["俄罗斯转体"] },
        ]),
        createExerciseRotation(3, [
          {
            name: "壶铃摇摆",
            displayName: "壶铃摇摆（加重）",
            notes: "只有髋铰链动作熟练、腰背无不适时才小幅增加壶铃重量。",
          },
          { name: "土耳其起立" },
        ]),
        createExerciseRotation(4, [
          {
            name: "壶铃摇摆",
            displayName: "壶铃摇摆（轻）",
            notes: "降低壶铃重量，以流畅髋部发力和动作质量为主。",
          },
          { name: "单臂农夫行走" },
        ]),
      ],
    },
  ].map(({ id, name, goal, rotations }) => ({
    id,
    name,
    type: "functional" as const,
    category: "functional" as const,
    goal,
    description: goal,
    estimatedDurationMinutes: 60,
    estimatedCaloriesPerMinute: 6,
    exercises: rotations[0].exercises,
    weeklyRotations: rotations,
  })),
  createModule(
    "cardio-walk",
    "有氧与恢复",
    "cardio",
    "心肺、主动恢复。",
    [bindExercise("散步"), bindExercise("慢跑"), bindExercise("爬坡")],
    10,
  ),
];
