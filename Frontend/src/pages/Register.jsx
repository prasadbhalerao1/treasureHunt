import { Link } from "react-router-dom";
import { Card } from "../components/ui";

export default function Register() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50 p-4">
      <Card className="w-full max-w-md border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white p-6 md:p-8 text-center">
        <h2 className="text-3xl font-black mb-6 uppercase tracking-tighter">
          Registration Closed
        </h2>
        <p className="mb-8 font-bold text-zinc-600">
          Public registration is currently disabled. Please contact the
          administrator.
        </p>
        <Link
          to="/login"
          className="bg-black text-white px-6 py-3 font-black uppercase text-xl border-4 border-black hover:bg-zinc-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-x-1 active:translate-y-1 active:shadow-none inline-block"
        >
          Back to Login
        </Link>
      </Card>
    </div>
  );
}
