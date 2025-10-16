import { usePathname } from "@/hooks/use-pathname";
import { cn } from "@/lib/utils";
import {
  Download,
  Eye,
  Home,
  RotateCcw,
  Scissors,
  Settings,
  Video
} from 'lucide-react';
import { Link } from "react-router-dom";

type NavItemProps = {
  path: string;
  title: string;
  tip?: string;
  isCollapsed?: boolean;
}

// 图标映射
const iconMap: { [key: string]: any } = {
  "/": Home,
  "/export": Download,
  "/review": Eye,
  "/restore": RotateCcw,
  "/split": Scissors,
  "/video": Video,
  "/setting": Settings,
};

export default function NavItem({ path, title, tip, isCollapsed = false }: NavItemProps) {
  const pathname = usePathname();
  const active = path === pathname;
  const Icon = iconMap[path] || Home;
  
  return (
    <div className="group relative">
      <Link to={path}>
        <div className={cn(
          "relative flex items-center transition-all duration-300 ease-in-out",
          "rounded-xl mb-2 cursor-pointer overflow-hidden",
          isCollapsed ? "w-12 h-12 justify-center" : "w-full h-12 px-4",
          active 
            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25" 
            : "text-gray-600 hover:bg-gray-100 hover:text-blue-600",
          "hover:scale-105 hover:shadow-md"
        )}>
          {/* 背景动画效果 */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 opacity-0",
            "group-hover:opacity-10 transition-opacity duration-300",
            active && "opacity-0"
          )} />
          
          {/* 图标 */}
          <Icon className={cn(
            "transition-all duration-300",
            isCollapsed ? "w-5 h-5" : "w-5 h-5 mr-3",
            active ? "text-white" : "text-current"
          )} />
          
          {/* 文字 */}
          {!isCollapsed && (
            <span className={cn(
              "font-medium text-sm transition-all duration-300",
              active ? "text-white" : "text-current"
            )}>
              {title}
            </span>
          )}
          
          {/* 激活状态指示器 */}
          {active && (
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-l-full" />
          )}
        </div>
      </Link>
      
      {/* Tooltip for collapsed state */}
      {isCollapsed && tip && (
        <div className={cn(
          "absolute left-full ml-2 top-1/2 transform -translate-y-1/2",
          "bg-gray-800 text-white text-sm px-3 py-2 rounded-lg",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
          "pointer-events-none whitespace-nowrap z-50",
          "before:content-[''] before:absolute before:right-full before:top-1/2",
          "before:transform before:-translate-y-1/2 before:border-4",
          "before:border-transparent before:border-r-gray-800"
        )}>
          <div className="font-medium">{title}</div>
          <div className="text-xs text-gray-300 mt-1">{tip}</div>
        </div>
      )}
    </div>
  );
}