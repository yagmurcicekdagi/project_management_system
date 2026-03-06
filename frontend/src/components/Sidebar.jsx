import React from "react";
import { Link, useLocation } from "react-router-dom";
import Separator from "./ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

function SidebarItem({ item, collapsed, active }) {
  const content = (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
        active
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted",
      )}
    >
      {item.icon ? <span className="shrink-0">{item.icon}</span> : null}
      {!collapsed && <span className="truncate">{item.label}</span>}
    </div>
  );

  if (collapsed) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <Link to={item.to} className="block">
              {content}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Link to={item.to} className="block">
      {content}
    </Link>
  );
}

export function Sidebar({
  items = [],
  logo = null,
  footer = null,
  collapsed = false,
  onCollapseChange = () => {},
  className = "",
}) {
  const location = useLocation();
  const width = collapsed ? "w-[72px]" : "w-64";

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 border-r bg-background transition-[width] duration-100 ease-in-out",
        width,
        className,
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-14 items-center justify-between px-3">
          <div className="flex items-center gap-2 overflow-hidden">
            {!collapsed && logo}
            {!collapsed && (
              <span className="font-semibold truncate">Project Manager</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCollapseChange(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="shrink-0 ml-auto"
          >
            {collapsed ? (
              // Hamburger — click to EXPAND
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                className="opacity-80"
              >
                <path
                  fill="currentColor"
                  d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"
                />
              </svg>
            ) : (
              // Left chevron — click to COLLAPSE
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                className="opacity-80"
              >
                <path
                  fill="currentColor"
                  d="M15.41 16.59L14 18l-6-6l6-6l1.41 1.41L10.83 12z"
                />
              </svg>
            )}
          </Button>
        </div>

        <Separator />

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.to}>
                <SidebarItem
                  item={item}
                  collapsed={collapsed}
                  active={location.pathname === item.to}
                />
              </li>
            ))}
          </ul>
        </nav>

        <Separator />

        {/* Footer */}
        <div className="p-2 mt-auto">
          {footer ? (
            footer
          ) : (
            <button
              type="button"
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
                collapsed && "justify-center",
              )}
            >
              <span className="shrink-0">
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12 8a4 4 0 1 1 0 8a4 4 0 0 1 0-8m9.44 4.5c0-.52-.05-1.03-.14-1.53l2.12-1.65l-2-3.46l-2.49 1a8.43 8.43 0 0 0-2.65-1.53l-.38-2.65h-4l-.38 2.65a8.43 8.43 0 0 0-2.65 1.53l-2.49-1l-2 3.46l2.12 1.65c-.09.5-.14 1.01-.14 1.53s.05 1.03.14 1.53L2 15.68l2 3.46l2.49-1c.78.63 1.68 1.14 2.65 1.53l.38 2.65h4l.38-2.65c.97-.39 1.87-.9 2.65-1.53l2.49 1l2-3.46l-2.12-1.65c.09-.5.14-1.01.14-1.53"
                  />
                </svg>
              </span>
              {!collapsed && <span>Settings</span>}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
  //   return (
  //     <aside
  //       className={cn(
  //         "fixed inset-y-0 left-0 z-40 border-r bg-background",
  //         width,
  //         className,
  //       )}
  //     >
  //       <div className="flex h-full flex-col">
  //         <div className="flex h-14 items-center justify-between px-3">
  //           <div className="flex items-center gap-2 overflow-hidden">
  //             {collapsed ? null : logo}
  //             {!collapsed && (
  //               <span className="font-semibold truncate">Project Manager</span>
  //             )}
  //           </div>
  //           <Button
  //             variant="ghost"
  //             size="icon"
  //             onClick={() => onCollapseChange(!collapsed)}
  //             aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
  //           >
  //             {collapsed ? (
  //               <svg
  //                 width="22"
  //                 height="22"
  //                 viewBox="0 0 24 24"
  //                 className="opacity-80"
  //               >
  //                 <path
  //                   fill="currentColor"
  //                   d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"
  //                 />
  //               </svg>
  //             ) : (
  //               <svg
  //                 width="20"
  //                 height="20"
  //                 viewBox="0 0 24 24"
  //                 className="opacity-80"
  //               >
  //                 <path
  //                   fill="currentColor"
  //                   d="M8.59 16.59L10 18l6-6l-6-6l-1.41 1.41L13.17 12z"
  //                 />
  //               </svg>
  //             )}
  //           </Button>
  //         </div>
  //         <Separator />
  //         <nav className="flex-1 overflow-y-auto p-2">
  //           <ul className="space-y-1">
  //             {items.map((item) => (
  //               <li key={item.to}>
  //                 <SidebarItem
  //                   item={item}
  //                   collapsed={collapsed}
  //                   active={location.pathname === item.to}
  //                 />
  //               </li>
  //             ))}
  //           </ul>
  //         </nav>
  //         <Separator />
  //         <div className="p-2 mt-auto">
  //           {footer ? (
  //             footer
  //           ) : (
  //             <button
  //               type="button"
  //               className={cn(
  //                 "w-full flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted",
  //                 collapsed && "justify-center",
  //               )}
  //             >
  //               <span className="shrink-0">
  //                 <svg width="22" height="22" viewBox="0 0 24 24">
  //                   <path
  //                     fill="currentColor"
  //                     d="M12 8a4 4 0 1 1 0 8a4 4 0 0 1 0-8m9.44 4.5c0-.52-.05-1.03-.14-1.53l2.12-1.65l-2-3.46l-2.49 1a8.43 8.43 0 0 0-2.65-1.53l-.38-2.65h-4l-.38 2.65a8.43 8.43 0 0 0-2.65 1.53l-2.49-1l-2 3.46l2.12 1.65c-.09.5-.14 1.01-.14 1.53s.05 1.03.14 1.53L2 15.68l2 3.46l2.49-1c.78.63 1.68 1.14 2.65 1.53l.38 2.65h4l.38-2.65c.97-.39 1.87-.9 2.65-1.53l2.49 1l2-3.46l-2.12-1.65c.09-.5.14-1.01.14-1.53"
  //                   />
  //                 </svg>
  //               </span>
  //               {!collapsed && <span>Settings</span>}
  //             </button>
  //           )}
  //         </div>
  //       </div>
  //     </aside>
  //   );
  // }
}
export default Sidebar;
