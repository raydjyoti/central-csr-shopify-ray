import "./ChatbotWidgetPreview.css";
import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { MessageSquare, Send, X, ChevronLeft, Minus } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { io, Socket } from "socket.io-client";
// Replaced workspace context with settings-driven workspaceId fetch

import InvitingMessage from "./ChatPopupTypes/inviting_message";
import BoldCompact from "./ChatPopupTypes/bold_compact";
import type { QuickActionItem } from "../ChatbotForm/ChatbotForm";
import { markdownStyles } from "../../styles/markdownStyles";
import SearchIndicator from "./SearchIndicator/SearchIndicator";
import EmojiPicker from "emoji-picker-react";
import { Smile } from "lucide-react";
// import { AnimatePresence } from "framer-motion";

// START: Animation Components
function DotCycle({
  base,
  periodMs = 400,
  className,
}: {
  base: string;
  periodMs?: number;
  className?: string;
}) {
  const [dots, setDots] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d % 3) + 1), periodMs);
    return () => clearInterval(id);
  }, [periodMs]);
  return <div className={className}>{base + ".".repeat(dots)}</div>;
}

// END: Animation Components

interface ChatWidgetPreviewProps {
  forceOpen?: boolean;
  greetingMessage?: {
    shortMessage: string;
    longMessage: string;
  };
  quickReplyConfig?: any;
  scheduleCallConfig?: any;
  downloadFileConfig?: any;
  requestCallbackConfig?: any;
  linkToURLConfig?: any;
  quickActions?: QuickActionItem[];
  brandColor?: string;
  logo?: string;
  companyName?: string;
  popupStyle?: string;
  persona?: {
    name: string;
    picture: string;
  };
  showWatermark?: boolean;
  popupGreet?: boolean | undefined;
  streamResponse?: boolean;
  chatIcon: string;
  agentInstructions?: string;
  knowledgeBase?: string;
  agentLanguage?: string;
}

// Simple time-ago helper for preview timestamps
function timeAgo(iso?: string) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr${hr > 1 ? "s" : ""} ago`;
  const d = Math.floor(hr / 24);
  return `${d} day${d > 1 ? "s" : ""} ago`;
}

const ChatbotWidgetPreview: React.FC<ChatWidgetPreviewProps> = ({
  quickReplyConfig,
  scheduleCallConfig,
  downloadFileConfig,
  requestCallbackConfig,
  streamResponse,
  linkToURLConfig,
  popupGreet,
  greetingMessage = {
    shortMessage: "Welcome to Lorem Ipsum! 👋",
    longMessage: `We provide the best services at the most affordable prices!
    
