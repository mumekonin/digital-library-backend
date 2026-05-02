import { Type } from "class-transformer";
import { IsOptional, IsString } from "class-validator";

export class CreateBookDto {
  @IsString()
  @Type(() => String)
  title!: string;
  @IsString()
  author!: string;
  @IsString()
  description!: string;
  @IsString()
  category!: string;
}
export class CreateCategoryDto{
  @IsString()
  name!:string;
  @IsOptional()
  @IsString()
  description?:string;
}

export class updateBookDto {
  @IsString()
  @Type(() => String)
  title?: string;
  @IsString()
  author?: string;
  @IsString()
  description?: string;
  @IsString()
  category?: string;
}