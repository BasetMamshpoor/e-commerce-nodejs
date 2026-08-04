import { Global, Module } from "@nestjs/common";
import { StoreSqlService } from "./store-sql.service";
import { ProductLookupFactory } from "./product-lookup.factory";

@Global()
@Module({
  providers: [StoreSqlService, ProductLookupFactory],
  exports: [StoreSqlService, ProductLookupFactory],
})
export class StoreModule {}
