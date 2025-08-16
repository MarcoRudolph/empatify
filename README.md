# Empatify - Next.js App mit Design Tokens

Ein modernes Next.js Projekt mit Tailwind CSS 4, Design Tokens und Shadcn UI.

## 🎨 Design Token System

### Single Source of Truth
Alle Design-Werte kommen aus **`src/styles/tokens.json`** und werden automatisch in Tailwind CSS integriert.

### Dateien
- **`src/styles/tokens.json`** - Design Tokens (Figma/Design Studio Format)
- **`src/styles/tokens.ts`** - TypeScript Export der Tokens
- **`src/styles/tokens.css`** - CSS Custom Properties
- **`tailwind.config.ts`** - Tailwind Konfiguration mit Token-Integration

### Verwendung

#### 1. In Tailwind Klassen
```tsx
// ✅ KORREKT - Verwendet Tokens
<div className="bg-neutral-50 text-neutral-900">
  <h1 className="text-5xl font-bold tracking-tight text-primary-500">
    Empatify
  </h1>
  <div className="max-w-container mx-auto px-6 py-section-desktop">
    <Card className="bg-neutral-100 rounded-card p-card shadow-lg">
      <Button className="bg-primary-500 hover:bg-primary-600 min-h-button px-button rounded-full">
        Get Started
      </Button>
    </Card>
  </div>
</div>
```

#### 2. In CSS mit Custom Properties
```css
.my-component {
  background: var(--color-primary-500);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
```

#### 3. In TypeScript
```tsx
import { designTokens } from '@/styles/tokens';

const buttonStyle = {
  backgroundColor: designTokens.colors.primary[500],
  padding: designTokens.spacing.md,
  borderRadius: designTokens.radius.full
};
```

## 🚀 Features

- ✅ **Next.js 15** mit App Router
- ✅ **Tailwind CSS 4** mit Design Token Integration
- ✅ **TypeScript** für type safety
- ✅ **next-intl** für Internationalisierung
- ✅ **Shadcn UI** für Komponenten
- ✅ **Design Tokens** als Single Source of Truth
- ✅ **Cloudflare Ready** für Deployment

## 📁 Projektstruktur

```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Internationalisierung
│   ├── globals.css        # Globale Styles mit Token-Integration
│   └── layout.tsx         # Root Layout
├── components/             # UI Komponenten
│   ├── ui/                # Shadcn UI Komponenten
│   └── common/            # Gemeinsame Komponenten
├── styles/                 # Design System
│   ├── tokens.json        # Design Tokens (Single Source of Truth)
│   ├── tokens.ts          # TypeScript Export
│   └── tokens.css         # CSS Custom Properties
├── i18n/                   # Internationalisierung
└── messages/               # Übersetzungen
```

## 🎯 Design Guide

Siehe `.cursor/rules/Design_Guide.md` für detaillierte Richtlinien zur Verwendung der Design Tokens.

### Wichtige Regeln
- **NIEMALS hardcodierte Werte verwenden** - alles aus tokens.json
- **Bei Änderungen:** Nur tokens.json bearbeiten, Tailwind wird automatisch aktualisiert
- **Farben:** Immer `primary-500`, `neutral-50` etc. verwenden
- **Spacing:** Immer `p-card`, `gap-grid` etc. verwenden

## 🛠️ Installation & Setup

```bash
# Dependencies installieren
npm install

# Development Server starten
npm run dev

# Build für Production
npm run build
```

## 🌍 Internationalisierung

Das Projekt unterstützt Deutsch und Englisch über next-intl:

```tsx
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations();
  return <h1>{t('home.title')}</h1>;
}
```

## 🚀 Deployment

### Cloudflare Pages
```bash
npm run build
# Deploy den dist/ Ordner zu Cloudflare Pages
```

### Vercel
```bash
npm run build
# Vercel erkennt Next.js automatisch
```

## 📝 Token Updates

Bei Änderungen der Design Tokens:

1. **`src/styles/tokens.json`** bearbeiten
2. **`npm run dev`** neu starten
3. Tailwind wird automatisch aktualisiert
4. Alle Komponenten verwenden die neuen Werte

## 🔧 Entwicklung

### Neue Tokens hinzufügen
1. In `tokens.json` hinzufügen
2. In `tokens.ts` exportieren
3. In `tailwind.config.ts` integrieren (falls nötig)
4. In `tokens.css` als CSS Variable definieren

### Komponenten erstellen
```tsx
// Immer Tokens verwenden
<Button className="bg-primary-500 hover:bg-primary-600 px-button min-h-button rounded-full">
  Action
</Button>
```

## 📚 Ressourcen

- [Tailwind CSS 4 Documentation](https://tailwindcss.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Shadcn UI](https://ui.shadcn.com/)
- [next-intl](https://next-intl.dev/)
- [Design Tokens Best Practices](https://www.designtokens.org/)
