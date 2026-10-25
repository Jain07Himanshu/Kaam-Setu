import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.resolve(__dirname, '..');

const dbUrl = process.env.DATABASE_URL || '';
const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');

const schemaPath = path.join(serverDir, 'prisma', 'schema.prisma');
const postgresSchemaPath = path.join(serverDir, 'prisma', 'schema.postgresql.prisma');

if (isPostgres) {
  console.log('🐘 Detected PostgreSQL in DATABASE_URL.');
  if (fs.existsSync(postgresSchemaPath)) {
    fs.copyFileSync(postgresSchemaPath, schemaPath);
    console.log('✅ Synchronized prisma/schema.prisma for PostgreSQL production deployment.');
  }
} else {
  console.log('📁 Detected SQLite/Local configuration for DATABASE_URL.');
}
