export class BookCatalogResponse {
    title!: string;
    author!: string;
    category!: string;
    floorNumber!: number;
    section!: string;
    shelfNumber!: string;
    totalCopies!: number;
    availableCopies!: number;
    borrowUrl!: string;
}
export class BorrowResponse {
     firstName!: string;
     lastName!: string;
     bookTitle!: string;
     borrowDate!: Date;
     returnDate!: Date;
}