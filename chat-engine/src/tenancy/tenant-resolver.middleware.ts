import { Injectable, NestMiddleware } from "@nestjs/common";
import { TenancyService } from "./tenancy.service";
import { TenantDocument } from "./tenant.model";

interface RequestWithTenant {
  headers: Record<string, string | string[] | undefined>;
  tenant?: TenantDocument;
}

// ----------------------------------------------------------------------------
// امروز فقط یک تنانت داریم، پس همیشه همان پیش‌فرض resolve می‌شود مگر هدر
// X-Tenant-Key صراحتاً چیز دیگری بخواهد. اگر فردا چند-مستاجری شدیم، همین
// یک میدلور تغییر می‌کند (مثلاً خواندن subdomain) — کنترلرها دست‌نخورده
// می‌مانند چون همیشه فقط request.tenant را می‌خوانند.
// ----------------------------------------------------------------------------

@Injectable()
export class TenantResolverMiddleware implements NestMiddleware {
  constructor(private readonly tenancyService: TenancyService) {}

  async use(req: RequestWithTenant, _res: unknown, next: (err?: unknown) => void) {
    try {
      const header = req.headers["x-tenant-key"];
      const tenantKey = (Array.isArray(header) ? header[0] : header) ?? this.tenancyService.resolveDefaultTenantKey();
      req.tenant = await this.tenancyService.resolveTenant(tenantKey);
      next();
    } catch (err) {
      next(err);
    }
  }
}
