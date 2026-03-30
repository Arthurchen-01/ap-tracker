// ============================================================================
// AP Tracker — Mock Data
// ============================================================================

// ---------- Type Definitions ----------

export type APSubject =
  | "AP Macro"
  | "AP Micro"
  | "AP Calc BC"
  | "AP Stats"
  | "AP Physics"
  | "AP Chemistry"
  | "AP Biology"
  | "AP English Lang";

export interface ExamDate {
  subject: APSubject;
  date: string; // ISO date string
}

export interface MockScore {
  label: string; // e.g. "Mock 1", "Practice Test A"
  mcqScore: number; // 0-100 percentage
  frqScore: number; // 0-100 percentage
  timed: boolean;
  overallScore: number; // weighted 0-100 percentage
  date: string; // ISO date string
}

export interface TopicMastery {
  unit: string; // e.g. "Unit 1: Basic Economic Concepts"
  mastery: number; // 0-1
}

export interface StudentSubject {
  subject: APSubject;
  mockScores: MockScore[];
  predictedFiveRate: number; // 0-1
  topicMastery: TopicMastery[];
}

export interface Student {
  id: string;
  name: string;
  avatar?: string;
  subjects: StudentSubject[];
}

export interface Classroom {
  id: string;
  name: string;
  students: Student[];
}

export interface SharedResource {
  id: string;
  title: string;
  subject: APSubject;
  type: "notes" | "video" | "practice" | "flashcards";
  sharedBy: string; // student id
  url: string;
  description: string;
}

// ---------- AP Exam Dates (May 2026) ----------

export const apExamDates: ExamDate[] = [
  { subject: "AP Biology", date: "2026-05-04" },
  { subject: "AP Chemistry", date: "2026-05-05" },
  { subject: "AP English Lang", date: "2026-05-06" },
  { subject: "AP Stats", date: "2026-05-07" },
  { subject: "AP Macro", date: "2026-05-11" },
  { subject: "AP Micro", date: "2026-05-11" },
  { subject: "AP Calc BC", date: "2026-05-12" },
  { subject: "AP Physics", date: "2026-05-14" },
];

// ---------- Topic Definitions per Subject ----------

const macroTopics: TopicMastery[] = [
  { unit: "Unit 1: Basic Economic Concepts", mastery: 0 },
  { unit: "Unit 2: Economic Indicators & the Business Cycle", mastery: 0 },
  { unit: "Unit 3: National Income & Price Determination", mastery: 0 },
  { unit: "Unit 4: Financial Sector", mastery: 0 },
  { unit: "Unit 5: Stabilization Policies", mastery: 0 },
  { unit: "Unit 6: Open Economy", mastery: 0 },
];

const microTopics: TopicMastery[] = [
  { unit: "Unit 1: Basic Economic Concepts", mastery: 0 },
  { unit: "Unit 2: Supply & Demand", mastery: 0 },
  { unit: "Unit 3: Production, Cost & the Perfect Competition Model", mastery: 0 },
  { unit: "Unit 4: Imperfect Competition", mastery: 0 },
  { unit: "Unit 5: Factor Markets", mastery: 0 },
  { unit: "Unit 6: Market Failure & the Role of Government", mastery: 0 },
];

const calcBCTopics: TopicMastery[] = [
  { unit: "Unit 1: Limits & Continuity", mastery: 0 },
  { unit: "Unit 2: Differentiation", mastery: 0 },
  { unit: "Unit 3: Composite, Implicit & Inverse Functions", mastery: 0 },
  { unit: "Unit 4: Contextual Applications of Differentiation", mastery: 0 },
  { unit: "Unit 5: Analytical Applications of Differentiation", mastery: 0 },
  { unit: "Unit 6: Integration & Accumulation of Change", mastery: 0 },
  { unit: "Unit 7: Differential Equations", mastery: 0 },
  { unit: "Unit 8: Applications of Integration", mastery: 0 },
  { unit: "Unit 9: Parametric, Polar & Vector-Valued Functions", mastery: 0 },
  { unit: "Unit 10: Infinite Sequences & Series", mastery: 0 },
];

