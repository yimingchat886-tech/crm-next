"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

type Kpis = {
  totalReceivable: number;
  totalCollected: number;
  totalBalanceDue: number;
  grossProfit: number;
};

type MonthlyDatum = { month: string; revenue: number; cost: number };

type CategoryDatum = { name: string; value: number };

type BarDatum = { name: string; revenue: number };

type AnalyticsData = {
  kpis: Kpis;
  monthlyData: MonthlyDatum[];
  categoryData: CategoryDatum[];
  barData: BarDatum[];
  selectedYear: number;
  selectedMonth: number;
};

const COLORS = ["#0050d4", "#006947", "#815100", "#b31b25", "#7b9cff"];

export default function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
  const router = useRouter();
  const { kpis, monthlyData, categoryData, barData, selectedYear, selectedMonth } = data;

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const handleYearChange = (y: number) => {
    router.push(`/analytics?year=${y}&month=${selectedMonth}`);
  };

  const handleMonthChange = (m: number) => {
    router.push(`/analytics?year=${selectedYear}&month=${m}`);
  };

  const formatCurrency = (n: number) =>
    `¥${n.toLocaleString("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <main className="max-w-screen-2xl mx-auto px-6 py-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-background mb-2">
            Revenue Analytics
          </h1>
          <p className="text-on-surface-variant text-sm font-body">
            Financial performance and strategic breakdown.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(Number(e.target.value))}
              className="appearance-none bg-surface-container-lowest border-none ring-1 ring-outline-variant/20 rounded-xl py-2.5 pl-4 pr-10 text-sm font-semibold text-on-surface cursor-pointer focus:ring-primary shadow-sm"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline">
              expand_more
            </span>
          </div>
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(Number(e.target.value))}
              className="appearance-none bg-surface-container-lowest border-none ring-1 ring-outline-variant/20 rounded-xl py-2.5 pl-4 pr-10 text-sm font-semibold text-on-surface cursor-pointer focus:ring-primary shadow-sm"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => alert("Export feature coming soon")}
            className="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export
          </button>
        </div>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <KpiCard
          label="Total Receivables"
          value={formatCurrency(kpis.totalReceivable)}
          icon="account_balance_wallet"
          trend="+12.5%"
          trendType="positive"
        />
        <KpiCard
          label="Received"
          value={formatCurrency(kpis.totalCollected)}
          icon="check_circle"
          trend="On Track"
          trendType="positive"
        />
        <KpiCard
          label="Balance Due"
          value={formatCurrency(kpis.totalBalanceDue)}
          icon="pending_actions"
          trend="Attention"
          trendType="warning"
        />
        <KpiCard
          label="Gross Profit"
          value={formatCurrency(kpis.grossProfit)}
          icon="trending_up"
          trend="YTD"
          trendType="neutral"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Line Chart */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold font-headline">Revenue Performance</h3>
              <p className="text-sm text-on-surface-variant">Monthly growth and trend analysis</p>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0050d4" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#0050d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e9eb" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#747779", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#747779", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `¥${v / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                  }}
                  formatter={(v) => formatCurrency(Number(v))}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0050d4"
                  strokeWidth={3}
                  dot={{ fill: "#0050d4", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest rounded-xl p-8 shadow-sm flex flex-col">
          <h3 className="text-xl font-bold font-headline mb-1">Category Split</h3>
          <p className="text-sm text-on-surface-variant mb-6">Top performing sectors</p>
          <div className="flex-1 min-h-[200px]">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      border: "none",
                      borderRadius: "12px",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                    }}
                    formatter={(v, n) => [formatCurrency(Number(v)), String(n)]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-on-surface-variant text-sm">
                No category data
              </div>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {categoryData.slice(0, 3).map((cat, idx) => {
              const total = categoryData.reduce((s, c) => s + c.value, 0) || 1;
              const pct = ((cat.value / total) * 100).toFixed(0);
              return (
                <div key={cat.name} className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: COLORS[idx % COLORS.length] }}
                    />
                    <span>{cat.name}</span>
                  </div>
                  <span className="font-bold">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="col-span-12 bg-surface-container-lowest rounded-xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold font-headline">Weekly Revenue</h3>
              <p className="text-sm text-on-surface-variant">Current month breakdown</p>
            </div>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e9eb" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#747779", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#747779", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `¥${v / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                  }}
                  formatter={(v) => formatCurrency(Number(v))}
                />
                <Bar dataKey="revenue" fill="#0050d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </main>
  );
}

function KpiCard({
  label,
  value,
  icon,
  trend,
  trendType,
}: {
  label: string;
  value: string;
  icon: string;
  trend: string;
  trendType: "positive" | "warning" | "neutral";
}) {
  const trendStyles = {
    positive: "text-primary bg-primary/10",
    warning: "text-tertiary bg-tertiary-container/20",
    neutral: "text-secondary bg-secondary/10",
  };

  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-transparent hover:border-primary-fixed/30 transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 rounded-lg bg-surface-container-low group-hover:bg-primary-container/20 transition-colors">
          <span className="material-symbols-outlined text-primary">{icon}</span>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${trendStyles[trendType]}`}>
          {trend}
        </span>
      </div>
      <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-3xl font-bold font-headline text-on-background">{value}</p>
    </div>
  );
}
