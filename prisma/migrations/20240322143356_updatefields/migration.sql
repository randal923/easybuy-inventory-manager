-- AlterTable
ALTER TABLE "products" ALTER COLUMN "type" DROP NOT NULL,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "manufacturer" DROP NOT NULL,
ALTER COLUMN "groupId" DROP NOT NULL,
ALTER COLUMN "group" DROP NOT NULL,
ALTER COLUMN "imageId" DROP NOT NULL,
ALTER COLUMN "imageUrl" DROP NOT NULL,
ALTER COLUMN "entryForecast" DROP NOT NULL,
ALTER COLUMN "exitForecast" DROP NOT NULL,
ALTER COLUMN "highlight" DROP NOT NULL,
ALTER COLUMN "fractioned" DROP NOT NULL;
