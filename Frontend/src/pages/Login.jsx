import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button, Input, Card } from "../components/ui";
import Loader from "../components/Loader";

export default function Login() {
  const [form, setForm] = useState({ teamId: "", password: "" });
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await login(form.teamId, form.password);

      // Role-Based Redirection
      const role = data.team.role;
      if (role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError(err.response?.data?.msg || "Login Failed");
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader fullScreen text="AUTHENTICATING" />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50 p-4">
      <Card className="w-full max-w-md border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white p-6 md:p-8">
        <h2 className="text-3xl md:text-4xl font-black mb-6 md:mb-8 text-center uppercase tracking-tighter">
          BERLIN HEIST
        </h2>
        {error && (
          <div className="bg-red-100 border-2 border-red-500 text-red-900 p-3 mb-6 font-bold text-center uppercase tracking-wide">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-black mb-2 uppercase text-sm tracking-widest">
              Team ID
            </label>
            <Input
              type="text"
              placeholder="e.g. TITAN-X99"
              value={form.teamId}
              onChange={(e) => setForm({ ...form, teamId: e.target.value })}
              required
              className="h-14 md:h-16 text-lg md:text-xl border-4 border-black bg-zinc-50 focus:bg-white transition-colors"
            />
          </div>
          <div>
            <label className="block font-black mb-2 uppercase text-sm tracking-widest">
              Password
            </label>
            <Input
              type="password"
              placeholder="********"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              className="h-14 md:h-16 text-lg md:text-xl border-4 border-black bg-zinc-50 focus:bg-white transition-colors"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white hover:bg-zinc-800 h-16 text-xl md:text-2xl font-black tracking-widest uppercase rounded-none border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
          >
            {loading ? "LOGIN..." : "LOGIN"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
