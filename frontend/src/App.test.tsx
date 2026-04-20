import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "./App";

describe("App", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the title", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: "ok" }),
      }),
    );
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });
});
