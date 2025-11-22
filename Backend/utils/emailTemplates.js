export const getApplicationReceivedEmail = (jobTitle) => {
  return {
    subject: `Application Received - ${jobTitle}`,
    text: `Thank you for applying for ${jobTitle}. We have successfully received your application and our recruitment team will review it shortly.`,
    html: `
      <p>Dear Candidate,</p>
      <p>Thank you for applying for the position of <b>${jobTitle}</b>.</p>
      <p>We have successfully received your application and our recruitment team will review it shortly.</p>
      <p>Best regards,<br/>Master Motor HR Team</p>
    `,
  };
};

export const getStatusEmail = (statusCode, jobTitle, note) => {
  switch (statusCode) {
    case "applied":
      return {
        subject: `Application Received - ${jobTitle}`,
        text: `Thank you for applying for ${jobTitle}. We have successfully received your application and our recruitment team will review it shortly.`,
        html: `
          <p>Dear Candidate,</p>
          <p>Thank you for applying for the position of <b>${jobTitle}</b>.</p>
          <p>We have successfully received your application and our recruitment team will review it shortly.</p>
          <p>Best regards,<br/>Master Motor HR Team</p>
        `,
      };

    case "shortlisted":
      return {
        subject: `You’ve been shortlisted for ${jobTitle}`,
        text: `Congratulations! You have been shortlisted for ${jobTitle}. ${
          note || ""
        }`,
        html: `
          <p>Dear Candidate,</p>
          <p>Congratulations! You have been <b>shortlisted</b> for the position of <b>${jobTitle}</b>.</p>
          <p>Our team will be in touch with further steps soon.</p>
          <p>Best regards,<br/>Master Motor HR Team</p>
        `,
      };

    case "first-interview":
      return {
        subject: `Interview Invitation - ${jobTitle} at Master Motor`,
        text: `You are invited for your first interview for ${jobTitle}. ${
          note || ""
        }`,
        html: `
          <p>Dear Candidate,</p>
          <p>You are invited for your <b>first interview</b> for the role of <b>${jobTitle}</b>.</p>
          <p>Please confirm your availability at your earliest convenience.</p>
          <p>Best regards,<br/>Master Motor HR Team</p>
        `,
      };

    case "second-interview":
      return {
        subject: `Second Interview Invitation - ${jobTitle} at Master Motor`,
        text: `You are invited for a second interview for ${jobTitle}.`,
        html: `
          <p>Dear Candidate,</p>
          <p>We are pleased to invite you for a <b>second interview</b> for the role of <b>${jobTitle}</b>.</p>
          <p>We look forward to meeting you again.</p>
          <p>Best regards,<br/>Master Motor HR Team</p>
        `,
      };

    case "rejected":
      return {
        subject: `Application Update - ${jobTitle}`,
        text: `We regret to inform you that your application for ${jobTitle} was not successful.`,
        html: `
          <p>Dear Candidate,</p>
          <p>We regret to inform you that your application for the position of <b>${jobTitle}</b> was not successful at this time.</p>
          <p>We truly appreciate your interest in Master Motor and encourage you to apply for future opportunities with us.</p>
          <p>Best regards,<br/>Master Motor HR Team</p>
        `,
      };

    case "offer":
      return {
        subject: `Job Offer - ${jobTitle}`,
        text: `Congratulations! You have been selected for ${jobTitle}. ${
          note || ""
        }`,
        html: `
          <p>Dear Candidate,</p>
          <p>Congratulations! We are delighted to offer you the position of <b>${jobTitle}</b>.</p>
          <p>Our HR team will reach out with your offer letter and next steps.</p>
          <p>Best regards,<br/>Master Motor HR Team</p>
        `,
      };

    case "offer-accepted":
      return {
        subject: `Offer Accepted - ${jobTitle}`,
        text: `Thank you for accepting the offer for ${jobTitle}. We look forward to welcoming you!`,
        html: `
          <p>Dear Candidate,</p>
          <p>Thank you for accepting our offer for the role of <b>${jobTitle}</b>. We are excited to have you join the Master Motor family!</p>
          <p>Our onboarding team will be in touch with further details.</p>
          <p>Best regards,<br/>Master Motor HR Team</p>
        `,
      };

    case "offer-rejected":
      return {
        subject: `Offer Declined - ${jobTitle}`,
        text: `We have received your response declining the offer for ${jobTitle}.`,
        html: `
          <p>Dear Candidate,</p>
          <p>We have received your response declining the offer for the position of <b>${jobTitle}</b>.</p>
          <p>We respect your decision and wish you success in your future endeavors.</p>
          <p>Best regards,<br/>Master Motor HR Team</p>
        `,
      };

    case "medical":
      return {
        subject: `Medical Examination Required - ${jobTitle}`,
        text: `As part of the hiring process for ${jobTitle}, please complete your medical examination. ${
          note || ""
        }`,
        html: `
          <p>Dear Candidate,</p>
          <p>As part of the hiring process for the position of <b>${jobTitle}</b>, we kindly request you to complete your <b>medical examination</b>.</p>
          <p>Best regards,<br/>Master Motor HR Team</p>
        `,
      };

    case "onboarding":
      return {
        subject: `Onboarding Process - ${jobTitle}`,
        text: `Welcome aboard! Your onboarding process for ${jobTitle} has started. ${
          note || ""
        }`,
        html: `
          <p>Dear Candidate,</p>
          <p>Welcome aboard! We are excited to start your <b>onboarding process</b> for the role of <b>${jobTitle}</b>.</p>
          <p>Best regards,<br/>Master Motor HR Team</p>
        `,
      };

    case "hired":
      return {
        subject: `Welcome to Master Motor - ${jobTitle}`,
        text: `Congratulations! You are officially hired as ${jobTitle}.`,
        html: `
          <p>Dear Candidate,</p>
          <p>Congratulations! You are officially <b>hired</b> as <b>${jobTitle}</b>.</p>
          <p>We are thrilled to have you on board and look forward to your contributions.</p>
          <p>Welcome to the Master Motor family!</p>
          <p>Best regards,<br/>Master Motor HR Team</p>
        `,
      };

    default:
      return {
        subject: `Application Update - ${jobTitle}`,
        text: `Your application status for ${jobTitle} has been updated to ${statusCode}. ${
          note || ""
        }`,
        html: `
          <p>Dear Candidate,</p>
          <p>Your application status for <b>${jobTitle}</b> has been updated to <b>${statusCode}</b>.</p>
          <p>Best regards,<br/>Master Motor HR Team</p>
        `,
      };
  }
};