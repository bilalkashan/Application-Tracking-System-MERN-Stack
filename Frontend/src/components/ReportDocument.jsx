import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import logoUrl from "../assets/MMC-Logo.png";
import defaultAvatar from "../assets/MMC-Logo.png";
import { fileUrl } from '../api';

// --- HELPERS ---
const formatCurrency = (value) => {
    const numValue = Number(value);
    if (isNaN(numValue) || numValue === 0) return '-';
    return `Rs. ${numValue.toLocaleString()}/-`;
};
const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-GB');
};
const formatDateTime = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
};
const formatStatusCode = (code) => {
    if (!code) return "Unknown";
    return code.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};
const calculateDaysToClose = (startDate, endDate) => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? 1 : diffDays;
};

// --- STYLES ---
const styles = StyleSheet.create({
    page: {
        fontFamily: 'Times-Roman',
        fontSize: 11,
        paddingTop: 80, // Increased top padding to make space for fixed header
        paddingBottom: 70,
        paddingHorizontal: 35,
        color: '#000000',
    },
    // --- PDF PIC FIX: Updated Header styles ---
    header: {
        position: 'absolute',
        top: 30,
        left: 35,
        right: 35,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center', // Changed from flex-start
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#c0c0c0',
        paddingBottom: 10,
    },
    headerLeft: { 
        flexDirection: 'row', 
        alignItems: 'center' 
    },
    headerRight: { 
        width: '50%', 
        textAlign: 'right',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    logo: { width: 180, marginRight: 10 },
    headerProfilePic: { // Added style for fixed pic
        width: 40,
        height: 40,
        borderRadius: 20,
        objectFit: 'cover',
        marginLeft: 10,
    },
    // --- End Pic Fix ---
    title: { fontSize: 18, fontFamily: 'Times-Roman', fontWeight: 'bold', textAlign: 'right' },
    subtitle: { fontSize: 11, textAlign: 'right', color: '#000000' },
    daysToCloseText: { fontSize: 11, textAlign: 'right', color: 'red', marginTop: 3 },

    section: {
        marginBottom: 18,
    },
    sectionTitle: {
        marginTop: 15,
        fontSize: 13,
        fontFamily: 'Times-Roman', fontWeight: 'bold',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 5,
        color: '#000000',
    },
    sectionTitleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 5,
    },
    sectionTitleText: {
        fontSize: 13,
        fontFamily: 'Times-Roman', fontWeight: 'bold',
        color: '#000000',
    },
    scoreBadge: {
        backgroundColor: '#e0e0e0',
        color: '#000000',
        fontFamily: 'Times-Roman',
        fontSize: 11,
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 4,
    },
    
    page1TopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    employmentNoteContainer: { width: '100%' }, // Changed to 100%
    employmentNoteText: { fontSize: 11, lineHeight: 1.5 },
    boldText: { fontFamily: 'Times-Roman' },
    // Removed profilePicContainerPage1

    detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    detailLabel: { color: '#000000', width: '40%' },
    detailValue: { fontFamily: 'Times-Roman', fontWeight: 'bold', textAlign: 'right', width: '60%' },

    hiredCandidateHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 15, gap: 10 },
    profilePicPage2: { width:80, height: 100, borderRadius: 4, objectFit: 'cover' },
    hiredCandidateInfo: { flex: 1 },

    journeyItem: { flexDirection: 'row', marginBottom: 4 },
    journeyDate: { width: '40%', color: '#000000', fontSize: 9 },
    journeyEvent: { fontFamily: 'Times-Roman', fontWeight: 'bold', textTransform: 'capitalize' },

    remarkCard: {
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 3,
        padding: 10,
        marginBottom: 10,
        backgroundColor: '#f9f9f9',
    },
    remarkHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        fontSize: 11,
        fontFamily: 'Times-Roman', fontWeight: 'bold',
        marginBottom: 8,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    remarkInterviewer: { color: '#000000', maxWidth: '70%', fontFamily: 'Times-Roman' },
    remarkDate: { color: '#000000', fontSize: 8, fontFamily: 'Times-Roman' },
    
    remarkDetailRow: {
        flexDirection: 'row',
        marginBottom: 4,
        fontSize: 9,
    },
    remarkDetailLabel: {
        fontFamily: 'Times-Roman',
        width: '35%',
        color: '#333',
    },
    remarkDetailValue: {
        fontFamily: 'Times-Roman',
        width: '65%',
        color: '#000',
    },
    remarkComment: {
        fontFamily: 'Helvetica-Oblique',
        fontSize: 11,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#eee',
        padding: 5,
        borderRadius: 2,
        marginTop: 4,
        marginBottom: 8,
    },

    table: {
        display: "table",
        width: "auto",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: '#bfbfbf',
        borderRightWidth: 0,
        borderBottomWidth: 0,
        marginTop: 8,
    },
    tableRow: {
        margin: "auto",
        flexDirection: "row",
    },
    tableColHeader: {
        width: "70%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: '#bfbfbf',
        borderLeftWidth: 0,
        borderTopWidth: 0,
        backgroundColor: '#f0f0f0',
        padding: 4,
    },
    tableColRatingHeader: {
        width: "30%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: '#bfbfbf',
        borderLeftWidth: 0,
        borderTopWidth: 0,
        backgroundColor: '#f0f0f0',
        padding: 4,
        textAlign: 'center',
    },
    tableCol: {
        width: "70%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: '#bfbfbf',
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 4,
    },
    tableColRating: {
        width: "30%",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: '#bfbfbf',
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 4,
        textAlign: 'center',
    },
    tableCell: {
        margin: "auto",
        fontSize: 9,
        fontFamily: 'Times-Roman',
    },
    tableCellHeader: {
        margin: "auto",
        fontSize: 9,
        fontFamily: 'Times-Roman',
    },

    sigContainer: { marginTop: 40, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    sigBlock: { width: '45%', borderTopWidth: 1, borderTopColor: '#000000', paddingTop: 6, marginTop: 35 },
    sigName: { fontFamily: 'Times-Roman', fontWeight: 'bold' },
    sigTitle: { fontSize: 9, color: '#000000' },
    sigLabel: { fontFamily: 'Times-Roman', fontWeight: 'bold', marginBottom: 3 },
    approvedText: { fontSize: 9, color: '#008000', fontFamily: 'Times-Roman', fontWeight: 'bold', marginLeft: 4 },

    footer: { position: 'absolute', bottom: 30, left: 35, right: 35, textAlign: 'center', color: '#000000', fontSize: 8 },
    footerText: { marginBottom: 2 },
    pageNumber: { textAlign: 'right' },
});


