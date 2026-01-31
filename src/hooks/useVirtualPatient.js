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
    const [transcript, setTranscript] = useState('');

    // Refs
    const clientRef = useRef(null);
    const audioHandlerRef = useRef(null);

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
            setTranscript('');

            // Get System Prompt
            const systemPrompt = getPromptByPersonality(selectedPersonality);

            // Initialize Audio Handler
            audioHandlerRef.current = new AudioHandler({
                sampleRate: 24000,
                onAudioData: (audioData) => {
                    if (clientRef.current) {
                        clientRef.current.sendAudio(audioData);
                    }
                }
            });

            // Initialize Realtime Client
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
                    setIsCalling(false);
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
                        setTranscript(prev => prev + text);
                    }
                }
            });

            // Connect
            await clientRef.current.connect();

            // Start Recording
            await audioHandlerRef.current.startRecording();

            setIsCalling(true);
            setCallStatus('connected');

        } catch (error) {
            console.error('Failed to start call:', error);
            setCallStatus('error');
            setIsCalling(false);

            // Cleanup
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

    return {
        selectedPersonality,
        setSelectedPersonality,
        callStatus,
        isCalling,
        transcript,
        toggleCall
    };
}
