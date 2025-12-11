import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DIDExperience } from './DIDExperience';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const Interview = ({ onBack }) => {
  const { user } = useAuth();
  const [interviewType, setInterviewType] = useState(null); // 'technical', 'behavioral', 'hr'
  const [jobRole, setJobRole] = useState('');
  const [experience, setExperience] = useState('fresher'); // 'fresher', 'intermediate', 'expert'
  const [isStarted, setIsStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [userAnswers, setUserAnswers] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [agentMessage, setAgentMessage] = useState(''); // Message for D-ID agent to speak
  const [messageKey, setMessageKey] = useState(0); // Force message updates
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [isAgentConnected, setIsAgentConnected] = useState(false);
  const [showRoleError, setShowRoleError] = useState(false);
  const [suggestedRoles, setSuggestedRoles] = useState([]);
  const [isFollowUp, setIsFollowUp] = useState(false); // Track if current question is a follow-up
  const [currentMainQuestion, setCurrentMainQuestion] = useState(0); // Track main question number separate from total
  const [hasAskedFollowUp, setHasAskedFollowUp] = useState(false); // Track if we already asked a follow-up for current main question
  const recognitionRef = useRef(null);
  const welcomeMessageSentRef = useRef(null);

  // Comprehensive valid job roles list (200+ roles across all industries)
  const validJobRoles = [
    // Technology & Software
    'software engineer', 'software developer', 'senior software engineer', 'junior software engineer',
    'frontend developer', 'backend developer', 'full stack developer', 'web developer',
    'data scientist', 'data analyst', 'data engineer', 'machine learning engineer', 'ai engineer',
    'devops engineer', 'cloud engineer', 'site reliability engineer', 'sre', 'devsecops engineer',
    'mobile developer', 'ios developer', 'android developer', 'react native developer', 'flutter developer',
    'qa engineer', 'quality assurance', 'test engineer', 'sdet', 'automation engineer',
    'security engineer', 'cybersecurity engineer', 'network engineer', 'systems engineer',
    'database administrator', 'dba', 'solutions architect', 'system architect', 'cloud architect',
    'blockchain developer', 'game developer', 'unity developer', 'unreal developer',
    'embedded engineer', 'firmware engineer', 'hardware engineer',

    // Design & Creative
    'ui designer', 'ux designer', 'ui/ux designer', 'product designer', 'graphic designer',
    'visual designer', 'interaction designer', 'motion designer', 'animator', '3d artist',
    'illustrator', 'brand designer', 'creative director', 'art director',
    'video editor', 'film editor', 'photographer', 'videographer',
    'makeup artist', 'hair stylist', 'fashion designer', 'interior designer',
    'industrial designer', 'jewelry designer', 'textile designer',

    // Business & Management
    'product manager', 'product owner', 'project manager', 'program manager',
    'business analyst', 'systems analyst', 'management consultant', 'strategy consultant',
    'operations manager', 'general manager', 'ceo', 'cto', 'cfo', 'coo',
    'business development manager', 'partnerships manager', 'account manager',
    'scrum master', 'agile coach', 'technical lead', 'engineering manager', 'team lead',

    // Finance & Accounting
    'financial analyst', 'investment analyst', 'financial planner', 'wealth manager',
    'accountant', 'chartered accountant', 'tax consultant', 'auditor', 'internal auditor',
    'investment banker', 'equity analyst', 'credit analyst', 'risk analyst',
    'bookkeeper', 'payroll specialist', 'accounts payable', 'accounts receivable',

    // Marketing & Sales
    'marketing manager', 'digital marketing manager', 'growth manager', 'brand manager',
    'social media manager', 'content manager', 'seo specialist', 'sem specialist',
    'email marketing specialist', 'marketing analyst', 'growth hacker',
    'sales manager', 'sales executive', 'sales representative', 'business development executive',
    'sales engineer', 'account executive', 'inside sales', 'field sales',
    'copywriter', 'content writer', 'technical writer', 'content creator',

    // Human Resources
    'hr manager', 'hr generalist', 'hr business partner', 'talent acquisition specialist',
    'recruiter', 'technical recruiter', 'campus recruiter', 'headhunter',
    'training coordinator', 'learning and development', 'organizational development',
    'compensation analyst', 'benefits administrator', 'employee relations specialist',

    // Customer Service & Support
    'customer success manager', 'customer support specialist', 'customer service representative',
    'technical support engineer', 'support engineer', 'help desk technician',
    'call center agent', 'customer care executive', 'client relations manager',

    // Healthcare & Medical
    'doctor', 'physician', 'surgeon', 'general practitioner', 'specialist',
    'nurse', 'registered nurse', 'nurse practitioner', 'nursing assistant',
    'pharmacist', 'pharmacy technician', 'medical assistant', 'healthcare assistant',
    'dentist', 'dental hygienist', 'dental assistant', 'orthodontist',
    'physical therapist', 'occupational therapist', 'speech therapist', 'therapist', 'counselor',
    'psychologist', 'psychiatrist', 'clinical psychologist', 'mental health counselor',
    'medical laboratory technician', 'radiologist', 'radiologic technologist',
    'paramedic', 'emt', 'emergency medical technician', 'healthcare administrator',

    // Education & Training
    'teacher', 'professor', 'lecturer', 'instructor', 'educator',
    'school teacher', 'primary teacher', 'secondary teacher', 'high school teacher',
    'special education teacher', 'esl teacher', 'substitute teacher',
    'tutor', 'private tutor', 'academic advisor', 'school counselor',
    'principal', 'vice principal', 'department head', 'dean',
    'instructional designer', 'curriculum developer', 'education consultant',
    'teaching assistant', 'research assistant', 'lab assistant',

    // Hospitality & Food Service
    'chef', 'head chef', 'sous chef', 'line cook', 'prep cook',
    'barista', 'bartender', 'waiter', 'waitress', 'server',
    'restaurant manager', 'food and beverage manager', 'catering manager',
    'hotel manager', 'front desk agent', 'concierge', 'housekeeping supervisor',
    'event planner', 'event coordinator', 'wedding planner',
    'sommelier', 'pastry chef', 'baker', 'butcher',

    // Retail & Sales (Store)
    'retail manager', 'store manager', 'assistant manager', 'shift supervisor',
    'sales associate', 'retail sales', 'cashier', 'stock associate',
    'merchandiser', 'visual merchandiser', 'inventory specialist',
    'buyer', 'purchasing agent', 'procurement specialist',

    // Manufacturing & Trades
    'electrician', 'master electrician', 'plumber', 'pipefitter',
    'welder', 'fabricator', 'machinist', 'cnc operator',
    'carpenter', 'cabinet maker', 'construction worker', 'general contractor',
    'hvac technician', 'mechanic', 'automotive technician', 'diesel mechanic',
    'production supervisor', 'manufacturing engineer', 'quality control inspector',
    'maintenance technician', 'facility manager', 'plant manager',

    // Media & Entertainment
    'journalist', 'reporter', 'news anchor', 'editor', 'copy editor',
    'content creator', 'youtuber', 'influencer', 'podcaster',
    'social media influencer', 'blogger', 'vlogger',
    'producer', 'film producer', 'music producer', 'radio producer',
    'director', 'film director', 'creative director', 'casting director',
    'sound engineer', 'audio engineer', 'music composer', 'songwriter',

    // Legal & Compliance
    'lawyer', 'attorney', 'legal counsel', 'corporate lawyer', 'criminal lawyer',
    'paralegal', 'legal assistant', 'legal secretary',
    'judge', 'magistrate', 'law clerk',
    'compliance officer', 'compliance manager', 'legal advisor',

    // Real Estate
    'real estate agent', 'realtor', 'property manager', 'leasing agent',
    'real estate broker', 'commercial real estate agent',
    'property appraiser', 'real estate analyst', 'real estate developer',

    // Logistics & Supply Chain
    'supply chain manager', 'logistics manager', 'warehouse manager',
    'inventory manager', 'shipping coordinator', 'receiving clerk',
    'delivery driver', 'truck driver', 'courier', 'dispatcher',
    'procurement manager', 'purchasing manager', 'vendor manager',

    // Science & Research
    'research scientist', 'scientist', 'research associate', 'laboratory technician',
    'chemist', 'biologist', 'physicist', 'environmental scientist',
    'biotechnologist', 'microbiologist', 'geneticist',

    // Internships & Entry Level
    'intern', 'product intern', 'engineering intern', 'software engineering intern',
    'marketing intern', 'design intern', 'data science intern', 'business intern',
    'finance intern', 'operations intern', 'hr intern', 'sales intern',
    'management trainee', 'graduate trainee', 'apprentice',

    // Other Professional Roles
    'consultant', 'freelancer', 'independent contractor',
    'entrepreneur', 'founder', 'co-founder', 'startup founder',
    'librarian', 'archivist', 'museum curator',
    'translator', 'interpreter', 'language specialist',
    'grant writer', 'proposal writer', 'editor',
    'pilot', 'flight attendant', 'air traffic controller',
    'security guard', 'security officer', 'safety officer',
    'receptionist', 'administrative assistant', 'executive assistant', 'office manager',
    'data entry specialist', 'virtual assistant'
  ];

  // Calculate Levenshtein distance for spell-checking
  const calculateLevenshteinDistance = (str1, str2) => {
    const len1 = str1.length;
    const len2 = str2.length;
    const dp = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) dp[i][0] = i;
    for (let j = 0; j <= len2; j++) dp[0][j] = j;

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,     // deletion
            dp[i][j - 1] + 1,     // insertion
            dp[i - 1][j - 1] + 1  // substitution
          );
        }
      }
    }

    return dp[len1][len2];
  };

  // Validate job role with improved fuzzy matching
  const validateJobRole = (role) => {
    const trimmedRole = role.trim().toLowerCase();

    // Check if empty
    if (!trimmedRole) return true; // Allow empty during typing

    // Check if it's gibberish (less than 3 chars or all same chars)
    if (trimmedRole.length < 3) return false;
    if (/^(.)\1+$/.test(trimmedRole)) return false; // All same character
    if (/^[^a-z\s]+$/.test(trimmedRole)) return false; // No letters

    // Priority 1: Check for exact match
    if (validJobRoles.includes(trimmedRole)) {
      return true;
    }

    // Priority 2: Check for substring match (partial role names)
    const substringMatch = validJobRoles.some(validRole =>
      validRole.includes(trimmedRole) || trimmedRole.includes(validRole)
    );

    if (substringMatch) {
      return true;
    }

    // Priority 3: Find close spelling matches using Levenshtein distance
    const maxDistance = 2; // Allow up to 2 character edits
    const suggestions = validJobRoles
      .map(validRole => ({
        role: validRole,
        distance: calculateLevenshteinDistance(trimmedRole, validRole)
      }))
      .filter(item => item.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)  // Top 3 suggestions
      .map(item => item.role);

    if (suggestions.length > 0) {
      setSuggestedRoles(suggestions);
      return false; // Invalid but we have suggestions
    }

    // Priority 4: Word-based fuzzy matching for multi-word roles
    const inputWords = trimmedRole.split(' ').filter(w => w.length > 2);
    const wordMatches = validJobRoles
      .map(validRole => {
        const validWords = validRole.split(' ');
        const matchCount = inputWords.filter(inputWord =>
          validWords.some(validWord =>
            validWord.includes(inputWord) ||
            inputWord.includes(validWord) ||
            calculateLevenshteinDistance(inputWord, validWord) <= 1
          )
        ).length;
        return { role: validRole, matchCount };
      })
      .filter(item => item.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount)
      .slice(0, 3)
      .map(item => item.role);

    if (wordMatches.length > 0) {
      setSuggestedRoles(wordMatches);
      return false;
    }

    // No matches found - provide default suggestions from popular roles
    setSuggestedRoles([
      'software engineer',
      'product manager',
      'data analyst'
    ]);
    return false;
  };

  const interviewTypes = [
    {
      id: 'technical',
      icon: '💻',
      title: 'Technical Interview',
      description: 'Test your coding, problem-solving, and technical knowledge',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'behavioral',
      icon: '🧠',
      title: 'Behavioral Interview',
      description: 'Practice answering questions about your experiences and soft skills',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'hr',
      icon: '👔',
      title: 'HR Interview',
      description: 'Prepare for general HR questions and company fit assessment',
      color: 'from-green-500 to-teal-500'
    }
  ];

  const experienceLevels = [
    { id: 'fresher', label: 'Fresher (0-2 years)', icon: '🌱' },
    { id: 'intermediate', label: 'Intermediate (2-5 years)', icon: '🌿' },
    { id: 'expert', label: 'Expert (5+ years)', icon: '🌳' }
  ];

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startInterview = async () => {
    if (!jobRole.trim()) {
      alert('Please enter the job role');
      return;
    }

    setIsLoading(true);
    setIsStarted(true);
    welcomeMessageSentRef.current = false;

    // Wait for agent to connect before sending welcome message
    console.log('🎬 Interview starting, waiting for agent connection...');
  };

  // Send welcome message once agent is connected
  useEffect(() => {
    if (isStarted && isAgentConnected && !welcomeMessageSentRef.current && !interviewComplete) {
      console.log('✅ Agent connected, sending welcome message');
      welcomeMessageSentRef.current = true;

      // Welcome message - Agent speaks as the interviewer
      setAgentMessage(`Hello! Welcome to your ${interviewType} interview for the ${jobRole} position. I'll be asking you ${totalQuestions} questions today. Take your time to think through your answers, and remember - there are no wrong answers, only opportunities to showcase your skills and experience. Let's begin!`);
      setMessageKey(prev => prev + 1);

      // Wait a bit for welcome message to play, then show first question
      setTimeout(async () => {
        const question = await generateQuestion(1);
        setCurrentQuestion(question);
        setQuestionNumber(1);
        setCurrentMainQuestion(1); // Initialize main question counter
        setAgentMessage(`${question} Take your time and give me your best answer. Good luck!`);
        setMessageKey(prev => prev + 1);
        setIsLoading(false);
      }, 3000);
    }
  }, [isStarted, isAgentConnected, interviewComplete]);

  const generateQuestion = async (qNumber) => {
    // ALWAYS ask "Tell me about yourself" as the first question for all interview types
    if (qNumber === 1) {
      console.log('📝 First question: Tell me about yourself (default)');
      return `Tell me about yourself and why you're interested in this ${jobRole} position.`;
    }

    try {
      console.log(`📝 Generating question ${qNumber} for ${interviewType} interview...`);

      const response = await fetch(`${API_URL}/api/interview/generate-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewType,
          jobRole,
          experience,
          questionNumber: qNumber,
          totalQuestions,
          previousAnswers: userAnswers
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.question) {
        throw new Error('No question received from API');
      }

      console.log(`✅ Question ${qNumber} generated successfully`);
      return data.question;
    } catch (error) {
      console.error('❌ Error generating question:', error);

      // Generate a fallback question based on interview type and question number
      // These are CHALLENGING, IN-DEPTH fallback questions if API fails
      const fallbackQuestions = {
        technical: [
          `Walk me through how you would design and implement a ${jobRole} solution that handles 100,000 concurrent users. Discuss your technology choices, scalability strategies, and potential bottlenecks.`,
          `Describe a complex technical challenge you've faced in ${jobRole} development. How did you debug it, what was your solution, and how did you optimize for both performance and maintainability?`,
          `Explain the trade-offs between different architectural patterns for ${jobRole}. When would you choose microservices over monolithic architecture, and what are the implications for your tech stack?`,
          `Implement (or describe in detail) an algorithm to solve this: Given a large dataset specific to ${jobRole}, how would you optimize query performance? Discuss time complexity, space complexity, and caching strategies.`,
          `How would you handle a critical production issue in a ${jobRole} system where thousands of users are affected? Walk me through your debugging approach, rollback strategy, and post-mortem process.`
        ],
        behavioral: [
          `Tell me about a time when you had to make a difficult technical decision that had significant business impact in a ${jobRole} project.What were the competing priorities, how did you analyze the trade - offs, and what was the measurable outcome ? `,
          `Describe a situation where you had to lead a team through a major technical migration or refactoring effort.How did you handle resistance, manage risks, and ensure knowledge transfer ? Provide specific metrics on the results.`,
          `Give me a detailed example of when you had to learn an entirely new technology stack under tight deadlines.What was your learning strategy, what challenges did you face, and how did this experience change your approach to continuous learning ? `,
          `Tell me about a time when you made a significant mistake that affected your team or project.How did you discover it, what was your immediate response, how did you fix it, and what systems did you put in place to prevent similar issues ? `,
          `Describe a conflict you had with a senior engineer or manager about a technical direction.How did you build your case, handle disagreements professionally, and what was the final decision and its impact ? `
        ],
        hr: [
          `What specifically drew you to ${jobRole}, and how have you actively invested in developing deep expertise in this field over the past year ? Provide concrete examples of learning, side projects, or contributions to the community.`,
          `Walk me through your career decisions from your first role to now.What were the 2 - 3 pivotal moments where you chose one path over another, what was your decision - making process, and would you make the same choices today knowing what you know ? `,
          `Where do you see the ${jobRole} field evolving in the next 5 years, and how are you positioning yourself to stay relevant and be a leader in these changes ? What specific skills are you developing now for future demands ? `,
          `Describe your ideal work environment and team culture.What specific behaviors and values are non - negotiable for you, and can you give examples of when you've had to make difficult choices to maintain those standards?`,
          `As a ${jobRole} professional, how do you balance the need for deep technical work with collaboration, mentoring, and staying current with industry trends? Give specific examples of how you've managed these competing demands in the past month.`
        ]
      };

      const questions = fallbackQuestions[interviewType] || fallbackQuestions.technical;
      return questions[(qNumber - 1) % questions.length];
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const submitAnswer = async () => {
    if (!transcript.trim()) {
      alert('Please provide an answer');
      return;
    }

    // Agent acknowledges the answer as the interviewer
    setAgentMessage("Thank you for your answer. Let me think about that...");
    setMessageKey(prev => prev + 1);

    // Save answer
    const answer = {
      questionNumber: currentMainQuestion || questionNumber,
      question: currentQuestion,
      answer: transcript,
      timestamp: new Date().toISOString(),
      isFollowUp: isFollowUp
    };

    setUserAnswers([...userAnswers, answer]);
    setTranscript('');
    setIsLoading(true);

    // Check if we've reached the total question limit
    const questionsAnswered = questionNumber;
    if (questionsAnswered >= totalQuestions) {
      console.log(`✅ Interview complete: answered ${questionsAnswered} of ${totalQuestions} questions`);
      setAgentMessage("That was your final question. Let me analyze your performance and prepare detailed feedback for you. This will just take a moment.");
      setMessageKey(prev => prev + 1);

      const feedbackData = await generateFeedback([...userAnswers, answer]);
      setFeedback(feedbackData);
      setInterviewComplete(true);

      let feedbackMessage = '';
      if (feedbackData.overallScore >= 80) {
        feedbackMessage = `Excellent work! You scored ${feedbackData.overallScore} out of 100. ${feedbackData.summary} You showed great understanding and communication skills. Keep up the fantastic work!`;
      } else if (feedbackData.overallScore >= 60) {
        feedbackMessage = `Good job! You scored ${feedbackData.overallScore} out of 100. ${feedbackData.summary} With some practice on the areas I've highlighted, you'll be even better prepared for your next interview. Keep practicing!`;
      } else {
        feedbackMessage = `You scored ${feedbackData.overallScore} out of 100. ${feedbackData.summary} Don't be discouraged! Every interview is a learning opportunity. Focus on the improvement areas I've identified, practice regularly, and you'll see great progress. You've got this!`;
      }

      setAgentMessage(feedbackMessage);
      setMessageKey(prev => prev + 1);
      setIsLoading(false);
      return;
    }

    // If this is already a follow-up answer OR we've asked a follow-up for this main question, move to next main question
    if (isFollowUp || hasAskedFollowUp) {
      console.log('⏭️  Moving to next main question (already had follow-up)');
      setIsFollowUp(false);
      setHasAskedFollowUp(false);

      // Generate next MAIN question
      const nextMainQNumber = (currentMainQuestion || questionNumber) + 1;
      setTimeout(async () => {
        const nextQuestion = await generateQuestion(nextMainQNumber);
        setCurrentQuestion(nextQuestion);
        setCurrentMainQuestion(nextMainQNumber);
        setQuestionNumber(questionNumber + 1); // Increment total question counter
        setAgentMessage(`Great! Here's your next question: ${nextQuestion} Take your time and answer confidently. You're doing well!`);
        setMessageKey(prev => prev + 1);
        setIsLoading(false);
      }, 2000);
      return;
    }

    // This was a main question answer, check if we need a follow-up
    console.log('🔍 Checking if follow-up is needed...');
    try {
      const followUpResponse = await fetch(`${API_URL}/api/interview/analyze-answer-followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewType,
          jobRole,
          experience,
          question: currentQuestion,
          answer: transcript,
          questionNumber: currentMainQuestion || questionNumber
        })
      });

      if (!followUpResponse.ok) {
        throw new Error(`HTTP ${followUpResponse.status}`);
      }

      const followUpData = await followUpResponse.json();
      console.log('🔍 Follow-up analysis:', followUpData);

      if (followUpData.needsFollowUp && followUpData.followUpQuestion) {
        // Ask a follow-up question
        console.log('✅ Asking follow-up:', followUpData.followUpQuestion);
        setIsFollowUp(true);
        setHasAskedFollowUp(true);
        setCurrentQuestion(followUpData.followUpQuestion);
        setQuestionNumber(questionNumber + 1); // Increment total question counter for follow-up
        setAgentMessage(`Interesting. Let me dig deeper on that: ${followUpData.followUpQuestion}`);
        setMessageKey(prev => prev + 1);
        setIsLoading(false);
      } else {
        // No follow-up needed, move to next main question
        console.log('⏭️  No follow-up needed, moving to next question');
        setIsFollowUp(false);
        setHasAskedFollowUp(false);

        const nextMainQNumber = (currentMainQuestion || questionNumber) + 1;
        setTimeout(async () => {
          const nextQuestion = await generateQuestion(nextMainQNumber);
          setCurrentQuestion(nextQuestion);
          setCurrentMainQuestion(nextMainQNumber);
          setQuestionNumber(questionNumber + 1); // Increment total question counter
          setAgentMessage(`Great! Here's your next question: ${nextQuestion} Take your time and answer confidently. You're doing well!`);
          setMessageKey(prev => prev + 1);
          setIsLoading(false);
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Error checking for follow-up:', error);
      // On error, just move to next question without follow-up
      setIsFollowUp(false);
      setHasAskedFollowUp(false);

      const nextMainQNumber = (currentMainQuestion || questionNumber) + 1;
      setTimeout(async () => {
        const nextQuestion = await generateQuestion(nextMainQNumber);
        setCurrentQuestion(nextQuestion);
        setCurrentMainQuestion(nextMainQNumber);
        setQuestionNumber(questionNumber + 1); // Increment total question counter
        setAgentMessage(`Great! Here's your next question: ${nextQuestion} Take your time and answer confidently!`);
        setMessageKey(prev => prev + 1);
        setIsLoading(false);
      }, 2000);
    }
  };

  const generateFeedback = async (answers) => {
    try {
      console.log('🔥 FEEDBACK CODE VERSION: 15:42 - BACKEND API ENABLED');
      console.log(`📊 Generating feedback for ${answers.length} answers...`);

      const response = await fetch(`${API_URL}/api/interview/generate-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewType,
          jobRole,
          experience,
          answers
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Feedback generated successfully');
      return data.feedback;
    } catch (error) {
      console.error('❌ BACKEND API FAILED - Using fallback feedback');
      console.error('Error details:', error.message);
      console.error('Full error:', error);

      // Generate basic fallback feedback
      const avgScore = 15; // FALLBACK - API FAILED!
      return {
        overallScore: avgScore,
        strengths: [
          'Provided thoughtful responses to the questions',
          'Demonstrated understanding of the role requirements',
          'Communicated clearly throughout the interview'
        ],
        improvements: [
          'Could provide more specific examples from past experience',
          'Consider structuring answers using the STAR method',
          'Practice technical terminology relevant to the role'
        ],
        summary: `You completed the ${interviewType} interview for ${jobRole}. Keep practicing to improve your interview skills!`
      };
    }
  };

  const resetInterview = () => {
    setInterviewType(null);
    setJobRole('');
    setExperience('fresher');
    setIsStarted(false);
    setCurrentQuestion('');
    setQuestionNumber(0);
    setCurrentMainQuestion(0); // Reset main question counter
    setIsFollowUp(false); // Reset follow-up flag
    setHasAskedFollowUp(false); // Reset follow-up tracker
    setUserAnswers([]);
    setTranscript('');
    setInterviewComplete(false);
    setFeedback(null);
  };

  // Setup Screen
  if (!interviewType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-[#1a1305] to-[#f4b400] text-white p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">🎯 Interview Practice</h1>
              <p className="text-amber-200">Practice with AI-powered mock interviews</p>
            </div>
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
            >
              ← Back to Dashboard
            </button>
          </div>

          {/* Interview Type Selection */}
          <div className="grid md:grid-cols-3 gap-6">
            {interviewTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setInterviewType(type.id)}
                className={`p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/30 transition-all transform hover:-translate-y-2 hover:shadow-2xl text-left group`}
              >
                <div className={`text-6xl mb-4 transition-transform group-hover:scale-110`}>
                  {type.icon}
                </div>
                <h3 className="text-2xl font-bold mb-2">{type.title}</h3>
                <p className="text-gray-300">{type.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Configuration Screen
  if (!isStarted) {
    const selectedType = interviewTypes.find(t => t.id === interviewType);

    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-[#1a1305] to-[#f4b400] text-white p-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">{selectedType.icon} {selectedType.title}</h1>
              <p className="text-amber-200">Configure your interview session</p>
            </div>
            <button
              onClick={() => setInterviewType(null)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
            >
              ← Change Type
            </button>
          </div>

          {/* Configuration Form */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 space-y-6">
            {/* Job Role */}
            <div>
              <label className="block text-sm font-semibold mb-2">Job Role / Position</label>
              <input
                type="text"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                onBlur={() => {
                  if (jobRole.trim() && !validateJobRole(jobRole)) {
                    setShowRoleError(true);
                  }
                }}
                placeholder="e.g., Frontend Developer, Data Scientist, Product Manager"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-amber-400 focus:outline-none transition-colors"
              />
              <p className="text-xs text-gray-400 mt-1">Enter a valid technical or professional role</p>
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-sm font-semibold mb-2">Experience Level</label>
              <div className="grid grid-cols-3 gap-3">
                {experienceLevels.map(level => (
                  <button
                    key={level.id}
                    onClick={() => setExperience(level.id)}
                    className={`p-4 rounded-xl border transition-all ${experience === level.id
                      ? 'bg-amber-400 border-amber-400 text-black'
                      : 'bg-white/5 border-white/20 hover:border-white/40'
                      }`}
                  >
                    <div className="text-3xl mb-2">{level.icon}</div>
                    <div className="text-sm font-semibold">{level.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Number of Questions */}
            <div>
              <label className="block text-sm font-semibold mb-2">Number of Questions</label>
              <div className="flex gap-3">
                {[3, 5, 7, 10].map(num => (
                  <button
                    key={num}
                    onClick={() => setTotalQuestions(num)}
                    className={`flex-1 py-3 rounded-xl border transition-all ${totalQuestions === num
                      ? 'bg-amber-400 border-amber-400 text-black'
                      : 'bg-white/5 border-white/20 hover:border-white/40'
                      }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={() => {
                if (!jobRole.trim()) return;
                if (!validateJobRole(jobRole)) {
                  setShowRoleError(true);
                  return;
                }
                startInterview();
              }}
              disabled={!jobRole.trim()}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${jobRole.trim()
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:shadow-2xl transform hover:-translate-y-1'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
            >
              Start Interview 🚀
            </button>
          </div>

          {/* Role Validation Error Modal */}
          {showRoleError && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
              <div className="bg-white/10 backdrop-blur-md border border-red-500/50 rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">⚠️</div>
                  <h3 className="text-2xl font-bold text-red-400 mb-2">Invalid Job Role</h3>
                  <p className="text-gray-300">
                    {suggestedRoles.length > 0
                      ? "We couldn't find an exact match. Did you mean one of these?"
                      : "Please enter a valid professional job role."}
                  </p>
                </div>

                {/* Suggestions Section */}
                {suggestedRoles.length > 0 && (
                  <div className="bg-white/5 rounded-xl p-4 mb-6">
                    <p className="text-sm text-amber-300 font-semibold mb-3">📝 Top Suggestions:</p>
                    <div className="space-y-2">
                      {suggestedRoles.map((role, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setJobRole(role.charAt(0).toUpperCase() + role.slice(1));
                            setShowRoleError(false);
                          }}
                          className="w-full p-3 bg-amber-400/20 hover:bg-amber-400/30 rounded-lg text-amber-300 font-semibold transition-all text-left flex items-center gap-2 group"
                        >
                          <span className="text-lg">{index === 0 ? '✓' : '~'}</span>
                          <span className="flex-1 capitalize">{role}</span>
                          <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            Click to use →
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Valid Examples by Category */}
                <div className="space-y-3 mb-6">
                  <p className="text-xs text-gray-400 font-semibold">Valid examples across industries:</p>

                  {/* Tech */}
                  <div>
                    <p className="text-xs text-purple-300 mb-1.5">💻 Technology:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-white/5 rounded hover:bg-white/10 transition-all cursor-pointer" onClick={() => { setJobRole('Software Engineer'); setShowRoleError(false); }}>Software Engineer</div>
                      <div className="p-2 bg-white/5 rounded hover:bg-white/10 transition-all cursor-pointer" onClick={() => { setJobRole('Data Scientist'); setShowRoleError(false); }}>Data Scientist</div>
                    </div>
                  </div>

                  {/* Creative */}
                  <div>
                    <p className="text-xs text-pink-300 mb-1.5">🎨 Creative:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-white/5 rounded hover:bg-white/10 transition-all cursor-pointer" onClick={() => { setJobRole('Makeup Artist'); setShowRoleError(false); }}>Makeup Artist</div>
                      <div className="p-2 bg-white/5 rounded hover:bg-white/10 transition-all cursor-pointer" onClick={() => { setJobRole('Graphic Designer'); setShowRoleError(false); }}>Graphic Designer</div>
                    </div>
                  </div>

                  {/* Business */}
                  <div>
                    <p className="text-xs text-green-300 mb-1.5">💼 Business:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-white/5 rounded hover:bg-white/10 transition-all cursor-pointer" onClick={() => { setJobRole('Product Manager'); setShowRoleError(false); }}>Product Manager</div>
                      <div className="p-2 bg-white/5 rounded hover:bg-white/10 transition-all cursor-pointer" onClick={() => { setJobRole('Financial Analyst'); setShowRoleError(false); }}>Financial Analyst</div>
                    </div>
                  </div>

                  {/* Healthcare */}
                  <div>
                    <p className="text-xs text-blue-300 mb-1.5">🏥 Healthcare:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-white/5 rounded hover:bg-white/10 transition-all cursor-pointer" onClick={() => { setJobRole('Nurse'); setShowRoleError(false); }}>Nurse</div>
                      <div className="p-2 bg-white/5 rounded hover:bg-white/10 transition-all cursor-pointer" onClick={() => { setJobRole('Pharmacist'); setShowRoleError(false); }}>Pharmacist</div>
                    </div>
                  </div>

                  {/* Food Service */}
                  <div>
                    <p className="text-xs text-orange-300 mb-1.5">☕ Food Service:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-white/5 rounded hover:bg-white/10 transition-all cursor-pointer" onClick={() => { setJobRole('Barista'); setShowRoleError(false); }}>Barista</div>
                      <div className="p-2 bg-white/5 rounded hover:bg-white/10 transition-all cursor-pointer" onClick={() => { setJobRole('Chef'); setShowRoleError(false); }}>Chef</div>
                    </div>
                  </div>

                  {/* Internships */}
                  <div>
                    <p className="text-xs text-yellow-300 mb-1.5">🎓 Internships:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-white/5 rounded hover:bg-white/10 transition-all cursor-pointer" onClick={() => { setJobRole('Product Intern'); setShowRoleError(false); }}>Product Intern</div>
                      <div className="p-2 bg-white/5 rounded hover:bg-white/10 transition-all cursor-pointer" onClick={() => { setJobRole('Marketing Intern'); setShowRoleError(false); }}>Marketing Intern</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowRoleError(false)}
                  className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 font-semibold transition-all"
                >
                  Got it, let me fix it
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Interview Complete Screen
  if (interviewComplete && feedback) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-[#1a1305] to-[#f4b400] text-white p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-4xl font-bold mb-2">Interview Complete!</h1>
            <p className="text-amber-200">Here's your performance feedback</p>
          </div>

          {/* Feedback Card */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 space-y-6">
            {/* Overall Score */}
            <div className="text-center p-6 bg-gradient-to-r from-amber-400/20 to-yellow-500/20 rounded-xl">
              <div className="text-6xl font-bold mb-2">{feedback.overallScore}/100</div>
              <div className="text-xl text-amber-200">Overall Performance</div>
            </div>

            {/* Strengths */}
            <div>
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span>💪</span> Strengths
              </h3>
              <ul className="space-y-2">
                {feedback.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg">
                    <span className="text-green-400">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas for Improvement */}
            <div>
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span>📈</span> Areas for Improvement
              </h3>
              <ul className="space-y-2">
                {feedback.improvements.map((improvement, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-3 bg-amber-500/10 rounded-lg">
                    <span className="text-amber-400">→</span>
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Summary */}
            <div className="p-6 bg-white/5 rounded-xl">
              <h3 className="text-xl font-bold mb-3">Summary</h3>
              <p className="text-gray-300 leading-relaxed">{feedback.summary}</p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={resetInterview}
                className="py-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 font-semibold transition-all"
              >
                Start New Interview
              </button>
              <button
                onClick={onBack}
                className="py-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-semibold hover:shadow-2xl transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Interview In Progress
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#1a1305] to-[#f4b400] text-white">
      {/* Exit Warning Modal */}
      {showExitWarning && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-gradient-to-br from-red-900/90 to-black border-2 border-red-500 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold mb-2">Exit Interview?</h2>
              <p className="text-gray-300">
                Are you sure you want to exit? Your progress will be lost and you won't receive any feedback for this session.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowExitWarning(false)}
                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all font-semibold"
              >
                Continue Interview
              </button>
              <button
                onClick={() => {
                  setShowExitWarning(false);
                  resetInterview();
                  onBack();
                }}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 transition-all font-semibold"
              >
                Yes, Exit
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Side - AI Avatar */}
        <div className="lg:w-1/2 h-[40vh] lg:h-screen relative bg-black/30">
          <DIDExperience
            message={{ text: agentMessage || currentQuestion, key: messageKey }}
            onMessagePlayed={() => { }}
            onConnectionChange={setIsAgentConnected}
            speakOnly={true}
            skipChatHistory={true}
          />
          {/* Agent Message Display - Visual Text */}
          {agentMessage && isAgentConnected && (
            <div className="absolute bottom-4 left-4 right-4 bg-gradient-to-r from-amber-400/95 to-yellow-500/95 text-black rounded-2xl p-4 shadow-2xl border-2 border-amber-600 animate-fade-in">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎤</span>
                <div className="flex-1">
                  <p className="font-bold text-sm mb-1">Interviewer Says:</p>
                  <p className="text-base leading-relaxed">{agentMessage}</p>
                </div>
              </div>
            </div>
          )}
          {/* Connection Status */}
          {isStarted && !isAgentConnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white font-semibold">Connecting to AI Agent...</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Interview Panel */}
        <div className="lg:w-1/2 p-4 lg:p-6 flex flex-col h-[60vh] lg:h-screen overflow-y-auto">
          {/* Header with Exit Button */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold">Question {questionNumber} of {totalQuestions}</span>
                <span className="text-xs sm:text-sm text-amber-200">{Math.round((questionNumber / totalQuestions) * 100)}% Complete</span>
              </div>
            </div>
            <button
              onClick={() => setShowExitWarning(true)}
              className="px-3 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 hover:border-red-500 transition-all text-xs sm:text-sm font-semibold whitespace-nowrap"
            >
              ❌ Exit Interview
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-4 lg:mb-6">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-all duration-500"
                style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 lg:p-6 mb-4">
            <div className="flex items-start gap-2 lg:gap-3">
              <span className="text-2xl lg:text-3xl">❓</span>
              <div className="flex-1">
                <h3 className="text-lg lg:text-xl font-bold mb-2 lg:mb-3">Current Question</h3>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-400">Loading next question...</span>
                  </div>
                ) : (
                  <p className="text-base lg:text-lg text-gray-200 leading-relaxed">{currentQuestion}</p>
                )}
              </div>
            </div>
          </div>

          {/* Answer Input */}
          <div className="flex-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 lg:p-6 flex flex-col min-h-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 lg:mb-4">
              <h3 className="text-lg lg:text-xl font-bold">Your Answer</h3>
              <button
                onClick={toggleListening}
                disabled={isLoading}
                className={`px-3 py-2 rounded-xl font-semibold transition-all text-sm lg:text-base ${isListening
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-amber-400 hover:bg-amber-500 text-black'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isListening ? '⏸️ Stop' : '🎤 Record'}
              </button>
            </div>

            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Click 'Record' to speak or type here..."
              disabled={isLoading}
              className="flex-1 w-full px-3 py-2 lg:px-4 lg:py-3 rounded-xl bg-white/10 border border-white/20 focus:border-amber-400 focus:outline-none resize-none transition-colors text-sm lg:text-base min-h-[100px]"
            />

            <button
              onClick={submitAnswer}
              disabled={!transcript.trim() || isLoading}
              className={`mt-3 lg:mt-4 py-3 lg:py-4 rounded-xl font-bold text-sm lg:text-lg transition-all ${transcript.trim() && !isLoading
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:shadow-2xl transform hover:-translate-y-1'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
            >
              {questionNumber >= totalQuestions ? 'Submit & Get Feedback' : 'Submit & Next'} →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
