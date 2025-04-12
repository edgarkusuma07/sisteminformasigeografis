import jwt from "jsonwebtoken";

export function serializeBigInt(obj) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) => (typeof value === "bigint" ? value.toString() : value))
  );
}

export const createAccessToken = (payload) => {
  const token = jwt.sign(payload, `${process.env.ACCESS_TOKEN_SIGNATURE}`, {
    expiresIn: "15m",
    algorithm: "HS256",
    issuer: "rangga sutha",
  });

  return token;
};

export const createRefreshToken = (payload) => {
  const token = jwt.sign(payload, `${process.env.REFRESH_TOKEN_SIGNATURE}`, {
    expiresIn: "1d",
    algorithm: "HS256",
    issuer: "rangga sutha",
  });

  return token;
};
