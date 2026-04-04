# CRM Next 重构规格说明

**版本：** 1.0  
**日期：** 2026-04-03  
**技术栈：** Next.js 15 · TypeScript · Tailwind CSS · Prisma · SQLite

---

## 1. 项目概述

全新创建 `crm-next/` 项目，与现有 `crm/`（Python FastAPI）并列，不复用旧数据库。
目标：用全栈 TypeScript 重写 CRM 的四个核心界面，保持功能对等并改善可维护性。

**运行模式：** 本地桌面应用（`next start` 或 `next dev`），通过环境变量 `IS_HOST=true` 解锁主机专属功能（文件夹快捷方式、备份目录配置）。无用户认证。

---

## 2. 技术依赖

| 类别 | 库 | 用途 |
|---|---|---|
| 框架 | `next@15` `react@19` | App Router + RSC |
| 语言 | `typescript` | 全栈类型安全 |
| 样式 | `tailwindcss` | 原子化 CSS |
| ORM | `prisma` `@prisma/client` | SQLite 数据访问 |
| 表格 | `@tanstack/react-table` | 订单表格 + 内联编辑 |
| 图表 | `recharts` | 收益分析三图 |
| 图片裁剪 | `react-image-crop` | Ollama 图片上传前处理 |

---

## 3. 项目结构

```
crm-next/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx               # 根布局（导航栏）
│   │   ├── page.tsx                 # redirect → /orders
│   │   ├── orders/page.tsx          # RSC
│   │   ├── costs/[orderId]/page.tsx # RSC
│   │   ├── analytics/page.tsx       # RSC
│   │   ├── settings/page.tsx        # RSC
│   │   └── api/
│   │       ├── orders/route.ts
│   │       ├── orders/[id]/route.ts
│   │       ├── customers/route.ts
│   │       ├── customers/[id]/route.ts
│   │       ├── categories/route.ts
│   │       ├── categories/[id]/route.ts
│   │       ├── order-categories/route.ts
│   │       ├── order-categories/[id]/route.ts
│   │       ├── costs/route.ts
│   │       ├── costs/[id]/route.ts
│   │       ├── ollama/route.ts
│   │       └── settings/route.ts
│   ├── components/
│   │   ├── orders/
│   │   │   ├── OrdersTable.tsx      # "use client"
│   │   │   ├── NewOrderDialog.tsx   # "use client"
│   │   │   └── CategoryProgressBadge.tsx
│   │   ├── costs/
│   │   │   ├── DirectCostsTab.tsx
│   │   │   ├── ConsumablesTab.tsx
│   │   │   ├── MonthlyFixedTab.tsx
│   ���   │   ├── ImageUploader.tsx    # 上传 + 缩略图 + 框选裁剪
│   │   │   └── OllamaParser.tsx     # 调 API + 预览 + 确认
│   │   ├── analytics/
│   │   │   ├── AnalyticsDashboard.tsx
│   │   │   ├── RevenueLineChart.tsx
│   │   │   ├── CategoryPieChart.tsx
│   │   │   └── RevenueCostBarChart.tsx
│   │   ├── settings/
│   │   │   └── SettingsForm.tsx
│   │   └── ui/
│   │       ├── Dialog.tsx
│   │       ├── InlineEdit.tsx       # 点击编辑，失焦自动 PUT
│   │       ├── Dropdown.tsx
│   │       ├── DataTable.tsx        # @tanstack/react-table 封装
│   │       └── ImageCropper.tsx
│   ├── lib/
│   │   ├── prisma.ts                # Prisma 单例
│   │   └── utils.ts
│   └── types/
│       └── index.ts                 # 共享 TypeScript 类型
├── uploads/                         # Ollama 图片临时存储（.gitignore）
├── .env.local
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 4. 数据模型（Prisma Schema）

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

enum CustomerStatus {
  REPEAT_BUYER   // 前端显示：回购
  REFERRAL       // 前端显示：有人推荐
}

enum PaymentStatus {
  UNPAID         // 未付
  DEPOSIT_PAID   // 定金已付
  FULLY_PAID     // 全款已付
}

enum CostType {
  CONSUMABLES    // 通用耗材（支持 Ollama 录入）
  MONTHLY_FIXED  // 每月固定成本
}

model Customer {
  id          Int             @id @default(autoincrement())
  name        String
  description String?
  status      CustomerStatus?
  createdAt   DateTime        @default(now())
  orders      Order[]
  @@index([name])
}

model Category {
  id              Int             @id @default(autoincrement())
  name            String          @unique
  unitPrice       Decimal
  directCost      Decimal         @default(0)
  createdAt       DateTime        @default(now())
  orderCategories OrderCategory[]
}

model Order {
  id              Int             @id @default(autoincrement())
  customerId      Int
  customer        Customer        @relation(fields: [customerId], references: [id])
  orderDate       DateTime
  paymentStatus   PaymentStatus   @default(UNPAID)
  depositAmount   Decimal         @default(0)
  folderPath      String?
  createdAt       DateTime        @default(now())
  orderCategories OrderCategory[]
  @@index([orderDate])
}

model OrderCategory {
  id             Int      @id @default(autoincrement())
  orderId        Int
  order          Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  categoryId     Int
  category       Category @relation(fields: [categoryId], references: [id])
  priceSnapshot  Decimal
  quantity       Int      @default(1)
  progress       String   @default("待开始")
  @@unique([orderId, categoryId])
}

model Cost {
  id         Int      @id @default(autoincrement())
  costType   CostType
  name       String
  amount     Decimal
  month      DateTime
  imagePath  String?
  llmRaw     String?
  confirmed  Boolean  @default(false)
  createdAt  DateTime @default(now())
  @@index([month])
}

model Setting {
  key   String @id
  value String
}
```

