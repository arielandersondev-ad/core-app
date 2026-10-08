import { ReactNode } from "react";

export interface PageContainerProps {
  children: ReactNode;
  maxWidth?: "max-w-7xl" | "max-w-5xl" | "max-w-4xl" | "max-w-2xl" | string;
  className?: string;
}

export function PageContainer({
  children,
  maxWidth = "max-w-7xl",
  className = "",
}: PageContainerProps) {
  return (
    <div
      className={`w-full ${maxWidth} mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 ${className}`}
    >
      {children}
    </div>
  );
}
