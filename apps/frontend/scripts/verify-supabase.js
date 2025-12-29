const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Read .env.local manually
let envPath = path.join(__dirname, '..', '.env.local');

// Check apps/frontend/.env.local first
if (!fs.existsSync(envPath)) {
    // If not found, check root .env.local
    const rootEnvPath = path.join(__dirname, '..', '..', '..', '.env.local');
    if (fs.existsSync(rootEnvPath)) {
        console.log('⚠️  Warning: Found .env.local in ROOT, not in apps/frontend.');
        console.log('    You should move this file to apps/frontend/.env.local for the web app to work.');
        envPath = rootEnvPath;
    } else {
        console.error('❌ Error: .env.local file not found in apps/frontend OR root directory!');
        console.error('   Please create .env.local in apps/frontend with your Supabase keys.');
        process.exit(1);
    }
}

console.log('Testing connection with config at:', envPath);

try {
    // The envPath is guaranteed to exist or the process would have exited above.
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};

    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            // Remove quotes if present
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            envVars[key] = value;
        }
    });

    const url = envVars.NEXT_PUBLIC_SUPABASE_URL;
    const key = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing in .env.local');
        process.exit(1);
    }

    console.log('✅ Found URL:', url);
    console.log('✅ Found Key:', key.substring(0, 5) + '...' + key.substring(key.length - 5));

    // 2. Try to connect
    console.log('\nConnecting to Supabase...');
    const supabase = createClient(url, key);

    (async () => {
        try {
            const { data, error } = await supabase.auth.getSession();

            if (error) {
                console.error('❌ Connection Failed:', error.message);
            } else {
                console.log('✅ Connection Success! Supabase is reachable.');
                console.log('   Response:', data ? 'Session check ok' : 'No session (normal)');
            }
        } catch (err) {
            console.error('❌ Connection Error:', err.message);
            if (err.cause) console.error('   Cause:', err.cause);
        }
    })();

} catch (err) {
    console.error('❌ Script Error:', err);
}