**关键设计决策：**

| 决策 | 说明 |
|---|---|
| `Category.directCost` | Direct 成本直接存品类字段，不需要独立 Cost 记录 |
| `Cost` 仅两类 | CONSUMABLES / MONTHLY_FIXED，均按月记录 |
| `month` 用 DateTime | 规范化为当月第一天（`2024-03-01T00:00:00Z`），支持日期函数排序 |
| `priceSnapshot` | 下单时锁定品类单价，历史订单不受品类改价影响 |
| `OrderCategory.quantity` | 同品类唯一约束，用数量区分多件 |
| **不存数据库** | 距今天数、应收总价、待收尾款均为前端/报表计算值 |

---

## 5. API 层

Server Components 直接调用 Prisma 读数据，API Routes **仅处理写操作（mutations）**。

| 端点 | 方法 | 说明 |
|---|---|---|
| `/api/orders` | POST | 事务内创建 Order + OrderCategory[]，快照 priceSnapshot |
| `/api/orders/[id]` | PUT / DELETE | 更新订单字段 / 删除（Cascade OrderCategory） |
| `/api/customers` | POST | 创建客户 |
| `/api/customers/[id]` | PUT | 更新客户信息 |
| `/api/categories` | POST | 创建品类 |
| `/api/categories/[id]` | PUT / DELETE | 更新品类 / 删除（有关联则返回 409） |
| `/api/order-categories` | POST | 向已有订单追加品类 |
| `/api/order-categories/[id]` | PUT / DELETE | 更新 progress/quantity / 移除品类 |
| `/api/costs` | POST | 新建成本记录 |
| `/api/costs/[id]` | PUT / DELETE | 更新（confirmed/amount/name）/ 删除 |
| `/api/ollama` | POST | 接收图片 → 存 `uploads/` → 调 Ollama → 返回解析结果 |
| `/api/settings` | PUT | 批量 upsert Setting 记录 |

**统一响应格式：**

```ts
type ApiResponse<T> = { data: T } | { error: string; code?: string }
```

**IS_HOST 控制：** 服务端读 `process.env.IS_HOST === 'true'`，`folderPath`、`folderRoot`、`backupDir` 在非主机环境下忽略/不返回。

---

## 6. 页面与组件划分

### `/orders` — 订单列表

- **RSC**：Prisma 查询订单（含 customer、orderCategories → category）
- **`<OrdersTable>` (Client)**：内联编辑 paymentStatus / depositAmount / progress，品类进度标签，新建订单弹窗，IS_HOST 文件夹快捷方式按钮
- **前端计算（运行时）：**
  - 距今天数：`Math.floor((Date.now() - orderDate) / 86400000)`
  - 应收总价：`Σ priceSnapshot × quantity`
  - 待收尾款：`应收总价 - depositAmount`

