import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as api from "../api/client";
import CataloguePage from "./CataloguePage";
import type { SkillDetail, SkillSummary, TagOut } from "../api/types";

vi.mock("../api/client");

const mockTags: TagOut[] = [
  { id: 1, name: "coding", description: null },
  { id: 2, name: "writing", description: null },
];

const mockSkills: SkillSummary[] = [
  { id: 1, name: "SQL Query Builder", description: "Generates SQL from plain English.", tags: [mockTags[0]] },
  { id: 2, name: "Client Email Drafter", description: "Drafts professional emails.", tags: [mockTags[1]] },
];

const mockDetail: SkillDetail = {
  id: 1,
  name: "SQL Query Builder",
  description: "Generates SQL from plain English.",
  when_to_trigger: "When someone needs data but doesn't know SQL.",
  tags: [mockTags[0]],
  example_prompts: [{ id: 1, label: "Basic filter", prompt_text: "Give me all customers…", sort_order: 1 }],
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
};

function renderPage() {
  return render(
    <MemoryRouter>
      <CataloguePage />
    </MemoryRouter>
  );
}

describe("CataloguePage", () => {
  beforeEach(() => {
    vi.mocked(api.listTags).mockResolvedValue(mockTags);
    vi.mocked(api.listSkills).mockResolvedValue(mockSkills);
    vi.mocked(api.getSkill).mockResolvedValue(mockDetail);
  });

  it("renders the page heading", async () => {
    renderPage();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("shows a loading state then renders skill cards", async () => {
    renderPage();
    expect(screen.getByText("Loading…")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("SQL Query Builder")).toBeInTheDocument());
    expect(screen.getByText("Client Email Drafter")).toBeInTheDocument();
  });

  it("shows an error message when the API fails", async () => {
    vi.mocked(api.listSkills).mockRejectedValue({ detail: "Server error" });
    renderPage();
    await waitFor(() => expect(screen.getByText("Server error")).toBeInTheDocument());
  });

  it("renders tag filter pills from the taxonomy", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("coding")).toBeInTheDocument());
    expect(screen.getByText("writing")).toBeInTheDocument();
  });

  it("opens the side panel and loads skill detail on card click", async () => {
    renderPage();
    await waitFor(() => screen.getByText("SQL Query Builder"));
    fireEvent.click(screen.getByText("SQL Query Builder"));
    await waitFor(() => expect(api.getSkill).toHaveBeenCalledWith(1));
    await waitFor(() => expect(screen.getByText("When to trigger")).toBeInTheDocument());
  });

  it("closes the side panel when close button is clicked", async () => {
    renderPage();
    await waitFor(() => screen.getByText("SQL Query Builder"));
    fireEvent.click(screen.getByText("SQL Query Builder"));
    await waitFor(() => screen.getByLabelText("Close panel"));
    fireEvent.click(screen.getByLabelText("Close panel"));
    expect(screen.queryByText("When to trigger")).not.toBeInTheDocument();
  });
});
