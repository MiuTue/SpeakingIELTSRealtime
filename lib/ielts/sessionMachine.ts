import { part1Topics, part2CueCards, part3Topics, part2ToPart3Map } from "./topics";

export type PracticeMode = "PART1" | "PART2" | "PART3" | "FULL_TEST" | "CUSTOM";
export type SpeakingPart = "PART1" | "PART2" | "PART3";

export type PlannedQuestion = {
  id: string;
  part: SpeakingPart;
  question: string;
  cueCard?: string;
  kind: "identity" | "question" | "cue_card";
};

export type SessionState = {
  mode: PracticeMode;
  part: SpeakingPart;
  turnIndex: number;
  showFeedbackImmediately: boolean;
  prepSecondsRemaining: number;
  answerSecondsRemaining: number;
};

const initialPartByMode: Record<PracticeMode, SpeakingPart> = {
  PART1: "PART1",
  PART2: "PART2",
  PART3: "PART3",
  FULL_TEST: "PART1",
  CUSTOM: "PART1"
};

export function createInitialSessionState(mode: PracticeMode): SessionState {
  return {
    mode,
    part: initialPartByMode[mode],
    turnIndex: 0,
    showFeedbackImmediately: mode !== "FULL_TEST",
    prepSecondsRemaining: mode === "PART2" ? 60 : 0,
    answerSecondsRemaining: mode === "PART2" ? 120 : 0
  };
}

export function nextTurn(state: SessionState): SessionState {
  const turnIndex = state.turnIndex + 1;
  const part = getNextPart(state, turnIndex);

  return {
    ...state,
    part,
    turnIndex,
    prepSecondsRemaining: part === "PART2" && state.part !== "PART2" ? 60 : 0,
    answerSecondsRemaining: part === "PART2" ? 120 : 0
  };
}

export function shouldShowFeedback(mode: PracticeMode, isFinal = false) {
  return mode !== "FULL_TEST" || isFinal;
}

export function buildPlannedQuestions(mode: PracticeMode, topic: string): PlannedQuestion[] {
  if (mode === "FULL_TEST") {
    // 1. Pick a random Part 1 topic (excluding "Random Topic")
    const p1TopicsOnly = part1Topics.filter((t) => t !== "Random Topic");
    const p1Topic = p1TopicsOnly[Math.floor(Math.random() * p1TopicsOnly.length)] ?? "Work or study";

    // 2. Pick a random Part 2 cue card (excluding "Random Topic")
    const p2CardsOnly = part2CueCards.filter((t) => t !== "Random Topic");
    const p2Topic = p2CardsOnly[Math.floor(Math.random() * p2CardsOnly.length)] ?? "Describe a book you enjoyed";

    // 3. Map Part 2 topic to Part 3 topic, fallback to a random Part 3 topic
    const mappedP3Topic = part2ToPart3Map[p2Topic];
    const p3TopicsOnly = part3Topics.filter((t) => t !== "Random Topic");
    const p3Topic = mappedP3Topic ?? p3TopicsOnly[Math.floor(Math.random() * p3TopicsOnly.length)] ?? "Education";

    return [
      {
        id: "identity-0",
        part: "PART1",
        kind: "identity",
        question: "Could you tell me your full name, please?"
      },
      ...part1QuestionBank(p1Topic).slice(0, 5).map((question, index) => ({
        id: `part1-${index}`,
        part: "PART1" as SpeakingPart,
        kind: "question" as const,
        question
      })),
      {
        id: "part2-0",
        part: "PART2",
        kind: "cue_card",
        question: `Now I am going to give you a topic. Describe ${articleFor(p2Topic)} ${p2Topic.toLowerCase()}.`,
        cueCard: buildCueCard(p2Topic)
      },
      ...part3QuestionBank(p3Topic).slice(0, 5).map((question, index) => ({
        id: `part3-${index}`,
        part: "PART3" as SpeakingPart,
        kind: "question" as const,
        question
      }))
    ];
  }

  const part = initialPartByMode[mode];

  // Resolve random topic if user chose "Random Topic" or empty
  let activeTopic = topic;
  if (!activeTopic || activeTopic === "Random Topic" || activeTopic === "Random Topics") {
    if (part === "PART1") {
      const filtered = part1Topics.filter((t) => t !== "Random Topic");
      activeTopic = filtered[Math.floor(Math.random() * filtered.length)] ?? "Work or study";
    } else if (part === "PART2") {
      const filtered = part2CueCards.filter((t) => t !== "Random Topic");
      activeTopic = filtered[Math.floor(Math.random() * filtered.length)] ?? "Describe a book you enjoyed";
    } else if (part === "PART3") {
      const filtered = part3Topics.filter((t) => t !== "Random Topic");
      activeTopic = filtered[Math.floor(Math.random() * filtered.length)] ?? "Education";
    }
  }

  if (part === "PART2") {
    return [
      {
        id: "practice-part2-0",
        part: "PART2",
        kind: "cue_card",
        question: `Describe ${articleFor(activeTopic)} ${activeTopic.toLowerCase()}.`,
        cueCard: buildCueCard(activeTopic)
      }
    ];
  }

  const questions = part === "PART3" ? part3QuestionBank(activeTopic) : part1QuestionBank(activeTopic);
  return questions.slice(0, 5).map((question, index) => ({
    id: `practice-${part.toLowerCase()}-${index}`,
    part,
    kind: "question",
    question
  }));
}

