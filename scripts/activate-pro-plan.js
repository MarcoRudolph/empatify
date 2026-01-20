const postgres = require('postgres');
require('dotenv').config();

async function activateProPlanForAll() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('🔌 Connecting to database...');
  const sql = postgres(process.env.DATABASE_URL);

  try {
    // First check if column exists
    console.log('🔍 Checking if pro_plan column exists...');
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'pro_plan';
    `;

    if (columns.length === 0) {
      console.log('📝 Column pro_plan does not exist. Creating it...');
      await sql`
        ALTER TABLE users 
        ADD COLUMN pro_plan BOOLEAN DEFAULT FALSE NOT NULL;
      `;
      console.log('✅ Column pro_plan created!');
    } else {
      console.log('✅ Column pro_plan already exists');
    }

    console.log('📝 Activating Pro Plan for all users...');
    
    const result = await sql`
      UPDATE users
      SET pro_plan = true
      WHERE pro_plan = false OR pro_plan IS NULL;
    `;

    console.log(`✅ Updated ${result.count} user(s) to Pro Plan`);

    // Verify the update
    console.log('🔍 Verifying update...');
    const stats = await sql`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE pro_plan = true) as pro_plan_users,
        COUNT(*) FILTER (WHERE pro_plan = false) as free_plan_users
      FROM users;
    `;

    if (stats.length > 0) {
      const stat = stats[0];
      console.log('\n📊 User Statistics:');
      console.log(`   Total users: ${stat.total_users}`);
      console.log(`   Pro Plan users: ${stat.pro_plan_users}`);
      console.log(`   Free Plan users: ${stat.free_plan_users}`);
    }

    console.log('\n✅ Pro Plan activation completed successfully!');
    console.log('⚠️  Note: This is for testing purposes only.');

  } catch (error) {
    console.error('❌ Failed to activate Pro Plan:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

activateProPlanForAll();
