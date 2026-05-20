// src/lib/chunk.test.ts
import { describe, it, expect } from "vitest";
import { chunk } from "./chunk";

describe("chunk", () => {
  it("splits into full + remainder", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
  it("returns one chunk when size >= length", () => {
    expect(chunk([1, 2], 100)).toEqual([[1, 2]]);
  });
  it("returns [] for empty input", () => {
    expect(chunk([], 100)).toEqual([]);
  });
  it("chunks 250 into 100/100/50", () => {
    const arr = Array.from({ length: 250 }, (_, i) => i);
    const out = chunk(arr, 100);
    expect(out.map((c) => c.length)).toEqual([100, 100, 50]);
  });
});
