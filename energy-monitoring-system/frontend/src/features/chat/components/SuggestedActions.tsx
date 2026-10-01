/**
 * SuggestedActions Component
 * 
 * Displays suggested follow-up questions or commands as clickable buttons.
 * When clicked, the suggestion is auto-populated into the chat input field.
 * 
 * The suggestions come from the backend ChatbotResponse.suggestions array
 * and are displayed as interactive buttons styled with the EcoStep accent color.
 * 
 * Requirements: 10.10, 12.3, 4.12 - Touch-friendly responsive design
 */

import { getThemeColors } from '@/lib/theme';

interface SuggestedActionsProps {
  /**
   * Array of suggestion strings to display
   */
  suggestions: string[];
  
  /**
   * Callback function invoked when a suggestion button is clicked
   * @param suggestion - The text of the clicked suggestion
   */
  onSuggestionClick: (suggestion: string) => void;
  
  /**
   * Theme variant for styling (light or dark)
   * Requirements: 12.10
   */
  theme: 'light' | 'dark';
  
  /**
   * Optional className for custom styling
   */
  className?: string;
}

/**
 * Responsive CSS styles for SuggestedActions
 * Requirements: 4.12 - Touch-friendly button sizes
 */
const suggestedActionsStyles = `
  @media (max-width: 768px) {
    .suggested-actions {
      padding: 10px 12px !important;
    }

    .suggested-actions-label {
      font-size: 11px !important;
    }

    .suggested-action-button {
      padding: 10px 14px !important;
      font-size: 13px !important;
      /* Touch-friendly minimum size */
      min-height: 44px !important;
    }
  }

  @media (max-width: 480px) {
    .suggested-actions {
      padding: 8px 10px !important;
      gap: 6px !important;
    }

    .suggested-action-button {
      font-size: 12px !important;
      padding: 10px 12px !important;
    }
  }

  /* Touch device optimization - Requirements: 4.12 */
  @media (hover: none) and (pointer: coarse) {
    .suggested-action-button {
      min-height: 44px !important;
      min-width: 44px !important;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('suggested-actions-responsive-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'suggested-actions-responsive-styles';
  styleSheet.textContent = suggestedActionsStyles;
  document.head.appendChild(styleSheet);
}

/**
 * SuggestedActions Component
 * 
 * Renders a horizontal list of suggestion buttons that users can click
 * to quickly send common queries or follow-up questions.
 * 
 * Supports light and dark theme variants (Requirements: 12.10)
 */
export default function SuggestedActions({
  suggestions,
  onSuggestionClick,
  theme,
  className = '',
}: SuggestedActionsProps) {
  // Don't render anything if there are no suggestions
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const colors = getThemeColors(theme);

  return (
    <div
      className={`suggested-actions ${className}`}
      role="region"
      aria-label="Suggested actions"
      style={{
        padding: '12px 20px',
        backgroundColor: colors.cardBackground,
        borderTop: `1px solid ${colors.border}`,
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        alignItems: 'center',
      }}
    >
      {/* Label for suggestions */}
      <span
        className="suggested-actions-label"
        id="suggestions-label"
        style={{
          fontSize: '12px',
          color: colors.textSecondary,
          fontWeight: '500',
          marginRight: '4px',
        }}
      >
        Suggestions:
      </span>

      {/* Render each suggestion as a clickable button - Uses neon green accent */}
      {suggestions.map((suggestion, index) => (
        <button
          key={`${suggestion}-${index}`}
          className="suggested-action-button"
          onClick={() => onSuggestionClick(suggestion)}
          aria-label={`Suggested action: ${suggestion}`}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: '500',
            color: '#0B132B',
            backgroundColor: colors.inputBackground,
            border: '1.5px solid #39FF88', // Neon green border
            borderRadius: '20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#39FF88';
            e.currentTarget.style.color = '#0B132B';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(57, 255, 136, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.inputBackground;
            e.currentTarget.style.color = '#0B132B';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.98)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
