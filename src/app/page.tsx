import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function Home() {
  // Fetch classes from database
  const classes = await prisma.class.findMany({
    include: {
      students: {
        include: {
          subjects: true,
        },
      },
      examDates: {
        orderBy: { examDate: "asc" as const },
      },
    },
  });
  type HomeClass = (typeof classes)[number];
  type HomeStudent = HomeClass["students"][number];

  // Compute nearest exam countdown
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function getDaysUntil(dateInput: Date | string): number {
    const d = new Date(dateInput);
    d.setHours(0, 0, 0, 0);
    return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Find the soonest upcoming exam across all classes
  const allUpcoming = classes.flatMap((cls) =>
    cls.examDates
      .map((ed) => ({
        className: cls.name,
        subject: ed.subjectCode,
        date: ed.examDate,
        days: getDaysUntil(ed.examDate),
      }))
      .filter((e) => e.days >= 0)
  );
  allUpcoming.sort((a, b) => a.days - b.days);
  const nextExam = allUpcoming[0] ?? null;

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            AP 备考追踪平台
          </h1>
          <p className="mt-3 text-lg text-zinc-500">
            选择班级，开始追踪备考进度
          </p>
        </div>

        {/* Next exam countdown */}
        {nextExam && (
          <Card className="mb-8 border-2 border-amber-200 bg-amber-50/50">
            <CardContent className="flex items-center gap-6 py-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-amber-700">
                  {nextExam.days}
                </div>
                <div className="text-sm text-amber-600 mt-1">天</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-zinc-800">
                  最近一场考试：{nextExam.subject}
                </div>
                <div className="text-sm text-zinc-500 mt-1">
                  {typeof nextExam.date === 'string' ? nextExam.date : new Date(nextExam.date).toLocaleDateString("zh-CN")} · {nextExam.className}
                </div>
                {nextExam.days <= 7 && (
                  <div className="mt-2 text-sm font-medium text-red-600">
                    ⚡ 不到一周！请集中复习
                  </div>
                )}
                {nextExam.days > 7 && nextExam.days <= 14 && (
                  <div className="mt-2 text-sm font-medium text-amber-600">
                    📌 倒计时两周内，进入冲刺阶段
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Class cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls: HomeClass) => {
            const totalSubjects = cls.students.reduce(
              (sum: number, s: HomeStudent) => sum + s.subjects.length,
              0
            );
            // Find next exam for this class
            const classNext = cls.examDates
              .map((ed) => ({ subject: ed.subjectCode, date: ed.examDate, days: getDaysUntil(ed.examDate) }))
              .filter((e) => e.days >= 0)
              .sort((a, b) => a.days - b.days)[0];
            return (
              <Link key={cls.id} href={`/${cls.id}/dashboard`}>
                <Card className="cursor-pointer transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl">{cls.name}</CardTitle>
                    <CardDescription>{cls.season}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2 text-sm text-zinc-600">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">学生人数：</span>
                        <span>{cls.students.length}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">报考总科次：</span>
                        <span>{totalSubjects}</span>
                      </div>
                      {classNext && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">最近考试：</span>
                          <span>
                            {classNext.subject}（{classNext.days}天后）
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {classes.length === 0 && (
          <div className="text-center text-zinc-500 py-12">
            暂无班级，请先运行 seed 创建数据
          </div>
        )}
      </div>
    </div>
  );
}
