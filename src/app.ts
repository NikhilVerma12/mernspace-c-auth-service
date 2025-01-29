import "reflect-metadata";
import logger from "./config/logger";
import morgan from "morgan";
import authRouter from "./routes/auth";
import express, { Express, NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";

const app: Express = express();

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
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.message);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

export default app;
