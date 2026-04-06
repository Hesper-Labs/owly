import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { resolveCustomer, normalizePhone } from "@/lib/customer-resolver";

const mockPrisma = prisma as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>;

describe("Customer Resolver", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPrisma.customer.findFirst.mockResolvedValue(null);
    mockPrisma.customer.findUnique.mockResolvedValue(null);
    mockPrisma.customer.create.mockResolvedValue({ id: "new-cust-1" });
    mockPrisma.customer.update.mockResolvedValue({});
  });

  describe("normalizePhone", () => {
    it("should strip @c.us suffix", () => {
      expect(normalizePhone("5551234567@c.us")).toBe("5551234567");
    });

    it("should strip @s.whatsapp.net suffix", () => {
      expect(normalizePhone("5551234567@s.whatsapp.net")).toBe("5551234567");
    });

    it("should keep leading + and strip other non-digits", () => {
      expect(normalizePhone("+1 (555) 123-4567")).toBe("+15551234567");
    });

    it("should handle already clean numbers", () => {
      expect(normalizePhone("+15551234567")).toBe("+15551234567");
    });
  });

  describe("resolveCustomer", () => {
    it("should find customer by email (direct match)", async () => {
      mockPrisma.customer.findFirst.mockResolvedValueOnce({
        id: "cust-1",
        name: "John",
        email: "john@test.com",
        phone: "",
        whatsapp: "",
      });
      mockPrisma.customer.findUnique.mockResolvedValue({
        name: "John",
        email: "john@test.com",
        phone: "",
        whatsapp: "",
      });

      const result = await resolveCustomer("email", "john@test.com", "John");
      expect(result).toBe("cust-1");
    });

    it("should find customer by whatsapp number", async () => {
      mockPrisma.customer.findFirst.mockResolvedValueOnce({
        id: "cust-2",
        name: "Jane",
        whatsapp: "5551234567@c.us",
      });
      mockPrisma.customer.findUnique.mockResolvedValue({
        name: "Jane",
        email: "",
        phone: "",
        whatsapp: "5551234567@c.us",
      });

      const result = await resolveCustomer("whatsapp", "5551234567@c.us", "Jane");
      expect(result).toBe("cust-2");
    });

    it("should auto-create customer when not found", async () => {
      // All findFirst calls return null
      mockPrisma.customer.findFirst.mockResolvedValue(null);
      mockPrisma.customer.create.mockResolvedValue({ id: "new-cust" });

      const result = await resolveCustomer("email", "new@test.com", "New User");

      expect(result).toBe("new-cust");
      expect(mockPrisma.customer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "New User",
          email: "new@test.com",
        }),
      });
    });

    it("should create customer with phone field for phone channel", async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(null);
      mockPrisma.customer.create.mockResolvedValue({ id: "phone-cust" });

      await resolveCustomer("phone", "+15551234567", "Phone Caller");

      expect(mockPrisma.customer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          phone: "+15551234567",
        }),
      });
    });

    it("should update lastContact on existing customer", async () => {
      mockPrisma.customer.findFirst.mockResolvedValueOnce({
        id: "existing-1",
        name: "Existing User",
      });
      mockPrisma.customer.findUnique.mockResolvedValue({
        name: "Existing User",
        email: "existing@test.com",
        phone: "",
        whatsapp: "",
      });

      await resolveCustomer("email", "existing@test.com", "Existing User");

      expect(mockPrisma.customer.update).toHaveBeenCalledWith({
        where: { id: "existing-1" },
        data: expect.objectContaining({
          lastContact: expect.any(Date),
        }),
      });
    });

    it("should handle empty customerContact", async () => {
      mockPrisma.customer.create.mockResolvedValue({ id: "empty-contact" });

      const result = await resolveCustomer("api", "", "API User");
      expect(result).toBe("empty-contact");
    });
  });
});
