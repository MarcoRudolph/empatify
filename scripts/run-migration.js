const postgres = require('postgres');
require('dotenv').config();

async function runMigration() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('🔌 Connecting to database...');
  const sql = postgres(process.env.DATABASE_URL);

  try {
    console.log('📝 Running migration: Add Spotify columns to users table...');
    
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS spotify_access_token TEXT,
      ADD COLUMN IF NOT EXISTS spotify_refresh_token TEXT,
      ADD COLUMN IF NOT EXISTS spotify_token_expires_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS spotify_user_id VARCHAR(255);
    `;

    console.log('✅ Migration completed successfully!');

    // Verify the columns exist
    console.log('🔍 Verifying columns...');
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name LIKE 'spotify%'
      ORDER BY column_name;
    `;

    if (columns.length === 4) {
      console.log('✅ All 4 Spotify columns found:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.warn(`⚠️  Expected 4 columns, found ${columns.length}`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();

