import { useState, useRef } from 'react';
import './ChatInput.css';

interface ChatInputProps {
    onSend: (content: string, attachments?: any[]) => void;
    disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
    onSend,
    disabled = false
}: ChatInputProps) => {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !disabled) {
            onSend(input.trim());
            setInput('');
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
    };

    return (
        <form className="chat-input" onSubmit={handleSubmit}>
            <div className="input-container">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything... (Shift+Enter for new line)"
                    disabled={disabled}
                    rows={1}
                />
                <button
                    type="submit"
                    className="send-button"
                    disabled={!input.trim() || disabled}
                >
                    {disabled ? '⏳' : '🚀'}
                </button>
            </div>
        </form>
    );
};

export default ChatInput;
