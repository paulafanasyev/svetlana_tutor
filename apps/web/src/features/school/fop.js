import math from '../../data/fop/math.json';
import english from '../../data/fop/english.json';
import russianNoo from '../../data/fop/russian_noo.json';
import readingNoo from '../../data/fop/literary_reading_noo.json';
import worldNoo from '../../data/fop/world_noo.json';
import mathNoo from '../../data/fop/math_noo.json';
import orkseNoo from '../../data/fop/orkse_noo.json';
import artNoo from '../../data/fop/art_noo.json';
import musicNoo from '../../data/fop/music_noo.json';
import techNoo from '../../data/fop/tech_noo.json';
import peNoo from '../../data/fop/pe_noo.json';
import historyOoo from '../../data/fop/history_ooo.json';
import physicsOoo from '../../data/fop/physics_ooo.json';
import chemistryOoo from '../../data/fop/chemistry_ooo.json';
import biologyOoo from '../../data/fop/biology_ooo.json';
import informaticsOoo from '../../data/fop/informatics_ooo.json';
import socialOoo from '../../data/fop/social_ooo.json';
import geography5 from '../../data/fop/geography_5.json';
import geography6 from '../../data/fop/geography_6.json';
import geography7 from '../../data/fop/geography_7.json';
import geography8 from '../../data/fop/geography_8.json';
import geography9 from '../../data/fop/geography_9.json';
import russian5 from '../../data/fop/russian_5.json';
import russian6 from '../../data/fop/russian_6.json';
import russian7 from '../../data/fop/russian_7.json';
import russian8 from '../../data/fop/russian_8.json';
import russian9 from '../../data/fop/russian_9.json';
import dnkr5 from '../../data/fop/dnkr_5.json';
import artOoo from '../../data/fop/art_ooo.json';
import musicOoo from '../../data/fop/music_ooo.json';
import techOoo from '../../data/fop/tech_ooo.json';
import peOoo from '../../data/fop/pe_ooo.json';
import obzrOoo from '../../data/fop/obzr_ooo.json';
import literatureOoo from '../../data/fop/literature_ooo.json';
import russianSoo from '../../data/fop/russian_soo.json';
import literatureSoo from '../../data/fop/literature_soo.json';
import englishSoo from '../../data/fop/english_soo.json';
import mathSoo from '../../data/fop/math_soo.json';
import informaticsSoo from '../../data/fop/informatics_soo.json';
import historySoo from '../../data/fop/history_soo.json';
import socialSoo from '../../data/fop/social_soo.json';
import geographySoo from '../../data/fop/geography_soo.json';
import physicsSoo from '../../data/fop/physics_soo.json';
import chemistrySoo from '../../data/fop/chemistry_soo.json';
import biologySoo from '../../data/fop/biology_soo.json';
import peSoo from '../../data/fop/pe_soo.json';
import obzrSoo from '../../data/fop/obzr_soo.json';
import chineseSources from '../../data/fop/chinese_sources.json';
import chineseFrp, { extraResults } from 'virtual:chinese-frp';
import nooContent from 'virtual:noo-content';
import resRussian5 from '../../data/fop/russian_5_results.json';
import resRussian6 from '../../data/fop/russian_6_results.json';
import resRussian7 from '../../data/fop/russian_7_results.json';
import resRussian8 from '../../data/fop/russian_8_results.json';
import resRussian9 from '../../data/fop/russian_9_results.json';
import resArt from '../../data/fop/art_ooo_results.json';
import resMusic from '../../data/fop/music_ooo_results.json';
import resTech from '../../data/fop/tech_ooo_results.json';
import resPe from '../../data/fop/pe_ooo_results.json';
import resObzr from '../../data/fop/obzr_ooo_results.json';
import resLiterature11 from '../../data/fop/literature_soo_11_results.json';
// Планируемые результаты НОО по действующей редакции ФОП НОО (ред. от 10.11.2025, КонсультантПлюс), сверка через frp-extract.js.
import nooA from '../../data/fop/noo_results_a.json';
import nooB from '../../data/fop/noo_results_b.json';
import nooC from '../../data/fop/noo_results_c.json';
import nooD from '../../data/fop/noo_results_d.json';
import nooE from '../../data/fop/noo_results_e.json';
import nooMusic from '../../data/fop/noo_music_results.json';
import { PLANS, MAP } from './fopPlan.js';
import { staticSource } from './fopProvenance.js';
export { PLANS };
export { PROVENANCE, provenance } from './fopProvenance.js';
const nooResults={...nooA,...nooB,...nooC,...nooD,...nooE};
// Явные опечатки в тексте КонсультантПлюс (согласование, пропущенная скобка) исправлены по смыслу официального текста.
[['pe-1','уроках физической культурой,','уроках физической культуры,'],['pe-2','перекатыванию;','перекатывании;'],['eng-4','литературных персонажей.','литературных персонажах.'],['eng-4','до 160 слов.','до 160 слов).'],['eng-2','Is it.?','Is it...?']].forEach(([id,a,b])=>{if(nooResults[id])nooResults[id]=nooResults[id].map(l=>l.replace(a,b));});
// Музыка НОО: предметные результаты в ФОП даны по модулям (п. 166.9.3), а не по классам; берём общие результаты и модули, изучаемые в классе.
const musicResults=p=>[...nooMusic.general,...p.sections.map(s=>(s.title.match(/№ (\d+)/)||[])[1]).filter(n=>nooMusic.modules[n]).flatMap(n=>nooMusic.modules[n])];

