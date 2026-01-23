"use client"

import { useState } from 'react';
import NextLink from 'next/link';
import { useTranslations } from 'next-intl';
import { Music, Calendar, Star, Trophy } from 'lucide-react';
import { LobbyMenu } from './LobbyMenu';

// Define the types for the props
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

export function LobbyList({ lobbies, user, locale }: LobbyListProps) {
  const [loadingLobbyId, setLoadingLobbyId] = useState<string | null>(null);
  const t = useTranslations('dashboard');
  const tLobby = useTranslations('lobby');

  const handleLobbyClick = (lobbyId: string) => {
    setLoadingLobbyId(lobbyId);
  };

  return (
    <div className="space-y-4">
      {lobbies.map((lobby) => {
        // Map category to translation key
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

        // Get status label and color
        const getStatusInfo = (status: string) => {
          switch (status) {
            case 'running':
              return {
                label: t('lobbyRunning'),
                bgColor: 'bg-green-500',
                textColor: 'text-white',
                borderColor: 'border-l-green-500',
              };
            case 'finished':
              return {
                label: t('lobbyFinished'),
                bgColor: 'bg-neutral-500',
                textColor: 'text-white',
                borderColor: 'border-l-neutral-500',
              };
            default:
              return {
                label: t('lobbyNotStarted'),
                bgColor: 'bg-yellow-500',
                textColor: '!text-neutral-900',
                borderColor: 'border-l-yellow-500',
              };
          }
        };

        const statusInfo = getStatusInfo(lobby.status || 'not_started');
        const isWinner =
          lobby.status === 'finished' &&
          lobby.topPlayers &&
          lobby.topPlayers.length > 0 &&
          lobby.topPlayers[0].userId === user?.id;

        const lobbyUrl = lobby.roundToRate
          ? `/lobby/${lobby.id}?round=${lobby.roundToRate}`
          : lobby.currentRound
          ? `/lobby/${lobby.id}?round=${lobby.currentRound}`
          : `/lobby/${lobby.id}`;
        
        const isLoading = loadingLobbyId === lobby.id;

        return (
          <NextLink
            key={lobby.id}
            href={lobbyUrl}
            onClick={() => handleLobbyClick(lobby.id)}
            className={`block p-4 bg-neutral-100 hover:bg-neutral-200 rounded-lg border-2 border-neutral-300 border-l-4 ${statusInfo.borderColor} transition-all duration-200 group relative`}
          >
            {isLoading && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
                <svg className="animate-spin h-8 w-8 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
            <div className={`transition-opacity ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-semibold text-neutral-900 group-hover:text-primary-500 transition-colors">
                      {getCategoryLabel(lobby.category)} • {lobby.maxRounds} {tLobby('rounds')}
                    </h3>
                    {lobby.hostId === user?.id && (
                      <span className="px-2 py-1 text-xs font-medium bg-primary-500 text-neutral-900 rounded shrink-0">
                        {tLobby('host')}
                      </span>
                    )}
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded shrink-0 ${statusInfo.bgColor}`}
                      style={
                        statusInfo.bgColor === 'bg-yellow-500' ? { color: '#171717' } : { color: '#ffffff' }
                      }
                    >
                      {statusInfo.label}
                    </span>
                    {isWinner && (
                      <span className="px-2 py-1 text-xs font-bold bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 rounded shrink-0 flex items-center gap-1 animate-pulse">
                        <Trophy className="size-3" />
                        Winner
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 flex-wrap text-sm mb-2">
                    {lobby.status === 'running' && (
                      <span className="flex items-center gap-1.5 text-neutral-700">
                        <Music className="size-3.5 text-neutral-500" />
                        <span className="font-medium">{t('currentRound')}:</span>
                        <span>
                          {lobby.currentRound || 1} / {lobby.maxRounds}
                        </span>
                      </span>
                    )}
                    {lobby.averageRating > 0 && (
                      <span className="flex items-center gap-1.5 text-neutral-700">
                        <Star className="size-3.5 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">
                          {(lobby.averageRating || 0).toFixed(1)} / 10
                        </span>
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 text-neutral-600">
                      <Calendar className="size-3.5 text-neutral-500" />
                      <span className="text-xs">{new Date(lobby.createdAt).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {(lobby.status === 'running' || lobby.status === 'finished') &&
                    lobby.topPlayers &&
                    lobby.topPlayers.length > 0 && (
                      <div className="hidden lg:flex flex-col gap-1 mr-2 text-xs">
                        {lobby.topPlayers.map((player: any, index: number) => {
                          const medalStyles = [
                            {
                              emoji: '🥇',
                              text: 'text-yellow-800',
                              bg: 'bg-gradient-to-r from-yellow-100 to-yellow-200',
                              border: 'border border-yellow-400',
                              shadow: 'shadow-md shadow-yellow-200',
                            }, // 1st Place - Gold
                            {
                              emoji: '🥈',
                              text: 'text-gray-800',
                              bg: 'bg-gradient-to-r from-gray-100 to-gray-200',
                              border: 'border border-gray-400',
                              shadow: 'shadow-md shadow-gray-200',
                            }, // 2nd Place - Silver
                            {
                              emoji: '🥉',
                              text: 'text-orange-800',
                              bg: 'bg-gradient-to-r from-orange-100 to-orange-200',
                              border: 'border border-orange-400',
                              shadow: 'shadow-md shadow-orange-200',
                            }, // 3rd Place - Bronze
                          ];
                          const medal =
                            medalStyles[index] || {
                              emoji: '',
                              text: 'text-neutral-800',
                              bg: 'bg-neutral-100',
                              border: 'border border-neutral-300',
                              shadow: '',
                            };

                          return (
                            <div
                              key={player.userId}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${medal.bg} ${medal.border} ${medal.shadow} transition-all hover:scale-105`}
                            >
                              <span className="text-base">{medal.emoji}</span>
                              <span className={`font-bold ${medal.text} text-sm`}>{index + 1}.</span>
                              <span className={`${medal.text} truncate max-w-[100px] font-semibold`}>
                                {player.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                  {lobby.needsSongSelection ? (
                    <div className="text-yellow-500" title={t('selectSongForRound')}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.544 1.056a3 3 0 0 1-3 3v1a3 3 0 0 1 3 3h1a3 3 0 0 1 3-3v-1a3 3 0 0 1-3-3zm-4.1 7.056v1.944H6.39v2H4.445V14h-2v-1.944H.5v-2h1.944V8.112zm4.579 1.444v5.979a4 4 0 1 0 2 3.465v-8.28l10-3.333v5.148a4 4 0 1 0 2 3.465V1.113l-8.979 2.992v2.451h-1.5a1.5 1.5 0 0 0-1.5 1.5v1.5z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  ) : (
                    <Music className="size-5 text-neutral-400 group-hover:text-primary-500 transition-colors" />
                  )}

                  <LobbyMenu
                    lobbyId={lobby.id}
                    isHost={lobby.hostId === user?.id}
                    participantCount={lobby.participantCount || 0}
                    locale={locale}
                  />
                </div>
              </div>
            </div>
          </NextLink>
        );
      })}
    </div>
  );
}
