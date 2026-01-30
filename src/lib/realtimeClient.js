/**
 * 智谱 GLM-Realtime WebSocket 客户端
 * 基于 WebSocket 协议实现实时语音对话
 */

const WS_URL = 'wss://open.bigmodel.cn/api/paas/v4/realtime';

export class RealtimeClient {
    constructor(options = {}) {
        this.apiKey = options.apiKey || import.meta.env.VITE_ZHIPUAI_API_KEY;
        this.model = options.model || 'glm-4-realtime';
        this.systemPrompt = options.systemPrompt || '';

        this.ws = null;
        this.isConnected = false;
        this.audioContext = null;
        this.mediaRecorder = null;
        this.audioQueue = [];

        // 回调函数
        this.onConnect = options.onConnect || (() => { });
        this.onDisconnect = options.onDisconnect || (() => { });
        this.onError = options.onError || (() => { });
        this.onAudioResponse = options.onAudioResponse || (() => { });
        this.onTextResponse = options.onTextResponse || (() => { });
        this.onStateChange = options.onStateChange || (() => { });
    }

    /**
     * 生成 JWT Token (简化版本，生产环境应由后端生成)
     */
    generateToken() {
        // 智谱 API 支持直接使用 API Key 作为 Bearer Token
        return this.apiKey;
    }

    /**
     * 建立 WebSocket 连接
     */
    async connect() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.warn('WebSocket already connected');
            return;
        }

        this.onStateChange('connecting');

        return new Promise((resolve, reject) => {
            try {
                // 构建带认证的 WebSocket URL
                const url = `${WS_URL}?model=${this.model}`;

                this.ws = new WebSocket(url, [
                    'realtime',
                    `${this.generateToken()}`
                ]);

                this.ws.binaryType = 'arraybuffer';

                this.ws.onopen = () => {
                    console.log('WebSocket connected');
                    this.isConnected = true;
                    this.onStateChange('connected');
                    this.onConnect();

                    // 发送会话配置
                    this.sendSessionUpdate();
                    resolve();
                };

                this.ws.onmessage = (event) => {
                    this.handleMessage(event);
                };

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    this.onError(error);
                    reject(error);
                };

                this.ws.onclose = (event) => {
                    console.log('WebSocket closed:', event.code, event.reason);
                    this.isConnected = false;
                    this.onStateChange('disconnected');
                    this.onDisconnect();
                };

            } catch (error) {
                console.error('Failed to create WebSocket:', error);
                reject(error);
            }
        });
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
                turn_detection: {
                    type: 'server_vad',
                    threshold: 0.5,
                    prefix_padding_ms: 300,
                    silence_duration_ms: 500
                },
                temperature: 0.8,
                max_response_output_tokens: 4096
            }
        };

        this.send(sessionUpdate);
    }

    /**
     * 处理收到的消息
     */
    handleMessage(event) {
        try {
            // 检查是否为二进制音频数据
            if (event.data instanceof ArrayBuffer) {
                this.handleAudioData(event.data);
                return;
            }

            const message = JSON.parse(event.data);
            console.log('Received message:', message.type);

            switch (message.type) {
                case 'session.created':
                    console.log('Session created:', message.session?.id);
                    break;

                case 'session.updated':
                    console.log('Session updated');
                    break;

                case 'response.audio.delta':
                    // 音频增量数据
                    if (message.delta) {
                        const audioData = this.base64ToArrayBuffer(message.delta);
                        this.onAudioResponse(audioData);
                    }
                    break;

                case 'response.audio_transcript.delta':
                    // 文本转录增量
                    if (message.delta) {
                        this.onTextResponse(message.delta, 'delta');
                    }
                    break;

                case 'response.text.delta':
                    // 文本回复增量
                    if (message.delta) {
                        this.onTextResponse(message.delta, 'delta');
                    }
                    break;

                case 'response.done':
                    console.log('Response complete');
                    break;

                case 'input_audio_buffer.speech_started':
                    console.log('Speech started (VAD)');
                    break;

                case 'input_audio_buffer.speech_stopped':
                    console.log('Speech stopped (VAD)');
                    break;

                case 'error':
                    console.error('Server error:', message.error);
                    this.onError(message.error);
                    break;

                default:
                    console.log('Unhandled message type:', message.type);
            }
        } catch (error) {
            console.error('Failed to parse message:', error);
        }
    }

    /**
     * 处理二进制音频数据
     */
    handleAudioData(arrayBuffer) {
        this.onAudioResponse(arrayBuffer);
    }

    /**
     * Base64 转 ArrayBuffer
     */
    base64ToArrayBuffer(base64) {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
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
     * 发送音频数据
     */
    sendAudio(audioData) {
        if (!this.isConnected) {
            console.warn('WebSocket not connected');
            return;
        }

        const base64Audio = this.arrayBufferToBase64(audioData);

        this.send({
            type: 'input_audio_buffer.append',
            audio: base64Audio
        });
    }

    /**
     * 提交音频缓冲区（触发响应）
     */
    commitAudio() {
        this.send({
            type: 'input_audio_buffer.commit'
        });
    }

    /**
     * 发送文本消息
     */
    sendText(text) {
        if (!this.isConnected) {
            console.warn('WebSocket not connected');
            return;
        }

        this.send({
            type: 'conversation.item.create',
            item: {
                type: 'message',
                role: 'user',
                content: [
                    {
                        type: 'input_text',
                        text: text
                    }
                ]
            }
        });

        // 触发响应生成
        this.send({
            type: 'response.create'
        });
    }

    /**
     * 发送 JSON 消息
     */
    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
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
     * 更新系统提示词
     */
    updateSystemPrompt(prompt) {
        this.systemPrompt = prompt;
        if (this.isConnected) {
            this.sendSessionUpdate();
        }
    }
}

export default RealtimeClient;
