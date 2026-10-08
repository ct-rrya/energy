/**
 * SuggestionChips Component
 * 
 * Displays 4 initial suggestion pills below greeting.
 * Hidden after first user message.
 */

import '../chat.css';

const DEFAULT_CHIPS = [
  'How does a footstep make power?',
  "What's the current energy status?",
  'What does the ESP32 do?',
  'How do I read the dashboard?',
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
