import { Controller, Get } from '@nestjs/common';
import { HomeService } from './home.service';

@Controller()
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get('home')
  getHome() {
    return this.homeService.getHome();
  }

  @Get('episodes')
  getEpisodes() {
    return this.homeService.getEpisodes();
  }

  @Get('channels')
  getChannels() {
    return this.homeService.getChannels();
  }

  @Get('categories')
  getCategories() {
    return this.homeService.getCategories();
  }
}
