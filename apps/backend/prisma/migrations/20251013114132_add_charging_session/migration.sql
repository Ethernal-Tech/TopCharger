-- CreateEnum
CREATE TYPE "ChargingStatus" AS ENUM ('PENDING', 'ACTIVE', 'STOPPED', 'SETTLED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Charger" ADD COLUMN     "powerKw" DOUBLE PRECISION NOT NULL DEFAULT 22;

-- CreateTable
CREATE TABLE "ChargingSession" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "chargerId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "status" "ChargingStatus" NOT NULL DEFAULT 'PENDING',
    "pricePerKwhSnapshot" DOUBLE PRECISION NOT NULL,
    "powerKwSnapshot" DOUBLE PRECISION NOT NULL,
    "connectorSnapshot" "ConnectorType" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stoppedAt" TIMESTAMP(3),
    "energyKwh" DOUBLE PRECISION,
    "costTotal" DOUBLE PRECISION,
    "startTxSig" TEXT,
    "stopTxSig" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChargingSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChargingSession_driverId_status_idx" ON "ChargingSession"("driverId", "status");

-- CreateIndex
CREATE INDEX "ChargingSession_chargerId_status_idx" ON "ChargingSession"("chargerId", "status");

-- CreateIndex
CREATE INDEX "ChargingSession_hostId_status_idx" ON "ChargingSession"("hostId", "status");

-- CreateIndex
CREATE INDEX "Charger_hostId_idx" ON "Charger"("hostId");

-- AddForeignKey
ALTER TABLE "ChargingSession" ADD CONSTRAINT "ChargingSession_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "DriverProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChargingSession" ADD CONSTRAINT "ChargingSession_chargerId_fkey" FOREIGN KEY ("chargerId") REFERENCES "Charger"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChargingSession" ADD CONSTRAINT "ChargingSession_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "HostProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
