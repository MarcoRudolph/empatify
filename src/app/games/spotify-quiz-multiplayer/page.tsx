import type { Metadata } from 'next';
import { SeoPageShell } from '../page-shell';

export const metadata: Metadata = {
  title: 'Spotify Quiz Multiplayer — Play Online with Friends | Empatify',
  description: 'A Spotify quiz game you play live with friends. Pick songs each round, rate each other\'s choices, see who wins. Free, browser-based, no download.',
  openGraph: {
    title: 'Spotify Quiz Multiplayer — Empatify',
    description: 'Pick songs, rate friends, find out who wins.',
    url: 'https://empatify.de/games/spotify-quiz-multiplayer',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is the best multiplayer Spotify quiz game?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Empatify is a real-time multiplayer Spotify game where players each pick a song per round and rate each other\'s choices. It\'s more social than trivia — you win by knowing what your friends will like.',
      },
    },
  ],
};

export default function SpotifyQuizMultiplayerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SeoPageShell
        title="Spotify Quiz Multiplayer"
        description="Real-time, friend-vs-friend. Pick songs, rate each other, see who wins."
      >
        <section className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-white mb-3">How this Spotify quiz game works</h2>
            <p className="text-neutral-300">
              Unlike trivia-style Spotify quizzes, Empatify is active — every player picks a song each round, 
              not just guesses. You search Spotify live, submit your pick, then everyone rates every submission 
              from 1–10. Highest average score wins.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">What makes it multiplayer</h2>
            <ul className="list-disc list-inside space-y-2 text-neutral-300">
              <li>Everyone plays simultaneously — no waiting for your turn</li>
              <li>Real-time ratings — see scores as they come in</li>
              <li>Live leaderboard updates every round</li>
              <li>Up to 3 players free, unlimited with Pro</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Setting up a game in under 2 minutes</h2>
            <ol className="list-decimal list-inside space-y-2 text-neutral-300">
              <li>Create a free account at empatify.de</li>
              <li>Hit "Create Game" — choose 1–10 rounds</li>
              <li>Share the lobby link in your group chat</li>
              <li>Wait for players to join, then start</li>
            </ol>
          </div>
        </section>
      </SeoPageShell>
    </>
  );
}
