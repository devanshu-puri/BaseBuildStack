import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/basebuildstack";
const options = {
  serverSelectionTimeoutMS: process.env.NODE_ENV === "test" ? 400 : 2000,
};

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Attach a noop rejection handler to avoid unhandledRejection events during tests
clientPromise.catch(() => {});

export default clientPromise;

export async function getDb(
  dbName = process.env.MONGODB_DB ||
    (process.env.NODE_ENV === "test" ? "basebuildstack_test" : "basebuildstack")
) {
  const connectedClient = await clientPromise;
  return connectedClient.db(dbName);
}
