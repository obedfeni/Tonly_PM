import { type ReactNode } from "react";

export function Table({ children }: { children?: ReactNode }) {
  return <div className="overflow-x-auto"><table className="w-full text-sm">{children}</table></div>;
}
export function Thead({ children }: { children?: ReactNode }) {
  return <thead className="bg-gray-800/60 text-gray-400 text-xs uppercase tracking-wider">{children}</thead>;
}
export function Tbody({ children }: { children?: ReactNode }) {
  return <tbody className="divide-y divide-gray-800">{children}</tbody>;
}
export function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <th className={`px-4 py-3 text-left font-medium whitespace-nowrap ${className}`}>{children}</th>;
}
export function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-gray-300 ${className}`}>{children}</td>;
}
export function Tr({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <tr className={`hover:bg-gray-800/40 transition-colors ${className}`}>{children}</tr>;
}
