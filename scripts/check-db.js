const postgres = require('postgres');
require('dotenv').config();

async function checkDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('🔌 Connecting to database...');
  const sql = postgres(process.env.DATABASE_URL);

  try {
    // Check if users table exists
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    console.log(`\n📊 Found ${tables.length} tables:`);
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });

    if (tables.length === 0) {
      console.log('\n⚠️  No tables found. Database might be empty.');
      console.log('💡 You may need to run the initial schema creation first.');
    }

    // Check if users table exists
    const usersTableExists = tables.some(t => t.table_name === 'users');
    
    if (usersTableExists) {
      console.log('\n✅ Users table exists. Checking columns...');
      const columns = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users'
        ORDER BY ordinal_position;
      `;
      
      console.log(`\n📋 Users table has ${columns.length} columns:`);
      columns.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });

      const spotifyColumns = columns.filter(c => c.column_name.startsWith('spotify'));
      if (spotifyColumns.length > 0) {
        console.log(`\n✅ Found ${spotifyColumns.length} Spotify columns:`);
        spotifyColumns.forEach(col => {
          console.log(`   - ${col.column_name}`);
        });
      } else {
        console.log('\n⚠️  No Spotify columns found. Migration needed.');
      }
    } else {
      console.log('\n❌ Users table does not exist.');
      console.log('💡 You need to create the database schema first.');
      console.log('   Run: npm run db:push (or create tables manually)');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

checkDatabase();

