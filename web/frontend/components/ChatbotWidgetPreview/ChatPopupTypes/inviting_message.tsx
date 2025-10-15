import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { QuickActionItem } from "../CreateChatbot/ChatbotForm";
import { X } from "lucide-react";

interface InvitingMessageProps {
  greetingMessage: {
    shortMessage: string;
    longMessage: string;
  };
  quickActions: QuickActionItem[];
  persona: {
    name: string;
    picture: string;
  };
  handleQuickAction: (action: string) => void;
  onDismiss: () => void;
  setIsOpen: (isOpen: boolean) => void;
  brandColor: string;
  showWatermark: boolean;
}

const InvitingMessage: React.FC<InvitingMessageProps> = ({
  greetingMessage,
  quickActions,
  persona,
  onDismiss,
  setIsOpen,
  brandColor,
  handleQuickAction,
  showWatermark,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsSmallMobile(window.innerWidth < 420);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const enabledButtons: { text: string; key: string }[] = [];
  quickActions.forEach((action) => {
    if (!action.enabled) return;

    switch (action.type) {
      case "download_file":
        if (action.downloadFileConfig?.buttonText) {
          enabledButtons.push({ text: action.downloadFileConfig.buttonText, key: action.type });
        }
        break;
      case "request_callback":
        if (action.requestCallbackConfig?.buttonText) {
          enabledButtons.push({ text: action.requestCallbackConfig.buttonText, key: action.type });
        }
        break;
      case "link_to_url":
        if (action.linkToURLConfig?.buttonText) {
          enabledButtons.push({ text: action.linkToURLConfig.buttonText, key: action.type });
        }
        break;
      case "schedule_call":
        if (action.scheduleCallConfig?.buttonText) {
          enabledButtons.push({ text: action.scheduleCallConfig.buttonText, key: action.type });
        }
        break;
      case "quick_reply":
        action.quickReplyConfig?.quickReplies?.forEach((reply, replyIndex) => {
          if (reply.buttonText) {
            enabledButtons.push({
              text: reply.buttonText,
              key: `${action.type}-${replyIndex}`,
            });
          }
        });
        break;
    }
  });

  return (
    <div
      className={`flex flex-col items-end space-y-2 ${
        isSmallMobile ? "w-[285px]" : isMobile ? "w-[300px]" : "max-w-[400px] mb-4 min-w-[400px]"
      }`}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start relative"
      >
        <button
          onClick={onDismiss}
          className="no-min-size absolute top-[-6px] right-[0.5px] z-10 bg-white rounded-full p-1 border border-gray-300 shadow-sm hover:bg-gray-100 transition-all"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5 text-gray-600" />
        </button>
        <div
          className={`self-end bg-white border border-[#E5E7EB] text-sm text-left hover:bg-gray-50 transition-all w-fit overflow-hidden shadow-[0_4px_15px_rgb(0,0,0,0.05)] hover:shadow-[0_4px_15px_rgb(0,0,0,0.08)] hover:border-[#D1D5DB] ${
            isMobile ? "p-3 rounded-[20px]" : "p-4 rounded-[25px] whitespace-nowrap"
          }`}
        >
          <div className="flex items-start gap-4 flex-col">
            <div className="flex items-center justify-between w-full gap-8">
              <div className="flex items-center gap-2">
                <div className="relative">
                  {persona.picture && (
                    <img
                      src={persona.picture}
                      alt={persona.name}
                      className={`${isMobile ? "w-10 h-10 min-w-10 min-h-10" : "w-12 h-12 min-w-12 min-h-12"} rounded-full `}
                    />
                  )}
                  <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                </div>
                {persona.name && (
                  <p className={`font-bold ${isMobile ? "text-base" : "text-md"}`}>
                    {persona.name}
                  </p>
                )}
              </div>
              {showWatermark && (
                <div className="flex flex-row items-center gap-1.5">
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
            </div>

            <div className="flex flex-col gap-2">
              <p className={`${isMobile ? "text-lg" : "text-xl"}`}>
                {greetingMessage.shortMessage}
              </p>
              <div
                className={`markdown-content whitespace-normal ${
                  isMobile ? "text-base" : "text-lg"
                }`}
              >
                <ReactMarkdown>{greetingMessage.longMessage}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      <div className="flex justify-end flex-wrap gap-2 py-2">
        {enabledButtons.map((button, index) => (
          <motion.button
            key={button.key}
            initial={{ opacity: 0, y: 5 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { delay: 0.1 + index * 0.1 },
            }}
            onClick={() => handleQuickAction(button.text)}
            className={`self-end bg-white border border-[#E5E7EB] text-right hover:bg-gray-50 transition-all w-fit shadow-[0_4px_15px_rgb(0,0,0,0.05)] hover:shadow-[0_4px_15px_rgb(0,0,0,0.08)] hover:border-[#D1D5DB] ${
              isMobile
                ? "rounded-[20px] p-3 text-sm"
                : "rounded-[25px] p-4 text-md whitespace-nowrap"
            }`}
            style={{ color: brandColor }}
          >
            {button.text}
          </motion.button>
        ))}
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          transition: { delay: 0.3 + quickActions.length * 0.1 },
        }}
        onClick={() => {
          setIsOpen(true);
          onDismiss();
        }}
        className={`no-min-size self-end text-sm text-gray-500 hover:text-gray-700 mt-1 mr-1`}
      >
        Start Chat
      </motion.button>
    </div>
  );
};

export default InvitingMessage;
