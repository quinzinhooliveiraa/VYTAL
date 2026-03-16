const ABACATE_API_URL = "https://api.abacatepay.com/v1";

function getApiKey(): string {
  const key = process.env.ABACATEPAY_API_KEY;
  if (!key) throw new Error("ABACATEPAY_API_KEY não configurada");
  return key;
}

export interface PixChargeResult {
  id: string;
  url: string;
  qrCode: string;
  qrCodeBase64: string;
  amount: number;
  status: string;
}

export interface PixWithdrawResult {
  id: string;
  status: string;
}

export class PaymentService {
  private async request(method: string, path: string, body?: any) {
    const apiKey = getApiKey();

    const res = await fetch(`${ABACATE_API_URL}${path}`, {
      method,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("[AbacatePay] Error:", res.status, data);
      throw new Error(data?.error?.message || `AbacatePay error: ${res.status}`);
    }

    return data;
  }

  async createPixCharge(amountInCents: number, description: string, externalRef: string): Promise<PixChargeResult> {
    const data = await this.request("POST", "/billing/create", {
      frequency: "ONE_TIME",
      methods: ["PIX"],
      products: [
        {
          externalId: externalRef,
          name: description,
          quantity: 1,
          price: amountInCents,
        },
      ],
      returnUrl: process.env.APP_URL || "https://fitstake.app",
      completionUrl: process.env.APP_URL || "https://fitstake.app",
    });

    const billing = data.data || data;

    return {
      id: billing.id,
      url: billing.url,
      qrCode: billing.pix?.qrCode || billing.url,
      qrCodeBase64: billing.pix?.qrCodeBase64 || "",
      amount: amountInCents,
      status: billing.status || "PENDING",
    };
  }

  async getChargeStatus(chargeId: string): Promise<string> {
    const data = await this.request("GET", `/billing/show/${chargeId}`);
    return data.data?.status || data.status || "PENDING";
  }

  async createPixWithdraw(amountInCents: number, pixKey: string, pixKeyType: string, description: string): Promise<PixWithdrawResult> {
    const data = await this.request("POST", "/withdraw/create", {
      amount: amountInCents,
      pixKey,
      pixKeyType,
      description,
    });

    const withdraw = data.data || data;
    return {
      id: withdraw.id,
      status: withdraw.status || "PENDING",
    };
  }

  isConfigured(): boolean {
    return !!process.env.ABACATEPAY_API_KEY;
  }
}

export const paymentService = new PaymentService();
