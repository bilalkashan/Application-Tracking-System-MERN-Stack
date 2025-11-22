import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller, useFieldArray } from 'react-hook-form'; 
import { toast } from 'react-hot-toast';
import api from '../api';
import Sidebar from '../components/Sidebar';
import ProfileHeader from '../components/ProfileHeader';
import { Loader2, Save, PlusCircle, Trash2 } from 'lucide-react';
import { FaBars, FaSpinner } from 'react-icons/fa'; // --- FIX: Correct import ---

const InputField = ({ label, name, register, errors, type = "text", required = false, className = '', ...rest }) => (
    <div className={`mb-4 ${className}`}>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type={type}
            id={name}
            {...register(name, { required: required && `${label} is required` })}
            className={`w-full p-2 border border-gray-300 rounded-lg shadow-sm bg-gray-50 focus:ring-2 focus:ring-[#E30613] focus:outline-none transition text-sm ${errors[name] ? 'border-red-500' : 'border-gray-300'}`}
            {...rest}
        />
        {errors[name] && <p className="text-xs text-red-600 mt-1">{errors[name].message}</p>}
    </div>
);

const TextAreaField = ({ label, name, register, errors, required = false, rows = 3, className = '', ...rest }) => (
    <div className={`mb-4 ${className}`}>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <textarea
            id={name}
            rows={rows}
            {...register(name, { required: required && `${label} is required` })}
            className={`w-full p-2 border border-gray-300 rounded-lg shadow-sm bg-gray-50 focus:ring-2 focus:ring-[#E30613] focus:outline-none transition text-sm ${errors[name] ? 'border-red-500' : 'border-gray-300'}`}
            {...rest}
        />
        {errors[name] && <p className="text-xs text-red-600 mt-1">{errors[name].message}</p>}
    </div>
);

const SelectField = ({ label, name, register, errors, options, required = false, className = '', ...rest }) => (
     <div className={`mb-4 ${className}`}>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
            id={name}
             {...register(name, { required: required && `${label} is required` })}
            className={`w-full p-2 border border-gray-300 rounded-lg shadow-sm bg-gray-50 focus:ring-2 focus:ring-[#E30613] focus:outline-none transition text-sm ${errors[name] ? 'border-red-500' : 'border-gray-300'}`}
             {...rest}
        >
            <option value="">-- Select --</option>
            {options.map(option => (
                <option key={option.value || option} value={option.value || option}>
                    {option.label || option}
                </option>
            ))}
        </select>
         {errors[name] && <p className="text-xs text-red-600 mt-1">{errors[name].message}</p>}
    </div>
);

const CheckboxField = ({ label, name, register, className = '', ...rest }) => (
     <div className={`flex items-center mb-4 ${className}`}>
         <input
              type="checkbox"
              id={name}
              {...register(name)}
              className="h-4 w-4 text-[#E30613] focus:ring-[#E30613] border-gray-300 rounded"
              {...rest}
         />
        <label htmlFor={name} className="ml-2 block text-sm text-gray-900">
           {label}
        </label>
    </div>
);

const YesNoRadio = ({ label, baseName, register, errors, required = false, className = '' }) => (
    <div className={`mb-4 ${className}`}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex items-center space-x-4 mt-2">
            <label htmlFor={`${baseName}-yes`} className="flex items-center cursor-pointer">
                <input
                    type="radio"
                    id={`${baseName}-yes`}
                    value="true"
                    {...register(baseName, { required: required && `Selection is required for ${label}`})}
                    className="focus:ring-[#E30613] h-4 w-4 text-[#E30613] border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label htmlFor={`${baseName}-no`} className="flex items-center cursor-pointer">
                <input
                    type="radio"
                    id={`${baseName}-no`}
                    value="false"
                    {...register(baseName, { required: required && `Selection is required for ${label}` })}
                    className="focus:ring-[#E30613] h-4 w-4 text-[#E30613] border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
        </div>
         {errors[baseName] && <p className="text-xs text-red-600 mt-1">{errors[baseName].message}</p>}
    </div>
);

// --- NEW: Section Wrapper ---
const Section = ({ title, children }) => (
  <section className="mt-8 pt-6 border-t border-gray-200">
    <h3 className="text-xl font-bold mb-6 pb-3 text-[#E30613] border-b border-gray-300">
      {title}
    </h3>
    {children}
  </section>
);

