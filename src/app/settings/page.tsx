import { prisma } from "@/lib/prisma";
import SettingsForm from "@/components/settings/SettingsForm";

function toNum(d: { toNumber(): number } | number): number {
  return typeof d === "number" ? d : d.toNumber();
}

export default async function SettingsPage() {
  const [categories, settings] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.setting.findMany(),
  ]);

  const serializedCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    unitPrice: toNum(c.unitPrice),
    directCost: toNum(c.directCost),
  }));

  const settingMap: Record<string, string> = {
    ollamaBaseUrl: "http://localhost:11434",
    ollamaEndpoint: "llava:latest",
    folderRoot: "",
    backupDir: "",
    ...Object.fromEntries(settings.map((s) => [s.key, s.value])),
  };

  const isHost = process.env.IS_HOST === "true";

  return (
    <main className="max-w-screen-2xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-on-background">
          Settings
        </h1>
        <p className="text-on-surface-variant mt-1">
          Manage categories and system configuration
        </p>
      </div>

      <SettingsForm
        categories={serializedCategories}
        settings={settingMap}
        isHost={isHost}
      />
    </main>
  );
}
