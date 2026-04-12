import type { Metadata } from 'next';
import { SeoPageShell } from '../page-shell';
import { EmpathyPlayground } from '@/components/seo/EmpathyPlayground';

export const metadata: Metadata = {
  title: 'Spotify Party Game Online — Play with Friends | Empatify',
  description: 'The best Spotify party game to play online with friends. Pick songs, rate each other, and find out who really knows the group. Free to play.',
  openGraph: {
    title: 'Spotify Party Game Online — Empatify',
    description: 'Pick songs, rate each other, find out who really knows the group.',
    url: 'https://empatify.de/games/spotify-party-game',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is the best Spotify party game to play online?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Empatify is a multiplayer Spotify party game where each player picks a song and everyone rates each other\'s picks. The player with the highest average rating wins. It runs in the browser — no app download needed.',
      },
    },
    {
      '@type': 'Question',
      name: 'How many players can join a Spotify party game on Empatify?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Free games support up to 3 players. Pro games support unlimited players.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do all players need a Spotify account?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The host needs a Spotify account to search and submit songs. Guests can join and rate without one.',
      },
    },
  ],
};

export default function SpotifyPartyGamePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SeoPageShell
        title="Spotify Party Game Online"
        description="Pick songs, rate each other, and find out who really knows the group."
      >
        <section className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-white mb-3">What is a Spotify party game?</h2>
            <p className="text-neutral-300">
              A Spotify party game uses real songs from Spotify to create a shared experience. Players pick tracks, 
              others rate them, and the results reveal who has the best read on the group. Empatify is the leading 
              browser-based version — no app download, no setup.
            </p>
          </div>

          <EmpathyPlayground />

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">How to play Empatify</h2>
            <ol className="list-decimal list-inside space-y-2 text-neutral-300">
              <li>One player creates a lobby and shares the link</li>
              <li>Everyone joins — no account needed to rate</li>
              <li>Each round, every player searches and picks a Spotify song</li>
              <li>All players rate each other's picks from 1–10</li>
              <li>Highest average rating wins the round</li>
            </ol>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Why it works as a party game</h2>
            <p className="text-neutral-300">
              The twist: you win by picking songs your <em>friends</em> will love, not songs you love. 
              That requires empathy — understanding the room. It's a music taste game where knowing your 
              friends is the actual skill being tested.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Frequently asked questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-white">Do I need Spotify Premium?</h3>
                <p className="text-neutral-400">No. Spotify Free works. The host needs a Spotify account to search songs; guests can join without one.</p>
              </div>
              <div>
                <h3 className="font-medium text-white">How many players can join?</h3>
                <p className="text-neutral-400">Free lobbies support up to 3 players. Pro lobbies support unlimited players.</p>
              </div>
              <div>
                <h3 className="font-medium text-white">Is it free?</h3>
                <p className="text-neutral-400">Yes. Core gameplay is free. Pro features (unlimited players, category games, mood card) are available on the Pro plan.</p>
              </div>
            </div>
          </div>
        </section>
      </SeoPageShell>
    </>
  );
}
