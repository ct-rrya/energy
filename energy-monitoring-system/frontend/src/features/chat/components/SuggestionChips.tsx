/**
 * SuggestionChips Component
 * 
 * Displays 4 initial suggestion pills below greeting.
 * Hidden after first user message.
 */

import '../chat.css';

const DEFAULT_CHIPS = [
  'How does piezoelectricity work?',
  'What is our milestone goal this month?',
  'How close are we to this week’s target?',
  'What does power generation mean?',
  'Explain voltage vs current vs power',
  "What's today's energy status?",
];

interface SuggestionChipsProps {
  onChipClick: (text: string) => void;
}

export function SuggestionChips({ onChipClick }: SuggestionChipsProps) {
  return (
    <div className="suggestion-chips">
      {DEFAULT_CHIPS.map((chip, index) => (
        <button
          key={index}
          className="suggestion-chip"
          onClick={() => onChipClick(chip)}
          type="button"
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
