// web/frontend/pages/index.jsx
import { useEffect, useState } from "react";
import { Page, Layout, Card, TextField, Button, Banner, Stack, FormLayout, Select, Avatar, Text, Modal } from "@shopify/polaris";

export default function Index() {
  const [workspaceId, setWorkspaceId] = useState("");
  const [chatAgentId, setChatAgentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [connectedToCentral, setConnectedToCentral] = useState(false);
  const [shopDomain, setShopDomain] = useState("");
  const [workspaces, setWorkspaces] = useState([]);
  const [chatbots, setChatbots] = useState([]);
  const [changingAgent, setChangingAgent] = useState(false);
  const [showWorkspaceConfirm, setShowWorkspaceConfirm] = useState(false);
  const [pendingWorkspaceId, setPendingWorkspaceId] = useState("");


  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings", { credentials: "include" });
        const data = await res.json();
        setWorkspaceId(data?.workspace_id ?? "");
        setChatAgentId(data?.chat_agent_id ?? "");
        setConnectedToCentral(Boolean(data?.central_user_id || data?.workspace_id));
        setShopDomain(data?.shop_domain ?? "");
        setWorkspaces(Array.isArray(data?.workspaces) ? data.workspaces : []);
      } catch {
        setStatus("Failed to load settings.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!workspaceId) {
        setChatbots([]);
        return;
      }
      try {
        const url = new URL("/api/chatbots", window.location.origin);
        url.searchParams.set("workspace_id", workspaceId);
        if (shopDomain) url.searchParams.set("shop", shopDomain);
        
        const res = await fetch(url.toString(), { credentials: "include" });
        if (!res.ok) throw new Error("failed to fetch chatbots");
        const data = await res.json();
        setChatbots(Array.isArray(data?.chatbots) ? data.chatbots : []);
      } catch (e) {
        console.error("Failed to load chatbots:", e);
        setChatbots([]);
      }
    })();
  }, [workspaceId]);

  useEffect(() => {
    (async () => {
      if (!workspaceId || !chatAgentId) return;
      try {
        await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            workspace_id: workspaceId,
            chat_agent_id: chatAgentId,
          }),
        });
      } catch (e) {
        console.error("Auto-save chat_agent_id failed:", e);
      }
    })();
  }, [workspaceId, chatAgentId]);

  async function handleSave() {
    setSaving(true);
    setStatus("");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          workspace_id: workspaceId || null,
          chat_agent_id: chatAgentId || null,
        }),
      });
      if (!res.ok) throw new Error("save failed");
      setStatus("Settings saved successfully.");
    } catch {
      setStatus("Error saving settings.");
    } finally {
      setSaving(false);
    }
  }

  function handleWorkspaceSelectChange(nextWorkspaceId) {
    if (nextWorkspaceId === workspaceId) return;
    if (chatAgentId) {
      setPendingWorkspaceId(nextWorkspaceId);
      setShowWorkspaceConfirm(true);
      return;
    }
    setWorkspaceId(nextWorkspaceId);
  }

  function confirmWorkspaceChange() {
    setShowWorkspaceConfirm(false);
    if (!pendingWorkspaceId) return;
    // Clear selected chat agent when switching workspaces
    setChatAgentId("");
    setWorkspaceId(pendingWorkspaceId);
    setPendingWorkspaceId("");
  }

  function cancelWorkspaceChange() {
    setShowWorkspaceConfirm(false);
    setPendingWorkspaceId("");
  }

  function handleConnectCentral() {
    const url = new URL("/api/central/oauth/start", window.location.origin);
    if (shopDomain) url.searchParams.set("shop", shopDomain);
    (window.top || window).location.href = url.toString();
  }

  if (loading) return <Page title="Settings">Loading…</Page>;

  return (
    <Page title="Chat Widget Settings">
      <div style={{ padding: 16 }}>
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <FormLayout>
              {status && (
                <Banner
                  title={status}
                  status={status.includes("Error") ? "critical" : "success"}
                />
              )}

              <Stack alignment="center" distribution="equalSpacing">
                <div>{connectedToCentral ? "Connected to Central ✅" : "Not connected to Central"}</div>
                {/* Polaris v11 style: use primary boolean prop */}
                <Button primary onClick={handleConnectCentral}>
                  {connectedToCentral ? "Re-connect Central" : "Connect Central"}
                </Button>
              </Stack>

              {connectedToCentral ? (
                <>
                  <Select
                    label="Workspace"
                    options={workspaces.map((w) => ({ label: w.name, value: w.id }))}
                    value={workspaceId}
                    onChange={handleWorkspaceSelectChange}
                    placeholder="Select a workspace"
                  />
                  <Modal
                    open={showWorkspaceConfirm}
                    onClose={cancelWorkspaceChange}
                    title="Change workspace?"
                    primaryAction={{ content: "Change Workspace", destructive: true, onAction: confirmWorkspaceChange }}
                    secondaryActions={[{ content: "Cancel", onAction: cancelWorkspaceChange }]}
                  >
                    <div style={{ padding: 16 }}>
                      <Text as="p">
                        Changing workspace will remove the currently selected chat agent. You can select a chat agent from the new workspace afterward.
                      </Text>
                    </div>
                  </Modal>
                </>
              ) : (
                <TextField
                  label="Workspace ID"
                  value={workspaceId}
                  onChange={setWorkspaceId}
                  placeholder="UUID from Central"
                  autoComplete="off"
                />
              )}

              {chatbots.length > 0 ? (
                <>
                  {(!changingAgent && chatAgentId) ? (
                    <Stack alignment="center" distribution="equalSpacing">
                      <div>
                        <Text as="p" variant="bodyMd">Current Chat Agent</Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          {(() => {
                            const current = chatbots.find((b) => b?._id === chatAgentId);
                            return current?.persona?.name || current?.name || chatAgentId || "Unnamed";
                          })()}
                        </Text>
                      </div>
                      <Button onClick={() => setChangingAgent(true)}>Change Chat Agent</Button>
                    </Stack>
                  ) : (
                    <Select
                      label="Chat Agents"
                      options={chatbots.map((b) => ({ label: b?.persona?.name || b?.name || b?._id || "Unnamed", value: b?._id }))}
                      value={chatAgentId}
                      onChange={(val) => {
                        setChatAgentId(val);
                        setChangingAgent(false);
                      }}
                      placeholder="Select a chat agent"
                    />
                  )}
                </>
              ) : (
                <Select
                  label="Chat Agents"
                  options={[]}
                  value={""}
                  onChange={() => {}}
                  placeholder="No chat agents available"
                  disabled
                />
              )}

              {/* Selected chatbot preview */}
              {chatAgentId && chatbots?.length > 0 && (() => {
                const selected = chatbots.find((b) => b?._id === chatAgentId);
                if (!selected) return null;
                const avatarSrc = selected?.persona?.picture || selected?.chatIcon || undefined;
                const displayName = selected?.persona?.name || selected?.name || "Chatbot";
                const subtitle = selected?.greetingMessage?.shortMessage || "";
                const accent = selected?.brandColor || "#289EFD";
                return (
                  <div style={{ border: `1px solid ${accent}`, borderLeftWidth: 4, borderRadius: 8, padding: 12, background: "#fff" }}>
                    <Stack alignment="center" spacing="tight">
                      <Avatar name={displayName} source={avatarSrc} size="medium" />
                      <div style={{ marginLeft: 8 }}>
                        <div style={{ fontWeight: 600 }}>{displayName}</div>
                        {subtitle ? (
                          <Text as="span" variant="bodySm" tone="subdued">{subtitle}</Text>
                        ) : null}
                      </div>
                    </Stack>
                  </div>
                );
              })()}

              <Stack distribution="trailing">
                <Button primary loading={saving} onClick={handleSave}>
                  Save
                </Button>
              </Stack>
            </FormLayout>
          </Card>
        </Layout.Section>
      </Layout>
      </div>
    </Page>
  );
}
