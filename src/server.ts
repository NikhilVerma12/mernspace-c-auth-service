import { Config } from "./config";
import app from "./app";
import logger from "./config/logger";
import { AppDataSource } from "./config/data-source";

const startServer = async () => {
  const PORT = Config.PORT || 3000; // Default port fallback
  try {
    await AppDataSource.initialize();
    logger.info("Database Connected Successfully...");
    app.listen(PORT, () => {
      logger.info(`Listening on port ${PORT}`);
    });
  } catch (e) {
    logger.error("Error starting the server:", e);
    process.exit(1);
  }
};
startServer().catch((err) => {
  console.error("Error while starting the server:", err);
  process.exit(1);
});
