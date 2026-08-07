import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { MulterError } from 'multer';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const payload =
        typeof exceptionResponse === 'string'
          ? { message: exceptionResponse }
          : (exceptionResponse as Record<string, unknown>);

      const message = payload.message ?? exception.message;
      const erro =
        typeof payload.erro === 'string'
          ? payload.erro
          : Array.isArray(message)
            ? message.join(', ')
            : message;

      return response.status(status).json({
        statusCode: status,
        error: payload.error ?? HttpStatus[status] ?? 'Error',
        message,
        erro,
        timestamp: new Date().toISOString(),
      });
    }

    if (exception instanceof MulterError) {
      const message =
        exception.code === 'LIMIT_FILE_SIZE'
          ? 'Cada imagem deve ter no máximo 10 MB'
          : exception.code === 'LIMIT_FILE_COUNT' ||
              exception.code === 'LIMIT_UNEXPECTED_FILE'
            ? 'Limite de upload de imagens excedido'
            : 'Falha no upload do arquivo';

      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message,
        timestamp: new Date().toISOString(),
      });
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
          message: 'Já existe um registro com estes dados únicos.',
          timestamp: new Date().toISOString(),
        });
      }

      if (exception.code === 'P2025') {
        return response.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Not Found',
          message: 'Registro não encontrado.',
          timestamp: new Date().toISOString(),
        });
      }
    }

    this.logger.error(
      exception instanceof Error ? exception.message : 'Unexpected error',
      exception instanceof Error ? exception.stack : undefined,
    );

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'Erro interno do servidor.',
      timestamp: new Date().toISOString(),
    });
  }
}
