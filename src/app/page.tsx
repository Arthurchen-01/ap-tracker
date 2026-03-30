import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InfoChip } from "@/components/info-chip";

export default async function Home() {
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function getDaysUntil(dateInput: Date | string): number {
    const d = new Date(dateInput);
    d.setHours(0, 0, 0, 0);
    return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  const allUpcoming = classes
    .flatMap((cls) =>
      cls.examDates
        .map((ed) => ({
          className: cls.name,
          subject: ed.subjectCode,
          date: ed.examDate,
          days: getDaysUntil(ed.examDate),
        }))
        .filter((e) => e.days >= 0),
    )
    .sort((a, b) => a.days - b.days);

  const nextExam = allUpcoming[0] ?? null;

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl bg-zinc-900 px-6 py-8 text-white">
            <p className="text-sm font-medium text-zinc-300">AP AI 动态备考平台</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              让学生、老师和管理者
              <br />
              一眼看懂现在离 5 分还有多远
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-300 sm:text-base">
              这里不是普通成绩表。重点是把“当前结果、结果稳不稳、最近有没有变、下一步该做什么”放到同一个地方。
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-zinc-200">
              <span className="rounded-full bg-white/10 px-3 py-1">学生看下一步</span>
              <span className="rounded-full bg-white/10 px-3 py-1">老师看谁该优先关注</span>
              <span className="rounded-full bg-white/10 px-3 py-1">管理者看结构是否清楚</span>
              <InfoChip tip="5 分率、参考区间、趋势和下一步建议的统一解释都在说明页里。" />
            </div>
          </div>

          <Card className="border-zinc-200 bg-white">
            <CardHeader>
              <CardTitle>第一次使用先看什么</CardTitle>
              <CardDescription>
                按这个顺序看，最容易快速判断系统有没有帮助到学生和老师。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-zinc-600">
              <div>1. 先进入班级仪表盘，看全班整体 5 分率和预警情况。</div>
              <div>2. 再进个人中心，看某个学生当前结果、证据量和下一步建议。</div>
              <div>3. 最后去每日更新和资源共享，检查日常使用是不是顺手。</div>
              <Link
                href="/explanations"
                className="inline-flex text-sm font-medium text-zinc-900 underline underline-offset-4"
              >
                查看 5 分率说明页
              </Link>
            </CardContent>
          </Card>
        </div>

        {nextExam && (
          <Card className="mt-8 border-2 border-amber-200 bg-amber-50/70">
            <CardContent className="flex flex-wrap items-center gap-6 py-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-amber-700">{nextExam.days}</div>
                <div className="mt-1 text-sm text-amber-600">天</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-zinc-800">
                  最近一场考试：{nextExam.subject}
                </div>
                <div className="mt-1 text-sm text-zinc-500">
                  {new Date(nextExam.date).toLocaleDateString("zh-CN")} · {nextExam.className}
                </div>
                {nextExam.days <= 7 && (
                  <div className="mt-2 text-sm font-medium text-red-600">
                    不到一周，建议优先回顾核心错题和整套节奏。
                  </div>
                )}
                {nextExam.days > 7 && nextExam.days <= 14 && (
                  <div className="mt-2 text-sm font-medium text-amber-700">
                    倒计时两周内，建议开始提高整套模考频率。
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-10">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-2xl font-bold text-zinc-900">选择班级</h2>
            <InfoChip tip="进入班级后会优先展示全班整体状态，再往下看个人和单科。"/>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((cls: HomeClass) => {
              const totalSubjects = cls.students.reduce(
                (sum: number, s: HomeStudent) => sum + s.subjects.length,
                0,
              );

              const classNext = cls.examDates
                .map((ed) => ({
                  subject: ed.subjectCode,
                  days: getDaysUntil(ed.examDate),
                }))
                .filter((e) => e.days >= 0)
                .sort((a, b) => a.days - b.days)[0];

              return (
                <Link key={cls.id} href={`/${cls.id}/dashboard`}>
                  <Card className="h-full cursor-pointer border-zinc-200 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-xl">{cls.name}</CardTitle>
                      <CardDescription>{cls.season}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-zinc-600">
                      <div className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2">
                        <span>学生人数</span>
                        <span className="font-semibold text-zinc-900">{cls.students.length}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2">
                        <span>报考总科次</span>
                        <span className="font-semibold text-zinc-900">{totalSubjects}</span>
                      </div>
                      {classNext && (
                        <div className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2">
                          <span>最近考试</span>
                          <span className="font-semibold text-zinc-900">
                            {classNext.subject} · {classNext.days} 天后
                          </span>
                        </div>
                      )}
                      <p className="pt-1 text-xs text-zinc-500">
                        点击后先看全班整体状态，再决定谁要优先关注。
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {classes.length === 0 && (
            <div className="py-12 text-center text-zinc-500">
              还没有班级数据，请先运行 seed 创建演示数据。
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
