// /tmp/test_fd_production.js
const fs = require('fs');
const env = fs.readFileSync('.env.vercel', 'utf8');
const tokenMatch = env.match(/FOOTBALL_DATA_TOKEN="?([^"\n]+)/);
const token = tokenMatch ? tokenMatch[1] : process.env.FOOTBALL_DATA_TOKEN;

async function test() {
    const res = await fetch('https://api.football-data.org/v4/competitions/ASL/standings', {
        headers: { 'X-Auth-Token': token }
    });
    const data = await res.json();
    console.log(JSON.stringify(data.standings, null, 2));
}
test();
