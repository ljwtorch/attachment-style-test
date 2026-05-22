# 心理测试类网站 · 设计与工程规范文档

> 本文档以「依恋类型测试」项目为原型提炼，供 agent 在接到新主题时参照使用。
> 
> **使用方式**：提供「网站主题」+ 本文档 + 题库 JSON，agent 即可完成网站建设。

---

## 一、项目架构总览

### 类型

单页 Web 心理测试应用（SPA）。用户从首页进入，完成若干题目后查看个性化结果报告。

### 技术栈

| 技术 | 说明 |
|------|------|
| React 19 | 前端框架 |
| TypeScript 5 | 类型安全 |
| Vite 7 | 构建工具 |
| 纯 CSS | 样式（无 Tailwind / CSS-in-JS / 动画库） |
| pnpm | 包管理器 |

**无任何外部 UI 组件库，无 Framer Motion，所有动画效果均用 CSS transition / keyframes 实现。**

### 文件结构（新项目模板）

```
{project-name}/
├── data/
│   └── question-banks/
│       └── {theme}-bank.json        ← 题库（唯一内容文件，按主题替换）
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx                     ← 入口，无需修改
│   ├── App.tsx                      ← 主逻辑，需按主题修改少量内容
│   ├── styles.css                   ← 样式，需添加分类颜色类
│   ├── AnnouncementModal.tsx        ← 公告弹窗，可完整复用
│   └── testEngine.ts                ← 评分引擎，需按题库调整类型定义
├── index.html                       ← 修改 title / meta
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### 三视图架构

```
Landing（首页介绍）
    ↓ 点击"开始答题"
Quiz（答题流程）
    ↓ 最后一题作答完成后自动跳转
Result（结果页）
    ↓ "返回首页" 或 "再测一次"
Landing / Quiz
```

视图切换通过 React state `view: "landing" | "quiz" | "result"` 控制，无路由库。

---

## 二、UI 设计规范

### 2.1 颜色系统

**颜色方案随主题变化，不固定。** agent 根据主题情感自行设计，遵循以下原则：

**分类色（必须）**
- 每个结果分类（style）配一对颜色：
  - **主色**：用于图标、边框强调、条形图填充
  - **浅背景色**：用于卡片背景、选中态背景
- 浅背景色 ≈ 主色 + 高亮度低饱和度（通常是主色以 10-15% opacity 叠在白色上的视觉效果）
- 颜色情感应与分类性格特征呼应
- 整体基调推荐低饱和度柔和色，避免过于刺眼的原色（参考：蓝紫、粉、绿、琥珀等软色系）

**中性色（可随主题微调）**
- 文字主色：近深蓝灰（当前：`#23304d`）
- 文字次色：中灰蓝（当前：`#67748f`）
- 文字辅色/标签色：（当前：`#5e6c8c`）
- 页面背景：近白（当前：`#fbfbff`）
- 卡片边框：浅蓝灰（当前：`#dde4f4`）

**依恋测试颜色参考（仅示例，新主题请重新设计）**
```css
/* 安全型 */ color: #5f89d8;  background: #e7efff;
/* 焦虑型 */ color: #d18ca4;  background: #ffeaf2;
/* 回避型 */ color: #62a2a8;  background: #e6f7f8;
/* 混乱型 */ color: #8b7ad9;  background: #f0ebff;
```

**注入方式（固定模式，CSS 类名）**
```css
/* 为每个分类 ID 添加一组 CSS 类 */
.style-accent-{id} {
  color: {主色};
  background: {浅背景色};
}

/* 条形图填充：用渐变增加质感 */
.distribution-fill.style-accent-{id} {
  background: linear-gradient(90deg, {主色淡版} 0%, {主色深版} 100%);
}
```

### 2.2 字体系统

字体**随主题可变**，但必须满足：
- **可商用无版权风险**（OFL / Apache 2.0 / CC0）
- 支持中文（若内容为中文）

