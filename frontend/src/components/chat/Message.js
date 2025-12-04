// Message.js (updated)
import { format } from "timeago.js";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
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

    // VIDEO
    if (messageType === "video") {
      if (!mediaUrl) return <span className="text-sm text-gray-500">[Video unavailable]</span>;

      return (
        <div className="space-y-2">
          <video
            src={mediaUrl}
            controls
            className="max-h-64 w-full rounded-lg border border-gray-200 dark:border-gray-700"
            onError={(e) => {
              console.error("[Message] Video load error:", mediaUrl);
              e.target.style.display = "none";
              const errorDiv = document.createElement("div");
              errorDiv.className = "text-red-500 text-sm p-2";
              errorDiv.textContent = "❌ Failed to load video";
              e.target.parentNode.appendChild(errorDiv);
            }}
          />
          {caption && <span className="block font-normal break-words">{caption}</span>}
          {!caption && text && <span className="block font-normal break-words">{text}</span>}
        </div>
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

    // DOCUMENT
    if (messageType === "document") {
      const urlToUse = mediaUrl || (text.match(/https?:\/\/\S+/) || [null])[0];
      const fileName = urlToUse ? urlToUse.split('/').pop() : "document";
      if (!urlToUse) return <span className="text-sm text-gray-500">[Document unavailable]</span>;

      return (
        <div className="space-y-2">
          <a href={urlToUse} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 hover:underline">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 4a2 2 0 012-2h4.586L16 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
            </svg>
            <span className="text-sm font-medium">{fileName}</span>
          </a>
          {caption && <span className="block font-normal break-words">{caption}</span>}
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
