import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { ConceptVideoService } from './concept-video.service';
import { ConceptVideo } from './schemas/concept-video.schema';

describe('ConceptVideoService', () => {
  let service: ConceptVideoService;
  let mockModel: any;

  const mockExistingVideo = {
    _id: 'mock-id-1',
    title: 'Existing Title',
    subtitle: 'Existing Subtitle',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtubeId: 'dQw4w9WgXcQ',
    thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    isActive: true,
    toObject() {
      return { ...this };
    },
  };

  beforeEach(async () => {
    mockModel = {
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConceptVideoService,
        {
          provide: getModelToken(ConceptVideo.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<ConceptVideoService>(ConceptVideoService);
  });

  describe('extractYoutubeId', () => {
    it('should extract ID from standard watch URL', () => {
      expect(
        service.extractYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
      ).toBe('dQw4w9WgXcQ');
    });

    it('should extract ID from watch URL with extra query parameters', () => {
      expect(
        service.extractYoutubeId(
          'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=45s&feature=shared',
        ),
      ).toBe('dQw4w9WgXcQ');
    });

    it('should extract ID from youtu.be short URL', () => {
      expect(
        service.extractYoutubeId('https://youtu.be/izBL1PXbOaD'),
      ).toBe('izBL1PXbOaD');
    });

    it('should extract ID from youtu.be URL with query params', () => {
      expect(
        service.extractYoutubeId('https://youtu.be/izBL1PXbOaD?si=test123'),
      ).toBe('izBL1PXbOaD');
    });

    it('should extract ID from YouTube Shorts URL', () => {
      expect(
        service.extractYoutubeId(
          'https://www.youtube.com/shorts/izBL1PXbOaD',
        ),
      ).toBe('izBL1PXbOaD');
    });

    it('should extract ID from YouTube Shorts URL with query params', () => {
      expect(
        service.extractYoutubeId(
          'https://youtube.com/shorts/izBL1PXbOaD?feature=share',
        ),
      ).toBe('izBL1PXbOaD');
    });

    it('should return default fallback when url is not provided', () => {
      expect(service.extractYoutubeId(undefined)).toBe('dQw4w9WgXcQ');
      expect(service.extractYoutubeId('')).toBe('dQw4w9WgXcQ');
    });

    it('should return empty string for invalid URLs', () => {
      expect(service.extractYoutubeId('https://vimeo.com/123456789')).toBe('');
      expect(service.extractYoutubeId('not-a-valid-url')).toBe('');
    });
  });

  describe('get', () => {
    it('should return existing active concept video if found', async () => {
      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockExistingVideo),
      });

      const result = await service.get();
      expect(mockModel.findOne).toHaveBeenCalledWith({ isActive: true });
      expect(result.videoUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    });

    it('should create default configuration if none exists', async () => {
      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      mockModel.create.mockResolvedValue(mockExistingVideo);

      const result = await service.get();
      expect(mockModel.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update configuration successfully with a YouTube Shorts URL', async () => {
      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockExistingVideo),
      });
      mockModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockExistingVideo,
          videoUrl: 'https://www.youtube.com/shorts/izBL1PXbOaD',
          youtubeId: 'izBL1PXbOaD',
          thumbnailUrl: 'https://img.youtube.com/vi/izBL1PXbOaD/maxresdefault.jpg',
        }),
      });

      const updated = await service.update({
        videoUrl: 'https://www.youtube.com/shorts/izBL1PXbOaD',
      });

      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockExistingVideo._id,
        expect.objectContaining({
          youtubeId: 'izBL1PXbOaD',
          thumbnailUrl: 'https://img.youtube.com/vi/izBL1PXbOaD/maxresdefault.jpg',
        }),
        { new: true },
      );
      expect(updated.youtubeId).toBe('izBL1PXbOaD');
    });

    it('should preserve provided custom thumbnailUrl if given', async () => {
      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockExistingVideo),
      });
      mockModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockExistingVideo,
          thumbnailUrl: 'https://custom-domain.com/custom.png',
        }),
      });

      await service.update({
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        thumbnailUrl: 'https://custom-domain.com/custom.png',
      });

      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockExistingVideo._id,
        expect.objectContaining({
          thumbnailUrl: 'https://custom-domain.com/custom.png',
        }),
        { new: true },
      );
    });

    it('should throw BadRequestException if videoUrl is invalid', async () => {
      await expect(
        service.update({
          videoUrl: 'https://invalid-video-platform.com/xyz',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
