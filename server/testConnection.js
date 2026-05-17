import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const uri = process.env.MONGODB_URI;
console.log('Testing MongoDB connection with URI:', uri.replace(/:[^:@]+@/, ':****@')); // Hide password

mongoose.connect(uri, {
  serverSelectionTimeoutMS: 10000, // Increase timeout to 10s
})
.then(() => {
  console.log('✅ Connected to MongoDB successfully!');
  
  // Test a simple operation
  mongoose.connection.db.listCollections().toArray()
    .then(collections => {
      console.log(`📊 Found ${collections.length} collections in database`);
      mongoose.disconnect();
    })
    .catch(err => {
      console.error('❌ Error listing collections:', err.message);
      mongoose.disconnect();
    });
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});