import { useState } from "react";
import api from "../../utils/api";
import { Button, Card } from "../ui";
import { Send, FlaskConical, AlertTriangle } from "lucide-react";

const CONFIRM_PHRASE = "SEND TO ALL TEAMS";

export default function BroadcastEmail() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState(null);
  const [armed, setArmed] = useState(false);
  const [confirm, setConfirm] = useState("");

  const ready = subject.trim() && body.trim();

  const send = async (mode) => {
    setSending(true);
    setNote(null);
    try {
      const { data } = await api.post("/admin/broadcast", {
        subject,
        body,
        mode,
        ...(mode === "ALL" ? { confirm } : {}),
      });
      setNote({ ok: true, text: data.msg, results: data.results });
      if (mode === "ALL") {
        setArmed(false);
        setConfirm("");
      }
    } catch (err) {
      setNote({
        ok: false,
        text: err.response?.data?.msg || "Failed to send",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <h2 className="text-2xl font-black uppercase tracking-tight mb-1">
        Broadcast Email
      </h2>
      <p className="text-sm font-bold text-zinc-600 mb-6">
        Sends a message to every team. Always send a test to yourself first.
      </p>

      <label className="block text-xs font-black uppercase tracking-widest mb-2">
        Subject
      </label>
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        maxLength={150}
        placeholder="Join the TraceRoute group for updates"
        className="w-full mb-5 p-3 border-4 border-black font-bold focus:outline-none focus:bg-yellow-50"
      />

      <label className="block text-xs font-black uppercase tracking-widest mb-2">
        Message
      </label>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={5000}
        rows={9}
        placeholder={"Hey!\n\nJoin this group for all event updates:\nhttps://chat.whatsapp.com/...\n\nSee you at A-217 at 2 PM sharp."}
        className="w-full p-3 border-4 border-black font-bold focus:outline-none focus:bg-yellow-50 resize-y"
      />
      <p className="text-right text-xs font-bold text-zinc-500 mt-1 mb-6">
        {body.length}/5000
      </p>

      {/* Test send */}
      <Button
        type="button"
        disabled={sending || !ready}
        onClick={() => send("TEST")}
        className="w-full h-14 mb-4 text-base font-black uppercase tracking-widest rounded-none border-4 border-black bg-white text-black flex items-center justify-center gap-2"
      >
        <FlaskConical size={20} />
        {sending ? "Sending..." : "Send test to myself"}
      </Button>

      {/* Real send, behind a typed confirmation */}
      {!armed ? (
        <Button
          type="button"
          disabled={!ready}
          onClick={() => setArmed(true)}
          className="w-full h-14 text-base font-black uppercase tracking-widest rounded-none border-4 border-black bg-zinc-200 text-black flex items-center justify-center gap-2"
        >
          <Send size={20} />
          Send to all teams...
        </Button>
      ) : (
        <div className="border-4 border-black bg-red-50 p-4">
          <div className="flex items-start gap-2 mb-3">
            <AlertTriangle size={22} className="shrink-0 mt-0.5" />
            <p className="font-bold text-sm">
              This emails <strong>every team</strong> in the database. Type{" "}
              <code className="bg-black text-white px-1">{CONFIRM_PHRASE}</code>{" "}
              to confirm.
            </p>
          </div>
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={CONFIRM_PHRASE}
            className="w-full mb-3 p-3 border-4 border-black font-black uppercase tracking-wider focus:outline-none focus:bg-white"
          />
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={() => {
                setArmed(false);
                setConfirm("");
              }}
              className="flex-1 h-12 font-black uppercase tracking-widest rounded-none border-4 border-black bg-white text-black"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={sending || confirm !== CONFIRM_PHRASE}
              onClick={() => send("ALL")}
              className="flex-1 h-12 font-black uppercase tracking-widest rounded-none border-4 border-black bg-black text-white"
            >
              {sending ? "Sending..." : "Send for real"}
            </Button>
          </div>
        </div>
      )}

      {note && (
        <div
          className={`mt-5 border-4 border-black p-4 font-bold ${
            note.ok ? "bg-green-300" : "bg-red-300"
          }`}
        >
          {note.text}
          {note.results?.some((r) => !r.sent) && (
            <ul className="mt-2 text-sm font-bold list-disc list-inside">
              {note.results
                .filter((r) => !r.sent)
                .map((r) => (
                  <li key={r.email}>
                    {r.teamId} ({r.email}): {r.reason}
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
