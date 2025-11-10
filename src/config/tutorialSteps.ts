// Tutorial step configurations for different user roles

export type PlacementType = 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface TutorialStep {
  target: string;  // CSS selector
  content: string;
  title: string;
  placement?: PlacementType;
  disableBeacon?: boolean;
}

export const studentTutorialSteps: TutorialStep[] = [
  {
    target: 'body',
    content: 'Welcome to SkillSync! 🎉 Let me show you around the platform and help you find your perfect internship.',
    title: 'Welcome, Student!',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="student-profile"]',
    content: 'This is your Profile page. Here you can upload your resume, add your education details, and control your profile visibility (public/private).',
    title: '👤 Your Profile',
    placement: 'bottom',
  },
  {
    target: '[data-tour="student-browse"]',
    content: 'Browse all available internships here. You can filter by location, skills, and more. The stipend amount is displayed on each card!',
    title: '🔍 Browse Internships',
    placement: 'bottom',
  },
  {
    target: '[data-tour="student-recommendations"]',
    content: 'Get AI-powered recommendations! Our AI analyzes your resume and matches you with the best internships. Click "Get AI Profile Tips" to improve your profile.',
    title: '✨ AI Recommendations',
    placement: 'bottom',
  },
  {
    target: '[data-tour="student-applications"]',
    content: 'Track all your applications here. See their status (applied, under review, selected, rejected) and message companies directly.',
    title: '📋 Your Applications',
    placement: 'bottom',
  },
  {
    target: '[data-tour="nav-overflow"]',
    content: 'Need more options? Click the “More” menu to reveal extra navigation links like Following, Search, and Messages.',
    title: '⋯ More Navigation',
    placement: 'bottom',
  },
  {
    target: '[data-tour="student-following"]',
    content: 'Keep tabs on the companies and topics you follow. You\'ll get notified when they post something new—internships themselves can\'t be followed anymore, so follow the company instead.',
    title: '🔔 Following & Alerts',
    placement: 'bottom',
  },
  {
    target: '[data-tour="search"]',
    content: 'Search for students or companies by their unique usernames or names. View public profiles and follow companies straight from the results.',
    title: '🔍 Search',
    placement: 'bottom',
  },
  {
    target: '[data-tour="messages"]',
    content: 'Use Messages to keep conversations going with companies. You can also reach out to other users directly from search results.',
    title: '💬 Messages',
    placement: 'left',
  },
  {
    target: '[data-tour="notifications"]',
    content: 'Get notified about application status updates, messages from companies, and new matching internships. You can customize notification preferences in settings.',
    title: '🔔 Notifications',
    placement: 'left',
  },
  {
    target: '[data-tour="carlos"]',
    content: 'Meet Carlos! Your AI assistant. Ask him anything like "show my profile" or "browse internships" and he\'ll help you navigate the platform.',
    title: '🤖 Carlos - AI Assistant',
    placement: 'left',
  },
  {
    target: 'body',
    content: 'That\'s it! You\'re all set. Start by completing your profile, then browse internships and apply. Good luck! 🚀',
    title: 'Ready to Go!',
    placement: 'center',
  },
];

