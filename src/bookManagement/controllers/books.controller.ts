import { Body, Controller, Post, Get, UseInterceptors, UploadedFile, Param, Put, Delete, Query, NotFoundException, Res, UseGuards, BadRequestException, UploadedFiles } from "@nestjs/common";
import { BooksService } from "../services/books.service";
import { CreateBookDto, CreateCategoryDto, updateBookDto } from "../dtos/books.dto";
import * as path from 'path';
import { UploadFileInterceptor } from "uploads/upload.interceptor";
import type { Response } from 'express';
import * as fs from 'fs';
import { Role } from "src/commons/enums/roles.enum";
import { Roles } from "src/commons/decorators/roles.decorator";
import { DbRolesGuard } from "src/commons/guards/roles.guard";
import { AuthGuard } from "@nestjs/passport";
import { JwtAuthGuard } from "src/commons/guards/jwtauth.gourd";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { multerConfig } from "uploads/multer.config";
import axios from 'axios';
@Controller('books')
export class BooksController {
  constructor(
    private readonly booksService: BooksService
  ) { }
  private readonly uploadDir = path.join(__dirname, '../../../uploads/Uploads');
  @Post('upload')
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.LIBRARIAN)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'book', maxCount: 1 },
        { name: 'cover', maxCount: 1 },
      ],
      multerConfig,
    ),
  )
  async uploadBook(

    @UploadedFiles() files: { book?: Express.Multer.File[]; cover?: Express.Multer.File[] },
    @Body() createBookDto: CreateBookDto,
  ) {
    if (!files?.book || files.book.length === 0) {
      throw new BadRequestException('Book file is required');
    }
    const bookFile = files.book[0];
    const coverFile = files.cover?.[0];
    return this.booksService.createBook(createBookDto, bookFile, coverFile);
  }

  @Get("get-all-books")
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.LIBRARIAN, Role.ADMIN)
  async getAllBooks() {
    const result = await this.booksService.getAllBooks();
    return result
  }
  //get book detail
  @JwtAuthGuard()
  @Get("getBookDetail/:id")
  async getBook(@Param('id') id: string) {
    return this.booksService.getBookDetail(id);
  }
  //update
  @Put('update-book/:id')
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.LIBRARIAN)
  @UseInterceptors(UploadFileInterceptor())
  async updateBook(
    @Param('id') id: string,
    @Body() updateBookDto: updateBookDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.booksService.updateBookFile(id, updateBookDto, file);
  }
  //delete
  @Delete('delete-book/:id')
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.LIBRARIAN)
  async deleteBook(@Param('id') id: string) {
    return this.booksService.deleteBook(id);
  }
  //search book
  @Get('search-books')
  async searchBooks(@Query('key') key: string) {
    const books = await this.booksService.searchBook(key.trim());
    return books;
  }

  @Get('download/:id')
  async downloadBook(@Param('id') id: string, @Res() res: Response) {
    const book = await this.booksService.getBookById(id);

    if (!book.filePath) {
      throw new NotFoundException('File path not found');
    }

    try {
      const response = await axios({
        method: 'GET',
        url: book.filePath,
        responseType: 'stream',
      });

      // Set headers for download
      res.setHeader('Content-Disposition', `attachment; filename="book-${id}.pdf"`);
      res.setHeader('Content-Type', 'application/pdf');

      return response.data.pipe(res);
    } catch (error) {
      throw new NotFoundException('Could not retrieve file from Cloudinary');
    }
  }

  @Get('read/:id')
  async readBook(@Param('id') id: string, @Res() res: Response) {
    const book = await this.booksService.getBookById(id);

    if (!book.filePath) {
      throw new NotFoundException('File path not found');
    }

    try {
      const response = await axios({
        method: 'GET',
        url: book.filePath,
        responseType: 'stream',
      });

      // Set header to 'inline' so it opens in the browser
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Content-Type', 'application/pdf');

      return response.data.pipe(res);
    } catch (error) {
      throw new NotFoundException('Could not display file');
    }
  }
  @Post('Create-category')
  @UseGuards(AuthGuard('jwt'), DbRolesGuard)
  @Roles(Role.LIBRARIAN)
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    const result = await this.booksService.createCategory(createCategoryDto);
    return result;
  }
  @Get('get-all-categories')
  async getAllCategories() {
    const result = await this.booksService.getAllCategories();
    return result;
  }
  @Get('getAllBooks')
  async getAllBook() {
    return await this.booksService.findTopSix();
  }
  // Secure download route
  @Get('download/:id')
  async downloadBooks(@Param('id') id: string, @Res() res: Response) {
    const book = await this.booksService.findOne(id);
    return res.download(`./uploads/${book.filePath}`);
  }
}
