import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button, Input, Card } from "../components/ui";

export default function Login() {
  const [form, setForm] = useState({ teamId: "", password: "" });
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form.teamId, form.password);
      // Auto-redirect handled by protected route check or here?
      // Better here to be explicit about role redirection, but AuthContext updates User.
      // We'll let the User effect in App or Dashboard handle it, OR just nav to /dashboard.
      navigate("/dashboard");
    } catch (err) {
      console.error("Login Error:", err);
      setError(err.response?.data?.msg || "Login Failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50 p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-3xl font-black mb-6 text-center uppercase tracking-tighter">
          Campus Heist
        </h2>
        {error && (
          <div className="bg-red-100 border border-red-500 text-red-700 p-2 mb-4 font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-bold mb-1">Team ID</label>
            <Input
              type="text"
              placeholder="e.g. TITAN-X99"
              value={form.teamId}
              onChange={(e) => setForm({ ...form, teamId: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block font-bold mb-1">Password</label>
            <Input
              type="password"
              placeholder="********"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <Button type="submit" className="w-full">
            LOGIN
          </Button>
        </form>

        <p className="mt-4 text-center text-sm font-semibold">
          New Team?{" "}
          <Link to="/register" className="underline hover:text-blue-600">
            Register Here
          </Link>
        </p>
      </Card>
    </div>
  );
}
