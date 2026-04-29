import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as api from "../api/client";
import AdminPage from "./AdminPage";
import type { SkillSummary, TagOut, TokenOut } from "../api/types";

vi.mock("../api/client");

const mockToken: TokenOut = { access_token: "test-token", token_type: "bearer" };

const mockTags: TagOut[] = [
  { id: 1, name: "coding", description: "Code skills" },
];

const mockSkills: SkillSummary[] = [
  { id: 1, name: "SQL Query Builder", description: "Generates SQL.", tags: [mockTags[0]] },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminPage />
    </MemoryRouter>
  );
}

async function loginAs(email = "admin@company.com", password = "admin123") {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
}

describe("AdminPage — login form", () => {
  beforeEach(() => { vi.mocked(api.login).mockResolvedValue(mockToken); });

  it("renders the login form before authentication", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /admin login/i })).toBeInTheDocument();
  });

  it("shows an error on bad credentials", async () => {
    vi.mocked(api.login).mockRejectedValue({ detail: "Invalid email or password" });
    renderPage();
    await loginAs("bad@example.com", "wrong");
    await waitFor(() => expect(screen.getByText("Invalid email or password")).toBeInTheDocument());
  });
});

describe("AdminPage — authenticated", () => {
  beforeEach(() => {
    vi.mocked(api.login).mockResolvedValue(mockToken);
    vi.mocked(api.listSkills).mockResolvedValue(mockSkills);
    vi.mocked(api.listTags).mockResolvedValue(mockTags);
  });

  async function renderAuthenticated() {
    renderPage();
    await loginAs();
    await waitFor(() => expect(screen.getByText("SQL Query Builder")).toBeInTheDocument());
  }

  it("shows the skills table and tag manager after login", async () => {
    await renderAuthenticated();
    expect(screen.getByText("Skills")).toBeInTheDocument();
    expect(screen.getByText("Tag taxonomy")).toBeInTheDocument();
  });

  it("shows a loading state then skills", async () => {
    renderPage();
    await loginAs();
    await waitFor(() => screen.getByText("SQL Query Builder"));
    expect(api.listSkills).toHaveBeenCalled();
  });

  it("shows an error when data loading fails", async () => {
    vi.mocked(api.listSkills).mockRejectedValue({ detail: "DB error" });
    renderPage();
    await loginAs();
    await waitFor(() => expect(screen.getByText("DB error")).toBeInTheDocument());
  });

  it("opens the new skill modal when '+ New skill' is clicked", async () => {
    await renderAuthenticated();
    fireEvent.click(screen.getByRole("button", { name: /new skill/i }));
    expect(screen.getByText("New skill")).toBeInTheDocument();
  });

  it("logs out and returns to login form", async () => {
    await renderAuthenticated();
    fireEvent.click(screen.getByRole("button", { name: /log out/i }));
    expect(screen.getByRole("heading", { name: /admin login/i })).toBeInTheDocument();
  });
});