export function isFinalPlannedQuestion(index: number, questions: PlannedQuestion[]) {
  return questions.length > 0 && index >= questions.length - 1;
}

function getNextPart(state: SessionState, turnIndex: number): SpeakingPart {
  if (state.mode !== "FULL_TEST") {
    return state.part;
  }

  if (turnIndex >= 7) {
    return "PART3";
  }

  if (turnIndex >= 4) {
    return "PART2";
  }

  return "PART1";
}

const part1QuestionMap: Record<string, string[]> = {
  "Work or study": [
    "Do you work or are you a student?",
    "What subjects are you studying? / What is your job?",
    "Why did you choose this study/job?",
    "Do you like your study/job?",
    "What do you dislike about your study/job?",
    "What are your future plans for your study or career?"
  ],
  "Hometown": [
    "Where is your hometown?",
    "What do you like most about your hometown?",
    "Is there anything you dislike about it?",
    "How long have you lived there?",
    "Would you like to live there in the future?",
    "Is it a good place for young people to grow up?"
  ],
  "Daily routine": [
    "What is your typical daily routine?",
    "What is your favorite part of the day?",
    "Do you think it is important to have a daily routine?",
    "Has your routine changed since you were a child?",
    "What would you change about your current routine if you could?",
    "Do you prefer a busy routine or a relaxed one?"
  ],
  "Music": [
    "Do you like listening to music?",
    "What kind of music do you prefer?",
    "When do you usually listen to music?",
    "Did you learn to play a musical instrument when you were young?",
    "Do you think music is important to people?",
    "Have you ever been to a live music concert?"
  ],
  "Food": [
    "What is your favorite kind of food?",
    "Do you prefer eating at home or eating out?",
    "What was your favorite food when you were a child?",
    "Do you like cooking? Why or why not?",
    "Is there any food you dislike?",
    "Do you think healthy eating is important?"
  ],
  "Travel": [
    "Do you like traveling?",
    "Where have you traveled to recently?",
    "Who do you usually travel with?",
    "Do you prefer traveling alone or in a group?",
    "Which country would you like to visit in the future?",
    "What is the best way to travel around your country?"
  ],
  "Technology": [
    "What kind of technology do you use most often in your daily life?",
    "Do you think technology has made our lives easier or more complicated?",
    "What is your favorite technological device?",
    "How often do you use the internet?",
    "Did you use much technology when you were a child?",
    "How do you think technology will change in the future?"
  ],
  "Weather": [
    "What is the weather like in your country?",
    "What is your favorite type of weather?",
    "Does the weather affect your mood?",
    "What do you usually do when it is raining?",
    "Do you prefer hot or cold weather?",
    "Has the weather in your hometown changed in recent years?"
  ],
  "Reading": [
    "Do you enjoy reading books?",
    "What kind of books do you like to read?",
    "Did you read many books when you were a child?",
    "Do you prefer reading physical books or e-books?",
    "Where is your favorite place to read?",
    "Do you think reading is a useful hobby?"
  ],
  "Sports": [
    "Do you play any sports?",
    "What is your favorite sport to watch or play?",
    "Did you do much sport when you were at school?",
    "Do you think it is important for children to play sports?",
    "Which sport would you like to try in the future?",
    "Are sports popular in your country?"
  ],
  "Hobby or leisure time": [
    "What do you like to do in your free time?",
    "Do you have any hobbies?",
    "Why do you enjoy doing these activities?",
    "How much free time do you usually have during the week?",
    "Did you have the same hobbies when you were younger?",
    "Is it important for people to have a hobby?"
  ],
  "Holidays": [
    "What do you usually do on holidays?",
    "Do you prefer long holidays or short ones?",
    "Where did you go for your last holiday?",
    "Who do you like to spend your holidays with?",
    "Do you think holidays are important for people?",
    "What is your dream holiday destination?"
  ],
  "Friends": [
    "Do you have many friends?",
    "What do you usually do with your friends?",
    "Who is your best friend, and why do you get along?",
    "How did you meet your friends?",
    "Do you prefer spending time with one friend or a group of friends?",
    "Is it easy for you to make new friends?"
  ],
  "Family": [
    "Can you tell me about your family?",
    "How much time do you spend with your family?",
    "What do you enjoy doing together as a family?",
    "Do you get along well with your family members?",
    "Who are you closest to in your family?",
    "Is family important in your culture?"
  ],
  "Pets or animals": [
    "Do you have any pets?",
    "What is your favorite animal?",
    "Have you ever had a pet when you were a child?",
    "Why do you think people keep pets?",
    "Are there many wild animals in your country?",
    "Do you like going to zoos?"
  ],
  "Transportation": [
    "How do you usually travel to work or school?",
    "What is the most popular form of public transport in your town?",
    "Do you prefer public transport or driving a car?",
    "Are there any traffic problems in your city?",
    "How has public transport changed in your town in recent years?",
    "What is your favorite way to travel long distances?"
  ],
  "Shopping": [
    "Do you enjoy shopping?",
    "What do you usually shop for?",
    "Do you prefer shopping online or in physical stores?",
    "How often do you go shopping?",
    "Is shopping a popular leisure activity in your country?",
    "Have you ever bought something online that you were unhappy with?"
  ],
  "Home or decoration": [
    "Do you live in a house or an apartment?",
    "Can you describe your home?",
    "What is your favorite room in your home?",
    "How is your home decorated?",
    "Would you like to change anything about your home in the future?",
    "Do you prefer modern or traditional home styles?"
  ]
};

