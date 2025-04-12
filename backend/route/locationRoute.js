import express from "express";
import {
  createLocationController,
  getAllLocationController,
} from "../controllers/locationController.js";

const router = express.Router();

router.get("/locations", getAllLocationController);
router.post("/locations", createLocationController);

export default router;
