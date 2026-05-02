import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  private upload(file: Express.Multer.File, options: object): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error) return reject(error);
        if (result) resolve(result.secure_url);
        else reject(new Error('Cloudinary returned no result'));
      });
      Readable.from(file.buffer).pipe(stream);
    });
  }

  uploadImage(file: Express.Multer.File, folder = 'covers') {
    return this.upload(file, { resource_type: 'image', folder });
  }

  uploadFile(file: Express.Multer.File, folder = 'books') {
    return this.upload(file, { resource_type: 'raw', folder });
  }

  uploadVideo(file: Express.Multer.File, folder = 'videos') {
    return this.upload(file, { resource_type: 'video', folder });
  }
}