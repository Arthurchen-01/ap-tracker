import Link from "next/link";
import { classroom, getClassroomStats } from "@/lib/mock-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  const stats = getClassroomStats();
  const classrooms = [classroom]; // V1 only one class, but structure supports multiple

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
          {classrooms.map((cls) => {
            const subjectCount = Object.keys(stats.subjectCounts).length;
            return (
              <Link key={cls.id} href={`/${cls.id}/dashboard`}>
                <Card className="cursor-pointer transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl">{cls.name}</CardTitle>
                    <CardDescription>班级空间</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2 text-sm text-zinc-600">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">学生人数：</span>
                        <span>{stats.totalStudents}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">科目总数：</span>
                        <span>{subjectCount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
