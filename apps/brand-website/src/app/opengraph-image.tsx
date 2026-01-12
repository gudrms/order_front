import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const alt = 'TACO MOLE - Authentic Mexican Taste';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

// Image generation
export default function Image() {
    return new ImageResponse(
        (
            // ImageResponse JSX element
            <div
                style={{
                    fontSize: 128,
                    background: '#F5A623', // brand-yellow
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'black',
                    fontWeight: 'bold',
                }}
            >
                <div style={{ fontSize: 180, marginBottom: 40 }}>🌮</div>
                <div>TACO MOLE</div>
                <div style={{ fontSize: 48, marginTop: 20, fontWeight: 'normal' }}>Authentic Mexican Taste</div>
            </div>
        ),
        // ImageResponse options
        {
            ...size,
        }
    );
}
