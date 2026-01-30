import React from 'react';

const statusMap = {
    idle: { text: '准备就绪', className: '' },
    connecting: { text: '连接中...', className: 'connecting' },
    connected: { text: '通话中', className: 'connected' },
    disconnected: { text: '已断开', className: '' },
    error: { text: '连接错误', className: 'error' }
};

export function CallStatus({ status, showVisualizer }) {
    const { text, className } = statusMap[status] || statusMap.idle;

    return (
        <div className="call-status">
            <div className={`status-indicator ${className}`} />
            <span className="status-text">{text}</span>

            {showVisualizer && status === 'connected' && (
                <div className="audio-visualizer">
                    <div className="audio-bar" />
                    <div className="audio-bar" />
                    <div className="audio-bar" />
                    <div className="audio-bar" />
                    <div className="audio-bar" />
                    <div className="audio-bar" />
                    <div className="audio-bar" />
                </div>
            )}
        </div>
    );
}

export default CallStatus;
