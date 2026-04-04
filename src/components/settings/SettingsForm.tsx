"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Category = {
  id: number;
  name: string;
  unitPrice: number;
  directCost: number;
};

export default function SettingsForm({
  categories,
  settings,
  isHost,
}: {
  categories: Category[];
  settings: Record<string, string>;
  isHost: boolean;
}) {
  const router = useRouter();

  // Form states
  const [cats, setCats] = useState<Category[]>(categories);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Category>>({});

  const [newCat, setNewCat] = useState({ name: "", unitPrice: "", directCost: "" });
  const [saving, setSaving] = useState(false);

  // Settings form
  const [ollamaUrl, setOllamaUrl] = useState(settings.ollamaBaseUrl || "http://localhost:11434");
  const [ollamaModel, setOllamaModel] = useState(settings.ollamaEndpoint || "llava:latest");
  const [folderRoot, setFolderRoot] = useState(settings.folderRoot || "");
  const [backupDir, setBackupDir] = useState(settings.backupDir || "");

  const handleSaveSettings = async () => {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ollamaBaseUrl: ollamaUrl,
        ollamaEndpoint: ollamaModel,
        folderRoot,
        backupDir,
      }),
    });
    setSaving(false);
    router.refresh();
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditForm({ ...cat });
  };

  const saveEdit = async () => {
    if (!editingId || !editForm.name) return;
    await fetch(`/api/categories/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editForm.name,
        unitPrice: parseFloat(String(editForm.unitPrice)) || 0,
        directCost: parseFloat(String(editForm.directCost)) || 0,
      }),
    });
    setEditingId(null);
    router.refresh();
  };

  const deleteCat = async (id: number) => {
    if (!confirm("Delete this category?")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.status === 409) {
      alert("Cannot delete: category is used in orders.");
      return;
    }
    setCats((prev) => prev.filter((c) => c.id !== id));
    router.refresh();
  };

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.name.trim()) return;
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newCat.name.trim(),
        unitPrice: parseFloat(newCat.unitPrice) || 0,
        directCost: parseFloat(newCat.directCost) || 0,
      }),
    });
    if (res.ok) {
      setNewCat({ name: "", unitPrice: "", directCost: "" });
      router.refresh();
    }
  };

  return (
    <div className="space-y-12">
      {/* Category Management */}
      <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm ring-1 ring-outline-variant/10">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h3 className="text-2xl font-bold font-headline text-on-background tracking-tight">
              Category Management
            </h3>
            <p className="text-on-surface-variant text-sm mt-1">
              Define pricing structures for your service categories.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-outline">
                  Name
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-outline text-right">
                  Unit Price
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-outline text-right">
                  Direct Cost
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-outline text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {cats.map((cat) => (
                <tr key={cat.id} className="hover:bg-surface-container-low/30 transition-colors">
                  {editingId === cat.id ? (
                    <>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editForm.name ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, name: e.target.value }))
                          }
                          className="w-full bg-surface-container-low border-0 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 justify-end">
                          <span className="text-xs text-outline">¥</span>
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={editForm.unitPrice ?? 0}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                unitPrice: parseFloat(e.target.value),
                              }))
                            }
                            className="w-24 bg-surface-container-low border-0 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none text-right"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 justify-end">
                          <span className="text-xs text-outline">¥</span>
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={editForm.directCost ?? 0}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                directCost: parseFloat(e.target.value),
                              }))
                            }
                            className="w-24 bg-surface-container-low border-0 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none text-right"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={saveEdit}
                            className="p-2 text-secondary hover:bg-secondary-container/20 rounded-lg transition-colors"
                          >
                            <span className="material-symbols-outlined">check</span>
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-2 text-outline hover:bg-surface-container rounded-lg transition-colors"
                          >
                            <span className="material-symbols-outlined">close</span>
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 text-sm font-medium">{cat.name}</td>
                      <td className="px-6 py-4 text-sm text-right">
                        ¥{cat.unitPrice.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-on-surface-variant">
                        ¥{cat.directCost.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(cat)}
                            className="p-2 text-outline hover:text-primary hover:bg-surface-container rounded-lg transition-colors"
                          >
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button
                            onClick={() => deleteCat(cat.id)}
                            className="p-2 text-outline hover:text-error hover:bg-error-container/10 rounded-lg transition-colors"
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {/* Add new row */}
              <tr className="bg-surface-container-low/20">
                <td className="px-6 py-4">
                  <input
                    type="text"
                    placeholder="New category name"
                    value={newCat.name}
                    onChange={(e) => setNewCat((c) => ({ ...c, name: e.target.value }))}
                    className="w-full bg-surface-container-lowest border-0 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 justify-end">
                    <span className="text-xs text-outline">¥</span>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      value={newCat.unitPrice}
                      onChange={(e) =>
                        setNewCat((c) => ({ ...c, unitPrice: e.target.value }))
                      }
                      className="w-24 bg-surface-container-lowest border-0 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none text-right"
                    />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 justify-end">
                    <span className="text-xs text-outline">¥</span>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      value={newCat.directCost}
                      onChange={(e) =>
                        setNewCat((c) => ({ ...c, directCost: e.target.value }))
                      }
                      className="w-24 bg-surface-container-lowest border-0 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none text-right"
                    />
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={addCategory}
                    disabled={!newCat.name.trim()}
                    className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
                  >
                    Add
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Ollama Configuration */}
      <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm ring-1 ring-outline-variant/10">
        <div className="mb-6">
          <h3 className="text-2xl font-bold font-headline text-on-background tracking-tight">
            Ollama Configuration
          </h3>
          <p className="text-on-surface-variant text-sm mt-1">
            Connect your local AI engine for intelligent document processing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-outline ml-1">
              Base URL
            </label>
            <div className="relative">
              <input
                type="text"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all text-slate-700"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-secondary text-lg">
                link
              </span>
            </div>
            <p className="text-[10px] text-outline px-1">
              Ensure the Ollama server is running locally.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-outline ml-1">
              Model Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={ollamaModel}
                onChange={(e) => setOllamaModel(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all text-slate-700"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-tertiary text-lg">
                auto_awesome
              </span>
            </div>
            <p className="text-[10px] text-outline px-1">
              Recommended for visual/text hybrid tasks.
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-6 py-2.5 bg-secondary/10 text-secondary border border-secondary/20 rounded-lg text-sm font-semibold hover:bg-secondary/20 transition-all"
        >
          {saving ? "Saving..." : "Save Ollama Settings"}
        </button>
      </section>

      {/* Host Exclusive */}
      {isHost && (
        <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm ring-1 ring-outline-variant/10">
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-2xl font-bold font-headline text-on-background tracking-tight">
              Host Exclusive
            </h3>
            <span className="px-2 py-0.5 bg-primary-fixed text-on-primary-fixed-variant text-[10px] font-bold uppercase tracking-tighter rounded">
              IS_HOST=TRUE
            </span>
          </div>

          <div className="space-y-4 max-w-xl">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-outline ml-1">
                Folders Root Directory
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={folderRoot}
                  onChange={(e) => setFolderRoot(e.target.value)}
                  placeholder="e.g. D:\\CustomerFiles"
                  className="flex-1 bg-surface-container-low border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 text-slate-700"
                />
                <button className="bg-surface-container-high p-3 rounded-lg hover:bg-surface-container-highest transition-colors">
                  <span className="material-symbols-outlined text-lg">folder_open</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-outline ml-1">
                Backup Directory
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={backupDir}
                  onChange={(e) => setBackupDir(e.target.value)}
                  placeholder="e.g. C:\\Backup"
                  className="flex-1 bg-surface-container-low border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 text-slate-700"
                />
                <button className="bg-surface-container-high p-3 rounded-lg hover:bg-surface-container-highest transition-colors">
                  <span className="material-symbols-outlined text-lg">
                    settings_backup_restore
                  </span>
                </button>
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="mt-2 px-6 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-semibold shadow-md hover:opacity-90 transition-all"
            >
              {saving ? "Saving..." : "Save Host Settings"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
