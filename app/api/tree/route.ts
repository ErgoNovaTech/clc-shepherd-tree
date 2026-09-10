import { NextResponse } from "next/server";
import { getTreeCollection } from "@/lib/mongodb";
import { treeSnapshotSchema } from "@/lib/validation/personSchema";

// Always live — never statically optimized/cached, and never executed at build time.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const collection = await getTreeCollection();
    const doc = await collection.findOne({ _id: "main" });
    return NextResponse.json({
      people: doc?.people ?? [],
      relationships: doc?.relationships ?? [],
    });
  } catch (err) {
    console.error("GET /api/tree failed", err);
    return NextResponse.json({ error: "Failed to load tree" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const parsed = treeSnapshotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid tree data", issues: parsed.error.issues }, { status: 400 });
    }

    const collection = await getTreeCollection();
    await collection.updateOne(
      { _id: "main" },
      { $set: { people: parsed.data.people, relationships: parsed.data.relationships, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PUT /api/tree failed", err);
    return NextResponse.json({ error: "Failed to save tree" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const collection = await getTreeCollection();
    await collection.deleteOne({ _id: "main" });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/tree failed", err);
    return NextResponse.json({ error: "Failed to reset tree" }, { status: 500 });
  }
}
