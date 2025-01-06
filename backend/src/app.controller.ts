import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Core')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/health')
  getHealth() {
    return this.appService.getHealth();
  }
}
