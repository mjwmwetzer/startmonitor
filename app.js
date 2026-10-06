import { activeQuestions, questions, recipient, validateAnswers } from './questions.js';
import { createFilledPdf, pdfFilename } from './pdf.js';
const app = document.querySelector('#app');
let answers = {}, currentId = 'name', timer, locked = false, generating = false, downloaded = false, pdfUrl;
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function setScreen(html) { app.innerHTML = html; app.querySelector('h1,h2')?.setAttribute('tabindex', '-1'); app.querySelector('h1,h2')?.focus({preventScroll:true}); window.scrollTo({top:0,behavior:'instant'}); }
function intro() {
  setScreen(`<section class="intro"><p class="eyebrow">Startmonitor HRM</p><h1>Hoe is jouw studie gestart?</h1><p class="lead">Ben je goed geland in de onderwijsomgeving? Vertel hoe jij de eerste weken van je deeltijdopleiding HRM hebt ervaren.</p><p>Deze startmonitor biedt handvatten voor je SLB-gesprekken. Je kunt hem vóór of na het eerste gesprek invullen en ook gebruiken bij vervolggesprekken. We kijken naar je verwachtingen, je sociale omgeving en hoe het studeren gaat.</p><div class="facts"><span>17 vragen + je naam</span><span>Eén vraag per scherm</span><span>Je eigen PDF</span></div><div class="notice"><p>Na het laatste antwoord maken we een PDF met je naam en antwoorden. <strong>Download het formulier en stuur het zelf als bijlage naar ${recipient}.</strong> De app verstuurt niets automatisch. Je antwoorden blijven in dit tabblad en worden niet online opgeslagen. Download je PDF voordat je afsluit.</p></div><button class="primary" id="start">Start de vragenlijst <span aria-hidden="true">→</span></button></section>`);
  document.querySelector('#start').onclick = render;
}
function render() {
  clearTimeout(timer); locked = false;
  const list = activeQuestions(answers), index = list.findIndex(q => q.id === currentId), q = list[index];
  const done = list.filter(item => Boolean(answers[item.id]?.trim())).length;
  const progress = Math.round(done / list.length * 100);
  let field;
  if (q.options) {
    field = `<div class="options ${q.type === 'scale' ? 'scale' : ''}" role="group" aria-label="Antwoorden">${q.options.map(value => `<button class="option" data-value="${escape(value)}" aria-pressed="${answers[q.id] === value}">${q.type !== 'scale' ? '<span class="circle" aria-hidden="true"></span>' : ''}<span>${escape(value)}</span></button>`).join('')}</div>${q.type === 'scale' ? '<div class="scale-labels"><span>1 · Helemaal mee oneens</span><span>10 · Helemaal mee eens</span></div>' : ''}`;
  } else {
    field = `<form id="text-form"><label class="field-label" for="answer">${q.type === 'name' ? 'Je naam' : 'Jouw antwoord'}</label>${q.type === 'name' ? `<input class="input" id="answer" autocomplete="name" required maxlength="120" value="${escape(answers[q.id] || '')}">` : `<textarea class="input" id="answer" required maxlength="4000" placeholder="Schrijf hier je antwoord. Je kunt ook ‘Niet van toepassing’ invullen.">${escape(answers[q.id] || '')}</textarea><div class="counter" id="counter">${(answers[q.id] || '').length} / 4000</div>`}<p class="error" id="field-error" role="alert"></p><div class="text-actions"><span>${q.type === 'name' ? 'Enter om door te gaan' : 'Ctrl + Enter om je antwoord af te ronden'}</span><button class="primary" type="submit">${q.type === 'name' ? 'Naam ingevuld' : 'Antwoord klaar'} <span aria-hidden="true">→</span></button></div></form>`;
  }
  setScreen(`<div class="progress-header"><span>${escape(q.section)}</span><span>${index + 1} van ${list.length} stappen</span></div><div class="progress" role="progressbar" aria-label="Ingevulde antwoorden" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><span style="width:${progress}%"></span></div><section class="question-card"><p class="eyebrow">${q.number ? 'Vraag ' + escape(q.number) : 'Eerst even kennismaken'}</p><h2>${escape(q.title)}</h2><p class="hint">${escape(q.hint || (q.type === 'text' ? 'Neem de tijd voor je antwoord. Klik op ‘Antwoord klaar’ als je klaar bent.' : 'Kies één antwoord. Daarna ga je automatisch door.'))}</p>${field}</section><nav class="navigation" aria-label="Vragen navigatie"><button class="quiet" id="back">← ${index === 0 ? 'Terug naar de uitleg' : 'Vorige vraag'}</button><span class="hint">${done} ingevuld</span></nav>`);
  document.querySelector('#back').onclick = () => { clearTimeout(timer); saveDraft(q); if (index === 0) intro(); else { currentId = list[index - 1].id; render(); } };
  for (const button of app.querySelectorAll('[data-value]')) button.onclick = () => {
    if (locked) return; locked = true; answers[q.id] = button.dataset.value;
    if (q.id === 'q15' && answers.q15 === 'Nee') delete answers.q15hours;
    for (const option of app.querySelectorAll('[data-value]')) { option.setAttribute('aria-pressed', String(option === button)); option.disabled = true; }
    timer = setTimeout(next, 280);
  };
  const form = document.querySelector('#text-form');
  if (form) {
    const input = document.querySelector('#answer');
    input.oninput = () => { if (document.querySelector('#counter')) document.querySelector('#counter').textContent = `${input.value.length} / 4000`; document.querySelector('#field-error').textContent = ''; };
    form.onsubmit = event => { event.preventDefault(); if (locked) return; if (!input.value.trim()) { document.querySelector('#field-error').textContent = 'Vul een antwoord in. Je kunt ook ‘Niet van toepassing’ invullen.'; input.focus(); return; } answers[q.id] = input.value.trim(); locked = true; next(); };
    input.onkeydown = event => { if (q.type === 'text' && event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); form.requestSubmit(); } };
  }
}
function saveDraft(q) { const input = document.querySelector('#answer'); if (input) answers[q.id] = input.value.trim(); }
function next() {
  const list = activeQuestions(answers), index = list.findIndex(q => q.id === currentId);
  if (index < list.length - 1) { currentId = list[index + 1].id; render(); }
  else { const missing = list.find(q => !answers[q.id]?.trim()); if (missing) { currentId = missing.id; render(); } else finish(); }
}
function details() { return `<details><summary>Mijn ingevulde antwoorden bekijken</summary><dl>${activeQuestions(answers).map(q => `<dt>${q.number ? escape(q.number) + '. ' : ''}${escape(q.title)}</dt><dd>${escape(answers[q.id] || '')}</dd>`).join('')}</dl></details>`; }
async function finish() {
  if (generating) return;
  const error = validateAnswers(answers); if (error) return;
  generating = true;
  setScreen('<section class="status-card" role="status"><div class="spinner" aria-hidden="true"></div><h1>Je PDF wordt gemaakt</h1><p>Je ingevulde formulier wordt in je browser klaargezet om te downloaden.</p></section>');
  try {
    const bytes = await createFilledPdf(answers);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    pdfUrl = URL.createObjectURL(new Blob([bytes], {type:'application/pdf'}));
    const subject = encodeURIComponent('Startmonitor HRM - ' + answers.name);
    const body = encodeURIComponent('Beste Marko,\n\nBijgevoegd mijn ingevulde Startmonitor HRM voor onze SLB-gesprekken.\n\nMet vriendelijke groet,\n' + answers.name);
    setScreen(`<section class="status-card"><div class="status-icon" aria-hidden="true">✓</div><p class="eyebrow">Vragenlijst afgerond</p><h1>Je ingevulde formulier staat klaar.</h1><p>Gebruik je formulier voor je eerste SLB-gesprek of een vervolggesprek.</p><ol class="download-steps"><li><strong>Download je PDF.</strong> Bewaar het bestand op je apparaat.</li><li><strong>Mail het formulier zelf.</strong> Voeg de gedownloade PDF als bijlage toe in Outlook en stuur de mail naar <strong>${recipient}</strong>.</li></ol><a class="primary download-button" id="download" href="${pdfUrl}" download="${escape(pdfFilename(answers.name))}">Download ingevuld formulier (PDF) <span aria-hidden="true">↓</span></a><p id="download-status" class="hint" role="status">Er is nog niets verzonden. De app kan niet controleren of je de e-mail verstuurt.</p><a class="mail-link" href="mailto:${recipient}?subject=${subject}&body=${body}">Open een nieuwe e-mail</a><p class="hint">Deze link opent je ingestelde mailprogramma. De PDF wordt niet automatisch toegevoegd; voeg de bijlage zelf toe.</p><button class="quiet" id="edit">← Antwoorden aanpassen</button>${details()}</section>`);
    document.querySelector('#download').onclick = () => { downloaded = true; document.querySelector('#download-status').textContent = 'De download is gestart. Controleer je downloads en voeg de PDF zelf toe aan je e-mail.'; };
    document.querySelector('#edit').onclick = () => { downloaded = false; currentId = 'name'; render(); };
  } catch {
    setScreen(`<section class="status-card" role="alert"><p class="eyebrow">PDF nog niet klaar</p><h1>Je antwoorden zijn nog hier.</h1><p>Het maken van de PDF is niet gelukt. Laat dit tabblad open en probeer het opnieuw.</p><button class="primary" id="retry">PDF opnieuw maken</button> <button class="quiet" id="edit">Antwoorden aanpassen</button>${details()}</section>`);
    document.querySelector('#retry').onclick = finish;
    document.querySelector('#edit').onclick = () => { currentId = 'name'; render(); };
  } finally { generating = false; }
}
window.addEventListener('beforeunload', event => { if (!downloaded && Object.values(answers).some(Boolean)) { event.preventDefault(); event.returnValue = ''; } });
intro();
