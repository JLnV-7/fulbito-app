const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svgPath = path.join(__dirname, 'public', 'icons', 'icon.svg');
const outputDir = path.join(__dirname, 'public', 'icons');

const sizes = [
    { size: 192, name: 'icon-192.png' },
    { size: 512, name: 'icon-512.png' }
];

async function generateIcons() {
    try {
        const svgBuffer = fs.readFileSync(svgPath);

        for (const { size, name } of sizes) {
            const outputPath = path.join(outputDir, name);

            await sharp(svgBuffer)
                .resize(size, size)
                .png()
                .toFile(outputPath);

            console.log(`✅ Generated ${name} (${size}x${size})`);
        }

        console.log('\n🎉 All icons generated successfully!');
    } catch (error) {
        console.error('❌ Error generating icons:', error);
        process.exit(1);
    }
}

generateIcons();
