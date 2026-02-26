import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { initBridge, onToolResult } from "./bridge";

interface UsageItem {
  category: "data" | "voice" | "sms";
  label: string;
  used: number;
  total: number;
  unit: string;
}

interface UsageData {
  type: "usage";
  userName: string;
  planName: string;
  billingCycle: string;
  items: UsageItem[];
}

const CATEGORY_COLORS: Record<string, string> = {
  data: "#6366f1",
  voice: "#10b981",
  sms: "#f59e0b",
};

const CATEGORY_ICONS: Record<string, string> = {
  data: "📶",
  voice: "📞",
  sms: "💬",
};

function DonutChart({
  used,
  total,
  color,
  size = 80,
}: {
  used: number;
  total: number;
  color: string;
  size?: number;
}) {
  const pct = Math.min((used / total) * 100, 100);
  const r = (size - 10) / 2;
  const c = Math.PI * 2 * r;
  const offset = c - (pct / 100) * c;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="8"
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={pct > 90 ? "#ef4444" : color}
        strokeWidth="8"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: "14px", fontWeight: 700, fill: "#1f2937" }}
      >
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

function UsageCard({ item }: { item: UsageItem }) {
  const remaining = item.total - item.used;
  const pct = (item.used / item.total) * 100;
  const isLow = pct > 85;

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={{ fontSize: "20px" }}>
          {CATEGORY_ICONS[item.category]}
        </span>
        <span style={styles.label}>{item.label}</span>
        {isLow && <span style={styles.warningBadge}>잔량 부족</span>}
      </div>
      <div style={styles.cardBody}>
        <DonutChart
          used={item.used}
          total={item.total}
          color={CATEGORY_COLORS[item.category]}
        />
        <div style={styles.cardInfo}>
          <div style={styles.usageMain}>
            <span style={styles.usedValue}>{item.used}</span>
            <span style={styles.totalValue}>
              / {item.total}
              {item.unit}
            </span>
          </div>
          <div style={styles.remaining}>
            잔여: {remaining.toFixed(1)}
            {item.unit}
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [data, setData] = useState<UsageData | null>(null);

  useEffect(() => {
    initBridge();
    onToolResult((params: any) => {
      if (params?.structuredContent?.type === "usage") {
        setData(params.structuredContent);
      }
    });
  }, []);

  if (!data) {
    return <div style={styles.loading}>사용량 데이터를 불러오는 중...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>
          {data.userName}님의 사용량
        </h2>
        <div style={styles.planInfo}>
          <span style={styles.planBadge}>{data.planName}</span>
          <span style={styles.cycle}>{data.billingCycle}</span>
        </div>
      </div>
      <div style={styles.grid}>
        {data.items.map((item) => (
          <UsageCard key={item.category} item={item} />
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    maxWidth: 420,
    margin: "0 auto",
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    margin: 0,
    fontSize: "1.15rem",
    fontWeight: 700,
    color: "#1f2937",
  },
  planInfo: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  planBadge: {
    background: "#6366f1",
    color: "#fff",
    padding: "2px 10px",
    borderRadius: 20,
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  cycle: {
    fontSize: "0.8rem",
    color: "#6b7280",
  },
  grid: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  card: {
    background: "#f9fafb",
    borderRadius: 14,
    padding: "14px 16px",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  label: {
    fontWeight: 600,
    fontSize: "0.95rem",
    color: "#374151",
  },
  warningBadge: {
    marginLeft: "auto",
    background: "#fef2f2",
    color: "#dc2626",
    padding: "2px 8px",
    borderRadius: 20,
    fontSize: "0.7rem",
    fontWeight: 600,
  },
  cardBody: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  cardInfo: {
    flex: 1,
  },
  usageMain: {
    display: "flex",
    alignItems: "baseline",
    gap: 4,
  },
  usedValue: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#1f2937",
  },
  totalValue: {
    fontSize: "0.85rem",
    color: "#9ca3af",
  },
  remaining: {
    marginTop: 4,
    fontSize: "0.8rem",
    color: "#6b7280",
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
