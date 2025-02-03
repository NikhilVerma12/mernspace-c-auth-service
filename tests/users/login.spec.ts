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
    // ✅ Fix: Ensure proper cleanup before each test
    await connection.dropDatabase();
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Ensures DB cleanup is fully completed
    await connection.synchronize(); // If using migrations, replace with runMigrations()
    // await connection.runMigrations(); // Alternative fix
  });

  afterAll(async () => {
    await connection.destroy();
  });

  describe("Login Endpoint Tests", () => {
    it("should login the user", async () => {
      // Arrange: Create a user before login
      const userData = {
        firstName: "Nikhil",
        lastName: "Verma",
        email: "nikk@gmail.com",
        password: "password123",
      };

      // ✅ Fix: Ensure user registration completes
      const registerResponse = await request(app)
        .post("/auth/register")
        .send(userData);

      expect(registerResponse.statusCode).toBe(201); // Ensure user is created

      // ✅ Fix: Ensure DB has committed the user before querying
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Fetch the user from the database
      const userRepository = connection.getRepository(User);
      const user = await userRepository.findOne({
        where: { email: userData.email },
      });

      // Debug: Check if user is saved
      console.log("User created in DB:", user);

      // Ensure the user is actually saved in DB before login
      expect(user).not.toBeNull();
      expect(user?.email).toBe(userData.email);

      // ✅ Fix: Ensure user password is hashed correctly before login
      expect(user?.password).not.toBe(userData.password); // It should be hashed

      // Act: Attempt login
      const loginResponse = await request(app).post("/auth/login").send({
        email: userData.email,
        password: userData.password, // Ensure this matches the registered password
      });

      // Debugging output
      console.log("Login response:", loginResponse.body);

      // ✅ Fix: Expect successful login
      expect(loginResponse.statusCode).toBe(201);
      expect(loginResponse.body).toHaveProperty("id");
    });
  });
});
