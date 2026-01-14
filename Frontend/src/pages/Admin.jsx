import { useState, useEffect } from "react";
import api from "../utils/api";
import { Card, Button } from "../components/ui";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { LogOut } from "lucide-react";

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b-4 border-black pb-8">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
          Mission Control
        </h1>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="p-3 border-4 border-black font-black uppercase tracking-widest w-full md:w-auto focus:bg-zinc-100 rounded-none text-lg"
          >
            <option value="Global">Global Overview</option>
            {[1, 2, 3, 4, 5, 6, 7].map((l) => (
              <option key={l} value={l}>
                Level {l}
              </option>
            ))}
          </select>
          <Button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              window.location.reload();
            }}
            className="w-14 h-14 bg-white text-black border-4 border-black rounded-none hover:bg-zinc-200 p-0 flex items-center justify-center transition-transform active:translate-x-1 active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            title="Logout"
          >
            <LogOut size={24} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {stats.distribution && (
          <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none p-6">
            <h2 className="text-2xl font-black mb-6 uppercase tracking-tighter border-b-4 border-black pb-2">
              Team Distribution
            </h2>
            <div className="h-64 font-mono font-bold">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.distribution}>
                  <XAxis
                    dataKey="level"
                    tick={{ fill: "black", fontWeight: "bold" }}
                    axisLine={{ stroke: "black", strokeWidth: 2 }}
                  />
                  <YAxis
                    tick={{ fill: "black", fontWeight: "bold" }}
                    axisLine={{ stroke: "black", strokeWidth: 2 }}
                  />
                  <Tooltip
                    contentStyle={{
                      border: "4px solid black",
                      borderRadius: "0px",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                    }}
                    cursor={{ fill: "#f4f4f5" }}
                  />
                  <Bar dataKey="count" fill="#000000" radius={[0, 0, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        <Card
          className={`border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none p-6 ${
            stats.distribution ? "" : "col-span-2"
          }`}
        >
          <h2 className="text-2xl font-black mb-6 uppercase tracking-tighter border-b-4 border-black pb-2 flex justify-between items-center">
            <span>
              {selectedLevel === "Global"
                ? "Top 10 Leaders"
                : `Fastest Teams (Level ${selectedLevel})`}
            </span>
            <span className="text-xs bg-black text-white px-2 py-1 tracking-widest">
              LIVE
            </span>
          </h2>
          <div className="overflow-auto max-h-96">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-4 border-black text-black font-black uppercase text-sm tracking-widest">
                  <th className="p-3">Rank</th>
                  <th className="p-3">Team</th>
                  {selectedLevel !== "Global" && <th className="p-3">Time</th>}
                  <th className="p-3">
                    {selectedLevel === "Global"
                      ? "Current Lvl"
                      : "Completed At"}
                  </th>
                </tr>
              </thead>
              <tbody className="font-bold text-sm uppercase">
                {stats.leaderboard?.map((team, idx) => (
                  <tr
                    key={team.teamId}
                    className="border-b-2 border-zinc-100 hover:bg-zinc-50 transition-colors"
                  >
                    <td className="p-3 font-black">#{idx + 1}</td>
                    <td className="p-3">
                      <div className="font-black text-lg">{team.name}</div>
                      <div className="text-xs text-zinc-500 tracking-widest">
                        {team.teamId}
                      </div>
                    </td>
                    {selectedLevel !== "Global" && (
                      <td className="p-3 font-mono text-blue-600 font-bold">
                        {formatTime(team.timeTaken)}
                      </td>
                    )}
                    <td className="p-3 text-zinc-600">
                      {selectedLevel === "Global" ? (
                        <span className="bg-black text-white px-3 py-1 font-black text-xs">
                          LVL {team.currentLevel}
                        </span>
                      ) : (
                        new Date(team.completedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      )}
                    </td>
                  </tr>
                ))}
                {(!stats.leaderboard || stats.leaderboard.length === 0) && (
                  <tr>
                    <td
                      colSpan="4"
                      className="p-8 text-center text-zinc-400 font-black italic"
                    >
                      NO DATA AVAILABLE
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