const part3QuestionMap: Record<string, string[]> = {
  "Education": [
    "What makes a good teacher?",
    "How should schools prepare students for their future careers?",
    "Do you think online education is as effective as traditional classroom learning?",
    "Should higher education be free for everyone?",
    "How has the education system in your country changed over the last few decades?",
    "What role should technology play in classrooms?"
  ],
  "Society": [
    "What are the major challenges facing families in modern society?",
    "How does social media affect relationships between people?",
    "Do you think communities are stronger now than they were in the past?",
    "What can individuals do to help people in need in their local community?",
    "How do lifestyle differences affect the older and younger generations?",
    "Should governments spend more on public welfare or economic growth?"
  ],
  "Technology": [
    "How has technology changed the way people communicate?",
    "What are the negative effects of depending too much on smartphones?",
    "Do you think artificial intelligence will replace human jobs in the future?",
    "How can parents regulate their children's screen time?",
    "In what ways has technology changed modern workplaces?",
    "Is access to technology a basic human right?"
  ],
  "Culture": [
    "Why is it important to preserve traditional cultures?",
    "How does globalization affect local customs and traditions?",
    "What is the best way for tourists to learn about a new culture?",
    "Should governments fund museums and historical sites?",
    "How do cultural differences impact international business?",
    "How do young people in your country view traditional festivals?"
  ],
  "Environment": [
    "What are the main environmental problems in your country?",
    "How can individuals reduce their daily environmental footprint?",
    "Do you think green energy is the solution to climate change?",
    "Should governments fine companies that pollute the environment?",
    "How does environmental pollution affect public health?",
    "What can schools do to teach children about protecting nature?"
  ],
  "Work": [
    "What factors are most important when choosing a career?",
    "Is job satisfaction more important than a high salary?",
    "How has the concept of 'work-life balance' changed recently?",
    "Should employers offer flexible working hours or remote work options?",
    "How do technology and automation impact job security?",
    "What makes a successful business leader?"
  ],
  "Media": [
    "How has the way people get news changed in recent years?",
    "Do you think online news is reliable?",
    "What impact does advertising have on consumers?",
    "Should there be strict regulations on television and film content?",
    "How does media representation affect public opinion?",
    "Is print media (like newspapers) likely to disappear completely?"
  ],
  "Business and Career": [
    "What are the challenges of starting a new business?",
    "Should school curricula include business and financial education?",
    "What makes a business successful in the long term?",
    "How does corporate social responsibility affect a company's reputation?",
    "Why do some people prefer working for a corporation while others want to be self-employed?",
    "How is international trade beneficial to a country's economy?"
  ],
  "Festivals and Tourism": [
    "What are the benefits of tourism for local economies?",
    "How can mass tourism impact historic sites and the environment?",
    "Why do people travel to foreign countries instead of holidaying locally?",
    "How do festivals promote national pride and cultural understanding?",
    "Should travel be subsidized or made more affordable for everyone?",
    "How has the tourism industry changed with the rise of online booking platforms?"
  ],
  "Animals and Nature": [
    "Why is protecting endangered species important for biodiversity?",
    "Should animals be kept in zoos or reserves?",
    "How does climate change impact wildlife habitats?",
    "What is the relationship between humans and domesticated animals in modern cities?",
    "How can ecotourism benefit wildlife conservation efforts?",
    "Should there be stricter laws against animal cruelty?"
  ],
  "Family and Relationships": [
    "How do family structures affect child development?",
    "Why are healthy friendships important for emotional well-being?",
    "How has the definition of family evolved over time?",
    "What are the effects of work stress on family relationships?",
    "How do generational differences affect family communication?",
    "Should children be expected to care for their elderly parents?"
  ],
  "Hobby and Health": [
    "How do hobbies contribute to stress relief and mental health?",
    "Why is regular physical exercise essential for a healthy lifestyle?",
    "Should governments promote healthy living through public campaigns?",
    "How does sleep quality affect daily productivity and health?",
    "What is the link between diet and long-term health outcomes?",
    "How can people balance work, hobbies, and family time effectively?"
  ],
  "Shopping and Consumerism": [
    "How does consumerism impact the environment and waste production?",
    "What is the influence of social media influencers on buying behavior?",
    "Should advertising target children directly?",
    "Why do some people prefer brand-name items over generic ones?",
    "How has e-commerce changed traditional brick-and-mortar retail?",
    "What are the psychological reasons behind impulse buying?"
  ]
};

