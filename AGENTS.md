# AGENTS.md

## 项目约束

- 包管理器必须使用 `pnpm`。
- 应用应实现为一个真实可运行的 Web 项目，而不是仅用于展示的静态设计文件。
- 优先选择轻量级前端技术栈，以支持快速迭代，并便于后续接入题目流程与结果逻辑。
- 当前目标是先产出一个精致、具备正式产品质感的依恋类型测试落地页/开始页，而不是完整的测试流程。
- 页面内容需要与以下资料保持一致：
  - [docs/specs/attachment-question-bank.md](/Users/lijuwei/Documents/workspace/attachment-style-test/docs/specs/attachment-question-bank.md)
  - [data/question-banks/attachment-style-bank.v2.json](/Users/lijuwei/Documents/workspace/attachment-style-test/data/question-banks/attachment-style-bank.v2.json)

## UX 约束

- 页面应呈现出一个真正可上线产品页的质感。
- 优先采用居中、单栏的结构，风格接近正式测试产品的落地页。
- 排版应适中且易读，避免使用过大的 Hero 主标题。
- 采用浅色、柔和、低饱和的极简粉彩配色，而不是厚重的土地色系。
- 从一开始就必须保证移动端可用性。
- 每个页面都必须完成移动端适配，确保在常见手机尺寸下布局、字号、间距与交互均可正常使用。

## 实现说明

- 框架可以自行选择，但整体方案应保持简单、易维护。
- 在适合的地方应使用题库中的本地结构化数据来承载真实内容，而不是占位用的 lorem ipsum。
- 实现应面向后续扩展：先完成开始页，下一步再接入测试流程。
