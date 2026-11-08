// P0.4 — ОГЭ / ЕГЭ English trainer (ФИПИ-2026 format).
// ORIGINAL practice content written for this app — NOT official ФИПИ materials and NOT a real exam.
// Mirrors the interface of exams.js so ExamCenter can reuse its run / writing / speaking / result logic.
// Objective items are auto-graded by exact option match; writing/speaking go through the guarded AI tasks
// (grade_writing / speaking_feedback) with the child-safety filter running first (see ai/useAI.js).

export const RU_IDS = ['oge', 'ege'];

export const EXAMS_RU = {
  oge: {
    id: 'oge', name: 'ОГЭ', color: '#2e7d32', scale: 'Оценка 2–5',
    sections: ['listening', 'reading', 'use', 'writing', 'speaking'],
    note: 'Тренировка формата ОГЭ (9 класс). Оригинальные задания, не официальные материалы ФИПИ. Оценка приблизительная.',
  },
  ege: {
    id: 'ege', name: 'ЕГЭ', color: '#6a1b9a', scale: 'Балл 0–100',
    sections: ['listening', 'reading', 'use', 'writing', 'speaking'],
    note: 'Тренировка формата ЕГЭ (11 класс), включая задание 38. Оригинальные задания, не официальные материалы ФИПИ. Балл приблизительный.',
  },
};

