import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button, Input, Card } from "../components/ui";
import Loader from "../components/Loader";

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
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const membersArray = form.members
        .split(",")
        .map((m) => m.trim())
        .filter((m) => m !== "");

      if (membersArray.length > 4) {
        setError("Maximum 4 members allowed (including you if applicable).");
        setLoading(false);
        return;
      }

      const data = await register(
        form.teamName,
        form.email,
        form.password,
        membersArray
      );
      setSuccess(data.teamId);
    } catch (err) {
      console.error("Registration Error:", err);
      if (!err.response) {
        setError(
          "Network Error: Unable to reach server. Please check your connection."
        );
      } else {
        setError(
          err.response?.data?.msg ||
            "Registration Failed. Please try again later."
        );
      }
      setSuccess(false);
    } finally {
      if (!success) setLoading(false); // Keep loading true if success to prevent flash before UI switch? No, success state handles UI.
      // Wait, if success is true, we show success UI. Correct.
    }
  };

  if (loading && !success) {
    return <Loader fullScreen text="REGISTERING TEAM" />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50 p-4">
      <Card className="w-full max-w-md border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white p-6 md:p-8">
        <h2 className="text-3xl md:text-4xl font-black mb-6 md:mb-8 text-center uppercase tracking-tighter">
          Team Registration
        </h2>
        {success ? (
          <div className="text-center space-y-6 animate-in slide-in-from-bottom">
            <div className="bg-green-100 border-4 border-green-500 text-green-900 p-6 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-2xl font-black uppercase mb-2">
                Registration Complete
              </h3>
              <p>
                Mission details sent to <strong>{form.email}</strong>.
                <br />
                <span className="block mt-6 text-2xl md:text-4xl font-black bg-white p-4 border-4 border-black text-black">
                  ID: {success}
                </span>
                <span className="text-sm font-bold uppercase mt-2 block opacity-75">
                  (Save this ID! You need it to login)
                </span>
              </p>
            </div>
            <Button
              onClick={() => navigate("/login")}
              className="w-full bg-black text-white font-black uppercase text-xl md:text-2xl h-16 border-4 border-black hover:bg-zinc-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              PROCEED TO LOGIN
            </Button>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-100 border-2 border-red-500 text-red-900 p-3 mb-6 font-bold text-center uppercase tracking-wide">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <div>
                <label className="block font-black mb-2 uppercase text-sm tracking-widest">
                  Team Name
                </label>
                <Input
                  type="text"
                  placeholder="The Avengers"
                  value={form.teamName}
                  onChange={(e) =>
                    setForm({ ...form, teamName: e.target.value })
                  }
                  required
                  className="h-14 md:h-16 text-lg md:text-xl border-4 border-black bg-zinc-50 focus:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block font-black mb-2 uppercase text-sm tracking-widest">
                  Leader Email
                </label>
                <Input
                  type="email"
                  placeholder="leader@college.edu"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
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
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                  className="h-14 md:h-16 text-lg md:text-xl border-4 border-black bg-zinc-50 focus:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block font-black mb-2 uppercase text-sm tracking-widest">
                  Members (Comma separated)
                </label>
                <Input
                  type="text"
                  placeholder="Alice, Bob, Charlie"
                  value={form.members}
                  onChange={(e) =>
                    setForm({ ...form, members: e.target.value })
                  }
                  className="h-14 md:h-16 text-lg md:text-xl border-4 border-black bg-zinc-50 focus:bg-white transition-colors"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white hover:bg-zinc-800 h-16 text-xl md:text-2xl font-black tracking-widest uppercase rounded-none border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "REGISTERING..." : "REGISTER"}
              </Button>
            </form>
          </>
        )}
        <p className="mt-8 text-center text-sm font-bold uppercase tracking-wide">
          <Link
            to="/login"
            className="underline hover:text-blue-600 decoration-2 underline-offset-4"
          >
            Back to Login
          </Link>
        </p>
      </Card>
    </div>
  );
}
