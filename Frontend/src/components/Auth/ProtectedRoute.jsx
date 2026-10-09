import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <div className="p-10 font-bold text-xl">Establishing route...</div>
    );
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role))
    return (
      <div className="p-10 text-red-600 font-bold flex flex-col gap-4">
        ACCESS DENIED: CLEARANCE LEVEL INSUFFICIENT
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = "/login";
          }}
          className="bg-black text-white px-4 py-2 rounded max-w-xs"
        >
          FORCE LOGOUT
        </button>
      </div>
    );

  return children;
};

export default ProtectedRoute;