### `/costs/[orderId]` — 成本核算

- **RSC**：读取订单基本信息
- **三 Tab (Client)**：
  - **Direct Tab**：展示各品类 directCost（只读，跳转设置页修改）
  - **Consumables Tab**：月度耗材列表 + ImageUploader + OllamaParser + 确认流程
  - **Monthly Fixed Tab**：月度固定成本列表 + 手动录入（自动预填上月数据）

### `/analytics` — 收益分析

- **RSC**：按年月聚合收入、成本数据（年月参数通过 `searchParams` 传入）
- **`<AnalyticsDashboard>` (Client)**：年月选择器、KPI 卡片、三图表、导出 CSV

**KPI 卡片计算：**

| KPI | 计算逻辑 |
|---|---|
| 应收总额 | Σ(所有订单 priceSnapshot × quantity) |
| 已收款 | Σ(FULLY_PAID 订单应收总价) + Σ(DEPOSIT_PAID 订单 depositAmount) |
| 待收尾款 | Σ(DEPOSIT_PAID 订单 (应收总价 − depositAmount)) |
| 累计毛利 | 已收款 − Σ(对应订单品类 directCost × quantity) |

**报表三口径：**

| 口径 | 计算逻辑 |
|---|---|
| 毛利 | 应收总额 − Σ(品类 directCost × quantity) |
| 分摊后利润 | 毛利 − 按应收金额加权分摊的 Consumables/Monthly Fixed |
| 月净利润 | 当月所有订单分摊后利润之和 |

**分摊权重：** `订单权重 = 该订单应收总价 / 当月所有订单应收总价之和`

### `/settings` — 设置

- **RSC**：读取 Setting 表
- **`<SettingsForm>` (Client)**：
  - 品类管理：增删改 name / unitPrice / directCost
  - Ollama 配置：ollamaBaseUrl、ollamaEndpoint
  - IS_HOST=true 时额外显示：文件夹根目录、备份目录

---

## 7. Ollama 集成

**适用场景：** 仅 Consumables（通用耗材）录入。

**流程：**

1. 用户上传图片 → `<ImageUploader>` 显示缩略图，支持框选裁���
2. 裁剪后图片 `POST /api/ollama`
3. 服务端处理：
   - 保存图片至 `uploads/`（文件名用时间戳）
   - 调用 Ollama HTTP API（`POST {ollamaBaseUrl}/api/generate`）
   - 参数：`think: false`，`num_ctx: 8192`，`num_predict: -1`
   - Prompt 要求模型仅输出 JSON 数组：`[{ "name": string, "amount": number }]`
4. 前端 `<OllamaParser>` 展示解析结果，用户可预览编辑
5. 用户确认 → `POST /api/costs`，写入数据库，`confirmed: true`，`llmRaw` 存原始 JSON

**Setting 表预定义 key：**

| key | 说明 | 示例值 |
|---|---|---|
| `ollamaBaseUrl` | Ollama 服务地址 | `http://localhost:11434` |
| `ollamaEndpoint` | 模型 ID | `llava:latest` |
| `folderRoot` | 本地文件夹根目录（IS_HOST） | `D:\客户资料` |
| `backupDir` | 备份目录（IS_HOST） | `C:\Users\xxx\OneDrive\CRM备份` |

---

## 8. 环境变量（`.env.local`）

```env
DATABASE_URL="file:./prisma/crm.db"
IS_HOST="true"
OLLAMA_BASE_URL="http://localhost:11434"
```

---

## 9. 验证清单

1. `npx prisma migrate dev` 成功生成数据库，无错误
2. `npm run dev` 启动无报错，`/orders` 正常渲染
3. 新建订单 → 应收总价正确计算，priceSnapshot 已锁定
4. 内联编辑 paymentStatus / depositAmount，失焦自动保存
5. 成本页上传图片 → Ollama 返回解析结果 → 确认写入
6. 收益分析页三图表正常渲染，KPI 数字与订单数据一致
7. 设置页修改品类单价 → 历史订单 priceSnapshot 不变
8. `IS_HOST=false` 时，文件夹快捷方式、备份目录配置不可见
