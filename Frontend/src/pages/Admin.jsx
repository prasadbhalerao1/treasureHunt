import { useState, useEffect } from "react";
import api from "../utils/api";
import { Card } from "../components/ui";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState("1"); // Default to Level 1 view or Global

  const fetchStats = async () => {
    try {
      const query = selectedLevel === "Global" ? "" : `?level=${selectedLevel}`;
      const { data } = await api.get(`/admin/stats${query}`);
      setStats(data);
    } catch (e) {
      console.error("Admin Fetch Error:", e);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [selectedLevel]);

  if (!stats) return <div className="p-8">Loading Analytics...</div>;

  // Helper to format ms to mm:ss
  const formatTime = (ms) => {
    if (!ms) return "-";
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}m ${seconds.padStart(2, "0")}s`;
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-black uppercase">Mission Control</h1>
        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="p-2 border-2 border-black font-bold"
        >
          <option value="Global">Global Overview</option>
          {[1, 2, 3, 4, 5, 6, 7].map((l) => (
            <option key={l} value={l}>
              Level {l}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {stats.distribution && (
          <Card>
            <h2 className="text-xl font-bold mb-4">Team Distribution</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.distribution}>
                  <XAxis dataKey="level" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#000000" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        <Card className={stats.distribution ? "" : "col-span-2"}>
          <h2 className="text-xl font-bold mb-4">
            {selectedLevel === "Global"
              ? "Top 10 Leaders"
              : `Fastest Teams (Level ${selectedLevel})`}
          </h2>
          <div className="overflow-auto max-h-96">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="p-2">Rank</th>
                  <th className="p-2">Team</th>
                  {selectedLevel !== "Global" && (
                    <th className="p-2">Time Taken</th>
                  )}
                  <th className="p-2">Completed At / Current Lvl</th>
                </tr>
              </thead>
              <tbody>
                {stats.leaderboard?.map((team, idx) => (
                  <tr
                    key={team.teamId}
                    className="border-b border-zinc-200 hover:bg-zinc-100"
                  >
                    <td className="p-2 font-bold">#{idx + 1}</td>
                    <td className="p-2">
                      <div className="font-bold">{team.name}</div>
                      <div className="text-xs text-zinc-400 font-mono">
                        {team.teamId}
                      </div>
                    </td>
                    {selectedLevel !== "Global" && (
                      <td className="p-2 font-mono text-blue-600 font-bold">
                        {formatTime(team.timeTaken)}
                      </td>
                    )}
                    <td className="p-2 text-zinc-500 text-sm">
                      {selectedLevel === "Global" ? (
                        <span className="bg-black text-white px-2 py-1 font-mono">
                          {team.currentLevel}
                        </span>
                      ) : (
                        new Date(team.completedAt).toLocaleTimeString()
                      )}
                    </td>
                  </tr>
                ))}
                {(!stats.leaderboard || stats.leaderboard.length === 0) && (
                  <tr>
                    <td colSpan="4" className="p-4 text-center text-zinc-400">
                      No Data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
