import type {
  LoginRequest,
  OkResponse,
  SkillDetail,
  SkillSummary,
  SkillWrite,
  TagCreate,
  TagOut,
  TagUpdate,
  TokenOut,
} from "./types";

const BASE = "/api";

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") detail = body.detail;
      else if (Array.isArray(body.detail)) detail = body.detail.map((e: { msg: string }) => e.msg).join(", ");
    } catch {
      // leave detail as-is
    }
    throw { status: res.status, detail } satisfies { status: number; detail: string };
  }

  return res.json() as Promise<T>;
}

// ── Skills ────────────────────────────────────────────────────────────────────

export function listSkills(params: { q?: string; tag?: number[] } = {}): Promise<SkillSummary[]> {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  params.tag?.forEach((id) => qs.append("tag", String(id)));
  const query = qs.toString() ? `?${qs}` : "";
  return request<SkillSummary[]>(`/skills${query}`);
}

export function getSkill(id: number): Promise<SkillDetail> {
  return request<SkillDetail>(`/skills/${id}`);
}

export function createSkill(body: SkillWrite, token: string): Promise<SkillDetail> {
  return request<SkillDetail>("/skills", { method: "POST", body: JSON.stringify(body) }, token);
}

export function updateSkill(id: number, body: SkillWrite, token: string): Promise<SkillDetail> {
  return request<SkillDetail>(`/skills/${id}`, { method: "PUT", body: JSON.stringify(body) }, token);
}

export function deleteSkill(id: number, token: string): Promise<OkResponse> {
  return request<OkResponse>(`/skills/${id}`, { method: "DELETE" }, token);
}

// ── Tags ──────────────────────────────────────────────────────────────────────

export function listTags(): Promise<TagOut[]> {
  return request<TagOut[]>("/tags");
}

export function createTag(body: TagCreate, token: string): Promise<TagOut> {
  return request<TagOut>("/tags", { method: "POST", body: JSON.stringify(body) }, token);
}

export function updateTag(id: number, body: TagUpdate, token: string): Promise<TagOut> {
  return request<TagOut>(`/tags/${id}`, { method: "PUT", body: JSON.stringify(body) }, token);
}

export function deleteTag(id: number, token: string): Promise<OkResponse> {
  return request<OkResponse>(`/tags/${id}`, { method: "DELETE" }, token);
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export function login(body: LoginRequest): Promise<TokenOut> {
  return request<TokenOut>("/auth/login", { method: "POST", body: JSON.stringify(body) });
}
