import { Module } from "@nestjs/common";
import { OperatorController } from "./operator.controller";
import { OperatorGateway } from "./operator.gateway";
import { OperatorActionsService } from "./operator-actions.service";

@Module({
  controllers: [OperatorController],
  providers: [OperatorGateway, OperatorActionsService],
})
export class OperatorModule {}
