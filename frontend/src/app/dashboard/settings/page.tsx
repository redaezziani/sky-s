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
import { IconLogout } from "@tabler/icons-react";

export default function SettingsPage() {
  const {
    settings,
    fetchSettings,
    updateSetting,
    changePassword,
    logout,
    logoutAll,
  } = useSettingsStore();

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
        `${t.title}: "${setting.label?.[locale] ?? setting.key}" ${
          t.auth?.toast?.passwordChanged || "saved successfully"
        }`
      );
    } catch (err) {
      console.error(err);
      toast.error(
        `${t.title}: "${setting.label?.[locale] ?? setting.key}" ${
          t.auth?.toast?.passwordChangeFailed || "failed"
        }`
      );
    } finally {
      setLoadingKeys((prev) => ({ ...prev, [setting.key]: false }));
    }
  };

  return (
    <section className="flex flex-col gap-4 w-full px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <p className="text-muted-foreground">{t.description}</p>
        </div>
      </div>

      {/* General Settings */}
      <Card className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {settings.map((setting) => (
          <div
            key={setting.key}
            className="flex flex-col md:flex-row md:items-center gap-2 p-3"
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
                    <SelectValue
                      placeholder={
                        t.auth?.changePassword?.saving || "Select an option"
                      }
                    />
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
                {loadingKeys[setting.key]
                  ? t.auth?.changePassword?.saving || "Saving..."
                  : t.auth?.changePassword?.save || "Save"}
              </Button>
            </div>
          </div>
        ))}
      </Card>

      {/* Auth Settings */}
      <Card className="mt-4 grid gap-4 grid-cols-1 p-3">
        {/* Change Password */}
        <div className="flex flex-col md:w-1/2 md:flex-row md:items-end gap-2">
          <div className="flex-1 flex gap-2">
            <div className="flex-1 flex flex-col gap-2">
              <Label htmlFor="currentPassword">
                {t.auth.changePassword.currentPassword}
              </Label>
              <Input
                id="currentPassword"
                type="password"
                value={localSettings.currentPassword || ""}
                onChange={(e) =>
                  handleChange("currentPassword", e.target.value)
                }
              />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <Label htmlFor="newPassword">
                {t.auth.changePassword.newPassword}
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={localSettings.newPassword || ""}
                onChange={(e) => handleChange("newPassword", e.target.value)}
              />
            </div>
          </div>
          <Button
            variant={"secondary"}
            onClick={async () => {
              try {
                setLoadingKeys((prev) => ({ ...prev, changePassword: true }));
                await changePassword(
                  localSettings.currentPassword,
                  localSettings.newPassword
                );
                toast.success(t.auth.toast.passwordChanged);
                handleChange("currentPassword", "");
                handleChange("newPassword", "");
              } catch (err: any) {
                toast.error(err.message || t.auth.toast.passwordChangeFailed);
              } finally {
                setLoadingKeys((prev) => ({
                  ...prev,
                  changePassword: false,
                }));
              }
            }}
            disabled={
              loadingKeys.changePassword ||
              !localSettings.currentPassword ||
              !localSettings.newPassword
            }
          >
            {loadingKeys.changePassword
              ? t.auth.changePassword.saving
              : t.auth.changePassword.save}
          </Button>
        </div>

        {/* Logout Current Device */}
        <div className="flex flex-col gap-2">
          <Label>{t.auth.logout.currentDevice.label}</Label>
          <Button
            onClick={async () => {
              try {
                setLoadingKeys((prev) => ({ ...prev, logout: true }));
                await logout();
                toast.success(t.auth.toast.logoutSuccess);
              } catch (err: any) {
                toast.error(err.message || t.auth.toast.logoutFailed);
              } finally {
                setLoadingKeys((prev) => ({ ...prev, logout: false }));
              }
            }}
            className="md:w-32"
            disabled={loadingKeys.logout}
            variant={"destructive"}
          >
            <IconLogout />
            {loadingKeys.logout
              ? t.auth.logout.currentDevice.processing
              : t.auth.logout.currentDevice.button}
          </Button>
        </div>

        {/* Logout All Devices */}
        <div className="flex flex-col gap-2">
          <Label>{t.auth.logout.allDevices.label}</Label>
          <Button
            variant={"destructive"}
            onClick={async () => {
              try {
                setLoadingKeys((prev) => ({ ...prev, logoutAll: true }));
                await logoutAll();
                toast.success(t.auth.toast.logoutAllSuccess);
              } catch (err: any) {
                toast.error(err.message || t.auth.toast.logoutAllFailed);
              } finally {
                setLoadingKeys((prev) => ({ ...prev, logoutAll: false }));
              }
            }}
            disabled={loadingKeys.logoutAll}
            className="md:w-38"
          >
            <IconLogout />
            {loadingKeys.logoutAll
              ? t.auth.logout.allDevices.processing
              : t.auth.logout.allDevices.button}
          </Button>
        </div>
      </Card>
    </section>
  );
}
