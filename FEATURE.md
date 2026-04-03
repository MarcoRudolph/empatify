---
description: "Feature specifications for Empatify — Round Prompts, Blind Mode, Post-Game Mood Card"
paths:
  - "./IMPLEMENTATIONPLAN.md"
  - "./src/lib/db/schema.ts"
---

# Empatify — Feature Specifications

---

## Feature 1: Round Prompts Mode

### What it is
A game mode where the host assigns a creative prompt to each round before the game starts. Players must pick a song that best fulfils the prompt — not their personal taste. The rating system changes accordingly: players rate how well the song matches the prompt, not whether they enjoy it personally.

### Why it matters
Removes the "I'll rate my friend's song high anyway" bias. Forces creative thinking. Creates stories and laughter around the reveal. Highest replayability of any feature.

### Prompt examples
- *"The song that best describes a Sunday morning hangover"*
- *"A song your dad would dance to at a wedding"*
- *"The most intense workout track you know"*
- *"A song that makes you feel like you're in a movie"*

### Game creation
- Host sees a text input per round when creating a lobby (e.g. Round 1, Round 2 … Round N)
- Prompts are optional per round. If a round has no prompt, it plays as standard free-choice
- Prompts are stored as a JSON array in `lobbies.round_prompts: text[]`

### Song selection
- During song selection, the round prompt is shown prominently above the Spotify search
- Subtitle: *"Pick a song that fits this vibe — not your favourite"*

### Rating screen
- The prompt is shown at the top of the rating view
- Rating label changes: instead of "Rate this song", it reads: *"How well does this song fit the prompt?"*
- Helper text: *"You're rating the song choice, not your personal taste."*
- Star/number scale remains unchanged (1–10)

### Why AI is excluded from judging
AI cannot reliably evaluate whether a song matches a subjective, creative prompt. The crowd is the judge. This is intentional and gives the game its human character.

### Plan tier
Pro Plan — round prompts are a Pro-only feature. Free users can see prompts in lobbies they join but cannot create prompt-based lobbies.

---

## Feature 2: Blind Game Mode + Guess the Submitter

### What it is
A two-phase game enhancement:

**Phase 1 — Blind Rating**
Songs are played without showing the submitter's name. Players rate purely on the music. Submitter identities are revealed only after all players have submitted their ratings for that round.

**Phase 2 — Guess the Submitter (bonus round)**
After all ratings are revealed, a bonus screen appears: for each song, players guess which friend submitted it. Correct guesses earn bonus points added to the leaderboard.

### Why it matters
Removes social bias from ratings. Adds a second competitive layer. Tests how well you truly know your friends' music taste — the core thesis of Empatify ("Do you know your friends well enough?").

### Data model change
- Add `is_blind: boolean` column to `lobbies` table (default `false`)
- Guess results stored in new `submitter_guesses` table: `(lobby_id, song_id, guesser_id, guessed_user_id, is_correct)`

### Game creation UI
- Toggle "Blind Mode" in the game creation card (Pro feature)
- Tooltip: *"Songs play without names. Submitters revealed after all ratings are in."*

### Rating flow change (blind)
- Song card hides submitter name with a `?` avatar placeholder
- After all players in a round submit ratings → submitter names are revealed with an animation
- Then the "Guess the Submitter" bonus screen activates for that round

### Bonus scoring
- Correct guess for a song = +1 bonus point per correct guess
- Bonus points shown separately on the leaderboard ("Base score + Bonus guesses")

### Plan tier
Pro Plan only.

---

## Feature 3: Post-Game Mood Card

### What it is
After a game ends, a single OpenAI call analyses all submitted songs as a group — one call per completed game, not per song. The result is a shareable card that gives each player a "music mood profile" and suggests a theme for the next game.

### Why it is one call, not per-song
Category validation (one call per song submission) already runs during the game. The post-game call is a higher-level synthesis that only makes sense once all songs are known. It costs a few hundred tokens total and runs once per finished game.

### What the OpenAI prompt sends
```
Songs submitted in this game:
- Player A: "Blue (Da Ba Dee) - Eiffel 65" 
- Player B: "Smells Like Teen Spirit - Nirvana"
- Player C: "One More Time - Daft Punk"

Analyse the collective mood of these songs (2 sentences max).
Compare Player A, B, C's music personality based on their choices (1 sentence per player, first name only).
Suggest one theme/prompt for their next game round (max 10 words).
Reply in JSON: {"collective_mood": "...", "profiles": {"A": "...", "B": "...", "C": "..."}, "next_prompt": "..."}
```

### Output
- **Collective mood**: e.g. *"Your group navigated between nostalgic euphoria and raw emotional intensity."*
- **Per-player profile**: e.g. *"Marco: a maximalist — you go for anthems that fill rooms."*
- **Next game suggestion**: e.g. *"Songs that sound like being stuck in traffic."*

### Shareable card
- Beautiful visual card (OG-image style) containing:
  - Top 3 highest-rated songs with cover art
  - Final leaderboard
  - Collective mood quote
  - Each player's one-line profile
- Download as PNG / share as link
- Free users see a blurred preview with "Pro feature" gate

### Plan tier
Post-game analysis and shareable card = Pro Plan only. The card generation triggers automatically when a game reaches `status = finished` and at least one player is on Pro.

---
