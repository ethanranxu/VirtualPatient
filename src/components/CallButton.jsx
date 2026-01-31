import React from 'react';

export function CallButton({ isCalling, disabled, onClick, status }) {
    // Map status to display text for the LABEL
    const getStatusLabel = () => {
        if (!isCalling) return null;
        switch (status) {
            case 'connecting': return '正在连接...';
            case 'connected': return '通话中';
            case 'error': return '连接异常';
            case 'disconnected': return '已结束';
            default: return '未知状态';
        }
    };

    return (
        <div className="call-control-container" style={{ width: '100%' }}>
            {/* Visualizer Removed from top - merged into button */}

            {/* 2. Control Row: [Button] [Status Label] */}
            <div className="call-button-wrapper" style={{
                width: '100%',
                padding: '1rem',
                borderTop: '1px solid var(--border-light)',
                background: 'rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            }}>
                {/* Main Action Button */}
                <button
                    className={`call-button-rect ${isCalling ? 'active-special' : ''}`}
                    onClick={onClick}
                    disabled={disabled}
                    style={{ flex: 1, padding: '0', position: 'relative' }}
                >
                    {/* Centered Content */}
                    <div className="center-content" style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        width: '100%',
                        height: '100%',
                        zIndex: 2
                    }}>
                        {!isCalling && (
                            <div className="icon-area">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                    <line x1="12" y1="19" x2="12" y2="23"></line>
                                    <line x1="8" y1="23" x2="16" y2="23"></line>
                                </svg>
                            </div>
                        )}
                        <span className="button-text">
                            {isCalling ? '结束' : '开始沟通'}
                        </span>
                    </div>

                    {/* Integrated Visualizer (Absolute Left) */}
                    {isCalling && status === 'connected' && (
                        <div className="audio-visualizer-mini" style={{
                            position: 'absolute',
                            left: '1.5rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            height: '24px',
                            zIndex: 1
                        }}>
                            <div className="audio-bar-white" />
                            <div className="audio-bar-white" />
                            <div className="audio-bar-white" />
                            <div className="audio-bar-white" />
                        </div>
                    )}

                    {/* Integrated Visualizer (Absolute Right) */}
                    {isCalling && status === 'connected' && (
                        <div className="audio-visualizer-mini visualizer-right" style={{
                            position: 'absolute',
                            right: '1.5rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            height: '24px',
                            zIndex: 1
                        }}>
                            <div className="audio-bar-white" />
                            <div className="audio-bar-white" />
                            <div className="audio-bar-white" />
                            <div className="audio-bar-white" />
                        </div>
                    )}
                </button>

                {/* Status Label (Side) */}
                {isCalling && (
                    <div className="status-side-label" style={{
                        padding: '0 1rem',
                        height: '56px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'white',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                        color: 'var(--color-primary)',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        boxShadow: 'var(--shadow-sm)',
                        minWidth: '100px'
                    }}>
                        {status === 'connected' && <span className="live-dot" style={{ marginRight: '8px', marginLeft: 0 }}></span>}
                        {getStatusLabel()}
                    </div>
                )}
            </div>
        </div>
    );
}

export default CallButton;
