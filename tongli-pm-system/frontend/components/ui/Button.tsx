import { type ReactNode, type ButtonHTMLAttributes } from "react";
import { Spinner } from "./Spinner";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: ReactNode;
}

const variants = {
  primary:   "bg-blue-600 hover:bg-blue-500 text-white",
  secondary: "bg-gray-800 hover:bg-gray-700 text-gray-100 border border-gray-700",
  danger:    "bg-red-600 hover:bg-red-500 text-white",
  ghost:     "hover:bg-gray-800 text-gray-400 hover:text-white",
};
const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

export function Button({
  variant = "primary", size = "md", loading, children, className = "", disabled, ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center gap-2 font-medium rounded-lg transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
