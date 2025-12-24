import React, { useState } from 'react';
import { MODEL_REGISTRY } from '../../constants/models';
import './ModelSelector.css';

interface ModelSelectorProps {
    currentModel: { provider: string; modelId: string };
    onSelect: (provider: string, modelId: string) => void;
    onClose: () => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
    currentModel,
    onSelect,
    onClose
}: ModelSelectorProps) => {
    const [selectedProvider, setSelectedProvider] = useState(currentModel.provider);

    return (
        <div className="model-selector">
            <div className="model-selector-header">
                <h3>Select AI Model</h3>
                <button className="close-btn" onClick={onClose}>×</button>
            </div>

            <div className="provider-tabs">
                {Object.keys(MODEL_REGISTRY).map(provider => (
                    <button
                        key={provider}
                        className={`provider-tab ${selectedProvider === provider ? 'active' : ''}`}
                        onClick={() => setSelectedProvider(provider)}
                    >
                        {provider.charAt(0).toUpperCase() + provider.slice(1)}
                    </button>
                ))}
            </div>

            <div className="models-grid">
                {MODEL_REGISTRY[selectedProvider]?.map(model => (
                    <div
                        key={model.id}
                        className={`model-card ${currentModel.modelId === model.id ? 'selected' : ''}`}
                        onClick={() => onSelect(selectedProvider, model.id)}
                    >
                        <div className="model-name">{model.name}</div>
                        <div className="model-info">
                            <span className="model-context">{(model.contextWindow / 1000).toFixed(0)}K context</span>
                            {model.freeTier && (
                                <span className="model-free">🎁 Free</span>
                            )}
                        </div>
                        <div className="model-features">
                            {model.features.slice(0, 3).map(feature => (
                                <span key={feature} className="feature-tag">{feature}</span>
                            ))}
                        </div>
                        {model.freeTier && (
                            <div className="model-limit">{model.freeTier.limit}</div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ModelSelector;
