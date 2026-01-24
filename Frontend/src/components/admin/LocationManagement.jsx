import { useState, useEffect } from "react";
import api from "../../utils/api";
import { Button, Input, Card } from "../ui";
import { Save } from "lucide-react";

export default function LocationManagement() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ hint: "", qrSecret: "" });

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/locations");
      setLocations(data);
    } catch (e) {
      console.error("Failed to fetch locations", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleEdit = (loc) => {
    setEditingId(loc.locationId);
    setEditForm({ hint: loc.hint, qrSecret: loc.qrSecret });
  };

  const handleSave = async (id) => {
    try {
      await api.put(`/admin/locations/${id}`, editForm);
      setEditingId(null);
      fetchLocations();
    } catch (e) {
      alert("Failed to update location");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black uppercase">Location Management</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {locations.map((loc) => (
          <Card
            key={loc._id}
            className="border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-black text-xl uppercase">{loc.name}</h3>
              <span className="bg-black text-white text-xs px-2 py-1 font-mono">
                ID: {loc.locationId}
              </span>
            </div>

            {editingId === loc.locationId ? (
              <div className="space-y-2 mt-4">
                <div>
                  <label className="text-xs font-bold uppercase">Hint</label>
                  <textarea
                    className="w-full border-2 border-black p-2 font-mono text-sm"
                    value={editForm.hint}
                    onChange={(e) =>
                      setEditForm({ ...editForm, hint: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase">
                    QR Secret
                  </label>
                  <Input
                    className="w-full border-2 border-black p-2 font-mono text-sm"
                    value={editForm.qrSecret}
                    onChange={(e) =>
                      setEditForm({ ...editForm, qrSecret: e.target.value })
                    }
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    onClick={() => setEditingId(null)}
                    className="text-xs uppercase font-bold"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleSave(loc.locationId)}
                    className="bg-black text-white text-xs uppercase font-bold px-4 py-2 flex items-center gap-1"
                  >
                    <Save size={14} /> Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <p className="text-sm border-l-4 border-zinc-300 pl-2 italic">
                  "{loc.hint}"
                </p>
                <p className="text-xs font-mono text-zinc-500 truncate">
                  QR: {loc.qrSecret}
                </p>
                <Button
                  onClick={() => handleEdit(loc)}
                  className="mt-2 w-full bg-white text-black border-2 border-black text-xs font-bold uppercase hover:bg-zinc-100"
                >
                  Edit
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
