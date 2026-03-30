export default function PersonalPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-2xl font-bold text-zinc-900">个人中心</h1>
      <p className="mt-6 text-sm text-zinc-400">
        （个人中心详细内容将在后续任务中实现）
      </p>
    </div>
  );
}
