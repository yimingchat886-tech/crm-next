# crm-next 内存泄露修复记录

## 诊断日期
2026-04-04

## 问题描述
crm-next 应用出现严重内存泄露，在数据刷新和长时间运行后内存持续增长。

## 根因分析

### 1. OrdersTable.tsx render-phase setState（主要根因）
**文件**：`crm-next/src/components/orders/OrdersTable.tsx:344-347`

在组件渲染体中直接调用 `setData`：
```tsx
if (orders !== data && orders.length !== data.length) {
  setData(orders);
}
```

这违反了 React 渲染规则。在严格模式或并发特性下，会导致：
- React 丢弃当前渲染并强制重新调度
- 父组件刷新数据时触发重复渲染循环
- 每次循环创建新的闭包和表格实例，造成内存快速累积

### 2. columns 数组未 memoized（性能放大器）
**文件**：`crm-next/src/components/orders/OrdersTable.tsx:205-328`

`columns` 在每次渲染时重新创建，导致 `@tanstack/react-table` 在每次渲染时重新计算列模型，放大了重渲染带来的内存损耗。

### 3. FileReader 未清理（边缘泄露）
**文件**：`crm-next/src/components/costs/CostsClient.tsx:171-174`

`ConsumablesTab` 中的 `FileReader` 在组件卸载时未 abort，存在潜在的内存泄露风险。

### 4. Next.js 16.2.2 canary 风险（框架层面）
**文件**：`crm-next/package.json`

项目依赖 `next@16.2.2`，该版本属于 canary/预发布线，dev server 有已知的内存持续增长报道。经用户确认，暂不降级，保留当前版本。

## 修复内容

### OrdersTable.tsx
- 引入 `useEffect` 和 `useMemo`
- 将 render-phase 的 `setData` 移入 `useEffect` 中执行
- 用 `useMemo` 持久化 `columns` 数组，避免 `useReactTable` 不必要的重计算

### CostsClient.tsx
- 引入 `useEffect`
- 添加 `readerRef` 跟踪 `FileReader` 实例
- 在组件卸载时 `abort()` 正在进行的 reader
- 将 `handleFile` 改为 `useCallback`，在读取新文件时先 abort 旧 reader

## 验证方式
1. 打开 Orders 页面，反复 inline edit 并刷新，确认 Console 无 React 渲染阶段 setState 警告
2. 使用 React DevTools Profiler 录制操作，确认组件无异常高频重渲染
3. 进入 Costs > Consumables，选择大图片后在加载完成前离开页面，确认无 unmounted component state update 警告
4. 长期观察 dev server 内存，确认 GC 后趋于稳定（框架层面的 canary 版本风险仍需关注）

## 相关文件
- `crm-next/src/components/orders/OrdersTable.tsx`
- `crm-next/src/components/costs/CostsClient.tsx`
- `crm-next/package.json`