const statsTopics: TopicMastery[] = [
  { unit: "Unit 1: Exploring One-Variable Data", mastery: 0 },
  { unit: "Unit 2: Exploring Two-Variable Data", mastery: 0 },
  { unit: "Unit 3: Collecting Data", mastery: 0 },
  { unit: "Unit 4: Probability", mastery: 0 },
  { unit: "Unit 5: Sampling Distributions", mastery: 0 },
  { unit: "Unit 6: Inference for Categorical Data", mastery: 0 },
  { unit: "Unit 7: Inference for Quantitative Data", mastery: 0 },
];

const physicsTopics: TopicMastery[] = [
  { unit: "Unit 1: Kinematics", mastery: 0 },
  { unit: "Unit 2: Dynamics", mastery: 0 },
  { unit: "Unit 3: Circular Motion & Gravitation", mastery: 0 },
  { unit: "Unit 4: Energy", mastery: 0 },
  { unit: "Unit 5: Momentum", mastery: 0 },
  { unit: "Unit 6: Simple Harmonic Motion", mastery: 0 },
  { unit: "Unit 7: Torque & Rotational Motion", mastery: 0 },
  { unit: "Unit 8: Electric Charges & Electric Force", mastery: 0 },
  { unit: "Unit 9: DC Circuits", mastery: 0 },
  { unit: "Unit 10: Mechanical Waves & Sound", mastery: 0 },
];

const chemTopics: TopicMastery[] = [
  { unit: "Unit 1: Atomic Structure & Properties", mastery: 0 },
  { unit: "Unit 2: Molecular & Ionic Compound Structure", mastery: 0 },
  { unit: "Unit 3: Intermolecular Forces & Properties", mastery: 0 },
  { unit: "Unit 4: Chemical Reactions", mastery: 0 },
  { unit: "Unit 5: Kinetics", mastery: 0 },
  { unit: "Unit 6: Thermodynamics", mastery: 0 },
  { unit: "Unit 7: Equilibrium", mastery: 0 },
  { unit: "Unit 8: Acids & Bases", mastery: 0 },
  { unit: "Unit 9: Applications of Thermodynamics", mastery: 0 },
];

const bioTopics: TopicMastery[] = [
  { unit: "Unit 1: Chemistry of Life", mastery: 0 },
  { unit: "Unit 2: Cell Structure & Function", mastery: 0 },
  { unit: "Unit 3: Cellular Energetics", mastery: 0 },
  { unit: "Unit 4: Cell Communication & Cell Cycle", mastery: 0 },
  { unit: "Unit 5: Heredity", mastery: 0 },
  { unit: "Unit 6: Gene Expression & Regulation", mastery: 0 },
  { unit: "Unit 7: Natural Selection", mastery: 0 },
  { unit: "Unit 8: Ecology", mastery: 0 },
];

const engLangTopics: TopicMastery[] = [
  { unit: "Unit 1: Rhetorical Situation", mastery: 0 },
  { unit: "Unit 2: Claims & Evidence", mastery: 0 },
  { unit: "Unit 3: Reasoning & Organization", mastery: 0 },
  { unit: "Unit 4: Style", mastery: 0 },
  { unit: "Unit 5: Craft & Structure", mastery: 0 },
];

const topicMap: Record<APSubject, TopicMastery[]> = {
  "AP Macro": macroTopics,
  "AP Micro": microTopics,
  "AP Calc BC": calcBCTopics,
  "AP Stats": statsTopics,
  "AP Physics": physicsTopics,
  "AP Chemistry": chemTopics,
  "AP Biology": bioTopics,
  "AP English Lang": engLangTopics,
};

