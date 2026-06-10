import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadService } from './upload.service';

describe('UploadService', () => {
  const configService = {
    get: jest.fn().mockReturnValue(undefined),
  } as unknown as ConfigService;

  let service: UploadService;

  beforeEach(() => {
    service = new UploadService(configService);
  });

  it('rejects unsupported image mime type', async () => {
    await expect(
      service.uploadImage({
        file: `data:text/plain;base64,${Buffer.from('abc').toString('base64')}`,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects oversized image payload', async () => {
    const bigPayload = Buffer.alloc(5 * 1024 * 1024 + 1).toString('base64');
    await expect(
      service.uploadImage({
        file: `data:image/png;base64,${bigPayload}`,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