**推荐字体**
| 字体 | 风格 | 授权 | 引入方式 |
|------|------|------|---------|
| Noto Sans SC | 现代无衬线 | OFL | Google Fonts |
| LXGW WenKai | 手写楷体 | OFL | GitHub CDN |
| Source Han Sans | 思源黑体 | OFL | Adobe / Google |
| Inter | 英文无衬线 | OFL | Google Fonts |
| Geist | 现代英文 | OFL | Vercel CDN |

字体通过 `index.html` 的 `<link>` 引入，在 `styles.css` 的 `:root` 中声明并设置系统回退栈：
```css
:root {
  font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
}
```

**字体层级比例（相对关系保持，具体值可微调）**

| 层级 | 参考大小 | 粗细 | 用途 |
|------|---------|------|------|
| H1 主标题 | `clamp(32px, 4.2vw, 44px)` | 800 | Hero 区大标题 |
| H2 区块标题 | 24px | 600 | 各区块标题 |
| H3 小标题 | 16px | 600 | 卡片内小标题 |
| Kicker 标签 | 18px | 700 | 区块英文/类目标签 |
| 正文 | 15-16px | 400 | 说明内容，行高 1.7-1.9 |
| 小字 | 13-14px | 400 | 提示、备注，行高 1.6 |

### 2.3 间距、圆角与阴影

**圆角**
- 主卡片（hero-card, content-card）：`border-radius: 24px`
- 分类卡片、选项卡片：`border-radius: 18px`
- 分布条目：`border-radius: 20px`
- 按钮：`border-radius: 14px`（常规）/ `999px`（胶囊型 pill）

**阴影**
```css
/* 主卡片静止阴影 */
box-shadow: 0 16px 36px rgba(95, 114, 161, 0.08);
/* 弹窗阴影 */
box-shadow: 0 28px 70px rgba(63, 81, 125, 0.22);
/* 确认气泡阴影 */
box-shadow: 0 18px 40px rgba(85, 104, 153, 0.14);
```

**页面布局**
```css
.page-shell { min-height: 100vh; padding: 28px 16px 40px; }
.home-page { width: min(100%, 860px); margin: 0 auto; }
.content-card { margin-top: 18px; padding: 20px 24px 24px; }
```

### 2.4 页面背景

使用多重径向渐变实现柔和视觉：
```css
body {
  background:
    radial-gradient(circle at 20% 0%, rgba(226, 229, 255, 0.48), transparent 25%),
    radial-gradient(circle at 84% 10%, rgba(255, 224, 235, 0.44), transparent 22%),
    linear-gradient(180deg, #fdfdff 0%, #f6f8fd 100%);
}
```
颜色可随主题调整，渐变光源位置和形状不变。

---

## 三、组件目录

### 3.1 基础卡片

```css
.hero-card, .content-card {
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 36px rgba(95, 114, 161, 0.08);
  border: 1px solid #dde4f4;
}

/* Hero 区（首页/答题页/结果页顶部大卡片） */
.hero-card { padding: 34px 26px 28px; text-align: center; }

/* 内容区（介绍、答题、分布图等内容容器） */
.content-card { margin-top: 18px; padding: 20px 24px 24px; }
```

### 3.2 Hero 区元素

**徽章**（首页标志圆形图标）
```css
.hero-mark {
  width: 72px; height: 72px; margin: 0 auto;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(180deg, #eef2ff 0%, #e6ecff 100%);
  color: #6a8fd6; font-size: 30px;
  box-shadow: 0 10px 26px rgba(106, 143, 214, 0.14);
}
```

**Kicker / 标签文字**（区块英文标注，如 "Attachment Reflection"）
```css
.hero-kicker, .section-kicker {
  color: #5e6c8c; font-size: 18px; font-weight: 700; letter-spacing: 0.01em;
}
```

**信息 Pills**（横排信息胶囊，如"55道母题 · 38题/次"）
```css
.hero-pills span {
  min-height: 38px; padding: 0 14px;
  border-radius: 999px; background: #f5f7ff; border: 1px solid #e1e7f7;
  color: #687490; font-size: 13px;
}
```

### 3.3 分类卡片（首页展示各分类简介）

