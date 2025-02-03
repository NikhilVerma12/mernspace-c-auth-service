import request from "supertest";
import app from "../../src/app";
import { User } from "../../src/entity/User";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";

describe("POST /auth/login", () => {
  let connection: DataSource;

  beforeAll(async () => {
    connection = await AppDataSource.initialize();
  });

  beforeEach(async () => {
    // Ensure complete cleanup before each test
    await connection.dropDatabase();
    await connection.synchronize();
  });

  afterAll(async () => {
    await connection.destroy();
  });
  describe("Login Endpoint Tests", () => {
    it.skip("should login the user", async () => {
      // Arrange: Define the test user data
      const userData = {
        firstName: "nikhil",
        lastName: "verma",
        email: "nikk@gmail.com",
        password: "password123",
      };
      // Act: Register user
      await request(app).post("/auth/register").send(userData).expect(201);
      const userRepository = connection.getRepository(User);
      const user = await userRepository.findOne({
        where: { email: userData.email },
      });
      //Validate: Checking user exists in DB
      expect(user).toBeDefined();
      expect(user?.email).toBe(userData.email);
      //Assert: Login with the same user credentials
      const loginResponse = await request(app).post("/auth/login").send({
        email: userData.email,
        password: userData.password,
      });
      //Act: Check if login was successful!
      expect(loginResponse.statusCode).toBe(200);
      expect(loginResponse.body).toHaveProperty("token");
    });
  });
});
