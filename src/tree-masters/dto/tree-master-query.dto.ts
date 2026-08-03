import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { TreeAvailability } from '../schemas/tree-master.schema';

const toBool = ({ value }: { value: unknown }) => {
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  return value;
};

export class TreeMasterQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(TreeAvailability)
  availability?: TreeAvailability;

  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  isActive?: boolean;

  /** When true, only catalog-ready trees for user app */
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  catalogOnly?: boolean;
}
