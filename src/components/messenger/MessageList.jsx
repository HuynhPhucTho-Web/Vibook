import React, { useEffect, useRef } from "react";
import UserAvatar from "./UserAvatar";
import { FaFile } from "react-icons/fa"; // Import FaFile for document icon
import "../../style/MessageList.css";

const MessageList = ({ messages, currentUser, selectedUser, theme }) => {
    const isLight = theme === "light";
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    if (!selectedUser) return null;

    const getMediaCategory = (url) => {
        if (!url) return "unknown";
        if (/\.(jpg|jpeg|png|gif|webp)/i.test(url)) return "image";
        if (/\.(mp4|webm|ogg)/i.test(url)) return "video";
        if (/\.(pdf|doc|docx)/i.test(url)) return "document";
        return "unknown";
    };

    return (
        <div className={`message-list-container ${isLight ? 'light' : 'dark'}`}>
            {messages.map((message, index) => {
                const isOwnMessage = message.senderId === currentUser?.uid;
                const showAvatar = index === 0 || messages[index - 1]?.senderId !== message.senderId;

                return (
                    <div key={message.id} className={`message-group ${isOwnMessage ? "sent" : "received"}`}>
                        {!isOwnMessage && (
                            <div className="message-avatar">
                                {showAvatar && <UserAvatar user={selectedUser} size={32} />}
                            </div>
                        )}
                        <div className={`message-bubble ${isOwnMessage ? "sent" : "received"} ${isLight ? 'light' : 'dark'}`}>
                            {message.mediaFiles && message.mediaFiles.length > 0 && (
                                <div className="message-media-files mb-2">
                                    {message.mediaFiles.map((file, idx) => {
                                        const category = getMediaCategory(file.url);
                                        return (
                                            <div key={idx} className="message-media-item">
                                                {category === "image" && (
                                                    <img src={file.url} alt="Attached" className="message-image" />
                                                )}
                                                {category === "video" && (
                                                    <video src={file.url} controls className="message-video" />
                                                )}
                                                {category === "document" && (
                                                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="message-document">
                                                        <FaFile size={20} />
                                                        <span>{file.originalName || "Document"}</span>
                                                    </a>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {message.content && <div className="message-content mb-1">{message.content}</div>}
                            <div className="message-time">
                                {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageList;
