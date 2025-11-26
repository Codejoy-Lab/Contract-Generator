# 实习合同自动生成工具

酷爱科技内部工具 - 根据录用通知邮件自动生成实习协议 Word 文档。

## 功能特点

- 粘贴录用通知邮件，AI 自动识别关键信息
- 支持手动修改和补充信息
- 一键生成标准格式的实习协议 Word 文档
- 自动下载生成的合同文件

## 部署到 Vercel

### 1. 准备工作

确保你有：
- GitHub 账号
- Vercel 账号（可用 GitHub 登录）
- DeepSeek API Key

### 2. 推送代码到 GitHub

```bash
# 如果还没有创建 GitHub 仓库，先在 GitHub 上创建一个新仓库

# 添加远程仓库
git remote add origin https://github.com/你的用户名/intern-contract-generator.git

# 推送代码
git push -u origin master
```

### 3. 在 Vercel 部署

1. 访问 [Vercel](https://vercel.com) 并登录
2. 点击 "Add New Project"
3. 选择你的 GitHub 仓库
4. 在 "Environment Variables" 中添加：
   - 变量名：`DEEPSEEK_API_KEY`
   - 变量值：你的 DeepSeek API Key
5. 点击 "Deploy"

### 4. 完成

部署成功后，Vercel 会提供一个域名（如 `xxx.vercel.app`），即可访问使用。

## 本地开发

```bash
# 安装依赖
npm install

# 创建 .env 文件
cp .env.example .env
# 编辑 .env 填入你的 DEEPSEEK_API_KEY

# 启动开发服务器
npm run dev
```

## 技术栈

- 前端：原生 HTML/CSS/JavaScript
- 后端：Vercel Serverless Functions (Node.js)
- AI：DeepSeek API
- Word 生成：docx 库

## 文件结构

```
├── api/
│   ├── extract.js      # 邮件信息提取 API
│   ├── generate.js     # Word 合同生成 API
│   └── template-config.js
├── public/
│   └── index.html      # 前端页面
├── vercel.json         # Vercel 配置
├── package.json
└── README.md
```
