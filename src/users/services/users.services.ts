import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { Model } from "mongoose";
import { UsersSchema } from "../schema/users.schema";
import { InjectModel } from "@nestjs/mongoose";
import { ChangePasswordDto, LoginDto, UpdateUserProfileDto, UsersDto } from "../dtos/users.dto";
import * as bcrypt from 'bcrypt';
import { UserResponse } from "../responses/users.respnses";
import { commonUtils } from "src/commons/utils";
import { ReportsService } from "src/reporting/service/reports.service";
import { randomBytes } from "crypto";
import { MailerService } from "@nestjs-modules/mailer";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class UserService {
  constructor(
    @InjectModel(UsersSchema.name)
    private readonly userModule: Model<UsersSchema>,
    private readonly reportService: ReportsService,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService
  ) { }
  //create user account
  async createUserAccount(usersDto: UsersDto) {
    //CHECK IF THE USER IS EXISTS
    const userExists = await this.userModule.findOne({ username: usersDto.username.toLowerCase() });

    if (userExists) {
      throw new BadRequestException('user already exists');
    }
    //hashed password
    const hashedPWD = await bcrypt.hash(usersDto.password, 10);
    //role assignment
    let role = 'student';
    //prepare an instance to be saved
    const newUser = new this.userModule({
      firstName: usersDto.firstName,
      lastName: usersDto.lastName,
      username: usersDto.username.toLowerCase(),
      email: usersDto.email.toLowerCase(),
      password: hashedPWD,
      role: role
    });
    const savedUser = await newUser.save();
    //map to user response interceptor
    const UserResponse: UserResponse = {
      id: savedUser._id.toString(),
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      username: savedUser.username,
      role: savedUser.role,
    };

    const userID = savedUser._id.toString();
    const action = "create user acount";
    await this.reportService.registorReports(userID, action);
    return UserResponse;
  }
  //user login
  async userLogin(loginDto: LoginDto) {
    //check if the user exists
    const user = await this.userModule.findOne({ username: loginDto.username.toLowerCase() });
    if (!user) {
      throw new BadRequestException('username is not found');
    }
    //compare password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('invalid password');
    }
    const jwtData = {
      userId: user._id.toString(), // always pass a string
      role: user.role,             // required for RolesGuard
    }
    const generateJwtToken = commonUtils.generateJwtToken(jwtData);
    const userID = user._id.toString();
    const action = "user loged in";

    await this.reportService.registorReports(userID, action);
    return { token: generateJwtToken };
  }
  //create librarian account
  async createLibrarianAccount(usersDto: UsersDto, currentUser: any) {
    //find current user from db
    const user = await this.userModule.findById(currentUser);
    if (!user) {
      throw new BadRequestException('current user not found');
    }
    //check if the current user is admin 
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only admin can create librarian');
    }
    //check if the librarian already  
    const librarianExists = await this.userModule.findOne({ username: usersDto.username.toLowerCase() });

    if (librarianExists) {
      throw new BadRequestException('librarian already exists');
    }

    //hashed password
    const hashedPWD = await bcrypt.hash(usersDto.password, 10);
    //create librarian 

    const newLibrarian = new this.userModule({
      firstName: usersDto.firstName,
      lastName: usersDto.lastName,
      username: usersDto.username.toLowerCase(),
      email: usersDto.email.toLowerCase(),
      password: hashedPWD,
      role: 'librarian'
    });
    const savedLibrarian = await newLibrarian.save();
    //map to user response interceptor
    const UserResponse: UserResponse = {
      id: savedLibrarian._id.toString(),
      firstName: savedLibrarian.firstName,
      lastName: savedLibrarian.lastName,
      username: savedLibrarian.username,
      role: savedLibrarian.role,
    };
    const userID = "admin" + currentUser;
    const action = "create librarian acoount";
    await this.reportService.registorReports(userID, action);
    return UserResponse;
  }
  //get user profile
  async getMyProfile(userId: string) {
    const user = await this.userModule.findById(userId);
    if (!user) {
      throw new BadRequestException('user not found');
    }
    const userProfile: UserResponse = {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      role: user.role
    }
    const userID = user._id.toString();
    const action = "viwe your profile";
    await this.reportService.registorReports(userID, action);
    return userProfile;
  }
  //update user profile
  async updatemyProfile(id: string, updateUserProfileDto: UpdateUserProfileDto) {
    const user = await this.userModule.findById(id);
    if (!user) {
      throw new BadRequestException('user not found');
    }
    //update fields
    if (updateUserProfileDto.firstName) {
      user.firstName = updateUserProfileDto.firstName;
    }
    if (updateUserProfileDto.lastName) {
      user.lastName = updateUserProfileDto.lastName;
    }
    if (updateUserProfileDto.username) {
      //check if the username is exist
      const usernameExiists = await this.userModule.findOne({ username: updateUserProfileDto.username.toLowerCase() });
      if (usernameExiists) {
        throw new BadRequestException('username already exists');
      }
      user.username = updateUserProfileDto.username;
    }
    if (updateUserProfileDto.email) {
      user.email = updateUserProfileDto.email;
    }
    //save the updated user to the database
    const updatedser = await user.save();
    //map to user response
    const updatedUserProfile: UserResponse = {
      id: updatedser._id.toString(),
      firstName: updatedser.firstName,
      lastName: updatedser.lastName,
      username: updatedser.username,
      email: updatedser.email,
    }
    const userID = updatedser._id.toString();
    const action = "user updateprofile";
    await this.reportService.registorReports(userID, action);
    return updatedUserProfile;
  }
  async chnageUserPassword(id: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.userModule.findById(id);
    if (!user) {
      throw new BadRequestException('user not found');
    }
    if (changePasswordDto.password) {
      //validate current password
      const isMatch = await bcrypt.compare(changePasswordDto.password, user.password);
      if (!isMatch) {
        throw new BadRequestException('current password is incorrect');
      }
      //validate new password and confirm password
      const newPassword = changePasswordDto.newPassword;
      const confirmPassword = changePasswordDto.confirmPassword;
      if (!newPassword || !confirmPassword) {
        throw new BadRequestException('new password and confirm password are required');
      }
      if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
        throw new BadRequestException('the passwords do not match');
      }
      //check if the new password is same as old password
      const isSameAsOld = await bcrypt.compare(newPassword, user.password);
      if (isSameAsOld) {
        throw new BadRequestException(
          'new password must be different from old password'
        );
      }
      //hash the new password
      const hashedPwd = await bcrypt.hash(newPassword, 10);
      user.password = hashedPwd;
    }
    const updatedUser = await user.save();
    const userID = id;
    const action = "user changed password";
    await this.reportService.registorReports(userID, action);
    return { message: 'password changed successfully' };
  }
  //update librarian profile only by admin
  async updateLibrarianProfile(currentUserId: string, librarianId: string, updateUserProfileDto: UpdateUserProfileDto) {
    const currentUser = await this.userModule.findById(currentUserId);
    //find current user from db
    if (!currentUser) {
      throw new BadRequestException('current user not found');
    }
    //check if the current user is admin
    if (currentUser.role !== 'admin') {
      throw new ForbiddenException('only admin can update librarian profile');
    }
    //find librarian by id
    const librarian = await this.userModule.findById(librarianId);
    if (!librarian) {
      throw new BadRequestException('librarian not found');
    }
    //update fields
    if (updateUserProfileDto.firstName) {
      librarian.firstName = updateUserProfileDto.firstName;
    }
    if (updateUserProfileDto.lastName) {
      librarian.lastName = updateUserProfileDto.lastName;
    }
    if (updateUserProfileDto.username) {
      //check if the username is exist
      const usernameExiists = await this.userModule.findOne({ username: updateUserProfileDto.username.toLowerCase() });
      if (usernameExiists) {
        throw new BadRequestException('username already exists');
      }
      librarian.username = updateUserProfileDto.username;
    }
    if (updateUserProfileDto.email) {
      librarian.email = updateUserProfileDto.email;
    }
    //save the updated librarian to the database
    const updatedLibrarian = await librarian.save();
    //map to user response
    const updatedLibrarianProfile: UserResponse = {
      id: updatedLibrarian._id.toString(),
      firstName: updatedLibrarian.firstName,
      lastName: updatedLibrarian.lastName,
      username: updatedLibrarian.username,
      email: updatedLibrarian.email,
    }
    const userID = updatedLibrarian._id.toString();
    const action = "profile is updated by admin";
    await this.reportService.registorReports(userID, action);
    return updatedLibrarianProfile;
  }
  //delete user account by admin
  async deleteUserAccount(currentUserId: string, userIdToDelete: string) {
    //find current user from db
    const currrentUser = await this.userModule.findById(currentUserId);
    if (!currrentUser) {
      throw new BadRequestException('current user not found');
    }
    //check if the current user is admin
    if (currrentUser.role !== 'admin') {
      throw new ForbiddenException('only admin can delete user account');
    }
    //prevent admin from deleting own account
    if (currentUserId === userIdToDelete) {
      throw new ForbiddenException('admin cannot delete own account');
    }
    //find user to delete
    const userToDelete = await this.userModule.findById(userIdToDelete);
    if (!userToDelete) {
      throw new BadRequestException('user to delete not found');
    }
    //delete user
    const deletedUser = await this.userModule.findByIdAndDelete(userIdToDelete);
    const userID = userIdToDelete;
    const action = "account is deleted by admin";
    await this.reportService.registorReports(userID, action);
    return {
      message: 'user account deleted successfully'
    };
  }
  //fetch all users by role by admin
  async fetchAllUsersByRole(currentUserID: string, role: string) {
    const currentUser = await this.userModule.findById(currentUserID);
    if (!currentUser) {
      throw new BadRequestException('current user not found');
    }
    //check if the current user is admin
    if (currentUser.role !== 'admin') {
      throw new ForbiddenException('only admin can fetch users by role');
    }
    const users = await this.userModule.find({ role: role });
    if (!users || users.length === 0) {
      throw new BadRequestException(`no users found with role: ${role}`);
    }
    //map users to user response
    const usersResponse: UserResponse[] = users.map((user) => {
      return {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        role: user.role,
        email: user.email
      }
    });
    const userID = currentUserID;
    const action = "fetched all user";
    await this.reportService.registorReports(userID, action);
    return usersResponse;
  }
  //logout user
  async logoutUser(currentUserId: string) {
    const user = await this.userModule.findById(currentUserId);
    if (!user) {
      throw new BadRequestException('user not found');
    }
    user.refreshToken = null;
    await user.save();
    const userID = currentUserId;
    const action = "user logged out";
    await this.reportService.registorReports(userID, action);
    return { message: 'user logged out successfully' };
  }
  // async forgotPassword(email: string) {
  //   const user = await this.userModule.findOne({
  //     email: email.toLowerCase(),
  //   });

  //   if (!user) {
  //     return { message: 'If that email exists, a reset link has been sent.' };
  //   }

  //   const token = randomBytes(32).toString('hex');
  //   const expiry = new Date(Date.now() + 60 * 60 * 1000);

  //   await this.userModule.findByIdAndUpdate(user._id, {
  //     resetToken: token,
  //     resetTokenExpiry: expiry,
  //   });

  //   const frontendUrl = this.configService.get<string>('FRONTEND_URL');
  //   const resetUrl = `${frontendUrl}/reset-password.html?token=${token}`;

  //   await this.mailerService.sendMail({
  //     to: user.email,
  //     subject: 'E-Library — Reset Your Password',
  //     html: `
  //       <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:20px">
  //         <h2 style="color:#0d1321">Reset Your Password</h2>
  //         <p>Click the button below to reset your password.
  //            This link expires in <strong>1 hour</strong>.</p>
  //         <a href="${resetUrl}"
  //            style="display:inline-block;background:#c9a84c;color:#0d1321;
  //                   padding:13px 30px;border-radius:6px;text-decoration:none;
  //                   font-weight:700;margin:20px 0">
  //           Reset Password
  //         </a>
  //         <p style="color:#999;font-size:0.85rem">
  //           If you did not request this, you can safely ignore this email.
  //         </p>
  //       </div>
  //     `,
  //   });

  //   const action = 'requested password reset';
  //   await this.reportService.registorReports(user._id.toString(), action);

  //   return { message: 'If that email exists, a reset link has been sent.' };
  // }

  // async resetPassword(token: string, newPassword: string) {
  //   const user = await this.userModule.findOne({
  //     resetToken: token,
  //     resetTokenExpiry: { $gt: new Date() },
  //   });

  //   if (!user) {
  //     throw new BadRequestException('Invalid or expired reset token');
  //   }

  //   const hashed = await bcrypt.hash(newPassword, 10);

  //   await this.userModule.findByIdAndUpdate(user._id, {
  //     password: hashed,
  //     resetToken: null,
  //     resetTokenExpiry: null,
  //   });

  //   const action = 'password reset successfully';
  //   await this.reportService.registorReports(user._id.toString(), action);

  //   return { message: 'Password reset successfully. You can now log in.' };
  // }
  // ─── forgotPassword ───────────────────────────────────────────────────────────
