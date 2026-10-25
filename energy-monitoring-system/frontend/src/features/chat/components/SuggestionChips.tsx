/**
 * SuggestionChips Component
 * 
 * Displays 4 initial suggestion pills below greeting.
 * Hidden after first user message.
 */

import '../chat.css';

const DEFAULT_CHIPS = [
  'What mission should I complete next?',
  'How does piezoelectricity work?',
  'How close am I to the next level?',
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