// ----READING (passage + comprehension items) ----
const READING = {
  oge: [
    {
      passage: 'Last spring our class started a small vegetable garden behind the school. At first nobody believed that anything would grow on the dry soil near the sports field. Our biology teacher, Mrs Orlova, showed us how to prepare the ground and choose the right seeds. We worked in pairs every Friday afternoon. By June we had collected our first harvest of tomatoes and cucumbers. The vegetables were used in the school canteen, and younger pupils were invited to taste them. Many of them asked how they could start a garden at home.',
      items: [
        { q: 'Where was the school garden located?', options: ['In front of the main entrance', 'Behind the school, near the sports field', 'On the roof of the building', 'In the city park'], answer: 'Behind the school, near the sports field', skill: 'reading' },
        { q: 'When did the pupils work in the garden?', options: ['Every Monday morning', 'Every Friday afternoon', 'Only during the holidays', 'Every day after lessons'], answer: 'Every Friday afternoon', skill: 'reading' },
        { q: 'What happened to the first harvest?', options: ['It was sold at a market', 'It was given to the teachers', 'It was used in the school canteen', 'It was sent to another school'], answer: 'It was used in the school canteen', skill: 'reading' },
      ],
    },
    {
      passage: 'The Baikal is the deepest lake in the world and holds about one fifth of the planet\'s fresh surface water. It is home to thousands of species of plants and animals, and many of them are found nowhere else on Earth. The most famous of these is the Baikal seal, one of the few seals that live only in fresh water. In recent years scientists have warned that pollution and uncontrolled tourism can harm this unique ecosystem. Local volunteers now organise clean-up days and teach visitors how to behave responsibly near the shore.',
      items: [
        { q: 'What makes Lake Baikal special according to the text?', options: ['It is the largest lake by area', 'It is the deepest lake in the world', 'It is the warmest lake in Russia', 'It is a salt-water lake'], answer: 'It is the deepest lake in the world', skill: 'reading' },
        { q: 'What is unusual about the Baikal seal?', options: ['It lives only in fresh water', 'It is the largest seal', 'It can fly short distances', 'It lives only in the sea'], answer: 'It lives only in fresh water', skill: 'reading' },
        { q: 'What do local volunteers do?', options: ['Build new hotels', 'Organise clean-up days and teach visitors', 'Catch fish for sale', 'Close the lake to everyone'], answer: 'Organise clean-up days and teach visitors', skill: 'reading' },
      ],
    },
    {
      passage: 'Reading books before going to sleep is a habit that many doctors recommend. Unlike bright screens, a paper book does not send blue light into the eyes, so the brain receives a signal that it is time to rest. A short story can also help a person forget the worries of the day and fall asleep faster. However, experts warn that exciting thrillers or work-related texts may have the opposite effect and keep the mind active. The best choice, they say, is something calm and not too long.',
      items: [
        { q: 'Why is a paper book better than a screen before sleep?', options: ['It is cheaper', 'It does not send blue light into the eyes', 'It is heavier', 'It has more pictures'], answer: 'It does not send blue light into the eyes', skill: 'reading' },
        { q: 'What kind of text may keep the mind active?', options: ['A calm short story', 'A poem about nature', 'Exciting thrillers or work-related texts', 'A children\'s fairy tale'], answer: 'Exciting thrillers or work-related texts', skill: 'reading' },
        { q: 'What do experts recommend choosing?', options: ['Something calm and not too long', 'The longest novel possible', 'A textbook for exams', 'News about politics'], answer: 'Something calm and not too long', skill: 'reading' },
      ],
    },
  ],
  ege: [
    {
      passage: 'The concept of a "smart city" goes far beyond installing sensors and cameras. At its core lies the idea that data should serve people, not the other way around. When transport systems share real-time information, buses arrive when passengers actually need them rather than following a rigid timetable. When energy grids adjust to consumption patterns, waste falls and bills shrink. Yet critics point out that a city obsessed with efficiency can forget about spontaneity: the unexpected meeting in a square, the small shop that survives because a street is not "optimised". The most successful projects, therefore, treat technology as a tool that protects human variety rather than erasing it.',
      items: [
        { q: 'What is the core idea of a smart city according to the author?', options: ['Installing as many cameras as possible', 'Data should serve people', 'Replacing all buses with trains', 'Making every street identical'], answer: 'Data should serve people', skill: 'reading' },
        { q: 'What concern do critics raise?', options: ['Smart cities are too cheap to build', 'Efficiency can erase spontaneity and human variety', 'Sensors never work in winter', 'People dislike free public transport'], answer: 'Efficiency can erase spontaneity and human variety', skill: 'reading' },
        { q: 'What do the most successful projects do?', options: ['Remove all small shops', 'Protect human variety with technology', 'Follow a rigid timetable', 'Ignore consumption patterns'], answer: 'Protect human variety with technology', skill: 'reading' },
      ],
    },
    {
      passage: 'For decades, learning a foreign language was thought to be the privilege of the young: children absorb sounds effortlessly, while adults struggle with grammar tables. Modern research challenges this comfortable myth. Adults, it turns out, bring advantages that children lack — a richer vocabulary in their native tongue, disciplined study habits and the ability to understand abstract rules. What adults lose is not the capacity to learn but the willingness to make mistakes in public. The learners who progress fastest are those who accept sounding imperfect and treat every error as information rather than embarrassment.',
      items: [
        { q: 'What "comfortable myth" does the text challenge?', options: ['Adults cannot learn grammar', 'Only the young can truly learn a language', 'Children never make mistakes', 'Vocabulary is unimportant'], answer: 'Only the young can truly learn a language', skill: 'reading' },
        { q: 'Which advantage do adults have over children?', options: ['They absorb sounds more easily', 'They never forget words', 'Disciplined study habits and abstract reasoning', 'They speak without an accent'], answer: 'Disciplined study habits and abstract reasoning', skill: 'reading' },
        { q: 'According to the text, what slows adults down most?', options: ['Lack of textbooks', 'Unwillingness to make mistakes in public', 'Poor memory', 'Too much free time'], answer: 'Unwillingness to make mistakes in public', skill: 'reading' },
      ],
    },
    {
      passage: 'The history of coffee is a history of globalisation in a cup. Originating in the highlands of Ethiopia, the bean travelled through Yemen, where it was first cultivated, then into the Ottoman Empire, where coffee houses became centres of conversation and news. European traders carried it home in the seventeenth century, and within decades cafés from Vienna to London were shaping politics, commerce and literature. Today the drink connects farmers on three continents with consumers in almost every country, raising difficult questions about fair prices and sustainable farming that no single government can answer alone.',
      items: [
        { q: 'Where was coffee first cultivated?', options: ['Ethiopia', 'Yemen', 'The Ottoman Empire', 'London'], answer: 'Yemen', skill: 'reading' },
        { q: 'What role did coffee houses play in the Ottoman Empire?', options: ['They were used as prisons', 'They became centres of conversation and news', 'They sold only tea', 'They were closed to traders'], answer: 'They became centres of conversation and news', skill: 'reading' },
        { q: 'What modern issue does the text highlight?', options: ['The decline of tea drinking', 'Fair prices and sustainable farming', 'The invention of instant coffee', 'A ban on cafés in Europe'], answer: 'Fair prices and sustainable farming', skill: 'reading' },
      ],
    },
  ],
};

