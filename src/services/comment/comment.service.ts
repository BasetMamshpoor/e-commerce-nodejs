import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { parsePagination, buildPaginationMeta } from "../../utils/pagination";
import { notifyUser } from "../notification/notification.service";
import {
  CreateCommentInput,
  UpdateCommentInput,
  ListCommentsQuery,
  AdminListCommentsQuery,
  ModerateCommentInput,
} from "../../validations/comment.validation";
import { Comment, CommentableType } from "../../generated/prisma";

// ----------------------------------------------------------------------------
// سیستم کامنت‌های تودرتو (nested) — آیتم ۱۴.
// از این مدل هم برای محصول و هم برای پست وبلاگ استفاده می‌شود (پلی‌مورفیک:
// commentableType + commentableId — معادل polymorphic relation در Laravel،
// چون پریزما رابطه‌ی پلی‌مورفیک بومی ندارد).
//
// دیدگاه‌های جدید با وضعیت PENDING ثبت می‌شوند و فقط بعد از تایید ادمین/ادیتور
// عمومی نمایش داده می‌شوند (ضدِ اسپم/محتوای نامناسب).
// SSR-friendly یعنی این endpoint می‌تواند مستقیم سمت سرور فرانت صدا زده شود.
// ----------------------------------------------------------------------------

export interface CommentTreeNode extends Comment {
  replies: CommentTreeNode[];
  likeCount: number;
}

async function assertCommentableExists(type: CommentableType, id: string): Promise<void> {
  if (type === "PRODUCT") {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw ApiError.notFound("محصول پیدا نشد");
  } else {
    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) throw ApiError.notFound("پست وبلاگ پیدا نشد");
  }
}

async function getDescendantCommentIds(rootIds: string[]): Promise<string[]> {
  if (rootIds.length === 0) return [];

  const all = await prisma.comment.findMany({
    where: { status: "APPROVED" },
    select: { id: true, parentId: true },
  });

  const result = [...rootIds];
  let frontier = rootIds;

  while (frontier.length > 0) {
    const children = all
      .filter((c) => c.parentId && frontier.includes(c.parentId))
      .map((c) => c.id);
    result.push(...children);
    frontier = children;
  }

  return result;
}

function buildTree(
  all: (Comment & { _count: { likes: number } })[],
  parentId: string | null
): CommentTreeNode[] {
  return all
    .filter((c) => c.parentId === parentId)
    .map((c) => ({ ...c, likeCount: c._count.likes, replies: buildTree(all, c.id) }));
}

export async function createComment(
  userId: string,
  commentableType: CommentableType,
  commentableId: string,
  input: CreateCommentInput
): Promise<Comment> {
  await assertCommentableExists(commentableType, commentableId);

  if (input.parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: input.parentId } });
    if (
      !parent ||
      parent.commentableType !== commentableType ||
      parent.commentableId !== commentableId
    ) {
      throw ApiError.badRequest("دیدگاه والد پیدا نشد");
    }
  }

  return prisma.comment.create({
    data: {
      commentableType,
      commentableId,
      userId,
      parentId: input.parentId,
      content: input.content,
      rating: input.rating,
      status: "PENDING",
      attachments: { create: input.attachmentMediaIds.map((mediaId) => ({ mediaId })) },
    },
  });
}

export async function updateComment(
  userId: string,
  commentId: string,
  input: UpdateCommentInput
): Promise<Comment> {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment || comment.userId !== userId) throw ApiError.notFound("دیدگاه پیدا نشد");

  // ویرایش، دیدگاه را دوباره به بررسی می‌فرستد (جلوگیری از تغییر محتوا بعد از تایید)
  return prisma.comment.update({
    where: { id: commentId },
    data: { content: input.content, status: "PENDING" },
  });
}

export async function deleteComment(userId: string, commentId: string, isStaff: boolean): Promise<void> {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw ApiError.notFound("دیدگاه پیدا نشد");
  if (!isStaff && comment.userId !== userId) throw ApiError.notFound("دیدگاه پیدا نشد");

  const replyCount = await prisma.comment.count({ where: { parentId: commentId } });
  if (replyCount > 0) {
    throw ApiError.conflict("این دیدگاه پاسخ دارد و قابل حذف نیست");
  }

  await prisma.comment.delete({ where: { id: commentId } });
}

