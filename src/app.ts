import "reflect-metadata";
import logger from "./config/logger";
import morgan from "morgan";
import authRouter from "./routes/auth";
import express, { Express, NextFunction, Request, Response } from "express";

const app: Express = express();

app.use(express.json());

// Add middleware
app.use(morgan("dev")); // 'dev' gives concise colorful output in the terminal

// Routes
app.get("/", (req, res) => {
  res.send("Hello, World!");
});
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.get("origin"); // or req.headers.origin
  console.log("Request origin:", origin);
  next();
});
// Auth routes
app.use("/auth", authRouter);

app.use((req, res) => {
  logger.error(`Invalid request: ${req.originalUrl}`);
  res.status(404).send("Invalid request");
});

export default app;
