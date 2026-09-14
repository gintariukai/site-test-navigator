CREATE TABLE webhook_deliveries (
  delivery_id TEXT PRIMARY KEY,
  received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE action_keys (
  action_key TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
