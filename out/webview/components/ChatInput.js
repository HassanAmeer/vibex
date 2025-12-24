"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
require("./ChatInput.css");
const ChatInput = ({ onSend, disabled = false }) => {
    const [input, setInput] = (0, react_1.useState)('');
    const textareaRef = (0, react_1.useRef)(null);
    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim() && !disabled) {
            onSend(input.trim());
            setInput('');
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };
    const handleInput = (e) => {
        setInput(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
    };
    return ((0, jsx_runtime_1.jsx)("form", { className: "chat-input", onSubmit: handleSubmit, children: (0, jsx_runtime_1.jsxs)("div", { className: "input-container", children: [(0, jsx_runtime_1.jsx)("textarea", { ref: textareaRef, value: input, onChange: handleInput, onKeyDown: handleKeyDown, placeholder: "Ask anything... (Shift+Enter for new line)", disabled: disabled, rows: 1 }), (0, jsx_runtime_1.jsx)("button", { type: "submit", className: "send-button", disabled: !input.trim() || disabled, children: disabled ? '⏳' : '🚀' })] }) }));
};
exports.default = ChatInput;
//# sourceMappingURL=ChatInput.js.map