import { useState, useRef, useCallback, useEffect } from 'react';
import { RealtimeClient } from '../lib/realtimeClient';
import { AudioHandler } from '../lib/audioHandler';
import { rationalistPrompt } from '../prompts/rationalist';
import { blamerPrompt } from '../prompts/blamer';

// Helper: Get prompt by personality ID
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

export function useVirtualPatient() {
    // State
    const [selectedPersonality, setSelectedPersonality] = useState('rationalist');
    const [callStatus, setCallStatus] = useState('idle'); // idle, connecting, connected, error, disconnected
    const [isCalling, setIsCalling] = useState(false);
    const [messages, setMessages] = useState([]); // [{role: 'patient'|'doctor', content: '...'}]
    const [currentPatientMessage, setCurrentPatientMessage] = useState('');

    // Refs
    const clientRef = useRef(null);
    const audioHandlerRef = useRef(null);
    const isWaitingForResponseRef = useRef(false);  // 防止响应期间重复触发

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (audioHandlerRef.current) audioHandlerRef.current.dispose();
            if (clientRef.current) clientRef.current.disconnect();
        };
    }, []);

    // Start Call
    const startCall = useCallback(async () => {
        try {
            setCallStatus('connecting');
            setMessages([]);
            setCurrentPatientMessage('');
            isWaitingForResponseRef.current = false;

            // Get System Prompt
            const systemPrompt = getPromptByPersonality(selectedPersonality);

            // 1. Initialize Realtime Client
            clientRef.current = new RealtimeClient({
                systemPrompt: systemPrompt,
                onConnect: () => {
                    console.log('Connected to OpenAI Realtime');
                },
                onDisconnect: () => {
                    console.log('Disconnected');
                    setIsCalling(false);
                    setCallStatus('disconnected');
                },
                onError: (error) => {
                    console.error('Client error:', error);
                    setCallStatus('error');
                    setIsCalling(false);
                    isWaitingForResponseRef.current = false;
                },
                onStateChange: (state) => {
                    setCallStatus(state);
                },
                onAudioResponse: (audioData) => {
                    if (audioHandlerRef.current) {
                        audioHandlerRef.current.playAudio(audioData);
                    }
                },
                onTextResponse: (text, type) => {
                    if (type === 'delta') {
                        setCurrentPatientMessage(prev => prev + text);
                    }
                },
                onUserTranscription: (text) => {
                    if (text && text.trim()) {
                        setMessages(prev => [...prev, { role: 'doctor', content: text.trim() }]);
                    }
                },
                onResponseComplete: () => {
                    setCurrentPatientMessage(prev => {
                        if (prev.trim()) {
                            setMessages(msgs => [...msgs, { role: 'patient', content: prev.trim() }]);
                        }
                        return '';
                    });
                    console.log('Response complete');
                }
            });

            // 2. Initialize Audio Handler with client-side VAD
            audioHandlerRef.current = new AudioHandler({
                sampleRate: 24000,
                silenceThreshold: 0.01,
                speechThreshold: 0.02,
                silenceDuration: 1500,
                onAudioData: (audioData) => {
                    // 始终发送音频（依赖服务端VAD或客户端Logic）
                    if (clientRef.current && !isWaitingForResponseRef.current) {
                        clientRef.current.sendAudio(audioData);
                    }
                },
                onSpeechStart: () => {
                    console.log('Client VAD: User started speaking (Barge-in check)');

                    // 打断逻辑：如果有播放，立即停止
                    if (audioHandlerRef.current && audioHandlerRef.current.isPlaying) {
                        console.log('Barge-in detected! Stopping playback.');
                        audioHandlerRef.current.stopPlayback();
                    }

                    // 取消服务端正在生成的响应
                    if (clientRef.current && clientRef.current.isConnected) {
                        clientRef.current.cancelResponse();
                    }
                },
                onSilenceDetected: () => {
                    if (!isWaitingForResponseRef.current) {
                        console.log('Client VAD: Silence detected, auto-triggering response');
                        if (clientRef.current && clientRef.current.isConnected) {
                            isWaitingForResponseRef.current = true;
                            clientRef.current.triggerResponse();
                        }
                    }
                },
                onPlaybackComplete: () => {
                    console.log('Audio playback finished');
                    setTimeout(() => {
                        isWaitingForResponseRef.current = false;
                    }, 100);
                }
            });

            // 3. Connect & Start
            await clientRef.current.connect();
            await audioHandlerRef.current.startRecording();

            setIsCalling(true);
            setCallStatus('connected');

        } catch (error) {
            console.error('Failed to start call:', error);
            setCallStatus('error');
            setIsCalling(false);

            if (audioHandlerRef.current) audioHandlerRef.current.dispose();
            if (clientRef.current) clientRef.current.disconnect();
        }
    }, [selectedPersonality]);

    // End Call
    const endCall = useCallback(() => {
        if (audioHandlerRef.current) {
            audioHandlerRef.current.dispose();
            audioHandlerRef.current = null;
        }

        if (clientRef.current) {
            clientRef.current.disconnect();
            clientRef.current = null;
        }

        setIsCalling(false);
        setCallStatus('idle');
    }, []);

    // Toggle Call
    const toggleCall = useCallback(() => {
        if (isCalling) {
            endCall();
        } else {
            startCall();
        }
    }, [isCalling, startCall, endCall]);

    // Manually trigger response (fallback when VAD doesn't work)
    const triggerResponse = useCallback(() => {
        if (clientRef.current && clientRef.current.isConnected) {
            clientRef.current.triggerResponse();
        }
    }, []);

    return {
        selectedPersonality,
        setSelectedPersonality,
        callStatus,
        isCalling,
        messages,
        currentPatientMessage,
        toggleCall,
        triggerResponse
    };
}
