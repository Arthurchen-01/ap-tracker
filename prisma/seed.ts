import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Subject definitions
const subjects = [
  { code: 'AP-MACRO', name: 'AP Macro', unitCount: 6, passingScore: 3 },
  { code: 'AP-MICRO', name: 'AP Micro', unitCount: 6, passingScore: 3 },
  { code: 'AP-CALCBC', name: 'AP Calc BC', unitCount: 10, passingScore: 3 },
  { code: 'AP-STATS', name: 'AP Stats', unitCount: 9, passingScore: 3 },
  { code: 'AP-PHYSICS', name: 'AP Physics', unitCount: 10, passingScore: 3 },
  { code: 'AP-CHEM', name: 'AP Chemistry', unitCount: 9, passingScore: 3 },
  { code: 'AP-BIO', name: 'AP Biology', unitCount: 8, passingScore: 3 },
  { code: 'AP-ENGLANG', name: 'AP English Lang', unitCount: 5, passingScore: 3 },
]

// Topic definitions per subject
const topicMap: Record<string, string[]> = {
  'AP-MACRO': [
    'Unit 1: Basic Economic Concepts',
    'Unit 2: Economic Indicators & the Business Cycle',
    'Unit 3: National Income & Price Determination',
    'Unit 4: Financial Sector',
    'Unit 5: Stabilization Policies',
    'Unit 6: Open Economy',
  ],
  'AP-MICRO': [
    'Unit 1: Basic Economic Concepts',
    'Unit 2: Supply & Demand',
    'Unit 3: Production, Cost & the Perfect Competition Model',
    'Unit 4: Imperfect Competition',
    'Unit 5: Factor Markets',
    'Unit 6: Market Failure & the Role of Government',
  ],
  'AP-CALCBC': [
    'Unit 1: Limits & Continuity',
    'Unit 2: Differentiation',
    'Unit 3: Composite, Implicit & Inverse Functions',
    'Unit 4: Contextual Applications of Differentiation',
    'Unit 5: Analytical Applications of Differentiation',
    'Unit 6: Integration & Accumulation of Change',
    'Unit 7: Differential Equations',
    'Unit 8: Applications of Integration',
    'Unit 9: Parametric, Polar & Vector-Valued Functions',
    'Unit 10: Infinite Sequences & Series',
  ],
  'AP-STATS': [
    'Unit 1: Exploring One-Variable Data',
    'Unit 2: Exploring Two-Variable Data',
    'Unit 3: Collecting Data',
    'Unit 4: Probability',
    'Unit 5: Sampling Distributions',
    'Unit 6: Inference for Categorical Data',
    'Unit 7: Inference for Quantitative Data',
  ],
  'AP-PHYSICS': [
    'Unit 1: Kinematics',
    'Unit 2: Dynamics',
    'Unit 3: Circular Motion & Gravitation',
    'Unit 4: Energy',
    'Unit 5: Momentum',
    'Unit 6: Simple Harmonic Motion',
    'Unit 7: Torque & Rotational Motion',
    'Unit 8: Electric Charges & Electric Force',
    'Unit 9: DC Circuits',
    'Unit 10: Mechanical Waves & Sound',
  ],
  'AP-CHEM': [
    'Unit 1: Atomic Structure & Properties',
    'Unit 2: Molecular & Ionic Compound Structure',
    'Unit 3: Intermolecular Forces & Properties',
    'Unit 4: Chemical Reactions',
    'Unit 5: Kinetics',
    'Unit 6: Thermodynamics',
    'Unit 7: Equilibrium',
    'Unit 8: Acids & Bases',
    'Unit 9: Applications of Thermodynamics',
  ],
  'AP-BIO': [
    'Unit 1: Chemistry of Life',
    'Unit 2: Cell Structure & Function',
    'Unit 3: Cellular Energetics',
    'Unit 4: Cell Communication & Cell Cycle',
    'Unit 5: Heredity',
    'Unit 6: Gene Expression & Regulation',
    'Unit 7: Natural Selection',
    'Unit 8: Ecology',
  ],
  'AP-ENGLANG': [
    'Unit 1: Rhetorical Situation',
    'Unit 2: Claims & Evidence',
    'Unit 3: Reasoning & Organization',
    'Unit 4: Style',
    'Unit 5: Craft & Structure',
  ],
}

// Exam dates
const examDates = [
  { subjectCode: 'AP-BIO', date: new Date('2026-05-04') },
  { subjectCode: 'AP-CHEM', date: new Date('2026-05-05') },
  { subjectCode: 'AP-ENGLANG', date: new Date('2026-05-06') },
  { subjectCode: 'AP-STATS', date: new Date('2026-05-07') },
  { subjectCode: 'AP-MACRO', date: new Date('2026-05-11') },
  { subjectCode: 'AP-MICRO', date: new Date('2026-05-11') },
  { subjectCode: 'AP-CALCBC', date: new Date('2026-05-12') },
  { subjectCode: 'AP-PHYSICS', date: new Date('2026-05-14') },
]

