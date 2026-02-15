// scripts/find_leagues_2025.js
const https = require('https');

const API_KEY = 'f5b26d9993569070de3e2f5e12ade21c';

// Argentina Country Code or Search
const options = {
    hostname: 'v3.football.api-sports.io',
    path: '/leagues?country=Argentina&season=2025',
    method: 'GET',
    headers: {
        'x-apisports-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io'
    }
};

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            if (parsed.errors && Object.keys(parsed.errors).length > 0) {
                console.error('API Errors:', parsed.errors);
            } else {
                console.log(`Found ${parsed.results} leagues for Argentina in 2025:`);
                parsed.response.forEach(item => {
                    console.log(`- ID: ${item.league.id} | Name: ${item.league.name} | Type: ${item.league.type}`);
                    if (item.seasons[0].coverage.standings) {
                        console.log('  -> Has Standings: YES');
                    } else {
                        console.log('  -> Has Standings: NO');
                    }
                });
            }
        } catch (e) {
            console.error('Error parsing JSON:', e);
        }
    });
});

req.end();
