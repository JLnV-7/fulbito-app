const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vedoanybvpwjmcalkpmi.supabase.co';
const supabaseKey = 'sb_publishable_rFu9FE2av7GQD42qtLnqwQ_yCF1P7Y2';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRankingJoin() {
    console.log('Checking ranking_prode join with profiles...');

    const { data, error } = await supabase
        .from('ranking_prode')
        .select(`
      *,
      profile:profiles(*)
    `)
        .limit(1);

    if (error) {
        console.error('Error fetching ranking join:', error);
        // Let's try to see if just ranking_prode works
        const { data: data2, error: error2 } = await supabase
            .from('ranking_prode')
            .select('*')
            .limit(1);

        if (error2) {
            console.error('Error fetching ranking_prode table:', error2);
        } else {
            console.log('Base table works. Issue is the join.');
            console.log('Sample ranking data:', data2[0]);
        }
        return;
    }

    console.log('Join works!');
    console.log('Sample data:', data[0]);
}

checkRankingJoin();
