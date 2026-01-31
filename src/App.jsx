import React from 'react';
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
        transcript,
        toggleCall
    } = useVirtualPatient();

    // Check API Key
    const apiKey = import.meta.env.VITE_ZHIPUAI_API_KEY;
    const isApiKeyConfigured = apiKey && apiKey !== 'your_api_key_here';

    return (
        <div className="app-container">
            <header className="app-header">
                <div className="logo-area">
                    {/* Medical Icon: Heartbeat (ECG) */}
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                </div>
                <h1 className="app-title">虚拟病人</h1>
                <div className="app-subtitle">医学共情训练模拟系统</div>
            </header>

            <main className="main-content">
                {/* 1. Data Panel: Personality Selection */}
                <PersonalitySelector
                    selected={selectedPersonality}
                    onSelect={setSelectedPersonality}
                    disabled={isCalling}
                />

                {/* 2. Control Core: Call Section */}
                <section className="call-section">
                    <div className="call-info">
                        <span className="call-status-label">系统状态</span>
                        <span className="call-action-text">
                            {isCalling
                                ? '会话进行中'
                                : '系统就绪'}
                        </span>

                        <p className="call-hint" style={{ marginTop: '0.5rem' }}>
                            {isCalling
                                ? `已连接: ${selectedPersonality === 'rationalist' ? '理性者' : '指责者'} 协议`
                                : '请选择协议并启动会话'
                            }
                        </p>
                    </div>

                    <CallButton
                        isCalling={isCalling}
                        disabled={!isApiKeyConfigured}
                        onClick={toggleCall}
                    />

                    {!isApiKeyConfigured && (
                        <p className="call-hint" style={{ color: 'var(--color-status-error)' }}>
                            [错误] API KEY 未配置
                        </p>
                    )}

                    <CallStatus
                        status={callStatus}
                        showVisualizer={isCalling}
                    />
                </section>

                {/* Transcript Section */}
                {transcript && (
                    <section className="transcript-section card" style={{ width: '100%', maxWidth: '800px' }}>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>对话内容</h3>
                        <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{transcript}</p>
                    </section>
                )}
            </main>

            <footer style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                <p>基于智谱 GLM-Realtime 构建</p>
            </footer>
        </div>
    );
}

export default App;
