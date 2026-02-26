import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { initBridge, onToolResult } from "./bridge";

interface PlanOption {
  id: string;
  name: string;
  monthlyFee: number;
  data: string;
  voice: string;
  sms: string;
  savingAmount: number;
  badge: string | null;
  features: string[];
}

interface PlanRecommendation {
  type: "planRecommendation";
  currentPlan: { name: string; monthlyFee: number };
  recommendations: PlanOption[];
}

function formatKRW(n: number): string {
  return Math.abs(n).toLocaleString("ko-KR");
}

const BADGE_COLORS: Record<string, { bg: string; fg: string }> = {
  "절약 추천": { bg: "#dcfce7", fg: "#15803d" },
  인기: { bg: "#dbeafe", fg: "#1d4ed8" },
  프리미엄: { bg: "#fae8ff", fg: "#9333ea" },
};

function PlanCard({ plan, isCurrent }: { plan: PlanOption; isCurrent: boolean }) {
  const badgeStyle = plan.badge
    ? BADGE_COLORS[plan.badge] ?? { bg: "#f3f4f6", fg: "#374151" }
    : null;

  return (
    <div style={{ ...s.card, ...(isCurrent ? s.cardHighlight : {}) }}>
      <div style={s.cardTop}>
        {plan.badge && badgeStyle && (
          <span
            style={{
              ...s.badge,
              background: badgeStyle.bg,
              color: badgeStyle.fg,
            }}
          >
            {plan.badge}
          </span>
        )}
        <h3 style={s.planName}>{plan.name}</h3>
        <div style={s.priceRow}>
          <span style={s.price}>월 {formatKRW(plan.monthlyFee)}</span>
          <span style={s.priceUnit}>원</span>
        </div>
        {plan.savingAmount > 0 && (
          <div style={s.saving}>
            월 {formatKRW(plan.savingAmount)}원 절약
          </div>
        )}
        {plan.savingAmount < 0 && (
          <div style={s.extra}>
            월 {formatKRW(Math.abs(plan.savingAmount))}원 추가
          </div>
        )}
      </div>

      <div style={s.specs}>
        <div style={s.specItem}>
          <span style={s.specIcon}>📶</span>
          <span style={s.specLabel}>데이터</span>
          <span style={s.specValue}>{plan.data}</span>
        </div>
        <div style={s.specItem}>
          <span style={s.specIcon}>📞</span>
          <span style={s.specLabel}>음성</span>
          <span style={s.specValue}>{plan.voice}</span>
        </div>
        <div style={s.specItem}>
          <span style={s.specIcon}>💬</span>
          <span style={s.specLabel}>문자</span>
          <span style={s.specValue}>{plan.sms}</span>
        </div>
      </div>

      <div style={s.features}>
        {plan.features.map((f, i) => (
          <div key={i} style={s.featureItem}>
            <span style={s.checkMark}>✓</span> {f}
          </div>
        ))}
      </div>

      <button
        style={s.ctaButton}
        onClick={() => alert(`${plan.name} 변경 신청이 접수되었습니다. (목업)`)}
      >
        변경 신청
      </button>
    </div>
  );
}

function App() {
  const [data, setData] = useState<PlanRecommendation | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initBridge();
    onToolResult((params: any) => {
      if (params?.structuredContent?.type === "planRecommendation") {
        setData(params.structuredContent);
      }
    });
  }, []);

  if (!data) {
    return <div style={s.loading}>요금제 추천 정보를 불러오는 중...</div>;
  }

  return (
    <div style={s.container}>
      <div style={s.header}>
        <h2 style={s.title}>추천 요금제</h2>
        <div style={s.currentPlan}>
          현재: {data.currentPlan.name} (월{" "}
          {formatKRW(data.currentPlan.monthlyFee)}원)
        </div>
      </div>
      <div style={s.carousel} ref={scrollRef}>
        {data.recommendations.map((plan) => (
          <PlanCard key={plan.id} plan={plan} isCurrent={false} />
        ))}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    maxWidth: 600,
    margin: "0 auto",
    padding: 16,
  },
  header: {
    marginBottom: 14,
  },
  title: {
    margin: 0,
    fontSize: "1.15rem",
    fontWeight: 700,
    color: "#1f2937",
  },
  currentPlan: {
    marginTop: 4,
    fontSize: "0.8rem",
    color: "#6b7280",
  },
  carousel: {
    display: "flex",
    gap: 12,
    overflowX: "auto",
    scrollSnapType: "x mandatory",
    paddingBottom: 8,
    WebkitOverflowScrolling: "touch",
  },
  card: {
    flex: "0 0 220px",
    scrollSnapAlign: "start",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 16,
    display: "flex",
    flexDirection: "column",
  },
  cardHighlight: {
    borderColor: "#6366f1",
    boxShadow: "0 0 0 2px rgba(99,102,241,0.15)",
  },
  cardTop: {
    marginBottom: 12,
  },
  badge: {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 20,
    fontSize: "0.7rem",
    fontWeight: 700,
    marginBottom: 8,
  },
  planName: {
    margin: 0,
    fontSize: "1.05rem",
    fontWeight: 700,
    color: "#1f2937",
  },
  priceRow: {
    marginTop: 4,
    display: "flex",
    alignItems: "baseline",
    gap: 2,
  },
  price: {
    fontSize: "1.3rem",
    fontWeight: 800,
    color: "#6366f1",
  },
  priceUnit: {
    fontSize: "0.85rem",
    color: "#6366f1",
    fontWeight: 600,
  },
  saving: {
    marginTop: 4,
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#15803d",
  },
  extra: {
    marginTop: 4,
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#9ca3af",
  },
  specs: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginBottom: 12,
    padding: "10px 0",
    borderTop: "1px solid #f3f4f6",
    borderBottom: "1px solid #f3f4f6",
  },
  specItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: "0.82rem",
  },
  specIcon: {
    fontSize: "14px",
    width: 20,
    textAlign: "center",
  },
  specLabel: {
    color: "#6b7280",
    width: 36,
  },
  specValue: {
    fontWeight: 600,
    color: "#1f2937",
  },
  features: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 4,
    marginBottom: 14,
  },
  featureItem: {
    fontSize: "0.75rem",
    color: "#374151",
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  checkMark: {
    color: "#6366f1",
    fontWeight: 700,
    fontSize: "0.8rem",
  },
  ctaButton: {
    width: "100%",
    padding: "10px 0",
    border: "none",
    borderRadius: 10,
    background: "#6366f1",
    color: "#fff",
    fontWeight: 700,
    fontSize: "0.85rem",
    cursor: "pointer",
  },
  loading: {
    fontFamily: '"Inter", system-ui, sans-serif',
    padding: 32,
    textAlign: "center",
    color: "#9ca3af",
    fontSize: "0.9rem",
  },
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
