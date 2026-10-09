import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { Button } from "../ui";
import { optionLabel } from "../../utils/constants";

// Final round: rapid fire. One question at a time, unlimited retries, no penalty.
export default function FinalePanel({
  hint,
  question,
  solved = 0,
  total = 0,
  submitting,
  onAnswer,
}) {
  const [picked, setPicked] = useState(null);

  // A new question clears the selection
  useEffect(() => {
    setPicked(null);
  }, [question?.index]);

  if (!question) {
    return (
      <div className="border-4 border-black bg-white p-6 text-center shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-3xl font-black uppercase tracking-tighter">
          Final Round
        </h2>
        <p className="mt-3 font-bold">Loading your questions...</p>
      </div>
    );
  }

  return (
    <div className="border-4 border-black bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
      <div className="bg-black text-white px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={22} className="text-yellow-400" />
          <span className="font-black uppercase tracking-widest text-sm">
            Rapid Fire
          </span>
        </div>
        <span className="font-black tabular-nums text-lg">
          {solved}/{total}
        </span>
      </div>

      {/* progress pips */}
      <div className="flex gap-1 px-5 pt-4">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 border-2 border-black ${
              i < solved ? "bg-green-400" : "bg-white"
            }`}
          />
        ))}
      </div>

      <div className="p-5">
        <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
          {hint}
        </p>
        <p className="text-xl md:text-2xl font-black leading-snug text-black">
          {question.prompt}
        </p>

        <div className="mt-5 space-y-3" role="radiogroup">
          {question.options.map((opt, i) => {
            const active = picked === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={submitting}
                onClick={() => setPicked(opt.key)}
                className={`w-full text-left flex gap-3 items-start p-3 border-4 border-black font-bold transition-all active:translate-x-1 active:translate-y-1 ${
                  active
                    ? "bg-black text-white shadow-none"
                    : "bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-100"
                }`}
              >
                <span
                  className={`shrink-0 w-8 h-8 flex items-center justify-center border-2 font-black ${
                    active ? "border-white" : "border-black"
                  }`}
                >
                  {optionLabel(i)}
                </span>
                <span className="break-words min-w-0">{opt.text}</span>
              </button>
            );
          })}
        </div>

        <Button
          type="button"
          disabled={submitting || !picked}
          onClick={() => onAnswer(picked)}
          className="mt-5 w-full h-16 text-xl font-black tracking-widest uppercase rounded-none border-4 border-black bg-black text-white"
        >
          {submitting ? "SENDING..." : "SUBMIT"}
        </Button>

        <p className="mt-3 text-center text-xs font-bold uppercase tracking-widest text-zinc-500">
          No penalty. Keep trying until you get it.
        </p>
      </div>
    </div>
  );
}
