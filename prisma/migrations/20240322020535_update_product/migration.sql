/*
  Warnings:

  - Changed the type of `highlight` on the `products` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `fractioned` on the `products` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "highlight",
ADD COLUMN     "highlight" INTEGER NOT NULL,
DROP COLUMN "fractioned",
ADD COLUMN     "fractioned" INTEGER NOT NULL;
