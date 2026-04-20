import { useEffect, useState } from "react";

type Health = { status: string };

export default function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(setHealth)
      .catch(e => setErr(String(e)));
  }, []);

  return (
    <main className="shell">
      <header>
        <p className="kicker">CE Starter · Assignment 10</p>
        <h1>Agent Skill Library</h1>
        <p className="pitch">A catalogue of agent &#x27;skills&#x27; (name, description, tags, when-to-trigger, example prompts) with search and filtering. A companion tool for the work this team is actually doing.</p>
      </header>
      <section className="status">
        <h2>Backend health</h2>
        {err && <p className="err">Error: {err}</p>}
        {!err && !health && <p>Checking…</p>}
        {health && <p className="ok">{health.status}</p>}
      </section>
      <section className="next">
        <h2>Next</h2>
        <p>
          This is the scaffold. Follow the starter workflow, phase by phase. Open <code>index.html</code> at the repo root for the assignment brief with copyable prompts.
        </p>
      </section>
    </main>
  );
}
