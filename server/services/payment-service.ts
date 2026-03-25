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

export interface CustomerData {
  name: string;
  email: string;
  cellphone: string;
  taxId: string;
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
    if (!res.ok || data.success === false) {
      console.error("[AbacatePay] Error:", res.status, data);
      throw new Error(data?.error || `AbacatePay error: ${res.status}`);
    }

    return data;
  }

  async createPixCharge(amountInCents: number, description: string, externalRef: string, customer: CustomerData): Promise<PixChargeResult> {
    const data = await this.request("POST", "/pixQrCode/create", {
      amount: amountInCents,
      description,
      externalId: externalRef,
    });

    const pix = data.data || data;

    return {
      id: pix.id,
      url: pix.brCode || "",
      qrCode: pix.brCode || "",
      qrCodeBase64: pix.brCodeBase64 || "",
      amount: amountInCents,
      status: pix.status || "PENDING",
    };
  }

  async getChargeStatus(chargeId: string): Promise<string> {
    try {
      const data = await this.request("GET", `/pixQrCode/check?id=${chargeId}`);
      const pix = data.data || data;
      return pix.status || "PENDING";
    } catch (error) {
      console.log("[AbacatePay] Error checking pixQrCode status:", chargeId, error);
      return "PENDING";
    }
  }

  async createPixWithdraw(amountInCents: number, pixKey: string, pixKeyType: string, description: string): Promise<PixWithdrawResult> {
    // AbacatePay withdraw/create API accepts: { amount (cents), pixKey, notes }
    // The API auto-detects the PIX key type — no 'method' or nested 'pix' object needed.
    const data = await this.request("POST", "/withdraw/create", {
      amount: amountInCents,
      pixKey,
      notes: description,
    });

    const withdraw = data.data || data;
    return {
      id: withdraw.id,
      status: withdraw.status || "PENDING",
    };
  }

  async getWithdrawStatus(withdrawId: string): Promise<string> {
    const data = await this.request("GET", `/withdraw/get?id=${withdrawId}`);
    return data.data?.status || data.status || "PENDING";
  }

  isConfigured(): boolean {
    return !!process.env.ABACATEPAY_API_KEY;
  }
}

export const paymentService = new PaymentService();
