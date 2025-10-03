import { MongoClient } from 'mongodb';

const mongoUri = process.env.MONGODB_URI;
const mongoDbName = process.env.MONGODB_DB_NAME;

if (!mongoUri) {
  throw new Error('Missing MONGODB_URI environment variable');
}

// Cache the client across hot-reloads / server restarts
let client;
let clientPromise;

export async function getMongoClient() {
  if (!clientPromise) {
    client = new MongoClient(mongoUri, {
    });
    clientPromise = client.connect();
  }
  return clientPromise;
}

export async function getMongoDb() {
  const connectedClient = await getMongoClient();
  if (!mongoDbName) {
    throw new Error('Missing MONGODB_DB_NAME environment variable');
  }
  return connectedClient.db(mongoDbName);
}


