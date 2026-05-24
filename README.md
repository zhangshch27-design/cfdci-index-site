# 中国金融机构数字化能力指数网页

本目录是可部署到 GitHub Pages 的静态站点。

## 结构

- `index.html`：网页入口。
- `assets/styles.css`：页面视觉样式。
- `assets/app.js`：筛选、排行和图表逻辑。
- `data/index-data.js`：由公开版指数 Excel 转出的前端数据。
- `data/public-index.csv`：CSV 下载版。
- `downloads/cfdci-public-index.xlsx`：公开版 Excel 下载文件。

## GitHub Pages

仓库推送到 GitHub 后，在 `Settings -> Pages` 中选择：

- Source: `Deploy from a branch`
- Branch: 当前主分支
- Folder: `/docs`

保存后，GitHub Pages 会把本目录作为网站根目录发布。

## 更新数据

当前数据来源为：

`03_测度结果/04_公开版指数/公开使用版.xlsx`

后续更新指数时，需要重新生成 `docs/data/index-data.js`、`docs/data/public-index.csv`，并替换 `docs/downloads/cfdci-public-index.xlsx`。