// Student data
const studentData = [
  { name: '张明宇', subjects: ['AP-MACRO', 'AP-CALCBC', 'AP-PHYSICS'], mcqBase: 82, frqBase: 75, fiveRateBase: 0.78, masteryBase: 0.80, mockCount: 4 },
  { name: '李思涵', subjects: ['AP-MICRO', 'AP-STATS', 'AP-BIO'], mcqBase: 78, frqBase: 72, fiveRateBase: 0.65, masteryBase: 0.72, mockCount: 3 },
  { name: '王子轩', subjects: ['AP-CALCBC', 'AP-CHEM', 'AP-ENGLANG'], mcqBase: 88, frqBase: 82, fiveRateBase: 0.85, masteryBase: 0.88, mockCount: 5 },
  { name: '刘雨桐', subjects: ['AP-MACRO', 'AP-MICRO', 'AP-STATS'], mcqBase: 70, frqBase: 65, fiveRateBase: 0.50, masteryBase: 0.60, mockCount: 3 },
  { name: '陈一诺', subjects: ['AP-PHYSICS', 'AP-CHEM', 'AP-CALCBC', 'AP-BIO'], mcqBase: 90, frqBase: 85, fiveRateBase: 0.92, masteryBase: 0.90, mockCount: 5 },
  { name: '赵梓萱', subjects: ['AP-ENGLANG', 'AP-MACRO', 'AP-STATS'], mcqBase: 75, frqBase: 78, fiveRateBase: 0.60, masteryBase: 0.68, mockCount: 4 },
  { name: '黄诗琪', subjects: ['AP-BIO', 'AP-CHEM', 'AP-ENGLANG'], mcqBase: 80, frqBase: 76, fiveRateBase: 0.70, masteryBase: 0.75, mockCount: 4 },
  { name: '吴浩然', subjects: ['AP-CALCBC', 'AP-PHYSICS', 'AP-MICRO'], mcqBase: 85, frqBase: 80, fiveRateBase: 0.80, masteryBase: 0.82, mockCount: 3 },
  { name: '周子墨', subjects: ['AP-STATS', 'AP-MACRO', 'AP-BIO', 'AP-CHEM'], mcqBase: 73, frqBase: 68, fiveRateBase: 0.55, masteryBase: 0.63, mockCount: 4 },
]

// Resources
const resources = [
  { title: 'AP Macro FRQ 高频考点总结', subjectCode: 'AP-MACRO', type: 'notes', studentIndex: 0, url: '#', description: '涵盖 Unit 2-6 所有 FRQ 高频考点，附例题解析' },
  { title: 'AP Calc BC 公式速查表', subjectCode: 'AP-CALCBC', type: 'notes', studentIndex: 2, url: '#', description: '所有必背公式一页纸，考前速查' },
  { title: 'AP Physics 力学专题练习', subjectCode: 'AP-PHYSICS', type: 'practice', studentIndex: 4, url: '#', description: 'Unit 1-5 力学专项50题，含详细解答' },
  { title: 'AP Chemistry 有机化学 flashcards', subjectCode: 'AP-CHEM', type: 'flashcards', studentIndex: 6, url: '#', description: 'Anki 格式的有机化学反应卡片组' },
  { title: 'AP Stats 概率分布视频讲解', subjectCode: 'AP-STATS', type: 'video', studentIndex: 1, url: '#', description: 'Unit 4 概率分布的30分钟视频精讲' },
  { title: 'AP Bio 细胞生物学思维导图', subjectCode: 'AP-BIO', type: 'notes', studentIndex: 5, url: '#', description: 'Unit 2-4 完整思维导图，一图看懂细胞结构与功能' },
  { title: 'AP English Lang 修辞手法整理', subjectCode: 'AP-ENGLANG', type: 'notes', studentIndex: 3, url: '#', description: '常见修辞手法清单+范文标注' },
  { title: 'AP Micro 市场结构对比表', subjectCode: 'AP-MICRO', type: 'notes', studentIndex: 7, url: '#', description: '完全竞争/垄断/寡头/垄断竞争四象限对比' },
]

