const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vedoanybvpwjmcalkpmi.supabase.co';
const supabaseKey = 'sb_publishable_rFu9FE2av7GQD42qtLnqwQ_yCF1P7Y2';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateMatches() {
    console.log('Fetching matches to update...');

    // Get 3 matches
    const { data: matches, error } = await supabase
        .from('partidos')
        .select('*')
        .limit(3);

    if (error) {
        console.error('Error fetching matches:', error);
        return;
    }

    console.log(`Found ${matches.length} matches to update.`);

    const now = new Date();

    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];

        // Set date to tomorrow + i days
        const newDate = new Date(now);
        newDate.setDate(now.getDate() + 1 + i);
        newDate.setHours(20, 0, 0, 0); // 20:00 hs

        const { error: updateError } = await supabase
            .from('partidos')
            .update({
                fecha_inicio: newDate.toISOString(),
                estado: 'PREVIA',
                goles_local: null,
                goles_visitante: null
            })
            .eq('id', match.id);

        if (updateError) {
            console.error(`Error updating match ${match.id}:`, updateError);
        } else {
            console.log(`Updated match ${match.id} (${match.equipo_local} vs ${match.equipo_visitante}) to ${newDate.toISOString()}`);
        }
    }

    console.log('Update complete!');
}

updateMatches();
