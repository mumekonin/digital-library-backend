import {
  Injectable,
  Logger,
  BadRequestException,
  ServiceUnavailableException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { ChatRequestDto, ChatResponseDto, SupportedLanguage } from '../dto/chat.dto';

// ── Built-in system prompts per language ──────────────
const SYSTEM_PROMPTS: Record<SupportedLanguage, string> = {

  // English
  en: `You are a helpful, friendly, and encouraging Study Assistant for E-Library,
a digital academic library used by students in Ethiopia.

Your role is to help students understand academic subjects clearly and confidently.
- Explain complex concepts in simple language for secondary and university students
- Solve mathematics step by step (algebra, geometry, calculus, statistics)
- Clarify science topics: Physics, Chemistry, Biology, Earth Science
- Discuss history, geography, civics, and social studies
- Help with literature analysis, essay structure, grammar, and writing
- Explain economics, business studies, and accounting
- Support ICT and programming fundamentals

ALWAYS respond in English only.
Use **bold** for key terms. Use numbered lists for steps. Show all working for math problems.
Be encouraging — mistakes are part of learning.
Stay focused on academic subjects only. Do not write full essays for students — guide them instead.`,

  // አማርኛ (Amharic)
  am: `እርስዎ ለኢ-ላይብረሪ (E-Library) የተመደቡ ረዳት መምህር ነዎት።
ኢ-ላይብረሪ በኢትዮጵያ ለሚማሩ ተማሪዎች የዲጂታል የትምህርት ቤተ-መጻሕፍት ነው።

ዓላማዎ ተማሪዎች የትምህርት ርዕሰ ጉዳዮችን በግልጽ እና በእምነት እንዲረዱ መርዳት ነው።
- ለሁለተኛ ደረጃ እና ዩኒቨርሲቲ ተማሪዎች ውስብስብ ሀሳቦችን በቀላል ቋንቋ ያብራሩ
- የሂሳብ ችግሮችን ደረጃ በደረጃ ይፍቱ (አልጀብራ፣ ጂኦሜትሪ፣ ካልኩለስ፣ ስታቲስቲክስ)
- ፊዚክስ፣ ኬሚስትሪ፣ ባዮሎጂ፣ የምድር ሳይንስ ያብራሩ
- ታሪክ፣ ጂኦግራፊ፣ ሲቪክስ እና ማህበራዊ ጥናቶችን ያብራሩ
- ስነ-ጽሑፍ ትንተና፣ ድርሰት አወቃቀር፣ ሰዋስው ይርዱ
- ኢኮኖሚክስ፣ ቢዝነስ እና የሂሳብ አያያዝ ያብራሩ

ሁልጊዜ በአማርኛ ቋንቋ ብቻ ምላሽ ይስጡ።
ለቁልፍ ቃላት **ደፋር** ይጠቀሙ። ለደረጃ-በ-ደረጃ ሂደቶች ቁጥሮች ያለው ዝርዝር ይጠቀሙ።
አበረታቹ ይሁኑ። ስህተቶች የመማር ሂደት አካል ናቸው።
ሙሉ ድርሰቶች አይጻፉ — ተማሪዎችን ያዳብሩ።`,

  // Afaan Oromoo (Oromo)
  om: `Ati gargaaraa barnoota E-Library ti.
E-Library mana kitaabaa dijitaalaa barattootaaf Itoophiyaa keessa jiru.

Gaheen kee barattootni mata duree barnoota salphatti fi abdii qabaatanii hubatanitti gargaaruudha.
- Yaadota ulfaatoo afaan salphaa fi ifaa ta'een barattootaaf ibsi
- Rakkoo herregaa tartiibaan furuuf ibsi (algebra, geometry, calculus, statistics)
- Mata duree saayinsii ibsi: Physics, Chemistry, Biology, Saayinsii Lafaa
- Seenaa, jeeografia, civics fi barnootota hawaasummaa ibsi
- Xiinxala barreeffamaa, ijaarsa barruu fi grammar gargaari
- Ikonomiksii, barnootota daldalaafi fi herrega gargaari

Yeroo hundumaa Afaan Oromoo qofa fayyadami.
Jechoota ijoo fi yaadota barbaachisaaf **jabaa** fayyadami.
Tartiibaa lakkoofsa qabdu tartiiba-tartiibaan fayyadami.
Jajjabeessi — dogoggorri barumsa irraa adda miti.
Barattootaaf barruu guutuu hin barreessin — godaanisaaf gargaari.`,
};

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);
  private readonly groq: Groq;
  private readonly model: string;
  private readonly maxTokens: number;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY', '');
    if (!apiKey) {
      this.logger.warn('⚠️  GROQ_API_KEY is not set. Get your free key at https://console.groq.com/keys');
    }
    this.groq      = new Groq({ apiKey });
    this.model     = this.configService.get<string>('GROQ_MODEL', 'llama-3.3-70b-versatile');
    this.maxTokens = parseInt(this.configService.get<string>('GROQ_MAX_TOKENS', '1024'));
  }

  async chat(dto: ChatRequestDto): Promise<ChatResponseDto> {
    const { messages, language = 'en', systemPrompt: overridePrompt } = dto;

    if (!messages.length) {
      throw new BadRequestException('Messages array cannot be empty.');
    }
    if (messages[messages.length - 1].role !== 'user') {
      throw new BadRequestException('The last message must be from the user.');
    }
    if (!messages[messages.length - 1].content.trim()) {
      throw new BadRequestException('Message content cannot be empty.');
    }

    const systemPrompt = overridePrompt?.trim() || SYSTEM_PROMPTS[language] || SYSTEM_PROMPTS.en;

    this.logger.log(`Chat — ${messages.length} msg(s) — lang: ${language}`);

    try {
      const response = await this.groq.chat.completions.create({
        model:       this.model,
        max_tokens:  this.maxTokens,
        temperature: 0.7,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((m) => ({
            role:    m.role as 'user' | 'assistant',
            content: m.content,
          })),
        ],
      });

      const reply = response.choices[0]?.message?.content?.trim();
      if (!reply) throw new InternalServerErrorException('Groq returned an empty response.');

      this.logger.log(
        `OK — in: ${response.usage?.prompt_tokens ?? 0} tkn, out: ${response.usage?.completion_tokens ?? 0} tkn`,
      );

      return {
        reply,
        inputTokens:  response.usage?.prompt_tokens     ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
        model:        response.model,
        language,
      };

    } catch (err: any) { 
      if (
        err instanceof BadRequestException        ||
        err instanceof ServiceUnavailableException ||
        err instanceof InternalServerErrorException
      ) throw err;

      const status: number = err?.status ?? err?.response?.status ?? 0;
      const msg: string    = err?.message ?? '';
      this.logger.error(`Groq error [${status}]: ${msg}`);

      if (status === 401) throw new ServiceUnavailableException('AI service not configured. Contact support.');
      if (status === 429) throw new ServiceUnavailableException('Too many requests. Please wait a moment.');
      if (status === 503 || status === 504) throw new ServiceUnavailableException('AI service temporarily unavailable.');
      throw new InternalServerErrorException('An unexpected error occurred. Please try again.');
    }
  }

  getStatus() {
    const apiKey = this.configService.get<string>('GROQ_API_KEY', '');
    return {
      status:             'online',
      provider:           'Groq',
      model:              this.model,
      apiKeyConfigured:   !!apiKey,
      supportedLanguages: ['en (English)', 'am (አማርኛ)', 'om (Afaan Oromoo)'],
    };
  }
}