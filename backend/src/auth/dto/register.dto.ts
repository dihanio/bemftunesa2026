import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsOptional()
  nim?: string;

  @IsString()
  @IsNotEmpty({ message: 'Nama tidak boleh kosong' })
  name: string;

  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Nomor HP tidak boleh kosong' })
  phone: string;

  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  password: string;
}
