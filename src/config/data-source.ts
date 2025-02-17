import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../entity/User";
import { Config } from "./index";
import { RefreshToken } from "../entity/RefreshToken";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: Config.DB_HOST,
  port: Number(Config.DB_PORT),
  username: Config.DB_USERNAME,
  password: Config.DB_PASSWORD,
  database: Config.DB_NAME,
  synchronize: true, //always keep it false in Production
  logging: false,
  entities: [User, RefreshToken], //Register Entities
  migrations: [],
  subscribers: [],
});
