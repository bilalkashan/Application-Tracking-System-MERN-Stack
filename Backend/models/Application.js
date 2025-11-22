import mongoose from "mongoose";

const approvalSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  comments: String,
  reviewedAt: Date,
}, { _id: false });

const offerSchema = new mongoose.Schema({
    designation: { type: String, required: true },
    grade: { type: String },
    department: { type: String, required: true },
    location: { type: String, required: true },
    offeredSalary: { type: Number, required: true },
    vehicleEntitlement: { type: String, default: 'N/A' },
    systemRequirement: { type: String, default: 'N/A' },
    mobileAllowance: { type: String, default: 'N/A' }, 
    fuelAllowance: { type: Number, default: 0 },
    
    // --- For the internal approval flow ---
    approvalStatus: {
        type: String,
        enum: ['pending_hod', 'pending_coo', 'approved', 'rejected'],
        default: 'pending_hod'
    },
    hodApproval: { type: approvalSchema, default: () => ({}) },
    cooApproval: { type: approvalSchema, default: () => ({}) },
    
    // For the user's final response
    status: { 
        type: String, 
        enum: ['pending', 'accepted', 'rejected'], 
        default: 'pending' 
    },
    userComment: { type: String },
    respondedAt: { type: Date },

    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    sentAt: { type: Date, default: Date.now }
}, { _id: false }); 

const messageSchema = new mongoose.Schema(
  { 
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
},
{ _id: false }
);

const interviewEvaluationSchema = new mongoose.Schema(
  { 
    competency: {
      type: String,
      required: true,
    },
    guidelines: String,
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
},
{ _id: false }
);

const remarkSchema = new mongoose.Schema(
  { 
    interviewer: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    interviewType: {
      type: String,
      enum: ["first-interview", "second-interview"],
      default: "first-interview",
    },
    role: {
      type: String,
      enum: ["interviewer", "recruiter"],
      default: "interviewer",
    },

    evaluations: [interviewEvaluationSchema], 
    keyStrengths: String,
    areasForImprovement: String,
    motivationCareerAspiration: String,
    expectedCompensation: String,
    availabilityNoticePeriod: String,
    overallAverageScore: Number,
    generalImpression: {
      type: String,
      enum: ["Excellent", "Good", "Average", "Below Average", "Poor"],
    },
    recommendation: {
      type: String,
      enum: [
        "Strongly Recommend",
        "Recommend",
        "Consider with Reservations",
        "Not Suitable",
      ],
    },

    comment: String, 
    createdAt: { type: Date, default: Date.now },
},
{ _id: true }
);

const onboardingDocSchema = new mongoose.Schema({
  documentType: { type: String, required: true },
  filePath: { type: String, required: true },
  fileName: { type: String },
  uploadedAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  rejectionComment: { type: String },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  reviewedAt: { type: Date }
}, { _id: false });

