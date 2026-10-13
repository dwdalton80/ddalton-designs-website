-- Review requests: an invite sent to a client, and the review they write back.
--
-- Deliberately not stored in `testimonial`. That table is publicRead, so a
-- review sitting here unapproved would be fetchable from the public API even
-- though nothing renders it. Approving copies the row into `testimonial`,
-- which is the only table the public site ever reads.
CREATE TABLE IF NOT EXISTS review_request (
  id             TEXT PRIMARY KEY,
  token          TEXT NOT NULL UNIQUE,
  client_id      TEXT,
  client_name    TEXT NOT NULL,
  client_email   TEXT NOT NULL,
  -- sent -> submitted -> approved | declined
  status         TEXT NOT NULL DEFAULT 'sent',
  sent_at        TEXT,
  submitted_at   TEXT,
  rating         REAL,
  quote          TEXT,
  client_title   TEXT,
  client_company TEXT,
  testimonial_id TEXT,
  created_date   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_date   TEXT NOT NULL DEFAULT (datetime('now')),
  created_by_id  TEXT
);

CREATE INDEX IF NOT EXISTS idx_review_request_token  ON review_request(token);
CREATE INDEX IF NOT EXISTS idx_review_request_status ON review_request(status);
