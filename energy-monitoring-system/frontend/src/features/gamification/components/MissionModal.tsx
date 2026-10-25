import { useState, useEffect, useRef } from 'react';
import {
  X,
  BookOpen,
  HelpCircle,
  Award,
  Zap,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  AlertCircle,
  ChevronRight,
  User,
} from 'lucide-react';
import type { Mission, QuizSubmissionResult } from '@/types';
import { gamificationService } from '@/api/services';
import { usePlayer } from '@/contexts/PlayerContext';

interface MissionModalProps {
  mission: Mission;
  isOpen: boolean;
  onClose: () => void;
  onMissionCompleted: (result: QuizSubmissionResult) => void;
}

type TabType = 'lesson' | 'quiz' | 'results';

export function MissionModal({
  mission,
  isOpen,
  onClose,
  onMissionCompleted,
}: MissionModalProps) {
  const { player, sessionToken, openPlayerModal } = usePlayer();
  const [activeTab, setActiveTab] = useState<TabType>('lesson');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<QuizSubmissionResult | null>(null);

  const modalCardRef = useRef<HTMLDivElement>(null);
  const scrollBodyRef = useRef<HTMLDivElement>(null);

  // Reset scroll to top whenever tab or submission results change
  useEffect(() => {
    if (modalCardRef.current) {
      modalCardRef.current.scrollTop = 0;
    }
    if (scrollBodyRef.current) {
      scrollBodyRef.current.scrollTop = 0;
    }
  }, [activeTab, submissionResult]);

  if (!isOpen) return null;

  const questions = mission.questions || [];
  const answeredCount = Object.keys(selectedAnswers).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  const handleSelectAnswer = (questionIndex: number, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  const handleStartQuiz = () => {
    setActiveTab('quiz');
  };

  const handleRetryQuiz = () => {
    setSelectedAnswers({});
    setSubmissionError(null);
    setSubmissionResult(null);
    setActiveTab('quiz');
  };

  const handleSubmitQuiz = async () => {
    if (!sessionToken) {
      setSubmissionError('Please join as a guest player to submit your quiz and earn rewards.');
      openPlayerModal();
      return;
    }

    if (!allAnswered) {
      setSubmissionError(`Please answer all ${questions.length} questions before submitting.`);
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    // Convert object { 0: 2, 1: 0, ... } to ordered array [2, 0, ...]
    const orderedAnswers = questions.map((_, idx) => selectedAnswers[idx] ?? -1);

    try {
      const result = await gamificationService.submitQuiz(
        mission.id,
        orderedAnswers,
        sessionToken,
      );
      setSubmissionResult(result);
      setActiveTab('results');
      if (result.passed) {
        onMissionCompleted(result);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to submit quiz. Please try again.';
      setSubmissionError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mission-title"
      className="ov fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      style={{
        background: 'rgba(13, 27, 20, 0.45)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
      }}
    >
      <div
        ref={modalCardRef}
        onScroll={(e) => {
          if (e.currentTarget.scrollTop !== 0) {
            e.currentTarget.scrollTop = 0;
          }
        }}
        className="md relative w-full flex flex-col overflow-hidden my-auto"
        style={{
          width: '760px',
          maxWidth: '760px',
          height: '700px',
          maxHeight: 'calc(100vh - 48px)',
          borderRadius: '24px',
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--line)',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.35)',
        }}
      >
        {/* Header - padding 24px 28px 18px on var(--mint) */}
        <div
          className="flex-shrink-0 z-10 flex items-center justify-between"
          style={{
            padding: '24px 28px 18px',
            backgroundColor: 'var(--mint)',
            borderBottom: '1px solid var(--line)',
          }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="lb"
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '.08em',
                  color: 'var(--acc)',
                }}
              >
                EcoStep Mission
              </span>
              <span
                className="pill inline-flex items-center gap-1"
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  color: '#087A3A',
                }}
              >
                <Zap className="w-3 h-3 fill-current" />
                +{mission.xpReward} XP
              </span>
            </div>
            <h2
              id="mission-title"
              style={{
                fontSize: '21px',
                fontWeight: 700,
                color: 'var(--t)',
                lineHeight: 1.2,
              }}
            >
              {mission.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="ib flex items-center justify-center transition-colors"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              border: 'none',
              color: 'var(--t)',
              cursor: 'pointer',
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab navigation bar - tabs padding 0 28px, tab padding 14px 12px, 13px/600, active underline inset 0 -2px 0 #19D46A */}
        <div
          className="tabs flex-shrink-0 z-10 flex items-center"
          style={{
            padding: '0 28px',
            borderBottom: '1px solid var(--line)',
            backgroundColor: 'var(--panel)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('lesson')}
            style={{
              padding: '14px 12px',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              background: 'transparent',
              color: activeTab === 'lesson' ? 'var(--t)' : 'var(--mu)',
              boxShadow: activeTab === 'lesson' ? 'inset 0 -2px 0 #19D46A' : 'none',
              cursor: 'pointer',
            }}
            className="flex items-center gap-2 transition-all"
          >
            <BookOpen className="w-4 h-4" />
            <span>1. Lesson</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quiz')}
            style={{
              padding: '14px 12px',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              background: 'transparent',
              color: activeTab === 'quiz' ? 'var(--t)' : 'var(--mu)',
              boxShadow: activeTab === 'quiz' ? 'inset 0 -2px 0 #19D46A' : 'none',
              cursor: 'pointer',
            }}
            className="flex items-center gap-2 transition-all"
          >
            <HelpCircle className="w-4 h-4" />
            <span>2. Quiz ({questions.length})</span>
          </button>

          {submissionResult && (
            <button
              type="button"
              onClick={() => setActiveTab('results')}
              style={{
                padding: '14px 12px',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                background: 'transparent',
                color: activeTab === 'results' ? 'var(--t)' : 'var(--mu)',
                boxShadow: activeTab === 'results' ? 'inset 0 -2px 0 #19D46A' : 'none',
                cursor: 'pointer',
              }}
              className="flex items-center gap-2 transition-all"
            >
              <Award className="w-4 h-4" />
              <span>3. Results</span>
            </button>
          )}
        </div>

        {/* Content body - padding 24px 28px, scrollable */}
        <div
          ref={scrollBodyRef}
          className="flex-1 min-h-0 overflow-y-auto space-y-4"
          style={{
            padding: '24px 28px',
          }}
        >
          {/* TAB 1: LESSON CONTENT */}
          {activeTab === 'lesson' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="rounded-2xl p-4 bg-[#FFF4E1]/50 dark:bg-slate-800/60 border border-[#89D7B7]/30 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {mission.subtitle}
                </p>
                <p className="mt-1">{mission.description}</p>
              </div>

              {/* Structured Sections */}
              <div className="space-y-4">
                {mission.sections?.map((section, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold bg-[#1A312C] text-[#89D7B7]">
                        {idx + 1}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {section.title}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-8">
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE QUIZ */}
          {activeTab === 'quiz' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Answer all {questions.length} questions. Score 80% or higher to earn +{mission.xpReward} XP.
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {answeredCount} / {questions.length} Answered
                </span>
              </div>

              {submissionError && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{submissionError}</span>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-5">
                {questions.map((q, qIndex) => (
                  <div
                    key={q.id || qIndex}
                    className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold bg-[#428475] text-white">
                        {qIndex + 1}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                        {q.question}
                      </h4>
                    </div>

                    <div className="space-y-2 pl-9">
                      {q.options.map((option, optIndex) => {
                        const isSelected = selectedAnswers[qIndex] === optIndex;
                        const optionLetter = String.fromCharCode(65 + optIndex);

                        return (
                          <label
                            key={optIndex}
                            className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-[#2FBF71]/15 border-[#2FBF71] text-slate-900 dark:text-slate-100 shadow-sm'
                                : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${qIndex}`}
                              value={optIndex}
                              checked={isSelected}
                              onChange={() => handleSelectAnswer(qIndex, optIndex)}
                              className="sr-only"
                            />
                            <span
                              className={`flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-md text-[11px] font-bold ${
                                isSelected
                                  ? 'bg-[#2FBF71] text-white'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {optionLetter}
                            </span>
                            <span className="flex-1">{option}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: QUIZ RESULTS & EXPLANATIONS */}
          {activeTab === 'results' && (
            submissionResult ? (
              <div className="space-y-5">
                {/* Score banner */}
                <div
                  className={`relative overflow-hidden rounded-2xl p-6 border text-center ${
                    submissionResult.passed
                      ? 'bg-gradient-to-br from-emerald-50 to-[#89D7B7]/20 dark:from-emerald-950/40 dark:to-slate-900 border-[#2FBF71]/40'
                      : 'bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/30 dark:to-slate-900 border-amber-500/30'
                  }`}
                >
                  <div className="flex justify-center mb-3">
                    {submissionResult.passed ? (
                      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#2FBF71]/20 text-[#2FBF71]">
                        <Sparkles className="w-8 h-8" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                        <RotateCcw className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                    {submissionResult.passed
                      ? 'Mission Completed Successfully!'
                      : 'Almost There! Passing Score is 80%'}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto">
                    {submissionResult.passed
                      ? submissionResult.alreadyCompleted
                        ? 'You previously completed this mission. Knowledge refreshed!'
                        : `Great work! You scored ${submissionResult.score}/${submissionResult.totalQuestions} (${submissionResult.percentage}%) and earned +${submissionResult.earnedXp} XP!`
                      : `You scored ${submissionResult.score}/${submissionResult.totalQuestions} (${submissionResult.percentage}%). Review the explanations below and try again to unlock XP!`}
                  </p>

                  {/* Newly unlocked badges notification */}
                  {(submissionResult.newlyUnlockedBadges || []).length > 0 && (
                    <div className="mt-4 inline-flex flex-col sm:flex-row items-center gap-2 p-3 rounded-xl bg-[#2FBF71]/15 border border-[#2FBF71]/30 text-[#1A312C] dark:text-[#89D7B7]">
                      <Award className="w-5 h-5 text-[#2FBF71]" />
                      <span className="text-xs font-bold">
                        New Badge Unlocked:{' '}
                        {submissionResult.newlyUnlockedBadges.map((b) => b.name).join(', ')}!
                      </span>
                    </div>
                  )}
                </div>

                {/* Detailed Question Feedback & Explanations */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#428475]" />
                    Question Explanations &amp; Feedback
                  </h4>

                  {(submissionResult.feedback || []).map((item, idx) => {
                    const isCorrect = Boolean(item.isCorrect);
                    return (
                      <div
                        key={item.questionId || idx}
                        className={`p-4 rounded-2xl border ${
                          isCorrect
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/30'
                            : 'bg-red-50/40 dark:bg-red-950/20 border-red-500/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-start gap-2.5">
                            {isCorrect ? (
                              <CheckCircle2 className="w-4 h-4 text-[#2FBF71] flex-shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              Q{idx + 1}: {item.question}
                            </div>
                          </div>

                          <span
                            className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isCorrect
                                ? 'bg-[#2FBF71]/15 text-[#2FBF71]'
                                : 'bg-red-500/15 text-red-500'
                            }`}
                          >
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                        </div>

                        {/* Explanation box */}
                        <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/50 dark:border-white/5 space-y-1">
                          <div className="font-semibold text-slate-700 dark:text-slate-200">
                            Explanation:
                          </div>
                          <p className="leading-relaxed">{item.explanation}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center space-y-4">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  No quiz submission results available yet.
                </p>
                <button
                  type="button"
                  onClick={handleRetryQuiz}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1A312C] text-[#89D7B7]"
                >
                  Return to Quiz
                </button>
              </div>
            )
          )}
        </div>

        {/* Unified Pinned Modal Footer - Always Visible */}
        <div
          className="flex-shrink-0 z-10"
          style={{
            padding: '16px 28px',
            borderTop: '1px solid var(--line)',
            backgroundColor: 'var(--panel)',
          }}
        >
          {activeTab === 'lesson' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Ready to test your understanding? {questions.length} questions await you (80% needed to pass).
              </div>
              <button
                type="button"
                onClick={handleStartQuiz}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#1A312C] hover:bg-[#25463f] text-[#89D7B7] shadow-md transition-all active:scale-95"
              >
                <span>Take Mission Quiz</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {activeTab === 'quiz' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {!player ? (
                <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                  <User className="w-4 h-4 flex-shrink-0" />
                  <span>
                    You are in guest preview. Join as a Guest Player to submit and earn XP.
                  </span>
                </div>
              ) : (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Logged in as <strong className="text-slate-800 dark:text-slate-200">{player.username}</strong>
                </div>
              )}

              <div className="flex items-center gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab('lesson')}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                >
                  Back to Lesson
                </button>

                <button
                  type="button"
                  disabled={isSubmitting || !allAnswered}
                  onClick={handleSubmitQuiz}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all ${
                    allAnswered && !isSubmitting
                      ? 'bg-[#2FBF71] hover:bg-[#28a763] text-white active:scale-95 cursor-pointer'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Scoring Quiz...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Quiz</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'results' && (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleRetryQuiz}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Quiz</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#1A312C] hover:bg-[#25463f] text-[#89D7B7] shadow-sm transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
