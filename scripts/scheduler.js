import cron from 'node-cron';
import { backupDatabase } from './backup.js';

console.log('⏰ Database Backup Scheduler Started!');
console.log('설정된 스케줄: 매주 일요일 자정 (00:00)');
console.log('프로그램을 종료하려면 Ctrl+C 를 누르세요.\n');

// 0 0 * * 0 = 매주 일요일 0시 0분
cron.schedule('0 0 * * 0', async () => {
  console.log(`[${new Date().toLocaleString()}] 스케줄된 백업 작업을 시작합니다...`);
  await backupDatabase();
});

// 시작할 때 즉시 한 번 실행하고 싶다면 아래 주석을 해제하세요.
// backupDatabase();
