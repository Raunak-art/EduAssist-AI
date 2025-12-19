
export interface KnowledgeItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
}

export const KNOWLEDGE_BASE: KnowledgeItem[] = [
  // App Usage
  {
    id: 'app-1',
    category: 'App Usage',
    question: 'How do I generate images?',
    answer: 'To generate images, you can either switch to "Image Mode" in the Creative Studio menu, or simply ask me to "Generate an image of..." in the chat. I will automatically handle the request using the visual generation model.',
    keywords: ['generate', 'image', 'picture', 'draw', 'create', 'photo', 'visual']
  },
  {
    id: 'app-2',
    category: 'App Usage',
    question: 'What is "Smart (Thinking)" mode?',
    answer: 'Smart (Thinking) mode uses the advanced reasoning model (Proprietary Pro). It is specifically designed for complex STEM problems, math, coding, and logic puzzles. It takes a moment to "think" (showing a reasoning process) before providing a final answer to ensure high accuracy.',
    keywords: ['smart', 'thinking', 'mode', 'model', 'reasoning', 'math', 'complex', 'hard', 'logic']
  },
  {
    id: 'app-3',
    category: 'App Usage',
    question: 'How do I use the Text-to-Speech feature?',
    answer: 'To hear a response read aloud, click the "Volume" (Speaker) icon located at the top right of any AI message bubble. You can control the playback speed (0.5x to 2x) using the audio controls that appear.',
    keywords: ['audio', 'speech', 'voice', 'read', 'listen', 'hear', 'sound', 'talk']
  },
  {
    id: 'app-4',
    category: 'App Usage',
    question: 'Is my chat history private?',
    answer: 'Yes. EduAssist AI stores your chat history locally on your device (in your browser). We do not store your personal conversations on external servers for training purposes.',
    keywords: ['privacy', 'private', 'history', 'data', 'store', 'save']
  },

  // Study Tips
  {
    id: 'study-1',
    category: 'Study Tips',
    question: 'What is the Pomodoro Technique?',
    answer: 'The Pomodoro Technique is a time management method developed by Francesco Cirillo. It uses a timer to break work into intervals, traditionally 25 minutes in length, separated by short breaks (5 minutes). After four "pomodoros", take a longer break (15-30 minutes).',
    keywords: ['pomodoro', 'technique', 'study', 'focus', 'time', 'management', 'break']
  },
  {
    id: 'study-2',
    category: 'Study Tips',
    question: 'How can I memorize vocabulary faster?',
    answer: 'Effective methods include: 1) Spaced Repetition (reviewing words at increasing intervals), 2) Mnemonic devices (associating words with images or stories), and 3) Active Recall (testing yourself instead of just reading). EduAssist can help quiz you on these!',
    keywords: ['memorize', 'memory', 'vocabulary', 'words', 'language', 'learn']
  },
  {
    id: 'study-3',
    category: 'Study Tips',
    question: 'How do I structure an essay?',
    answer: 'A standard essay structure includes: 1) Introduction (Hook + Thesis Statement), 2) Body Paragraphs (Topic Sentence + Evidence + Analysis), and 3) Conclusion (Restate Thesis + Summary of Main Points + Final Thought).',
    keywords: ['essay', 'structure', 'write', 'writing', 'paper', 'thesis']
  },
  {
    id: 'study-4',
    category: 'Study Tips',
    question: 'What is the Feynman Technique?',
    answer: 'The Feynman Technique involves four steps to learn a concept: 1) Choose a concept, 2) Teach it to a child (simplify it), 3) Identify gaps in your explanation and review source material, 4) Organize and simplify further. It ensures deep understanding.',
    keywords: ['feynman', 'technique', 'learn', 'understand', 'concept', 'simplify']
  },

  // General Knowledge (Simulation)
  {
    id: 'fact-1',
    category: 'Quick Facts',
    question: 'What is the value of Pi?',
    answer: 'Pi (π) is approximately 3.14159. It represents the ratio of a circle\'s circumference to its diameter.',
    keywords: ['pi', 'math', 'circle', 'value', '3.14']
  },
  {
    id: 'fact-2',
    category: 'Quick Facts',
    question: 'What are the laws of motion?',
    answer: 'Newton\'s three laws of motion are: 1) An object stays at rest or in motion unless acted upon by a force (Inertia). 2) Force equals mass times acceleration (F=ma). 3) For every action, there is an equal and opposite reaction.',
    keywords: ['newton', 'laws', 'motion', 'physics', 'force', 'gravity']
  }
];

export const findRelevantKnowledge = (query: string): string | null => {
  if (!query) return null;
  const lowerQuery = query.toLowerCase();
  
  // Filter items where keywords match or question/answer contains the query
  const relevantItems = KNOWLEDGE_BASE.filter(item => 
    item.keywords.some(k => lowerQuery.includes(k.toLowerCase())) ||
    item.question.toLowerCase().includes(lowerQuery)
  );

  if (relevantItems.length === 0) return null;

  // Take top 3 most relevant to avoid context stuffing
  const topItems = relevantItems.slice(0, 3);

  // Return formatted context string
  return topItems.map(item => 
    `[Knowledge Base - ${item.category}]: ${item.question}\nAnswer: ${item.answer}`
  ).join('\n\n');
};
