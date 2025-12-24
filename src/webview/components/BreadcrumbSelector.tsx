import React, { useState, useRef, useEffect } from 'react';
import { MODEL_REGISTRY } from '../../constants/models';
import { Icons } from './Icons';
import './BreadcrumbSelector.css';

interface BreadcrumbSelectorProps {
    currentProvider: string;
    currentModelId: string;
    onSelect: (provider: string, modelId: string) => void;
}

export const BreadcrumbSelector: React.FC<BreadcrumbSelectorProps> = ({
    currentProvider,
    currentModelId,
    onSelect
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<'providers' | 'models'>('providers');
    const [selectedProvider, setSelectedProvider] = useState(currentProvider);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setView('providers');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleProviderClick = (providerId: string) => {
        setSelectedProvider(providerId);
        setView('models');
    };

    const handleModelClick = (modelId: string) => {
        onSelect(selectedProvider, modelId);
        setIsOpen(false);
        setView('providers');
    };

    const handleBack = (e: React.MouseEvent) => {
        e.stopPropagation();
        setView('providers');
    };

    const getProviderName = (id: string) => {
        const names: any = {
            groq: 'Groq',
            google: 'Google',
            cerebras: 'Cerebras',
            sambanova: 'SambaNova',
            openai: 'OpenAI',
            anthropic: 'Anthropic'
        };
        return names[id] || id;
    };

    const getModelName = (id: string, provider: string) => {
        const models = MODEL_REGISTRY[provider] || [];
        const model = models.find(m => m.id === id);
        return model ? model.name : id;
    };

    const getProviderEmoji = (id: string) => {
        const emojis: any = {
            groq: '⚡',
            google: '🔮',
            cerebras: '🧠',
            sambanova: '🚀',
            openai: '🤖',
            anthropic: '🎭'
        };
        return emojis[id] || '🔌';
    };

    return (
        <div className="breadcrumb-container" ref={dropdownRef}>
            <div className="breadcrumb-trigger" onClick={() => setIsOpen(!isOpen)}>
                <div className="provider-pill">
                    <span>{getProviderEmoji(currentProvider)}</span>
                    <span>{getProviderName(currentProvider)}</span>
                </div>
                <span className="separator"><Icons.ChevronRight /></span>
                <span className="model-name">{getModelName(currentModelId, currentProvider)}</span>
                <span className="separator" style={{ marginLeft: '4px' }}><Icons.ChevronDown /></span>
            </div>

            {isOpen && (
                <div className="breadcrumb-dropdown">
                    {view === 'providers' ? (
                        <>
                            <div className="dropdown-header">Select Provider</div>
                            <div className="dropdown-list">
                                {Object.keys(MODEL_REGISTRY).map(providerId => (
                                    <div
                                        key={providerId}
                                        className={`dropdown-item ${currentProvider === providerId ? 'active' : ''}`}
                                        onClick={() => handleProviderClick(providerId)}
                                    >
                                        <span className="item-icon">{getProviderEmoji(providerId)}</span>
                                        <div className="item-info">
                                            <span className="item-name">{getProviderName(providerId)}</span>
                                        </div>
                                        <span style={{ marginLeft: 'auto', opacity: 0.5 }}>
                                            <Icons.ChevronRight />
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="dropdown-header">
                                <span className="back-link" onClick={handleBack}>Providers</span>
                                <span className="separator">/</span>
                                <span>{getProviderName(selectedProvider)}</span>
                            </div>
                            <div className="dropdown-list">
                                {MODEL_REGISTRY[selectedProvider]?.map(model => (
                                    <div
                                        key={model.id}
                                        className={`dropdown-item ${currentModelId === model.id ? 'active' : ''}`}
                                        onClick={() => handleModelClick(model.id)}
                                    >
                                        <div className="item-info">
                                            <span className="item-name">{model.name}</span>
                                            <span className="item-desc">{model.features[0]}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
