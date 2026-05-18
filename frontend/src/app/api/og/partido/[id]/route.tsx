import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Font handling could be added here if needed, but standard sans-serif is fine for now
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Fallback info if we don't fetch from DB
    const id = (await params).id;
    const local = searchParams.get('local') || 'Local';
    const visitante = searchParams.get('visitante') || 'Visitante';
    const golesL = searchParams.get('gl') || '-';
    const golesV = searchParams.get('gv') || '-';
    const logoL = searchParams.get('logoL');
    const logoV = searchParams.get('logoV');
    const status = searchParams.get('status') || 'FINALIZADO';
    
    // Community rating
    const rating = searchParams.get('rating') || '?';
    const isPlayed = status === 'FINALIZADO';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0a0a',
            backgroundImage: 'radial-gradient(circle at center, #1a1a1a 0%, #000000 100%)',
            fontFamily: 'sans-serif',
            color: 'white',
          }}
        >
          {/* Header */}
          <div style={{
            position: 'absolute',
            top: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '8px 24px',
              borderRadius: '100px',
              fontSize: 24,
              fontWeight: 'bold',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>
              FutLog ⚽
            </div>
          </div>

          {/* Teams and Score */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            padding: '0 80px',
            marginTop: 40,
          }}>
            {/* Local */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%' }}>
              {logoL ? (
                <img src={logoL} alt="Local" width="160" height="160" style={{ objectFit: 'contain' }} />
              ) : (
                <div style={{ width: 160, height: 160, borderRadius: 80, background: '#333' }} />
              )}
              <div style={{ marginTop: 24, fontSize: 36, fontWeight: 800, textAlign: 'center' }}>
                {local}
              </div>
            </div>

            {/* Score */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40%' }}>
              {isPlayed ? (
                <div style={{ display: 'flex', alignItems: 'center', fontSize: 100, fontWeight: 900 }}>
                  <span style={{ color: 'white' }}>{golesL}</span>
                  <span style={{ color: '#555', margin: '0 20px' }}>-</span>
                  <span style={{ color: 'white' }}>{golesV}</span>
                </div>
              ) : (
                <div style={{ fontSize: 48, fontWeight: 800, color: '#888' }}>
                  VS
                </div>
              )}
              <div style={{ 
                marginTop: 16, 
                fontSize: 20, 
                color: isPlayed ? '#888' : '#6366f1',
                textTransform: 'uppercase',
                fontWeight: 700,
                letterSpacing: '0.1em'
              }}>
                {status}
              </div>
            </div>

            {/* Visitante */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%' }}>
              {logoV ? (
                <img src={logoV} alt="Visitante" width="160" height="160" style={{ objectFit: 'contain' }} />
              ) : (
                <div style={{ width: 160, height: 160, borderRadius: 80, background: '#333' }} />
              )}
              <div style={{ marginTop: 24, fontSize: 36, fontWeight: 800, textAlign: 'center' }}>
                {visitante}
              </div>
            </div>
          </div>

          {/* Rating Badge */}
          {isPlayed && rating !== '?' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: 80,
              background: '#f59e0b',
              padding: '16px 40px',
              borderRadius: 100,
              boxShadow: '0 0 40px rgba(245, 158, 11, 0.3)',
            }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'black', marginRight: 16 }}>
                NOTA COMUNIDAD
              </div>
              <div style={{ fontSize: 48, fontWeight: 900, color: 'black' }}>
                ⭐ {rating}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{
            position: 'absolute',
            bottom: 40,
            fontSize: 24,
            color: '#666',
            fontWeight: 600,
          }}>
            futlog.app/partido/{id}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate image`, {
      status: 500,
    });
  }
}
