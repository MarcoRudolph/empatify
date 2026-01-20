# Magic Link Callback Fix

## Problem
Magic Link führt nicht zu erfolgreichem Login. Der Link zeigt auf:
```
https://tbszkkguvrzigzvzjcip.supabase.co/auth/v1/verify?token=pkce_...&type=signup&redirect_to=http://192.168.178.180:3000/auth/callback?next=...
```

## Was ich geändert habe

### 1. Callback Handler erweitert
Der Callback Handler (`src/app/auth/callback/route.ts`) wurde erweitert, um:
- ✅ `token` Parameter zu behandeln (zusätzlich zu `token_hash`)
- ✅ `verifyOtp` für Magic Links zu verwenden
- ✅ Bereits authentifizierte User zu erkennen
- ✅ Verschiedene `type` Werte zu unterstützen (`signup`, `magiclink`, `email`)

### 2. Flow-Unterstützung
Der Handler unterstützt jetzt:
- **PKCE Flow**: `code` Parameter → `exchangeCodeForSession()`
- **Magic Link Flow**: `token` oder `token_hash` Parameter → `verifyOtp()`

## Mögliche Probleme und Lösungen

### Problem 1: Supabase leitet nicht korrekt weiter
**Symptom**: Der Link zeigt direkt auf Supabase Verify-Endpoint, nicht auf unseren Callback.

**Lösung**: 
1. Prüfe Supabase Dashboard → Authentication → URL Configuration
2. Stelle sicher, dass `http://192.168.178.180:3000/auth/callback` in den Redirect URLs ist
3. Prüfe, ob die Site URL korrekt ist

### Problem 2: Token wird nicht erkannt
**Symptom**: Callback wird aufgerufen, aber kein `code`, `token` oder `token_hash` Parameter vorhanden.

**Lösung**: 
- Der Handler prüft jetzt auch, ob der User bereits authentifiziert ist
- Falls ja, wird direkt weitergeleitet

### Problem 3: PKCE Code Verifier fehlt
**Symptom**: `exchangeCodeForSession` schlägt fehl mit "code verifier mismatch".

**Lösung**:
- Magic Links mit PKCE benötigen den Code Verifier im Browser
- Stelle sicher, dass der Link im gleichen Browser geöffnet wird, in dem die Magic Link angefordert wurde
- Oder verwende `verifyOtp` statt `exchangeCodeForSession` für Magic Links

## Nächste Schritte zum Testen

1. **Teste den Magic Link erneut**:
   - Sende einen neuen Magic Link
   - Klicke auf den Link
   - Prüfe die Browser Console und Server Logs

2. **Prüfe die Logs**:
   - Suche nach: `🔵 Auth Callback Request:`
   - Prüfe, welche Parameter vorhanden sind
   - Prüfe auf Fehler: `🔴 Magic Link Verify Error:`

3. **Prüfe Supabase Dashboard**:
   - Gehe zu: Logs → Auth Logs
   - Suche nach Einträgen für deine E-Mail-Adresse
   - Prüfe auf Fehler

## Debugging

Der Callback Handler loggt jetzt:
- Alle Query-Parameter (`code`, `token`, `token_hash`, `type`)
- Erfolgreiche Verifizierungen
- Fehler mit detaillierten Meldungen

**Console Output erwartet**:
```
🔵 Auth Callback Request: { hasCode: false, hasToken: true, type: 'signup', ... }
🟡 Attempting to verify magic link token...
✅ Magic link verification successful, redirecting: { ... }
```

## Falls es immer noch nicht funktioniert

1. **Prüfe die E-Mail-Vorlage**:
   - Stelle sicher, dass `{{.ConfirmationURL}}` korrekt verwendet wird
   - Die URL sollte zu `/auth/callback` zeigen, nicht direkt zu Supabase

2. **Prüfe Supabase Settings**:
   - Authentication → URL Configuration
   - Site URL muss korrekt sein
   - Redirect URLs müssen `/auth/callback` enthalten

3. **Teste mit einem neuen Magic Link**:
   - Alte Links können abgelaufen sein
   - Magic Links sind normalerweise 24 Stunden gültig

4. **Prüfe Browser Console**:
   - Öffne F12 → Console
   - Prüfe auf JavaScript-Fehler
   - Prüfe auf Netzwerk-Fehler
