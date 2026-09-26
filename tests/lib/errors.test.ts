import { AppError, toAppError } from "@/lib/errors";

describe("AppError", () => {
  it("maps codes to HTTP status", () => {
    expect(new AppError("RATE_LIMITED", "slow down").status).toBe(429);
    expect(new AppError("SCANNED_PDF", "scanned").status).toBe(422);
  });

  it("hides unknown errors behind a generic message", () => {
    const error = toAppError(new Error("secret stack detail"));
    expect(error.code).toBe("INTERNAL");
    expect(error.message).not.toContain("secret");
  });

  it("passes AppErrors through unchanged", () => {
    const original = new AppError("INVALID_INPUT", "bad");
    expect(toAppError(original)).toBe(original);
  });
});
