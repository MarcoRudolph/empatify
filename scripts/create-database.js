const postgres = require('postgres');
require('dotenv').config();

async function createDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('🔌 Connecting to database...');
  const sql = postgres(process.env.DATABASE_URL);

  try {
    console.log('📝 Creating database schema...\n');

    // Create users table with Spotify columns
    console.log('1️⃣  Creating users table...');
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        pro_plan BOOLEAN DEFAULT FALSE,
        spotify_access_token TEXT,
        spotify_refresh_token TEXT,
        spotify_token_expires_at TIMESTAMP WITH TIME ZONE,
        spotify_user_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    console.log('   ✅ Users table created');

    // Create lobbies table
    console.log('2️⃣  Creating lobbies table...');
    await sql`
      CREATE TABLE IF NOT EXISTS lobbies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category VARCHAR(100),
        max_rounds INTEGER DEFAULT 5,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    console.log('   ✅ Lobbies table created');

    // Create lobby_participants table
    console.log('3️⃣  Creating lobby_participants table...');
    await sql`
      CREATE TABLE IF NOT EXISTS lobby_participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lobby_id UUID NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(lobby_id, user_id)
      );
    `;
    console.log('   ✅ Lobby participants table created');

    // Create songs table
    console.log('4️⃣  Creating songs table...');
    await sql`
      CREATE TABLE IF NOT EXISTS songs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        spotify_track_id VARCHAR(255) NOT NULL,
        suggested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        lobby_id UUID NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
        round_number INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    console.log('   ✅ Songs table created');

    // Create ratings table
    console.log('5️⃣  Creating ratings table...');
    await sql`
      CREATE TABLE IF NOT EXISTS ratings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
        given_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating_value INTEGER NOT NULL CHECK (rating_value >= 1 AND rating_value <= 10),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(song_id, given_by)
      );
    `;
    console.log('   ✅ Ratings table created');

    // Create messages table
    console.log('6️⃣  Creating messages table...');
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lobby_id UUID NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    console.log('   ✅ Messages table created');

    // Create friends table
    console.log('7️⃣  Creating friends table...');
    await sql`
      CREATE TABLE IF NOT EXISTS friends (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (user_id, friend_id),
        CHECK (user_id != friend_id)
      );
    `;
    console.log('   ✅ Friends table created');

    // Create indexes
    console.log('\n📊 Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_lobbies_host_id ON lobbies(host_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_lobby_participants_lobby_id ON lobby_participants(lobby_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_lobby_participants_user_id ON lobby_participants(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_songs_lobby_id ON songs(lobby_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_songs_suggested_by ON songs(suggested_by);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ratings_song_id ON ratings(song_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ratings_given_by ON ratings(given_by);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_lobby_id ON messages(lobby_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);`;
    console.log('   ✅ All indexes created');

    // Verify Spotify columns
    console.log('\n🔍 Verifying Spotify columns...');
    const spotifyColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name LIKE 'spotify%'
      ORDER BY column_name;
    `;

    if (spotifyColumns.length === 4) {
      console.log('✅ All 4 Spotify columns found:');
      spotifyColumns.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.warn(`⚠️  Expected 4 Spotify columns, found ${spotifyColumns.length}`);
    }

    console.log('\n🎉 Database schema created successfully!');
    console.log('✅ All tables, indexes, and Spotify columns are ready.');

  } catch (error) {
    console.error('\n❌ Error creating database:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

createDatabase();

