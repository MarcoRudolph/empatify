const postgres = require('postgres');
require('dotenv').config();

async function addGameModeColumn() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('🔌 Connecting to database...');
  const sql = postgres(process.env.DATABASE_URL);

  try {
    console.log('📝 Running migration: Add game_mode column to lobbies table...');
    
    await sql`
      ALTER TABLE lobbies 
      ADD COLUMN IF NOT EXISTS game_mode VARCHAR(20) DEFAULT 'multi-device' NOT NULL;
    `;

    console.log('✅ Migration completed successfully!');

    // Verify the column exists
    console.log('🔍 Verifying column...');
    const columns = await sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'lobbies' 
      AND column_name = 'game_mode'
      LIMIT 1;
    `;

    if (columns.length > 0) {
      console.log('✅ game_mode column found:');
      console.log(`   - ${columns[0].column_name} (${columns[0].data_type})`);
      console.log(`   - Default: ${columns[0].column_default}`);
    } else {
      console.warn('⚠️  game_mode column not found after migration');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

addGameModeColumn();

