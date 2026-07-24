import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SETTING_CATEGORIES, SettingCategory } from '../schemas/setting.schema';

export class CreateSettingDto {
  @IsString()
  @IsNotEmpty()
  settingName!: string;

  @IsIn(SETTING_CATEGORIES)
  @IsNotEmpty()
  category!: SettingCategory;

  @IsString()
  @IsNotEmpty()
  value!: string;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
