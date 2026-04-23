import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { MessageSquare, Send } from 'lucide-react';

const CommentsModal = ({ reportId, onClose, currentUserRole }) => {
    const [comments, setComments] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    const fetchComments = async () => {
        try {
            const res = await api.get(`/audit/${reportId}/comments`);
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
            await api.post(`/audit/${reportId}/comments`, { message: newMessage });
            setNewMessage('');
            fetchComments(); // Refresh chat
        } catch (err) {
            alert("Failed to send message");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="glass-card w-full max-w-md h-[600px] flex flex-col animate-fadeIn overflow-hidden">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/80 backdrop-blur-md rounded-t-xl">
                    <div>
                        <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                            <MessageSquare size={20} className="text-indigo-400" /> Discussion
                        </h3>
                        <p className="text-xs text-gray-400 font-mono mt-1">{reportId}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-2xl transition-colors">&times;</button>
                </div>

                {/* Chat Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-900/30 space-y-4">
                    {comments.length === 0 ? (
                        <div className="text-center text-gray-500 mt-10 text-sm">No comments yet. Start the conversation!</div>
                    ) : (
                        comments.map((c, index) => {
                            // Check if the message is from the person currently looking at the screen
                            const isMe = c.role === currentUserRole; 
                            return (
                                <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <span className="text-[10px] text-gray-500 mb-1 ml-1 mr-1">
                                        {c.senderName} ({c.role}) • {new Date(c.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                    <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm shadow-sm ${
                                        isMe 
                                        ? 'bg-indigo-600 text-white rounded-br-none border border-indigo-500/50' 
                                        : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-bl-none'
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
                <form onSubmit={handleSend} className="p-4 bg-gray-900/80 backdrop-blur-md border-t border-gray-800 rounded-b-xl flex gap-2">
                    <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..." 
                        className="flex-1 px-4 py-2 bg-gray-800/50 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-full focus:ring-2 focus:ring-indigo-500 focus:bg-gray-800 focus:outline-none text-sm transition-all"
                    />
                    <button 
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-indigo-600 text-white p-2 w-10 h-10 rounded-full flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-indigo-500/50"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CommentsModal;