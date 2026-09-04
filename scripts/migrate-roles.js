const mongoose = require('mongoose');

async function run() {
  const uri = 'mongodb://localhost:27017/paryawaran';


  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB via Mongoose');
    
    const db = mongoose.connection.db;
    const users = db.collection('users');

    const result = await users.updateMany(
      { role: { $exists: true } },
      [
        {
          $set: {
            roles: ["$role"],
            vehicleInsurance: { status: 'NOT_SUBMITTED' },
            mitraApplication: { status: 'NOT_APPLIED' }
          }
        },
        {
          $unset: ["role"]
        }
      ]
    );

    console.log(`Migration completed. Modified ${result.modifiedCount} documents.`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
