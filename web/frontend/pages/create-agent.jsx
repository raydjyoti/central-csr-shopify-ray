import React from "react";
import { Page, Layout, Spinner } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ChatbotForm } from "../components/ChatbotForm/ChatbotForm";
import CentralLoader from "../components/CentralLoader";

export default function CreateAgentPage() {
  const [searchParams] = useSearchParams();
  const editChatbotId = searchParams.get("chatbotId");
  const [checked, setChecked] = useState(false);
  const [hasWorkspace, setHasWorkspace] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings", { credentials: "include" });
        const data = await res.json();
        setHasWorkspace(Boolean(data?.workspace_id));
      } catch {}
      setChecked(true);
    })();
  }, []);

  if (!checked) return <CentralLoader label="Checking workspace" />;
  if (!hasWorkspace) return <Navigate to="/" replace />;

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


