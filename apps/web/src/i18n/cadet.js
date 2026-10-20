// Кадетская версия: уставной, но доброжелательный тон. Переопределяет только названия, не учебное содержание.
// Звания — внутренние звания кадетских корпусов («вице-»), присваиваются за выслугу (опыт) в приложении.
export const RANKS = {
  ru: ['Кадет', 'Вице-ефрейтор', 'Вице-младший сержант', 'Вице-сержант', 'Вице-старший сержант', 'Вице-старшина'],
  en: ['Cadet', 'Cadet lance corporal', 'Cadet junior sergeant', 'Cadet sergeant', 'Cadet senior sergeant', 'Cadet sergeant major'],
};
export const XP_PER_RANK = 250;
export function rankOf(xp, locale = 'ru') {
  const list = RANKS[locale] || RANKS.en;
  const i = Math.min(list.length - 1, Math.floor((xp || 0) / XP_PER_RANK));
  const next = i < list.length - 1 ? (i + 1) * XP_PER_RANK - (xp || 0) : 0;
  return { name: list[i], index: i, next, nextName: list[i + 1] || '' };
}

export default {
  ru: {
    'nav.home': 'Штаб', 'nav.lesson': 'Занятие', 'nav.talk': 'Доклад', 'nav.games': 'Учения',
    'nav.shop': 'Знаки отличия', 'nav.progress': 'Послужной список', 'nav.settings': 'Настройки', 'nav.logout': 'Выйти',
    'picker.title': 'Твой наставник', 'picker.choose': 'К занятиям готов!',
    'home.hello': 'Здравия желаю, кадет {name}!',
    'home.subtitle': 'Задача на сегодня поставлена. К выполнению приступить!',
    'home.startLesson': 'Приступить к занятию', 'home.lessonDesc': 'Учебная задача: набор заданий под твой уровень',
    'home.quickTalk': 'Доклад наставнику', 'home.talkDesc': 'Устный доклад по-английски: голосом или текстом',
    'home.playGames': 'Учения', 'home.gamesDesc': 'Тактические игры на слова и грамматику',
    'home.level': 'Уровень', 'home.xp': 'Выслуга', 'home.coins': 'Жетоны', 'home.streak': 'Без пропусков',
    'home.accuracy': 'Меткость', 'home.attempts': 'Ответов',
    'home.myTeacher': 'Наставник', 'home.changeTeacher': 'Сменить',
    'home.tip.title': 'Слово дня',
    'lesson.setup.title': 'Новое занятие', 'lesson.setup.start': 'Приступить',
    'lesson.results.title': 'Задача выполнена!', 'lesson.results.accuracy': 'Меткость', 'lesson.results.xp': 'Выслуга', 'lesson.results.coins': 'Жетоны',
    'lesson.results.again': 'Ещё одно занятие', 'lesson.results.home': 'В штаб',
    'task.correct': 'Так точно!', 'task.wrong': 'Отставить! Ещё раз.', 'task.check': 'Проверить',
    'talk.title': 'Доклад наставнику', 'talk.subtitle': 'Докладывай {name} по-английски: голосом или текстом.',
    'talk.done.title': 'Доклад принят!', 'talk.done.xp': 'Выслуга', 'talk.exit': 'Закончить доклад',
    'games.title': 'Учебный полигон', 'games.subtitle': 'Учения со словами и грамматикой из занятий: зарабатывай жетоны.',
    'games.play': 'К учениям', 'games.back': 'На полигон', 'games.win': 'Победа!', 'games.reward': 'Поощрение',
    'games.shooter.name': 'Стрельбище ошибок', 'games.quest.name': 'Спасательная операция', 'games.quest.desc': 'Сюжетная операция: решай задания и выручай товарища',
    'shop.title': 'Знаки отличия', 'shop.subtitle': 'Жетоны за службу: открывай наставников, темы и музыку.',
    'shop.buy': 'Получить', 'shop.owned': 'Получено', 'shop.notEnough': 'Не хватает жетонов: отличись на учениях!',
    'progress.title': 'Послужной список', 'progress.badges': 'Награды', 'progress.level.next': '{xp} очков выслуги до следующего звания',
    'settings.teacher': 'Мой наставник',
    'cadet.rank': 'Звание', 'cadet.toNext': 'до звания «{rank}»: {xp}', 'cadet.maxRank': 'высшее звание',
    'cadet.task.title': 'Задача на сегодня',
    'cadet.task.1': 'Занятие по английскому', 'cadet.task.1d': '8 заданий, около 10 минут',
    'cadet.task.2': 'Доклад наставнику', 'cadet.task.2d': 'Расскажи по-английски, как прошёл день',
    'cadet.task.3': 'Самоподготовка по программе', 'cadet.task.3d': 'История, ОБЗР, физическая культура и другие предметы по ФОП',
    'cadet.locked': 'Версию задала школа',
  },
  en: {
    'nav.home': 'HQ', 'nav.lesson': 'Drill', 'nav.talk': 'Report', 'nav.games': 'Exercises', 'nav.shop': 'Insignia', 'nav.progress': 'Service record',
    'home.hello': 'Good day, cadet {name}!', 'home.subtitle': 'Today’s task is set. Carry on!',
    'home.startLesson': 'Start the drill', 'home.quickTalk': 'Report to your mentor', 'home.playGames': 'Exercises',
    'home.xp': 'Service points', 'home.coins': 'Tokens', 'home.myTeacher': 'Mentor', 'home.tip.title': 'Word of the day',
    'task.correct': 'Correct, sir!', 'task.wrong': 'As you were! Try again.',
    'lesson.results.title': 'Mission complete!', 'shop.title': 'Insignia', 'progress.title': 'Service record',
    'cadet.rank': 'Rank', 'cadet.toNext': 'to “{rank}”: {xp}', 'cadet.maxRank': 'top rank',
    'cadet.task.title': 'Today’s task', 'cadet.task.1': 'English drill', 'cadet.task.1d': '8 tasks, about 10 minutes',
    'cadet.task.2': 'Report to your mentor', 'cadet.task.2d': 'Tell how your day went, in English',
    'cadet.task.3': 'School programme', 'cadet.task.3d': 'History, safety & defence, PE and other subjects',
    'cadet.locked': 'Version set by the school',
  },
};
