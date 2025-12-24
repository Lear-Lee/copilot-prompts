# Flutter UI 开发规范 - Design Token 系统

> my_flutter 项目专用的 UI 开发规范，基于 Design Token 和 Flex 组件系统

## 🎯 核心原则

1. **Token 驱动** - 所有样式值必须通过 Design Token 系统获取
2. **一致性优先** - 使用统一的组件和样式，禁止硬编码样式值
3. **可扩展设计** - 支持快速响应 UI 设计变更
4. **Figma 友好** - 支持从设计工具直接导入 Token

---

## 📦 系统架构

### 双轨主题系统

```
lib/core/themes/
├── theme_config.dart      # 基础配置类
├── style_presets.dart     # 5种预设风格
├── theme_manager.dart     # 主题管理器 (GetX)
├── styled_widgets.dart    # 风格感知组件
├── design_tokens.dart     # Design Token 定义
├── token_manager.dart     # Token 管理器 + 全局快捷方式
├── flex_widgets.dart      # 灵活组件库
└── themes.dart           # 统一导出
```

### Token 层级

```
DesignTokens
├── TokenColors          # 颜色系统
│   ├── primary/secondary/tertiary    # 主题色
│   ├── neutral[50-950]               # 中性色阶
│   ├── text (primary/secondary/...)  # 文本颜色
│   ├── background (primary/elevated/...) # 背景颜色
│   ├── border (default/strong/...)   # 边框颜色
│   └── fill (primary/secondary/...)  # 填充颜色
├── TokenTypography      # 排版系统
├── TokenSpacing         # 间距系统
├── TokenRadius          # 圆角系统
├── TokenShadows         # 阴影系统
├── TokenBorders         # 边框系统
├── TokenOpacity         # 透明度系统
└── TokenDuration        # 动画时长系统
```

---

## ⚠️ 强制规范

### 1. 禁止硬编码样式值

```dart
// ❌ 禁止 - 硬编码颜色
Container(
  color: Color(0xFF3B82F6),
  padding: EdgeInsets.all(16),
)

// ✅ 正确 - 使用 Token
Container(
  color: $c.primary,
  padding: EdgeInsets.all($s.md),
)
```

### 2. 必须使用全局快捷方式

| 快捷方式 | 用途 | 示例 |
|---------|------|------|
| `$c` | 颜色 | `$c.primary`, `$c.text.primary`, `$c.neutral[100]` |
| `$t` | 排版 | `$t.displayLarge`, `$t.bodyMedium` |
| `$s` | 间距 | `$s.sm`, `$s.md`, `$s.lg`, `$s.px(14)` |
| `$r` | 圆角 | `$r.sm`, `$r.md`, `$r.full` |
| `$shadow` | 阴影 | `$shadow.sm`, `$shadow.md` |
| `$b` | 边框 | `$b.thin`, `$b.medium` |
| `$o` | 透明度 | `$o.disabled`, `$o.hover` |
| `$d` | 动画时长 | `$d.fast`, `$d.normal` |

### 3. 必须使用 Flex 组件

```dart
// ❌ 禁止 - 直接使用 Flutter 原生组件并硬编码样式
ElevatedButton(
  style: ElevatedButton.styleFrom(
    backgroundColor: Colors.blue,
    padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
  ),
  onPressed: () {},
  child: Text('按钮'),
)

// ✅ 正确 - 使用 Flex 组件
FlexButton(
  text: '按钮',
  onPressed: () {},
)

// ✅ 正确 - 需要自定义时覆盖属性
FlexButton(
  text: '自定义按钮',
  color: $c.secondary,
  radius: $r.lg,
  padding: EdgeInsets.symmetric(horizontal: $s.xl, vertical: $s.md),
  onPressed: () {},
)
```

---

## 🎨 颜色使用规范

### 语义化颜色

