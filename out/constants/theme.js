"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.THEME_CSS_VARIABLES = exports.DEFAULT_THEME = exports.THEME_PRESETS = void 0;
exports.applyTheme = applyTheme;
exports.getThemePreset = getThemePreset;
exports.THEME_PRESETS = {
    'Deep Orange': {
        primaryColor: '#FF5722',
        accentColor: '#FF9800'
    },
    'Purple Dream': {
        primaryColor: '#9C27B0',
        accentColor: '#E91E63'
    },
    'Ocean Blue': {
        primaryColor: '#2196F3',
        accentColor: '#00BCD4'
    },
    'Forest Green': {
        primaryColor: '#4CAF50',
        accentColor: '#8BC34A'
    },
    'Sunset Red': {
        primaryColor: '#F44336',
        accentColor: '#FF5722'
    },
    'Royal Purple': {
        primaryColor: '#673AB7',
        accentColor: '#9C27B0'
    }
};
exports.DEFAULT_THEME = {
    primaryColor: '#FF5722',
    accentColor: '#FF9800',
    mode: 'dark'
};
function applyTheme(primaryColor, accentColor) {
    document.documentElement.style.setProperty('--primary-color', primaryColor);
    document.documentElement.style.setProperty('--accent-color', accentColor);
}
function getThemePreset(name) {
    return exports.THEME_PRESETS[name] || exports.THEME_PRESETS['Deep Orange'];
}
exports.THEME_CSS_VARIABLES = {
    '--primary-color': '#FF5722',
    '--accent-color': '#FF9800',
    '--primary-hover': '#E64A19',
    '--accent-hover': '#F57C00',
    '--primary-light': 'rgba(255, 87, 34, 0.1)',
    '--accent-light': 'rgba(255, 152, 0, 0.1)',
    '--gradient-primary': 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
    '--shadow-primary': '0 4px 12px rgba(255, 87, 34, 0.3)',
    '--shadow-accent': '0 4px 12px rgba(255, 152, 0, 0.3)'
};
//# sourceMappingURL=theme.js.map