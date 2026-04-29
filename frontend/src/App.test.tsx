import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as api from "./api/client";
import App from "./App";
import type { SkillSummary, TagOut } from "./api/types";

vi.mock("./api/client");

const mockTags: TagOut[] = [];
const mockSkills: SkillSummary[] = [];

describe("App routing", () => {
  beforeEach(() => {
    vi.mocked(api.listTags).mockResolvedValue(mockTags);
    vi.mocked(api.listSkills).mockResolvedValue(mockSkills);
  });

  it("renders the catalogue page at /", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /agent skill library/i })).toBeInTheDocument()
    );
  });

  it("renders the admin login form at /admin", () => {
    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: /admin login/i })).toBeInTheDocument();
  });
});
