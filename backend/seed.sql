PRAGMA foreign_keys = ON;

-- ── admin_user ────────────────────────────────────────────────────────────────
-- passwords are bcrypt hashes of 'admin123' (for local dev only)
INSERT INTO admin_user (email, password_hash) VALUES
    ('admin@company.com',  '$2b$12$KIXthisIsAFakeBcryptHashForSeedDataOnlyAAAAAAAAAAAAAAAA'),
    ('content@company.com','$2b$12$KIXthisIsAFakeBcryptHashForSeedDataOnlyBBBBBBBBBBBBBBBB');

-- ── tag ───────────────────────────────────────────────────────────────────────
INSERT INTO tag (name, description) VALUES
    ('data-analysis',     'Skills that query, transform, or summarise structured data'),
    ('writing',           'Skills that draft, edit, or reformat text'),
    ('research',          'Skills that gather and synthesise information from multiple sources'),
    ('coding',            'Skills that generate, review, or explain code'),
    ('summarisation',     'Skills that condense long content into concise output'),
    ('meeting-support',   'Skills used before, during, or after meetings'),
    ('client-facing',     'Skills whose output is intended for external audiences'),
    ('internal-ops',      'Skills that support internal processes or administration');

-- ── skill ─────────────────────────────────────────────────────────────────────
INSERT INTO skill (name, description, when_to_trigger, created_by) VALUES
    (
        'Meeting Notes Summariser',
        'Takes raw meeting transcript or bullet-point notes and returns a structured summary with decisions, action items, and owners.',
        'Trigger after any meeting where notes or a transcript exist and a concise record is needed for distribution.',
        1
    ),
    (
        'SQL Query Builder',
        'Generates a SQL SELECT query from a plain-English description of the data needed, including joins and filters.',
        'Trigger when a team member knows what data they want but is unfamiliar with SQL or is working with an unfamiliar schema.',
        1
    ),
    (
        'Client Email Drafter',
        'Drafts a professional, tone-appropriate email to an external client based on a brief and key points provided by the user.',
        'Trigger when composing any external email where tone, clarity, and brevity are critical.',
        2
    ),
    (
        'Code Review Assistant',
        'Reviews a code snippet or diff for bugs, style issues, security concerns, and suggests improvements with explanations.',
        'Trigger during pull-request review or when a developer wants a second opinion before merging.',
        2
    ),
    -- Edge case: a skill intentionally assigned to only one tag (tests minimum valid state)
    (
        'Agenda Builder',
        'Creates a structured meeting agenda from a list of topics, estimated durations, and attendee roles.',
        'Trigger when scheduling a meeting with more than three agenda items or multiple stakeholders.',
        1
    );

-- ── skill_tag ─────────────────────────────────────────────────────────────────
-- Meeting Notes Summariser → summarisation, meeting-support
INSERT INTO skill_tag (skill_id, tag_id) VALUES
    (1, 5), -- summarisation
    (1, 6); -- meeting-support

-- SQL Query Builder → data-analysis, coding
INSERT INTO skill_tag (skill_id, tag_id) VALUES
    (2, 1), -- data-analysis
    (2, 4); -- coding

-- Client Email Drafter → writing, client-facing
INSERT INTO skill_tag (skill_id, tag_id) VALUES
    (3, 2), -- writing
    (3, 7); -- client-facing

-- Code Review Assistant → coding, writing (explanations are prose)
INSERT INTO skill_tag (skill_id, tag_id) VALUES
    (4, 4), -- coding
    (4, 2); -- writing

-- Agenda Builder → single tag (edge case: minimum one tag)
INSERT INTO skill_tag (skill_id, tag_id) VALUES
    (5, 6); -- meeting-support

-- ── example_prompt ────────────────────────────────────────────────────────────
-- Meeting Notes Summariser: 3 prompts
INSERT INTO example_prompt (skill_id, label, prompt_text, sort_order) VALUES
    (1, 'Summarise transcript',
        'Here is the transcript from today''s project sync. Summarise it into: (1) key decisions, (2) action items with owners and due dates, (3) open questions. Keep each section to bullet points.',
        1),
    (1, 'Summarise bullet notes',
        'These are rough notes from our team stand-up: [paste notes]. Convert them into a clean summary I can paste into Slack.',
        2),
    -- Edge case: a prompt with an unusually long label to test UI truncation
    (1, 'Summarise a recorded all-hands with 40+ attendees into exec-ready bullet points',
        'Below is the auto-generated transcript from our all-hands. Extract the five most important announcements and any follow-up commitments made by leadership.',
        3);

-- SQL Query Builder: 2 prompts
INSERT INTO example_prompt (skill_id, label, prompt_text, sort_order) VALUES
    (2, 'Basic filter query',
        'I need all customers from the "customers" table who signed up after 2024-01-01 and have placed at least one order. Write the SQL.',
        1),
    (2, 'Multi-table join',
        'Write a query that joins "orders", "order_items", and "products" to show total revenue per product category for Q1 2025.',
        2);

-- Client Email Drafter: 2 prompts
INSERT INTO example_prompt (skill_id, label, prompt_text, sort_order) VALUES
    (3, 'Follow-up after proposal',
        'Draft a follow-up email to a client who received our proposal three days ago and hasn''t responded. Tone: warm but professional. Keep it under 100 words.',
        1),
    (3, 'Delay notification',
        'Write an email to [Client Name] informing them that the delivery of [Project] will be delayed by two weeks due to [Reason]. Apologise briefly and confirm the new date.',
        2);

-- Code Review Assistant: 2 prompts
INSERT INTO example_prompt (skill_id, label, prompt_text, sort_order) VALUES
    (4, 'Review a Python function',
        'Review this Python function for correctness, edge cases, and readability. Suggest improvements with brief explanations:\n\n[paste function]',
        1),
    (4, 'Review a Git diff',
        'Here is a Git diff from my pull request. Flag any bugs, security issues, or style problems. Use the format: File → Line → Issue → Suggestion.\n\n[paste diff]',
        2);

-- Agenda Builder: 2 prompts
INSERT INTO example_prompt (skill_id, label, prompt_text, sort_order) VALUES
    (5, 'Weekly team sync agenda',
        'Build an agenda for a 45-minute weekly team sync. Topics: sprint review (15 min), blockers (10 min), upcoming milestones (10 min), open floor (10 min). Format as a table with time slots.',
        1),
    (5, 'Stakeholder alignment meeting',
        'Create an agenda for a 60-minute stakeholder alignment meeting on [Project Name]. Attendees: product, engineering, and sales leads. Goal: agree on the Q3 roadmap priorities.',
        2);
