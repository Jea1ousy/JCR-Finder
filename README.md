# 📚 期刊分区查询助手 (JCR Finder)

> 一个快速查询期刊分区信息的Chrome浏览器插件，支持自动检测页面期刊、手动搜索和右键查询三种方式。

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-green?logo=google-chrome)](javascript:void(0))
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)](https://developer.chrome.com/docs/extensions/mv3/)
[![Version](https://img.shields.io/badge/version-1.0-brightgreen)](javascript:void(0))
[![License](https://img.shields.io/badge/license-MIT-blue)](javascript:void(0))

## 📋 目录

- [✨ 功能特点](#-功能特点)
- [🌐 支持的学术网站](#-支持的学术网站)
- [🚀 快速开始](#-快速开始)
  - [前置要求](#前置要求)
  - [安装步骤](#安装步骤)
- [📖 使用指南](#-使用指南)
- [⚙️ 配置说明](#️-配置说明)
- [🛠️ 技术架构](#️-技术架构)
- [📊 数据来源](#-数据来源)
- [📄 许可证](#-许可证)

## ✨ 功能特点

- 🔍 **智能检测**: 自动识别当前网页的期刊信息，无需手动输入
- 📚 **全面分区**: 显示中科院分区、JCR分区和影响因子等详细信息
- 🖱️ **右键搜索**: 选中期刊名称右键即可快速查询分区信息
- 🎨 **现代界面**: 美观的Material Design风格用户界面
- 🌐 **广泛支持**: 支持Nature、Science、IEEE、ACM等主流学术网站
- 🚀 **实时数据**: 基于EasyScholar API的最新期刊数据
- ⚡ **快速响应**: 优化的查询算法，秒级响应速度
- 🔧 **可配置**: 支持自定义API配置和查询设置

## 🌐 支持的学术网站

| 网站类型 | 支持的域名 | 自动检测 |
|---------|-----------|---------|
| Nature系列 | nature.com | ✅ |
| Science系列 | science.org | ✅ |
| IEEE期刊 | ieee.org | ✅ |
| ACM期刊 | acm.org | ✅ |
| Springer | springer.com | ✅ |
| ScienceDirect | sciencedirect.com | ✅ |
| Wiley | wiley.com | ✅ |
| Taylor & Francis | tandfonline.com | ✅ |
| PLOS | plos.org | ✅ |
| PubMed | pubmed.ncbi.nlm.nih.gov | ✅ |

## 🚀 快速开始

### 前置要求

- Chrome浏览器或其他基于Chromium的浏览器
- EasyScholar API密钥

### 安装步骤

1. **下载源码**
   ```bash
   git clone https://github.com/Jea1ousy/JCR-Finder.git
   cd JCR-Finder
   ```

2. **加载插件**
   - 打开Chrome浏览器
   - 访问 `chrome://extensions/`
   - 开启右上角的"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择项目文件夹

3. **配置API (可选)**
   - 点击插件图标
   - 点击设置按钮 ⚙️
   - 输入你的EasyScholar API密钥

## 📖 使用指南

### 方法一：自动检测 🚀

1. 访问支持的学术期刊网站
2. 插件自动检测页面期刊信息并显示分区

### 方法二：手动搜索 ✏️

1. 点击插件图标打开弹窗
2. 自动获取期刊名称或在搜索框中输入期刊名称
3. 点击"🔍 查询分区"按钮或按回车键

### 方法三：右键搜索 🖱️

1. 在任意网页上选中期刊名称
2. 右键选择"查询期刊分区"
3. 插件自动搜索并显示结果

## ⚙️ 配置说明

### API设置

插件支持配置自定义的EasyScholar API参数：

- **API密钥**: 提高查询频率限制
- **API地址**: 自定义API服务地址
- **自动弹出**: 控制是否在检测到期刊时自动弹出

### 权限说明

插件请求的权限及用途：

| 权限 | 用途 |
|------|------|
| `activeTab` | 获取当前页面信息进行期刊检测 |
| `scripting` | 注入内容脚本实现自动检测功能 |
| `storage` | 存储用户设置和API配置 |
| `contextMenus` | 提供右键菜单查询功能 |
| `notifications` | 显示查询结果通知 |

## 🛠️ 技术架构

```
JCR-Finder/
├── manifest.json          # 插件配置文件 (Manifest V3)
├── popup.html             # 弹窗界面
├── popup.js               # 弹窗逻辑和API调用
├── background.js          # 后台服务工作器
├── content.js             # 内容脚本，页面信息检测
├── icon/                  # 插件图标资源
└── README.md              # 项目文档
```

### 核心技术

- **Chrome Extensions Manifest V3**: 最新的扩展程序架构
- **Service Worker**: 后台服务处理
- **Content Scripts**: 页面内容检测
- **Chrome Storage API**: 本地数据存储
- **EasyScholar API**: 期刊数据查询接口

## 📊 数据来源

本插件使用 **EasyScholar API** 提供的数据，包含：

| 数据类型 | 说明 |
|---------|------|
| 中科院分区 | 基础版和升级版分区信息 |
| CCF分区 | CCF分区信息
| JCR分区 | Journal Citation Reports分区 |
| 影响因子 | 最新的期刊影响因子数据 |
| 高校分级 | 各高校期刊分级标准 |
| EI收录 | Engineering Index收录状态 |
| ESI学科 | Essential Science Indicators分类 |
| JCI指标 | Journal Citation Indicator |

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

<div align="center">

**[⬆ 回到顶部](#-期刊分区查询助手-jcr-finder)**

Made with ❤️ by [Jea1ousy](https://github.com/Jea1ousy)

</div> 