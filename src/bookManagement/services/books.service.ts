import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Model } from "mongoose";
import { BooksSchema, CategorySchema } from "../schemas/books.schema";
import { CreateBookDto, CreateCategoryDto, updateBookDto } from "../dtos/books.dto";
import { BookResponse, CategoryResponse } from "../responses/books.response";
import { InjectModel } from "@nestjs/mongoose";
import { commonUtils } from "src/commons/utils";
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryService } from "src/cloudinary/cloudinary.service";

@Injectable()
export class BooksService {
  constructor(
    @InjectModel(BooksSchema.name)
    private readonly booksModel: Model<BooksSchema>,
    @InjectModel(CategorySchema.name)
    private readonly categoryModel: Model<CategorySchema>
    , private readonly cloudinaryService: CloudinaryService
  ) { }
  async createBook(
    createBookDto: CreateBookDto,
    bookFile: Express.Multer.File,
    coverFile?: Express.Multer.File,
  ) {
    const [filePath, coverPath] = await Promise.all([
      this.cloudinaryService.uploadFile(bookFile, 'books'),
      coverFile
        ? this.cloudinaryService.uploadImage(coverFile, 'covers')
        : Promise.resolve(null),
    ]);

    const newBook = new this.booksModel({
      ...createBookDto,
      category: createBookDto.category,
      filePath,
      fileType: bookFile.mimetype,
      fileSize: bookFile.size,
      fileHash: commonUtils.generateFileHash(bookFile),
      coverPath,
      coverType: coverFile?.mimetype || null,
      coverSize: coverFile?.size || 0,
    });

    const savedBook = await newBook.save();

    return {
      id: savedBook._id.toString(),
      title: savedBook.title,
      author: savedBook.author,
      description: savedBook.description,
      category: savedBook.category,
      filetype: savedBook.fileType,
      createdAt: savedBook.createdAt,
      updatedAt: savedBook.updatedAt,
      filePath: savedBook.filePath,
      coverPath: savedBook.coverPath,
      coverType: savedBook.coverType,
    };
  }
  //retrive all books
  async getAllBooks() {
    const books = await this.booksModel.find();
    if (!books || books.length === 0) {
      throw new BadRequestException("no book is found");
    }
    const booksResponse: BookResponse[] = books.map((books) => {
      return {
        id: books._id.toString(),
        title: books.title,
        author: books.author,
        category: books.category,
        description: books.description,
        filetype: books.fileType,
        createdAt: books.createdAt,
        updatedAt: books.updatedAt
      }
    });
    return booksResponse
  }
  //get single book detiles
  async getBookDetail(bookId: string) {
    //check if the book found on the database
    const bookToBeFind = await this.booksModel.findById(bookId);
    if (!bookToBeFind) {
      throw new BadRequestException("book is not found");
    }
    //map to book response
    const bookDetailResponse: BookResponse = {
      id: bookToBeFind._id.toString(),
      title: bookToBeFind.title,
      author: bookToBeFind.author,
      description: bookToBeFind.description,
      category: bookToBeFind.category,
      filetype: bookToBeFind.fileType,
      createdAt: bookToBeFind.createdAt,
      updatedAt: bookToBeFind.updatedAt
    }
    return bookDetailResponse;
  }
  //update
  async updateBookFile(
    bookId: string,
    updateBookDto: updateBookDto,
    file: Express.Multer.File,
  ) {
    const book = await this.booksModel.findById(bookId);
    if (!book) {
      throw new BadRequestException('Book is not found');
    }

    try {
      // Delete old file from Cloudinary if it exists
      if (book.filePath) {
        const publicId = this.extractPublicId(book.filePath);
        await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
      }

      // Upload new file to Cloudinary
      const filePath = await this.cloudinaryService.uploadFile(file);
      const fileHash = commonUtils.generateFileHash(file);

      if (updateBookDto.title) book.title = updateBookDto.title;
      if (updateBookDto.author) book.author = updateBookDto.author;
      if (updateBookDto.description) book.description = updateBookDto.description;

      book.filePath = filePath;   // Cloudinary URL
      book.fileSize = file.size;
      book.fileType = file.mimetype;
      book.fileHash = fileHash;

      const updatedBook = await book.save();

      const updateBookResponse: BookResponse = {
        id: updatedBook._id.toString(),
        title: updatedBook.title,
        author: updatedBook.author,
        category: updatedBook.category,
        description: updatedBook.description,
        filetype: updatedBook.fileType,
        createdAt: updatedBook.createdAt,
        updatedAt: updatedBook.updatedAt,
      };

      return updateBookResponse;
    } catch (error) {
      throw new BadRequestException('Failed to update the book file');
    }
  }
  //delete
  async deleteBook(bookId: string) {
    const book = await this.booksModel.findById(bookId);
    if (!book) {
      throw new BadRequestException('Book is not found');
    }

    // Delete book file from Cloudinary
    if (book.filePath) {
      const publicId = this.extractPublicId(book.filePath);
      await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    }

    // Delete cover image from Cloudinary
    if (book.coverPath) {
      const publicId = this.extractPublicId(book.coverPath);
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    }

    const deletedBook = await this.booksModel.findByIdAndDelete(bookId);
    if (!deletedBook) {
      throw new BadRequestException('Failed to delete the book');
    }

    return { message: 'Book deleted successfully' };
  }

