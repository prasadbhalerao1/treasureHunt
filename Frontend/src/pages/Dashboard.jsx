import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { Button, Input } from "../components/ui";
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

  const { level, status, verified, hint, location, collectedKeywords } =
    gameState;

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white p-6">
      <div className="max-w-xl mx-auto min-h-screen flex flex-col">
        {/* Header - Level Indicator */}
        <header className="mb-8 flex justify-between items-start border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
          <div>
            <div className="text-black text-xs font-black tracking-widest uppercase mb-1">
              CURRENT PROTOCOL
            </div>
            <h1 className="text-7xl font-black tracking-tighter text-black leading-none">
              {String(level).padStart(2, "0")}
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.reload();
              }}
              className="w-12 h-12 bg-red-600 text-white border-4 border-black rounded-none hover:bg-red-700 p-0 flex items-center justify-center transition-transform active:translate-x-1 active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              title="Logout"
            >
              <div className="w-4 h-4 border-2 border-white rounded-full relative">
                <div className="absolute top-0 right-0 w-2 h-0.5 bg-white transform rotate-45 origin-center"></div>
              </div>
            </Button>
            <Button
              onClick={fetchState}
              className="w-12 h-12 bg-white text-black border-4 border-black rounded-none hover:bg-zinc-200 p-0 flex items-center justify-center transition-transform active:translate-x-1 active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <RefreshCw
                size={24}
                className={`text-black ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col justify-center">
          {msg && (
            <div className="mb-6 p-4 bg-yellow-300 border-4 border-black text-black text-sm font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-bounce">
              {msg}
            </div>
          )}

          {status === "COMPLETED" || level > 7 ? (
            /* VICTORY SCREEN */
            <div className="border-4 border-black bg-white p-4 md:p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in duration-500 flex flex-col items-center justify-center min-h-[50vh]">
              <div className="mb-6">
                <div className="w-20 h-20 bg-black flex items-center justify-center animate-bounce border-4 border-black bg-green-500">
                  <CheckCircle size={48} className="text-black" />
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 leading-none break-words w-full">
                MISSION ACCOMPLISHED
              </h1>
              <p className="text-lg md:text-xl font-black uppercase tracking-widest text-zinc-500 mb-8">
                ALL OBJECTIVES SECURED
              </p>
              <div className="bg-black text-white p-4 font-mono text-xs md:text-sm border-2 border-green-500 w-full">
                <p>AGENT STATUS: LEGENDARY</p>
                <p>FINAL SCORE: MAX</p>
                <p className="mt-2 text-green-400 font-bold">
                  RETURN TO BASE FOR DEBRIEF.
                </p>
              </div>
            </div>
          ) : level === 7 ? (
            /* FINALE MODE */
            <div className="border-4 border-black bg-white p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-4xl font-black text-black tracking-tighter uppercase">
                  BITLOCKER
                </h2>
                <Lock size={48} className="text-black" />
              </div>
              <p className="text-black font-bold uppercase tracking-widest mb-6 border-b-4 border-black pb-4">
                FINAL DECRYPTION SEQUENCE REQUIRED. ARRANGE KEYWORDS
                ALPHABETICALLY.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {collectedKeywords.map((k, i) => (
                  <div
                    key={i}
                    className="bg-black text-white p-3 text-center font-black uppercase tracking-widest border-2 border-black"
                  >
                    {k}
                  </div>
                ))}
              </div>

              <form onSubmit={submitAnswer} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-black text-black uppercase tracking-widest block">
                    Victory Token
                  </label>
                  <Input
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="bg-white border-4 border-black text-black font-black text-center tracking-widest uppercase placeholder:text-zinc-400 h-16 text-xl rounded-none focus:ring-0 focus:border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    placeholder="BERLIN-HEIST-..."
                  />
                </div>
                <Button className="w-full bg-black hover:bg-zinc-800 text-white font-black tracking-widest h-16 text-xl rounded-none border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">
                  DECRYPT
                </Button>
              </form>
            </div>
          ) : (
            /* STANDARD LEVEL UI */
            <div className="space-y-8">
              {/* Riddle / Hint Card */}
              <div className="border-4 border-black p-6 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative">
                <div className="absolute -top-3 -left-3 bg-black text-white px-2 py-1 font-black text-xs uppercase tracking-widest transform -rotate-2">
                  Target Info
                </div>
                <p className="text-3xl font-black leading-tight text-black mt-2">
                  "{hint}"
                </p>
              </div>

              {/* Status Indicator */}
              <div className="py-4">
                {status === "AWAITING_QR" ? (
                  <div className="space-y-6 text-center">
                    <div className="inline-flex items-center justify-center p-6 border-4 border-black bg-green-400 text-black mb-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-full">
                      <MapPin size={48} className="animate-bounce" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-black tracking-tighter uppercase bg-white inline-block px-2">
                        Location Verified
                      </h3>
                    </div>
                    <Button
                      onClick={() => setScanMode(true)}
                      className="w-full bg-black text-white font-black uppercase tracking-widest h-20 text-2xl hover:bg-zinc-900 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-2 active:translate-y-2 active:shadow-none rounded-none border-4 border-black"
                    >
                      <QrCode className="mr-4 w-8 h-8" />
                      INITIATE SCAN
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6 text-center opacity-100">
                    <div className="inline-flex items-center justify-center p-6 border-4 border-black bg-zinc-200 text-black mb-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-full">
                      <Lock size={32} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-black text-black uppercase tracking-widest bg-zinc-100 inline-block px-2 border-2 border-black">
                        Signal Locked
                      </h3>
                      <p className="text-sm text-black font-bold uppercase tracking-widest">
                        LOCATE VOLUNTEER TO VERIFY
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Scanner Overlay */}
              {scanMode && (
                <div className="fixed inset-0 z-50 bg-white flex flex-col p-6 animate-in slide-in-from-bottom duration-300">
                  <div className="flex justify-between items-center mb-6 border-b-4 border-black pb-4">
                    <h2 className="text-3xl font-black uppercase">SCANNER</h2>
                    <div className="w-4 h-4 bg-red-600 animate-pulse rounded-full"></div>
                  </div>

                  <div className="flex-1 overflow-hidden relative border-4 border-black bg-black">
                    <Scanner onScan={handleScan} />
                    <div className="absolute inset-0 border-4 border-green-500 pointer-events-none opacity-50"></div>
                  </div>

                  <Button
                    onClick={() => setScanMode(false)}
                    className="mt-6 w-full bg-white text-black font-black h-16 text-xl border-4 border-black hover:bg-zinc-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 rounded-none"
                  >
                    ABORT SCAN
                  </Button>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Status Footer */}
        <footer className="mt-8 border-t-4 border-black pt-4">
          <div className="flex items-center justify-between text-sm font-black text-black">
            <span className="uppercase tracking-widest bg-black text-white px-2 py-1">
              Team {gameState?.teamId || "UNK"}
            </span>
            <span className="flex items-center gap-2">
              {verified ? (
                <span className="text-black flex items-center gap-1 font-black bg-green-400 px-2 py-1 border-2 border-black">
                  <CheckCircle size={16} /> VERIFIED
                </span>
              ) : (
                <span className="text-black flex items-center gap-1 bg-zinc-200 px-2 py-1 border-2 border-black">
                  <Lock size={16} /> ENCRYPTED
                </span>
              )}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
