const request = require("supertest");
const app = require("../app");

describe("Express Application", () => {
  test("GET / should return welcome message", async () => {
    const response = await request(app).get("/");
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Welcome to our API!");
  });

  test("GET /api/status should return status info", async () => {
    const response = await request(app).get("/api/health");
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("status", "ok");
    expect(response.body).toHaveProperty("timestamp");
    expect(response.body).toHaveProperty("uptime");
  });

  test("GET /api/users/123 should return user data", async () => {
    const response = await request(app).get("/api/users/123");
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("id", "123");
    expect(response.body).toHaveProperty("name", "John Doe");
    expect(response.body).toHaveProperty("email", "john@example.com");
  });

  test("GET /api/users/999 should return 404", async () => {
    const response = await request(app).get("/api/users/999");
    expect(response.statusCode).toBe(404);
    expect(response.body.error).toHaveProperty("message", "User not found");
  });

  test("GET /nonexistent should return 404", async () => {
    const response = await request(app).get("/nonexistent");
    expect(response.statusCode).toBe(404);
    expect(response.body.error).toHaveProperty("message", "Not Found");
  });
});
