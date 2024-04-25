-- CreateTable
CREATE TABLE "OrderQueue" (
    "id" SERIAL NOT NULL,
    "orderData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "OrderQueue_pkey" PRIMARY KEY ("id")
);
