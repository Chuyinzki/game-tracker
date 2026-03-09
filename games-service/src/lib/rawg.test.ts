import { describe, expect, it } from "vitest";
import { extractReleaseYear, normalizeGameDetail, normalizeGameSummary } from "./rawg.js";

describe("RAWG normalization", () => {
  it("extracts release year safely", () => {
    expect(extractReleaseYear("2022-02-25")).toBe(2022);
    expect(extractReleaseYear(null)).toBeNull();
  });

  it("maps summary and detail responses", () => {
    const raw = {
      id: 12,
      name: "Control",
      background_image: "https://image.test/control.jpg",
      released: "2019-08-27",
      description_raw: "A brutalist action game."
    };

    expect(normalizeGameSummary(raw)).toEqual({
      id: 12,
      name: "Control",
      coverUrl: "https://image.test/control.jpg",
      releaseYear: 2019
    });

    expect(normalizeGameDetail(raw)).toEqual({
      id: 12,
      name: "Control",
      coverUrl: "https://image.test/control.jpg",
      releaseYear: 2019,
      description: "A brutalist action game."
    });
  });
});
