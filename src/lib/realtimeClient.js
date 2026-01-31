/**
 * OpenAI Realtime WebSocket 客户端
 * 基于 WebSocket 协议实现实时语音对话
 */

const WS_URL = 'wss://api.openai.com/v1/realtime';

export class RealtimeClient {
    constructor(options = {}) {
        this.apiKey = options.apiKey || import.meta.env.VITE_OPENAI_API_KEY;
        this.model = options.model || 'gpt-4o-realtime-preview-2024-12-17';
        this.systemPrompt = options.systemPrompt || '';

        this.ws = null;
        this.isConnected = false;
        this.audioContext = null;

        // 回调函数
        this.onConnect = options.onConnect || (() => { });
        this.onDisconnect = options.onDisconnect || (() => { });
        this.onError = options.onError || (() => { });
        this.onAudioResponse = options.onAudioResponse || (() => { });
        this.onTextResponse = options.onTextResponse || (() => { });
        this.onStateChange = options.onStateChange || (() => { });
        this.onResponseComplete = options.onResponseComplete || (() => { });
        this.onUserTranscription = options.onUserTranscription || (() => { });
    }

    /**
     * 连接到 OpenAI Realtime API
     */
    async connect() {
        return new Promise((resolve, reject) => {
            try {
                // OpenAI 使用 URL 参数传递 model
                const wsUrl = `${WS_URL}?model=${this.model}`;

                console.log('Connecting to OpenAI Realtime API...');

                // 创建 WebSocket 连接，使用 headers 进行认证
                this.ws = new WebSocket(wsUrl, [
                    'realtime',
                    `openai-insecure-api-key.${this.apiKey}`,
                    'openai-beta.realtime-v1'
                ]);

                this.ws.onopen = () => {
                    console.log('WebSocket connected');
                    this.isConnected = true;
                    this.onConnect();
                    this.sendSessionUpdate();
                    resolve();
                };

                this.ws.onclose = (event) => {
                    console.log('WebSocket closed:', event.code, event.reason);
                    this.isConnected = false;
                    this.onDisconnect();
                };

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    this.onError(error);
                    reject(error);
                };

                this.ws.onmessage = (event) => {
                    this.handleMessage(event);
                };

            } catch (error) {
                console.error('Failed to connect:', error);
                reject(error);
            }
        });
    }

    /**
     * 断开连接
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
    }

    /**
     * 发送消息
     */
    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket is not connected');
        }
    }

    /**
     * 发送会话配置
     */
    sendSessionUpdate() {
        const sessionUpdate = {
            type: 'session.update',
            session: {
                modalities: ['text', 'audio'],
                instructions: this.systemPrompt,
                voice: 'alloy',
                input_audio_format: 'pcm16',
                output_audio_format: 'pcm16',
                input_audio_transcription: {
                    model: 'whisper-1'
                },
                turn_detection: null,  // 使用客户端 VAD
                temperature: 0.8,
                max_response_output_tokens: 4096
            }
        };

        console.log('Sending session update:', sessionUpdate);
        this.send(sessionUpdate);
    }

    /**
     * 发送音频数据
     */
    sendAudio(audioData) {
        if (!this.isConnected) return;

        // 将 ArrayBuffer 转换为 Base64
        const base64Audio = this.arrayBufferToBase64(audioData);

        this.send({
            type: 'input_audio_buffer.append',
            audio: base64Audio
        });
    }

    /**
     * 提交音频缓冲区
     */
    commitAudioBuffer() {
        if (!this.isConnected) return;

        console.log('Committing audio buffer');
        this.send({
            type: 'input_audio_buffer.commit'
        });
    }

    /**
     * 手动触发响应
     */
    triggerResponse() {
        if (!this.isConnected) return;

        console.log('Triggering response');
        this.commitAudioBuffer();
        this.send({
            type: 'response.create'
        });
    }

    /**
     * 取消响应 (打断)
     */
    cancelResponse() {
        if (!this.isConnected) return;

        console.log('Canceling response (Barge-in)');
        this.send({
            type: 'response.cancel'
        });
    }

    /**
     * 处理收到的消息
     */
    handleMessage(event) {
        try {
            const message = JSON.parse(event.data);

            // 过滤频繁的日志
            if (message.type !== 'response.audio.delta') {
                console.log('Received message:', message.type);
            }

            switch (message.type) {
                case 'session.created':
                    console.log('Session created:', message.session?.id);
                    break;

                case 'session.updated':
                    console.log('Session updated');
                    break;

                case 'error':
                    // 忽略 "response_cancel_not_active" 错误
                    // 当我们尝试打断一个已经说完或还没开始说的回复时，会发生这个错误，这是正常的
                    if (message.error && message.error.code === 'response_cancel_not_active') {
                        console.log('Ignored benign error:', message.error.message);
                        return;
                    }

                    console.error('Server error:', message.error);
                    this.onError(message.error);
                    break;

                case 'response.audio.delta':
                    // 音频响应 - Base64 编码
                    if (message.delta) {
                        const audioData = this.base64ToArrayBuffer(message.delta);
                        this.onAudioResponse(audioData);
                    }
                    break;

                case 'response.audio_transcript.delta':
                    // AI 响应文本
                    if (message.delta) {
                        this.onTextResponse(message.delta, 'delta');
                    }
                    break;

                case 'response.text.delta':
                    // 文本响应
                    if (message.delta) {
                        this.onTextResponse(message.delta, 'delta');
                    }
                    break;

                case 'response.done':
                    console.log('Response complete');
                    this.onResponseComplete();
                    break;

                case 'conversation.item.input_audio_transcription.completed':
                    // 用户语音转文字
                    console.log('User transcription:', message.transcript);
                    if (message.transcript) {
                        this.onUserTranscription(message.transcript);
                    }
                    break;

                case 'input_audio_buffer.committed':
                    console.log('Audio buffer committed');
                    break;

                case 'input_audio_buffer.speech_started':
                    console.log('Speech started (server VAD)');
                    break;

                case 'input_audio_buffer.speech_stopped':
                    console.log('Speech stopped (server VAD)');
                    break;

                case 'conversation.item.created':
                    console.log('Conversation item created:', message.item?.role);
                    break;

                case 'response.created':
                    console.log('Response created');
                    break;

                case 'response.output_item.added':
                case 'response.output_item.done':
                case 'response.content_part.added':
                case 'response.content_part.done':
                case 'response.audio.done':
                case 'response.audio_transcript.done':
                case 'response.text.done':
                case 'rate_limits.updated':
                case 'conversation.item.input_audio_transcription.delta':
                    // 忽略这些事件的详细日志
                    break;

                default:
                    console.log('Unhandled message type:', message.type);
            }
        } catch (error) {
            console.error('Failed to parse message:', error);
        }
    }

    /**
     * ArrayBuffer 转 Base64
     */
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Base64 转 ArrayBuffer
     */
    base64ToArrayBuffer(base64) {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }
}