// ----LISTENING (transcript played via TTS + items) ----
const LISTENING = {
  oge: [
    {
      transcript: 'Good morning, students. The sports competition that was planned for Saturday has been moved to Sunday because of the weather forecast. All events will take place in the main gym instead of the outdoor stadium. Please bring your indoor shoes and a bottle of water. Registration starts at nine o\'clock.',
      items: [
        { q: 'Why was the competition moved?', options: ['Because of the weather forecast', 'Because the gym was closed', 'Because of a holiday', 'Because too few students signed up'], answer: 'Because of the weather forecast', skill: 'listening' },
        { q: 'What should students bring?', options: ['A packed lunch', 'Indoor shoes and a bottle of water', 'Their own medals', 'A football'], answer: 'Indoor shoes and a bottle of water', skill: 'listening' },
      ],
    },
    {
      transcript: 'A: Are you going to the book fair this weekend? B: Yes, but I can only go on Saturday afternoon. A: Perfect, the author I like is signing copies at four. B: Great, let\'s meet at the entrance at half past three.',
      items: [
        { q: 'When will the friends meet?', options: ['At three o\'clock', 'At half past three', 'At four o\'clock', 'At half past four'], answer: 'At half past three', skill: 'listening' },
        { q: 'What happens at four o\'clock?', options: ['The fair closes', 'An author signs copies', 'A film starts', 'The entrance opens'], answer: 'An author signs copies', skill: 'listening' },
      ],
    },
    {
      transcript: 'Attention, passengers. The express train to Saint Petersburg will depart from platform three with a delay of fifteen minutes. Passengers are asked to keep their tickets ready for inspection. The dining car is located in the middle of the train.',
      items: [
        { q: 'How long is the delay?', options: ['Five minutes', 'Ten minutes', 'Fifteen minutes', 'Fifty minutes'], answer: 'Fifteen minutes', skill: 'listening' },
        { q: 'Where is the dining car?', options: ['At the front', 'At the back', 'In the middle of the train', 'On platform three'], answer: 'In the middle of the train', skill: 'listening' },
      ],
    },
  ],
  ege: [
    {
      transcript: 'Welcome to today\'s lecture on memory. Many students believe that re-reading notes is the best way to prepare for exams. Research shows, however, that active recall — testing yourself without looking at the material — produces far stronger long-term retention. The reason is simple: every time you retrieve a fact, the neural pathway leading to it becomes a little stronger. Spacing your practice over several days, rather than cramming the night before, multiplies this effect.',
      items: [
        { q: 'What study method does research recommend?', options: ['Re-reading notes many times', 'Active recall — testing yourself', 'Listening to music while studying', 'Cramming the night before'], answer: 'Active recall — testing yourself', skill: 'listening' },
        { q: 'Why does retrieval strengthen memory?', options: ['It relaxes the brain', 'The neural pathway becomes stronger', 'It uses less energy', 'It replaces sleep'], answer: 'The neural pathway becomes stronger', skill: 'listening' },
      ],
    },
    {
      transcript: 'A: I read that the new museum exhibition uses virtual reality. B: Yes, you can walk through an ancient city as if you were really there. A: Do we need to book tickets in advance? B: Definitely. Online tickets are twenty percent cheaper and the time slots fill up quickly, especially at weekends.',
      items: [
        { q: 'What is special about the exhibition?', options: ['It is free for everyone', 'It uses virtual reality', 'It shows modern art only', 'It is outdoors'], answer: 'It uses virtual reality', skill: 'listening' },
        { q: 'What advantage do online tickets have?', options: ['They are twenty percent cheaper', 'They allow skipping the queue', 'They include a guide', 'They are valid for a month'], answer: 'They are twenty percent cheaper', skill: 'listening' },
      ],
    },
    {
      transcript: 'This is an announcement for volunteers. The city tree-planting day will be held on the twenty-fifth of April. Participants should gather near the central library at ten in the morning. Gloves and tools will be provided, but please wear comfortable clothes and closed shoes. In case of heavy rain the event will be postponed by one week.',
      items: [
        { q: 'Where should participants gather?', options: ['Near the central library', 'In the city park', 'At the train station', 'Near the museum'], answer: 'Near the central library', skill: 'listening' },
        { q: 'What happens if there is heavy rain?', options: ['The event is cancelled forever', 'It is postponed by one week', 'It moves indoors', 'It starts earlier'], answer: 'It is postponed by one week', skill: 'listening' },
      ],
    },
  ],
};

