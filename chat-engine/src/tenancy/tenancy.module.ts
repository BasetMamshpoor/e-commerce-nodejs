import { Global, Module } from "@nestjs/common";
import { TenancyService } from "./tenancy.service";
import { TenantResolverMiddleware } from "./tenant-resolver.middleware";

@Global()
@Module({
  providers: [TenancyService, TenantResolverMiddleware],
  exports: [TenancyService, TenantResolverMiddleware],
})
export class TenancyModule {}
