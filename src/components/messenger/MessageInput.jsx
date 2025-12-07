import React, { useState, useEffect, useRef } from "react";
import { FaPaperPlane, FaSmile, FaPaperclip, FaMicrophone, FaTimes, FaFile, FaVideo, FaImage } from "react-icons/fa";
import Picker from "emoji-picker-react";
import "../../style/MessageInput.css";
import { Cloudinary } from "@cloudinary/url-gen";
import { toast } from "react-toastify"; // Ensure toast is imported

const MessageInput = ({ messageText, onMessageChange, onSendMessage, theme }) => {
    const isLight = theme === "light";
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiPickerRef = useRef(null);
    const emojiButtonRef = useRef(null);

    // File attachment states and refs
    const [attachedFiles, setAttachedFiles] = useState([]);
    const [isUploadingAttachments, setIsUploadingAttachments] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);
    const videoRef = useRef(null); // For video previews in attachments

    // Voice recording states and refs
    const [isRecording, setIsRecording] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState(null);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const recordingIntervalRef = useRef(null);
    const audioPreviewRef = useRef(null);
    const audioChunks = useRef([]); // To store audio data chunks

    // Constants for file handling
    const FILE_SIZE_LIMITS = { image: 5, video: 25, document: 10, audio: 10 }; // MB
    const SUPPORTED_TYPES = {
        image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
        video: ["video/mp4", "video/webm", "video/ogg", "video/avi"],
        document: [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        audio: ["audio/webm", "audio/mp4", "audio/ogg"],
    };
    const currentDateTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" });

    // Cloudinary client setup
    new Cloudinary({
        cloud: { cloudName: import.meta.env.VITE_REACT_APP_CLOUDINARY_CLOUD_NAME || "fallback" },
    });

    // Cloudinary env check
    useEffect(() => {
        const cloudName = import.meta.env.VITE_REACT_APP_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_REACT_APP_CLOUDINARY_UPLOAD_PRESET;
        if (!cloudName || !uploadPreset) {
          console.error(`[${currentDateTime}] Missing Cloudinary envs`);
          toast.error("Cloudinary configuration missing in .env", { position: "top-center" });
        }
      }, []);

    // Cleanup video preview blobs
    useEffect(() => {
        return () => {
            attachedFiles.forEach((f) => {
                if (f.preview && f.category === "video") URL.revokeObjectURL(f.preview);
            });
            if (recordedBlob) URL.revokeObjectURL(recordedBlob.preview);
        };
    }, [attachedFiles, recordedBlob]);

    // Timer for recording
    useEffect(() => {
        if (isRecording) {
            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime((prevTime) => prevTime + 1);
            }, 1000);
        } else if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
            recordingIntervalRef.current = null;
        }
        return () => {
            if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        };
    }, [isRecording]);

    const formatRecordingTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Voice recording handlers
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            audioChunks.current = [];

            recorder.ondataavailable = (event) => {
                audioChunks.current.push(event.data);
            };

            recorder.onstop = () => {
                const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
                const previewUrl = URL.createObjectURL(audioBlob);
                setRecordedBlob({
                    id: Date.now(),
                    file: audioBlob,
                    preview: previewUrl,
                    category: 'audio',
                    type: 'audio/webm',
                    name: `voice_message_${Date.now()}.webm`,
                    size: audioBlob.size,
                    progress: 0,
                });
                stream.getTracks().forEach(track => track.stop());
                setIsRecording(false);
                setRecordingTime(0);
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
            setRecordingTime(0);
        } catch (error) {
            console.error("Error starting recording:", error);
            toast.error("Failed to start recording. Please check microphone permissions.", { position: "top-center" });
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
    };

    const handleRecordClick = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const removeRecordedAudio = () => {
        if (recordedBlob?.preview) {
            URL.revokeObjectURL(recordedBlob.preview);
        }
        setRecordedBlob(null);
    };

    // File handling helpers (similar to PostCreate.jsx)
    const getFileCategory = (t) => {
        if (SUPPORTED_TYPES.image.includes(t)) return "image";
        if (SUPPORTED_TYPES.video.includes(t)) return "video";
        if (SUPPORTED_TYPES.document.includes(t)) return "document";
        return "unknown";
    };

    const validateFile = (file) => {
        const category = getFileCategory(file.type);
        if (category === "unknown") return { valid: false, error: `Unsupported file format: ${file.type}` };
        const max = FILE_SIZE_LIMITS[category] * 1024 * 1024;
        if (file.size > max) {
            return { valid: false, error: `File ${category} must be less than ${FILE_SIZE_LIMITS[category]}MB` };
        }
        return { valid: true };
    };

    const createFilePreview = (file) =>
        new Promise((resolve) => {
            const category = getFileCategory(file.type);
            if (category === "image") {
                const r = new FileReader();
                r.onloadend = () => resolve(r.result);
                r.readAsDataURL(file);
            } else if (category === "video") {
                resolve(URL.createObjectURL(file));
            } else resolve(null); // No preview for documents
        });

    const uploadFileToCloudinary = async (fileData, onProgress) => {
        const fd = new FormData();
        fd.append("file", fileData.file);
        fd.append("upload_preset", import.meta.env.VITE_REACT_APP_CLOUDINARY_UPLOAD_PRESET);
        if (fileData.category === "document") fd.append("resource_type", "raw");
        else if (fileData.category === "video") fd.append("resource_type", "video");
    
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_REACT_APP_CLOUDINARY_CLOUD_NAME}/${fileData.category === "document" ? "raw" : "auto"}/upload`);
    
        xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
                const percent = Math.round((event.loaded / event.total) * 100);
                onProgress(fileData.id, percent);
            }
        });
    
        return new Promise((resolve, reject) => {
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const json = JSON.parse(xhr.responseText);
                    resolve({
                        url: json.secure_url,
                        publicId: json.public_id,
                        resourceType: json.resource_type,
                        originalName: fileData.name,
                        size: fileData.size,
                        category: fileData.category,
                    });
                } else {
                    console.error(`Cloudinary error: ${xhr.responseText}`);
                    reject(new Error(`Upload failed for ${fileData.name}`));
                }
            };
            xhr.onerror = () => {
                reject(new Error(`Network error during upload for ${fileData.name}`));
            };
            xhr.send(fd);
        });
    };

    const handleFileInputChange = async (e) => {
        const files = Array.from(e.target.files || []);
        if (attachedFiles.length + files.length > 5) {
            toast.error("Maximum 5 files per message", { position: "top-center" });
            return;
        }

        const newFiles = [];
        for (const f of files) {
            const ok = validateFile(f);
            if (!ok.valid) {
                toast.error(ok.error, { position: "top-center" });
                continue;
            }
            const preview = await createFilePreview(f);
            newFiles.push({
                id: Date.now() + Math.random(), // Unique ID for key and removal
                file: f,
                preview,
                category: getFileCategory(f.type),
                type: f.type,
                name: f.name,
                size: f.size,
                progress: 0, // For upload progress tracking
            });
        }
        setAttachedFiles((prev) => [...prev, ...newFiles]);
        e.target.value = ""; // Clear input for re-selection of same file
    };

    const removeAttachedFile = (id) => {
        setAttachedFiles((prev) => {
            const fileToRemove = prev.find(f => f.id === id);
            if (fileToRemove?.preview && fileToRemove.category === "video") {
                URL.revokeObjectURL(fileToRemove.preview);
            }
            return prev.filter((f) => f.id !== id);
        });
    };

    // Click outside to close emoji picker
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                emojiPickerRef.current &&
                !emojiPickerRef.current.contains(event.target) &&
                emojiButtonRef.current &&
                !emojiButtonRef.current.contains(event.target)
            ) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showEmojiPicker]);

    const handleEmojiClick = (emojiObject) => {
        onMessageChange(messageText + emojiObject.emoji);
        setShowEmojiPicker(false);
    };

    const handleFileInputChange = async (e) => {
        const files = Array.from(e.target.files || []);
        if (attachedFiles.length + files.length > 5) {
            toast.error("Maximum 5 files per message", { position: "top-center" });
            return;
        }

        const newFiles = [];
        for (const f of files) {
            const ok = validateFile(f);
            if (!ok.valid) {
                toast.error(ok.error, { position: "top-center" });
                continue;
            }
            const preview = await createFilePreview(f);
            newFiles.push({
                id: Date.now() + Math.random(), // Unique ID for key and removal
                file: f,
                preview,
                category: getFileCategory(f.type),
                type: f.type,
                name: f.name,
                size: f.size,
                progress: 0, // For upload progress tracking
            });
        }
        setAttachedFiles((prev) => [...prev, ...newFiles]);
        e.target.value = ""; // Clear input for re-selection of same file
    };

    const removeAttachedFile = (id) => {
        setAttachedFiles((prev) => {
            const fileToRemove = prev.find(f => f.id === id);
            if (fileToRemove?.preview && fileToRemove.category === "video") {
                URL.revokeObjectURL(fileToRemove.preview);
            }
            return prev.filter((f) => f.id !== id);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!messageText.trim() && attachedFiles.length === 0) return;

        let uploadedMedia = [];
        if (attachedFiles.length > 0) {
            setIsUploadingAttachments(true);
            try {
                const uploadPromises = attachedFiles.map((fileData) => 
                    uploadFileToCloudinary(fileData, (id, percent) => {
                        setAttachedFiles(prev => prev.map(f => f.id === id ? { ...f, progress: percent } : f));
                    })
                );
                uploadedMedia = await Promise.all(uploadPromises);
                toast.success("Files uploaded successfully!");
            } catch (error) {
                console.error("Error uploading files:", error);
                toast.error("Failed to upload some files.");
                setIsUploadingAttachments(false);
                return; // Stop message sending if upload fails
            } 
        }

        if (recordedBlob) {
            setIsUploadingAttachments(true); // Re-use this state for recording upload
            try {
                const audioUploadResult = await uploadFileToCloudinary(recordedBlob, (id, percent) => {
                    // Update progress for recorded blob if needed, though typically it's one file
                    // setRecordedBlob(prev => prev ? {...prev, progress: percent} : null);
                });
                uploadedMedia.push(audioUploadResult);
                toast.success("Voice message uploaded successfully!");
            } catch (error) {
                console.error("Error uploading voice message:", error);
                toast.error("Failed to upload voice message.");
                setIsUploadingAttachments(false);
                return;
            } finally {
                setIsUploadingAttachments(false);
            }
        }
        
        onSendMessage(messageText, uploadedMedia);
        onMessageChange(""); // Clear message input
        setAttachedFiles([]); // Clear attached files
        setRecordedBlob(null); // Clear recorded audio
        setShowEmojiPicker(false);
    };

    return (
        <div className={`message-input-container ${isLight ? 'light' : 'dark'}`}>
            {(attachedFiles.length > 0 || recordedBlob) && (
                <div className="attached-files-preview mb-3 px-4">
                    <div className="d-flex flex-wrap gap-2">
                        {attachedFiles.map((fileData) => (
                            <div key={fileData.id} className="position-relative attached-file-item">
                                {fileData.category === "image" && (
                                    <img src={fileData.preview} alt={fileData.name} className="img-thumbnail" />
                                )}
                                {fileData.category === "video" && (
                                    <video src={fileData.preview} controls muted className="img-thumbnail" />
                                )}
                                {fileData.category === "document" && (
                                    <div className="file-document-preview">
                                        <FaFile size={24} />
                                        <span>{fileData.name}</span>
                                    </div>
                                )}
                                {fileData.progress > 0 && fileData.progress < 100 && (
                                    <div className="upload-progress-overlay">
                                        <div className="progress-bar" style={{ width: `${fileData.progress}%` }}></div>
                                        <span className="progress-text">{Math.round(fileData.progress)}%</span>
                                    </div>
                                )}
                                <button
                                    type="button"
                                    className="btn btn-sm btn-danger rounded-circle position-absolute top-0 end-0 m-1"
                                    onClick={() => removeAttachedFile(fileData.id)}
                                    disabled={isUploadingAttachments || isRecording}
                                >
                                    <FaTimes size={12} />
                                </button>
                            </div>
                        ))}
                        {recordedBlob && (
                            <div key={recordedBlob.id} className="position-relative attached-file-item audio-preview">
                                <audio src={recordedBlob.preview} controls ref={audioPreviewRef} />
                                {isUploadingAttachments && recordedBlob.progress > 0 && recordedBlob.progress < 100 && (
                                     <div className="upload-progress-overlay">
                                        <div className="progress-bar" style={{ width: `${recordedBlob.progress}%` }}></div>
                                        <span className="progress-text">{Math.round(recordedBlob.progress)}%</span>
                                    </div>
                                )}
                                <button
                                    type="button"
                                    className="btn btn-sm btn-danger rounded-circle position-absolute top-0 end-0 m-1"
                                    onClick={removeRecordedAudio}
                                    disabled={isUploadingAttachments || isRecording}
                                >
                                    <FaTimes size={12} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <form onSubmit={handleSubmit} className="message-input-form">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                    multiple
                    className="d-none" // Hidden input
                    disabled={isUploadingAttachments || isRecording}
                />
                <div className={`message-input-wrapper ${isLight ? 'light' : 'dark'}`}>
                    <input
                        type="text"
                        value={messageText}
                        onChange={(e) => onMessageChange(e.target.value)}
                        placeholder="Type a message..."
                        className={`message-input-field ${isLight ? 'light' : 'dark'}`}
                        autoComplete="off"
                        disabled={isUploadingAttachments || isRecording}
                    />
                    <div className={`message-input-actions ${isLight ? 'light' : 'dark'}`}>
                        {isRecording ? (
                            <div className="recording-status d-flex align-items-center justify-content-center gap-2">
                                <FaMicrophone size={18} className="text-danger pulsate" />
                                <span className="recording-timer">{formatRecordingTime(recordingTime)}</span>
                                <button type="button" className="btn btn-sm p-1 text-danger" onClick={stopRecording}>
                                    <FaTimes size={18} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <button
                                type="button"
                                className="btn btn-sm p-1"
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                ref={emojiButtonRef}
                                title="Emoji"
                                disabled={isUploadingAttachments || isRecording}
                                >
                                <FaSmile size={18} />
                                </button>
                                {showEmojiPicker && (
                                    <div ref={emojiPickerRef} className="position-absolute bottom-100 start-0 mb-2" style={{ zIndex: 1000 }}>
                                        <Picker onEmojiClick={handleEmojiClick} theme={isLight ? "light" : "dark"} />
                                    </div>
                                )}
                                <button type="button" className="btn btn-sm p-1" title="Attach" onClick={() => fileInputRef.current?.click()} disabled={isUploadingAttachments || isRecording}>
                                    <FaPaperclip size={18} />
                                </button>
                                <button type="button" className="btn btn-sm p-1" title="Record Voice" onClick={handleRecordClick} disabled={isUploadingAttachments || isRecording}>
                                    <FaMicrophone size={18} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
                <button
                    type="submit"
                    className="btn btn-primary rounded-circle p-3 shadow-sm message-send-btn"
                    disabled={(!messageText.trim() && attachedFiles.length === 0 && !recordedBlob) || isUploadingAttachments || isRecording}
                >
                    <FaPaperPlane size={16} />
                </button>
            </form>
        </div>
    );
};

export default MessageInput;
