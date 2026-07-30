import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/types/auth-user.type';
import { PropertyImagesService } from './property-images.service';
import { ReorderPropertyImagesDto } from './dto/reorder-property-images.dto';
import {
  MAX_PROPERTY_IMAGES,
  propertyImagesMulterOptions,
} from './property-images.storage';

@Controller('properties/:propertyId/images')
@UseGuards(JwtAuthGuard)
export class PropertyImagesController {
  constructor(private readonly propertyImagesService: PropertyImagesService) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('images', MAX_PROPERTY_IMAGES, propertyImagesMulterOptions),
  )
  upload(
    @CurrentUser() user: AuthUser,
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.propertyImagesService.upload(user.empresaId, propertyId, files || []);
  }

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Param('propertyId', ParseIntPipe) propertyId: number,
  ) {
    return this.propertyImagesService.list(user.empresaId, propertyId);
  }

  @Patch('order')
  reorder(
    @CurrentUser() user: AuthUser,
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Body() dto: ReorderPropertyImagesDto,
  ) {
    return this.propertyImagesService.reorder(
      user.empresaId,
      propertyId,
      dto.imageIds,
    );
  }

  @Patch(':imageId/cover')
  setCover(
    @CurrentUser() user: AuthUser,
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    return this.propertyImagesService.setCover(
      user.empresaId,
      propertyId,
      imageId,
    );
  }

  @Delete(':imageId')
  @HttpCode(HttpStatus.OK)
  remove(
    @CurrentUser() user: AuthUser,
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    return this.propertyImagesService.remove(
      user.empresaId,
      propertyId,
      imageId,
    );
  }
}
