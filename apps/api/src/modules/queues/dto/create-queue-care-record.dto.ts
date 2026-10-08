import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateQueueCareRecordDto {
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  procedures?: string;

  @IsOptional()
  @IsString()
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
    require_valid_protocol: true,
  })
  @MaxLength(2048)
  documentUrl?: string;
}
