import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <div className="p-10 font-bold text-xl">Loading Berlin Protocol...</div>
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

const RoleRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;

  if (user.role === "ADMIN") return <Navigate to="/admin" />;
  return <Navigate to="/dashboard" />;
};

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={["CANDIDATE"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <Admin />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<RoleRedirect />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
