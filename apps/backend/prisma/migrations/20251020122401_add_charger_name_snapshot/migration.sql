-- 1) Add as NULLable
ALTER TABLE "ChargingSession"
ADD COLUMN "chargerNameSnapshot" TEXT;

-- 2) Backfill from Charger.name
UPDATE "ChargingSession" s
SET "chargerNameSnapshot" = c."name"
FROM "Charger" c
WHERE s."chargerId" = c."id" AND s."chargerNameSnapshot" IS NULL;

-- 3) Enforce NOT NULL after backfill
ALTER TABLE "ChargingSession"
ALTER COLUMN "chargerNameSnapshot" SET NOT NULL;
