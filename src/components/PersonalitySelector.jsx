import React from 'react';

const personalities = [
    {
        id: 'rationalist',
        name: '理性者',
        icon: (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.5 2C7.5 2 6 3.5 6 5.5v.5C4 6 2.5 7.5 2.5 9.5S4 13 6 13v.5c0 2 1.5 3.5 3.5 3.5h5c2 0 3.5-1.5 3.5-3.5v-.5c2 0 3.5-1.5 3.5-3.5S20 6 18 6v-.5c0-2-1.5-3.5-3.5-3.5h-5Z" />
                <path d="M12 2v20" />
                <path d="M12 12h-6" />
                <path d="M12 12h6" />
            </svg>
        ),
        description: '冷静、逻辑严密。用学术化语言质疑一切，只有真正的共情才能打开心扉。'
    },
    {
        id: 'blamer',
        name: '指责者',
        icon: (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
        ),
        description: '情绪激动、充满怒火。用指责掩盖恐惧，只有被理解才会软化。'
    }
];

export function PersonalitySelector({ selected, onSelect, disabled }) {
    return (
        <section className="personality-section">
            <h2 className="section-title">选择病人性格</h2>
            <div className="personality-grid">
                {personalities.map((personality) => (
                    <div
                        key={personality.id}
                        className={`personality-card ${selected === personality.id ? 'selected' : ''}`}
                        onClick={() => !disabled && onSelect(personality.id)}
                        style={{ opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
                    >
                        <div className="personality-icon" style={{ color: selected === personality.id ? 'var(--color-primary)' : 'inherit' }}>
                            {personality.icon}
                        </div>
                        <h3 className="personality-name">{personality.name}</h3>
                        <p className="personality-desc">{personality.description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default PersonalitySelector;
