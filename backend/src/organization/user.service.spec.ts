import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '../schemas/user.schema';
import { Role } from '../schemas/role.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { validate } from 'class-validator';

describe('UserService & DTO Validation', () => {
  let service: UserService;
  let mockUserModel: {
    findOne: jest.Mock;
    create: jest.Mock;
    find: jest.Mock;
    findById: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    updateMany: jest.Mock;
  };
  let mockRoleModel: {
    find: jest.Mock;
    findById: jest.Mock;
  };

  beforeEach(async () => {
    mockUserModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      updateMany: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
      }),
    };

    mockRoleModel = {
      find: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      }),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken('Role'),
          useValue: mockRoleModel,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  describe('CreateUserDto Validation', () => {
    it('should validate correct Unesa email domains', async () => {
      const dto = new CreateUserDto();
      dto.name = 'Test User';
      dto.email = 'test@mhs.unesa.ac.id';
      dto.nim = '21051214001';
      dto.position = 'Staf';
      dto.role = '60d0fe4f5311236168a109ca';
      dto.department = '60d0fe4f5311236168a109cb';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);

      // Staff email
      dto.email = 'lecturer@unesa.ac.id';
      const errorsStaff = await validate(dto);
      expect(errorsStaff.length).toBe(0);
    });

    it('should reject non-Unesa email domains', async () => {
      const dto = new CreateUserDto();
      dto.name = 'Test User';
      dto.email = 'test@gmail.com';
      dto.nim = '21051214001';
      dto.position = 'Staf';
      dto.role = '60d0fe4f5311236168a109ca';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('matches');
    });

    it('should validate exact 11-digit NIM and reject others', async () => {
      const dto = new CreateUserDto();
      dto.name = 'Test User';
      dto.email = 'test@mhs.unesa.ac.id';
      dto.nim = '12345'; // Too short
      dto.position = 'Staf';
      dto.role = '60d0fe4f5311236168a109ca';

      let errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);

      dto.nim = '123456789012'; // Too long
      errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);

      dto.nim = '21051214001'; // Exactly 11 digits
      errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('UserService Logic', () => {
    it('should nullify department if role scope is global', async () => {
      const dto = new CreateUserDto();
      dto.name = 'Ketua BEM';
      dto.email = 'kabem@unesa.ac.id';
      dto.position = 'Ketua BEM';
      dto.role = '60d0fe4f5311236168a109ca';
      dto.department = '60d0fe4f5311236168a109cb'; // Given a department ID

      // Mock role with global scope
      mockRoleModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: '60d0fe4f5311236168a109ca',
          scope: 'global',
        }),
      });

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null), // email not registered
      });

      mockUserModel.create.mockImplementation((data) => Promise.resolve(data));

      const result = await service.create(dto);
      expect(result.department).toBeNull(); // Should be auto-nullified
    });

    it('should throw BadRequestException if department is missing for department-scope role', async () => {
      const dto = new CreateUserDto();
      dto.name = 'Staf Divisi';
      dto.email = 'staf@mhs.unesa.ac.id';
      dto.position = 'Staf';
      dto.role = '60d0fe4f5311236168a109cc';
      dto.department = undefined; // Missing department

      mockRoleModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: '60d0fe4f5311236168a109cc',
          scope: 'department',
        }),
      });

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });
});
