import { useState, useEffect, useCallback } from "react";
import QRCode from "qrcode";
import api from "../../utils/api";
import { Button, Input, Card } from "../ui";
import { Save, Plus, Trash2, RefreshCw, Download, Printer } from "lucide-react";

const downloadQr = async (loc) => {
  const url = await QRCode.toDataURL(loc.qrSecret, { width: 600, margin: 2 });
  const a = document.createElement("a");
  a.href = url;
  a.download = `${loc.locationId}_${loc.name.replace(/[^a-z0-9]+/gi, "_")}.png`;
  a.click();
};

// Opens a print-ready A4 sheet with every QR code
const printAll = async (locations) => {
  const items = await Promise.all(
    locations.map(async (l) => ({
      ...l,
      url: await QRCode.toDataURL(l.qrSecret, { width: 500, margin: 2 }),
    })),
  );
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
  const w = window.open("", "_blank");
  if (!w) return alert("Allow pop-ups to print the QR sheet.");
  w.document.write(`<!doctype html><title>QR codes</title>
<style>
  body{font-family:sans-serif;margin:0}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:16px}
  .card{border:3px solid #000;padding:12px;text-align:center;break-inside:avoid}
  img{width:100%;max-width:300px}
  h2{margin:8px 0 0;font-size:18px;text-transform:uppercase}
  p{margin:2px 0;font-size:12px;color:#555}
  @media print{.card{page-break-inside:avoid}}
</style>
<div class="grid">${items
    .map(
      (i) =>
        `<div class="card"><img src="${i.url}"><h2>${esc(i.name)}</h2><p>ID ${i.locationId}</p></div>`,
    )
    .join("")}</div>
<script>window.onload=()=>setTimeout(()=>window.print(),300)</script>`);
  w.document.close();
};

