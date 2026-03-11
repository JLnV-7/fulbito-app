export const TEAM_SHIELDS: Record<string, string> = {
    'River Plate': 'https://media.api-sports.io/football/teams/435.png',
    'Boca Juniors': 'https://media.api-sports.io/football/teams/451.png',
    'Racing Club': 'https://media.api-sports.io/football/teams/436.png',
    'Independiente': 'https://media.api-sports.io/football/teams/438.png',
    'San Lorenzo': 'https://media.api-sports.io/football/teams/446.png',
    'Godoy Cruz': 'https://media.api-sports.io/football/teams/450.png',
    'Talleres': 'https://media.api-sports.io/football/teams/439.png',
    'Belgrano': 'https://media.api-sports.io/football/teams/440.png',
    'Estudiantes': 'https://media.api-sports.io/football/teams/444.png',
    'Vélez Sarsfield': 'https://media.api-sports.io/football/teams/448.png',
    'Rosario Central': 'https://media.api-sports.io/football/teams/449.png',
    'Newell\'s Old Boys': 'https://media.api-sports.io/football/teams/445.png',
    'Argentinos Juniors': 'https://media.api-sports.io/football/teams/434.png',
    'Lanús': 'https://media.api-sports.io/football/teams/441.png',
    'Banfield': 'https://media.api-sports.io/football/teams/443.png',
    'Huracán': 'https://media.api-sports.io/football/teams/442.png',
    'Defensa y Justicia': 'https://media.api-sports.io/football/teams/447.png',
    'Real Madrid': 'https://media.api-sports.io/football/teams/541.png',
    'Barcelona': 'https://media.api-sports.io/football/teams/529.png',
    'Manchester City': 'https://media.api-sports.io/football/teams/50.png',
    'Liverpool': 'https://media.api-sports.io/football/teams/40.png',
    'Arsenal': 'https://media.api-sports.io/football/teams/42.png',
    'Manchester United': 'https://media.api-sports.io/football/teams/33.png',
    'Chelsea': 'https://media.api-sports.io/football/teams/49.png',
    'PSG': 'https://media.api-sports.io/football/teams/85.png',
    'Bayern Munich': 'https://media.api-sports.io/football/teams/157.png',
    'Inter Miami': 'https://media.api-sports.io/football/teams/253.png',
    'Juventus': 'https://media.api-sports.io/football/teams/496.png',
    'Inter': 'https://media.api-sports.io/football/teams/505.png',
    'Milan': 'https://media.api-sports.io/football/teams/489.png',
    'Flamengo': 'https://media.api-sports.io/football/teams/127.png',
    'Palmeiras': 'https://media.api-sports.io/football/teams/121.png',
};

// Normalized name lookup to handle 'River' vs 'River Plate'
export function getShieldForTeam(teamName: string, fallbackSrc?: string): string | undefined {
    if (!teamName) return fallbackSrc;

    // Exact match
    if (TEAM_SHIELDS[teamName]) return TEAM_SHIELDS[teamName];

    // Fuzzy match
    const lowerName = teamName.toLowerCase().trim();

    // SPECIAL CASE: Disambiguate Arsenal (London) from Arsenal de Sarandí
    const isSarandi = lowerName.includes('sarandi') || lowerName.includes('sarandí');

    const match = Object.keys(TEAM_SHIELDS).find(k => {
        const lowerK = k.toLowerCase();
        // If it's Sarandi, don't match with "Arsenal" (London)
        if (isSarandi && lowerK === 'arsenal') return false;
        return lowerK.includes(lowerName) || lowerName.includes(lowerK);
    });

    if (match) return TEAM_SHIELDS[match];

    // Ensure we don't accidentally return Arsenal de Sarandi (API-Football ID 453 or 437)
    if (fallbackSrc) {
        if (isSarandi || fallbackSrc.includes('453') || fallbackSrc.includes('437')) {
            return undefined; // Block the phantom arsenal shield
        }
        return fallbackSrc;
    }

    return undefined;
}
