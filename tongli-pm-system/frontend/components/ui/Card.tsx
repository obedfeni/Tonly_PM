import { type ReactNode } from "react";

interface CardProps { children?: ReactNode; className?: string; }

export function Card({ children, className = "" }: CardProps) {
  return <div className={`bg-gray-900 border border-gray-800 rounded-xl ${className}`}>{children}</div>;
}
export function CardHeader({ children, className = "" }: CardProps) {
  return <div className={`px-6 py-4 border-b border-gray-800 ${className}`}>{children}</div>;
}
export function CardBody({ children, className = "" }: CardProps) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
}
