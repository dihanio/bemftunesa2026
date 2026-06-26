import {
  IsDateString, IsMongoId, IsNotEmpty,
  IsNumber, IsOptional, IsString, Min, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LocationDto {
  @IsNotEmpty() @IsString()
  name: string;

  @IsNumber() latitude: number;
  @IsNumber() longitude: number;

  @IsNumber() @Min(10)
  radiusInMeters: number;
}

export class CreateRapatDto {
  @IsNotEmpty() @IsString()
  title: string;

  @IsOptional() @IsString()
  description?: string;

  @IsDateString()
  scheduledAt: string;

  @ValidateNested() @Type(() => LocationDto)
  location: LocationDto;

  @IsMongoId()
  cabinetPeriod: string;
}

export class UpdateRapatDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsDateString() scheduledAt?: string;
  @IsOptional() @ValidateNested() @Type(() => LocationDto)
  location?: LocationDto;
}

export class ManualAttendDto {
  @IsMongoId() userId: string;
  @IsOptional() @IsString() note?: string;
}

export class QrAttendDto {
  @IsNotEmpty() @IsString() token: string;
  @IsNumber() latitude: number;
  @IsNumber() longitude: number;
}
