const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vedoanybvpwjmcalkpmi.supabase.co';
const supabaseKey = 'sb_publishable_rFu9FE2av7GQD42qtLnqwQ_yCF1P7Y2';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfilesSchema() {
    console.log('Checking profiles structure...');

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Profile keys:', Object.keys(data[0]));
        console.log('Sample profile:', data[0]);
    } else {
        console.log('No profiles found.');
    }
}

checkProfilesSchema();
