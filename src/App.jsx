import React, { useRef, useEffect } from 'react';
import PersonalitySelector from './components/PersonalitySelector';
import CallButton from './components/CallButton';
import CallStatus from './components/CallStatus';
import { useVirtualPatient } from './hooks/useVirtualPatient';

function App() {
    const {
        selectedPersonality,
        setSelectedPersonality,
        callStatus,
        isCalling,
        messages,
        currentPatientMessage,
        toggleCall
    } = useVirtualPatient();

    // Check API Key
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const isApiKeyConfigured = apiKey && apiKey !== 'your_openai_api_key_here';

    // Auto scroll to bottom
    const messagesEndRef = useRef(null);
    // Auto scroll to bottom - only scroll if there are messages or active streaming
    useEffect(() => {
        if (messages.length > 0 || currentPatientMessage) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, currentPatientMessage]);

    return (
        <div className="app-container">
            <header className="app-header" style={{
                flexDirection: 'row',
                gap: '1.5rem',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: '2rem'
            }}>
                <div className="logo-area" style={{ marginBottom: 0, display: 'flex' }}>
                    {/* Medical Icon: Heartbeat (ECG) */}
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                    <h1 className="app-title" style={{ fontSize: '2rem', marginBottom: 0 }}>虚拟病人</h1>
                    <div className="app-subtitle" style={{ fontSize: '0.875rem', padding: '2px 10px' }}>医学共情训练模拟系统</div>
                </div>
            </header>

            <main className="main-content" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                {/* 1. Personality Selection */}
                <PersonalitySelector
                    selected={selectedPersonality}
                    onSelect={setSelectedPersonality}
                    disabled={isCalling}
                />

                {/* 2. Conversation Panel (Centered) */}
                <div className="chat-container-wrapper" style={{ marginTop: '1rem' }}>
                    <h2 className="section-title">
                        对话记录
                    </h2>

                    <section className="card chat-card" style={{
                        marginTop: '0.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        backgroundColor: '#ffffff',
                        overflow: 'hidden'
                    }}>
                        {/* Status Bar inside the card */}
                        {isCalling && (
                            <div style={{
                                background: 'rgba(16, 185, 129, 0.1)',
                                color: 'var(--color-success)',
                                padding: '6px 0',
                                textAlign: 'center',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                marginTop: '-1px' // Overlap border slightly
                            }}>
                                <span className="status-dot pulse"></span>
                                会话进行中
                            </div>
                        )}

                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            padding: '1rem'
                        }}>
                            {messages.length === 0 && !currentPatientMessage && (
                                <p style={{
                                    color: 'var(--color-text-muted)',
                                    textAlign: 'center',
                                    padding: '4rem 2rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1rem',
                                    alignItems: 'center'
                                }}>
                                    <span style={{ fontSize: '2rem', opacity: 0.2 }}>💬</span>
                                    {isCalling ? '正在连接...' : '请点击下方按钮开始会话'}
                                </p>
                            )}

                            {messages.map((msg, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: msg.role === 'doctor' ? 'flex-end' : 'flex-start'
                                }}>
                                    <span style={{
                                        fontSize: 'var(--role-font-size, 0.8125rem)',
                                        color: msg.role === 'doctor' ? 'var(--color-primary)' : 'var(--color-status-warning)',
                                        marginBottom: '0.25rem',
                                        fontWeight: '600'
                                    }}>
                                        {msg.role === 'doctor' ? '🩺 医生' : '🧑 患者'}
                                    </span>
                                    <div style={{
                                        background: msg.role === 'doctor'
                                            ? 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))'
                                            : 'var(--color-surface-elevated)',
                                        color: msg.role === 'doctor' ? 'white' : 'var(--color-text-primary)',
                                        padding: '0.75rem 1rem',
                                        borderRadius: msg.role === 'doctor' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                                        maxWidth: '98%',
                                        fontSize: '0.75rem',
                                        lineHeight: 1.5,
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                    }}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}

                            {/* Current streaming patient message */}
                            {currentPatientMessage && (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start'
                                }}>
                                    <span style={{
                                        fontSize: 'var(--role-font-size, 0.8125rem)',
                                        color: 'var(--color-status-warning)',
                                        marginBottom: '0.25rem',
                                        fontWeight: '600'
                                    }}>
                                        🧑 患者
                                    </span>
                                    <div style={{
                                        background: 'var(--color-surface-elevated)',
                                        color: 'var(--color-text-primary)',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '12px 12px 12px 4px',
                                        maxWidth: '98%',
                                        fontSize: '0.75rem',
                                        lineHeight: 1.5,
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                    }}>
                                        {currentPatientMessage}
                                        <span style={{ opacity: 0.5 }}>▌</span>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* 3. Controls (Integrated Footer) */}
                        <CallButton
                            isCalling={isCalling}
                            status={callStatus}
                            disabled={!isApiKeyConfigured}
                            onClick={toggleCall}
                        />
                    </section>

                    {!isApiKeyConfigured && (
                        <p className="call-hint" style={{ color: 'var(--color-status-error)', textAlign: 'center', marginTop: '1rem' }}>
                            [错误] API KEY 未配置
                        </p>
                    )}
                </div>
            </main>

            {/* Removed Footer */}
        </div>
    );
}

export default App;
