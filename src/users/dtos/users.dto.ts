import { IsAlpha, IsEmail, IsNotEmpty, IsOptional, isString, IsString, MaxLength, MinLength } from "class-validator";

export class UsersDto {
    @IsString()
    @IsAlpha()
    firstName!: string;
    @IsString()
    @IsAlpha()
    lastName!: string;
    @IsNotEmpty()
    @IsString()
    username!: string;
    @IsNotEmpty()
    @IsEmail()
    email!: string;
    @IsNotEmpty()
    @IsString()
    @MinLength(4)
    @MaxLength(8)
    password!: string
}

export class LoginDto {
    @IsNotEmpty()
    @IsString()
    username!: string;

    @IsNotEmpty()
    @IsString()
    password!: string
}
export class UpdateUserProfileDto{
    @IsString()
    @IsAlpha()
    @IsOptional()
    firstName?: string;
    @IsString()
    @IsAlpha()
    @IsOptional()
    lastName?: string;
    @IsString()
    @IsOptional()
    username?: string;
    @IsEmail()
    @IsOptional()
    email?: string;
}
export class ChangePasswordDto{
    @IsString()
    @MinLength(4)
    @MaxLength(8)
    password?: string
    @IsString()
    @MinLength(4)
    @MaxLength(8)
    newPassword?: string
    @IsString()
    @MinLength(4)
    @MaxLength(8)
    confirmPassword?: string
}
export class ForgotPasswordDto {
  email!: string;
}

export class ResetPasswordDto {
  token!:    string;
  password!: string;
}