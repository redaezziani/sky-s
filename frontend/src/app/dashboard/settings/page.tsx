"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettingsStore, Setting } from "@/stores/settings-store";
import { useLocale } from "@/components/local-lang-swither";
import { getMessages } from "@/lib/locale";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

export default function SettingsPage() {
  const { settings, fetchSettings, updateSetting } = useSettingsStore();
  const { locale } = useLocale();
  const t = getMessages(locale).pages.settings;

  const [localSettings, setLocalSettings] = useState<Record<string, any>>({});
  const [loadingKeys, setLoadingKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    const initial: Record<string, any> = {};
    settings.forEach((s) => {
      if (s.type === "BOOLEAN") initial[s.key] = s.valueBool ?? false;
      else if (s.type === "NUMBER") initial[s.key] = s.valueNumber ?? 0;
      else if (s.type === "OPTIONS") initial[s.key] = s.valueString ?? "";
      else initial[s.key] = s.valueString ?? "";
    });
    setLocalSettings(initial);
  }, [settings]);

  const handleChange = (key: string, value: any) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (setting: Setting) => {
    try {
      setLoadingKeys((prev) => ({ ...prev, [setting.key]: true }));

      let payload: any = {};
      switch (setting.type) {
        case "BOOLEAN":
          payload.valueBool = localSettings[setting.key];
          break;
        case "NUMBER":
          payload.valueNumber = Number(localSettings[setting.key]);
          break;
        case "OPTIONS":
          payload.valueString = localSettings[setting.key];
          break;
        case "STRING":
        default:
          payload.valueString = localSettings[setting.key];
          break;
      }

      await updateSetting(setting.key, payload);
      toast.success(
        `Setting "${setting.label?.[locale] ?? setting.key}" saved successfully`
      );
    } catch (err) {
      console.error(err);
      toast.error(`Failed to save "${setting.label?.[locale] ?? setting.key}"`);
    } finally {
      setLoadingKeys((prev) => ({ ...prev, [setting.key]: false }));
    }
  };

  return (
    <section className="flex flex-col gap-4 w-full px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">{t.title || "Settings"}</h1>
          <p className="text-muted-foreground">
            {t.description || "Manage your application settings"}
          </p>
        </div>
      </div>

      <Card className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {settings.map((setting) => (
          <div
            key={setting.key}
            className="flex flex-col md:flex-row md:items-center gap-2  p-3"
          >
            <div className="flex-1 flex flex-col gap-2">
              <Label htmlFor={setting.key}>
                {setting.label?.[locale] ?? setting.key}
              </Label>

              {setting.type === "BOOLEAN" ? (
                <Switch
                  id={setting.key}
                  checked={localSettings[setting.key]}
                  onCheckedChange={(val) => handleChange(setting.key, val)}
                />
              ) : setting.type === "OPTIONS" && setting.options?.length ? (
                <Select
                  value={localSettings[setting.key]}
                  onValueChange={(val) => handleChange(setting.key, val)}
                >
                  <SelectTrigger id={setting.key}>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    {setting.options.map((opt) => (
                      <SelectItem key={opt.key} value={opt.key}>
                        {opt.label?.[locale] ?? opt.key}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={setting.key}
                  value={
                    typeof localSettings[setting.key] === "object"
                      ? JSON.stringify(localSettings[setting.key])
                      : localSettings[setting.key]
                  }
                  onChange={(e) => handleChange(setting.key, e.target.value)}
                />
              )}

              {setting.description && (
                <p className="text-xs text-muted-foreground">
                  {setting.description}
                </p>
              )}
            </div>

            <div className="flex-shrink-0">
              <Button
                onClick={() => handleSave(setting)}
                disabled={loadingKeys[setting.key]}
                variant={"secondary"}
              >
                {loadingKeys[setting.key] ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        ))}
      </Card>
    </section>
  );
}
