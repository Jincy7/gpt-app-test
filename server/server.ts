import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";

import {
  getUsageData,
  getBillData,
  getPlanRecommendation,
  getRoamingData,
  getAvailableCountries,
} from "./mock-data.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function readWidget(name: string): string {
  const distPath = resolve(ROOT, `web/dist/${name}.html`);
  if (existsSync(distPath)) {
    return readFileSync(distPath, "utf-8");
  }
  return `<html><body><p>${name} widget not built yet. Run: cd web && npm run build</p></body></html>`;
}

const USAGE_URI = "ui://j-ai/usage.html";
const BILL_URI = "ui://j-ai/bill.html";
const PLAN_URI = "ui://j-ai/plan.html";
const ROAMING_URI = "ui://j-ai/roaming.html";

const WIDGET_DOMAIN =
  process.env.WIDGET_DOMAIN ?? "http://localhost:8787";

const WIDGET_UI_META = {
  ui: {
    prefersBorder: true,
    domain: WIDGET_DOMAIN,
    csp: {
      connectDomains: [] as string[],
      resourceDomains: [] as string[],
    },
  },
};

const READONLY_ANNOTATIONS = {
  readOnlyHint: true as const,
  openWorldHint: false as const,
  destructiveHint: false as const,
};

function createTelecomServer(): McpServer {
  const server = new McpServer({
    name: "j-ai-assistant",
    version: "0.1.0",
  });

  // --- Resources ---
  registerAppResource(
    server,
    "사용량 대시보드",
    USAGE_URI,
    { description: "데이터/통화/문자 사용량 대시보드 위젯" },
    async () => ({
      contents: [
        {
          uri: USAGE_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: readWidget("usage-widget"),
          _meta: WIDGET_UI_META,
        },
      ],
    })
  );

  registerAppResource(
    server,
    "요금 조회",
    BILL_URI,
    { description: "월별 요금 상세 내역 위젯" },
    async () => ({
      contents: [
        {
          uri: BILL_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: readWidget("bill-widget"),
          _meta: WIDGET_UI_META,
        },
      ],
    })
  );

  registerAppResource(
    server,
    "요금제 추천",
    PLAN_URI,
    { description: "AI 기반 요금제 추천 비교 카드" },
    async () => ({
      contents: [
        {
          uri: PLAN_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: readWidget("plan-widget"),
          _meta: WIDGET_UI_META,
        },
      ],
    })
  );

  registerAppResource(
    server,
    "해외 로밍 안내",
    ROAMING_URI,
    { description: "국가별 해외 로밍 요금 및 패키지 안내 위젯" },
    async () => ({
      contents: [
        {
          uri: ROAMING_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: readWidget("roaming-widget"),
          _meta: WIDGET_UI_META,
        },
      ],
    })
  );

  // --- Tools ---
  registerAppTool(
    server,
    "check_usage",
    {
      title: "사용량 조회",
      description:
        "현재 요금제의 데이터, 음성통화, 문자 사용량과 잔여량을 조회합니다. 사용자가 데이터 사용량, 남은 데이터, 통화량 등을 물어볼 때 사용하세요.",
      annotations: READONLY_ANNOTATIONS,
      _meta: {
        ui: { resourceUri: USAGE_URI },
      },
    },
    async () => {
      const usage = getUsageData();
      const summaryParts = usage.items.map(
        (item) =>
          `${item.label}: ${item.used}${item.unit} / ${item.total}${item.unit} 사용`
      );
      return {
        content: [
          {
            type: "text",
            text: `${usage.userName}님의 ${usage.planName} 사용량\n${summaryParts.join("\n")}`,
          },
        ],
        structuredContent: usage,
      };
    }
  );

  registerAppTool(
    server,
    "check_bill",
    {
      title: "요금 조회",
      description:
        "이번 달 또는 특정 월의 청구 요금 상세 내역을 조회합니다. 사용자가 이번 달 요금, 청구서, 납부 금액 등을 물어볼 때 사용하세요.",
      inputSchema: {
        month: z
          .string()
          .optional()
          .describe("조회할 월 (예: '2026년 2월'). 생략 시 이번 달"),
      },
      annotations: READONLY_ANNOTATIONS,
      _meta: {
        ui: { resourceUri: BILL_URI },
      },
    },
    async ({ month }: { month?: string }) => {
      const bill = getBillData(month);
      return {
        content: [
          {
            type: "text",
            text: `${bill.month} 청구 요금: ${bill.totalAmount.toLocaleString()}원 (전월 대비 ${bill.totalAmount - bill.previousAmount > 0 ? "+" : ""}${(bill.totalAmount - bill.previousAmount).toLocaleString()}원)`,
          },
        ],
        structuredContent: bill,
      };
    }
  );

  registerAppTool(
    server,
    "recommend_plan",
    {
      title: "요금제 추천",
      description:
        "현재 사용 패턴을 분석하여 최적의 요금제 3개를 추천합니다. 사용자가 요금제 변경, 더 저렴한 요금제, 요금제 추천 등을 물어볼 때 사용하세요.",
      annotations: READONLY_ANNOTATIONS,
      _meta: {
        ui: { resourceUri: PLAN_URI },
      },
    },
    async () => {
      const recommendation = getPlanRecommendation();
      const lines = recommendation.recommendations.map((p) => {
        const saving =
          p.savingAmount > 0
            ? ` (월 ${p.savingAmount.toLocaleString()}원 절약)`
            : "";
        return `- ${p.name}: 월 ${p.monthlyFee.toLocaleString()}원, 데이터 ${p.data}${saving}`;
      });
      return {
        content: [
          {
            type: "text",
            text: `현재 ${recommendation.currentPlan.name}(월 ${recommendation.currentPlan.monthlyFee.toLocaleString()}원) 기준 추천 요금제:\n${lines.join("\n")}`,
          },
        ],
        structuredContent: recommendation,
      };
    }
  );

  registerAppTool(
    server,
    "roaming_info",
    {
      title: "해외 로밍 안내",
      description:
        "특정 국가의 해외 로밍 요금과 추천 로밍 패키지를 안내합니다. 사용자가 해외여행, 로밍, 해외 데이터 등을 물어볼 때 사용하세요.",
      inputSchema: {
        country: z
          .string()
          .describe(
            `여행할 국가 이름 (한국어). 지원 국가: ${getAvailableCountries().join(", ")}`
          ),
      },
      annotations: READONLY_ANNOTATIONS,
      _meta: { ui: { resourceUri: ROAMING_URI } },
    },
    async ({ country }: { country: string }) => {
      const roaming = getRoamingData(country);
      if (!roaming) {
        return {
          content: [
            {
              type: "text",
              text: `'${country}'에 대한 로밍 정보가 없습니다. 현재 지원 국가: ${getAvailableCountries().join(", ")}`,
            },
          ],
        };
      }

      const packageLines = roaming.packages.map(
        (pkg) =>
          `- ${pkg.name} (${pkg.duration}): ${pkg.data}, ${pkg.price.toLocaleString()}원 - ${pkg.description}`
      );
      return {
        content: [
          {
            type: "text",
            text: `${roaming.country} 로밍 안내\n\n📦 추천 패키지:\n${packageLines.join("\n")}\n\n💡 기본 요금 (패키지 미사용 시):\n- 데이터: ${roaming.basicRates.dataPerMB}원/MB\n- 음성: ${roaming.basicRates.voicePerMin}원/분\n- 문자: ${roaming.basicRates.smsPerMsg}원/건`,
          },
        ],
        structuredContent: roaming,
      };
    }
  );

  return server;
}

