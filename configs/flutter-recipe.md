# Flutter 项目配置方案

> Flutter/Dart 项目的完整开发规范配置

## 📋 项目信息

**适用场景:**
- Flutter 移动应用开发
- Flutter Web 应用
- Flutter Desktop 应用
- Dart 后端服务

**技术栈:**
- Dart 语言
- Flutter 框架
- Material Design 3
- 状态管理方案 (Provider/Riverpod/Bloc)

---

## ⚠️ 重要：配置文件管理

### .gitignore 设置

**必须添加**: 自动生成的 Copilot 配置不应提交到版本控制

在 Flutter 项目的 `.gitignore` 中添加:

```gitignore
# Copilot 自动生成配置
.github/copilot-instructions.md
```

**原因**:
- 该文件由 MCP 工具自动生成
- 不同开发者可能有不同的配置需求
- 避免团队协作冲突
- 保持版本控制清洁

**推荐实践**:
1. 提交 `.github/copilot-instructions.template.md` 作为参考模板
2. 在 README 中说明配置生成方法
3. 每个开发者独立生成自己的配置

---

## 🎯 核心规范

### 必须加载的规范

#### 1. Dart 核心规范
```
get_relevant_standards({ fileType: "dart" })
```
- 类型安全和空安全
- 异步编程模式
- 函数式编程风格
- 模式匹配和 Records

#### 2. Flutter 框架规范
```
get_relevant_standards({ 
  fileType: "dart",
  imports: ["flutter"]
})
```
- Widget 设计原则
- 状态管理最佳实践
- 布局和响应式设计
- 性能优化技巧

---

## 🔧 常见场景配置

### 场景 1: 基础 Widget 开发

**触发条件:** 创建/编辑 Widget 文件

**加载规范:**
```
get_relevant_standards({ 
  fileType: "dart",
  imports: ["flutter"],
  scenario: "Widget 开发"
})
```

**示例代码:**
```dart
// 必须先调用上面的 MCP 工具!

class ProductCard extends StatelessWidget {
  const ProductCard({
    super.key,
    required this.product,
    this.onTap,
  });
  
  final Product product;
  final VoidCallback? onTap;
  
  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        child: Column(
          children: [
            Image.network(product.imageUrl),
            Text(product.name),
            Text('\$${product.price}'),
          ],
        ),
      ),
    );
  }
}
```

---

### 场景 2: 状态管理

#### Provider
```
get_relevant_standards({ 
  imports: ["provider", "flutter"],
  scenario: "状态管理"
})
```

**示例:**
```dart
class CartProvider extends ChangeNotifier {
  final List<Product> _items = [];
  
  List<Product> get items => List.unmodifiable(_items);
  
  void addItem(Product product) {
    _items.add(product);
    notifyListeners();
  }
}

// Widget 中使用
class CartButton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final count = context.watch<CartProvider>().items.length;
    return Badge(
      label: Text('$count'),
      child: IconButton(
        icon: Icon(Icons.shopping_cart),
        onPressed: () => Navigator.pushNamed(context, '/cart'),
      ),
    );
  }
}
```

#### Riverpod
```
get_relevant_standards({ 
  imports: ["riverpod", "flutter_riverpod"],
  scenario: "状态管理"
})
```

#### Bloc
```
get_relevant_standards({ 
  imports: ["flutter_bloc", "bloc"],
  scenario: "状态管理"
})
```

---

### 场景 3: 路由导航

**Go Router:**
```
get_relevant_standards({ 
  imports: ["go_router"],
  scenario: "路由导航"
})
```

**示例:**
```dart
final router = GoRouter(
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => HomePage(),
      routes: [
        GoRoute(
          path: 'profile/:userId',
          builder: (context, state) {
            final userId = state.pathParameters['userId']!;
            return ProfilePage(userId: userId);
          },
        ),
      ],
    ),
  ],
);

// 使用
context.go('/profile/123');
```

---

### 场景 4: 网络请求

**Dio:**
```
get_relevant_standards({ 
  imports: ["dio"],
  scenario: "API 调用"
})
```

**示例:**
```dart
class ApiService {
  final Dio _dio = Dio(
    BaseOptions(
      baseUrl: 'https://api.example.com',
      connectTimeout: Duration(seconds: 5),
      receiveTimeout: Duration(seconds: 3),
    ),
  );
  
  Future<User?> getUser(String id) async {
    try {
      final response = await _dio.get('/users/$id');
      return User.fromJson(response.data);
    } on DioException catch (e) {
      print('Error fetching user: ${e.message}');
      return null;
    }
  }
}
```

---

### 场景 5: 本地存储

**Shared Preferences:**
```
get_relevant_standards({ 
  imports: ["shared_preferences"],
  scenario: "数据持久化"
})
```

**Hive:**
```
get_relevant_standards({ 
  imports: ["hive", "hive_flutter"],
  scenario: "数据持久化"
})
```

---

### 场景 6: 国际化

