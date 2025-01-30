import fs from "fs";
import path from "path";
import { Response, NextFunction } from "express";
import { RegisterUserRequest } from "../types";
import { UserService } from "../services/UserService";
import { Logger } from "winston";
import { validationResult } from "express-validator";
import { JwtPayload, sign } from "jsonwebtoken";
import createHttpError from "http-errors";
import { Roles } from "../constants";
import { Config } from "../config";

export class AuthController {
  constructor(
    private userService: UserService,
    private logger: Logger,
  ) {}

  async register(req: RegisterUserRequest, res: Response, next: NextFunction) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }
    const { firstName, lastName, email, password } = req.body;
    this.logger.debug("New request to register a user", {
      firstName,
      lastName,
      email,
      password: "********************", // Mask sensitive information
    });
    try {
      // Create a new user
      const user = await this.userService.create({
        firstName,
        lastName,
        email,
        password,
        role: Roles.CUSTOMER,
      });
      this.logger.info("User has been registered", { id: user.id });
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
      const refreshToken = sign(payload, privateKey, {
        algorithm: "RS256",
        expiresIn: "1y",
        issuer: "auth-service",
      });
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
      console.log(accessToken);
      res.status(201).json({ id: user.id });
    } catch (err) {
      next(err);
    }
  }
}