// ----USE OF ENGLISH (grammar transformation + word formation + lexical choice) ----
const USE = {
  oge: [
    { q: 'Grammar: She ___ to school every day when she was a child.', options: ['go', 'goes', 'went', 'gone'], answer: 'went', skill: 'grammar' },
    { q: 'Grammar: There are ___ apples on the table.', options: ['much', 'a little', 'a few', 'any'], answer: 'a few', skill: 'grammar' },
    { q: 'Grammar: This is the ___ book I have ever read.', options: ['interesting', 'more interesting', 'most interesting', 'interest'], answer: 'most interesting', skill: 'grammar' },
    { q: 'Grammar: If it rains tomorrow, we ___ at home.', options: ['stay', 'will stay', 'stayed', 'would stay'], answer: 'will stay', skill: 'grammar' },
    { q: 'Grammar: The letter ___ by post yesterday.', options: ['sent', 'was sent', 'is sent', 'sends'], answer: 'was sent', skill: 'grammar' },
    { q: 'Grammar: I have lived here ___ 2015.', options: ['for', 'since', 'from', 'during'], answer: 'since', skill: 'grammar' },
    { q: 'Grammar: He asked me where ___.', options: ['do I live', 'I lived', 'did I live', 'I live'], answer: 'I lived', skill: 'grammar' },
    { q: 'Grammar: You ___ wear a uniform at this school. It is a rule.', options: ['must', 'may', 'can', 'might'], answer: 'must', skill: 'grammar' },
    { q: 'Word formation: The weather was ___ and we stayed inside. (SUN)', options: ['sun', 'sunny', 'sunshine', 'sunless'], answer: 'sunny', skill: 'vocab' },
    { q: 'Word formation: She made an important ___ at the meeting. (DECIDE)', options: ['decide', 'decision', 'decisive', 'decided'], answer: 'decision', skill: 'vocab' },
    { q: 'Word formation: The trip was very ___. (ENJOY)', options: ['enjoy', 'enjoyable', 'enjoyment', 'enjoying'], answer: 'enjoyable', skill: 'vocab' },
    { q: 'Word formation: He is a famous ___. (SCIENCE)', options: ['science', 'scientific', 'scientist', 'sciences'], answer: 'scientist', skill: 'vocab' },
    { q: 'Word formation: They waited ___ for the bus. (PATIENT)', options: ['patient', 'patience', 'patiently', 'patients'], answer: 'patiently', skill: 'vocab' },
    { q: 'Vocabulary: We need to ___ a decision before Friday.', options: ['do', 'make', 'take', 'get'], answer: 'make', skill: 'vocab' },
    { q: 'Vocabulary: The synonym of "begin" is…', options: ['finish', 'start', 'stop', 'end'], answer: 'start', skill: 'vocab' },
    { q: 'Vocabulary: She is very keen ___ music.', options: ['on', 'in', 'at', 'of'], answer: 'on', skill: 'vocab' },
    { q: 'Vocabulary: I am looking forward to ___ you.', options: ['see', 'seeing', 'saw', 'seen'], answer: 'seeing', skill: 'vocab' },
    { q: 'Vocabulary: The opposite of "expensive" is…', options: ['cheap', 'costly', 'valuable', 'rich'], answer: 'cheap', skill: 'vocab' },
  ],
  ege: [
    { q: 'Grammar: By next June, she ___ her degree.', options: ['finishes', 'will finish', 'will have finished', 'finished'], answer: 'will have finished', skill: 'grammar' },
    { q: 'Grammar: If I ___ you, I would accept the offer.', options: ['am', 'was', 'were', 'be'], answer: 'were', skill: 'grammar' },
    { q: 'Grammar: The project ___ for two hours before it crashed.', options: ['ran', 'had been running', 'has run', 'runs'], answer: 'had been running', skill: 'grammar' },
    { q: 'Grammar: Not only ___ the exam, but she also got the top mark.', options: ['she passed', 'did she pass', 'she did pass', 'passed she'], answer: 'did she pass', skill: 'grammar' },
    { q: 'Grammar: The results, ___ were published yesterday, surprised everyone.', options: ['that', 'which', 'what', 'who'], answer: 'which', skill: 'grammar' },
    { q: 'Grammar: He denied ___ the money.', options: ['to take', 'taking', 'take', 'took'], answer: 'taking', skill: 'grammar' },
    { q: 'Grammar: Hardly ___ arrived when the phone rang.', options: ['I had', 'had I', 'I have', 'have I'], answer: 'had I', skill: 'grammar' },
    { q: 'Grammar: The house needs ___.', options: ['to repair', 'repairing', 'repair', 'repaired'], answer: 'repairing', skill: 'grammar' },
    { q: 'Grammar: She suggested ___ to the cinema.', options: ['to go', 'going', 'go', 'went'], answer: 'going', skill: 'grammar' },
    { q: 'Grammar: It is high time we ___ home.', options: ['go', 'went', 'will go', 'have gone'], answer: 'went', skill: 'grammar' },
    { q: 'Word formation: The ___ of the bridge took three years. (CONSTRUCT)', options: ['construct', 'construction', 'constructive', 'constructor'], answer: 'construction', skill: 'vocab' },
    { q: 'Word formation: His argument was completely ___. (LOGIC)', options: ['logic', 'logical', 'illogical', 'logically'], answer: 'illogical', skill: 'vocab' },
    { q: 'Word formation: The team worked with great ___. (EFFICIENT)', options: ['efficient', 'efficiency', 'efficiently', 'efficiencies'], answer: 'efficiency', skill: 'vocab' },
    { q: 'Word formation: She gave a ___ description of the event. (DETAIL)', options: ['detail', 'detailed', 'detailing', 'details'], answer: 'detailed', skill: 'vocab' },
    { q: 'Word formation: The ___ between the two cities is growing. (CONNECT)', options: ['connect', 'connection', 'connected', 'connecting'], answer: 'connection', skill: 'vocab' },
    { q: 'Word formation: His behaviour was quite ___. (EXPECT)', options: ['expect', 'expected', 'unexpected', 'expectation'], answer: 'unexpected', skill: 'vocab' },
    { q: 'Vocabulary: The company decided to ___ advantage of new opportunities.', options: ['take', 'make', 'do', 'get'], answer: 'take', skill: 'vocab' },
    { q: 'Vocabulary: Choose the synonym of "significant".', options: ['minor', 'important', 'tiny', 'weak'], answer: 'important', skill: 'vocab' },
    { q: 'Vocabulary: The new policy will come into ___ next month.', options: ['effect', 'affect', 'effort', 'affair'], answer: 'effect', skill: 'vocab' },
    { q: 'Vocabulary: She played a key ___ in the negotiations.', options: ['part', 'role', 'place', 'side'], answer: 'role', skill: 'vocab' },
    { q: 'Vocabulary: The evidence ___ that further research is needed.', options: ['suggests', 'suggest', 'is suggesting', 'suggesting'], answer: 'suggests', skill: 'vocab' },
    { q: 'Vocabulary: "Mitigate" most nearly means…', options: ['worsen', 'reduce the severity of', 'ignore', 'prevent entirely'], answer: 'reduce the severity of', skill: 'vocab' },
    { q: 'Vocabulary: He was ___ of the charges after new evidence appeared.', options: ['accused', 'acquitted', 'convicted', 'charged'], answer: 'acquitted', skill: 'vocab' },
    { q: 'Vocabulary: The committee consists ___ ten members.', options: ['of', 'from', 'with', 'by'], answer: 'of', skill: 'vocab' },
  ],
};

