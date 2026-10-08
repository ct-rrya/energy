/**
 * ChatLauncher Component
 * 
 * 56px floating green circle button with MessageSquare icon.
 * Opens ChatPanel via custom event.
 */

import { MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import '../chat.css';

export function ChatLauncher() {
  const [isOpen, setIsOpen] = useState(false);

  // Listen for open/close events
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);
    
    window.addEventListener('ecostep:openchat', handleOpen);
    window.addEventListener('ecostep:closechat', handleClose);
    
    return () => {
      window.removeEventListener('ecostep:openchat', handleOpen);
      window.removeEventListener('ecostep:closechat', handleClose);
    };
  }, []);

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('ecostep:openchat', { bubbles: true }));
  };

  // Hide launcher while panel is open
  if (isOpen) return null;

  return (
    <button
      className="chat-launcher"
      onClick={handleClick}
      aria-label="Open EcoChat assistant"
      type="button"
    >
      <MessageSquare size={20} strokeWidth={2} />
    </button>
  );
}
