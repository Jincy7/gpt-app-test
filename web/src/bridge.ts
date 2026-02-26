let rpcId = 0;
const pendingRequests = new Map<
  number,
  { resolve: (v: any) => void; reject: (e: any) => void }
>();

export function rpcNotify(method: string, params?: unknown) {
  window.parent.postMessage({ jsonrpc: "2.0", method, params }, "*");
}

export function rpcRequest(method: string, params?: unknown): Promise<any> {
  return new Promise((resolve, reject) => {
    const id = ++rpcId;
    pendingRequests.set(id, { resolve, reject });
    window.parent.postMessage({ jsonrpc: "2.0", id, method, params }, "*");
  });
}

type ToolResultHandler = (params: any) => void;
let toolResultHandler: ToolResultHandler | null = null;

export function onToolResult(handler: ToolResultHandler) {
  toolResultHandler = handler;
}

window.addEventListener(
  "message",
  (event: MessageEvent) => {
    if (event.source !== window.parent) return;
    const message = event.data;
    if (!message || message.jsonrpc !== "2.0") return;

    if (typeof message.id === "number") {
      const pending = pendingRequests.get(message.id);
      if (!pending) return;
      pendingRequests.delete(message.id);
      if (message.error) {
        pending.reject(message.error);
      } else {
        pending.resolve(message.result);
      }
      return;
    }

    if (message.method === "ui/notifications/tool-result") {
      toolResultHandler?.(message.params);
    }
  },
  { passive: true }
);

export async function initBridge() {
  try {
    await rpcRequest("ui/initialize", {
      appInfo: { name: "t-ai-assistant", version: "0.1.0" },
      appCapabilities: {},
      protocolVersion: "2026-01-26",
    });
    rpcNotify("ui/notifications/initialized", {});
  } catch (error) {
    console.error("Failed to initialize MCP Apps bridge:", error);
  }
}
