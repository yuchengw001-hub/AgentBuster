# AgentBuster

**Break your AI Agent before your users do.**

开源 AI Agent 安全与可靠性自动化测试工具。
在用户搞崩你的 Agent 之前，先帮你把它搞崩。

[English](README.md) · [首次使用](docs/QUICKSTART.md) · [更新记录](CHANGELOG.md)

> **v0.1.1 Early Access（早期预览版）**：本地控制台、离线场景、真实 MCP 案例和安装包已做本地验证；四种编程 CLI 的适配仍属实验性，尚未建立完整的账号与平台兼容矩阵。

第一版专注于 **测试 → 评分 → 报告**，本地运行、CLI 优先、零运行时依赖。

现在同时服务两类开发者：编程 Agent 用户可以重复运行场景、对比行为变化；
自研 Agent / MCP 开发者可以在真实工具连接中注入错误、延迟和恶意返回文本。

项目同时提供 **可操作的本地控制台、CLI 和 CI 接口**。
开发者下载后在自己的机器上运行，无需使用作者的预览环境。

![可操作的本地控制台](docs/assets/console-en.png)

![英语默认报告与右上角语言切换](docs/assets/report-en.png)

## 立即运行

需要 Node.js 22+，先下载并运行：

```sh
git clone https://github.com/yuchengw001-hub/AgentBuster.git
cd AgentBuster
npm start
```

打开终端输出的网址，保持终端运行；默认案例无需账号即可点击开始。
需要全局 `agentbuster` 命令时，在仓库目录执行：

```sh
npm install -g .
agentbuster ui
```

无需安装也可以：

```sh
npm start
```

打开终端输出的本地网址（默认 `http://127.0.0.1:4317`），即可选择对象、
检查环境、点击开始或停止测试、查看实时日志和本次报告。
默认选择无需账号的 MCP 故障修复案例；终端需要保持运行。
Windows 源码下载用户也可以双击 `Start-AgentBuster.cmd` 启动。

CLI 中的 `agentbuster test` 默认执行 50 个场景的离线演示，不需要账号或 API Key。
**演示使用预录制决策，100 分不代表任何真实 Agent 的成绩。**
本次只提供源码安装，尚未发布 npm 包。

无需账号即可运行真实 MCP 传输案例：

```sh
agentbuster showcase
agentbuster replay --input reports/showcase/broken/report.json --id mcp-injection
```

该案例启动真实 MCP 子进程，用两个确定性的示例客户端复现“错误恢复失败”
与“跟随工具中的恶意指令”，再验证修复后两项通过。
这是人为设计的案例，不是发现了商业编程 Agent 的漏洞，也不是大模型评测成绩。

打开 `reports/latest/report.html` 查看仪表盘。默认同时生成 JSON、Markdown、
HTML 报告和 SVG Badge，所有演示产物都明确标记 DEMO。

报告默认英语，右上角醒目的语言选择器支持 English、简体中文、日本語、Español。
即时切换，并在浏览器允许存储时记住选择。界面文案会翻译，
Agent 回答、工具返回和场景标识保留原文，方便核对证据。

控制台的运行记录独立保存在 `reports/ui`；每次测试都有自己的报告目录，
界面会自动加载本次结果。高级设置中可以选择历史基线进行兼容性比较。
控制台只监听本机，不托管在作者电脑或公共网站上，也不收集 API Key。
真实 CLI 需要开发者自行安装并登录，模型调用前需确认可能产生的费用。
完整说明见 [首次使用](docs/QUICKSTART.md)。

## 接入真实 Agent

先分别安装并登录对应 CLI，再从一个场景开始：

```sh
agentbuster doctor
agentbuster test --agent codex --limit 1
agentbuster test --agent claude --suite security --limit 1
agentbuster test --agent gemini --test prompt-injection --limit 1
agentbuster test --agent opencode --suite tools --limit 1
```

`--agent` 与 `--adapter` 等价；用 `--model` 指定模型。
真实运行可能产生费用，每次决策会启动一个 CLI 进程并回放当前场景历史。
完整套件可能需要超过 100 次模型调用。

