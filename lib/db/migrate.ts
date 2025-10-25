import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import { sql } from 'drizzle-orm';
import { db } from './index';

const MIGRATIONS_FOLDER = './lib/db/migrations';

async function ensureBaselineMigrations() {
  const migrations = readMigrationFiles({ migrationsFolder: MIGRATIONS_FOLDER });

  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS "drizzle"`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `);

  const countResult = (await db.execute(sql`SELECT COUNT(*)::text AS count FROM "drizzle"."__drizzle_migrations"`)) as Array<{ count: string }>;
  const baselineCount = Number(countResult[0]?.count ?? "0");

  if (baselineCount > 0) {
    return;
  }

  const tableCheck = (await db.execute(sql`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'file_metadata'
    ) AS table_exists
  `)) as Array<{ table_exists: boolean }>;

  if (!tableCheck[0]?.table_exists) {
    return;
  }

  const passwordColumnCheck = (await db.execute(sql`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'file_metadata'
        AND column_name = 'password_hash'
    ) AS has_password
  `)) as Array<{ has_password: boolean }>;

  const has_password = Boolean(passwordColumnCheck[0]?.has_password);

  const baselineMigrations = migrations.filter((migration) => {
    const dropsPasswordColumn = migration.sql.some((statement) =>
      statement.toLowerCase().includes('drop column "password_hash"')
    );
    return has_password ? !dropsPasswordColumn : true;
  });

  if (baselineMigrations.length === 0) {
    return;
  }

  for (const migration of baselineMigrations) {
    await db.execute(sql`
      INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
      VALUES (${migration.hash}, ${migration.folderMillis})
    `);
  }
}

async function runMigrations() {
  console.log('🔄 Memulai proses migrasi database...');

  try {
    await ensureBaselineMigrations();
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
    console.log('✅ Migrasi berhasil dijalankan!');
  } catch (error) {
    console.error('❌ Error saat menjalankan migrasi:', error);
    throw error;
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('🎉 Migrasi selesai!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migrasi gagal:', error);
      process.exit(1);
    });
}

export { runMigrations };