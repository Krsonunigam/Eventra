require('dotenv').config();
const User = require('../models/User');

async function normalizeFaceImages() {
  const users = await User.find({ faceImages: { $exists: true } });
  let updated = 0;

  for (const user of users) {
    if (!Array.isArray(user.faceImages)) continue;

    const normalized = user.faceImages
      .filter(Boolean)
      .map((item) => {
        if (typeof item === 'string') return { url: item, public_id: '' };
        return item;
      });

    if (JSON.stringify(normalized) !== JSON.stringify(user.faceImages)) {
      user.faceImages = normalized;
      user.faceSampleCount = Math.max(user.faceSampleCount || 0, normalized.length);
      await user.save();
      updated += 1;
    }
  }

  console.log(`Normalized face images for ${updated} users.`);
}

normalizeFaceImages().catch((error) => {
  console.error('Face image normalization failed:', error);
  process.exit(1);
});
