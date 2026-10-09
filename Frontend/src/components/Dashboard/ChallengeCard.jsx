import { useEffect, useState } from "react";
import { Button } from "../ui";
import { optionLabel } from "../../utils/constants";

// MCQ for the current hop. Option keys are the server's; labels are positional.
export default function ChallengeCard({
  challenge,
  submitting,
  cooldownEndsAt,
  onAnswer,
}) {
  const [picked, setPicked] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  // A fresh question (or a swap after too many misses) clears the selection
  useEffect(() => {
    setPicked(null);
  }, [challenge.prompt]);

  const remaining = Math.max(0, Math.ceil((cooldownEndsAt - now) / 1000));
  const cooling = remaining > 0 && !challenge.locked;
  const attemptsLeft = Math.max(
    (challenge.maxAttempts || 3) - challenge.attempts,
    0,
  );
  const disabled = submitting || cooling || challenge.locked || !picked;

  return (
    <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative">
      <div className="absolute -top-3 -left-3 bg-black text-white px-2 py-1 font-black text-xs uppercase tracking-widest transform -rotate-2">
        Hop {challenge.level} challenge
      </div>

      <div className="p-5 pt-7">
        <p className="text-xl md:text-2xl font-black leading-snug text-black">
          {challenge.prompt}
        </p>

        <div className="mt-5 space-y-3" role="radiogroup">
          {challenge.options.map((opt, i) => {
            const active = picked === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={submitting || challenge.locked}
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

        <div className="mt-5 flex items-center justify-between text-xs font-black uppercase tracking-widest">
          <span>
            Attempts left:{" "}
            <span className={attemptsLeft <= 1 ? "text-red-600" : ""}>
              {attemptsLeft}
            </span>
          </span>
          {cooling && (
            <span className="bg-red-600 text-white px-2 py-1">
              Retry in {remaining}s
            </span>
          )}
        </div>

        {challenge.locked && (
          <p className="mt-3 p-2 bg-red-100 border-2 border-red-600 text-red-700 font-black text-sm uppercase">
            Locked. Ask an organiser to unlock this hop.
          </p>
        )}

        <Button
          type="button"
          disabled={disabled}
          onClick={() => onAnswer(picked)}
          className="mt-4 w-full h-16 text-xl font-black tracking-widest uppercase rounded-none border-4 border-black bg-black text-white"
        >
          {submitting ? "SENDING..." : cooling ? `WAIT ${remaining}s` : "SEND PACKET"}
        </Button>
      </div>
    </div>
  );
}
