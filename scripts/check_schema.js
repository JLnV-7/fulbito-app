const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vedoanybvpwjmcalkpmi.supabase.co';
const supabaseKey = 'sb_publishable_rFu9FE2av7GQD42qtLnqwQ_yCF1P7Y2';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking matches structure...');

    const { data, error } = await supabase
        .from('partidos')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching matches:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Match keys:', Object.keys(data[0]));
        console.log('Sample match:', data[0]);
    } else {
        console.log('No matches found to check schema.');
    }
}

checkSchema();
