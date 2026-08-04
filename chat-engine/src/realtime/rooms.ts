export function customerRoom(guestToken: string): string {
  return `customer:${guestToken}`;
}

export function operatorsRoom(tenantKey: string): string {
  return `operators:${tenantKey}`;
}