function rnd(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

async function main() {
  console.log('🌱 Starting seed...')

  // Clear existing data
  await prisma.resource.deleteMany()
  await prisma.probabilitySnapshot.deleteMany()
  await prisma.dailyUpdate.deleteMany()
  await prisma.assessmentRecord.deleteMany()
  await prisma.studentSubject.deleteMany()
  await prisma.examDate.deleteMany()
  await prisma.student.deleteMany()
  await prisma.subject.deleteMany()
  await prisma.class.deleteMany()

  // Create class
  const cls = await prisma.class.create({
    data: { name: 'AP备考班2026', season: '2026 Spring' },
  })
  console.log(`✅ Class created: ${cls.name}`)

  // Create subjects
  for (const s of subjects) {
    await prisma.subject.create({ data: s })
  }
  console.log(`✅ ${subjects.length} subjects created`)

  // Create exam dates
  for (const ed of examDates) {
    await prisma.examDate.create({
      data: { classId: cls.id, subjectCode: ed.subjectCode, examDate: ed.date },
    })
  }
  console.log(`✅ ${examDates.length} exam dates created`)

  // Create students
  const mockLabels = ['Mock 1', 'Mock 2', 'Mock 3', 'Mock 4', 'Mock 5']
  const mockDates = [
    new Date('2026-02-15'),
    new Date('2026-03-01'),
    new Date('2026-03-15'),
    new Date('2026-03-28'),
    new Date('2026-04-10'),
  ]

  const createdStudents: { id: string; name: string }[] = []

  for (const sd of studentData) {
    const student = await prisma.student.create({
      data: { classId: cls.id, name: sd.name, role: 'student' },
    })
    createdStudents.push({ id: student.id, name: sd.name })

    for (const subjCode of sd.subjects) {
      // StudentSubject
      await prisma.studentSubject.create({
        data: { studentId: student.id, subjectCode: subjCode, targetScore: 5 },
      })

      // Assessment records
      for (let i = 0; i < sd.mockCount; i++) {
        const mcq = Math.min(100, Math.max(0, rnd(sd.mcqBase - 10, sd.mcqBase + 8)))
        const frq = Math.min(100, Math.max(0, rnd(sd.frqBase - 10, sd.frqBase + 8)))
        const overall = Math.min(100, Math.max(0, rnd(mcq * 0.6 + frq * 0.4 - 2, mcq * 0.6 + frq * 0.4 + 2)))

        // MCQ record
        await prisma.assessmentRecord.create({
          data: {
            studentId: student.id,
            subjectCode: subjCode,
            recordType: 'MCQ',
            timedMode: i >= 2 ? 'timed' : 'untimed',
            difficulty: 'medium',
            scoreRaw: mcq,
            scorePercent: mcq,
            takenAt: mockDates[i],
          },
        })

        // FRQ record
        await prisma.assessmentRecord.create({
          data: {
            studentId: student.id,
            subjectCode: subjCode,
            recordType: 'FRQ',
            timedMode: i >= 2 ? 'timed' : 'untimed',
            difficulty: 'medium',
            scoreRaw: frq,
            scorePercent: frq,
            takenAt: mockDates[i],
          },
        })
      }

      // Probability snapshot
      const fiveRate = rnd(sd.fiveRateBase - 0.1, sd.fiveRateBase + 0.1)
      await prisma.probabilitySnapshot.create({
        data: {
          studentId: student.id,
          subjectCode: subjCode,
          snapshotDate: new Date(),
          fiveRate,
          readinessScore: rnd(0.5, 0.95),
          stabilityScore: rnd(0.5, 0.9),
          trendScore: rnd(-0.1, 0.15),
          decayScore: rnd(0, 0.05),
          confidenceLevel: fiveRate >= 0.7 ? 'high' : fiveRate >= 0.5 ? 'medium' : 'low',
          explanation: '初始评估',
        },
      })

      // Topic mastery (we store as part of snapshot explanation for V1)
      // In a real app this would be a separate table, keeping it simple for V1
    }

    console.log(`✅ Student created: ${sd.name} (${sd.subjects.length} subjects)`)
  }

  // Create resources
  for (let i = 0; i < resources.length; i++) {
    const r = resources[i]
    await prisma.resource.create({
      data: {
        uploaderId: createdStudents[r.studentIndex].id,
        subjectCode: r.subjectCode,
        title: r.title,
        resourceType: r.type,
        description: r.description,
        url: r.url,
      },
    })
  }
  console.log(`✅ ${resources.length} resources created`)

  // Summary
  const counts = {
    classes: await prisma.class.count(),
    students: await prisma.student.count(),
    subjects: await prisma.subject.count(),
    studentSubjects: await prisma.studentSubject.count(),
    examDates: await prisma.examDate.count(),
    assessments: await prisma.assessmentRecord.count(),
    snapshots: await prisma.probabilitySnapshot.count(),
    resources: await prisma.resource.count(),
  }
  console.log('\n📊 Seed summary:', counts)
  console.log('🌱 Seed complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
