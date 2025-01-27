import fs from "fs";
import path from "path";
import { Response, NextFunction } from "express";
import { RegisterUserRequest } from "../types";
import { UserService } from "../services/UserService";
import { Logger } from "winston";
import { validationResult } from "express-validator";
import { JwtPayload, sign } from "jsonwebtoken";
import createHttpError from "http-errors";
import { User } from "../entity/User";

export class AuthController {
  constructor(
    private userService: UserService,
    private logger: Logger,
  ) {}

  async register(
    req: RegisterUserRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const { firstName, lastName, email, password } = req.body;
    const result = validationResult(req);
    if (!result.isEmpty()) {
      res.status(400).json({ errors: result.array() });
    }
    this.logger.debug("New request to register a user", {
      firstName,
      lastName,
      email,
      password: "********************", // Mask sensitive information
    });

    try {
      // Create a new user
      const user: User = await this.userService.create({
        firstName,
        lastName,
        email,
        password,
      });

      this.logger.info("User has been registered", { id: user });
      let privateKey: Buffer;
      try {
        privateKey = fs.readFileSync(
          path.join(__dirname, "../../certs/private.pem"),
        );
      } catch (e) {
        console.error(e);
        const err = createHttpError(500, "Couldn't read private key");
        next(err);
        return;
      }
      const payload: JwtPayload = {
        sub: String(user.id),
        role: user.role,
      };
      const accessToken = sign(payload, privateKey, {
        algorithm: "RS256",
        expiresIn: "1h",
        issuer: "auth-service",
      });
      const refreshToken = "ueifhu4fbnufviuer";
      res.cookie("accessToken", accessToken, {
        domain: "localhost",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60, // 1h
        httpOnly: true,
      });
      res.cookie("refreshToken", refreshToken, {
        domain: "localhost",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24 * 365, // 1h
        httpOnly: true,
      });
      res.status(201).json({ id: user });
    } catch (err) {
      // Forward error to error-handling middleware
      next(err);
    }
  }
}
