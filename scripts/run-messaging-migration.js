const postgres = require('postgres');
require('dotenv').config();

async function runMessagingMigration() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('🔌 Connecting to database...');
  const sql = postgres(process.env.DATABASE_URL);

  try {
    console.log('📝 Running migration: Add messaging system tables...');
    
    // Create user_messages table
    console.log('   Creating user_messages table...');
    await sql`
      CREATE TABLE IF NOT EXISTS user_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        lobby_id UUID REFERENCES lobbies(id) ON DELETE SET NULL,
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `;

    // Create indexes for user_messages
    console.log('   Creating indexes for user_messages...');
    await sql`CREATE INDEX IF NOT EXISTS idx_user_messages_sender_id ON user_messages(sender_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_messages_recipient_id ON user_messages(recipient_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_messages_lobby_id ON user_messages(lobby_id);`;

    // Create message_read_status table
    console.log('   Creating message_read_status table...');
    await sql`
      CREATE TABLE IF NOT EXISTS message_read_status (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        message_id UUID NOT NULL REFERENCES user_messages(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        UNIQUE(message_id, user_id)
      );
    `;

    // Create indexes for message_read_status
    console.log('   Creating indexes for message_read_status...');
    await sql`CREATE INDEX IF NOT EXISTS idx_message_read_status_message_id ON message_read_status(message_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_message_read_status_user_id ON message_read_status(user_id);`;

    console.log('✅ Migration completed successfully!');

    // Verify the tables exist
    console.log('🔍 Verifying tables...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user_messages', 'message_read_status')
      ORDER BY table_name;
    `;

    if (tables.length === 2) {
      console.log('✅ Both tables found:');
      tables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
    } else {
      console.warn(`⚠️  Expected 2 tables, found ${tables.length}`);
    }

    // Verify indexes
    console.log('🔍 Verifying indexes...');
    const indexes = await sql`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexname LIKE 'idx_%messages%'
      ORDER BY indexname;
    `;

    console.log(`✅ Found ${indexes.length} indexes:`);
    indexes.forEach(idx => {
      console.log(`   - ${idx.indexname}`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMessagingMigration();