```dart
// 文本颜色 - 按重要性选择
Text('主标题', style: TextStyle(color: $c.text.primary))    // 最重要
Text('副标题', style: TextStyle(color: $c.text.secondary))  // 次要
Text('辅助文字', style: TextStyle(color: $c.text.tertiary)) // 辅助
Text('禁用文字', style: TextStyle(color: $c.text.disabled)) // 禁用态

// 背景颜色 - 按层级选择
Container(color: $c.background.primary)   // 主背景
Container(color: $c.background.secondary) // 次级背景
Container(color: $c.background.elevated)  // 悬浮/卡片背景

// 边框颜色
Container(
  decoration: BoxDecoration(
    border: Border.all(color: $c.border.default_),  // 默认边框
  ),
)

// 填充颜色 - 用于交互元素
Container(color: $c.fill.primary)   // 主要填充（按钮等）
Container(color: $c.fill.hover)     // 悬停态
Container(color: $c.fill.pressed)   // 按下态
```

### 中性色阶

```dart
// 使用数字索引访问中性色
$c.neutral[50]   // 最浅
$c.neutral[100]
$c.neutral[200]
$c.neutral[300]
$c.neutral[400]
$c.neutral[500]  // 中间
$c.neutral[600]
$c.neutral[700]
$c.neutral[800]
$c.neutral[900]
$c.neutral[950]  // 最深
```

---

## 📏 间距使用规范

### 预设间距

```dart
$s.none  // 0
$s.xxs   // 2
$s.xs    // 4
$s.sm    // 8
$s.md    // 16 (默认)
$s.lg    // 24
$s.xl    // 32
$s.xxl   // 48
$s.xxxl  // 64
```

### 自定义间距

```dart
// 当设计稿有非标准间距时
Padding(
  padding: EdgeInsets.all($s.px(14)),  // 14px
)

// 使用 Gap 组件
Row(
  children: [
    Icon(Icons.star),
    Gap($s.sm),  // 8px 间隔
    Text('评分'),
  ],
)
```

---

## 🔲 组件使用规范

### FlexButton

```dart
// 基础用法
FlexButton(
  text: '确认',
  onPressed: () {},
)

// 次要按钮
FlexButton.secondary(
  text: '取消',
  onPressed: () {},
)

// 文本按钮
FlexButton.text(
  text: '了解更多',
  onPressed: () {},
)

// 完全自定义
FlexButton(
  text: '渐变按钮',
  gradient: LinearGradient(
    colors: [$c.primary, $c.secondary],
  ),
  width: double.infinity,
  height: 56,
  radius: $r.lg,
  textStyle: $t.labelLarge.copyWith(color: Colors.white),
  onPressed: () {},
)
```

### FlexCard

```dart
// 基础卡片
FlexCard(
  child: Text('内容'),
)

// 玻璃态卡片
FlexCard(
  blur: 10,
  color: $c.background.elevated.withOpacity(0.8),
  child: Text('毛玻璃效果'),
)

// 自定义卡片
FlexCard(
  padding: EdgeInsets.all($s.lg),
  radius: $r.xl,
  shadow: $shadow.lg,
  border: Border.all(color: $c.border.default_),
  child: Column(
    children: [
      Text('标题', style: $t.titleLarge),
      Gap($s.sm),
      Text('描述内容'),
    ],
  ),
)
```

### FlexInput

```dart
// 基础输入框
FlexInput(
  hint: '请输入用户名',
  controller: _controller,
)

// 带图标
FlexInput(
  hint: '搜索',
  prefixIcon: Icon(Icons.search),
  suffixIcon: IconButton(
    icon: Icon(Icons.clear),
    onPressed: () => _controller.clear(),
  ),
)

// 自定义样式
FlexInput(
  hint: '自定义输入框',
  fillColor: $c.background.secondary,
  radius: $r.full,
  borderColor: Colors.transparent,
)
```

### FlexBox (Row/Column with Gap)

```dart
// 水平布局带间距
FlexBox.row(
  gap: $s.md,
  children: [
    Icon(Icons.star),
    Text('评分'),
    Text('4.5'),
  ],
)

// 垂直布局带间距
FlexBox.column(
  gap: $s.sm,
  crossAxisAlignment: CrossAxisAlignment.start,
  children: [
    Text('标题', style: $t.titleMedium),
    Text('描述文字'),
    FlexButton(text: '操作', onPressed: () {}),
  ],
)
```

### Gap

