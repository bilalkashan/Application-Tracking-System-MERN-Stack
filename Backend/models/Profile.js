// backend/models/Profile.js
import mongoose from "mongoose";

const ProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, unique: true },

  // Profile Picture (web-accessible path, e.g. /uploads/profilePictures/xyz.jpg)
  profilePicture: { type: String },

  // Step 1 – Personal Info
  name: { type: String },
  fathersName: { type: String },
  gender: { type: String, enum: ["Male", "Female", "Other"] },
  dob: Date,
  placeOfBirth: { type: String },
  nationality: { type: String },
  cnicNumber: { type: String },
  cnicIssueDate: Date,
  cnicExpiryDate: Date,
  passportNumber: String,
  passportIssueDate: Date,
  passportExpiryDate: Date,
  maritalStatus: String,
  currentAddress:  { type: String },
  permanentAddress: { type: String },
  contactNumber:  { type: String },
  alternateContact: String,
  emergencyContact: {
    emergencyContactName:  { type: String },
    relation:  { type: String },
    number:  { type: String },
  },

  // Step 2 – Internal Applicant Details
  employeeId: String,
  designation: String,
  department: String,
  location: String,
  dateOfJoining: Date,
  reportingManager: String,
  currentSalary: Number,
  reasonForApplying: String,
  hodClearance: Boolean,

  // Step 3 – Job Application
  positionApplied: String,
  applicationType: { type: String, enum: ["Experienced", "Trainee", "MTO"] },
  areaOfInterest: String,
  preferredLocations: [String],
  availability: String,
  willingToTravel: Boolean,
  willingToRelocate: Boolean,

  // Step 4 – Education
  education: [
    {
      highestQualification: { type: String, required: true },
      institution: { type: String, required: true },
      major: { type: String, required: true },
      graduationYear: Number,
      cgpa: String,
      certifications: [String],
      achievements: [String],
    },
  ],

  // Step 5 – Experience
  experienceDetails: [
    {
      organization: { type: String, required: true },
      jobTitle: { type: String, required: true },
      from: Date,
      to: Date,
      responsibilities: String,
      achievements: String,
      awards: String,
      lastSalary: Number,
      reasonForLeaving: { type: String, required: true },
    },
  ],

  // Step 6 – Achievements
  achievements: [String],
  majorProjects: [String],
  leadershipRoles: [String],

  // Step 7 – Motivation
  motivation: {
    reasonToJoin: String,
    industryAttraction: String,
    fiveYearPlan: String,
    uniqueValue: String,
    preferredCareerPath: String,
  },

  // Step 8 – Skills
  technicalSkills: [String],
  digitalSkills: [String],
  languages: [String],
  softSkills: [String],
  industryCompetencies: [String],

  // Step 9 – Salary & Benefits
  currentSalary: Number,
  expectedSalary: Number,
  expectedBenefits: [String],

  // Step 10 – Compliance
  conflicts: {
    businessWithCompany: { hasConflict: Boolean, details: String },
    relativesEmployed: { hasConflict: Boolean, details: String },
    previouslyWorked: { hasConflict: Boolean, details: String },
    legalCases: { hasConflict: Boolean, details: String },
  },

  // Step 11 – Diversity
  diversity: {
    disability: Boolean,
    veteran: Boolean,
    references: [String],
  },

  // Step 13 – Declarations
  declarations: {
    infoAccurate: Boolean,
    authorizeVerification: Boolean,
    noConflict: Boolean,
    consentData: Boolean,
    understandSubmission: Boolean,
  },

  // Step 14 – Resume (web path, e.g. /uploads/resumes/abc.pdf)
  resume: String,

  createdAt: { type: Date, default: Date.now },
});

// Create a text index on all the fields you want to search
ProfileSchema.index({
  name: "text",
  email: "text",
  currentAddress: "text",
  designation: "text",
  department: "text",
  location: "text",
  positionApplied: "text",
  areaOfInterest: "text",
  "education.highestQualification": "text",
  "education.institution": "text",
  "education.major": "text",
  "experienceDetails.jobTitle": "text",
  "experienceDetails.organization": "text",
  technicalSkills: "text",
  softSkills: "text",
  languages: "text",
});

export default mongoose.model("Profile", ProfileSchema);
 