async forgotPassword(email: string) {
  const user = await this.userModule.findOne({
    email: email.toLowerCase(),
  });

  if (!user) {
    // Don't reveal whether the email exists
    return { message: 'If that email exists, a reset link has been sent.' };
  }

  const token  = randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await this.userModule.findByIdAndUpdate(user._id, {
    resetToken:        token,
    resetTokenExpiry:  expiry,
  });

  const frontendUrl = this.configService.get<string>('FRONTEND_URL');
  const resetUrl    = `${frontendUrl}/reset-password.html?token=${token}`;

  // ✅ FIX: wrap sendMail in try/catch so errors are caught and reported
  try {
    await this.mailerService.sendMail({
      to:      user.email,
      subject: 'E-Library — Reset Your Password',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:20px">
          <h2 style="color:#0d1321">Reset Your Password</h2>
          <p>Click the button below to reset your password.
             This link expires in <strong>1 hour</strong>.</p>
          <a href="${resetUrl}"
             style="display:inline-block;background:#c9a84c;color:#0d1321;
                    padding:13px 30px;border-radius:6px;text-decoration:none;
                    font-weight:700;margin:20px 0">
            Reset Password
          </a>
          <p style="color:#999;font-size:0.85rem">
            If you did not request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    console.log('✅ Reset email sent to:', user.email);

  } catch (mailError) {
    // ✅ FIX: log the real error so you can debug it in your server terminal
    console.error('❌ Mail send failed:', mailError);

    // ✅ FIX: throw so the frontend gets a proper error response (not silent failure)
    throw new InternalServerErrorException(
      'Failed to send reset email. Please try again later.',
    );
  }

  const action = 'requested password reset';
  await this.reportService.registorReports(user._id.toString(), action);

  return { message: 'If that email exists, a reset link has been sent.' };
}

// ─── resetPassword ────────────────────────────────────────────────────────────
async resetPassword(token: string, newPassword: string) {
  const user = await this.userModule.findOne({
    resetToken:        token,
    resetTokenExpiry:  { $gt: new Date() },
  });

  if (!user) {
    throw new BadRequestException('Invalid or expired reset token');
  }

  const hashed = await bcrypt.hash(newPassword, 10);

  await this.userModule.findByIdAndUpdate(user._id, {
    password:          hashed,
    resetToken:        null,
    resetTokenExpiry:  null,
  });

  const action = 'password reset successfully';
  await this.reportService.registorReports(user._id.toString(), action);

  return { message: 'Password reset successfully. You can now log in.' };
}
}