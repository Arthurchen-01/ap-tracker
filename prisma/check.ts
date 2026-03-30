import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

async function main() {
  const classes = await p.class.findMany()
  console.log('=== Classes ===')
  console.log(JSON.stringify(classes, null, 2))

  const students = await p.student.findMany({ take: 3 })
  console.log('\n=== Students (first 3) ===')
  console.log(JSON.stringify(students, null, 2))

  const snapshots = await p.probabilitySnapshot.findMany({ take: 3 })
  console.log('\n=== Snapshots (first 3) ===')
  console.log(JSON.stringify(snapshots, null, 2))

  const assessments = await p.assessmentRecord.findMany({ take: 3 })
  console.log('\n=== Assessments (first 3) ===')
  console.log(JSON.stringify(assessments, null, 2))

  const updates = await p.dailyUpdate.findMany({ take: 3 })
  console.log('\n=== DailyUpdates (first 3) ===')
  console.log(JSON.stringify(updates, null, 2))
}

main().then(() => p.$disconnect())
