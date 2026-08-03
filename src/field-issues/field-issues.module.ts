import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MitrasModule } from '../mitras/mitras.module';
import { UsersModule } from '../modules/users/users.module';
import { FieldIssuesController } from './field-issues.controller';
import { FieldIssuesService } from './field-issues.service';
import { FieldIssue, FieldIssueSchema } from './schemas/field-issue.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FieldIssue.name, schema: FieldIssueSchema },
    ]),
    UsersModule,
    MitrasModule,
  ],
  controllers: [FieldIssuesController],
  providers: [FieldIssuesService],
  exports: [FieldIssuesService],
})
export class FieldIssuesModule {}
