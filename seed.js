import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const dbPath = path.resolve('./mock/db.json');

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI not found in .env. Please ensure it is set.");
    process.exit(1);
  }

  try {
    console.log("Reading mock database...");
    const rawData = fs.readFileSync(dbPath, 'utf-8');
    const dbData = JSON.parse(rawData);

    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected successfully!");

    const db = mongoose.connection.db;

    // Iterate through all collections in the db.json file
    for (const [collectionName, documents] of Object.entries(dbData)) {
      if (!Array.isArray(documents) || documents.length === 0) {
        console.log(`Skipping empty or non-array collection: ${collectionName}`);
        continue;
      }
      
      console.log(`Seeding ${collectionName} with ${documents.length} records...`);
      const collection = db.collection(collectionName);
      
      // Clear existing data to prevent duplicates
      await collection.deleteMany({});
      
      // Insert mock data
      await collection.insertMany(documents);
      console.log(`Successfully seeded ${collectionName}`);
    }

    console.log("All data successfully migrated to MongoDB!");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Error during seeding:", err);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

seed();