```css
.style-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));  /* 桌面 4 列 */
  gap: 14px; margin-top: 22px;
}

.style-card {
  min-height: 170px; padding: 16px 14px; border-radius: 18px;
  border: 1px solid #e2e8f8;
  background: linear-gradient(180deg, #f5f7ff 0%, #edf3ff 100%);
  text-align: center;
}

/* 分类图标圆形容器 */
.style-icon {
  width: 44px; height: 44px; margin: 0 auto;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
}
.style-icon svg { width: 26px; height: 26px; }
```

颜色通过 `.style-accent-{id}` 类注入，卡片图标容器和 SVG 颜色均取自该类。

### 3.4 答题选项卡片

```css
.option-card {
  width: 100%; padding: 14px 16px 14px 14px; border-radius: 18px;
  border: 1px solid #dfe6f5;
  background: linear-gradient(180deg, rgba(250,251,255,0.98) 0%, rgba(243,247,255,0.96) 100%);
  display: flex; align-items: center; gap: 12px;
  color: #44516e; text-align: left; cursor: pointer;
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease;
}

.option-card:hover {
  transform: translateY(-1px);
  border-color: #cfd9f1;
  box-shadow: 0 14px 28px rgba(97, 122, 180, 0.1);
}

.option-card.is-selected {
  border-color: #7b95e8;
  background: linear-gradient(180deg, rgba(241,245,255,1) 0%, rgba(232,239,255,0.98) 100%);
  box-shadow: 0 16px 32px rgba(109, 132, 203, 0.14);
}

/* 选项字母徽章（A/B/C/D） */
.option-badge {
  width: 34px; height: 34px; border-radius: 12px;
  background: #eef2ff; color: #5c75c9; font-weight: 800; flex: 0 0 auto;
}
```

### 3.5 进度条

```css
.progress-track {
  height: 10px; margin-top: 16px; border-radius: 999px;
  background: #edf2fe; overflow: hidden;
}

.progress-fill {
  display: block; height: 100%; border-radius: inherit;
  background: linear-gradient(90deg, #8ba2f0 0%, #6c87df 100%);
  transition: width 220ms ease;   /* 关键：宽度过渡产生平滑填充效果 */
}
```

### 3.6 按钮

```css
/* 主按钮：蓝色渐变，实心 */
.start-button {
  min-width: 168px; min-height: 48px; padding: 0 24px;
  border: 0; border-radius: 14px;
  background: linear-gradient(180deg, #7394e4 0%, #5c7fd2 100%);
  color: #ffffff; font-size: 16px; font-weight: 800; cursor: pointer;
  box-shadow: 0 12px 22px rgba(92, 127, 210, 0.2);
}
.start-button:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }

/* 幽灵按钮：描边型，hover 有轻微背景 */
.ghost-button {
  min-height: 44px; padding: 0 18px;
  border-radius: 14px; border: 1px solid #d8e0f2;
  background: rgba(255, 255, 255, 0.75);
  color: #4f5e7d; font-size: 15px; font-weight: 700; cursor: pointer;
}
```

### 3.7 结果分布条目

```css
.distribution-item {
  padding: 16px; border-radius: 20px;
  border: 1px solid #e0e6f5;
  background: linear-gradient(180deg, #fbfcff 0%, #f6f8ff 100%);
}

/* 条形图轨道 */
.distribution-bar {
  height: 10px; margin-top: 14px; border-radius: 999px;
  background: #e9eef9; overflow: hidden;
}

/* 条形图填充：颜色由 .style-accent-{id} 类的渐变决定 */
.distribution-fill.style-accent-{id} {
  background: linear-gradient(90deg, {主色淡版} 0%, {主色深版} 100%);
}
```

### 3.8 弹窗系统（遮罩 + 内容）

**React 动画协调模式**（在 `AnnouncementModal.tsx` 和 `App.tsx` 中均采用此模式）：
```typescript
// 入场：挂载后用 rAF 触发 CSS transition
useEffect(() => {
  const frameId = window.requestAnimationFrame(() => setIsVisible(true));
  return () => window.cancelAnimationFrame(frameId);
}, []);

// 退场：先切换状态触发退场动画，等 240ms 后再 unmount / 调用 onClose
const handleClose = () => {
  setIsClosing(true);
  window.setTimeout(() => onClose(), 240);
};
```

