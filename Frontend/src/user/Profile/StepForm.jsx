import { useState } from "react";
import api from "../../api";

export default function StepForm({ stepName, onCompleted }) {
  const [formData, setFormData] = useState({});
  const [file, setFile] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (stepName === "Resume") {
        const fd = new FormData();
        fd.append("resume", file);
        await api.put("/profile/resume", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.put(`/profile/step/0`, formData); // stepNumber not used
      }
      onCompleted();
    } catch (err) {
      console.error("Error saving step:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h2 className="text-lg font-semibold">{stepName} Details</h2>

      {stepName === "Personal Info" && (
        <>
          <input name="name" placeholder="Full Name" onChange={handleChange} className="input" />
          <input name="fathersName" placeholder="Father's Name" onChange={handleChange} className="input" />
          <input type="date" name="dob" onChange={handleChange} className="input" />
          <input name="placeOfBirth" placeholder="Place of Birth" onChange={handleChange} className="input" />
          <input name="nationality" placeholder="Nationality" onChange={handleChange} className="input" />
          <input name="cnicNumber" placeholder="CNIC Number" onChange={handleChange} className="input" />
          <input type="date" name="cnicIssueDate" onChange={handleChange} className="input" />
          <input type="date" name="cnicExpiryDate" onChange={handleChange} className="input" />
          <input name="passportNumber" placeholder="Passport Number" onChange={handleChange} className="input" />
          <input name="currentAddress" placeholder="Current Address" onChange={handleChange} className="input" />
          <input name="permanentAddress" placeholder="Permanent Address" onChange={handleChange} className="input" />
          <input name="contactNumber" placeholder="Contact Number" onChange={handleChange} className="input" />
        </>
      )}

      {stepName === "Internal Applicant Details" && (
        <>
          <input name="employeeId" placeholder="Employee ID" onChange={handleChange} className="input" />
          <input name="designation" placeholder="Designation" onChange={handleChange} className="input" />
          <input name="department" placeholder="Department" onChange={handleChange} className="input" />
          <input name="location" placeholder="Location" onChange={handleChange} className="input" />
          <input type="date" name="dateOfJoining" onChange={handleChange} className="input" />
          <input name="reportingManager" placeholder="Reporting Manager" onChange={handleChange} className="input" />
          <input name="currentSalary" type="number" placeholder="Current Salary" onChange={handleChange} className="input" />
        </>
      )}

      {stepName === "Job Application" && (
        <>
          <input name="positionApplied" placeholder="Position Applied" onChange={handleChange} className="input" />
          <select name="applicationType" onChange={handleChange} className="input">
            <option value="">Select</option>
            <option value="Experienced">Experienced</option>
            <option value="Trainee">Trainee</option>
            <option value="MTO">MTO</option>
          </select>
          <input name="areaOfInterest" placeholder="Area of Interest" onChange={handleChange} className="input" />
        </>
      )}

      {stepName === "Education" && (
        <>
          <input name="highestQualification" placeholder="Highest Qualification" onChange={handleChange} className="input" />
          <input name="institution" placeholder="Institution" onChange={handleChange} className="input" />
          <input name="major" placeholder="Major" onChange={handleChange} className="input" />
          <input name="graduationYear" type="number" placeholder="Graduation Year" onChange={handleChange} className="input" />
        </>
      )}

      {stepName === "Experience" && (
        <>
          <input name="organization" placeholder="Organization" onChange={handleChange} className="input" />
          <input name="jobTitle" placeholder="Job Title" onChange={handleChange} className="input" />
          <input type="date" name="from" onChange={handleChange} className="input" />
          <input type="date" name="to" onChange={handleChange} className="input" />
          <input name="reasonForLeaving" placeholder="Reason for Leaving" onChange={handleChange} className="input" />
        </>
      )}

      {stepName === "Achievements" && (
        <textarea name="achievements" placeholder="Achievements" onChange={handleChange} className="input" />
      )}

      {stepName === "Motivation" && (
        <textarea name="reasonToJoin" placeholder="Why do you want to join?" onChange={handleChange} className="input" />
      )}

      {stepName === "Skills" && (
        <>
          <input name="technicalSkills" placeholder="Technical Skills" onChange={handleChange} className="input" />
          <input name="softSkills" placeholder="Soft Skills" onChange={handleChange} className="input" />
        </>
      )}

      {stepName === "Salary & Benefits" && (
        <>
          <input name="expectedSalary" type="number" placeholder="Expected Salary" onChange={handleChange} className="input" />
        </>
      )}

      {stepName === "Compliance" && (
        <textarea name="conflicts" placeholder="Any conflicts?" onChange={handleChange} className="input" />
      )}

      {stepName === "Diversity" && (
        <>
          <label><input type="checkbox" name="disability" onChange={handleChange} /> Disability</label>
          <label><input type="checkbox" name="veteran" onChange={handleChange} /> Veteran</label>
        </>
      )}

      {stepName === "Declarations" && (
        <>
          <label><input type="checkbox" name="infoAccurate" onChange={handleChange} /> Info Accurate</label>
          <label><input type="checkbox" name="authorizeVerification" onChange={handleChange} /> Authorize Verification</label>
        </>
      )}

      {stepName === "Resume" && <input type="file" onChange={handleFileChange} />}

      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
        Save Step
      </button>
    </form>
  );
}

