import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const CommentsModal = ({ reportId, onClose, currentUserRole }) => {
    const [comments, setComments] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

    const fetchComments = async () => {
        try {
            const res = await axios.get(`http://localhost:4000/api/audit/${reportId}/comments`, getAuthHeader());
            setComments(res.data);
        } catch (err) {
            console.error("Failed to load comments");
        }
    };

    useEffect(() => {
        fetchComments();
    }, [reportId]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [comments]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await axios.post(`http://localhost:4000/api/audit/${reportId}/comments`, { message: newMessage }, getAuthHeader());
            setNewMessage('');
            fetchComments(); // Refresh chat
        } catch (err) {
            alert("Failed to send message");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md h-[600px] flex flex-col animate-fadeIn">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            💬 Discussion
                        </h3>
                        <p className="text-xs text-gray-500 font-mono mt-1">{reportId}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                </div>

                {/* Chat Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                    {comments.length === 0 ? (
                        <div className="text-center text-gray-400 mt-10 text-sm">No comments yet. Start the conversation!</div>
                    ) : (
                        comments.map((c, index) => {
                            // Check if the message is from the person currently looking at the screen
                            const isMe = c.role === currentUserRole; 
                            return (
                                <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <span className="text-[10px] text-gray-400 mb-1 ml-1 mr-1">
                                        {c.senderName} ({c.role}) • {new Date(c.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                    <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm shadow-sm ${
                                        isMe 
                                        ? 'bg-blue-600 text-white rounded-br-none' 
                                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                    }`}>
                                        {c.message}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 rounded-b-xl flex gap-2">
                    <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..." 
                        className="flex-1 px-4 py-2 bg-gray-100 border-transparent rounded-full focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none text-sm transition-all"
                    />
                    <button 
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CommentsModal;