// --- COMPONENTS ---
const DetailRow = ({ label, value }) => (
    <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}:</Text>
        <Text style={styles.detailValue}>{value || '-'}</Text>
    </View>
);

// --- FIX #1: Helper for approval line ---
const getApprovalLine = (approval) => {
    const status = approval?.status || 'pending';
    const name = approval?.reviewer?.name;
    const date = formatDateTime(approval?.reviewedAt); // Use DateTime for PDF

    if (status === 'pending') return `(pending) ...`;
    // If status is approved/rejected but reviewer name is missing
    if (!name) return `(${status}) N/A on ${date}`;
    return `${name} (${status}) on ${date}`;
};
// --- END FIX #1 ---


const ReportDocument = ({ report }) => {
    const { job, stats, hiredApplication } = report;
    const requisition = job?.requisition;

    const profilePicUri = hiredApplication?.applicantProfile?.profilePicture
        ? fileUrl(hiredApplication.applicantProfile.profilePicture)
        : defaultAvatar;

    const daysToClose = calculateDaysToClose(job?.createdAt, job?.closedAt);

    const scoreText = typeof hiredApplication?.matchingScore === 'number'
        ? `${hiredApplication.matchingScore}% Match`
        : 'Score N/A';

    return (
        <Document title={`Hiring Report - ${job?.title}`}>
            <Page size="A4" style={styles.page}>
                <View style={styles.header} fixed>
                    <View style={styles.headerLeft}>
                        <Image src={logoUrl} style={styles.logo} />
                    </View>
                    <View style={styles.headerRight}>
                         <View style={{textAlign: 'right'}}>
                            <Text style={styles.title}>Hiring Lifecycle Report</Text>
                            <Text style={styles.subtitle}>{job?.title}</Text>
                            {daysToClose !== null && (<Text style={styles.daysToCloseText}>Position Closed in {daysToClose} days</Text>)}
                            {daysToClose === null && hiredApplication && (<Text style={styles.daysToCloseText}>Hired on: {formatDate(hiredApplication.currentStatus?.at)}</Text>)}
                            {daysToClose === null && !hiredApplication && (<Text style={styles.daysToCloseText}>Position Open</Text>)}
                         </View>
                    </View>
                </View>

                {/* --- PDF PIC FIX: Profile Pic and Score with Employment Note --- */}
                <View style={styles.page1TopRow}>
                    <View style={styles.employmentNoteContainer}>
                        <Text style={styles.sectionTitle}>Employment Note</Text>
                        <View style={{ flexDirection: 'row', gap: 15 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.employmentNoteText}>
                                    Reference to the subsequent interviews for the position of <Text style={styles.boldText}>{job?.title}</Text> for MMCL, we have selected <Text style={styles.boldText}>{hiredApplication?.applicant?.name}</Text>.
                                </Text>
                            </View>
                            {hiredApplication && (
                                <View style={{ alignItems: 'center', height: 100 }}>
                                    <Image style={styles.profilePicPage1} src={{ uri: profilePicUri }} />
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* --- FIX #3: Salary and Hiring Status --- */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { fontSize: 11 }]}>Final Offer Details</Text>
                    <DetailRow label="Designation" value={hiredApplication?.offer?.designation} />
                    <DetailRow label="Grade" value={hiredApplication?.offer?.grade} />
                    <DetailRow label="Department" value={hiredApplication?.offer?.department} />
                    <DetailRow label="Location" value={hiredApplication?.offer?.location} />
                    <DetailRow label="Current Salary" value={formatCurrency(hiredApplication?.employmentFormData?.currentSalary)} />
                    <DetailRow label="Expected Salary" value={formatCurrency(hiredApplication?.employmentFormData?.expectedSalary)} />
                    <DetailRow label="Offered Salary" value={formatCurrency(hiredApplication?.offer?.offeredSalary)} />
                    <DetailRow label="Vehicle Entitlement" value={hiredApplication?.offer?.vehicleEntitlement} />
                    <DetailRow label="System Requirement" value={hiredApplication?.offer?.systemRequirement} />
                    <DetailRow label="Mobile Allowance" value={hiredApplication?.offer?.mobileAllowance} />
                    <DetailRow label="Fuel Allowance" value={`${hiredApplication?.offer?.fuelAllowance || 0} Liter`} />
                    <DetailRow label="Requisition Type" value={requisition?.requisitionType} />
                </View>
                {/* --- END FIX #3 --- */}

                <View style={styles.sigContainer}>
                    <View style={styles.sigBlock}><Text style={styles.sigLabel}>Prepared By:</Text><Text style={styles.sigName}>Syed Pervaiz Ahmed <Text style={styles.approvedText}>(Approved)</Text></Text><Text style={styles.sigTitle}>HR</Text></View>
                    <View style={styles.sigBlock}><Text style={styles.sigLabel}>Reviewed By:</Text><Text style={styles.sigName}>Kashif Qurban <Text style={styles.approvedText}>(Approved)</Text></Text><Text style={styles.sigTitle}>Assistant General Human Resource</Text></View>
                    <View style={styles.sigBlock}><Text style={styles.sigLabel}>Reviewed By:</Text><Text style={styles.sigName}>Muhammad Shoeb Khan <Text style={styles.approvedText}>(Approved)</Text></Text><Text style={styles.sigTitle}>Head of Human Resource</Text></View>
                    <View style={styles.sigBlock}><Text style={styles.sigLabel}>Approved By:</Text><Text style={styles.sigName}>Raza Ansari <Text style={styles.approvedText}>(Approved)</Text></Text><Text style={styles.sigTitle}>COO</Text></View>
                </View>

                {hiredApplication ? (
                    <View style={styles.section} break>
                        {/* --- PDF PIC FIX: Profile Pic Inline with Title --- */}
                        <View style={styles.hiredCandidateHeader}>
                            <Image style={styles.profilePicPage2} src={{ uri: profilePicUri }} />
                            <View style={styles.hiredCandidateInfo}>
                                <View style={styles.sectionTitleContainer}>
                                    <Text style={styles.sectionTitleText}>Shortlisted Candidate Profile: {hiredApplication.applicant?.name}</Text>
                                    <Text style={styles.scoreBadge}>{scoreText}</Text>
                                </View>
                                <DetailRow label="Email" value={hiredApplication.applicant?.email} />
                                <DetailRow label="Contact" value={hiredApplication.applicantProfile?.contactNumber} />
                                <DetailRow label="Applied On" value={formatDate(hiredApplication.createdAt)} />
                            </View>
                        </View>
                        
                        {/* --- FIX #3: Pointing to correct salary fields --- */}
                        <DetailRow label="Education" value={hiredApplication.applicantProfile?.education?.[0]?.highestQualification} />
                        <DetailRow label="Total Experience" value={hiredApplication.applicantProfile?.experienceDetails?.[0]?.jobTitle} />
                        <DetailRow label="Skills" value={[...(hiredApplication.applicantProfile?.technicalSkills || []), ...(hiredApplication.applicantProfile?.softSkills || [])].join(', ')} />
                        <DetailRow
                            label="Profile Suitability"
                            value={typeof hiredApplication?.matchingScore === 'number' ? `${hiredApplication.matchingScore}%` : 'N/A'}
                        />
                        {/* --- END FIX #3 --- */}

                        {/* --- FIX #2: Candidate Journey --- */}
                        <Text style={[styles.sectionTitle, { marginTop: 15, fontSize: 11 }]}>Candidate Journey</Text>
                        {hiredApplication.history?.map((event, index) => (
                            <View key={index} style={styles.journeyItem}>
                                <Text style={styles.journeyDate}>{formatDateTime(event.at)}:</Text>
                                <Text style={styles.journeyEvent}>{formatStatusCode(event.code)}</Text>
                            </View>
                        ))}
                        {/* --- END FIX #2 --- */}
                        
                        {hiredApplication.remarks?.length > 0 && (
                            <View style={styles.section} break>
                                <Text style={[styles.sectionTitle, { marginTop: 25, fontSize: 11 }]}>Interview Remarks</Text>
                                {hiredApplication.remarks.map((remark, index) => (
                                    <View key={index} style={styles.remarkCard} wrap={false}>
                                        <View style={styles.remarkHeader}>
                                            <Text style={styles.remarkInterviewer}>
                                                {remark.interviewer?.name || 'N/A'}
                                            </Text>
                                            <Text style={styles.remarkDate}>{formatDate(remark.createdAt)}</Text>
                                        </View>
                                        
                                        <View style={[styles.remarkHeader, { borderBottomWidth: 0, marginBottom: 5 }]}>
                                            <Text style={[styles.remarkInterviewer, { fontSize: 8, fontFamily: 'Times-Roman', fontStyle: 'italic', color: '#555', textTransform: 'capitalize' }]}>
                                                Role: {remark.role || 'Interviewer'}
                                            </Text>
                                            <Text style={[styles.remarkDate, { fontFamily: 'Times-Roman', fontStyle: 'italic', color: '#555', textTransform: 'capitalize' }]}>
                                                {remark.interviewType || 'N/A'}
                                            </Text>
                                        </View>

                                        <View style={{ marginBottom: 8, borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 8 }}>
                                            <View style={styles.remarkDetailRow}>
                                                <Text style={styles.remarkDetailLabel}>Recommendation:</Text>
                                                <Text style={styles.remarkDetailValue}>{remark.recommendation || 'N/A'}</Text>
                                            </View>
                                             <View style={styles.remarkDetailRow}>
                                                <Text style={styles.remarkDetailLabel}>General Impression:</Text>
                                                <Text style={styles.remarkDetailValue}>{remark.generalImpression || 'N/A'}</Text>
                                            </View>
                                            {remark.comment && (
                                                <View style={{marginTop: 4}}>
                                                    <Text style={[styles.remarkDetailLabel, { width: '100%', marginBottom: 2}]}>Comment:</Text>
                                                    <Text style={styles.remarkComment}>"{remark.comment}"</Text>
                                                </View>
                                            )}
                                        </View>

                                        {remark.evaluations?.length > 0 && (
                                            <View style={{marginBottom: 8}}>
                                                <Text style={[styles.remarkDetailLabel, { fontSize: 9, marginBottom: 4}]}>Evaluation Summary:</Text>
                                                <View style={styles.table}>
                                                    <View style={styles.tableRow} fixed>
                                                        <View style={styles.tableColHeader}>
                                                            <Text style={styles.tableCellHeader}>Competency</Text>
                                                        </View>
                                                        <View style={styles.tableColRatingHeader}>
                                                            <Text style={styles.tableCellHeader}>Rating</Text>
                                                        </View>
                                                    </View>
                                                    {remark.evaluations.map((ev, i) => (
                                                        <View key={i} style={styles.tableRow}>
                                                            <View style={styles.tableCol}>
                                                                <Text style={styles.tableCell}>{ev.competency}</Text>
                                                            </View>
                                                            <View style={styles.tableColRating}>
                                                                <Text style={styles.tableCell}>{ev.rating} / 5</Text>
                                                            </View>
                                                        </View>
                                                    ))}
                                                </View>
                                                {remark.overallAverageScore && (
                                                    <Text style={{ textAlign: 'right', fontSize: 9, fontFamily: 'Times-Roman', marginTop: 4 }}>
                                                        Average Score: {Number(remark.overallAverageScore).toFixed(1)} / 5
                                                    </Text>
                                                )}
                                            </View>
                                        )}

                                        <View style={{ borderTopWidth: 1, borderColor: '#eee', paddingTop: 8 }}>
                                            <View style={styles.remarkDetailRow}>
                                                <Text style={styles.remarkDetailLabel}>Key Strengths:</Text>
                                                <Text style={styles.remarkDetailValue}>{remark.keyStrengths || 'N/A'}</Text>
                                            </View>
                                            <View style={styles.remarkDetailRow}>
                                                <Text style={styles.remarkDetailLabel}>Areas for Improvement:</Text>
                                                <Text style={styles.remarkDetailValue}>{remark.areasForImprovement || 'N/A'}</Text>
                                            </View>
                                            <View style={styles.remarkDetailRow}>
                                                <Text style={styles.remarkDetailLabel}>Motivation:</Text>
                                                <Text style={styles.remarkDetailValue}>{remark.motivationCareerAspiration || 'N/A'}</Text>
                                            </View>
                                            <View style={styles.remarkDetailRow}>
                                                <Text style={styles.remarkDetailLabel}>Expected Compensation:</Text>
                                                <Text style={styles.remarkDetailValue}>{remark.expectedCompensation || 'N/A'}</Text>
                                            </View>
                                            <View style={styles.remarkDetailRow}>
                                                <Text style={styles.remarkDetailLabel}>Notice Period:</Text>
                                                <Text style={styles.remarkDetailValue}>{remark.availabilityNoticePeriod || 'N/A'}</Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                    </View>
                ) : (
                    <View style={styles.section} break>
                        <Text style={styles.sectionTitle}>Hiring In Progress</Text>
                        <DetailRow label="Current Status" value="A candidate has not been hired for this position yet." />
                    </View>
                )}

                {/* --- FIX #1: Requisition Approval Timeline --- */}
                {requisition && (
                    <View style={styles.section} break>
                        <Text style={styles.sectionTitle}>Requisition Details (Req ID: {requisition.reqId})</Text>
                        <DetailRow label="Position" value={requisition.position} /><DetailRow label="Department" value={requisition.department} /><DetailRow label="Requested By" value={requisition.createdBy?.name} /><DetailRow label="Created At" value={formatDateTime(requisition.createdAt)} /><DetailRow label="Requisition Type" value={requisition.requisitionType} /><DetailRow label="Grade" value={requisition.grade} /><DetailRow label="Experience Required" value={requisition.experience} /><DetailRow label="Nature Of Employment" value={requisition.natureOfEmployment} /><DetailRow label="Salary" value={requisition.salary} /><DetailRow label="Location" value={requisition.location} /><DetailRow label="Desired Join Date" value={formatDate(requisition.desiredDateJoin)} />
                        <Text style={[styles.sectionTitle, { marginTop: 10, marginBottom: 4, fontSize: 11 }]}>Approval Timeline:</Text>
                        <DetailRow label="HOD" value={getApprovalLine(requisition.approvals?.departmentHead?.approval)} />
                        <DetailRow label="HR" value={getApprovalLine(requisition.approvals?.hr?.approval)} />
                        <DetailRow label="COO" value={getApprovalLine(requisition.approvals?.coo?.approval)} />
                    </View>
                )}
                {/* --- END FIX #1 --- */}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Job Details (Job ID: {job?.jobId})</Text>
                    <DetailRow label="Job Title" value={job?.title} /><DetailRow label="Location" value={job?.location} /><DetailRow label="Posted By" value={job?.createdBy?.name} /><DetailRow label="Created At" value={formatDateTime(job?.createdAt)} /><DetailRow label="Job Type" value={job?.type} /><DetailRow label="Experience Level" value={job?.experienceRequired} /><DetailRow label="Application Deadline" value={formatDate(job?.deadline)} /><DetailRow label="Total Applicants" value={stats?.totalApplicants} />
                </View>

                <View style={styles.footer} fixed>
                    <Text style={styles.footerText}>This is system generated report</Text>
                    <Text style={styles.footerText}>Developed by HR Department</Text>
                    <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
                </View>
            </Page>
        </Document>
    );
};

export default ReportDocument;