function normalizeTopicKey(topic: string): string {
  return topic
    .toLowerCase()
    .replace(/\band\b/g, "or")
    .replace(/\s+/g, " ")
    .trim();
}

function part1QuestionBank(topic: string) {
  const normalizedInput = normalizeTopicKey(topic);
  const foundKey = Object.keys(part1QuestionMap).find(
    (k) => normalizeTopicKey(k) === normalizedInput
  );
  const custom = foundKey ? part1QuestionMap[foundKey] : undefined;
  if (custom) return custom;
  
  return [
    `Let's talk about ${topic}. What are your general thoughts on this?`,
    `How often do you think about ${topic.toLowerCase()} in your daily life?`,
    `Was ${topic.toLowerCase()} important to you when you were younger?`,
    `Do people in your country talk about ${topic.toLowerCase()} very often?`,
    `Would you like to learn more about ${topic.toLowerCase()} in the future?`,
    `What kind of ${topic.toLowerCase()} do you prefer?`
  ];
}

function part3QuestionBank(topic: string) {
  const normalizedInput = normalizeTopicKey(topic);
  const foundKey = Object.keys(part3QuestionMap).find(
    (k) => normalizeTopicKey(k) === normalizedInput
  );
  const custom = foundKey ? part3QuestionMap[foundKey] : undefined;
  if (custom) return custom;

  return [
    `Why do you think ${topic.toLowerCase()} matters in modern society?`,
    `How has ${topic.toLowerCase()} changed compared with the past?`,
    `What problems can happen when people depend too much on ${topic.toLowerCase()}?`,
    `Do you think governments should pay more attention to ${topic.toLowerCase()}?`,
    `How might ${topic.toLowerCase()} change in the next ten years?`,
    `What differences are there between young and older people when it comes to ${topic.toLowerCase()}?`
  ];
}

function buildCueCard(topic: string) {
  return [
    `Describe ${articleFor(topic)} ${topic.toLowerCase()}.`,
    "You should say:",
    "- what it is",
    "- when you first knew about it",
    "- why it is important or memorable",
    "and explain how you feel about it."
  ].join("\n");
}

function articleFor(value: string) {
  return /^[aeiou]/i.test(value.trim()) ? "an" : "a";
}
