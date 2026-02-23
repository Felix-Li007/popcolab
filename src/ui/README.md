# UI 组件库

标准化的 UI 组件，用于确保整个应用的视觉一致性和代码复用。

## 组件

### Button

通用按钮组件，支持多种变体和尺寸。

**变体（Variant）:**

- `primary` - 主要操作按钮（紫红色背景）
- `secondary` - 次要按钮（白色背景，灰色边框）
- `ghost` - 幽灵按钮（透明背景）
- `text` - 文本按钮（无背景）
- `icon` - 图标按钮（圆形）
- `tab` - 标签页按钮

**尺寸（Size）:**

- `xs` - 超小
- `sm` - 小
- `md` - 中（默认）
- `lg` - 大

**使用示例:**

```tsx
import { Button } from '@/components/ui';

// 主要按钮
<Button variant="primary" size="md" onClick={handleClick}>
  保存
</Button>

// 带图标的按钮
<Button variant="primary" icon={<PlusIcon />}>
  新建
</Button>

// 图标按钮
<Button variant="icon" size="sm" icon={<CloseIcon />} />

// 标签按钮（带活动状态）
<Button variant="tab" isActive={isSelected}>
  全部
</Button>
```

**Props:**

- `variant?: ButtonVariant` - 按钮变体
- `size?: ButtonSize` - 按钮尺寸
- `isActive?: boolean` - 是否激活（用于标签按钮）
- `icon?: React.ReactNode` - 图标元素
- `fullWidth?: boolean` - 是否占满宽度
- 继承所有标准 `<button>` 属性

---

### Badge

徽章组件，用于显示状态、标签或计数。

**变体（Variant）:**

- `default` - 默认样式（灰色）
- `primary` - 主要样式（紫红色）
- `secondary` - 次要样式（灰色）
- `success` - 成功状态（绿色）
- `warning` - 警告状态（黄色）
- `danger` - 危险状态（红色）
- `info` - 信息状态（蓝色）
- `personality` - 个性化样式（自定义颜色）

**尺寸（Size）:**

- `xs` - 超小
- `sm` - 小（默认）
- `md` - 中

**使用示例:**

```tsx
import { Badge } from '@/components/ui';

// 基础徽章
<Badge variant="default">DRAFT</Badge>

// 状态徽章
<Badge variant="success">● Active</Badge>

// 自定义颜色
<Badge
  variant="personality"
  bgColor="bg-teal-deep"
  textColor="text-white"
>
  JOKER
</Badge>

// 带计数
<Badge variant="primary" size="xs">8</Badge>
```

**Props:**

- `variant?: BadgeVariant` - 徽章变体
- `size?: BadgeSize` - 徽章尺寸
- `bgColor?: string` - 自定义背景色（Tailwind 类名）
- `textColor?: string` - 自定义文字色（Tailwind 类名）
- 继承所有标准 `<span>` 属性

---

### Input / TextArea

表单输入组件，支持标签、错误提示和辅助文本。

**尺寸（Size）:**

- `sm` - 小
- `md` - 中（默认）
- `lg` - 大

**使用示例:**

```tsx
import { Input, TextArea } from '@/components/ui';

// 基础输入框
<Input
  label="用户名"
  type="text"
  placeholder="请输入用户名"
  value={username}
  onChange={e => setUsername(e.target.value)}
/>

// 带错误提示
<Input
  label="邮箱"
  type="email"
  error="请输入有效的邮箱地址"
  value={email}
  onChange={e => setEmail(e.target.value)}
/>

// 带图标
<Input
  label="搜索"
  icon={<SearchIcon />}
  placeholder="搜索..."
/>

// 文本域
<TextArea
  label="描述"
  rows={3}
  placeholder="请输入描述..."
  value={description}
  onChange={e => setDescription(e.target.value)}
/>

// 带辅助文本
<Input
  label="密码"
  type="password"
  helperText="密码至少8个字符"
/>
```

**Input Props:**

- `label?: string` - 输入框标签
- `error?: string` - 错误提示文本
- `helperText?: string` - 辅助文本
- `inputSize?: InputSize` - 输入框尺寸
- `icon?: React.ReactNode` - 图标元素（显示在左侧）
- `fullWidth?: boolean` - 是否占满宽度（默认 true）
- 继承所有标准 `<input>` 属性

**TextArea Props:**

- `label?: string` - 文本域标签
- `error?: string` - 错误提示文本
- `helperText?: string` - 辅助文本
- `inputSize?: InputSize` - 文本域尺寸
- `fullWidth?: boolean` - 是否占满宽度（默认 true）
- 继承所有标准 `<textarea>` 属性

---

## 设计原则

### 一致性

所有组件遵循统一的设计系统：

- 使用项目的配色方案（magenta、teal-deep 等）
- 统一的圆角样式（rounded-full 用于按钮，rounded-2xl 用于输入框）
- 一致的过渡效果（transition-all、transition-colors）

### 可访问性

- 所有交互组件支持键盘导航
- 使用语义化的 HTML 元素
- 支持 aria 属性

### 灵活性

- 通过 props 自定义样式
- 支持传递额外的 className
- 支持所有原生 HTML 属性

### 类型安全

- 完整的 TypeScript 类型定义
- Props 自动补全和类型检查

## 迁移指南

### 从原生按钮迁移到 Button 组件

**之前:**

```tsx
<button
  onClick={handleClick}
  className="flex items-center gap-1.5 px-6 py-2.5 rounded-full text-xs font-bold text-white bg-magenta hover:bg-teal-deep transition-colors"
>
  <span>+</span> 新建
</button>
```

**之后:**

```tsx
<Button variant="primary" size="sm" icon={<span>+</span>} onClick={handleClick}>
  新建
</Button>
```

### 从原生 span 迁移到 Badge 组件

**之前:**

```tsx
<span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
  DRAFT
</span>
```

**之后:**

```tsx
<Badge variant="default" size="sm">
  DRAFT
</Badge>
```

### 从原生 input 迁移到 Input 组件

**之前:**

```tsx
<div>
  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
    用户名
  </label>
  <input
    type="text"
    className="w-full text-sm font-semibold text-gray-800 rounded-2xl bg-gray-100 border-0 px-4 py-3 outline-none focus:ring-2 focus:ring-magenta/30 focus:bg-white placeholder:font-normal placeholder-gray-400 transition"
    value={username}
    onChange={e => setUsername(e.target.value)}
  />
  {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
</div>
```

**之后:**

```tsx
<Input
  label="用户名"
  type="text"
  value={username}
  onChange={e => setUsername(e.target.value)}
  error={error}
/>
```

## 优势

✅ **减少代码重复** - 不再需要在每个地方重复相同的 className  
✅ **保证一致性** - 所有按钮、徽章、输入框样式统一  
✅ **易于维护** - 只需在一个地方修改即可全局更新  
✅ **类型安全** - TypeScript 提供完整的类型检查  
✅ **更好的可读性** - 代码更简洁清晰  
✅ **提高开发效率** - 快速构建 UI，无需记忆具体的 className
