import type { Metadata } from 'next';
import { SeoPageShell } from '../../games/page-shell';
import { EmpathyPlayground } from '@/components/seo/EmpathyPlayground';

export const metadata: Metadata = {
  title: 'Free Jackbox Alternative Online — No Purchase Required | Empatify',
  description: 'Looking for a free Jackbox alternative? Empatify is a browser-based multiplayer music game. No purchase, no download — just share a link and play.',
  openGraph: {
    title: 'Free Jackbox Alternative — Empatify',
    description: 'Browser-based multiplayer game. No purchase needed.',
    url: 'https://empatify.de/compare/jackbox-alternative',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is a good free alternative to Jackbox Games?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Empatify is a free browser-based multiplayer game that works like a social music game. Players each pick a Spotify song per round, rate each other, and the highest average rating wins. No purchase required — create a lobby and share the link.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does Empatify work without downloading anything?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Empatify runs entirely in the browser. The host creates a lobby and shares the link — guests join without creating an account or downloading anything.',
      },
    },
  ],
};

export default function JackboxAlternativePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SeoPageShell
        title="Free Jackbox Alternative Online"
        description="Browser-based multiplayer fun. No purchase, no download — just share a link."
      >
        <section className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-white mb-3">Jackbox vs Empatify — quick comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-neutral-300 border-collapse">
                <thead>
                  <tr className="border-b border-neutral-700">
                    <th className="py-3 pr-6 text-white font-medium"></th>
                    <th className="py-3 pr-6 text-white font-medium">Jackbox</th>
                    <th className="py-3 text-orange-400 font-medium">Empatify</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  <tr>
                    <td className="py-3 pr-6 text-neutral-400 font-medium">Price</td>
                    <td className="py-3 pr-6 text-white font-medium">$9.99–$29.99 per pack</td>
                    <td className="py-3 text-orange-400 font-bold">Free</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-6 text-neutral-400 font-medium">Download required</td>
                    <td className="py-3 pr-6 text-white font-medium">Yes (host needs Steam/console)</td>
                    <td className="py-3 text-orange-400 font-bold">No — browser only</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-6 text-neutral-400 font-medium">Players</td>
                    <td className="py-3 pr-6 text-white font-medium">Up to 8 (varies by game)</td>
                    <td className="py-3 text-orange-400 font-bold">3 free / unlimited Pro</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-6 text-neutral-400 font-medium">Music-based</td>
                    <td className="py-3 pr-6 text-white font-medium">Some packs only</td>
                    <td className="py-3 text-orange-400 font-bold">Yes — Spotify integration</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-6 text-neutral-400 font-medium">Accounts needed</td>
                    <td className="py-3 pr-6 text-white font-medium">Host needs Steam</td>
                    <td className="py-3 text-orange-400 font-bold">Guests join without account</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <EmpathyPlayground />

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">When Empatify beats Jackbox</h2>
            <ul className="list-disc list-inside space-y-2 text-neutral-300">
              <li>You want something free with no purchase barrier</li>
              <li>Your group is into music and Spotify</li>
              <li>You're playing remotely and don't want to coordinate a download</li>
              <li>You want a game that tests how well you know each other, not trivia</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">When Jackbox is the better pick</h2>
            <ul className="list-disc list-inside space-y-2 text-neutral-300">
              <li>You want variety across many game types in one pack</li>
              <li>Your group prefers drawing or word games over music</li>
              <li>You're willing to pay for more polished production</li>
            </ul>
          </div>
        </section>
      </SeoPageShell>
    </>
  );
}
