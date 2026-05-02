import { IsBoolean, IsNumber, IsString } from "class-validator";

export class BookCatalogDto {
    @IsString()
    title!: string;
    @IsString()
    author!: string;
    @IsString()
    category!: string;
    @IsNumber()
    floorNumber!: number;
    @IsString()
    section!: string
    @IsString()
    shelfNumber!: string;
    @IsNumber()
    totalCopies!: number;
} 