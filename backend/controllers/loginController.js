import bcrypt from "bcryptjs";
import { createAccessToken, createRefreshToken } from "../lib.js";
import prisma from "../prisma/prisma.js";

const loginController = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Semua field harus diisi" });
  }

  try {
    const user = await prisma.users.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Email not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user?.password);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const payload = {
      id: user?.id,
      name: user?.name,
      email: user?.email,
      nim: user?.nim?.toString(),
    };

    const accessToken = createAccessToken(payload);
    const refreshToken = createRefreshToken(payload);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 hari
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      expires: new Date(Date.now() + 15 * 60 * 1000), // 15 menit
    });

    return res.json({
      message: "Login success",
      user: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        nim: user?.nim.toString(),
      },
      accessToken: accessToken,
    });
  } catch (e) {
    console.error("Login error:", e);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export default loginController;
