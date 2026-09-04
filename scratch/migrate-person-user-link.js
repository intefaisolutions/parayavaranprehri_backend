const mongoose = require('mongoose');

async function run() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/paryawaran';
  console.log('Connecting to:', MONGODB_URI);
  
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const persons = await db.collection('persons').find({ userId: { $exists: false } }).toArray();
  
  console.log(`Found ${persons.length} persons without userId`);
  let updatedCount = 0;
  
  for (const person of persons) {
    if (!person.mobile) continue;
    
    // Find matching user by mobile
    const user = await db.collection('users').findOne({ phone: person.mobile, isDeleted: false });
    
    if (user) {
      await db.collection('persons').updateOne(
        { _id: person._id },
        { $set: { userId: user._id } }
      );
      updatedCount++;
      console.log(`Linked Person ${person.personId} to User ${user._id}`);
    }
  }

  console.log(`Successfully linked ${updatedCount} persons to their users.`);
  await mongoose.disconnect();
  console.log('Done.');
}

run().catch(console.error);
