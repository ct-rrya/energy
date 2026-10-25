export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
}

export interface MissionLessonSection {
  title: string;
  content: string;
}

export interface Mission {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  estimatedMinutes: number;
  xpReward: number;
  isActive: boolean;
  sections: MissionLessonSection[];
  questionCount: number;
  questions: QuizQuestion[];
  isCompleted: boolean;
  bestScore: number | null;
}

export interface QuizQuestionFeedback {
  questionId: string;
  question: string;
  selectedAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  explanation: string;
}

export interface PlayerLevelProgress {
  currentXp: number;
  level: number;
  levelTitle: string;
  currentLevelMinXp: number;
  nextLevelXp: number | null;
  xpToNextLevel: number;
  progressPercentage: number;
  isMaxLevel: boolean;
}

export interface UnlockedBadgeNotification {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface QuizSubmissionResult {
  missionId: string;
  passed: boolean;
  score: number;
  totalQuestions: number;
  percentage: number;
  passingThreshold: number;
  earnedXp: number;
  alreadyCompleted: boolean;
  currentXp: number;
  level: number;
  levelProgress: PlayerLevelProgress;
  feedback: QuizQuestionFeedback[];
  newlyUnlockedBadges: UnlockedBadgeNotification[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  isUnlocked: boolean;
  unlockedAt: string | null;
}

export interface PlayerProgressSummary {
  playerId: string;
  username: string;
  xp: number;
  level: number;
  levelProgress: PlayerLevelProgress;
  completedMissions: string[];
  totalMissions: number;
  badges: Badge[];
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  username: string;
  xp: number;
  level: number;
  levelTitle: string;
  badgeCount: number;
  completedMissionsCount: number;
  isCurrentPlayer: boolean;
}

export interface LeaderboardPagination {
  page: number;
  limit: number;
  totalPlayers: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CurrentPlayerSummary {
  rank: number;
  playerId: string;
  username: string;
  xp: number;
  level: number;
  levelTitle: string;
  badgeCount: number;
  completedMissionsCount: number;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  entries?: LeaderboardEntry[];
  pagination: LeaderboardPagination;
  currentPlayer: CurrentPlayerSummary | null;
  currentPlayerRank?: number;
}

export interface LeaderboardQuery {
  page?: number;
  limit?: number;
}
