import React from 'react';

export function CallButton({ isCalling, disabled, onClick }) {
    // 模仿 ChatGPT 的语音模式：
    // 1. 一个巨大的圆形按钮
    // 2. 只有麦克风图标或波形
    // 3. 通话时有呼吸效果的外圈

    return (
        <div className="call-button-container">
            {/* 呼吸动画外圈 - 仅通话时显示 */}
            {isCalling && (
                <>
                    <div className="pulse-ring ring-1"></div>
                    <div className="pulse-ring ring-2"></div>
                    <div className="pulse-ring ring-3"></div>
                </>
            )}

            <button
                className={`call-button ${isCalling ? 'calling' : 'idle'}`}
                onClick={onClick}
                disabled={disabled}
                title={isCalling ? '结束通话' : '开始会诊'}
            >
                {isCalling ? (
                    // 挂断图标 (X)
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                ) : (
                    // 耳机图标 (Headphones) - 代表开始对话
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                    </svg>
                )}
            </button>
        </div>
    );
}

export default CallButton;
