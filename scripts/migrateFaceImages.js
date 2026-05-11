/**
 * scripts/migrateFaceImages.js
 *
 * One-time migration: fixes users whose faceImages field contains plain strings
 * (from the old schema) instead of { url, public_id } objects.
 *
 * Run with:  node scripts/migrateFaceImages.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌  MONGODB_URI not set in .env');
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('✅  Connected to MongoDB');

  const collection = mongoose.connection.db.collection('users');

  // Find every user whose faceImages array contains at least one plain string
  const cursor = collection.find({
    'faceImages': { $elemMatch: { $type: 'string' } }
  });

  let fixed = 0;
  let skipped = 0;

  for await (const doc of cursor) {
    const rawImages = doc.faceImages;

    if (!Array.isArray(rawImages) || rawImages.length === 0) {
      skipped++;
      continue;
    }

    // Convert strings → { url, public_id } objects.
    // We don't have public_ids for old images, so we derive one from the URL path.
    const converted = rawImages.map((img) => {
      if (typeof img === 'string') {
        // Extract public_id from Cloudinary URL: .../upload/v12345/<folder>/<filename>.ext
        let public_id = '';
        try {
          const urlParts = img.split('/upload/');
          if (urlParts.length > 1) {
            // Remove the version segment (v1234/) if present
            const afterUpload = urlParts[1].replace(/^v\d+\//, '');
            // Strip the file extension for the public_id
            public_id = afterUpload.replace(/\.[^/.]+$/, '');
          }
        } catch (_) {
          public_id = `migrated/${Date.now()}`;
        }
        return { url: img, public_id };
      }

      // Already an object — pass through (but ensure both fields exist)
      return {
        url: img.url || '',
        public_id: img.public_id || `migrated/${img._id || Date.now()}`
      };
    });

    await collection.updateOne(
      { _id: doc._id },
      {
        $set: {
          faceImages: converted,
          // Also ensure status flags are consistent
          faceDataCollected:    true,
          faceTrainingCompleted: true,
          isFaceVerified:       true
        }
      }
    );

    fixed++;
    console.log(`  ✔ Fixed user: ${doc.email} (${rawImages.length} images)`);
  }

  console.log(`\n📊  Migration complete: ${fixed} users fixed, ${skipped} skipped.`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('❌  Migration failed:', err.message);
  process.exit(1);
});