// ----WRITING (free text → guarded grade_writing) ----
// minWords / maxWords reflect the ФИПИ-2026 word ranges; the AI gives a practice estimate, not an official mark.
const WRITING = {
  oge: [
    { task: 'Задание 35 (электронное письмо). You have received an email from your English-speaking pen-friend Tom: "…Last week our class went on a school trip. Where do you usually go on school trips? What do you enjoy most about them? How do you prepare for a trip?…" Write a reply to Tom. Answer his 3 questions and ask 3 questions about his school trip. Write 100–120 words.', minWords: 100, maxWords: 120 },
    { task: 'Задание 35 (электронное письмо). Your pen-friend Alice writes: "…I have just started learning a new sport. What sport would you like to try? Why do you think it is good for teenagers? How often do you do sport?…" Write a reply. Answer her 3 questions and ask 3 questions about her new sport. Write 100–120 words.', minWords: 100, maxWords: 120 },
  ],
  ege: [
    { task: 'Задание 37 (электронное письмо). You have received an email from your pen-friend Ben: "…Our school is organising a charity event next month. What charity events have you taken part in? Why do you think teenagers should help others? How would you organise a charity event at your school?…" Write a reply. Answer his 3 questions and ask 3 questions about the charity event. Write 100–140 words.', minWords: 100, maxWords: 140 },
    { task: 'Задание 38 (проект по таблице). Imagine that you are doing a project on what teenagers spend their pocket money on. You have found some data: buying snacks — 45%, saving money — 25%, buying clothes — 18%, entertainment — 12%. Write 200–250 words. Summarise the data, make comparisons, outline a problem that can arise with spending money and suggest a way to solve it, and conclude by giving your opinion on the importance of financial literacy for teenagers.', minWords: 200, maxWords: 250 },
    { task: 'Задание 38 (проект по диаграмме). Imagine that you are doing a project on how students prefer to study. You have found some data: studying alone — 40%, in a group with friends — 30%, with a tutor — 20%, online courses — 10%. Write 200–250 words. Summarise the data, make comparisons, outline a problem that can arise when studying and suggest a solution, and conclude with your opinion on the best way to prepare for exams.', minWords: 200, maxWords: 250 },
  ],
};

