// src/lib/warmup.test.ts
import { describe, it, expect } from "vitest";
import { daysSince, dailyCap } from "./warmup";

const CURVE = [50, 100, 250, 500, 1000, 1500, 2500, 3500, 5000];

describe("daysSince", () => {
  it("returns 0 when no start date", () => {
    expect(daysSince(null)).toBe(0);
  });
  it("returns 0 on the start day", () => {
    expect(daysSince("2026-05-20", new Date("2026-05-20T09:00:00Z"))).toBe(0);
  });
  it("returns whole days elapsed", () => {
    expect(daysSince("2026-05-20", new Date("2026-05-23T09:00:00Z"))).toBe(3);
  });
});

describe("dailyCap", () => {
  it("uses curve[0] before warmup has started", () => {
    expect(dailyCap(null, 5000, CURVE)).toBe(50);
  });
  it("uses curve[day] during warmup", () => {
    expect(dailyCap("2026-05-20", 5000, CURVE, new Date("2026-05-20T09:00:00Z"))).toBe(50);
    expect(dailyCap("2026-05-20", 5000, CURVE, new Date("2026-05-23T09:00:00Z"))).toBe(500);
  });
  it("holds at daily_max past the end of the curve", () => {
    expect(dailyCap("2026-05-20", 5000, CURVE, new Date("2026-07-01T09:00:00Z"))).toBe(5000);
  });
  it("respects a custom daily_max past the curve", () => {
    expect(dailyCap("2026-05-20", 8000, CURVE, new Date("2026-07-01T09:00:00Z"))).toBe(8000);
  });
});
