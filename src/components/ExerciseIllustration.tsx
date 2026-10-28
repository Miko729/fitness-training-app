interface ExerciseIllustrationProps {
  muscleKey: string;
}

type MuscleRegion =
  | "chest"
  | "back"
  | "shoulder"
  | "arms"
  | "core"
  | "quads"
  | "glutes"
  | "hamstrings"
  | "calves";

const muscleMatchers: Array<[RegExp, MuscleRegion[]]> = [
  [/胸|胸大肌/, ["chest"]],
  [/背|背阔|菱形|竖脊/, ["back"]],
  [/肩|三角肌/, ["shoulder"]],
  [/手臂|肱二|肱三|二头|三头/, ["arms"]],
  [/核心|腹|抗旋/, ["core"]],
  [/股四头|大腿前|腿部|下肢/, ["quads"]],
  [/臀/, ["glutes"]],
  [/腘绳|大腿后/, ["hamstrings"]],
  [/小腿|提踵/, ["calves"]],
  [/全身|握力/, ["chest", "back", "shoulder", "arms", "core", "quads", "glutes", "hamstrings", "calves"]],
];

function getHighlightedRegions(muscleKey: string): Set<MuscleRegion> {
  const regions = new Set<MuscleRegion>();
  for (const [matcher, matchedRegions] of muscleMatchers) {
    if (matcher.test(muscleKey)) {
      matchedRegions.forEach((region) => regions.add(region));
    }
  }
  return regions;
}

export default function ExerciseIllustration({
  muscleKey,
}: ExerciseIllustrationProps) {
  const highlighted = getHighlightedRegions(muscleKey);
  const regionClass = (region: MuscleRegion) =>
    highlighted.has(region) ? "#34d399" : "#374151";

  return (
    <svg
      viewBox="0 0 600 338"
      role="img"
      aria-label={`人体肌群示意图：${muscleKey || "全身"}`}
      className="block h-full w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="body-shading" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#9ca3af" />
          <stop offset="1" stopColor="#4b5563" />
        </linearGradient>
      </defs>
      <rect width="600" height="338" fill="#1f2937" />
      <text x="300" y="30" fill="#d1d5db" fontSize="16" textAnchor="middle">
        {muscleKey ? `${muscleKey} · 肌群示意` : "人体肌群示意"}
      </text>

      <g transform="translate(155 48)" stroke="#9ca3af" strokeWidth="2">
        <circle cx="45" cy="21" r="17" fill="url(#body-shading)" />
        <path d="M35 39h20v17H35z" fill="#6b7280" />
        <path d="M14 58Q45 48 76 58L70 133Q45 146 20 133Z" fill="#4b5563" />
        <path d="M17 61 3 70 0 129 13 132 25 86Z" fill="#6b7280" />
        <path d="m73 61 14 9 3 59-13 3-12-46Z" fill="#6b7280" />
        <path d="m25 132 40 0 7 72-16 0-11-48-11 48H18Z" fill="#6b7280" />
        <path d="M19 66Q31 57 44 66L41 91 23 88Z" fill={regionClass("chest")} />
        <path d="M46 66Q59 57 71 66L67 88 49 91Z" fill={regionClass("chest")} />
        <path d="M22 59Q14 61 16 75L25 84 31 68Z" fill={regionClass("shoulder")} />
        <path d="M68 59Q76 61 74 75L65 84 59 68Z" fill={regionClass("shoulder")} />
        <path d="M20 88 30 88 29 111 19 109Z" fill={regionClass("arms")} />
        <path d="M61 88 71 88 72 109 62 111Z" fill={regionClass("arms")} />
        <path d="M31 94h10v12H31zm14 0h10v12H45zm-14 16h10v12H31zm14 0h10v12H45Z" fill={regionClass("core")} />
        <path d="M24 134h18l7 44-16 3-12-27Z" fill={regionClass("quads")} />
        <path d="M47 134h18l3 20-12 27-16-3Z" fill={regionClass("quads")} />
        <path d="m23 178 16 3-2 18-14-1zm31 3 16-3 1 20-14 1Z" fill={regionClass("calves")} />
        <text x="45" y="224" fill="#d1d5db" stroke="none" fontSize="13" textAnchor="middle">正面</text>
      </g>

      <g transform="translate(365 48)" stroke="#9ca3af" strokeWidth="2">
        <circle cx="45" cy="21" r="17" fill="url(#body-shading)" />
        <path d="M35 39h20v17H35z" fill="#6b7280" />
        <path d="M14 58Q45 48 76 58L70 133Q45 146 20 133Z" fill={regionClass("back")} />
        <path d="M17 61 3 70 0 129 13 132 25 86Z" fill="#6b7280" />
        <path d="m73 61 14 9 3 59-13 3-12-46Z" fill="#6b7280" />
        <path d="m25 132 40 0 7 72-16 0-11-48-11 48H18Z" fill="#6b7280" />
        <path d="M18 61Q45 49 72 61L63 94 45 109 27 94Z" fill={regionClass("shoulder")} />
        <path d="M26 81 44 94 40 123 22 112Z" fill={regionClass("back")} />
        <path d="M64 81 46 94 50 123 68 112Z" fill={regionClass("back")} />
        <path d="M26 128h38l4 14-23 13-23-13Z" fill={regionClass("glutes")} />
        <path d="M24 144h18l7 35-16 3-12-22Z" fill={regionClass("hamstrings")} />
        <path d="M47 144h18l3 16-12 22-16-3Z" fill={regionClass("hamstrings")} />
        <path d="m23 178 16 3-2 18-14-1zm31 3 16-3 1 20-14 1Z" fill={regionClass("calves")} />
        <text x="45" y="224" fill="#d1d5db" stroke="none" fontSize="13" textAnchor="middle">背面</text>
      </g>
      <text x="300" y="318" fill="#9ca3af" fontSize="12" textAnchor="middle">
        绿色区域表示主要训练肌群
      </text>
    </svg>
  );
}
