import * as React from "react";

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

type TooltipTriggerProps = Readonly<{
  asChild?: boolean;
  children: React.ReactElement;
}>

export function TooltipTrigger({ asChild, children }: TooltipTriggerProps) {
  const [title] = React.useState("");
  const child = React.Children.only(children) as React.ReactElement<React.HTMLAttributes<HTMLElement>>;
  return React.cloneElement(child, {
    title: child.props.title ?? title,
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      if (child.props.onMouseEnter) child.props.onMouseEnter(e);
    },
  });
}

export function TooltipContent({ children }: { children?: React.ReactNode }) {
  return null;
}

export default {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
};
