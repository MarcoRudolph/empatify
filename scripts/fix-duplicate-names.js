const postgres = require('postgres');
require('dotenv').config();

async function fixDuplicateNames() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('🔌 Connecting to database...');
  const sql = postgres(process.env.DATABASE_URL);

  try {
    const duplicates = await sql`
      SELECT id, name, email, created_at 
      FROM users 
      WHERE name = 'marcorudolph09'
      ORDER BY created_at DESC;
    `;

    if (duplicates.length <= 1) {
      console.log('✅ No duplicates found for "marcorudolph09".');
      return;
    }

    console.log(`\n⚠️ Found ${duplicates.length} users with name "marcorudolph09":`);
    duplicates.forEach((user, index) => {
      console.log(`${index === 0 ? '✨ KEEP' : '🔄 RENAME'}: ${user.id} | ${user.email} | Created: ${user.created_at}`);
    });

    // Rename all but the first (newest) one
    for (let i = 1; i < duplicates.length; i++) {
      const user = duplicates[i];
      const newName = `${user.name}_${user.id.substring(0, 8)}`;
      console.log(`🛠️ Renaming ${user.id} to "${newName}"...`);
      
      await sql`
        UPDATE users 
        SET name = ${newName} 
        WHERE id = ${user.id};
      `;
    }

    console.log('\n✅ All duplicates renamed successfully.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

fixDuplicateNames();
