import { IsString, IsOptional, IsBoolean, IsEmail } from 'class-validator';

export class CreateUserDto {
  @IsString()
  cabinetPeriod: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  nim?: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsString()
  roleId: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  nim?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  roleId?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
