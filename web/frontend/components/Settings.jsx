// web/frontend/pages/index.jsx
import { useEffect, useState } from "react";
import { Page, Layout, Card, TextField, Button, Banner, Stack, FormLayout, Select, Avatar, Text, Modal, Badge, SkeletonDisplayText, SkeletonBodyText, Spinner } from "@shopify/polaris";
import CentralLogo from "../assets/images/central-logo.svg"

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
  const [loadingChatbots, setLoadingChatbots] = useState(false);
  const [widgetEnabled, setWidgetEnabled] = useState(true);
  const [centralUserId, setCentralUserId] = useState("");


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
        setWidgetEnabled(typeof data?.widget_enabled === 'boolean' ? data.widget_enabled : true);

        // Detect Central account change and clear stale mappings
        const incomingCentralUserId = data?.central_user_id || "";
        setCentralUserId(incomingCentralUserId);
        try {
          const prevCentralUserId = window.localStorage.getItem("central_csr_user_id") || "";
          if (incomingCentralUserId && prevCentralUserId && prevCentralUserId !== incomingCentralUserId) {
            // Clear stored mapping on server and locally
            try {
              await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ workspace_id: null, chat_agent_id: null }),
              });
            } catch {}
            setWorkspaceId("");
            setChatAgentId("");
            setStatus("Detected new Central account. Please select a workspace.");
          }
          window.localStorage.setItem("central_csr_user_id", incomingCentralUserId);
        } catch {}
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
        setLoadingChatbots(true);
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
      } finally {
        setLoadingChatbots(false);
      }
    })();
  }, [workspaceId]);

  // If the currently selected workspace is not in the refreshed list, reset selection
  useEffect(() => {
    if (!workspaceId) return;
    const exists = workspaces.some((w) => w?.id === workspaceId);
    if (!exists) {
      setWorkspaceId("");
      setChatAgentId("");
      setStatus("Your previous workspace is no longer available. Please select a workspace.");
    }
  }, [workspaces]);

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
          widget_enabled: widgetEnabled,
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

  if (loading) {
    return (
      <Page title="Chat Widget Settings">
        <div style={{ padding: 24 }}>
          <Layout>
            <Layout.Section>
              <Card sectioned>
                <Stack alignment="center" distribution="equalSpacing">
                  <Stack alignment="center" spacing="tight">
                    <img src={CentralLogo} alt="Central" style={{ height: 28 }} />
                    <SkeletonDisplayText size="small" />
                  </Stack>
                  <SkeletonDisplayText size="small" />
                </Stack>
                <div style={{ marginTop: 16 }}>
                  <SkeletonBodyText lines={4} />
                </div>
              </Card>
            </Layout.Section>
          </Layout>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Chat Widget Settings">
      <div style={{ padding: 24 }}>
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

              <div style={{ marginBottom: 20 }}>
                <Stack alignment="center" distribution="equalSpacing" spacing="loose">
                  <Stack alignment="center" spacing="tight">
                    <img src={CentralLogo} alt="Central" style={{ height: 28 }} />
                    {connectedToCentral ? (
                      <Badge status="success">Connected to Central</Badge>
                    ) : (
                      <Badge status="critical">Not Connected</Badge>
                    )}
                  </Stack>
                  <Button primary onClick={handleConnectCentral}>
                    {connectedToCentral ? "Re-connect Central" : "Connect Central"}
                  </Button>
                </Stack>
              </div>

              <div style={{ marginTop: 20, marginBottom: 20 }}>
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
              </div>

              <div style={{ marginTop: 20, marginBottom: 20 }}>
                {loadingChatbots ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Spinner size="small" />
                    <Text as="span" tone="subdued">Loading chat agents…</Text>
                  </div>
                ) : chatbots.length > 0 ? (
                  <>
                    {(!changingAgent && chatAgentId) ? (
                      <Stack alignment="center" distribution="equalSpacing" spacing="loose">
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
              </div>

       

              {/* Selected chatbot preview */}
              {chatAgentId && chatbots?.length > 0 && (() => {
                const selected = chatbots.find((b) => b?._id === chatAgentId);
                if (!selected) return null;
                const avatarSrc = selected?.persona?.picture || selected?.chatIcon || undefined;
                const displayName = selected?.persona?.name || selected?.name || "Chatbot";
                const subtitle = selected?.greetingMessage?.shortMessage || "";
                const accent = selected?.brandColor || "#289EFD";
                return (
                  <div style={{ border: `1px solid ${accent}`, borderLeftWidth: 4, borderRadius: 8, padding: 12, background: "#fff", marginTop: 16, marginBottom: 16 }}>
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

                     {/* Toggle: Enable/Disable Chat Agent on storefront */}
                      <Stack alignment="center" distribution="equalSpacing" style={{ marginTop: 16, marginBottom: 12 }}>
                <div>
                  <Text as="p" variant="bodyMd">Widget visibility</Text>
                  <Text as="p" tone="subdued" variant="bodySm">Controls whether the chat widget is active on your storefront</Text>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const next = !widgetEnabled;
                    setWidgetEnabled(next);
                    setSaving(true);
                    try {
                      await fetch("/api/settings", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({
                          workspace_id: workspaceId || null,
                          chat_agent_id: chatAgentId || null,
                          widget_enabled: next,
                        }),
                      });
                      setStatus(`Widget ${next ? 'enabled' : 'disabled'}.`);
                    } catch {
                      setStatus("Failed to update widget state.");
                      setWidgetEnabled(!next);
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className={`${widgetEnabled ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                  role="switch"
                  aria-checked={widgetEnabled}
                >
                  <span className="sr-only">Toggle widget visibility</span>
                  <span
                    aria-hidden="true"
                    className={`${widgetEnabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </Stack>

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