**CSS 状态类**：
```css
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(38, 49, 77, 0.28); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
  opacity: 0; pointer-events: none;
  transition: opacity 240ms ease, background-color 240ms ease;
}
.modal-backdrop.is-open { opacity: 1; pointer-events: auto; }

.terms-modal {   /* 条款弹窗，announcement-modal 同理 */
  width: min(100%, 760px); max-height: min(80vh, 760px); overflow: auto;
  border-radius: 24px; background: #ffffff;
  box-shadow: 0 28px 70px rgba(63, 81, 125, 0.22);
  opacity: 0; transform: translateY(18px) scale(0.98);
  transition: opacity 240ms ease, transform 240ms ease;
}
.terms-modal.is-open { opacity: 1; transform: translateY(0) scale(1); }
```

JSX 结构规范：
- 遮罩层：`onClick={handleClose}` 点击背景关闭
- 内容层：`onClick={(e) => e.stopPropagation()}` 阻止冒泡
- 无障碍：`role="dialog"`, `aria-modal="true"`, `aria-labelledby="modal-title"`

### 3.9 确认气泡（退出确认）

```css
.confirm-bubble {
  position: absolute; top: calc(100% + 12px); left: 0; z-index: 20;
  width: min(320px, calc(100vw - 56px)); padding: 14px;
  border-radius: 18px; border: 1px solid #dbe3f5;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 40px rgba(85, 104, 153, 0.14);
  --confirm-bubble-x: 0px;
  transform: translateX(var(--confirm-bubble-x));
  animation: confirmBubbleIn 180ms ease;
}

/* 尖角指示器 */
.confirm-bubble::before {
  content: ""; position: absolute; top: -7px; left: 98px;
  width: 14px; height: 14px; background: rgba(255, 255, 255, 0.96);
  border-top: 1px solid #dbe3f5; border-left: 1px solid #dbe3f5;
  transform: rotate(45deg);
}

@keyframes confirmBubbleIn {
  from { opacity: 0; transform: translate(var(--confirm-bubble-x), -6px); }
  to   { opacity: 1; transform: translate(var(--confirm-bubble-x), 0); }
}
```

---

## 四、交互与动画规范

### 统一时间节奏

| 场景 | 时长 | Easing |
|------|------|--------|
| 选项卡片 hover | 180ms | ease |
| 确认气泡出现 | 180ms | ease-out（keyframe） |
| 进度条填充 | 220ms | ease |
| 弹窗出现 / 消失 | 240ms | ease |

**原则：不引入任何动画库，所有效果用 CSS `transition` + `@keyframes` 实现。**

### 自动推进逻辑

答题页：用户点击选项后**立即自动进入下一题**，最后一题作答后自动计算结果并跳转结果页。不需要"下一题"按钮。

```typescript
const handleSelectOption = (optionId: string) => {
  const nextAnswers = { ...answers, [currentQuestion.id]: optionId };
  setAnswers(nextAnswers);

  const isLastQuestion = currentIndex === drawnQuestions.length - 1;
  if (isLastQuestion) {
    const nextResult = calculateQuizResult(bank, drawnQuestions, nextAnswers);
    setResult(nextResult);
    setView("result");
    return;
  }

  setCurrentIndex((prev) => prev + 1);
};
```

---

## 五、题库 JSON 规范

**题库结构完全以用户提供的 JSON 为准。** agent 不得自行假设题目数量、分类数量或评分维度。

### 当前项目题库字段说明

`testEngine.ts` 基于以下字段工作（参照 `attachment-style-bank.v2.json`）：

