import { useState } from "react";
import api from "../utils/api";
import { Button, Input } from "../components/ui";
import Loader from "../components/Loader";
import { CheckCircle, XCircle, LogOut } from "lucide-react";

export default function Volunteer() {
  const [teamId, setTeamId] = useState("");
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  // Vercel Trigger Fix

  // In a real app, this might be dynamic or assigned.
  // Ideally, the Volunteer selects their location ONCE per session.
  const [myLevel, setMyLevel] = useState("1");

  const handleVerify = async (e) => {
    e.preventDefault();
    setMsg(null);
    setError(null);
    setLoading(true);

    try {
      const { data } = await api.post("/game/verify", {
        teamId,
        levelToVerify: myLevel,
      });
      setMsg({ type: "success", text: data.msg });
    } catch (err) {
      console.error(err);
      if (err.response?.data?.code === "WRONG_LOCATION") {
        setError({
          type: "wrong_location",
          text:
            "WRONG LOCATION: Team is at Level " +
            err.response.data.currentLevel,
        });
      } else if (err.response?.data?.code === "ALREADY_VERIFIED") {
        setMsg({ type: "info", text: "ALREADY VERIFIED: Team is good to go." });
      } else if (err.response?.data?.code === "GAME_COMPLETED") {
        setMsg({
          type: "success",
          text: "MISSION ACCOMPLISHED: Team has finished the game.",
        });
      } else {
        setError({
          type: "error",
          text: err.response?.data?.msg || "Verification Failed",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader fullScreen text="VERIFYING IDENTITY" />;
  }

  return (
    <div className="min-h-screen bg-white text-black p-4 md:p-6 font-sans flex flex-col">
      <div className="max-w-xl mx-auto space-y-6 w-full flex-1 flex flex-col">
        <header className="flex justify-between items-center border-b-4 border-black pb-4 shrink-0">
          <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-black">
            Volunteer Deck
          </h1>
          <div className="flex gap-2 items-center">
            {/* Pulse indicator hidden on small mobile to save space, shown on larger */}
            <div className="w-4 h-4 md:w-6 md:h-6 bg-green-500 border-2 border-black animate-pulse hidden sm:block"></div>
            <Button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.reload();
              }}
              className="w-10 h-10 md:w-12 md:h-12 bg-white text-black border-4 border-black rounded-none hover:bg-zinc-200 p-0 flex items-center justify-center transition-transform active:translate-x-1 active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              title="Logout"
            >
              <LogOut size={20} className="md:w-6 md:h-6" />
            </Button>
          </div>
        </header>

        {/* Level Selector */}
        <div className="bg-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shrink-0">
          <label className="block text-xs font-black mb-1 uppercase text-black tracking-widest">
            Station Assignment
          </label>
          <select
            value={myLevel}
            onChange={(e) => setMyLevel(e.target.value)}
            className="w-full bg-white text-black text-xl md:text-2xl p-2 md:p-4 border-4 border-black font-black focus:outline-none focus:bg-zinc-100 uppercase rounded-none"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((l) => (
              <option key={l} value={l}>
                LEVEL {l}
              </option>
            ))}
          </select>
        </div>

        {/* Main Action Area */}
        <div className="bg-zinc-50 p-4 md:p-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative flex-1 flex flex-col justify-center">
          <div className="absolute -top-3 -right-3 bg-black text-white px-2 py-1 font-black text-[10px] uppercase tracking-widest transform rotate-2">
            Verification Protocol
          </div>
          <form
            onSubmit={handleVerify}
            className="space-y-4 md:space-y-6 w-full"
          >
            <div>
              <label className="block font-black mb-2 text-black uppercase text-xs md:text-sm tracking-widest">
                Team Identifier
              </label>
              <Input
                value={teamId}
                onChange={(e) => setTeamId(e.target.value.toUpperCase())}
                placeholder="TITAN-X99"
                className="text-2xl md:text-4xl font-black uppercase tracking-widest text-center h-16 md:h-24 bg-white text-black border-4 border-black focus:border-black focus:ring-0 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] placeholder:text-zinc-300 w-full"
                autoFocus // Might be annoying on mobile if it pops keyboard immediately, consider removing if user complains
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white hover:bg-zinc-800 py-4 md:py-8 text-xl md:text-2xl font-black tracking-widest uppercase rounded-none border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all h-auto min-h-[60px]"
            >
              {loading ? "..." : "VERIFY"}
            </Button>
          </form>
        </div>

        {/* Feedback Display - Overlay style for maximum visibility without layout shift */}
        {msg && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-in fade-in duration-200"
            onClick={() => setMsg(null)}
          >
            <div
              className={`w-full max-w-sm p-8 text-center border-4 border-black shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] ${
                msg.type === "success"
                  ? "bg-green-400 text-black"
                  : "bg-blue-400 text-black"
              }`}
            >
              {msg.type === "success" && (
                <CheckCircle size={64} className="mx-auto mb-4 text-black" />
              )}
              <h2 className="text-4xl font-black uppercase mb-2 tracking-tighter">
                {msg.type === "success" ? "APPROVED" : "INFO"}
              </h2>
              <p className="font-bold text-lg uppercase tracking-wide">
                {msg.text}
              </p>
              <p className="mt-4 text-xs font-black uppercase opacity-50">
                (Tap to dismiss)
              </p>
            </div>
          </div>
        )}

        {error && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-in fade-in duration-200"
            onClick={() => setError(null)}
          >
            <div className="w-full max-w-sm p-8 text-center bg-red-500 border-4 border-black text-black shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
              <XCircle size={64} className="mx-auto mb-4" />
              <h2 className="text-4xl font-black uppercase mb-2 tracking-tighter">
                DENIED
              </h2>
              <p className="font-bold text-lg uppercase tracking-wide">
                {error.text}
              </p>
              <p className="mt-4 text-xs font-black uppercase opacity-50">
                (Tap to dismiss)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
