export const THEME_PRESETS = {
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

export const DEFAULT_THEME = {
    primaryColor: '#FF5722',
    accentColor: '#FF9800',
    mode: 'dark' as const
};

export function applyTheme(primaryColor: string, accentColor: string) {
    document.documentElement.style.setProperty('--primary-color', primaryColor);
    document.documentElement.style.setProperty('--accent-color', accentColor);
}

export function getThemePreset(name: string) {
    return THEME_PRESETS[name as keyof typeof THEME_PRESETS] || THEME_PRESETS['Deep Orange'];
}

export const THEME_CSS_VARIABLES = {
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