```typescript
type AttachmentBank = {
  title: string;
  subtitle: string;
  question_count: number;
  notices: string[];
  draw_policy: {
    mode: string;
    draw_count: number;               // 每次抽取题目数
    shuffle_question_order: boolean;
    shuffle_option_order: boolean;
    required_answer_count: number;    // 结果页展示"已完成 X/Y 题"的 Y
  };
  styles: Array<{
    id: string;                       // 分类唯一 ID
    label: string;
    subtitle: string;
    alias?: string;
    quadrant: {
      anxiety: "low" | "high";       // 维度象限（二维评分模型）
      avoidance: "low" | "high";
    };
  }>;
  scoring: {
    primary_metric: string;
    result_page_distribution_order: string[];   // 结果页分布图显示顺序
    secondary_style_hint_rule: string;
    dimension_points: Record<styleId, {
      anxiety: number;               // 0 或 2（维度贡献分）
      avoidance: number;
    }>;
  };
  result_page_copy: {
    distribution_title: string;
    about_title: string;
    traits_title: string;
    advice_title: string;
    footer_disclaimer: string;
  };
  result_profiles: Record<styleId, {
    label: string;
    subtitle: string;
    alias?: string;
    about: string;                   // 段落描述
    traits: string[];                // 特征列表
    advice: string[];                // 建议列表
  }>;
  references: Array<{ title: string; url: string; note: string; }>;
  questions: Array<{
    id: string;
    theme: string;
    prompt: string;
    options: Array<{
      id: string;
      text: string;
      style: string;                 // 对应某个 style.id
    }>;
  }>;
};
```

### 新主题题库适配说明

当用户提供的 JSON 结构与上述不同时（例如：不同维度数量、不同选项数量、不同评分模型），**以用户提供的 JSON 为准**，并相应调整 `testEngine.ts` 中的类型定义和评分逻辑。

核心不变量：
- 每道题的每个选项对应某一个分类 ID（`option.style`）
- 主分类 = 得票最多的分类
- 百分比 = 该分类票数 / 总答题数 × 100

---

## 六、评分引擎（`testEngine.ts`）

### 核心函数

**`drawQuestions(questions, drawCount)`**
```typescript
// Fisher-Yates 洗牌后取前 N 道
export function drawQuestions(questions: QuestionItem[], drawCount: number) {
  return shuffleItems(questions).slice(0, drawCount);
}
```

**`calculateQuizResult(bank, questions, answers)`**

完整评分流程：
1. 遍历已作答题目，统计每个 style 的**得票数**（`votes[option.style]++`）
2. 累加每道题所选选项的 `dimension_points`，计算各维度均值
3. 根据维度均值确定**象限型**（二维焦虑/回避坐标系，各 ≥1 为高）
4. 最高票数为**主类型**，若并列则用象限型打破平局（再并列取 distribution_order 中第一个）
5. 次要类型：与最高票相差 ≤ 2 票的其他分类（`closeStyles`）
6. 生成百分比分布：`votes[style] / answeredCount * 100`

```typescript
// 维度均值 → 象限
function getQuadrantStyle(anxietyAvg: number, avoidanceAvg: number): StyleId {
  const a = anxietyAvg >= 1 ? "high" : "low";
  const v = avoidanceAvg >= 1 ? "high" : "low";
  // 按 styles 定义的 quadrant 字段匹配
}

// 主类型确定
const primaryStyle =
  tiedTopStyles.find(id => id === quadrantStyle) ?? tiedTopStyles[0] ?? defaultStyle;
```

### 新主题适配说明

`testEngine.ts` 中的 `StyleId` 类型目前是硬编码的联合类型 `"secure" | "anxious" | "avoidant" | "fearful"`。新项目需要**按照题库的 style ID 更新该类型定义**，并更新 `createEmptyStyleRecord()` 和 `styleIds` 数组。

若新题库的评分维度不是二维（焦虑/回避），需相应调整 `getQuadrantStyle()` 函数。若只使用一维或纯票数模型，可简化或移除象限逻辑。

---

## 七、会话持久化

### localStorage 方案

