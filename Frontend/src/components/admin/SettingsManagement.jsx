import { useState, useEffect } from "react";
import api from "../../utils/api";
import { Button, Input, Card } from "../ui";
import { Save } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";

const NUMBER_FIELDS = [
  ["totalLevels", "Levels (hops)", "1-12. Existing teams keep their own path."],
  ["maxAttemptsPerQuestion", "Attempts per question", "Before the out-of-attempts rule applies"],
  ["wrongAnswerCooldownSeconds", "Wrong-answer cooldown (s)", "Wait before the next try"],
  ["wrongAnswerTimePenaltySeconds", "Wrong-answer penalty (s)", "Added to the team's final time"],
];

const STATUS_STYLE = {
  DRAFT: "bg-zinc-200",
  LIVE: "bg-green-400",
  ENDED: "bg-red-400",
};

export default function SettingsManagement() {
  const { refreshSettings } = useSettings();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState(null);

  useEffect(() => {
    api
      .get("/admin/settings")
      .then(({ data }) => setForm(data))
      .catch(() => setNote({ ok: false, text: "Failed to load settings" }));
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (patch = form) => {
    setSaving(true);
    setNote(null);
    try {
      const { data } = await api.put("/admin/settings", patch);
      setForm(data.settings);
      refreshSettings();
      setNote({ ok: true, text: "Saved" });
    } catch (e) {
      setNote({ ok: false, text: e.response?.data?.msg || "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <div className="p-8 font-bold uppercase">Loading...</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-2xl font-black uppercase">Event Settings</h2>

      <Card className="border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none">
        <div className="text-xs font-black uppercase tracking-widest mb-3">
          Event status (players can only play while LIVE)
        </div>
        <div className="flex gap-3 flex-wrap">
          {["DRAFT", "LIVE", "ENDED"].map((s) => (
            <button
              key={s}
              onClick={() => {
                set("eventStatus", s);
                save({ eventStatus: s });
              }}
              className={`px-6 py-3 border-4 border-black font-black uppercase ${
                form.eventStatus === s
                  ? `${STATUS_STYLE[s]} shadow-none`
                  : "bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </Card>

      <Card className="border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none space-y-5">
        <div>
          <label className="block text-xs font-black uppercase tracking-widest mb-1">
            Event name
          </label>
          <Input
            value={form.eventName}
            maxLength={120}
            onChange={(e) => set("eventName", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase tracking-widest mb-1">
            Tagline
          </label>
          <Input
            value={form.tagline}
            maxLength={120}
            onChange={(e) => set("tagline", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {NUMBER_FIELDS.map(([key, label, help]) => (
            <div key={key}>
              <label className="block text-xs font-black uppercase tracking-widest mb-1">
                {label}
              </label>
              <Input
                type="number"
                min="0"
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
              />
              <p className="text-xs text-zinc-500 mt-1">{help}</p>
            </div>
          ))}
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-widest mb-1">
            When a team runs out of attempts
          </label>
          <select
            value={form.outOfAttemptsAction}
            onChange={(e) => set("outOfAttemptsAction", e.target.value)}
            className="w-full border-2 border-black p-3 font-bold bg-white"
          >
            <option value="SWAP_QUESTION">
              Give a new question (+ extra penalty)
            </option>
            <option value="LOCK_UNTIL_ADMIN">Lock until an organiser unlocks</option>
          </select>
        </div>

        <label className="flex items-center gap-3 font-bold">
          <input
            type="checkbox"
            checked={Boolean(form.showLeaderboardToTeams)}
            onChange={(e) => set("showLeaderboardToTeams", e.target.checked)}
            className="w-5 h-5 accent-black"
          />
          Show leaderboard rank to teams
        </label>

        <div className="flex items-center gap-4">
          <Button
            onClick={() => save()}
            disabled={saving}
            className="rounded-none border-4 border-black px-6 py-3 font-black uppercase flex items-center gap-2"
          >
            <Save size={18} /> {saving ? "Saving..." : "Save settings"}
          </Button>
          {note && (
            <span
              className={`font-black uppercase text-sm ${note.ok ? "text-green-700" : "text-red-600"}`}
            >
              {note.text}
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}
