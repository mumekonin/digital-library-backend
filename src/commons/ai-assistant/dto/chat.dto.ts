import {IsString,IsArray,ValidateNested,IsEnum,IsNotEmpty,IsOptional,MaxLength,ArrayMaxSize,} from 'class-validator';
import { Type } from 'class-transformer';

// Frontend sends 'en' | 'am' | 'om'
export type SupportedLanguage = 'en' | 'am' | 'om';

export class MessageDto {
  @IsEnum(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @IsString()
  @IsNotEmpty()
  @MaxLength(8000)
  content!: string;
}

export class ChatRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMaxSize(40, { message: 'Conversation history cannot exceed 40 messages.' })
  @Type(() => MessageDto)
  messages!: MessageDto[];

  // 'en' = English, 'am' = Amharic (አማርኛ), 'om' = Afaan Oromoo
  @IsOptional()
  @IsEnum(['en', 'am', 'om'])
  language?: SupportedLanguage;

  // Optional: frontend can override the system prompt per language
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  systemPrompt?: string;
}

export class ChatResponseDto {
  reply!: string;
  inputTokens!: number;
  outputTokens!: number;
  model!: string;
  language!: SupportedLanguage;
}