import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { ApiError } from "../utils/ApiError";
import { TenantDocument } from "./tenant.model";

interface RequestWithTenant {
  tenant?: TenantDocument;
}

export const CurrentTenant = createParamDecorator((_data: unknown, ctx: ExecutionContext): TenantDocument => {
  const request = ctx.switchToHttp().getRequest<RequestWithTenant>();
  if (!request.tenant) {
    throw ApiError.internal("Tenant context not available on request");
  }
  return request.tenant;
});