import * as React from "react";

export function TooltipProvider({ children }) {
  return children;
}

const TooltipContext = React.createContext({ content: null });

export function Tooltip({ children }) {
  return <>{children}</>;
}

export function TooltipTrigger({ asChild, children }) {
  const [title, setTitle] = React.useState("");
  const child = React.Children.only(children);
  return React.cloneElement(child, {
    title: child.props.title ?? title,
    onMouseEnter: (e) => {
      if (child.props.onMouseEnter) child.props.onMouseEnter(e);
    },
  });
}

export function TooltipContent({ children }) {
  // No floating UI; rely on title on trigger. Render nothing.
  return null;
}

export default {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
};
