import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import createJWKSMock from "mock-jwks";
import { User } from "../../src/entity/User";
import { Roles } from "../../src/constants";

describe("GET /auth/self", () => {
  let connection: DataSource;
  let jwks: ReturnType<typeof createJWKSMock>;

  beforeAll(async () => {
    jwks = createJWKSMock("http://localhost:5501");
    connection = await AppDataSource.initialize();
  });

  beforeEach(async () => {
    jwks.start();
    // ✅ Fix: Ensure proper cleanup before each test
    await connection.dropDatabase();
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Ensures DB cleanup is fully completed
    await connection.synchronize(); // If using migrations, replace with runMigrations()
    // await connection.runMigrations(); // Alternative fix
  });
  afterEach(() => {
    jwks.stop();
  });
  afterAll(async () => {
    await connection.destroy();
  });

  describe("Login Endpoint Tests", () => {
    it("should return the 200 status code", async () => {
      const accessToken = jwks.token({
        sub: "1",
        role: Roles.CUSTOMER,
      });
      const response = await request(app)
        .get("/auth/self")
        .set("Cookie", [`accessToken=${accessToken}`])
        .send();
      expect(response.statusCode).toBe(200);
    });
    it("should return the user data", async () => {
      const userData = {
        firstName: "Nikhil",
        lastName: "Verma",
        email: "nikhil@gmail.com",
        password: "password",
      };
      // Register user
      const userRepository = connection.getRepository(User);
      const data = await userRepository.save({
        ...userData,
        role: Roles.CUSTOMER,
      });
      // Generate token
      const accessToken = jwks.token({
        sub: String(data.id),
        role: data.role,
      });
      // Add token to cookie
      const response = await request(app)
        .get("/auth/self")
        .set("Cookie", [`accessToken=${accessToken}`]);
      // Assert
      // Check if user id matches with registered user
      expect((response.body as Record<string, string>).id).toBe(data.id);
    });
  });
});
