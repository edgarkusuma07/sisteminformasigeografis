import jwt from "jsonwebtoken";
import { createAccessToken, serializeBigInt } from "../lib.js";

const authUser = (req, res) => {
  console.log({ message: "log pertama", cookies: req.cookies });

  const accessToken = req.cookies["accessToken"];
  const refreshToken = req.cookies["refreshToken"];

  if (!accessToken && !refreshToken) {
    return res.status(401).json({ success: false, error: "Access Denied. No token provided" });
  }
  try {
    const decodeAccessToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SIGNATURE);
    // console.log({ message: "log decodeAccessToken", decodeAccessToken });
    return res.status(200).json({ message: "User verifies", user: decodeAccessToken });
  } catch (e) {
    if (!accessToken) {
      console.log("No access token provided!");
    }

    try {
      const decodeRefreshToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SIGNATURE);

      const payload = {
        id: decodeRefreshToken.id,
        name: decodeRefreshToken.name,
        email: decodeRefreshToken.email,
        nim: decodeRefreshToken.nim.toString(),
      };

      const accessToken = createAccessToken(payload);

      res.cookie("accessToken", accessToken, {
        secure: true,
        httpOnly: false,
        sameSite: "lax",
        expires: new Date(Date.now() + 15 * 60 * 1000),
      });

      return res.status(200).json({
        message: "User Verifies",
        user: decodeRefreshToken,
      });
    } catch (e) {
      console.log(e);
    }
  }
};

export default authUser;
