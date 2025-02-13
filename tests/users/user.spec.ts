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
    try {
      jwks = createJWKSMock("http://localhost:5501");
      connection = await AppDataSource.initialize();
      console.log("Database connection initialized");
    } catch (error) {
      console.error("Database connection failed:", error);
    }
  });

  beforeEach(async () => {
    jwks.start();

    if (!connection) {
      throw new Error("Database connection is not initialized.");
    }

    await connection.dropDatabase();
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Ensure DB cleanup completes
    await connection.runMigrations();
  });
  afterEach(() => {
    jwks.stop();
  });
  afterAll(async () => {
    if (connection) {
      await connection.destroy();
      console.log("Database connection closed");
    } else {
      console.warn("No database connection to destroy");
    }
  });

  describe("Login Endpoint Tests", () => {
    it("should return the 200 status code", async () => {
      const accessToken = jwks.token({
        sub: "1",
        role: "CUSTOMER",
      });

      console.log("Generated Token:", accessToken); // ✅ Check if token is valid
      console.log("Sending Request with Headers:", {
        Cookie: `accessToken=${accessToken}`,
      });
      const response = await request(app)
        .get("/auth/self")
        .set("Cookie", [`accessToken=${accessToken};`])
        .send();

      console.log("Response Body:", response.body);
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
