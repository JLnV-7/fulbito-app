const fs = require('fs');
let c = fs.readFileSync('src/app/buscar/page.tsx', 'utf8');

const startIdx = c.indexOf('<motion.button');
const endIdx = c.indexOf('</motion.button>', startIdx) + '</motion.button>'.length;

const replacement = `<motion.div
    key={user.id}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: i * 0.03 }}
    className="w-full flex items-center gap-3 p-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl hover:border-[var(--accent)]/30 transition-all text-left"
>
    <div 
        className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f59e0b] to-[#ef4444] flex flex-shrink-0 items-center justify-center text-white text-lg cursor-pointer"
        onClick={() => router.push(\`/perfil/\${user.id}\`)}
    >
        {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover rounded-full" />
        ) : (
            user.username?.charAt(0)?.toUpperCase() || '?'
        )}
    </div>
    <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate hover:underline cursor-pointer" onClick={() => router.push(\`/perfil/\${user.id}\`)}>
            {user.username || 'Usuario'}
        </div>
        {user.equipo && (
            <div className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                <span>❤️</span> {user.equipo}
            </div>
        )}
    </div>
    <div className="flex flex-col items-end gap-1">
        <FollowButton targetUserId={user.id} targetUsername={user.username || ''} />
        <span className="text-[10px] text-[var(--text-muted)] cursor-pointer hover:underline" onClick={() => router.push(\`/perfil/\${user.id}\`)}>Ver perfil →</span>
    </div>
</motion.div>`;

if (startIdx !== -1) {
    c = c.slice(0, startIdx) + replacement + c.slice(endIdx);
    fs.writeFileSync('src/app/buscar/page.tsx', c);
    console.log('Fixed successfully');
} else {
    console.error('Could not find starting tag');
}
