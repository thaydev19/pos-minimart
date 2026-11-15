// ============================================================================
// Categories API: 100% Real Supabase & Dexie Sync (No Mock Data)
// Guards against deleting categories that currently contain products
// ============================================================================

import { supabase } from "@/apis/supabase-client";
import { offlineDb, LocalCategory } from "@/apis/offline-db";
import { DEFAULT_STORE } from "@/features/pos/constants/pos.constants";
import {
  CategoryItem,
  CategoryFormData,
  DeleteCategoryResult,
} from "../types/category.types";
import { parseCategoryIconAndColor } from "../utils/category.util";
import { usePosStore } from "@/features/pos/stores/pos.store";

export const categoriesApi = {
  /**
   * Fetches categories from Supabase with real product count.
   * Caches directly to Dexie.js for offline POS support.
   */
  async fetchCategories(): Promise<CategoryItem[]> {
    try {
      const [catRes, prodRes] = await Promise.all([
        supabase
          .from("categories")
          .select("*")
          .order("sort_order", { ascending: true }),
        supabase
          .from("products")
          .select("id, category_id")
          .eq("is_active", true),
      ]);

      if (catRes.error) {
        console.warn("[CategoriesApi] Supabase error, falling back to Dexie:", catRes.error.message);
        const localCats = await offlineDb.categories.toArray();
        return localCats.map((c) => ({
          ...c,
          product_count: 0,
        }));
      }

      // Count products per category
      const productCountMap = new Map<string, number>();
      if (prodRes.data) {
        for (const p of prodRes.data) {
          if (p.category_id) {
            productCountMap.set(
              p.category_id,
              (productCountMap.get(p.category_id) || 0) + 1
            );
          }
        }
      }

      const items: CategoryItem[] = (catRes.data || []).map((cat) => {
        const parsed = parseCategoryIconAndColor(cat.icon);
        return {
          id: cat.id,
          store_id: cat.store_id || DEFAULT_STORE.id,
          name_lo: cat.name_lo,
          name_en: cat.name_en,
          icon: parsed.icon,
          sort_order: cat.sort_order ?? 0,
          color: parsed.color || cat.color || "emerald",
          created_at: cat.created_at,
          product_count: productCountMap.get(cat.id) || 0,
        };
      });

      // Cache directly to Dexie (Offline-First)
      const dexieEntries: LocalCategory[] = items.map((c) => ({
        id: c.id,
        store_id: c.store_id,
        name_lo: c.name_lo,
        name_en: c.name_en || undefined,
        icon: c.icon || "LayoutGrid",
        color: c.color || "emerald",
        sort_order: c.sort_order,
        created_at: c.created_at,
      }));
      await offlineDb.categories.bulkPut(dexieEntries);

      return items;
    } catch (err: any) {
      console.error("[CategoriesApi] fetchCategories failed:", err);
      const localCats = await offlineDb.categories.toArray();
      return localCats.map((c) => {
        const parsed = parseCategoryIconAndColor(c.icon);
        return {
          id: c.id,
          store_id: c.store_id,
          name_lo: c.name_lo,
          name_en: c.name_en || undefined,
          icon: parsed.icon,
          color: (c as any).color || parsed.color || "emerald",
          sort_order: c.sort_order ?? 0,
          created_at: c.created_at,
          product_count: 0,
        };
      });
    }
  },

  /**
   * Creates a new category in Supabase and updates Dexie.
   * Encodes color into icon as "IconName:color" for 100% Supabase schema compatibility.
   */
  async createCategory(input: CategoryFormData): Promise<CategoryItem> {
    const id = crypto.randomUUID();
    const cleanIcon = input.icon?.split(":")[0]?.trim() || "LayoutGrid";
    const selectedColor = input.color || "emerald";
    const combinedIcon = `${cleanIcon}:${selectedColor}`;

    const payload = {
      id,
      store_id: DEFAULT_STORE.id,
      name_lo: input.name_lo.trim(),
      name_en: input.name_en?.trim() || null,
      icon: combinedIcon,
      sort_order: input.sort_order ?? 0,
      created_at: new Date().toISOString(),
    };

    let created: CategoryItem = {
      id,
      store_id: DEFAULT_STORE.id,
      name_lo: input.name_lo.trim(),
      name_en: input.name_en?.trim() || null,
      icon: cleanIcon,
      sort_order: input.sort_order ?? 0,
      color: selectedColor,
      created_at: payload.created_at,
      product_count: 0,
    };

    try {
      const { data, error } = await supabase
        .from("categories")
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.warn("[CategoriesApi] Supabase RLS / Network warning:", error.message);
      } else if (data) {
        const parsed = parseCategoryIconAndColor(data.icon);
        created = {
          id: data.id,
          store_id: data.store_id,
          name_lo: data.name_lo,
          name_en: data.name_en,
          icon: parsed.icon,
          sort_order: data.sort_order,
          color: parsed.color || selectedColor,
          created_at: data.created_at,
          product_count: 0,
        };
      }
    } catch (e: any) {
      console.warn("[CategoriesApi] Supabase insert exception:", e?.message);
    }

    // Always update Dexie (Offline-First guaranteed)
    await offlineDb.categories.put({
      id: created.id,
      store_id: created.store_id,
      name_lo: created.name_lo,
      name_en: created.name_en || undefined,
      icon: cleanIcon,
      color: selectedColor,
      sort_order: created.sort_order,
      created_at: created.created_at,
    });

    // Instant sync with POS Store
    usePosStore.getState().loadCatalog(true).catch(console.error);

    return created;
  },

  /**
   * Updates an existing category in Supabase and Dexie.
   */
  async updateCategory(id: string, input: CategoryFormData): Promise<void> {
    const cleanIcon = input.icon?.split(":")[0]?.trim() || "LayoutGrid";
    const selectedColor = input.color || "emerald";
    const combinedIcon = `${cleanIcon}:${selectedColor}`;

    const payload = {
      name_lo: input.name_lo.trim(),
      name_en: input.name_en?.trim() || null,
      icon: combinedIcon,
      sort_order: input.sort_order ?? 0,
    };

    try {
      const { error } = await supabase
        .from("categories")
        .update(payload)
        .eq("id", id);

      if (error) {
        console.warn("[CategoriesApi] Supabase update warning:", error.message);
      }
    } catch (e: any) {
      console.warn("[CategoriesApi] Supabase update exception:", e?.message);
    }

    // Always update Dexie
    await offlineDb.categories.update(id, {
      name_lo: payload.name_lo,
      name_en: payload.name_en || undefined,
      icon: cleanIcon,
      color: selectedColor,
      sort_order: payload.sort_order,
    });

    // Instant sync with POS Store
    usePosStore.getState().loadCatalog(true).catch(console.error);
  },

  /**
   * Safely deletes a category. Rejects if category contains active products.
   */
  async deleteCategory(id: string): Promise<DeleteCategoryResult> {
    // 1. Guard check: Check if products belong to this category
    try {
      const { count, error: countErr } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("category_id", id)
        .eq("is_active", true);

      if (!countErr && count && count > 0) {
        return {
          success: false,
          productCount: count,
          message: `ບໍ່ສາມາດລຶບໄດ້! ຍັງມີສິນຄ້າ ${count} ລາຍການຢູ່ໃນໝວດໝູ່ນີ້. ກະລຸນາຍ້າຍສິນຄ້າໄປໝວດໝູ່ອື່ນກ່ອນລຶບ.`,
        };
      }
    } catch (e) {
      console.warn("[CategoriesApi] Guard check warning:", e);
    }

    // Check in Dexie as well
    const localProductCount = await offlineDb.products
      .where("category_id")
      .equals(id)
      .and((p) => p.is_active !== false)
      .count();

    if (localProductCount > 0) {
      return {
        success: false,
        productCount: localProductCount,
        message: `ບໍ່ສາມາດລຶບໄດ້! ຍັງມີສິນຄ້າ ${localProductCount} ລາຍການຢູ່ໃນໝວດໝູ່ນີ້.`,
      };
    }

    // 2. Delete from Supabase
    try {
      const { error: delErr } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);

      if (delErr) {
        console.warn("[CategoriesApi] Supabase delete warning:", delErr.message);
      }
    } catch (e: any) {
      console.warn("[CategoriesApi] Supabase delete exception:", e?.message);
    }

    // 3. Delete from Dexie
    await offlineDb.categories.delete(id);

    // Instant sync with POS Store
    usePosStore.getState().loadCatalog(true).catch(console.error);

    return { success: true };
  },
};