// --- ** THIS IS THE FIX ** ---
const SubSection = ({ title, children }) => (
  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 md:col-span-1">
    <h4 className="font-semibold text-gray-800 mb-3">{title}</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
  </div>
);

export default function EmploymentFormPage() {
    const { appId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true); 
    const [appData, setAppData] = useState(null);
    const { register, handleSubmit, control, setValue, watch, reset, formState: { errors } } = useForm({
        defaultValues: {
            education: [],
            trainings: [],
            employmentHistory: [],
            bloodRelativesInCompany: [],
            references: [],
            benefits: {
                vehicleProvided: 'false',
                buyBackOption: 'false',
                bonus: 'false',
                lfa: 'false',
                gratuity: 'false',
                providentFund: 'false',
                healthInsurance: 'false',
                opd: 'false',
                fuelEntitlement: 'false',
                cellEntitlement: 'false',
                salesIncentive: 'false'
            }
        }
    });
    
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [active, setActive] = useState("Submit Documents"); // Sidebar active state

    const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({ control, name: "education" });
    const { fields: trainingFields, append: appendTraining, remove: removeTraining } = useFieldArray({ control, name: "trainings" });
    const { fields: empFields, append: appendEmp, remove: removeEmp } = useFieldArray({ control, name: "employmentHistory" });
    const { fields: relativeFields, append: appendRelative, remove: removeRelative } = useFieldArray({ control, name: "bloodRelativesInCompany" });
    const { fields: refFields, append: appendRef, remove: removeRef } = useFieldArray({ control, name: "references" });

    const user = useMemo(() => JSON.parse(localStorage.getItem("loggedInUser")) || {}, []);
    const role = user?.role || "user";

    // Watchers (unchanged)
    const watchHasDisability = watch("hasDisabilityOrIllness");
    const watchCriminalRecord = watch("involvedInCriminalActivity");
    const watchAppliedBefore = watch("appliedBefore");
    const watchOtherMeans = watch("otherMeansOfSubsistence");
    const watchVehicle = watch("benefits.vehicleProvided");
    const watchBonus = watch("benefits.bonus");
    const watchLFA = watch("benefits.lfa");
    const watchGratuity = watch("benefits.gratuity");
    const watchPF = watch("benefits.providentFund");
    const watchOPD = watch("benefits.opd");
    const watchFuel = watch("benefits.fuelEntitlement");
    const watchCell = watch("benefits.cellEntitlement");
    const watchSalesIncentive = watch("benefits.salesIncentive");

    useEffect(() => {
            let isMounted = true;
        
            const fetchAppAndSetValues = async () => {
                if (!appId) {
                   setLoading(false);
                   return;
                }
    
                 setLoading(true);
                try {
                    const res = await api.get(`/applications/myOnboarding/${appId}`);
                    if (!isMounted) return; 
        
                    const fetchedData = res.data;
                    setAppData(fetchedData); 
        
                    let defaultValuesToSet = {
                       education: [],
                       trainings: [],
                       employmentHistory: [],
                       bloodRelativesInCompany: [],
                       references: [],
                       benefits: {},
                    };
        
                    if (fetchedData?.employmentFormData) {
                        const formData = fetchedData.employmentFormData;
        
                        Object.keys(formData).forEach(key => {
                            const value = formData[key];
        
                            if (key === 'benefits' && typeof value === 'object' && value !== null) {
                                Object.keys(value).forEach(benefitKey => {
                                    const benefitValue = value[benefitKey];
                                    if (typeof benefitValue === 'boolean') {
                                        defaultValuesToSet.benefits[benefitKey] = benefitValue.toString();
                                    } else {
                                        defaultValuesToSet.benefits[benefitKey] = benefitValue ?? '';
                                    }
                                });
                            } else if (Array.isArray(value)) {
                                defaultValuesToSet[key] = value.filter(item => item && Object.values(item).some(val => val !== '' && val !== null && val !== undefined)) || [];
                            } else if (['dob', 'cnicIssueDate', 'cnicExpiryDate', 'licenseIssueDate', 'licenseExpiryDate'].includes(key) && value) {
                                try {
                                    defaultValuesToSet[key] = new Date(value).toISOString().split('T')[0];
                                } catch (e) { defaultValuesToSet[key] = ''; }
                            } else if (['hasDisabilityOrIllness', 'involvedInCriminalActivity', 'appliedBefore', 'otherMeansOfSubsistence', 'canSubmitReferenceUndertakings'].includes(key)) {
                                 defaultValuesToSet[key] = typeof value === 'boolean' ? value.toString() : 'false';
                            } else {
                                defaultValuesToSet[key] = value ?? '';
                            }
                        });
                         const benefitRadios = ['vehicleProvided', 'buyBackOption', 'bonus', 'lfa', 'gratuity', 'providentFund', 'healthInsurance', 'opd', 'fuelEntitlement', 'cellEntitlement', 'salesIncentive'];
                         benefitRadios.forEach(brKey => {
                             if (defaultValuesToSet.benefits[brKey] === undefined) {
                                   defaultValuesToSet.benefits[brKey] = 'false';
                             }
                         });
        
        
                    } else {
                        defaultValuesToSet.email = user?.email || '';
                        defaultValuesToSet.fullName = user?.name || '';
                         const benefitRadios = ['vehicleProvided', 'buyBackOption', 'bonus', 'lfa', 'gratuity', 'providentFund', 'healthInsurance', 'opd', 'fuelEntitlement', 'cellEntitlement', 'salesIncentive'];
                         benefitRadios.forEach(brKey => { defaultValuesToSet.benefits[brKey] = 'false'; });
        
                    }
        
                    reset(defaultValuesToSet);
        
                } catch (err) {
                     if (!isMounted) return;
                     toast.error("Failed to load application details.");
                     console.error("Fetch error:", err);
                } finally {
                     if (isMounted) {
                         setLoading(false);
                     }
                }
            };
        
            fetchAppAndSetValues();
        
            return () => {
                 isMounted = false;
            };
    
    }, [appId, reset, user]); 

    const onSubmit = async (data) => {
        setLoading(true);
        console.log("Raw form data:", data);

        const cleanedData = { ...data };
        const booleanFields = [
            'hasDisabilityOrIllness', 'involvedInCriminalActivity', 'appliedBefore',
            'otherMeansOfSubsistence', 'canSubmitReferenceUndertakings',
             'benefits.vehicleProvided', 'benefits.buyBackOption', 'benefits.bonus',
             'benefits.lfa', 'benefits.gratuity', 'benefits.providentFund',
             'benefits.healthInsurance', 'benefits.opd', 'benefits.fuelEntitlement',
             'benefits.cellEntitlement', 'benefits.salesIncentive'
        ];
        booleanFields.forEach(fieldPath => {
             const keys = fieldPath.split('.');
             let current = cleanedData;
             for (let i = 0; i < keys.length - 1; i++) {
               current = current?.[keys[i]];
               if (!current) return;
             }
             const finalKey = keys[keys.length - 1];
             if (current && typeof current[finalKey] === 'string') {
               current[finalKey] = current[finalKey] === 'true';
             }
        });

         const numericFields = ['age', 'children', 'currentSalary', 'expectedSalary',
             'benefits.bonusAmount', 'benefits.opdMonthlyAmount',
             'benefits.cellLimitPerMonth', 
             'benefits.salesIncentiveMonthlyAverage'];
         numericFields.forEach(fieldPath => {
              const keys = fieldPath.split('.');
              let current = cleanedData;
              for (let i = 0; i < keys.length - 1; i++) {
                current = current?.[keys[i]];
                if (!current) return;
              }
              const finalKey = keys[keys.length - 1];
              if (current && current[finalKey] !== null && current[finalKey] !== undefined && current[finalKey] !== '') {
                  const num = Number(current[finalKey]);
                  current[finalKey] = isNaN(num) ? null : num;
              } else {
                   current[finalKey] = null;
              }
         });
         ['education', 'trainings', 'employmentHistory', 'bloodRelativesInCompany', 'references'].forEach(key => {
             if (Array.isArray(cleanedData[key])) {
                 cleanedData[key] = cleanedData[key].filter(item => item && Object.values(item).some(val => val !== '' && val !== null && val !== undefined));
             }
         });
        
        console.log("Cleaned data:", cleanedData); 

        try {
            await api.post(`/applications/${appId}/submit-employment-form`, cleanedData);
            toast.success("Employment Form Submitted Successfully!");
            navigate(`/me/applications/${appId}/onboarding`);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to submit form.");
            console.error("Submit error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !appData) { 
        return (
          <div className="flex h-screen bg-gray-100">
            <Sidebar role={role} active={active} setActive={setActive} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <main className="flex-1 overflow-auto pb-10">
              <ProfileHeader
                  title="Employment Application Form"
                  subtitle="Loading your details..."
              />
              <div className="flex h-[50vh] items-center justify-center">
                <FaSpinner className="animate-spin h-10 w-10 text-gray-700" />
              </div>
            </main>
          </div>
        );
    }

    if (!appData && !loading) {
        return (
          <div className="flex h-screen bg-gray-100">
            <Sidebar role={role} active={active} setActive={setActive} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <main className="flex-1 overflow-auto pb-10">
              <ProfileHeader
                  title="Error"
                  subtitle="Could not load application"
              />
              <div className="p-10 text-center text-red-600">
                Failed to load application data. Please go back and try again.
              </div>
            </main>
          </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-100"> 
            <Sidebar role={role} active={active} setActive={setActive} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            
            <button
              className="fixed top-4 left-4 z-40 md:hidden bg-[#999DA2] text-white p-2 rounded-md shadow-md"
              onClick={() => setSidebarOpen(true)}
            >
              <FaBars />
            </button>

            <main className="flex-1 overflow-auto pb-10">
                <ProfileHeader
                    title="Employment Application Form"
                    subtitle={`Position: ${appData?.job?.title || '...'}`}
                />
                <div className="p-4 md:p-8 max-w-5xl mx-auto"> 
                    <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-200">

                        <Section title="A. Personal Information">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6">
                                <InputField label="Full Name" name="fullName" register={register} errors={errors} required />
                                <InputField label="Father's Name" name="fatherName" register={register} errors={errors} required/>
                                <InputField label="Place of Birth" name="placeOfBirth" register={register} errors={errors} />
                                <InputField label="Date of Birth" name="dob" type="date" register={register} errors={errors} required/>
                                <InputField label="Age" name="age" type="number" register={register} errors={errors} required />
                                <InputField label="Father's Occupation" name="fatherOccupation" register={register} errors={errors} />
                                <InputField label="CNIC Number" name="cnic" register={register} errors={errors} required />
                                <InputField label="CNIC Issue Date" name="cnicIssueDate" type="date" register={register} errors={errors} />
                                <InputField label="CNIC Expiry Date" name="cnicExpiryDate" type="date" register={register} errors={errors} />
                                <InputField label="Driving License No." name="drivingLicense" register={register} errors={errors} />
                                <InputField label="License Issue Date" name="licenseIssueDate" type="date" register={register} errors={errors} />
                                <InputField label="License Expiry Date" name="licenseExpiryDate" type="date" register={register} errors={errors} />
                                <InputField label="Current Address" name="currentAddress" register={register} errors={errors} className="lg:col-span-2" required/>
                                <InputField label="Current Phone" name="currentPhone" register={register} errors={errors} />
                                <InputField label="Permanent Address" name="permanentAddress" register={register} errors={errors} className="lg:col-span-2" required/>
                                <InputField label="Permanent Phone" name="permanentPhone" register={register} errors={errors} />
                                <InputField label="Mobile Number" name="mobile" register={register} errors={errors} required/>
                                <InputField label="Email Address" name="email" type="email" register={register} errors={errors} required readOnly={!!user?.email} />
                                <SelectField label="Marital Status" name="maritalStatus" register={register} errors={errors} options={["Single", "Married", "Divorced", "Widowed"]} required/>
                                <InputField label="Children (Number)" name="children" type="number" register={register} errors={errors} />
                                <InputField label="Next of Kin Name" name="nextOfKinName" register={register} errors={errors} />
                                <InputField label="Next of Kin Relationship" name="nextOfKinRelationship" register={register} errors={errors} />
                                <InputField label="Next of Kin Address" name="nextOfKinAddress" register={register} errors={errors} className="lg:col-span-2"/>
                                <InputField label="Next of Kin Contact" name="nextOfKinContact" register={register} errors={errors} />
                                <InputField label="Mother Tongue" name="motherTongue" register={register} errors={errors} />
                                <InputField label="Other Languages Known" name="otherLanguages" register={register} errors={errors} />
                                <YesNoRadio label="Any Disability / Chronic Illness (Last 5 yrs)?" baseName="hasDisabilityOrIllness" register={register} errors={errors} required/>
                                {watchHasDisability === 'true' && <TextAreaField label="If Yes, provide details" name="disabilityOrIllnessDetails" register={register} errors={errors} rows={2} />}
                                <InputField label="Blood Group" name="bloodGroup" register={register} errors={errors} />
                                <YesNoRadio label="Ever involved in Criminal Activity?" baseName="involvedInCriminalActivity" register={register} errors={errors} required/>
                                {watchCriminalRecord === 'true' && <TextAreaField label="If Yes, provide details" name="criminalActivityDetails" register={register} errors={errors} rows={2} />}
                                <InputField label="Emergency Contact Name" name="emergencyContactName" register={register} errors={errors} required/>
                                <InputField label="Emergency Contact Address" name="emergencyContactAddress" register={register} errors={errors} className="lg:col-span-2" required/>
                                <InputField label="Emergency Contact Phone" name="emergencyContactPhone" register={register} errors={errors} required/>
                                <InputField label="Political Affiliation (Party)" name="politicalAffiliationParty" register={register} errors={errors} />
                                <InputField label="Political Affiliation (Rank)" name="politicalAffiliationRank" register={register} errors={errors} />
                                <SelectField label="Source of Vacancy Info" name="sourceOfVacancy" register={register} errors={errors} options={['Newspaper', 'Website', 'Friend', 'Employee Ref.', 'Social Media', 'Consultant', 'Others']} required/>
                                <InputField label="Source Details (If Newspaper, Emp Ref, Other)" name="sourceDetails" register={register} errors={errors} />
                                <InputField label="Current Gross Salary (PKR)" name="currentSalary" type="number" step="any" register={register} errors={errors} />
                                <InputField label="Expected Gross Salary (PKR)" name="expectedSalary" type="number" step="any" register={register} errors={errors} required/>
                            </div>
                        </Section>

                        <Section title="B. Educational Record">
                            <p className='text-sm text-gray-500 -mt-4 mb-4'>List qualifications starting from the most recent.</p>
                            {eduFields.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-1 md:grid-cols-6 gap-x-4 border bg-gray-50 p-4 rounded-lg mb-4 relative">
                                    <InputField label={`Institution ${index + 1}`} name={`education.${index}.institution`} register={register} errors={errors} required className="md:col-span-2 mb-0"/>
                                    <InputField label="Tenure (Yrs)" name={`education.${index}.tenureYears`} register={register} errors={errors} className="mb-0" />
                                    <InputField label="Degree/Diploma" name={`education.${index}.degree`} register={register} errors={errors} required className="mb-0"/>
                                    <InputField label="Subject/Majors" name={`education.${index}.subject`} register={register} errors={errors} className="mb-0"/>
                                    <InputField label="Completion Yr" name={`education.${index}.completionYear`} type="number" register={register} errors={errors} className="mb-0" />
                                    <InputField label="Grade/Div" name={`education.${index}.grade`} register={register} errors={errors} className="mb-0" />
                                    <button type="button" onClick={() => removeEdu(index)} className="absolute top-3 right-3 text-[#E30613] hover:text-red-700">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={() => appendEdu({ institution: '', tenureYears: '', degree: '', subject: '', completionYear: '', grade: '' })} className="text-sm font-medium text-[#111111] hover:text-[#E30613] inline-flex items-center gap-1">
                                <PlusCircle size={16} /> Add Education
                            </button>
                            <TextAreaField label="Co-Curricular Achievements" name="coCurricularAchievements" register={register} errors={errors} className="mt-4 mb-0"/>
                        </Section>

                         <Section title="C. Professional Trainings">
                               {trainingFields.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-x-4 border bg-gray-50 p-4 rounded-lg mb-4 relative">
                                    <InputField label={`Course/Training ${index + 1}`} name={`trainings.${index}.course`} register={register} errors={errors} required className="mb-0"/>
                                    <InputField label="Institution" name={`trainings.${index}.institution`} register={register} errors={errors} className="mb-0" />
                                    <InputField label="Qualification" name={`trainings.${index}.qualification`} register={register} errors={errors} className="mb-0" />
                                    <InputField label="Date / Period" name={`trainings.${index}.datePeriod`} register={register} errors={errors} className="mb-0" />
                                    <button type="button" onClick={() => removeTraining(index)} className="absolute top-3 right-3 text-[#E30613] hover:text-red-700">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                               ))}
                               <button type="button" onClick={() => appendTraining({ course: '', institution: '', qualification: '', datePeriod: '' })} className="text-sm font-medium text-[#111111] hover:text-[#E30613] inline-flex items-center gap-1">
                                <PlusCircle size={16} /> Add Training
                               </button>
                               <TextAreaField label="Self-Employment Details (Nature & Tenure)" name="selfEmployedDetails" register={register} errors={errors} className="mt-4 mb-0"/>
                        </Section>
                        
                        <Section title="D. Previous Employment Details">
                            <p className='text-sm text-gray-500 -mt-4 mb-4'>List jobs starting from the most recent.</p>
                             {empFields.map((field, index) => (
                                 <div key={field.id} className="border bg-gray-50 p-4 rounded-lg mb-6 relative">
                                     <h4 className="font-semibold mb-3 text-gray-800">Job {index + 1} {index === 0 ? '(Current/Most Recent)' : ''}</h4>
                                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4">
                                          <InputField label="Organization" name={`employmentHistory.${index}.organization`} register={register} errors={errors} required/>
                                          <InputField label="Nature of Business" name={`employmentHistory.${index}.natureOfBusiness`} register={register} errors={errors} />
                                          <InputField label="Address" name={`employmentHistory.${index}.address`} register={register} errors={errors} className="lg:col-span-2" />
                                          <InputField label="Boss / Manager Name" name={`employmentHistory.${index}.managerName`} register={register} errors={errors} />
                                          <InputField label="Phone" name={`employmentHistory.${index}.phone`} register={register} errors={errors} />
                                          <InputField label="Starting Position" name={`employmentHistory.${index}.startingPosition`} register={register} errors={errors} />
                                          <InputField label="Last Position" name={`employmentHistory.${index}.lastPosition`} register={register} errors={errors} />
                                          <InputField label="Date Joined (MM/YYYY)" name={`employmentHistory.${index}.dateJoined`} register={register} errors={errors} placeholder="e.g., 03/2020"/>
                                          <InputField label="Date Left (MM/YYYY)" name={`employmentHistory.${index}.dateLeft`} register={register} errors={errors} placeholder="e.g., 10/2023"/>
                                          <InputField label="Total Duration" name={`employmentHistory.${index}.totalDuration`} register={register} errors={errors} />
                                          <InputField label="Starting Salary (Gross)" name={`employmentHistory.${index}.startingSalary`} type="number" step="any" register={register} errors={errors} />
                                          <InputField label="Last Salary (Gross)" name={`employmentHistory.${index}.lastSalary`} type="number" step="any" register={register} errors={errors} />
                                          <TextAreaField label="Reason for Leaving" name={`employmentHistory.${index}.reasonForLeaving`} register={register} errors={errors} rows={2} className="md:col-span-2 lg:col-span-3"/>
                                     </div>
                                      <button type="button" onClick={() => removeEmp(index)} className="absolute top-3 right-3 text-[#E30613] hover:text-red-700">
                                          <Trash2 size={18} />
                                      </button>
                                 </div>
                             ))}
                             <button type="button" onClick={() => appendEmp({})} className="text-sm font-medium text-[#111111] hover:text-[#E30613] inline-flex items-center gap-1">
                                <PlusCircle size={16} /> Add Employment
                             </button>
                        </Section>

                        <Section title="E. Key Roles & Achievements (Current Job)">
                            <TextAreaField label="List key responsibilities and achievements (use new lines for each point)" name="keyRolesAndAchievements" register={register} errors={errors} rows={5} className="mb-0"/>
                        </Section>

                        <Section title="F. Benefits (Current Job)">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <SubSection title="Vehicle">
                                  <YesNoRadio label="Vehicle Provided?" baseName="benefits.vehicleProvided" register={register} errors={errors} />
                                  {watchVehicle === 'true' && <>
                                      <SelectField label="Vehicle Type" name="benefits.vehicleType" register={register} errors={errors} options={['Car', 'Motorcycle']} />
                                      <InputField label="Brand & CC" name="benefits.vehicleDetails" register={register} errors={errors} />
                                      <YesNoRadio label="Buy Back Option?" baseName="benefits.buyBackOption" register={register} errors={errors} />
                                  </>}
                                </SubSection>

                                <SubSection title="Bonus">
                                  <YesNoRadio label="Bonus?" baseName="benefits.bonus" register={register} errors={errors} />
                                  {watchBonus === 'true' && <>
                                      <InputField label="Number of Bonuses" name="benefits.bonusDetails" register={register} errors={errors} placeholder="e.g., 2 per year"/>
                                      <SelectField label="Bonus Based On" name="benefits.bonusBasedOn" register={register} errors={errors} options={['Basic', 'Gross']} />
                                  </>}
                                </SubSection>

                                <SubSection title="LFA">
                                   <YesNoRadio label="Leave Fare Assistance (LFA)?" baseName="benefits.lfa" register={register} errors={errors} />
                                   {watchLFA === 'true' && <SelectField label="LFA Based On" name="benefits.lfaBasedOn" register={register} errors={errors} options={['Basic', 'Gross']} />}
                                </SubSection>

                                <SubSection title="Gratuity">
                                  <YesNoRadio label="Gratuity?" baseName="benefits.gratuity" register={register} errors={errors} />
                                  {watchGratuity === 'true' && <SelectField label="Gratuity Based On" name="benefits.gratuityBasedOn" register={register} errors={errors} options={['Basic', 'Gross']} />}
                                </SubSection>
                                
                                <SubSection title="Provident Fund">
                                   <YesNoRadio label="Provident Fund?" baseName="benefits.providentFund" register={register} errors={errors} />
                                   {watchPF === 'true' && <InputField label="PF Starts When?" name="benefits.providentFundStartDate" register={register} errors={errors} placeholder="e.g., After confirmation"/>}
                                </SubSection>

                                <SubSection title="Health">
                                   <YesNoRadio label="Health Insurance?" baseName="benefits.healthInsurance" register={register} errors={errors} />
                                   <YesNoRadio label="OPD?" baseName="benefits.opd" register={register} errors={errors} />
                                   {watchOPD === 'true' && <InputField label="OPD Monthly Amount (PKR)" name="benefits.opdMonthlyAmount" type="number" step="any" register={register} errors={errors} />}
                                </SubSection>
                                
                                <SubSection title="Fuel">
                                  <YesNoRadio label="Fuel Entitlement?" baseName="benefits.fuelEntitlement" register={register} errors={errors} />
                                  {watchFuel === 'true' && <InputField label="Fuel Limit Per Month" name="benefits.fuelLimitPerMonth" register={register} errors={errors} placeholder="e.g., 100 Liters or PKR 15000"/>}
                                </SubSection>
                                
                                <SubSection title="Mobile">
                                  <YesNoRadio label="Cell Entitlement?" baseName="benefits.cellEntitlement" register={register} errors={errors} />
                                   {watchCell === 'true' && <InputField label="Cell Limit Per Month (PKR)" name="benefits.cellLimitPerMonth" register={register} errors={errors} placeholder="e.g., 3000 or Actual"/>}
                                </SubSection>

                                <SubSection title="Incentive">
                                   <YesNoRadio label="Sales Incentive?" baseName="benefits.salesIncentive" register={register} errors={errors} />
                                   {watchSalesIncentive === 'true' && <InputField label="Incentive Monthly Avg (PKR)" name="benefits.salesIncentiveMonthlyAverage" type="number" step="any" register={register} errors={errors} />}
                                </SubSection>
                            </div>
                            <TextAreaField label="Any Additional Benefits" name="benefits.additionalBenefits" register={register} errors={errors} rows={3} className="mt-4 mb-0"/>
                        </Section>

                        <Section title="G. Other Information">
                            <h4 className='text-lg font-semibold mb-3 text-gray-800'>Blood Relatives in Company / Group</h4>
                             {relativeFields.map((field, index) => (
                                 <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-x-4 border bg-gray-50 p-3 rounded-lg mb-4 relative text-sm">
                                     <InputField label={`Name ${index + 1}`} name={`bloodRelativesInCompany.${index}.name`} register={register} errors={errors} className="mb-0"/>
                                     <InputField label="Designation" name={`bloodRelativesInCompany.${index}.designation`} register={register} errors={errors} className="mb-0"/>
                                     <InputField label="Company" name={`bloodRelativesInCompany.${index}.company`} register={register} errors={errors} className="mb-0"/>
                                     <InputField label="Location" name={`bloodRelativesInCompany.${index}.location`} register={register} errors={errors} className="mb-0"/>
                                     <InputField label="Relationship" name={`bloodRelativesInCompany.${index}.relationship`} register={register} errors={errors} className="mb-0"/>
                                        <button type="button" onClick={() => removeRelative(index)} className="absolute top-3 right-3 text-[#E30613] hover:text-red-700">
                                            <Trash2 size={16} />
                                        </button>
                                 </div>
                             ))}
                             <button type="button" onClick={() => appendRelative({})} className="text-sm font-medium text-[#111111] hover:text-[#E30613] inline-flex items-center gap-1 mb-4">
                                 <PlusCircle size={16} /> Add Relative
                             </button>

                            <YesNoRadio label="Applied / Worked here before?" baseName="appliedBefore" register={register} errors={errors} />
                            {watchAppliedBefore === 'true' && <TextAreaField label="If Yes, provide details" name="appliedBeforeDetails" register={register} errors={errors} rows={2}/>}

                            <InputField label="Name of Relative/Friend working or previously worked here" name="relativeOrFriendInCompany" register={register} errors={errors} />

                             <YesNoRadio label="Other means of subsistence?" baseName="otherMeansOfSubsistence" register={register} errors={errors} />
                             {watchOtherMeans === 'true' && <TextAreaField label="If Yes, provide details" name="otherMeansOfSubsistenceDetails" register={register} errors={errors} rows={2}/>}

                             <InputField label="Notice Period with Current Employer" name="noticePeriod" register={register} errors={errors} required/>
                        </Section>

                        <Section title="H. References">
                          <p className='text-sm text-gray-500 -mt-4 mb-4'>Provide 1 previous employer and 2+ respectable persons (non-relatives).</p>
                           {refFields.map((field, index) => (
                               <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-x-4 border bg-gray-50 p-3 rounded-lg mb-4 relative text-sm">
                                   <InputField label={`Name ${index + 1}`} name={`references.${index}.name`} register={register} errors={errors} required className="mb-0"/>
                                   <InputField label="Occupation/Designation" name={`references.${index}.occupation`} register={register} errors={errors} className="mb-0"/>
                                   <InputField label="Address" name={`references.${index}.address`} register={register} errors={errors} className="mb-0"/>
                                   <InputField label="Phone/Mobile" name={`references.${index}.phone`} register={register} errors={errors} required className="mb-0"/>
                                      <button type="button" onClick={() => removeRef(index)} className="absolute top-3 right-3 text-[#E30613] hover:text-red-700">
                                          <Trash2 size={16} />
                                      </button>
                               </div>
                           ))}
                           <button type="button" onClick={() => appendRef({})} className="text-sm font-medium text-[#111111] hover:text-[#E30613] inline-flex items-center gap-1 mb-4">
                               <PlusCircle size={16} /> Add Reference
                           </button>
                           <YesNoRadio label="Can you submit written undertakings from references if required?" baseName="canSubmitReferenceUndertakings" register={register} errors={errors} required/>
                        </Section>

                        <Section title="Declaration">
                         <div className="bg-gray-100 p-4 rounded-lg border text-sm text-gray-700 mb-4">
                           I certify that the information given herein is true and complete to the best of my knowledge. I authorize the company or its nominated vendor/third party to make investigations and inquiries of my personal, employment, financial or medical history and other related matters, mentioned in this form, as may be necessary in arriving at an employment decision. In the event of employment, I understand that any false or misleading information given in my application or interview shall result in discharge. I agree to abide by the rules and regulations of the Organization.
                         </div>
                         <CheckboxField
                             label="I accept the declaration."
                             name="declarationAccepted"
                             register={register}
                             errors={errors}
                             required 
                         />
                         {errors.declarationAccepted && <p className="text-xs text-red-600 mb-4">{errors.declarationAccepted.message}</p>}
                        </Section>

                        <div className="mt-8 text-center border-t border-gray-200 pt-6"> 
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center justify-center gap-2 px-10 py-3 bg-[#E30613] text-white rounded-full shadow-lg hover:bg-red-700 transition disabled:bg-gray-400 text-base font-semibold"
                            >
                                {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                                {loading ? 'Submitting...' : 'Submit Employment Form'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}