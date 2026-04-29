import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as api from "../api/client";
import type {
  ExamplePromptIn,
  SkillDetail,
  SkillSummary,
  SkillWrite,
  TagOut,
} from "../api/types";

// ── Auth state ────────────────────────────────────────────────────────────────

interface AuthState { token: string; email: string }

// ── Skill modal ───────────────────────────────────────────────────────────────

interface SkillModalProps {
  token: string;
  tags: TagOut[];
  initial: SkillDetail | null;
  onClose: () => void;
  onSaved: () => void;
}

function SkillModal({ token, tags, initial, onClose, onSaved }: SkillModalProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [whenToTrigger, setWhenToTrigger] = useState(initial?.when_to_trigger ?? "");
  const [tagIds, setTagIds] = useState<Set<number>>(
    new Set(initial?.tags.map(t => t.id) ?? [])
  );
  const [prompts, setPrompts] = useState<ExamplePromptIn[]>(
    initial?.example_prompts.map(p => ({
      label: p.label,
      prompt_text: p.prompt_text,
      sort_order: p.sort_order,
    })) ?? [{ label: "", prompt_text: "", sort_order: 1 }]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleTag(id: number) {
    setTagIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function updatePrompt(i: number, field: keyof ExamplePromptIn, value: string | number) {
    setPrompts(ps => ps.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  }

  function addPrompt() {
    setPrompts(ps => [...ps, { label: "", prompt_text: "", sort_order: ps.length + 1 }]);
  }

  function removePrompt(i: number) {
    setPrompts(ps => ps.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    setError(null);
    if (!name.trim() || !description.trim() || !whenToTrigger.trim()) {
      setError("Name, description and when-to-trigger are required.");
      return;
    }
    if (tagIds.size === 0) { setError("Select at least one tag."); return; }
    if (prompts.length === 0) { setError("Add at least one example prompt."); return; }
    for (const p of prompts) {
      if (!p.label.trim() || !p.prompt_text.trim()) {
        setError("All example prompts need a label and text."); return;
      }
    }

    const body: SkillWrite = {
      name: name.trim(),
      description: description.trim(),
      when_to_trigger: whenToTrigger.trim(),
      tag_ids: [...tagIds],
      example_prompts: prompts,
    };

    setSaving(true);
    try {
      if (initial) await api.updateSkill(initial.id, body, token);
      else await api.createSkill(body, token);
      onSaved();
      onClose();
    } catch (e: unknown) {
      const err = e as { detail?: string };
      setError(err.detail ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h2>{initial ? "Edit skill" : "New skill"}</h2>
          <button type="button" className="side-panel-close" onClick={onClose} aria-label="Close modal">✕</button>
        </div>
        <div className="modal-body">
          {error && <p className="err-msg">{error}</p>}

          <div className="field">
            <label htmlFor="skill-name">Name</label>
            <input id="skill-name" type="text" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="skill-description">Description</label>
            <textarea id="skill-description" rows={3} value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="skill-trigger">When to trigger</label>
            <textarea id="skill-trigger" rows={2} value={whenToTrigger} onChange={e => setWhenToTrigger(e.target.value)} />
          </div>

          <div className="field">
            <label>Tags</label>
            <div className="tag-checkbox-grid">
              {tags.map(t => (
                <label key={t.id} className={`tag-checkbox-pill${tagIds.has(t.id) ? " checked" : ""}`}>
                  <input
                    type="checkbox"
                    checked={tagIds.has(t.id)}
                    onChange={() => toggleTag(t.id)}
                  />
                  {t.name}
                </label>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Example prompts</label>
            {prompts.map((p, i) => (
              <div key={i} className="prompt-editor-item prompt-editor-item--spaced">
                <label htmlFor={`prompt-label-${i}`} className="sr-only">Prompt {i + 1} label</label>
                <input
                  id={`prompt-label-${i}`}
                  type="text"
                  placeholder="Label"
                  value={p.label}
                  onChange={e => updatePrompt(i, "label", e.target.value)}
                />
                <label htmlFor={`prompt-text-${i}`} className="sr-only">Prompt {i + 1} text</label>
                <textarea
                  id={`prompt-text-${i}`}
                  rows={3}
                  placeholder="Prompt text"
                  value={p.prompt_text}
                  onChange={e => updatePrompt(i, "prompt_text", e.target.value)}
                />
                <div className="prompt-editor-actions">
                  <span className="muted">Prompt {i + 1}</span>
                  {prompts.length > 1 && (
                    <button type="button" className="btn-danger btn-sm" onClick={() => removePrompt(i)}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button type="button" className="btn-ghost btn-self-start" onClick={addPrompt}>
              + Add prompt
            </button>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tag manager ───────────────────────────────────────────────────────────────

interface TagManagerProps { token: string; tags: TagOut[]; onChanged: () => void }

function TagManager({ token, tags, onChanged }: TagManagerProps) {
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!newName.trim()) return;
    setAdding(true);
    setError(null);
    try {
      await api.createTag({ name: newName.trim(), description: newDesc.trim() || null }, token);
      setNewName("");
      setNewDesc("");
      onChanged();
    } catch (e: unknown) {
      const err = e as { detail?: string };
      setError(err.detail ?? "Failed to add tag");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!window.confirm(`Delete tag "${name}"? This will fail if any skill uses it.`)) return;
    try {
      await api.deleteTag(id, token);
      onChanged();
    } catch (e: unknown) {
      const err = e as { detail?: string };
      alert(err.detail ?? "Delete failed");
    }
  }

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>Tag taxonomy</h2>
      </div>
      {error && <p className="err-msg admin-section-error">{error}</p>}
      {tags.map(t => (
        <div key={t.id} className="tag-manager-row">
          <span className="tag-manager-name"><span className="tag-pill">{t.name}</span></span>
          <span className="tag-manager-desc">{t.description ?? "—"}</span>
          <button type="button" className="btn-danger btn-sm" onClick={() => handleDelete(t.id, t.name)}>
            Delete
          </button>
        </div>
      ))}
      <div className="tag-manager-add-row">
        <label htmlFor="new-tag-name" className="sr-only">New tag name</label>
        <input
          id="new-tag-name"
          type="text"
          placeholder="Tag name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          className="tag-manager-name-input"
        />
        <label htmlFor="new-tag-desc" className="sr-only">New tag description</label>
        <input
          id="new-tag-desc"
          type="text"
          placeholder="Description (optional)"
          value={newDesc}
          onChange={e => setNewDesc(e.target.value)}
        />
        <button type="button" className="btn-primary" onClick={handleAdd} disabled={adding || !newName.trim()}>
          {adding ? "Adding…" : "Add"}
        </button>
      </div>
    </div>
  );
}

// ── Skills table ──────────────────────────────────────────────────────────────

interface SkillsTableProps {
  token: string;
  skills: SkillSummary[];
  tags: TagOut[];
  onChanged: () => void;
}

function SkillsTable({ token, skills, tags, onChanged }: SkillsTableProps) {
  const [modalSkill, setModalSkill] = useState<SkillDetail | null | "new">(null);
  const [loadingEdit, setLoadingEdit] = useState<number | null>(null);

  async function openEdit(id: number) {
    setLoadingEdit(id);
    try {
      const detail = await api.getSkill(id);
      setModalSkill(detail);
    } catch {
      alert("Failed to load skill");
    } finally {
      setLoadingEdit(null);
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.deleteSkill(id, token);
      onChanged();
    } catch (e: unknown) {
      const err = e as { detail?: string };
      alert(err.detail ?? "Delete failed");
    }
  }

  return (
    <>
      <div className="admin-section">
        <div className="admin-section-header">
          <h2>Skills</h2>
          <button type="button" className="btn-primary" onClick={() => setModalSkill("new")}>+ New skill</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Tags</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {skills.length === 0 && (
              <tr><td colSpan={3} className="muted">No skills yet.</td></tr>
            )}
            {skills.map(s => (
              <tr key={s.id}>
                <td className="td-skill-name">{s.name}</td>
                <td>
                  <div className="td-tags">
                    {s.tags.map(t => <span key={t.id} className="tag-pill">{t.name}</span>)}
                  </div>
                </td>
                <td>
                  <div className="td-actions">
                    <button
                      type="button"
                      className="btn-ghost btn-sm"
                      onClick={() => openEdit(s.id)}
                      disabled={loadingEdit === s.id}
                    >
                      {loadingEdit === s.id ? "…" : "Edit"}
                    </button>
                    <button
                      type="button"
                      className="btn-danger btn-sm"
                      onClick={() => handleDelete(s.id, s.name)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalSkill !== null && (
        <SkillModal
          token={token}
          tags={tags}
          initial={modalSkill === "new" ? null : modalSkill}
          onClose={() => setModalSkill(null)}
          onSaved={onChanged}
        />
      )}
    </>
  );
}

// ── Login form ────────────────────────────────────────────────────────────────

function LoginForm({ onAuth }: { onAuth: (auth: AuthState) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { access_token } = await api.login({ email, password });
      onAuth({ token: access_token, email });
    } catch (err: unknown) {
      const e = err as { detail?: string };
      setError(e.detail ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Admin login</h1>
        {error && <p className="err-msg">{error}</p>}
        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="login-password">Password</label>
          <input id="login-password" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
        </div>
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <Link className="nav-link" to="/">← Back to catalogue</Link>
      </form>
    </div>
  );
}

// ── Admin page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [skills, setSkills] = useState<SkillSummary[]>([]);
  const [tags, setTags] = useState<TagOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadData() {
    if (!auth) return;
    setLoading(true);
    setError(null);
    Promise.all([api.listSkills(), api.listTags()])
      .then(([s, t]) => { setSkills(s); setTags(t); })
      .catch((e: { detail: string }) => setError(e.detail ?? "Failed to load data"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, [auth]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!auth) return <LoginForm onAuth={setAuth} />;

  return (
    <div className="admin-layout">
      <div className="admin-topbar">
        <h1>Admin</h1>
        <div className="admin-topbar-right">
          <span className="admin-user">{auth.email}</span>
          <Link className="nav-link" to="/">View catalogue</Link>
          <button type="button" className="btn-ghost" onClick={() => setAuth(null)}>Log out</button>
        </div>
      </div>

      {error && <p className="err-msg">{error}</p>}
      {loading && <p className="spinner">Loading…</p>}

      {!loading && !error && (
        <>
          <SkillsTable token={auth.token} skills={skills} tags={tags} onChanged={loadData} />
          <TagManager token={auth.token} tags={tags} onChanged={loadData} />
        </>
      )}
    </div>
  );
}
