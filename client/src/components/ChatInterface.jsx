import { useState } from 'react';

const ChatInterface = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const sendMessage = async () => {
        if (!input.trim()) return;

        try {
            setLoading(true);
            setMessages(prev => [...prev, { type: 'user', content: input }]);

            const response = await fetch('http://localhost:3000/api/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: input })
            });

            const result = await response.json();
            
            setMessages(prev => [...prev, {
                type: 'bot',
                content: result.answer,
                sources: result.sources
            }]);
            
            setInput('');
        } catch (error) {
            console.error('Query error:', error);
            setMessages(prev => [...prev, {
                type: 'error',
                content: 'Sorry, something went wrong.'
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="chat-container">
            {/* <h2>Ask About Company Knowledge</h2> */}
            <div className="messages">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`message ${msg.type}`}>
                        <p>{msg.content}</p>
                        {msg.sources && (
                            <div className="sources">
                                <small>Sources:</small>
                                <ul>
                                    {msg.sources.map((source, i) => (
                                        <li key={i}>{source.fileName}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div className="input-area">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask a question..."
                    disabled={loading}
                />
                <button 
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                >
                    {loading ? 'Thinking...' : 'Send'}
                </button>
            </div>
        </div>
    );
};

export default ChatInterface;