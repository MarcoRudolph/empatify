# Datenbank-Migration: Messaging-System

## Übersicht

Diese Migration erstellt die Tabellen für das neue Messaging-System:
- `user_messages`: Speichert private Nachrichten zwischen Benutzern
- `message_read_status`: Verfolgt, welche Nachrichten gelesen wurden

## Option 1: Über Supabase Dashboard (Empfohlen)

1. **Gehe zu deinem Supabase Dashboard**: https://supabase.com/dashboard
2. **Wähle dein Projekt aus**
3. **Klicke auf "SQL Editor"** (im linken Menü)
4. **Öffne die Datei** `migrations/add_messaging_tables.sql`
5. **Kopiere den gesamten Inhalt** und füge ihn in den SQL Editor ein
6. **Klicke auf "Run"** (oder drücke Strg+Enter / Cmd+Enter)

## Option 2: Über Node.js Script

```bash
node scripts/run-messaging-migration.js
```

**Voraussetzungen:**
- `DATABASE_URL` muss in deiner `.env` Datei gesetzt sein
- Node.js muss installiert sein

## Option 3: Über psql (Command Line)

```bash
psql $DATABASE_URL -f migrations/add_messaging_tables.sql
```

## Verifikation

Nach der Migration kannst du prüfen, ob die Tabellen existieren:

```sql
-- Prüfe Tabellen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_messages', 'message_read_status');

-- Prüfe Spalten von user_messages
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_messages'
ORDER BY ordinal_position;

-- Prüfe Spalten von message_read_status
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'message_read_status'
ORDER BY ordinal_position;

-- Prüfe Indexes
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%messages%';
```

Du solltest sehen:
- **2 Tabellen**: `user_messages` und `message_read_status`
- **5 Spalten in user_messages**: `id`, `sender_id`, `recipient_id`, `content`, `lobby_id`, `sent_at`
- **4 Spalten in message_read_status**: `id`, `message_id`, `user_id`, `read_at`
- **6 Indexes**: Für bessere Performance

## Nach der Migration

Nach erfolgreicher Migration sollte das Messaging-System vollständig funktionieren:

1. ✅ Einladungen an Freunde senden
2. ✅ Nachrichten zwischen Benutzern
3. ✅ Ungelesene Nachrichten-Badge in der Navbar
4. ✅ Chat-Übersicht und Detail-Ansicht

## Troubleshooting

### Fehler: "relation already exists"
- Die Tabellen existieren bereits. Das ist in Ordnung, die Migration verwendet `IF NOT EXISTS`.
- Du kannst die Migration trotzdem ausführen, sie wird keine Fehler werfen.

### Fehler: "permission denied"
- Stelle sicher, dass deine `DATABASE_URL` die richtigen Berechtigungen hat.
- In Supabase sollte der Service Role Key verwendet werden.

### Fehler: "relation users does not exist"
- Die `users` Tabelle muss zuerst existieren.
- Führe zuerst die Initial-Migration aus, falls noch nicht geschehen.

## Rollback (Falls nötig)

Falls du die Migration rückgängig machen musst:

```sql
-- ACHTUNG: Löscht alle Nachrichten!
DROP TABLE IF EXISTS message_read_status CASCADE;
DROP TABLE IF EXISTS user_messages CASCADE;
```
