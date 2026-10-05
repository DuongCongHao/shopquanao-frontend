import React, { useState } from "react";
import { CheckCircle2, KeyRound, Lock, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const ChangePasswordDialog = ({ onClose }) => {
  const { changePassword, loading } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    if (newPassword !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp!");
      return;
    }
    try {
      await changePassword({ currentPassword, newPassword });
      setIsSaved(true);
    } catch (error) {
      setErrorMessage(error.message || "Đổi mật khẩu thất bại!");
    }
  };

  return (
    <div
      className="password-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="password-dialog" role="dialog" aria-modal="true" aria-labelledby="password-dialog-title">
        <div className="password-dialog-heading">
          <div className="password-dialog-icon"><KeyRound size={19} /></div>
          <h2 id="password-dialog-title">Đổi mật khẩu</h2>
          <button className="password-dialog-close" onClick={onClose} aria-label="Đóng">
            <X size={19} />
          </button>
        </div>

        {isSaved ? (
          <div className="password-dialog-success">
            <CheckCircle2 size={22} />
            <p>Đổi mật khẩu thành công.</p>
            <button className="password-dialog-submit" onClick={onClose}>Đóng</button>
          </div>
        ) : (
          <form className="password-dialog-form" onSubmit={handleSubmit}>
            <label>
              <span>Mật khẩu hiện tại</span>
              <div><Lock size={16} /><input autoComplete="current-password" type="password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></div>
            </label>
            <label>
              <span>Mật khẩu mới</span>
              <div><Lock size={16} /><input autoComplete="new-password" type="password" minLength={6} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></div>
            </label>
            <label>
              <span>Xác nhận mật khẩu mới</span>
              <div><Lock size={16} /><input autoComplete="new-password" type="password" minLength={6} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></div>
            </label>
            {errorMessage && <p className="password-dialog-error" role="alert">{errorMessage}</p>}
            <button className="password-dialog-submit" type="submit" disabled={loading}>
              {loading ? "Đang lưu..." : "Lưu mật khẩu mới"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
};