import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import * as pdf from "pdf-parse";
import mammoth from "mammoth";
import Job from "../models/Job.js";
import Profile from "../models/Profile.js";
/**
 * Calculates a weighted matching score for a job application (out of 100).
 * Enhancements: Experience is now scored based on years, and Education is scored based on keyword ratio.
 * @param {object} application - The application object.
 * @returns {number} The final matching score (0-100).
 */

async function getResumeText(resumePath) {
  if (!resumePath) return "";
  const fullPath = path.join(__dirname, "..", resumePath.replace(/^\//, ""));
  if (!fs.existsSync(fullPath)) {
    console.warn(`Resume file not found at: ${fullPath}`);
    return "";
  }
  const ext = path.extname(resumePath).toLowerCase();
  try {
    if (ext === ".pdf") {
      const dataBuffer = fs.readFileSync(fullPath);
      const data = await pdf.default(dataBuffer);
      return data.text;
    } else if (ext === ".docx") {
      const { value } = await mammoth.extractRawText({ path: fullPath });
      return value;
    }
  } catch (error) {
    console.error(`Error parsing resume ${fullPath}:`, error);
    return "";
  }
  return "";
}

const getKeywords = (text) => {
  if (!text) return [];
  return text.toLowerCase().match(/\b(\w+)\b/g) || [];
};

export const calculateMatchingScore = async (application) => {
    const job = await Job.findById(application.job).populate("requisition");
    const profile = await Profile.findOne({ user: application.applicant });

    if (!job || !profile) return 0;

    const resumeText = await getResumeText(application.resumePath);

    const applicantTextCorpus = `
        ${(profile.technicalSkills || []).join(" ")}
        ${(profile.digitalSkills || []).join(" ")}
        ${(profile.softSkills || []).join(" ")}
        ${(profile.education || [])
            .map((e) => `${e.highestQualification} ${e.major} ${e.institution}`)
            .join(" ")}
        ${(profile.experienceDetails || [])
            .map((e) => `${e.jobTitle} ${e.responsibilities} ${e.organization}`)
            .join(" ")}
        ${resumeText}
    `.toLowerCase();

    const WEIGHTS = {
        skills: 40,
        experience: 30,
        education: 20,
        keywords: 10,
    };

    let finalScore = 0;
    const skillCorpus = applicantTextCorpus.replace(/\./g, ''); 

    if (job.requisition) {
        const jobSkills = [
            ...(job.requisition.technicalSkills || []),
            ...(job.requisition.softSkills || []),
        ].map(s => 
            s.toLowerCase().trim()
             .replace(/skills?$/i, '')
             .replace(/\./g, '') 
        );

        if (jobSkills.length > 0) {
            let skillsFound = 0;
            jobSkills.forEach((skill) => {
                if (skill && skillCorpus.includes(skill)) {
                    skillsFound++;
                }
            });
            const skillRatio = skillsFound / jobSkills.length;
            finalScore += skillRatio * WEIGHTS.skills;
        }
    }

    const jobTitle = job.title.toLowerCase();
    
    const totalExperienceYears = (profile.experienceDetails || []).reduce((total, exp) => {
        if (exp.from && exp.to) {
            const fromDate = new Date(exp.from);
            const toDate = new Date(exp.to);
            return total + ((toDate - fromDate) / (1000 * 60 * 60 * 24 * 365.25));
        }
        return total;
    }, 0);

    const reqMatch = (job.experienceRequired || '').match(/(\d+)/);
    const minRequiredYears = reqMatch ? parseInt(reqMatch[1], 10) : 0;

    if (minRequiredYears > 0) {
        const expRatio = Math.min(totalExperienceYears / minRequiredYears, 1);
        finalScore += expRatio * WEIGHTS.experience;
    } else if (applicantTextCorpus.includes(jobTitle)) {
        finalScore += WEIGHTS.experience;
    }


    const requiredQualification = (job.qualificationRequired || "").toLowerCase();
    if (requiredQualification) {
        const eduKeywords = getKeywords(requiredQualification);
        if (eduKeywords.length > 0) {
            let eduKeywordsFound = 0;
            eduKeywords.forEach(keyword => {
                if (applicantTextCorpus.includes(keyword)) {
                    eduKeywordsFound++;
                }
            });
            const eduRatio = eduKeywordsFound / eduKeywords.length; 
            finalScore += eduRatio * WEIGHTS.education;
        }
    }

    const jobKeywords = getKeywords(`${job.title} ${job.designation}`);
    if (jobKeywords.length > 0) {
        let keywordsFound = 0;
        jobKeywords.forEach((keyword) => {
            if (applicantTextCorpus.includes(keyword)) {
                keywordsFound++;
            }
        });
        const keywordRatio = keywordsFound / jobKeywords.length;
        finalScore += keywordRatio * WEIGHTS.keywords;
    }

    // 4. Final Score
    return Math.round(Math.min(finalScore, 100));
};