import { pgTable, uuid, varchar, text, boolean, integer, timestamp, unique, check, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Users table
 * Stores user account information
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  avatarUrl: text('avatar_url'),
  proPlan: boolean('pro_plan').default(false).notNull(),
  // Spotify OAuth tokens
  spotifyAccessToken: text('spotify_access_token'),
  spotifyRefreshToken: text('spotify_refresh_token'),
  spotifyTokenExpiresAt: timestamp('spotify_token_expires_at', { withTimezone: true }),
  spotifyUserId: varchar('spotify_user_id', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Lobbies table
 * Stores game lobby information
 */
export const lobbies = pgTable('lobbies', {
  id: uuid('id').primaryKey().defaultRandom(),
  hostId: uuid('host_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  category: varchar('category', { length: 100 }),
  maxRounds: integer('max_rounds').default(5).notNull(),
  gameMode: varchar('game_mode', { length: 20 }).default('multi-device').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  hostIdIdx: index('idx_lobbies_host_id').on(table.hostId),
}));

/**
 * Lobby participants table
 * Many-to-many relationship between users and lobbies
 */
export const lobbyParticipants = pgTable('lobby_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  lobbyId: uuid('lobby_id').notNull().references(() => lobbies.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueLobbyUser: unique().on(table.lobbyId, table.userId),
  lobbyIdIdx: index('idx_lobby_participants_lobby_id').on(table.lobbyId),
  userIdIdx: index('idx_lobby_participants_user_id').on(table.userId),
}));

/**
 * Songs table
 * Stores song suggestions for each lobby round
 */
export const songs = pgTable('songs', {
  id: uuid('id').primaryKey().defaultRandom(),
  spotifyTrackId: varchar('spotify_track_id', { length: 255 }).notNull(),
  suggestedBy: uuid('suggested_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  lobbyId: uuid('lobby_id').notNull().references(() => lobbies.id, { onDelete: 'cascade' }),
  roundNumber: integer('round_number').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  lobbyIdIdx: index('idx_songs_lobby_id').on(table.lobbyId),
  suggestedByIdx: index('idx_songs_suggested_by').on(table.suggestedBy),
}));

/**
 * Ratings table
 * Stores user ratings for songs
 */
export const ratings = pgTable('ratings', {
  id: uuid('id').primaryKey().defaultRandom(),
  songId: uuid('song_id').notNull().references(() => songs.id, { onDelete: 'cascade' }),
  givenBy: uuid('given_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  ratingValue: integer('rating_value').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueSongUser: unique().on(table.songId, table.givenBy),
  songIdIdx: index('idx_ratings_song_id').on(table.songId),
  givenByIdx: index('idx_ratings_given_by').on(table.givenBy),
  ratingCheck: check('rating_value_check', 'rating_value >= 1 AND rating_value <= 10'),
}));

/**
 * Messages table
 * Stores chat messages within lobbies
 */
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  lobbyId: uuid('lobby_id').notNull().references(() => lobbies.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  lobbyIdIdx: index('idx_messages_lobby_id').on(table.lobbyId),
}));

/**
 * Friends table
 * Many-to-many relationship between users (friendship)
 */
export const friends = pgTable('friends', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  friendId: uuid('friend_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  primaryKey: unique().on(table.userId, table.friendId),
  userIdIdx: index('idx_friends_user_id').on(table.userId),
  friendIdIdx: index('idx_friends_friend_id').on(table.friendId),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  hostedLobbies: many(lobbies),
  lobbyParticipants: many(lobbyParticipants),
  suggestedSongs: many(songs),
  ratings: many(ratings),
  sentMessages: many(messages),
  friends: many(friends, { relationName: 'userFriends' }),
  friendOf: many(friends, { relationName: 'friendOfUsers' }),
}));

export const lobbiesRelations = relations(lobbies, ({ one, many }) => ({
  host: one(users, {
    fields: [lobbies.hostId],
    references: [users.id],
  }),
  participants: many(lobbyParticipants),
  songs: many(songs),
  messages: many(messages),
}));

export const lobbyParticipantsRelations = relations(lobbyParticipants, ({ one }) => ({
  lobby: one(lobbies, {
    fields: [lobbyParticipants.lobbyId],
    references: [lobbies.id],
  }),
  user: one(users, {
    fields: [lobbyParticipants.userId],
    references: [users.id],
  }),
}));

export const songsRelations = relations(songs, ({ one, many }) => ({
  suggester: one(users, {
    fields: [songs.suggestedBy],
    references: [users.id],
  }),
  lobby: one(lobbies, {
    fields: [songs.lobbyId],
    references: [lobbies.id],
  }),
  ratings: many(ratings),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  song: one(songs, {
    fields: [ratings.songId],
    references: [songs.id],
  }),
  rater: one(users, {
    fields: [ratings.givenBy],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  lobby: one(lobbies, {
    fields: [messages.lobbyId],
    references: [lobbies.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const friendsRelations = relations(friends, ({ one }) => ({
  user: one(users, {
    fields: [friends.userId],
    references: [users.id],
    relationName: 'userFriends',
  }),
  friend: one(users, {
    fields: [friends.friendId],
    references: [users.id],
    relationName: 'friendOfUsers',
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Lobby = typeof lobbies.$inferSelect;
export type NewLobby = typeof lobbies.$inferInsert;
export type LobbyParticipant = typeof lobbyParticipants.$inferSelect;
export type NewLobbyParticipant = typeof lobbyParticipants.$inferInsert;
export type Song = typeof songs.$inferSelect;
export type NewSong = typeof songs.$inferInsert;
export type Rating = typeof ratings.$inferSelect;
export type NewRating = typeof ratings.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Friend = typeof friends.$inferSelect;
export type NewFriend = typeof friends.$inferInsert;

