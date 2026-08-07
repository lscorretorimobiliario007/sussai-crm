import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUploadDto } from './dto/create-upload.dto';
import { UpdateUploadDto } from './dto/update-upload.dto';

@Injectable()
export class UploadsService {
  create(createUploadDto: CreateUploadDto) {
    return {
      message: 'Use /properties/:id/images or /documentos for uploads',
      received: createUploadDto,
    };
  }

  findAll() {
    return { data: [], meta: { total: 0 } };
  }

  findOne(id: number) {
    throw new NotFoundException(`Upload #${id} não encontrado`);
  }

  update(id: number, updateUploadDto: UpdateUploadDto) {
    return {
      id,
      message: 'Upload genérico não é editável por este endpoint',
      received: updateUploadDto,
    };
  }

  remove(id: number) {
    return { id, removed: true };
  }
}
