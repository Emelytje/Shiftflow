import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync, createReadStream, unlink } from 'fs';
import { randomUUID } from 'crypto';
import { Response } from 'express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';
import { DocumentsService } from './documents.service';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';

export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads');
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.documents.list(user);
  }

  @Get('expiring')
  expiring(@CurrentUser() user: AuthUser) {
    return this.documents.expiring(user);
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname)}`),
      }),
      limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
    }),
  )
  upload(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { name?: string; type?: DocumentType; userId?: string; expiresAt?: string },
  ) {
    if (!file) throw new BadRequestException('Geen bestand ontvangen');
    return this.documents.create(user, {
      type: body.type ?? DocumentType.OTHER,
      name: body.name || file.originalname,
      storageKey: file.filename,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      userId: body.userId,
      expiresAt: body.expiresAt,
    });
  }

  @Get(':id/download')
  async download(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const doc = await this.documents.findForDownload(user, id);
    const path = join(UPLOAD_DIR, doc.storageKey);
    if (!existsSync(path)) {
      throw new BadRequestException('Bestand niet gevonden op de opslag');
    }
    res.setHeader('Content-Type', doc.mimeType ?? 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.name)}"`);
    createReadStream(path).pipe(res);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const result = await this.documents.remove(user, id);
    // Bestand van schijf verwijderen (best effort).
    unlink(join(UPLOAD_DIR, result.storageKey), () => undefined);
    return { success: true };
  }
}
