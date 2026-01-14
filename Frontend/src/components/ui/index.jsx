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

export const Input = ({ className, ...props }) => {
  return (
    <input
      className={cn(
        "border-2 border-black p-3 w-full font-mono bg-white focus:outline-none focus:ring-2 focus:ring-black",
        className
      )}
      {...props}
    />
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
