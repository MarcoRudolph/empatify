# Datenbank-Migration: Spotify-Spalten hinzufügen

## Problem
Die neuen Spotify-Spalten existieren noch nicht in der Datenbank, daher schlägt die Abfrage fehl.

## Lösung: SQL-Migration manuell ausführen

Führe folgendes SQL-Skript in deiner Datenbank aus:

### Option 1: Über Supabase Dashboard

1. Gehe zu deinem Supabase Dashboard
2. Öffne den SQL Editor
3. Kopiere und füge folgendes SQL ein:

```sql
-- Add Spotify OAuth token columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS spotify_access_token TEXT,
ADD COLUMN IF NOT EXISTS spotify_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS spotify_token_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS spotify_user_id VARCHAR(255);
```

4. Klicke auf "Run" oder drücke Strg+Enter

### Option 2: Über psql (Command Line)

```bash
psql $DATABASE_URL -f migrations/add_spotify_columns.sql
```

### Option 3: Über Drizzle Studio

1. Starte Drizzle Studio: `npm run db:studio`
2. Öffne den SQL Editor im Browser
3. Führe das SQL-Skript aus

## Verifikation

Nach der Migration kannst du prüfen, ob die Spalten existieren:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name LIKE 'spotify%';
```

Du solltest folgende Spalten sehen:
- spotify_access_token
- spotify_refresh_token
- spotify_token_expires_at
- spotify_user_id

## Nach der Migration

Nach erfolgreicher Migration sollte der Fehler verschwinden und die Spotify-Verbindung funktionieren.

