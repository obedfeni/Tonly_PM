import { type ReactNode } from "react";
import { Card } from "./Card";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  color?: "blue" | "red" | "orange" | "yellow" | "green" | "gray";
}

const colors = {
  blue:   { icon: "bg-blue-500/20 text-blue-400",     border: "border-blue-500/20"   },
  red:    { icon: "bg-red-500/20 text-red-400",       border: "border-red-500/20"    },
  orange: { icon: "bg-orange-500/20 text-orange-400", border: "border-orange-500/20" },
  yellow: { icon: "bg-yellow-500/20 text-yellow-400", border: "border-yellow-500/20" },
  green:  { icon: "bg-green-500/20 text-green-400",   border: "border-green-500/20"  },
  gray:   { icon: "bg-gray-700 text-gray-400",        border: "border-gray-700"       },
};

export function StatCard({ label, value, sub, icon, color = "blue" }: StatCardProps) {
  const c = colors[color];
  return (
    <Card className={`border ${c.border}`}>
      <div className="p-5 flex items-start gap-4">
        {icon && <div className={`p-2.5 rounded-lg flex-shrink-0 ${c.icon}`}>{icon}</div>}
        <div className="min-w-0">
          <p className="text-sm text-gray-400 truncate">{label}</p>
          <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
        </div>
      </div>
    </Card>
  );
}
