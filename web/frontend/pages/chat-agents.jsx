import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, Loader2 } from "lucide-react";

export default function ChatAgentsPage() {
  const [workspaceId, setWorkspaceId] = useState("");
  const [shopDomain, setShopDomain] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [agents, setAgents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings", { credentials: "include" });
        const data = await res.json();
        const wsId = data?.workspace_id ?? "";
        const shop = data?.shop_domain ?? "";
        setWorkspaceId(wsId);
        setShopDomain(shop);
        if (!wsId) return;
        const listRes = await fetch(`/api/chatbots?workspace_id=${wsId}&shop=${shop}`, {
          credentials: "include",
        });
        if (!listRes.ok) throw new Error("Failed to load agents");
        const list = await listRes.json();
        const items = Array.isArray(list)
          ? list
          : Array.isArray(list?.chatbots)
          ? list.chatbots
          : [];
        setAgents(items);
      } catch (e) {
        setError("Failed to load chat agents.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-800">
        <p>{error}</p>
        <button
          className="mt-2 rounded bg-red-100 px-3 py-1 text-sm font-medium text-red-800 hover:bg-red-200"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-center items-center w-full border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 w-[95%] py-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Chat Agents</h1>
            <p className="mt-1 text-gray-500 text-sm sm:text-base">
              View and manage all chat agents for this workspace.
            </p>
          </div>
          <button
            className="bg-[#289EFD] hover:bg-[#1f85d9] transition-colors duration-200 text-white px-4 py-2 rounded-md text-lg sm:text-xl"
            onClick={() => navigate("/create-agent")}
          >
            + New Agent
          </button>
        </div>
      </div>

      <div className="my-8 w-[95%] mx-auto">
        {agents.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
            <h3 className="mb-2 text-lg font-medium text-gray-900">No chat agents yet</h3>
            <p className="mb-4 text-sm text-gray-500">Get started by creating your first AI chat agent</p>
            <button
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
              onClick={() => navigate("/create-agent")}
            >
              Create Chat Agent
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <div key={agent._id || agent.id} className="flex flex-col items-start gap-4 justify-between rounded-lg bg-[#F9FAFC] border-[#EAEAEA] border px-4 py-4 shadow-sm w-full h-full">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 overflow-hidden aspect-square flex-shrink-0">
                      {agent?.persona?.picture ? (
                        <img
                          src={agent.persona.picture}
                          alt={agent?.persona?.name || "Agent"}
                          className="h-full w-full rounded-full object-cover border-[#EAEAEA] border"
                        />
                      ) : (
                        <Bot className="h-5 w-5" />
                      )}
                    </div>
                    <div className="ml-3">
                      <h3 className="text-md font-medium truncate">{agent?.persona?.name || agent?.name || "Untitled Agent"}</h3>
                      <p className="text-xs text-gray-500 mt-1">{agent?.active ? "Active" : "Inactive"}</p>
                    </div>
                  </div>
                  <button
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    onClick={() => navigate(`/create-agent?chatbotId=${agent._id || agent.id}`)}
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
