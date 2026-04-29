import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import * as api from "../api/client";
import type { SkillDetail, SkillSummary, TagOut } from "../api/types";

// ── Side panel ────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }
  return (
    <button type="button" className={`copy-btn${copied ? " copied" : ""}`} onClick={handleCopy}>
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function PromptItem({ label, prompt_text }: { label: string; prompt_text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="prompt-item">
      <div className="prompt-header" onClick={() => setOpen(o => !o)}>
        <span className="prompt-label">{label}</span>
        <span className="prompt-chevron">{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div className="prompt-body">
          <pre className="prompt-text">{prompt_text}</pre>
          <CopyButton text={prompt_text} />
        </div>
      )}
    </div>
  );
}

function SidePanel({ skillId, onClose }: { skillId: number; onClose: () => void }) {
  const [skill, setSkill] = useState<SkillDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSkill(null);
    api.getSkill(skillId)
      .then(setSkill)
      .catch((e: { detail: string }) => setError(e.detail ?? "Failed to load skill"))
      .finally(() => setLoading(false));
  }, [skillId]);

  return (
    <aside className="side-panel">
      <div className="side-panel-header">
        <div>
          {skill && <h2 className="side-panel-title">{skill.name}</h2>}
          {loading && <p className="muted">Loading…</p>}
        </div>
        <button type="button" className="side-panel-close" onClick={onClose} aria-label="Close panel">✕</button>
      </div>

      {error && <p className="err-msg side-panel-error">{error}</p>}

      {skill && (
        <div className="side-panel-body">
          <div>
            <p className="side-panel-section-label">Description</p>
            <p className="side-panel-text">{skill.description}</p>
          </div>
          <div>
            <p className="side-panel-section-label">When to trigger</p>
            <p className="side-panel-text">{skill.when_to_trigger}</p>
          </div>
          <div>
            <p className="side-panel-section-label">Tags</p>
            <div className="side-panel-tags">
              {skill.tags.map(t => <span key={t.id} className="tag-pill">{t.name}</span>)}
            </div>
          </div>
          <div>
            <p className="side-panel-section-label">Example prompts</p>
            <div className="prompt-list">
              {skill.example_prompts.map(p => (
                <PromptItem key={p.id} label={p.label} prompt_text={p.prompt_text} />
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

// ── Catalogue page ────────────────────────────────────────────────────────────

export default function CataloguePage() {
  const [skills, setSkills] = useState<SkillSummary[]>([]);
  const [tags, setTags] = useState<TagOut[]>([]);
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<number>>(new Set());
  const [activeSkillId, setActiveSkillId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load tag taxonomy once
  useEffect(() => {
    api.listTags().then(setTags).catch(() => {/* non-critical */});
  }, []);

  // Fetch skills whenever query or tag filter changes (debounced)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      setError(null);
      api.listSkills({ q: query || undefined, tag: selectedTags.size ? [...selectedTags] : undefined })
        .then(setSkills)
        .catch((e: { detail: string }) => setError(e.detail ?? "Failed to load skills"))
        .finally(() => setLoading(false));
    }, 220);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, selectedTags]);

  function toggleTag(id: number) {
    setSelectedTags(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="catalogue-layout">
      <div className="catalogue-main">
        <div className="catalogue-header">
          <h1>Agent Skill Library</h1>
          <p>Find the right skill for your task. <Link className="nav-link" to="/admin">Admin</Link></p>
        </div>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search skills…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Search skills"
          />
        </div>

        {tags.length > 0 && (
          <div className="tag-filter">
            {tags.map(t => (
              <button
                key={t.id}
                type="button"
                className={`tag-filter-pill${selectedTags.has(t.id) ? " active" : ""}`}
                onClick={() => toggleTag(t.id)}
              >
                {t.name}
              </button>
            ))}
            {selectedTags.size > 0 && (
              <button type="button" className="tag-filter-pill" onClick={() => setSelectedTags(new Set())}>
                Clear
              </button>
            )}
          </div>
        )}

        {error && <p className="err-msg">{error}</p>}
        {loading && <p className="spinner">Loading…</p>}

        {!loading && !error && (
          <div className="skill-grid">
            {skills.length === 0 && <p className="muted">No skills match your search.</p>}
            {skills.map(skill => (
              <div
                key={skill.id}
                className={`skill-card${activeSkillId === skill.id ? " active" : ""}`}
                onClick={() => setActiveSkillId(skill.id === activeSkillId ? null : skill.id)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === "Enter" && setActiveSkillId(skill.id)}
                aria-pressed={activeSkillId === skill.id ? true : false}
              >
                <div className="skill-card-name">{skill.name}</div>
                <div className="skill-card-desc">{skill.description}</div>
                <div className="skill-card-tags">
                  {skill.tags.map(t => <span key={t.id} className="tag-pill">{t.name}</span>)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeSkillId !== null && (
        <SidePanel skillId={activeSkillId} onClose={() => setActiveSkillId(null)} />
      )}
    </div>
  );
}
