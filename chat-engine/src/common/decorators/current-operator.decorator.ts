import { createParamDecorator, ExecutionContext } from "@nestjs/common";

interface RequestWithOperator {
  operator?: { userId: number; role: string };
}

export const CurrentOperator = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<RequestWithOperator>();
  return request.operator!;
});