// --- HTTP Server ---
const port = Number(process.env.PORT ?? 8787);
const MCP_PATH = "/mcp";

const httpServer = createServer(
  async (req: IncomingMessage, res: ServerResponse) => {
    if (!req.url) {
      res.writeHead(400).end("Missing URL");
      return;
    }

    const url = new URL(
      req.url,
      `http://${req.headers.host ?? "localhost"}`
    );

    if (req.method === "OPTIONS" && url.pathname === MCP_PATH) {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "content-type, mcp-session-id",
        "Access-Control-Expose-Headers": "Mcp-Session-Id",
      });
      res.end();
      return;
    }

    if (req.method === "GET" && url.pathname === "/") {
      res
        .writeHead(200, { "content-type": "text/plain; charset=utf-8" })
        .end("J-AI 어시스턴트 MCP Server");
      return;
    }

    const MCP_METHODS = new Set(["POST", "GET", "DELETE"]);
    if (
      url.pathname === MCP_PATH &&
      req.method &&
      MCP_METHODS.has(req.method)
    ) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

      const server = createTelecomServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });

      res.on("close", () => {
        transport.close();
        server.close();
      });

      try {
        await server.connect(transport);
        await transport.handleRequest(req, res);
      } catch (error) {
        console.error("Error handling MCP request:", error);
        if (!res.headersSent) {
          res.writeHead(500).end("Internal server error");
        }
      }
      return;
    }

    res.writeHead(404).end("Not Found");
  }
);

httpServer.listen(port, () => {
  console.log(
    `J-AI 어시스턴트 MCP 서버가 http://localhost:${port}${MCP_PATH} 에서 실행 중입니다`
  );
});
