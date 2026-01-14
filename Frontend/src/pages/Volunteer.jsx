import { useState } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { Button, Input, Card } from "../components/ui";
import { CheckCircle, XCircle } from "lucide-react";

export default function Volunteer() {
  const [teamId, setTeamId] = useState("");
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-white text-black p-6 font-sans">
      <div className="max-w-xl mx-auto space-y-8">
        <header className="flex justify-between items-center border-b-4 border-black pb-4">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-black">
            Volunteer Deck
          </h1>
          <div className="w-6 h-6 bg-green-500 border-2 border-black animate-pulse"></div>
        </header>

        {/* Level Selector */}
        <div className="bg-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <label className="block text-sm font-black mb-2 uppercase text-black tracking-widest">
            Current Station Assignment
          </label>
          <select
            value={myLevel}
            onChange={(e) => setMyLevel(e.target.value)}
            className="w-full bg-white text-black text-2xl p-4 border-4 border-black font-black focus:outline-none focus:bg-zinc-100 uppercase rounded-none"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((l) => (
              <option key={l} value={l}>
                LEVEL {l}
              </option>
            ))}
          </select>
        </div>

        {/* Main Action Area */}
        <div className="bg-zinc-50 p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative">
          <div className="absolute -top-3 -right-3 bg-black text-white px-2 py-1 font-black text-xs uppercase tracking-widest transform rotate-2">
            Verification Protocol
          </div>
          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block font-black mb-2 text-black uppercase text-sm tracking-widest">
                Team Identifier
              </label>
              <Input
                value={teamId}
                onChange={(e) => setTeamId(e.target.value.toUpperCase())}
                placeholder="TITAN-X99"
                className="text-4xl font-black uppercase tracking-widest text-center h-24 bg-white text-black border-4 border-black focus:border-black focus:ring-0 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] placeholder:text-zinc-300"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white hover:bg-zinc-800 py-8 text-2xl font-black tracking-widest uppercase rounded-none border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
            >
              {loading ? "VERIFYING..." : "VERIFY NOW"}
            </Button>
          </form>
        </div>

        {/* Feedback Display - Huge text for quick reading */}
        {msg && (
          <div
            className={`p-8 text-center border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in slide-in-from-top-4 ${
              msg.type === "success"
                ? "bg-green-400 text-black"
                : "bg-blue-400 text-black"
            }`}
          >
            {msg.type === "success" && (
              <CheckCircle size={64} className="mx-auto mb-4 text-black" />
            )}
            <h2 className="text-5xl font-black uppercase mb-2 tracking-tighter">
              {msg.type === "success" ? "APPROVED" : "INFO"}
            </h2>
            <p className="font-bold text-xl uppercase tracking-wide">
              {msg.text}
            </p>
          </div>
        )}

        {error && (
          <div className="p-8 text-center bg-red-500 border-4 border-black text-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in slide-in-from-top-4">
            <XCircle size={64} className="mx-auto mb-4" />
            <h2 className="text-5xl font-black uppercase mb-2 tracking-tighter">
              DENIED
            </h2>
            <p className="font-bold text-xl uppercase tracking-wide">
              {error.text}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
