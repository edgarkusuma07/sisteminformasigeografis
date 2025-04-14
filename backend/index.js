import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import loginRoute from "./route/loginRoute.js";
import locationRoute from "./route/locationRoute.js";

dotenv.config();

const app = express();
const PORT = 2244;

const corsOption = {
  origin: [
    "https://gis_2205551144.manpits.xyz",
    "http://192.168.4.4",
    "http://localhost:3000",
    "http://192.168.4.4:2244",
  ],
  credentials: true,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOption));
app.use(express.json());
app.use(cookieParser());

app.listen(PORT, () => {
  console.log(`server running on http://localhost:${PORT} 💚`);
});

app.get("/", (req, res) => {
  res.send({
    message: "Welcome to GIS API | 2205551144 🚀",
    endpoint: {
      locations: "http://localhost/api/locations",
      login: "http://localhost/api/login",
    },
  });
});
app.use("/api", loginRoute);
app.use("/api", locationRoute);
