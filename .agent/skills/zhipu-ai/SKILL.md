---
name: zhipu-ai
description: 智谱AI (BigModel) 集成指南与 API 参考。包含模型调用、鉴权、HTTP/SDK 使用规范，适用于 GLM-4, GLM-4V 等模型的集成。
---

# 智谱AI (BigModel) Skill

此技能为本项目提供智谱AI大模型的集成规范和 API 参考。智谱AI API 深度兼容 OpenAI API 格式。

## 核心配置

- **Base URL**: `https://open.bigmodel.cn/api/paas/v4/`
- **认证方式**: 
  - Header: `Authorization: Bearer <Your_API_Key>`
  - API Key 建议存储在环境变量 `ZHIPUAI_API_KEY` 中。

## 主要模型

| 模型名称 | 描述 | 特点 |
| :--- | :--- | :--- |
| `glm-4` | 旗舰模型 | 综合能力最强，支持 128k 上下文 |
| `glm-4-flash` | 轻量级模型 | 速度快，响应延迟低，性价比高 |
| `glm-4v` | 视觉模型 | 支持图像理解和分析 |
| `cogview-3` | 图像生成 | 基于文本提示词生成高分辨率图像 |

## 集成方式

### 1. HTTP 直接调用 (推荐用于简单集成)

```javascript
const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.ZHIPUAI_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: "glm-4",
    messages: [
      { role: "user", content: "你好，请介绍一下你自己。" }
    ],
    stream: false,
    temperature: 0.7
  })
});
const data = await response.json();
```

### 2. Node.js SDK 安装

```bash
npm install zhipuai
```

使用示例：
```javascript
const { ZhipuAI } = require("zhipuai");
const client = new ZhipuAI({ apiKey: process.env.ZHIPUAI_API_KEY });

async function chat() {
  const response = await client.chat.completions.create({
    model: "glm-4",
    messages: [{ role: "user", content: "生成一个 React 组件" }],
  });
  console.log(response.choices[0].message);
}
```

## 关键参数说明

- **`messages`**: 必须是对象数组，`role` 可选 `system`, `user`, `assistant`, `tool`。
- **`temperature`**: (0, 1] 默认 0.95。值越小输出越稳定。
- **`top_p`**: (0, 1) 默认 0.7。
- **`tools`**: 用于 Function Calling，格式与 OpenAI 相同。

## 注意事项

1. **Token 限制**: 不同模型有不同的 `max_tokens` 限制。
2. **安全性**: 严禁将 API Key 硬编码在前端代码中，必须通过后端 API 或环境变量转发。
3. **错误处理**: 
   - `401`: 认证失败（API Key 错误）。
   - `429`: 请求过快（触发频率限制）。
   - `500`: 智谱服务器内部错误。

## 任务执行建议
- 当用户要求集成对话功能时，优先考虑 `glm-4-flash` 以降低成本，重要任务使用 `glm-4`。
- 如果需要处理图片，请提示用户使用 `glm-4v`。
