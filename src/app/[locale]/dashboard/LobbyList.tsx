"use client"

import { useState } from 'react';
import NextLink from 'next/link';
import { useTranslations } from 'next-intl';
import { Music, Calendar, Star, Trophy } from 'lucide-react';
import { LobbyMenu } from './LobbyMenu';

interface Lobby {
  id: string;
  category: string | null;
  maxRounds: number;
  hostId: string;
  status: string;
  participantCount: number;
  averageRating: number;
  currentRound: number;
  createdAt: string;
  topPlayers: { userId: string; name: string }[];
  needsSongSelection: boolean;
  roundToRate: number | null;
}

interface User {
  id: string;
}

interface LobbyListProps {
  lobbies: Lobby[];
  user: User;
  locale: string;
}

function relativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Heute';
  if (diffDays === 1) return 'Gestern';
  if (diffDays < 7) return `vor ${diffDays} Tagen`;
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export function LobbyList({ lobbies, user, locale }: LobbyListProps) {
  const [loadingLobbyId, setLoadingLobbyId] = useState<string | null>(null);
  const t = useTranslations('dashboard');
  const tLobby = useTranslations('lobby');

  const getCategoryLabel = (cat: string | null) => {
    if (!cat) return tLobby('categoryAll');
    const categoryMap: Record<string, string> = {
      'hiphop-rnb': 'categoryHipHopRnB',
      '60s': 'category60s',
      '70s': 'category70s',
      '80s': 'category80s',
      '90s': 'category90s',
      '2000s': 'category2000s',
      '2010s': 'category2010s',
      '2020s': 'category2020s',
    };
    const key = categoryMap[cat] || `category${cat.charAt(0).toUpperCase() + cat.slice(1)}`;
    return tLobby(key as any) || cat;
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'running':
        return { label: t('lobbyRunning'), bg: 'bg-green-500', text: 'text-white', border: 'border-l-green-500' };
      case 'finished':
        return { label: t('lobbyFinished'), bg: 'bg-neutral-400', text: 'text-white', border: 'border-l-neutral-400' };
      default:
        return { label: t('lobbyNotStarted'), bg: 'bg-yellow-400', text: 'text-neutral-900', border: 'border-l-yellow-400' };
    }
  };

  return (
    <div className="space-y-3">
      {lobbies.map((lobby) => {
        const statusInfo = getStatusInfo(lobby.status || 'not_started');
        const isWinner =
          lobby.status === 'finished' &&
          lobby.topPlayers?.length > 0 &&
          lobby.topPlayers[0].userId === user?.id;

        const lobbyUrl = lobby.roundToRate
          ? `/${locale}/lobby/${lobby.id}?round=${lobby.roundToRate}`
          : lobby.currentRound
          ? `/${locale}/lobby/${lobby.id}?round=${lobby.currentRound}`
          : `/${locale}/lobby/${lobby.id}`;

        const isLoading = loadingLobbyId === lobby.id;
        const hasLeaderboard = lobby.topPlayers?.length > 0 && lobby.status !== 'not_started';

        const medals = [
          { emoji: '🥇', bg: 'bg-yellow-100', text: 'text-yellow-800' },
          { emoji: '🥈', bg: 'bg-neutral-200', text: 'text-neutral-700' },
          { emoji: '🥉', bg: 'bg-orange-100', text: 'text-orange-800' },
        ];

        return (
          <NextLink
            key={lobby.id}
            href={lobbyUrl}
            onClick={() => setLoadingLobbyId(lobby.id)}
            className={`block bg-neutral-100 hover:bg-neutral-200 rounded-xl border border-neutral-200 border-l-4 ${statusInfo.border} transition-all duration-200 group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2`}
          >
            {isLoading && (
              <div className="absolute inset-0 bg-neutral-50/70 flex items-center justify-center rounded-xl z-10">
                <svg className="animate-spin size-7 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            )}

            <div className={`p-4 transition-opacity ${isLoading ? 'opacity-40' : 'opacity-100'}`}>

              {/* Row 1: title + action icons */}
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <h3 className="font-semibold text-base text-neutral-900 group-hover:text-primary-500 transition-colors leading-snug">
                  {getCategoryLabel(lobby.category)} · {lobby.maxRounds} {tLobby('rounds')}
                </h3>

                {/* Action icons — 44×44 touch targets */}
                <div
                  className="flex items-center gap-0.5 shrink-0 -mr-1 -mt-1"
                  onClick={(e) => e.preventDefault()}
                >
                  <div className="flex items-center justify-center w-11 h-11">
                    {lobby.needsSongSelection ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="text-yellow-500"
                        aria-label={t('selectSongForRound')}
                      >
                        <path fillRule="evenodd" d="M8.544 1.056a3 3 0 0 1-3 3v1a3 3 0 0 1 3 3h1a3 3 0 0 1 3-3v-1a3 3 0 0 1-3-3zm-4.1 7.056v1.944H6.39v2H4.445V14h-2v-1.944H.5v-2h1.944V8.112zm4.579 1.444v5.979a4 4 0 1 0 2 3.465v-8.28l10-3.333v5.148a4 4 0 1 0 2 3.465V1.113l-8.979 2.992v2.451h-1.5a1.5 1.5 0 0 0-1.5 1.5v1.5z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <Music className="size-5 text-neutral-400 group-hover:text-primary-500 transition-colors" />
                    )}
                  </div>
                  <div className="flex items-center justify-center w-11 h-11">
                    <LobbyMenu
                      lobbyId={lobby.id}
                      isHost={lobby.hostId === user?.id}
                      participantCount={lobby.participantCount || 0}
                      locale={locale}
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: status + host + winner badges */}
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className={`inline-flex items-center px-2.5 py-1 text-sm font-semibold rounded-md ${statusInfo.bg} ${statusInfo.text}`}>
                  {statusInfo.label}
                </span>
                {lobby.hostId === user?.id && (
                  <span className="px-2.5 py-1 text-sm font-semibold bg-primary-500/15 text-primary-600 rounded-md">
                    {tLobby('host')}
                  </span>
                )}
                {isWinner && (
                  <span className="px-2.5 py-1 text-sm font-bold bg-yellow-100 text-yellow-800 rounded-md inline-flex items-center gap-1">
                    <Trophy className="size-3.5" />
                    Winner
                  </span>
                )}
              </div>

              {/* Row 3: stats row */}
              <div className="flex items-center gap-4 text-sm text-neutral-600">
                {lobby.status === 'running' && (
                  <span className="flex items-center gap-1.5">
                    <Music className="size-4 text-neutral-400 shrink-0" />
                    {t('currentRound')} {lobby.currentRound || 1}/{lobby.maxRounds}
                  </span>
                )}
                {lobby.averageRating > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Star className="size-4 text-yellow-500 fill-yellow-500 shrink-0" />
                    {(lobby.averageRating).toFixed(1)}
                  </span>
                )}
                <span className="flex items-center gap-1.5 ml-auto text-neutral-500">
                  <Calendar className="size-4 text-neutral-400 shrink-0" />
                  {relativeDate(lobby.createdAt)}
                </span>
              </div>

              {/* Row 4: leaderboard */}
              {hasLeaderboard && (
                <div className="mt-3 pt-3 border-t border-neutral-200 flex items-center gap-2 flex-wrap">
                  {lobby.topPlayers.map((player, index) => {
                    const medal = medals[index] ?? { emoji: '', bg: 'bg-neutral-100', text: 'text-neutral-700' };
                    return (
                      <div
                        key={player.userId}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg ${medal.bg} min-h-[36px]`}
                      >
                        <span className="text-base leading-none">{medal.emoji}</span>
                        <span className={`text-sm font-semibold ${medal.text} truncate max-w-[80px]`}>
                          {player.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </NextLink>
        );
      })}
    </div>
  );
}
