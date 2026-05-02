import { Module } from '@nestjs/common';
import { AiAssistantController } from './controller/ai-assistant.controller';
import { AiAssistantService } from './service/ai-assistant.service';

@Module({
  controllers: [AiAssistantController],
  providers: [AiAssistantService],
  exports: [AiAssistantService],
})
export class AiAssistantModule {}