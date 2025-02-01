import express, {
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";
import { AuthController } from "../controllers/AuthController";
import { UserService } from "../services/UserService";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/User";
import logger from "../config/logger";
import registerValidators from "../validators/register-validators";
import { TokenService } from "../services/TokenService";
import { RefreshToken } from "../entity/RefreshToken";

const router = express.Router();
const userRepository = AppDataSource.getRepository(User);
const userService = new UserService(userRepository);
const userRefreshTokenRepository = AppDataSource.getRepository(RefreshToken);
const useTokenService = new TokenService(userRefreshTokenRepository);
const authController = new AuthController(userService, logger, useTokenService);

router.post("/register", registerValidators, (async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  await authController.register(req, res, next);
}) as RequestHandler);
export default router;
