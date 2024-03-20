-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "type" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "barcode" TEXT,
    "sku" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "groupId" INTEGER NOT NULL,
    "group" TEXT NOT NULL,
    "mainCategoryId" INTEGER NOT NULL,
    "mainCategory" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "priceInView" DOUBLE PRECISION NOT NULL,
    "priceOnTerm" DOUBLE PRECISION NOT NULL,
    "highlight" BOOLEAN NOT NULL,
    "fractioned" BOOLEAN NOT NULL,
    "packageQuantity" INTEGER NOT NULL,
    "itemUnit" TEXT,
    "imageId" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "currentStock" INTEGER NOT NULL,
    "entryForecast" INTEGER NOT NULL,
    "exitForecast" INTEGER NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);