// extraResults: обществознание 10 (новая программа, приказ № 729) из корпуса ФРП, см. frp-chinese-plugin.js.
const RESULTS={...(extraResults||{}),...resLiterature11,...resRussian5,...resRussian6,...resRussian7,...resRussian8,...resRussian9,...resArt,...resMusic,...resTech,...resPe,...resObzr};
const NOO_DOC='ФОП НОО (приказ № 372, ред. от 10.11.2025)';
// Происхождение текста отдельно для содержания (content_src) и результатов (results_src), см. fopProvenance.js.
// Исходно по файлу: копия ФОП действующей редакции или корпус; дальше уточняется там, где текст подменяется.
const isOptional=p=>OPTIONAL_SUBJECTS.some(s=>p.subject===s||p.subject.startsWith(`${s}: `));
// Китайский: результаты сверены с ФОП ред. от 10.11.2025 (RESULT_FIXES в frp-chinese-plugin.js), содержание из ФРП ЕДСОО.
const withBase=p=>({...p,content_src:staticSource(p),results_src:isOptional(p)?'fop':staticSource(p)});
// Предметные результаты ООО (математика, английский) по классам: дословно из ФОП ООО ред. от 10.11.2025, загружаются при сборке (ключ «R|предмет|класс»).
const oooResults=p=>p.level==='ООО'&&nooContent?.[`R|${p.subject}|${p.grade}`];
const withResults=p=>oooResults(p)?{...p,results:oooResults(p),source_doc:'ФОП ООО (приказ № 370, ред. от 10.11.2025)',results_src:'live'}:/^music-[1-4]$/.test(p.id)?{...p,results:musicResults(p),source_doc:NOO_DOC,results_src:'fop'}:nooResults[p.id]?{...p,results:nooResults[p.id],source_doc:NOO_DOC,results_src:'fop'}:p.results?.length?p:{...p,results:RESULTS[p.id]||RESULTS[p.id.replace(/-\d+$/,'')]||p.results||[],results_src:'corpus'};
// ФРП «История» 2025: Первая мировая война и 1917 г. изучаются в 10 классе (курс «История России. 1914–1945 гг.»), а не в 9.
const CONTENT_FIXES={'history-9':t=>t.replace(/\s*Россия в Первой мировой войне и революционные события 1917 г\./,'')};
// Содержание обучения НОО и части ООО: дословно из ФОП ред. от 10.11.2025 (КонсультантПлюс), загружается при сборке, см. apps/web/frp-noo-content.js.
// Если КонсультантПлюс был недоступен и кэша нет, остаётся текст файла с его меткой (без тихой подмены).
const withContent=p=>nooContent&&nooContent[`${p.subject}|${p.grade}`]?{...p,sections:nooContent[`${p.subject}|${p.grade}`],content_source:p.level==='ООО'?'ФОП ООО (приказ № 370, ред. от 10.11.2025)':NOO_DOC,content_src:'live'}:p;
const withFixes=p=>CONTENT_FIXES[p.id]?{...p,sections:p.sections.map(s=>({...s,topics:s.topics.map(CONTENT_FIXES[p.id])}))}:p;
export const SOURCE_REGISTRY={chinese:chineseSources};
// Китайский язык (ФРП ЕДСОО 2025): подтягивается при сборке, см. apps/web/frp-chinese-plugin.js.
// Это предметы по выбору школы: в обязательную часть учебного плана они не входят.
export const CHINESE_PROGRAMS=Array.isArray(chineseFrp)?chineseFrp:[];
export const OPTIONAL_SUBJECTS=['Иностранный (китайский) язык','Второй иностранный (китайский) язык'];
export const PROGRAMS=[...russianNoo,...readingNoo,...mathNoo,...worldNoo,...orkseNoo,...artNoo,...musicNoo,...techNoo,...peNoo,...russian5,...russian6,...russian7,...russian8,...russian9,...dnkr5,...artOoo,...[5,6,7,8].map(g=>({...musicOoo[0],id:`music-ooo-${g}`,grade:g})),...techOoo,...peOoo,...obzrOoo,...literatureOoo,...math,...historyOoo,...socialOoo,...geography5,...geography6,...geography7,...geography8,...geography9,...physicsOoo,...chemistryOoo,...biologyOoo,...informaticsOoo,...english,...russianSoo,...literatureSoo,...englishSoo,...mathSoo,...informaticsSoo,...historySoo,...socialSoo,...geographySoo,...physicsSoo,...chemistrySoo,...biologySoo,...peSoo,...[10,11].map(g=>({...obzrSoo[0],id:`obzr-soo-${g}`,grade:g})),...CHINESE_PROGRAMS].map(withBase).map(withResults).map(withContent).map(withFixes);
export const DOCS={noo:{title:'ФОП НОО, приказ № 372 от 18.05.2023 (ред. от 10.11.2025)',url:'https://publication.pravo.gov.ru/document/0001202307130044'},ooo:{title:'ФОП ООО, приказ № 370 от 18.05.2023 (ред. от 10.11.2025)',url:'https://publication.pravo.gov.ru/document/0001202307140040'},ooo808:{title:'Изменения в ФОП ООО, приказ № 808 от 10.11.2025',url:'https://publication.pravo.gov.ru/document/0001202602120006'},faopNoo:{title:'ФАОП НОО, приказ № 1023 от 24.11.2022',url:'https://publication.pravo.gov.ru/Document/View/0001202303220005'},faopOoo:{title:'ФАОП ООО, приказ № 1025 от 24.11.2022',url:'https://publication.pravo.gov.ru/Document/View/0001202303220006'},fpu:{title:'ФПУ, приказ № 436 от 22.06.2026',url:'https://publication.pravo.gov.ru/document/0001202607230005'},soo:{title:'ФОП СОО, приказ № 371 от 18.05.2023 (ред. от 10.11.2025)',url:'https://publication.pravo.gov.ru/document/0001202307130017'},edsoo:{title:'Единое содержание общего образования',url:'https://edsoo.ru/normativnye-dokumenty/'} };
export const fmtHours=h=>String(h).replace('.',',');
export const isSampleResults=()=>false;
export function findPrograms(s,g){const x=MAP[s];return x?PROGRAMS.filter(p=>p.grade===g&&(p.subject===x||p.subject.startsWith(`${x}: `))):[];}
export function findProgram(s,g){return findPrograms(s,g)[0];}
export function splitTopic(t){return String(t).split(/(?<=[.;])\s+(?=[А-ЯЁA-Z«(])/).map(x=>x.trim()).filter(Boolean);}
export function defaultDays(h){return({1:[3],2:[2,4],3:[1,3,5],4:[1,2,4,5]})[Math.max(1,Math.ceil(h))]||[1,2,3,4,5];}
export function schoolYearStart(now=new Date()){const y=now.getMonth()>=6?now.getFullYear():now.getFullYear()-1;return `${y}-09-01`;}
export function isValidDate(s){if(typeof s!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(s))return false;const d=new Date(`${s}T12:00:00`);return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===s;}
export const isWeekday=d=>Number.isInteger(d)&&d>=1&&d<=6;
export function checkDays(days,per){const v=[...new Set(Array.isArray(days)?days:[])].filter(isWeekday);if(!v.length)return{ok:false,msg:'Выберите дни уроков.'};const lim=Math.max(1,Math.ceil(per));if(v.length>lim)return{ok:false,msg:`По программе ${fmtHours(per)} ч в неделю: выберите не больше ${lim} дн.`};return{ok:true,paired:v.length<per};}
const ymd=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export function lessonDates(start,days,per,count){const a=[...new Set(days)].filter(isWeekday).sort((x,y)=>x-y);if(!a.length||count<=0||!isValidDate(start))return[];const k=per>0&&per<1?Math.round(1/per):1,out=[],d=new Date(`${start}T12:00:00`);for(let i=0;out.length<count&&i<800*k;i++,d.setDate(d.getDate()+1))if(Math.floor(i/7)%k===0&&a.includes(d.getDay()))out.push(ymd(d));return out;}
export function buildPlan(program,{start,days,secs}){const u=[];program.sections.forEach((s,i)=>{if(secs&&!secs.includes(i))return;s.topics.forEach(t=>splitTopic(t).forEach(topic=>u.push({section:s.title,topic})))});const n=Math.min(program.hours_per_year,u.length),dates=lessonDates(start,days,program.hours_per_week,n);return u.slice(0,n).map((x,i)=>({n:i+1,date:dates[i]||'',...x,hw:''}));}
export function toCSV(rows){const e=v=>`"${String(v??'').replace(/"/g,'""')}"`;return `\ufeff${[['№','Дата','Раздел','Тема урока','Домашнее задание'],...rows.map(r=>[r.n,r.date,r.section,r.topic,r.hw])].map(r=>r.map(e).join(';')).join('\r\n')}`;}
