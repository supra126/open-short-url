import {
  Controller,
  Post,
  Get,
  Param,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtOrApiKeyAuthGuard } from '@/modules/auth/guards/jwt-or-api-key-auth.guard';
import { FastifyFileInterceptor } from '@/common/interceptors/fastify-file.interceptor';
import { OgImageService } from './og-image.service';

@ApiTags('OG Images')
@Controller('api/og-images')
export class OgImageController {
  constructor(private readonly ogImageService: OgImageService) {}

  @Post('upload/:urlId')
  @UseGuards(JwtOrApiKeyAuthGuard)
  @UseInterceptors(new FastifyFileInterceptor('file'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload OG image for a URL',
    description:
      'Upload and optimize an image for social preview (Open Graph). Accepts jpg, png, webp, gif up to 10MB. Images are automatically resized to 1200x630 and converted to WebP.',
  })
  @ApiParam({ name: 'urlId', description: 'URL ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Image uploaded successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid image file',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'URL not found' })
  async upload(@Param('urlId') urlId: string, @Req() request: FastifyRequest) {
    const file = (request as any).file;
    if (!file || !file.buffer) {
      return { statusCode: 400, message: 'No file provided' };
    }

    const user = (request as any).user;
    const result = await this.ogImageService.uploadForUrl(
      urlId,
      user.sub || user.id,
      { buffer: file.buffer, mimetype: file.mimetype },
      user.role
    );

    return {
      statusCode: 201,
      data: result,
    };
  }

  @Get(':key')
  @ApiOperation({
    summary: 'Serve OG image',
    description:
      'Public endpoint to serve OG images. Used by social media crawlers. Returns the image with aggressive caching headers.',
  })
  @ApiParam({ name: 'key', description: 'URL-encoded S3 key' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Image served' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Image not found' })
  async serve(@Param('key') key: string, @Res() reply: FastifyReply) {
    // Decode the URL-encoded key
    const decodedKey = decodeURIComponent(key);

    const result = await this.ogImageService.serveImage(decodedKey);

    return reply
      .header('Content-Type', result.contentType || 'image/webp')
      .header('Cache-Control', 'public, max-age=3600')
      .header('X-Content-Type-Options', 'nosniff')
      .header('Access-Control-Allow-Origin', '*')
      .header('Cross-Origin-Resource-Policy', 'cross-origin')
      .send(result.body);
  }
}
