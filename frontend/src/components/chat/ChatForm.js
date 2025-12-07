import { useState, useEffect, useRef } from "react";
import { uploadMedia, sendMediaMessage } from "../../services/ChatService";
import { PaperAirplaneIcon, PaperClipIcon } from "@heroicons/react/solid";
import { EmojiHappyIcon } from "@heroicons/react/outline";
import Picker from "emoji-picker-react";

// Helper function to format file size
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function ChatForm(props) {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingMedia, setPendingMedia] = useState(null);
  const scrollRef = useRef();

  useEffect(() => {
    scrollRef.current?.scrollIntoView();
  }, [showEmojiPicker]);

  const handleEmojiClick = (event, emojiObject) => {
    setMessage(prev => prev + emojiObject.emoji);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  };

  const handleInput = (e) => {
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`; // Max height 200px
  };

  const submitMessage = async () => {
    const trimmed = message.trim();
    const hasText = trimmed.length > 0;

    if (!hasText && !pendingMedia?.mediaUrl) return;

    try {
      if (pendingMedia?.mediaUrl) {
        console.log('[ChatForm] 📤 Sending media message with metadata:', {
          fileName: pendingMedia.fileName,
          fileSize: pendingMedia.fileSize,
          mimeType: pendingMedia.mimeType,
          type: pendingMedia.type
        });

        // 🟢 ENHANCED: Send media with all metadata
        const sentMessage = await sendMediaMessage({
          chatRoomId: props.currentChatId || props.chatRoomId,
          mediaUrl: pendingMedia.mediaUrl,
          caption: hasText ? trimmed : undefined,
          fileName: pendingMedia.fileName,        // 🟢 Original filename
          fileSize: pendingMedia.fileSize,        // 🟢 File size
          mimeType: pendingMedia.mimeType,        // 🟢 MIME type
          type: pendingMedia.type,                // 🟢 Media type
        });

        console.log('[ChatForm] ✅ Media sent, returned message:', sentMessage);

        // 🟢 OPTIONAL: If you want to add optimistic message to parent's state
        // You can call a callback prop here:
        // if (props.onMessageSent) {
        //   props.onMessageSent(sentMessage);
        // }

      } else if (hasText) {
        const sentMessage = await props.handleFormSubmit(trimmed);
        console.log('[ChatForm] ✅ Text sent:', sentMessage);
      }

      setMessage("");
      setPendingMedia(null);
    } catch (error) {
      console.error("[ChatForm] ❌ Error sending message:", error);
      // Optionally show error toast to user
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    await submitMessage();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setUploading(true);
      let previewUrl = URL.createObjectURL(file);
      let mediaType = 'document';
      let thumbnailUrl = null;
      
      // Determine media type
      if (file.type.startsWith('image/')) {
        mediaType = 'image';
      } else if (file.type.startsWith('video/')) {
        mediaType = 'video';
        // Create a video element to generate a thumbnail
        try {
          const video = document.createElement('video');
          video.preload = 'metadata';
          video.muted = true;
          video.playsInline = true;
          
          await new Promise((resolve, reject) => {
            video.onloadeddata = () => {
              // Seek to 1 second or 10% of duration, whichever is smaller
              const seekTime = Math.min(1, video.duration * 0.1);
              video.currentTime = seekTime;
            };
            
            video.onseeked = () => {
              try {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
                resolve();
              } catch (err) {
                console.error('Error generating video thumbnail:', err);
                resolve(); // Continue without thumbnail
              }
            };
            
            video.onerror = () => {
              console.error('Error loading video for thumbnail');
              resolve(); // Continue without thumbnail
            };
            
            video.src = previewUrl;
          });
          
          URL.revokeObjectURL(previewUrl); // Clean up video blob URL
        } catch (err) {
          console.error('Video thumbnail generation failed:', err);
        }
      } else if (file.type.startsWith('audio/')) {
        mediaType = 'audio';
      }

      setPendingMedia({ 
        file, 
        previewUrl: thumbnailUrl || previewUrl, 
        mediaUrl: null, 
        type: mediaType,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type
      });

      // Upload the file
      const res = await uploadMedia(file, "uploads");
      if (res?.media_url) {
        setPendingMedia(prev => ({ 
          ...prev, 
          mediaUrl: res.media_url
        }));
      } else {
        setPendingMedia(null);
        throw new Error('Upload failed: No media URL returned');
      }
    } catch (err) {
      console.error("File upload failed", err);
      setPendingMedia(null);
      // You might want to show an error toast here
    } finally {
      setUploading(false);
      e.target.value = ""; // Reset the file input
    }
  };

  return (
    <div ref={scrollRef}>
      {showEmojiPicker && (
        <div className="absolute bottom-16">
          <Picker 
            onEmojiClick={handleEmojiClick} 
            pickerStyle={{ 
              width: '100%',
              backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff'
            }} 
          />
        </div>
      )}
      <form onSubmit={handleFormSubmit}>
        <div className="w-full bg-white dark:bg-gray-900 dark:border-gray-700">
          {pendingMedia && (
            <div className="px-3 pt-2 pb-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-start space-x-3">
                <div
                  className={`relative rounded-lg overflow-hidden flex-shrink-0 ${
                    pendingMedia.type === 'image' || pendingMedia.type === 'video' 
                      ? 'h-20 w-20' 
                      : 'h-14 w-14'
                  } ${
                    uploading 
                      ? 'border-2 border-gray-300 dark:border-gray-600' 
                      : 'border-2 border-blue-200 dark:border-blue-800'
                  }`}
                >
                  {/* Image Preview */}
                  {pendingMedia.type === 'image' && (
                    <img
                      src={pendingMedia.previewUrl}
                      alt="Media preview"
                      className="h-full w-full object-cover"
                    />
                  )}
                  
                  {/* Video Preview */}
                  {pendingMedia.type === 'video' && (
                    <div className="relative h-full w-full bg-black">
                      {pendingMedia.previewUrl ? (
                        <img
                          src={pendingMedia.previewUrl}
                          alt="Video preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gray-800 flex items-center justify-center">
                          <div className="text-gray-400 text-xs">Video</div>
                        </div>
                      )}
                      {/* Play icon overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Document icon */}
                  {pendingMedia.type === 'document' && (
                    <div className="h-full w-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                        <path d="M14 2v6h6" fill="none" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Audio icon */}
                  {pendingMedia.type === 'audio' && (
                    <div className="h-full w-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Upload spinner overlay */}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
                
                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {pendingMedia.fileName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {formatFileSize(pendingMedia.fileSize)}
                    {pendingMedia.type !== 'image' && ` • ${pendingMedia.type}`}
                  </p>
                  {uploading && (
                    <div className="mt-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5 dark:bg-gray-700 overflow-hidden">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full animate-pulse" 
                            style={{ width: '70%' }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Uploading...
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Remove button */}
                {!uploading && (
                  <button
                    type="button"
                    onClick={() => setPendingMedia(null)}
                    className="flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}
          
          <div className="relative flex items-center px-2 py-2">
            <div className="flex items-center space-x-1 pr-2">
              <label className="cursor-pointer p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={handleFileChange} 
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" 
                  disabled={uploading} 
                />
                <PaperClipIcon
                  className={`h-5 w-5 ${uploading ? 'text-gray-400' : 'text-blue-600 dark:text-blue-500'}`}
                  aria-hidden="true"
                />
              </label>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowEmojiPicker(!showEmojiPicker);
                }}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none transition-colors"
              >
                <EmojiHappyIcon
                  className="h-5 w-5 text-blue-600 dark:text-blue-500"
                  aria-hidden="true"
                />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <textarea
                rows={1}
                placeholder="Write a message"
                className="block w-full py-2.5 pl-4 pr-12 resize-none outline-none bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 transition-colors"
                name="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    await submitMessage();
                  }
                }}
              />
            </div>

            <div className="pl-2">
              <button 
                type="submit"
                disabled={uploading || (!message.trim() && !pendingMedia?.mediaUrl)}
                className={`p-2 rounded-full transition-all ${
                  (uploading || (!message.trim() && !pendingMedia?.mediaUrl)) 
                    ? 'text-gray-400 cursor-not-allowed bg-gray-100 dark:bg-gray-800' 
                    : 'text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-sm hover:shadow-md'
                }`}
              >
                <PaperAirplaneIcon
                  className="h-5 w-5 transform rotate-90"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}