"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "仪表盘", href: "dashboard" },
  { label: "个人中心", href: "personal" },
  { label: "每日更新", href: "daily-update" },
  { label: "记录测试", href: "record-test" },
  { label: "资源共享", href: "resources" },
];

interface MeData {
  studentId: string;
  name: string;
  classId: string;
}

export default function ClassLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const classId = params.classId as string;
  const [user, setUser] = useState<MeData | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data?.studentId) {
          router.push("/login");
        } else {
          setUser(data);
        }
      });
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top navbar */}
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1 text-sm font-medium text-zinc-700 hover:text-zinc-900"
            >
              ← 返回首页
            </Link>
            <span className="text-sm text-zinc-400">|</span>
            <span className="text-sm font-semibold text-zinc-900">AP 备考班</span>
          </div>

          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const href = `/${classId}/${item.href}`;
              const isActive = pathname.startsWith(href);
              return (
                <Link
                  key={item.href}
                  href={href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <>
                <span className="text-sm font-medium text-zinc-700">
                  👤 {user.name}
                </span>
                <Button variant="outline" size="xs" onClick={handleLogout}>
                  登出
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
