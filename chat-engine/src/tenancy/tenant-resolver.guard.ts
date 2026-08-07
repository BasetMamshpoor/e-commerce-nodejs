import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { TenancyService } from "./tenancy.service";

@Injectable()
export class TenantResolverGuard implements CanActivate {
  constructor(private readonly tenancyService: TenancyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ tenant?: unknown; headers?: Record<string, string | string[] | undefined> }>();

    if (!request || request.tenant) {
      return true;
    }

    const header = request.headers?.["x-tenant-key"];
    const tenantKey = (Array.isArray(header) ? header[0] : header) ?? this.tenancyService.resolveDefaultTenantKey();

    request.tenant = await this.tenancyService.resolveTenant(tenantKey);
    return true;
  }
}