// ---------- Helper to generate scores ----------

function rnd(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function genMockScores(count: number, baseMcq: number, baseFrq: number): MockScore[] {
  const labels = ["Mock 1", "Mock 2", "Mock 3", "Mock 4", "Mock 5"];
  const dates = [
    "2026-02-15",
    "2026-03-01",
    "2026-03-15",
    "2026-03-28",
    "2026-04-10",
  ];
  return Array.from({ length: count }, (_, i) => {
    const mcq = rnd(baseMcq - 10, baseMcq + 8);
    const frq = rnd(baseFrq - 10, baseFrq + 8);
    return {
      label: labels[i],
      mcqScore: Math.min(100, Math.max(0, mcq)),
      frqScore: Math.min(100, Math.max(0, frq)),
      timed: i >= 2, // first two untimed, rest timed
      overallScore: Math.min(100, Math.max(0, rnd(mcq * 0.6 + frq * 0.4 - 2, mcq * 0.6 + frq * 0.4 + 2))),
      date: dates[i],
    };
  });
}

function genTopicMastery(subject: APSubject, base: number): TopicMastery[] {
  return topicMap[subject].map((t) => ({
    ...t,
    mastery: rnd(base - 0.15, base + 0.15),
  }));
}

// ---------- Students ----------

const studentsRaw: {
  name: string;
  subjects: APSubject[];
  mcqBase: number;
  frqBase: number;
  fiveRateBase: number;
  masteryBase: number;
  mockCount: number;
}[] = [
  { name: "张明宇", subjects: ["AP Macro", "AP Calc BC", "AP Physics"], mcqBase: 82, frqBase: 75, fiveRateBase: 0.78, masteryBase: 0.80, mockCount: 4 },
  { name: "李思涵", subjects: ["AP Micro", "AP Stats", "AP Biology"], mcqBase: 78, frqBase: 72, fiveRateBase: 0.65, masteryBase: 0.72, mockCount: 3 },
  { name: "王子轩", subjects: ["AP Calc BC", "AP Chemistry", "AP English Lang"], mcqBase: 88, frqBase: 82, fiveRateBase: 0.85, masteryBase: 0.88, mockCount: 5 },
  { name: "刘雨桐", subjects: ["AP Macro", "AP Micro", "AP Stats"], mcqBase: 70, frqBase: 65, fiveRateBase: 0.50, masteryBase: 0.60, mockCount: 3 },
  { name: "陈一诺", subjects: ["AP Physics", "AP Chemistry", "AP Calc BC", "AP Biology"], mcqBase: 90, frqBase: 85, fiveRateBase: 0.92, masteryBase: 0.90, mockCount: 5 },
  { name: "赵梓萱", subjects: ["AP English Lang", "AP Macro", "AP Stats"], mcqBase: 75, frqBase: 78, fiveRateBase: 0.60, masteryBase: 0.68, mockCount: 4 },
  { name: "黄诗琪", subjects: ["AP Biology", "AP Chemistry", "AP English Lang"], mcqBase: 80, frqBase: 76, fiveRateBase: 0.70, masteryBase: 0.75, mockCount: 4 },
  { name: "吴浩然", subjects: ["AP Calc BC", "AP Physics", "AP Micro"], mcqBase: 85, frqBase: 80, fiveRateBase: 0.80, masteryBase: 0.82, mockCount: 3 },
  { name: "周子墨", subjects: ["AP Stats", "AP Macro", "AP Biology", "AP Chemistry"], mcqBase: 73, frqBase: 68, fiveRateBase: 0.55, masteryBase: 0.63, mockCount: 4 },
];

export const students: Student[] = studentsRaw.map((s, i) => ({
  id: `stu-${String(i + 1).padStart(3, "0")}`,
  name: s.name,
  subjects: s.subjects.map((subj) => ({
    subject: subj,
    mockScores: genMockScores(s.mockCount, s.mcqBase, s.frqBase),
    predictedFiveRate: rnd(s.fiveRateBase - 0.1, s.fiveRateBase + 0.1),
    topicMastery: genTopicMastery(subj, s.masteryBase),
  })),
}));

// ---------- Classroom ----------

export const classroom: Classroom = {
  id: "cls-001",
  name: "AP备考班2026",
  students,
};

// ---------- Shared Resources ----------

export const sharedResources: SharedResource[] = [
  {
    id: "res-001",
    title: "AP Macro FRQ 高频考点总结",
    subject: "AP Macro",
    type: "notes",
    sharedBy: "stu-001",
    url: "#",
    description: "涵盖 Unit 2-6 所有 FRQ 高频考点，附例题解析",
  },
  {
    id: "res-002",
    title: "AP Calc BC 公式速查表",
    subject: "AP Calc BC",
    type: "notes",
    sharedBy: "stu-003",
    url: "#",
    description: "所有必背公式一页纸，考前速查",
  },
  {
    id: "res-003",
    title: "AP Physics 力学专题练习",
    subject: "AP Physics",
    type: "practice",
    sharedBy: "stu-005",
    url: "#",
    description: "Unit 1-5 力学专项50题，含详细解答",
  },
  {
    id: "res-004",
    title: "AP Chemistry 有机化学 flashcards",
    subject: "AP Chemistry",
    type: "flashcards",
    sharedBy: "stu-007",
    url: "#",
    description: "Anki 格式的有机化学反应卡片组",
  },
  {
    id: "res-005",
    title: "AP Stats 概率分布视频讲解",
    subject: "AP Stats",
    type: "video",
    sharedBy: "stu-002",
    url: "#",
    description: "Unit 4 概率分布的30分钟视频精讲",
  },
  {
    id: "res-006",
    title: "AP Bio 细胞生物学思维导图",
    subject: "AP Biology",
    type: "notes",
    sharedBy: "stu-006",
    url: "#",
    description: "Unit 2-4 完整思维导图，一图看懂细胞结构与功能",
  },
  {
    id: "res-007",
    title: "AP English Lang 修辞手法整理",
    subject: "AP English Lang",
    type: "notes",
    sharedBy: "stu-004",
    url: "#",
    description: "常见修辞手法清单+范文标注",
  },
  {
    id: "res-008",
    title: "AP Micro 市场结构对比表",
    subject: "AP Micro",
    type: "notes",
    sharedBy: "stu-008",
    url: "#",
    description: "完全竞争/垄断/寡头/垄断竞争四象限对比",
  },
];

// ---------- Convenience getters ----------

export function getStudentById(id: string): Student | undefined {
  return students.find((s) => s.id === id);
}

export function getStudentsBySubject(subject: APSubject): Student[] {
  return students.filter((s) => s.subjects.some((sub) => sub.subject === subject));
}

export function getResourcesBySubject(subject: APSubject): SharedResource[] {
  return sharedResources.filter((r) => r.subject === subject);
}

export function getClassroomStats() {
  const totalStudents = students.length;
  const subjectCounts: Partial<Record<APSubject, number>> = {};
  const avgFiveRates: Partial<Record<APSubject, number[]>> = {};

  for (const s of students) {
    for (const sub of s.subjects) {
      subjectCounts[sub.subject] = (subjectCounts[sub.subject] ?? 0) + 1;
      if (!avgFiveRates[sub.subject]) avgFiveRates[sub.subject] = [];
      avgFiveRates[sub.subject]!.push(sub.predictedFiveRate);
    }
  }

  const avgRates: Partial<Record<APSubject, number>> = {};
  for (const [subj, rates] of Object.entries(avgFiveRates)) {
    avgRates[subj as APSubject] =
      Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 100) / 100;
  }

  return {
    totalStudents,
    subjectCounts,
    averageFiveRates: avgRates,
  };
}
