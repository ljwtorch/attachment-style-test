import { useEffect, useMemo, useState } from "react";
import bankData from "../data/question-banks/attachment-style-bank.v2.json";
import {
  calculateQuizResult,
  drawQuestions,
  type AttachmentBank,
  type QuestionItem,
  type QuizAnswerMap,
  type QuizResult,
  type StyleId,
} from "./testEngine";

type AppView = "landing" | "quiz" | "result";

type PersistedQuizState = {
  answers: QuizAnswerMap;
  currentIndex: number;
  questionIds: string[];
  view: AppView;
};

const bank = bankData as AttachmentBank;
const QUIZ_STATE_STORAGE_KEY = "attachment-style-test:quiz-state";

const styleSummaries: Record<StyleId, string> = {
  secure: "信任与独立更平衡，关系中通常更稳定",
  anxious: "重视连接，也更容易担心失去和被忽视",
  avoidant: "更看重边界与空间，习惯先依靠自己",
  fearful: "既想靠近，也容易在受伤风险前退缩",
};

const styleAccents: Record<StyleId, string> = {
  secure: "style-accent-secure",
  anxious: "style-accent-anxious",
  avoidant: "style-accent-avoidant",
  fearful: "style-accent-fearful",
};

function renderStyleIcon(styleId: StyleId) {
  const commonProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (styleId) {
    case "secure":
      return (
        <svg {...commonProps}>
          <path d="M12 20.2s-6-3.8-6-8.7c0-2.1 1.6-3.7 3.5-3.7 1.2 0 2.1.5 2.5 1.4.4-.9 1.4-1.4 2.5-1.4 1.9 0 3.5 1.6 3.5 3.7 0 4.9-6 8.7-6 8.7Z" />
          <path d="m9.4 12.4 1.7 1.7 3.4-3.6" />
        </svg>
      );
    case "anxious":
      return (
        <svg {...commonProps}>
          <path d="M12 18.2a6.2 6.2 0 1 1 0-12.4 6.2 6.2 0 0 1 0 12.4Z" />
          <path d="M12 9.1v3.1" />
          <path d="M12 14.8h.1" />
          <path d="M18.2 8.2a8.8 8.8 0 0 1 1.4 3.8" />
          <path d="M5.8 8.2a8.8 8.8 0 0 0-1.4 3.8" />
        </svg>
      );
    case "avoidant":
      return (
        <svg {...commonProps}>
          <rect x="4.5" y="6.5" width="5.5" height="11" rx="2.2" />
          <rect x="14" y="6.5" width="5.5" height="11" rx="2.2" />
          <path d="M10.5 12h3" />
        </svg>
      );
    case "fearful":
      return (
        <svg {...commonProps}>
          <path d="M12 20.2s-6-3.8-6-8.7c0-2.1 1.6-3.7 3.5-3.7 1.2 0 2.1.5 2.5 1.4.4-.9 1.4-1.4 2.5-1.4 1.9 0 3.5 1.6 3.5 3.7 0 4.9-6 8.7-6 8.7Z" />
          <path d="m12.6 8.2-2 3.2h2.1l-1.2 2.3 2.7-3.5h-2Z" />
        </svg>
      );
    default:
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="6" />
        </svg>
      );
  }
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function restorePersistedQuizState() {
  const defaultState = {
    answers: {},
    currentIndex: 0,
    drawnQuestions: [] as QuestionItem[],
    result: null as QuizResult | null,
    view: "landing" as AppView,
  };

  if (typeof window === "undefined") {
    return defaultState;
  }

  try {
    const rawState = window.localStorage.getItem(QUIZ_STATE_STORAGE_KEY);

    if (!rawState) {
      return defaultState;
    }

    const parsedState = JSON.parse(rawState) as Partial<PersistedQuizState>;

    if (
      parsedState.view !== "quiz" &&
      parsedState.view !== "result" &&
      parsedState.view !== "landing"
    ) {
      return defaultState;
    }

    if (!Array.isArray(parsedState.questionIds)) {
      return defaultState;
    }

    const questionMap = new Map(bank.questions.map((question) => [question.id, question]));
    const drawnQuestions = parsedState.questionIds
      .map((questionId) => questionMap.get(questionId))
      .filter((question): question is QuestionItem => Boolean(question));

    if (!drawnQuestions.length && parsedState.view !== "landing") {
      return defaultState;
    }

    const answers = Object.entries(parsedState.answers ?? {}).reduce<QuizAnswerMap>(
      (accumulator, [questionId, optionId]) => {
        const matchingQuestion = questionMap.get(questionId);

        if (!matchingQuestion) {
          return accumulator;
        }

        const hasMatchingOption = matchingQuestion.options.some((option) => option.id === optionId);

        if (!hasMatchingOption) {
          return accumulator;
        }

        return {
          ...accumulator,
          [questionId]: optionId,
        };
      },
      {},
    );

    const safeIndex =
      typeof parsedState.currentIndex === "number"
        ? Math.min(Math.max(parsedState.currentIndex, 0), Math.max(drawnQuestions.length - 1, 0))
        : 0;

    const isComplete =
      drawnQuestions.length > 0 && Object.keys(answers).length >= drawnQuestions.length;

    if (parsedState.view === "result" || isComplete) {
      return {
        answers,
        currentIndex: Math.max(drawnQuestions.length - 1, 0),
        drawnQuestions,
        result: calculateQuizResult(bank, drawnQuestions, answers),
        view: "result" as AppView,
      };
    }

    if (parsedState.view === "quiz" && drawnQuestions.length > 0) {
      return {
        answers,
        currentIndex: safeIndex,
        drawnQuestions,
        result: null,
        view: "quiz" as AppView,
      };
    }

    return defaultState;
  } catch {
    return defaultState;
  }
}

