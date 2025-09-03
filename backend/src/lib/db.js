import mongoose from 'mongoose';

async function connectToDatabase() {
  const mongoUri = process.env.MONGODB_URI ;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set');
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUri, {
    autoIndex: true,
  });
  const conn = mongoose.connection;
  const { host, name } = conn;
  console.log(`Connected to MongoDB host=${host} db=${name}`);
  return conn;
}

export { connectToDatabase };