```
get_relevant_standards({ 
  imports: ["intl", "flutter_localizations"],
  scenario: "国际化"
})
```

**示例:**
```dart
MaterialApp(
  localizationsDelegates: [
    GlobalMaterialLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
    AppLocalizations.delegate,
  ],
  supportedLocales: [
    Locale('en', ''),
    Locale('zh', ''),
  ],
  home: HomePage(),
)
```

---

## 📐 项目结构建议

### Clean Architecture

```
lib/
├── main.dart
├── app.dart
├── core/
│   ├── constants/
│   ├── errors/
│   ├── network/
│   └── utils/
├── data/
│   ├── models/
│   ├── repositories/
│   └── services/
├── domain/
│   ├── entities/
│   ├── repositories/
│   └── usecases/
├── presentation/
│   ├── screens/
│   ├── widgets/
│   ├── providers/
│   └── theme/
└── l10n/
```

### Feature-First 结构

```
lib/
├── main.dart
├── app.dart
├── core/
├── features/
│   ├── auth/
│   │   ├── data/
│   │   ├── domain/
│   │   └── presentation/
│   ├── products/
│   │   ├── data/
│   │   ├── domain/
│   │   └── presentation/
│   └── cart/
│       ├── data/
│       ├── domain/
│       └── presentation/
└── shared/
    ├── widgets/
    └── utils/
```

---

## 🧪 测试配置

### Widget 测试
```dart
void main() {
  testWidgets('Counter increments', (tester) async {
    await tester.pumpWidget(MaterialApp(home: Counter()));
    
    expect(find.text('0'), findsOneWidget);
    
    await tester.tap(find.byIcon(Icons.add));
    await tester.pump();
    
    expect(find.text('1'), findsOneWidget);
  });
}
```

### 集成测试
```dart
import 'package:integration_test/integration_test.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  
  testWidgets('Complete flow test', (tester) async {
    await tester.pumpWidget(MyApp());
    await tester.pumpAndSettle();
    
    // 测试流程...
  });
}
```

---

## 📦 推荐依赖包

### 状态管理
```yaml
dependencies:
  provider: ^6.1.1
  # 或
  flutter_riverpod: ^2.4.9
  # 或
  flutter_bloc: ^8.1.3
```

### 网络请求
```yaml
dependencies:
  dio: ^5.4.0
  retrofit: ^4.0.3
```

### 本地存储
```yaml
dependencies:
  shared_preferences: ^2.2.2
  hive: ^2.2.3
  hive_flutter: ^1.1.0
```

### 路由
```yaml
dependencies:
  go_router: ^13.0.0
```

### UI 组件
```yaml
dependencies:
  cached_network_image: ^3.3.1
  flutter_svg: ^2.0.9
  shimmer: ^3.0.0
```

### 工具
```yaml
dev_dependencies:
  freezed: ^2.4.6
  json_serializable: ^6.7.1
  build_runner: ^2.4.7
```

---

## ⚙️ 开发配置

### analysis_options.yaml
```yaml
include: package:flutter_lints/flutter.yaml

analyzer:
  exclude:
    - "**/*.g.dart"
    - "**/*.freezed.dart"
  
  strong-mode:
    implicit-casts: false
    implicit-dynamic: false

linter:
  rules:
    - always_declare_return_types
    - always_require_non_null_named_parameters
    - avoid_print
    - prefer_const_constructors
    - prefer_const_declarations
    - prefer_final_fields
    - sort_constructors_first
```

### pubspec.yaml
```yaml
name: my_flutter_app
description: A Flutter application
publish_to: 'none'

version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'
  flutter: ">=3.10.0"

dependencies:
  flutter:
    sdk: flutter
  flutter_localizations:
    sdk: flutter
  
  # 状态管理
  provider: ^6.1.1
  
  # 网络
  dio: ^5.4.0
  
  # 路由
  go_router: ^13.0.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0
  integration_test:
    sdk: flutter
```

---

## 🚀 性能优化清单

- [ ] 使用 `const` 构造函数
- [ ] 使用 `ListView.builder` 处理长列表
- [ ] 图片缓存和优化
- [ ] 避免在 `build` 方法中创建对象
- [ ] 使用 `RepaintBoundary` 优化重绘
- [ ] 合理使用 `Key`
- [ ] 提取不变的子 Widget

---

## 📚 参考资源

- [Flutter 官方文档](https://flutter.dev/docs)
- [Dart 语言指南](https://dart.dev/language)
- [Effective Dart](https://dart.dev/effective-dart)
- [Flutter Style Guide](https://github.com/flutter/flutter/blob/main/docs/contributing/Style-guide-for-Flutter-repo.md)
- [Flutter Performance Best Practices](https://flutter.dev/docs/perf/best-practices)

---

**维护者**: MTA团队(蘑菇与吐司的AI团队)  
**创建日期**: 2025-12-16  
**适用版本**: Flutter 3.10+ / Dart 3.0+
