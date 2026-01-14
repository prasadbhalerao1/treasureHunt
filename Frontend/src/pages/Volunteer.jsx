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
    <div className="min-h-screen bg-zinc-900 text-white p-4">
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-3xl font-black uppercase text-center text-yellow-400">
          Volunteer Deck
        </h1>

        {/* Level Selector (Simulated Station Assignment) */}
        <div className="bg-zinc-800 p-4 rounded border border-zinc-700">
          <label className="block text-sm font-bold mb-2 uppercase text-zinc-400">
            Current Station (Level)
          </label>
          <select
            value={myLevel}
            onChange={(e) => setMyLevel(e.target.value)}
            className="w-full bg-black text-white p-2 border border-zinc-600 font-bold"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((l) => (
              <option key={l} value={l}>
                Level {l}
              </option>
            ))}
          </select>
        </div>

        <Card className="bg-white text-black">
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block font-bold mb-1">TEAM ID</label>
              <Input
                value={teamId}
                onChange={(e) => setTeamId(e.target.value.toUpperCase())}
                placeholder="TITAN-X99"
                className="text-2xl font-black uppercase tracking-widest text-center"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white hover:bg-zinc-800 py-6 text-xl font-bold"
            >
              {loading ? "VERIFYING..." : "VERIFY TEAM"}
            </Button>
          </form>
        </Card>

        {/* Feedback Display */}
        {msg && (
          <div
            className={`p-6 text-center border-4 ${
              msg.type === "success"
                ? "bg-green-100 border-green-600 text-green-800"
                : "bg-blue-100 border-blue-600 text-blue-800"
            }`}
          >
            {msg.type === "success" && (
              <CheckCircle size={48} className="mx-auto mb-2" />
            )}
            <h2 className="text-2xl font-black uppercase">
              {msg.type === "success" ? "APPROVED" : "INFO"}
            </h2>
            <p className="font-bold">{msg.text}</p>
          </div>
        )}

        {error && (
          <div className="p-6 text-center bg-red-100 border-4 border-red-600 text-red-800">
            <XCircle size={48} className="mx-auto mb-2" />
            <h2 className="text-2xl font-black uppercase">DENIED</h2>
            <p className="font-bold">{error.text}</p>
          </div>
        )}
      </div>
    </div>
  );
}
