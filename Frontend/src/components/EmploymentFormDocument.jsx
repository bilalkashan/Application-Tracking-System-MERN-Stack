import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import logoUrl from "../assets/MMC-Logo.png";

const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
        return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) { return 'Invalid Date'; }
};
const formatCurrency = (value) => {
    if (typeof value !== 'number' || isNaN(value)) return 'N/A';
    return `PKR ${value.toLocaleString()}`;
};
// Use Unicode characters for checkboxes
const Checkbox = ({ checked }) => (
    <Text style={styles.checkboxMark}>{checked ? '☑' : '☐'}</Text>
);

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica', // Default font
        fontSize: 9,
        paddingTop: '25mm', // Space for header
        paddingBottom: '20mm', // Space for footer
        paddingHorizontal: '15mm',
        color: '#333',
        lineHeight: 1.3,
    },
    header: {
        position: 'absolute', top: '10mm', left: '15mm', right: '15mm', height: '15mm',
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', // Align items at the bottom
        borderBottomWidth: 0.5, borderBottomColor: '#555', paddingBottom: '2mm',
    },
    logo: { height: '10mm', width: 'auto' },
    docId: { fontSize: 8, color: '#555', textAlign: 'right' },
    footer: {
        position: 'absolute', bottom: '5mm', left: '15mm', right: '15mm', height: '15mm',
        borderTopWidth: 0.5, borderTopColor: '#555', paddingTop: '2mm',
        fontSize: 8, color: '#555', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    pageNumber: {},

    // Titles
    mainTitle: { textAlign: 'center', fontSize: 14, fontWeight: 'bold', fontFamily: 'Times-Roman', marginBottom: 1, textTransform: 'uppercase' },
    subTitle: { textAlign: 'center', fontSize: 10, fontWeight: 'bold', marginBottom: 10, },
    sectionTitle: { fontSize: 10, fontWeight: 'bold', fontFamily: 'Times-Roman', marginTop: 10, marginBottom: 5, borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 1, textTransform: 'uppercase' },
    subSectionNote: { fontSize: 7.5, fontStyle: 'italic', marginBottom: 4, color: '#444', },

    // Top Section (Post, Source, Salary, Photo)
    topTable: { flexDirection: 'row', marginBottom: 8, borderWidth: 0.5, borderColor: '#aaa' },
    topLeftCell: { width: '70%', padding: 4, borderRightWidth: 0.5, borderRightColor: '#aaa' },
    topRightCell: { width: '30%', padding: 4, alignItems: 'center', justifyContent: 'center' },
    photoBox: { width: 70, height: 90, borderWidth: 1, borderColor: '#ccc', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
    photoPlaceholder: { fontSize: 7, color: '#999' },
    profilePic: { width: '100%', height: '100%', objectFit: 'cover' },
    fieldRow: { flexDirection: 'row', marginBottom: 2, alignItems: 'flex-start' }, // Changed to flex-start
    fieldLabel: { fontWeight: 'bold', minWidth: 100, fontSize: 8 },
    fieldValue: { flex: 1, fontSize: 8, marginLeft: 3 },
    checkboxGroup: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 1 },
    checkboxLabel: { flexDirection: 'row', alignItems: 'center', marginRight: 8, fontSize: 8 },
    checkboxMark: { marginRight: 2, fontSize: 10, fontFamily: 'Helvetica' }, // Use a font known to have checkmarks

    // Grid Layout for Personal Info
    infoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 5, marginTop: 5},
    infoItem: { width: '49%', marginBottom: 2, paddingBottom: 1, borderBottomWidth: 0.5, borderBottomColor: '#eee', flexDirection: 'row', alignItems: 'baseline'}, // baseline align
    infoItemFull: { width: '100%', marginBottom: 2, paddingBottom: 1, borderBottomWidth: 0.5, borderBottomColor: '#eee', flexDirection: 'row', alignItems: 'baseline' },
    infoItemNestedLabel: { fontWeight: 'bold', fontSize: 8, minWidth: 'auto', marginRight: 3}, // Label within a value
    infoItemNestedValue: { fontSize: 8 },

    // Tables
    table: { display: "table", width: "100%", borderStyle: "solid", borderWidth: 0.5, borderColor: '#777', borderRightWidth: 0, borderBottomWidth: 0, marginBottom: 8, },
    tableRow: { margin: "auto", flexDirection: "row", borderBottomStyle: "solid", borderBottomWidth: 0.5, borderBottomColor: '#777', minHeight: 16, },
    tableHeaderRow: { backgroundColor: '#e0e0e0', minHeight: 18, fontWeight: 'bold' },
    tableCol: { borderStyle: "solid", borderWidth: 0.5, borderColor: '#777', borderLeftWidth: 0, borderTopWidth: 0, padding: 2, flexGrow: 1, justifyContent: 'center' }, // Center vertically
    tableCell: { fontSize: 7.5, textAlign: 'left'},
    tableHeaderCell: { fontSize: 7.5, fontWeight: 'bold', fontFamily: 'Helvetica-Bold', textAlign: 'left' },
    // Specific Column Widths (Adjust percentages/absolute values)
    colCenter: { textAlign: 'center' },
    colEduInst: { width: '28%' }, colEduTenure: { width: '10%' }, colEduDeg: { width: '18%' },
    colEduSub: { width: '18%' }, colEduYear: { width: '10%' }, colEduGrade: { width: '12%' },
    colTrainCourse: { width: '35%' }, colTrainInst: { width: '30%' }, colTrainQual: { width: '20%' }, colTrainPeriod: { width: '15%' },
    colEmpLabel: { width: '120px', fontWeight: 'bold', borderRightWidth: 0, paddingRight: 3},
    colEmpValue: { flexGrow: 1, borderLeftWidth: 0, paddingLeft: 3 },
    colRelName: { width: '25%' }, colRelDesig: { width: '20%' }, colRelComp: { width: '20%' }, colRelLoc: { width: '15%' }, colRelRel: { width: '20%' },
    colRefName: { width: '25%' }, colRefOcc: { width: '25%' }, colRefAdd: { width: '30%' }, colRefPh: { width: '20%' },

    // Text Areas / Boxes
    textBox: { borderWidth: 0.5, borderColor: '#aaa', minHeight: 30, padding: 3, marginTop: 2, fontSize: 8},
    keyRolesBox: { borderWidth: 0.5, borderColor: '#aaa', minHeight: 60, padding: 3, marginTop: 2, fontSize: 8 },
    keyRolesList: { marginLeft: 10 },
    keyRolesItem: { marginBottom: 1.5, flexDirection: 'row' },
    keyRolesNumber: { marginRight: 3 },

    // Benefits Section
    benefitsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 3 },
    benefitItem: { width: '49%', marginBottom: 3, paddingBottom: 1.5, borderBottomWidth: 0.5, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline'},
    benefitLabel: { fontWeight: 'bold', fontSize: 8 },
    benefitValue: { fontSize: 8, textAlign: 'right' },
    benefitDetail: { fontSize: 7, color: '#555', marginLeft: 3 },

    // Declaration
    declarationBox: { border: 1, borderColor: '#000', padding: 8, marginTop: 8, backgroundColor: '#f9f9f9', fontSize: 7.5 },
    declarationTitle: { textAlign: 'center', fontWeight: 'bold', marginBottom: 4, fontSize: 9 },
    signatureArea: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', fontSize: 8 },
    signatureLine: { borderBottomWidth: 0.5, borderBottomColor: '#333', minWidth: 130, marginLeft: 3 },
});

