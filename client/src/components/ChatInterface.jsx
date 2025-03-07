import React, { useState } from 'react';
import { Input, Button, List, Typography, Spin } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import './ChatInterface.css';

const { Text } = Typography;

const ChatInterface = () => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMessage = inputValue.trim();
        setInputValue('');
        setLoading(true);

        // 添加用户消息
        setMessages(prev => [...prev, { 
            type: 'user', 
            content: userMessage 
        }]);

        try {
            // 使用正确的 API URL（根据你的 VITE_API_URL 环境变量）
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${API_URL}/api/question`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question: userMessage })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // 添加 AI 回答
            setMessages(prev => [...prev, { 
                type: 'assistant', 
                content: data.answer || 'Sorry, I could not process your question.' 
            }]);
        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, { 
                type: 'assistant', 
                content: 'Sorry, an error occurred. Please try again.' 
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleClearData = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${API_URL}/api/clear-data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            if (data.success) {
                setMessages([]);
                alert(`${data.message} (${data.details?.deletedCount || 0} documents deleted)`);
            } else {
                throw new Error(data.message || 'Failed to clear data');
            }
        } catch (error) {
            console.error('Error clearing data:', error);
            alert(`Failed to clear data: ${error.message}`);
        }
    };

    const handleFileUpload = async (file) => {
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_URL}/api/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Upload failed');
            }

            const data = await response.json();
            alert('File uploaded successfully');
        } catch (error) {
            alert('Upload failed: ' + error.message);
        }
    };

    return (
        <div className="chat-interface">
            <div className="chat-messages">
                <List
                    dataSource={messages}
                    renderItem={(message, index) => (
                        <List.Item className={`message ${message.type}`}>
                            <div className="message-header">
                                {message.type === 'assistant' ? 'Luluu:' : 'You:'}
                            </div>
                            <div className="message-content">
                                <Text>{message.content}</Text>
                            </div>
                        </List.Item>
                    )}
                />
                {loading && (
                    <div className="loading-indicator">
                        <Spin />
                        <div style={{ marginTop: 8 }}>Luluu is thinking...</div>
                    </div>
                )}
            </div>
            <div className="chat-input">
                <Input.TextArea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask a question..."
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    disabled={loading}
                />
                <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSend}
                    disabled={!inputValue.trim() || loading}
                >
                    Send
                </Button>
            </div>
            <button onClick={handleClearData} className="clear-data-btn">
                Clear All Data
            </button>
        </div>
    );
};

export default ChatInterface;