import { Injectable } from "@nestjs/common";
import { Pool } from "pg";
import { ProductLookupPort } from "../engine/productMatcher/types";
import { createCachedProductLookup } from "./cached-product-lookup";
import { RedisCacheService } from "../redis/redis-cache.service";

@Injectable()
export class ProductLookupFactory {
  constructor(private readonly redisCache: RedisCacheService) {}

  forTenant(tenantKey: string, pool: Pool): ProductLookupPort {
    return createCachedProductLookup(pool, this.redisCache, tenantKey);
  }
}
