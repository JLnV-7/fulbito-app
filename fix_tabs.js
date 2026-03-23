const fs = require('fs');
const http = require('https');
const path = './frontend/src/components/grupos/MatchDetailTabs.tsx';

http.get('https://raw.githubusercontent.com/JLnV-7/fulbito-app/refs/heads/main/frontend/src/components/grupos/MatchDetailTabs.tsx', (res) => {
  let raw = '';
  res.on('data', d => raw += d);
  res.on('end', () => {
    // 1. Import
    if (!raw.includes("import { RankingEnVivo }")) {
      raw = raw.replace(
        "import { DetalleJugadorAmigo } from './DetalleJugadorAmigo'",
        "import { DetalleJugadorAmigo } from './DetalleJugadorAmigo'\nimport { RankingEnVivo } from './RankingEnVivo'"
      );
    }
    
    // 2. Element
    const block = `{/* Ranking en vivo */}
<div>
    <h3 className="font-black italic uppercase tracking-tighter text-sm mb-4">📊 Ranking acumulado</h3>
    <RankingEnVivo jugadores={jugadores} totalMiembros={partido.total_miembros || 0} />
</div>
<div className="border-t border-[var(--card-border)]" />`;

    if (!raw.includes("Ranking acumulado")) {
      raw = raw.replace(
        "{/* Lista de Jugadores para Votar */}",
        `${block}\n\n                                        {/* Lista de Jugadores para Votar */}`
      );
    }
    
    // 3. Score
    // First occurrence (azul)
    raw = raw.replace(
      "jugadores.filter(j => j.equipo === 'azul').reduce((acc, j) => acc + Number(j.goles || 0), 0)",
      "partido.resultado_azul ?? jugadores.filter(j => j.equipo === 'azul').reduce((acc, j) => acc + Number(j.goles || 0), 0)"
    );
    // Second occurrence (rojo)
    raw = raw.replace(
      "jugadores.filter(j => j.equipo === 'rojo').reduce((acc, j) => acc + Number(j.goles || 0), 0)",
      "partido.resultado_rojo ?? jugadores.filter(j => j.equipo === 'rojo').reduce((acc, j) => acc + Number(j.goles || 0), 0)"
    );

    // Some extra space to ensure the file diffs if it was already updated
    raw += "\n// Fix applied\n";

    fs.writeFileSync(path, raw);
    console.log("Done");
  });
});
