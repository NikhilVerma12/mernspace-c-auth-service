import "reflect-metadata";
import logger from "./config/logger";
import morgan from "morgan";
import authRouter from "./routes/auth";
import express, { Express, Request, Response } from "express";
import createHttpError from "http-errors";
import cookieParser from "cookie-parser";

const app: Express = express();

app.use(cookieParser());

app.use(express.json());

// Add middleware
app.use(morgan("dev"));

// Routes
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// Auth routes
app.use("/auth", authRouter);

// 404 Handler (Returns JSON Instead of Plain Text)
app.use((req, res, next) => {
  logger.error(`Invalid request: ${req.originalUrl}`);
  next(createHttpError(404, "Invalid request"));
});

// ✅ Error Handling Middleware (Fixes JSON Response Issue)
interface CustomError extends Error {
  status?: number;
}
app.use((err: CustomError, req: Request, res: Response) => {
  const statusCode = err.status ?? 500; // Use optional chaining
  const message = err.message || "Internal Server Error";
  logger.error(`[${req.method}] ${req.url} - ${message}`);
  res.status(statusCode).json({
    error: message,
  });
});
export default app;
