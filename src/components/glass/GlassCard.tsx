import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

export default function GlassCard({
  children,
  className = "",
}: Props) {
  return (
    <div
      className={`
      rounded-3xl
      border
      border-white/10
      bg-white/5
      backdrop-blur-2xl
      shadow-2xl
      ${className}
      `}
    >
      {children}
    </div>
  );
}