-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "zalo" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "Customer_zalo_idx" ON "Customer"("zalo");
