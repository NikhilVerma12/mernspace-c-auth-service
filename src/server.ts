import { Config } from "./config";
import app from "./app";

const startServer = () => {
  const PORT = Config.PORT;
  try {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (e) {
    console.error(e);
  }
};
startServer();
