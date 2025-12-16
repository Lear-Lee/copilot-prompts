# Flutter 与 Dart 规范配置 - 快速参考

## 📁 已创建的文件

### 1. 核心规范
- ✅ `standards/core/dart-base.md` - Dart 语言基础规范
- ✅ `standards/frameworks/flutter.md` - Flutter 框架规范

### 2. Agent 配置
- ✅ `agents/flutter.agent.md` - Flutter 开发 Agent

### 3. 项目配置
- ✅ `configs/flutter-recipe.md` - Flutter 项目配置方案
- ✅ `my_flutter/.github/copilot-instructions.md` - 你的项目配置

---

## 🚀 快速使用

### 在 VS Code 中使用

1. **打开你的 Flutter 项目**
   ```bash
   cd /Users/pailasi/Work/my_flutter
   code .
   ```

2. **MCP 工具会自动识别 Flutter 项目**
   - 自动加载 Dart 和 Flutter 规范
   - 根据 import 智能推荐相关规范

3. **手动加载规范(推荐)**
   在开始编码前，调用:
   ```
   get_relevant_standards({ fileType: "dart" })
   ```

### 常见场景

#### 创建新 Widget
```
get_relevant_standards({ 
  fileType: "dart",
  imports: ["flutter"],
  scenario: "Widget 开发"
})
```

#### 使用 BLoC (你的项目)
```
get_relevant_standards({ 
  imports: ["flutter_bloc"],
  scenario: "状态管理"
})
```

#### 网络请求 (Dio)
```
get_relevant_standards({ 
  imports: ["dio"],
  scenario: "API 调用"
})
```

#### 本地认证
```
get_relevant_standards({ 
  imports: ["local_auth"],
  scenario: "生物识别认证"
})
```

---

## 📚 规范内容概览

### Dart 基础规范 (dart-base.md)

包含内容:
- ✅ 类型系统和空安全
- ✅ 函数和方法定义
- ✅ 异步编程 (async/await, Future, Stream)
- ✅ 类和对象
- ✅ 模式匹配和 Switch 表达式
- ✅ Records (记录类型)
- ✅ 集合操作
- ✅ 错误处理
- ✅ 命名规范
- ✅ 断言和调试
- ✅ 文档注释 (DartDoc)

### Flutter 框架规范 (flutter.md)

包含内容:
- ✅ Widget 设计 (StatelessWidget vs StatefulWidget)
- ✅ Widget 构造函数和组合
- ✅ 状态管理 (瞬时状态 vs 应用状态)
- ✅ 布局最佳实践 (响应式、避免溢出)
- ✅ 主题和样式 (ThemeData, ThemeExtension)
- ✅ 导航 (go_router, auto_route)
- ✅ 性能优化 (const, ListView.builder, 图片优化)
- ✅ 测试 (Widget 测试、集成测试)
- ✅ 国际化 (i18n)
- ✅ 无障碍访问
- ✅ 错误处理

### Flutter Agent (flutter.agent.md)

功能:
- 🎯 角色定义 (Flutter 开发专家)
- 📐 架构模式 (Clean Architecture 示例)
- 🎨 UI 开发规范 (Material Design 3)
- 🧪 测试规范 (完整示例)
- 🚀 性能优化清单
- 📦 常用包推荐
- 🔍 调试技巧

---

## 🎯 你的项目特点

根据 pubspec.yaml 分析:

### 已使用的技术
- **状态管理**: flutter_bloc + get
- **网络请求**: dio
- **本地存储**: shared_preferences + flutter_secure_storage
- **生物识别**: local_auth
- **国际化**: intl + flutter_localizations

### 推荐配置

#### 1. BLoC 状态管理
```dart
// 遵循 BLoC 模式
class UserBloc extends Bloc<UserEvent, UserState> {
  UserBloc() : super(UserInitial()) {
    on<LoadUser>(_onLoadUser);
  }
  
  Future<void> _onLoadUser(
    LoadUser event,
    Emitter<UserState> emit,
  ) async {
    emit(UserLoading());
    try {
      final user = await userRepository.getUser(event.id);
      emit(UserLoaded(user));
    } catch (e) {
      emit(UserError(e.toString()));
    }
  }
}
```

