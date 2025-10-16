import TitleBar from "@/components/title_bar";
import {
  Download,
  Eye,
  Gamepad2,
  Home,
  RotateCcw,
  Scissors,
  Settings,
  Video
} from "lucide-react";
import React from "react";
import { Link, useLocation } from "react-router-dom";
import iconPng from "../assets/icon.png";
// 模拟 usePathname hook
const usePathname = () => {
  return useLocation().pathname;
};

// 图标映射
const iconMap = {
  "/": Home,
  "/export": Download,
  "/review": Eye,
  "/restore": RotateCcw,
  "/split": Scissors,
  "/video": Video,
  "/setting": Settings,
  "/game_share": Gamepad2,
};

type IconMapKeys = keyof typeof iconMap;

interface NavItemProps {
  path: string;
  title: string;
  icon: React.ElementType;
  tip: string;
}

// 美化后的 NavItem 组件
function NavItem({ path, title, icon: Icon }: NavItemProps) {
  const pathname = usePathname();
  const active = path === pathname;

  return (
    <div className="group relative">
      <Link
        to={path}
        className={`
          relative flex items-center transition-all duration-300 ease-in-out
          w-full h-12 px-4
          rounded-xl mb-2 cursor-pointer overflow-hidden
          ${
            active
              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
              : "text-gray-600 hover:bg-gray-100 hover:text-blue-600"
          }
          hover:scale-105 hover:shadow-md
        `}
      >
        {/* 背景动画效果 */}
        <div
          className={`
            absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 opacity-0 
            group-hover:opacity-10 transition-opacity duration-300
            ${active ? "opacity-0" : ""}
          `}
        />

        {/* 图标 */}
        <Icon
          className={`
            w-5 h-5 mr-3
            transition-all duration-300
            ${active ? "text-white" : "text-current"}
          `}
        />

        {/* 文字 */}
        <span
          className={`
              font-medium text-sm transition-all duration-300
              ${active ? "text-white" : "text-current"}
            `}
        >
          {title}
        </span>

        {/* 激活状态指示器 */}
        {active && (
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-l-full" />
        )}
      </Link>
    </div>
  );
}

const navConfig: { title: string; path: IconMapKeys; tip: string }[] = [
  {
    title: "首页",
    path: "/",
    tip: "更新日志，基础数据统计",
  },
  {
    title: "导出",
    path: "/export",
    tip: "导出数据，自定义导出",
  },
  {
    title: "预览",
    path: "/review",
    tip: "预览spine动画",
  },
  {
    title: "还原",
    path: "/restore",
    tip: "还原spine动画",
  },
  {
    title: "裁切",
    path: "/split",
    tip: "裁切atlas图片",
  },
  {
    title: "视频教程",
    path: "/video",
    tip: "视频教程",
  },
  {
    title: "设置",
    path: "/setting",
    tip: "设置spine路径，自定义导出格式",
  },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const noScrollbarRoutes = [
    "/export",
    "/review",
    "/restore",
    "/split",
    "/video",
    "/setting",
    "/game_share",
  ];
  const mainClass = `flex-1 p-6 bg-gray-50 pt-12 overflow-y-auto ${
    noScrollbarRoutes.includes(pathname) ? "no-scrollbar" : ""
  }`;
  return (
    <div className="flex h-screen bg-gray-50">
      {/* 侧边栏 */}
      <div
        className={`
        w-48
        transition-all duration-300 ease-in-out
        bg-white shadow-xl border-r border-gray-200
        flex flex-col relative
      `}
      >
        {/* 头部区域 */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className={`flex items-center`}>
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                {/* <div className="w-6 h-6 bg-white rounded-md opacity-90" /> */}
                <img src={iconPng}></img>
              </div>

              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-800">Spine</h1>
                <p className="text-xs text-gray-500">工具箱</p>
              </div>
            </div>
          </div>
        </div>

        {/* 导航菜单 */}
        <div className="flex-1 p-4 overflow-y-auto">
          <nav className="space-y-1">
            {navConfig.map((item) => {
              const Icon = iconMap[item.path] || Home;
              return (
                <NavItem
                  key={item.path}
                  title={item.title}
                  path={item.path}
                  icon={Icon}
                  tip={item.tip}
                />
              );
            })}
          </nav>
        </div>

        {/* 底部装饰 */}
        <div className="p-4 border-t border-gray-100">
          <div
            className={`
            w-full h-2
            bg-gradient-to-r from-blue-400 to-purple-500 rounded-full
            transition-all duration-300
          `}
          />
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TitleBar />
        <main className={mainClass}>
          <div className="border-gray-200">{children}</div>
        </main>
      </div>
    </div>
  );
}
