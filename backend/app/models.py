from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


# ── Tag ───────────────────────────────────────────────────────────────────────

class TagOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None


class TagCreate(BaseModel):
    name: str = Field(..., min_length=1, examples=["data-analysis"])
    description: str | None = Field(None, examples=["Skills that query or transform data"])


class TagUpdate(BaseModel):
    name: str = Field(..., min_length=1, examples=["data-analysis"])
    description: str | None = Field(None, examples=["Skills that query or transform data"])


# ── Example Prompt ────────────────────────────────────────────────────────────

class ExamplePromptIn(BaseModel):
    label: str = Field(..., min_length=1, examples=["Summarise a meeting transcript"])
    prompt_text: str = Field(..., min_length=1, examples=["Here is the transcript…"])
    sort_order: int | None = Field(None, examples=[1])


class ExamplePromptOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    label: str
    prompt_text: str
    sort_order: int | None


# ── Skill (summary — list view) ───────────────────────────────────────────────

class SkillSummary(BaseModel):
    id: int
    name: str
    description: str
    tags: list[TagOut]


# ── Skill (full — side panel) ─────────────────────────────────────────────────

class SkillDetail(BaseModel):
    id: int
    name: str
    description: str
    when_to_trigger: str
    tags: list[TagOut]
    example_prompts: list[ExamplePromptOut]
    created_at: str
    updated_at: str


# ── Skill write ───────────────────────────────────────────────────────────────

class SkillWrite(BaseModel):
    name: str = Field(..., min_length=1, examples=["Meeting Notes Summariser"])
    description: str = Field(
        ...,
        min_length=1,
        examples=["Converts raw meeting notes into a structured summary with decisions and action items."],
    )
    when_to_trigger: str = Field(
        ...,
        min_length=1,
        examples=["Trigger after any meeting where notes or a transcript exist."],
    )
    tag_ids: list[int] = Field(..., min_length=1, examples=[[1, 3]])
    example_prompts: list[ExamplePromptIn] = Field(..., min_length=1)


# ── Auth ──────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str = Field(..., examples=["admin@company.com"])
    password: str = Field(..., examples=["admin123"])


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── Generic ───────────────────────────────────────────────────────────────────

class OkResponse(BaseModel):
    ok: bool = True
