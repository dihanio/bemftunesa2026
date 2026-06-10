import { NotFoundException } from '@nestjs/common';
import { PublicService } from './public.service';

describe('PublicService Aspirations', () => {
  const aspirationModel = {
    create: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn(),
  };

  const service = new PublicService(
    {} as any,
    aspirationModel as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    { get: jest.fn(), set: jest.fn() } as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits aspiration and returns tracking id', async () => {
    aspirationModel.create.mockResolvedValue({ _id: 'asp-1' });

    const result = await service.submitAspiration({
      name: 'Mahasiswa',
      message: 'Perbaiki fasilitas kelas',
      category: 'Fasilitas',
      isAnonymous: false,
    });

    expect(result.data.id).toBe('asp-1');
  });

  it('returns not found for unknown aspiration status', async () => {
    aspirationModel.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    await expect(service.getAspirationStatus('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
