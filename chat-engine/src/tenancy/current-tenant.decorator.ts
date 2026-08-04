import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { TenantDocument } from "./tenant.model";

interface RequestWithTenant {
  tenant?: TenantDocument;
}

export const CurrentTenant = createParamDecorator((_data: unknown, ctx: ExecutionContext): TenantDocument => {
  const request = ctx.switchToHttp().getRequest<RequestWithTenant>();
  return request.tenant!;
});
