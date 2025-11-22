import express from "express";
import { 
    addRemark, 
    getApplicationWithRemarks, 
    createOrUpdateOffer, 
    respondToOffer, 
    hodApproveOffer,      // <-- NEW
    cooApproveOffer,      
    getPendingOffers,  
    submitOnboardingDocument, 
    onboardingUpload,
    listOnboardingCandidates, // <-- NEW
    reviewOnboardingDocument, // <-- NEW
    completeOnboarding,        // <-- NEW   
    getMyApplicationDetails,
    submitEmploymentForm,       // <-- NEW
    downloadEmploymentFormPdf,
    previewEmploymentFormPdf
} from "../controllers/ApplicationController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/:appId/remarks", verifyToken, addRemark);
router.get("/:appId/with-remarks", verifyToken, getApplicationWithRemarks);

router.post("/:appId/offer", verifyToken, createOrUpdateOffer); 
router.patch("/:appId/offer-response", verifyToken, respondToOffer); 

router.patch("/:appId/offer/hod-approve", verifyToken, hodApproveOffer);
router.patch("/:appId/offer/coo-approve", verifyToken, cooApproveOffer);
router.get("/offers/pending-approval", verifyToken, getPendingOffers);

router.post(
    "/:appId/submit-document",
    verifyToken,
    onboardingUpload.single("document"), 
    submitOnboardingDocument
);

router.get("/onboarding/list", verifyToken, listOnboardingCandidates); 
router.patch("/:appId/review-document", verifyToken, reviewOnboardingDocument); 
router.patch("/:appId/complete-onboarding", verifyToken, completeOnboarding); 
router.get("/myOnboarding/:appId", verifyToken, getMyApplicationDetails); 

router.post("/:appId/submit-employment-form", verifyToken, submitEmploymentForm);

router.get(
  "/:appId/download-employment-form-pdf",
  verifyToken,
  downloadEmploymentFormPdf
);

router.get(
  "/:appId/preview-employment-form-pdf",
  verifyToken,
  previewEmploymentFormPdf
);

export default router;






