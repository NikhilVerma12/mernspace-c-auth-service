import { config } from "dotenv";
config();

const { PORT, NODE_ENV } = process.env || 5501;

export const Config = {
  PORT,
  NODE_ENV,
};
