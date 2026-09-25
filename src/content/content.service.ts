import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Content, ContentType } from './schemas/content.schema';
import { UpdateContentDto } from './dto/update-content.dto';
import type { JwtPayload } from '../common/decorators/current-user.decorator';

@Injectable()
export class ContentService {
  constructor(
    @InjectModel(Content.name) private contentModel: Model<Content>,
  ) {}

  async getContent(type: string) {
    if (!Object.values(ContentType).includes(type as ContentType)) {
      throw new BadRequestException('Invalid content type');
    }
    const contentType = type as ContentType;

    let content = await this.contentModel.findOne({ type: contentType }).exec();
    
    // Seed default content if not exists
    if (!content) {
      const defaultContents = {
        [ContentType.PRIVACY_POLICY]: "<h2>Privacy Policy</h2><p>Paryavaran Prahri respects your privacy and is committed to protecting your personal information.<br/><br/>This application may collect information required for account creation, tree plantation activities, volunteer participation, certificates, notifications and other application services.<br/><br/>The collected information will be used only for providing and improving the services of Paryavaran Prahri.<br/><br/>Users should review the complete policy before using the application.</p>",
        [ContentType.TERMS_CONDITIONS]: "<h2>Terms & Conditions</h2><p>By accessing and using Paryavaran Prahri, you agree to comply with these Terms & Conditions.<br/><br/>Users are responsible for providing accurate information while using the platform.<br/><br/>The platform may provide services related to tree plantation, environmental activities, volunteer participation, certificates, requests and related programs.<br/><br/>Users must not misuse the platform or submit false information.</p>",
        [ContentType.ABOUT_US]: "<h2>About Us</h2><p>Paryavaran Prahri is an environmental initiative focused on encouraging tree plantation, environmental awareness and community participation.<br/><br/>The platform enables users and volunteers to participate in environmental activities and contribute towards a greener future.</p>"
      };
      
      content = await this.contentModel.create({
        type: contentType,
        content: defaultContents[contentType],
        version: 1,
        status: 'LIVE'
      });
    }

    return {
      success: true,
      data: content
    };
  }

  async updateContent(type: string, updateContentDto: UpdateContentDto, user: JwtPayload) {
    if (!Object.values(ContentType).includes(type as ContentType)) {
      throw new BadRequestException('Invalid content type');
    }
    const contentType = type as ContentType;

    const existingContent = await this.contentModel.findOne({ type: contentType }).exec();

    if (!existingContent) {
      const newContent = await this.contentModel.create({
        type: contentType,
        content: updateContentDto.content,
        version: 1,
        status: 'LIVE',
        updatedBy: user.sub as any
      });
      return {
        success: true,
        message: "Content updated successfully",
        data: newContent
      };
    }

    existingContent.content = updateContentDto.content;
    existingContent.version += 1;
    existingContent.updatedBy = user.sub as any;
    
    await existingContent.save();

    return {
      success: true,
      message: "Content updated successfully",
      data: existingContent
    };
  }
}
