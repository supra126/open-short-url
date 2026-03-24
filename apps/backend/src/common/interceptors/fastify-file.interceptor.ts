import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { FastifyRequest } from 'fastify';

/**
 * Fastify file upload interceptor
 * Uses @fastify/multipart instead of multer
 *
 * Usage:
 * @UseInterceptors(new FastifyFileInterceptor('file'))
 */
@Injectable()
export class FastifyFileInterceptor implements NestInterceptor {
  constructor(private readonly fieldName: string) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();

    if (!request.isMultipart()) {
      throw new BadRequestException('Request must be multipart/form-data');
    }

    try {
      const data = await request.file();

      if (!data) {
        throw new BadRequestException('No file provided');
      }

      // Read file content into buffer
      const chunks: Buffer[] = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // Attach file info to request object
      (request as any).file = {
        fieldname: data.fieldname,
        filename: data.filename,
        originalname: data.filename,
        mimetype: data.mimetype,
        encoding: data.encoding,
        buffer: buffer,
        size: buffer.length,
      };

      // Process other form fields
      if (data.fields) {
        const body: Record<string, any> = {};
        for (const [key, field] of Object.entries(data.fields)) {
          if (field && typeof field === 'object' && 'value' in field) {
            body[key] = (field as any).value;
          }
        }
        (request as any).body = { ...(request.body as object), ...body };
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return next.handle();
  }
}
