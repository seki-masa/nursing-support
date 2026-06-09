/*
  Warnings:

  - Made the column `emergencyContactName` on table `CareRecipient` required. This step will fail if there are existing NULL values in that column.
  - Made the column `emergencyContactPhone` on table `CareRecipient` required. This step will fail if there are existing NULL values in that column.
  - Made the column `emergencyContactRelationship` on table `CareRecipient` required. This step will fail if there are existing NULL values in that column.
  - Made the column `emergencyContactAddress` on table `CareRecipient` required. This step will fail if there are existing NULL values in that column.
  - Made the column `emergencyContactEmail` on table `CareRecipient` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "CareRecipient" ALTER COLUMN "emergencyContactName" SET NOT NULL,
ALTER COLUMN "emergencyContactPhone" SET NOT NULL,
ALTER COLUMN "emergencyContactRelationship" SET NOT NULL,
ALTER COLUMN "emergencyContactAddress" SET NOT NULL,
ALTER COLUMN "emergencyContactEmail" SET NOT NULL;
