import { screen } from '@testing-library/react';
import { render } from '../../../test/test-utils';
import { describe, it, expect } from 'vitest';
import ChatInterface from './ChatInterface';

/**
 * Unit tests for ChatInterface component - Task 10.2 & 10.3 verification
 * 
 * Tests Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 12.6, 12.7, 12.8, 12.9, 13.7
 */
describe('ChatInterface - Component Rendering', () => {
  it('should render without crashing', () => {
    const { container } = render(<ChatInterface />);
    expect(container).toBeTruthy();
  });

  it('should render with custom className', () => {
    const { container } = render(<ChatInterface className="custom-class" />);
    const chatInterface = container.querySelector('.chat-interface.custom-class');
    expect(chatInterface).toBeTruthy();
  });

  it('should render chat header', () => {
    render(<ChatInterface />);
    expect(screen.getByText('💬 EcoStep Chat Assistant')).toBeInTheDocument();
  });

  it('should render initial welcome message when provided', () => {
    render(<ChatInterface initialMessage="Welcome to EcoStep!" />);
    expect(screen.getByText('Welcome to EcoStep!')).toBeInTheDocument();
  });

  it('should render message input field', () => {
    const { container } = render(<ChatInterface />);
    const textarea = container.querySelector('textarea');
    expect(textarea).toBeTruthy();
    expect(textarea?.placeholder).toContain('Type your message');
  });

  it('should render send button', () => {
    const { container } = render(<ChatInterface />);
    const button = container.querySelector('.chat-input button');
    expect(button).toBeTruthy();
    expect(button?.textContent).toBe('Send');
  });

  it('should have placeholder text mentioning Enter key', () => {
    const { container } = render(<ChatInterface />);
    const textarea = container.querySelector('textarea');
    expect(textarea?.placeholder).toContain('Enter to send');
    expect(textarea?.placeholder).toContain('Shift+Enter');
  });

  it('should not show typing indicator initially', () => {
    const { container } = render(<ChatInterface />);
    const typingIndicator = container.querySelector('.typing-indicator');
    expect(typingIndicator).toBeFalsy();
  });
});
