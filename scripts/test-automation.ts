import { createClient } from '@supabase/supabase-js'

// El archivo .env.local se cargará con el flag --env-file al ejecutar

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Falta configuración de Supabase. Asegurate de tener .env.local con las variables.')
    process.exit(1)
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testCronLogic() {
    console.log('🧪 Iniciando prueba de automatización de puntos...')

    // 1. Crear un partido de prueba "FINALIZADO" pero sin fixture_id
    const partidoTest = {
        liga: 'Liga Profesional',
        equipo_local: 'Test Local',
        equipo_visitante: 'Test Visitante',
        fecha_inicio: new Date().toISOString(),
        estado: 'EN_JUEGO', // Simulamos que se está jugando
        goles_local: 0,
        goles_visitante: 0,
        fixture_id: 123456 // ID ficticio
    }

    // Insertar partido
    const { data: partido, error: insertError } = await supabase
        .from('partidos')
        .insert(partidoTest)
        .select()
        .single()

    if (insertError) {
        console.error('❌ Error creando partido de prueba:', insertError)
        return
    }

    console.log(`✅ Partido de prueba creado: ${partido.id} (Fixture ID: ${partido.fixture_id})`)

    // 2. Crear un pronóstico para este partido
    const { data: user } = await supabase.auth.getUser() // Este script corre como admin, necesitamos un user ID real o mock
    // Para simplificar, asumimos que existe algún usuario o creamos un pronostico con un ID fijo si la FK lo permite, 
    // pero idealmente deberíamos tener un usuario.
    // Vamos a listar usuarios y usar el primero
    const { data: users } = await supabase.auth.admin.listUsers()

    if (users && users.users.length > 0) {
        const userId = users.users[0].id
        const pronostico = {
            user_id: userId,
            partido_id: partido.id,
            goles_local_pronostico: 2,
            goles_visitante_pronostico: 1,
            bloqueado: false
        }

        const { error: pronoError } = await supabase
            .from('pronosticos')
            .insert(pronostico)

        if (pronoError) {
            console.error('⚠️ Error creando pronóstico:', pronoError)
        } else {
            console.log(`✅ Pronóstico creado para usuario ${userId}`)
        }
    } else {
        console.warn('⚠️ No hay usuarios para crear pronósticos.')
    }


    // 3. Simular actualización (lo que haría el cron)
    console.log('🔄 Simulando actualización de resultado (Cron Job)...')

    // Forzamos update a FINALIZADO con resultado 2-1 (Exacto para el pronóstico)
    const { error: updateError } = await supabase
        .from('partidos')
        .update({
            estado: 'FINALIZADO',
            goles_local: 2,
            goles_visitante: 1
        })
        .eq('id', partido.id)

    if (updateError) {
        console.error('❌ Error actualizando partido:', updateError)
        return
    }

    console.log('✅ Partido finalizado. El trigger debería haber calculado los puntos.')

    // 4. Verificar puntos
    // Esperamos un momento para que el trigger corra
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (users && users.users.length > 0) {
        const userId = users.users[0].id
        const { data: puntuacion, error: scoreError } = await supabase
            .from('puntuaciones_prode')
            .select('*')
            .eq('user_id', userId)
            .eq('partido_id', partido.id)
            .single()

        if (scoreError) {
            console.log('❌ No se encontró puntuación (El trigger falló?):', scoreError)
        } else {
            console.log('🎉 Puntuación generada:', puntuacion)
            if (puntuacion.puntos === 8) {
                console.log('✅ CÁLCULO CORRECTO: 8 puntos (Resultado Exacto)')
            } else {
                console.log(`⚠️ Puntos inesperados: ${puntuacion.puntos} (Esperado: 8)`)
            }

            // 4b. Verificar Ranking y Join con Perfiles
            console.log('📊 Verificando actualización de Ranking y Join con Profiles...')
            await new Promise(resolve => setTimeout(resolve, 500))

            const { data: ranking, error: rankError } = await supabase
                .from('ranking_prode')
                .select(`
                    *,
                    profile:profiles(*)
                `)
                .eq('user_id', userId)
                .eq('liga', 'Liga Profesional')
                .single()

            if (rankError) {
                console.log('❌ Error o sin datos en ranking (Trigger falló o Join incorrecto):', rankError)
            } else {
                console.log('🏆 Ranking actualizado:', ranking)
                if (ranking.puntos_totales >= 8) {
                    console.log('✅ RANKING ACTUALIZADO CORRECTAMENTE')
                }

                if (ranking.profile) {
                    console.log('✅ JOIN CON PROFILE OK')
                } else {
                    console.log('⚠️ Warning: Profile es null (Posible error de FK)')
                }
            }
        }
    }

    // 5. Limpieza
    console.log('🧹 Limpiando datos de prueba...')
    await supabase.from('pronosticos').delete().eq('partido_id', partido.id) // Cascada deberia borrar puntuaciones
    await supabase.from('partidos').delete().eq('id', partido.id)
    console.log('✨ Test finalizado.')
}

testCronLogic()
