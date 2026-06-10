import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, Order, OrderItem } from '../database/schema/shop';
import {
  paginate,
  parsePaginationQuery,
} from '../common/helpers/pagination.helper';
import { randomBytes } from 'crypto';

@Injectable()
export class ShopService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(OrderItem.name) private orderItemModel: Model<OrderItem>,
  ) {}

  async listProducts(query: any) {
    return paginate(
      this.productModel,
      { status: 'active', isAvailable: true },
      parsePaginationQuery(query),
      ['name'],
    );
  }

  async getProduct(slug: string) {
    const product = await this.productModel.findOne({ slug, deletedAt: null });
    if (!product) throw new NotFoundException('Produk tidak ditemukan');
    return { data: product };
  }

  async createOrder(data: any) {
    const { items, ...orderData } = data;
    const orderCode = `BEM-${Date.now()}-${randomBytes(2).toString('hex').toUpperCase()}`;

    // Calculate total
    let totalAmount = 0;
    const orderItems: any[] = [];
    for (const item of items) {
      const product = await this.productModel.findById(item.productId);
      if (!product)
        throw new NotFoundException(`Produk ${item.productId} tidak ditemukan`);
      const price = product.price || 0;
      totalAmount += price * item.quantity;
      orderItems.push({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        priceAtOrder: price,
      });
    }

    const order = await this.orderModel.create({
      ...orderData,
      orderCode,
      totalAmount,
    });
    const itemsWithOrderId = orderItems.map((i) => ({
      ...i,
      orderId: order._id,
    }));
    await this.orderItemModel.insertMany(itemsWithOrderId);

    return {
      data: { orderCode, totalAmount, orderId: order._id },
      message: 'Pesanan berhasil dibuat',
    };
  }

  async uploadPayment(orderId: string, paymentProofUrl: string) {
    const order = await this.orderModel.findByIdAndUpdate(
      orderId,
      { $set: { paymentProofUrl, status: 'Paid' } },
      { new: true },
    );
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');
    return { data: order, message: 'Bukti pembayaran berhasil diupload' };
  }

  async getOrderByCode(code: string) {
    const order = await this.orderModel.findOne({ orderCode: code });
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');
    const items = await this.orderItemModel
      .find({ orderId: order._id })
      .populate('productId', 'name slug images');
    return { data: { order, items } };
  }

  async listOrders(query: any) {
    return paginate(this.orderModel, {}, parsePaginationQuery(query), [
      'orderCode',
      'customerName',
    ]);
  }

  async updateOrderStatus(id: string, status: string) {
    const order = await this.orderModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true },
    );
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');
    return { data: order, message: `Status pesanan diubah ke ${status}` };
  }

  async createProduct(data: any) {
    const product = await this.productModel.create(data);
    return { data: product, message: 'Produk berhasil dibuat' };
  }

  async updateProduct(id: string, data: any) {
    const product = await this.productModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: data },
      { new: true },
    );
    if (!product) throw new NotFoundException('Produk tidak ditemukan');
    return { data: product, message: 'Produk berhasil diupdate' };
  }
}
