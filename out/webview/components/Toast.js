"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
require("./Toast.css");
const Toast = ({ message, type, onClose }) => {
    (0, react_1.useEffect)(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);
    const getIcon = () => {
        switch (type) {
            case 'success':
                return '✓';
            case 'error':
                return '✕';
            case 'info':
                return 'ℹ';
            default:
                return '';
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: `toast toast-${type}`, children: [(0, jsx_runtime_1.jsx)("span", { className: "toast-icon", children: getIcon() }), (0, jsx_runtime_1.jsx)("span", { className: "toast-message", children: message }), (0, jsx_runtime_1.jsx)("button", { className: "toast-close", onClick: onClose, children: "\u00D7" })] }));
};
exports.default = Toast;
//# sourceMappingURL=Toast.js.map