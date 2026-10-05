// Words for the Segen Jobs pages. Kept apart from the academy text in
// i18n.tsx and merged into it there. Tigrinya is a first draft for Dleat to
// correct; anything missing falls back to English.

export const jobsEn = {
  navJobs: 'Jobs',
  jBrand: 'SEGEN JOBS',
  jFind: 'Find work', jPost: 'Post a job', jMine: 'My jobs', jEditor: 'Editor profile',

  // home
  jEyebrow: 'Segen Jobs', jH1a: 'Get your video edited', jH1b: 'by a Segen editor.',
  jLede: 'Post your video job, get offers from editors trained and tested by Segen Editing Academy, and choose the best one. Dleat stands in the middle, so your money and your editor are both safe.',
  jClientsT: 'For clients', jEditorsT: 'For editors',
  jC1: 'Post your job and share your footage link.',
  jC2: 'Editors send you offers. Pick the one you like.',
  jC3: 'Watch a watermarked preview of the edit.',
  jC4: 'Pay Dleat by Telebirr or bank and download the full video.',
  jC5: '3 free correction rounds are included in every job.',
  jE1: 'Finish a Segen course and get your certificate.',
  jE2: 'Apply here. Dleat tests you before you can take jobs.',
  jE3: 'Send offers on open jobs. The client chooses.',
  jE4: 'You get half as soon as the client pays, and the rest when the client accepts the work. Segen keeps 15%.',
  jPostCta: 'Post a job', jApplyCta: 'Become an editor',
  jOpenJobs: 'Open jobs', jNoOpen: 'No open jobs right now. New jobs appear here.',
  jEditorsOnly: 'Open jobs are shown to editors that Dleat has approved.',

  // post a job
  jTitle: 'Job title', jTitlePh: 'For example: Wedding highlight video, 5 minutes',
  jDesc: 'What do you need?', jDescPh: 'Length, style, music, where it will be posted, anything the editor should know',
  jFootage: 'Link to your footage (Google Drive, Dropbox, ...)', jFootageHelp: 'Only the editor you choose and Dleat can see this link.',
  jBudget: 'Your budget (optional)', jCurrency: 'Currency', jDeadline: 'Deadline (optional)',
  jTerms: 'Every job includes 3 free correction rounds. You pay Dleat after you see the preview, and you can download the full video once your payment is approved.',
  jSubmitJob: 'Post job', jPosted: 'Your job is posted. Editors will send offers.',

  // job page
  jStatus_open: 'Taking offers', jStatus_working: 'Editor is working', jStatus_review: 'Ready to check',
  jStatus_done: 'Finished', jStatus_cancelled: 'Cancelled',
  jBudgetL: 'Budget', jDeadlineL: 'Deadline', jPriceL: 'Price', jPostedOn: 'Posted',
  jOffers: 'Offers', jNoOffers: 'No offers yet. Editors who are approved by Dleat will send them here.',
  jDaysN: 'days', jPortfolio: 'See their work', jChoose: 'Choose this editor',
  jChooseConfirm: 'Choose this editor? The other offers will be closed.',
  jCancel: 'Cancel job', jCancelConfirm: 'Cancel this job?',
  jSendOffer: 'Send your offer', jYourPrice: 'Your price', jYourDays: 'Days you need', jOfferMsg: 'Message to the client',
  jOfferMsgPh: 'How you will edit it, similar work you have done',
  jOfferSent: 'Your offer is sent. The client will choose.', jWithdraw: 'Take back my offer',
  jOfferDeclined: 'The client chose another editor.',
  jFootageL: 'Footage', jCorrectionsL: 'Free corrections used',
  jVersions: 'Versions', jVersionN: 'Version', jPreviewOnly: 'Preview only. The full video unlocks after payment.',
  jDownload: 'Download full video', jNoVersion: 'The editor has not sent a version yet.',
  jDeliver: 'Send a version', jPreviewLink: 'Preview link (unlisted YouTube, with the SEGEN PREVIEW watermark)',
  jFinalLink: 'Full video link (Google Drive or similar, no watermark)', jFinalHelp: 'The client sees this link only after their payment is approved.',
  jDeliverNote: 'Note for the client (optional)', jDeliverSend: 'Send version', jWatermark: 'Download the watermark picture',
  jWaitClient: 'The client is checking your version.',
  jAskChange: 'Ask for changes', jChangePh: 'Write exactly what should change', jSendChange: 'Send correction',
  jFreeLeft: 'free corrections left', jNoFreeLeft: 'All 3 free corrections are used. Contact Dleat to ask for more.',
  jCorrection: 'Correction', jAccept: 'I am happy, finish the job', jAcceptConfirm: 'Finish this job? The editor will be paid.',
  jPayTitle: 'Pay for this job', jPayWaiting: 'Your payment is waiting for Dleat to approve it.',
  jPaid: 'Paid. You can download the full video.', jPayRejected: 'Your payment was not approved',
  jPayAfterPreview: 'You can pay after the editor sends the first preview.',
  jDoneMsg: 'This job is finished. Thank you!',
  jEditorPay: 'Your pay', jEditorHalf: 'First half', jEditorRest: 'Rest after the client accepts', jPaidOut: 'paid', jNotYet: 'not yet',
  jNotFound: 'This job was not found, or it is not open to you.',

  // my jobs
  jMyPosted: 'Jobs I posted', jMyWork: 'Jobs I am editing', jMyOffers: 'My offers', jNothing: 'Nothing here yet.',

  // editor
  jApplyTitle: 'Become a Segen editor',
  jApplyLede: 'Only editors with a Segen certificate who also pass Dleat\'s test can take jobs here. Send your details and Dleat will contact you for the test.',
  jName: 'Name shown to clients', jCoursesDone: 'Which Segen courses did you finish?', jPortfolioL: 'Link to your best work (YouTube, Drive, Instagram...)',
  jAbout: 'About you', jApplySend: 'Send application', jApplyUpdate: 'Update my details',
  jEd_waiting: 'Your application is waiting. Dleat will contact you for the test.',
  jEd_approved: 'You are an approved Segen editor. You can send offers on open jobs.',
  jEd_rejected: 'Your application was not approved yet.',
}

type JobsDict = typeof jobsEn

export const jobsTi: Partial<JobsDict> = {
  navJobs: 'ስራሕ',
  jFind: 'ስራሕ ድለ', jPost: 'ስራሕ ለጥፍ', jMine: 'ስራሓተይ', jEditor: 'ናይ ኤዲተር ፕሮፋይል',
  jEyebrow: 'ሰገን ስራሕ', jH1a: 'ቪድዮኻ ኣርትዕ', jH1b: 'ብሰገን ኤዲተር።',
  jClientsT: 'ንዓማዊል', jEditorsT: 'ንኤዲተራት',
  jPostCta: 'ስራሕ ለጥፍ', jApplyCta: 'ኤዲተር ኩን',
  jOpenJobs: 'ክፉት ስራሓት',
  jOffers: 'ዋጋታት', jChoose: 'ነዚ ኤዲተር ምረጽ',
  jVersions: 'ቨርሽናት', jDownload: 'ምሉእ ቪድዮ ኣውርድ',
  jAskChange: 'ለውጢ ሕተት', jPayTitle: 'ነዚ ስራሕ ክፈል',
  jMyPosted: 'ዝለጠፍክዎም ስራሓት', jMyWork: 'ዘርትዖም ዘለኹ ስራሓት', jMyOffers: 'ዋጋታተይ',
  jApplyTitle: 'ሰገን ኤዲተር ኩን',
}