#### 2. Dio 网络配置
```dart
final dio = Dio(
  BaseOptions(
    baseUrl: 'https://api.example.com',
    connectTimeout: Duration(seconds: 5),
    receiveTimeout: Duration(seconds: 3),
    headers: {
      'Content-Type': 'application/json',
    },
  ),
);
```

#### 3. 生物识别认证
```dart
final localAuth = LocalAuthentication();

Future<bool> authenticate() async {
  try {
    final canCheck = await localAuth.canCheckBiometrics;
    if (!canCheck) return false;
    
    return await localAuth.authenticate(
      localizedReason: '请验证身份以继续',
      options: const AuthenticationOptions(
        stickyAuth: true,
        biometricOnly: true,
      ),
    );
  } catch (e) {
    return false;
  }
}
```

---

## ⚙️ 开发工作流

### 1. 开始新功能
```bash
# 1. 创建分支
git checkout -b feature/user-profile

# 2. 在 VS Code 中打开
code .

# 3. 在 Copilot Chat 中加载规范
get_relevant_standards({ fileType: "dart", imports: ["flutter_bloc"] })

# 4. 开始编码
```

### 2. 编码过程
- ✅ 遵循加载的规范
- ✅ 使用 const 构造函数
- ✅ 编写测试
- ✅ 添加文档注释

### 3. 提交前检查
```bash
# 格式化代码
dart format .

# 分析代码
dart analyze

# 运行测试
flutter test

# 提交
git add .
git commit -m "feat: add user profile screen"
```

---

## 📖 学习资源

### 官方文档
- [Flutter Documentation](https://flutter.dev/docs)
- [Dart Language Tour](https://dart.dev/language)
- [Effective Dart](https://dart.dev/effective-dart)

### BLoC 相关
- [BLoC Library](https://bloclibrary.dev/)
- [BLoC Pattern](https://www.didierboelens.com/2018/08/reactive-programming-streams-bloc/)

### 性能优化
- [Flutter Performance Best Practices](https://flutter.dev/docs/perf/best-practices)
- [Flutter DevTools](https://flutter.dev/docs/development/tools/devtools/overview)

---

## 🔧 故障排查

### MCP 工具无法加载?
1. 确保 MCP 服务器已启动
2. 检查 VSCode 设置中的 MCP 配置
3. 重启 VS Code

### 规范加载不正确?
```
# 使用智能加载
get_smart_standards()

# 或手动指定
get_relevant_standards({ 
  fileType: "dart",
  imports: ["flutter", "flutter_bloc"],
  scenario: "状态管理"
})
```

### 需要更多帮助?
查看项目文档:
- `copilot-prompts/docs/getting-started/QUICK_START.md`
- `copilot-prompts/docs/guides/BEST_PRACTICES.md`

---

## ⚙️ 项目配置优化

### .gitignore 配置

**重要**: 自动生成的 `.github/copilot-instructions.md` 不应提交到版本控制。

在你的 Flutter 项目根目录的 `.gitignore` 中添加:

```gitignore
# Copilot 配置（自动生成，不提交）
.github/copilot-instructions.md
```

**原因**:
- ✅ 该文件由 MCP 工具自动生成
- ✅ 不同开发者可能需要不同的配置
- ✅ 避免团队协作时的配置冲突
- ✅ 保持仓库清洁

**推荐做法**:
1. 将 `.github/copilot-instructions.md` 添加到 `.gitignore`
2. 在项目 README 中说明如何生成配置
3. 可选: 提供 `.github/copilot-instructions.template.md` 作为模板

---

**创建日期**: 2025-12-16  
**维护团队**: MTA团队(蘑菇与吐司的AI团队)
