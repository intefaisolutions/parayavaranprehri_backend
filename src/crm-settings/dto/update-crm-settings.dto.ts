import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateCrmSettingsDto {
  @IsString()
  @IsOptional()
  crmApiUrl?: string;

  @IsString()
  @IsOptional()
  crmApiKey?: string;

  @IsString()
  @IsOptional()
  crmApiSecret?: string;

  @IsString()
  @IsOptional()
  crmCompanyId?: string;

  @IsBoolean()
  @IsOptional()
  crmSyncEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  masterAutoSync?: boolean; // alias for crmSyncEnabled

  @IsBoolean()
  @IsOptional()
  syncUserRegistrations?: boolean;

  @IsBoolean()
  @IsOptional()
  newUserRegistrations?: boolean; // alias for syncUserRegistrations

  @IsBoolean()
  @IsOptional()
  syncEnquiries?: boolean;

  @IsBoolean()
  @IsOptional()
  insuranceQuoteEnquiries?: boolean; // alias for syncEnquiries

  @IsBoolean()
  @IsOptional()
  syncCsvLeads?: boolean;

  @IsString()
  @IsOptional()
  platformSource?: string;
}
