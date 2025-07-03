# 期刊分区查询插件

一个用于快速查询期刊分区信息的浏览器插件。

## 功能特点

- 🔍 **自动检测**: 自动识别当前网页的期刊信息
- 📚 **分区查询**: 显示中科院分区、JCR分区和影响因子
- 🖱️ **右键搜索**: 选中文本右键快速查询
- 🎨 **美观界面**: 现代化的用户界面设计
- 🌐 **多站点支持**: 支持Nature、Science、IEEE、ACM等主流学术网站
- 🚀 **实时数据**: 基于EasyScholar API的实时期刊数据

## 支持的学术网站

- Nature系列期刊 (nature.com)
- Science系列期刊 (science.org)
- IEEE期刊 (ieee.org)
- ACM期刊 (acm.org)
- Springer期刊 (springer.com)
- ScienceDirect (sciencedirect.com)
- Wiley期刊 (wiley.com)
- Taylor & Francis (tandfonline.com)
- PLOS期刊 (plos.org)
- PubMed (pubmed.ncbi.nlm.nih.gov)

## 使用方法

### 方法一：自动检测
1. 在学术期刊网站上浏览文章
2. 点击浏览器工具栏的插件图标
3. 插件会自动检测当前页面的期刊信息并显示分区

### 方法二：手动搜索
1. 点击插件图标打开弹窗
2. 在输入框中输入期刊名称
3. 点击"🔍 查询分区"按钮

### 方法三：右键搜索
1. 在网页上选中期刊名称
2. 右键选择"查询期刊分区"
3. 插件会自动搜索选中的期刊

## 安装方法

1. 下载插件文件到本地
2. 打开Chrome浏览器，进入扩展程序页面 (chrome://extensions/)
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择插件文件夹

## 技术特点

- 使用Chrome Extensions Manifest V3
- 支持内容脚本自动检测
- 集成EasyScholar API实时查询
- 响应式界面设计
- 支持CORS跨域请求

## 数据说明

插件使用EasyScholar API提供的数据，包含：
- 中科院分区（基础版和升级版）
- JCR分区和影响因子
- 各高校期刊分级标准
- EI收录状态
- ESI学科分类
- JCI期刊引证指标

## 注意事项

- 插件需要配置EasyScholar API
- API调用可能有次数限制，请合理使用
- 分区信息基于EasyScholar数据库，仅供参考
- 数据实时更新，确保信息准确性

## 开发者

期刊分区查询插件 v1.0 