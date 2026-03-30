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
    },
  });

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

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => {
            const totalSubjects = cls.students.reduce(
              (sum, s) => sum + s.subjects.length,
              0
            );
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
