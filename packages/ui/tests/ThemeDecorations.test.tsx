import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { ThemeDecorations } from "../src/theme/ThemeDecorations";

describe("ThemeDecorations", () => {
  it("renders nothing on the server (theme is resolved on the client)", () => {
    expect(renderToString(<ThemeDecorations />)).toBe("");
  });
});
