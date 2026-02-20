-- CreateIndex
CREATE INDEX "DisputeCase_stripePaymentIntentId_idx" ON "DisputeCase"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "DisputeCase_stripeChargeId_idx" ON "DisputeCase"("stripeChargeId");

-- CreateIndex
CREATE INDEX "JournalEntry_bookingId_type_createdAt_idx" ON "JournalEntry"("bookingId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "JournalEntry_foId_type_createdAt_idx" ON "JournalEntry"("foId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "JournalLine_account_direction_createdAt_idx" ON "JournalLine"("account", "direction", "createdAt");

-- CreateIndex
CREATE INDEX "StripeWebhookReceipt_stripePaymentIntentId_createdAt_idx" ON "StripeWebhookReceipt"("stripePaymentIntentId", "createdAt");
