import { useState, useEffect } from "react";
import api from "../../utils/api";
import { Button, Card } from "../ui";
import { Send, Check, X, Loader2, RefreshCw } from "lucide-react";

export default function BroadcastEmail() {
  const [teams, setTeams] = useState(null);
  const [error, setError] = useState(null);
  // teamId -> { sending } | { sent: true, email } | { sent: false, reason }
  const [status, setStatus] = useState({});

  const loadTeams = () => {
    setTeams(null);
    setError(null);
    api
      .get("/admin/teams")
      .then(({ data }) => {
        const list = (data.teams || data || []).filter(
          (t) => t.role === "CANDIDATE",
        );
        setTeams(list);
      })
      .catch(() => setError("Failed to load teams"));
  };

  useEffect(loadTeams, []);

  const sendOne = async (teamId) => {
    setStatus((s) => ({ ...s, [teamId]: { sending: true } }));
    try {
      const { data } = await api.post("/admin/broadcast", { teamId });
      setStatus((s) => ({ ...s, [teamId]: { sent: true, email: data.email } }));
    } catch (err) {
      setStatus((s) => ({
        ...s,
        [teamId]: { sent: false, reason: err.response?.data?.msg || "Failed" },
      }));
    }
  };

  const sentCount = Object.values(status).filter((v) => v.sent === true).length;

  return (
    <Card>
      <div className="flex items-start justify-between gap-4 mb-1">
        <h2 className="text-2xl font-black uppercase tracking-tight">
          Broadcast Email
        </h2>
        <button
          type="button"
          onClick={loadTeams}
          className="shrink-0 border-4 border-black bg-white p-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
          title="Reload teams"
        >
          <RefreshCw size={18} />
        </button>
      </div>
      <p className="text-sm font-bold text-zinc-600 mb-6">
        The email itself lives in the Make.com scenario. Each Send here passes
        one team&apos;s name and address to it. Nothing goes out until you click
        a row.
      </p>

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-black uppercase tracking-widest">
          Recipients {teams ? `(${teams.length})` : ""}
        </h3>
        {sentCount > 0 && (
          <span className="text-sm font-black uppercase tracking-widest text-green-700">
            {sentCount} sent
          </span>
        )}
      </div>

      {error && (
        <div className="border-4 border-black bg-red-300 p-4 font-bold">
          {error}
        </div>
      )}

      {!teams && !error && (
        <div className="border-4 border-black bg-white p-10 flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin" />
          <p className="font-black uppercase tracking-widest text-sm">
            Loading teams...
          </p>
        </div>
      )}

      {teams && teams.length === 0 && (
        <div className="border-4 border-black bg-white p-6 font-bold text-center">
          No teams in the database.
        </div>
      )}

      {teams && teams.length > 0 && (
        <div className="border-4 border-black divide-y-4 divide-black">
          {teams.map((t) => {
            const st = status[t.teamId] || {};
            return (
              <div
                key={t.teamId}
                className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 ${
                  st.sent === true
                    ? "bg-green-100"
                    : st.sent === false
                      ? "bg-red-100"
                      : "bg-white"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-black uppercase text-sm truncate">
                    {t.name}
                  </p>
                  <p className="font-bold text-xs text-zinc-600 truncate">
                    {t.teamId} · {t.email}
                  </p>
                  {st.sent === false && (
                    <p className="font-bold text-xs text-red-700 mt-1">
                      {st.reason}
                    </p>
                  )}
                </div>

                <Button
                  type="button"
                  disabled={st.sending}
                  onClick={() => sendOne(t.teamId)}
                  className={`shrink-0 h-11 px-5 font-black uppercase tracking-widest text-sm rounded-none border-4 border-black flex items-center justify-center gap-2 ${
                    st.sent === true
                      ? "bg-green-400 text-black"
                      : "bg-black text-white"
                  }`}
                >
                  {st.sending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending
                    </>
                  ) : st.sent === true ? (
                    <>
                      <Check size={16} />
                      Sent
                    </>
                  ) : st.sent === false ? (
                    <>
                      <X size={16} />
                      Retry
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Send
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
