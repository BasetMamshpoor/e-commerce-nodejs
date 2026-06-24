import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { CreateAddressInput, UpdateAddressInput } from "../../validations/address.validation";
import { Address } from "../../generated/prisma";

// ----------------------------------------------------------------------------
// آدرس‌های کاربر + موقعیت روی نقشه — آیتم ۱۸. پیش‌نیاز ماژول سفارش (انتخاب
// آدرس ارسال).
// ----------------------------------------------------------------------------

export async function createAddress(userId: string, input: CreateAddressInput): Promise<Address> {
  if (input.isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  } else {
    const count = await prisma.address.count({ where: { userId } });
    if (count === 0) input.isDefault = true; // اولین آدرس کاربر خودکار پیش‌فرض می‌شود
  }

  return prisma.address.create({ data: { ...input, userId } });
}

export async function updateAddress(
  userId: string,
  addressId: string,
  input: UpdateAddressInput
): Promise<Address> {
  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== userId) throw ApiError.notFound("آدرس پیدا نشد");

  if (input.isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }

  return prisma.address.update({ where: { id: addressId }, data: input });
}

export async function deleteAddress(userId: string, addressId: string): Promise<void> {
  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== userId) throw ApiError.notFound("آدرس پیدا نشد");

  const orderCount = await prisma.order.count({ where: { addressId } });
  if (orderCount > 0) {
    throw ApiError.conflict("این آدرس در سفارش‌های قبلی استفاده شده و قابل حذف نیست");
  }

  await prisma.address.delete({ where: { id: addressId } });

  if (address.isDefault) {
    const next = await prisma.address.findFirst({ where: { userId } });
    if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
  }
}

export async function listAddresses(userId: string): Promise<Address[]> {
  return prisma.address.findMany({ where: { userId }, orderBy: { isDefault: "desc" } });
}

export async function getOwnedAddress(userId: string, addressId: string): Promise<Address> {
  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== userId) throw ApiError.notFound("آدرس پیدا نشد");
  return address;
}
