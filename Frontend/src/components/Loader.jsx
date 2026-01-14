import React from "react";

export default function Loader({ text = "PROCESSING", fullScreen = false }) {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-200">
      {/* Brutalist Spinner: A rotating square of squares */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-black animate-[spin_3s_linear_infinite]"></div>
        <div className="absolute inset-4 bg-black animate-pulse"></div>
      </div>

      {/* Blinking Text */}
      <div className="text-xl font-black uppercase tracking-widest text-black flex items-center gap-1">
        {text}
        <span className="animate-[ping_1s_ease-in-out_infinite] inline-block w-2 h-2 bg-black rounded-full"></span>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm cursor-wait">
        <div className="border-4 border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
