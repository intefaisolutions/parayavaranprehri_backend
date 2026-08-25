import * as mongoose from 'mongoose';

async function check() {
  await mongoose.connect('mongodb://localhost:27017/paryawaran');
  const issues = await mongoose.connection.db.collection('field_issues').find({}).sort({ createdAt: -1 }).limit(3).toArray();
  console.log('Latest 3 issues:');
  console.log(JSON.stringify(issues, null, 2));
  process.exit(0);
}
check().catch(console.error);
