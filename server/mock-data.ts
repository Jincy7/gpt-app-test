export interface UsageItem {
  category: "data" | "voice" | "sms";
  label: string;
  used: number;
  total: number;
  unit: string;
}

export interface UsageData {
  type: "usage";
  userName: string;
  planName: string;
  billingCycle: string;
  items: UsageItem[];
}

export interface BillItem {
  label: string;
  amount: number;
  description: string;
}

export interface BillData {
  type: "bill";
  month: string;
  totalAmount: number;
  previousAmount: number;
  currency: string;
  items: BillItem[];
  paymentDate: string;
  paymentMethod: string;
}

export interface PlanOption {
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

export interface PlanRecommendation {
  type: "planRecommendation";
  currentPlan: {
    name: string;
    monthlyFee: number;
  };
  recommendations: PlanOption[];
}

export interface RoamingPackage {
  name: string;
  duration: string;
  data: string;
  price: number;
  description: string;
}

export interface RoamingData {
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

export function getUsageData(): UsageData {
  return {
    type: "usage",
    userName: "김민수",
    planName: "5G 프리미엄 75",
    billingCycle: "2026.02.01 ~ 2026.02.28",
    items: [
      {
        category: "data",
        label: "데이터",
        used: 48.3,
        total: 75,
        unit: "GB",
      },
      {
        category: "voice",
        label: "음성통화",
        used: 120,
        total: 300,
        unit: "분",
      },
      {
        category: "sms",
        label: "문자",
        used: 45,
        total: 100,
        unit: "건",
      },
    ],
  };
}

export function getBillData(month?: string): BillData {
  return {
    type: "bill",
    month: month ?? "2026년 2월",
    totalAmount: 68200,
    previousAmount: 65800,
    currency: "KRW",
    items: [
      { label: "기본요금", amount: 55000, description: "5G 프리미엄 75 요금제" },
      { label: "부가서비스", amount: 4400, description: "컬러링 + 클라우드 5GB" },
      { label: "할부금", amount: 28600, description: "Galaxy S25 Ultra (18/24개월)" },
      { label: "약정 할인", amount: -15000, description: "24개월 약정 할인" },
      { label: "멤버십 할인", amount: -4800, description: "T멤버십 VIP 할인" },
    ],
    paymentDate: "2026년 3월 10일",
    paymentMethod: "신한카드 ****-1234 자동결제",
  };
}

export function getPlanRecommendation(): PlanRecommendation {
  return {
    type: "planRecommendation",
    currentPlan: {
      name: "5G 프리미엄 75",
      monthlyFee: 55000,
    },
    recommendations: [
      {
        id: "plan-1",
        name: "5G 심플 55",
        monthlyFee: 45000,
        data: "55GB",
        voice: "무제한",
        sms: "무제한",
        savingAmount: 10000,
        badge: "절약 추천",
        features: ["데이터 소진 후 1Mbps", "T멤버십 골드"],
      },
      {
        id: "plan-2",
        name: "5G 스탠다드 100",
        monthlyFee: 65000,
        data: "100GB",
        voice: "무제한",
        sms: "무제한",
        savingAmount: 0,
        badge: "인기",
        features: ["데이터 소진 후 3Mbps", "T멤버십 VIP", "해외 로밍 데이터 2GB 포함"],
      },
      {
        id: "plan-3",
        name: "5G 프리미엄 무제한",
        monthlyFee: 85000,
        data: "무제한",
        voice: "무제한",
        sms: "무제한",
        savingAmount: -30000,
        badge: "프리미엄",
        features: [
          "데이터 완전 무제한",
          "T멤버십 VIP+",
          "해외 로밍 데이터 5GB 포함",
          "구독 서비스 2종 무료",
        ],
      },
    ],
  };
}

const roamingDatabase: Record<string, RoamingData> = {
  일본: {
    type: "roaming",
    country: "일본",
    countryCode: "JP",
    packages: [
      {
        name: "일본 데이터 라이트",
        duration: "3일",
        data: "1GB/일",
        price: 9900,
        description: "여행 3일간 매일 1GB 고속 데이터",
      },
      {
        name: "일본 데이터 스탠다드",
        duration: "5일",
        data: "2GB/일",
        price: 19900,
        description: "여행 5일간 매일 2GB 고속 데이터, 소진 후 256Kbps",
      },
      {
        name: "일본 데이터 프리미엄",
        duration: "7일",
        data: "무제한",
        price: 33000,
        description: "여행 7일간 완전 무제한 데이터",
      },
    ],
    basicRates: {
      dataPerMB: 11,
      voicePerMin: 900,
      smsPerMsg: 200,
    },
  },
  미국: {
    type: "roaming",
    country: "미국",
    countryCode: "US",
    packages: [
      {
        name: "미국 데이터 라이트",
        duration: "5일",
        data: "1GB/일",
        price: 15900,
        description: "여행 5일간 매일 1GB 고속 데이터",
      },
      {
        name: "미국 데이터 프리미엄",
        duration: "10일",
        data: "무제한",
        price: 44000,
        description: "여행 10일간 완전 무제한 데이터",
      },
    ],
    basicRates: {
      dataPerMB: 15,
      voicePerMin: 1200,
      smsPerMsg: 250,
    },
  },
  태국: {
    type: "roaming",
    country: "태국",
    countryCode: "TH",
    packages: [
      {
        name: "태국 데이터 스탠다드",
        duration: "5일",
        data: "2GB/일",
        price: 12900,
        description: "여행 5일간 매일 2GB 고속 데이터",
      },
      {
        name: "태국 데이터 프리미엄",
        duration: "7일",
        data: "무제한",
        price: 22000,
        description: "여행 7일간 완전 무제한 데이터",
      },
    ],
    basicRates: {
      dataPerMB: 8,
      voicePerMin: 700,
      smsPerMsg: 150,
    },
  },
};

export function getRoamingData(country: string): RoamingData | null {
  return roamingDatabase[country] ?? null;
}

export function getAvailableCountries(): string[] {
  return Object.keys(roamingDatabase);
}