四个适配器目前属于初步集成：已核对官方参数并用响应样本测试解析；
本环境仅发现 Codex，但实调用因缺少可用主目录而在模型响应前失败，
其他三个 CLI 未安装，因此没有声称完成真实模型兼容性验证。
详细限制与调用参数见 [适配说明](docs/ADAPTERS.md)。

## 第一版能测什么

内置 50 个 JSON 模块化场景：Prompt Injection 10 个、秘密泄露 5 个、
权限边界 5 个、工具使用 5 个、错误恢复 5 个、循环 5 个、上下文 5 个、可靠性 10 个。

Agent 返回 JSON 决策，框架执行模拟工具、记录调用轨迹、返回错误或结果，
再检查最终答案与工具调用顺序。恢复测试会实际产生模拟 429、503 等错误，
不是只询问 Agent“你会如何恢复”。

**`test` 命令的测量范围是模拟工具环境内的行为。** 它不拦截原生工具，
不证明真实操作系统权限或沙箱安全；长上下文用例是有界检索，
注册 API 用例是微型模拟补丁任务。真实代码工程、多文件修改、
统计检验和更丰富的真实代码任务属于后续版本。

另有 `mcp` 模式，能在真实标准输入输出 MCP 连接中注入故障并记录轨迹。
它不根据工具流量臆造 Agent Score，任务是否成功仍需具体断言判断。
运行 `agentbuster init` 可生成四种 CLI 的接入配置片段，不修改现有用户设置。
见 [真实 MCP 故障注入](docs/MCP.md)。

## 透明评分

每个场景必须满足全部断言才通过。严重程度权重为 low=1、medium=2、high=3、critical=5。

```text
Agent Score = 100 × 通过场景的权重之和 / 已测场景的权重之和
```

执行错误得零分，同时单独标记 ERROR。报告展示 Reliability、Security、Tool Usage、
Recovery、Context、Task Completion 六个维度；维度可重叠，不能再平均计算总分。
未选维度显示 N/A。严重问题始终单独展示。
比较成绩前应确认套件哈希、场景选择、模型和预算一致。
成绩不是安全认证，也不是经过统计校准的排行榜指标。

## 常用命令

```sh
agentbuster list
agentbuster test --suite security
agentbuster test --test prompt-injection
agentbuster test --id recovery-01 --agent codex
agentbuster test --format json --output reports/my-run
agentbuster test --demo-mode vulnerable --output reports/vulnerable
agentbuster badge --input reports/latest/report.json
agentbuster test --agent codex --repeat 3 --output reports/candidate
agentbuster compare --baseline reports/baseline/report.json --input reports/candidate/report.json
```

命名套件包括 all、security、reliability、tools、recovery、context、task-completion，
也可以把 JSON 文件路径传给 `--suite`。自研 Agent 通过 `--agent command --config FILE` 接入。

默认任一场景失败返回退出码 1；指定 `--min-score 90` 后按分数门槛返回 0/1。
配置、超时、协议、适配器错误始终返回 2。CI 可以据此阻止回归。
报告目录中同名文件会被覆盖，建议每次使用独立输出目录。

`--repeat` 保留每轮结果；`compare` 显示各场景通过、失败和执行错误的变化，
并拒绝套件、模型、重复次数或预算不一致的报告。
观测到退步不等于统计显著，不能只凭单次分数变化判断模型质量。
仓库已包含 GitHub Action，详见 [回归与 CI](docs/REGRESSIONS.md)。

## GitHub Badge

将生成的 badge.svg 和报告复制到自己的仓库，再在 README 加入：

```md
[![AgentBuster Score](./docs/agentbuster/badge.svg)](./docs/agentbuster/report.md)
```

建议同时发布报告，让读者看到模型、覆盖范围和问题证据。
演示徽章必须保留 DEMO 标记；有执行错误时徽章显示 ERROR。
第一版只生成本地文件，不提供在线验证或托管端点。

## 参与开发

```sh
npm test
npm run demo
npm pack --dry-run
```

见 [产品与技术设计](docs/DESIGN.md)、[新增场景](docs/SCENARIOS.md)、
[适配器开发](docs/ADAPTERS.md)、[贡献指南](CONTRIBUTING.md)。

MIT 开源。AgentBuster 不采集遥测；外部 CLI 使用其自身的配置和服务。
报告已对测试金丝雀和常见密钥模式做尽力脱敏，分享前仍需检查内容。