export async function toggleLike(userId: string, commentId: string): Promise<{ liked: boolean }> {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw ApiError.notFound("دیدگاه پیدا نشد");

  const existing = await prisma.commentLike.findUnique({
    where: { commentId_userId: { commentId, userId } },
  });

  if (existing) {
    await prisma.commentLike.delete({ where: { id: existing.id } });
    return { liked: false };
  }

  await prisma.commentLike.create({ data: { commentId, userId } });
  return { liked: true };
}

export async function listApprovedComments(
  commentableType: CommentableType,
  commentableId: string,
  query: ListCommentsQuery
) {
  const pagination = parsePagination({ page: query.page, limit: query.limit });

  const topLevelWhere = { commentableType, commentableId, parentId: null, status: "APPROVED" as const };

  const [topLevel, total, ratingAgg] = await Promise.all([
    prisma.comment.findMany({
      where: topLevelWhere,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
      select: { id: true },
    }),
    prisma.comment.count({ where: topLevelWhere }),
    prisma.comment.aggregate({
      where: { commentableType, commentableId, parentId: null, status: "APPROVED", rating: { not: null } },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  const rootIds = topLevel.map((c) => c.id);
  const allIds = await getDescendantCommentIds(rootIds);

  const all = (await prisma.comment.findMany({
    where: { id: { in: allIds }, status: "APPROVED" },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { likes: true } } },
  })) as unknown as (Comment & { _count: { likes: number } })[];

  const tree = rootIds
    .map((id) => buildTree(all, null).find((c) => c.id === id))
    .filter((c): c is CommentTreeNode => Boolean(c));

  return {
    items: tree,
    meta: buildPaginationMeta(total, pagination),
    ratingSummary: {
      average: ratingAgg._avg.rating ?? 0,
      count: ratingAgg._count?.rating ?? 0,
    },
  };
}

// ----------------------------------------------------------------------------
// مدیریت/بررسی ادمین — چون پلی‌مورفیک است، عنوان محصول/پست را جدا resolve
// می‌کنیم (نه با include مستقیم چون رابطه‌ی Prisma واقعی وجود ندارد)
// ----------------------------------------------------------------------------

export async function listCommentsAdmin(query: AdminListCommentsQuery) {
  const pagination = parsePagination({ page: query.page, limit: query.limit });
  const where = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.commentableType ? { commentableType: query.commentableType } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
      include: { user: { select: { id: true, fullName: true } } },
    }),
    prisma.comment.count({ where }),
  ]);

  const productIds = items
    .filter((c) => c.commentableType === "PRODUCT")
    .map((c) => c.commentableId);
  const postIds = items
    .filter((c) => c.commentableType === "BLOG_POST")
    .map((c) => c.commentableId);

  const [products, posts] = await Promise.all([
    productIds.length
      ? prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, slug: true } })
      : Promise.resolve([]),
    postIds.length
      ? prisma.blogPost.findMany({ where: { id: { in: postIds } }, select: { id: true, title: true, slug: true } })
      : Promise.resolve([]),
  ]);

  const productMap = new Map(products.map((p) => [p.id, p]));
  const postMap = new Map(posts.map((p) => [p.id, p]));

  const enriched = items.map((c) => ({
    ...c,
    entity:
      c.commentableType === "PRODUCT"
        ? productMap.get(c.commentableId) ?? null
        : postMap.get(c.commentableId) ?? null,
  }));

  return { items: enriched, meta: buildPaginationMeta(total, pagination) };
}

export async function moderateComment(
  commentId: string,
  input: ModerateCommentInput
): Promise<Comment> {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw ApiError.notFound("دیدگاه پیدا نشد");

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { status: input.status },
  });

  if (input.status === "APPROVED" && comment.parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: comment.parentId } });
    if (parent) {
      notifyUser({
        userId: parent.userId,
        type: "COMMENT",
        title: "پاسخ جدید به دیدگاه شما",
        message: comment.content.slice(0, 200),
      }).catch(() => undefined);
    }
  }

  return updated;
}
