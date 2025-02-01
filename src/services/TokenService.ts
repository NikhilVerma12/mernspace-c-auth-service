import { JwtPayload, sign } from "jsonwebtoken";
import fs from "fs";
import path from "path";
import createHttpError from "http-errors";
import { RefreshToken } from "../entity/RefreshToken";
import { User } from "../entity/User";
import { Repository } from "typeorm";

export class TokenService {
  constructor(private refreshTokenRepository: Repository<RefreshToken>) {}
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
  async persistRefreshToken(user: User) {
    const MS_IN_YEAR = 1000 * 60 * 60 * 24 * 365; // 1Y -> (Leap year)

    return await this.refreshTokenRepository.save({
      user: user,
      expiresAt: new Date(Date.now() + MS_IN_YEAR),
    });
  }
}
