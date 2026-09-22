import { describe, it, expect } from "vitest";
import { dateTimestamp, winterEnd, bookingsPaused } from "./model";
describe("winter booking boundaries", () => {
  const access = {
    winter_start_at: "2026-11-01T12:00:00Z",
    winter_end_at: "2027-04-01T12:00:00Z",
    billing_blocked: false,
  };
  it("allows unaffected courses and the exact reopening instant", () => {
    expect(bookingsPaused(null)).toBe(false);
    expect(
      bookingsPaused(access, undefined, Date.parse(access.winter_end_at)),
    ).toBe(false);
  });
  it("blocks the winter start and future winter slots before the season begins", () => {
    expect(
      bookingsPaused(access, undefined, Date.parse(access.winter_start_at)),
    ).toBe(true);
    expect(
      bookingsPaused(access, "2026-12-01T12:00:00Z", Date.parse("2026-10-01")),
    ).toBe(true);
    expect(
      bookingsPaused(access, "2027-04-02T12:00:00Z", Date.parse("2026-10-01")),
    ).toBe(false);
  });
  it("blocks spring advance bookings while winter is active and unpaid accounts after winter", () => {
    expect(bookingsPaused(access, "2027-05-01", Date.parse("2027-01-01"))).toBe(
      true,
    );
    expect(
      bookingsPaused(
        { ...access, billing_blocked: true },
        undefined,
        Date.parse("2027-05-01"),
      ),
    ).toBe(true);
  });
  it("rejects impossible dates and unsafe season lengths", () => {
    expect(() => dateTimestamp("2027-02-30")).toThrow();
    expect(() => dateTimestamp("April 1")).toThrow();
    const start = dateTimestamp("2026-11-01");
    expect(winterEnd("2027-04-01", start)).toBe(dateTimestamp("2027-04-01"));
    expect(() => winterEnd("2026-11-10", start)).toThrow();
    expect(() => winterEnd("2027-08-01", start)).toThrow();
  });
});
