import { useEffect, useState } from "react";
import { Lock, X } from "lucide-react";
import { Button } from "../ui";

// Mega Puzzle: tap the hop codes in the order the rule asks for
export default function FinalePanel({
  hint,
  hopCodes,
  submitting,
  cooldownEndsAt,
  onSubmit,
}) {
  const [order, setOrder] = useState([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  const remaining = Math.max(0, Math.ceil((cooldownEndsAt - now) / 1000));
  const left = hopCodes.filter((k) => !order.includes(k));
  const complete = order.length === hopCodes.length;

  return (
    <div className="border-4 border-black bg-white p-5 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">
          Mega Puzzle
        </h2>
        <Lock size={40} />
      </div>
      <p className="font-bold uppercase tracking-widest mb-5 border-b-4 border-black pb-4 text-sm md:text-base">
        {hint}
      </p>

      <div className="text-xs font-black uppercase tracking-widest mb-2">
        Collected hop codes (tap to place)
      </div>
      <div className="grid grid-cols-2 gap-3 mb-6 min-h-[3rem]">
        {left.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setOrder([...order, k])}
            className="bg-black text-white p-3 text-center font-black uppercase tracking-widest border-2 border-black active:scale-95 transition-transform"
          >
            {k}
          </button>
        ))}
        {left.length === 0 && (
          <div className="col-span-2 text-center text-zinc-500 font-bold uppercase text-sm self-center">
            All placed
          </div>
        )}
      </div>

      <div className="text-xs font-black uppercase tracking-widest mb-2">
        Your sequence
      </div>
      <ol className="space-y-2 mb-6">
        {order.map((k, i) => (
          <li
            key={k}
            className="flex items-center gap-3 border-2 border-black p-2 font-black uppercase"
          >
            <span className="w-7 h-7 bg-black text-white flex items-center justify-center text-sm shrink-0">
              {i + 1}
            </span>
            <span className="flex-1 tracking-widest">{k}</span>
            <button
              type="button"
              aria-label={`Remove ${k}`}
              onClick={() => setOrder(order.filter((x) => x !== k))}
              className="p-1 hover:bg-zinc-200"
            >
              <X size={18} />
            </button>
          </li>
        ))}
        {order.length === 0 && (
          <li className="text-zinc-400 font-bold uppercase text-sm">
            Nothing placed yet
          </li>
        )}
      </ol>

      <div className="flex gap-3">
        <Button
          type="button"
          onClick={() => setOrder([])}
          disabled={submitting || order.length === 0}
          className="h-16 px-5 bg-white text-black font-black uppercase rounded-none border-4 border-black"
        >
          Clear
        </Button>
        <Button
          type="button"
          disabled={!complete || submitting || remaining > 0}
          onClick={() => onSubmit(order.join("-"))}
          className="flex-1 h-16 text-xl font-black tracking-widest uppercase rounded-none border-4 border-black"
        >
          {submitting
            ? "SENDING..."
            : remaining > 0
              ? `WAIT ${remaining}s`
              : "REASSEMBLE"}
        </Button>
      </div>
    </div>
  );
}
