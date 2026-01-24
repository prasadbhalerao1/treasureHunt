import { useState, useEffect } from "react";
import api from "../../utils/api";
import { Button, Input, Card } from "../ui";
import { Trash2, UserPlus, RefreshCw } from "lucide-react";

export default function UserManagement({ onManageFlow }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    members: "",
  });

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/teams");
      setTeams(data);
    } catch (e) {
      console.error("Failed to fetch teams", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure? This will delete the team and all progress."))
      return;
    try {
      await api.delete(`/admin/teams/${id}`);
      fetchTeams();
    } catch (e) {
      alert("Failed to delete team");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const membersArray = form.members.split(",").map((m) => m.trim());
      await api.post("/admin/teams", { ...form, members: membersArray });
      alert("Team Created Successfully!");
      setShowAddForm(false);
      setForm({ name: "", email: "", password: "", members: "" });
      fetchTeams();
    } catch (e) {
      alert(e.response?.data?.msg || "Failed to create team");
    }
  };

  if (showAddForm) {
    return (
      <Card className="max-w-xl mx-auto p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white rounded-none">
        <h2 className="text-2xl font-black uppercase mb-6 bg-black text-white p-2 inline-block">
          Add New Team
        </h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            placeholder="Team Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="border-4 border-black p-3 rounded-none font-bold placeholder:uppercase"
          />
          <Input
            placeholder="Leader Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            type="email"
            className="border-4 border-black p-3 rounded-none font-bold placeholder:uppercase"
          />
          <Input
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            type="text"
            className="border-4 border-black p-3 rounded-none font-bold placeholder:uppercase"
          />
          <Input
            placeholder="Members (comma separated)"
            value={form.members}
            onChange={(e) => setForm({ ...form, members: e.target.value })}
            className="border-4 border-black p-3 rounded-none font-bold placeholder:uppercase"
          />

          <div className="flex gap-4">
            <Button
              type="submit"
              className="flex-1 bg-black text-white p-4 font-black uppercase border-4 border-black hover:bg-zinc-800 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:shadow-none active:translate-x-1 active:translate-y-1"
            >
              Create Team
            </Button>
            <Button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="flex-1 bg-white text-black p-4 font-black uppercase border-4 border-black hover:bg-zinc-100 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:shadow-none active:translate-x-1 active:translate-y-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b-4 border-black pb-4">
        <h2 className="text-3xl font-black uppercase tracking-tighter">
          User Database
        </h2>
        <div className="flex gap-4">
          <Button
            onClick={fetchTeams}
            className="bg-white text-black border-4 border-black p-3 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-zinc-100 active:shadow-none active:translate-x-1 active:translate-y-1"
          >
            <RefreshCw size={24} />
          </Button>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white border-4 border-black px-6 py-3 flex items-center gap-2 font-black uppercase rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-700 active:shadow-none active:translate-x-1 active:translate-y-1"
          >
            <UserPlus size={24} /> Add Team
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white p-1">
        <table className="w-full text-left border-collapse font-mono text-sm">
          <thead className="bg-black text-white uppercase font-black text-base">
            <tr>
              <th className="p-4 border-b-4 border-black">ID</th>
              <th className="p-4 border-b-4 border-black">Team Data</th>
              <th className="p-4 border-b-4 border-black">Status</th>
              <th className="p-4 border-b-4 border-black text-right">
                Controls
              </th>
            </tr>
          </thead>
          <tbody className="font-bold">
            {loading ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-xl font-black">
                  LOADING DATA...
                </td>
              </tr>
            ) : (
              teams.map((team, idx) => (
                <tr
                  key={team._id}
                  className={`border-b-2 border-zinc-200 hover:bg-yellow-50 transition-colors ${idx % 2 === 0 ? "bg-zinc-50" : "bg-white"}`}
                >
                  <td className="p-4 font-black text-lg border-r-2 border-zinc-200">
                    {team.teamId}
                  </td>
                  <td className="p-4 border-r-2 border-zinc-200">
                    <div className="font-black text-xl uppercase">
                      {team.name}
                    </div>
                    <div className="opacity-60">{team.email}</div>
                  </td>
                  <td className="p-4 border-r-2 border-zinc-200">
                    <div className="flex items-center gap-2">
                      <span className="bg-black text-white px-2 py-1 text-xs">
                        LVL {team.currentLevelIndex}
                      </span>
                      <span className="text-xs opacity-50">
                        step {team.currentLevelIndex}/6
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => onManageFlow(team._id)}
                        className="bg-white text-black border-2 border-black px-3 py-1 font-black uppercase text-xs hover:bg-black hover:text-white transition-colors"
                      >
                        View Flow
                      </Button>
                      <button
                        onClick={() => handleDelete(team._id)}
                        className="text-red-500 border-2 border-red-500 hover:bg-red-500 hover:text-white p-1 ml-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
