// scripts/test_api_football.js
const https = require('https');

const API_KEY = 'f5b26d9993569070de3e2f5e12ade21c';
const LEAGUE_ID = 128; // Liga Profesional
const SEASON = 2024; // Probamos 2024 que seguro tiene datos

const options = {
    hostname: 'v3.football.api-sports.io',
    path: `/standings?league=${LEAGUE_ID}&season=${SEASON}`,
    method: 'GET',
    headers: {
        'x-apisports-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io'
    }
};

const req = https.request(options, (res) => {
    let data = '';

    console.log(`Status Code: ${res.statusCode}`);

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            if (parsed.errors && Object.keys(parsed.errors).length > 0) {
                console.error('API Errors:', parsed.errors);
            } else {
                console.log('Response OK. Results:', parsed.results);
                if (parsed.response && parsed.response.length > 0) {
                    console.log('League:', parsed.response[0].league.name);
                    console.log('Standings found:', parsed.response[0].league.standings[0].length);
                } else {
                    console.log('No standings found for this league/season');
                }
            }
        } catch (e) {
            console.error('Error parsing JSON:', e);
        }
    });
});

req.on('error', (error) => {
    console.error('Request Error:', error);
});

req.end();
