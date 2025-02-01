import { JwtPayload, sign } from "jsonwebtoken";
import fs from "fs";
import path from "path";
import createHttpError from "http-errors";

export class TokenService {
  tokenPrivateKey(): Buffer | string {
    try {
      return fs.readFileSync(
        path.join(__dirname, "../../certs/private.pem"),
        "utf8", // Read as a string
      );
    } catch (e) {
      console.error("Error reading private key:", e);
      throw createHttpError(500, "Couldn't read private key");
    }
  }
  generateAccessToken(payload: JwtPayload) {
    return sign(payload, this.tokenPrivateKey(), {
      algorithm: "RS256",
      expiresIn: "1h",
      issuer: "auth-service",
    });
  }
  generateRefreshToken(payload: JwtPayload) {
    return sign(payload, this.tokenPrivateKey(), {
      // Token Should come from .env file Config.REFRESH_TOKEN_SECRET!
      algorithm: "RS256",
      expiresIn: "1y",
      issuer: "auth-service",
      jwtid: String(payload.id),
    });
  }
}
