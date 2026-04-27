const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

const HEADER = `-- ============================================================================
-- FEMTECH HR MANAGEMENT SYSTEM - CONSOLIDATED DATABASE MIGRATIONS
-- ============================================================================
-- This file contains all migrations combined for faster setup
-- Run this ONCE during initial setup (fresh database)
-- ============================================================================

`;

function isSqlFile(fileName) {
  return fileName.toLowerCase().endsWith('.sql');
}

function isConsolidatedFile(fileName) {
  const lower = fileName.toLowerCase();
  return lower === '000_all_migrations.sql' || lower === '000_migrain.sql';
}

function buildSection(fileName, sql) {
  return [
    '',
    '-- ============================================================================',
    `-- Migration: ${fileName}`,
    '-- ============================================================================',
    '',
    sql.trimEnd(),
    '',
  ].join('\n');
}

function main() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    throw new Error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
  }

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => isSqlFile(f) && !isConsolidatedFile(f))
    .sort((a, b) => a.localeCompare(b, 'en'));

  const parts = [HEADER];

  for (const file of files) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    parts.push(buildSection(file, sql));
  }

  const consolidated = parts.join('\n');

  const targetPath = path.join(MIGRATIONS_DIR, '000_all_migrations.sql');
  fs.writeFileSync(targetPath, consolidated, 'utf8');
  process.stdout.write(`Wrote ${targetPath}\n`);
}

main();
