import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('teste')
  teste() {
    return {
      ok: true,
      mensagem: 'Backend funcionando',
    };
  }
}