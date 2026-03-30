"use client";

import Link from "next/link";

interface InfoChipProps {
  label?: string;
  tip: string;
  href?: string;
}

export function InfoChip({
  label = "i",
  tip,
  href = "/explanations",
}: InfoChipProps) {
  return (
    <Link
      href={href}
      title={tip}
      aria-label={tip}
      className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 bg-white text-[11px] font-semibold text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700"
    >
      {label}
    </Link>
  );
}
