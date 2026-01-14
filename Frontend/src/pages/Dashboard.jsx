import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { Button, Input, Card } from "../components/ui";
import Scanner from "../components/Scanner";
import { RefreshCw, Lock, MapPin, QrCode, CheckCircle } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState("");
  const [scanMode, setScanMode] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchState = async () => {
    try {
      const { data } = await api.get("/game/state");
      setGameState(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 5000); // Polling every 5s
    return () => clearInterval(interval);
  }, []);

  const submitAnswer = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/game/submit", { answer });
      setMsg(data.msg);
      fetchState();
    } catch (err) {
      console.error("Submit Error:", err);
      setMsg(err.response?.data?.msg || "Incorrect Answer");
    }
  };

  const handleScan = async (qrString) => {
    setScanMode(false);
    try {
      const { data } = await api.post("/game/scan", { qrString });
      setMsg(`Success: ${data.msg} Keyword: ${data.keyword}`);
      fetchState();
    } catch (err) {
      console.error("Scan Error:", err);
      setMsg(err.response?.data?.msg || "Scan Failed");
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center font-bold">CONTACTING SATELLITE...</div>
    );
  if (!gameState)
    return (
      <div className="p-8 text-center text-red-600 font-bold">SIGNAL LOST</div>
    );

  const { level, status, hint, location, collectedKeywords } = gameState;

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-red-500 selection:text-white">
      {/* Glitch Overlay Effect */}
      <div className="fixed inset-0 pointer-events-none opacity-5 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-950 to-black"></div>

      <div className="max-w-md mx-auto min-h-screen flex flex-col relative z-10">
        {/* Header - Level Indicator */}
        <header className="p-6 flex justify-between items-start">
          <div>
            <div className="text-zinc-500 text-xs font-bold tracking-[0.2em] uppercase mb-1">
              Current Protocol
            </div>
            <h1 className="text-7xl font-black tracking-tighter text-white leading-none">
              {String(level).padStart(2, "0")}
            </h1>
          </div>
          <Button
            onClick={fetchState}
            className="rounded-full w-12 h-12 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 p-0 flex items-center justify-center transition-all active:scale-95"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </Button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 flex flex-col justify-center">
          {msg && (
            <div className="mb-6 p-4 bg-red-500/10 border-l-2 border-red-500 text-red-400 text-sm font-bold animate-pulse">
              {msg}
            </div>
          )}

          {level === 7 ? (
            /* FINALE MODE */
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="border border-red-900/50 bg-red-950/20 p-6 rounded-lg backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-20">
                  <Lock size={100} className="text-red-500" />
                </div>
                <h2 className="text-3xl font-black text-red-500 mb-2 tracking-tighter">
                  BITLOCKER
                </h2>
                <p className="text-red-200/80 text-sm font-mono mb-6">
                  FINAL DECRYPTION SEQUENCE REQUIRED. ARRANGE KEYWORDS
                  ALPHABETICALLY.
                </p>

                <div className="grid grid-cols-2 gap-2 mb-6">
                  {collectedKeywords.map((k, i) => (
                    <div
                      key={i}
                      className="bg-black/40 border border-red-900/30 p-2 text-center font-mono text-red-400 text-xs tracking-widest"
                    >
                      {k}
                    </div>
                  ))}
                </div>

                <form onSubmit={submitAnswer} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-red-500 uppercase tracking-widest">
                      Victory Token
                    </label>
                    <Input
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      className="bg-black/50 border-red-900/50 text-red-500 font-mono text-center tracking-widest uppercase placeholder:text-red-900/50 h-14 text-lg"
                      placeholder="BERLIN-HEIST-..."
                    />
                  </div>
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-black tracking-widest h-14 text-lg border-none shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                    DECRYPT
                  </Button>
                </form>
              </div>
            </div>
          ) : (
            /* STANDARD LEVEL UI */
            <div className="space-y-8">
              {/* Riddle / Hint */}
              <div className="space-y-4">
                <div className="h-1 w-12 bg-red-600"></div>
                <p className="text-3xl font-light leading-tight text-zinc-200">
                  {hint}
                </p>
                <div className="text-zinc-600 text-xs uppercase tracking-widest font-bold">
                  Target Information
                </div>
              </div>

              {/* Status Indicator */}
              <div className="py-8">
                {status.status === "AWAITING_QR" ? (
                  <div className="space-y-6 text-center animate-in zoom-in duration-300">
                    <div className="inline-flex items-center justify-center p-4 rounded-full bg-green-500/10 text-green-500 mb-2 ring-1 ring-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                      <MapPin size={48} className="animate-bounce" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white tracking-widest uppercase">
                        Location Verified
                      </h3>
                    </div>
                    <Button
                      onClick={() => setScanMode(true)}
                      className="w-full bg-white text-black font-black uppercase tracking-widest h-16 text-lg hover:bg-zinc-200 transition-all shadow-xl"
                    >
                      <QrCode className="mr-2" />
                      Initiate Scan
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6 text-center opacity-80">
                    <div className="inline-flex items-center justify-center p-6 rounded-full bg-zinc-900 text-zinc-600 mb-2 border border-zinc-800">
                      <Lock size={32} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-zinc-400 uppercase tracking-widest">
                        Signal Locked
                      </h3>
                      <p className="text-xs text-zinc-600 font-mono">
                        LOCATE VOLUNTEER FOR BIOMETRIC VERIFICATION
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Scanner Overlay */}
              {scanMode && (
                <div className="fixed inset-0 z-50 bg-black flex flex-col p-6 animate-in slide-in-from-bottom duration-300">
                  <div className="flex-1 rounded-2xl overflow-hidden relative border border-zinc-800 bg-zinc-900">
                    <Scanner onScan={handleScan} />
                    <div className="absolute inset-0 border-2 border-green-500/30 pointer-events-none">
                      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500 animate-[ping_2s_infinite]"></div>
                    </div>
                  </div>
                  <Button
                    onClick={() => setScanMode(false)}
                    className="mt-6 w-full bg-zinc-800 text-white font-bold h-14 border border-zinc-700 hover:bg-zinc-700"
                  >
                    ABORT SCAN
                  </Button>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Status Footer */}
        <footer className="p-6 border-t border-zinc-900/50">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-600">
            <span className="uppercase tracking-widest">
              Team {user?.id?.slice(-4) || "UNK"}
            </span>
            <span className="flex items-center gap-2">
              {status.verified ? (
                <span className="text-green-600 flex items-center gap-1 font-bold">
                  <CheckCircle size={12} /> VERIFIED
                </span>
              ) : (
                <span className="text-zinc-700 flex items-center gap-1">
                  <Lock size={12} /> ENCRYPTED
                </span>
              )}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
