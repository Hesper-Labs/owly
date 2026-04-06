import { describe, it, expect } from "vitest";
import { AppError, errorResponse, Errors } from "@/lib/errors";

describe("Error Handling", () => {
  describe("AppError", () => {
    it("should create error with all properties", () => {
      const err = new AppError(400, "VALIDATION_ERROR", "Invalid input", { field: "name" });

      expect(err.statusCode).toBe(400);
      expect(err.code).toBe("VALIDATION_ERROR");
      expect(err.message).toBe("Invalid input");
      expect(err.details).toEqual({ field: "name" });
      expect(err.name).toBe("AppError");
    });

    it("should be an instance of Error", () => {
      const err = new AppError(500, "INTERNAL", "Server error");
      expect(err).toBeInstanceOf(Error);
    });
  });

  describe("errorResponse", () => {
    it("should return NextResponse with error format", async () => {
      const response = errorResponse(400, "BAD_REQUEST", "Missing field", "req-123");
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("BAD_REQUEST");
      expect(data.error.message).toBe("Missing field");
      expect(data.error.requestId).toBe("req-123");
    });

    it("should include details when provided", async () => {
      const response = errorResponse(422, "VALIDATION", "Error", "req-1", { fields: ["name"] });
      const data = await response.json();

      expect(data.error.details).toEqual({ fields: ["name"] });
    });

    it("should omit requestId when not provided", async () => {
      const response = errorResponse(500, "INTERNAL", "Error");
      const data = await response.json();

      expect(data.error.requestId).toBeUndefined();
    });
  });

  describe("Error factories", () => {
    it("notFound should return 404", async () => {
      const response = Errors.notFound("Customer");
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error.code).toBe("NOT_FOUND");
    });

    it("badRequest should return 400", async () => {
      const response = Errors.badRequest("Invalid email");
      expect(response.status).toBe(400);
    });

    it("unauthorized should return 401", async () => {
      const response = Errors.unauthorized();
      expect(response.status).toBe(401);
    });

    it("tooManyRequests should return 429 with Retry-After", async () => {
      const response = Errors.tooManyRequests(60);
      expect(response.status).toBe(429);
      expect(response.headers.get("Retry-After")).toBe("60");
    });

    it("internal should return 500", async () => {
      const response = Errors.internal();
      expect(response.status).toBe(500);
    });
  });
});
