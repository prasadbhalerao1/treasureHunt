import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage on load
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (teamId, password) => {
    const { data } = await api.post("/auth/login", { teamId, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.team));
    setUser(data.team);
    return data;
  };

  const register = async (teamName, email, password, members) => {
    const { data } = await api.post("/auth/register", {
      teamName,
      email,
      password,
      members,
    });
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
