import "server-only";

import * as fixtures from "./fixtures";
import type {
  Category,
  Fabric,
  FurnitureType,
  WoodFinish,
} from "./database.types";
import type { Db, OptionGroupWithValues, ProductWithDetails } from "./queries";
import * as queries from "./queries";

/**
 * طبقة وصول للبيانات: تقرأ من Supabase إن كانت المفاتيح متاحة،
 * وإلا (أو عند أي خطأ) ترجع البيانات الاحتياطية حتى لا ينهار الموقع.
 */

async function withDb<T>(run: (db: Db) => Promise<T>, fallback: () => T): Promise<T> {
  try {
    const db = await (await import("@/lib/supabase/server")).getDb();
    if (!db) return fallback();
    return await run(db);
  } catch {
    return fallback();
  }
}

export function getCategories(): Promise<Category[]> {
  return withDb(
    (db) => queries.getCategories(db),
    () => fixtures.fixtureCategories,
  );
}

export function getProducts(categorySlug?: string): Promise<ProductWithDetails[]> {
  return withDb(
    (db) => queries.getProducts(db, categorySlug),
    () => fixtures.fixtureProductsForCategory(categorySlug),
  );
}

export function getProductBySlug(slug: string): Promise<ProductWithDetails | null> {
  return withDb(
    (db) => queries.getProductBySlug(db, slug),
    () => fixtures.fixtureProductBySlug(slug),
  );
}

export function getSimilarProducts(slug: string, limit = 4): Promise<ProductWithDetails[]> {
  return withDb(
    (db) => queries.getSimilarProducts(db, slug, limit),
    () => fixtures.fixtureSimilarProducts(slug, limit),
  );
}

export function getFurnitureTypes(): Promise<FurnitureType[]> {
  return withDb(
    (db) => queries.getFurnitureTypes(db),
    () => fixtures.fixtureFurnitureTypes,
  );
}

export function getFurnitureTypeBySlug(slug: string): Promise<FurnitureType | null> {
  return withDb(
    (db) => queries.getFurnitureTypeBySlug(db, slug),
    () => fixtures.fixtureFurnitureTypes.find((t) => t.slug === slug) ?? null,
  );
}

export function getFabricsForType(furnitureTypeId: number): Promise<Fabric[]> {
  return withDb(
    (db) => queries.getFabricsForType(db, furnitureTypeId),
    () => fixtures.fixtureFabricsForType(furnitureTypeId),
  );
}

export function getWoods(): Promise<WoodFinish[]> {
  return withDb(
    (db) => queries.getWoods(db),
    () => fixtures.fixtureWoodFinishes,
  );
}

export function getOptionGroupsForType(
  furnitureTypeId: number,
): Promise<OptionGroupWithValues[]> {
  return withDb(
    (db) => queries.getOptionGroupsForType(db, furnitureTypeId),
    () => fixtures.fixtureOptionGroupsForType(furnitureTypeId),
  );
}
