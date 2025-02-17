import request from "supertest";
import app from "../../src/app";
import { User } from "../../src/entity/User";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { Roles } from "../../src/constants";
import { isJwt } from "../utils";
import { RefreshToken } from "../../src/entity/RefreshToken";

describe("POST /auth/register", () => {
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

  describe("Given all fields", () => {
    it("should return the 201 status code", async () => {
      // Arrange
      const userData = {
        firstName: "Nikhil",
        lastName: "Verma",
        email: "nikhil@gmail.com",
        password: "password",
      };
      // Act
      const response = await request(app).post("/auth/register").send(userData);
      // Assert
      expect(response.statusCode).toBe(201);
    });

    it("should return valid json response", async () => {
      const userData = {
        firstName: "nikk",
        lastName: "verma",
        email: "john.doe@axc.com",
        password: "@axcr685rc34",
      };

      const response = await request(app).post("/auth/register").send(userData);

      expect(
        (response.headers as Record<string, string>)["content-type"],
      ).toEqual(expect.stringContaining("json"));
    });

    it("should persist the user in the database", async () => {
      const userData = {
        firstName: "nikhil",
        lastName: "verma",
        email: "john.doe@example.com",
        password: "password123",
      };

      await request(app).post("/auth/register").send(userData);

      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      expect(users).toHaveLength(1);
      expect(users[0].firstName).toBe(userData.firstName);
      expect(users[0].lastName).toBe(userData.lastName);
      expect(users[0].email).toBe(userData.email);
    });
    it("Should assign a customer role", async () => {
      // Arrange
      const userData = {
        firstName: "nikhil",
        lastName: "verma",
        email: "john.doe@example.com",
        password: "password123",
      };
      // Act
      await request(app).post("/auth/register").send(userData);

      // Assert
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      // Check that at least one user exists
      expect(users.length).toBeGreaterThan(0);

      // Check the first user has the "role" property and its value is "customer"
      expect(users[0]).toHaveProperty("role");
      expect(users[0].role).toBe(Roles.CUSTOMER);
    });
    it("should store hashed password in the database", async () => {
      // Arrange
      const userData = {
        firstName: "nikhil",
        lastName: "verma",
        email: "john.doe@example.com",
        password: "password123",
      };
      // Act
      await request(app).post("/auth/register").send(userData);
      // Assert
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      expect(users[0].password).not.toBe(userData.password);
      expect(users[0].password).toHaveLength(60);
      expect(users[0].password).toMatch(/^\$2b\$\d+\$/); // (/^\$2b\$\d+\$/) regex checking the hashed password starting code ($2b$10$)
    });
    it("should return 400 status code when email is already exists", async () => {
      // Arrange
      const userData = {
        firstName: "nikhil",
        lastName: "verma",
        email: "john.doe@example.com",
        password: "password123",
      };
      const userRepository = connection.getRepository(User);
      await userRepository.save({ ...userData, role: Roles.CUSTOMER });
      // Act
      const response = await request(app).post("/auth/register").send(userData);
      const users = await userRepository.find();
      //Assert
      expect(response.statusCode).toBe(400);
      expect(users).toHaveLength(1);
    });
    it("should return 400 access token and refresh token inside a cookie", async () => {
      // Arrange
      const userData = {
        firstName: "nikhil",
        lastName: "verma",
        email: "john.doe@example.com",
        password: "password123",
      };
      // Act
      const response = await request(app).post("/auth/register").send(userData);
      //Assert
      interface Headers {
        "set-cookie": string[];
      }
      let accessToken = null;
      let refreshToken = null;
      const cookies =
        (response.headers as unknown as Headers)["set-cookie"] || [];
      // accessToken=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjkzOTA5Mjc2LCJleHAiOjE2OTM5MDkzMzYsImlzcyI6Im1lcm5zcGFjZSJ9.KetQMEzY36vxhO6WKwSR-P_feRU1yI-nJtp6RhCEZQTPlQlmVsNTP7mO-qfCdBr0gszxHi9Jd1mqf-hGhfiK8BRA_Zy2CH9xpPTBud_luqLMvfPiz3gYR24jPjDxfZJscdhE_AIL6Uv2fxCKvLba17X0WbefJSy4rtx3ZyLkbnnbelIqu5J5_7lz4aIkHjt-rb_sBaoQ0l8wE5KzyDNy7mGUf7cI_yR8D8VlO7x9llbhvCHF8ts6YSBRBt_e2Mjg5txtfBaDq5auCTXQ2lmnJtMb75t1nAFu8KwQPrDYmwtGZDkHUcpQhlP7R-y3H99YnrWpXbP8Zr_oO67hWnoCSw; Max-Age=43200; Domain=localhost; Path=/; Expires=Tue, 05 Sep 2023 22:21:16 GMT; HttpOnly; SameSite=Strict
      cookies.forEach((cookie) => {
        if (cookie.startsWith("accessToken=")) {
          accessToken = cookie.split(";")[0].split("=")[1];
        }

        if (cookie.startsWith("refreshToken=")) {
          refreshToken = cookie.split(";")[0].split("=")[1];
        }
      });
      // console.log(accessToken, refreshToken);
      expect(accessToken).not.toBeNull();
      expect(refreshToken).not.toBeNull();

      expect(isJwt(accessToken)).toBeTruthy();
      expect(isJwt(refreshToken)).toBeTruthy();
    });
    it("should store the refresh token in the database", async () => {
      //Arrange
      const userData = {
        firstName: "nikhil",
        lastName: "verma",
        email: "john.doe@example.com",
        password: "password123",
      };
      //Act
      const response = await request(app).post("/auth/register").send(userData);
      // Assert
      const refreshTokenRepo = connection.getRepository(RefreshToken);
      // const useRefreshTokenRepo = await refreshTokenRepo.find();
      // expect(useRefreshTokenRepo[0].id).toBe()
      const tokens = await refreshTokenRepo
        .createQueryBuilder("refreshToken")
        .where("refreshToken.userId = :userId", {
          userId: (response.body as Record<string, string>).id,
        })
        .getMany();
      expect(tokens).toHaveLength(1);
    });
  });
  // it("should return an id of created user", async () => {});
  describe("Fields are missing", () => {
    it("should return 400 status code if email field is missing", async () => {
      // Arrange
      const userData = {
        firstName: "nikhil",
        lastName: "verma",
        email: "",
        password: "password123",
      };
      // Act
      const response = await request(app).post("/auth/register").send(userData);
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      //Assert
      expect(response.statusCode).toBe(400);
      expect(users).toHaveLength(0);
    });
    it("should return 400 status code if firstName is missing", async () => {
      // Arrange
      const userData = {
        firstName: "",
        lastName: "K",
        email: "rakesh@mern.space",
        password: "password",
      };
      // Act
      const response = await request(app).post("/auth/register").send(userData);

      // Assert
      expect(response.statusCode).toBe(400);
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      expect(users).toHaveLength(0);
    });
    it("should return 400 status code if lastName field is missing", async () => {
      // Arrange
      const userData = {
        firstName: "John",
        lastName: "",
        email: "john@example.com",
        password: "password123",
      };
      //Act
      const response = await request(app).post("/auth/register").send(userData);
      // Assert
      expect(response.statusCode).toBe(400);
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      expect(users).toHaveLength(0);
    });
    it("should return 400 status code if password field is missing", async () => {
      // Arrange
      const userData = {
        firstName: "John",
        lastName: "aston",
        email: "john@example.com",
        password: "",
      };
      //Act
      const response = await request(app).post("/auth/register").send(userData);
      // Assert
      expect(response.statusCode).toBe(400);
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      expect(users).toHaveLength(0);
    });
  });
  describe("Fields are not in proper format", () => {
    it("should trim the email field", async () => {
      const userData = {
        firstName: "nikhil",
        lastName: "vermaaaaa",
        email: " nikk@gmail.com ", // Email with leading/trailing spaces
        password: "password123",
      };
      await request(app).post("/auth/register").send(userData);
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      expect(users[0].email).toBe("nikk@gmail.com");
    });
    it("should return 400 status code if email is not a valid email", async () => {
      //Arrange
      const userData = {
        firstName: "nikhil",
        lastName: "vermaaaaa",
        email: "nikk@.com", // Email with wrong format
        password: "password123",
      };
      //Act
      const response = await request(app).post("/auth/register").send(userData);
      //Assert
      expect(response.statusCode).toBe(400);
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      expect(users).toHaveLength(0);
    });
    it("should return 400 status code if password is less than 8 characters", async () => {
      // Arrange
      const userData = {
        firstName: "John",
        lastName: "aston",
        email: "john@example.com",
        password: "123",
      };
      //Act
      const response = await request(app).post("/auth/register").send(userData);
      // Assert
      expect(response.statusCode).toBe(400);
      const userRepository = connection.getRepository(User);
      const users = await userRepository.find();
      expect(users).toHaveLength(0);
    });
  });
  describe("Error Messages in arrays", () => {
    it("should return an array of error messages if email is missing", async () => {
      // Arrange
      const userData = {
        firstName: "nikhil",
        lastName: "verma",
        email: "",
        password: "password123",
      };
      // Act
      const response = await request(app).post("/auth/register").send(userData);
      // Assert
      expect(response.body).toHaveProperty("errors");
      expect(
        (response.body as Record<string, string>).errors.length,
      ).toBeGreaterThan(0);
    });
  });
});
