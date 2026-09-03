import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CalculateRashiDto {
  @ApiProperty({ example: '1998-05-15', description: 'Date of birth in YYYY-MM-DD format' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dateOfBirth must be in YYYY-MM-DD format' })
  dateOfBirth!: string;

  @ApiProperty({ example: '14:30:00', description: 'Time of birth in HH:mm:ss format' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}:\d{2}$/, { message: 'timeOfBirth must be in HH:mm:ss format' })
  timeOfBirth!: string;

  @ApiProperty({ example: 'Indore, Madhya Pradesh, India', description: 'Place of birth' })
  @IsString()
  @IsNotEmpty()
  birthPlace!: string;
}
