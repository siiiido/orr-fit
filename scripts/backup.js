import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

// Load .env file
dotenv.config();

const { Client } = pg;

// Helper to get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function backupDatabase() {
  console.log('🚀 Starting local JSON database backup...');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const dbPassword = process.env.VITE_SUPABASE_DATABASE_PASSWORD;
  
  if (!supabaseUrl || !dbPassword) {
    console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_DATABASE_PASSWORD in .env');
    return;
  }

  // Extract the project ref from the URL
  const projectRef = supabaseUrl.split('//')[1].split('.')[0];
  
  // Use SUPABASE_DB_URL if provided, else fallback to direct IPv6 endpoint
  const connectionString = process.env.SUPABASE_DB_URL || `postgresql://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres`;
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log(`📡 Connecting to the database...`);
    await client.connect();
    
    // Get all tables in the public schema
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    `;
    const tablesRes = await client.query(tablesQuery);
    const tables = tablesRes.rows.map(r => r.table_name);
    
    if (tables.length === 0) {
      console.log('⚠️ No tables found in the public schema.');
      return;
    }
    
    console.log(`📋 Found ${tables.length} tables: ${tables.join(', ')}`);
    
    // Create backup directory
    const dateStr = new Date().toISOString().split('T')[0];
    const backupDir = path.join(__dirname, '..', 'backups', dateStr);
    await fs.mkdir(backupDir, { recursive: true });
    
    console.log(`📁 Saving backups to ${backupDir}`);
    
    // Fetch and save data for each table
    for (const table of tables) {
      console.log(`⏳ Exporting table: ${table}...`);
      const dataRes = await client.query(`SELECT * FROM "${table}"`);
      const data = dataRes.rows;
      
      const filePath = path.join(backupDir, `${table}.json`);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`✅ Saved ${data.length} rows to ${table}.json`);
    }
    
    console.log('🎉 All backups completed successfully!\n');
    
  } catch (err) {
    console.error('❌ Backup failed:', err.message);
    if (err.message.includes('ENOTFOUND') || err.message.includes('ETIMEDOUT') || err.message.includes('network is unreachable')) {
       console.log('\n💡 IPv6 연결 문제일 수 있습니다. .env 파일에 SUPABASE_DB_URL 변수를 추가하고, 이전에 말씀드린 풀러(aws-1-ap-southeast-1...) 주소를 값으로 지정해 주세요.');
    }
  } finally {
    await client.end();
  }
}

// 직접 실행되었을 때만 함수 호출 (npm run backup 용도)
if (process.argv[1] === __filename) {
  backupDatabase();
}
