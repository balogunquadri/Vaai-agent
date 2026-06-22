"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../components/AuthProvider";
import { insforge } from "@/lib/insforge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlugIcon,
  Settings01Icon,
  TickDouble01Icon,
  PlayIcon,
  AiBrain01Icon,
} from "@hugeicons/core-free-icons";

// Interface for MCP Tool definition
interface MCPTool {
  name: string;
  description: string;
  parameters: string;
}

// Interface for Platform metadata
interface Platform {
  id: string;
  name: string;
  description: string;
  category: "communication" | "mail" | "productivity" | "social";
  icon: React.ReactNode;
  brandColor: string;
  glowColor: string;
  mcpTools: MCPTool[];
}

export default function IntegrationsPage() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);

  // Custom Apps registry
  const [customApps, setCustomApps] = useState<Platform[]>([]);

  // Form states for creating custom app
  const [customAppName, setCustomAppName] = useState("");
  const [customAppDesc, setCustomAppDesc] = useState("");
  const [customAppCat, setCustomAppCat] = useState<"productivity" | "communication" | "mail" | "social">("productivity");
  const [customAppColor, setCustomAppColor] = useState("bg-zinc-700");
  const [customAppEndpoint, setCustomAppEndpoint] = useState("");
  const [customAppApiKey, setCustomAppApiKey] = useState("");

  // Dynamic tools setup for custom app
  const [customTools, setCustomTools] = useState<MCPTool[]>([
    { name: "", description: "", parameters: "{}" }
  ]);

  const addToolField = () => {
    setCustomTools((prev) => [...prev, { name: "", description: "", parameters: "{}" }]);
  };

  const removeToolField = (index: number) => {
    setCustomTools((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToolChange = (index: number, key: keyof MCPTool, value: string) => {
    setCustomTools((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  };

  // Live Gmail MCP console states
  const [mcpConsoleLoading, setMcpConsoleLoading] = useState(false);
  const [mcpConsoleExecuted, setMcpConsoleExecuted] = useState(false);
  const [selectedMcpTool, setSelectedMcpTool] = useState("gmail_list_messages");
  const [mcpQueryInput, setMcpQueryInput] = useState("is:unread");
  const [mcpMessageId, setMcpMessageId] = useState("");
  const [mcpErrorMsg, setMcpErrorMsg] = useState("");

  const [mcpRequestJson, setMcpRequestJson] = useState("");
  const [mcpResponseJson, setMcpResponseJson] = useState("");
  const [mcpEmailsResult, setMcpEmailsResult] = useState<any[]>([]);

  // WhatsApp States
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [waPhoneNumber, setWaPhoneNumber] = useState("");
  const [waPairingCode, setWaPairingCode] = useState<string | null>(null);
  const [waConnectLoading, setWaConnectLoading] = useState(false);
  const [waStatus, setWaStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [waPollInterval, setWaPollInterval] = useState<any>(null);

  // Toast States
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const [refreshingPlatforms, setRefreshingPlatforms] = useState<Record<string, boolean>>({});

  const handleRefreshToken = async (platformId: string) => {
    if (!user) return;
    setRefreshingPlatforms((p) => ({ ...p, [platformId]: true }));
    try {
      const res = await fetch(`/api/auth/${platformId}/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(`${platformId} tokens refreshed`);
        if (data.newState) setPlatformConfigs((prev) => ({ ...prev, [platformId]: data.newState }));
      } else {
        showToast(`Failed to refresh ${platformId}`);
        console.error("Refresh failed", data);
      }
    } catch (err) {
      console.error("Refresh error", err);
      showToast(`Error refreshing ${platformId}`);
    } finally {
      setRefreshingPlatforms((p) => ({ ...p, [platformId]: false }));
    }
  };

  // Live WhatsApp MCP console states
  const [selectedWaMcpTool, setSelectedWaMcpTool] = useState("whatsapp_get_recent_messages");
  const [waMcpArgs, setWaMcpArgs] = useState<Record<string, any>>({});
  const [waMcpRequest, setWaMcpRequest] = useState("");
  const [waMcpResponse, setWaMcpResponse] = useState("");
  const [waMcpLoading, setWaMcpLoading] = useState(false);
  const [waMcpError, setWaMcpError] = useState("");
  const [waParsedResult, setWaParsedResult] = useState<any>(null);

  // Dynamic user-specific credentials configuration states
  const [platformConfigs, setPlatformConfigs] = useState<Record<string, any>>({});
  const [activeConfigFields, setActiveConfigFields] = useState<Record<string, string>>({});
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Settings Modal MCP Tool Console states
  const [selectedModalTool, setSelectedModalTool] = useState<string>("");
  const [modalToolArgs, setModalToolArgs] = useState<string>("{}");
  const [modalTerminalRequest, setModalTerminalRequest] = useState<string>("");
  const [modalTerminalResponse, setModalTerminalResponse] = useState<string>("");
  const [modalTerminalExecuting, setModalTerminalExecuting] = useState<boolean>(false);
  const [modalTerminalError, setModalTerminalError] = useState<string>("");

  const getPlatformConfigKeys = (platformId: string): string[] => {
    switch (platformId) {
      case "slack": return ["channelId", "userName"];
      case "outlook": return ["email"];
      case "discord": return ["channelId", "guildId"];
      case "telegram": return ["chatId"];
      case "jira": return ["domain", "userEmail", "projectKey"];
      case "trello": return ["boardId", "listId"];
      case "asana": return ["workspaceId", "projectId"];
      case "notion": return ["pageId"];
      case "manus": return ["promptTemplate"];
      case "zapier": return ["zapId"];
      case "tango": return ["workflowId"];
      case "toggl": return ["workspaceId"];
      case "calendly": return ["eventType"];
      case "google_calendar": return ["calendarId"];
      case "google_drive": return ["folderId"];
      case "github": return ["repo"];
      case "teams": return ["channelId"];
      case "lark": return ["chatId"];
      case "instagram": return ["username"];
      case "x_twitter": return ["query"];
      case "threads": return ["username"];
      default: return [];
    }
  };


  const fetchWithTokenRetry = async (url: string, init?: RequestInit): Promise<Response> => {
    let accessToken = typeof window !== "undefined" ? localStorage.getItem("gmail_access_token") : null;
    let res = await fetch(url, {
      ...init,
      headers: {
        ...init?.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res.status === 401 && user) {
      try {
        const refreshRes = await fetch(`/api/auth/gmail/token?userId=${user.id}`);
        if (refreshRes.ok) {
          const tokenData = await refreshRes.json();
          if (tokenData.accessToken) {
            localStorage.setItem("gmail_access_token", tokenData.accessToken);
            localStorage.setItem("gmail_connected", "true");
            res = await fetch(url, {
              ...init,
              headers: {
                ...init?.headers,
                Authorization: `Bearer ${tokenData.accessToken}`,
              },
            });
          }
        }
      } catch (err) {
        console.error("Error retrying Gmail request with refreshed token:", err);
      }
    }
    return res;
  };

  // Fetch connections from the database and check local Gmail state
  const fetchConnections = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await insforge.database
        .from("integrations")
        .select()
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching integrations:", error);
        return;
      }

      const statusMap: Record<string, boolean> = {};
      const configs: Record<string, any> = {};
      data?.forEach((row: any) => {
        statusMap[row.platform] = row.connected;
        configs[row.platform] = row.state || {};
        if (row.platform.startsWith("custom_connected_")) {
          const originalId = row.platform.replace("custom_connected_", "");
          statusMap[originalId] = row.connected;
          configs[originalId] = row.state || {};
        }
      });

      // Synchronize client-side localStorage access token state with Gmail connection map
      if (statusMap.gmail && typeof window !== "undefined") {
        try {
          const res = await fetch(`/api/auth/gmail/token?userId=${user.id}`);
          if (res.ok) {
            const tokenData = await res.json();
            if (tokenData.accessToken) {
              localStorage.setItem("gmail_access_token", tokenData.accessToken);
              localStorage.setItem("gmail_connected", "true");
            } else {
              statusMap.gmail = false;
              localStorage.removeItem("gmail_access_token");
              localStorage.removeItem("gmail_connected");
            }
          } else {
            statusMap.gmail = false;
            localStorage.removeItem("gmail_access_token");
            localStorage.removeItem("gmail_connected");
          }
        } catch (err) {
          console.error("Failed to sync Gmail token:", err);
        }
      } else if (typeof window !== "undefined") {
        localStorage.removeItem("gmail_access_token");
        localStorage.removeItem("gmail_connected");
      }

      // Check active WhatsApp session status from server in background
      try {
        const waStatusRes = await fetch(`/api/whatsapp/status?userId=${user.id}`);
        const waStatusData = await waStatusRes.json();
        if (waStatusData.success) {
          if (waStatusData.state === "connected") {
            statusMap.whatsapp = true;
          } else {
            statusMap.whatsapp = false;
          }
        }
      } catch (err) {
        console.error("Failed to fetch background WhatsApp status:", err);
      }

      // Fetch Custom Integrations
      try {
        const { data: customRow } = await insforge.database
          .from("integrations")
          .select()
          .eq("user_id", user.id)
          .eq("platform", "custom_integrations")
          .maybeSingle();

        if (customRow && customRow.state?.apps) {
          const parsedApps: Platform[] = customRow.state.apps.map((app: any) => ({
            id: app.id,
            name: app.name,
            description: app.description,
            category: app.category || "productivity",
            brandColor: app.brandColor || "bg-zinc-700",
            glowColor: (app.brandColor || "bg-zinc-750").replace("bg-", "shadow-") + "/20 text-" + (app.brandColor || "bg-zinc-750").replace("bg-", "").replace("-600", "-455").replace("-500", "-455"),
            icon: (
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m-3-3h6" />
              </svg>
            ),
            mcpTools: app.mcpTools || [],
            customInfo: {
              endpoint: app.endpoint,
              apiKey: app.apiKey
            }
          }));
          setCustomApps(parsedApps);
        } else {
          setCustomApps([]);
        }
      } catch (err) {
        console.error("Failed to fetch custom apps:", err);
      }

      setConnections(statusMap);
      setPlatformConfigs(configs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !customAppName) return;

    const newAppId = "custom_" + customAppName.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + Date.now();
    const newApp = {
      id: newAppId,
      name: customAppName,
      description: customAppDesc,
      category: customAppCat,
      brandColor: customAppColor,
      endpoint: customAppEndpoint,
      apiKey: customAppApiKey,
      mcpTools: customTools.filter(t => t.name.trim() !== "")
    };

    try {
      setLoading(true);
      // Fetch existing custom_integrations row
      const { data: existingRow } = await insforge.database
        .from("integrations")
        .select()
        .eq("user_id", user.id)
        .eq("platform", "custom_integrations")
        .maybeSingle();

      const existingApps = existingRow?.state?.apps || [];
      const updatedApps = [...existingApps, newApp];

      if (existingRow) {
        await insforge.database
          .from("integrations")
          .update({
            state: { apps: updatedApps },
            updated_at: new Date().toISOString()
          })
          .eq("id", existingRow.id);
      } else {
        await insforge.database.from("integrations").insert([
          {
            user_id: user.id,
            platform: "custom_integrations",
            connected: true,
            state: { apps: updatedApps }
          }
        ]);
      }

      // Reset form fields
      setCustomAppName("");
      setCustomAppDesc("");
      setCustomAppEndpoint("");
      setCustomAppApiKey("");
      setCustomTools([{ name: "", description: "", parameters: "{}" }]);

      showToast(`Custom integration ${customAppName} created successfully!`);
      await fetchConnections();
    } catch (err) {
      console.error(err);
      alert("Failed to create custom integration.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, [user]);

  // Synchronize configuration parameters when integrations selection modal is toggled
  useEffect(() => {
    if (selectedPlatform) {
      const existingConfig = platformConfigs[selectedPlatform.id] || {};
      const fields: Record<string, string> = {};
      const keys = getPlatformConfigKeys(selectedPlatform.id);
      keys.forEach((key) => {
        fields[key] = existingConfig[key] || "";
      });
      setActiveConfigFields(fields);

      if (selectedPlatform.mcpTools.length > 0) {
        setSelectedModalTool(selectedPlatform.mcpTools[0].name);
        setModalToolArgs(selectedPlatform.mcpTools[0].parameters || "{}");
      } else {
        setSelectedModalTool("");
        setModalToolArgs("{}");
      }
      setModalTerminalRequest("");
      setModalTerminalResponse("");
      setModalTerminalExecuting(false);
      setModalTerminalError("");
    }
  }, [selectedPlatform, platformConfigs]);

  // Save platform configuration details per user to the database
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPlatform) return;
    setIsSavingConfig(true);
    const dbPlatformId = selectedPlatform.id.startsWith("custom_") ? `custom_connected_${selectedPlatform.id}` : selectedPlatform.id;

    try {
      const { data: existing } = await insforge.database
        .from("integrations")
        .select()
        .eq("user_id", user.id)
        .eq("platform", dbPlatformId)
        .maybeSingle();

      if (existing) {
        await insforge.database
          .from("integrations")
          .update({
            state: activeConfigFields,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await insforge.database.from("integrations").insert([
          {
            user_id: user.id,
            platform: dbPlatformId,
            connected: true,
            state: activeConfigFields,
          },
        ]);
      }
      showToast(`Configuration parameters for ${selectedPlatform.name} saved successfully.`);
      await fetchConnections();
      setSelectedPlatform(null);
    } catch (err) {
      console.error("Failed to save config:", err);
      alert("Failed to save configurations.");
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Run Real/Simulated MCP tool from the Settings Modal Console
  const handleExecuteModalTool = async () => {
    if (!user || !selectedPlatform || !selectedModalTool) return;
    setModalTerminalExecuting(true);
    setModalTerminalError("");
    setModalTerminalRequest("");
    setModalTerminalResponse("");

    const requestId = Math.floor(Math.random() * 1000);
    let parsedArgs = {};
    try {
      parsedArgs = JSON.parse(modalToolArgs);
    } catch (e) {
      setModalTerminalError("Arguments must be a valid JSON object.");
      setModalTerminalExecuting(false);
      return;
    }

    const requestPayload = {
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: selectedModalTool,
        arguments: parsedArgs,
      },
      id: requestId,
    };
    setModalTerminalRequest(JSON.stringify(requestPayload, null, 2));

    try {
      const res = await fetch("/api/mcp/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          platformId: selectedPlatform.id,
          toolName: selectedModalTool,
          args: parsedArgs,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const responsePayload = {
          jsonrpc: "2.0",
          result: data.result,
          id: requestId,
        };
        setModalTerminalResponse(JSON.stringify(responsePayload, null, 2));
      } else {
        throw new Error(data.error || "Failed to execute tool");
      }
    } catch (err: any) {
      console.error(err);
      setModalTerminalError(err.message || "Failed to execute tool.");
      const errorPayload = {
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: err.message || "Execution error",
        },
        id: requestId,
      };
      setModalTerminalResponse(JSON.stringify(errorPayload, null, 2));
    } finally {
      setModalTerminalExecuting(false);
    }
  };


  // Detect Google OAuth Redirect Parameters on Mount
  useEffect(() => {
    if (typeof window !== "undefined" && user) {
      const params = new URLSearchParams(window.location.search);
      if (params.get("connected") === "gmail") {
        // Clean redirect query parameters from address bar
        window.history.replaceState({}, document.title, window.location.pathname);

        // Update database and connection status map
        const syncGmailConnection = async () => {
          try {
            const { data: existing } = await insforge.database
              .from("integrations")
              .select()
              .eq("user_id", user.id)
              .eq("platform", "gmail")
              .maybeSingle();

            if (existing) {
              await insforge.database
                .from("integrations")
                .update({
                  connected: true,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", existing.id);
            } else {
              await insforge.database.from("integrations").insert([
                {
                  user_id: user.id,
                  platform: "gmail",
                  connected: true,
                },
              ]);
            }

            setConnections((prev) => ({
              ...prev,
              gmail: true,
            }));
          } catch (e) {
            console.error("Failed to sync Gmail connection state:", e);
          }
        };
        syncGmailConnection();
      }
    }
  }, [user]);

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (waPollInterval) clearInterval(waPollInterval);
    };
  }, [waPollInterval]);

  // Start WhatsApp pairing code polling
  const startWaPolling = () => {
    if (waPollInterval) clearInterval(waPollInterval);

    const interval = setInterval(async () => {
      if (!user) return;
      try {
        const res = await fetch(`/api/whatsapp/status?userId=${user.id}`);
        const data = await res.json();
        if (data.success) {
          setWaStatus(data.state);
          if (data.state === "connected") {
            setConnections((prev) => ({ ...prev, whatsapp: true }));
            setIsWaModalOpen(false);
            clearInterval(interval);
            setWaPollInterval(null);
          }
        }
      } catch (err) {
        console.error("Error polling WhatsApp status:", err);
      }
    }, 3000);

    setWaPollInterval(interval);
  };

  const handleCloseWaModal = () => {
    setIsWaModalOpen(false);
    if (waPollInterval) {
      clearInterval(waPollInterval);
      setWaPollInterval(null);
    }
  };

  const handleConnectWhatsApp = async () => {
    if (!user || !waPhoneNumber) return;
    setWaConnectLoading(true);
    setWaPairingCode(null);
    setWaStatus("connecting");

    try {
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, phoneNumber: waPhoneNumber }),
      });
      const data = await res.json();
      if (data.success) {
        setWaPairingCode(data.pairingCode);

        // Start polling connection status
        if (waPollInterval) clearInterval(waPollInterval);
        const interval = setInterval(async () => {
          try {
            const statusRes = await fetch(`/api/whatsapp/status?userId=${user.id}`);
            const statusData = await statusRes.json();
            if (statusData.success) {
              setWaStatus(statusData.state);
              if (statusData.state === "connected") {
                setConnections((prev) => ({ ...prev, whatsapp: true }));
                setIsWaModalOpen(false);
                clearInterval(interval);
                setWaPollInterval(null);
                showToast("WhatsApp Connected");
              }
            }
          } catch (err) {
            console.error("Error polling WhatsApp status:", err);
          }
        }, 3000);
        setWaPollInterval(interval);
      } else {
        setWaStatus("disconnected");
        alert(data.error || "Failed to request pairing code");
      }
    } catch (e: any) {
      setWaStatus("disconnected");
      alert(e.message || "Failed to connect to WhatsApp API");
    } finally {
      setWaConnectLoading(false);
    }
  };

  const handleExecuteWaMcp = async () => {
    if (!user) return;
    setWaMcpLoading(true);
    setWaMcpError("");
    setWaParsedResult(null);

    const requestId = Math.floor(Math.random() * 1000);
    const requestPayload = {
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: selectedWaMcpTool,
        arguments: waMcpArgs,
      },
      id: requestId,
    };
    setWaMcpRequest(JSON.stringify(requestPayload, null, 2));

    try {
      const res = await fetch("/api/whatsapp/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          toolName: selectedWaMcpTool,
          args: waMcpArgs,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const responsePayload = {
          jsonrpc: "2.0",
          result: {
            content: [
              {
                type: "text",
                text: typeof data.result === "string" ? data.result : `Successfully executed ${selectedWaMcpTool}`,
              },
            ],
          },
          id: requestId,
        };
        setWaMcpResponse(JSON.stringify(responsePayload, null, 2));
        setWaParsedResult(data.result);
      } else {
        throw new Error(data.error || "Failed to execute WhatsApp MCP tool");
      }
    } catch (err: any) {
      console.error(err);
      setWaMcpError(err.message || "Failed to contact WhatsApp API. Ensure connection is active.");
      const errorPayload = {
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: err.message || "Execution error",
        },
        id: requestId,
      };
      setWaMcpResponse(JSON.stringify(errorPayload, null, 2));
    } finally {
      setWaMcpLoading(false);
    }
  };

  // Handle Connect/Disconnect toggle
  const handleToggleConnection = async (platformId: string) => {
    if (!user) return;
    const isConnected = !!connections[platformId];

    if (platformId === "gmail" && !isConnected) {
      // Trigger secure Google OAuth code flow redirect via server-side handler passing user.id
      window.location.href = `/api/auth/gmail/connect?userId=${user.id}`;
      return;
    }

    if (platformId === "slack" && !isConnected) {
      // Trigger Slack OAuth connect flow
      window.location.href = `/api/auth/slack/connect?userId=${user.id}`;
      return;
    }

    if (platformId === "whatsapp") {
      if (isConnected) {
        // Disconnect WhatsApp
        try {
          const res = await fetch("/api/whatsapp/disconnect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id }),
          });
          const data = await res.json();
          if (data.success) {
            setConnections((prev) => ({ ...prev, whatsapp: false }));
          } else {
            alert(data.error || "Failed to disconnect WhatsApp");
          }
        } catch (err) {
          console.error("Disconnect error:", err);
        }
      } else {
        // Open connection dialog
        setWaPhoneNumber("");
        setWaPairingCode(null);
        setWaConnectLoading(false);
        setWaStatus("disconnected");
        setIsWaModalOpen(true);
      }
      return;
    }

    const dbPlatformId = platformId.startsWith("custom_") ? `custom_connected_${platformId}` : platformId;

    try {
      // Special-case Gmail and WhatsApp handled elsewhere
      if (platformId === "gmail") {
        localStorage.removeItem("gmail_access_token");
        localStorage.removeItem("gmail_connected");
        setMcpConsoleExecuted(false);
        setMcpEmailsResult([]);
      }

      // If not connected, prefer redirecting to provider-specific connect endpoint.
      if (!isConnected) {
        // WhatsApp uses a custom flow handled above
        if (platformId === "whatsapp") {
          setWaPhoneNumber("");
          setWaPairingCode(null);
          setWaConnectLoading(false);
          setWaStatus("disconnected");
          setIsWaModalOpen(true);
          return;
        }

        // Use server-side connect route which may simulate or perform real OAuth
        window.location.href = `/api/auth/${platformId}/connect?userId=${user.id}`;
        return;
      }

      // If connected, call the server-side disconnect route to revoke/clear credentials
      try {
        const res = await fetch(`/api/auth/${platformId}/disconnect`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });

        if (res.ok) {
          setConnections((prev) => ({ ...prev, [platformId]: false, [dbPlatformId]: false }));
        } else {
          const err = await res.json().catch(() => ({ error: "disconnect_failed" }));
          console.error("Disconnect failed:", err);
          alert(err.error || "Failed to disconnect integration.");
        }
      } catch (e) {
        console.error("Disconnect error:", e);
        alert("Failed to disconnect integration.");
      }
    } catch (err) {
      console.error("Failed to toggle connection:", err);
    }
  };

  // Run Real Gmail REST API MCP call
  const handleExecuteMcpTool = async () => {
    setMcpConsoleLoading(true);
    setMcpConsoleExecuted(false);
    setMcpErrorMsg("");

    const requestId = Math.floor(Math.random() * 1000);
    const requestPayload = {
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: selectedMcpTool,
        arguments: selectedMcpTool === "gmail_list_messages"
          ? { q: mcpQueryInput }
          : { id: mcpMessageId }
      },
      id: requestId
    };
    setMcpRequestJson(JSON.stringify(requestPayload, null, 2));

    try {
      if (selectedMcpTool === "gmail_list_messages") {
        // Call Real Google Gmail API to list messages
        const queryParam = mcpQueryInput ? `&q=${encodeURIComponent(mcpQueryInput)}` : "";
        const listRes = await fetchWithTokenRetry(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5${queryParam}`
        );

        if (listRes.status === 401) {
          localStorage.removeItem("gmail_access_token");
          setConnections(prev => ({ ...prev, gmail: false }));
          throw new Error("Gmail access token unauthorized or expired. Please reconnect Google account.");
        }

        if (!listRes.ok) {
          const errData = await listRes.json().catch(() => ({}));
          throw new Error(errData.error?.message || "Failed to list emails from Gmail API.");
        }

        const listData = await listRes.json();
        const messages = listData.messages || [];

        if (messages.length === 0) {
          const mcpResponse = {
            jsonrpc: "2.0",
            result: {
              content: [{ type: "text", text: "Inbox is clean. No unread messages found." }]
            },
            id: requestId
          };
          setMcpResponseJson(JSON.stringify(mcpResponse, null, 2));
          setMcpEmailsResult([]);
          setMcpMessageId("");
        } else {
          // Fetch details for each message
          const detailsPromises = messages.map(async (msg: any) => {
            const detailRes = await fetchWithTokenRetry(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`
            );
            if (!detailRes.ok) return null;
            const detailData = await detailRes.json();

            // Extract sender, subject and date from headers
            const headers = detailData.payload?.headers || [];
            const fromHeader = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "Unknown";
            const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "(No Subject)";
            const dateHeader = headers.find((h: any) => h.name.toLowerCase() === "date")?.value || "";

            return {
              id: msg.id,
              from: fromHeader,
              subject: subjectHeader,
              date: dateHeader,
              snippet: detailData.snippet || ""
            };
          });

          const emails = (await Promise.all(detailsPromises)).filter(Boolean);
          const mcpResponse = {
            jsonrpc: "2.0",
            result: {
              content: [
                {
                  type: "text",
                  text: `Successfully retrieved ${emails.length} messages from user inbox.`
                }
              ]
            },
            id: requestId
          };
          setMcpResponseJson(JSON.stringify(mcpResponse, null, 2));
          setMcpEmailsResult(emails);
          if (emails.length > 0) {
            setMcpMessageId(emails[0].id);
          }
        }
      } else {
        // Call Real Google Gmail API to get a single message
        if (!mcpMessageId) {
          throw new Error("Please select a message ID or fetch emails list first.");
        }

        const detailRes = await fetchWithTokenRetry(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${mcpMessageId}`
        );

        if (detailRes.status === 401) {
          localStorage.removeItem("gmail_access_token");
          setConnections(prev => ({ ...prev, gmail: false }));
          throw new Error("Gmail access token unauthorized or expired. Please reconnect Google account.");
        }

        if (!detailRes.ok) {
          const errData = await detailRes.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Failed to fetch email with ID ${mcpMessageId}.`);
        }

        const detailData = await detailRes.json();
        const headers = detailData.payload?.headers || [];
        const fromHeader = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "Unknown";
        const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "(No Subject)";
        const dateHeader = headers.find((h: any) => h.name.toLowerCase() === "date")?.value || "";

        const singleEmail = {
          id: mcpMessageId,
          from: fromHeader,
          subject: subjectHeader,
          date: dateHeader,
          snippet: detailData.snippet || ""
        };

        const mcpResponse = {
          jsonrpc: "2.0",
          result: {
            content: [
              {
                type: "text",
                text: `Successfully retrieved message details for message ID "${mcpMessageId}".`
              }
            ]
          },
          id: requestId
        };

        setMcpResponseJson(JSON.stringify(mcpResponse, null, 2));
        setMcpEmailsResult([singleEmail]);
      }
      setMcpConsoleExecuted(true);
    } catch (err: any) {
      console.error("Gmail MCP execution error:", err);
      setMcpErrorMsg(err.message || "Failed to contact Google API. Ensure your token is active.");
    } finally {
      setMcpConsoleLoading(false);
    }
  };

  const platforms: Platform[] = [
    {
      id: "gmail",
      name: "Gmail",
      description: "Connect to fetch client emails, drafts, and automatically compose smart transactional replies.",
      category: "mail",
      brandColor: "bg-red-500",
      glowColor: "shadow-red-500/20 text-red-500",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
        </svg>
      ),
      mcpTools: [
        { name: "gmail_list_messages", description: "Fetch list of unread / high priority emails in user's inbox", parameters: '{"q": "string (optional filter query)"}' },
        { name: "gmail_get_message", description: "Retrieve full details and content of a specific message by ID", parameters: '{"id": "string (required message ID)"}' },
        { name: "gmail_create_draft", description: "Create a draft email reply matching context", parameters: '{"to": "string", "subject": "string", "body": "string"}' },
      ],
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      description: "Monitor chat updates, fetch active threads, and dispatch automated status notifications.",
      category: "communication",
      brandColor: "bg-emerald-500",
      glowColor: "shadow-emerald-500/20 text-emerald-500",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.982L2 22l5.202-1.362a9.923 9.923 0 0 0 4.807 1.226h.003c5.502 0 9.99-4.479 9.991-9.986.002-2.67-1.036-5.18-2.929-7.073A9.919 9.919 0 0 0 12.012 2zm5.727 14.048c-.244.688-1.201 1.25-1.649 1.303-.438.053-.872.23-2.812-.53-2.481-.971-4.077-3.488-4.202-3.653-.125-.165-1.022-1.36-1.022-2.594 0-1.234.647-1.842.877-2.083.23-.241.503-.301.67-.301.167 0 .334.002.48.008.15.006.353-.057.552.424.201.488.687 1.677.747 1.797.06.12.1.26.02.42-.08.16-.12.26-.24.4-.12.14-.251.312-.359.42-.12.12-.245.251-.105.49.14.238.623 1.024 1.336 1.657.918.814 1.69 1.068 1.931 1.188.24.12.38.1.52-.06.14-.16.6-.7 0-.94-.12-.24-.26-.14-.52-.08z" />
        </svg>
      ),
      mcpTools: [
        { name: "whatsapp_get_recent_messages", description: "Fetch last message for all chats", parameters: '{"limit": "number (optional)"}' },
        { name: "whatsapp_read_chat_history", description: "Read chat history for a specific JID/chatId", parameters: '{"chatId": "string (required)"}' },
        { name: "whatsapp_send_message", description: "Send a message to a personal number or JID", parameters: '{"to": "string (phone or JID, required)", "message": "string (required)"}' },
        { name: "whatsapp_search_chats", description: "Search chats by contact name or JID query", parameters: '{"query": "string (required)"}' },
        { name: "whatsapp_summarize_conversations", description: "Summarize recent conversation message logs", parameters: '{"chatId": "string (required)"}' },
        { name: "whatsapp_get_contact_details", description: "Get profile/contact details for a user JID", parameters: '{"jid": "string (required)"}' },
        { name: "whatsapp_list_groups", description: "List all groups the authenticated user belongs to", parameters: '{}' },
        { name: "whatsapp_fetch_group_messages", description: "Fetch message history from a group JID", parameters: '{"groupId": "string (required)"}' },
        { name: "whatsapp_send_group_message", description: "Send a message to a group JID", parameters: '{"groupId": "string (required)", "message": "string (required)"}' }
      ],
    },
    {
      id: "slack",
      name: "Slack",
      description: "Trigger cross-app actions, watch operation channels, and post unified summary alerts.",
      category: "communication",
      brandColor: "bg-amber-500",
      glowColor: "shadow-amber-500/20 text-amber-500",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52zm1.261 0a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.042a2.528 2.528 0 0 1-2.522 2.52H8.823a2.528 2.528 0 0 1-2.52-2.52v-5.042zM8.823 5.043a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.522 2.52v2.52h-2.522a2.528 2.528 0 0 1-2.52-2.52zm0 1.261a2.528 2.528 0 0 1 2.52 2.52v5.043a2.528 2.528 0 0 1-2.52 2.522H3.78a2.528 2.528 0 0 1-2.52-2.522V8.824a2.528 2.528 0 0 1 2.52-2.52h5.043zm10.135 3.78a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.522 2.52 2.528 2.528 0 0 1-2.522 2.52h-2.52V10.084zm-1.262 0a2.528 2.528 0 0 1-2.52 2.52h-5.043a2.528 2.528 0 0 1-2.522-2.52V5.043a2.528 2.528 0 0 1 2.522-2.52h5.043a2.528 2.528 0 0 1 2.52 2.52v5.042zm-3.78 10.135a2.528 2.528 0 0 1-2.52 2.52 2.528 2.528 0 0 1-2.522-2.52v-2.52h2.522a2.528 2.528 0 0 1 2.52 2.52zm0-1.262a2.528 2.528 0 0 1-2.52-2.52v-5.043a2.528 2.528 0 0 1 2.52-2.522h5.043a2.528 2.528 0 0 1 2.52 2.522v5.043a2.528 2.528 0 0 1-2.52 2.52h-5.043z" />
        </svg>
      ),
      mcpTools: [
        { name: "slack_list_channels", description: "Fetch Slack workspace channels list", parameters: '{"types": "string (optional)"}' },
        { name: "slack_post_message", description: "Post message alert to a specific channel", parameters: '{"channel": "string", "text": "string"}' },
      ],
    },
    {
      id: "outlook",
      name: "Outlook",
      description: "Sync Outlook mail inbox and handle calendar invites with platform edge actions.",
      category: "mail",
      brandColor: "bg-blue-600",
      glowColor: "shadow-blue-600/20 text-blue-400",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.203 7.043l9.797-5.836v10.916L2.203 9.47v-2.427zm9.797 6.136v10.978l-9.797-5.815V15.93l9.797-2.751zm1.203-12.03l9.797 5.836v2.427l-9.797 2.653V1.149zm9.797 9.32v6.425l-9.797 2.815v-12.03l9.797 2.79z" />
        </svg>
      ),
      mcpTools: [
        { name: "outlook_list_messages", description: "Retrieve list of incoming emails", parameters: '{"top": "number (optional)"}' },
        { name: "outlook_send_message", description: "Compose and dispatch an Outlook email", parameters: '{"to": "string", "subject": "string", "body": "string"}' },
      ],
    },
    {
      id: "discord",
      name: "Discord",
      description: "Dispatch operation logs, deploy release reports, and sync status alerts to servers.",
      category: "communication",
      brandColor: "bg-indigo-600",
      glowColor: "shadow-indigo-600/20 text-indigo-400",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.27 4.73a16.14 16.14 0 0 0-4.07-1.27l-.32.74a14.28 14.28 0 0 0-5.76 0l-.33-.74a16.14 16.14 0 0 0-4.07 1.27C1.66 9.42.5 14.58 1.13 19.67A16.14 16.14 0 0 0 6.08 22c.42-.55.79-1.15 1.1-1.79a11.51 11.51 0 0 1-1.78-.85l.26-.2c3.48 1.61 7.28 1.61 10.68 0l.26.2c-.56.33-1.16.62-1.78.85.31.64.68 1.24 1.1 1.79a16.14 16.14 0 0 0 4.95-2.33c.77-5.86-.53-10.9-4.34-14.94zM9 14.5a1.5 1.5 0 1 1 1.5-1.5 1.5 1.5 0 0 1-1.5 1.5zm6 0a1.5 1.5 0 1 1 1.5-1.5 1.5 1.5 0 0 1-1.5 1.5z" />
        </svg>
      ),
      mcpTools: [
        { name: "discord_post_message", description: "Post an automated message into a channel", parameters: '{"channelId": "string", "content": "string"}' },
      ],
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      description: "Automate social profile postings and track publication analytics for company updates.",
      category: "social",
      brandColor: "bg-blue-700",
      glowColor: "shadow-blue-700/20 text-blue-500",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      ),
      mcpTools: [
        { name: "linkedin_post_update", description: "Publish an update to LinkedIn profile", parameters: '{"text": "string"}' },
      ],
    },
    {
      id: "telegram",
      name: "Telegram",
      description: "Dispatch urgent notifications, interact with custom bots, and monitor status updates.",
      category: "communication",
      brandColor: "bg-sky-500",
      glowColor: "shadow-sky-500/20 text-sky-500",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.05 1.95c-.2-.2-.51-.25-.76-.1l-19.8 8.1c-.3.12-.48.43-.44.75s.28.56.58.6l5.22 1.3 2.92 5.1c.15.26.43.41.73.4.3 0 .57-.17.69-.45l1.98-4.5 5.58 4.2c.2.15.48.17.7.05s.33-.37.28-.62l-3-14.7c-.05-.28-.24-.5-.51-.57l-4.52.88 4.7 3.52c.2.15.5.07.6-.17l1-2.3zM9.54 15.56l-.3 2.94 1.4-1.92-.1-1.02z" />
        </svg>
      ),
      mcpTools: [
        { name: "telegram_send_message", description: "Send automated updates via a Telegram bot", parameters: '{"chatId": "string", "text": "string"}' },
      ],
    },
    {
      id: "jira",
      name: "Jira",
      description: "Sync development workflows, manage project tickets, and automate sprint status updates.",
      category: "productivity",
      brandColor: "bg-blue-600",
      glowColor: "shadow-blue-600/20 text-blue-400",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.2 2a.8.8 0 0 0-.8.8v6.4c0 .4.4.8.8.8h6.4c.4 0 .8-.4.8-.8V2.8a.8.8 0 0 0-.8-.8h-6.4zm-6.1 6.1a.8.8 0 0 0-.8.8v6.4c0 .4.4.8.8.8h6.4c.4 0 .8-.4.8-.8V8.9a.8.8 0 0 0-.8-.8H6.1zm12.2 0a.8.8 0 0 0-.8.8v6.4c0 .4.4.8.8.8H21.2c.4 0 .8-.4.8-.8V8.9a.8.8 0 0 0-.8-.8h-2.7z" />
        </svg>
      ),
      mcpTools: [
        { name: "jira_get_issue", description: "Retrieve details of a Jira issue by its key", parameters: '{"issueKey": "string"}' },
        { name: "jira_create_issue", description: "Create a new issue inside a specified project", parameters: '{"projectKey": "string", "summary": "string", "description": "string"}' },
      ],
    },
    {
      id: "trello",
      name: "Trello",
      description: "Manage boards, lists, and cards to streamline tasks and track visual board updates.",
      category: "productivity",
      brandColor: "bg-sky-600",
      glowColor: "shadow-sky-600/20 text-sky-400",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <rect x="7" y="7" width="4" height="10" rx="1" fill="currentColor" />
          <rect x="13" y="7" width="4" height="6" rx="1" fill="currentColor" />
        </svg>
      ),
      mcpTools: [
        { name: "trello_get_boards", description: "Fetch boards associated with the user account", parameters: '{"limit": "number (optional)"}' },
        { name: "trello_create_card", description: "Create a new task card in a specific list", parameters: '{"listId": "string", "name": "string", "desc": "string"}' },
      ],
    },
    {
      id: "asana",
      name: "Asana",
      description: "Track team objectives, assign task responsibilities, and monitor project milestones.",
      category: "productivity",
      brandColor: "bg-rose-500",
      glowColor: "shadow-rose-500/20 text-rose-400",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="6" r="2.5" />
          <circle cx="7.5" cy="14" r="2.5" />
          <circle cx="16.5" cy="14" r="2.5" />
        </svg>
      ),
      mcpTools: [
        { name: "asana_get_tasks", description: "Fetch tasks assigned within a specific workspace", parameters: '{"workspaceId": "string"}' },
        { name: "asana_create_task", description: "Add a new task with assignees and due dates", parameters: '{"workspaceId": "string", "name": "string"}' },
      ],
    },
    {
      id: "meet",
      name: "Google Meet",
      description: "Schedule instant secure video calls, manage meetings, and extract real-time transcripts.",
      category: "communication",
      brandColor: "bg-teal-600",
      glowColor: "shadow-teal-600/20 text-teal-400",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
        </svg>
      ),
      mcpTools: [
        { name: "meet_create_event", description: "Create a video meeting room and generate invite links", parameters: '{"summary": "string", "startTime": "string"}' },
      ],
    },
    {
      id: "zoom",
      name: "Zoom",
      description: "Instantly launch webinars, host team meetings, and capture post-call recordings.",
      category: "communication",
      brandColor: "bg-blue-500",
      glowColor: "shadow-blue-500/20 text-blue-400",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 11.5l2.5 1.88v-6.76l-2.5 1.88V9c0-.55-.45-1-1-1H7.5c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h7c.55 0 1-.45 1-1v-1.5z" />
        </svg>
      ),
      mcpTools: [
        { name: "zoom_create_meeting", description: "Schedule a new video meeting with security passcodes", parameters: '{"topic": "string", "duration": "number"}' },
      ],
    },
    {
      id: "notion",
      name: "Notion",
      description: "Query workspace pages, update product wikis, and organize structured block documents.",
      category: "productivity",
      brandColor: "bg-zinc-800",
      glowColor: "shadow-zinc-800/20 text-zinc-400",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4.2 3h15.6c.7 0 1.2.5 1.2 1.2v15.6c0 .7-.5 1.2-1.2 1.2H4.2A1.2 1.2 0 0 1 3 19.8V4.2C3 3.5 3.5 3 4.2 3zm3.3 3.6v10.8h2.1v-6.6l4.2 6.6h2.1V6.6h-2.1v6.6L9.6 6.6H7.5z" />
        </svg>
      ),
      mcpTools: [
        { name: "notion_get_page", description: "Retrieve rich text and properties from a workspace page", parameters: '{"pageId": "string"}' },
        { name: "notion_append_block", description: "Append a list of block elements or notes to a page", parameters: '{"pageId": "string", "blocks": "array"}' },
      ],
    },
    {
      id: "manus",
      name: "Manus",
      description: "Execute autonomous browsing tasks and retrieve verified web data seamlessly.",
      category: "productivity",
      brandColor: "bg-purple-600",
      glowColor: "shadow-purple-600/20 text-purple-400",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2z" />
          <path d="M14 9h4a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-4" />
          <circle cx="8" cy="12" r="2" fill="currentColor" />
        </svg>
      ),
      mcpTools: [
        { name: "manus_run_agent", description: "Launch an autonomous browsing session with a custom prompt", parameters: '{"prompt": "string"}' },
      ],
    },
    {
      id: "zapier",
      name: "Zapier",
      description: "Trigger automated multi-app workflows and coordinate webhooks across applications.",
      category: "productivity",
      brandColor: "bg-orange-500",
      glowColor: "shadow-orange-500/20 text-orange-400",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.4 7.4h7.8l-6.3 4.6 2.4 7.4-6.3-4.6-6.3 4.6 2.4-7.4-6.3-4.6h7.8z" />
        </svg>
      ),
      mcpTools: [
        { name: "zapier_trigger_zap", description: "Fire a custom webhook rule to execute an active Zap", parameters: '{"zapId": "string", "payload": "object"}' },
      ],
    },
    {
      id: "tango",
      name: "Tango",
      description: "Generate interactive step-by-step how-to documentation guides automatically.",
      category: "productivity",
      brandColor: "bg-pink-500",
      glowColor: "shadow-pink-500/20 text-pink-400",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
        </svg>
      ),
      mcpTools: [
        { name: "tango_get_workflows", description: "Retrieve list of documented workflows and guides", parameters: '{"limit": "number (optional)"}' },
      ],
    },
    {
      id: "toggl",
      name: "Toggl",
      description: "Track task duration, monitor team productivity, and analyze weekly client reports.",
      category: "productivity",
      brandColor: "bg-rose-600",
      glowColor: "shadow-rose-600/20 text-rose-400",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      mcpTools: [
        { name: "toggl_start_timer", description: "Start a new time entry with description and tags", parameters: '{"description": "string", "pid": "number"}' },
        { name: "toggl_stop_timer", description: "Stop the current running time tracking entry", parameters: '{"id": "number"}' },
      ],
    },
    {
      id: "calendly",
      name: "Calendly",
      description: "Share booking links, schedule call slots, and minimize scheduling conflicts.",
      category: "productivity",
      brandColor: "bg-blue-600",
      glowColor: "shadow-blue-600/20 text-blue-400",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <circle cx="12" cy="16" r="2" fill="currentColor" />
        </svg>
      ),
      mcpTools: [
        { name: "calendly_get_events", description: "Fetch upcoming scheduled meeting slots and bookings", parameters: '{"status": "string (active)"}' },
      ],
    },
    {
      id: "google_calendar",
      name: "Google Calendar",
      description: "Sync daily calendar agendas, manage event invites, and handle automated schedules.",
      category: "productivity",
      brandColor: "bg-blue-500",
      glowColor: "shadow-blue-500/20 text-blue-400",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
        </svg>
      ),
      mcpTools: [
        { name: "gcal_list_events", description: "Fetch event schedules for a specified calendar ID", parameters: '{"calendarId": "string"}' },
        { name: "gcal_create_event", description: "Schedule a new event with invitees and location details", parameters: '{"calendarId": "string", "summary": "string", "startTime": "string", "endTime": "string"}' },
      ],
    },
    {
      id: "google_drive",
      name: "Google Drive",
      description: "Search shared documents, upload media assets, and retrieve text file contents.",
      category: "productivity",
      brandColor: "bg-emerald-600",
      glowColor: "shadow-emerald-600/20 text-emerald-400",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.43 12.98l-6.73-11.53c-.37-.63-1.03-1.03-1.77-1.03h-2.07c-.74 0-1.4.4-1.77 1.03L.36 12.98c-.37.63-.37 1.4 0 2.04l6.73 11.53c.37.63 1.03 1.03 1.77 1.03h2.07c.74 0 1.4-.4 1.77-1.03l6.73-11.53c.37-.63.37-1.41 0-2.04zM8.33 2.45h2.2l5.65 9.7h-2.2L8.33 2.45zm-2.2 3.8l3.86 6.6-4.95 8.5-3.86-6.6 4.95-8.5zm11.54 13.92H6.13l2.75-4.73h11.54l-2.75 4.73z" />
        </svg>
      ),
      mcpTools: [
        { name: "gdrive_search_files", description: "Search file records by name, MIME type, or content", parameters: '{"q": "string"}' },
        { name: "gdrive_download_file", description: "Download file contents for a specified ID", parameters: '{"fileId": "string"}' },
      ],
    },
    {
      id: "github",
      name: "GitHub",
      description: "Sync code repositories, monitor commits, track pull requests, and manage issue tickets.",
      category: "productivity",
      brandColor: "bg-zinc-800",
      glowColor: "shadow-zinc-800/20 text-zinc-400",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
        </svg>
      ),
      mcpTools: [
        { name: "github_list_repos", description: "List user repositories", parameters: '{}' },
        { name: "github_get_pull_requests", description: "Fetch active pull requests for a repository", parameters: '{"repo": "string"}' },
        { name: "github_create_issue", description: "Create a new issue inside a repository", parameters: '{"repo": "string", "title": "string", "body": "string"}' },
      ],
    },
    {
      id: "teams",
      name: "Microsoft Teams",
      description: "Coordinate workspace chat channels, receive meeting alerts, and broadcast status reports.",
      category: "communication",
      brandColor: "bg-indigo-600",
      glowColor: "shadow-indigo-600/20 text-indigo-400",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 22v-3H9c-1.1 0-2-.9-2-2v-5H2c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h5V5c0-1.1.9-2 2-2h3V2c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v3h3c1.1 0 2 .9 2 2v5c0 1.1-.9 2-2 2h-5v5c0 1.1-.9 2-2 2h-3v3c0 1.1-.9 2-2 2zm1-8h4v-3h-4v3zm5-5h3V6h-3v3zm-9 3h3V9H9v3z" />
        </svg>
      ),
      mcpTools: [
        { name: "teams_list_channels", description: "List Teams channels", parameters: '{}' },
        { name: "teams_send_message", description: "Post a message into a specified channel", parameters: '{"channelId": "string", "text": "string"}' },
      ],
    },
    {
      id: "lark",
      name: "Lark",
      description: "Sync Lark workspace conversations, manage calendar scheduling, and sync shared files.",
      category: "communication",
      brandColor: "bg-blue-600",
      glowColor: "shadow-blue-600/20 text-blue-400",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM12 18l-3-3h6l-3 3zm-4-8h8v2H8v-2z" />
        </svg>
      ),
      mcpTools: [
        { name: "lark_get_chat_history", description: "Fetch recent messages from a Lark group chat", parameters: '{"chatId": "string"}' },
        { name: "lark_send_message", description: "Send a message to a user or group chat", parameters: '{"chatId": "string", "text": "string"}' },
      ],
    },
    {
      id: "instagram",
      name: "Instagram",
      description: "Track social media publications, view recent story mentions, and manage direct messages.",
      category: "social",
      brandColor: "bg-pink-600",
      glowColor: "shadow-pink-600/20 text-pink-400",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      ),
      mcpTools: [
        { name: "instagram_get_feed", description: "List recent media posts", parameters: '{}' },
        { name: "instagram_get_messages", description: "Fetch unread direct messages", parameters: '{}' },
      ],
    },
    {
      id: "x_twitter",
      name: "X / Twitter",
      description: "Monitor brand mentions, track search queries, draft and publish tweets automatically.",
      category: "social",
      brandColor: "bg-zinc-900",
      glowColor: "shadow-zinc-900/20 text-zinc-300",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      mcpTools: [
        { name: "x_post_tweet", description: "Publish a new tweet update", parameters: '{"text": "string"}' },
        { name: "x_search_mentions", description: "Search for posts mentioning your handle", parameters: '{"query": "string"}' },
      ],
    },
    {
      id: "threads",
      name: "Threads",
      description: "Publish threads updates, sync social mentions, and manage thread comments.",
      category: "social",
      brandColor: "bg-zinc-900",
      glowColor: "shadow-zinc-900/20 text-zinc-350",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.44 2.25c-5.32 0-9.66 4.34-9.66 9.66s4.34 9.66 9.66 9.66h.17c5.11-.08 9.32-4.17 9.49-9.28.02-.37-.28-.68-.65-.68-.34 0-.63.26-.66.6-.13 3.99-3.41 7.18-7.44 7.24h-.13c-4.57 0-8.29-3.71-8.29-8.29s3.71-8.29 8.29-8.29c4.27 0 7.82 3.25 8.25 7.44h-2.18c-.41-2.92-2.92-5.17-5.96-5.17-3.32 0-6.03 2.71-6.03 6.03s2.71 6.03 6.03 6.03c1.78 0 3.39-.77 4.51-2.02l.66.66c-1.39 1.56-3.4 2.52-5.64 2.52-3.99 0-7.24-3.25-7.24-7.24s3.25-7.24 7.24-7.24c3.67 0 6.7 2.75 7.18 6.32h2.24c-.49-4.75-4.51-8.48-9.35-8.48z" />
        </svg>
      ),
      mcpTools: [
        { name: "threads_post_update", description: "Publish a new text/media post to Threads", parameters: '{"text": "string"}' },
        { name: "threads_get_user_profile", description: "Fetch profile details and user stats", parameters: '{}' },
      ],
    },
  ];

  const displayedPlatforms: Platform[] = [...platforms, ...customApps];

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto space-y-8 animate-fade-in relative text-foreground">

      {/* Title block */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">
          Workspace Integrations
        </h1>
        <p className="text-zinc-400 text-sm md:text-base max-w-2xl">
          Connect your daily operations tools securely. Integrate messaging, mailing, document files, and social platforms in one click using Model Context Protocol (MCP).
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-zinc-500 text-sm font-medium">Loading platform connections...</p>
          </div>
        </div>
      ) : (
        /* Grid Layout */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedPlatforms.map((platform) => {
            const isConnected = !!connections[platform.id];
            return (
              <div
                key={platform.id}
                className={`rounded-3xl glass-panel p-6 flex flex-col justify-between transition-all duration-300 relative border group ${isConnected
                  ? "border-violet-500/25 bg-foreground/[0.02] shadow-[0_0_30px_rgba(139,92,246,0.08)]"
                  : "border-border-color bg-foreground/[0.01] hover:border-violet-500/20"
                  }`}
              >
                {/* Connection Pill */}
                <div className="absolute top-4 right-4">
                  {isConnected ? (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Connected
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-foreground/[0.05] border border-border-color text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                      Offline
                    </span>
                  )}
                </div>

                {/* Logo & Category */}
                <div className="flex items-start gap-4 mb-6">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${platform.brandColor} shadow-lg shrink-0 group-hover:scale-105 transition-transform duration-300`}
                  >
                    {platform.icon}
                  </div>
                  <div className="pt-1">
                    <h3 className="text-lg font-bold text-foreground leading-none mb-1.5">{platform.name}</h3>
                    <span className="text-[10px] uppercase font-extrabold text-zinc-500 tracking-widest bg-foreground/[0.05] px-2 py-0.5 rounded-md border border-border-color">
                      {platform.category}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-zinc-400 leading-relaxed mb-6 min-h-[40px]">
                  {platform.description}
                </p>

                {/* Action Row */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => handleToggleConnection(platform.id)}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${isConnected
                      ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-600 hover:text-white"
                      : "bg-foreground/[0.05] text-foreground border border-border-color hover:bg-foreground/[0.1]"
                      }`}
                  >
                    {isConnected ? "Disconnect" : "Connect"}
                  </button>

                  {isConnected && (
                    <>
                      <button
                        onClick={() => handleRefreshToken(platform.id)}
                        disabled={!!refreshingPlatforms[platform.id]}
                        className="px-3 py-2 rounded-xl bg-foreground/[0.03] border border-border-color text-zinc-400 hover:bg-foreground/[0.06] transition-all cursor-pointer text-xs font-medium"
                        title="Refresh tokens"
                      >
                        {refreshingPlatforms[platform.id] ? "Refreshing..." : "Refresh"}
                      </button>

                      <button
                        onClick={() => {
                          setSelectedPlatform(platform);
                        }}
                        className="p-2.5 rounded-xl bg-foreground/[0.05] border border-border-color text-zinc-400 hover:text-foreground hover:bg-foreground/[0.1] transition-all cursor-pointer"
                        title="MCP Settings"
                      >
                        <HugeiconsIcon icon={Settings01Icon} size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Gmail specific live simulator - Rendered on main page when Gmail is connected */}
      {connections.gmail && (
        <div className="border-t border-border-color pt-8 mt-12 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                Gmail Real Data MCP Console
              </h3>
              <p className="text-xs text-zinc-400">Execute Google API calls using Model Context Protocol standard</p>
            </div>
            <span className="text-[10px] text-zinc-500 bg-foreground/[0.05] border border-border-color px-3 py-1 rounded-full font-mono uppercase font-bold tracking-wider">
              status: active
            </span>
          </div>

          {mcpErrorMsg && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs leading-normal">
              {mcpErrorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

            {/* Tool runner settings */}
            <div className="lg:col-span-5 p-6 rounded-3xl glass-panel border border-border-color flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Select MCP Tool</label>
                  <select
                    value={selectedMcpTool}
                    onChange={(e) => setSelectedMcpTool(e.target.value)}
                    className="w-full px-3 py-3 bg-background border border-border-color rounded-xl text-xs text-foreground focus:outline-none focus:border-violet-500"
                  >
                    <option value="gmail_list_messages">gmail_list_messages</option>
                    <option value="gmail_get_message">gmail_get_message</option>
                  </select>
                </div>

                {selectedMcpTool === "gmail_list_messages" ? (
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Query Filter (q)</label>
                    <input
                      type="text"
                      value={mcpQueryInput}
                      onChange={(e) => setMcpQueryInput(e.target.value)}
                      placeholder="e.g. is:unread"
                      className="w-full px-3 py-2.5 bg-background border border-border-color rounded-xl text-xs text-foreground placeholder-zinc-600 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Message ID (id)</label>
                    {mcpEmailsResult.length > 0 ? (
                      <select
                        value={mcpMessageId}
                        onChange={(e) => setMcpMessageId(e.target.value)}
                        className="w-full px-3 py-3 bg-background border border-border-color rounded-xl text-xs text-foreground focus:outline-none focus:border-violet-500"
                      >
                        <option value="">-- Select Message --</option>
                        {mcpEmailsResult.map((e) => (
                          <option key={e.id} value={e.id}>{e.id} - {e.from.split("<")[0].trim()}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={mcpMessageId}
                          onChange={(e) => setMcpMessageId(e.target.value)}
                          placeholder="e.g. 17a9bc28d3efb190"
                          className="w-full px-3 py-2.5 bg-background border border-border-color rounded-xl text-xs text-foreground placeholder-zinc-600 focus:outline-none focus:border-violet-500"
                        />
                        <p className="text-[10px] text-zinc-500">Run <strong>gmail_list_messages</strong> first to select a message, or paste an ID.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={handleExecuteMcpTool}
                disabled={mcpConsoleLoading}
                className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <HugeiconsIcon icon={PlayIcon} size={14} />
                {mcpConsoleLoading ? "Calling MCP Server..." : "Execute MCP Tool"}
              </button>
            </div>

            {/* Terminal console JSON view */}
            <div className="lg:col-span-7 flex flex-col bg-background border border-border-color rounded-3xl overflow-hidden min-h-[300px]">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border-color bg-foreground/[0.02]">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-[10px] font-mono text-zinc-500 ml-2">mcp-rpc-terminal</span>
              </div>

              <div className="flex-1 p-4 font-mono text-[10px] space-y-4 overflow-y-auto max-h-[320px] no-scrollbar">
                {mcpConsoleLoading ? (
                  <div className="flex justify-center items-center h-full text-zinc-500">
                    <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-2">Requesting Google OAuth Endpoint...</span>
                  </div>
                ) : mcpConsoleExecuted ? (
                  <div className="space-y-4">
                    <div>
                      <span className="text-zinc-500 block mb-1"># CLIENT REQUEST</span>
                      <pre className="text-cyan-400 bg-cyan-950/20 p-3 rounded-xl border border-cyan-500/10 overflow-x-auto">{mcpRequestJson}</pre>
                    </div>
                    <div>
                      <span className="text-zinc-500 block mb-1"># SERVER RESPONSE</span>
                      <pre className="text-emerald-400 bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/10 overflow-x-auto">{mcpResponseJson}</pre>
                    </div>
                  </div>
                ) : (
                  <div className="text-zinc-500 italic flex items-center justify-center h-full text-center p-6">
                    Select tool parameters above and execute to list or inspect real emails dynamically using Model Context Protocol.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Inbox Result display */}
          {mcpConsoleExecuted && !mcpConsoleLoading && mcpEmailsResult.length > 0 && (
            <div className="pt-4 space-y-3">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Parsed Message Payload</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mcpEmailsResult.map((email) => (
                  <div key={email.id} className="p-4 rounded-2xl bg-card-bg border border-border-color flex flex-col gap-1 text-left relative overflow-hidden group">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-foreground">{email.from}</span>
                      <span className="text-[10px] text-zinc-500">{email.date}</span>
                    </div>
                    <span className="text-xs font-semibold text-foreground mt-1">{email.subject}</span>
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{email.snippet}</p>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[9px] font-mono text-zinc-600">{email.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* WhatsApp specific live simulator - Rendered on main page when WhatsApp is connected */}
      {connections.whatsapp && (
        <div className="border-t border-border-color pt-8 mt-12 space-y-6 animate-fade-in text-foreground">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                WhatsApp Real Data MCP Console
              </h3>
              <p className="text-xs text-zinc-400">Execute WhatsApp Web API calls using Model Context Protocol standard</p>
            </div>
            <span className="text-[10px] text-zinc-500 bg-foreground/[0.05] border border-border-color px-3 py-1 rounded-full font-mono uppercase font-bold tracking-wider">
              status: connected
            </span>
          </div>

          {waMcpError && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs leading-normal">
              {waMcpError}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

            {/* Tool runner settings */}
            <div className="lg:col-span-5 p-6 rounded-3xl glass-panel border border-border-color flex flex-col justify-between space-y-6 bg-foreground/[0.01]">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Select WhatsApp MCP Tool</label>
                  <select
                    value={selectedWaMcpTool}
                    onChange={(e) => {
                      setSelectedWaMcpTool(e.target.value);
                      setWaMcpArgs({});
                    }}
                    className="w-full px-3 py-3 bg-background border border-border-color rounded-xl text-xs text-foreground focus:outline-none focus:border-violet-500"
                  >
                    <option value="whatsapp_get_recent_messages">whatsapp_get_recent_messages</option>
                    <option value="whatsapp_read_chat_history">whatsapp_read_chat_history</option>
                    <option value="whatsapp_send_message">whatsapp_send_message</option>
                    <option value="whatsapp_search_chats">whatsapp_search_chats</option>
                    <option value="whatsapp_summarize_conversations">whatsapp_summarize_conversations</option>
                    <option value="whatsapp_get_contact_details">whatsapp_get_contact_details</option>
                    <option value="whatsapp_list_groups">whatsapp_list_groups</option>
                    <option value="whatsapp_fetch_group_messages">whatsapp_fetch_group_messages</option>
                    <option value="whatsapp_send_group_message">whatsapp_send_group_message</option>
                  </select>
                </div>

                {/* Dynamic inputs based on tool */}
                {selectedWaMcpTool === "whatsapp_get_recent_messages" && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Limit (optional)</label>
                    <input
                      type="number"
                      placeholder="e.g. 10"
                      onChange={(e) => setWaMcpArgs({ ...waMcpArgs, limit: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="w-full px-3 py-2.5 bg-background border border-border-color rounded-xl text-xs text-foreground placeholder-zinc-600 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                )}

                {(selectedWaMcpTool === "whatsapp_read_chat_history" || selectedWaMcpTool === "whatsapp_summarize_conversations") && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Chat JID / ID (chatId)</label>
                    <input
                      type="text"
                      placeholder="e.g. 1234567890@s.whatsapp.net"
                      value={waMcpArgs.chatId || ""}
                      onChange={(e) => setWaMcpArgs({ ...waMcpArgs, chatId: e.target.value })}
                      className="w-full px-3 py-2.5 bg-background border border-border-color rounded-xl text-xs text-foreground placeholder-zinc-600 focus:outline-none focus:border-violet-500"
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">Use a full JID or phone-based JID</p>
                  </div>
                )}

                {selectedWaMcpTool === "whatsapp_send_message" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">To JID / Phone (to)</label>
                      <input
                        type="text"
                        placeholder="e.g. 1234567890"
                        value={waMcpArgs.to || ""}
                        onChange={(e) => setWaMcpArgs({ ...waMcpArgs, to: e.target.value })}
                        className="w-full px-3 py-2.5 bg-background border border-border-color rounded-xl text-xs text-foreground placeholder-zinc-600 focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Message Content (message)</label>
                      <textarea
                        placeholder="Type message here..."
                        value={waMcpArgs.message || ""}
                        onChange={(e) => setWaMcpArgs({ ...waMcpArgs, message: e.target.value })}
                        className="w-full px-3 py-2.5 bg-background border border-border-color rounded-xl text-xs text-foreground placeholder-zinc-600 focus:outline-none focus:border-violet-500 min-h-[60px]"
                      />
                    </div>
                  </div>
                )}

                {selectedWaMcpTool === "whatsapp_search_chats" && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Query</label>
                    <input
                      type="text"
                      placeholder="e.g. John"
                      value={waMcpArgs.query || ""}
                      onChange={(e) => setWaMcpArgs({ ...waMcpArgs, query: e.target.value })}
                      className="w-full px-3 py-2.5 bg-background border border-border-color rounded-xl text-xs text-foreground placeholder-zinc-600 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                )}

                {selectedWaMcpTool === "whatsapp_get_contact_details" && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Contact JID (jid)</label>
                    <input
                      type="text"
                      placeholder="e.g. 1234567890@s.whatsapp.net"
                      value={waMcpArgs.jid || ""}
                      onChange={(e) => setWaMcpArgs({ ...waMcpArgs, jid: e.target.value })}
                      className="w-full px-3 py-2.5 bg-background border border-border-color rounded-xl text-xs text-foreground placeholder-zinc-600 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                )}

                {selectedWaMcpTool === "whatsapp_fetch_group_messages" && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Group JID (groupId)</label>
                    <input
                      type="text"
                      placeholder="e.g. 1203630248384@g.us"
                      value={waMcpArgs.groupId || ""}
                      onChange={(e) => setWaMcpArgs({ ...waMcpArgs, groupId: e.target.value })}
                      className="w-full px-3 py-2.5 bg-background border border-border-color rounded-xl text-xs text-foreground placeholder-zinc-600 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                )}

                {selectedWaMcpTool === "whatsapp_send_group_message" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Group JID (groupId)</label>
                      <input
                        type="text"
                        placeholder="e.g. 1203630248384@g.us"
                        value={waMcpArgs.groupId || ""}
                        onChange={(e) => setWaMcpArgs({ ...waMcpArgs, groupId: e.target.value })}
                        className="w-full px-3 py-2.5 bg-background border border-border-color rounded-xl text-xs text-foreground placeholder-zinc-600 focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Message Content (message)</label>
                      <textarea
                        placeholder="Type group message here..."
                        value={waMcpArgs.message || ""}
                        onChange={(e) => setWaMcpArgs({ ...waMcpArgs, message: e.target.value })}
                        className="w-full px-3 py-2.5 bg-background border border-border-color rounded-xl text-xs text-foreground placeholder-zinc-600 focus:outline-none focus:border-violet-500 min-h-[60px]"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleExecuteWaMcp}
                disabled={waMcpLoading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <HugeiconsIcon icon={PlayIcon} size={14} />
                {waMcpLoading ? "Calling MCP Server..." : "Execute MCP Tool"}
              </button>
            </div>

            {/* Terminal console JSON view */}
            <div className="lg:col-span-7 flex flex-col bg-background border border-border-color rounded-3xl overflow-hidden min-h-[300px]">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border-color bg-foreground/[0.02]">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-[10px] font-mono text-zinc-500 ml-2">whatsapp-mcp-rpc-terminal</span>
              </div>

              <div className="flex-1 p-4 font-mono text-[10px] space-y-4 overflow-y-auto max-h-[320px] no-scrollbar">
                {waMcpLoading ? (
                  <div className="flex justify-center items-center h-full text-zinc-500">
                    <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-2">Requesting WhatsApp MCP Endpoint...</span>
                  </div>
                ) : waMcpResponse ? (
                  <div className="space-y-4">
                    <div>
                      <span className="text-zinc-500 block mb-1"># CLIENT REQUEST</span>
                      <pre className="text-cyan-400 bg-cyan-950/20 p-3 rounded-xl border border-cyan-500/10 overflow-x-auto">{waMcpRequest}</pre>
                    </div>
                    <div>
                      <span className="text-zinc-500 block mb-1"># SERVER RESPONSE</span>
                      <pre className="text-emerald-400 bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/10 overflow-x-auto">{waMcpResponse}</pre>
                    </div>
                  </div>
                ) : (
                  <div className="text-zinc-500 italic flex items-center justify-center h-full text-center p-6">
                    Select tool parameters above and execute to list or inspect WhatsApp data dynamically.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Parsed Result Display */}
          {waParsedResult && (
            <div className="pt-4 space-y-3">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Parsed Result View</h4>
              <div className="p-5 bg-foreground/[0.02] border border-border-color rounded-2xl text-xs text-foreground overflow-x-auto max-h-[400px] overflow-y-auto no-scrollbar">
                {Array.isArray(waParsedResult) ? (
                  <div className="space-y-3">
                    {waParsedResult.map((item: any, idx: number) => (
                      <div key={idx} className="pb-3 border-b border-border-color/50 last:border-b-0 last:pb-0 flex flex-col gap-1">
                        {item.chatId && (
                          <div className="flex justify-between">
                            <span className="font-bold text-emerald-400">{item.name || item.chatId}</span>
                            <span className="text-zinc-500 text-[10px]">{item.timestamp || "N/A"}</span>
                          </div>
                        )}
                        {item.lastMessage && <p className="text-zinc-300">Last: {item.lastMessage}</p>}
                        {item.body && (
                          <div className="flex flex-col gap-1 bg-foreground/[0.02] p-2.5 rounded-xl border border-border-color">
                            <div className="flex justify-between text-[10px] text-zinc-500">
                              <span>From: {item.from}</span>
                              <span>{item.timestamp ? new Date(item.timestamp).toLocaleString() : ""}</span>
                            </div>
                            <p className="text-zinc-200">{item.body}</p>
                          </div>
                        )}
                        {item.id && item.isGroup && (
                          <div className="flex justify-between items-center bg-foreground/[0.01] p-2 rounded-xl border border-border-color">
                            <span className="font-bold text-violet-400">{item.name}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">{item.id}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : typeof waParsedResult === "string" ? (
                  <p className="leading-relaxed">{waParsedResult}</p>
                ) : (
                  <pre className="font-mono text-[10px]">{JSON.stringify(waParsedResult, null, 2)}</pre>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* WhatsApp Connection Modal */}
      {isWaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-md p-6 md:p-8 rounded-3xl border border-border-color shadow-2xl relative animate-fade-in space-y-6 bg-background text-foreground">

            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-border-color pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-emerald-500 shadow-md">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.982L2 22l5.202-1.362a9.923 9.923 0 0 0 4.807 1.226h.003c5.502 0 9.99-4.479 9.991-9.986.002-2.67-1.036-5.18-2.929-7.073A9.919 9.919 0 0 0 12.012 2zm5.727 14.048c-.244.688-1.201 1.25-1.649 1.303-.438.053-.872.23-2.812-.53-2.481-.971-4.077-3.488-4.202-3.653-.125-.165-1.022-1.36-1.022-2.594 0-1.234.647-1.842.877-2.083.23-.241.503-.301.67-.301.167 0 .334.002.48.008.15.006.353-.057.552.424.201.488.687 1.677.747 1.797.06.12.1.26.02.42-.08.16-.12.26-.24.4-.12.14-.251.312-.359.42-.12.12-.245.251-.105.49.14.238.623 1.024 1.336 1.657.918.814 1.69 1.068 1.931 1.188.24.12.38.1.52-.06.14-.16.6-.7 0-.94-.12-.24-.26-.14-.52-.08z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold">Connect WhatsApp</h2>
                  <p className="text-xs text-zinc-400">Link using pairing code</p>
                </div>
              </div>
              <button
                onClick={handleCloseWaModal}
                className="text-zinc-500 hover:text-foreground bg-foreground/[0.05] hover:bg-foreground/[0.1] p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4">
              {waStatus === "disconnected" && (
                <div className="space-y-4">
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Enter your phone number (including country code, e.g., <code className="text-emerald-400 font-mono">+1234567890</code>) to generate a WhatsApp Web pairing code.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+1234567890"
                      value={waPhoneNumber}
                      onChange={(e) => setWaPhoneNumber(e.target.value)}
                      className="w-full px-3 py-2.5 bg-background border border-border-color rounded-xl text-xs text-foreground placeholder-zinc-600 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <button
                    onClick={handleConnectWhatsApp}
                    disabled={waConnectLoading || !waPhoneNumber}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {waConnectLoading ? "Generating pairing code..." : "Generate Pairing Code"}
                  </button>
                </div>
              )}

              {waStatus === "connecting" && (
                <div className="space-y-5 text-center py-4">
                  {waPairingCode ? (
                    <div className="space-y-4">
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Open WhatsApp on your mobile device, go to <strong>Linked Devices &gt; Link with phone number</strong>, and enter the following code:
                      </p>
                      <div className="bg-foreground/[0.03] border border-border-color py-4 px-6 rounded-2xl text-2xl font-mono font-extrabold tracking-widest text-emerald-400 select-all">
                        {waPairingCode}
                      </div>
                      <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                        <span>Waiting for device connection confirmation...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs text-zinc-400 font-medium">Requesting code from WhatsApp servers...</p>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Settings Modal (User-specific Credential Settings and Interactive MCP Console) */}
      {selectedPlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-8 rounded-3xl border border-border-color shadow-2xl relative animate-scale-up space-y-6 text-foreground bg-[#030014]/90">

            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-border-color pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${selectedPlatform.brandColor} shadow-md`}>
                  {selectedPlatform.icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedPlatform.name} Configuration</h2>
                  <p className="text-xs text-zinc-400">Configure parameters and execute Model Context Protocol (MCP) tools</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlatform(null)}
                className="text-zinc-400 hover:text-white bg-foreground/[0.05] hover:bg-foreground/[0.1] p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">

              {/* Left Column: Credentials Setup */}
              <form onSubmit={handleSaveConfig} className="space-y-6 flex flex-col justify-between h-full">
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Parameters Setup</h3>
                    <p className="text-[11px] text-zinc-400">Provide credentials or configurations for this active user account.</p>
                  </div>

                  {getPlatformConfigKeys(selectedPlatform.id).length === 0 ? (
                    <div className="p-4 rounded-xl bg-foreground/[0.02] border border-border-color text-zinc-500 text-xs italic">
                      This platform uses global configuration variables. No user-specific parameters required.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {getPlatformConfigKeys(selectedPlatform.id).map((key) => (
                        <div key={key} className="space-y-1">
                          <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                            {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                          </label>
                          <input
                            type={key.toLowerCase().includes("token") || key.toLowerCase().includes("key") ? "password" : "text"}
                            value={activeConfigFields[key] || ""}
                            onChange={(e) => setActiveConfigFields({ ...activeConfigFields, [key]: e.target.value })}
                            placeholder={`Enter ${key}`}
                            className="w-full px-3.5 py-2.5 bg-background border border-border-color rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-border-color flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPlatform(null)}
                    className="px-4 py-2.5 rounded-xl border border-border-color text-zinc-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingConfig}
                    className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {isSavingConfig ? "Saving..." : "Save Config & Close"}
                  </button>
                </div>
              </form>

              {/* Right Column: MCP Testing Console */}
              <div className="p-6 rounded-3xl bg-background border border-border-color flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                      Live Tool Test Console
                    </h3>
                    <p className="text-[11px] text-zinc-500">Test available MCP tools directly on this platform feed</p>
                  </div>

                  {selectedPlatform.mcpTools.length === 0 ? (
                    <div className="p-6 text-center text-zinc-500 text-xs italic bg-foreground/[0.01] border border-border-color/60 rounded-2xl">
                      No MCP tools registered for this platform.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Select Tool</label>
                        <select
                          value={selectedModalTool}
                          onChange={(e) => {
                            setSelectedModalTool(e.target.value);
                            const toolObj = selectedPlatform.mcpTools.find(t => t.name === e.target.value);
                            setModalToolArgs(toolObj?.parameters || "{}");
                            setModalTerminalError("");
                          }}
                          className="w-full px-3 py-2.5 bg-background border border-border-color rounded-xl text-xs text-foreground focus:outline-none focus:border-violet-500 cursor-pointer"
                        >
                          {selectedPlatform.mcpTools.map(t => (
                            <option key={t.name} value={t.name}>{t.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Arguments (JSON)</label>
                        <textarea
                          rows={3}
                          value={modalToolArgs}
                          onChange={(e) => setModalToolArgs(e.target.value)}
                          placeholder='e.g. {"channel": "general"}'
                          className="w-full p-3 bg-background border border-border-color rounded-xl text-xs text-white font-mono placeholder-zinc-700 focus:outline-none focus:border-violet-500 resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {modalTerminalError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-[10px]">
                      {modalTerminalError}
                    </div>
                  )}
                </div>

                {selectedPlatform.mcpTools.length > 0 && (
                  <div className="space-y-4 flex-1 flex flex-col justify-end">
                    <div className="border border-border-color bg-foreground/[0.01] rounded-2xl overflow-hidden min-h-[160px] flex flex-col">
                      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border-color bg-foreground/[0.02]">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="w-2 h-2 rounded-full bg-yellow-500" />
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-[9px] font-mono text-zinc-500 ml-1.5 uppercase font-bold">mcp-rpc-console</span>
                      </div>
                      <div className="flex-1 p-3 font-mono text-[9px] overflow-y-auto max-h-[160px] space-y-3">
                        {modalTerminalExecuting ? (
                          <div className="flex items-center justify-center h-full text-zinc-500">
                            <span className="w-3 h-3 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mr-2" />
                            Executing remote MCP call...
                          </div>
                        ) : modalTerminalRequest ? (
                          <div className="space-y-3 text-left">
                            <div>
                              <span className="text-zinc-500 block"># CLIENT REQUEST</span>
                              <pre className="text-cyan-400 overflow-x-auto whitespace-pre-wrap">{modalTerminalRequest}</pre>
                            </div>
                            <div>
                              <span className="text-zinc-500 block"># SERVER RESPONSE</span>
                              <pre className="text-emerald-400 overflow-x-auto whitespace-pre-wrap">{modalTerminalResponse}</pre>
                            </div>
                          </div>
                        ) : (
                          <div className="text-zinc-600 italic text-center py-8">
                            Execute MCP Tool to view request and response payloads.
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleExecuteModalTool}
                      disabled={modalTerminalExecuting || selectedPlatform.mcpTools.length === 0}
                      className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <HugeiconsIcon icon={PlayIcon} size={13} />
                      {modalTerminalExecuting ? "Executing Call..." : "Execute MCP Tool"}
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Dynamic Custom Integration Platform Creator Section */}
      <div className="border-t border-border-color pt-8 mt-12 space-y-6 animate-fade-in text-foreground">
        <div>
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <HugeiconsIcon icon={PlugIcon} size={20} className="text-violet-500" />
            Register Custom Integration Platform
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Manually register any custom application by providing connection credentials and endpoint details. Custom integrations will appear in the grid above and can be toggled online/offline.
          </p>
        </div>

        <form onSubmit={handleAddCustomApp} className="glass-panel p-6 md:p-8 rounded-3xl border border-border-color space-y-6 bg-foreground/[0.01]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Application Name</label>
              <input
                type="text"
                required
                value={customAppName}
                onChange={(e) => setCustomAppName(e.target.value)}
                placeholder="e.g. Acme Internal Analytics"
                className="w-full px-4 py-3 bg-background border border-border-color rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Platform Category</label>
              <select
                value={customAppCat}
                onChange={(e) => setCustomAppCat(e.target.value as any)}
                className="w-full px-4 py-3 bg-background border border-border-color rounded-xl text-xs text-white focus:outline-none focus:border-violet-500 cursor-pointer"
              >
                <option value="productivity">Productivity & Tasks</option>
                <option value="communication">Communication & Chats</option>
                <option value="mail">Mail & Correspondence</option>
                <option value="social">Social & Marketing</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Description</label>
            <input
              type="text"
              required
              value={customAppDesc}
              onChange={(e) => setCustomAppDesc(e.target.value)}
              placeholder="e.g. Query database usage stats, fetch active client transactions, and trigger notification messages."
              className="w-full px-4 py-3 bg-background border border-border-color rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">API Connection Endpoint URL</label>
              <input
                type="url"
                required
                value={customAppEndpoint}
                onChange={(e) => setCustomAppEndpoint(e.target.value)}
                placeholder="e.g. https://api.acme.com/v1"
                className="w-full px-4 py-3 bg-background border border-border-color rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Secret Access Token / API Key</label>
              <input
                type="password"
                required
                value={customAppApiKey}
                onChange={(e) => setCustomAppApiKey(e.target.value)}
                placeholder="••••••••••••••••••••"
                className="w-full px-4 py-3 bg-background border border-border-color rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          {/* Accent Color picker */}
          <div className="space-y-2">
            <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Platform Brand Color</label>
            <div className="flex flex-wrap gap-2">
              {[
                { class: "bg-violet-600", name: "Violet" },
                { class: "bg-rose-600", name: "Rose" },
                { class: "bg-emerald-600", name: "Emerald" },
                { class: "bg-amber-600", name: "Amber" },
                { class: "bg-blue-600", name: "Blue" },
                { class: "bg-cyan-600", name: "Cyan" },
                { class: "bg-purple-600", name: "Purple" },
                { class: "bg-orange-600", name: "Orange" },
                { class: "bg-zinc-700", name: "Zinc" },
              ].map((color) => {
                const isSelected = customAppColor === color.class;
                return (
                  <button
                    type="button"
                    key={color.class}
                    onClick={() => setCustomAppColor(color.class)}
                    className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-2 transition-all cursor-pointer ${isSelected
                      ? "bg-violet-600/20 border-violet-500/40 text-violet-300"
                      : "bg-background border-border-color text-zinc-400 hover:text-white"
                      }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${color.class}`} />
                    {color.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* MCP Tools Section */}
          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-center border-b border-border-color/30 pb-2">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Configure Custom MCP Tools</span>
              <button
                type="button"
                onClick={addToolField}
                className="text-xs text-violet-400 hover:text-violet-350 font-bold flex items-center gap-1 cursor-pointer"
              >
                + Add Tool
              </button>
            </div>

            <div className="space-y-4">
              {customTools.map((tool, idx) => (
                <div key={idx} className="p-4 rounded-2xl border border-border-color bg-background/50 space-y-3 relative group">
                  {customTools.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeToolField(idx)}
                      className="absolute top-2 right-2 text-zinc-500 hover:text-red-400 text-xs transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Tool Name</label>
                      <input
                        type="text"
                        required
                        value={tool.name}
                        onChange={(e) => handleToolChange(idx, "name", e.target.value)}
                        placeholder="e.g. get_acme_stats"
                        className="w-full px-3 py-2 bg-background border border-border-color rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Tool Description</label>
                      <input
                        type="text"
                        required
                        value={tool.description}
                        onChange={(e) => handleToolChange(idx, "description", e.target.value)}
                        placeholder="e.g. Fetch total transaction volumes in the last 24h"
                        className="w-full px-3 py-2 bg-background border border-border-color rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Parameters Schema (JSON Format)</label>
                    <textarea
                      rows={2}
                      value={tool.parameters}
                      onChange={(e) => handleToolChange(idx, "parameters", e.target.value)}
                      placeholder='e.g. {"workspaceId": "string"}'
                      className="w-full p-3 bg-background border border-border-color rounded-lg text-xs text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-violet-500/10"
            >
              Add Custom Integration Platform
            </button>
          </div>
        </form>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-[#09090b]/90 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-2xl shadow-xl shadow-emerald-500/5 backdrop-blur-md animate-[float_0.3s_ease-out_forwards]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-zinc-400 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>
      )}

    </div>
  );
}