// ----SPEAKING (free speech → guarded speaking_feedback / self-check) ----
const SPEAKING = {
  oge: [
    'Задание 1 (чтение вслух). Read the text aloud. You have 1.5 minutes to prepare and 1.5 minutes to read: "The Trans-Siberian Railway is one of the longest railways in the world. It connects Moscow with the Far East and crosses eight time zones. Travellers can see forests, mountains and small villages from the window. The full journey takes about seven days."',
    'Задание 2 (диалог-расспрос). Answer six questions of an electronic assistant. Topic: your school. Example questions: What is your favourite subject? How many lessons do you have a day? Do you wear a uniform? What do you usually do during breaks? Have you ever taken part in a school competition? Would you like to study abroad?',
    'Задание 3 (монолог). Give a talk about your hobby. Remember to say: what your hobby is; how long you have been doing it; why you enjoy it; and explain whether you would recommend this hobby to a friend. You should talk for about two minutes (10–12 sentences).',
  ],
  ege: [
    'Задание 1 (чтение вслух). Read the text aloud (1.5 min preparation, 1.5 min reading): "Renewable energy is changing the way cities are powered. Solar panels and wind turbines now supply electricity to millions of homes. Engineers are working on better ways to store energy so that power is available even when the sun does not shine and the wind does not blow."',
    'Задание 2 (вопросы по объявлению). You see an advertisement: "International Summer Camp — learn languages, make friends, explore nature!" Ask four direct questions to find out: the dates of the camp; the price; what languages are taught; whether accommodation is included.',
    'Задание 3 (интервью). Answer five questions of an interviewer. Topic: reading. Example: Do you prefer paper books or e-books? Why? How often do you read? What book impressed you recently? Would you advise young people to read more? What genres are popular among your friends?',
    'Задание 4 (проектный монолог). Compare and contrast two photographs: one shows students studying in a traditional classroom, the other shows a person learning online at home. Explain the advantages and disadvantages of each way of studying, express your opinion on which is more effective for teenagers, and give reasons. Speak for about three minutes.',
  ],
};

export const BANKS_RU = { READING, LISTENING, USE, WRITING, SPEAKING };

export function objectiveItemsRu(examId, section) {
  const bank = section === 'reading' ? READING : section === 'listening' ? LISTENING : section === 'use' ? USE : null;
  if (!bank || !bank[examId]) return [];
  if (section === 'reading') return bank[examId].flatMap((p) => p.items.map((it) => ({ ...it, passage: p.passage })));
  if (section === 'listening') return bank[examId].flatMap((p) => p.items.map((it) => ({ ...it, transcript: p.transcript })));
  return bank[examId].slice();
}

export function buildMockRu(examId, n = 20) {
  const pool = [...objectiveItemsRu(examId, 'reading'), ...objectiveItemsRu(examId, 'listening'), ...objectiveItemsRu(examId, 'use')];
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, Math.min(n, pool.length));
}

// Approximate practice mapping only — never an official ФИПИ score.
export function ogeMark(acc) { return acc >= 0.85 ? 5 : acc >= 0.65 ? 4 : acc >= 0.45 ? 3 : 2; }
export function egeScore(acc) { return Math.round(Math.max(0, Math.min(100, acc * 100))); }
export function cefrLevel(acc) {
  return acc >= 0.9 ? 'B2–C1' : acc >= 0.75 ? 'B2' : acc >= 0.6 ? 'B1–B2' : acc >= 0.45 ? 'B1' : acc >= 0.3 ? 'A2' : 'A1';
}
export function estimateRu(examId, acc) {
  return examId === 'oge'
    ? { headline: 'Оценка: ' + ogeMark(acc), cefr: cefrLevel(acc) }
    : { headline: 'Балл: ~' + egeScore(acc) + ' / 100', cefr: cefrLevel(acc) };
}