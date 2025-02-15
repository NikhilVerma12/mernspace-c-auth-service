import { Response, NextFunction, Request } from "express";
import { RegisterUserRequest } from "../types";
import { UserService } from "../services/UserService";
import { Logger } from "winston";
import { validationResult } from "express-validator";
import { JwtPayload } from "jsonwebtoken";
import { Roles } from "../constants";
import { TokenService } from "../services/TokenService";
import createHttpError from "http-errors";
import { CredentialService } from "../services/CredentialService";

export class AuthController {
  constructor(
    private userService: UserService,
    private logger: Logger,
    private tokenService: TokenService,
    private credentialService: CredentialService,
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
      const payload: JwtPayload = {
        sub: String(user.id),
        role: user.role,
      };
      const newRefreshToken = await this.tokenService.persistRefreshToken(user);
      const refreshToken = this.tokenService.generateRefreshToken({
        ...payload,
        id: String(newRefreshToken.id),
      });
      res.cookie(
        "accessToken",
        this.tokenService.generateAccessToken(payload),
        {
          domain: "localhost",
          sameSite: "strict",
          maxAge: 1000 * 60 * 60, // 1h
          httpOnly: true,
        },
      );
      res.cookie("refreshToken", refreshToken, {
        domain: "localhost",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24 * 365, // 1h
        httpOnly: true,
      });
      // console.log(this.tokenService.generateAccessToken(payload));
      res.status(201).json({ id: user.id });
    } catch (err) {
      next(err);
    }
  }
  async login(req: RegisterUserRequest, res: Response, next: NextFunction) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({ errors: result.array() });
    }
    const { email, password } = req.body;
    this.logger.debug("New request to login a user", {
      email,
      password: "********************", // Mask sensitive information
    });
    try {
      // Check if username (email) exists in database
      // Compare password
      // Generate tokens
      // Add tokens to Cokkies
      // Return the response (id)

      const user = await this.userService.findByEmail(email);
      if (!user) {
        const error = createHttpError(400, "Email or password does not match");
        return next(error);
      }
      const passwordMatch = await this.credentialService.comparePassword(
        password,
        user.password,
      );
      if (!passwordMatch) {
        const error = createHttpError(400, "Email or password does not match");
        return next(error);
      }
      const payload: JwtPayload = {
        sub: String(user.id),
        role: user.id,
      };
      const newRefreshToken = await this.tokenService.persistRefreshToken(user);
      const refreshToken = this.tokenService.generateRefreshToken({
        ...payload,
        id: String(newRefreshToken.id),
      });
      res.cookie(
        "accessToken",
        this.tokenService.generateAccessToken(payload),
        {
          domain: "localhost",
          sameSite: "strict",
          maxAge: 1000 * 60 * 60, // 1h
          httpOnly: true,
        },
      );
      res.cookie("refreshToken", refreshToken, {
        domain: "localhost",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24 * 365, // 1h
        httpOnly: true,
      });
      this.logger.info("User has been logged in", { id: user.id });
      res.status(200).json({ id: user.id });
    } catch (err) {
      next(err);
    }
  }
  async self(req: Request, res: Response) {
    res.json({});
  }
}
