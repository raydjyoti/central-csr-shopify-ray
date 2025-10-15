import React, { useState, useEffect } from "react";

interface AvatarSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadClick: () => void;
  onAvatarSelect: (avatarUrl: string) => void;
  onFileDrop: (file: File) => void;
}

const AvatarSelectionModal: React.FC<AvatarSelectionModalProps> = ({
  isOpen,
  onClose,
  onUploadClick,
  onAvatarSelect,
  onFileDrop,
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  if (!isOpen) {
    return null;
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileDrop(files[0]);
    }
  };

  // Placeholder avatar URLs - you can replace these with actual image paths later
  const predefinedAvatars = [
    "https://ik.imagekit.io/lgeusmxypd/chatbots/16.jpg?updatedAt=1752243228075",
    "https://ik.imagekit.io/lgeusmxypd/chatbots/19.jpg?updatedAt=1752243228158",
    "https://ik.imagekit.io/lgeusmxypd/chatbots/17.jpg?updatedAt=1752243228409",
    "https://ik.imagekit.io/lgeusmxypd/chatbots/282ebaaf9dca15b49952d8b158e1e21c984040e4.jpg?updatedAt=1752255968409",
    "https://ik.imagekit.io/lgeusmxypd/chatbots/4.jpg?updatedAt=1752243223202",
    "https://ik.imagekit.io/lgeusmxypd/chatbots/9.jpg?updatedAt=1752243223183",
    "https://ik.imagekit.io/lgeusmxypd/chatbots/5.jpg?updatedAt=1752243223212",
    "https://ik.imagekit.io/lgeusmxypd/chatbots/7.png?updatedAt=1752243222860",
    "https://ik.imagekit.io/lgeusmxypd/chatbots/23.png?updatedAt=1752243230970",
    "https://ik.imagekit.io/lgeusmxypd/chatbots/20.png?updatedAt=1752256372739",
    "https://ik.imagekit.io/lgeusmxypd/chatbots/13.png?updatedAt=1752256622133",
    "https://ik.imagekit.io/lgeusmxypd/chatbots/15.png?updatedAt=1752256745878",
    "https://ik.imagekit.io/lgeusmxypd/chatbots/25.png?updatedAt=1752256831714",
    "https://ik.imagekit.io/lgeusmxypd/chatbots/27.png?updatedAt=1752256896401",
    "https://ik.imagekit.io/lgeusmxypd/chatbots/24.png?updatedAt=1752243232136",
    "https://ik.imagekit.io/lgeusmxypd/chatbots/6.png?updatedAt=1752243222338",
    "https://ik.imagekit.io/lgeusmxypd/chatbots/5ee4932f54f4e3933f3e8fc98452010f6578888a.png?updatedAt=1752257154211",
    "https://ik.imagekit.io/lgeusmxypd/chatbots/28.png?updatedAt=1752243232994",
    "https://ik.imagekit.io/lgeusmxypd/chatbots/1.png?updatedAt=1752243222344",
    "https://ik.imagekit.io/lgeusmxypd/chatbots/10.png?updatedAt=1752243222234",
    "https://ik.imagekit.io/lgeusmxypd/chatbots/12.png?updatedAt=1752243222232",
    "https://ik.imagekit.io/lgeusmxypd/chatbots/14.png?updatedAt=1752259083653",
    "https://ik.imagekit.io/lgeusmxypd/chatbots/22.png?updatedAt=1752243228766",
    "https://ik.imagekit.io/lgeusmxypd/chatbots/18.png?updatedAt=1752243227910",
    "https://ik.imagekit.io/lgeusmxypd/chatbots/2.png?updatedAt=1752243222351",
    "https://ik.imagekit.io/lgeusmxypd/chatbots/8.png?updatedAt=1752243221846",
    "https://ik.imagekit.io/lgeusmxypd/chatbots/26.png?updatedAt=1752243232502",
    "https://ik.imagekit.io/lgeusmxypd/chatbots/21.png?updatedAt=1752243228184",
  ];

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto w-full z-50 flex justify-center items-center"
      style={{ height: "100dvh" as any }}
    >
      <div
        className={`relative mx-auto p-5 border shadow-lg rounded-md bg-white max-h-[90vh] overflow-hidden flex flex-col ${
          isMobile ? "w-[95vw] max-w-lg" : "w-[600px]"
        }`}
        style={{ maxHeight: "90dvh", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex justify-between items-center pb-3 border-b">
          <p className={`font-bold ${isMobile ? "text-lg" : "text-xl"}`}>
            Choose avatar for your agent
          </p>
          <button onClick={onClose} className="cursor-pointer z-50 p-2">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>
        <div
          className="mt-3 flex-1 overflow-y-auto"
          style={{ WebkitOverflowScrolling: "touch" as any }}
        >
          <div
            className={`border-dashed border-2 rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:bg-gray-50"
            }`}
            onClick={onUploadClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 16.5V7.5M12 7.5L8.5 11M12 7.5L15.5 11M4.5 16.5V17.5C4.5 18.9001 4.5 19.6002 4.77699 20.135C5.02217 20.6054 5.39462 20.9778 5.86502 21.223C6.39981 21.5 7.09994 21.5 8.5 21.5H15.5C16.9001 21.5 17.6002 21.5 18.135 21.223C18.6054 20.9778 18.9778 20.6054 19.223 20.135C19.5 19.6002 19.5 18.9001 19.5 17.5V16.5M19.5 8.5V7.5C19.5 6.09994 19.5 5.39981 19.223 4.86502C18.9778 4.39462 18.6054 4.02217 18.135 3.77699C17.6002 3.5 16.9001 3.5 15.5 3.5H8.5C7.09994 3.5 6.39981 3.5 5.86502 3.77699C5.39462 4.02217 5.02217 4.39462 4.77699 4.86502C4.5 5.39981 4.5 6.09994 4.5 7.5V8.5"
                  stroke="#667085"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">SVG, PNG, JPG or GIF (max. 800x400px)</p>
          </div>
          <div className="my-4 text-center text-sm text-gray-500">OR</div>
          <p className="font-medium text-gray-900 mb-4">Select an image from list</p>
          <div className={`grid gap-4 p-1 ${isMobile ? "grid-cols-4" : "grid-cols-7"}`}>
            {predefinedAvatars.map((avatarUrl, index) => (
              <div
                key={index}
                className="w-16 h-16 rounded-full overflow-hidden cursor-pointer border-2 border-transparent hover:border-blue-500 focus:border-blue-500 transition-colors"
                onClick={() => {
                  onAvatarSelect(avatarUrl);
                  onClose();
                }}
              >
                <img
                  src={avatarUrl}
                  alt={`Avatar ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
        <div className="items-center px-4 py-3 border-t mt-0 sticky bottom-0 left-0 right-0 bg-white">
          <button
            className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
            onClick={onClose}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarSelectionModal;
