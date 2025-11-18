-- Migration: Add game_mode column to lobbies table
-- This migration adds the game_mode column to support single-device and multi-device game modes

ALTER TABLE lobbies 
ADD COLUMN IF NOT EXISTS game_mode VARCHAR(20) DEFAULT 'multi-device' NOT NULL;

