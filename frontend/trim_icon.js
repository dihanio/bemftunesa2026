const sharp = require('sharp');

async function trimIcon() {
  try {
    console.log('Trimming icon.png...');
    await sharp('app/icon.png')
      .trim()
      .toFile('app/icon_trimmed.png');
    console.log('Successfully trimmed icon to icon_trimmed.png');
  } catch (err) {
    console.error('Error trimming icon:', err);
  }
}

trimIcon();
