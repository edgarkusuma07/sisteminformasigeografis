import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setError("");
  };

  const validateForm = () => {
    if (isLogin) {
      if (!formData.email || !formData.password) {
        setError("Email dan password harus diisi");
        return false;
      }
    } else {
      if (
        !formData.name ||
        !formData.email ||
        !formData.password 
      ) {
        setError("Semua kolom harus diisi");
        return false;
      }
      if (formData.password.length < 6) {
        setError("Password minimal 6 karakter");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        // === LOGIN ===
        const response = await fetch("https://gisapis.manpits.xyz/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (response.ok && data.meta?.token) {
          localStorage.setItem("token", data.meta.token);
          localStorage.setItem("isAuthenticated", "true");
          localStorage.setItem(
            "user",
            JSON.stringify({ email: formData.email })
          );
          navigate("/home");
        } else {
          setError(
            data.meta?.message || "Login gagal. Cek email dan password."
          );
        }
      } else {
        // === REGISTER ===
        const registerResponse = await fetch(
          "https://gisapis.manpits.xyz/api/register",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: formData.name,
              email: formData.email,
              password: formData.password,
            }),
          }
        );

        const registerData = await registerResponse.json();

        if (
          registerResponse.ok &&
          registerData.meta?.message === "Successfully registered"
        ) {
          // Setelah register berhasil, langsung login
          const loginResponse = await fetch(
            "https://gisapis.manpits.xyz/api/login",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: formData.email,
                password: formData.password,
              }),
            }
          );

          const loginData = await loginResponse.json();

          if (loginResponse.ok && loginData.meta?.token) {
            localStorage.setItem("token", loginData.meta.token);
            localStorage.setItem("isAuthenticated", "true");
            localStorage.setItem(
              "user",
              JSON.stringify({ email: formData.email })
            );
            navigate("/home");
          } else {
            setError("Registrasi berhasil, tapi login otomatis gagal.");
          }
        } else {
          setError(registerData.meta?.message || "Registrasi gagal.");
        }
      }
    } catch (err) {
      setError("Terjadi kesalahan jaringan. Silakan coba lagi.");
      console.error("Auth error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className={`auth-card ${isLogin ? "login" : "register"}`}>
        <div className="auth-header">
          <h2>{isLogin ? "Login" : "Register"}</h2>
          <p>Sistem Informasi Geografis</p>
        </div>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Nama</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Masukkan nama lengkap"
                disabled={loading}
              />
            </div>
          )}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Masukkan email"
              disabled={loading}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Masukkan password"
              disabled={loading}
              required
            />
          </div>
          {/* {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Konfirmasi Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Konfirmasi password"
                disabled={loading}
                required
              />
            </div>
          )} */}
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Loading..." : isLogin ? "Login" : "Register"}
          </button>
        </form>
        <div className="auth-toggle">
          <p>
            {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}
            <span
              onClick={!loading ? toggleForm : undefined}
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {isLogin ? " Register" : " Login"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