export const companyTutorialSteps: TutorialStep[] = [
  {
    target: 'body',
    content: 'Welcome to SkillSync! 🎉 Let me show you how to find the perfect candidates for your internships.',
    title: 'Welcome, Company!',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="company-profile"]',
    content: 'This is your Company Profile. Add your logo, website, description, and unique username. Your profile is always public to attract talent!',
    title: '🏢 Company Profile',
    placement: 'bottom',
  },
  {
    target: '[data-tour="company-post"]',
    content: 'Post new internship opportunities here! Add title, description, requirements, stipend, deadline, and our AI will automatically tag relevant topics to notify interested students.',
    title: '📝 Post Internships',
    placement: 'bottom',
  },
  {
    target: '[data-tour="company-matches"]',
    content: 'View all applications to your internships with AI match scores! Update application status, schedule interviews, and message candidates directly.',
    title: '🎯 Matched Candidates',
    placement: 'bottom',
  },
  {
    target: '[data-tour="nav-overflow"]',
    content: 'Tap the “More” menu whenever you need quick access to tucked-away links like Messages.',
    title: '⋯ More Navigation',
    placement: 'bottom',
  },
  {
    target: '[data-tour="search"]',
    content: 'Search for students and companies by username or name. View student profiles, resumes, and check if they\'re a good fit for your internships.',
    title: '🔍 Search Talent',
    placement: 'bottom',
  },
  {
    target: '[data-tour="notifications"]',
    content: 'Get notified when students apply to your internships or send you messages. Customize which notifications you want via email.',
    title: '🔔 Notifications',
    placement: 'left',
  },
  {
    target: '[data-tour="messages"]',
    content: 'Message applicants directly! Discuss internship details, request additional information, or schedule interviews.',
    title: '💬 Messages',
    placement: 'left',
  },
  {
    target: '[data-tour="carlos"]',
    content: 'Carlos is your AI assistant! Ask him things like "post internship" or "view applications" and he\'ll help you navigate.',
    title: '🤖 Carlos - AI Assistant',
    placement: 'left',
  },
  {
    target: 'body',
    content: 'You\'re all set! Start by completing your company profile, then post your first internship. Happy hiring! 🚀',
    title: 'Ready to Hire!',
    placement: 'center',
  },
];

export const adminTutorialSteps: TutorialStep[] = [
  {
    target: 'body',
    content: 'Welcome to the SkillSync Admin Panel! 🎉 Let me show you how to manage and monitor the platform.',
    title: 'Welcome, Admin!',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="admin-analytics"]',
    content: 'Your Analytics Dashboard! View comprehensive stats, beautiful charts (pie, bar, line), and generate AI insights about platform health.',
    title: '📊 Analytics Dashboard',
    placement: 'bottom',
  },
  {
    target: '[data-tour="admin-users"]',
    content: 'Manage all users here. View student and company profiles, and delete accounts if needed. See detailed user information.',
    title: '👥 User Management',
    placement: 'bottom',
  },
  {
    target: '[data-tour="admin-data"]',
    content: 'Manage platform data! View and delete companies, internships, and applications. Click any application to see full details including student info, internship details, and messaging activity.',
    title: '📁 Data Management',
    placement: 'bottom',
  },
  {
    target: '[data-tour="admin-tools"]',
    content: 'RAG Search Tools! Use semantic search to find students by skills or internships by requirements. Powered by AI embeddings.',
    title: '🔧 Search Tools',
    placement: 'bottom',
  },
  {
    target: '[data-tour="nav-overflow"]',
    content: 'Click the “More” menu to expose extra shortcuts like Global Search and Messages.',
    title: '⋯ More Navigation',
    placement: 'bottom',
  },
  {
    target: '[data-tour="search"]',
    content: 'Need to look something up fast? Use global search to find any user, company, or internship by their username or name.',
    title: '🔍 Global Search',
    placement: 'bottom',
  },
  {
    target: '[data-tour="dashboard"]',
    content: 'The Dashboard shows overview tiles. As an admin, you can access ALL sections - student, company, and admin features.',
    title: '📊 Dashboard',
    placement: 'bottom',
  },
  {
    target: '[data-tour="notifications"]',
    content: 'Monitor system notifications and important platform events. You can send system-wide announcements to all users.',
    title: '🔔 Notifications',
    placement: 'left',
  },
  {
    target: '[data-tour="carlos"]',
    content: 'Carlos is your AI assistant! Ask him "show analytics" or "manage users" and he\'ll navigate you to the right place.',
    title: '🤖 Carlos - AI Assistant',
    placement: 'left',
  },
  {
    target: 'body',
    content: 'You have full access to everything! Monitor analytics, manage users, and keep the platform running smoothly. 🚀',
    title: 'Admin Access Granted!',
    placement: 'center',
  },
];

// Export all steps
export const tutorialStepsByRole = {
  student: studentTutorialSteps,
  company: companyTutorialSteps,
  admin: adminTutorialSteps,
};
