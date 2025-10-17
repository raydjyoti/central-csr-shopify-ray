import { useNavigate } from "react-router-dom";
import styles from "./ChatbotForm.module.css";
import ChatbotWidgetPreview from "../ChatbotWidgetPreview/ChatbotWidgetPreview";
import axios from "axios";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Spinner } from "@shopify/polaris";
import { Redirect } from "@shopify/app-bridge/actions";
import { useEffect, useRef } from "react";
import {
  Bot,
  Eye,
  Loader2,
  ChevronRight,
  ListChecks,
  CalendarDays,
  Download,
  Phone,
  Link as LinkIcon,
  ChevronUp,
  Info,
  PlusCircle,
  Trash2,
  UploadCloud,
  Edit3,
  GripVertical,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  EyeOff,
  HelpCircle,
  Plus,
  X,
  Settings,
  MessageSquare,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import SuccessPopup from "./SuccessPopup";
import { toast, ToastContainer } from "react-toastify";
import CalendlyLogo from "../../assets/images/integrations/calendly.png";
import GoogleCalendarLogo from "../../assets/images/integrations/googlecalendar.png";
import CalComLogo from "../../assets/images/integrations/calcom.png";
import AvatarResize from "./AvatarResize";
import AvatarSelectionModal from "./AvatarSelectionModal";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import ResponseStyle from "./ResponseStyle";

import "react-toastify/dist/ReactToastify.css";
import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import LanguageDropdown from "./LanguageDropdown";

const API_URL = import.meta.env.VITE_CSR_BACKEND_URL;
const BACKEND_URL = import.meta.env.VITE_CENTRAL_BACKEND_API_URL;

interface IntakeForm {
  id: string;
  name: string;
  created_at: string;
  agentInstructions: string;
}

// START: New Interface Definitions for Quick Actions
export interface QuickReplyButton {
  buttonText: string;
}

export interface QuickReplyConfig {
  quickReplies: QuickReplyButton[];
}

export interface ScheduleCallConfig {
  provider?: "calendly" | "google_calendar" | "calcom";
  buttonText?: string;
  bookingLink?: string;
}

export interface IntakeField {
  id: string;
  label: string;
  type:
    | "text"
    | "int"
    | "email"
    | "phone"
    | "date"
    | "boolean"
    | "select"
    | string;
  required: boolean;
}

export interface DownloadFileConfig {
  name?: string;
  buttonText?: string;
  fileLink?: string;
  fileName?: string;
  fileType?: "pdf" | "doc" | "docx" | "xls" | "xlsx" | "ppt" | "pptx" | string;
  collectInfo?: boolean;
  intakeFormId?: string | null; // Added
  intakeFields?: IntakeField[];
  _selectedFile?: File | null;
  _fileFieldNameForUpload?: string;
}

export interface RequestCallbackConfig {
  name?: string;
  buttonText?: string;
  collectInfo?: boolean;
  intakeFormId?: string | null; // Added
  intakeFields?: IntakeField[];
}

export interface LinkToURLConfig {
  buttonText?: string;
  url?: string;
}

export type QuickActionType =
  | "quick_reply"
  | "schedule_call"
  | "download_file"
  | "request_callback"
  | "link_to_url";

export interface QuickActionItem {
  type: QuickActionType;
  enabled: boolean;
  icon?: React.ElementType;
  label?: string;
  quickReplyConfig?: QuickReplyConfig;
  scheduleCallConfig?: ScheduleCallConfig;
  downloadFileConfig?: DownloadFileConfig;
  requestCallbackConfig?: RequestCallbackConfig;
  linkToURLConfig?: LinkToURLConfig;
}
// END: New Interface Definitions for Quick Actions

// Define a more specific type for the formData state
interface ChatbotFormData {
  chatbotPurpose: {
    welcome: boolean;
    lead_generation: boolean;
    post_sales: boolean;
    pre_sales: boolean;
  };
  popupGreet: boolean;
  popupStyle: string;
  greetingMessage: {
    shortMessage: string;
    longMessage: string;
  };
  quickActions: QuickActionItem[];
  persona: {
    name: string;
    picture: string;
  };
  brandColor: string;
  chatIcon: string;
  useIntakeForm: boolean;
  selectedIntakeFormId: string | null;
  agentInstructions: string;
  showWatermark: boolean;
  streamResponse: boolean;
  delayPopupTime: number;
  agentLanguage: string;
}

interface Step1FormProps {
  formData: ChatbotFormData;
  quickActions: QuickActionItem[];
  intakeForms: IntakeForm[];
  currentStep: number;
  quickReplyConfig: QuickReplyConfig | null;
  scheduleCallConfig: ScheduleCallConfig | null;
  downloadFileConfig: DownloadFileConfig | null;
  requestCallbackConfig: RequestCallbackConfig | null;
  linkToURLConfig: LinkToURLConfig | null;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setFormData: React.Dispatch<React.SetStateAction<ChatbotFormData>>;
  handleBack: () => void;
  handleNext: () => void;
  handlePersonaChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleColorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setIsAvatarSelectionModalOpen: (isOpen: boolean) => void; // Add this line
  isMobile: boolean;
  setIsPreviewModalOpen: (isOpen: boolean) => void;
  isPreviewModalOpen: boolean;
  chatIcon: string;
}

const Step1Form: React.FC<Step1FormProps> = ({
  formData,
  quickActions,
  intakeForms,
  currentStep,
  handleInputChange,
  handleCheckboxChange,
  setFormData,
  handleBack,
  handleNext,
  handlePersonaChange,
  handleFileUpload,
  handleColorChange,
  quickReplyConfig,
  scheduleCallConfig,
  downloadFileConfig,
  requestCallbackConfig,
  linkToURLConfig,
  setIsAvatarSelectionModalOpen,
  isMobile,
  setIsPreviewModalOpen,
  isPreviewModalOpen,
  chatIcon,
}) => {
  const chatIcons = [
    "https://ik.imagekit.io/lgeusmxypd/chatbots/icons/Icon-1.png?updatedAt=1754846330101",
    "https://ik.imagekit.io/lgeusmxypd/chatbots/icons/Icon-2.png?updatedAt=1754846330127",
    "https://ik.imagekit.io/lgeusmxypd/chatbots/icons/Icon-3.png?updatedAt=1754846330240",
    "https://ik.imagekit.io/lgeusmxypd/chatbots/icons/Icon-4.png?updatedAt=1754846330354",
    "https://ik.imagekit.io/lgeusmxypd/chatbots/icons/Icon-5.png?updatedAt=1754846330341",
    "https://ik.imagekit.io/lgeusmxypd/chatbots/icons/Icon-6.png?updatedAt=1754846330267",
  ];

  const handleIconChange = (iconUrl: string) => {
    setFormData((prev) => ({ ...prev, chatIcon: iconUrl }));
  };

  const languages = [
    { value: "English", label: "🇬🇧 English" },
    { value: "Spanish", label: "🇪🇸 Spanish" },
    { value: "Chinese", label: "🇨🇳 Chinese" },
    { value: "French", label: "🇫🇷 French" },
    { value: "German", label: "🇩🇪 German" },
    { value: "Hindi", label: "🇮🇳 Hindi" },
    { value: "Russian", label: "🇷🇺 Russian" },
    { value: "Portuguese", label: "🇧🇷 Portuguese" },
    { value: "Japanese", label: "🇯🇵 Japanese" },
    { value: "Italian", label: "🇮🇹 Italian" },
    { value: "Dutch", label: "🇳🇱 Dutch" },
  ];

  return (
    <>
      <div className="flex flex-row gap-8 overflow-x-hidden">
        <div className="w-1/2 flex-1 space-y-8">
          <div className={styles.formGroup}>
            <label htmlFor="personaName" className="block mb-1">
              <h1 className="text-md font-semibold text-gray-900">
                Chat Agent Name
              </h1>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.persona.name}
              onChange={handlePersonaChange}
              placeholder="Enter a name for your chat agent"
              className={styles.formControl}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="photoUpload" className="block mb-1">
              <h1 className="text-md font-semibold text-gray-900">
                Chat Agent Avatar
              </h1>
            </label>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div
                  className="w-20 h-20 rounded-full border-2 border-gray-300 flex items-center hover:pointer justify-center overflow-hidden bg-gray-100 cursor-pointer"
                  onClick={() => setIsAvatarSelectionModalOpen(true)}
                >
                  {formData.persona.picture ? (
                    <img
                      src={formData.persona.picture}
                      alt="Persona"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
                        stroke="#888"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M20 21C20 17.13 16.36 14 12 14C7.64 14 4 17.13 4 21"
                        stroke="#888"
                        strokeWidth="1.5"
                      />
                    </svg>
                  )}
                </div>
                <button
                  onClick={() => setIsAvatarSelectionModalOpen(true)}
                  className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow border border-gray-200 no-min-size"
                  type="button"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 3L12 21M21 12L3 12"
                      stroke="#666"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className={styles.formGroup}>
            <div className="flex items-center gap-2 mb-1">
              <label htmlFor="brandColor" className="block mb-1">
                <h1 className="text-md font-semibold text-gray-900">
                  Background
                </h1>
              </label>
              {!isMobile && (
                <div className="relative group">
                  <Info
                    size={isMobile ? 12 : 16}
                    className="text-gray-500 cursor-help"
                  />
                  <div className="absolute bottom-full left-0 z-10 mb-2 w-max max-w-xs rounded-md bg-gray-900 px-3 py-2 text-sm font-normal text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                    Choose the main accent color for your chat agent, including
                    buttons, quick actions and menus.
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  id="brandColor"
                  name="brandColor"
                  value={formData.brandColor}
                  onChange={handleColorChange}
                  className="h-10 w-10 cursor-pointer rounded-full border border-gray-300 p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0"
                />
                <input
                  type="text"
                  value={formData.brandColor}
                  onChange={handleColorChange}
                  placeholder="#289EFD"
                  className={styles.formControl}
                  style={{
                    width: "120px",
                    borderLeft: `4px solid ${formData.brandColor}`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="chatIcon" className="block mb-1">
              <h1 className="text-md font-semibold text-gray-900">Chat Icon</h1>
            </label>
            <div className="flex items-center gap-2">
              {chatIcons.map((icon, index) => (
                <div
                  key={index}
                  className={`w-14 h-14 rounded-[15px] border-2 flex items-center justify-center cursor-pointer
                    ${
                      formData.chatIcon === icon
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-300 bg-white"
                    }`}
                  onClick={() => handleIconChange(icon)}
                >
                  <img
                    src={icon}
                    alt={`Icon ${index + 1}`}
                    className="w-5 h-5"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="language" className="block mb-1">
              <h1 className="text-md font-semibold text-gray-900">
                Chat Agent Language
              </h1>
            </label>
            <LanguageDropdown
              options={languages}
              value={formData.agentLanguage}
              onChange={(value) => {
                setFormData((prev) => ({
                  ...prev,
                  agentLanguage: value || "English",
                }));
              }}
            />
          </div>
        </div>

        {!isMobile && (
          <div className="flex w-1/2 flex-shrink-0 origin-top-right scale-[0.85] items-end justify-end mr-2">
            <ChatbotWidgetPreview
              showWatermark={formData.showWatermark}
              popupGreet={formData.popupGreet}
              quickReplyConfig={quickReplyConfig}
              streamResponse={formData.streamResponse}
              scheduleCallConfig={scheduleCallConfig}
              greetingMessage={{
                shortMessage:
                  formData.greetingMessage.shortMessage ||
                  "Welcome to our website! 👋",
                longMessage: formData.greetingMessage.longMessage || "",
              }}
              downloadFileConfig={downloadFileConfig}
              requestCallbackConfig={requestCallbackConfig}
              linkToURLConfig={linkToURLConfig}
              quickActions={quickActions}
              popupStyle={formData.popupStyle}
              persona={{
                name: formData.persona.name,
                picture: formData.persona.picture,
              }}
              brandColor={formData.brandColor}
              chatIcon={chatIcon}
            />
          </div>
        )}
      </div>

      {isMobile && isPreviewModalOpen && (
        <motion.div
          className={`fixed transform bottom-6 right-6 scale-[0.9] origin-bottom-right`}
        >
          <ChatbotWidgetPreview
            showWatermark={formData.showWatermark}
            popupGreet={formData.popupGreet}
            quickReplyConfig={quickReplyConfig}
            scheduleCallConfig={scheduleCallConfig}
            streamResponse={formData.streamResponse}
            greetingMessage={{
              shortMessage:
                formData.greetingMessage.shortMessage ||
                "Welcome to our website! 👋",
              longMessage: formData.greetingMessage.longMessage || "",
            }}
            downloadFileConfig={downloadFileConfig}
            requestCallbackConfig={requestCallbackConfig}
            linkToURLConfig={linkToURLConfig}
            quickActions={quickActions}
            popupStyle={formData.popupStyle}
            persona={{
              name: formData.persona.name,
              picture: formData.persona.picture,
            }}
            brandColor={formData.brandColor}
            chatIcon={formData.chatIcon}
          />
        </motion.div>
      )}
    </>
  );
};

interface Step2FormProps {
  formData: ChatbotFormData;
  quickActions: QuickActionItem[];
  quickReplyConfig: QuickReplyConfig | null;
  scheduleCallConfig: ScheduleCallConfig | null;
  downloadFileConfig: DownloadFileConfig | null;
  requestCallbackConfig: RequestCallbackConfig | null;
  linkToURLConfig: LinkToURLConfig | null;
  currentStep: number;
  handleRadioChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBack: () => void;
  handleNext: () => void;
  setFormData: React.Dispatch<React.SetStateAction<ChatbotFormData>>;
  isMobile: boolean;
  setIsPreviewModalOpen: (isOpen: boolean) => void;
  isPreviewModalOpen: boolean;
}

const Step2Form: React.FC<Step2FormProps> = ({
  formData,
  quickActions,
  quickReplyConfig,
  scheduleCallConfig,
  downloadFileConfig,
  requestCallbackConfig,
  linkToURLConfig,
  currentStep,
  handleRadioChange,
  setFormData,
  handleBack,
  handleNext,
  isMobile,
  setIsPreviewModalOpen,
  isPreviewModalOpen,
}) => {
  return (
    <>
      <div className="flex flex-row">
        <div className="flex-1 space-y-8 w-1/2">
          <div className={styles.formGroup}>
            <h1 className="text-md font-semibold text-gray-900">
              Do you want to greet your visitors with a pop-up?
            </h1>

            <div className={styles.radioGroup}>
              <div className={styles.radioItem}>
                <input
                  type="radio"
                  id="popupGreetTrue"
                  name="popupGreet"
                  value="true"
                  checked={formData.popupGreet}
                  onChange={handleRadioChange}
                  className={styles.roundRadio}
                />
                <label htmlFor="popupGreetTrue" className="cursor-pointer">
                  Yes
                </label>
              </div>

              <div className={styles.radioItem}>
                <input
                  type="radio"
                  id="popupGreetFalse"
                  name="popupGreet"
                  value="false"
                  checked={!formData.popupGreet}
                  onChange={handleRadioChange}
                  className={styles.roundRadio}
                />
                <label htmlFor="popupGreetFalse" className="cursor-pointer">
                  No
                </label>
              </div>
            </div>
          </div>
          {formData.popupGreet && (
            <div className={styles.formGroup}>
              <h1 className="text-md font-semibold text-gray-900">
                Choose Pop-up Style
              </h1>
              <div
                className={`flex flex-row justify-between items-start gap-8 w-full ${
                  isMobile ? "flex-col" : ""
                }`}
              >
                <div
                  className={`${styles.popupStyleOptions} ${
                    isMobile ? "flex-col" : ""
                  }`}
                >
                  <div className={styles.popupStyleOption}>
                    <input
                      type="radio"
                      id="inviting_message"
                      name="popupStyle"
                      value="inviting_message"
                      checked={formData.popupStyle === "inviting_message"}
                      onChange={handleRadioChange}
                      className={styles.hiddenRadio}
                    />
                    <label
                      htmlFor="inviting_message"
                      className={styles.popupStyleLabel}
                    >
                      <div
                        className={`${styles.popupStylePreview} ${
                          formData.popupStyle === "inviting_message"
                            ? styles.selected
                            : ""
                        }`}
                      >
                        <h4 className="mb-2 text-lg">Inviting Message</h4>
                        <div className="w-full overflow-hidden">
                          <img
                            src="https://ik.imagekit.io/lgeusmxypd/inviting-message.png?updatedAt=1742467926219"
                            alt="Inviting Message Style"
                            className="w-full h-full object-cover object-top"
                          />
                        </div>
                      </div>
                    </label>
                  </div>
                  <div className={styles.popupStyleOption}>
                    <input
                      type="radio"
                      id="bold_compact"
                      name="popupStyle"
                      value="bold_compact"
                      checked={formData.popupStyle === "bold_compact"}
                      onChange={handleRadioChange}
                      className={styles.hiddenRadio}
                    />
                    <label
                      htmlFor="bold_compact"
                      className={styles.popupStyleLabel}
                    >
                      <div
                        className={`${styles.popupStylePreview} ${
                          formData.popupStyle === "bold_compact"
                            ? styles.selected
                            : ""
                        }`}
                      >
                        <h4 className="mb-2 text-lg">Bold and Compact</h4>
                        <div className="w-full overflow-hidden">
                          <img
                            src="https://ik.imagekit.io/lgeusmxypd/big-bold.png?updatedAt=1742467943592"
                            alt="Bold and Compact Style"
                            className="w-full h-full object-cover object-top"
                          />
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
                <div
                  className={`scale-[0.85] origin-top ${
                    formData.popupStyle === "front_center"
                      ? "flex flex-col justify-center items-center scale-100"
                      : ""
                  }`}
                ></div>
              </div>
            </div>
          )}
          {formData.popupGreet && (
            <div className={styles.formGroup}>
              <div className="flex items-center mt-4 gap-4">
                <h1 className="text-md font-semibold text-gray-900">
                  Show pop-up after
                </h1>
                <div className="flex w-32 items-center rounded-md border border-gray-300 shadow-sm focus-within:border-gray-500 focus-within:ring-1 focus-within:ring-gray-500 bg-white">
                  <input
                    type="number"
                    id="delayPopupTime"
                    name="delayPopupTime"
                    value={formData.delayPopupTime / 1000 || ""}
                    onChange={(e) => {
                      const value =
                        e.target.value === ""
                          ? 0
                          : Math.floor(Number(e.target.value));
                      const seconds = Math.max(0, Math.min(30, value));
                      setFormData((prev) => ({
                        ...prev,
                        delayPopupTime: seconds * 1000,
                      }));
                    }}
                    className={`block w-full flex-1 rounded-l-md border-0 bg-transparent p-2 text-center text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm ${styles.noSpinners}`}
                    min="0"
                    max="30"
                    placeholder="0"
                  />
                  <span className="inline-flex items-center self-stretch rounded-r-md border-l border-gray-300 bg-blue-50 px-3 text-blue-600 font-extrabold text-sm sm:text-sm">
                    {formData.delayPopupTime / 1000 === 1
                      ? "second"
                      : "seconds"}
                  </span>
                </div>
              </div>
            </div>
          )}
          {formData.popupGreet && (
            <div className={styles.formGroup}>
              <div className="flex items-center mt-4 gap-4">
                <h1 className="text-md font-semibold text-gray-900">
                  Watermark (Powered by Central)
                </h1>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      showWatermark: !prev.showWatermark,
                    }))
                  }
                  className={`${
                    formData.showWatermark ? "bg-blue-600" : "bg-gray-200"
                  } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 no-min-size`}
                  role="switch"
                  aria-checked={formData.showWatermark}
                >
                  <span className="sr-only">Toggle Watermark</span>
                  <span
                    aria-hidden="true"
                    className={`${
                      formData.showWatermark ? "translate-x-5" : "translate-x-0"
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>
        {!isMobile && (
          <div className="flex w-1/2 flex-shrink-0 origin-top-right scale-[0.85] items-end justify-end">
            <ChatbotWidgetPreview
              popupGreet={formData.popupGreet}
              quickActions={quickActions}
              quickReplyConfig={quickReplyConfig}
              streamResponse={formData.streamResponse}
              greetingMessage={{
                shortMessage:
                  formData.greetingMessage.shortMessage ||
                  "Welcome to our website! 👋",
                longMessage: formData.greetingMessage.longMessage || "",
              }}
              scheduleCallConfig={scheduleCallConfig}
              downloadFileConfig={downloadFileConfig}
              requestCallbackConfig={requestCallbackConfig}
              linkToURLConfig={linkToURLConfig}
              popupStyle={formData.popupStyle}
              persona={{
                name: formData.persona.name,
                picture: formData.persona.picture,
              }}
              brandColor={formData.brandColor}
              showWatermark={formData.showWatermark}
              chatIcon={formData.chatIcon}
            />
          </div>
        )}
      </div>

      {isMobile && isPreviewModalOpen && (
        <motion.div
          className={`fixed transform bottom-6 right-6 scale-[0.9] origin-bottom-right`}
        >
          <ChatbotWidgetPreview
            showWatermark={formData.showWatermark}
            popupGreet={formData.popupGreet}
            quickReplyConfig={quickReplyConfig}
            scheduleCallConfig={scheduleCallConfig}
            streamResponse={formData.streamResponse}
            greetingMessage={{
              shortMessage:
                formData.greetingMessage.shortMessage ||
                "Welcome to our website! 👋",
              longMessage: formData.greetingMessage.longMessage || "",
            }}
            downloadFileConfig={downloadFileConfig}
            requestCallbackConfig={requestCallbackConfig}
            linkToURLConfig={linkToURLConfig}
            quickActions={quickActions}
            popupStyle={formData.popupStyle}
            persona={{
              name: formData.persona.name,
              picture: formData.persona.picture,
            }}
            brandColor={formData.brandColor}
            chatIcon={formData.chatIcon}
          />
        </motion.div>
      )}
    </>
  );
};

// START: Configuration Components for Quick Actions

interface QuickReplySettingsProps {
  config: QuickReplyConfig;
  onChange: (newConfig: QuickReplyConfig) => void;
}

const QuickReplySettings: React.FC<QuickReplySettingsProps> = ({
  config,
  onChange,
}) => {
  const handleReplyTextChange = (index: number, text: string) => {
    const updatedReplies = config.quickReplies.map((reply, i) =>
      i === index ? { ...reply, buttonText: text } : reply
    );
    onChange({ ...config, quickReplies: updatedReplies });
  };

  const addReply = () => {
    onChange({
      ...config,
      quickReplies: [...config.quickReplies, { buttonText: "" }],
    });
  };

  const removeReply = (index: number) => {
    const updatedReplies = config.quickReplies.filter((_, i) => i !== index);
    onChange({ ...config, quickReplies: updatedReplies });
  };

  const suggestedReplies = [
    "What is the pricing?",
    "Do you provide free shipping?",
    "How do I get started?",
  ];

  const hasEmptyReply = config.quickReplies.some(
    (reply) => !reply.buttonText.trim()
  );

  return (
    <div className="mt-3 p-4 py-6 bg-gray-50 rounded-md border">
      {config.quickReplies.map((reply, index) => (
        <div key={index} className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quick Question {index + 1}
          </label>
          <div className="flex items-center">
            <input
              type="text"
              value={reply.buttonText}
              onChange={(e) => handleReplyTextChange(index, e.target.value)}
              placeholder="Enter a FAQ your chat agent can immediately answer"
              className="flex-grow p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            {config.quickReplies.length > 1 && (
              <button
                onClick={() => removeReply(index)}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>
      ))}

      <button
        onClick={addReply}
        disabled={hasEmptyReply}
        className={`w-full flex items-center justify-center mt-3 p-2 border-2 border-dashed rounded-lg transition-colors ${
          hasEmptyReply
            ? "text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed opacity-50"
            : "text-blue-600 border-blue-300 bg-blue-50 hover:bg-blue-100"
        }`}
      >
        <PlusCircle className="w-5 h-5 mr-2" />
        Add more quick replies
      </button>

      {/* <div className="mt-4">
        <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
          <ListChecks size={16} className="mr-2 text-blue-500" /> Suggested quick questions:
        </p>
        <div className="flex flex-wrap gap-2">
          {suggestedReplies.map((sr) => (
            <button
              key={sr}
              onClick={() => {
                onChange({
                  ...config,
                  quickReplies: [...config.quickReplies, { buttonText: sr }],
                });
              }}
              className="px-3 py-1 text-sm border rounded-full hover:bg-gray-100 disabled:opacity-50"
            >
              {sr}
            </button>
          ))}
        </div>
      </div> */}
    </div>
  );
};

interface ScheduleCallSettingsProps {
  config: ScheduleCallConfig;
  onChange: (newConfig: ScheduleCallConfig) => void;
  calendlyConnection: {
    connected: boolean;
    connectionDetails?: any;
  } | null;
  googleCalendarConnection: {
    connected: boolean;
    connectionDetails?: any;
  } | null;
  checkGoogleCalendarConnection: () => void;
  isCheckingGoogleCalendar: boolean;
  onRefreshStatus: () => void;
  isCheckingStatus: boolean;
  calComConnection: {
    connected: boolean;
    connectionDetails?: any;
  } | null;
  isCheckingCalCom: boolean;
  checkCalComConnection: () => void;
}

const ScheduleCallSettings: React.FC<ScheduleCallSettingsProps> = ({
  config,
  onChange,
  calendlyConnection,
  onRefreshStatus,
  isCheckingStatus,
  googleCalendarConnection,
  checkGoogleCalendarConnection,
  isCheckingGoogleCalendar,
  calComConnection,
  isCheckingCalCom,
  checkCalComConnection,
}) => {
  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...config,
      provider: e.target.value as "calendly" | "google_calendar" | "calcom",
    });
  };

  return (
    <div className="mt-3 p-4 py-6 bg-gray-50 rounded-md border">
      <div className="mb-3">
        <label
          htmlFor="scheduleButtonText"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Button Label
        </label>
        <input
          type="text"
          id="scheduleButtonText"
          value={config.buttonText || ""}
          onChange={(e) => onChange({ ...config, buttonText: e.target.value })}
          placeholder="Schedule a Call"
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div className="mb-3">
        <label
          htmlFor="bookingProvider"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Booking Provider
        </label>
        <select
          id="bookingProvider"
          value={config.provider || "calendly"}
          onChange={handleProviderChange}
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
        >
          <option value="calendly">Calendly</option>
          {/* <option value="google_calendar">Google Calendar</option> */}
          <option value="calcom">Cal.com</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="bookingLink"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Booking link
        </label>
        {(!config.provider || config.provider === "calendly") && (
          <>
            {calendlyConnection?.connected ? (
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-green-50 border-green-200">
                <img
                  src={CalendlyLogo}
                  alt="Calendly Logo"
                  className="w-8 h-8"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 break-all">
                    {calendlyConnection.connectionDetails.booking_url}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="text-xs text-green-700">Connected</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
                <div className="flex items-center gap-3">
                  <img
                    src={CalendlyLogo}
                    alt="Calendly Logo"
                    className="w-8 h-8"
                  />
                  <div className="flex items-center gap-2">
                    <a
                      href="/chat/integrations?provider=calendly"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 w-min-content hover:underline"
                    >
                      Connect Calendly
                    </a>
                    <ExternalLink
                      size={16}
                      className="text-gray-500"
                      onClick={() => {
                        window.open(
                          "/chat/integrations?provider=calendly",
                          "_blank"
                        );
                      }}
                    />
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <p
                    className="text-xs text-gray-500"
                    onClick={onRefreshStatus}
                  >
                    Refresh Status
                  </p>
                  <button
                    onClick={onRefreshStatus}
                    className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md"
                    title="Refresh Status"
                    disabled={isCheckingStatus}
                  >
                    {isCheckingStatus ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <RefreshCw size={16} />
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {config.provider === "google_calendar" && (
          <>
            {googleCalendarConnection?.connected ? (
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-green-50 border-green-200">
                <img
                  src={GoogleCalendarLogo}
                  alt="Google Calendar Logo"
                  className="w-8 h-8"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 break-all">
                    {googleCalendarConnection.connectionDetails.email}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="text-xs text-green-700">Connected</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
                <div className="flex items-center gap-3">
                  <img
                    src={GoogleCalendarLogo}
                    alt="Google Calendar Logo"
                    className="w-8 h-8"
                  />
                  <div className="flex items-center gap-2">
                    <a
                      href="/chat/integrations?provider=google-calendar"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 w-min-content hover:underline"
                    >
                      Connect Google Calendar
                    </a>
                    <ExternalLink
                      size={16}
                      className="text-gray-500"
                      onClick={() => {
                        window.open(
                          "/chat/integrations?provider=google-calendar",
                          "_blank"
                        );
                      }}
                    />
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  </div>
                </div>
                <button
                  onClick={checkGoogleCalendarConnection}
                  className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md"
                  title="Refresh Status"
                  disabled={isCheckingGoogleCalendar}
                >
                  {isCheckingGoogleCalendar ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <RefreshCw size={16} />
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {config.provider === "calcom" && (
          <>
            {calComConnection?.connected ? (
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-green-50 border-green-200">
                <img src={CalComLogo} alt="Cal.com Logo" className="w-8 h-8" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 break-all">
                    {calComConnection.connectionDetails.meetingLink}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="text-xs text-green-700">Connected</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
                <div className="flex items-center gap-3">
                  <img
                    src={CalComLogo}
                    alt="Cal.com Logo"
                    className="w-8 h-8"
                  />
                  <div className="flex items-center gap-2">
                    <a
                      href="/chat/integrations?provider=calcom"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 w-min-content hover:underline"
                    >
                      Connect Cal.com
                    </a>
                    <ExternalLink
                      size={16}
                      className="text-gray-500"
                      onClick={() => {
                        window.open(
                          "/chat/integrations?provider=calcom",
                          "_blank"
                        );
                      }}
                    />
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <p
                    className="text-xs text-gray-500"
                    onClick={onRefreshStatus}
                  >
                    Refresh Status
                  </p>
                  <button
                    onClick={checkCalComConnection}
                    className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md"
                    title="Refresh Status"
                    disabled={isCheckingCalCom}
                  >
                    {isCheckingCalCom ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <RefreshCw size={16} />
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

interface LinkToURLSettingsProps {
  config: LinkToURLConfig;
  onChange: (newConfig: LinkToURLConfig) => void;
}

const LinkToURLSettings: React.FC<LinkToURLSettingsProps> = ({
  config,
  onChange,
}) => {
  return (
    <div className="mt-3 p-4 py-6 bg-gray-50 rounded-md border">
      <div className="mb-3">
        <label
          htmlFor="linkTitle"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Link title
        </label>
        <input
          type="text"
          id="linkTitle"
          value={config.buttonText || ""}
          onChange={(e) => onChange({ ...config, buttonText: e.target.value })}
          placeholder="e.g Track Order, View Pricing etc"
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>
      <div>
        <label
          htmlFor="linkURL"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          URL
        </label>
        <input
          type="text"
          id="linkURL"
          value={config.url || ""}
          onChange={(e) => onChange({ ...config, url: e.target.value })}
          placeholder="https://abc.com/your-name/trackorder"
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>
    </div>
  );
};

// END: Configuration Components for Quick Actions

// START: DownloadFileSettings Component
interface DownloadFileSettingsProps {
  config: DownloadFileConfig;
  onChange: (newConfig: DownloadFileConfig) => void;
}

const DownloadFileSettings: React.FC<DownloadFileSettingsProps> = ({
  config,
  onChange,
}) => {
  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<IntakeField["type"]>("text");
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(
    null
  );
  const [currentEditValues, setCurrentEditValues] = useState<{
    label: string;
    type: IntakeField["type"];
  } | null>(null);

  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && config.intakeFields) {
      const oldIndex = config.intakeFields.findIndex((f) => f.id === active.id);
      const newIndex = config.intakeFields.findIndex((f) => f.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedFields = arrayMove(
          [...config.intakeFields],
          oldIndex,
          newIndex
        );
        onChange({ ...config, intakeFields: reorderedFields }); // Update local state

        if (editingFieldIndex === oldIndex) {
          setEditingFieldIndex(newIndex);
        } else if (editingFieldIndex !== null) {
          if (
            oldIndex < newIndex &&
            editingFieldIndex > oldIndex &&
            editingFieldIndex <= newIndex
          ) {
            setEditingFieldIndex(editingFieldIndex - 1);
          } else if (
            oldIndex > newIndex &&
            editingFieldIndex >= newIndex &&
            editingFieldIndex < oldIndex
          ) {
            setEditingFieldIndex(editingFieldIndex + 1);
          }
        }
        // No backend call here
      }
    }
  };

  const triggerAddIntakeField = () => {
    // No longer async
    if (!newFieldLabel.trim()) {
      alert("Field label cannot be empty.");
      return;
    }
    // Generate a temporary frontend ID
    const newField: IntakeField = {
      id: `temp-dl-${Date.now().toString()}`,
      label: newFieldLabel,
      type: newFieldType,
      required: true,
    };

    const updatedFields = [...(config.intakeFields || []), newField];
    onChange({ ...config, intakeFields: updatedFields, collectInfo: true });
    setNewFieldLabel("");
    setNewFieldType("text");
    setIsAddingField(false);
    // No backend call here
  };

  const removeIntakeField = (indexToRemove: number) => {
    // No longer async
    if (!config.intakeFields) return;

    if (editingFieldIndex === indexToRemove) {
      handleCancelEdit();
    }
    const remainingFields = config.intakeFields.filter(
      (_, i) => i !== indexToRemove
    );
    onChange({ ...config, intakeFields: remainingFields });
    // No backend call here
    // If order was important to persist *after* delete for other reasons, that logic would be more complex
    // But for this strategy, the backend handles order from the final array
  };

  const handleSaveEdit = (index: number) => {
    // No longer async
    if (
      !currentEditValues ||
      !currentEditValues.label.trim() ||
      !config.intakeFields
    ) {
      alert("Label cannot be empty.");
      return;
    }
    const fieldToUpdate = config.intakeFields[index]; // Get the original field to keep its ID

    const updatedFields = config.intakeFields.map((field, i) =>
      i === index
        ? {
            ...fieldToUpdate,
            label: currentEditValues.label,
            type: currentEditValues.type,
          }
        : field
    );
    onChange({ ...config, intakeFields: updatedFields });
    setEditingFieldIndex(null);
    setCurrentEditValues(null);
    // No backend call here
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onChange({
        ...config,
        fileName: file.name,
        _selectedFile: file,
        fileLink: "", // Clear existing link if new file is selected
      });
    }
  };

  const handleButtonTextChange = (text: string) => {
    onChange({ ...config, buttonText: text });
  };

  const toggleCollectInfo = () => {
    const newCollectInfoState = !config.collectInfo;

    onChange({ ...config, collectInfo: newCollectInfoState });
    if (!newCollectInfoState) {
      // if toggling off, cancel any active edit
      setEditingFieldIndex(null);
      setCurrentEditValues(null);
    }
  };

  const handleStartEdit = (index: number, field: IntakeField) => {
    setEditingFieldIndex(index);
    setCurrentEditValues({ label: field.label, type: field.type });
  };

  const handleCancelEdit = () => {
    setEditingFieldIndex(null);
    setCurrentEditValues(null);
  };

  const handleCurrentEditLabelChange = (newLabel: string) => {
    if (currentEditValues) {
      setCurrentEditValues({ ...currentEditValues, label: newLabel });
    }
  };

  const handleCurrentEditTypeChange = (newType: IntakeField["type"]) => {
    if (currentEditValues) {
      setCurrentEditValues({ ...currentEditValues, type: newType });
    }
  };

  // Helper to get display name for type
  const getFieldTypeDisplayName = (type: IntakeField["type"]) => {
    switch (type) {
      case "text":
        return "Text";
      case "email":
        return "Email";
      case "phone":
        return "Phone";
      case "int":
        return "Number";
      case "date":
        return "Date";
      case "boolean":
        return "Boolean";
      // case "select":
      //   return "Select";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileUploadContainerClick = () => {
    // Trigger the file input click event
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files ? e.dataTransfer.files[0] : null;
    if (file) {
      onChange({
        ...config,
        _selectedFile: file,
        fileName: file.name,
        _fileFieldNameForUpload: `quickActions.download_file.file`,
      });
    }
  };

  return (
    <div className="mt-3 p-4 py-6 bg-gray-50 rounded-md border space-y-6 overflow-x-hidden">
      {/* <div>
        <label htmlFor="downloadName" className="block text-sm font-semibold text-gray-800 mb-2">
          Name
        </label>
        <input
          type="text"
          id="downloadName"
          value={config.name || ""}
          onChange={(e) => onChange({ ...config, name: e.target.value })}
          placeholder="e.g. Chat Agent Name - Download"
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div> */}
      <div>
        <h3
          className="block text-sm font-bold text-gray-800 mb-2"
          style={{
            fontFamily: "Inter",
            fontWeight: "600",
          }}
        >
          Upload File
        </h3>
        <div
          onClick={onFileUploadContainerClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:bg-gray-100 transition-colors ${
            isDraggingOver ? "bg-blue-50 border-blue-400" : ""
          }`}
        >
          <div className="space-y-1 text-center">
            <UploadCloud className="mx-auto h-10 w-10 text-gray-400" />
            <div className="flex text-sm text-gray-600 justify-center">
              <label
                onClick={(e) => e.stopPropagation()}
                htmlFor={`file-upload-${
                  config.buttonText?.replace(/\s+/g, "-") || "download"
                }`}
                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
              >
                <span>Click to upload</span>
                <input
                  ref={fileInputRef}
                  id={`file-upload-${
                    config.buttonText?.replace(/\s+/g, "-") || "download"
                  }`}
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpeg,.jpg,.png,.gif,.svg,.webp,.mp3,.wav,.aac,.mp4,.mov,.avi,.mkv,.zip,.rar,.tar,.gz"
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">
              SVG, PNG, JPG, PDF, DOCX etc.
            </p>
            {config.fileName && (
              <p className="text-sm text-green-600 mt-2">
                Selected:{" "}
                {config.fileName?.length > 20
                  ? config.fileName.slice(0, 20) + "..."
                  : config.fileName}
              </p>
            )}
            {config.fileLink &&
              !config._selectedFile && ( // Show if there's an existing uploaded file
                <p className="text-sm text-gray-700 mt-1">
                  Current file: {config.fileName || "Uploaded File"}
                </p>
              )}
          </div>
        </div>
      </div>

      <div>
        <label
          htmlFor="leadMagnetText"
          className="block text-sm font-semibold text-gray-800 mb-1"
        >
          Button Label
        </label>
        <input
          type="text"
          id="leadMagnetText"
          value={config.buttonText || ""}
          onChange={(e) => handleButtonTextChange(e.target.value)}
          placeholder="e.g. Get 20 Best AI Prompts"
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3
            className="text-sm font-semibold text-gray-800"
            style={{
              fontFamily: "Inter",
              fontWeight: "600",
            }}
          >
            Collect information before download?
          </h3>
          <button
            type="button"
            onClick={toggleCollectInfo}
            className={`${
              config.collectInfo ? "bg-blue-600" : "bg-gray-200"
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            role="switch"
            aria-checked={!!config.collectInfo}
          >
            <span className="sr-only">Collect Information</span>
            <span
              aria-hidden="true"
              className={`${
                config.collectInfo ? "translate-x-5" : "translate-x-0"
              } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </button>
        </div>

        {config.collectInfo && (
          <div className="space-y-3 mt-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={(config.intakeFields || []).map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                {(config.intakeFields || []).map((field, index) => (
                  <SortableIntakeFieldItem
                    key={field.id}
                    id={field.id}
                    field={field}
                    index={index}
                    isEditing={editingFieldIndex === index}
                    currentEditValues={
                      editingFieldIndex === index ? currentEditValues : null
                    }
                    onStartEdit={() => handleStartEdit(index, field)}
                    onCancelEdit={handleCancelEdit}
                    onSaveEdit={() => handleSaveEdit(index)}
                    onLabelChange={handleCurrentEditLabelChange}
                    onTypeChange={handleCurrentEditTypeChange}
                    onRemove={() => removeIntakeField(index)}
                    getFieldTypeDisplayName={getFieldTypeDisplayName}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {!isAddingField && (
              <button
                onClick={() => {
                  setIsAddingField(true);
                  setEditingFieldIndex(null); // Cancel any ongoing edit when starting to add a new field
                }}
                className="w-full flex items-center justify-center mt-3 p-2 border-2 border-dashed rounded-lg text-blue-600 border-blue-300 bg-blue-50 hover:bg-blue-50 transition-colors"
                disabled={editingFieldIndex !== null} // Disable if an edit is in progress
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                Add information field
              </button>
            )}

            {isAddingField && (
              <div className="p-3 border-dashed border-2 border-gray-300 rounded-md bg-white space-y-3 mt-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-0.5">
                    New Field Label
                  </label>
                  <input
                    type="text"
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    placeholder="e.g., Company Name"
                    className="w-full p-2 border border-gray-300 rounded-md sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-0.5">
                    New Field Type
                  </label>
                  <select
                    value={newFieldType}
                    onChange={(e) =>
                      setNewFieldType(e.target.value as IntakeField["type"])
                    }
                    className="w-full p-2 border border-gray-300 rounded-md sm:text-sm bg-white"
                  >
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="int">Number</option>
                    <option value="date">Date</option>
                    <option value="boolean">Yes/No</option>
                    {/* <option value="select">Select</option> */}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setIsAddingField(false)}
                    className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md border"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={triggerAddIntakeField}
                    className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md font-medium"
                    // disabled={isSubmittingField} // Removed
                  >
                    {/* {isSubmittingField ? (
                        <Loader2 className="animate-spin h-4 w-4" />
                    ) : ( */}
                    Add Field
                    {/* )} */}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
// END: DownloadFileSettings Component

// START: RequestCallbackSettings Component
interface RequestCallbackSettingsProps {
  config: RequestCallbackConfig;
  onChange: (newConfig: RequestCallbackConfig) => void;
}

const RequestCallbackSettings: React.FC<RequestCallbackSettingsProps> = ({
  config,
  onChange,
}) => {
  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<IntakeField["type"]>("text");
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(
    null
  );
  const [currentEditValues, setCurrentEditValues] = useState<{
    label: string;
    type: IntakeField["type"];
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 100, tolerance: 5 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && config.intakeFields) {
      const oldIndex = config.intakeFields.findIndex((f) => f.id === active.id);
      const newIndex = config.intakeFields.findIndex((f) => f.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedFields = arrayMove(
          [...config.intakeFields],
          oldIndex,
          newIndex
        );
        onChange({ ...config, intakeFields: reorderedFields });
        if (editingFieldIndex === oldIndex) {
          setEditingFieldIndex(newIndex);
        } else if (editingFieldIndex !== null) {
          if (
            oldIndex < newIndex &&
            editingFieldIndex > oldIndex &&
            editingFieldIndex <= newIndex
          ) {
            setEditingFieldIndex(editingFieldIndex - 1);
          } else if (
            oldIndex > newIndex &&
            editingFieldIndex >= newIndex &&
            editingFieldIndex < oldIndex
          ) {
            setEditingFieldIndex(editingFieldIndex + 1);
          }
        }
        // No backend call here
      }
    }
  };

  const triggerAddIntakeField = () => {
    // No longer async
    if (!newFieldLabel.trim()) {
      alert("Field label cannot be empty.");
      return;
    }
    const newField: IntakeField = {
      id: `temp-cb-${Date.now().toString()}`, // Temporary frontend ID
      label: newFieldLabel,
      type: newFieldType,
      required: true,
    };
    const updatedFields = [...(config.intakeFields || []), newField];
    onChange({ ...config, intakeFields: updatedFields, collectInfo: true });
    setNewFieldLabel("");
    setNewFieldType("text");
    setIsAddingField(false);
    // No backend call here
  };

  const handleIntakeFieldRequiredChange = (
    index: number,
    newRequiredState: boolean
  ) => {
    // No longer async
    if (!config.intakeFields) return;

    const updatedFields = config.intakeFields.map((field, i) =>
      i === index ? { ...field, required: newRequiredState } : field
    );
    onChange({ ...config, intakeFields: updatedFields });
    // No backend call here
  };

  const removeIntakeField = (indexToRemove: number) => {
    // No longer async
    if (!config.intakeFields) return;
    if (editingFieldIndex === indexToRemove) {
      handleCancelEdit();
    }
    const remainingFields = config.intakeFields.filter(
      (_, i) => i !== indexToRemove
    );
    onChange({ ...config, intakeFields: remainingFields });
    // No backend call here
  };

  const handleSaveEdit = (index: number) => {
    // No longer async
    if (
      !currentEditValues ||
      !currentEditValues.label.trim() ||
      !config.intakeFields
    ) {
      alert("Label cannot be empty.");
      return;
    }
    const fieldToUpdate = config.intakeFields[index]; // Get the original field to keep its ID

    const updatedFields = config.intakeFields.map((field, i) =>
      i === index
        ? {
            ...fieldToUpdate,
            label: currentEditValues.label,
            type: currentEditValues.type,
          }
        : field
    );
    onChange({ ...config, intakeFields: updatedFields });
    setEditingFieldIndex(null);
    setCurrentEditValues(null);
    // No backend call here
  };

  const handleButtonTextChange = (text: string) => {
    onChange({ ...config, buttonText: text });
  };

  const handleStartEdit = (index: number, field: IntakeField) => {
    setEditingFieldIndex(index);
    setCurrentEditValues({ label: field.label, type: field.type });
    setIsAddingField(false); // Ensure "add field" UI is hidden
  };

  const handleCancelEdit = () => {
    setEditingFieldIndex(null);
    setCurrentEditValues(null);
  };

  const handleCurrentEditLabelChange = (newLabel: string) => {
    if (currentEditValues) {
      setCurrentEditValues({ ...currentEditValues, label: newLabel });
    }
  };

  const handleCurrentEditTypeChange = (newType: IntakeField["type"]) => {
    if (currentEditValues) {
      setCurrentEditValues({ ...currentEditValues, type: newType });
    }
  };

  // Helper to get display name for type
  const getFieldTypeDisplayName = (type: IntakeField["type"]) => {
    switch (type) {
      case "text":
        return "Text";
      case "email":
        return "Email";
      case "phone":
        return "Phone";
      case "int":
        return "Number";
      case "date":
        return "Date";
      case "boolean":
        return "Yes/No";
      // case "select":
      //   return "Select";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  return (
    <div className="mt-3 p-4 py-6 bg-gray-50 rounded-md border space-y-4">
      {/* <div>
        <label htmlFor="callbackName" className="block text-sm font-semibold text-gray-800 mb-1">
          Name
        </label>
        <input
          type="text"
          id="callbackName"
          value={config.name || ""}
          onChange={(e) => onChange({ ...config, name: e.target.value })}
          placeholder="e.g. Chat Agent Name - Callback"
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div> */}
      <div>
        <label
          htmlFor="callbackButtonText"
          className="block text-sm font-semibold text-gray-800 mb-1"
        >
          Button Label
        </label>
        <input
          type="text"
          id="callbackButtonText"
          value={config.buttonText || ""}
          onChange={(e) => handleButtonTextChange(e.target.value)}
          placeholder="e.g. Request a Callback"
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-500">
          Collect information from visitors when they request a callback
        </h3>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={(config.intakeFields || []).map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            {(config.intakeFields || []).map((field, index) => (
              <SortableIntakeFieldItem
                key={field.id}
                id={field.id}
                field={field}
                index={index}
                isEditing={editingFieldIndex === index}
                currentEditValues={
                  editingFieldIndex === index ? currentEditValues : null
                }
                onStartEdit={() => handleStartEdit(index, field)}
                onCancelEdit={handleCancelEdit}
                onSaveEdit={() => handleSaveEdit(index)}
                onLabelChange={handleCurrentEditLabelChange}
                onTypeChange={handleCurrentEditTypeChange}
                onRemove={() => removeIntakeField(index)}
                getFieldTypeDisplayName={getFieldTypeDisplayName}
                onRequiredChange={(newRequiredState) =>
                  handleIntakeFieldRequiredChange(index, newRequiredState)
                }
                showRequiredToggle={true} // Prop to show the required toggle
              />
            ))}
          </SortableContext>
        </DndContext>

        {!isAddingField && (
          <button
            onClick={() => {
              setIsAddingField(true);
              setEditingFieldIndex(null);
            }}
            className="w-full flex items-center justify-center mt-3 p-2 border-2 border-dashed rounded-lg text-blue-600 border-blue-300 bg-blue-50 hover:bg-blue-100 transition-colors"
            disabled={editingFieldIndex !== null}
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Add field
          </button>
        )}

        {isAddingField && (
          <div className="p-3 border-dashed border-2 border-gray-300 rounded-md bg-white space-y-3 mt-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-0.5">
                New Field Label
              </label>
              <input
                type="text"
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                placeholder="e.g., Preferred Contact Time"
                className="w-full p-2 border border-gray-300 rounded-md sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-0.5">
                New Field Type
              </label>
              <select
                value={newFieldType}
                onChange={(e) =>
                  setNewFieldType(e.target.value as IntakeField["type"])
                }
                className="w-full p-2 border border-gray-300 rounded-md sm:text-sm bg-white"
              >
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="int">Number</option>
                <option value="date">Date</option>
                <option value="boolean">Yes/No</option>
                {/* <option value="select">Select</option> */}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setIsAddingField(false)}
                className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md border"
              >
                Cancel
              </button>
              <button
                onClick={triggerAddIntakeField}
                className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md font-medium"
                // disabled={isSubmittingField} // Removed
              >
                {/* {isSubmittingField ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                ) : ( */}
                Add Field
                {/* )} */}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
// END: RequestCallbackSettings Component

interface Step3FormProps {
  formData: ChatbotFormData;
  intakeForms: IntakeForm[];
  setFormData: React.Dispatch<React.SetStateAction<ChatbotFormData>>;
  currentStep: number;
  handleGreetingMessageChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleQuickActionToggle: (index: number, enabled: boolean) => void;
  expandedActionIndexes: number[];
  handleToggleExpandAction: (index: number) => void;
  handleQuickActionConfigChange: (
    actionIndex: number,
    configProperty: keyof QuickActionItem,
    newConfig: any
  ) => void;
  handleAgentInstructionsChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleBack: () => void;
  isSubmitting: boolean;
  handleSubmit: () => void;
  editChatbotId: string | null;
  calendlyConnection: {
    connected: boolean;
    connectionDetails?: any;
  } | null;
  checkCalendlyConnection: () => void;
  isCheckingCalendly: boolean;
  handleQuickActionsDragEnd: (event: DragEndEvent) => void;
  isMobile: boolean;
  setIsPreviewModalOpen: (isOpen: boolean) => void;
  isPreviewModalOpen: boolean;
  googleCalendarConnection: {
    connected: boolean;
    connectionDetails?: any;
  } | null;
  checkGoogleCalendarConnection: () => void;
  isCheckingGoogleCalendar: boolean;
  calComConnection: {
    connected: boolean;
    connectionDetails?: any;
  } | null;
  isCheckingCalCom: boolean;
  checkCalComConnection: () => void;
  chatOnboarding: boolean;
}

export const SortableQuickActionItem: React.FC<{
  action: QuickActionItem;
  index: number;
  expandedActionIndexes: number[];
  handleToggleExpandAction: (index: number) => void;
  handleQuickActionToggle: (index: number, enabled: boolean) => void;
  calendlyConnection: {
    connected: boolean;
    connectionDetails?: any;
  } | null;
  handleQuickActionConfigChange: (
    actionIndex: number,
    configProperty: keyof QuickActionItem,
    newConfig: any
  ) => void;
  checkCalendlyConnection: () => void;
  isCheckingCalendly: boolean;
  googleCalendarConnection: {
    connected: boolean;
    connectionDetails?: any;
  } | null;
  checkGoogleCalendarConnection: () => void;
  isCheckingGoogleCalendar: boolean;
  calComConnection: {
    connected: boolean;
    connectionDetails?: any;
  } | null;
  isCheckingCalCom: boolean;
  checkCalComConnection: () => void;
}> = ({
  action,
  index,
  expandedActionIndexes,
  handleToggleExpandAction,
  handleQuickActionToggle,
  handleQuickActionConfigChange,
  calendlyConnection,
  checkCalendlyConnection,
  isCheckingCalendly,
  googleCalendarConnection,
  checkGoogleCalendarConnection,
  isCheckingGoogleCalendar,
  calComConnection,
  isCheckingCalCom,
  checkCalComConnection,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: action.type,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || undefined,
    zIndex: isDragging ? 10 : "auto",
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border rounded-lg bg-white shadow-sm hover:cursor-pointer"
      onClick={() => handleToggleExpandAction(index)}
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <span
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none p-1"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-5 h-5 text-gray-400" />
          </span>
          <div className="flex items-center space-x-3">
            <span className="flex items-center justify-center bg-blue-100 rounded-full p-2">
              {action.icon && <action.icon className="w-5 h-5 text-blue-600" />}
            </span>
            <span className="font-medium">{action.label}</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleQuickActionToggle(index, !action.enabled);
            }}
            className={`${
              action.enabled ? "bg-blue-600" : "bg-gray-200"
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 no-min-size`}
            role="switch"
            aria-checked={action.enabled}
          >
            <span
              aria-hidden="true"
              className={`${
                action.enabled ? "translate-x-5" : "translate-x-0"
              } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </button>
          <div>
            {expandedActionIndexes.includes(index) ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>
      {expandedActionIndexes.includes(index) && action.enabled && (
        <div className="p-4 py-6 border-t" onClick={(e) => e.stopPropagation()}>
          {action.type === "quick_reply" && action.quickReplyConfig && (
            <QuickReplySettings
              config={action.quickReplyConfig}
              onChange={(newConfig) =>
                handleQuickActionConfigChange(
                  index,
                  "quickReplyConfig",
                  newConfig
                )
              }
            />
          )}
          {action.type === "schedule_call" && action.scheduleCallConfig && (
            <ScheduleCallSettings
              config={action.scheduleCallConfig}
              calendlyConnection={calendlyConnection}
              googleCalendarConnection={googleCalendarConnection}
              onChange={(newConfig) =>
                handleQuickActionConfigChange(
                  index,
                  "scheduleCallConfig",
                  newConfig
                )
              }
              onRefreshStatus={checkCalendlyConnection}
              isCheckingStatus={isCheckingCalendly}
              isCheckingGoogleCalendar={isCheckingGoogleCalendar}
              checkGoogleCalendarConnection={checkGoogleCalendarConnection}
              calComConnection={calComConnection}
              isCheckingCalCom={isCheckingCalCom}
              checkCalComConnection={checkCalComConnection}
            />
          )}
          {action.type === "link_to_url" && action.linkToURLConfig && (
            <LinkToURLSettings
              config={action.linkToURLConfig}
              onChange={(newConfig) =>
                handleQuickActionConfigChange(
                  index,
                  "linkToURLConfig",
                  newConfig
                )
              }
            />
          )}
          {action.type === "download_file" && action.downloadFileConfig && (
            <DownloadFileSettings
              config={action.downloadFileConfig}
              onChange={(newConfig) =>
                handleQuickActionConfigChange(
                  index,
                  "downloadFileConfig",
                  newConfig
                )
              }
            />
          )}
          {action.type === "request_callback" &&
            action.requestCallbackConfig && (
              <RequestCallbackSettings
                config={action.requestCallbackConfig}
                onChange={(newConfig) =>
                  handleQuickActionConfigChange(
                    index,
                    "requestCallbackConfig",
                    newConfig
                  )
                }
              />
            )}
        </div>
      )}
    </div>
  );
};

const Step3Form: React.FC<Step3FormProps> = ({
  formData,
  intakeForms,
  setFormData,
  currentStep,
  handleGreetingMessageChange,
  handleQuickActionToggle,
  expandedActionIndexes,
  handleToggleExpandAction,
  handleQuickActionConfigChange,
  handleAgentInstructionsChange,
  handleBack,
  isSubmitting,
  handleSubmit,
  editChatbotId,

  // Calendly
  calendlyConnection,
  checkCalendlyConnection,
  isCheckingCalendly,

  // Google Calendar
  googleCalendarConnection,
  checkGoogleCalendarConnection,
  isCheckingGoogleCalendar,

  // Cal.com
  calComConnection,
  isCheckingCalCom,
  checkCalComConnection,

  handleQuickActionsDragEnd,
  isMobile,
  setIsPreviewModalOpen,
  isPreviewModalOpen,
  chatOnboarding,
}) => {
  const [showAllQuickActions, setShowAllQuickActions] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Wrapper to handle auto-expansion when toggling hidden actions
  const handleQuickActionToggleWithExpansion = (
    index: number,
    enabled: boolean
  ) => {
    if (enabled) {
      // Event 1: Expand the individual item to show settings
      if (!expandedActionIndexes.includes(index)) {
        handleToggleExpandAction(index);
      }
      // Event 2: Do what "Show more" button does (expand the list)
      if (!showAllQuickActions && formData.quickActions.length > 2) {
        setShowAllQuickActions(true);
      }
    }
    // Call the parent's toggle handler
    handleQuickActionToggle(index, enabled);
  };

  const handleSelectIntakeForm = (form: IntakeForm) => {
    setFormData((prev) => ({
      ...prev,
      useIntakeForm: true,
      selectedIntakeFormId: form.id,
    }));
  };

  const selectedForm = formData.selectedIntakeFormId
    ? intakeForms.find((f) => f.id === formData.selectedIntakeFormId)
    : null;

  let quickReplyConfig = null;
  let scheduleCallConfig = null;
  let downloadFileConfig = null;
  let requestCallbackConfig = null;
  let linkToURLConfig = null;

  for (const action of formData.quickActions) {
    if (!action.enabled) {
      continue;
    }

    switch (action.type) {
      case "quick_reply":
        quickReplyConfig = action.quickReplyConfig;
        break;
      case "schedule_call":
        scheduleCallConfig = action.scheduleCallConfig;
        break;
      case "download_file":
        downloadFileConfig = action.downloadFileConfig;
        break;
      case "request_callback":
        requestCallbackConfig = action.requestCallbackConfig;
        break;
      case "link_to_url":
        linkToURLConfig = action.linkToURLConfig;
        break;
    }
  }

  return (
    <>
      <div className={styles.formGroup}>
        <div className="flex flex-row gap-8 w-full">
          <div className={`w-1/2 ${isMobile ? "w-full" : ""}`}>
            <div className={styles.formGroup}>
              <h1 className="text-md font-semibold text-gray-900">
                Greeting Message
              </h1>
              <p className="text-sm text-gray-600 mb-2">
                This is the first message visitors will see when they open your
                chat agent.
              </p>
              <textarea
                id="shortMessage"
                name="shortMessage"
                value={formData.greetingMessage.shortMessage}
                onChange={handleGreetingMessageChange}
                placeholder="Enter short greeting message"
                className={styles.formControl}
                rows={2}
              />
            </div>

            <div className={styles.formGroup}>
              <h1 className="text-md font-semibold text-gray-900">
                Greeting Subtitle
              </h1>
              <p className="text-sm text-gray-600 mb-2">
                More context or information under your greeting.
              </p>
              <textarea
                id="longMessage"
                name="longMessage"
                value={formData.greetingMessage.longMessage}
                onChange={handleGreetingMessageChange}
                placeholder="Enter long greeting message"
                className={styles.formControl}
                rows={4}
              />
            </div>
            <div className={styles.formGroup}>
              <h1 className="text-md font-semibold text-gray-900">
                Response Style
              </h1>
              <p className="text-sm text-gray-600 mb-2">
                Choose how your chat agent delivers its responses.
              </p>
              <div className="p-5 rounded-lg">
                <ResponseStyle
                  streamResponse={formData.streamResponse}
                  onStreamResponseChange={(value) => {
                    setFormData((prev) => ({ ...prev, streamResponse: value }));
                  }}
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <h1 className="text-md font-semibold text-gray-900">
                Quick Actions{" "}
                <span className="text-gray-500 text-sm">(Optional)</span>
              </h1>
              <p className="text-sm text-gray-600 mb-2">
                These are suggested actions visitors can select with a single
                click.
              </p>
              {!formData.popupGreet && (
                <div className="p-3 mb-4 text-sm text-yellow-800 bg-yellow-50 rounded-lg border border-yellow-200 flex items-center">
                  <Info className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span>
                    Quick Actions require pop-up greetings to be enabled.
                  </span>
                </div>
              )}
              <div
                className={`relative ${
                  !formData.popupGreet ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <div
                  className={`space-y-3 overflow-hidden transition-all duration-300 ease-in-out ${
                    !showAllQuickActions && formData.quickActions.length > 2
                      ? "max-h-[460px]"
                      : "max-h-fit"
                  }`}
                >
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleQuickActionsDragEnd}
                  >
                    <SortableContext
                      items={formData.quickActions.map((a) => a.type)}
                      strategy={verticalListSortingStrategy}
                    >
                      {formData.quickActions.map((action, index) => (
                        <SortableQuickActionItem
                          key={action.type}
                          action={action}
                          index={index}
                          expandedActionIndexes={expandedActionIndexes}
                          handleToggleExpandAction={handleToggleExpandAction}
                          handleQuickActionToggle={
                            handleQuickActionToggleWithExpansion
                          }
                          handleQuickActionConfigChange={
                            handleQuickActionConfigChange
                          }
                          calendlyConnection={calendlyConnection}
                          checkCalendlyConnection={checkCalendlyConnection}
                          isCheckingCalendly={isCheckingCalendly}
                          googleCalendarConnection={googleCalendarConnection}
                          checkGoogleCalendarConnection={
                            checkGoogleCalendarConnection
                          }
                          isCheckingGoogleCalendar={isCheckingGoogleCalendar}
                          calComConnection={calComConnection}
                          isCheckingCalCom={isCheckingCalCom}
                          checkCalComConnection={checkCalComConnection}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
                {!showAllQuickActions && formData.quickActions.length > 2 && (
                  <>
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent pointer-events-none backdrop-blur-sm"></div>
                    <div className="absolute bottom-5 w-full flex justify-center pointer-events-none">
                      <button
                        onClick={() => setShowAllQuickActions(true)}
                        className="bg-white border border-gray-200 rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm flex items-center gap-1 pointer-events-auto"
                      >
                        Show more <ChevronDown size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
              {showAllQuickActions && formData.quickActions.length > 2 && (
                <div className="w-full flex justify-center mt-3">
                  <button
                    onClick={() => setShowAllQuickActions(false)}
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1"
                  >
                    Show less <ChevronUp size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <h1 className="text-md font-semibold text-gray-900">
                Instructions / Prompt{" "}
                <span className="text-gray-500 text-sm">(Optional)</span>
              </h1>
              <p className="text-sm text-gray-600 mb-2">
                Set the prompt the agent will follow in every reply to match
                your tone, goals, and context.
              </p>
              <div className="relative">
                <textarea
                  id="agentInstructions"
                  name="agentInstructions"
                  value={formData.agentInstructions}
                  onChange={handleAgentInstructionsChange}
                  placeholder="Enter instructions"
                  className={`${styles.formControl} pb-28`}
                  rows={8}
                />
                <div className="pointer-events-none absolute inset-x-3 bottom-6 flex flex-wrap w-fit gap-2">
                  <button
                    type="button"
                    className={`whitespace-nowrap pointer-events-auto px-2.5 py-1 text-sm rounded-full border shadow-sm backdrop-blur ${
                      formData.agentInstructions
                        .trim()
                        .startsWith(
                          "You are a natural, conversational human assistant."
                        )
                        ? "text-blue-600 border-blue-300 bg-blue-50"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        agentInstructions: [
                          "You are a natural, conversational human assistant.",
                          "Your personality is calm, genuine, and emotionally aware. You sound like a real person, not a bot.",
                          "",
                          "- Keep replies short (under 2-3 sentences) in everyday language.",
                          "- Use warmth, empathy, and light humor naturally.",
                          '- Avoid robotic phrasing like "As an AI..." or "I\'m not sure about that."',
                          "- Listen actively and answer as a thoughtful human would.",
                          "",
                          "Goal: build trust fast, explain clearly, and help users take simple next steps (try the product, book a demo, or learn more).",
                          "Tone anchors: Natural, empathetic, calm, trustworthy.",
                        ].join("\n"),
                      }))
                    }
                  >
                    Natural & Human-like
                  </button>
                  <button
                    type="button"
                    className={`whitespace-nowrap pointer-events-auto px-2.5 py-1 text-sm rounded-full border shadow-sm backdrop-blur ${
                      formData.agentInstructions
                        .trim()
                        .startsWith(
                          "You are a friendly, helpful assistant with a cheerful personality."
                        )
                        ? "text-blue-600 border-blue-300 bg-blue-50"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        agentInstructions: [
                          "You are a friendly, helpful assistant with a cheerful personality.",
                          "",
                          "- Keep replies positive, empathetic, and easy to understand.",
                          "- Guide users toward the right solution without being pushy.",
                          "- Be engaging, confident, and human — like a trusted colleague.",
                          "- Build trust first, then suggest clear next steps.",
                          "- Use conversational sentences under 2-3 lines.",
                          '- Offer next steps ("You can try it here..." / "Let me guide you...").',
                          "- When users are confused or frustrated, stay patient and reassuring.",
                        ].join("\n"),
                      }))
                    }
                  >
                    Helpful & Professional
                  </button>
                  <button
                    type="button"
                    className={`whitespace-nowrap pointer-events-auto px-2.5 py-1 text-sm rounded-full border shadow-sm backdrop-blur ${
                      formData.agentInstructions
                        .trim()
                        .startsWith(
                          "You are a persuasive, conversational sales assistant."
                        )
                        ? "text-blue-600 border-blue-300 bg-blue-50"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        agentInstructions: [
                          "You are a persuasive, conversational sales assistant.",
                          "",
                          "- Speak like a real person who understands users' needs.",
                          "- Highlight benefits clearly and factually; be trustworthy.",
                          "- Keep answers short and to the point; reinforce key differentiators.",
                          "- Handle objections respectfully, focusing on ROI.",
                          "- Reframe around ROI, efficiency, and ease of setup.",
                          "",
                          "Your job: build credibility through clarity and confidence — like a trusted advisor, not a sales rep.",
                          "Tone anchors: Clear, confident, credible, professional.",
                        ].join("\n"),
                      }))
                    }
                  >
                    Persuasive & Sales-Oriented
                  </button>
                </div>
              </div>
            </div>
          </div>

          {!isMobile && (
            <div className="w-1/2 flex-shrink-0 self-end sticky bottom-[150px]">
              <div className="scale-[0.85] origin-bottom-right h-full">
                <ChatbotWidgetPreview
                  quickReplyConfig={quickReplyConfig}
                  scheduleCallConfig={scheduleCallConfig}
                  downloadFileConfig={downloadFileConfig}
                  requestCallbackConfig={requestCallbackConfig}
                  linkToURLConfig={linkToURLConfig}
                  greetingMessage={{
                    shortMessage:
                      formData.greetingMessage.shortMessage ||
                      "Welcome to our website! 👋",
                    longMessage: formData.greetingMessage.longMessage || "",
                  }}
                  quickActions={formData.quickActions}
                  popupStyle={formData.popupStyle}
                  persona={{
                    name: formData.persona.name,
                    picture: formData.persona.picture,
                  }}
                  brandColor={formData.brandColor}
                  popupGreet={formData.popupGreet}
                  showWatermark={formData.showWatermark}
                  streamResponse={formData.streamResponse}
                  chatIcon={formData.chatIcon}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {isMobile && isPreviewModalOpen && (
        <motion.div
          className={`fixed transform bottom-6 right-6 scale-[0.9] origin-bottom-right`}
        >
          <ChatbotWidgetPreview
            showWatermark={formData.showWatermark}
            popupGreet={formData.popupGreet}
            quickReplyConfig={quickReplyConfig}
            scheduleCallConfig={scheduleCallConfig}
            streamResponse={formData.streamResponse}
            greetingMessage={{
              shortMessage:
                formData.greetingMessage.shortMessage ||
                "Welcome to our website! 👋",
              longMessage: formData.greetingMessage.longMessage || "",
            }}
            downloadFileConfig={downloadFileConfig}
            requestCallbackConfig={requestCallbackConfig}
            linkToURLConfig={linkToURLConfig}
            quickActions={formData.quickActions}
            popupStyle={formData.popupStyle}
            persona={{
              name: formData.persona.name,
              picture: formData.persona.picture,
            }}
            brandColor={formData.brandColor}
            chatIcon={formData.chatIcon}
          />
        </motion.div>
      )}
    </>
  );
};

export const ChatbotForm = ({
  setActiveView,
  editChatbotId,
  onClose,
}: {
  setActiveView: (view: string) => void;
  editChatbotId: string | null;
  onClose: () => void;
}) => {
  const navigate = useNavigate();
  const app = useAppBridge();
  // Type guard: Redirect expects a ClientApplication; cast to any to satisfy types in this mixed env
  const appRedirect = Redirect.create(app as any);
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [shopDomain, setShopDomain] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings", { credentials: "include" });
        const data = await res.json();
        setWorkspaceId(data?.workspace_id ?? "");
        setShopDomain(data?.shop_domain ?? "");
      } catch (e) {
        console.error("Failed to load app settings:", e);
      }
    })();
  }, []);

  const [isSuccessPopupOpen, setIsSuccessPopupOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [intakeForms, setIntakeForms] = useState<IntakeForm[]>([]);
  const [expandedActionIndexes, setExpandedActionIndexes] = useState<number[]>(
    []
  );
  const [selectedDownloadableFile, setSelectedDownloadableFile] = useState<{
    actionIndex: number;
    file: File;
  } | null>(null);
  const [calendlyConnection, setCalendlyConnection] = useState<{
    connected: boolean;
    connectionDetails?: any;
  } | null>(null);
  const [isCheckingCalendly, setIsCheckingCalendly] = useState(false);
  const [calComConnection, setCalComConnection] = useState<{
    connected: boolean;
    connectionDetails?: any;
  } | null>(null);
  const [isCheckingCalCom, setIsCheckingCalCom] = useState(false);

  const [googleCalendarConnection, setGoogleCalendarConnection] = useState<{
    connected: boolean;
    connectionDetails?: any;
  } | null>(null);
  const [isCheckingGoogleCalendar, setIsCheckingGoogleCalendar] =
    useState(false);

  const [isAvatarSelectionModalOpen, setIsAvatarSelectionModalOpen] =
    useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [chatOnboarding, setChatOnboarding] = useState(false);

  const [exitAllowed, setExitAllowed] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<
    (() => void) | null
  >(null);

  // Helper: get Central access token; if expired/missing, redirect to "/" to relogin
  const getCentralAccessTokenOrRedirect = async (): Promise<string | null> => {
    try {
      // We no longer fetch tokens directly from Supabase on the client.
      // The backend proxies handle token presence/refresh; just ensure session is valid.
      // If settings call failed earlier, appRedirect would handle it.
      return "ok"; // placeholder non-null to proceed with proxy calls
    } catch {
      appRedirect.dispatch(Redirect.Action.APP, "/");
      return null;
    }
  };

  // START: Initial Quick Actions State
  const initialQuickActions: QuickActionItem[] = [
    {
      type: "quick_reply",
      label: "Quick Questions",
      enabled: true,
      icon: ListChecks,
      quickReplyConfig: {
        quickReplies: [
          { buttonText: "About our products" },
          { buttonText: "Talk to an agent" },
        ],
      },
    },
    {
      type: "schedule_call",
      label: "Schedule Call",
      enabled: false,
      icon: CalendarDays,
      scheduleCallConfig: {
        provider: "calendly",
        buttonText: "Schedule a Call",
        bookingLink: "",
      },
    },
    {
      type: "download_file",
      label: "Download File",
      enabled: false,
      icon: Download,
      downloadFileConfig: {
        name: "Chat Agent Name - Download",
        buttonText: "Download Whitepaper",
        fileLink: "",
        fileName: "",
        collectInfo: true,
        intakeFields: [
          {
            id: `dl-temp-name-${Date.now()}`,
            label: "Name",
            type: "text",
            required: true,
          },
          {
            id: `dl-temp-email-${Date.now() + 1}`,
            label: "Email",
            type: "email",
            required: true,
          },
        ],
      },
    },
    {
      type: "request_callback",
      label: "Request Callback",
      enabled: false,
      icon: Phone,
      requestCallbackConfig: {
        name: "Chat Agent Name - Callback",
        buttonText: "Request a Callback",
        collectInfo: true,
        intakeFields: [
          {
            id: `cb-temp-name-${Date.now()}`,
            label: "Name",
            type: "text",
            required: true,
          },
          {
            id: `cb-temp-phone-${Date.now() + 1}`,
            label: "Mobile Number",
            type: "phone",
            required: true,
          },
        ],
      },
    },
    {
      type: "link_to_url",
      label: "Link to URL",
      enabled: false,
      icon: LinkIcon,
      linkToURLConfig: { buttonText: "Learn More", url: "" },
    },
  ];

  // END: Initial Quick Actions State
  const [formData, setFormData] = useState<ChatbotFormData>({
    chatbotPurpose: {
      welcome: false,
      lead_generation: false,
      post_sales: false,
      pre_sales: false,
    },
    popupGreet: true,
    popupStyle: "bold_compact",
    greetingMessage: {
      shortMessage: "Welcome to our website! 👋",
      longMessage: "We're glad you're here. How can we help you today?",
    },
    quickActions: initialQuickActions,
    persona: {
      name: "AI Assistant",
      picture:
        "https://ik.imagekit.io/lgeusmxypd/chatbots/avatars/c2b351c3-b115-4e78-ad70-8d77e7b9c441.png",
    },
    brandColor: "#289EFD",
    chatIcon:
      "https://ik.imagekit.io/lgeusmxypd/chatbots/icons/Icon-1.png?updatedAt=1754846330101",
    useIntakeForm: false,
    selectedIntakeFormId: null,
    agentInstructions:
      "You are a friendly and helpful assistant with personality.",
    showWatermark: true,
    streamResponse: true,
    delayPopupTime: 0,
    agentLanguage: "English",
  });

  useEffect(() => {
    checkCalendlyConnection();
    checkGoogleCalendarConnection();
    checkCalComConnection();
    const urlParams = new URLSearchParams(window.location.search);
    setChatOnboarding(urlParams.get("chatOnboarding") === "true");
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;

    if (editChatbotId) {
      fetchChatbot(editChatbotId);
    } else {
      setExpandedActionIndexes([0]);
      setIsLoading(false);
    }
  }, [editChatbotId, workspaceId]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPreviewModalOpen(true);
    }, 30000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Scroll to top when step changes (especially important for mobile/Android)
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  const fetchChatbot = async (chatbotId: string) => {
    if (!chatbotId) {
      setExpandedActionIndexes([0]);
      return;
    }
    setIsLoading(true);

    try {
      const response = await axios.get(
        `/api/central/chatbot/${chatbotId}?workspace_id=${workspaceId}&shop=${shopDomain}`,
        {}
      );

      if (response.status === 200) {
        const data = response.data;

        console.log(data, "✅✅✅");

        const fetchedBackendActions = data.quickActions || [];

        const quickActionPromises = initialQuickActions.map(
          async (initialAction) => {
            const backendAction = fetchedBackendActions.find(
              (ba: QuickActionItem) => ba.type === initialAction.type
            );

            if (backendAction && backendAction.enabled) {
              let fullAction = JSON.parse(JSON.stringify(initialAction));
              fullAction.enabled = true;
              fullAction.icon = initialAction.icon;

              if (backendAction.quickReplyConfig) {
                fullAction.quickReplyConfig = {
                  ...initialAction.quickReplyConfig,
                  ...backendAction.quickReplyConfig,
                  quickReplies:
                    backendAction.quickReplyConfig.quickReplies ||
                    initialAction.quickReplyConfig?.quickReplies ||
                    [],
                };
              }
              if (backendAction.scheduleCallConfig) {
                const { bookingLink, ...restOfConfig } =
                  backendAction.scheduleCallConfig;
                fullAction.scheduleCallConfig = {
                  ...initialAction.scheduleCallConfig,
                  ...restOfConfig,
                };
              }

              if (backendAction.linkToURLConfig) {
                fullAction.linkToURLConfig = {
                  ...initialAction.linkToURLConfig,
                  ...backendAction.linkToURLConfig,
                };
              }
              return fullAction;
            } else {
              return { ...initialAction };
            }
          }
        );

        const mergedQuickActions = await Promise.all(quickActionPromises);

        const orderedTypes = fetchedBackendActions.map(
          (a: QuickActionItem) => a.type
        );
        mergedQuickActions.sort((a, b) => {
          const indexA = orderedTypes.indexOf(a.type);
          const indexB = orderedTypes.indexOf(b.type);

          if (indexA === -1 && indexB === -1) {
            return 0;
          }
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;

          return indexA - indexB;
        });

        const fetchedFormData: ChatbotFormData = {
          chatbotPurpose: {
            welcome: data.chatbotPurpose?.includes("welcome") || false,
            lead_generation:
              data.chatbotPurpose?.includes("lead_generation") || false,
            post_sales: data.chatbotPurpose?.includes("post_sales") || false,
            pre_sales: data.chatbotPurpose?.includes("pre_sales") || false,
          },
          popupGreet: data.popupGreet || false,
          popupStyle: data.popupStyle || "inviting_message",
          greetingMessage: data.greetingMessage || {
            shortMessage: "Welcome to our website! 👋",
            longMessage: "We're glad you're here. How can we help you today?",
          },
          quickActions: mergedQuickActions,
          persona: data.persona || {
            name: "AI Assistant",
            picture:
              "https://ik.imagekit.io/lgeusmxypd/chatbots/avatars/ChatGPT%20Image%20Apr%2029,%202025,%2009_53_33%20AM%20Small.png",
          },
          brandColor: data.brandColor || "#289EFD",
          chatIcon:
            data.chatIcon ||
            "https://ik.imagekit.io/lgeusmxypd/chatbots/icons/Icon-1.png?updatedAt=1754846330101",
          useIntakeForm: data.useIntakeForm || false,
          selectedIntakeFormId: data.intakeFormId || null,
          agentInstructions:
            data.agentInstructions ||
            "You are a friendly and helpful assistant with personality.",
          showWatermark: data.showWatermark ?? true,
          streamResponse: data.streamResponse ?? true,
          delayPopupTime: data.delayPopupTime ?? 5000,
          agentLanguage: data.agentLanguage || "English",
        };

        setFormData(fetchedFormData);

        const enabledActionIndexes = mergedQuickActions
          .map((action, index) => (action.enabled ? index : -1))
          .filter((index) => index !== -1);
        setExpandedActionIndexes(enabledActionIndexes);
      }
    } catch (error) {
      console.error("Failed to fetch chat agent data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "projectName") {
      setFormData((prev) => {
        const updatedQuickActions = prev.quickActions.map((action) => {
          if (action.type === "download_file" && action.downloadFileConfig) {
            const oldDefaultName = `${
              prev.persona.name || "Chat Agent Name"
            } - Download`;
            if (
              action.downloadFileConfig.name === oldDefaultName ||
              action.downloadFileConfig.name === "Chat Agent Name - Download"
            ) {
              return {
                ...action,
                downloadFileConfig: {
                  ...action.downloadFileConfig,
                  name: `${value || "Chat Agent Name"} - Download`,
                },
              };
            }
          }
          if (
            action.type === "request_callback" &&
            action.requestCallbackConfig
          ) {
            const oldDefaultName = `${
              prev.persona.name || "Chat Agent Name"
            } - Callback`;
            if (
              action.requestCallbackConfig.name === oldDefaultName ||
              action.requestCallbackConfig.name === "Chat Agent Name - Callback"
            ) {
              return {
                ...action,
                requestCallbackConfig: {
                  ...action.requestCallbackConfig,
                  name: `${value || "Chat Agent Name"} - Callback`,
                },
              };
            }
          }
          return action;
        });

        return {
          ...prev,
          persona: {
            ...prev.persona,
            name: value,
          },
          quickActions: updatedQuickActions,
        };
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handlePersonaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      persona: {
        ...prev.persona,
        [name]: value,
      },
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      chatbotPurpose: {
        ...prev.chatbotPurpose,
        [name]: checked,
      },
    }));
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    const processedValue = name === "popupGreet" ? value === "true" : value;
    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  const handleGreetingMessageChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      greetingMessage: {
        ...prev.greetingMessage,
        [name]: value,
      },
    }));
  };

  const handleFileSelect = (file: File | null | undefined) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result as string);
        setIsAvatarModalOpen(true);
        setIsAvatarSelectionModalOpen(false); // Close the selection modal
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files?.[0]);
    // Clear the input value so the same file can be selected again
    if (e.target) {
      e.target.value = "";
    }
  };

  const handleAvatarSave = (blob: Blob) => {
    if (blob) {
      const croppedImageFile = new File([blob], "avatar.png", {
        type: "image/png",
      });
      const imageUrl = URL.createObjectURL(croppedImageFile);
      setFormData((prev) => ({
        ...prev,
        persona: {
          ...prev.persona,
          picture: imageUrl,
        },
      }));
      setSelectedImageFile(croppedImageFile);
      setIsAvatarModalOpen(false);
      setImageToCrop(null);
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      brandColor: e.target.value,
    }));
  };

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep === 1) {
      setActiveView("manage-chatbots");
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleQuickActionsDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFormData((prev) => {
        const oldIndex = prev.quickActions.findIndex(
          (a) => a.type === active.id
        );
        const newIndex = prev.quickActions.findIndex((a) => a.type === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const reorderedActions = arrayMove(
            prev.quickActions,
            oldIndex,
            newIndex
          );

          const expandedTypes = expandedActionIndexes.map(
            (i) => prev.quickActions[i].type
          );
          const newExpandedIndexes = reorderedActions
            .map((action, index) =>
              expandedTypes.includes(action.type) ? index : -1
            )
            .filter((index) => index !== -1);

          setExpandedActionIndexes(newExpandedIndexes);

          return { ...prev, quickActions: reorderedActions };
        }
        return prev;
      });
    }
  };

  const handleQuickActionToggle = (index: number, enabled: boolean) => {
    setFormData((prev) => {
      const updatedQuickActions = prev.quickActions.map((action, i) => {
        if (i === index) {
          const newActionState = { ...action, enabled };
          if (enabled) {
            switch (newActionState.type) {
              case "schedule_call":
                // Config is guaranteed to exist from initial state.
                break;
              case "download_file":
                if (newActionState.downloadFileConfig) {
                  if (
                    newActionState.downloadFileConfig.name ===
                      "Chat Agent Name - Download" &&
                    prev.persona.name
                  ) {
                    newActionState.downloadFileConfig.name = `${prev.persona.name} - Download`;
                  }
                  if (
                    newActionState.downloadFileConfig.collectInfo &&
                    (!newActionState.downloadFileConfig.intakeFields ||
                      newActionState.downloadFileConfig.intakeFields.length ===
                        0)
                  ) {
                    // If collectInfo is true but fields are missing, add defaults
                    newActionState.downloadFileConfig.intakeFields = [
                      {
                        id: `temp-name-${Date.now()}`,
                        label: "Name",
                        type: "text",
                        required: true,
                      },
                      {
                        id: `temp-email-${Date.now() + 1}`,
                        label: "Email",
                        type: "email",
                        required: true,
                      },
                    ];
                  } else if (
                    !Array.isArray(
                      newActionState.downloadFileConfig.intakeFields
                    )
                  ) {
                    newActionState.downloadFileConfig.intakeFields = [];
                  }
                }
                break;
              case "quick_reply":
                // Config is guaranteed to exist from initial state.
                break;
              case "request_callback":
                if (newActionState.requestCallbackConfig) {
                  if (
                    newActionState.requestCallbackConfig.name ===
                      "Chat Agent Name - Callback" &&
                    prev.persona.name
                  ) {
                    newActionState.requestCallbackConfig.name = `${prev.persona.name} - Callback`;
                  }
                  // Ensure collectInfo and intakeFields are present and correctly typed
                  if (
                    newActionState.requestCallbackConfig.collectInfo ===
                    undefined
                  ) {
                    newActionState.requestCallbackConfig.collectInfo = true;
                  }
                  if (
                    !Array.isArray(
                      newActionState.requestCallbackConfig.intakeFields
                    ) ||
                    (newActionState.requestCallbackConfig.intakeFields
                      .length === 0 &&
                      newActionState.requestCallbackConfig.collectInfo)
                  ) {
                    newActionState.requestCallbackConfig.intakeFields = [
                      {
                        id: `cb-ensure-name-${Date.now()}`,
                        label: "Name",
                        type: "text",
                        required: true,
                      },
                      {
                        id: `cb-ensure-phone-${Date.now() + 1}`,
                        label: "Mobile Number",
                        type: "phone",
                        required: true,
                      },
                    ];
                  } else if (
                    newActionState.requestCallbackConfig.intakeFields.some(
                      (f) => typeof f === "string"
                    )
                  ) {
                    // If by some chance it's still string[], convert or reset
                    newActionState.requestCallbackConfig.intakeFields = [
                      {
                        id: `cb-fix-name-${Date.now()}`,
                        label: "Name",
                        type: "text",
                        required: true,
                      },
                      {
                        id: `cb-fix-phone-${Date.now() + 1}`,
                        label: "Mobile Number",
                        type: "phone",
                        required: true,
                      },
                    ];
                  }
                }
                break;
              case "link_to_url":
                // Config is guaranteed to exist from initial state.
                break;
            }
          }
          return newActionState;
        }
        return action;
      });
      return {
        ...prev,
        quickActions: updatedQuickActions,
      };
    });

    if (enabled) {
      setExpandedActionIndexes((prev) => [...prev, index]);
    } else {
      setExpandedActionIndexes((prev) => prev.filter((i) => i !== index));
    }
  };

  const handleToggleExpandAction = (index: number) => {
    if (formData.quickActions[index].enabled) {
      setExpandedActionIndexes((prevIndexes) =>
        prevIndexes.includes(index)
          ? prevIndexes.filter((i) => i !== index)
          : [...prevIndexes, index]
      );
    }
  };

  const handleQuickActionConfigChange = (
    actionIndex: number,
    configProperty: keyof QuickActionItem,
    newConfigValue: any
  ) => {
    setFormData((prev) => {
      const updatedQuickActions = prev.quickActions.map((action, i) => {
        if (i === actionIndex) {
          if (configProperty === "downloadFileConfig") {
            const config = newConfigValue as DownloadFileConfig;
            if (config._selectedFile) {
              setSelectedDownloadableFile({
                actionIndex,
                file: config._selectedFile,
              });
              const { _selectedFile, ...configToStore } = config;
              return { ...action, [configProperty]: configToStore };
            }
          }
          return { ...action, [configProperty]: newConfigValue };
        }
        return action;
      });
      return { ...prev, quickActions: updatedQuickActions };
    });
  };

  const handleAgentInstructionsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      agentInstructions: e.target.value,
    }));
  };

  const handleSubmit = async () => {
    // Client-side validation with toasts
    let hasError = false;
    if (!formData.greetingMessage.shortMessage.trim()) {
      toast.error("Greeting message cannot be empty.");
      hasError = true;
    }
    if (!formData.greetingMessage.longMessage.trim()) {
      toast.error("Greeting subtitle cannot be empty.");
      hasError = true;
    }
    const scheduleCallAction = formData.quickActions.find(
      (action) => action.type === "schedule_call"
    );
    if (scheduleCallAction?.enabled) {
      if (
        scheduleCallAction.scheduleCallConfig?.provider === "google_calendar" &&
        !googleCalendarConnection?.connected
      ) {
        toast.error("Connect Google Calendar for call scheduling");
        hasError = true;
      } else if (
        (!scheduleCallAction.scheduleCallConfig?.provider ||
          scheduleCallAction.scheduleCallConfig?.provider === "calendly") &&
        !calendlyConnection?.connected
      ) {
        toast.error("Connect Calendly for call scheduling");
        hasError = true;
      } else if (
        (!scheduleCallAction.scheduleCallConfig?.provider ||
          scheduleCallAction.scheduleCallConfig?.provider === "calcom") &&
        !calComConnection?.connected
      ) {
        toast.error("Connect Cal.com for call scheduling");
        hasError = true;
      }
    }
    if (isLinkToUrlInvalid) {
      toast.error("Please provide a URL for 'Link to URL'.");
      hasError = true;
    }
    if (isDownloadFileInvalid) {
      toast.error("Please attach a file for 'Download File'.");
      hasError = true;
    }

    if (isQuickReplyInvalid) {
      toast.error("Quick replies cannot be empty.");
      hasError = true;
    }

    if (hasError) {
      return; // Stop submission if there are errors
    }

    setIsSubmitting(true);
    const formDataToSend = new FormData(); // Initialize FormData

    if (selectedImageFile) {
      formDataToSend.append("file", selectedImageFile);
    }

    const quickActionsForJsonPayload = JSON.parse(
      JSON.stringify(formData.quickActions)
    ) as QuickActionItem[];

    if (
      calendlyConnection?.connected &&
      calendlyConnection.connectionDetails?.booking_url
    ) {
      const scheduleCallAction = quickActionsForJsonPayload.find(
        (action) => action.type === "schedule_call"
      );
      if (scheduleCallAction?.scheduleCallConfig) {
        if (scheduleCallAction.scheduleCallConfig.provider === "calendly") {
          scheduleCallAction.scheduleCallConfig.bookingLink =
            calendlyConnection.connectionDetails.booking_url;
        }
      }
    }

    if (
      calComConnection?.connected &&
      calComConnection.connectionDetails?.meetingLink
    ) {
      const scheduleCallAction = quickActionsForJsonPayload.find(
        (action) => action.type === "schedule_call"
      );
      if (scheduleCallAction?.scheduleCallConfig) {
        if (scheduleCallAction.scheduleCallConfig.provider === "calcom") {
          scheduleCallAction.scheduleCallConfig.bookingLink =
            calComConnection.connectionDetails.meetingLink;
        }
      }
    }

    formData.quickActions.forEach((action, index) => {
      if (action.type === "download_file") {
        if (
          selectedDownloadableFile &&
          selectedDownloadableFile.actionIndex === index
        ) {
          const fileToUpload = selectedDownloadableFile.file;
          const uniqueFileFieldName = `downloadable_file_action_${index}`;

          formDataToSend.append(
            uniqueFileFieldName,
            fileToUpload,
            fileToUpload.name
          );

          if (
            quickActionsForJsonPayload[index] &&
            quickActionsForJsonPayload[index].downloadFileConfig
          ) {
            quickActionsForJsonPayload[
              index
            ].downloadFileConfig!._fileFieldNameForUpload = uniqueFileFieldName;
            delete quickActionsForJsonPayload[index].downloadFileConfig!
              ._selectedFile;
          }
        }
      }
    });

    // 3. Prepare the main chatbotData object
    const chatbotData = {
      chatbotPurpose: Object.keys(formData.chatbotPurpose).filter(
        (purpose) =>
          formData.chatbotPurpose[
            purpose as keyof typeof formData.chatbotPurpose
          ] === true
      ),
      popupGreet: formData.popupGreet || false,
      popupStyle: formData.popupStyle || null,
      persona: {
        name: formData.persona.name,
        picture: formData.persona.picture,
        // picture will be set on backend if uploaded
      },
      brandColor: formData.brandColor,
      quickActions: quickActionsForJsonPayload, // Contains _fileFieldNameForUpload if files were added
      greetingMessage: formData.greetingMessage,
      centralWorkspaceId: workspaceId,
      intakeFormId: formData.selectedIntakeFormId,
      useIntakeForm: formData.useIntakeForm,
      agentInstructions: formData.agentInstructions,
      showWatermark: formData.showWatermark,
      streamResponse: formData.streamResponse,
      chatIcon: formData.chatIcon,
      delayPopupTime: formData.delayPopupTime,
      agentLanguage: formData.agentLanguage,
    };

    formDataToSend.append("data", JSON.stringify(chatbotData));

    // 4. Submit
    try {
      if (!workspaceId) {
        console.error("Missing required data for submission.");
        setIsSubmitting(false);
        return;
      }

      // return

      const url = editChatbotId
        ? `/api/central/chatbot/update/${editChatbotId}`
        : `/api/central/chatbot/create`;
      const method = editChatbotId ? "put" : "post";

      await axios[method](url, formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
          "x-workspace-id": workspaceId,
          "x-shop-domain": shopDomain,
        },
      });

      try {
        // Prefer App Bridge redirect to update top-level Admin URL in Shopify
        appRedirect.dispatch(Redirect.Action.APP, "/chat-agents");
      } catch (_) {
        // Fallback: in-app navigation if App Bridge dispatch is unavailable
        navigate("/chat-agents", { replace: true });
      }
    } catch (err: any) {
      console.error(
        "Error creating chat agent:",
        err.response?.data || err.message || err
      );
      toast.error(
        err.response?.data.message ||
          err.response?.data.error ||
          err.message ||
          "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkCalendlyConnection = async () => {
    setIsCheckingCalendly(true);
    try {
      if (!workspaceId) {
        console.error("Missing required data:", {
          workspaceId: workspaceId,
        });
        return;
      }

      // NEW: Use unified Node.js backend for Calendly status (better for chat team maintainability)
      const accessToken = await getCentralAccessTokenOrRedirect();
      if (!accessToken) return;

      const response = await fetch(`/api/central/calendly/status`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-Workspace-Id": workspaceId,
          "X-Shop-Domain": shopDomain,
        },
      });

      const data = await response.json();

      // NEW: Handle unified API response format (direct connected boolean)
      if (data.connected) {
        setCalendlyConnection({
          connected: data.connected,
          connectionDetails: data.connection_details,
        });
        setFormData((prev) => ({
          ...prev,
          quickActions: prev.quickActions.map((action) =>
            action.type === "schedule_call"
              ? {
                  ...action,
                  scheduleCallConfig: {
                    ...(action.scheduleCallConfig || {}),
                    bookingLink: data.connection_details.booking_url,
                  },
                }
              : action
          ),
        }));
      }
    } catch (error) {
      console.error("Failed to check Calendly connection:", error);
    } finally {
      setIsCheckingCalendly(false);
    }
  };

  const checkCalComConnection = async () => {
    setIsCheckingCalCom(true);
    try {
      if (!workspaceId) {
        console.error("Missing required data:", {
          workspaceId: workspaceId,
        });
        return;
      }

      const accessToken = await getCentralAccessTokenOrRedirect();
      if (!accessToken) return;

      const response = await fetch(`/api/booking/calcom/status`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-Workspace-Id": workspaceId,
        },
      });

      const data = await response.json();

      if (data.connected) {
        setCalComConnection({
          connected: data.connected,
          connectionDetails: data.details,
        });
      }
    } catch (error) {
      console.error("Failed to check Cal.com connection:", error);
    } finally {
      setIsCheckingCalCom(false);
    }
  };

  const checkGoogleCalendarConnection = async () => {
    setIsCheckingGoogleCalendar(true);
    try {
      if (!workspaceId) {
        console.error("Missing required data:", {
          workspaceId: workspaceId,
        });
        return;
      }

      const accessToken = await getCentralAccessTokenOrRedirect();
      if (!accessToken) return;

      const response = await fetch(`/api/central/google-calendar/status`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-Workspace-Id": workspaceId || "",
          "X-Shop-Domain": shopDomain,
        },
      });

      const data = await response.json();

      if (data.connected) {
        const connectionDetails = {
          email: data.email,
          calendar_name: data.calendar_name,
          calendar_id: data.calendar_id,
          default_meeting_duration: data.default_meeting_duration,
        };
        setGoogleCalendarConnection({
          connected: data.connected,
          connectionDetails: connectionDetails,
        });
      }
    } catch (error) {
      console.error("Failed to check Google Calendar connection:", error);
    } finally {
      setIsCheckingGoogleCalendar(false);
    }
  };

  const handlePredefinedAvatarSelect = (avatarUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      persona: {
        ...prev.persona,
        picture: avatarUrl,
      },
    }));
    setIsAvatarSelectionModalOpen(false);
  };

  const handleUploadClickFromModal = () => {
    // Create a hidden file input and trigger it
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/jpeg, image/png, image/webp, image/jpg";
    fileInput.onchange = (e) => {
      handleFileUpload(e as any);
    };
    fileInput.click();
  };

  if (isLoading) {
    return (
      <div
        className="flex justify-center items-center"
        style={{ minHeight: "60vh" }}
      >
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  let quickReplyConfig = null;
  let scheduleCallConfig = null;
  let downloadFileConfig = null;
  let requestCallbackConfig = null;
  let linkToURLConfig = null;

  formData.quickActions.forEach((action) => {
    if (!action.enabled) return;

    switch (action.type) {
      case "quick_reply":
        quickReplyConfig = action.quickReplyConfig;
        break;
      case "schedule_call":
        scheduleCallConfig = action.scheduleCallConfig;
        break;
      case "download_file":
        downloadFileConfig = action.downloadFileConfig;
        break;
      case "request_callback":
        requestCallbackConfig = action.requestCallbackConfig;
        break;
      case "link_to_url":
        linkToURLConfig = action.linkToURLConfig;
        break;
    }
  });

  const scheduleCallAction = formData.quickActions.find(
    (action) => action.type === "schedule_call"
  );
  const isScheduleCallInvalid =
    scheduleCallAction &&
    scheduleCallAction.enabled &&
    !scheduleCallAction.scheduleCallConfig?.bookingLink?.trim();

  const linkToUrlAction = formData.quickActions.find(
    (action) => action.type === "link_to_url"
  );
  const isLinkToUrlInvalid =
    linkToUrlAction &&
    linkToUrlAction.enabled &&
    !linkToUrlAction.linkToURLConfig?.url?.trim();

  const downloadFileAction = formData.quickActions.find(
    (action) => action.type === "download_file"
  );
  const isDownloadFileInvalid =
    downloadFileAction?.enabled &&
    !downloadFileAction.downloadFileConfig?.fileLink &&
    !selectedDownloadableFile;

  const quickReplyAction = formData.quickActions.find(
    (action) => action.type === "quick_reply"
  );
  const isQuickReplyInvalid =
    quickReplyAction?.enabled &&
    quickReplyAction.quickReplyConfig?.quickReplies.some(
      (reply) => !reply.buttonText.trim()
    );

  return (
    <div
      className={styles.createChatbotContainer}
      style={{
        height:
          currentStep > 1 ||
          formData.quickActions.filter((qa) => qa.enabled).length > 0
            ? ""
            : "100vh",
      }}
    >
      <SuccessPopup
        isOpen={isSuccessPopupOpen}
        chatOnboarding={chatOnboarding}
        onClose={() => {
          setIsSuccessPopupOpen(false);
          setActiveView("manage-chatbots");
        }}
        onIntegrate={() => {
          navigate("/chat/integrations");
          onClose?.();
        }}
        onLater={() => {
          setIsSuccessPopupOpen(false);
          setActiveView("manage-chatbots");
        }}
      />

      {isAvatarModalOpen && imageToCrop && (
        <AvatarResize
          imageSrc={imageToCrop}
          onClose={() => {
            setIsAvatarModalOpen(false);
            setImageToCrop(null);
          }}
          onSave={handleAvatarSave}
        />
      )}

      <div className="flex justify-center items-center w-full border-b border-gray-200">
        {/* <ToastContainer
          position="top-right"
          autoClose={6000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        /> */}
        <div
          className={`flex justify-between items-center ${
            isMobile ? "w-[90%]" : "w-[95%]"
          } min-h-fit py-6`}
        >
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
              {`${editChatbotId ? "Update" : "Create"} ${
                isMobile ? "Agent" : "Chat Agent"
              }`}
            </h1>
            <p className="mt-1 text-sm text-gray-500 sm:text-base">
              {editChatbotId
                ? "Let's update your Chat Agent"
                : "Let's create your new Chat Agent"}
            </p>
          </div>
          {/* Step indicator */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2">
              <div
                className={`h-3 w-3 rounded-full ${
                  currentStep >= 1 ? "bg-blue-600" : "bg-gray-300"
                }`}
              ></div>
              <div
                className={`h-3 w-3 rounded-full ${
                  currentStep >= 2 ? "bg-blue-600" : "bg-gray-300"
                }`}
              ></div>
              <div
                className={`h-3 w-3 rounded-full ${
                  currentStep >= 3 ? "bg-blue-600" : "bg-gray-300"
                }`}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.formContainer}>
        {currentStep === 1 && (
          <Step1Form
            formData={formData}
            quickActions={formData.quickActions.filter((qa) => qa.enabled)}
            intakeForms={intakeForms}
            currentStep={currentStep}
            handleInputChange={handleInputChange}
            handleCheckboxChange={handleCheckboxChange}
            setFormData={setFormData}
            handleBack={handleBack}
            handleNext={handleNext}
            handlePersonaChange={handlePersonaChange}
            handleFileUpload={handleFileUpload}
            handleColorChange={handleColorChange}
            quickReplyConfig={quickReplyConfig}
            scheduleCallConfig={scheduleCallConfig}
            downloadFileConfig={downloadFileConfig}
            requestCallbackConfig={requestCallbackConfig}
            linkToURLConfig={linkToURLConfig}
            setIsAvatarSelectionModalOpen={setIsAvatarSelectionModalOpen} // Add this line
            isMobile={isMobile}
            setIsPreviewModalOpen={setIsPreviewModalOpen}
            isPreviewModalOpen={isPreviewModalOpen}
            chatIcon={formData.chatIcon}
          />
        )}
        {currentStep === 2 && (
          <Step2Form
            formData={formData}
            quickReplyConfig={quickReplyConfig}
            scheduleCallConfig={scheduleCallConfig}
            downloadFileConfig={downloadFileConfig}
            requestCallbackConfig={requestCallbackConfig}
            linkToURLConfig={linkToURLConfig}
            quickActions={formData.quickActions.filter((qa) => qa.enabled)}
            currentStep={currentStep}
            handleRadioChange={handleRadioChange}
            setFormData={setFormData}
            handleBack={handleBack}
            handleNext={handleNext}
            isMobile={isMobile}
            setIsPreviewModalOpen={setIsPreviewModalOpen}
            isPreviewModalOpen={isPreviewModalOpen}
            // chatIcon={formData.chatIcon}
          />
        )}
        {currentStep === 3 && (
          <Step3Form
            formData={formData}
            intakeForms={intakeForms}
            setFormData={setFormData}
            currentStep={currentStep}
            handleGreetingMessageChange={handleGreetingMessageChange}
            handleQuickActionToggle={handleQuickActionToggle}
            expandedActionIndexes={expandedActionIndexes}
            handleToggleExpandAction={handleToggleExpandAction}
            handleQuickActionConfigChange={handleQuickActionConfigChange}
            handleAgentInstructionsChange={handleAgentInstructionsChange}
            handleBack={handleBack}
            isSubmitting={isSubmitting}
            handleSubmit={handleSubmit}
            editChatbotId={editChatbotId}
            calendlyConnection={calendlyConnection}
            googleCalendarConnection={googleCalendarConnection}
            checkCalendlyConnection={checkCalendlyConnection}
            checkGoogleCalendarConnection={checkGoogleCalendarConnection}
            checkCalComConnection={checkCalComConnection}
            isCheckingCalendly={isCheckingCalendly}
            isCheckingGoogleCalendar={isCheckingGoogleCalendar}
            calComConnection={calComConnection}
            isCheckingCalCom={isCheckingCalCom}
            handleQuickActionsDragEnd={handleQuickActionsDragEnd}
            isMobile={isMobile}
            setIsPreviewModalOpen={setIsPreviewModalOpen}
            isPreviewModalOpen={isPreviewModalOpen}
            chatOnboarding={chatOnboarding}
            // chatIcon={formData.chatIcon}
          />
        )}
      </div>
      <div
        className={`bottom-button-container ${styles.buttonContainer} ${styles.stickyFooter}`}
      >
        <button className={styles.backButton} onClick={handleBack}>
          <svg
            className={styles.backArrow}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9.5 4L5.5 8L9.5 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </button>

        {isMobile && (
          <button
            className={`flex items-center ${
              isPreviewModalOpen ? "text-red-600" : "text-blue-600"
            } transition-colors duration-200`}
            onClick={() => setIsPreviewModalOpen(!isPreviewModalOpen)}
            style={{
              overflow: "hidden",
              position: "relative",
              height: "-20px",
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isPreviewModalOpen ? (
                <motion.span
                  key="disable"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center"
                >
                  <EyeOff className="mr-2 h-4 w-4" />
                  Disable Preview
                </motion.span>
              ) : (
                <motion.span
                  key="enable"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Enable Preview
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        )}

        {currentStep < 3 ? (
          <button
            className={styles.nextButton}
            onClick={handleNext}
            // disabled={
            //   !formData.projectName || (formData.useIntakeForm && !formData.selectedIntakeFormId)
            // }
          >
            Next
          </button>
        ) : (
          <div className="flex flex-col-reverse items-center gap-4">
            <button
              className={`${styles.nextButton} ${styles.gradientSubmitButton}`}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {`${editChatbotId ? "Updating..." : "Creating..."}`}
                </div>
              ) : (
                `${editChatbotId ? "Update" : "Create"} ${
                  isMobile ? "Agent" : "Chat Agent"
                }`
              )}
            </button>
          </div>
        )}
      </div>

      <AvatarSelectionModal
        isOpen={isAvatarSelectionModalOpen}
        onClose={() => setIsAvatarSelectionModalOpen(false)}
        onUploadClick={handleUploadClickFromModal}
        onAvatarSelect={handlePredefinedAvatarSelect}
        onFileDrop={handleFileSelect}
      />
    </div>
  );
};

// Helper component for Sortable Intake Fields (can be defined outside or inside, ensure correct scope for props)
interface SortableIntakeFieldItemProps {
  id: string;
  field: IntakeField;
  index: number;
  isEditing: boolean;
  currentEditValues: { label: string; type: IntakeField["type"] } | null;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onLabelChange: (newLabel: string) => void;
  onTypeChange: (newType: IntakeField["type"]) => void;
  onRemove: () => void;
  getFieldTypeDisplayName: (type: IntakeField["type"]) => string;
  onRequiredChange?: (newRequiredState: boolean) => void; // Optional for DownloadFile
  showRequiredToggle?: boolean; // Optional
}

const SortableIntakeFieldItem: React.FC<SortableIntakeFieldItemProps> = ({
  id,
  field,
  index,
  isEditing,
  currentEditValues,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onLabelChange,
  onTypeChange,
  onRemove,
  getFieldTypeDisplayName,
  onRequiredChange,
  showRequiredToggle,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || undefined,
    zIndex: isDragging ? 10 : undefined, // Elevate while dragging
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm"
    >
      {isEditing && currentEditValues ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-0.5">
              Field Label
            </label>
            <input
              type="text"
              value={currentEditValues.label}
              onChange={(e) => onLabelChange(e.target.value)}
              className="w-full p-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-0.5">
              Field Type
            </label>
            <select
              value={currentEditValues.type}
              onChange={(e) =>
                onTypeChange(e.target.value as IntakeField["type"])
              }
              className="w-full p-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="int">Number</option>
              <option value="date">Date</option>
              <option value="boolean">Yes/No</option>
              {/* <option value="select">Select</option> */}
            </select>
          </div>
          <div className="flex items-center justify-end space-x-2 mt-2">
            <button
              onClick={onSaveEdit}
              className="p-1.5 text-green-600 hover:text-green-700"
              title="Save"
            >
              <CheckCircle size={20} />
            </button>
            <button
              onClick={onCancelEdit}
              className="p-1.5 text-gray-500 hover:text-gray-700"
              title="Cancel"
            >
              <XCircle size={20} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <span
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none"
          >
            {" "}
            {/* Apply listeners to GripVertical or a span */}
            <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0" />
          </span>
          <div className="flex-grow">
            <span className="font-medium text-gray-800">{field.label}</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full ml-2 whitespace-nowrap">
              {getFieldTypeDisplayName(field.type)}
            </span>
          </div>
          {showRequiredToggle && onRequiredChange && (
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => onRequiredChange(e.target.checked)}
              className="form-checkbox h-3 w-3 text-blue-500 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              title="Required"
            />
          )}
          <button
            type="button"
            onClick={onStartEdit}
            className="p-1.5 text-gray-500 hover:text-blue-600"
            title="Edit"
          >
            <Edit3 size={18} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 text-gray-500 hover:text-red-600"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

const ExitNudgeModal = ({
  isOpen,
  onStay,
  onLeave,
  formData,
}: {
  isOpen: boolean;
  onStay: () => void;
  onLeave: () => void;
  formData: ChatbotFormData;
}) => (
  <Transition.Root show={isOpen} as={Fragment}>
    <Dialog as="div" className="relative z-[9999]" onClose={onStay}>
      <Transition.Child
        as={Fragment}
        enter="ease-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
      </Transition.Child>

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8">
              <div className="bg-white flex justify-center px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="flex flex-col items-center w-fit">
                  <div
                    className={`${styles.pulseGreen} flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100 sm:h-10 sm:w-10`}
                  >
                    <img
                      src={formData?.persona?.picture}
                      alt="Persona"
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  </div>
                  <div className="mt-3 text-center">
                    <Dialog.Title
                      as="h3"
                      className="text-base font-semibold leading-6 text-gray-900"
                    >
                      {formData?.persona?.name} is almost ready to go!
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Complete this{" "}
                        <span className="font-black text-blue-600">
                          final step
                        </span>{" "}
                        to start chatting with your customers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 marker:bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  onClick={onStay}
                >
                  Stay
                </button>
                <button
                  type="button"
                  className="inline-flex w-full justify-center items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:w-auto"
                  onClick={onLeave}
                >
                  Leave
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </div>
    </Dialog>
  </Transition.Root>
);
