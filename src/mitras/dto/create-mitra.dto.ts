import {
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  MitraMembership,
  MitraStatus,
  MitraTreeAssignment,
} from '../schemas/mitra.schema';

export class CreateMitraDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  mobile!: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  profession?: string;

  @IsString()
  @IsOptional()
  address?: string;

  /** Required for admin assignment; optional for app self-register */
  @IsString()
  @IsOptional()
  vidhanSabha?: string;

  @IsString()
  @IsOptional()
  assignedZone?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @ValidateIf((_, v) => v !== null && v !== undefined && v !== "")
  @IsMongoId()
  @IsOptional()
  landId?: string | null;

  @IsString()
  @IsOptional()
  landName?: string | null;

  @IsEnum(MitraTreeAssignment)
  @IsOptional()
  treeAssignment?: MitraTreeAssignment;

  @ValidateIf(
    (o, v) =>
      o.treeAssignment === MitraTreeAssignment.SINGLE &&
      v !== null &&
      v !== undefined &&
      v !== "",
  )
  @IsMongoId()
  @IsOptional()
  assignedTreeId?: string | null;

  @IsString()
  @IsOptional()
  assignedTreeName?: string;

  @IsEnum(MitraMembership)
  @IsOptional()
  membership?: MitraMembership;

  @IsEnum(MitraStatus)
  @IsOptional()
  status?: MitraStatus;

  @IsNumber()
  @Min(0)
  @IsOptional()
  treesPlanted?: number;

  @IsString({ each: true })
  @IsOptional()
  badges?: string[];

  @IsString()
  @IsOptional()
  remarks?: string;
}
