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
  const [sessionNotice, setSessionNotice] = useState("");

  useEffect(() => {
    if (!token) return undefined;

    let active = true;
    const heartbeat = async () => {
      try {
        await authApi.heartbeat(token);
      } catch (heartbeatError) {
        console.error("Phiên đăng nhập không còn hoạt động:", heartbeatError);
        if (active && heartbeatError.status === 401) {
          const wasReplaced = heartbeatError.message?.includes(
            "Tài khoản đang được đăng nhập ở nơi khác"
          );
          setUser(null);
          setToken(null);
          if (localStorage.getItem("hugan_token") === token) {
            localStorage.removeItem("hugan_user");
            localStorage.removeItem("hugan_token");
          }
          if (wasReplaced) {
            setSessionNotice("Tài khoản đang được đăng nhập ở nơi khác. Bạn đã được đăng xuất.");
          }
        }
      }
    };

    heartbeat();
    const intervalId = window.setInterval(heartbeat, 5_000);
    const onFocus = () => heartbeat();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;
    const handleStorage = (event) => {
      if (
        event.key !== "hugan_token" ||
        !event.newValue ||
        event.newValue === token ||
        (event.oldValue && event.oldValue !== token)
      ) {
        return;
      }

      setUser(null);
      setToken(null);
      setSessionNotice("Tài khoản đang được đăng nhập ở nơi khác. Bạn đã được đăng xuất.");
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [token]);

  useEffect(() => {
    if (!sessionNotice) return undefined;
    const timeoutId = window.setTimeout(() => setSessionNotice(""), 4500);
    return () => window.clearTimeout(timeoutId);
  }, [sessionNotice]);

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
    if (localStorage.getItem("hugan_token") === currentToken) {
      localStorage.removeItem("hugan_user");
      localStorage.removeItem("hugan_token");
    }
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
        sessionNotice,
      }}
    >
      {children}
      {sessionNotice && (
        <div className="session-takeover-notice" role="status" aria-live="polite">
          {sessionNotice}
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
