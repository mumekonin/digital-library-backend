import { Body, Controller, Delete, Get, Param, Post, Put, Req } from "@nestjs/common";
import { UserService } from "../services/users.services";
import { ChangePasswordDto, ForgotPasswordDto, LoginDto, ResetPasswordDto, UpdateUserProfileDto, UsersDto } from "../dtos/users.dto";
import { JwtAuthGuard } from "src/commons/guards/jwtauth.gourd";
import { get } from "https";

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService
  ) { }
  //create user account
  @Post('register')
  async registerUser(@Body() usersDTO: UsersDto) {
    const result = await this.userService.createUserAccount(usersDTO);
    return result;
  }
  //user login
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const result = await this.userService.userLogin(loginDto);
    return result;
  }
  //create librarian account only by admin
  @JwtAuthGuard()
  @Post('register-librarian')
  async registerLibrarian(@Body() usersDTO: UsersDto, @Req() req) {
    const currentUser = req.user.userId;
    const result = await this.userService.createLibrarianAccount(usersDTO, currentUser);
    return result;
  }
  //get my profile
  @JwtAuthGuard()
  @Get('profile')
  async getmyProfile(@Req() req) {
    const id = req.user.userId;
    const result = await this.userService.getMyProfile(id);
    return result;
  }
  //update my profile
  @JwtAuthGuard()
  @Put('update-profile')
  async updateMyProfile(@Body() updateUserProfileDto: UpdateUserProfileDto, @Req() req) {
    const id = req.user.userId;
    const result = await this.userService.updatemyProfile(id, updateUserProfileDto);
    return result;
  }
  //change password
  @JwtAuthGuard()
  @Put('change-password')
  async changePassword(@Body() changePasswordDto: ChangePasswordDto, @Req() req) {
    const id = req.user.userId;
    const result = await this.userService.chnageUserPassword(id, changePasswordDto);
    return result;
  }
  //update librarian profile by admin
  @JwtAuthGuard()
  @Put('update-librarian/:librarianId')
  async updateLibrarianProfileByAdmin(@Req() req, @Param('librarianId') librarianId: string, @Body() updateUserProfileDto: UpdateUserProfileDto) {
    const currentUserId = req.user.userId;
    const result = await this.userService.updateLibrarianProfile(currentUserId, librarianId, updateUserProfileDto);
    return result;
  }
  //delete user by admin
  @JwtAuthGuard()
  @Delete('delete-user/:userId')
  async deleteUserByAdmin(@Req() req, @Param('userId') userIdToDelete: string) {
    const currentUserId = req.user.userId;
    const result = await this.userService.deleteUserAccount(currentUserId, userIdToDelete);
    return result;
  }
  //get all users by their role and admin
  @JwtAuthGuard()
  @Get('all-users/:role')
  async getAllUsersByRole(@Req() req, @Param('role') role: string) {
    const currentUserId = req.user.userId;
    const result = await this.userService.fetchAllUsersByRole(currentUserId, role);
    return result;
  }
  //logout user
  @JwtAuthGuard()
  @Post('logout')
  async logoutUser(@Req() req) {
    const userId = req.user.userId;
    const result = await this.userService.logoutUser(userId);
    return result;
  }
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.userService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.userService.resetPassword(dto.token, dto.password);
  }
}