import {activeQuestions, recipient, validateAnswers} from './questions.js';

export function pdfFilename(name) {
  const safe = name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9 -]/g,'').trim().replace(/\s+/g,'-').slice(0,70);
  return `Startmonitor-HRM-${safe || 'student'}.pdf`;
}
let fontBytes;
export async function createFilledPdf(answers, date = new Date()) {
  const validation = validateAnswers(answers);
  if (validation) throw new Error(validation);
  const {PDFDocument,rgb} = window.PDFLib;
  const doc = await PDFDocument.create();
  doc.registerFontkit(window.fontkit);
  if (!fontBytes) {
    const response = await fetch(new URL('./vendor/NotoSans-Regular.ttf', import.meta.url));
    if (!response.ok) throw new Error('Lettertype niet beschikbaar');
    fontBytes = new Uint8Array(await response.arrayBuffer());
  }
  const font = await doc.embedFont(fontBytes,{subset:true});
  const supported = new Set(font.getCharacterSet());
  // Keep uncommon unsupported symbols identifiable instead of failing or hiding them.
  const text = value => Array.from(String(value).replace(/\r\n?/g,'\n').replace(/\t/g,'    ')).map(c => c === '\n' || supported.has(c.codePointAt(0)) ? c : `[U+${c.codePointAt(0).toString(16).toUpperCase()}]`).join('');
  const red=rgb(.72,.10,.21), ink=rgb(.14,.15,.17), muted=rgb(.38,.40,.43);
  const width=595.28,height=841.89,margin=48,maxWidth=width-2*margin;
  let page,y;
  function newPage() {
    page=doc.addPage([width,height]);y=height-87;
    page.drawText('Startmonitor HRM',{x:margin,y:height-43,size:18,font,color:red});
    page.drawText('Avans Hogeschool | Collegejaar 2026-2027',{x:margin,y:height-62,size:9,font,color:muted});
  }
  function lines(value,size) {
    const output=[];
    for(const paragraph of text(value).split('\n')) {
      if(!paragraph.trim()){output.push('');continue;}
      let line='';
      for(const word of paragraph.split(/\s+/)) {
        if(font.widthOfTextAtSize(word,size)>maxWidth) {
          if(line){output.push(line);line='';}
          for(const c of word) {if(font.widthOfTextAtSize(line+c,size)>maxWidth){output.push(line);line='';}line+=c;}
        } else if(line && font.widthOfTextAtSize(line+' '+word,size)>maxWidth){output.push(line);line=word;}
        else line += (line?' ':'')+word;
      }
      if(line)output.push(line);
    }
    return output;
  }
  function write(value,size=10,color=ink,gap=5) {
    const leading=size*1.45;
    for(const line of lines(value,size)) {
      if(y < 65+leading)newPage();
      if(line)page.drawText(line,{x:margin,y,size,font,color});
      y-=leading;
    }
    y-=gap;
  }
  function room(amount){if(y-amount<65)newPage();}
  newPage();
  write('Naam student: '+answers.name,12);
  write('Ingevuld op: '+new Intl.DateTimeFormat('nl-NL',{dateStyle:'long',timeZone:'Europe/Berlin'}).format(date),9,muted,12);
  write('Dit formulier kan voor of na het eerste SLB-gesprek worden ingevuld en vormt ook een basis voor vervolggesprekken.',10,ink,8);
  write('De student downloadt dit formulier en verstuurt de PDF zelf naar '+recipient+'.',9,muted,18);
  let section;
  for(const q of activeQuestions(answers).filter(q=>q.id!=='name')) {
    const label=`${q.number}. ${q.title}`;
    const labelHeight=lines(label,10.5).length*15.225;
    if(section!==q.section){room(labelHeight+78);write(q.section,12,red,8);section=q.section;}
    room(labelHeight+33);
    write(label,10.5,ink,3);
    write(q.type==='scale'?`${answers[q.id]} / 10 (1 = helemaal mee oneens, 10 = helemaal mee eens)`:answers[q.id],10,muted,14);
  }
  const pages=doc.getPages();
  pages.forEach((p,index)=>p.drawText(`Startmonitor HRM | Pagina ${index+1} van ${pages.length}`,{x:margin,y:35,size:8,font,color:muted}));
  doc.setTitle('Ingevulde Startmonitor HRM');doc.setSubject('Formulier voor SLB-gesprekken');doc.setCreator('Startmonitor HRM');doc.setCreationDate(date);doc.setModificationDate(date);
  return doc.save();
}
