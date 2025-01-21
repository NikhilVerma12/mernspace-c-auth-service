import { Response, NextFunction } from "express";
import { RegisterUserRequest } from "../types";
import { UserService } from "../services/UserService";
import { Logger } from "winston";
import { validationResult } from "express-validator";

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
      const user = await this.userService.create({
        firstName,
        lastName,
        email,
        password,
      });

      this.logger.info("User has been registered", { id: user });
      res.status(201).json({ id: user });
    } catch (err) {
      // Forward error to error-handling middleware
      next(err);
    }
  }
}
