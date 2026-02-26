import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { initBridge, onToolResult } from "./bridge";

interface RoamingPackage {
  name: string;
  duration: string;
  data: string;
  price: number;
  description: string;
}

interface RoamingData {
  type: "roaming";
  country: string;
  countryCode: string;
  packages: RoamingPackage[];
  basicRates: {
    dataPerMB: number;
    voicePerMin: number;
    smsPerMsg: number;
  };
}

function formatKRW(n: number): string {
  return n.toLocaleString("ko-KR");
}

const COUNTRY_FLAGS: Record<string, string> = {
  JP: "\u{1F1EF}\u{1F1F5}",
  US: "\u{1F1FA}\u{1F1F8}",
  TH: "\u{1F1F9}\u{1F1ED}",
};

function PackageCard({
  pkg,
  index,
}: {
  pkg: RoamingPackage;
  index: number;
}) {
  const colors = [
    { accent: "#6366f1", bg: "#eef2ff" },
    { accent: "#0891b2", bg: "#ecfeff" },
    { accent: "#7c3aed", bg: "#f5f3ff" },
  ];
  const color = colors[index % colors.length];

  return (
    <div style={s.card}>
      <div style={{ ...s.cardAccent, background: color.accent }} />
      <div style={s.cardBody}>
        <h3 style={s.pkgName}>{pkg.name}</h3>
        <p style={s.pkgDesc}>{pkg.description}</p>
        <div style={s.specGrid}>
          <div style={s.specBox}>
            <span style={s.specLabel}>기간</span>
            <span style={s.specValue}>{pkg.duration}</span>
          </div>
          <div style={s.specBox}>
            <span style={s.specLabel}>데이터</span>
            <span style={{ ...s.specValue, color: color.accent }}>{pkg.data}</span>
          </div>
        </div>
        <div style={s.priceRow}>
          <span style={{ ...s.price, color: color.accent }}>
            {formatKRW(pkg.price)}
          </span>
          <span style={s.priceUnit}>원</span>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [data, setData] = useState<RoamingData | null>(null);

  useEffect(() => {
    initBridge();
    onToolResult((params: any) => {
      if (params?.structuredContent?.type === "roaming") {
        setData(params.structuredContent);
      }
    });
  }, []);

  if (!data) {
    return <div style={s.loading}>로밍 정보를 불러오는 중...</div>;
  }

  const flag = COUNTRY_FLAGS[data.countryCode] ?? "";

  return (
    <div style={s.container}>
      <div style={s.header}>
        <h2 style={s.title}>
          {flag} {data.country} 로밍 패키지
        </h2>
      </div>

      <div style={s.packages}>
        {data.packages.map((pkg, i) => (
          <PackageCard key={pkg.name} pkg={pkg} index={i} />
        ))}
      </div>

      <div style={s.ratesSection}>
        <h3 style={s.ratesTitle}>기본 요금 (패키지 미사용 시)</h3>
        <div style={s.ratesGrid}>
          <div style={s.rateItem}>
            <span style={s.rateIcon}>📶</span>
            <span style={s.rateLabel}>데이터</span>
            <span style={s.rateValue}>{formatKRW(data.basicRates.dataPerMB)}원/MB</span>
          </div>
          <div style={s.rateItem}>
            <span style={s.rateIcon}>📞</span>
            <span style={s.rateLabel}>음성</span>
            <span style={s.rateValue}>{formatKRW(data.basicRates.voicePerMin)}원/분</span>
          </div>
          <div style={s.rateItem}>
            <span style={s.rateIcon}>💬</span>
            <span style={s.rateLabel}>문자</span>
            <span style={s.rateValue}>{formatKRW(data.basicRates.smsPerMsg)}원/건</span>
          </div>
        </div>
      </div>
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
  header: {
    marginBottom: 14,
  },
  title: {
    margin: 0,
    fontSize: "1.15rem",
    fontWeight: 700,
    color: "#1f2937",
  },
  packages: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  card: {
    display: "flex",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    overflow: "hidden",
    background: "#fff",
  },
  cardAccent: {
    width: 4,
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    padding: "14px 16px",
  },
  pkgName: {
    margin: 0,
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "#1f2937",
  },
  pkgDesc: {
    margin: "4px 0 10px",
    fontSize: "0.75rem",
    color: "#6b7280",
    lineHeight: 1.4,
  },
  specGrid: {
    display: "flex",
    gap: 12,
    marginBottom: 10,
  },
  specBox: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  specLabel: {
    fontSize: "0.7rem",
    color: "#9ca3af",
    fontWeight: 500,
  },
  specValue: {
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "#1f2937",
  },
  priceRow: {
    display: "flex",
    alignItems: "baseline",
    gap: 2,
  },
  price: {
    fontSize: "1.2rem",
    fontWeight: 800,
  },
  priceUnit: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#6b7280",
  },
  ratesSection: {
    marginTop: 16,
    padding: "12px 14px",
    background: "#f9fafb",
    borderRadius: 12,
    border: "1px solid #f3f4f6",
  },
  ratesTitle: {
    margin: "0 0 10px",
    fontSize: "0.8rem",
    fontWeight: 700,
    color: "#374151",
  },
  ratesGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  rateItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: "0.8rem",
  },
  rateIcon: {
    fontSize: "14px",
    width: 20,
    textAlign: "center",
  },
  rateLabel: {
    color: "#6b7280",
    width: 36,
  },
  rateValue: {
    fontWeight: 600,
    color: "#1f2937",
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