```typescript
const QUIZ_STATE_STORAGE_KEY = "{project-name}:quiz-state";  // 新项目需替换 key

// 存储的数据结构
type PersistedQuizState = {
  answers: Record<questionId, optionId>;
  currentIndex: number;
  questionIds: string[];          // 本次抽取的题目 ID 列表（用于恢复）
  view: "landing" | "quiz" | "result";
};
```

### 恢复逻辑

`restorePersistedQuizState()` 在 `useMemo` 中调用（仅首次），完整验证：
1. 检查 `view` 字段合法性
2. 将存储的 `questionIds` 映射回题目对象（ID 不存在则过滤）
3. 验证每个答案的 optionId 是否在对应题目的 options 中存在
4. `currentIndex` 做边界限制（`Math.max(0, Math.min(index, questions.length-1))`）
5. 若 answers 数量 ≥ questions 数量 → 直接计算结果，跳转结果页

---

## 八、首页（Landing）结构

JSX 结构层次：
```
<section class="hero-card">         ← 标题、副标题、徽章、pill 信息
<section class="content-card intro-card">  ← 测试介绍 + 4 列分类卡片网格
<section class="content-card flow-card">   ← 答题说明列表
<section class="consent-card">      ← 同意条款复选框 + 开始/继续按钮
<AnnouncementModal />               ← 公告弹窗（自动加载）
```

**关键状态**：
- `agreed`：是否勾选条款，未勾选时"开始答题"按钮 `disabled`
- `hasSavedSession`：`drawnQuestions.length > 0`，决定是否显示"继续上次"按钮
- `showAnnouncement`：首次进入首页时为 `true`，关闭后设为 `false`

---

## 九、答题页（Quiz）结构

```
<section class="hero-card quiz-hero-card">
  题号 + 进度条（.progress-track / .progress-fill）

<section class="content-card question-card">
  题目文字 + 4 个 .option-card
  底部：上一题 + 返回首页 + 确认气泡（.confirm-bubble）
  提示文字

<section class="content-card hint-card">
  作答提示（固定文案）
```

**关键状态**：
- `currentIndex`：当前题目序号
- `drawnQuestions`：本次抽取的题目数组
- `answers`：`Record<questionId, optionId>` 已作答映射
- `showQuitConfirm`：确认气泡显示状态

---

## 十、结果页（Result）结构

```
<section class="hero-card result-hero-card">
  主类型图标（result-mark） + 名称 + 副标题
  维度数据 pill 行（.result-pill-row）
  次级倾向提示（可选，.result-secondary-note）

<section class="content-card distribution-card">
  各分类得分分布（.distribution-list）
  每行：图标 + 名称 + 百分比 + 条形图

<section class="content-card result-copy-card">
  .result-copy-grid（单列/三列，响应式）
    关于 | 特征列表 | 建议列表

<section class="content-card result-footer-card">
  免责声明（来自 bank.result_page_copy.footer_disclaimer）

<div class="result-actions">
  返回首页（ghost-button） + 再测一次（start-button）
```

**数据来源**：全部来自 `calculateQuizResult()` 返回的 `QuizResult` 对象和 `bank.result_page_copy`。结果页无任何硬编码文案，均读取题库。

---

## 十一、公告弹窗（`AnnouncementModal.tsx`）

**完全可复用，无需修改。**

- 从 `https://r.123262.xyz/announcements` 拉取公告列表
- 按 `window.location.hostname` 过滤匹配当前站点的公告
- 无公告或请求失败时静默不展示
- 动画：同弹窗标准模式（rAF 触发入场，240ms 退场）

**API 响应格式**：
```json
{
  "announcements": [
    {
      "id": "唯一ID",
      "title": "标题",
      "content": "内容（支持换行 \\n）",
      "sites": "hostname" | ["hostname1", "hostname2"]
    }
  ]
}
```

---

## 十二、响应式规范

```css
/* 平板 ≤ 820px */
@media (max-width: 820px) {
  .style-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .quiz-hero-top, .question-actions, .distribution-head {
    flex-direction: column; align-items: stretch;
  }
}

/* 手机 ≤ 560px */
@media (max-width: 560px) {
  .page-shell { padding: 20px 12px 32px; }
  .hero-card, .content-card { padding: 18px; border-radius: 20px; }
  .hero-card h1 { font-size: 30px; }
  .style-grid { grid-template-columns: 1fr; }
  .style-card { min-height: auto; }
  .confirm-bubble { left: 50%; --confirm-bubble-x: -50%; }  /* 居中 */
}
```

