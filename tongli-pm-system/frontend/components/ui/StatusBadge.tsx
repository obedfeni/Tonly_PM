"use client";
import { useLang } from "@/lib/lang-context";
import type { TranslationKey } from "@/lib/i18n";

type Status = "red" | "orange" | "yellow" | "green" | string;

const MAP: Record<string, { bg: string; text: string; dot: string; labelKey: TranslationKey }> = {
  red:    { bg: "bg-red-500/20",    text: "text-red-400",    dot: "bg-red-500",    labelKey: "status_red"    },
  orange: { bg: "bg-orange-500/20", text: "text-orange-400", dot: "bg-orange-500", labelKey: "status_orange" },
  yellow: { bg: "bg-yellow-500/20", text: "text-yellow-400", dot: "bg-yellow-500", labelKey: "status_yellow" },
  green:  { bg: "bg-green-500/20",  text: "text-green-400",  dot: "bg-green-500",  labelKey: "status_green"  },
};

export function StatusBadge({ status }: { status: Status }) {
  const { t } = useLang();
  const s = MAP[status] ?? MAP.green;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {t(s.labelKey)}
    </span>
  );
}
