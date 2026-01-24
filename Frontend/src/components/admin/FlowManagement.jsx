import { useState, useEffect } from "react";
import api from "../../utils/api";
import { Button, Card } from "../ui";
import { Edit, Save, X } from "lucide-react";

export default function FlowManagement({ initialTeamId }) {
  const [teams, setTeams] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(initialTeamId);
  const [editingPath, setEditingPath] = useState(null); // Array of Location IDs

  const fetchData = async () => {
    try {
      const [tRes, lRes] = await Promise.all([
        api.get("/admin/teams"),
        api.get("/admin/locations"),
      ]);
      setTeams(tRes.data);
      setLocations(lRes.data);
      if (initialTeamId) setSelectedTeamId(initialTeamId); // Ensure it's set after data load
    } catch (e) {
      console.error("Fetch error", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedTeam = teams.find((t) => t._id === selectedTeamId);

  const startEdit = () => {
    setEditingPath([...selectedTeam.path]);
  };

  const updatePathItem = (index, newLocId) => {
    const newPath = [...editingPath];
    newPath[index] = parseInt(newLocId);
    setEditingPath(newPath);
  };

  const savePath = async () => {
    try {
      await api.put(`/admin/teams/${selectedTeamId}/path`, {
        path: editingPath,
      });
      alert("Path Updated!");
      setEditingPath(null);
      fetchData();
    } catch (e) {
      alert("Failed to update path");
    }
  };

  // Helper to get location name
  const locName = (id) =>
    locations.find((l) => l.locationId === id)?.name || `ID ${id}`;

  return (
    <div className="space-y-6">
      <div className="flex gap-4 overflow-x-auto pb-4 border-b-4 border-black">
        {teams.map((team) => (
          <button
            key={team._id}
            onClick={() => {
              setSelectedTeamId(team._id);
              setEditingPath(null);
            }}
            className={`flex-shrink-0 p-3 border-4 font-bold uppercase transition-transform active:scale-95 ${selectedTeamId === team._id ? "bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]" : "bg-white text-black border-zinc-200 hover:border-black"}`}
          >
            {team.name}
            <div className="text-xs font-mono opacity-75">{team.teamId}</div>
          </button>
        ))}
      </div>

      {selectedTeam && (
        <Card className="border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
          <div className="flex justify-between items-center mb-6 border-b-4 border-black pb-4">
            <h2 className="text-2xl font-black uppercase">
              Flow: <span className="text-blue-600">{selectedTeam.name}</span>
            </h2>
            {!editingPath ? (
              <Button
                onClick={startEdit}
                className="bg-black text-white border-4 border-black px-4 py-2 font-bold uppercase flex items-center gap-2"
              >
                <Edit size={16} /> Edit Flow
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={() => setEditingPath(null)}
                  className="bg-white text-black border-4 border-black px-4 py-2 font-bold uppercase flex items-center gap-2"
                >
                  <X size={16} /> Cancel
                </Button>
                <Button
                  onClick={savePath}
                  className="bg-green-600 text-white border-4 border-black px-4 py-2 font-bold uppercase flex items-center gap-2"
                >
                  <Save size={16} /> Save Changes
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {(editingPath || selectedTeam.path).map((locId, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-black text-xl border-4 border-black shrink-0">
                  {idx}
                </div>
                <div className="flex-1 p-3 border-2 border-black font-bold uppercase flex justify-between items-center bg-zinc-50">
                  {editingPath ? (
                    <select
                      value={locId}
                      onChange={(e) => updatePathItem(idx, e.target.value)}
                      className="w-full bg-transparent outline-none cursor-pointer"
                      disabled={idx === 0} // Lock Start? User said "except starting location (We would hard code that)". So disable edit for 0.
                    >
                      {locations.map((l) => (
                        <option key={l.locationId} value={l.locationId}>
                          {l.name} (ID: {l.locationId})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span>{locName(locId)}</span>
                  )}
                  {idx === selectedTeam.currentLevelIndex && !editingPath && (
                    <span className="bg-blue-600 text-white text-xs px-2 py-1 ml-2 animate-pulse">
                      CURRENT
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
