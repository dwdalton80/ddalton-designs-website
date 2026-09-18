-- DDalton Designs — Cloudflare D1 schema
-- Ported from base44/entities/*.jsonc
--
--   npx wrangler d1 create ddalton-designs
--   npx wrangler d1 execute ddalton-designs --remote --file=migration/schema.sql
--
-- Conventions carried over from Base44:
--   * id / created_date / updated_date / created_by_id exist on every record.
--     Original ids are preserved so cross-references (estimate_id, client_id)
--     keep working without remapping.
--   * Dates are ISO-8601 TEXT, matching what the export produces.
--   * Booleans are INTEGER 0/1 (SQLite has no boolean type).
--   * Base44 enums become CHECK constraints.
--   * Array fields become TEXT holding JSON, with a validity CHECK.
--
-- NOTE ON MONEY: amounts are REAL because that is what Base44 stored and what
-- the current admin forms and invoicePdf.js produce. Integer cents would be the
-- better model, but changing it is a data-model change, not a hosting change —
-- worth doing as its own step, not folded into the migration.
--
-- Deliberately omitted:
--   * PortalMessage — dead entity, zero source references since the portal was removed.
--   * User          — Cloudflare Access owns identity now; there is no in-app user table.

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------- clients

CREATE TABLE client (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  company       TEXT,
  notes         TEXT,
  created_date  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_date  TEXT NOT NULL DEFAULT (datetime('now')),
  created_by_id TEXT
);
-- Emails are lowercased on write (a Base44 convention worth keeping).
CREATE UNIQUE INDEX idx_client_email ON client(email);

-- ------------------------------------------------------- contact requests

CREATE TABLE client_request (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  project_type  TEXT CHECK (project_type IN ('website','logo','marketing','other')),
  message       TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'new'
                CHECK (status IN ('new','read','converted','archived')),
  budget        TEXT,
  description   TEXT,
  created_date  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_date  TEXT NOT NULL DEFAULT (datetime('now')),
  created_by_id TEXT
);
CREATE INDEX idx_client_request_status ON client_request(status, created_date DESC);

-- -------------------------------------------------------------- estimates

CREATE TABLE estimate (
  id            TEXT PRIMARY KEY,
  client_id     TEXT REFERENCES client(id) ON DELETE SET NULL,
  client_name   TEXT NOT NULL,
  client_email  TEXT NOT NULL,
  -- [{ description, quantity, rate, total }, ...]
  line_items    TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(line_items)),
  subtotal      REAL,
  tax_rate      REAL NOT NULL DEFAULT 0,
  discount      REAL NOT NULL DEFAULT 0,
  total         REAL,
  status        TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','sent','viewed','accepted','declined')),
  sent_at       TEXT,
  notes         TEXT,
  valid_until   TEXT,
  created_date  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_date  TEXT NOT NULL DEFAULT (datetime('now')),
  created_by_id TEXT
);
CREATE INDEX idx_estimate_client ON estimate(client_email);
CREATE INDEX idx_estimate_status ON estimate(status, created_date DESC);

-- --------------------------------------------------------------- invoices

CREATE TABLE invoice (
  id            TEXT PRIMARY KEY,
  estimate_id   TEXT REFERENCES estimate(id) ON DELETE SET NULL,
  client_id     TEXT REFERENCES client(id) ON DELETE SET NULL,
  client_name   TEXT NOT NULL,
  client_email  TEXT NOT NULL,
  line_items    TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(line_items)),
  subtotal      REAL,
  tax_rate      REAL NOT NULL DEFAULT 0,
  discount      REAL NOT NULL DEFAULT 0,
  total         REAL,
  status        TEXT NOT NULL DEFAULT 'unpaid'
                CHECK (status IN ('unpaid','sent','partial','paid')),
  sent_at       TEXT,
  paid_amount   REAL NOT NULL DEFAULT 0,
  due_date      TEXT,
  payment_terms TEXT,
  notes         TEXT,
  pdf_url       TEXT,                       -- R2 object URL
  created_date  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_date  TEXT NOT NULL DEFAULT (datetime('now')),
  created_by_id TEXT
);
CREATE INDEX idx_invoice_client ON invoice(client_email);
CREATE INDEX idx_invoice_status ON invoice(status, due_date);

-- ---------------------------------------------------------- project plans

CREATE TABLE project_plan (
  id                 TEXT PRIMARY KEY,
  client_id          TEXT REFERENCES client(id) ON DELETE SET NULL,
  client_email       TEXT NOT NULL,
  title              TEXT NOT NULL,
  description        TEXT,
  scope              TEXT,
  deliverables       TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(deliverables)),
  timeline           TEXT,
  total_amount       REAL,
  status             TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','sent','viewed','signed','declined')),
  sent_at            TEXT,
  signed_at          TEXT,
  client_signature   TEXT,
  client_name_signed TEXT,
  created_date       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_date       TEXT NOT NULL DEFAULT (datetime('now')),
  created_by_id      TEXT
);
CREATE INDEX idx_project_plan_client ON project_plan(client_email);

-- -------------------------------------------------------------- portfolio

CREATE TABLE portfolio_item (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  category      TEXT NOT NULL
                CHECK (category IN ('website','logo','marketing','app development')),
  cover_image   TEXT,                       -- R2 object URL
  images        TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(images)),
  description   TEXT,
  url           TEXT,
  client_name   TEXT,
  featured      INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0,1)),
  "order"       REAL NOT NULL DEFAULT 0,    -- quoted: ORDER is reserved
  created_date  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_date  TEXT NOT NULL DEFAULT (datetime('now')),
  created_by_id TEXT
);
CREATE INDEX idx_portfolio_display ON portfolio_item(featured DESC, "order");

-- ----------------------------------------------------------- testimonials

CREATE TABLE testimonial (
  id             TEXT PRIMARY KEY,
  client_name    TEXT NOT NULL,
  client_title   TEXT,
  client_company TEXT,
  quote          TEXT NOT NULL,
  description    TEXT,
  avatar_url     TEXT,
  rating         REAL NOT NULL DEFAULT 5,
  featured       INTEGER NOT NULL DEFAULT 1 CHECK (featured IN (0,1)),
  "order"        REAL NOT NULL DEFAULT 0,
  created_date   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_date   TEXT NOT NULL DEFAULT (datetime('now')),
  created_by_id  TEXT
);
CREATE INDEX idx_testimonial_display ON testimonial(featured DESC, "order");

-- -------------------------------------------------------------- referrals

CREATE TABLE referral (
  id                    TEXT PRIMARY KEY,
  referrer_name         TEXT NOT NULL,
  referrer_email        TEXT NOT NULL,
  referred_client_name  TEXT NOT NULL,
  referred_client_email TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','contacted','converted','rejected')),
  referral_date         TEXT,
  conversion_date       TEXT,
  payout_amount         REAL NOT NULL DEFAULT 100,
  payout_status         TEXT NOT NULL DEFAULT 'unpaid'
                        CHECK (payout_status IN ('unpaid','paid')),
  notes                 TEXT,
  created_date          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_date          TEXT NOT NULL DEFAULT (datetime('now')),
  created_by_id         TEXT
);
CREATE INDEX idx_referral_referrer ON referral(referrer_email);
CREATE INDEX idx_referral_status ON referral(status, payout_status);

-- ------------------------------------------------------------ client files

CREATE TABLE client_file (
  id            TEXT PRIMARY KEY,
  client_email  TEXT NOT NULL,
  client_name   TEXT,
  file_url      TEXT NOT NULL,              -- R2 object URL
  file_name     TEXT NOT NULL,
  file_size     INTEGER,
  notes         TEXT,
  created_date  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_date  TEXT NOT NULL DEFAULT (datetime('now')),
  created_by_id TEXT
);
CREATE INDEX idx_client_file_client ON client_file(client_email);

-- ---------------------------------------------------------------- expenses

CREATE TABLE expense (
  id            TEXT PRIMARY KEY,
  date          TEXT NOT NULL,
  description   TEXT NOT NULL,
  category      TEXT CHECK (category IN
                ('software','hardware','marketing','travel','office',
                 'contractor','education','other')),
  amount        REAL NOT NULL,
  vendor        TEXT,
  notes         TEXT,
  receipt_url   TEXT,                       -- R2 object URL
  created_date  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_date  TEXT NOT NULL DEFAULT (datetime('now')),
  created_by_id TEXT
);
-- Expense reporting is almost always "this tax year, by category".
CREATE INDEX idx_expense_date ON expense(date DESC);
CREATE INDEX idx_expense_category ON expense(category, date DESC);

-- ------------------------------------------------------------------- tasks

CREATE TABLE task (
  id              TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  project_name    TEXT,
  estimated_hours REAL,
  actual_hours    REAL,
  status          TEXT NOT NULL DEFAULT 'todo'
                  CHECK (status IN ('todo','in_progress','done')),
  due_date        TEXT,
  notes           TEXT,
  priority        TEXT NOT NULL DEFAULT 'medium'
                  CHECK (priority IN ('low','medium','high')),
  created_date    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_date    TEXT NOT NULL DEFAULT (datetime('now')),
  created_by_id   TEXT
);
CREATE INDEX idx_task_board ON task(status, priority, due_date);
