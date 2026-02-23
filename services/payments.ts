import { AgentProfile } from '@/store/settings';

export interface PaymentPolicy {
  currency: string;
  max_per_tx: number;
  max_daily: number;
  max_monthly: number;
  require_confirmation_over: number;
  allowed_merchants: string[];
  allowed_categories: string[];
  timezone: string;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
}

export interface PaymentStatus {
  reserved: number;
  captured: number;
  daily_used: number;
  monthly_used: number;
  available_daily: number;
  available_monthly: number;
  transactions: number;
}

function toHttpBase(wsUrl: string): string {
  const parsed = new URL(wsUrl);
  const protocol = parsed.protocol === 'wss:' ? 'https:' : 'http:';
  const pathname = parsed.pathname.endsWith('/ws')
    ? parsed.pathname.slice(0, -3)
    : parsed.pathname;
  const basePath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  return `${protocol}//${parsed.host}${basePath}`;
}

function authHeaders(agent: AgentProfile): Record<string, string> {
  if (!agent.token) return {};
  return { Authorization: `Bearer ${agent.token}` };
}

export async function getPaymentPolicy(agent: AgentProfile): Promise<PaymentPolicy> {
  const response = await fetch(`${toHttpBase(agent.url)}/payments/policy`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...authHeaders(agent),
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to load policy (${response.status})`);
  }
  return await response.json();
}

export async function updatePaymentPolicy(agent: AgentProfile, payload: PaymentPolicy): Promise<PaymentPolicy> {
  const response = await fetch(`${toHttpBase(agent.url)}/payments/policy`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...authHeaders(agent),
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Failed to save policy (${response.status})`);
  }
  return await response.json();
}

export async function getPaymentStatus(agent: AgentProfile): Promise<PaymentStatus> {
  const response = await fetch(`${toHttpBase(agent.url)}/payments/status`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...authHeaders(agent),
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to load wallet status (${response.status})`);
  }
  return await response.json();
}
