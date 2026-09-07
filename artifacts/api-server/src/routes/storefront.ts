import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { db, businessTable, itemsTable, offersTable } from "@workspace/db";
import {
  CreateItemBody,
  CreateItemResponse,
  CreateOfferBody,
  CreateOfferResponse,
  DeleteItemParams,
  DeleteOfferParams,
  GetBusinessResponse,
  GetDashboardSummaryResponse,
  GetPublicStorefrontResponse,
  ListItemsResponse,
  ListOffersResponse,
  UpdateBusinessBody,
  UpdateBusinessResponse,
  UpdateItemBody,
  UpdateItemParams,
  UpdateItemResponse,
  UpdateOfferBody,
  UpdateOfferParams,
  UpdateOfferResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const demoBusiness = {
  id: 1,
  name: "Saffron & Sage",
  description: "Small-batch food, warm cups, and good things to take home.",
  phone: "+91 98765 43210",
  location: "12 Market Lane, Indiranagar",
  hours: "Mon–Sun · 8:00 AM–9:30 PM",
  slug: "saffron-and-sage",
  logoUrl: null,
  coverImageUrl:
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=80",
};

async function ensureDemoData(): Promise<void> {
  const [business] = await db
    .select({ id: businessTable.id })
    .from(businessTable)
    .where(eq(businessTable.id, 1));

  if (business) return;

  const [created] = await db
    .insert(businessTable)
    .values(demoBusiness)
    .onConflictDoNothing({ target: businessTable.id })
    .returning({ id: businessTable.id });

  if (!created) return;

  await db.insert(itemsTable).values([
    {
      name: "Cardamom Latte",
      description: "Espresso, steamed milk, cardamom, and a little jaggery.",
      price: "180",
      category: "Drinks",
      imageUrl:
        "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=900&q=80",
      isAvailable: true,
      sortOrder: 1,
    },
    {
      name: "Saffron Bun",
      description: "Soft, golden, and baked fresh every morning.",
      price: "120",
      category: "Fresh bakes",
      imageUrl:
        "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80",
      isAvailable: true,
      sortOrder: 2,
    },
    {
      name: "Weekend Brunch Box",
      description: "A generous box for two with seasonal favourites.",
      price: "650",
      category: "Boxes",
      imageUrl:
        "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=80",
      isAvailable: true,
      sortOrder: 3,
    },
  ]);
  await db.insert(offersTable).values({
    title: "10% off your first order",
    description: "Show this offer at the counter or use it when you call ahead.",
    code: "WELCOME10",
    validUntil: null,
    isActive: true,
  });
}

function serializeBusiness(business: typeof businessTable.$inferSelect) {
  return {
    id: business.id,
    name: business.name,
    description: business.description,
    phone: business.phone,
    location: business.location,
    hours: business.hours,
    slug: business.slug,
    logoUrl: business.logoUrl,
    coverImageUrl: business.coverImageUrl,
    updatedAt: business.updatedAt.toISOString(),
  };
}

function serializeItem(item: typeof itemsTable.$inferSelect) {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: Number(item.price),
    category: item.category,
    imageUrl: item.imageUrl,
    isAvailable: item.isAvailable,
    sortOrder: item.sortOrder,
  };
}

function serializeOffer(offer: typeof offersTable.$inferSelect) {
  return {
    id: offer.id,
    title: offer.title,
    description: offer.description,
    code: offer.code,
    validUntil: offer.validUntil,
    isActive: offer.isActive,
  };
}

function formatDateInput(value: Date | string | null | undefined) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value;
}

async function getBusiness() {
  await ensureDemoData();
  const [business] = await db.select().from(businessTable).where(eq(businessTable.id, 1));
  if (!business) throw new Error("Business profile not found");
  return business;
}

router.get("/business", async (_req, res): Promise<void> => {
  const business = await getBusiness();
  res.json(GetBusinessResponse.parse(serializeBusiness(business)));
});

