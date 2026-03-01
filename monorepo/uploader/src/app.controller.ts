import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  root() {
    return { message: 'Uploader Service Running' };
  }

  @Get('health')
  health() {
    return { status: 'healthy' };
  }
}
