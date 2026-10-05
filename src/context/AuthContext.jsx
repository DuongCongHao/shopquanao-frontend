import React, { createContext, useState, useContext, useEffect } from "react";
import { authApi } from "../api/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("hugan_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [token, setToken] = useState(() => {
    return localStorage.getItem("hugan_token") || null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return undefined;

    let active = true;
    const heartbeat = async () => {
      try {
        await authApi.heartbeat();
      } catch (heartbeatError) {
        console.error("Phiên đăng nhập không còn hoạt động:", heartbeatError);
        if (active && heartbeatError.status === 401) {
          setUser(null);
          setToken(null);
          localStorage.removeItem("hugan_user");
          localStorage.removeItem("hugan_token");
        }
      }
    };

    const intervalId = window.setInterval(heartbeat, 60_000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [token]);

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login(credentials);
      const userData = {
        id: res.userId,
        email: res.email,
        fullName: res.fullName,
        role: res.role,
      };
      
      setUser(userData);
      setToken(res.token);

      localStorage.setItem("hugan_user", JSON.stringify(userData));
      localStorage.setItem("hugan_token", res.token);

      return userData;
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.register(data);
      return res;
    } catch (err) {
      setError(err.message || "Đăng ký thất bại");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async ({ currentPassword, newPassword }) => {
    if (!user?.email) throw new Error("Vui lòng đăng nhập lại!");
    setLoading(true);
    setError(null);
    try {
      return await authApi.changePassword({
        email: user.email,
        currentPassword,
        newPassword,
      });
    } catch (err) {
      setError(err.message || "Đổi mật khẩu thất bại");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    const currentToken = token;
    setUser(null);
    setToken(null);
    localStorage.removeItem("hugan_user");
    localStorage.removeItem("hugan_token");
    if (currentToken) {
      authApi.logout(currentToken).catch((logoutError) => {
        console.error("Không thể giải phóng phiên đăng nhập:", logoutError);
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        changePassword,
        logout,
        isAdmin: user?.role === "ADMIN",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
