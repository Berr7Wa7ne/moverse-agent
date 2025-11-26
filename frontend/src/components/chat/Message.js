import { format } from "timeago.js";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Message({ message, self }) {
  // Detect a URL in the message text and treat image URLs specially so that
  // uploads like Supabase public URLs render as real images instead of raw text.
  const text = message.message || "";

  const urlMatch = text.match(/https?:\/\/\S+/);
  const url = urlMatch ? urlMatch[0] : null;
  const isImageUrl = url
    ? /\.(png|jpg|jpeg|gif|webp)$/i.test(new URL(url).pathname)
    : false;

  const caption = url ? text.replace(url, "").trim() : text;

  return (
    <>
      <li
        className={classNames(
          self !== message.sender ? "justify-start" : "justify-end",
          "flex"
        )}
      >
        <div>
          <div
            className={classNames(
              self !== message.sender
                ? "text-gray-700 dark:text-gray-300 bg-blue-50 border border-blue-100 shadow-md dark:bg-gray-900 dark:border-gray-700"
                : "bg-blue-600 dark:bg-blue-500 text-white",
              "relative max-w-xl px-4 py-2 rounded-lg shadow"
            )}
          >
            {isImageUrl ? (
              <div className="space-y-1">
                {caption && (
                  <span className="block font-normal break-words">{caption}</span>
                )}
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <img
                    src={url}
                    alt={caption || "Image"}
                    className="mt-1 max-h-64 rounded-lg object-cover border border-gray-200 dark:border-gray-700 bg-white"
                  />
                </a>
              </div>
            ) : (
              <span className="block font-normal break-words">{text}</span>
            )}
          </div>
          <span className="block text-sm text-gray-500 dark:text-gray-400">
            {format(message.createdAt)}
          </span>
        </div>
      </li>
    </>
  );
}
