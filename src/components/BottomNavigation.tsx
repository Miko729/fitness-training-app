import { NavLink } from "react-router-dom";

export type NavigationTab =
  | "home"
  | "training"
  | "weekly"
  | "history"
  | "settings";

export interface BottomNavigationProps {
  activeTab: NavigationTab;
  trainingHref?: string;
}

const tabs: { id: NavigationTab; label: string; href: string }[] = [
  { id: "home", label: "首页", href: "/" },
  { id: "training", label: "训练", href: "/training" },
  { id: "weekly", label: "周计划", href: "/weekly" },
  { id: "history", label: "历史", href: "/history" },
  { id: "settings", label: "设置", href: "/settings" },
];

export default function BottomNavigation({
  activeTab,
  trainingHref = "/training",
}: BottomNavigationProps) {
  return (
    <nav
      aria-label="底部导航"
      className="mx-auto grid w-full max-w-2xl grid-cols-5 gap-1"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const to = tab.id === "training" ? trainingHref : tab.href;

        return (
          <NavLink
            key={tab.id}
            to={to}
            aria-current={isActive ? "page" : undefined}
            className={`flex min-h-12 flex-col items-center justify-center rounded-xl px-1 py-2 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-300 ${
              isActive
                ? "bg-emerald-400/10 text-emerald-300"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            {tab.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
