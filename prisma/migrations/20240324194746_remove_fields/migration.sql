/*
  Warnings:

  - You are about to drop the column `barcode` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `entryForecast` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `exitForecast` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `fractioned` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `group` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `groupId` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `highlight` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `imageId` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `itemUnit` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `mainCategory` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `mainCategoryId` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `manufacturer` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `priceInView` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `priceOnTerm` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "barcode",
DROP COLUMN "description",
DROP COLUMN "entryForecast",
DROP COLUMN "exitForecast",
DROP COLUMN "fractioned",
DROP COLUMN "group",
DROP COLUMN "groupId",
DROP COLUMN "highlight",
DROP COLUMN "imageId",
DROP COLUMN "imageUrl",
DROP COLUMN "itemUnit",
DROP COLUMN "mainCategory",
DROP COLUMN "mainCategoryId",
DROP COLUMN "manufacturer",
DROP COLUMN "priceInView",
DROP COLUMN "priceOnTerm",
DROP COLUMN "type",
DROP COLUMN "unit",
ADD COLUMN     "fractionedQuantity" INTEGER;
