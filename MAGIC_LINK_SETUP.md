# Magic Link Setup & Troubleshooting

## Problem: Magic Link wird nicht versendet

Magic Links werden von **Supabase** versendet, nicht über POP3/IMAP. POP3/IMAP sind für das **Abrufen** von E-Mails, nicht für das Versenden.

## ✅ Checkliste: Supabase E-Mail-Konfiguration

### 1. Supabase Dashboard → Authentication → Email Templates

1. Gehe zu: **Supabase Dashboard → Authentication → Email Templates**
2. Stelle sicher, dass **"Magic Link"** aktiviert ist
3. Prüfe die E-Mail-Vorlage - sie sollte den Link enthalten

### 2. Supabase Dashboard → Authentication → URL Configuration

#### Site URL
```
http://localhost:3000
```
oder für Entwicklung mit IP:
```
http://192.168.178.180:3000
```

#### Redirect URLs
Füge diese URLs hinzu:
```
http://localhost:3000/auth/callback
http://192.168.178.180:3000/auth/callback
http://127.0.0.1:3000/auth/callback
```

**Wichtig**: Die `emailRedirectTo` URL muss in dieser Liste sein!

### 3. Supabase Dashboard → Settings → Auth

#### Enable Email Provider
- Stelle sicher, dass **"Enable Email Provider"** aktiviert ist
- Standardmäßig verwendet Supabase einen eigenen E-Mail-Service

#### SMTP Settings (Optional - nur wenn Custom SMTP verwendet wird)
Wenn du einen eigenen SMTP-Server verwenden möchtest:

1. Gehe zu: **Settings → Auth → SMTP Settings**
2. Konfiguriere:
   - **SMTP Host** (z.B. `smtp.gmail.com`)
   - **SMTP Port** (z.B. `587` für TLS)
   - **SMTP User** (deine E-Mail-Adresse)
   - **SMTP Password** (App-Passwort, nicht dein normales Passwort!)
   - **Sender Email** (Absender-E-Mail)
   - **Sender Name** (Absender-Name)

**Hinweis**: Für Gmail benötigst du ein **App-Passwort**, nicht dein normales Passwort!

### 4. Rate Limiting prüfen

1. Gehe zu: **Settings → Auth → Rate Limits**
2. Stelle sicher, dass die Limits nicht zu niedrig sind
3. Standard: 3 E-Mails pro Stunde pro E-Mail-Adresse

### 5. Console Logs prüfen

Öffne die Browser-Konsole (F12) und prüfe:
- Gibt es Fehler beim Aufruf von `signInWithOtp`?
- Wird `setIsMagicLinkSent(true)` aufgerufen?
- Gibt es Netzwerk-Fehler?

### 6. Supabase Logs prüfen

1. Gehe zu: **Supabase Dashboard → Logs → Auth Logs**
2. Suche nach Einträgen für `signInWithOtp`
3. Prüfe auf Fehler wie:
   - `Invalid email`
   - `Email rate limit exceeded`
   - `SMTP configuration error`

## 🔍 Debugging

### Code prüft bereits:
- ✅ E-Mail-Format-Validierung
- ✅ Fehlerbehandlung mit detailliertem Logging
- ✅ Redirect URL Konfiguration

### Was du prüfen solltest:

1. **Browser Console**: Öffne F12 → Console
   - Suche nach: `🔴 Magic Link error:`
   - Prüfe die Fehlermeldung

2. **Supabase Dashboard → Logs → Auth Logs**
   - Suche nach deiner E-Mail-Adresse
   - Prüfe auf Fehler

3. **E-Mail Postfach prüfen**
   - Spam-Ordner prüfen
   - E-Mail-Filter prüfen
   - Warte 1-2 Minuten (E-Mail-Versand kann verzögert sein)

## 🚨 Häufige Probleme

### Problem 1: "Email rate limit exceeded"
**Lösung**: Warte 1 Stunde oder erhöhe das Rate Limit in Supabase

### Problem 2: "Invalid redirect URL"
**Lösung**: Füge die `emailRedirectTo` URL zu den Redirect URLs in Supabase hinzu

### Problem 3: "SMTP configuration error"
**Lösung**: 
- Prüfe SMTP-Einstellungen in Supabase
- Oder verwende den Standard Supabase E-Mail-Service (keine SMTP-Konfiguration nötig)

### Problem 4: E-Mail kommt nicht an
**Lösung**:
- Prüfe Spam-Ordner
- Prüfe Supabase Logs → Auth Logs
- Prüfe, ob E-Mail-Adresse korrekt ist
- Warte 1-2 Minuten

## 📝 Code-Implementierung ist korrekt

Die Implementierung in `src/app/[locale]/login/page.tsx` ist korrekt:

```typescript
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo,
  },
})
```

Das Problem liegt wahrscheinlich in der **Supabase-Konfiguration**, nicht im Code.

## 🔧 Nächste Schritte

1. ✅ Prüfe Supabase Dashboard → Authentication → Email Templates
2. ✅ Prüfe Supabase Dashboard → Authentication → URL Configuration
3. ✅ Prüfe Browser Console auf Fehler
4. ✅ Prüfe Supabase Logs → Auth Logs
5. ✅ Prüfe E-Mail Postfach (inkl. Spam)

Wenn alles konfiguriert ist und es immer noch nicht funktioniert, prüfe die Supabase Logs für detaillierte Fehlermeldungen.
