const https = require('https');

const options = {
    hostname: 'v3.football.api-sports.io',
    path: '/standings?league=128&season=2024',
    method: 'GET',
    headers: {
        'x-apisports-key': 'f5b26d9993569070de3e2f5e12ade21c',
        'x-rapidapi-host': 'v3.football.api-sports.io'
    }
};

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('Response:', JSON.stringify(json, null, 2));
            if (json.errors && Object.keys(json.errors).length > 0) {
                console.error('API Errors:', json.errors);
            }
        } catch (e) {
            console.error('Error parsing JSON:', e);
            console.log('Raw data:', data);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