router.patch("/business", async (req, res): Promise<void> => {
  const parsed = UpdateBusinessBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await getBusiness();
  const [business] = await db
    .update(businessTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(businessTable.id, 1))
    .returning();

  res.json(UpdateBusinessResponse.parse(serializeBusiness(business)));
});

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const business = await getBusiness();
  const [items, offers] = await Promise.all([
    db.select({ id: itemsTable.id }).from(itemsTable),
    db.select({ id: offersTable.id }).from(offersTable),
  ]);
  res.json(
    GetDashboardSummaryResponse.parse({
      itemCount: items.length,
      offerCount: offers.length,
      profileComplete: Boolean(
        business.name && business.description && business.phone && business.location && business.hours,
      ),
      publicUrl: "/store",
      qrScans: 128,
    }),
  );
});

router.get("/items", async (_req, res): Promise<void> => {
  await getBusiness();
  const items = await db.select().from(itemsTable).orderBy(asc(itemsTable.sortOrder), asc(itemsTable.id));
  res.json(ListItemsResponse.parse(items.map(serializeItem)));
});

router.post("/items", async (req, res): Promise<void> => {
  const parsed = CreateItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await getBusiness();
  const [item] = await db.insert(itemsTable).values({
    ...parsed.data,
    price: String(parsed.data.price),
  }).returning();
  res.status(201).json(CreateItemResponse.parse(serializeItem(item)));
});

router.patch("/items/:id", async (req, res): Promise<void> => {
  const params = UpdateItemParams.safeParse(req.params);
  const parsed = UpdateItemBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid item update" });
    return;
  }
  const { price, ...itemData } = parsed.data;
  const [item] = await db.update(itemsTable).set({
    ...itemData,
    ...(price === undefined ? {} : { price: String(price) }),
    updatedAt: new Date(),
  }).where(eq(itemsTable.id, params.data.id)).returning();
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  res.json(UpdateItemResponse.parse(serializeItem(item)));
});

router.delete("/items/:id", async (req, res): Promise<void> => {
  const params = DeleteItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [item] = await db.delete(itemsTable).where(eq(itemsTable.id, params.data.id)).returning();
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/offers", async (_req, res): Promise<void> => {
  await getBusiness();
  const offers = await db.select().from(offersTable).orderBy(asc(offersTable.id));
  res.json(ListOffersResponse.parse(offers.map(serializeOffer)));
});

router.post("/offers", async (req, res): Promise<void> => {
  const parsed = CreateOfferBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await getBusiness();
  const { validUntil, ...offerData } = parsed.data;
  const [offer] = await db.insert(offersTable).values({
    ...offerData,
    validUntil: formatDateInput(validUntil),
  }).returning();
  res.status(201).json(CreateOfferResponse.parse(serializeOffer(offer)));
});

router.patch("/offers/:id", async (req, res): Promise<void> => {
  const params = UpdateOfferParams.safeParse(req.params);
  const parsed = UpdateOfferBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid offer update" });
    return;
  }
  const { validUntil, ...offerData } = parsed.data;
  const [offer] = await db.update(offersTable).set({
    ...offerData,
    ...(validUntil === undefined ? {} : { validUntil: formatDateInput(validUntil) }),
    updatedAt: new Date(),
  }).where(eq(offersTable.id, params.data.id)).returning();
  if (!offer) {
    res.status(404).json({ error: "Offer not found" });
    return;
  }
  res.json(UpdateOfferResponse.parse(serializeOffer(offer)));
});

router.delete("/offers/:id", async (req, res): Promise<void> => {
  const params = DeleteOfferParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [offer] = await db.delete(offersTable).where(eq(offersTable.id, params.data.id)).returning();
  if (!offer) {
    res.status(404).json({ error: "Offer not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/public/storefront", async (_req, res): Promise<void> => {
  const business = await getBusiness();
  const [items, offers] = await Promise.all([
    db.select().from(itemsTable).where(eq(itemsTable.isAvailable, true)).orderBy(asc(itemsTable.sortOrder)),
    db.select().from(offersTable).where(eq(offersTable.isActive, true)).orderBy(asc(offersTable.id)),
  ]);
  res.json(
    GetPublicStorefrontResponse.parse({
      business: serializeBusiness(business),
      items: items.map(serializeItem),
      offers: offers.map(serializeOffer),
    }),
  );
});

export default router;