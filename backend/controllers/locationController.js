import prisma from "../prisma/prisma.js";

export const getAllLocationController = async (req, res) => {
  try {
    const locations = await prisma.locations.findMany();
    res.json({ message: "Sukses mengambil lokasi", locations: locations });
  } catch (e) {
    console.error("❌ Gagal mengambil lokasi:", e);
    res.status(500).json({ error: "Gagal mengambil lokasi" });
  }
};

export const createLocationController = async (req, res) => {
  const { latitude, longitude, pointX, pointY, location_name, description } = req.body;

  if (!latitude || !longitude || !location_name || !description) {
    return res.status(400).json({ error: "Semua field harus diisi" });
  }

  try {
    const location = await prisma.locations.create({
      data: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        location_name,
        description,
      },
    });

    return res.status(201).json({ message: "Lokasi berhasil disimpan", location: location });
  } catch (e) {
    console.error("❌ Gagal menyimpan lokasi:", e);
    return res.status(500).json({ error: e, message: "Gagal menyimpan lokasi" });
  }
};
