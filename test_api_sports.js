// /tmp/test_api_sports.js
const API_KEY = process.env.API_FOOTBALL_KEY || '59e911c082567b2798d51cd4b3e0b260';

async function test() {
    // Argentina is league 128
    const res = await fetch(`https://v3.football.api-sports.io/standings?league=128&season=2024`, {
        headers: {
            'x-apisports-key': API_KEY
        }
    });
    const data = await res.json();
    console.log(JSON.stringify(data.response[0]?.league?.standings, null, 2));
}
test();
