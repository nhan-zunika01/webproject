-- Add columns for email verification to the users table
ALTER TABLE users ADD COLUMN email_verification_token TEXT;
ALTER TABLE users ADD COLUMN email_verification_token_expires_at TIMESTAMP;
