import { Config } from "./config";
import app from "./app";
import logger from "./config/logger";

const startServer = () => {
  const PORT = Config.PORT;
  try {
    app.listen(PORT, () => {
      logger.info("Listening on port", { port: PORT });
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};
startServer();
