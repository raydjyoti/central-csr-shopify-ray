import { Page, Layout } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useSearchParams } from "react-router-dom";
import { ChatbotForm } from "../components/ChatbotForm/ChatbotForm";

export default function CreateAgentPage() {
  const [searchParams] = useSearchParams();
  const editChatbotId = searchParams.get("chatbotId");

  return (
    <div>
      <TitleBar title="Create Chat Agent" />
      <Layout>
        <Layout.Section>
          <ChatbotForm editChatbotId={editChatbotId} setActiveView={() => {}} onClose={() => {}} />
        </Layout.Section>
      </Layout>
    </div>
  );
}


