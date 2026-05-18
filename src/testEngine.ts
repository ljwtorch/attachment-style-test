export type StyleId = "secure" | "anxious" | "avoidant" | "fearful";

export type AttachmentStyle = {
  id: StyleId;
  label: string;
  subtitle: string;
  alias?: string;
  quadrant: {
    anxiety: "low" | "high";
    avoidance: "low" | "high";
  };
};

export type QuestionOption = {
  id: string;
  text: string;
  style: StyleId;
};

export type QuestionItem = {
  id: string;
  theme: string;
  prompt: string;
  options: QuestionOption[];
};

export type ResultProfile = {
  label: string;
  subtitle: string;
  alias?: string;
  about: string;
  traits: string[];
  advice: string[];
};

export type AttachmentBank = {
  title: string;
  subtitle: string;
  question_count: number;
  notices: string[];
  draw_policy: {
    mode: string;
    draw_count: number;
    shuffle_question_order: boolean;
    shuffle_option_order: boolean;
    required_answer_count: number;
  };
  styles: AttachmentStyle[];
  scoring: {
    primary_metric: string;
    result_page_distribution_order: StyleId[];
    secondary_style_hint_rule: string;
    dimension_points: Record<
      StyleId,
      {
        anxiety: number;
        avoidance: number;
      }
    >;
  };
  result_page_copy: {
    distribution_title: string;
    about_title: string;
    traits_title: string;
    advice_title: string;
    footer_disclaimer: string;
  };
  result_profiles: Record<StyleId, ResultProfile>;
  references: Array<{
    title: string;
    url: string;
    note: string;
  }>;
  questions: QuestionItem[];
};

export type QuizAnswerMap = Record<string, string>;

export type QuizSession = {
  questions: QuestionItem[];
  answers: QuizAnswerMap;
  currentIndex: number;
};

export type QuizResult = {
  answeredCount: number;
  primaryStyle: StyleId;
  primaryProfile: ResultProfile;
  secondaryStyles: StyleId[];
  closeStyles: StyleId[];
  tiedTopStyles: StyleId[];
  votes: Record<StyleId, number>;
  percentages: Record<StyleId, number>;
  anxietyAverage: number;
  avoidanceAverage: number;
  quadrantStyle: StyleId;
  distribution: Array<{
    styleId: StyleId;
    votes: number;
    percentage: number;
    label: string;
    subtitle: string;
  }>;
};

const styleIds: StyleId[] = ["secure", "anxious", "avoidant", "fearful"];

function createEmptyStyleRecord() {
  return {
    secure: 0,
    anxious: 0,
    avoidant: 0,
    fearful: 0,
  } satisfies Record<StyleId, number>;
}

function shuffleItems<T>(items: T[]) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function getQuadrantStyle(anxietyAverage: number, avoidanceAverage: number): StyleId {
  const anxietyLevel = anxietyAverage >= 1 ? "high" : "low";
  const avoidanceLevel = avoidanceAverage >= 1 ? "high" : "low";

  return (
    styleIds.find(
      (styleId) =>
        (styleId === "secure" && anxietyLevel === "low" && avoidanceLevel === "low") ||
        (styleId === "anxious" && anxietyLevel === "high" && avoidanceLevel === "low") ||
        (styleId === "avoidant" && anxietyLevel === "low" && avoidanceLevel === "high") ||
        (styleId === "fearful" && anxietyLevel === "high" && avoidanceLevel === "high"),
    ) ?? "secure"
  );
}

export function drawQuestions(questions: QuestionItem[], drawCount: number) {
  return shuffleItems(questions).slice(0, drawCount);
}

export function calculateQuizResult(
  bank: AttachmentBank,
  questions: QuestionItem[],
  answers: QuizAnswerMap,
): QuizResult {
  const votes = createEmptyStyleRecord();
  let answeredCount = 0;
  let anxietySum = 0;
  let avoidanceSum = 0;

  questions.forEach((question) => {
    const selectedOptionId = answers[question.id];

    if (!selectedOptionId) {
      return;
    }

    const selectedOption = question.options.find((option) => option.id === selectedOptionId);

    if (!selectedOption) {
      return;
    }

    answeredCount += 1;
    votes[selectedOption.style] += 1;
    anxietySum += bank.scoring.dimension_points[selectedOption.style].anxiety;
    avoidanceSum += bank.scoring.dimension_points[selectedOption.style].avoidance;
  });

  const distributionOrder = bank.scoring.result_page_distribution_order;
  const anxietyAverage = answeredCount ? anxietySum / answeredCount : 0;
  const avoidanceAverage = answeredCount ? avoidanceSum / answeredCount : 0;
  const quadrantStyle = getQuadrantStyle(anxietyAverage, avoidanceAverage);
  const maxVotes = Math.max(...distributionOrder.map((styleId) => votes[styleId]));
  const tiedTopStyles = distributionOrder.filter((styleId) => votes[styleId] === maxVotes);

  // Use the theoretical quadrant to break ties before falling back to display order.
  const primaryStyle =
    tiedTopStyles.find((styleId) => styleId === quadrantStyle) ?? tiedTopStyles[0] ?? "secure";
  const secondaryStyles = tiedTopStyles.filter((styleId) => styleId !== primaryStyle);

  const percentages = distributionOrder.reduce(
    (accumulator, styleId) => ({
      ...accumulator,
      [styleId]: answeredCount ? (votes[styleId] / answeredCount) * 100 : 0,
    }),
    createEmptyStyleRecord(),
  );

  const closeStyles = distributionOrder
    .filter((styleId) => styleId !== primaryStyle)
    .filter((styleId) => maxVotes - votes[styleId] <= 2 && votes[styleId] > 0);

  const distribution = distributionOrder.map((styleId) => ({
    styleId,
    votes: votes[styleId],
    percentage: percentages[styleId],
    label: bank.styles.find((style) => style.id === styleId)?.label ?? bank.result_profiles[styleId].label,
    subtitle: bank.result_profiles[styleId].subtitle,
  }));

  return {
    answeredCount,
    primaryStyle,
    primaryProfile: bank.result_profiles[primaryStyle],
    secondaryStyles,
    closeStyles,
    tiedTopStyles,
    votes,
    percentages,
    anxietyAverage,
    avoidanceAverage,
    quadrantStyle,
    distribution,
  };
}
