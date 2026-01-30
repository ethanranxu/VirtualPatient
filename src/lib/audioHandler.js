/**
 * 音频处理模块
 * 处理麦克风采集和音频播放
 */

export class AudioHandler {
    constructor(options = {}) {
        this.sampleRate = options.sampleRate || 24000;
        this.onAudioData = options.onAudioData || (() => { });

        this.audioContext = null;
        this.mediaStream = null;
        this.processor = null;
        this.isRecording = false;

        // 音频播放队列
        this.playbackQueue = [];
        this.isPlaying = false;
    }

    /**
     * 初始化音频上下文
     */
    async init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: this.sampleRate
            });
        }

        // 如果音频上下文被暂停，恢复它
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        return this.audioContext;
    }

    /**
     * 请求麦克风权限并开始录音
     */
    async startRecording() {
        try {
            await this.init();

            // 请求麦克风权限
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: this.sampleRate,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            // 创建音频源
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);

            // 使用 AudioWorklet 或 ScriptProcessor 处理音频
            // 为了兼容性，这里使用 ScriptProcessor（已废弃但仍可用）
            const bufferSize = 4096;
            this.processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

            this.processor.onaudioprocess = (event) => {
                if (!this.isRecording) return;

                const inputData = event.inputBuffer.getChannelData(0);

                // 转换为 16-bit PCM
                const pcmData = this.floatTo16BitPCM(inputData);

                // 发送音频数据
                this.onAudioData(pcmData);
            };

            source.connect(this.processor);
            this.processor.connect(this.audioContext.destination);

            this.isRecording = true;
            console.log('Recording started');

            return true;
        } catch (error) {
            console.error('Failed to start recording:', error);
            throw error;
        }
    }

    /**
     * 停止录音
     */
    stopRecording() {
        this.isRecording = false;

        if (this.processor) {
            this.processor.disconnect();
            this.processor = null;
        }

        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }

        console.log('Recording stopped');
    }

    /**
     * 将 Float32Array 转换为 16-bit PCM
     */
    floatTo16BitPCM(float32Array) {
        const buffer = new ArrayBuffer(float32Array.length * 2);
        const view = new DataView(buffer);

        for (let i = 0; i < float32Array.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        }

        return buffer;
    }

    /**
     * 将 16-bit PCM 转换为 Float32Array
     */
    pcm16ToFloat32(pcmData) {
        const view = new DataView(pcmData);
        const float32Array = new Float32Array(pcmData.byteLength / 2);

        for (let i = 0; i < float32Array.length; i++) {
            const int16 = view.getInt16(i * 2, true);
            float32Array[i] = int16 / (int16 < 0 ? 0x8000 : 0x7fff);
        }

        return float32Array;
    }

    /**
     * 播放音频数据
     */
    async playAudio(audioData) {
        if (!this.audioContext) {
            await this.init();
        }

        // 将音频数据添加到队列
        this.playbackQueue.push(audioData);

        // 如果没有正在播放，开始播放
        if (!this.isPlaying) {
            this.processPlaybackQueue();
        }
    }

    /**
     * 处理播放队列
     */
    async processPlaybackQueue() {
        if (this.playbackQueue.length === 0) {
            this.isPlaying = false;
            return;
        }

        this.isPlaying = true;

        const audioData = this.playbackQueue.shift();

        try {
            // 将 PCM 数据转换为 Float32Array
            const float32Data = this.pcm16ToFloat32(audioData);

            // 创建音频缓冲区
            const audioBuffer = this.audioContext.createBuffer(
                1, // 单声道
                float32Data.length,
                this.sampleRate
            );

            audioBuffer.copyToChannel(float32Data, 0);

            // 创建音频源节点
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.audioContext.destination);

            // 播放完成后处理下一个
            source.onended = () => {
                this.processPlaybackQueue();
            };

            source.start();
        } catch (error) {
            console.error('Failed to play audio:', error);
            this.processPlaybackQueue();
        }
    }

    /**
     * 清空播放队列
     */
    clearPlaybackQueue() {
        this.playbackQueue = [];
        this.isPlaying = false;
    }

    /**
     * 释放资源
     */
    dispose() {
        this.stopRecording();
        this.clearPlaybackQueue();

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}

export default AudioHandler;
