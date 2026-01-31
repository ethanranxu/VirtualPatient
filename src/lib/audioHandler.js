/**
 * 音频处理模块
 * 处理麦克风采集和音频播放
 * 包含客户端VAD（语音活动检测）
 */

export class AudioHandler {
    constructor(options = {}) {
        this.sampleRate = options.sampleRate || 16000;
        this.onAudioData = options.onAudioData || (() => { });

        // 客户端VAD配置
        this.silenceThreshold = options.silenceThreshold || 0.01;  // RMS阈值
        this.speechThreshold = options.speechThreshold || 0.02;    // 开始说话阈值
        this.silenceDuration = options.silenceDuration || 1500;    // 静音持续时间(ms)
        this.onSpeechStart = options.onSpeechStart || (() => { });
        this.onSilenceDetected = options.onSilenceDetected || (() => { });
        this.onPlaybackComplete = options.onPlaybackComplete || (() => { });

        this.audioContext = null;
        this.mediaStream = null;
        this.processor = null;
        this.isRecording = false;

        // VAD状态
        this.isSpeaking = false;
        this.silenceStartTime = null;
        this.hasTriggeredResponse = false;  // 防止重复触发
        this.isVADPaused = false;  // VAD暂停标志

        // 音频播放队列和状态
        this.playbackQueue = [];
        this.activeSources = []; // 正在播放的音频源
        this.isPlaying = false;
        this.playbackStartTime = null;  // 播放开始时间
        this.totalScheduledDuration = 0;  // 总调度的音频时长
        this.onPlaybackComplete = options.onPlaybackComplete || (() => { });
    }

    /**
     * 计算RMS（均方根）值
     * RMS是衡量音频能量/音量的指标
     */
    calculateRMS(float32Array) {
        let sum = 0;
        for (let i = 0; i < float32Array.length; i++) {
            sum += float32Array[i] * float32Array[i];
        }
        return Math.sqrt(sum / float32Array.length);
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

                // 计算RMS进行VAD检测
                // 处理VAD
                const rms = this.calculateRMS(inputData);
                this.processVAD(rms);

                // 移除强制静音，依赖 AEC (回声消除)
                // if (this.isVADPaused) { return; }

                // 转换为 16-bit PCM
                const pcmData = this.floatTo16BitPCM(inputData);

                // 发送音频数据
                this.onAudioData(pcmData);
            };

            source.connect(this.processor);
            this.processor.connect(this.audioContext.destination);

            this.isRecording = true;
            this.isSpeaking = false;
            this.silenceStartTime = null;
            this.hasTriggeredResponse = false;
            console.log('Recording started');

            return true;
        } catch (error) {
            console.error('Failed to start recording:', error);
            throw error;
        }
    }

    /**
     * 处理VAD检测
     */
    processVAD(rms) {
        // 移除 VAD 暂停检查，始终处理 VAD 以支持打断 (Barge-in)
        // if (this.isVADPaused) { return; }

        const now = Date.now();

        if (rms > this.speechThreshold) {
            // 检测到说话
            if (!this.isSpeaking) {
                this.isSpeaking = true;
                this.hasTriggeredResponse = false;  // 新的说话周期，重置触发标记
                console.log('VAD: Speech started, RMS:', rms.toFixed(4));
                this.onSpeechStart();
            }
            this.silenceStartTime = null;  // 重置静音计时
        } else if (rms < this.silenceThreshold) {
            // 检测到静音
            if (this.isSpeaking) {
                // 之前在说话，现在静音了
                if (!this.silenceStartTime) {
                    this.silenceStartTime = now;
                    console.log('VAD: Silence started, RMS:', rms.toFixed(4));
                } else {
                    // 检查静音持续时间
                    const silenceDurationMs = now - this.silenceStartTime;
                    if (silenceDurationMs >= this.silenceDuration && !this.hasTriggeredResponse) {
                        console.log('VAD: Silence detected for', silenceDurationMs, 'ms, triggering response');
                        this.hasTriggeredResponse = true;
                        this.isSpeaking = false;
                        this.onSilenceDetected();
                    }
                }
            }
        }
    }

    /**
     * 暂停VAD检测
     */
    pauseVAD() {
        this.isVADPaused = true;
        console.log('VAD: Paused');
    }

    /**
     * 恢复VAD检测
     */
    resumeVAD() {
        this.isVADPaused = false;
        this.resetVAD();
        console.log('VAD: Resumed');
    }

    /**
     * 重置VAD状态（在收到响应后调用）
     */
    resetVAD() {
        this.isSpeaking = false;
        this.silenceStartTime = null;
        this.hasTriggeredResponse = false;
        console.log('VAD: State reset');
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
     * 播放音频数据 (流式播放优化)
     */
    async playAudio(audioData) {
        if (!this.audioContext) {
            await this.init();
        }

        // 如果音频上下文被暂停，恢复它
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        // 将音频数据添加到队列
        this.playbackQueue.push(audioData);

        // 如果没有正在播放，初始化播放时间并开始播放
        if (!this.isPlaying) {
            this.nextPlayTime = this.audioContext.currentTime;
            this.playbackStartTime = this.audioContext.currentTime;
            this.totalScheduledDuration = 0;
            this.isPlaying = true;
            this.schedulePlayback();
        }
    }

    /**
     * 调度播放队列 (无缝流式播放)
     */
    schedulePlayback() {
        // 持续调度直到队列为空
        while (this.playbackQueue.length > 0) {
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

                // 记录源以便打断
                this.activeSources.push(source);
                source.onended = () => {
                    const index = this.activeSources.indexOf(source);
                    if (index > -1) {
                        this.activeSources.splice(index, 1);
                    }
                };

                // 在精确的时间点开始播放
                const startTime = Math.max(this.nextPlayTime, this.audioContext.currentTime);
                source.start(startTime);

                // 计算下一个音频块的开始时间
                this.nextPlayTime = startTime + audioBuffer.duration;
                this.totalScheduledDuration += audioBuffer.duration;

            } catch (error) {
                console.error('Failed to schedule audio:', error);
            }
        }

        // 设置定时器检查是否有新的音频数据
        if (this.playbackCheckTimer) {
            clearTimeout(this.playbackCheckTimer);
        }

        // 使用更智能的检查逻辑
        const check = () => {
            if (this.playbackQueue.length > 0) {
                this.schedulePlayback();
            } else {
                const remainingTime = this.nextPlayTime - this.audioContext.currentTime;

                if (remainingTime <= 0 && this.activeSources.length === 0) {
                    this.isPlaying = false;
                    console.log('Audio playback complete, total duration:', this.totalScheduledDuration.toFixed(2), 's');
                    this.onPlaybackComplete();
                } else {
                    const delay = Math.max(50, Math.min(remainingTime * 1000 + 100, 500));
                    this.playbackCheckTimer = setTimeout(check, delay);
                }
            }
        };

        this.playbackCheckTimer = setTimeout(check, 50);
    }

    /**
     * 停止播放 (打断)
     */
    stopPlayback() {
        // 清空队列
        this.playbackQueue = [];

        // 停止所有正在播放的源
        this.activeSources.forEach(source => {
            try {
                source.stop();
            } catch (e) {
                // ignore
            }
        });
        this.activeSources = [];

        // 清除定时器
        if (this.playbackCheckTimer) {
            clearTimeout(this.playbackCheckTimer);
            this.playbackCheckTimer = null;
        }

        this.isPlaying = false;
        // 重置播放时间
        this.nextPlayTime = 0;
        this.totalScheduledDuration = 0;

        console.log('Audio playback stopped (Barge-in)');
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
