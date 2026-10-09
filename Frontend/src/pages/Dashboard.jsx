import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import api from "../utils/api";
import { Button } from "../components/ui";
import Scanner from "../components/Scanner";
import Loader from "../components/Loader";
import ChallengeCard from "../components/Dashboard/ChallengeCard";
import FinalePanel from "../components/Dashboard/FinalePanel";
import { RefreshCw, MapPin, QrCode, CheckCircle, Timer } from "lucide-react";
import { GAME_STATUS, formatDuration } from "../utils/constants";

const IDLE_POLL_MS = 15000;

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { text, type: ok|bad|info }
  const [solved, setSolved] = useState(null); // { explanation, keyword, level }
  const [cooldownEndsAt, setCooldownEndsAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const clockOffset = useRef(0); // server time - local time

  const applyState = useCallback((state) => {
    if (!state) return;
    if (state.serverTime) {
      clockOffset.current = new Date(state.serverTime).getTime() - Date.now();
    }
    setGameState(state);
    const retry =
      state.challenge?.retryAfterSeconds ?? state.finaleRetryAfterSeconds ?? 0;
    setCooldownEndsAt(retry > 0 ? Date.now() + retry * 1000 : 0);
  }, []);

  const fetchState = useCallback(
    async ({ silent = false } = {}) => {
      try {
        const { data } = await api.get("/game/state");
        applyState(data);
        setLoadError(false);
      } catch (err) {
        if (err.response?.status === 401) {
          logout();
          window.location.href = "/login";
          return;
        }
        if (!silent) setLoadError(true);
      } finally {
        setLoading(false);
      }
    },
    [applyState, logout],
  );

  useEffect(() => {
    fetchState();
    const onFocus = () => {
      if (document.visibilityState === "visible") fetchState({ silent: true });
    };
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    const poll = setInterval(() => fetchState({ silent: true }), IDLE_POLL_MS);
    return () => {
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
      clearInterval(poll);
    };
  }, [fetchState]);

  // 1s tick for the running timer
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const showError = (err, fallback) => {
    const data = err.response?.data;
    if (data?.state) applyState(data.state);
    if (err.response?.status === 429 && data?.retryAfterSeconds) {
      setCooldownEndsAt(Date.now() + data.retryAfterSeconds * 1000);
    }
    setMsg({ text: data?.msg || fallback, type: "bad", extra: data });
  };

  const handleScan = async (qrString) => {
    setScanMode(false);
    setBusy(true);
    try {
      const { data } = await api.post("/game/scan", { qrString });
      setSolved(null);
      applyState(data.state);
      setMsg({ text: data.msg, type: "ok" });
    } catch (err) {
      showError(err, "Scan failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleAnswer = async (optionKey) => {
    if (busy) return;
    setBusy(true);
    try {
      const { data } = await api.post("/game/answer", {
        level: gameState.challenge.level,
        optionKey,
      });
      setSolved({
        explanation: data.explanation,
        keyword: data.keyword,
        level: gameState.challenge.level,
      });
      applyState(data.state);
      setMsg({ text: data.msg, type: "ok" });
    } catch (err) {
      if (err.response?.status === 409) {
        applyState(err.response.data.state);
        setMsg({ text: "Already answered.", type: "info" });
      } else {
        showError(err, "Could not send your answer.");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleFinale = async (optionKey) => {
    if (busy) return;
    setBusy(true);
    try {
      const { data } = await api.post("/game/submit", { optionKey });
      applyState(data.state);
      setMsg({ text: data.msg, type: "ok" });
    } catch (err) {
      showError(err, "Reassembly failed.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader fullScreen text="ROUTING..." />;
  if (!gameState) {
    return (
      <div className="p-8 text-center font-black text-red-600 space-y-4">
        <p>NO SIGNAL. CHECK YOUR CONNECTION.</p>
        <Button onClick={() => fetchState()} className="rounded-none">
          RETRY
        </Button>
      </div>
    );
  }

  const {
    level,
    status,
    hint,
    totalLevels,
    penaltySeconds,
    startedAt,
    finishedAt,
  } = gameState;

  const serverNow = now + clockOffset.current;
  const elapsedMs = startedAt
    ? (finishedAt ? new Date(finishedAt).getTime() : serverNow) -
      new Date(startedAt).getTime()
    : 0;
  const totalMs = elapsedMs + (penaltySeconds || 0) * 1000;
  const hop = Math.min(Math.max(level, 0), totalLevels);

  const msgStyle = {
    ok: "bg-green-300",
    bad: "bg-red-300",
    info: "bg-yellow-300",
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white p-4 md:p-6">
      <div className="max-w-xl mx-auto min-h-screen flex flex-col">
        {/* Header */}
        <header className="mb-4 flex justify-between items-start border-4 border-black p-3 md:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/logo.png"
              alt={`${settings.eventName} logo`}
              width="64"
              height="64"
              className="w-12 h-12 md:w-16 md:h-16 object-contain shrink-0"
            />
            <div className="min-w-0">
              <div className="text-black text-[10px] md:text-xs font-black tracking-widest uppercase mb-1 truncate">
                {settings.eventName} · Hop
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-black leading-none">
                {String(hop).padStart(2, "0")}
                <span className="text-2xl md:text-3xl text-zinc-400">
                  /{String(totalLevels).padStart(2, "0")}
                </span>
              </h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                logout();
                window.location.href = "/login";
              }}
              className="px-3 h-10 md:h-12 bg-red-600 text-white border-4 border-black rounded-none hover:bg-red-700 text-xs font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              title="Logout"
            >
              Exit
            </Button>
            <Button
              onClick={() => fetchState()}
              aria-label="Refresh"
              className="w-10 h-10 md:w-12 md:h-12 bg-white text-black border-4 border-black rounded-none hover:bg-zinc-200 p-0 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <RefreshCw size={22} className="text-black" />
            </Button>
          </div>
        </header>

        {/* Timer */}
        {startedAt && (
          <div className="mb-4 flex items-center justify-between border-4 border-black px-3 py-2 font-black uppercase text-sm bg-zinc-50">
            <span className="flex items-center gap-2">
              <Timer size={18} />
              {status === GAME_STATUS.COMPLETED ? "Final time" : "Elapsed"}
            </span>
            <span className="font-mono text-lg">{formatDuration(totalMs)}</span>
            {penaltySeconds > 0 && (
              <span className="text-red-600 text-xs">+{penaltySeconds}s pen.</span>
            )}
          </div>
        )}

        <main className="flex-1 flex flex-col justify-center gap-6">
          {msg && (
            <div
              role="status"
              className={`p-4 border-4 border-black text-black text-sm font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${msgStyle[msg.type]}`}
              onClick={() => setMsg(null)}
            >
              {msg.text}
              {msg.extra?.penaltyAdded > 0 && (
                <div className="mt-1 text-xs">
                  +{msg.extra.penaltyAdded}s penalty
                  {msg.extra.attemptsLeft !== undefined &&
                    ` · ${msg.extra.attemptsLeft} attempt(s) left`}
                </div>
              )}
            </div>
          )}

          {loadError && (
            <div className="p-3 bg-yellow-100 border-2 border-black font-bold text-sm">
              Connection trouble. Showing the last known state.
            </div>
          )}

          {solved && status === GAME_STATUS.HINT_UNLOCKED && (
            <div className="border-4 border-black bg-green-100 p-4">
              <div className="text-xs font-black uppercase tracking-widest mb-1">
                Packet delivered · hop {solved.level}
                {solved.keyword ? ` · code ${solved.keyword}` : ""}
              </div>
              {solved.explanation && (
                <p className="text-sm font-semibold">{solved.explanation}</p>
              )}
            </div>
          )}

          {status === GAME_STATUS.COMPLETED && (
            <div className="border-4 border-black bg-white p-6 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center">
              <div className="w-20 h-20 flex items-center justify-center border-4 border-black bg-green-500 mb-6">
                <CheckCircle size={44} />
              </div>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-3 leading-none">
                Destination reached
              </h1>
              <p className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-6">
                Route complete · {totalLevels} hops traced
              </p>
              <div className="bg-black text-white p-4 font-mono text-sm border-2 border-green-500 w-full">
                <p>TEAM: {gameState.name}</p>
                <p>TIME: {formatDuration(totalMs)}</p>
                {penaltySeconds > 0 && (
                  <p>PENALTIES: +{penaltySeconds}s included</p>
                )}
                <p className="mt-2 text-green-400 font-bold">
                  REPORT TO THE ORGANISERS FOR THE RESULTS.
                </p>
              </div>
              <a
                href="https://www.linkedin.com/in/prasadbhalerao"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 text-[10px] text-zinc-300 hover:text-zinc-600 transition-colors"
                title="Created by Prasad Bhalerao"
              >
                ⚡ Credits
              </a>
            </div>
          )}

          {status === GAME_STATUS.FINALE && (
            <FinalePanel
              hint={hint}
              question={gameState.finaleQuestion}
              solved={gameState.finaleSolved || 0}
              total={gameState.finaleTotal || 0}
              submitting={busy}
              onAnswer={handleFinale}
            />
          )}

          {status === GAME_STATUS.CHALLENGE_OPEN && gameState.challenge && (
            <>
              <ChallengeCard
                challenge={gameState.challenge}
                submitting={busy}
                cooldownEndsAt={cooldownEndsAt}
                onAnswer={handleAnswer}
              />
              <div className="border-4 border-dashed border-black p-4 bg-zinc-50">
                <div className="text-xs font-black uppercase tracking-widest mb-1">
                  Solve it to unlock the next hop
                </div>
                <p className="text-sm font-semibold text-zinc-600">
                  Wrong answers cost time and force a short wait.
                </p>
              </div>
            </>
          )}

          {(status === GAME_STATUS.NOT_STARTED ||
            status === GAME_STATUS.HINT_UNLOCKED) && (
            <div className="space-y-6">
              <div className="border-4 border-black p-6 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative">
                <div className="absolute -top-3 -left-3 bg-black text-white px-2 py-1 font-black text-xs uppercase tracking-widest transform -rotate-2">
                  {status === GAME_STATUS.NOT_STARTED
                    ? "Start"
                    : `Next hop · ${level + 1}/${totalLevels}`}
                </div>
                <p className="text-2xl md:text-3xl font-black leading-tight text-black mt-2 whitespace-pre-line">
                  {status === GAME_STATUS.NOT_STARTED ? hint : `"${hint}"`}
                </p>
              </div>

              <div className="space-y-4 text-center">
                <div className="inline-flex items-center justify-center p-4 border-4 border-black bg-green-400 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-full">
                  <MapPin size={36} className="animate-bounce" />
                </div>
                <Button
                  onClick={() => setScanMode(true)}
                  disabled={busy}
                  className="w-full bg-black text-white font-black uppercase tracking-widest h-20 text-2xl hover:bg-zinc-900 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-2 active:translate-y-2 active:shadow-none rounded-none border-4 border-black"
                >
                  <QrCode className="mr-4 w-8 h-8 inline" />
                  SCAN QR
                </Button>
              </div>
            </div>
          )}
        </main>

        {scanMode && (
          <div className="fixed inset-0 z-50 bg-white flex flex-col p-6">
            <div className="flex justify-between items-center mb-6 border-b-4 border-black pb-4">
              <h2 className="text-3xl font-black uppercase">Scanner</h2>
              <div className="w-4 h-4 bg-red-600 animate-pulse rounded-full"></div>
            </div>
            <div className="flex-1 overflow-hidden relative border-4 border-black bg-black">
              <Scanner onScan={handleScan} />
              <div className="absolute inset-0 border-4 border-green-500 pointer-events-none opacity-50"></div>
            </div>
            <Button
              onClick={() => setScanMode(false)}
              className="mt-6 w-full bg-white text-black font-black h-16 text-xl border-4 border-black hover:bg-zinc-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none"
            >
              CANCEL
            </Button>
          </div>
        )}

        <footer className="mt-8 border-t-4 border-black pt-4">
          <div className="flex items-center justify-between text-sm font-black text-black">
            <span className="uppercase tracking-widest bg-black text-white px-2 py-1">
              {gameState.teamId || user?.teamId}
            </span>
            <span
              className={`px-2 py-1 border-2 border-black ${
                status === GAME_STATUS.COMPLETED
                  ? "bg-yellow-400"
                  : status === GAME_STATUS.FINALE
                    ? "bg-purple-400"
                    : status === GAME_STATUS.CHALLENGE_OPEN
                      ? "bg-orange-300"
                      : "bg-green-400"
              }`}
            >
              {status === GAME_STATUS.COMPLETED
                ? "DONE"
                : status === GAME_STATUS.FINALE
                  ? "MEGA PUZZLE"
                  : status === GAME_STATUS.CHALLENGE_OPEN
                    ? "CHALLENGE"
                    : status === GAME_STATUS.NOT_STARTED
                      ? "READY"
                      : "EN ROUTE"}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
