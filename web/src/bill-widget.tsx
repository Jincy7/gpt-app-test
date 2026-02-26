import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { initBridge, onToolResult } from "./bridge";

interface BillItem {
  label: string;
  amount: number;
  description: string;
}

interface BillData {
  type: "bill";
  month: string;
  totalAmount: number;
  previousAmount: number;
  currency: string;
  items: BillItem[];
  paymentDate: string;
  paymentMethod: string;
}

function formatKRW(n: number): string {
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString("ko-KR");
  return n < 0 ? `-${formatted}` : formatted;
}

function DiffBadge({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous;
  if (diff === 0) return <span style={s.diffNeutral}>전월 동일</span>;

  const up = diff > 0;
  return (
    <span style={up ? s.diffUp : s.diffDown}>
      {up ? "▲" : "▼"} {formatKRW(Math.abs(diff))}원
    </span>
  );
}

function App() {
  const [data, setData] = useState<BillData | null>(null);

  useEffect(() => {
    initBridge();
    onToolResult((params: any) => {
      if (params?.structuredContent?.type === "bill") {
        setData(params.structuredContent);
      }
    });
  }, []);

  if (!data) {
    return <div style={s.loading}>요금 정보를 불러오는 중...</div>;
  }

  const charges = data.items.filter((i) => i.amount >= 0);
  const discounts = data.items.filter((i) => i.amount < 0);

  return (
    <div style={s.container}>
      <div style={s.totalCard}>
        <div style={s.monthRow}>
          <span style={s.monthLabel}>{data.month}</span>
          <DiffBadge current={data.totalAmount} previous={data.previousAmount} />
        </div>
        <div style={s.totalAmount}>
          {formatKRW(data.totalAmount)}
          <span style={s.won}>원</span>
        </div>
        <div style={s.paymentInfo}>
          {data.paymentDate} | {data.paymentMethod}
        </div>
      </div>

      <div style={s.section}>
        <h3 style={s.sectionTitle}>청구 내역</h3>
        {charges.map((item, i) => (
          <div key={i} style={s.row}>
            <div>
              <div style={s.itemLabel}>{item.label}</div>
              <div style={s.itemDesc}>{item.description}</div>
            </div>
            <div style={s.itemAmount}>{formatKRW(item.amount)}원</div>
          </div>
        ))}
      </div>

      {discounts.length > 0 && (
        <div style={s.section}>
          <h3 style={s.sectionTitle}>할인 내역</h3>
          {discounts.map((item, i) => (
            <div key={i} style={s.row}>
              <div>
                <div style={s.itemLabel}>{item.label}</div>
                <div style={s.itemDesc}>{item.description}</div>
              </div>
              <div style={s.discountAmount}>{formatKRW(item.amount)}원</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    maxWidth: 420,
    margin: "0 auto",
    padding: 16,
  },
  totalCard: {
    background: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
    borderRadius: 16,
    padding: "20px 20px 16px",
    color: "#fff",
    marginBottom: 16,
  },
  monthRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  monthLabel: {
    fontSize: "0.85rem",
    opacity: 0.9,
    fontWeight: 500,
  },
  diffUp: {
    background: "rgba(255,255,255,0.2)",
    padding: "2px 8px",
    borderRadius: 20,
    fontSize: "0.7rem",
    fontWeight: 600,
    color: "#fecaca",
  },
  diffDown: {
    background: "rgba(255,255,255,0.2)",
    padding: "2px 8px",
    borderRadius: 20,
    fontSize: "0.7rem",
    fontWeight: 600,
    color: "#bbf7d0",
  },
  diffNeutral: {
    background: "rgba(255,255,255,0.2)",
    padding: "2px 8px",
    borderRadius: 20,
    fontSize: "0.7rem",
    fontWeight: 600,
  },
  totalAmount: {
    fontSize: "2rem",
    fontWeight: 800,
    letterSpacing: "-1px",
  },
  won: {
    fontSize: "1.1rem",
    fontWeight: 500,
    marginLeft: 2,
  },
  paymentInfo: {
    marginTop: 8,
    fontSize: "0.75rem",
    opacity: 0.8,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    margin: "0 0 8px",
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "#374151",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 12px",
    background: "#f9fafb",
    borderRadius: 10,
    marginBottom: 6,
  },
  itemLabel: {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#1f2937",
  },
  itemDesc: {
    fontSize: "0.75rem",
    color: "#9ca3af",
    marginTop: 2,
  },
  itemAmount: {
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "#1f2937",
    whiteSpace: "nowrap",
  },
  discountAmount: {
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "#10b981",
    whiteSpace: "nowrap",
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
