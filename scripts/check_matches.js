const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vedoanybvpwjmcalkpmi.supabase.co';
const supabaseKey = 'sb_publishable_rFu9FE2av7GQD42qtLnqwQ_yCF1P7Y2';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMatches() {
    console.log('Checking matches...');

    const { data: matches, error } = await supabase
        .from('partidos')
        .select('*')
        .order('fecha_inicio', { ascending: false });

    if (error) {
        console.error('Error fetching matches:', error);
        return;
    }

    console.log(`Found ${matches.length} matches.`);

    const now = new Date();
    console.log('Current time:', now.toISOString());

    const upcoming = matches.filter(m => {
        const matchDate = new Date(m.fecha_inicio);
        return matchDate > now || m.estado === 'PREVIA';
    });

    console.log(`Upcoming matches (candidate for PRODE): ${upcoming.length}`);

    if (upcoming.length === 0) {
        console.log('No upcoming matches found!');
        if (matches.length > 0) {
            console.log('Most recent match:', matches[0].fecha_inicio, matches[0].estado);
        }
    } else {
        console.log('Sample upcoming match:', upcoming[0]);
    }
}

checkMatches();
