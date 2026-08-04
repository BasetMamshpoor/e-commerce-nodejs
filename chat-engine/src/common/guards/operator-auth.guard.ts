import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { verifyOperatorToken } from "../verifyOperatorToken";

interface RequestWithOperator {
  headers: Record<string, string | string[] | undefined>;
  operator?: { userId: number; role: string };
}

@Injectable()
export class OperatorAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithOperator>();
    const header = request.headers.authorization;
    const headerValue = Array.isArray(header) ? header[0] : header;
    const token = headerValue?.startsWith("Bearer ") ? headerValue.slice("Bearer ".length) : undefined;

    request.operator = verifyOperatorToken(token);
    return true;
  }
}
