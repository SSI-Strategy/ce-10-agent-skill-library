// Generated from http://localhost:8000/openapi.json — do not hand-edit.

export interface TagOut {
  id: number;
  name: string;
  description: string | null;
}

export interface TagCreate {
  name: string;
  description?: string | null;
}

export interface TagUpdate {
  name: string;
  description?: string | null;
}

export interface ExamplePromptIn {
  label: string;
  prompt_text: string;
  sort_order?: number | null;
}

export interface ExamplePromptOut {
  id: number;
  label: string;
  prompt_text: string;
  sort_order: number | null;
}

export interface SkillSummary {
  id: number;
  name: string;
  description: string;
  tags: TagOut[];
}

export interface SkillDetail {
  id: number;
  name: string;
  description: string;
  when_to_trigger: string;
  tags: TagOut[];
  example_prompts: ExamplePromptOut[];
  created_at: string;
  updated_at: string;
}

export interface SkillWrite {
  name: string;
  description: string;
  when_to_trigger: string;
  tag_ids: number[];
  example_prompts: ExamplePromptIn[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenOut {
  access_token: string;
  token_type: string;
}

export interface OkResponse {
  ok: boolean;
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail?: ValidationError[];
}

export interface ApiError {
  status: number;
  detail: string;
}
