# DESIGN_GUIDE.md

## Zweck
Erzeuge **moderne, barrierefreie UI-Komponenten** mit der **aktuellen Version von shadcn/ui** und **Tailwind CSS 4 configless**.  
**Verboten:** Veraltete shadcn/ui-Imports, alte Pattern oder Code-Beispiele aus früheren Versionen.

---

## 1. Technische Vorgaben
- **Framework:** Next.js mit TypeScript
- **Styling:** **Tailwind CSS 4 "configless"** - Tokens werden aus `/src/styles/tokens.json` via `@theme` gebunden
- **Komponenten:** Aus `components/ui` oder aktuellen shadcn/ui-Templates ableiten
- **Icons:** `lucide-react` via Icon-Wrapper `<Icon name="..." />`
- **Keine Inline-Styles**, außer für dynamische Berechnungen
- **Radix UI** für A11y-Primitives

---

## 2. Design Tokens - Single Source of Truth
**Alle Design-Werte kommen aus `src/styles/tokens.json`** und werden über `@theme` direkt in Tailwind gebunden.

### Farbpalette (aus tokens.json)
Primärfarbe = **Orange #FF6B00** (statt Grün).  
Alle Buttons, CTAs, Hover-Zustände und Hauptakzente nutzen diese Farbe.

| Token          | HEX     | Verwendung                         | Tailwind Class        |
|----------------|---------|------------------------------------|----------------------|
| primary-50     | #FFF4E8 | Hellste Tönung / Flächen           | `bg-primary-50`      |
| primary-100    | #FFE1CC | Kartenhintergrund                  | `bg-primary-100`     |
| primary-500    | #FF6B00 | Haupt-CTA, Icons                   | `bg-primary-500`     |
| primary-600    | #E65F00 | Hover-States                       | `bg-primary-600`     |
| primary-900    | #732E00 | Aktive States, starker Text        | `text-primary-900`   |
| neutral-50     | #0F0F0F | Haupt-Hintergrund (Dark)           | `bg-neutral-50`      |
| neutral-100    | #1A1A1A | Sekundär-Hintergrund               | `bg-neutral-100`     |
| neutral-900    | #FFFFFF | Primärer Text auf Dark BG          | `text-neutral-900`   |
| accent-blue    | #2DB4FF | Sekundäre Akzente                  | `text-accent-blue`   |

### Typografie (aus tokens.json)
- **Font Family:** `Inter` (aus tokens.json)
- **Gewichte:** 400, 500, 700 (aus tokens.json)
- **Skala:** Alle Größen aus tokens.json
  - h1: `text-5xl font-bold tracking-tight`
  - h2: `text-4xl font-bold`
  - p: `text-lg leading-relaxed`
  - small: `text-sm text-neutral-400`

---

## 3. Layout & Spacing (aus tokens.json)
**8pt-Grid erzwingen: nur spacing-Tokens (xxs..3xl). Keine px-Werte außerhalb der Tokens.**

- **Container:** `max-w-container px-6` (aus tokens.json)
- **Section-Padding:** `py-section-desktop` (Mobil: `py-section-mobile`)
- **Grid:** 12-Spalten / `gap-grid` (aus tokens.json)
- **Karten:** `rounded-card shadow-lg p-card` (aus tokens.json)
- **Buttons:** `rounded-full min-h-button px-button` (aus tokens.json)

---

## 4. Komponenten aus der Landingpage

### Hero Section
- **Links:** Headline (h1), Subtext (p), Primary-Button (`bg-primary-500`), kleine sekundäre Infozeile darunter
- **Rechts:** Smartphone/Mockup-Darstellung mit leichtem 3D-Winkel, `rounded-xl`, `shadow-xl`
- **Hintergrund:** Dark Mode (`bg-neutral-50` aus tokens.json → sehr dunkles Grau)

### Stats Row
- Horizontale Auflistung von Kennzahlen
- Große Zahl in Accent-Farbe (`text-accent-blue`), Untertitel in neutralem Grau

### Avatar Row
- Runde Avatare (48px aus tokens.json) mit kleinem Rand (`border-neutral-800`)
- Text darunter: „And loved by … users"

---

## 5. Interaktionen & Animationen (aus tokens.json)
- **Hover-States:** Immer leicht dunklere Primärfarbe oder Scale-Animation
- **Einheitlicher Fokus:** `ring-2 ring-primary-500 ring-offset-1 ring-offset-neutral-50` (Dark)
- **Karten-Hover:** `translate-y-[-2px]` + `shadow-xl`
- **Transition-Dauer:** `duration-fast`, `duration-base`, `duration-slow` (aus tokens.json)
- **Easing:** `ease-standard` (aus tokens.json)

---

## 6. Barrierefreiheit
- Text/Background-Kontrast: mindestens WCAG AA
- Alle interaktiven Elemente müssen per Tastatur erreichbar sein
- ARIA-Labels für Icons ohne sichtbaren Text

---

## 7. STRENGE REGELN - VERBOTEN

### ❌ VERBOTEN - Hexfarben/Arbitrary Values
```tsx
// ❌ FALSCH - Hexfarben in Klassen
<div className="bg-[#FF6B00] text-[#FFFFFF]">
  <button className="bg-[#E65F00] hover:bg-[#732E00]">
    Action
  </button>
</div>

// ❌ FALSCH - Magic Numbers
<div className="p-[20px] m-[15px] w-[300px]">
  Content
</div>

// ❌ FALSCH - Inline-Styles
<div style={{ backgroundColor: '#FF6B00', padding: '16px' }}>
  Content
</div>
```