---

## 十三、SVG 图标规范

每个分类需一个 SVG 图标，用于首页分类卡片、答题页、结果页 Hero 和分布图：

- **viewBox**：`0 0 24 24`（标准 24px 坐标系）
- **渲染尺寸**：26px（分类卡片）/ 36px（结果页 Hero）/ 24px（分布图）
- **风格**：`fill="none"` + `stroke="currentColor"` + `strokeWidth={1.8}`，线性图标
- **strokeLinecap / strokeLinejoin**：`"round"` / `"round"`
- **颜色**：通过 `color: currentColor` 继承父元素颜色，由 `.style-accent-{id}` 注入
- **内容**：与分类特征相关的抽象符号（推荐：几何形、简单情感符号）

```tsx
const commonProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};
```

---

## 十四、新项目启动清单

**前提**：用户已提供题库 JSON 文件，明确了网站主题。

### Step 1 — 理解题库
1. 阅读题库 JSON，提取：分类数量、分类 ID、分类名称、评分维度、抽题数量
2. 根据分类特征和主题情感，设计配色方案（每个分类一对主色+背景色）
3. 为每个分类构思 SVG 图标主题

### Step 2 — 更新 `testEngine.ts`
1. 将 `StyleId` 类型改为题库中实际的 style ID 联合类型
2. 更新 `createEmptyStyleRecord()` 和 `styleIds` 数组
3. 若维度不是焦虑/回避二维，更新 `getQuadrantStyle()` 和相关维度字段
4. 更新 `AttachmentBank` / `QuizResult` 等类型定义以匹配新题库 schema

### Step 3 — 更新 `App.tsx`
1. 更新 `QUIZ_STATE_STORAGE_KEY`（改为 `"{project-name}:quiz-state"`）
2. 更新 `styleAccents`（style ID → CSS 类名映射）
3. 更新 `styleSummaries`（首页分类卡片的一行简介）
4. 更新 `renderStyleIcon()`（每个分类对应一个 SVG 图标）
5. 更新首页 Hero 区文案（标题、副标题、kicker、pill 信息）
6. 更新答题页和结果页的维度展示文案（如焦虑维度/回避维度标签）
7. 更新条款页的固定文案（consentDetails 数组）
8. 导入新题库 JSON 文件路径

### Step 4 — 更新 `styles.css`
1. 根据设计的配色方案，添加 `.style-accent-{id}` 类（每个分类）
2. 添加 `.distribution-fill.style-accent-{id}` 类（条形图渐变）
3. 若主题需要，调整 `body` 背景渐变的颜色（保持结构不变）
4. 若更换字体，更新 `:root` 的 `font-family`

### Step 5 — 更新 `index.html`
1. 替换 `<title>` 为新测试名称
2. 替换 meta description
3. 若换字体，更新 Google Fonts / CDN 链接

### 不需要修改的文件
- `AnnouncementModal.tsx`（完整复用）
- `main.tsx`（不变）
- `vite.config.ts` / `tsconfig.json` / `tsconfig.app.json`（不变）

---

## 十五、验证方式

构建完成后，通过以下流程端到端验证：

1. **首页**：标题、分类卡片、说明、条款弹窗正常显示；"开始答题"按钮未勾选时禁用
2. **答题流程**：进度条正确推进；选项点击后自动进入下一题；最后一题完成后跳结果页
3. **结果页**：主类型图标和颜色正确；分布条形图显示；特征/建议来自题库 result_profiles
4. **持久化**：刷新页面后可恢复答题进度；完成后刷新直接显示结果
5. **响应式**：在 820px 以下检查网格布局折叠；在 560px 以下检查字号和 padding
6. **弹窗**：条款弹窗打开/关闭动画流畅；点击背景关闭正常
