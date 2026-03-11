// /tmp/test_fd.js
const API_KEY = process.env.FOOTBALL_DATA_TOKEN;
const BASE_URL = 'https://api.football-data.org/v4';

async function test() {
    const res = await fetch(`${BASE_URL}/competitions/ASL/standings`, {
        headers: { 'X-Auth-Token': API_KEY }
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}
test();
