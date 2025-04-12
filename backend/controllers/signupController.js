import bcrypt from "bcryptjs";
import prisma from "../prisma/prisma.js";
import { serializeBigInt } from "../lib.js";

const signupController = async (req, res) => {
  const { name, email, password, nim } = req.body;

  if (!email || !password || !name || !nim) {
    return res.status(400).json({ error: "Semua field harus diisi" });
  }

  try {
    const existingEmail = await prisma.users.findUnique({
      where: {
        email,
      },
    });

    if (existingEmail) {
      return res.status(400).json({ error: "Email sudah terdaftar" });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
        nim: BigInt(nim),
      },
    });

    res.json({ message: "User created", user: serializeBigInt(result) });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export default signupController;
