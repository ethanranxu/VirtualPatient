---
name: skills
description: 使用 npx skills 来发现、安装、更新和管理 Agent Skills。当你需要扩展自己的功能（如生成发布日志、PR 评审、集成第三方工具等）时，请使用此技能。
---

# Agent Skills 管理器

此技能允许你使用 [vercel-labs/skills](https://github.com/vercel-labs/skills) 提供的命令行工具来管理本项目的 Agent Skills。

## 什么时候使用

- 用户询问“如何做某事”且该任务可能有现成的技能库时（例如：“如何提升 React 性能？”）。
- 用户明确要求“查找关于 X 的技能”。
- 你想要扩展自己的能力，例如处理特定格式的文件、自动化 Git 流程等。
- 需要更新或清理已安装的技能。

## 核心操作

### 1. 查找技能
当你识别到用户需求可能匹配一个已有的技能时，执行查找：

```bash
npx skills find [关键词]
```

例如：
- 查找 React 相关技能：`npx skills find react`
- 查找 PR 评审技能：`npx skills find pr review`

### 2. 安装技能
找到合适的技能后，可以安装到本项目：

```bash
npx skills add <owner/repo@skill>
```

- `-g`: 全局安装。
- `-y`: 自动确认。

### 3. 初始化新技能
如果你需要为一个特定的任务创建自定义指令集，可以初始化一个新技能：

```bash
npx skills init [技能名称]
```

### 4. 维护技能
- **检查更新**: `npx skills check`
- **更新技能**: `npx skills update`
- **移除技能**: `npx skills remove <技能名称>`

## 技能发现建议

- **Web 开发**: react, nextjs, typescript, tailwind
- **测试**: playwright, jest, cypress
- **质量**: lint, refactor, review
- **生产力**: git, changelog, deploy

## 找不到技能时
如果在 [skills.sh](https://skills.sh) 上找不到匹配的技能，请告知用户，并提供使用内置能力解决问题的方案，或建议用户创建一个新技能。