  // Helper: extract Cloudinary public_id from secure_url                                                      
  private extractPublicId(url: string): string {
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    // Skip version segment (v1234567) if present
    const startIndex = parts[uploadIndex + 1]?.startsWith('v')
      ? uploadIndex + 2
      : uploadIndex + 1;
    const publicIdWithExt = parts.slice(startIndex).join('/');
    // Remove file extension for raw files
    return publicIdWithExt.replace(/\.[^/.]+$/, '');
  }

  // Search function with validation
 async searchBook(key: string): Promise<BookResponse[]> {
  if (!key || typeof key !== 'string' || key.trim().length === 0) {
    throw new BadRequestException('Search key must be a non-empty string');
  }
  key = key.trim();

  const books = await this.booksModel.find({
    $or: [
      { title: { $regex: key, $options: 'i' } },
      { author: { $regex: key, $options: 'i' } },
      { originalFileName: { $regex: key, $options: 'i' } },
      { category: { $regex: key, $options: 'i' } }, // ✅ now defined
    ],
  });

  if (!books || books.length === 0) {
    throw new NotFoundException('No books found for this key');
  }

  return books.map((book) => ({
    id: book._id.toString(),
    title: book.title,
    author: book.author,
    description: book.description,
    category: book.category,
    filePath: book.filePath,
    fileSize: book.fileSize,
    filetype: book.fileType,
    coverPath: book.coverPath,
    updatedAt: book.updatedAt,
    
    readUrl: `http://localhost:3000/books/read/${book._id}`,
    downloadUrl: `http://localhost:3000/books/download/${book._id}`,
    // readUrl: `https://digital-library-backend-p5ga.onrender.com/books/read/${book._id}`,
    // downloadUrl: `https://digital-library-backend-p5ga.onrender.com/books/download/${book._id}`,
  }));
}
  //get book by id
  async getBookById(id: string) {
    const book = await this.booksModel.findById(id);
    if (!book) throw new NotFoundException('Book not found');
    return book;
  }
  async createCategory(categoryDto: CreateCategoryDto) {
    const existingCategory = await this.categoryModel.findOne({ name: categoryDto.name });

    if (existingCategory) {
      throw new BadRequestException("Category already exists");
    }
    const savedCategory = await this.categoryModel.create({
      name: categoryDto.name,
      description: categoryDto.description
    });
    return {
      id: savedCategory._id.toString(),
      name: savedCategory.name,
      description: savedCategory.description
    };
  }
  async deleteCategory(categoryId: string) {
    const category = await this.categoryModel.findById(categoryId);
    if (!category) {
      throw new NotFoundException("category not found");
    }
    const booksWithCategory = await this.booksModel.find({ category: category.name });
    if (booksWithCategory.length > 0) {
      throw new BadRequestException("cannot delete category with associated books");
    }
    await this.categoryModel.findByIdAndDelete(categoryId);
    return { message: "category deleted successfully" };
  }

  async getAllCategories() {
    const categories = await this.categoryModel.find();
    if (!categories || categories.length === 0) {
      throw new NotFoundException("no categories found");
    }
    const categoriesResponse: CategoryResponse[] = categories.map((category) => {
      return {
        id: category._id.toString(),
        name: category.name,
        description: category.description
      }
    });
    return categoriesResponse;
  }
  async findTopSix() {
    const books = await this.booksModel.find().select('+coverPath').limit(6).exec();
    console.log()
    return books.map((book) => ({
      message: "urlis", url: book.coverPath,
      id: book._id.toString(),
      title: book.title,
      author: book.author,
      description: book.description,
      category: book.category,
      coverPath: book.coverPath,
      readUrl: `https://digital-library-backend-p5ga.onrender.com/books/read/${book._id}`,
      downloadUrl: `https://digital-library-backend-p5ga.onrender.com/books/download/${book._id}`,
    }));
  }
  async findOne(id: string): Promise<BooksSchema> {
    const book = await this.booksModel.findById(id).exec();
    if (!book) throw new NotFoundException('Book not found');
    return book;
  }
}
