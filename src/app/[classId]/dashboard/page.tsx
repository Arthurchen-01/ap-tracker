import { classroom } from "@/lib/mock-data";

export default function DashboardPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-2xl font-bold text-zinc-900">班级仪表盘</h1>
      <p className="mt-2 text-zinc-500">{classroom.name}</p>
      <p className="mt-6 text-sm text-zinc-400">
        （仪表盘详细内容将在后续任务中实现）
      </p>
    </div>
  );
}
