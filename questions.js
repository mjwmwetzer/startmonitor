export const recipient = 'mjwm.wetzer@avans.nl';
const expected = ['Veel minder dan verwacht', 'Minder dan verwacht', 'Precies zoals verwacht', 'Meer dan verwacht', 'Veel meer dan verwacht'];
const scale = Array.from({ length: 10 }, (_, i) => String(i + 1));
const agreement = (number, title, section) => ({ id: `q${number}`, number, title, section, type: 'scale', options: scale, hint: '1 = helemaal mee oneens · 10 = helemaal mee eens' });
export const questions = [
  { id: 'name', title: 'Wat is je naam?', section: 'Kennismaken', type: 'name', hint: 'Vul je voor- en achternaam in.' },
  { id: 'q1', number: 1, title: 'Het niveau van de opleiding', section: 'Verwachtingen en ervaringen', type: 'choice', options: ['Veel lager dan verwacht', 'Lager dan verwacht', 'Precies zoals verwacht', 'Hoger dan verwacht', 'Veel hoger dan verwacht'], hint: 'In hoeverre komen je huidige ervaringen overeen met je verwachtingen vóór de start van je deeltijdopleiding HRM?' },
  { id: 'q2', number: 2, title: 'De tijd die je kwijt bent aan je studie', section: 'Verwachtingen en ervaringen', type: 'choice', options: expected },
  { id: 'q3', number: 3, title: 'De mate waarin de inhoud van de opleiding je aanspreekt', section: 'Verwachtingen en ervaringen', type: 'choice', options: expected },
  { id: 'q4', number: 4, title: 'De aansluiting van de opleiding bij je kennis en vaardigheden', section: 'Verwachtingen en ervaringen', type: 'choice', options: expected },
  agreement(5, 'Medestudenten zijn betrokken bij mij', 'Sociale omgeving'),
  agreement(6, 'Ik heb het gevoel dat ik erg verschillend ben van de andere studenten hier, op een manier die mij niet bevalt', 'Sociale omgeving'),
  agreement(7, 'Ik kan bij mijn medestudenten terecht voor vragen of hulp bij mijn studie', 'Sociale omgeving'),
  agreement(8, 'Ik voel me soms onveilig op school, in een les of in (studie)groepen', 'Sociale omgeving'),
  agreement(10, 'Ik heb er vertrouwen in dat ik de dingen goed kan doen.', 'Studeren op jouw opleiding'),
  agreement(11, 'Ik werk niet zo hard voor mijn studie als ik zou moeten.', 'Studeren op jouw opleiding'),
  agreement(12, 'Het is mij duidelijk hoe ik mijn studie het beste kan aanpakken.', 'Studeren op jouw opleiding'),
  agreement(13, 'Ik vind het heel moeilijk om te beginnen met studeren.', 'Studeren op jouw opleiding'),
  agreement(14, 'De manier van lesgeven in mijn opleiding past bij mij.', 'Studeren op jouw opleiding'),
  { id: 'q15', number: 15, title: 'Heb je naast je werk en studie nog andere bezigheden, zoals zorg voor een gezin, mantelzorg, ander vrijwilligerswerk, topsport, etc.?', section: 'Jouw situatie', type: 'choice', options: ['Ja', 'Nee'] },
  { id: 'q15hours', number: '15 · vervolg', title: 'Hoeveel uur ben je hier gemiddeld mee bezig?', section: 'Jouw situatie', type: 'choice', options: ['8 uur per week of minder', 'Tussen de 9 en 16 uur per week', 'Meer dan 16 uur per week'], when: 'q15' },
  { id: 'q16', number: 16, title: 'Waar ben je tegenaan gelopen binnen jouw deeltijdopleiding HRM in de eerste weken?', section: 'Terugblik en ondersteuning', type: 'text' },
  { id: 'q17', number: 17, title: 'Wat had jouw opleiding beter kunnen doen om jou daarbij te helpen?', section: 'Terugblik en ondersteuning', type: 'text' },
  { id: 'q18', number: 18, title: 'Waar kan jouw slb’er/mentor je eventueel nog bij helpen?', section: 'Terugblik en ondersteuning', type: 'text', hint: 'Na ‘Antwoord klaar’ maken we je PDF. Je downloadt en verstuurt die daarna zelf.' }
];
export const activeQuestions = answers => questions.filter(q => !q.when || answers[q.when] === 'Ja');
export function validateAnswers(answers) {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) return 'Ongeldige antwoorden.';
  for (const q of activeQuestions(answers)) {
    const value = answers[q.id];
    if (typeof value !== 'string' || !value.trim()) return `Vul ${q.number ? 'vraag ' + q.number : 'je naam'} in.`;
    if (q.options && !q.options.includes(value)) return `Ongeldig antwoord op vraag ${q.number}.`;
    if (value.length > (q.type === 'name' ? 120 : 4000)) return 'Een antwoord is te lang.';
    if (q.type === 'name' && /[\r\n]/.test(value)) return 'Je naam mag geen regeleinden bevatten.';
  }
  return null;
}
