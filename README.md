[![Logo Image](https://api.pterodactyl.top/logos/new/pterodactyl_china_logo.png)](https://pterodactyl.top)

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/pterodactyl-china/panel/ci.yaml?label=%E6%B5%8B%E8%AF%95&style=for-the-badge&branch=2.0-develop)
![Discord](https://img.shields.io/discord/122900397965705216?label=Discord&logo=Discord&logoColor=white&style=for-the-badge)
![GitHub Releases](https://img.shields.io/github/downloads/pterodactyl-china/panel/latest/total?style=for-the-badge)
![GitHub contributors](https://img.shields.io/github/contributors/pterodactyl-china/panel?style=for-the-badge)

# Pterodactyl 面板

**本仓库实时同步上游并进行简体中文汉化：界面文案、后端消息、邮件模板、命令行输出与 API 错误提示均已本地化，默认语言为中文、默认时区为 Asia/Shanghai。发布的 Releases 均通过 GitHub Actions 的构建与测试，并在发布前经过本地环境验证。**

> 汉化与维护：[Pterodactyl China](https://pterodactyl.top)（翼龙面板中国社区）。引用本站语言包或汉化文本时，请保留作者署名。

Pterodactyl® 是一款免费、开源的游戏服务器管理面板，使用 PHP、React 与 Go 构建。它以安全为核心设计，将所有游戏服务器运行在相互隔离的 Docker 容器中，同时为用户提供美观、直观的操作界面。

不必再妥协。让游戏服务器成为您平台上一等一的存在。

[![观看：Pterodactyl v2 介绍](.github/assets/v2-video.jpg)](https://www.youtube.com/watch?v=1ER4kv0jVEU)

## v2 有哪些新特性

本分支（`2.0-develop`）是 Pterodactyl v2 的开发分支，目前处于活跃开发中；当前稳定发布线位于 [`1.0-develop`](https://github.com/pterodactyl/panel/tree/1.0-develop)。

* **扩展 SDK** —— 通过带版本号的 API 扩展面板，无需修改核心文件，您的改动可以跨越版本升级继续生效。示例扩展见 [pterodactyl/extensions](https://github.com/pterodactyl/extensions)。
* **全面现代化的技术栈** —— Vite、React 19、TanStack Router 与 Query、Tailwind 4 以及 Laravel 13。
* **全新的管理后台** —— 管理与客户端区域合并为单一 React 应用，采用统一设计。
* **一键导入预设** —— 浏览预设目录并直接从面板导入。
* **基于设计令牌的主题系统** —— 无需重新构建即可更换面板外观。
* **依然 100% 免费开源** —— 一如既往采用 MIT 许可证。

## 文档

* [面板文档](https://pterodactyl.io/panel/1.0/getting_started.html)
* [Wings 文档](https://pterodactyl.io/wings/1.0/installing.html)
* [社区指南](https://pterodactyl.io/community/about.html)
* 或者通过 [Discord](https://discord.gg/pterodactyl) 获取更多帮助

## 赞助商

感谢以下赞助商对 Pterodactyl 开发工作的支持。[有意成为赞助商？](https://github.com/sponsors/pterodactyl)

| 公司/个人 | 关于 |
| ------- | ----- |
| [**VLssu公益服**](https://vlssu.cn) | 一个热衷于美好社区的我的世界服务器。 |
| [**速特互联**](https://www.suteidc.com) | 我的世界服务器出租，支持一键安装MOD插件 |
| [**裕米云计算**](https://comcorn.cn) | COMCORN公共服务平台，提供优质项目云资源支持 |

### 支持的游戏

Pterodactyl 通过 Docker 容器隔离每个实例，从而支持种类繁多的游戏。这让您无需在机器上堆砌大量依赖，就能运行游戏服务器。

我们核心支持的部分游戏包括：

* Minecraft —— 包含 Paper、Sponge、Bungeecord、Waterfall 等
* Rust
* Terraria
* Teamspeak
* Mumble
* Team Fortress 2
* Counter Strike: Global Offensive
* Garry's Mod
* ARK: Survival Evolved

除了内置的支持游戏外，社区也在不断拓展这款软件的边界，提供了大量额外的游戏支持，例如：

* Factorio
* San Andreas: MP
* Pocketmine MP
* Squad
* Xonotic
* Starmade
* Discord ATLBot，以及大多数其他 Node.js/Python 的 Discord 机器人
* [以及更多……](https://eggs.pterodactyl.io)

## 许可证

Pterodactyl® 版权所有 © 2015 - 2022 Dane Everitt 及贡献者。

代码基于 [MIT 许可证](./LICENSE.md) 发布。
