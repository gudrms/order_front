const { execSync } = require('child_process');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\x1b[36m%s\x1b[0m', '=== Support Data Pull Script ===');
console.log('This script will pull data from your Production DB and save it to supabase/seed.sql');
console.log('WARNING: This will overwrite your local local seed data.');
console.log('');

const askUrl = () => {
    rl.question('Enter your Production DB Connection String (postgres://...): ', (dbUrl) => {
        if (!dbUrl) {
            console.log('Error: URL is required.');
            askUrl();
            return;
        }

        try {
            console.log('\nPulling data... (This may take a while depending on DB size)');
            // Using npx supabase db dump
            // --data-only: We only want data, schema is synced via migration files usually, 
            // but for simple setup, data-only on top of schema is fine.
            const cmd = `npx supabase db dump --db-url "${dbUrl}" --data-only > supabase/seed.sql`;
            execSync(cmd, { stdio: 'inherit' });
            
            console.log('\x1b[32m%s\x1b[0m', '\n✅ Success! Data saved to supabase/seed.sql');
            console.log('Next step: Run "npm run supa:stop" and "npm run supa:start" to apply changes.');
        } catch (error) {
            console.error('\x1b[31m%s\x1b[0m', '\n❌ Failed to pull data. Check your connection string.');
        } finally {
            rl.close();
        }
    });
};

askUrl();