### ❌ VERBOTEN - Veraltete shadcn/ui-Patterns
```tsx
// ❌ FALSCH - Veraltete Imports
import { Button } from "@/components/ui/button-old"
import { Card } from "@/components/ui/card-v1"

// ❌ FALSCH - Veraltete Komponenten-Struktur
<Button variant="default" size="sm" className="...">
  Old Pattern
</Button>
```

---

## 8. ✅ KORREKTE VERWENDUNG

### Tailwind CSS 4 "configless" mit Tokens
```tsx
// ✅ KORREKT - Verwendet Tokens über @theme
<div className="bg-neutral-50 text-neutral-900">
  <h1 className="text-5xl font-bold tracking-tight text-primary-500">
    Empatify
  </h1>
  <div className="max-w-container mx-auto px-6 py-section-desktop">
    <Card className="bg-neutral-100 rounded-card p-card shadow-lg">
      <Button className="bg-primary-500 hover:bg-primary-600 min-h-button px-button rounded-full focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 focus:ring-offset-neutral-50">
        Get Started
      </Button>
    </Card>
  </div>
</div>
```

### Einheitlicher Fokus-State
```tsx
// ✅ KORREKT - Einheitlicher Fokus für alle interaktiven Elemente
<Button className="focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 focus:ring-offset-neutral-50">
  Action
</Button>

<Link className="focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 focus:ring-offset-neutral-50">
  Navigation
</Link>

<input className="focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 focus:ring-offset-neutral-50" />
```

### 8pt-Grid mit Spacing-Tokens
```tsx
// ✅ KORREKT - Nur Spacing-Tokens verwenden
<div className="p-card gap-grid">
  <div className="space-y-lg">
    <h2 className="mb-md">Title</h2>
    <p className="mt-sm">Description</p>
  </div>
</div>

// ❌ FALSCH - Magic Numbers
<div className="p-6 gap-6">
  <div className="space-y-4">
    <h2 className="mb-4">Title</h2>
    <p className="mt-2">Description</p>
  </div>
</div>
```

---

## 9. Aktuelle shadcn/ui-Patterns (Tailwind v4 kompatibel)

### Komponenten-Import
```tsx
// ✅ KORREKT - Aktuelle Imports
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
```

### Komponenten-Verwendung
```tsx
// ✅ KORREKT - Moderne shadcn/ui-Struktur
<Card className="bg-neutral-100 rounded-card p-card shadow-lg">
  <CardHeader>
    <CardTitle className="text-2xl font-bold text-neutral-900">
      Feature Title
    </CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-neutral-500 leading-relaxed">
      Feature description using design tokens.
    </p>
  </CardContent>
</Card>
```

---

## 10. Token-Update-Workflow

### Bei Änderungen der Design Tokens:
1. **`src/styles/tokens.json`** bearbeiten
2. **`npm run dev`** neu starten
3. **Tailwind wird automatisch über @theme aktualisiert**
4. **Alle Komponenten verwenden die neuen Werte**

### Neue Tokens hinzufügen:
1. In `tokens.json` hinzufügen
2. In `@theme` in der entsprechenden CSS-Datei definieren
3. Tailwind wird automatisch erweitert
4. In `tokens.css` als CSS Variable definieren

---

## 11. Wichtige Hinweise

- **NIEMALS hardcodierte Werte verwenden** - alles aus tokens.json
- **8pt-Grid strikt einhalten** - nur spacing-Tokens (xxs..3xl)
- **Einheitlicher Fokus-State** für alle interaktiven Elemente
- **Keine Hexfarben in Klassen** - immer Token-basierte Klassen
- **Keine Magic Numbers** - alle Werte aus Tokens
- **Aktuelle shadcn/ui-Patterns** verwenden
- **Tailwind CSS 4 "configless"** Ansatz nutzen

---

## 12. Beispiel für vollständig korrekte Implementierung

```tsx
// ✅ VOLLSTÄNDIG KORREKT - Alle Regeln befolgt
export default function HeroSection() {
  return (
    <section className="bg-neutral-50 text-neutral-900 py-section-desktop">
      <div className="container-custom">
        <div className="grid-12 items-center">
          <div className="col-span-12 lg:col-span-6">
            <h1 className="text-5xl font-bold tracking-tight text-primary-500 mb-lg">
              Empatify
            </h1>
            <p className="text-lg text-neutral-500 leading-relaxed mb-xl">
              Modern design system with Tailwind CSS 4 and design tokens.
            </p>
            <div className="flex flex-col sm:flex-row gap-md">
              <Button className="bg-primary-500 hover:bg-primary-600 min-h-button px-button rounded-full focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 focus:ring-offset-neutral-50 transition-all duration-base ease-standard">
                Get Started
              </Button>
              <Button variant="outline" className="min-h-button px-button rounded-full focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 focus:ring-offset-neutral-50">
                Learn More
              </Button>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-6">
            <div className="bg-neutral-100 rounded-xl shadow-xl p-card">
              <div className="w-full h-64 bg-gradient-to-br from-primary-100 to-primary-50 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```