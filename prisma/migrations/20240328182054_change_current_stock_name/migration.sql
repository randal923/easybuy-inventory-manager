/*
  Warnings:

  - You are about to drop the column `currentStock` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "currentStock",
ADD COLUMN     "boaGestaoCurrentStock" INTEGER;
