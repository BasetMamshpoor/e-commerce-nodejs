import { Global, Module } from "@nestjs/common";
import { TenancyService } from "./tenancy.service";
import { TenantResolverMiddleware } from "./tenant-resolver.middleware";
import { TenantResolverGuard } from "./tenant-resolver.guard";

@Global()
@Module({
  providers: [TenancyService, TenantResolverMiddleware, TenantResolverGuard],
  exports: [TenancyService, TenantResolverMiddleware, TenantResolverGuard],
})
export class TenancyModule {}