```dart
// 简单间隔
Column(
  children: [
    Text('第一行'),
    Gap($s.md),  // 16px 垂直间隔
    Text('第二行'),
  ],
)

Row(
  children: [
    Icon(Icons.info),
    Gap($s.sm),  // 8px 水平间隔
    Text('提示信息'),
  ],
)
```

---

## 🎭 主题切换

### 可用风格

```dart
// 5 种预设风格
AppStyleType.neumorphic     // 拟物新态（iOS 26 风格）
AppStyleType.material3      // Material Design 3
AppStyleType.flat           // 扁平化
AppStyleType.glassmorphism  // 玻璃态
AppStyleType.cyberpunk      // 赛博朋克
```

### 切换风格

```dart
// 通过 ThemeManager 切换
final themeManager = Get.find<ThemeManager>();

// 切换风格
themeManager.switchStyle(AppStyleType.glassmorphism);

// 切换深色/浅色模式
themeManager.toggleDarkMode();
```

---

## 📥 从设计工具导入

### 导入 Figma Token

```dart
// 1. 从 Figma 导出 JSON
// 2. 加载到 TokenManager
final tokenManager = Get.find<TokenManager>();

await tokenManager.loadFromJson({
  'colors': {
    'primary': '#3B82F6',
    'secondary': '#8B5CF6',
    'neutral': {
      '50': '#FAFAFA',
      '100': '#F4F4F5',
      // ...
    },
  },
  'spacing': {
    'base': 4,
    'scale': [0, 0.5, 1, 2, 4, 6, 8, 12, 16],
  },
  'radius': {
    'none': 0,
    'sm': 4,
    'md': 8,
    'lg': 16,
    'xl': 24,
    'full': 9999,
  },
});
```

---

## 📋 UI 还原检查清单

当从设计稿还原 UI 时，按以下顺序检查：

### 1. 颜色
- [ ] 使用 `$c.xxx` 获取颜色，禁止硬编码
- [ ] 文本颜色使用 `$c.text.xxx`
- [ ] 背景颜色使用 `$c.background.xxx`
- [ ] 如有特殊颜色，先添加到 Token 系统

### 2. 间距
- [ ] 使用 `$s.xxx` 获取间距
- [ ] 非标准间距使用 `$s.px(n)`
- [ ] 元素间隔使用 `Gap()` 组件

### 3. 排版
- [ ] 使用 `$t.xxx` 获取文本样式
- [ ] 自定义时用 `.copyWith()` 扩展

### 4. 组件
- [ ] 按钮使用 `FlexButton`
- [ ] 卡片使用 `FlexCard`
- [ ] 输入框使用 `FlexInput`
- [ ] 列表布局使用 `FlexBox`

### 5. 圆角和阴影
- [ ] 圆角使用 `$r.xxx`
- [ ] 阴影使用 `$shadow.xxx`
- [ ] 边框使用 `$b.xxx`

---

## 🚫 禁止事项

1. **禁止** 直接使用 `Color(0xFFxxxxxx)` 硬编码颜色
2. **禁止** 直接使用 `EdgeInsets.all(16)` 硬编码间距
3. **禁止** 在组件中直接使用 `Colors.blue` 等 Material 颜色
4. **禁止** 使用 `SizedBox(width: 16)` 作为间隔（用 `Gap`）
5. **禁止** 跳过 Token 系统直接访问 `Theme.of(context)`
6. **禁止** 在单个文件中定义局部样式常量

---

## ✅ 推荐做法

1. **优先** 使用 Flex 组件库
2. **优先** 使用语义化 Token（如 `$c.text.primary` 而非 `$c.neutral[900]`）
3. **优先** 使用预设间距（`$s.md`）而非自定义（`$s.px(16)`）
4. **始终** 考虑深色模式兼容性
5. **始终** 从组件级别开始构建，而非页面级别
6. **始终** 在修改 Token 时考虑全局影响

---

## 📚 相关文件

- `lib/core/themes/design_tokens.dart` - Token 定义
- `lib/core/themes/token_manager.dart` - Token 管理
- `lib/core/themes/flex_widgets.dart` - 组件库
- `lib/presentation/pages/showcase/style_showcase_page.dart` - 示例页面

---

**维护团队**: MTA工作室  
**适用项目**: my_flutter  
**最后更新**: 2024-12-24
