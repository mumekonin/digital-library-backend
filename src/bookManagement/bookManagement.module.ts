import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { bookSchema, BooksSchema, categorySchema, CategorySchema } from "./schemas/books.schema";
import { BooksService } from "./services/books.service";
import { BooksController } from "./controllers/books.controller";
import { commonUtils } from "src/commons/utils";
import { UsersSchema,userSchema } from "src/users/schema/users.schema";
import { DbRolesGuard } from "src/commons/guards/roles.guard";
import { CloudinaryService } from "src/cloudinary/cloudinary.service";

@Module({ 
  imports:[ MongooseModule.forFeature([
      { name: BooksSchema.name, schema: bookSchema},
      {name:CategorySchema.name,schema:categorySchema},
      {name:UsersSchema.name,schema:userSchema}  
    ])],
  controllers: [BooksController],
  providers: [BooksService,commonUtils,DbRolesGuard,CloudinaryService],
})
export class BookManagementModule {}