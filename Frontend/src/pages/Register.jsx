import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button, Input, Card } from "../components/ui";

export default function Register() {
  const [form, setForm] = useState({
    teamName: "",
    email: "",
    password: "",
    members: "",
  });
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const membersArray = form.members.split(",").map((m) => m.trim());
      await register(form.teamName, form.email, form.password, membersArray);
      alert(
        "Registration Successful! Check your email (simulated) for Team ID."
      );
      navigate("/login");
    } catch (err) {
      console.error("Registration Error:", err);
      setError(err.response?.data?.msg || "Registration Failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50 p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-3xl font-black mb-6 text-center uppercase tracking-tighter">
          Team Registration
        </h2>
        {error && (
          <div className="bg-red-100 border border-red-500 text-red-700 p-2 mb-4 font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-bold mb-1">Team Name</label>
            <Input
              type="text"
              placeholder="The Avengers"
              value={form.teamName}
              onChange={(e) => setForm({ ...form, teamName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block font-bold mb-1">Leader Email</label>
            <Input
              type="email"
              placeholder="leader@college.edu"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
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
          <div>
            <label className="block font-bold mb-1">
              Members (Comma separated)
            </label>
            <Input
              type="text"
              placeholder="Alice, Bob, Charlie"
              value={form.members}
              onChange={(e) => setForm({ ...form, members: e.target.value })}
            />
          </div>

          <Button type="submit" className="w-full">
            REGISTER
          </Button>
        </form>
        <p className="mt-4 text-center text-sm font-semibold">
          <Link to="/login" className="underline hover:text-blue-600">
            Back to Login
          </Link>
        </p>
      </Card>
    </div>
  );
}
