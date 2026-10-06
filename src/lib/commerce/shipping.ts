import "server-only";

/**
 * Shipping abstraction. In pre-launch only the interface exists: a
 * multi-carrier connector (Sendcloud or Boxtal) will implement it once a
 * carrier contract and rates are confirmed. Until then shipments created
 * through the Ops API are recorded manually (carrier + tracking given by the
 * operator).
 */

export type ShipmentRequest = {
  orderId: string;
  recipient: { name: string; address1: string; address2?: string; postalCode: string; city: string; country: string; email?: string; phone?: string };
  weightGrams: number;
  reference: string;
};

export type ShipmentResult = {
  providerId: string;
  carrier: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  labelUrl: string | null;
};

export interface ShippingProvider {
  readonly kind: "sendcloud" | "boxtal" | "not_configured";
  readonly configured: boolean;
  createShipment(request: ShipmentRequest): Promise<ShipmentResult>;
}

class NotConfiguredShipping implements ShippingProvider {
  readonly kind = "not_configured" as const;
  readonly configured = false;
  async createShipment(): Promise<ShipmentResult> {
    throw new Error("Aucun transporteur n'est configuré (SHIPPING_PROVIDER).");
  }
}

/** Placeholder until a connector is chosen; keep the interface stable. */
export function getShippingProvider(): ShippingProvider {
  return new NotConfiguredShipping();
}

/** True only once a provider is connected AND rates are declared configured. */
export function isShippingConfigured(settingFlag: boolean) {
  return getShippingProvider().configured || settingFlag;
}
