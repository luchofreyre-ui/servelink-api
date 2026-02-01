"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingController = void 0;
const common_1 = require("@nestjs/common");
let PricingController = class PricingController {
    getCleaningPricing() {
        return {
            hourly_rate_cents: 6500,
            billing_increment_minutes: 15,
            late_grace_minutes: 120,
            exclusions: [
                "biohazards",
                "mold",
                "construction_debris",
                "hoarding",
                "exterior_windows",
                "heavy_furniture"
            ]
        };
    }
};
exports.PricingController = PricingController;
__decorate([
    (0, common_1.Get)("/cleaning"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "getCleaningPricing", null);
exports.PricingController = PricingController = __decorate([
    (0, common_1.Controller)("/api/v1/pricing")
], PricingController);
