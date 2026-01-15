import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const Button = ({ children, className, ...props }) => {
  return (
    <button
      className={cn(
        "bg-black text-white font-bold py-3 px-6 border-2 border-black",
        "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
        "active:translate-y-1 active:shadow-none transition-all",
        "hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export const Input = ({ className, type, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="relative w-full">
      <input
        type={isPassword ? (showPassword ? "text" : "password") : type}
        className={cn(
          "border-4 border-black p-3 w-full font-mono bg-white focus:outline-none focus:ring-2 focus:ring-black pr-12",
          className
        )}
        {...props}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-black hover:text-zinc-600"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}
    </div>
  );
};

export const Card = ({ children, className }) => {
  return (
    <div
      className={cn(
        "bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6",
        className
      )}
    >
      {children}
    </div>
  );
};
