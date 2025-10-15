import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { History } from "lucide-react";
import { QuickActionItem } from "../CreateChatbot/ChatbotForm";

interface BoldCompactProps {
  greetingMessage: {
    shortMessage: string;
    longMessage: string;
  };
  persona: {
    name: string;
    picture: string;
  };
  quickActions: QuickActionItem[];
  brandColor?: string;
  showWatermark?: boolean;
  quickReplyConfig?: { quickReplies: Array<{ buttonText: string }> } | null;
  scheduleCallConfig?: { buttonText: string; bookingLink?: string } | null;
  downloadFileConfig?: {
    buttonText: string;
    fileName?: string;
    fileLink?: string;
  } | null;
  requestCallbackConfig?: {
    buttonText: string;
    title?: string;
  } | null;
  linkToURLConfig?: {
    buttonText: string;
    url?: string;
    title?: string;
  } | null;

  onDismiss?: () => void;
  setIsOpen?: (isOpen: boolean) => void;
  handleQuickAction?: (action: string) => void;
  setShowPopupGreet?: (show: boolean) => void;
}

const BoldCompact: React.FC<BoldCompactProps> = ({
  showWatermark = true,
  greetingMessage,
  persona,
  quickActions,
  brandColor = "#289EFD",
  quickReplyConfig,
  scheduleCallConfig,
  downloadFileConfig,
  requestCallbackConfig,
  linkToURLConfig,
  onDismiss,
  setIsOpen,
  handleQuickAction,
  setShowPopupGreet,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsSmallMobile(window.innerWidth < 420);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const quickActionButtonClass = `w-full text-center py-3 px-4 rounded-3xl shadow-md hover:brightness-90 transition-all duration-150 text-white hover:cursor-pointer focus:outline-none ${
    isMobile ? "text-xs" : ""
  }`;

  const [nullQuickAction, setNullQuickAction] = useState(false);

  useEffect(() => {
    if (!quickActions?.some((action) => action.enabled)) {
      setNullQuickAction(true);
    } else {
      setNullQuickAction(false);
    }
  }, [quickActions]);

  if (!isMounted) {
    return null;
  }

  return (
    <motion.div
      className={`flex flex-col shadow-xl ${
        isSmallMobile ? "w-[285px]" : isMobile ? "w-[300px]" : "w-[450px]"
      } bg-white rounded-[25px] overflow-hidden`}
    >
      <div
        className={`flex flex-col ${isMobile ? "p-4" : "p-8"} border-b bg-gradient-to-r`}
        style={{ backgroundColor: brandColor }}
      >
        <div
          className={`flex items-center ${isMobile ? "gap-2" : "gap-3"} ${
            isMobile ? "mb-2" : "mb-3"
          }`}
        >
          <div className="relative">
            <img
              src={persona.picture}
              alt={persona.name}
              className="w-12 h-12 rounded-full min-w-12 min-h-12"
            />
            <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
          </div>

          {persona.name && (
            <p className={`${isMobile ? "text-sm" : "text-lg"} font-bold text-white`}>
              {persona.name}
            </p>
          )}
          <History className="h-5 w-5 text-white ml-auto cursor-pointer" />
        </div>

        <div className="flex flex-col gap-2">
          <p className={`font-semibold text-white ${isMobile ? "text-md" : "text-2xl"}`}>
            {greetingMessage.shortMessage}
          </p>
          <div
            className={`markdown-content whitespace-normal text-white ${
              isMobile ? "text-xs" : "text-sm"
            }`}
          >
            <ReactMarkdown>{greetingMessage.longMessage}</ReactMarkdown>
          </div>
        </div>
      </div>

      {!nullQuickAction && (
        <div
          className={`flex flex-col p-6 space-y-4 overflow-y-auto ${
            isMobile ? "max-h-[200px]" : "max-h-[350px]"
          }`}
        >
          {quickActions.map((action) => {
            if (!action.enabled) {
              return null;
            }

            switch (action.type) {
              case "download_file":
                return (
                  action.downloadFileConfig &&
                  action.downloadFileConfig.buttonText && (
                    <button
                      key={action.type}
                      className={quickActionButtonClass}
                      style={{ backgroundColor: brandColor }}
                      onClick={() =>
                        handleQuickAction &&
                        handleQuickAction(action?.downloadFileConfig?.buttonText || "")
                      }
                    >
                      {action.downloadFileConfig.buttonText}
                    </button>
                  )
                );
              case "request_callback":
                return (
                  action.requestCallbackConfig && (
                    <button
                      key={action.type}
                      className={quickActionButtonClass}
                      style={{ backgroundColor: brandColor }}
                      onClick={() =>
                        handleQuickAction &&
                        handleQuickAction(action?.requestCallbackConfig?.buttonText || "")
                      }
                    >
                      {action.requestCallbackConfig.buttonText}
                    </button>
                  )
                );
              case "link_to_url":
                return (
                  action.linkToURLConfig && (
                    <button
                      key={action.type}
                      className={quickActionButtonClass}
                      style={{ backgroundColor: brandColor }}
                      onClick={() =>
                        handleQuickAction &&
                        handleQuickAction(action?.linkToURLConfig?.buttonText || "")
                      }
                    >
                      {action.linkToURLConfig.buttonText}
                    </button>
                  )
                );
              case "schedule_call":
                return (
                  action.scheduleCallConfig && (
                    <button
                      key={action.type}
                      className={quickActionButtonClass}
                      style={{ backgroundColor: brandColor }}
                      onClick={() =>
                        handleQuickAction &&
                        handleQuickAction(action?.scheduleCallConfig?.buttonText || "")
                      }
                    >
                      {action.scheduleCallConfig.buttonText}
                    </button>
                  )
                );
              case "quick_reply":
                return action.quickReplyConfig?.quickReplies?.map((reply, replyIndex) => (
                  <>
                    {reply.buttonText && (
                      <button
                        key={`${action.type}-${replyIndex}`}
                        className={quickActionButtonClass}
                        style={{ backgroundColor: brandColor }}
                        onClick={() =>
                          handleQuickAction &&
                          handleQuickAction(
                            action?.quickReplyConfig?.quickReplies?.[replyIndex]?.buttonText || ""
                          )
                        }
                      >
                        {reply.buttonText}
                      </button>
                    )}
                  </>
                ));
              default:
                return null;
            }
          })}
        </div>
      )}

      <div
        className={`flex flex-col ${
          isMobile ? "py-4" : "py-6 "
        } px-6 border-t border-gray-200 shadow-[-2px_-2px_15px_-3px_rgba(0,0,0,0.1)]`}
      >
        <div className={`flex justify-between ${isMobile ? "mt-0" : "mt-0"}`}>
          <button
            onClick={onDismiss}
            className="no-min-size text-xs text-gray-500 hover:text-gray-700"
          >
            Dismiss
          </button>
          {showWatermark && (
            <div
              className="flex flex-row items-center gap-1.5 hover:cursor-pointer"
              onClick={() => window.open("https://trycentral.com/chat", "_blank")}
            >
              {!isMobile && (
                <p className={`text-xs text-gray-500`} style={{ color: brandColor }}>
                  Powered by
                </p>
              )}

              <div className="text-xs font-semibold text-gray-500 flex flex-row items-center gap-0.5">
                <svg
                  role="img"
                  aria-label="Central Logo"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 256 256"
                  className="w-3 h-3"
                  fill={brandColor}
                >
                  <path d="M127.943 182.047a73.469 73.469 0 0 1 36.32 9.21l.942.521a148.611 148.611 0 0 1 33.036 24.893l13.408 13.408c-14.798 12.14-32.284 21.122-51.429 25.921l-19.457-32.445c-2.789-5.035-7.744-7.733-12.82-7.981h-.435c-5.075.248-10.03 2.946-12.82 7.981l-19.376 32.307c-19.08-4.871-36.496-13.9-51.226-26.067l13.125-13.124a148.609 148.609 0 0 1 33.037-24.893l.941-.521a73.465 73.465 0 0 1 36.319-9.21h.435ZM229.795 44.086c12.167 14.73 21.196 32.147 26.067 51.227l-32.307 19.375c-5.035 2.79-7.732 7.745-7.979 12.82v.435c.247 5.076 2.944 10.031 7.979 12.82L256 160.22c-4.799 19.145-13.781 36.631-25.921 51.429l-13.408-13.408a148.611 148.611 0 0 1-24.893-33.036l-.521-.942a73.469 73.469 0 0 1-9.21-36.32v-.435a73.465 73.465 0 0 1 9.21-36.319l.521-.942a148.6 148.6 0 0 1 24.893-33.036l13.124-13.125ZM38.78 57.21a148.573 148.573 0 0 1 24.893 33.037l.523.94a73.463 73.463 0 0 1 9.21 36.321v.435a73.46 73.46 0 0 1-9.21 36.319l-.523.943a148.607 148.607 0 0 1-24.893 33.036L25.719 211.3C13.655 196.492 4.741 179.015 0 159.891l31.898-19.128c5.035-2.79 7.732-7.744 7.98-12.82v-.435c-.248-5.075-2.945-10.03-7.98-12.82L.138 95.642C4.95 76.583 13.91 59.174 26.002 44.433L38.78 57.211ZM159.891 0c19.124 4.741 36.601 13.655 51.409 25.719L198.241 38.78a148.584 148.584 0 0 1-33.036 24.893l-.942.523a73.462 73.462 0 0 1-36.32 9.21h-.435a73.464 73.464 0 0 1-36.319-9.21l-.94-.523A148.578 148.578 0 0 1 57.21 38.78L44.433 26.002C59.174 13.91 76.583 4.951 95.643.138l19.045 31.76c2.79 5.035 7.745 7.731 12.82 7.98h.435c5.076-.248 10.03-2.945 12.82-7.98L159.891 0Z" />
                </svg>
                <span style={{ color: brandColor }}>Central</span>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setShowPopupGreet && setShowPopupGreet(false);
              setIsOpen && setIsOpen(true);
            }}
            className="no-min-size text-xs font-medium"
            style={{ color: brandColor }}
          >
            Start Chat
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default BoldCompact;