function App() {
  const restoredQuizState = useMemo(() => restorePersistedQuizState(), []);
  const hasSavedSession = restoredQuizState.view !== "landing" && restoredQuizState.drawnQuestions.length > 0;

  const [view, setView] = useState<AppView>(restoredQuizState.view);
  const [agreed, setAgreed] = useState(true);
  const [isTermsMounted, setIsTermsMounted] = useState(false);
  const [isTermsVisible, setIsTermsVisible] = useState(false);
  const [drawnQuestions, setDrawnQuestions] = useState<QuestionItem[]>(restoredQuizState.drawnQuestions);
  const [answers, setAnswers] = useState<QuizAnswerMap>(restoredQuizState.answers);
  const [currentIndex, setCurrentIndex] = useState(restoredQuizState.currentIndex);
  const [result, setResult] = useState<QuizResult | null>(restoredQuizState.result);

  const currentQuestion = drawnQuestions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progressPercent = drawnQuestions.length
    ? ((currentIndex + (view === "result" ? 1 : 0)) / drawnQuestions.length) * 100
    : 0;

  const consentDetails = useMemo(
    () => [
      "本页面不会主动收集你的姓名、手机号、邮箱、通讯录、精确定位等个人身份信息。",
      "当前测试阶段不保存你的作答记录，也不会在未说明的情况下上传作答内容。",
      "测试结果仅供自我探索与关系反思，不构成医学、心理诊断或治疗建议。",
    ],
    [],
  );

  const closeStylesText = result?.closeStyles.length
    ? result.closeStyles.map((styleId) => bank.result_profiles[styleId].label).join("、")
    : "";

  useEffect(() => {
    if (!isTermsMounted) {
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      setIsTermsVisible(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isTermsMounted]);

  useEffect(() => {
    if (!isTermsMounted || isTermsVisible) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setIsTermsMounted(false);
    }, 240);

    return () => window.clearTimeout(timeoutId);
  }, [isTermsMounted, isTermsVisible]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (view === "landing" || drawnQuestions.length === 0) {
      window.localStorage.removeItem(QUIZ_STATE_STORAGE_KEY);
      return;
    }

    const persistedState: PersistedQuizState = {
      answers,
      currentIndex,
      questionIds: drawnQuestions.map((question) => question.id),
      view,
    };

    window.localStorage.setItem(QUIZ_STATE_STORAGE_KEY, JSON.stringify(persistedState));
  }, [answers, currentIndex, drawnQuestions, view]);

  const openTerms = () => {
    setIsTermsMounted(true);
  };

  const closeTerms = () => {
    setIsTermsVisible(false);
  };

  const startQuiz = () => {
    const selectedQuestions = drawQuestions(bank.questions, bank.draw_policy.draw_count);
    setDrawnQuestions(selectedQuestions);
    setAnswers({});
    setCurrentIndex(0);
    setResult(null);
    setView("quiz");
  };

  const continueQuiz = () => {
    if (!drawnQuestions.length) {
      return;
    }

    setView(result ? "result" : "quiz");
  };

  const restartQuiz = () => {
    setView("landing");
    setAnswers({});
    setCurrentIndex(0);
    setDrawnQuestions([]);
    setResult(null);
  };

  const returnToLanding = () => {
    setView("landing");
  };

  const handleSelectOption = (optionId: string) => {
    if (!currentQuestion) {
      return;
    }

    const nextAnswers = {
      ...answers,
      [currentQuestion.id]: optionId,
    };

    setAnswers(nextAnswers);

    const isLastQuestion = currentIndex === drawnQuestions.length - 1;

    if (isLastQuestion) {
      const nextResult = calculateQuizResult(bank, drawnQuestions, nextAnswers);
      setResult(nextResult);
      setView("result");
      return;
    }

    setCurrentIndex((previousIndex) => previousIndex + 1);
  };

  const handlePreviousQuestion = () => {
    setCurrentIndex((previousIndex) => Math.max(0, previousIndex - 1));
  };

  return (
    <div className="page-shell">
      <main className="home-page">
        {view === "landing" ? (
          <>
            <section className="hero-card">
              <div className="hero-mark" aria-hidden="true">
                <span>♡</span>
              </div>
              <p className="hero-kicker">Attachment Reflection</p>
              <h1>依恋类型测试</h1>
              <p className="hero-subtitle">从你的关系反应里，看见更常出现的亲密模式</p>

              <div className="hero-pills">
                <span>55道母题</span>
                <span>每次抽取38题</span>
                <span>约 6-8 分钟</span>
                {/*<span>四选一场景题</span>*/}
              </div>
            </section>

            <section className="content-card intro-card">
              <div className="section-head">
                <p className="section-kicker">什么是依恋类型</p>
              </div>
              <p className="section-copy">
                依恋理论是心理学中的重要理论之一，它帮助我们理解，在面对亲密、距离、
                不确定性、冲突和情感支持时，人会更倾向于哪一种关系模式
              </p>

              <div className="style-grid">
                {bank.styles.map((style) => (
                  <article className="style-card" key={style.id}>
                    <div className={`style-icon ${styleAccents[style.id]}`} aria-hidden="true">
                      {renderStyleIcon(style.id)}
                    </div>
                    <h3>{style.label.replace("依恋", "")}</h3>
                    <p>{styleSummaries[style.id]}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="content-card flow-card">
              <div className="section-head">
                <p className="section-kicker">测试说明</p>
              </div>
              <ul className="flow-list">
                <li>进入答题页后，系统会从题库中随机抽取 38 题，预计使用6-9分钟完成</li>
                <li>请结合你在亲密关系中的真实感受与实际反应作答</li>
                <li>题目没有标准答案，请选择最贴近你平时状态的选项</li>
                <li>完成测试后，你将更清楚地理解自己的依恋模式与关系倾向</li>
                <li>如有问题请联系：vvmailbox@qq.com</li>
              </ul>
            </section>

            <section className="consent-card">
              <label className="consent-check">
                <input
                  checked={agreed}
                  onChange={(event) => setAgreed(event.target.checked)}
                  type="checkbox"
                />
                <span className="consent-label">
                  <span className="consent-box" aria-hidden="true">
                    {agreed ? "✓" : ""}
                  </span>
                  <span className="consent-text">
                    我已阅读并同意
                    <button
                      className="terms-link"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        openTerms();
                      }}
                      type="button"
                    >
                      用户使用条款&免责声明
                    </button>
                  </span>
                </span>
              </label>

              <div className="cta-wrap">
                {hasSavedSession ? (
                  <button className="ghost-button" onClick={continueQuiz} type="button">
                    {result ? "查看上次结果" : "继续上次测试"}
                  </button>
                ) : null}
                <button
                  className="start-button"
                  disabled={!agreed}
                  onClick={startQuiz}
                  type="button"
                >
                  开始答题
                </button>
              </div>
            </section>
          </>
        ) : null}

        {view === "quiz" && currentQuestion ? (
          <>
            <section className="hero-card quiz-hero-card">
              <div className="quiz-hero-top">
                <div className="quiz-hero-copy">
                  <p className="hero-kicker">Question Flow</p>
                  <h1>
                    第 {currentIndex + 1} 题 <span>/ 共 {drawnQuestions.length} 题</span>
                  </h1>
                </div>
              </div>

              <div className="progress-track" aria-hidden="true">
                <span className="progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
            </section>

            <section className="content-card question-card">
              <div className="section-head">
                <p className="section-kicker">当前题目</p>
                <h2>{currentQuestion.prompt}</h2>
              </div>

              <div className="options-grid" role="list">
                {currentQuestion.options.map((option) => {
                  const isSelected = answers[currentQuestion.id] === option.id;

                  return (
                    <button
                      className={`option-card ${isSelected ? "is-selected" : ""}`}
                      key={`${currentQuestion.id}-${option.id}`}
                      onClick={() => handleSelectOption(option.id)}
                      type="button"
                    >
                      <span className="option-badge">{option.id}</span>
                      <span className="option-copy">{option.text}</span>
                    </button>
                  );
                })}
              </div>

              <div className="question-actions">
                <button
                  className="ghost-button"
                  disabled={currentIndex === 0}
                  onClick={handlePreviousQuestion}
                  type="button"
                >
                  上一题
                </button>
                <p className="question-footnote">
                  当前为单题作答模式，选择任一选项后将自动进入下一题。
                </p>
              </div>
            </section>

            <section className="content-card hint-card">
              <div className="inline-note">
                <p>这份测试更关注你在关系中的反应模式，而不是某一次表现得“够不够好”。</p>
                <p>如果你在两个选项之间犹豫，优先选择更接近你平时默认反应的那个。</p>
              </div>
            </section>
          </>
        ) : null}

        {view === "result" && result ? (
          <>
            <section className="hero-card result-hero-card">
              <div className={`result-mark ${styleAccents[result.primaryStyle]}`} aria-hidden="true">
                {renderStyleIcon(result.primaryStyle)}
              </div>
              <p className="hero-kicker">Result Overview</p>
              <h1>{result.primaryProfile.label}</h1>
              <p className="hero-subtitle result-subtitle">{result.primaryProfile.subtitle}</p>

              <div className="result-pill-row">
                <span>已完成 {result.answeredCount} / {bank.draw_policy.required_answer_count} 题</span>
                <span>主类型占比 {formatPercent(result.percentages[result.primaryStyle])}</span>
                <span>
                  焦虑维度 {result.anxietyAverage.toFixed(1)} · 回避维度 {result.avoidanceAverage.toFixed(1)}
                </span>
              </div>

              {result.closeStyles.length ? (
                <p className="result-secondary-note">
                  你的结果中还存在较明显的次级倾向：{closeStylesText}。
                </p>
              ) : null}
            </section>

            <section className="content-card distribution-card">
              <div className="section-head">
                <p className="section-kicker">{bank.result_page_copy.distribution_title}</p>
                <h2>四种依恋倾向在本次作答中的分布情况</h2>
              </div>

              <div className="distribution-list">
                {result.distribution.map((item) => (
                  <article className="distribution-item" key={item.styleId}>
                    <div className="distribution-head">
                      <div className="distribution-label-wrap">
                        <span className={`distribution-icon ${styleAccents[item.styleId]}`} aria-hidden="true">
                          {renderStyleIcon(item.styleId)}
                        </span>
                        <div>
                          <h3>{item.label}</h3>
                          <p>{item.subtitle}</p>
                        </div>
                      </div>
                      <strong>{formatPercent(item.percentage)}</strong>
                    </div>

                    <div className="distribution-bar" aria-hidden="true">
                      <span
                        className={`distribution-fill ${styleAccents[item.styleId]}`}
                        style={{ width: `${Math.max(item.percentage, 4)}%` }}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="content-card result-copy-card">
              <div className="result-copy-grid">
                <article className="result-detail-card">
                  <div className="section-head">
                    <p className="section-kicker">{bank.result_page_copy.about_title}</p>
                    <h2>{result.primaryProfile.label}</h2>
                  </div>
                  <p className="section-copy result-long-copy">{result.primaryProfile.about}</p>
                </article>

                <article className="result-detail-card">
                  <div className="section-head">
                    <p className="section-kicker">{bank.result_page_copy.traits_title}</p>
                    <h2>你在关系里可能更常见的表现</h2>
                  </div>
                  <ul className="detail-list">
                    {result.primaryProfile.traits.map((trait) => (
                      <li key={trait}>{trait}</li>
                    ))}
                  </ul>
                </article>

                <article className="result-detail-card">
                  <div className="section-head">
                    <p className="section-kicker">{bank.result_page_copy.advice_title}</p>
                    <h2>你可以尝试的下一步</h2>
                  </div>
                  <ul className="detail-list">
                    {result.primaryProfile.advice.map((advice) => (
                      <li key={advice}>{advice}</li>
                    ))}
                  </ul>
                </article>
              </div>
            </section>

            <section className="content-card result-footer-card">
              <p className="result-disclaimer">{bank.result_page_copy.footer_disclaimer}</p>
            </section>

            <div className="result-actions" role="group" aria-label="结果页操作">
              <button className="ghost-button" onClick={returnToLanding} type="button">
                返回首页
              </button>
              <button className="start-button" onClick={startQuiz} type="button">
                再测一次
              </button>
            </div>
          </>
        ) : null}
      </main>

      {isTermsMounted ? (
        <div
          aria-labelledby="terms-title"
          className={`modal-backdrop ${isTermsVisible ? "is-open" : "is-closed"}`}
          onClick={closeTerms}
          role="presentation"
        >
          <section
            aria-modal="true"
            className={`terms-modal ${isTermsVisible ? "is-open" : "is-closed"}`}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="terms-head">
              <div>
                <p className="section-kicker">用户使用条款&免责声明</p>
                <h2 id="terms-title">开始答题前，请先确认这些内容。</h2>
              </div>
              <button
                aria-label="关闭条款弹窗"
                className="close-button"
                onClick={closeTerms}
                type="button"
              >
                ×
              </button>
            </div>

            <div className="terms-body">
              {consentDetails.map((item) => (
                <p key={item}>{item}</p>
              ))}
              <p>
                题库参考来源包括：
                {bank.references.map((reference) => reference.title).join("、")}。
              </p>
              <p>
                你勾选同意并开始答题，即表示你理解本测试的用途与边界，并愿意在此基础上继续体验。
              </p>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export default App;
