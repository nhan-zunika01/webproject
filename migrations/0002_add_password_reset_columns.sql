-- Add columns for password reset functionality to the users table
ALTER TABLE users ADD COLUMN password_reset_token TEXT;
ALTER TABLE users ADD COLUMN password_reset_token_expires_at TEXT;
