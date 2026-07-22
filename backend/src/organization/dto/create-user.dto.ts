import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  Matches,
  IsMongoId,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Nama lengkap wajib diisi' })
  name: string;

  @IsEmail({}, { message: 'Format email tidak valid' })
  @Matches(/^[a-zA-Z0-9._%+-]+@(mhs\.)?unesa\.ac\.id$/, {
    message:
      'Email harus menggunakan domain resmi Unesa (@mhs.unesa.ac.id atau @unesa.ac.id)',
  })
  email: string;

  @IsOptional()
  @Matches(/^\d{11}$/, {
    message: 'NIM harus terdiri dari 11 digit angka',
  })
  nim?: string;

  @IsOptional()
  phone?: string;

  @IsNotEmpty({ message: 'Jabatan/Posisi wajib diisi' })
  position: string;

  @IsOptional()
  avatar?: string;

  @IsNotEmpty({ message: 'Role hak akses wajib diisi' })
  @IsMongoId({ message: 'ID Role tidak valid' })
  role: string;

  @IsOptional()
  @IsMongoId({ message: 'ID Departemen tidak valid' })
  department?: string | null;

  @IsOptional()
  cabinetPeriod?: string;

  @IsOptional()
  isActive?: boolean;
}
