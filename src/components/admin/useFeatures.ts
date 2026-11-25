"use client";

import { useCallback, useEffect, useState } from "react";
import { db } from "@/services/admin";
import { DEFAULT_FEATURES, type FeatureFlags, type FeatureToggleKey } from "@/types/invitation";

/** Sakelar fitur opsional (berlaku langsung, tidak lewat draft/publish). */
export function useFeatures() {
  const [features, setFeatures] = useState<FeatureFlags | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await db().from("wedding_settings").select("features").eq("id", 1).single();
    if (error) {
      // Kolom belum ada = migration 0005 belum dijalankan.
      setError(/features/.test(error.message) ? "Jalankan migration 20261126000005_guest_features.sql di Supabase untuk memakai fitur ini." : error.message);
      setFeatures(DEFAULT_FEATURES);
      return;
    }
    setFeatures({ ...DEFAULT_FEATURES, ...(data.features ?? {}) });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setFeature = useCallback(
    async <K extends FeatureToggleKey | "access">(name: K, value: FeatureFlags[K]) => {
      const next = { ...(features ?? DEFAULT_FEATURES), [name]: value };
      const { error } = await db().from("wedding_settings").update({ features: next }).eq("id", 1);
      if (error) throw new Error(error.message);
      setFeatures(next);
    },
    [features],
  );

  return { features, error, setFeature, reload: load };
}
