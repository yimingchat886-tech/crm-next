"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

type Cost = {
  id: number;
  costType: "CONSUMABLES" | "MONTHLY_FIXED";
  name: string;
  amount: number;
  month: string;
  imagePath: string | null;
  llmRaw: string | null;
  confirmed: boolean;
};

function prevMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1)); // m-1 is current month index, m-2 is previous
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function nextMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m, 1)); // m is next month index (0-based)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, 1));
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

export default function MonthCostsClient({
  yearMonth,
  costs,
  settings,
}: {
  yearMonth: string;
  costs: Cost[];
  settings: Record<string, string>;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"consumables" | "monthly">("consumables");

  return (
    <main className="max-w-screen-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-sm text-outline mb-2">
          <span>Dashboard</span>
          <span>/</span>
          <span className="text-on-surface">Shared Costs</span>
        </nav>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/costs/month/${prevMonth(yearMonth)}`)}
            className="p-2 rounded-lg hover:bg-surface-container-low transition-colors"
            aria-label="Previous month"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">
            {formatMonthLabel(yearMonth)}
          </h1>
          <button
            onClick={() => router.push(`/costs/month/${nextMonth(yearMonth)}`)}
            className="p-2 rounded-lg hover:bg-surface-container-low transition-colors"
            aria-label="Next month"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
        <p className="text-on-surface-variant mt-1 ml-12 text-sm">
          Shared costs allocated across all orders in this month
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex p-1.5 bg-surface-container-low rounded-xl w-fit mb-8 gap-1">
        {[
          { id: "consumables", label: "Consumables" },
          { id: "monthly", label: "Monthly Fixed" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.id
                ? "bg-surface-container-lowest text-primary shadow-sm ring-1 ring-black/5"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "consumables" && (
        <ConsumablesTab
          costs={costs.filter((c) => c.costType === "CONSUMABLES")}
          settings={settings}
          yearMonth={yearMonth}
        />
      )}
      {activeTab === "monthly" && (
        <MonthlyFixedTab
          costs={costs.filter((c) => c.costType === "MONTHLY_FIXED")}
          yearMonth={yearMonth}
        />
      )}
    </main>
  );
}

function ConsumablesTab({
  costs,
  settings,
  yearMonth,
}: {
  costs: Cost[];
  settings: Record<string, string>;
  yearMonth: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsedItems, setParsedItems] = useState<{ name: string; amount: number }[] | null>(null);
  const [llmRaw, setLlmRaw] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const readerRef = useRef<FileReader | null>(null);

  // suppress unused warning — settings available for future Ollama config display
  void settings;

  useEffect(() => {
    return () => {
      if (readerRef.current) {
        readerRef.current.abort();
        readerRef.current = null;
      }
    };
  }, []);

  const handleFile = useCallback(async (file: File) => {
    if (readerRef.current) {
      readerRef.current.abort();
    }

    const reader = new FileReader();
    readerRef.current = reader;
    reader.onload = () => {
      if (readerRef.current === reader) {
        setPreview(reader.result as string);
      }
    };
    reader.onerror = () => {
      if (readerRef.current === reader) {
        readerRef.current = null;
      }
    };
    reader.readAsDataURL(file);

    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/ollama", { method: "POST", body: formData });
      const json = await res.json();
      if ("data" in json) {
        setParsedItems(json.data.parsed || []);
        setLlmRaw(json.data.llmRaw || null);
      }
    } catch {
      // ignore
    } finally {
      setUploading(false);
    }
  }, []);

  const handleConfirm = async () => {
    if (!parsedItems) return;
    for (const item of parsedItems) {
      await fetch("/api/costs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          costType: "CONSUMABLES",
          name: item.name,
          amount: item.amount,
          month: `${yearMonth}-01`,
          llmRaw: llmRaw || undefined,
          confirmed: true,
        }),
      });
    }
    setPreview(null);
    setParsedItems(null);
    setLlmRaw(null);
    router.refresh();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Upload Zone */}
      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">upload_file</span>
          Document Processing
        </h2>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {!preview ? (
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-primary/30 bg-primary/5 rounded-xl p-12 text-center flex flex-col items-center justify-center transition-all hover:border-primary/60 hover:bg-primary/10 cursor-pointer"
          >
            <span className="material-symbols-outlined text-5xl text-primary/40 mb-4">cloud_upload</span>
            <p className="text-on-surface font-semibold">Drop receipt here or click to browse</p>
            <p className="text-sm text-on-surface-variant mt-1">Supports PDF, PNG, JPG (Max 10MB)</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative aspect-[3/4] max-h-80 rounded-lg overflow-hidden bg-surface-container-low">
              <img src={preview} alt="Receipt" className="w-full h-full object-contain" />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex-1 py-2.5 bg-surface-container-high text-on-surface rounded-lg font-semibold text-sm hover:bg-surface-container transition-colors"
              >
                Change Image
              </button>
              {parsing || uploading ? (
                <button className="flex-1 py-2.5 bg-primary/60 text-on-primary rounded-lg font-semibold text-sm flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  Processing...
                </button>
              ) : (
                <button
                  onClick={() => setParsing(true)}
                  className="flex-1 py-2.5 bg-primary text-on-primary rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90"
                >
                  <span className="material-symbols-outlined">auto_fix_high</span>
                  Process with AI
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Parsed Results */}
      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm ring-1 ring-black/5 h-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">psychology</span>
            OllamaParser Results
          </h2>
          {parsedItems && (
            <span className="px-2 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold rounded uppercase">
              AI Verified
            </span>
          )}
        </div>

        {parsedItems ? (
          <div className="space-y-4">
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {parsedItems.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-surface-container-low border-l-4 border-primary">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-primary uppercase tracking-tighter mb-1">Item {String(idx + 1).padStart(2, "0")}</p>
                      <h4 className="font-bold text-on-surface">{item.name}</h4>
                    </div>
                    <span className="font-bold text-lg">¥{item.amount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>

            {llmRaw && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-on-surface-variant uppercase">Raw JSON</span>
                </div>
                <pre className="bg-inverse-surface rounded-lg p-4 font-mono text-[11px] text-surface-variant overflow-x-auto">
                  {llmRaw}
                </pre>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-surface-container">
              <button
                onClick={() => { setPreview(null); setParsedItems(null); setLlmRaw(null); }}
                className="py-3 rounded-lg border border-outline-variant/30 text-on-surface-variant font-bold text-sm hover:bg-surface-container-low transition-all"
              >
                Re-parse
              </button>
              <button
                onClick={handleConfirm}
                className="py-3 rounded-lg bg-primary text-on-primary font-bold text-sm shadow-md shadow-primary/10 hover:opacity-90 transition-all"
              >
                Confirm & Post
              </button>
            </div>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl mb-3 opacity-40">receipt</span>
            <p className="text-sm">Upload and process a receipt to see AI results</p>
          </div>
        )}
      </div>

      {/* Existing Costs List */}
      <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-6 shadow-sm ring-1 ring-black/5">
        <h3 className="text-lg font-bold mb-4">This Month&apos;s Consumables</h3>
        {costs.length === 0 ? (
          <p className="text-sm text-on-surface-variant py-8 text-center">No consumables recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-6 py-3 text-xs font-bold uppercase text-on-surface-variant">Name</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase text-on-surface-variant text-right">Amount</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase text-on-surface-variant text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {costs.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-container-low/30">
                    <td className="px-6 py-3 text-sm">{c.name}</td>
                    <td className="px-6 py-3 text-sm text-right">¥{c.amount.toLocaleString()}</td>
                    <td className="px-6 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${c.confirmed ? "bg-secondary-container text-on-secondary-container" : "bg-tertiary-container text-on-tertiary-container"}`}>
                        {c.confirmed ? "Confirmed" : "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function MonthlyFixedTab({ costs, yearMonth }: { costs: Cost[]; yearMonth: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!name.trim() || isNaN(amt) || amt <= 0) return;

    await fetch("/api/costs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        costType: "MONTHLY_FIXED",
        name: name.trim(),
        amount: amt,
        month: `${yearMonth}-01`,
        confirmed: true,
      }),
    });

    setName("");
    setAmount("");
    router.refresh();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/costs/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Add Form */}
      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-lg font-bold mb-4">Add Monthly Fixed Cost</h2>
        <form onSubmit={handleAdd} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-xs font-bold uppercase text-outline block mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Office Rent"
              className="w-full bg-surface-container-low border-0 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
            />
          </div>
          <div className="w-40">
            <label className="text-xs font-bold uppercase text-outline block mb-2">Amount</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-surface-container-low border-0 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-primary text-on-primary rounded-lg font-semibold text-sm shadow-md hover:opacity-90 transition-all"
          >
            Add
          </button>
        </form>
      </div>

      {/* List */}
      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm ring-1 ring-black/5">
        <h3 className="text-lg font-bold mb-4">Monthly Fixed Costs</h3>
        {costs.length === 0 ? (
          <p className="text-sm text-on-surface-variant py-8 text-center">No fixed costs recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-6 py-3 text-xs font-bold uppercase text-on-surface-variant">Name</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase text-on-surface-variant text-right">Amount</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase text-on-surface-variant text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {costs.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-container-low/30">
                    <td className="px-6 py-3 text-sm">{c.name}</td>
                    <td className="px-6 py-3 text-sm text-right font-medium">¥{c.amount.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-2 text-error hover:bg-error-container/10 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
