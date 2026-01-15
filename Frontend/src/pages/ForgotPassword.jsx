import { useState } from "react";
import api from "../utils/api";
import { Button, Input, Card } from "../components/ui";
import { Link, useNavigate } from "react-router-dom";
import Loader from "../components/Loader";

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Email, 2: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMsg("");
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setMsg(data.msg);
      // Even if email not found, we show generic message. But here assuming success if no error.
      setStep(2);
    } catch (err) {
      console.error(err);
      setError("Failed to process request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/reset-password", {
        email,
        otp,
        newPassword,
      });
      setMsg(data.msg);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.msg || "Reset Failed");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen text="Cruning Numbers..." />;

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50 p-4">
      <Card className="w-full max-w-md border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white p-6 md:p-8">
        <h2 className="text-3xl font-black mb-6 text-center uppercase tracking-tighter">
          {step === 1 ? "Recovery Protocol" : "Secure Reset"}
        </h2>

        {error && (
          <div className="bg-red-100 border-2 border-red-500 text-red-900 p-3 mb-6 font-bold text-center uppercase tracking-wide animation-pulse">
            {error}
          </div>
        )}
        {msg && (
          <div className="bg-green-100 border-2 border-green-500 text-green-900 p-3 mb-6 font-bold text-center uppercase tracking-wide">
            {msg}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-6">
            <div>
              <label className="block font-black mb-2 uppercase text-sm tracking-widest">
                Registered Email
              </label>
              <Input
                type="email"
                placeholder="leader@team.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-16 text-lg border-4 border-black"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-black text-white h-16 text-xl font-black uppercase tracking-widest border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:bg-zinc-800"
            >
              Send Signal
            </Button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-6">
            <div>
              <label className="block font-black mb-2 uppercase text-sm tracking-widest">
                One-Time Password
              </label>
              <Input
                type="text"
                placeholder="XXXXXX"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                className="h-16 text-center text-2xl tracking-[0.5em] border-4 border-black uppercase"
                maxLength={6}
              />
            </div>
            <div>
              <label className="block font-black mb-2 uppercase text-sm tracking-widest">
                New Password
              </label>
              <Input
                type="password"
                placeholder="********"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="h-14 text-lg border-4 border-black"
              />
            </div>
            <div>
              <label className="block font-black mb-2 uppercase text-sm tracking-widest">
                Confirm Password
              </label>
              <Input
                type="password"
                placeholder="********"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-14 text-lg border-4 border-black"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-black text-white h-16 text-xl font-black uppercase tracking-widest border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:bg-zinc-800"
            >
              Override
            </Button>
          </form>
        )}

        <div className="mt-8 text-center">
          <Link
            to="/login"
            className="text-sm font-bold uppercase tracking-wide underline hover:text-zinc-600"
          >
            Abort & Return
          </Link>
        </div>
      </Card>
    </div>
  );
}
