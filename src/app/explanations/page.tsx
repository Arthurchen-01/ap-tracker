import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const entries = [
  {
    title: "当前 5 分率",
    body: "表示如果现在参加 AP 考试，拿到 5 分的估计概率。它不是承诺值，而是根据最近成绩、题型表现和复习质量得出的动态判断。",
  },
  {
    title: "参考区间",
    body: "表示当前判断的大致波动范围。测试越多、数据越新，区间通常越窄；数据越少，区间会更宽。",
  },
  {
    title: "最近趋势",
    body: "表示最近几次有效测试后，5 分率是在上升、持平还是回落。趋势只看最近阶段，不代表整学期全部表现。",
  },
  {
    title: "最近有效测试",
    body: "只统计最近能反映真实水平的 MCQ、FRQ 或整套模考。练习数量很多不等于有效测试多，关键是是否能代表当前状态。",
  },
  {
    title: "下一步建议",
    body: "系统会优先指出最值得做的下一步动作，例如先补 FRQ、补 timed 训练，或优先处理某一门低 5 分率学科。",
  },
  {
    title: "置信等级",
    body: "置信等级不是“好坏”，而是“证据够不够”。证据越多、越稳定，当前判断越值得参考；证据少时要继续补测试。",
  },
];

export default function ExplanationsPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-medium text-zinc-500">说明页</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
            5 分率平台怎么看
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
            这页是给学生、老师和管理者统一看的快速说明。每个词都尽量用大白话解释，目标是 5 分钟内看明白。
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {entries.map((entry) => (
            <Card key={entry.title}>
              <CardHeader>
                <CardTitle className="text-lg">{entry.title}</CardTitle>
                <CardDescription>点击页面里的 i 也会跳到这里。</CardDescription>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-zinc-700">
                {entry.body}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600">
          如果你是第一次看这个网站，建议先从首页进入班级，再看班级仪表盘和个人中心。
          <Link
            href="/"
            className="ml-2 font-medium text-zinc-900 underline underline-offset-4"
          >
            回到首页
          </Link>
        </div>
      </div>
    </div>
  );
}
