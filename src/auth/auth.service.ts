import { Injectable, BadRequestException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';

import * as bcrypt from "bcrypt";
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../auth/interface/jwt-payload.interface';

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,

  ) { }


  async create(createUserDto: CreateUserDto) {
    try {
      const { password, ...userdata } = createUserDto

      const user = this.userRepository.create({
        ...userdata,
        password: bcrypt.hashSync(password, 10)
      });

      await this.userRepository.save(user);
      delete user.password;


      return {
        ...user,
        token: this.getJwtToken({ id: user.id })
      }
      //TODO: JWT

    } catch (error) {
      console.log(error);
      this.handleDBError(error);

    }

  }

  async login(loginUserDto: LoginUserDto) {
    const { password, email } = loginUserDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: { email: true, password: true, id: true } //! OJO
    })

    if (!user)
      throw new UnauthorizedException("Credentials are not valid (email)")

    if (!bcrypt.compareSync(password, user.password))
      throw new UnauthorizedException("Credentials are not valid (pass)")


    return {
      ...user,
      token: this.getJwtToken({ id: user.id })
    }
    //TODO: retornar el JWT

  }

  async checkAuthStatus(user: User) {
    return {
      ...user,
      token: this.getJwtToken({ id: user.id })
    }
  }


  private getJwtToken(payload: JwtPayload) {

    const token = this.jwtService.sign(payload);

    return token;



  }


  private handleDBError(error: any): never {
    if (error.code === "23505")
      throw new BadRequestException(error.detail);
    console.log(error);

    throw new InternalServerErrorException("Place check server logs")


  }

}
