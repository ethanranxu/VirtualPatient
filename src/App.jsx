import React, { useState, useRef, useCallback } from 'react';
import PersonalitySelector from './components/PersonalitySelector';
import CallButton from './components/CallButton';
import CallStatus from './components/CallStatus';
import { RealtimeClient } from './lib/realtimeClient';
import { AudioHandler } from './lib/audioHandler';
import { rationalistPrompt } from './prompts/rationalist';
import { blamerPrompt } from './prompts/blamer';

// 根据性格 ID 获取对应的提示词
const getPromptByPersonality = (personalityId) => {
    switch (personalityId) {
        case 'rationalist':
            return rationalistPrompt;
        case 'blamer':
            return blamerPrompt;
        default:
            return rationalistPrompt;
    }
};

function App() {
    // 状态
    const [selectedPersonality, setSelectedPersonality] = useState('rationalist');
    const [callStatus, setCallStatus] = useState('idle'); // idle, connecting, connected, error
    const [isCalling, setIsCalling] = useState(false);
    const [transcript, setTranscript] = useState('');

    // 引用
    const clientRef = useRef(null);
    const audioHandlerRef = useRef(null);

    // 开始通话
    const startCall = useCallback(async () => {
        try {
            setCallStatus('connecting');
            setTranscript('');

            // 获取对应性格的提示词
            const systemPrompt = getPromptByPersonality(selectedPersonality);

            // 初始化音频处理器
            audioHandlerRef.current = new AudioHandler({
                sampleRate: 24000,
                onAudioData: (audioData) => {
                    // 发送音频数据到服务器
                    if (clientRef.current) {
                        clientRef.current.sendAudio(audioData);
                    }
                }
            });

            // 初始化 Realtime 客户端
            clientRef.current = new RealtimeClient({
                systemPrompt: systemPrompt,
                onConnect: () => {
                    console.log('Connected to GLM-Realtime');
                },
                onDisconnect: () => {
                    console.log('Disconnected');
                    setIsCalling(false);
                    setCallStatus('disconnected');
                },
                onError: (error) => {
                    console.error('Client error:', error);
                    setCallStatus('error');
                },
                onStateChange: (state) => {
                    setCallStatus(state);
                },
                onAudioResponse: (audioData) => {
                    // 播放 AI 的音频回复
                    if (audioHandlerRef.current) {
                        audioHandlerRef.current.playAudio(audioData);
                    }
                },
                onTextResponse: (text, type) => {
                    // 更新文本转录
                    if (type === 'delta') {
                        setTranscript(prev => prev + text);
                    }
                }
            });

            // 连接到服务器
            await clientRef.current.connect();

            // 开始录音
            await audioHandlerRef.current.startRecording();

            setIsCalling(true);
            setCallStatus('connected');

        } catch (error) {
            console.error('Failed to start call:', error);
            setCallStatus('error');
            setIsCalling(false);

            // 清理资源
            if (audioHandlerRef.current) {
                audioHandlerRef.current.dispose();
            }
            if (clientRef.current) {
                clientRef.current.disconnect();
            }
        }
    }, [selectedPersonality]);

    // 结束通话
    const endCall = useCallback(() => {
        // 停止录音
        if (audioHandlerRef.current) {
            audioHandlerRef.current.dispose();
            audioHandlerRef.current = null;
        }

        // 断开连接
        if (clientRef.current) {
            clientRef.current.disconnect();
            clientRef.current = null;
        }

        setIsCalling(false);
        setCallStatus('idle');
    }, []);

    // 处理通话按钮点击
    const handleCallClick = useCallback(() => {
        if (isCalling) {
            endCall();
        } else {
            startCall();
        }
    }, [isCalling, startCall, endCall]);

    // 检查 API Key 是否配置
    const apiKey = import.meta.env.VITE_ZHIPUAI_API_KEY;
    const isApiKeyConfigured = apiKey && apiKey !== 'your_api_key_here';

    return (
        <div className="app-container">
            <header className="app-header">
                <div className="logo-area">
                    {/* 医疗图标：心电图 (ECG) */}
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                </div>
                <h1 className="app-title">虚拟病人</h1>
                <div className="app-subtitle">医学共情训练模拟系统</div>
            </header>

            <main className="main-content">
                {/* 1. 数据面板：性格选择 */}
                <PersonalitySelector
                    selected={selectedPersonality}
                    onSelect={setSelectedPersonality}
                    disabled={isCalling}
                />

                {/* 2. 控制核心：通话区域 */}
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
                        onClick={handleCallClick}
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

                {/* 对话转录区域 */}
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
