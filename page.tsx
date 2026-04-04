"use client";

import React, { useState } from "react";

export default function DesignPreviewPage() {
  const [activePage, setActivePage] = useState("orders");

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* 顶部导航模拟 */}
      <nav className="bg-white border-b px-6 py-4 flex space-x-8 shadow-sm">
        <div className="font-bold text-xl mr-4 text-blue-600">CRM Next</div>
        {[
          { id: "orders", name: "1. 订单列表" },
          { id: "costs", name: "2. 成本核算" },
          { id: "analytics", name: "3. 收益分析" },
          { id: "settings", name: "4. 设置" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActivePage(tab.id)}
            className={`font-medium pb-1 border-b-2 transition-colors ${
              activePage === tab.id
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            {tab.name}
          </button>
        ))}
      </nav>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto p-6 mt-4">
        {/* ================= 1. 订单列表 ================= */}
        {activePage === "orders" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">订单列表</h1>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 shadow-sm">
                + 新建订单
              </button>
            </div>

            {/* 模拟 <OrdersTable> */}
            <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="p-4 border-b">订单 ID</th>
                    <th className="p-4 border-b">客户</th>
                    <th className="p-4 border-b">金额</th>
                    <th className="p-4 border-b">状态 (可点击编辑)</th>
                    <th className="p-4 border-b">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3].map((i) => (
                    <tr key={i} className="hover:bg-gray-50 border-b last:border-0">
                      <td className="p-4 text-gray-500">ORD-00{i}</td>
                      <td className="p-4 font-medium">张三 {i}号</td>
                      <td className="p-4">¥ {(i * 1200).toFixed(2)}</td>
                      <td className="p-4">
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm cursor-pointer border border-yellow-200 border-dashed">
                          定金已付
                        </span>
                      </td>
                      <td className="p-4">
                        <button className="text-blue-500 hover:underline mr-3">核算成本</button>
                        <button className="text-gray-500 hover:underline">打开文件夹</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= 2. 成本核算 ================= */}
        {activePage === "costs" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">成本核算 (ORD-001)</h1>
            
            {/* 模拟 三 Tab */}
            <div className="flex space-x-2 bg-gray-200 p-1 rounded-md w-fit">
              <button className="px-4 py-2 rounded-sm text-sm font-medium text-gray-600 hover:bg-gray-300 transition-colors">Direct</button>
              <button className="px-4 py-2 rounded-sm text-sm font-medium bg-white shadow-sm text-black">Consumables</button>
              <button className="px-4 py-2 rounded-sm text-sm font-medium text-gray-600 hover:bg-gray-300 transition-colors">Monthly Fixed</button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* 模拟 <ImageUploader> */}
              <div className="bg-white border rounded-lg p-6 flex flex-col items-center justify-center min-h-[400px] border-dashed border-2 border-gray-300">
                <div className="text-gray-400 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                </div>
                <p className="text-gray-600 font-medium mb-2">拖拽或点击上传发票/收据图</p>
                <p className="text-xs text-gray-400">支持上传后框选裁剪</p>
              </div>

              {/* 模拟 <OllamaParser> */}
              <div className="bg-white border rounded-lg p-6 shadow-sm flex flex-col">
                <h3 className="font-bold text-lg mb-4 text-gray-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Ollama AI 解析结果
                </h3>
                <div className="flex-1 bg-gray-900 rounded-md p-4 overflow-auto text-green-400 font-mono text-sm leading-relaxed">
                  {`[
  {
    "name": "A4 打印纸 500张",
    "amount": 25.50
  },
  {
    "name": "黑色中性笔 一盒",
    "amount": 12.00
  }
]`}
                </div>
                <div className="mt-4 flex justify-end gap-3">
                  <button className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">重新解析</button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">确认并入账</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= 3. 收益分析 ================= */}
        {activePage === "analytics" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold flex items-center justify-between">
              收益分析
              <select className="text-sm font-normal p-2 border rounded-md">
                <option>2024年 3月</option>
                <option>2024年 2月</option>
              </select>
            </h1>

            {/* 模拟 KPI 卡片 */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "应收总额", value: "¥ 124,500" },
                { label: "已收款", value: "¥ 98,000", color: "text-green-600" },
                { label: "待收尾款", value: "¥ 26,500", color: "text-orange-500" },
                { label: "累计毛利", value: "¥ 45,200", color: "text-blue-600" },
              ].map((kpi, idx) => (
                <div key={idx} className="bg-white p-5 rounded-lg border shadow-sm">
                  <div className="text-sm text-gray-500 mb-1">{kpi.label}</div>
                  <div className={`text-2xl font-bold ${kpi.color || "text-gray-900"}`}>{kpi.value}</div>
                </div>
              ))}
            </div>

            {/* 模拟 图表区 */}
            <div className="grid grid-cols-3 gap-6 h-80">
              <div className="col-span-2 bg-white border rounded-lg p-6 shadow-sm flex items-center justify-center text-gray-400">
                [ 收入/成本趋势折线图 (LineChart) ]
              </div>
              <div className="col-span-1 bg-white border rounded-lg p-6 shadow-sm flex items-center justify-center text-gray-400">
                [ 品类占比饼图 (PieChart) ]
              </div>
            </div>
          </div>
        )}

        {/* ================= 4. 设置 ================= */}
        {activePage === "settings" && (
          <div className="space-y-8 max-w-3xl">
            <h1 className="text-2xl font-bold">系统设置</h1>

            {/* 品类管理 */}
            <section className="bg-white p-6 border rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4 border-b pb-2">📦 品类管理</h2>
              <div className="space-y-3">
                <div className="flex gap-4 items-center bg-gray-50 p-3 rounded">
                  <input type="text" defaultValue="基础服务版" className="border p-2 rounded flex-1" />
                  <input type="number" defaultValue={2999} className="border p-2 rounded w-32" title="单价" />
                  <input type="number" defaultValue={500} className="border p-2 rounded w-32 text-red-500" title="Direct Cost" />
                  <button className="text-red-500 hover:underline">删除</button>
                </div>
                <button className="text-blue-600 text-sm font-medium">+ 新增品类</button>
              </div>
            </section>

            {/* Ollama 配置 */}
            <section className="bg-white p-6 border rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4 border-b pb-2">🤖 大模型配置 (Ollama)</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">服务地址 (Base URL)</label>
                  <input type="text" defaultValue="http://localhost:11434" className="border p-2 rounded w-full" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">使用的模型 (Model)</label>
                  <input type="text" defaultValue="llava:latest" className="border p-2 rounded w-full" />
                </div>
              </div>
            </section>

            {/* IS_HOST 专属配置 */}
            <section className="bg-blue-50 p-6 border border-blue-100 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-4 border-b border-blue-200 pb-2">
                <h2 className="text-lg font-semibold text-blue-900">💻 主机专属配置</h2>
                <span className="bg-blue-200 text-blue-800 text-xs px-2 py-0.5 rounded">IS_HOST=true</span>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-blue-800 mb-1">本地客户资料根目录</label>
                  <input type="text" defaultValue="D:\客户资料" className="border-blue-200 p-2 rounded w-full bg-white" />
                </div>
                <div>
                  <label className="block text-sm text-blue-800 mb-1">数据库备份目录</label>
                  <input type="text" defaultValue="C:\Users\Admin\OneDrive\CRM备份" className="border-blue-200 p-2 rounded w-full bg-white" />
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}