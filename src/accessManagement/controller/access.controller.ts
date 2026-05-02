import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { BookCatalogService } from "../service/access.service";
import { BookCatalogDto } from "../dtos/accessManagement.dto";
import { JwtAuthGuard } from "src/commons/guards/jwtauth.gourd";

@Controller("book-catalog")
export class BookCatalogController {
  constructor(
    private readonly bookCatalogService: BookCatalogService
  ) { }
  //create catalog
  @JwtAuthGuard()
  @Post('create-catalog')
  async createBookCatalog(@Body() bookCatalogDto: BookCatalogDto, @Req() req: any) {
    const currentUser = req.user;
    const result = await this.bookCatalogService.createBookCatalog(bookCatalogDto, currentUser);
    return result;
  }
  //search book by title or author
  @Get('search-books')
  async searchBooks(@Query('key') key: string) {
    const books = await this.bookCatalogService.searchBook(key.trim());
    return books;
  }
  // Student borrows a book
  @JwtAuthGuard()
  @Post('borrow-book/:bookCatalogId')
  async borrowBook(
    @Req() req: any,
    @Param('bookCatalogId') bookCatalogId: string,
    @Body('returnDate') returnDate?: string
  ) {
    let expectedReturnDate: Date | undefined;
    if (returnDate) {
      expectedReturnDate = new Date(returnDate);
      if (isNaN(expectedReturnDate.getTime())) {
        throw new BadRequestException('Invalid return date format');
      }
    }
    return this.bookCatalogService.borrowBook(req.user, bookCatalogId, expectedReturnDate);
  }

  // Student requests a return
  @JwtAuthGuard()
  @Patch('request-return/:borrowId')
  async requestReturn(@Req() req: any, @Param('borrowId') borrowId: string) {
    return this.bookCatalogService.requestReturn(req.user, borrowId);
  }

  // Librarian approves the return
  @JwtAuthGuard()
  @Patch('approve-return/:borrowId')
  async approveReturn(@Req() req: any, @Param('borrowId') borrowId: string) {
    return this.bookCatalogService.approveReturn(req.user, borrowId);
  }

  // Student sees their active loans
  @JwtAuthGuard()
  @Get('my-active-loans')
  async getMyLoans(@Req() req: any) {
    return this.bookCatalogService.findActiveBorrowsByUser(req.user.userId);
  }

  // Librarian sees all pending return requests
  @JwtAuthGuard()
  @Get('pending-returns')
  async getPendingReturns() {
    return this.bookCatalogService.findPendingReturns();
  }

  // Librarian sees all active loans
  @JwtAuthGuard()
  @Get('all-active-loans')
  async getAllLoans() {
    return this.bookCatalogService.findAllActiveLoans();
  }
}