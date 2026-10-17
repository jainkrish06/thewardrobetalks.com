const { MongoClient } = require('mongodb');
const { v2: cloudinary } = require('cloudinary');
require('dotenv').config();

// Ensure script reads env variables
const {
  MONGO_URL,
  DB_NAME,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET
} = process.env;

const dryRun = process.argv.includes('--dry-run');

if (!MONGO_URL || !DB_NAME) {
  console.error('Error: MONGO_URL and DB_NAME environment variables are required.');
  process.exit(1);
}

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  if (dryRun) {
    console.log('Notice: Cloudinary credentials missing. Proceeding in dry-run inspection mode only.');
  } else {
    console.error('Error: Cloudinary credentials are required to run image migration.');
    process.exit(1);
  }
}

// Config Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET
});

const isBase64 = (str) => {
  return typeof str === 'string' && (str.startsWith('data:image/') || str.length > 5000);
};

async function migrate() {
  console.log(`Starting Image Migration Utility...`);
  console.log(`Database: ${DB_NAME}`);
  console.log(`Mode: ${dryRun ? 'DRY-RUN (No writes)' : 'PRODUCTION MIGRATION'}`);

  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db(DB_NAME);

  let totalProcessed = 0;
  let totalUploaded = 0;
  let totalErrors = 0;

  // 1. Migrate Products images
  console.log('\n--- Auditing Products Collection ---');
  const products = await db.collection('products').find({}).toArray();
  for (const product of products) {
    let modified = false;
    const nextImages = [];

    if (product.images && Array.isArray(product.images)) {
      for (let i = 0; i < product.images.length; i++) {
        const img = product.images[i];
        if (isBase64(img)) {
          totalProcessed++;
          console.log(`Found base64 image in Product "${product.title}" at index ${i}`);
          if (dryRun) {
            nextImages.push(img); // keep as is
          } else {
            try {
              console.log(`Uploading product image to Cloudinary...`);
              const res = await cloudinary.uploader.upload(img, {
                folder: 'wardrobe_talks/products'
              });
              nextImages.push(res.secure_url);
              totalUploaded++;
              modified = true;
              console.log(`Successfully migrated -> ${res.secure_url}`);
            } catch (err) {
              totalErrors++;
              nextImages.push(img);
              console.error(`Failed to migrate image for product ${product.title}:`, err.message);
            }
          }
        } else {
          nextImages.push(img);
        }
      }
    }

    if (modified && !dryRun) {
      await db.collection('products').updateOne(
        { id: product.id },
        { $set: { images: nextImages, updatedAt: new Date().toISOString() } }
      );
      console.log(`Updated database record for Product: "${product.title}"`);
    }
  }

  // 2. Migrate Gallery (Daily Atelier)
  console.log('\n--- Auditing Gallery Collection ---');
  const gallery = await db.collection('gallery').find({}).toArray();
  for (const item of gallery) {
    if (isBase64(item.image)) {
      totalProcessed++;
      console.log(`Found base64 image in Gallery Item ID: ${item.id}`);
      if (!dryRun) {
        try {
          console.log(`Uploading gallery image to Cloudinary...`);
          const res = await cloudinary.uploader.upload(item.image, {
            folder: 'wardrobe_talks/gallery'
          });
          await db.collection('gallery').updateOne(
            { id: item.id },
            { $set: { image: res.secure_url } }
          );
          totalUploaded++;
          console.log(`Successfully migrated -> ${res.secure_url}`);
        } catch (err) {
          totalErrors++;
          console.error(`Failed to migrate image for gallery item ${item.id}:`, err.message);
        }
      }
    }
  }

  // 3. Migrate Hero Slides
  console.log('\n--- Auditing Hero Slides Collection ---');
  const slides = await db.collection('heroSlides').find({}).toArray();
  for (const slide of slides) {
    if (isBase64(slide.image)) {
      totalProcessed++;
      console.log(`Found base64 image in Hero Slide ID: ${slide.id} ("${slide.title}")`);
      if (!dryRun) {
        try {
          console.log(`Uploading hero slide background to Cloudinary...`);
          const res = await cloudinary.uploader.upload(slide.image, {
            folder: 'wardrobe_talks/hero'
          });
          await db.collection('heroSlides').updateOne(
            { id: slide.id },
            { $set: { image: res.secure_url } }
          );
          totalUploaded++;
          console.log(`Successfully migrated -> ${res.secure_url}`);
        } catch (err) {
          totalErrors++;
          console.error(`Failed to migrate image for hero slide ${slide.title}:`, err.message);
        }
      }
    }
  }

  console.log('\n=== Migration Inspection Summary ===');
  console.log(`Total base64 images detected: ${totalProcessed}`);
  console.log(`Total successfully uploaded: ${totalUploaded}`);
  console.log(`Total errors / failed uploads: ${totalErrors}`);

  await client.close();
  console.log('Migration task closed.');
}

migrate().catch(console.error);
