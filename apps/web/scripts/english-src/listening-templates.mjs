// Deterministic listening dialogue generators (P0.1). Real conversations; every answer is stated in the dialogue.
// Runtime shape: { level, title{en,ru}, lines[{speaker,en}], questions[{en,ru,options[],answer}] }.
import { rng } from './grammar-templates.mjs';

const pick = (r, a) => a[Math.floor(r() * a.length)];
const NAMES = ['Anna', 'Tom', 'Maria', 'Alex', 'Kate', 'Ivan', 'Olga', 'Ben', 'Sofia', 'Max'];
const PLACES = ['the library', 'the cinema', 'the park', 'the museum', 'the sports centre', 'the café'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIMES = ['three o\'clock', 'half past four', 'five o\'clock', 'half past six', 'ten o\'clock'];

function dialogue(level, titleEn, titleRu, lines, questions) {
  return { level, title: { en: titleEn, ru: titleRu }, lines: lines.map(([speaker, en]) => ({ speaker, en })), questions };
}
const q = (en, ru, correct, distractors) => {
  const options = [correct, ...distractors];
  return { en, ru, options, answer: 0 };
};

const TEMPLATES = [
  (r) => { // meeting someone
    const a = pick(r, NAMES), b = pick(r, NAMES.filter((n) => n !== a));
    return dialogue('A1', 'Meeting a New Friend', 'Знакомство с новым другом',
      [['A', `Hi! My name is ${a}. What's your name?`], ['B', `Hi ${a}! I'm ${b}. Nice to meet you.`], ['A', `Nice to meet you too. Are you new here?`], ['B', `Yes, this is my first day at school.`]],
      [q(`What is the second speaker's name?`, 'Как зовут второго собеседника?', b, [a, 'Lucy', 'Sam']), q('Is it the new pupil\'s first day?', 'Это первый день нового ученика?', 'Yes', ['No', 'It is the last day', 'Not stated'])]);
  },
  (r) => { // making plans
    const day = pick(r, DAYS), time = pick(r, TIMES), place = pick(r, PLACES);
    return dialogue('A2', 'Making Plans', 'Договариваемся о встрече',
      [['A', `Shall we meet on ${day}?`], ['B', `Yes, ${day} is good for me. What time?`], ['A', `Let's meet at ${time} in front of ${place}.`], ['B', `Great, see you at ${time} then.`]],
      [q('When will they meet?', 'Когда они встретятся?', `${day} at ${time}`, [`${day} at noon`, 'Sunday morning', 'Next week']), q('Where will they meet?', 'Где они встретятся?', `In front of ${place}`, ['At school', 'At the station', 'At home'])]);
  },
  (r) => { // shopping
    const item = pick(r, ['a T-shirt', 'a notebook', 'a backpack', 'a pen', 'a dictionary']);
    const price = pick(r, ['five pounds', 'ten pounds', 'twelve pounds', 'eight pounds', 'fifteen pounds']);
    return dialogue('A2', 'At the Shop', 'В магазине',
      [['A', `Can I help you?`], ['B', `Yes, I'd like ${item}, please. How much is it?`], ['A', `It's ${price}.`], ['B', `That's fine. I'll take it.`]],
      [q('What does the customer want to buy?', 'Что хочет купить покупатель?', item, ['a jacket', 'some food', 'a ticket']), q('How much does it cost?', 'Сколько это стоит?', price, ['twenty pounds', 'two pounds', 'one hundred pounds'])]);
  },
  (r) => { // asking the way
    const place = pick(r, ['the nearest bank', 'the post office', 'the train station', 'the city museum', 'the supermarket']);
    return dialogue('A2', 'Asking the Way', 'Спрашиваем дорогу',
      [['A', `Excuse me, how can I get to ${place}?`], ['B', `Go straight on and turn left at the traffic lights.`], ['A', `Is it far from here?`], ['B', `No, it's about five minutes on foot.`]],
      [q('Where does the person want to go?', 'Куда хочет попасть человек?', place, ['the airport', 'the hospital', 'the beach']), q('How far is it?', 'Как далеко это?', 'About five minutes on foot', ['Two hours by bus', 'Very far', 'Next to the shop'])]);
  },
  (r) => { // favourite subject
    const subj = pick(r, ['history', 'biology', 'English', 'maths', 'geography', 'art']);
    const a = pick(r, NAMES);
    return dialogue('A1', 'Favourite Subject', 'Любимый предмет',
      [['A', `What's your favourite subject, ${a}?`], ['B', `I like ${subj} best. It's really interesting.`], ['A', `Why do you like it?`], ['B', `Because our teacher makes every lesson fun.`]],
      [q(`What is ${a}'s favourite subject?`, `Какой любимый предмет у ${a}?`, subj, ['physics', 'music', 'chemistry']), q('Why does the pupil like it?', 'Почему ученику нравится предмет?', 'The teacher makes lessons fun', ['It is easy', 'There is no homework', 'It is short'])]);
  },
  (r) => { // restaurant
    const food = pick(r, ['a pizza', 'a salad', 'a sandwich', 'some pasta', 'soup']);
    const drink = pick(r, ['orange juice', 'a cup of tea', 'some water', 'a lemonade', 'coffee']);
    return dialogue('A2', 'Ordering Food', 'Заказываем еду',
      [['A', `Are you ready to order?`], ['B', `Yes, I'd like ${food}, please.`], ['A', `And to drink?`], ['B', `${drink}, please.`]],
      [q('What does the customer order to eat?', 'Что заказывает клиент поесть?', food, ['a burger', 'ice cream', 'fish and chips']), q('What does the customer order to drink?', 'Что заказывает клиент выпить?', drink, ['milk', 'hot chocolate', 'a smoothie'])]);
  },
  (r) => { // doctor appointment
    const day = pick(r, DAYS), time = pick(r, TIMES);
    return dialogue('B1', 'A Doctor\'s Appointment', 'Запись к врачу',
      [['A', `Good morning, I'd like to make an appointment with the doctor.`], ['B', `Certainly. Is ${day} at ${time} convenient for you?`], ['A', `Yes, that works. Should I bring anything?`], ['B', `Please bring your insurance card and arrive ten minutes early.`]],
      [q('When is the appointment?', 'Когда приём?', `${day} at ${time}`, ['Sunday at noon', 'Tomorrow morning', 'Next month']), q('What should the patient bring?', 'Что взять пациенту?', 'The insurance card', ['A referral letter', 'Some cash', 'Previous tests'])]);
  },
  (r) => { // train tickets
    const dest = pick(r, ['London', 'Manchester', 'Edinburgh', 'Oxford', 'Cambridge']);
    const platform = pick(r, ['platform 2', 'platform 4', 'platform 7', 'platform 9']);
    const price = pick(r, ['twenty pounds', 'thirty pounds', 'forty pounds', 'fifteen pounds']);
    return dialogue('B1', 'Buying a Train Ticket', 'Покупаем билет на поезд',
      [['A', `A ticket to ${dest}, please.`], ['B', `That's ${price}. The train leaves from ${platform}.`], ['A', `What time does it depart?`], ['B', `In twenty minutes. Here is your ticket.`]],
      [q('Where is the passenger travelling?', 'Куда едет пассажир?', dest, ['Paris', 'Berlin', 'Moscow']), q('How much is the ticket?', 'Сколько стоит билет?', price, ['one hundred pounds', 'five pounds', 'sixty pounds'])]);
  },
  (r) => { // library
    const book = pick(r, ['a novel', 'a science book', 'a history book', 'a dictionary', 'a book of poems']);
    const days = pick(r, ['two weeks', 'three weeks', 'one week', 'ten days']);
    return dialogue('A2', 'At the Library', 'В библиотеке',
      [['A', `I'd like to borrow ${book}, please.`], ['B', `Of course. You can keep it for ${days}.`], ['A', `Can I renew it online?`], ['B', `Yes, you can renew it once on our website.`]],
      [q('What does the person want to borrow?', 'Что хочет взять человек?', book, ['a magazine', 'a DVD', 'a newspaper']), q('How long can the book be kept?', 'На какой срок можно взять книгу?', days, ['one day', 'six months', 'two days'])]);
  },
  (r) => { // weekend weather
    const weather = pick(r, ['sunny', 'rainy', 'windy', 'cloudy', 'snowy']);
    const activity = pick(r, ['go for a walk', 'stay at home', 'visit a museum', 'read a book', 'watch a film']);
    return dialogue('A2', 'Weekend Plans', 'Планы на выходные',
      [['A', `What's the weather forecast for the weekend?`], ['B', `It will be ${weather}.`], ['A', `Then let's ${activity}.`], ['B', `Good idea, I'd love to.`]],
      [q('What will the weather be like?', 'Какая будет погода?', weather, ['hot and dry', 'stormy', 'foggy']), q('What do they decide to do?', 'Что они решают сделать?', activity, ['go swimming', 'play football', 'go shopping'])]);
  },
  (r) => { // sport
    const sport = pick(r, ['swimming', 'tennis', 'basketball', 'cycling', 'running']);
    const freq = pick(r, ['twice a week', 'every day', 'three times a week', 'at weekends', 'once a week']);
    const a = pick(r, NAMES);
    return dialogue('A2', 'Talking About Sport', 'Разговор о спорте',
      [['A', `Do you do any sport, ${a}?`], ['B', `Yes, I go ${sport} ${freq}.`], ['A', `That's great! Is it expensive?`], ['B', `No, it's quite cheap and good for health.`]],
      [q(`What sport does ${a} do?`, `Каким спортом занимается ${a}?`, sport, ['boxing', 'skiing', 'golf']), q('How often?', 'Как часто?', freq, ['once a year', 'never', 'every hour'])]);
  },
  (r) => { // phone message
    const caller = pick(r, NAMES);
    const reason = pick(r, ['the homework', 'the school trip', 'the football match', 'the project', 'the exam results']);
    return dialogue('B1', 'A Phone Message', 'Телефонное сообщение',
      [['A', `Hello, this is ${caller}. Can I speak to Sam?`], ['B', `I'm afraid Sam is out. Can I take a message?`], ['A', `Yes, please tell Sam I called about ${reason}.`], ['B', `OK, I'll pass the message on.`]],
      [q('Who is calling?', 'Кто звонит?', caller, ['Sam', 'The teacher', 'Nobody']), q('What is the call about?', 'О чём звонок?', reason, ['the weather', 'a party', 'the bus schedule'])]);
  },
];

// Generate `count` unique dialogues by cycling templates with varied parameters.
export function generateListening(count, seed = 1) {
  const r = rng(seed);
  const out = [];
  const seen = new Set();
  let guard = 0;
  while (out.length < count && guard < count * 80) {
    guard++;
    const d = pick(r, TEMPLATES)(r);
    const key = d.title.en + '|' + d.lines.map((l) => l.en).join('/');
    if (seen.has(key)) continue;
    seen.add(key);
    // vary the correct-answer position so it is not always first
    const questions = d.questions.map((qq) => {
      const correct = qq.options[qq.answer];
      const opts = [...qq.options];
      for (let i = opts.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]]; }
      return { ...qq, options: opts, answer: opts.indexOf(correct) };
    });
    out.push({ ...d, questions });
  }
  return out;
}