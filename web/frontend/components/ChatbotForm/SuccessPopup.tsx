import React from "react";
import { ArrowRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SuccessPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onIntegrate: () => void;
  onLater: () => void;
  chatOnboarding: boolean;
}

const SuccessPopup: React.FC<SuccessPopupProps> = ({
  isOpen,
  onClose,
  onIntegrate,
  onLater,
  chatOnboarding,
}) => {
  const navigate = useNavigate();
  if (!isOpen) return null;

  const successMessage = !chatOnboarding
    ? "Your AI Agent is live! Integrate it to start chatting with your customers ✨"
    : "Your AI Agent is live! ✨";

  const successMessage2 = !chatOnboarding
    ? `Your AI Chat Agent is live, but it's not connected yet so visitors can't start a
                conversation. Set it up now to engage customers instantly via your website,
                WhatsApp, SMS, and more.`
    : "Next, let's give it some knowledge to help it answer questions.";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto text-sm">
      <div className="flex items-center justify-center min-h-screen p-4 text-center">
        <div
          className="fixed inset-0 transition-opacity bg-black bg-opacity-50"
          onClick={onClose}
        />

        <div className="inline-block w-full max-w-lg p-8 my-8 overflow-hidden text-center align-middle transition-all transform bg-white rounded-2xl shadow-xl">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-24 h-24 mb-4 bg-green-50 rounded-full">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                <Check className="w-10 h-10 text-green-500" />
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-900">{successMessage}</h3>
            <div className="mt-4">
              <p className="text-normal font-normal text-gray-500">{successMessage2}</p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {!chatOnboarding ? (
              <button
                onClick={onIntegrate}
                className="w-full px-4 py-2 text-base font-medium text-white bg-blue-500 border border-transparent rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
              >
                Integrate Chat Agent
              </button>
            ) : (
              <button
                onClick={() => {
                  navigate("/knowledgebase?chatOnboarding=true");
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-base font-medium text-white bg-blue-500 border border-transparent rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
              >
                Add Knowledge to your AI Agent <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onLater}
              className="w-full px-4 py-2 text-base font-medium text-gray-700 bg-transparent border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              I'll do it later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessPopup;
