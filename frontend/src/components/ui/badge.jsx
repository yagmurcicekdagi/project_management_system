import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils.js";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gray-900 text-white hover:bg-gray-900/80 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-100/80",
        secondary:
          "border-transparent bg-gray-100 text-gray-900 dark:bg-zinc-800 dark:text-zinc-100",
        outline: "text-gray-900 dark:text-zinc-100",
        success: "border-transparent bg-green-600 text-white",
        warning: "border-transparent bg-yellow-500 text-black",
        destructive: "border-transparent bg-red-600 text-white",
      },
    },
    defaultVariants: {
      variant: "secondary",
    },
  },
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
