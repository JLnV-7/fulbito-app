const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vedoanybvpwjmcalkpmi.supabase.co';
const supabaseKey = 'sb_publishable_rFu9FE2av7GQD42qtLnqwQ_yCF1P7Y2';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPuntuacionesSchema() {
    console.log('Checking puntuaciones_prode structure...');

    const { data, error } = await supabase
        .from('puntuaciones_prode')
        .select('*, partido:partidos(*), pronostico:pronosticos(*)')
        .limit(1);

    if (error) {
        console.error('Error fetching puntuaciones:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Puntuacion keys:', Object.keys(data[0]));
        console.log('Sample puntuacion:', data[0]);
    } else {
        console.log('No puntuaciones found (probably no matches finished yet).');
    }
}

checkPuntuacionesSchema();
