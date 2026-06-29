# iOS App Store Code Package Check

检查日期：2026-06-27（America/Los_Angeles）

## 结论

代码包体已通过 iOS Release archive 验证，当前没有发现会阻止原生归档的代码或资源问题。

仍需在上传前补齐 App Store 分发签名环境：本机导出 App Store Connect IPA 时失败，原因是当前 Xcode 账号没有可用 App Store Connect provider，且缺少 `com.relaxreading.app` 的 App Store 分发描述文件和 `iOS Distribution` 证书。

## 已修复

- 统一首发版本号为 `1.0`：
  - Expo `version`: `1.0`
  - App 内展示版本：`1.0`
  - Xcode `MARKETING_VERSION`: `1.0`
  - Archive 内 `CFBundleShortVersionString`: `1.0`
- 统一首发 Build 号为 `1`：
  - Expo iOS `buildNumber`: `1`
  - Xcode `CURRENT_PROJECT_VERSION`: `1`
  - Archive 内 `CFBundleVersion`: `1`
- `Info.plist` 的版本字段改为跟随 Xcode build settings：
  - `CFBundleShortVersionString = $(MARKETING_VERSION)`
  - `CFBundleVersion = $(CURRENT_PROJECT_VERSION)`
- EAS production 配置增加 iOS 正式构建入口，并设置生产 API：
  - `EXPO_PUBLIC_API_URL=https://reading.nihaoya.cloud`

## 自动检查结果

- TypeScript：通过 `npx tsc --noEmit`。
- Expo 配置：通过 `npx expo config --type public`，确认 iOS Bundle ID 为 `com.relaxreading.app`，版本 `1.0`，Build `1`。
- Xcode Release build settings：通过，确认 Team ID `57N7W22C7V`、Bundle ID、iPhone-only、deployment target `15.1`、AppIcon、entitlements、Info.plist 路径正确。
- Plist/JSON：`Info.plist`、`PrivacyInfo.xcprivacy`、`app.json`、`eas.json`、AppIcon Contents 均可解析。
- 生产服务：
  - `https://reading.nihaoya.cloud/privacy` 返回 HTTP 200。
  - `https://reading.nihaoya.cloud/books` 返回书籍 JSON。
- 图标和启动资源：
  - iOS 1024 图标尺寸 `1024x1024`，无 alpha。
  - Expo `assets/icon.png` 尺寸 `1024x1024`，无 alpha。
  - `assets/splash-icon.png` 尺寸 `400x400`，无 alpha。
- 隐私清单：
  - App 自身 `PrivacyInfo.xcprivacy` 已进入 archive。
  - Expo、React Native、AsyncStorage、ExpoFileSystem 等依赖 privacy bundle 已进入 archive。
  - App 自身声明 `NSPrivacyTracking=false`，无 collected data types，并覆盖 UserDefaults、FileTimestamp、DiskSpace、SystemBootTime required reason APIs。
- Release archive：
  - `xcodebuild archive` 成功。
  - 产物路径：`build/appstore-check/RelaxReading.xcarchive`
  - Archive 内 Bundle ID：`com.relaxreading.app`
  - Archive 内显示名：`轻读Relax Reading`
  - Archive 内版本：`1.0 (1)`
  - Archive 内 `ITSAppUsesNonExemptEncryption=false`
  - Archive 内 `UIDeviceFamily=[1]`，即 iPhone-only。

## 待办项

- 阻塞上传：在 Apple Developer / App Store Connect 账号中补齐分发签名环境：
  - 确认当前 Apple ID 关联了 App Store Connect provider。
  - 创建或下载 `iOS Distribution` 证书。
  - 创建或下载 `com.relaxreading.app` 的 App Store provisioning profile。
  - 重新执行 App Store Connect 导出或用 Xcode Organizer 上传。
- 运行冒烟：当前没有已启动模拟器，本次未自动启动模拟器；上传前请用 Release 真机或模拟器确认首页、阅读页、继续阅读、设置页隐私政策跳转、无网缓存。
- “想读的书”提交：线上提交会真实写入生产数据，本次未向生产环境写入测试内容；上传前建议安排一次可清理的手工提交验证。
- Warning 复核：archive 中仍有 Expo/React Native 第三方 nullability、Hermes/RN script phase、Metro bundle 全局变量 warning；本次未发现项目代码 error，且 archive 成功。建议作为非阻塞项跟踪。