export default function LocationManagement() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [adding, setAdding] = useState(null);
  const [err, setErr] = useState("");

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/locations");
      setLocations(data);
    } catch (e) {
      console.error("Failed to fetch locations", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const fail = (e, fallback) => setErr(e.response?.data?.msg || fallback);

  const handleEdit = (loc) => {
    setEditingId(loc.locationId);
    setEditForm({
      name: loc.name,
      hint: loc.hint,
      qrSecret: loc.qrSecret,
      keyword: loc.keyword || "",
    });
  };

  const handleSave = async (id) => {
    try {
      await api.put(`/admin/locations/${id}`, editForm);
      setEditingId(null);
      setErr("");
      fetchLocations();
    } catch (e) {
      fail(e, "Failed to update location");
    }
  };

  const regenerate = async (loc) => {
    if (!confirm(`Regenerate the QR secret for ${loc.name}? Printed QR codes become invalid.`)) return;
    try {
      await api.post(`/admin/locations/${loc.locationId}/regenerate-secret`);
      fetchLocations();
    } catch (e) {
      fail(e, "Failed to regenerate");
    }
  };

  const remove = async (loc) => {
    if (!confirm(`Delete ${loc.name}?`)) return;
    try {
      await api.delete(`/admin/locations/${loc.locationId}`);
      setErr("");
      fetchLocations();
    } catch (e) {
      fail(e, "Failed to delete");
    }
  };

  const create = async () => {
    try {
      await api.post("/admin/locations", adding);
      setAdding(null);
      setErr("");
      fetchLocations();
    } catch (e) {
      fail(e, "Failed to create location");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h2 className="text-2xl font-black uppercase">Locations</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => setAdding({ name: "", hint: "", keyword: "" })}
            className="rounded-none border-4 border-black font-black uppercase flex items-center gap-2"
          >
            <Plus size={16} /> Add
          </Button>
          <Button
            onClick={() => printAll(locations)}
            disabled={!locations.length}
            className="rounded-none border-4 border-black bg-white text-black font-black uppercase flex items-center gap-2"
          >
            <Printer size={16} /> Print all QRs
          </Button>
        </div>
      </div>

      {err && (
        <div className="p-3 border-4 border-black bg-red-200 font-black uppercase text-sm">
          {err}
        </div>
      )}

      {adding && (
        <Card className="border-4 border-black p-4 space-y-2 rounded-none">
          <Input
            placeholder="Name"
            value={adding.name}
            onChange={(e) => setAdding({ ...adding, name: e.target.value })}
          />
          <Input
            placeholder="Hop code (e.g. ROUTER)"
            value={adding.keyword}
            onChange={(e) => setAdding({ ...adding, keyword: e.target.value })}
          />
          <textarea
            className="w-full border-2 border-black p-2 font-mono text-sm"
            placeholder="Hint shown after the previous level is solved"
            rows={3}
            value={adding.hint}
            onChange={(e) => setAdding({ ...adding, hint: e.target.value })}
          />
          <div className="flex gap-2 justify-end">
            <Button onClick={() => setAdding(null)} className="rounded-none bg-white text-black border-2 text-xs font-bold uppercase">
              Cancel
            </Button>
            <Button onClick={create} className="rounded-none border-2 text-xs font-bold uppercase">
              Create
            </Button>
          </div>
        </Card>
      )}

      {loading && <p className="font-bold uppercase">Loading...</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {locations.map((loc) => (
          <Card
            key={loc._id}
            className="border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white rounded-none"
          >
            <div className="flex justify-between items-start mb-2 gap-2">
              <h3 className="font-black text-xl uppercase break-words">{loc.name}</h3>
              <div className="flex gap-1 shrink-0">
                {loc.keyword && (
                  <span className="bg-zinc-200 text-xs px-2 py-1 font-mono">
                    {loc.keyword}
                  </span>
                )}
                <span className="bg-black text-white text-xs px-2 py-1 font-mono">
                  ID: {loc.locationId}
                </span>
              </div>
            </div>

            {editingId === loc.locationId ? (
              <div className="space-y-2 mt-4">
                <div>
                  <label className="text-xs font-bold uppercase">Name</label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase">Hop code</label>
                  <Input
                    value={editForm.keyword}
                    onChange={(e) => setEditForm({ ...editForm, keyword: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase">Hint (shown to find this place)</label>
                  <textarea
                    className="w-full border-2 border-black p-2 font-mono text-sm"
                    rows={4}
                    value={editForm.hint}
                    onChange={(e) => setEditForm({ ...editForm, hint: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase">QR Secret</label>
                  <Input
                    value={editForm.qrSecret}
                    onChange={(e) => setEditForm({ ...editForm, qrSecret: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button onClick={() => setEditingId(null)} className="text-xs uppercase font-bold rounded-none bg-white text-black border-2">
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleSave(loc.locationId)}
                    className="rounded-none text-xs uppercase font-bold px-4 py-2 flex items-center gap-1"
                  >
                    <Save size={14} /> Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <p className="text-sm border-l-4 border-zinc-300 pl-2 italic whitespace-pre-line">
                  "{loc.hint}"
                </p>
                <p className="text-xs font-mono text-zinc-500 truncate">
                  QR: {loc.qrSecret}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    onClick={() => handleEdit(loc)}
                    className="border-2 border-black text-xs font-bold uppercase bg-white text-black hover:bg-zinc-100 rounded-none"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => downloadQr(loc)}
                    className="border-2 border-black text-xs font-bold uppercase bg-white text-black hover:bg-zinc-100 rounded-none flex items-center justify-center gap-1"
                  >
                    <Download size={14} /> QR
                  </Button>
                  <Button
                    onClick={() => regenerate(loc)}
                    className="border-2 border-black text-xs font-bold uppercase bg-white text-black hover:bg-zinc-100 rounded-none flex items-center justify-center gap-1"
                  >
                    <RefreshCw size={14} /> New secret
                  </Button>
                  <Button
                    onClick={() => remove(loc)}
                    disabled={loc.locationId === 0}
                    className="border-2 border-black text-xs font-bold uppercase bg-red-600 text-white rounded-none flex items-center justify-center gap-1"
                  >
                    <Trash2 size={14} /> Delete
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