// --- THE DOCUMENT COMPONENT ---
const EmploymentFormDocument = ({ data }) => {
    const { formData = {}, applicantName, jobTitle, profilePictureUrl } = data || {};
    const benefits = formData.benefits || {};

    // Helper to create empty rows for tables
    const renderEmptyRows = (count, columns) => {
        return Array.from({ length: count }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.tableRow} wrap={false}>
                {columns.map((colStyle, j) => (
                     <View key={j} style={[styles.tableCol, colStyle]}><Text style={styles.tableCell}>&nbsp;</Text></View>
                ))}
            </View>
        ));
    };
    const eduCols = [styles.colEduInst, styles.colEduTenure, styles.colEduDeg, styles.colEduSub, styles.colEduYear, styles.colEduGrade];
    const trainCols = [styles.colTrainCourse, styles.colTrainInst, styles.colTrainQual, styles.colTrainPeriod];
    const relCols = [styles.colRelName, styles.colRelDesig, styles.colRelComp, styles.colRelLoc, styles.colRelRel];
    const refCols = [styles.colRefName, styles.colRefOcc, styles.colRefAdd, styles.colRefPh];

    return (
    <Document title={`Employment Form - ${applicantName}`}>
        <View style={styles.header} fixed>
            <Image src={logoUrl} style={styles.logo} />
            <Text style={styles.docId}>MMCL/HR/F-003</Text>
        </View>
        <View style={styles.footer} fixed>
            <Text>www.mmcl.com.pk</Text>
            <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
                `Page ${pageNumber} of ${totalPages}`
            )} />
        </View>

        {/* --- PAGE 1 --- */}
        <Page size="A4" style={styles.page}>
            <Text style={styles.mainTitle}>MASTER MOTOR CORPORATION PRIVATE LIMITED.</Text>
            <Text style={styles.subTitle}>Employment Application Form (Confidential)</Text>

            <View style={styles.topTable}>
                <View style={styles.topLeftCell}>
                    <View style={styles.fieldRow}><Text style={styles.fieldLabel}>Application for the post of:</Text><Text style={styles.fieldValue}>{jobTitle || 'N/A'}</Text></View>
                    <View style={{ marginTop: 5, marginBottom: 5 }}>
                        <Text style={styles.fieldLabel}>Source of information:</Text>
                        <View style={styles.checkboxGroup}>
                             {['Newspaper', 'Website', 'Friend', 'Employee Ref.', 'Social Media', 'Consultant', 'Others'].map(source => (
                                <Text key={source} style={styles.checkboxLabel}>
                                     <Checkbox checked={formData.sourceOfVacancy === source} /> {source}
                                     {(['Newspaper', 'Employee Ref.', 'Others'].includes(source) && formData.sourceOfVacancy === source) ? `: ${formData.sourceDetails || ''}` : ''}
                                </Text>
                            ))}
                        </View>
                    </View>
                    <View style={styles.fieldRow}><Text style={styles.fieldLabel}>Current Gross Salary:</Text><Text style={styles.fieldValue}>{formatCurrency(formData.currentSalary)}</Text></View>
                    <View style={styles.fieldRow}><Text style={styles.fieldLabel}>Expected Gross Salary:</Text><Text style={styles.fieldValue}>{formatCurrency(formData.expectedSalary)}</Text></View>
                </View>
                <View style={styles.topRightCell}>
                    <View style={styles.photoBox}>
                        {profilePictureUrl ? (
                            <Image style={styles.profilePic} src={{ uri: profilePictureUrl, method: 'GET', headers: {}, body: '' }} />
                        ) : (
                            <Text style={styles.photoPlaceholder}>Recent photograph</Text>
                        )}
                    </View>
                </View>
            </View>

            <Text style={styles.sectionTitle}>A. PERSONAL INFORMATION</Text>
             <View style={styles.infoGrid}>
                <View style={styles.infoItem}><Text style={styles.fieldLabel}>Name (in full):</Text> <Text style={styles.fieldValue}>{formData.fullName || 'N/A'}</Text></View>
                <View style={styles.infoItem}><Text style={styles.fieldLabel}>Driving License No.:</Text> <Text style={styles.fieldValue}>{formData.drivingLicense || 'N/A'}</Text></View>
                <View style={styles.infoItem}><Text style={styles.fieldLabel}>Father's Name:</Text> <Text style={styles.fieldValue}>{formData.fatherName || 'N/A'}</Text></View>
                <View style={styles.infoItem}><Text style={styles.fieldLabel}>License Issue & Expiry:</Text> <Text style={styles.fieldValue}>{formatDate(formData.licenseIssueDate)} - {formatDate(formData.licenseExpiryDate)}</Text></View>
                <View style={styles.infoItem}><Text style={styles.fieldLabel}>Place & Date of Birth:</Text> <Text style={styles.fieldValue}>{formData.placeOfBirth || 'N/A'}, {formatDate(formData.dob)}</Text></View>
                <View style={styles.infoItem}><Text style={styles.fieldLabel}>Current Address:</Text> <Text style={styles.fieldValue}>{formData.currentAddress || 'N/A'}</Text></View>
                <View style={styles.infoItem}><Text style={styles.fieldLabel}>Age:</Text> <Text style={styles.fieldValue}>{formData.age || 'N/A'}</Text></View>
                <View style={styles.infoItem}><Text style={styles.fieldLabel}>Phone No.:</Text> <Text style={styles.fieldValue}>{formData.currentPhone || 'N/A'}</Text></View>
                <View style={styles.infoItem}><Text style={styles.fieldLabel}>Father's Occupation:</Text> <Text style={styles.fieldValue}>{formData.fatherOccupation || 'N/A'}</Text></View>
                <View style={styles.infoItem}><Text style={styles.fieldLabel}>Permanent Address:</Text> <Text style={styles.fieldValue}>{formData.permanentAddress || 'N/A'}</Text></View>
                <View style={styles.infoItem}><Text style={styles.fieldLabel}>CNIC No.:</Text> <Text style={styles.fieldValue}>{formData.cnic || 'N/A'}</Text></View>
                <View style={styles.infoItem}><Text style={styles.fieldLabel}>Phone No.:</Text> <Text style={styles.fieldValue}>{formData.permanentPhone || 'N/A'}</Text></View>
                <View style={styles.infoItem}><Text style={styles.fieldLabel}>CNIC Issue & Expiry:</Text> <Text style={styles.fieldValue}>{formatDate(formData.cnicIssueDate)} - {formatDate(formData.cnicExpiryDate)}</Text></View>
                <View style={styles.infoItem}><Text style={styles.fieldLabel}>Mobile No.:</Text> <Text style={styles.fieldValue}>{formData.mobile || 'N/A'}</Text></View>
                <View style={styles.infoItem}><Text style={styles.fieldLabel}>Marital Status:</Text> <Text style={styles.fieldValue}>{formData.maritalStatus || 'N/A'}</Text></View>
                <View style={styles.infoItem}><Text style={styles.fieldLabel}>Email Address:</Text> <Text style={styles.fieldValue}>{formData.email || 'N/A'}</Text></View>
                <View style={styles.infoItem}><Text style={styles.fieldLabel}>Children:</Text> <Text style={styles.fieldValue}>{formData.children != null ? formData.children : 'N/A'}</Text></View>
                <View style={styles.infoItem}><Text style={styles.fieldLabel}>Political Affiliation:</Text> <Text style={styles.fieldValue}>{formData.politicalAffiliationParty || 'N/A'} (Rank: {formData.politicalAffiliationRank || 'N/A'})</Text></View>
                {/* Full width items */}
                <View style={styles.infoItemFull}><Text style={styles.fieldLabel}>Next of Kin (Name & Relationship):</Text> <Text style={styles.fieldValue}>{formData.nextOfKinName || 'N/A'} ({formData.nextOfKinRelationship || 'N/A'})</Text></View>
                <View style={styles.infoItemFull}><Text style={styles.fieldLabel}>Next of Kin (Address & Contact):</Text> <Text style={styles.fieldValue}>{formData.nextOfKinAddress || 'N/A'}, Ph: {formData.nextOfKinContact || 'N/A'}</Text></View>
                {/* Back to grid */}
                <View style={styles.infoItem}><Text style={styles.fieldLabel}>Mother Tongue:</Text> <Text style={styles.fieldValue}>{formData.motherTongue || 'N/A'}</Text></View>
                <View style={styles.infoItem}><Text style={styles.fieldLabel}>Other Languages Known:</Text> <Text style={styles.fieldValue}>{formData.otherLanguages || 'N/A'}</Text></View>
                <View style={styles.infoItem}>
                    <Text style={styles.fieldLabel}>Health (Disability/Illness):</Text>
                    <Text style={styles.fieldValue}><Checkbox checked={formData.hasDisabilityOrIllness}/> Yes <Checkbox checked={!formData.hasDisabilityOrIllness} /> No
                    {formData.hasDisabilityOrIllness ? ` Details: ${formData.disabilityOrIllnessDetails || 'N/A'}` : ''}</Text>
                </View>
                <View style={styles.infoItem}><Text style={styles.fieldLabel}>Blood Group:</Text> <Text style={styles.fieldValue}>{formData.bloodGroup || 'N/A'}</Text></View>
                <View style={styles.infoItemFull}>
                     <Text style={styles.fieldLabel}>Ever involved in Criminal Activity:</Text>
                    <Text style={styles.fieldValue}><Checkbox checked={formData.involvedInCriminalActivity}/> Yes <Checkbox checked={!formData.involvedInCriminalActivity} /> No
                    {formData.involvedInCriminalActivity ? ` Details: ${formData.criminalActivityDetails || 'N/A'}` : ''}</Text>
                </View>
                <View style={styles.infoItem}><Text style={styles.fieldLabel}>Contact Person (Emergency):</Text> <Text style={styles.fieldValue}>{formData.emergencyContactName || 'N/A'}</Text></View>
                <View style={styles.infoItem}><Text style={styles.fieldLabel}>Contact No:</Text> <Text style={styles.fieldValue}>{formData.emergencyContactPhone || 'N/A'}</Text></View>
                <View style={styles.infoItemFull}><Text style={styles.fieldLabel}>Address:</Text> <Text style={styles.fieldValue}>{formData.emergencyContactAddress || 'N/A'}</Text></View>
            </View>
        </Page>

        {/* --- PAGE 2 --- */}
         <Page size="A4" style={styles.page} wrap>
            <Text style={styles.sectionTitle} break>B. EDUCATIONAL RECORD</Text> {/* Added break prop */}
            <Text style={styles.subSectionNote}>Start from Last Degree</Text>
            <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeaderRow]} fixed>
                     {/* Header cells */}
                     <View style={[styles.tableCol, styles.colEduInst]}><Text style={styles.tableHeaderCell}>Name of Institution School/College / University</Text></View>
                     <View style={[styles.tableCol, styles.colEduTenure, styles.colCenter]}><Text style={styles.tableHeaderCell}>Length of Tenure / Year(s)</Text></View>
                     <View style={[styles.tableCol, styles.colEduDeg]}><Text style={styles.tableHeaderCell}>Name of Degree / Diploma Obtained</Text></View>
                     <View style={[styles.tableCol, styles.colEduSub]}><Text style={styles.tableHeaderCell}>Subject/ Majors</Text></View>
                     <View style={[styles.tableCol, styles.colEduYear, styles.colCenter]}><Text style={styles.tableHeaderCell}>Year of Completion</Text></View>
                     <View style={[styles.tableCol, styles.colEduGrade, styles.colCenter]}><Text style={styles.tableHeaderCell}>Grade / Division</Text></View>
                </View>
                {/* Data Rows */}
                 {(formData.education?.length || 0) > 0 ? formData.education.map((edu, index) => (
                    <View key={index} style={styles.tableRow} wrap={false}>
                        <View style={[styles.tableCol, styles.colEduInst]}><Text style={styles.tableCell}>{edu.institution || ''}</Text></View>
                        <View style={[styles.tableCol, styles.colEduTenure, styles.colCenter]}><Text style={styles.tableCell}>{edu.tenureYears || ''}</Text></View>
                        <View style={[styles.tableCol, styles.colEduDeg]}><Text style={styles.tableCell}>{edu.degree || ''}</Text></View>
                        <View style={[styles.tableCol, styles.colEduSub]}><Text style={styles.tableCell}>{edu.subject || ''}</Text></View>
                        <View style={[styles.tableCol, styles.colEduYear, styles.colCenter]}><Text style={styles.tableCell}>{edu.completionYear || ''}</Text></View>
                        <View style={[styles.tableCol, styles.colEduGrade, styles.colCenter]}><Text style={styles.tableCell}>{edu.grade || ''}</Text></View>
                    </View>
                 )) : (
                     <View style={styles.tableRow}><View style={[styles.tableCol, {width: '100%'}]}><Text style={[styles.tableCell, {fontStyle: 'italic', color: '#888'}]}>No educational record provided.</Text></View></View>
                 )}
                 {/* Empty Rows */}
                 {renderEmptyRows(Math.max(0, 6 - (formData.education?.length || 0)), eduCols)}
            </View>
             <Text style={styles.fieldLabel}>Co-Curricular Achievements During Education:</Text>
            <View style={styles.textBox}><Text>{formData.coCurricularAchievements || 'N/A'}</Text></View>

            <Text style={styles.sectionTitle}>C. PROFESSIONAL TRAININGS</Text>
             <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeaderRow]} fixed>
                      <View style={[styles.tableCol, styles.colTrainCourse]}><Text style={styles.tableHeaderCell}>Type of Course / Training</Text></View>
                      <View style={[styles.tableCol, styles.colTrainInst]}><Text style={styles.tableHeaderCell}>Institution</Text></View>
                      <View style={[styles.tableCol, styles.colTrainQual]}><Text style={styles.tableHeaderCell}>Qualification / Certificate</Text></View>
                      <View style={[styles.tableCol, styles.colTrainPeriod]}><Text style={styles.tableHeaderCell}>Date / Period</Text></View>
                  </View>
                  {(formData.trainings?.length || 0) > 0 ? formData.trainings.map((tr, index) => (
                       <View key={index} style={styles.tableRow} wrap={false}>
                           <View style={[styles.tableCol, styles.colTrainCourse]}><Text style={styles.tableCell}>{tr.course || ''}</Text></View>
                           <View style={[styles.tableCol, styles.colTrainInst]}><Text style={styles.tableCell}>{tr.institution || ''}</Text></View>
                           <View style={[styles.tableCol, styles.colTrainQual]}><Text style={styles.tableCell}>{tr.qualification || ''}</Text></View>
                           <View style={[styles.tableCol, styles.colTrainPeriod]}><Text style={styles.tableCell}>{tr.datePeriod || ''}</Text></View>
                       </View>
                   )) : (
                      <View style={styles.tableRow}><View style={[styles.tableCol, {width: '100%'}]}><Text style={[styles.tableCell, {fontStyle: 'italic', color: '#888'}]}>No professional trainings provided.</Text></View></View>
                  )}
                  {renderEmptyRows(Math.max(0, 3 - (formData.trainings?.length || 0)), trainCols)}
             </View>
             <Text style={styles.fieldLabel}>Details if ever remained self-employed (Nature of Business and Tenure):</Text>
             <View style={styles.textBox}><Text>{formData.selfEmployedDetails || 'N/A'}</Text></View>
         </Page>

        {/* --- PAGE 3 --- */}
        <Page size="A4" style={styles.page} wrap>
             <Text style={styles.sectionTitle} break>D. PREVIOUS EMPLOYMENT DETAILS</Text>
             <Text style={styles.subSectionNote}>Start from your current / last job</Text>
              {(formData.employmentHistory?.length || 0) > 0 ? formData.employmentHistory.map((job, index) => (
                 <View key={index} style={{ marginBottom: 8 }} wrap={false}>
                     <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 3 }}>
                          ({index + 1}) {index === 0 ? 'Current/Latest' : ''}
                     </Text>
                     <View style={[styles.table, styles.employmentTable]}>
                         <View style={styles.tableRow}><View style={[styles.tableCol, styles.colEmpLabel]}><Text style={styles.tableCell}>Organization:</Text></View><View style={[styles.tableCol, styles.colEmpValue]}><Text style={styles.tableCell}>{job.organization || ''}</Text></View></View>
                         <View style={styles.tableRow}><View style={[styles.tableCol, styles.colEmpLabel]}><Text style={styles.tableCell}>Nature of Business:</Text></View><View style={[styles.tableCol, styles.colEmpValue]}><Text style={styles.tableCell}>{job.natureOfBusiness || ''}</Text></View></View>
                         <View style={styles.tableRow}><View style={[styles.tableCol, styles.colEmpLabel]}><Text style={styles.tableCell}>Address:</Text></View><View style={[styles.tableCol, styles.colEmpValue]}><Text style={styles.tableCell}>{job.address || ''}</Text></View></View>
                         <View style={styles.tableRow}><View style={[styles.tableCol, styles.colEmpLabel]}><Text style={styles.tableCell}>Boss / Manager:</Text></View><View style={[styles.tableCol, styles.colEmpValue]}><Text style={styles.tableCell}>{job.managerName || ''}</Text></View></View>
                         <View style={styles.tableRow}><View style={[styles.tableCol, styles.colEmpLabel]}><Text style={styles.tableCell}>Phone Nos.:</Text></View><View style={[styles.tableCol, styles.colEmpValue]}><Text style={styles.tableCell}>{job.phone || ''}</Text></View></View>
                         <View style={styles.tableRow}><View style={[styles.tableCol, styles.colEmpLabel]}><Text style={styles.tableCell}>Starting Position:</Text></View><View style={[styles.tableCol, styles.colEmpValue]}><Text style={styles.tableCell}>{job.startingPosition || ''}</Text></View></View>
                         <View style={styles.tableRow}><View style={[styles.tableCol, styles.colEmpLabel]}><Text style={styles.tableCell}>Last Position:</Text></View><View style={[styles.tableCol, styles.colEmpValue]}><Text style={styles.tableCell}>{job.lastPosition || ''}</Text></View></View>
                         <View style={styles.tableRow}><View style={[styles.tableCol, styles.colEmpLabel]}><Text style={styles.tableCell}>Joined (MM/YYYY):</Text></View><View style={[styles.tableCol, styles.colEmpValue]}><Text style={styles.tableCell}>{job.dateJoined || ''}</Text></View></View>
                         <View style={styles.tableRow}><View style={[styles.tableCol, styles.colEmpLabel]}><Text style={styles.tableCell}>Left (MM/YYYY):</Text></View><View style={[styles.tableCol, styles.colEmpValue]}><Text style={styles.tableCell}>{job.dateLeft || ''}</Text></View></View>
                         <View style={styles.tableRow}><View style={[styles.tableCol, styles.colEmpLabel]}><Text style={styles.tableCell}>Total Duration:</Text></View><View style={[styles.tableCol, styles.colEmpValue]}><Text style={styles.tableCell}>{job.totalDuration || ''}</Text></View></View>
                         <View style={styles.tableRow}><View style={[styles.tableCol, styles.colEmpLabel]}><Text style={styles.tableCell}>Starting Salary: *</Text></View><View style={[styles.tableCol, styles.colEmpValue]}><Text style={styles.tableCell}>{formatCurrency(job.startingSalary)}</Text></View></View>
                         <View style={styles.tableRow}><View style={[styles.tableCol, styles.colEmpLabel]}><Text style={styles.tableCell}>Last Salary: *</Text></View><View style={[styles.tableCol, styles.colEmpValue]}><Text style={styles.tableCell}>{formatCurrency(job.lastSalary)}</Text></View></View>
                         <View style={styles.tableRow}><View style={[styles.tableCol, styles.colEmpLabel]}><Text style={styles.tableCell}>Reason for Leaving:</Text></View><View style={[styles.tableCol, styles.colEmpValue]}><Text style={styles.tableCell}>{job.reasonForLeaving || ''}</Text></View></View>
                     </View>
                 </View>
              )) : (
                  <Text style={styles.subSectionNote}>No previous employment details provided.</Text>
              )}
              {formData.employmentHistory?.length > 0 && <Text style={styles.salaryNote}>*Please provide details of gross salary.</Text>}
        </Page>

        {/* --- PAGE 4 --- */}
         <Page size="A4" style={styles.page} wrap>
             <Text style={styles.sectionTitle} break>E. Key Roles & Key Achievements of your current job</Text>
             <View style={styles.keyRolesBox}>
                  {formData.keyRolesAndAchievements && formData.keyRolesAndAchievements.trim() ? (
                      <View style={styles.keyRolesList}>
                          {formData.keyRolesAndAchievements.split('\n').map((item, index) => item.trim() && (
                              <View key={index} style={styles.keyRolesItem}><Text style={styles.keyRolesNumber}>{index + 1}. </Text><Text style={{flex: 1}}>{item.trim()}</Text></View>
                          ))}
                      </View>
                  ) : ( <Text style={{ color: '#888' }}>N/A</Text> )}
             </View>

             <Text style={styles.sectionTitle}>F. Benefits' details of your current employment</Text>
             <View style={styles.benefitsGrid}>
                  <View style={styles.benefitItem}><Text style={styles.benefitLabel}>Vehicle (Car/Motorcycle):</Text><Text style={styles.benefitValue}><Checkbox checked={benefits.vehicleProvided}/> Yes <Checkbox checked={!benefits.vehicleProvided}/> No {benefits.vehicleProvided ? <Text style={styles.benefitDetail}>({benefits.vehicleType}: {benefits.vehicleDetails || 'N/A'})</Text> : ''}</Text></View>
                  <View style={styles.benefitItem}><Text style={styles.benefitLabel}>Buy Back Option:</Text><Text style={styles.benefitValue}><Checkbox checked={benefits.buyBackOption}/> Yes <Checkbox checked={!benefits.buyBackOption}/> No</Text></View>
                  <View style={styles.benefitItem}><Text style={styles.benefitLabel}>Bonus:</Text><Text style={styles.benefitValue}><Checkbox checked={benefits.bonus}/> Yes <Checkbox checked={!benefits.bonus}/> No {benefits.bonus ? <Text style={styles.benefitDetail}>(No: {benefits.bonusDetails || 'N/A'}, Based on: {benefits.bonusBasedOn || 'N/A'})</Text> : ''}</Text></View>
                  <View style={styles.benefitItem}><Text style={styles.benefitLabel}>Leave Fare Assistance:</Text><Text style={styles.benefitValue}><Checkbox checked={benefits.lfa}/> Yes <Checkbox checked={!benefits.lfa}/> No {benefits.lfa ? <Text style={styles.benefitDetail}>(Based on: {benefits.lfaBasedOn || 'N/A'})</Text> : ''}</Text></View>
                  <View style={styles.benefitItem}><Text style={styles.benefitLabel}>Gratuity:</Text><Text style={styles.benefitValue}><Checkbox checked={benefits.gratuity}/> Yes <Checkbox checked={!benefits.gratuity}/> No {benefits.gratuity ? <Text style={styles.benefitDetail}>(Based on: {benefits.gratuityBasedOn || 'N/A'})</Text> : ''}</Text></View>
                  <View style={styles.benefitItem}><Text style={styles.benefitLabel}>Provident Fund:</Text><Text style={styles.benefitValue}><Checkbox checked={benefits.providentFund}/> Yes <Checkbox checked={!benefits.providentFund}/> No {benefits.providentFund ? <Text style={styles.benefitDetail}>(Starts: {benefits.providentFundStartDate || 'N/A'})</Text> : ''}</Text></View>
                  <View style={styles.benefitItem}><Text style={styles.benefitLabel}>Health Insurance:</Text><Text style={styles.benefitValue}><Checkbox checked={benefits.healthInsurance}/> Yes <Checkbox checked={!benefits.healthInsurance}/> No</Text></View>
                  <View style={styles.benefitItem}><Text style={styles.benefitLabel}>OPD:</Text><Text style={styles.benefitValue}><Checkbox checked={benefits.opd}/> Yes <Checkbox checked={!benefits.opd}/> No {benefits.opd ? <Text style={styles.benefitDetail}>(Amount: {formatCurrency(benefits.opdMonthlyAmount)})</Text> : ''}</Text></View>
                  <View style={styles.benefitItem}><Text style={styles.benefitLabel}>Fuel Entitlement:</Text><Text style={styles.benefitValue}><Checkbox checked={benefits.fuelEntitlement}/> Yes <Checkbox checked={!benefits.fuelEntitlement}/> No {benefits.fuelEntitlement ? <Text style={styles.benefitDetail}>(Limit: {benefits.fuelLimitPerMonth || 'N/A'})</Text> : ''}</Text></View>
                  <View style={styles.benefitItem}><Text style={styles.benefitLabel}>Cell Entitlement:</Text><Text style={styles.benefitValue}><Checkbox checked={benefits.cellEntitlement}/> Yes <Checkbox checked={!benefits.cellEntitlement}/> No {benefits.cellEntitlement ? <Text style={styles.benefitDetail}>(Limit: {benefits.cellLimitPerMonth || 'N/A'})</Text> : ''}</Text></View>
                  <View style={styles.benefitItem}><Text style={styles.benefitLabel}>Sales Incentive:</Text><Text style={styles.benefitValue}><Checkbox checked={benefits.salesIncentive}/> Yes <Checkbox checked={!benefits.salesIncentive}/> No {benefits.salesIncentive ? <Text style={styles.benefitDetail}>(Avg: {formatCurrency(benefits.salesIncentiveMonthlyAverage)})</Text> : ''}</Text></View>
             </View>
             <Text style={[styles.fieldLabel, {marginTop: 5}]}>Additional Benefits:</Text>
             <View style={styles.textBox}><Text>{benefits.additionalBenefits || 'N/A'}</Text></View>
         </Page>

         {/* --- PAGE 5 --- */}
          <Page size="A4" style={styles.page} wrap>
             <Text style={styles.sectionTitle} break>G. Blood Relative in Company / Group</Text>
             <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeaderRow]} fixed>
                      <View style={[styles.tableCol, styles.colRelName]}><Text style={styles.tableHeaderCell}>Name</Text></View>
                      <View style={[styles.tableCol, styles.colRelDesig]}><Text style={styles.tableHeaderCell}>Designation</Text></View>
                      <View style={[styles.tableCol, styles.colRelComp]}><Text style={styles.tableHeaderCell}>Company</Text></View>
                      <View style={[styles.tableCol, styles.colRelLoc]}><Text style={styles.tableHeaderCell}>Location</Text></View>
                      <View style={[styles.tableCol, styles.colRelRel]}><Text style={styles.tableHeaderCell}>Relationship</Text></View>
                  </View>
                   {(formData.bloodRelativesInCompany?.length || 0) > 0 ? formData.bloodRelativesInCompany.map((rel, index) => (
                       <View key={index} style={styles.tableRow} wrap={false}>
                           <View style={[styles.tableCol, styles.colRelName]}><Text style={styles.tableCell}>{rel.name || ''}</Text></View>
                           <View style={[styles.tableCol, styles.colRelDesig]}><Text style={styles.tableCell}>{rel.designation || ''}</Text></View>
                           <View style={[styles.tableCol, styles.colRelComp]}><Text style={styles.tableCell}>{rel.company || ''}</Text></View>
                           <View style={[styles.tableCol, styles.colRelLoc]}><Text style={styles.tableCell}>{rel.location || ''}</Text></View>
                           <View style={[styles.tableCol, styles.colRelRel]}><Text style={styles.tableCell}>{rel.relationship || ''}</Text></View>
                       </View>
                   )) : (
                     <View style={styles.tableRow}><View style={[styles.tableCol, { width: '100%' }]}><Text style={[styles.tableCell, { fontStyle: 'italic', color: '#888' }]}>No blood relatives declared.</Text></View></View>
                  )}
                  {renderEmptyRows(Math.max(0, 3 - (formData.bloodRelativesInCompany?.length || 0)), relCols)}
             </View>
             <View style={styles.infoItemFull}>
                 <Text style={styles.fieldLabel}>Have you ever applied / worked in this Organization?</Text>
                 <Text style={styles.fieldValue}>
                     <Checkbox checked={formData.appliedBefore}/> Yes <Checkbox checked={!formData.appliedBefore}/> No
                     {formData.appliedBefore ? ` (Details: ${formData.appliedBeforeDetails || 'N/A'})` : ''}
                 </Text>
             </View>
             <View style={styles.infoItemFull}><Text style={styles.fieldLabel}>Name of your relative or friend who is working or have previously worked in this Organization:</Text> <Text style={styles.fieldValue}>{formData.relativeOrFriendInCompany || 'N/A'}</Text></View>
              <View style={styles.infoItemFull}>
                  <Text style={styles.fieldLabel}>Besides the job, do you have other means of subsistence of your family and yourself?</Text>
                  <Text style={styles.fieldValue}>
                     <Checkbox checked={formData.otherMeansOfSubsistence}/> Yes <Checkbox checked={!formData.otherMeansOfSubsistence}/> No
                     {formData.otherMeansOfSubsistence ? ` (Details: ${formData.otherMeansOfSubsistenceDetails || 'N/A'})` : ''}
                  </Text>
             </View>
             <View style={styles.infoItemFull}><Text style={styles.fieldLabel}>Notice period with current employer:</Text> <Text style={styles.fieldValue}>{formData.noticePeriod || 'N/A'}</Text></View>

            <Text style={styles.sectionTitle}>H. REFERENCES</Text>
            <Text style={styles.subSectionNote}>Please provide one reference of your previous Employer and atleast two of respectable persons like Businessmen, Professors, Lawyers, Doctors, Government officials etc. References of relatives are not admissible. Company may contact the mentioned references in case of your consideration for employment.</Text>
             <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeaderRow]} fixed>
                      <View style={[styles.tableCol, styles.colRefName]}><Text style={styles.tableHeaderCell}>Name</Text></View>
                      <View style={[styles.tableCol, styles.colRefOcc]}><Text style={styles.tableHeaderCell}>Occupation/ Designation</Text></View>
                      <View style={[styles.tableCol, styles.colRefAdd]}><Text style={styles.tableHeaderCell}>Address</Text></View>
                      <View style={[styles.tableCol, styles.colRefPh]}><Text style={styles.tableHeaderCell}>Phone No / Mobile No.</Text></View>
                  </View>
                   {(formData.references?.length || 0) > 0 ? formData.references.map((ref, index) => (
                       <View key={index} style={styles.tableRow} wrap={false}>
                           <View style={[styles.tableCol, styles.colRefName]}><Text style={styles.tableCell}>{ref.name || ''}</Text></View>
                           <View style={[styles.tableCol, styles.colRefOcc]}><Text style={styles.tableCell}>{ref.occupation || ''}</Text></View>
                           <View style={[styles.tableCol, styles.colRefAdd]}><Text style={styles.tableCell}>{ref.address || ''}</Text></View>
                           <View style={[styles.tableCol, styles.colRefPh]}><Text style={styles.tableCell}>{ref.phone || ''}</Text></View>
                       </View>
                   )) : (
                       <View style={styles.tableRow}><View style={[styles.tableCol, { width: '100%' }]}><Text style={[styles.tableCell, { fontStyle: 'italic', color: '#888' }]}>No references provided.</Text></View></View>
                   )}
                  {renderEmptyRows(Math.max(0, 3 - (formData.references?.length || 0)), refCols)}
             </View>
              <View style={styles.infoItemFull}>
                  <Text style={styles.fieldLabel}>Can you submit written undertakings from them, if required, in the event of your getting this post?</Text>
                  <Text style={styles.fieldValue}>
                     <Checkbox checked={formData.canSubmitReferenceUndertakings}/> Yes <Checkbox checked={!formData.canSubmitReferenceUndertakings}/> No
                  </Text>
             </View>

            {/* Declaration */}
            <View style={styles.declarationBox} wrap={false}> {/* Prevent breaking inside box */}
                <Text style={styles.declarationTitle}>Declaration by Applicant</Text>
                <Text>
                    I certify that the information given herein is true and complete to the best of my knowledge. I authorize company or its nominated vendor/third party to make investigations and inquiries of my personal, employment, financial or medical history and other related matters, mentioned in this form, as may be necessary in arriving at an employment decision. In the event of employment, I understand that any false or misleading information given in my application or interview shall result in discharge. I agree to abide by the rules and regulations of the Organization.
                </Text>
                <View style={styles.signatureArea}>
                    <Text>Date: <Text style={{ textDecoration: 'underline' }}>{formatDate(formData.submissionDate)}</Text></Text>
                    <Text>Signature of Applicant <Text style={styles.signatureLine}>(Electronically Submitted via Portal)</Text></Text>
                </View>
            </View>
         </Page>
    </Document>
)};

export default EmploymentFormDocument;