import "server-only";
import { MongoClient, type Collection } from "mongodb";
import type { Person } from "@/types/person";
import type { ShepherdRelationship } from "@/types/relationship";

const dbName = process.env.MONGODB_DB || "shepherd_tree";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient> | undefined;

// Lazy on purpose: this must only run when a request actually needs the
// database, never at module-import time — Next.js imports route modules
// during `next build` to collect their config, and a top-level throw here
// (e.g. MONGODB_URI unset in the build environment) would fail the build
// even though the route is never invoked until deploy.
function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    throw new Error(
      "Missing MONGODB_URI environment variable. Set it in Vercel Project Settings (or .env.local for local dev) " +
        "to the connection string from your Mongo Atlas integration."
    );
  }

  if (process.env.NODE_ENV === "development") {
    // Reuse the client across HMR reloads in dev instead of opening a new connection every save.
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = new MongoClient(uri).connect();
    }
    return global._mongoClientPromise;
  }

  if (!clientPromise) {
    clientPromise = new MongoClient(uri).connect();
  }
  return clientPromise;
}

export type TreeDocument = {
  _id: "main";
  people: Person[];
  relationships: ShepherdRelationship[];
  updatedAt: string;
};

export async function getTreeCollection(): Promise<Collection<TreeDocument>> {
  const client = await getClientPromise();
  return client.db(dbName).collection<TreeDocument>("tree");
}
