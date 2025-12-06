// Message.js (updated with document and video improvements)
import { format } from "timeago.js";
import React from "react";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

// Helper function to format file size
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Video Player Component with Download/Play States
function VideoPlayer({ mediaUrl, thumbnailUrl, mimeType, fileSize, caption, text }) {
  const [isDownloading, setIsDownloading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const videoRef = React.useRef(null);

  const handleDownload = () => {
    setIsDownloading(false);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsDownloading(false);
  };

  const handleLoadedData = () => {
    setIsDownloading(false);
  };

  if (hasError) {
    return (
      <div className="space-y-2">
        <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-black">
          <div className="aspect-video w-full relative flex items-center justify-center bg-red-50 dark:bg-red-900/20 p-4">
            <div className="text-center">
              <div className="text-red-500 text-2xl mb-2">❌</div>
              <p className="text-red-700 dark:text-red-300 text-sm mb-2">Failed to load video</p>
              <a 
                href={mediaUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Download video instead
              </a>
            </div>
          </div>
        </div>
        {caption && <span className="block font-normal break-words">{caption}</span>}
        {!caption && text && <span className="block font-normal break-words">{text}</span>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-black">
        <div className="aspect-video w-full relative group">
          {/* Thumbnail */}
          {thumbnailUrl && (
            <img
              src={thumbnailUrl}
              alt="Video thumbnail"
              className={`absolute inset-0 w-full h-full object-cover transition-opacity ${
                isPlaying ? 'opacity-0' : 'opacity-100'
              }`}
            />
          )}

          {/* Video Player */}
          <video
            ref={videoRef}
            className="w-full h-full object-contain relative"
            controls={!isDownloading}
            preload="metadata"
            poster={thumbnailUrl || undefined}
            onLoadedData={handleLoadedData}
            onPlay={handlePlay}
            onPause={handlePause}
            onError={handleError}
          >
            <source src={mediaUrl} type={mimeType} />
            Your browser does not support the video tag.
          </video>

          {/* Download Button Overlay */}
          {isDownloading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <button
                onClick={handleDownload}
                className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                  <svg 
                    className="w-8 h-8 text-gray-800" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
                    />
                  </svg>
                </div>
                <span className="text-white text-sm font-medium">
                  {fileSize ? formatFileSize(fileSize) : 'Download'}
                </span>
              </button>
            </div>
          )}

          {/* Play Button Overlay (when paused after download) */}
          {!isDownloading && !isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <svg 
                  className="w-8 h-8 text-white ml-1" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>
            </div>
          )}

          {/* File size indicator */}
          {fileSize && !isDownloading && (
            <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
              {formatFileSize(fileSize)}
            </div>
          )}
        </div>
      </div>
      
      {/* Caption or text */}
      {caption && <span className="block font-normal break-words">{caption}</span>}
      {!caption && text && <span className="block font-normal break-words">{text}</span>}
    </div>
  );
}

// Helper function to get file icon based on extension
function getFileIcon(fileName) {
  if (!fileName) {
    return (
      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
      </svg>
    );
  }
  
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  // PDF - Red
  if (ext === 'pdf') {
    return (
      <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
        <path d="M14 2v6h6" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M10 12h4M10 16h4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  
  // Word - Blue
  if (['doc', 'docx'].includes(ext)) {
    return (
      <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
        <path d="M14 2v6h6" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M8 13l2 4 2-4 2 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    );
  }
  
  // Excel - Green
  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return (
      <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
        <path d="M14 2v6h6" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M9 12h6M9 15h6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  
  // PowerPoint - Orange
  if (['ppt', 'pptx'].includes(ext)) {
    return (
      <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
        <path d="M14 2v6h6" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect x="9" y="12" width="6" height="5" rx="1" stroke="white" strokeWidth="1.5" fill="none" />
      </svg>
    );
  }
  
  // Archive - Purple
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return (
      <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
        <path d="M14 2v6h6" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect x="10" y="10" width="1.5" height="1.5" fill="white" />
        <rect x="10" y="12" width="1.5" height="1.5" fill="white" />
        <rect x="10" y="14" width="1.5" height="1.5" fill="white" />
        <rect x="12" y="11" width="1.5" height="1.5" fill="white" />
        <rect x="12" y="13" width="1.5" height="1.5" fill="white" />
      </svg>
    );
  }
  
  // Text - Gray
  if (['txt', 'rtf'].includes(ext)) {
    return (
      <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
        <path d="M14 2v6h6" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M9 12h6M9 14h6M9 16h4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  
  // Image - Teal
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
    return (
      <svg className="w-8 h-8 text-teal-600" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
        <path d="M14 2v6h6" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="10" cy="11" r="1.5" fill="white" />
        <path d="M8 17l2.5-2.5L12 16l2-2.5L16 16v1H8v-0z" fill="white" opacity="0.8" />
      </svg>
    );
  }
  
  // Default - Gray
  return (
    <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
      <path d="M14 2v6h6" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

// Helper function to clean up and display filename properly
function getDisplayFileName(message, mediaUrl) {
  // Priority: file_name from backend > original filename from message > URL parsing
  let fileName = message.file_name || message.filename || message.original_filename;
  
  if (!fileName && mediaUrl) {
    // Extract from URL
    fileName = mediaUrl.split('/').pop();
  }
  
  if (!fileName) return 'Document';
  
  // Remove URL encoding
  fileName = decodeURIComponent(fileName);
  
  // If filename has timestamp prefix (e.g., "1764881149965-filename.docx"), clean it
  const timestampMatch = fileName.match(/^\d{13,}-(.+)$/);
  if (timestampMatch) {
    fileName = timestampMatch[1];
  }
  
  // Handle ugly MIME type extensions (e.g., ".vnd.openxmlformats-officedocument.wordprocessingml.document")
  const uglyExtensions = {
    'vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'vnd.ms-excel': 'xls',
    'vnd.ms-powerpoint': 'ppt',
    'msword': 'doc',
  };
  
  // Replace ugly extensions
  for (const [ugly, clean] of Object.entries(uglyExtensions)) {
    if (fileName.includes(ugly)) {
      fileName = fileName.replace(new RegExp(`\\.${ugly.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`), `.${clean}`);
    }
  }
  
  return fileName;
}

export default function Message({ message, self }) {
  // Normalize fields: backend may send text in message (legacy) or text property
  const messageType = message.message_type || message.messageType || "text";
  const text = message.text ?? message.message ?? "";
  const mediaUrl = message.media_url ?? message.mediaUrl ?? null;
  const caption = message.caption ?? null;

  const renderMessageContent = () => {
    // IMAGE
    if (messageType === "image") {
      if (!mediaUrl) {
        // legacy: maybe url in text
        const urlMatch = (text || "").match(/https?:\/\/\S+/);
        if (urlMatch) {
          return renderLegacyImage(urlMatch[0], text.replace(urlMatch[0], "").trim());
        }
        return <span className="text-sm text-gray-500">[Image unavailable]</span>;
      }

      return (
        <div className="space-y-2">
          <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="block">
            <img
              src={mediaUrl}
              alt={caption || "Image"}
              className="max-h-64 w-full rounded-lg object-cover border border-gray-200 dark:border-gray-700 bg-white"
              onError={(e) => {
                console.error("[Message] Image load error:", mediaUrl);
                e.target.style.display = "none";
                const errorDiv = document.createElement("div");
                errorDiv.className = "text-red-500 text-sm p-2";
                errorDiv.textContent = "❌ Failed to load image";
                e.target.parentNode.appendChild(errorDiv);
              }}
            />
          </a>
          {caption && <span className="block font-normal break-words">{caption}</span>}
          {!caption && text && <span className="block font-normal break-words">{text}</span>}
        </div>
      );
    }

    // VIDEO - ENHANCED WITH DOWNLOAD STATE
    if (messageType === "video") {
      if (!mediaUrl) {
        return (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">❌ Video unavailable</p>
          </div>
        );
      }

      const thumbnailUrl = message.thumbnail_url;
      const mimeType = message.mime_type || 'video/mp4';

      return (
        <VideoPlayer 
          mediaUrl={mediaUrl}
          thumbnailUrl={thumbnailUrl}
          mimeType={mimeType}
          fileSize={message.file_size}
          caption={caption}
          text={text}
        />
      );
    }

    // AUDIO
    if (messageType === "audio") {
      if (!mediaUrl) return <span className="text-sm text-gray-500">[Audio unavailable]</span>;
      return (
        <div className="space-y-2">
          <audio
            src={mediaUrl}
            controls
            className="w-full max-w-xs"
            onError={(e) => {
              console.error("[Message] Audio load error:", mediaUrl);
              e.target.style.display = "none";
              const errorDiv = document.createElement("div");
              errorDiv.className = "text-red-500 text-sm p-2";
              errorDiv.textContent = "❌ Failed to load audio";
              e.target.parentNode.appendChild(errorDiv);
            }}
          />
          {caption && <span className="block font-normal break-words">{caption}</span>}
        </div>
      );
    }

    // DOCUMENT - ENHANCED
    if (messageType === "document") {
      const urlToUse = mediaUrl || (text.match(/https?:\/\/\S+/) || [null])[0];
      if (!urlToUse) return <span className="text-sm text-gray-500">[Document unavailable]</span>;

      const fileName = getDisplayFileName(message, urlToUse);
      const fileSize = message.file_size;

      return (
        <div className="space-y-2">
          <a 
            href={urlToUse} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center p-3 space-x-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
          >
            <div className="flex-shrink-0">{getFileIcon(fileName)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {fileName}
              </p>
              {fileSize && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {formatFileSize(fileSize)}
                </p>
              )}
            </div>
            <svg 
              className="h-5 w-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex-shrink-0 transition-colors" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>
          {caption && <span className="block font-normal break-words text-sm mt-1">{caption}</span>}
        </div>
      );
    }

    // LOCATION
    if (messageType === "location") {
      const url = mediaUrl || text;
      return (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">📍</span>
            <span className="font-medium">Location shared</span>
          </div>
          {caption && <span className="block font-normal break-words text-sm">{caption}</span>}
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs underline opacity-75 hover:opacity-100">
              View on map
            </a>
          )}
        </div>
      );
    }

    // CONTACT / STICKER / FALLBACK (keep simple)
    if (messageType === "contact") {
      return (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">👤</span>
            <span className="font-medium">Contact card</span>
          </div>
          {caption && <span className="block font-normal break-words text-sm">{caption}</span>}
        </div>
      );
    }
    if (messageType === "sticker") {
      const urlToUse = mediaUrl || (text.match(/https?:\/\/\S+/) || [null])[0];
      if (urlToUse)
        return (
          <div className="space-y-2">
            <img src={urlToUse} alt="Sticker" className="max-h-32 w-auto" onError={(e) => {
              e.target.style.display = 'none';
              const errorDiv = document.createElement("div");
              errorDiv.className = "text-sm";
              errorDiv.textContent = "🟩 Sticker";
              e.target.parentNode.appendChild(errorDiv);
            }} />
            {caption && <span className="block font-normal break-words text-sm">{caption}</span>}
          </div>
        );
      return <span className="text-sm text-gray-500">[Sticker]</span>;
    }

    // LEGACY: text containing a URL to an image
    const legacyUrlMatch = (text || "").match(/https?:\/\/\S+/);
    const legacyUrl = legacyUrlMatch ? legacyUrlMatch[0] : null;
    const isLegacyImage = legacyUrl ? /\.(png|jpg|jpeg|gif|webp|jfif|bmp|tiff|svg)$/i.test(legacyUrl) : false;
    if (isLegacyImage) {
      const textCaption = text.replace(legacyUrl, "").trim();
      return (
        <div className="space-y-2">
          <a href={legacyUrl} target="_blank" rel="noopener noreferrer" className="block">
            <img src={legacyUrl} alt={textCaption || "Image"} className="max-h-64 w-full rounded-lg object-cover border border-gray-200 dark:border-gray-700 bg-white"
              onError={(e) => {
                e.target.style.display = 'none';
                const link = document.createElement('a');
                link.href = legacyUrl;
                link.target = '_blank';
                link.className = 'text-blue-300 underline text-sm';
                link.textContent = legacyUrl;
                e.target.parentNode.appendChild(link);
              }} />
          </a>
          {textCaption && <span className="block font-normal break-words">{textCaption}</span>}
        </div>
      );
    }

    // Default: plain text
    return <span className="block font-normal break-words whitespace-pre-line">{text}</span>;
  };

  // helper for legacy image render
  function renderLegacyImage(url, textCaption) {
    return (
      <div className="space-y-2">
        <a href={url} target="_blank" rel="noopener noreferrer" className="block">
          <img src={url} alt={textCaption || "Image"} className="max-h-64 w-full rounded-lg object-cover border border-gray-200 dark:border-gray-700 bg-white"
            onError={(e) => {
              e.target.style.display = 'none';
              const errorDiv = document.createElement("div");
              errorDiv.className = "text-red-500 text-sm p-2";
              errorDiv.textContent = "❌ Failed to load image";
              e.target.parentNode.appendChild(errorDiv);
            }} />
        </a>
        {textCaption && <span className="block font-normal break-words">{textCaption}</span>}
      </div>
    );
  }

  return (
    <li className={classNames(self !== message.sender ? "justify-start" : "justify-end", "flex")}>
      <div>
        <div className={classNames(
          self !== message.sender
            ? "text-gray-700 dark:text-gray-300 bg-blue-50 border border-blue-100 shadow-md dark:bg-gray-900 dark:border-gray-700"
            : "bg-blue-600 dark:bg-blue-500 text-white",
          "relative max-w-xl px-4 py-2 rounded-lg shadow"
        )}>
          {renderMessageContent()}
        </div>
        <span className="block text-sm text-gray-500 dark:text-gray-400">{format(message.createdAt)}</span>
      </div>
    </li>
  );
}