We offer a wide range of services, let me know if you need help with anything!`,
  },
  quickActions,
  brandColor = "#289EFD",
  showWatermark = true,
  companyName = "Business Chat",
  popupStyle = "inviting_message",
  chatIcon,
  persona = {
    name: "Jane Doe",
    picture:
      "https://thumbs.dreamstime.com/b/indian-mature-woman-portrait-s-smiling-isolated-white-background-58884982.jpg",
  },
  agentInstructions,
  knowledgeBase,
  agentLanguage,
}) => {
  const [workspaceId, setWorkspaceId] = useState<string>("");
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings", { credentials: "include" });
        const data = await res.json();
        setWorkspaceId(data?.workspace_id ?? "");
      } catch (e) {
        console.error("Failed to load settings for preview:", e);
      }
    })();
  }, []);

  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messageSoundRef = useRef<HTMLAudioElement | null>(null);
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedStreamSound = useRef(false);
  const [currentChat, setCurrentChat] = useState<
    { role: string; text: string; timestamp?: string }[]
  >([]);
  const [streamingResponse, setStreamingResponse] = useState("");
  const [showPopupGreet, setShowPopupGreet] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const chatIdRef = useRef<string | null>(null);
  const [searchingKnowledgeBase, setSearchingKnowledgeBase] = useState(false);
  const [showExitDrawer, setShowExitDrawer] = useState(false);

  useEffect(() => {
    messageSoundRef.current = new Audio(
      "https://ik.imagekit.io/lgeusmxypd/Chat%20Message%202.mp3"
    );
    notificationSoundRef.current = new Audio(
      "https://ik.imagekit.io/lgeusmxypd/Chat%20Invite%20to%20Room.mp3"
    );
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Detect onboarding routes once on mount
  useEffect(() => {
    try {
      const href = window?.location?.href || "";
      const path = window?.location?.pathname || "";
      if (href.includes("/onboarding") || path.includes("/onboarding")) {
        setIsOnboarding(true);
      }
    } catch {
      // no-op for SSR or restricted environments
    }
  }, []);

  useEffect(() => {
    if (!popupGreet) {
      if (!isMobile) {
        setIsOpen(true);
      }
      setShowPopupGreet(false);
    } else {
      setShowPopupGreet(true);
      setIsOpen(false);
    }
  }, [popupGreet]);

  useEffect(() => {
    if (currentChat.length === 0) {
      setCurrentChat([
        {
          role: "bot",
          text: `${greetingMessage.shortMessage} ${greetingMessage.longMessage}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [
    greetingMessage.shortMessage,
    greetingMessage.longMessage,
    currentChat.length,
  ]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    let socket: Socket;
    const mode = import.meta.env.VITE_SOCKET_MODE;
    if (mode === "development") {
      socket = io(import.meta.env.VITE_CSR_BACKEND_URL, {
        path: "/socket-server",
      });
    } else {
      socket = io("https://api.trycentral.com", {
        path: "/chats/socket-server",
      });
    }
    socketRef.current = socket;

    // DEBUG: Log every inbound socket event
    try {
      socket.onAny((event, ...args) => {
        // Keep logs concise in prod; adjust if needed
        console.log("[Preview socket:onAny]", event, args);
      });
    } catch (e) {
      // no-op
    }

    socket.on("joined-chat", ({ chatId }) => {
      // Guard against re-joining loop; only join once per chatId
      if (chatId && chatIdRef.current !== chatId) {
        chatIdRef.current = chatId;
        socket.emit("join-chat", chatId);
      }
    });

    socket.on("stream-response", ({ content }) => {
      if (!streamResponse) return;

      if (notificationSoundRef.current && !hasPlayedStreamSound.current) {
        notificationSoundRef.current.currentTime = 0;
        notificationSoundRef.current
          .play()
          .catch((e) => console.error("Error playing sound", e));
        hasPlayedStreamSound.current = true;
      }

      setIsLoading(false);
      setSearchingKnowledgeBase(false);
      setStreamingResponse((prev) => prev + content);
      scrollToBottom();
    });

    socket.on("faqSearch", () => {
      // setCurrentChat((prev) => {
      //   const arr = [...prev];
      //   const msg = content || "Searching our knowledge base...";
      //   if (arr.length && arr[arr.length - 1].role === "bot") {
      //     arr[arr.length - 1] = { ...arr[arr.length - 1], text: msg };
      //   } else {
      //     arr.push({ role: "bot", text: msg });
      //   }
      //   return arr;
      // });
      setSearchingKnowledgeBase(true);
      scrollToBottom();
    });

    socket.on("processing-complete", ({ agenticResponse }) => {
      setSearchingKnowledgeBase(false);
      setIsLoading(false);

      if (streamResponse) {
        // Move any accumulated chunks into chat, fallback to agenticResponse if no chunks
        setStreamingResponse((prevStream) => {
          const finalText = prevStream || agenticResponse.response || "";
          if (finalText) {
            setCurrentChat((prevChat) => [
              ...prevChat,
              {
                role: "bot",
                text: finalText,
                timestamp: new Date().toISOString(),
              },
            ]);
          }
          return ""; // Clear streaming buffer
        });
      } else {
        // Non-streaming: use full response directly
        const finalText = agenticResponse.response || "";
        if (finalText) {
          setCurrentChat((prevChat) => [
            ...prevChat,
            {
              role: "bot",
              text: finalText,
              timestamp: new Date().toISOString(),
            },
          ]);
        }
        setStreamingResponse("");
        if (notificationSoundRef.current && !hasPlayedStreamSound.current) {
          notificationSoundRef.current.currentTime = 0;
          notificationSoundRef.current
            .play()
            .catch((e) => console.error("Error playing sound", e));
          hasPlayedStreamSound.current = true;
        }
      }
    });

    socket.on("connect", () => {
      console.log("[Preview socket] connect", socket.id);
      const cid = chatIdRef.current;
      if (cid) {
        socket.emit("join-chat", cid);
      }
    });

    socket.on("connect_error", (error) => {
      console.error("[Preview socket] connect_error", error);
    });

    socket.on("disconnect", (reason) => {
      console.log("[Preview socket] disconnect", reason);
    });

    return () => {
      try {
        socketRef.current?.offAny?.();
        socketRef.current?.off?.("connect_error");
        socketRef.current?.off?.("disconnect");
      } catch (e) {
        // no-op
      }
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleEmojiClick = (emojiObject: any) => {
    setMessage((prevMessage) => prevMessage + emojiObject.emoji);
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
    quickAction?: string
  ) => {
    event.preventDefault();

    const messageText = message.trim() || quickAction || "";
    if (!messageText) return;

    // Build next chat locally to ensure payload includes this message
    const userMsg = {
      role: "user",
      text: messageText,
      timestamp: new Date().toISOString(),
    };
    const newChat = [...currentChat, userMsg];

    // Update UI
    setCurrentChat(newChat);
    messageSoundRef.current?.play().catch(() => {});

    setMessage("");
    setIsLoading(true);
    setStreamingResponse("");
    hasPlayedStreamSound.current = false;

    // Compose instructions safely (avoid "undefined")
    const instructions = [
      agentInstructions,
      `Always keep your responses in ${agentLanguage || "English"}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    // Kick off preview processing
    const payload = {
      centralWorkspaceId: workspaceId,
      role: "user",
      text: messageText,
      agentLanguage,
      agentInstructions: instructions,
      socketId: socketRef.current?.id || undefined,
      websiteScanContext: {
        websiteUrl: onboardingData?.websiteUrl || null,
        websiteScanJobId: onboardingData?.websiteScanJobId || null,
        websiteScanResult: onboardingData?.websiteScanResult || null,
      },
      knowledgeBase,
      chat: newChat,
    } as any;

    const urlEndpoint = workspaceId
      ? "/api/workspace-chat/send-message"
      : "/api/workspace-chat/send-message-preview";

    fetch(`${import.meta.env.VITE_CSR_BACKEND_URL}${urlEndpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((resp) => {
        const chatId = resp?.data?.chatId;
        if (chatId) {
          chatIdRef.current = chatId; // set first to avoid re-emit loop in 'joined-chat' listener
          if (socketRef.current?.connected) {
            socketRef.current.emit("join-chat", chatId);
          }
        }
      })
      .catch((e) => {
        console.error("Preview send failed:", e);
        setIsLoading(false);
      });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [currentChat, showPopupGreet]);

  const chatWindow = (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`overflow-hidden shadow-xl bg-white flex flex-col ${
        isMobile
          ? "fixed inset-0 z-50 w-screen"
          : "max-h-[90vh] h-[700px] w-[450px] rounded-2xl relative"
      }`}
      style={isMobile ? { height: "100dvh" } : {}}
    >
      <>
        <style>{markdownStyles}</style>
        <div
          className="flex items-center justify-between p-4 text-white"
          style={{
            backgroundColor: brandColor,
            zIndex: 999,
          }}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsOpen(false);
                if (popupGreet) {
                  setShowPopupGreet(true);
                }
              }}
              className="rounded-full p-1 text-white/80 hover:bg-white/10 hover:text-white mr-1"
              title="Back to welcome screen"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {persona.picture ? (
              <div className="h-8 w-8 overflow-hidden rounded-full bg-white">
                <img
                  src={persona.picture}
                  alt={persona.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <MessageSquare className="h-6 w-6 text-white" />
            )}
            <span className="font-medium text-white">
              {persona.name || companyName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsOpen(false);
                if (popupGreet) {
                  setShowPopupGreet(true);
                }
              }}
              className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <Minus className="h-5 w-5" />
            </button>

            <button
              onClick={() => {
                setShowExitDrawer(true);
              }}
              className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto p-4 flex flex-col"
          ref={messagesContainerRef}
        >
          <div className="mt-auto flex flex-col space-y-4">
            {currentChat.map((msg, index) => {
              const nextMessage = currentChat[index + 1];
              const isLastInSequence =
                !nextMessage || nextMessage.role !== msg.role;
              return (
                <div
                  key={index}
                  className={`flex gap-2 ${
                    msg.role === "user" ? "justify-end" : ""
                  }`}
                >
                  {msg.role !== "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                      {persona.picture ? (
                        <div className="h-6 w-6 overflow-hidden rounded-full">
                          <img
                            src={persona.picture}
                            alt={persona.name || companyName}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <MessageSquare className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                  )}
                  <div
                    className={`flex flex-col max-w-[80%] w-[80%] ${
                      msg.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`chat-bubble ${
                        msg.role === "user"
                          ? "chat-bubble-user"
                          : "chat-bubble-bot"
                      }`}
                      style={
                        msg.role === "user"
                          ? {
                              backgroundColor: brandColor,
                              color: "#ffffff",
                              borderColor: brandColor,
                            }
                          : undefined
                      }
                    >
                      {msg.role !== "user" &&
                      isLoading &&
                      !streamingResponse &&
                      index === currentChat.length - 1 ? (
                        streamResponse ? (
                          searchingKnowledgeBase ? (
                            <SearchIndicator />
                          ) : (
                            <DotCycle
                              base="Thinking"
                              className="text-sm font-medium text-gray-500 italic"
                            />
                          )
                        ) : (
                          <DotCycle
                            base="Typing"
                            className="text-sm font-medium text-gray-500 italic"
                          />
                        )
                      ) : msg.role !== "user" ? (
                        <div className="text-sm markdown-content">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm">{msg.text}</p>
                      )}
                    </div>
                    {msg.timestamp && isLastInSequence && (
                      <div className="chat-timestamp">
                        {timeAgo(msg.timestamp)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {streamingResponse && (
              <div className="flex gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                  {persona.picture ? (
                    <div className="h-6 w-6 overflow-hidden rounded-full">
                      <img
                        src={persona.picture}
                        alt={persona.name || companyName}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <MessageSquare className="h-4 w-4 text-gray-600" />
                  )}
                </div>
                <div className="flex flex-col max-w-[80%] w-[80%] items-start">
                  <div className="chat-bubble chat-bubble-bot">
                    <div className="text-sm markdown-content">
                      <ReactMarkdown>{streamingResponse}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {isLoading && (
              <div className="flex gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                  {persona.picture ? (
                    <div className="h-6 w-6 overflow-hidden rounded-full">
                      <img
                        src={persona.picture}
                        alt={persona.name || companyName}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <MessageSquare className="h-4 w-4 text-gray-600" />
                  )}
                </div>
                <div className="flex flex-col max-w-[80%] w-[80%] items-start">
                  <div className="chat-bubble chat-bubble-bot min-w-[30%]">
                    {streamResponse ? (
                      searchingKnowledgeBase ? (
                        <SearchIndicator />
                      ) : (
                        <DotCycle
                          base="Thinking"
                          className="text-sm font-medium text-gray-500 italic"
                        />
                      )
                    ) : (
                      <DotCycle
                        base="Typing"
                        className="text-sm font-medium text-gray-500 italic"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t p-4 flex flex-col">
          <form
            onSubmit={(event) => handleSubmit(event)}
            className="flex items-center gap-2"
          >
            <div ref={emojiPickerRef} className="relative w-full">
              {showEmojiPicker && (
                <div className="absolute bottom-full mb-2">
                  <EmojiPicker onEmojiClick={handleEmojiClick} />
                </div>
              )}
              <div className="flex w-full items-end gap-2 rounded-2xl border border-gray-300 px-3 py-2">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 shrink-0"
                >
                  <Smile className="h-5 w-5" />
                </button>
                <textarea
                  rows={1}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      const syntheticEvent = {
                        preventDefault: () => {},
                      } as React.FormEvent<HTMLFormElement>;
                      handleSubmit(syntheticEvent, message);
                    }
                  }}
                  placeholder="Type your message..."
                  className="max-h-24 flex-1 resize-none self-center bg-transparent focus:outline-none"
                />
                <button
                  type="submit"
                  className={`flex h-8 w-8 p-2 items-center justify-center rounded-full text-white transition-colors hover:opacity-90 shrink-0`}
                  style={{
                    backgroundColor: brandColor,
                  }}
                >
                  <Send className="h-6 w-6" />
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className={`exit-chat-drawer ${showExitDrawer ? "open" : ""}`}>
          <div className="p-4">
            <h2 className="text-xl font-semibold">End Chat</h2>
            <p className="text-md text-gray-600">
              Are you sure you want to end chat?
            </p>
            <div className="flex flex-col gap-2 mt-4">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setCurrentChat([]);
                  setStreamingResponse("");
                  setIsLoading(false);
                  setSearchingKnowledgeBase(false);

                  setShowExitDrawer(false);
                  if (popupGreet) {
                    setShowPopupGreet(true);
                  }
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center"
              >
                End Chat
              </button>
              <button
                onClick={() => setShowExitDrawer(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
        <div className={`overlay ${showExitDrawer ? "show" : ""}`}></div>
      </>
    </motion.div>
  );

  return (
    <div className={`z-[2147483647] flex flex-col items-end gap-4`}>
      {showPopupGreet && !isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {popupStyle === "inviting_message" && (
            <InvitingMessage
              greetingMessage={greetingMessage}
              quickActions={quickActions || []}
              persona={persona}
              setIsOpen={setIsOpen}
              brandColor={brandColor}
              showWatermark={showWatermark}
              handleQuickAction={(action) => {
                setIsOpen(true);
                setShowPopupGreet(false);
                const syntheticEvent = {
                  preventDefault: () => {},
                } as React.FormEvent<HTMLFormElement>;
                handleSubmit(syntheticEvent, action);
              }}
              onDismiss={() => {
                setShowPopupGreet(false);
                // setIsOpen(false);
              }}
            />
          )}

          {popupStyle === "bold_compact" && (
            <BoldCompact
              showWatermark={showWatermark}
              quickReplyConfig={quickReplyConfig}
              scheduleCallConfig={scheduleCallConfig}
              downloadFileConfig={downloadFileConfig}
              requestCallbackConfig={requestCallbackConfig}
              linkToURLConfig={linkToURLConfig}
              greetingMessage={greetingMessage}
              quickActions={quickActions || []}
              persona={persona}
              brandColor={brandColor}
              setIsOpen={setIsOpen}
              setShowPopupGreet={setShowPopupGreet}
              onDismiss={() => {
                if (popupGreet) {
                  setShowPopupGreet(false);
                }
                // setIsOpen(false);
              }}
              handleQuickAction={(action) => {
                setIsOpen(true);
                setShowPopupGreet(false);
                const syntheticEvent = {
                  preventDefault: () => {},
                } as React.FormEvent<HTMLFormElement>;
                handleSubmit(syntheticEvent, action);
              }}
            />
          )}
        </motion.div>
      )}

      {!showPopupGreet &&
        isOpen &&
        (isMobile
          ? ReactDOM.createPortal(chatWindow, document.body)
          : chatWindow)}

      {/* {!showPopupGreet && !isOpen && (
        <div className="pointer-events-none mr-1 -mb-2 flex flex-col">
          <div className="text-sm font-medium mb-1 text-right" style={{ color: brandColor }}>
            Interact with me
          </div>
          <svg
            width="68"
            height="46"
            viewBox="0 0 68 46"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="nudge-arrow"
            style={{ transform: "scaleX(-1) rotate(20deg)", transformOrigin: "10px 10px" }}
          >
            <path
              d="M4 8 C 8 28, 30 32, 60 40"
              stroke={brandColor}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M56 35 L62 41 L54 42"
              stroke={brandColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )} */}

      <button
        onClick={() => {
          // if (popupGreet) {
          //   setShowPopupGreet(true);
          // } else {
          //   setIsOpen(true);
          // }

          if (isOpen) {
            if (popupGreet) {
              setShowPopupGreet(true);
            }
            setIsOpen(false);
          } else {
            if (popupGreet) {
              setShowPopupGreet(!showPopupGreet);
            } else {
              setIsOpen(true);
            }
          }
        }}
        className="flex h-14 w-14 items-center justify-center rounded-full shadow-md transition-colors hover:opacity-90"
        style={{ backgroundColor: brandColor }}
        aria-label="Open chat"
      >
        <img
          src={chatIcon}
          alt="chat"
          style={{
            width: "28px",
            height: "28px",
            filter: "brightness(0) invert(1)",
          }}
        />
      </button>
    </div>
  );
};

export default ChatbotWidgetPreview;
