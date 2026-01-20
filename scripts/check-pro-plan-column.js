const postgres = require('postgres');
require('dotenv').config();

async function checkProPlanColumn() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('🔌 Connecting to database...');
  const sql = postgres(process.env.DATABASE_URL);

  try {
    console.log('🔍 Checking if pro_plan column exists...');
    
    const columns = await sql`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'pro_plan';
    `;

    if (columns.length === 0) {
      console.log('❌ Column pro_plan does NOT exist in users table');
      console.log('\n📝 You need to add the column first. Run this SQL:');
      console.log('\n   ALTER TABLE users ADD COLUMN pro_plan BOOLEAN DEFAULT FALSE NOT NULL;');
      console.log('\n   Or run: npm run db:activate-pro-plan (it will add the column if missing)');
    } else {
      console.log('✅ Column pro_plan exists!');
      console.log('\n📊 Column details:');
      columns.forEach(col => {
        console.log(`   - Name: ${col.column_name}`);
        console.log(`   - Type: ${col.data_type}`);
        console.log(`   - Default: ${col.column_default}`);
        console.log(`   - Nullable: ${col.is_nullable}`);
      });

      // Check current Pro Plan status
      console.log('\n📊 Current Pro Plan statistics:');
      const stats = await sql`
        SELECT 
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE pro_plan = true) as pro_plan_users,
          COUNT(*) FILTER (WHERE pro_plan = false) as free_plan_users
        FROM users;
      `;

      if (stats.length > 0) {
        const stat = stats[0];
        console.log(`   Total users: ${stat.total_users}`);
        console.log(`   Pro Plan users: ${stat.pro_plan_users}`);
        console.log(`   Free Plan users: ${stat.free_plan_users}`);
        
        if (stat.pro_plan_users === 0) {
          console.log('\n💡 To activate Pro Plan for all users, run:');
          console.log('   npm run db:activate-pro-plan');
        }
      }
    }

  } catch (error) {
    console.error('❌ Error checking column:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

checkProPlanColumn();
