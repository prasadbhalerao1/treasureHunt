import { Flag } from "lucide-react";
import { Button } from "../ui";

// Final challenge. For now it is a single button: the real puzzle lands here later.
export default function FinalePanel({ hint, submitting, onSubmit }) {
  return (
    <div className="border-4 border-black bg-white p-5 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">
          Final Challenge
        </h2>
        <Flag size={40} />
      </div>
      <p className="font-bold uppercase tracking-widest mb-6 border-b-4 border-black pb-4 text-sm md:text-base">
        {hint}
      </p>
      <Button
        type="button"
        disabled={submitting}
        onClick={() => onSubmit()}
        className="w-full h-20 text-2xl font-black tracking-widest uppercase rounded-none border-4 border-black"
      >
        {submitting ? "SENDING..." : "FINISH"}
      </Button>
    </div>
  );
}
