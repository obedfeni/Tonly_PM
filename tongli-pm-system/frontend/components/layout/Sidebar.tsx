"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Truck, BrainCircuit, AlertTriangle,
  BarChart3, Settings, Upload, Globe2,
} from "lucide-react";
import { useLang } from "@/lib/lang-context";
import type { TranslationKey } from "@/lib/i18n";

const NAV: { href: string; icon: React.ElementType; key: TranslationKey }[] = [
  { href: "/",                  icon: LayoutDashboard, key: "nav_dashboard"    },
  { href: "/trucks",            icon: Truck,           key: "nav_trucks"       },
  { href: "/predictions",       icon: BrainCircuit,    key: "nav_predictions"  },
  { href: "/anomalies",         icon: AlertTriangle,   key: "nav_anomalies"    },
  { href: "/model-performance", icon: BarChart3,       key: "nav_model"        },
  { href: "/data",              icon: Upload,          key: "nav_data"         },
  { href: "/settings",          icon: Settings,        key: "nav_settings"     },
];

export function Sidebar() {
  const { lang, setLang, t } = useLang();
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2.5 mb-0.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Truck className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm text-white leading-snug">{t("app_name")}</span>
        </div>
        <p className="text-xs text-gray-500 pl-10 leading-tight">{t("app_subtitle")}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, key }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${active
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
                }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{t(key)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Language Toggle */}
      <div className="px-4 py-4 border-t border-gray-800">
        <div className="flex items-center gap-2 mb-2.5">
          <Globe2 className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs text-gray-500 uppercase tracking-widest">Language</span>
        </div>
        <div className="flex gap-1.5">
          {(["en", "zh"] as const).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all
                ${lang === l
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-800 text-gray-500 hover:text-gray-200 hover:bg-gray-700"}`}
            >
              {l === "en" ? "English" : "中文"}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
