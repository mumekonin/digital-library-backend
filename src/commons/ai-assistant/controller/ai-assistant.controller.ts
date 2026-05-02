import {Controller,Post,Get,Body,HttpCode,HttpStatus,UseGuards, Logger,Req,} from '@nestjs/common';
import { JwtAuthGuard } from 'src/commons/guards/jwtauth.gourd';
import { ChatRequestDto, ChatResponseDto } from '../dto/chat.dto';
import { Throttle } from '@nestjs/throttler';
import { AiAssistantService } from '../service/ai-assistant.service';

@Controller('ai-assistant')
export class AiAssistantController {
  private readonly logger = new Logger(AiAssistantController.name);

  constructor(private readonly aiAssistantService: AiAssistantService) { }
  // Main chat endpoint — requires a valid JWT token
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 req/min per user
  async chat(
    @Body() dto: ChatRequestDto,
    @Req() req: any,
  ): Promise<ChatResponseDto> {
    const userId = req.user?.sub || req.user?.id || 'anonymous';
    this.logger.log(`Chat request from user: ${userId}`);
    return this.aiAssistantService.chat(dto);
  }
  // Health check 
  @Get('status')
  @HttpCode(HttpStatus.OK)
  getStatus() {
    return this.aiAssistantService.getStatus();
  }
}