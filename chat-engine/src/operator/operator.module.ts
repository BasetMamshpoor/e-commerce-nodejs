import { Module } from "@nestjs/common";
import { OperatorController } from "./operator.controller";
import { OperatorGateway } from "./operator.gateway";

@Module({
  controllers: [OperatorController],
  providers: [OperatorGateway],
})
export class OperatorModule {}
