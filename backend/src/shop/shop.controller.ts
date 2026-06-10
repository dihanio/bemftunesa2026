import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/auth.decorator';
import { ShopService } from './shop.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreateOrderSchema, CreateProductSchema } from './shop.dto';
import { PaginationQuerySwagger } from '../common/dto/pagination.dto';

@ApiTags('Shop')
@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  // --- Public ---

  @Get('products')
  @ApiOperation({ summary: 'List produk' })
  @ApiQuery({ type: PaginationQuerySwagger })
  async listProducts(@Query() query: any) {
    return this.shopService.listProducts(query);
  }

  @Get('products/:slug')
  @ApiOperation({ summary: 'Detail produk' })
  async getProduct(@Param('slug') slug: string) {
    return this.shopService.getProduct(slug);
  }

  @Post('orders')
  @ApiOperation({ summary: 'Create order (guest checkout)' })
  @UsePipes(new ZodValidationPipe(CreateOrderSchema))
  async createOrder(@Body() body: any) {
    return this.shopService.createOrder(body);
  }

  @Post('orders/:id/payment')
  @ApiOperation({ summary: 'Upload bukti bayar' })
  async uploadPayment(
    @Param('id') id: string,
    @Body() body: { paymentProofUrl: string },
  ) {
    return this.shopService.uploadPayment(id, body.paymentProofUrl);
  }

  @Get('orders/:code')
  @ApiOperation({ summary: 'Cek status pesanan' })
  async getOrder(@Param('code') code: string) {
    return this.shopService.getOrderByCode(code);
  }

  // --- Admin (IMS) ---

  @Get('admin/orders')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'List orders (admin)' })
  @ApiQuery({ type: PaginationQuerySwagger })
  async listOrders(@Query() query: any) {
    return this.shopService.listOrders(query);
  }

  @Patch('admin/orders/:id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Update order status' })
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.shopService.updateOrderStatus(id, body.status);
  }

  @Post('admin/products')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Create product' })
  @UsePipes(new ZodValidationPipe(CreateProductSchema))
  async createProduct(@Body() body: any) {
    return this.shopService.createProduct(body);
  }

  @Put('admin/products/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Update product' })
  async updateProduct(@Param('id') id: string, @Body() body: any) {
    return this.shopService.updateProduct(id, body);
  }
}