const employmentFormSchema = new mongoose.Schema({
    appliedForPost: String, 

    fullName: String, 
    fatherName: String, 
    dob: Date, 
    placeOfBirth: String, 
    age: Number, 
    fatherOccupation: String, 
    cnic: String, 
    cnicIssueDate: Date, 
    cnicExpiryDate: Date, // Part of [cite: 19]
    drivingLicense: String, // [cite: 17]
    licenseIssueDate: Date, // Part of [cite: 24]
    licenseExpiryDate: Date, // Part of [cite: 24]
    currentAddress: String, // [cite: 20]
    currentPhone: String, // [cite: 25]
    permanentAddress: String, // [cite: 21]
    permanentPhone: String, // [cite: 27]
    mobile: String, // [cite: 26]
    email: String, // [cite: 28]
    maritalStatus: String, // [cite: 23] (e.g., Single, Married, Divorced, Widowed)
    children: Number, // [cite: 30]
    nextOfKinName: String, // Part of [cite: 31]
    nextOfKinRelationship: String, // Part of [cite: 31]
    nextOfKinAddress: String, // Part of [cite: 32]
    nextOfKinContact: String, // Part of [cite: 32]
    motherTongue: String, // [cite: 33]
    otherLanguages: String, // [cite: 34] (Comma-separated string or array)
    hasDisabilityOrIllness: Boolean, // Derived from [cite: 35]
    disabilityOrIllnessDetails: String, // Details if yes [cite: 35]
    bloodGroup: String, // [cite: 36]
    involvedInCriminalActivity: Boolean, // Derived from [cite: 37]
    criminalActivityDetails: String, // Details if yes [cite: 37]
    emergencyContactName: String, // [cite: 38]
    emergencyContactAddress: String, // [cite: 39]
    emergencyContactPhone: String, // [cite: 41]
    politicalAffiliationParty: String, // [cite: 22]
    politicalAffiliationRank: String, // [cite: 29]
    sourceOfVacancy: String, // [cite: 8, 11] (Newspaper, Website, Friend, Employee Ref, Social Media, Consultant, Other)
    sourceDetails: String, // Specify which one, e.g., Newspaper name, Friend name [cite: 9]
    currentSalary: Number, // [cite: 10]
    expectedSalary: Number, // [cite: 12]

    education: [{
        institution: String,
        tenureYears: String, // Kept as String to allow ranges like '2-3'
        degree: String,
        subject: String,
        completionYear: Number,
        grade: String,
        _id: false // prevent _id generation for subdocuments in array
    }],
    coCurricularAchievements: String, // [cite: 49]

    trainings: [{
        course: String,
        institution: String,
        qualification: String,
        datePeriod: String, // e.g., "Jan 2023 - Mar 2023" or "2 Weeks"
        _id: false
    }],

    selfEmployedDetails: String, // Nature and Tenure

    employmentHistory: [{
        organization: String,
        natureOfBusiness: String,
        address: String,
        managerName: String, // Boss / Manager
        phone: String,
        startingPosition: String,
        lastPosition: String,
        dateJoined: String, // MM/YYYY
        dateLeft: String, // MM/YYYY
        totalDuration: String,
        startingSalary: Number,
        lastSalary: Number,
        reasonForLeaving: String,
        _id: false
    }],

    // Allow multiple entries - maybe store as a single string with newlines, or an array
    keyRolesAndAchievements: String, // Or use [String] if structured input needed

    benefits: {
        vehicleProvided: Boolean, // Combined Car/Motorcycle [cite: 86]
        vehicleType: String, // Specific type if yes [cite: 86]
        vehicleDetails: String, // Brand and CC [cite: 78]
        buyBackOption: Boolean, // [cite: 79]
        bonus: Boolean, // [cite: 82]
        bonusDetails: String, // Number of bonuses [cite: 89]
        bonusBasedOn: String, // Basic / Gross [cite: 90]
        lfa: Boolean, // Leave Fare Assistance [cite: 91]
        lfaBasedOn: String, // Basic / Gross [cite: 92]
        gratuity: Boolean, // [cite: 102]
        gratuityBasedOn: String, // Basic / Gross [cite: 104]
        providentFund: Boolean, // [cite: 105]
        providentFundStartDate: String, // [cite: 114]
        healthInsurance: Boolean, // [cite: 116]
        opd: Boolean, // [cite: 118]
        opdMonthlyAmount: Number, // [cite: 138]
        fuelEntitlement: Boolean, // [cite: 120]
        fuelLimitPerMonth: String, // Could be Liters or Amount [cite: 140]
        cellEntitlement: Boolean, // [cite: 122]
        cellLimitPerMonth: String, // Allow numbers or text like "Actual" [cite: 142]
        salesIncentive: Boolean, // [cite: 124]
        salesIncentiveMonthlyAverage: Number, // [cite: 144]
        additionalBenefits: String, // [cite: 145]
    },

    // Relatives & References (Section G & H)
    bloodRelativesInCompany: [{ 
        name: String,
        designation: String,
        company: String,
        location: String,
        relationship: String,
        _id: false
    }],
    appliedBefore: Boolean, // Derived from [cite: 152]
    appliedBeforeDetails: String, // Details if yes [cite: 152]
    relativeOrFriendInCompany: String, // Name if any [cite: 153]
    otherMeansOfSubsistence: Boolean, // Derived from [cite: 154]
    otherMeansOfSubsistenceDetails: String, // Details if yes [cite: 154]
    noticePeriod: String, // [cite: 155]

    references: [{ // [cite: 156, 159]
        name: String,
        occupation: String, // Occupation/ Designation
        address: String,
        phone: String,
        _id: false
    }],
    canSubmitReferenceUndertakings: Boolean, // [cite: 160] (Yes/No)
    additionalInfoSheetAttached: Boolean, // Indication if separate sheet mentioned in [cite: 162] was conceptually provided

    // Declaration [cite: 163-167]
    declarationAccepted: Boolean,
    submissionDate: { type: Date, default: Date.now }, // [cite: 168]

}, { _id: false });

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    applicantProfile: { type: mongoose.Schema.Types.ObjectId, ref: "Profile" },
    resumePath: String,

    source: {
    type: String,
    trim: true,
    default: 'Unknown' // Good to have a default
  },

    matchingScore: { type: Number, default: 0 },

    currentStatus: {
      code: {
        type: String,
        enum: [
          "applied",
          "shortlisted",
          "first-interview",
          "rejected",
          "second-interview",
          "offer", 
          "offer-accepted",
          "offer-rejected",
          "medical",
          "onboarding",
          "hired",
        "onboarding-complete" 
        ],
        default: "applied",
      },
      by: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
      note: String,
      at: { type: Date, default: Date.now },
    },

    history: [
      {
        code: String,
        by: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
        note: String,
        at: { type: Date, default: Date.now },
      },
    ],

    offer: { type: offerSchema },

    onboardingDocuments: [onboardingDocSchema],
    employmentFormData: { type: employmentFormSchema }, 

    messages: [messageSchema],
    remarks: [remarkSchema],
    interviewSchedule: { 
      stage: String,
      date: Date 
    },
},
{ timestamps: true }
);

export default mongoose.models.Application || mongoose.model("Application", applicationSchema);
