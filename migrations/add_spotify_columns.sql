-- Migration: Add Spotify OAuth columns to users table
-- Run this migration to add Spotify integration support

-- Add Spotify OAuth token columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS spotify_access_token TEXT,
ADD COLUMN IF NOT EXISTS spotify_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS spotify_token_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS spotify_user_id VARCHAR(255);

-- Add comment for documentation
COMMENT ON COLUMN users.spotify_access_token IS 'Spotify OAuth access token (expires after 1 hour)';
COMMENT ON COLUMN users.spotify_refresh_token IS 'Spotify OAuth refresh token (long-lived)';
COMMENT ON COLUMN users.spotify_token_expires_at IS 'Timestamp when the access token expires';
COMMENT ON COLUMN users.spotify_user_id IS 'Spotify user ID for the connected account';

