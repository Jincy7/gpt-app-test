import { createMcpHandler } from "mcp-handler";
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
} from "../../lib/mock-data";

const USAGE_URI = "ui://t-ai/usage.html";
const BILL_URI = "ui://t-ai/bill.html";
const PLAN_URI = "ui://t-ai/plan.html";

function getWidgetHtml(name: string): string {
  try {
    const fs = require("fs");
    const path = require("path");
    const filePath = path.join(process.cwd(), `web/dist/${name}.html`);
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return `<html><body><p>${name} widget</p></body></html>`;
  }
}

const handler = createMcpHandler(
  (server) => {
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
            text: getWidgetHtml("usage-widget"),
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
            text: getWidgetHtml("bill-widget"),
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
            text: getWidgetHtml("plan-widget"),
          },
        ],
      })
    );

    registerAppTool(
      server,
      "check_usage",
      {
        title: "사용량 조회",
        description:
          "현재 요금제의 데이터, 음성통화, 문자 사용량과 잔여량을 조회합니다.",
        _meta: { ui: { resourceUri: USAGE_URI } },
      },
      async () => {
        const usage = getUsageData();
        const lines = usage.items.map(
          (i) => `${i.label}: ${i.used}${i.unit} / ${i.total}${i.unit}`
        );
        return {
          content: [
            { type: "text" as const, text: `${usage.userName}님의 사용량\n${lines.join("\n")}` },
          ],
          structuredContent: usage as unknown as Record<string, unknown>,
        };
      }
    );

    registerAppTool(
      server,
      "check_bill",
      {
        title: "요금 조회",
        description: "청구 요금 상세 내역을 조회합니다.",
        inputSchema: {
          month: z.string().optional().describe("조회할 월"),
        },
        _meta: { ui: { resourceUri: BILL_URI } },
      },
      async ({ month }: { month?: string }) => {
        const bill = getBillData(month);
        const diff = bill.totalAmount - bill.previousAmount;
        return {
          content: [
            {
              type: "text" as const,
              text: `${bill.month} 요금: ${bill.totalAmount.toLocaleString()}원 (전월 대비 ${diff > 0 ? "+" : ""}${diff.toLocaleString()}원)`,
            },
          ],
          structuredContent: bill as unknown as Record<string, unknown>,
        };
      }
    );

    registerAppTool(
      server,
      "recommend_plan",
      {
        title: "요금제 추천",
        description: "사용 패턴 기반 최적 요금제를 추천합니다.",
        _meta: { ui: { resourceUri: PLAN_URI } },
      },
      async () => {
        const rec = getPlanRecommendation();
        const lines = rec.recommendations.map(
          (p) =>
            `- ${p.name}: 월 ${p.monthlyFee.toLocaleString()}원, ${p.data}`
        );
        return {
          content: [
            {
              type: "text" as const,
              text: `추천 요금제:\n${lines.join("\n")}`,
            },
          ],
          structuredContent: rec as unknown as Record<string, unknown>,
        };
      }
    );

    registerAppTool(
      server,
      "roaming_info",
      {
        title: "해외 로밍 안내",
        description: "국가별 해외 로밍 요금과 추천 패키지를 안내합니다.",
        inputSchema: {
          country: z
            .string()
            .describe(`국가명 (${getAvailableCountries().join(", ")})`),
        },
        _meta: {},
      },
      async ({ country }: { country: string }) => {
        const roaming = getRoamingData(country);
        if (!roaming) {
          return {
            content: [
              {
                type: "text" as const,
                text: `'${country}' 로밍 정보 없음. 지원: ${getAvailableCountries().join(", ")}`,
              },
            ],
          };
        }
        const lines = roaming.packages.map(
          (p) => `- ${p.name} (${p.duration}): ${p.data}, ${p.price.toLocaleString()}원`
        );
        return {
          content: [
            { type: "text" as const, text: `${country} 로밍 패키지:\n${lines.join("\n")}` },
          ],
          structuredContent: roaming as unknown as Record<string, unknown>,
        };
      }
    );
  },
  { serverInfo: { name: "t-ai-assistant", version: "0.1.0" } },
  { basePath: "/api", disableSse: true }
);

export { handler as GET, handler as POST, handler as DELETE };
