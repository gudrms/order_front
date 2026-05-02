/**
 * SVG → PNG 아이콘 일괄 생성 스크립트
 * node scripts/generate-icons.mjs
 */

import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const iconsDir = join(publicDir, 'icons');

mkdirSync(iconsDir, { recursive: true });

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// librsvg는 emoji 폰트가 없을 수 있어서 텍스트 대신 path 기반 SVG 사용
const svgTemplate = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#FFD700" rx="${Math.round(size * 0.25)}"/>
  <!-- 배달 오토바이 심볼 — 단순 도형으로 표현 -->
  <g transform="translate(${size * 0.5}, ${size * 0.5}) scale(${size / 512})">
    <!-- 몸체 -->
    <ellipse cx="0" cy="20" rx="110" ry="50" fill="#000"/>
    <!-- 앞바퀴 -->
    <circle cx="120" cy="90" r="55" fill="none" stroke="#000" stroke-width="24"/>
    <circle cx="120" cy="90" r="12" fill="#000"/>
    <!-- 뒷바퀴 -->
    <circle cx="-120" cy="90" r="55" fill="none" stroke="#000" stroke-width="24"/>
    <circle cx="-120" cy="90" r="12" fill="#000"/>
    <!-- 핸들 -->
    <rect x="60" y="-60" width="80" height="20" rx="10" fill="#000" transform="rotate(-20, 60, -60)"/>
    <!-- 배달통 -->
    <rect x="-140" y="-80" width="80" height="70" rx="10" fill="#222"/>
    <rect x="-130" y="-70" width="60" height="50" rx="6" fill="#FFD700"/>
  </g>
</svg>`;

async function generateIcons() {
    console.log('📦 아이콘 생성 시작...\n');

    for (const size of sizes) {
        const svgBuffer = Buffer.from(svgTemplate(size));
        const outputPath = join(iconsDir, `icon-${size}x${size}.png`);

        await sharp(svgBuffer)
            .resize(size, size)
            .png()
            .toFile(outputPath);

        console.log(`✅ icon-${size}x${size}.png`);
    }

    // apple-touch-icon (180x180)
    const appleSvg = Buffer.from(svgTemplate(180));
    const applePath = join(publicDir, 'apple-touch-icon.png');
    await sharp(appleSvg).resize(180, 180).png().toFile(applePath);
    console.log('✅ apple-touch-icon.png');

    // favicon (32x32)
    const faviconSvg = Buffer.from(svgTemplate(32));
    const faviconPath = join(publicDir, 'favicon-32x32.png');
    await sharp(faviconSvg).resize(32, 32).png().toFile(faviconPath);
    console.log('✅ favicon-32x32.png');

    console.log(`\n🎉 완료! ${sizes.length + 2}개 파일 생성 → public/icons/`);
}

generateIcons().catch(console.error);
