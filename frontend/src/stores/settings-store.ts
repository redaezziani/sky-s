import { create } from "zustand";
import { axiosInstance } from "@/lib/utils";

export type SettingType = "STRING" | "NUMBER" | "BOOLEAN" | "OPTIONS";

export interface Setting {
  id: string;
  key: string;
  label: Record<string, string>; // multi-lang labels
  type: SettingType;
  valueString?: string;
  valueNumber?: number;
  valueBool?: boolean;
  options?: { key: string; label: Record<string, string> }[]; // for select/checkbox
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface SettingsStore {
  settings: Setting[];
  loading: boolean;
  error: string | null;

  fetchSettings: () => Promise<void>;
  createSetting: (data: Partial<Setting>) => Promise<Setting>;
  updateSetting: (key: string, data: Partial<Setting>) => Promise<Setting>;
  deleteSetting: (key: string) => Promise<void>;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: [],
  loading: false,
  error: null,

  fetchSettings: async () => {
    try {
      set({ loading: true, error: null });
      const res = await axiosInstance.get<Setting[]>("/settings");
      set({ settings: res.data, loading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || "Failed to fetch settings",
        loading: false,
      });
    }
  },

  createSetting: async (data) => {
    try {
      set({ loading: true, error: null });
      const res = await axiosInstance.post<Setting>("/settings", data);
      set({ settings: [res.data, ...get().settings], loading: false });
      return res.data;
    } catch (err: any) {
      set({
        error: err.response?.data?.message || "Failed to create setting",
        loading: false,
      });
      throw err;
    }
  },

  updateSetting: async (key, data) => {
    try {
      set({ loading: true, error: null });
      const res = await axiosInstance.patch<Setting>(`/settings/${key}`, data);
      set({
        settings: get().settings.map((s) => (s.key === key ? res.data : s)),
        loading: false,
      });
      return res.data;
    } catch (err: any) {
      set({
        error: err.response?.data?.message || "Failed to update setting",
        loading: false,
      });
      throw err;
    }
  },

  deleteSetting: async (key) => {
    try {
      set({ loading: true, error: null });
      await axiosInstance.delete(`/settings/${key}`);
      set({
        settings: get().settings.filter((s) => s.key !== key),
        loading: false,
      });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || "Failed to delete setting",
        loading: false,
      });
      throw err;
    }
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
