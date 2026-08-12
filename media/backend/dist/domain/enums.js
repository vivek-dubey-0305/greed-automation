export var CampaignStatus;
(function (CampaignStatus) {
    CampaignStatus["DRAFT"] = "DRAFT";
    CampaignStatus["READY"] = "READY";
    CampaignStatus["ANALYZING"] = "ANALYZING";
    CampaignStatus["GENERATING"] = "GENERATING";
    CampaignStatus["AWAITING_APPROVAL"] = "AWAITING_APPROVAL";
    CampaignStatus["APPROVED"] = "APPROVED";
    CampaignStatus["PUBLISHING"] = "PUBLISHING";
    CampaignStatus["COMPLETED"] = "COMPLETED";
    CampaignStatus["PARTIALLY_COMPLETED"] = "PARTIALLY_COMPLETED";
    CampaignStatus["FAILED"] = "FAILED";
})(CampaignStatus || (CampaignStatus = {}));
export var PlatformPostStatus;
(function (PlatformPostStatus) {
    PlatformPostStatus["PENDING"] = "PENDING";
    PlatformPostStatus["GENERATING"] = "GENERATING";
    PlatformPostStatus["AWAITING_APPROVAL"] = "AWAITING_APPROVAL";
    PlatformPostStatus["APPROVED"] = "APPROVED";
    PlatformPostStatus["PUBLISHING"] = "PUBLISHING";
    PlatformPostStatus["PUBLISHED"] = "PUBLISHED";
    PlatformPostStatus["FAILED"] = "FAILED";
})(PlatformPostStatus || (PlatformPostStatus = {}));
export var AutomationStatus;
(function (AutomationStatus) {
    AutomationStatus["PENDING"] = "PENDING";
    AutomationStatus["PROCESSING"] = "PROCESSING";
    AutomationStatus["COMPLETED"] = "COMPLETED";
    AutomationStatus["FAILED"] = "FAILED";
})(AutomationStatus || (AutomationStatus = {}));
export var PublishAttemptStatus;
(function (PublishAttemptStatus) {
    PublishAttemptStatus["PENDING"] = "PENDING";
    PublishAttemptStatus["SUCCESS"] = "SUCCESS";
    PublishAttemptStatus["FAILED"] = "FAILED";
})(PublishAttemptStatus || (PublishAttemptStatus = {}));
export var Platform;
(function (Platform) {
    Platform["INSTAGRAM"] = "INSTAGRAM";
    Platform["FACEBOOK"] = "FACEBOOK";
    Platform["LINKEDIN"] = "LINKEDIN";
    Platform["X"] = "X";
    Platform["YOUTUBE"] = "YOUTUBE";
})(Platform || (Platform = {}));
