import { useState, useEffect, useRef, useCallback } from "react";
import api from "../../utils/api";
import { Button, Input, Card } from "../ui";
import { Plus, Download, Upload, Trash2, Pencil, Save, X } from "lucide-react";

const EMPTY = {
  prompt: "",
  options: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }],
  correctKey: "A",
  explanation: "",
  section: "General",
  difficulty: "MEDIUM",
  active: true,
};

const DIFF_STYLE = {
  EASY: "bg-green-300",
  MEDIUM: "bg-yellow-300",
  HARD: "bg-red-300",
};

export default function QuestionBank() {
  const [data, setData] = useState({ questions: [], active: 0, needed: 7 });
  const [filters, setFilters] = useState({ q: "", difficulty: "" });
  const [editing, setEditing] = useState(null); // form object or null
  const [note, setNote] = useState(null);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const params = {};
      if (filters.q) params.q = filters.q;
      if (filters.difficulty) params.difficulty = filters.difficulty;
      const res = await api.get("/admin/questions", { params });
      setData(res.data);
    } catch {
      setNote({ ok: false, text: "Failed to load questions" });
    }
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const flash = (ok, text) => {
    setNote({ ok, text });
    setTimeout(() => setNote(null), 4000);
  };

  const startEdit = (q) =>
    setEditing(
      q
        ? { ...q, options: q.options.map((o) => ({ ...o })) }
        : JSON.parse(JSON.stringify(EMPTY)),
    );

  const save = async () => {
    const body = {
      ...editing,
      options: editing.options.map((o, i) => ({
        key: String.fromCharCode(65 + i),
        text: o.text,
      })),
    };
    try {
      if (editing.questionId) {
        await api.put(`/admin/questions/${editing.questionId}`, body);
      } else {
        await api.post("/admin/questions", body);
      }
      setEditing(null);
      flash(true, "Saved");
      load();
    } catch (e) {
      flash(false, e.response?.data?.msg || "Save failed");
    }
  };

  const toggleActive = async (q) => {
    await api.put(`/admin/questions/${q.questionId}`, { active: !q.active });
    load();
  };

  const remove = async (q) => {
    if (!confirm(`Delete question #${q.questionId}?`)) return;
    try {
      const { data: res } = await api.delete(`/admin/questions/${q.questionId}`);
      flash(true, res.msg);
      load();
    } catch (e) {
      flash(false, e.response?.data?.msg || "Delete failed");
    }
  };

  const exportJson = async () => {
    const { data: list } = await api.get("/admin/questions/export");
    const blob = new Blob([JSON.stringify(list, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "questions.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importJson = async (file) => {
    if (!file) return;
    try {
      const list = JSON.parse(await file.text());
      const { data: res } = await api.post("/admin/questions/import", list);
      flash(true, res.msg);
      load();
    } catch (e) {
      flash(false, e.response?.data?.msg || "Invalid JSON file");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const setOption = (i, text) =>
    setEditing((f) => ({
      ...f,
      options: f.options.map((o, j) => (j === i ? { ...o, text } : o)),
    }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase">Question Bank</h2>
          <p className="text-sm font-bold">
            {data.active} active ·{" "}
            <span className={data.active < data.needed ? "text-red-600" : ""}>
              {data.needed} needed per team
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => startEdit(null)}
            className="rounded-none border-4 border-black font-black uppercase flex items-center gap-2"
          >
            <Plus size={16} /> Add
          </Button>
          <Button
            onClick={() => fileRef.current?.click()}
            className="rounded-none border-4 border-black bg-white text-black font-black uppercase flex items-center gap-2"
          >
            <Upload size={16} /> Import JSON
          </Button>
          <Button
            onClick={exportJson}
            className="rounded-none border-4 border-black bg-white text-black font-black uppercase flex items-center gap-2"
          >
            <Download size={16} /> Export
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => importJson(e.target.files?.[0])}
          />
        </div>
      </div>

      {note && (
        <div
          className={`p-3 border-4 border-black font-black uppercase text-sm ${note.ok ? "bg-green-200" : "bg-red-200"}`}
        >
          {note.text}
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Search prompt..."
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          className="max-w-xs"
        />
        <select
          value={filters.difficulty}
          onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
          className="border-2 border-black p-3 font-bold bg-white"
        >
          <option value="">All difficulties</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>
      </div>

      {editing && (
        <Card className="border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none space-y-4">
          <h3 className="font-black uppercase text-lg">
            {editing.questionId ? `Edit #${editing.questionId}` : "New question"}
          </h3>
          <textarea
            className="w-full border-2 border-black p-3 font-mono text-sm"
            rows={3}
            placeholder="Question prompt"
            value={editing.prompt}
            onChange={(e) => setEditing({ ...editing, prompt: e.target.value })}
          />
          <div className="space-y-2">
            {editing.options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct"
                  aria-label={`Option ${String.fromCharCode(65 + i)} is correct`}
                  checked={editing.correctKey === String.fromCharCode(65 + i)}
                  onChange={() =>
                    setEditing({ ...editing, correctKey: String.fromCharCode(65 + i) })
                  }
                  className="w-5 h-5 accent-black"
                />
                <span className="w-6 font-black">{String.fromCharCode(65 + i)}</span>
                <Input
                  value={o.text}
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  onChange={(e) => setOption(i, e.target.value)}
                />
              </div>
            ))}
            <div className="flex gap-2">
              {editing.options.length < 6 && (
                <Button
                  type="button"
                  onClick={() =>
                    setEditing({ ...editing, options: [...editing.options, { text: "" }] })
                  }
                  className="rounded-none text-xs bg-white text-black border-2"
                >
                  + option
                </Button>
              )}
              {editing.options.length > 2 && (
                <Button
                  type="button"
                  onClick={() =>
                    setEditing({
                      ...editing,
                      options: editing.options.slice(0, -1),
                      correctKey:
                        editing.correctKey.charCodeAt(0) - 65 >=
                        editing.options.length - 1
                          ? "A"
                          : editing.correctKey,
                    })
                  }
                  className="rounded-none text-xs bg-white text-black border-2"
                >
                  - option
                </Button>
              )}
            </div>
            <p className="text-xs text-zinc-500">
              Select the radio button next to the correct option.
            </p>
          </div>
          <textarea
            className="w-full border-2 border-black p-3 font-mono text-sm"
            rows={2}
            placeholder="Explanation shown after solving (optional)"
            value={editing.explanation}
            onChange={(e) => setEditing({ ...editing, explanation: e.target.value })}
          />
          <div className="flex gap-3 flex-wrap items-center">
            <Input
              className="max-w-[16rem]"
              placeholder="Section"
              value={editing.section}
              onChange={(e) => setEditing({ ...editing, section: e.target.value })}
            />
            <select
              value={editing.difficulty}
              onChange={(e) => setEditing({ ...editing, difficulty: e.target.value })}
              className="border-2 border-black p-3 font-bold bg-white"
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
            <label className="flex items-center gap-2 font-bold">
              <input
                type="checkbox"
                checked={editing.active}
                onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                className="w-5 h-5 accent-black"
              />
              Active
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              onClick={() => setEditing(null)}
              className="rounded-none bg-white text-black border-2 font-black uppercase flex items-center gap-1"
            >
              <X size={16} /> Cancel
            </Button>
            <Button
              onClick={save}
              className="rounded-none border-2 font-black uppercase flex items-center gap-1"
            >
              <Save size={16} /> Save
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {data.questions.map((q) => (
          <Card
            key={q.questionId}
            className={`border-4 border-black p-4 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${q.active ? "" : "opacity-50"}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2 mb-2 text-xs font-black uppercase">
                  <span className="bg-black text-white px-2 py-1">#{q.questionId}</span>
                  <span className={`px-2 py-1 border-2 border-black ${DIFF_STYLE[q.difficulty]}`}>
                    {q.difficulty}
                  </span>
                  <span className="px-2 py-1 border-2 border-black">{q.section}</span>
                  {!q.active && <span className="px-2 py-1 bg-zinc-300">Inactive</span>}
                </div>
                <p className="font-bold break-words">{q.prompt}</p>
                <ul className="mt-2 text-sm space-y-1">
                  {q.options.map((o) => (
                    <li
                      key={o.key}
                      className={o.key === q.correctKey ? "font-black text-green-700" : ""}
                    >
                      {o.key}. {o.text}
                      {o.key === q.correctKey && " ✓"}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => toggleActive(q)}
                  className="rounded-none bg-white text-black border-2 text-xs font-black uppercase px-3 py-2"
                >
                  {q.active ? "Disable" : "Enable"}
                </Button>
                <Button
                  onClick={() => startEdit(q)}
                  aria-label="Edit"
                  className="rounded-none bg-white text-black border-2 px-3 py-2"
                >
                  <Pencil size={16} />
                </Button>
                <Button
                  onClick={() => remove(q)}
                  aria-label="Delete"
                  className="rounded-none bg-red-600 text-white border-2 px-3 py-2"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {data.questions.length === 0 && (
          <div className="p-8 text-center font-black text-zinc-400 uppercase">
            No questions
          </div>
        )}
      </div>
    </div>
  );
}
