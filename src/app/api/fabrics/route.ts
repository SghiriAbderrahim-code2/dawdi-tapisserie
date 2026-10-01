import { NextResponse } from "next/server";
import { getFabricsForType, getFurnitureTypeBySlug } from "@/lib/catalog";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("type");
    if (!slug) {
      return NextResponse.json({ error: "missing_type" }, { status: 400 });
    }

    const furnitureType = await getFurnitureTypeBySlug(slug);
    if (!furnitureType) {
      return NextResponse.json({ error: "unknown_type" }, { status: 404 });
    }

    const fabrics = await getFabricsForType(furnitureType.id);
    console.log(
      `[api/fabrics] type=${slug} furniture_type_id=${furnitureType.id} → ${fabrics.length} fabrics`,
    );

    return NextResponse.json({ furnitureTypeId: furnitureType.id, fabrics });
  } catch (error) {
    console.error("GET /api/fabrics failed:", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
