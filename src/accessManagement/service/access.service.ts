import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { BookCatalog, Borrow, borrowSchema } from "../schema/access.schema";
import { Model } from "mongoose";
import { BookCatalogDto } from "../dtos/accessManagement.dto";
import { UsersSchema } from "src/users/schema/users.schema";
import { BookCatalogResponse, BorrowResponse } from "../responses/bookCatalogReponse.response";
import { ReportsService } from "src/reporting/service/reports.service";
@Injectable()
export class BookCatalogService {
  constructor(
    @InjectModel(BookCatalog.name)
    private readonly bookCatalogModel: Model<BookCatalog>,
    @InjectModel(UsersSchema.name)
    private readonly userModel: Model<UsersSchema>,
    @InjectModel(Borrow.name)
    private readonly borrowModel: Model<Borrow>,
    private readonly reportService: ReportsService
  ) { }
  async createBookCatalog(bookCatalogDto: BookCatalogDto, currentUser) {
    //check if the user exists
    const user = await this.userModel.findById(currentUser.userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (user.role !== 'librarian') {
      throw new BadRequestException('only librarian can add books to catalog');
    }
    const totalCopies = bookCatalogDto.totalCopies;
    if (totalCopies < 1) {
      throw new BadRequestException('total copies must be at least 1');
    }
    const newBook = new this.bookCatalogModel({
      title: bookCatalogDto.title,
      author: bookCatalogDto.author,
      category: bookCatalogDto.category,
      floorNumber: bookCatalogDto.floorNumber,
      section: bookCatalogDto.section,
      shelfNumber: bookCatalogDto.shelfNumber,
      totalCopies: bookCatalogDto.totalCopies,
      availableCopies: totalCopies
    })
    const savedBook = await newBook.save();
    return {
      message: 'book added successfully',
      book: savedBook
    }
  }
  //search book by title or author
  async searchBook(key: string): Promise<BookCatalog[]> {
    if (!key || typeof key !== 'string' || key.trim().length === 0) {
      throw new BadRequestException('Search key must be a non-empty string');
    }
    key = key.trim();
    const books = await this.bookCatalogModel.find({
      $or: [
        { title: { $regex: key, $options: 'i' } },
        { author: { $regex: key, $options: 'i' } },
        { category: { $regex: key, $options: 'i' } },
        { originalFileName: { $regex: key, $options: 'i' } },
      ],
    });
    if (!books || books.length === 0) {
      throw new NotFoundException('No books found for this key');
    }
    const booksResponse: BookCatalogResponse[] = books.map((books) => {
      return {
        id: books._id.toString(),
        title: books.title,
        author: books.author,
        category: books.category,
        floorNumber: books.floorNumber,
        section: books.section,
        shelfNumber: books.shelfNumber,
        totalCopies: books.totalCopies,
        availableCopies: books.availableCopies,
        borrowUrl: `http://localhost:3000/book-catalog/borrow-book/${books._id}`,
      }
    });
    return booksResponse;
  }
  //borrow book
  async borrowBook(currentUser, bookCatalogId: string, returnDate?: Date) {
    const user = await this.userModel.findById(currentUser.userId);
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== 'student') {
      throw new BadRequestException('Only students can borrow books');
    }

    const book = await this.bookCatalogModel.findById(bookCatalogId);
    if (!book) throw new NotFoundException('Book not found');
    if (book.availableCopies < 1) {
      throw new BadRequestException('No available copies to borrow');
    }
    if (!returnDate) {
      throw new BadRequestException('Return date is required');
    }

    const newBorrow = new this.borrowModel({
      userId: currentUser.userId,
      bookCatalogId: bookCatalogId,
      borrowDate: new Date(),
      returnDate: returnDate,
      status: 'borrowed',
      returned: false,
      actualReturnDate: null
    });
    await newBorrow.save();

    book.availableCopies -= 1;
    await book.save();

    await this.reportService.registorBorrowAndReturnRports(
      currentUser.userId,
      bookCatalogId,
      'book is borrowed'
    );

    return {
      message: 'Book borrowed successfully',
      borrowDetails: {
        firstName: user.firstName,
        lastName: user.lastName,
        bookTitle: book.title,
        borrowDate: newBorrow.borrowDate,
        returnDate: newBorrow.returnDate,
        status: newBorrow.status
      }
    };
  }
  //request to return
  async requestReturn(currentUser, borrowId: string) {
    const borrowRecord = await this.borrowModel.findById(borrowId);
    if (!borrowRecord) throw new NotFoundException('Borrow record not found');

    // Must belong to the student
    if (borrowRecord.userId.toString() !== currentUser.userId) {
      throw new ForbiddenException('You can only return your own borrowed books');
    }

    // Must be currently borrowed
    if (borrowRecord.status !== 'borrowed') {
      throw new BadRequestException(
        `Cannot request return — current status is: ${borrowRecord.status}`
      );
    }

    borrowRecord.status = 'return_requested';
    await borrowRecord.save();

    return {
      message: 'Return request submitted. Please bring the book to the library.',
      status: borrowRecord.status
    };
  }

  // findPendingReturns
  async findPendingReturns() {
    return this.borrowModel
      .find({ status: 'return_requested' })
      .populate('bookCatalogId')
      .populate({ path: 'userId', model: 'UsersSchema', select: 'firstName lastName email' })
      .exec();
  }

  // findAllActiveLoans
  async findAllActiveLoans() {
    return this.borrowModel
      .find({ status: { $in: ['borrowed', 'return_requested'] } })
      .populate('bookCatalogId')
      .populate({ path: 'userId', model: 'UsersSchema', select: 'firstName lastName email' })
      .exec();
  }

  // findActiveBorrowsByUser
  async findActiveBorrowsByUser(userId: string) {
    return this.borrowModel
      .find({ userId, status: { $in: ['borrowed', 'return_requested'] } })
      .populate('bookCatalogId')
      .exec();
  }

  //  APPROVE RETURN
  async approveReturn(currentUser, borrowId: string) {
    if (currentUser.role !== 'librarian') {
      throw new ForbiddenException('Only librarians can approve returns');
    }

    const borrowRecord = await this.borrowModel.findById(borrowId);
    if (!borrowRecord) throw new NotFoundException('Borrow record not found');

    // Must be in return_requested state
    if (borrowRecord.status !== 'return_requested') {
      throw new BadRequestException(
        `Cannot approve — current status is: ${borrowRecord.status}`
      );
    }
    borrowRecord.status = 'returned';
    borrowRecord.returned = true;
    borrowRecord.actualReturnDate = new Date();
    await borrowRecord.save();
    const book = await this.bookCatalogModel.findById(borrowRecord.bookCatalogId);
    if (!book) throw new NotFoundException('Book not found');
    book.availableCopies += 1;
    await book.save();
    await this.reportService.registorBorrowAndReturnRports(
      borrowRecord.userId.toString(),
      borrowRecord.bookCatalogId,
      'book is returned'
    );
    return {
      message: 'Return approved successfully',
      returnDetails: {
        borrowId: borrowRecord._id,
        actualReturnDate: borrowRecord.actualReturnDate,
        status: borrowRecord.status
      }
    };
  }
}