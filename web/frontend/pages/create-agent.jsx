import { Page, Layout } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import {ChatbotForm} from "../components/ChatbotForm/ChatbotForm";

export default function CreateAgentPage() {
  return (
    <Page>
      <TitleBar title="Create Chat Agent" />
      <Layout>
        <Layout.Section>
          <ChatbotForm />
        </Layout.Section>
      </Layout>
    </Page>
  );
}


