# AWS 和 DynamoDB 集成指南

## 概述

本文档说明如何将现有的用户行为分析系统与 AWS DynamoDB 集成，实现数据双写（同时写入 SQLite 和 DynamoDB）。

## 前提条件

1. AWS 账户
2. AWS IAM 用户访问密钥
3. Node.js 环境
4. 已安装的 AWS SDK

## 配置步骤

### 1. AWS 凭证设置

创建 `.env` 文件并添加以下内容：
```
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-1
```

### 2. DynamoDB 表结构

创建以下 DynamoDB 表以匹配现有的 SQLite 结构：

#### user_visits 表
- 主键：userId (String)
- 排序键：timestamp (Number)
- 属性：
  - pageUrl (String)
  - duration (Number)
  - isBounce (Boolean)

#### user_clicks 表
- 主键：userId (String)
- 排序键：timestamp (Number)
- 属性：
  - pageUrl (String)
  - buttonType (String)

#### page_metrics 表
- 主键：pageUrl (String)
- 属性：
  - totalVisits (Number)
  - totalDuration (Number)
  - bounceCount (Number)

#### user_metrics 表
- 主键：userId (String)
- 属性：
  - totalClicks (Number)
  - totalDuration (Number)
  - mostClickedPage (String)
  - mostBrowsedPage (String)
  - conversionRate (Number)

### 3. 安装依赖

```bash
npm install aws-sdk dotenv
```

### 4. 代码集成

现有的 `behavior-tracker.js` 和 `server.js` 已经包含了 DynamoDB 集成代码。确保：

1. `server.js` 中已正确配置 AWS SDK
2. 环境变量已正确加载
3. DynamoDB 客户端已正确初始化

### 5. 数据同步

系统会自动将数据同时写入 SQLite 和 DynamoDB：
- 页面访问数据写入 `user_visits` 表
- 点击数据写入 `user_clicks` 表
- 页面指标更新 `page_metrics` 表
- 用户指标更新 `user_metrics` 表

## 现有代码说明

### 1. 服务器端集成

`server.js` 中已经包含：
- AWS SDK 配置
- DynamoDB 客户端初始化
- `/api/behavior/dynamo` 端点用于接收行为数据

### 2. 客户端集成

`behavior-tracker.js` 中已经包含：
- 页面访问跟踪
- 点击事件跟踪
- 数据双写逻辑（同时发送到 SQLite 和 DynamoDB）

### 3. 数据一致性

系统采用双写策略：
1. 首先写入 SQLite 数据库
2. 然后异步写入 DynamoDB
3. 如果 DynamoDB 写入失败，不会影响 SQLite 操作

## 监控和维护

### 1. CloudWatch 监控

建议设置以下 CloudWatch 监控：
- DynamoDB 表的读写容量
- 错误率监控
- 延迟监控

### 2. 备份策略

- 启用 DynamoDB 自动备份
- 设置跨区域复制
- 定期验证备份完整性

## 安全注意事项

1. 永远不要在代码中硬编码 AWS 凭证
2. 使用 IAM 角色和策略限制访问权限
3. 启用 DynamoDB 加密
4. 定期轮换访问密钥

## 故障排除

### 常见问题

1. **连接错误**
   - 检查 AWS 凭证是否正确
   - 验证网络连接
   - 确认 IAM 权限

2. **写入失败**
   - 检查表容量设置
   - 验证数据格式
   - 检查错误日志

3. **性能问题**
   - 调整读写容量
   - 优化查询模式
   - 使用批量写入

## 支持

如有问题，请联系系统管理员或参考 AWS 文档：
- [DynamoDB 文档](https://docs.aws.amazon.com/dynamodb/)
- [AWS SDK for JavaScript 文档](https://docs.aws.amazon.com/sdk-for-javascript/) 