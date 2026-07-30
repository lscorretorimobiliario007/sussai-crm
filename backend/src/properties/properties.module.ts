import { Module } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { PropertyImagesService } from './images/property-images.service';
import { PropertyImagesController } from './images/property-images.controller';

@Module({
  controllers: [PropertiesController, PropertyImagesController],
  providers: [PropertiesService, PropertyImagesService],
  exports: [PropertiesService, PropertyImagesService],
})
export class PropertiesModule {}
