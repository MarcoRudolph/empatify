import type { Metadata } from 'next';
import { SeoPageShell } from '../page-shell';
import { EmpathyPlayground } from '@/components/seo/EmpathyPlayground';

export const metadata: Metadata = {
  title: 'Music Games to Play with Friends Online | Empatify',
  description: 'The best music game to play with friends online. Use Spotify, pick songs, rate each other — find out who really knows the group. Free to play.',
  openGraph: {
    title: 'Music Games to Play with Friends Online — Empatify',
    description: 'Pick songs, rate each other, find out who really knows the group.',
    url: 'https://empatify.de/games/music-game-friends',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What are the best music games to play with friends online?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Empatify is a multiplayer music game where friends each pick a Spotify song and rate each other\'s picks. It tests how well you know your friends\' music taste — no download required, plays in any browser.',
      },
    },
    {
      '@type': 'Question',
      name: 'What makes Empatify different from other music games?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Most music games test trivia knowledge. Empatify tests empathy — you win by picking songs your friends will love, not songs you love yourself. The social dynamic is what makes it interesting.',
      },
    },
  ],
};

export default function MusicGameFriendsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SeoPageShell
        title="Music Games to Play with Friends Online"
        description="The game that finds out if you really know your friends' music taste."
      >
        <section className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Why music games hit different with friends</h2>
            <p className="text-neutral-300">
              Trivia games test memory. Music games test identity. When your friend picks a song and you have 
              to rate it, you're revealing exactly how well you know them — and how well they know you.
            </p>
          </div>

          <EmpathyPlayground />

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Best online music games for friend groups (2026)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-neutral-300 border-collapse">
                <thead>
                  <tr className="border-b border-neutral-700">
                    <th className="py-3 pr-6 text-white font-medium">Game</th>
                    <th className="py-3 pr-6 text-white font-medium">How it works</th>
                    <th className="py-3 text-white font-medium">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  <tr>
                    <td className="py-3 pr-6 font-medium text-orange-400">Empatify</td>
                    <td className="py-3 pr-6">Pick Spotify songs, friends rate them. Empathy wins.</td>
                    <td className="py-3">Free</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-6">Jackbox (Drawful / Quiplash)</td>
                    <td className="py-3 pr-6">Party games, some music-adjacent. Requires purchase.</td>
                    <td className="py-3">$9.99+</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-6">Heardle</td>
                    <td className="py-3 pr-6">Solo song-guessing game. Not multiplayer.</td>
                    <td className="py-3">Free</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-6">Song Pop</td>
                    <td className="py-3 pr-6">Music trivia against friends. Mobile-first.</td>
                    <td className="py-3">Free (ads)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">How to start a music game with friends in 60 seconds</h2>
            <ol className="list-decimal list-inside space-y-2 text-neutral-300">
              <li>Go to empatify.de and create a free account</li>
              <li>Create a lobby — choose number of rounds (1–10)</li>
              <li>Share the lobby link with your friends</li>
              <li>Each round: search Spotify, pick your song, submit</li>
              <li>Rate each other's picks, see the leaderboard</li>
            </ol>
          </div>
        </section>
      </SeoPageShell>
    </>
  );
}
