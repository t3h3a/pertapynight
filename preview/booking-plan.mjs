
export function jordanToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Amman', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const get = type => parts.find(part => part.type === type).value;
  return get('year') + '-' + get('month') + '-' + get('day');
}

export function validEvening(date, today = jordanToday()) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && date > today &&
    new Date(date + 'T00:00:00Z').getUTCDay() <= 4;
}

export function validCount(value) {
  return /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

const arabic = {
  calendar: 'رزنامة الأمسيات', previous: 'الشهر السابق', next: 'الشهر التالي',
  calendarHint: 'الأحد إلى الخميس. اختيار تاريخ مستقبلي للتخطيط فقط.',
  selected: 'التاريخ المختار', adults: 'عدد البالغين', children: 'هل معكم أطفال؟',
  childCount: 'عدد الأطفال', yes: 'نعم', no: 'لا', countHint: 'أدخل عددًا صحيحًا أكبر من صفر.',
  party: 'إجمالي الزوار', with: 'بالغون وأطفال', amman: 'بتوقيت الأردن',
  title: 'برنامج الأمسية المقترح', arrive: 'الوصول إلى مركز الزوار', arriveBody: 'اترك وقتًا لتسجيل الدخول. توصي الجهة المنظمة بالوصول قبل البداية بعشر دقائق.',
  walk: 'بداية الأمسية والسير عبر السيق', walkBody: 'السيق ممر صخري طبيعي يزيد طوله قليلًا على كيلومتر، يقود إلى الخزنة.',
  treasury: 'الخزنة على ضوء الشموع', treasuryBody: 'واجهة نبطية منحوتة في الصخر بارتفاع 39.5 مترًا. تتضمن الأمسية سردًا وعرضًا ضوئيًا.',
  end: 'نهاية الأمسية التقريبية', wear: 'ماذا ألبس؟', wearBody: 'حذاء مشي ثابت وملابس مريحة. خذ طبقة خفيفة إذا كان الطقس باردًا.',
  tips: 'أثناء المشي والتصوير', tipsBody: 'امشِ بحذر على الأرض غير المستوية، والتقط الصور بدون فلاش أو طائرة مسيّرة.',
  verify: 'تأكد من الموعد والتعليمات الرسمية قبل الذهاب.',
  sources: ['البتراء ليلًا', 'السيق', 'الخزنة', 'نصائح الزيارة'],
};
const english = {
  calendar: 'Evening calendar', previous: 'Previous month', next: 'Next month',
  calendarHint: 'Sunday through Thursday. Select a future date for planning.',
  selected: 'Selected date', adults: 'Number of adults', children: 'Are children joining?',
  childCount: 'Number of children', yes: 'Yes', no: 'No', countHint: 'Enter a whole number greater than zero.',
  party: 'Total visitors', with: 'adults and children', amman: 'Jordan time',
  title: 'Suggested evening itinerary', arrive: 'Arrive at the Visitor Centre', arriveBody: 'Allow time for check-in. The organizer asks visitors to arrive ten minutes before the start.',
  walk: 'Event begins and the Siq walk', walkBody: 'The Siq is a natural gorge just over one kilometre long that leads to the Treasury.',
  treasury: 'The Treasury by candlelight', treasuryBody: 'The Nabataean façade is carved into the rock and stands 39.5 metres tall. The evening includes narration and light projection.',
  end: 'Approximate end of the evening', wear: 'What to wear', wearBody: 'Wear sturdy walking shoes and comfortable clothes. Pack a light layer if it will be chilly.',
  tips: 'Walking and photography', tipsBody: 'Watch for uneven ground. Take photos without flash or drones.',
  verify: 'Check the official schedule and guidelines before you go.',
  sources: ['Petra by Night', 'The Siq', 'The Treasury', 'Visitor tips'],
};
const links = ['https://www.visitpetra.jo/en/Event/25','https://visitpetra.jo/en/Location/25','https://www.visitpetra.jo/en/Location/2','https://www.visitpetra.jo/en/Tips'];

export function bookingPlan(h, locale) {
  const copy = locale.startsWith('ar') ? arabic : english;
  const number = new Intl.NumberFormat(locale);
  const dateLabel = new Intl.DateTimeFormat(locale, { dateStyle:'full', timeZone:'UTC' });
  const dayTime = new Intl.DateTimeFormat(locale, { hour:'numeric', minute:'2-digit', timeZone:'UTC' });
  const dateObject = value => new Date(value+'T00:00:00Z');
  const time = (hour, minute) => dayTime.format(new Date(Date.UTC(2024,0,1,hour,minute)));

  function calendar({ monthOffset, setMonth, date, select }) {
    const today = jordanToday();
    const [year, month] = today.split('-').map(Number);
    const first = new Date(Date.UTC(year, month - 1 + monthOffset, 1));
    const stop = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth()+1, 1));
    const monthLabel = new Intl.DateTimeFormat(locale,{month:'long',year:'numeric',timeZone:'UTC'});
    const weekday = new Intl.DateTimeFormat(locale,{weekday:'short',timeZone:'UTC'});
    const headings = Array.from({length:7},(_,i) => h('span',{key:'weekday-'+i},weekday.format(new Date(Date.UTC(2024,0,7+i)))));
    const days = Array.from({length:first.getUTCDay()},(_,i) => h('span',{key:'empty-'+i,'aria-hidden':true}));
    for (let cursor = new Date(first); cursor < stop; cursor.setUTCDate(cursor.getUTCDate()+1)) {
      const iso = cursor.toISOString().slice(0,10);
      days.push(h('button',{
        key:iso, type:'button', className:'calendar-day', disabled:!validEvening(iso,today),
        'aria-pressed':date===iso, 'aria-current':iso===today?'date':undefined,
        'aria-label':dateLabel.format(cursor), onClick:()=>select(iso),
      },number.format(cursor.getUTCDate())));
    }
    return h('section',{className:'evening-calendar','aria-label':copy.calendar},
      h('div',{className:'calendar-header'},
        h('button',{type:'button',disabled:monthOffset===0,onClick:()=>setMonth(monthOffset-1),'aria-label':copy.previous},'‹'),
        h('strong',{'aria-live':'polite'},monthLabel.format(first)),
        h('button',{type:'button',disabled:monthOffset===11,onClick:()=>setMonth(monthOffset+1),'aria-label':copy.next},'›')),
      h('div',{className:'calendar-weekdays'},...headings), h('div',{className:'calendar-days'},...days),
      h('p',{className:'calendar-hint'},copy.calendarHint),
      date && h('p',{className:'calendar-selected'},copy.selected + ' · ' + dateLabel.format(dateObject(date))));
  }

  function party({adults, setAdults, children, setChildren, childCount, setChildCount, invalid}) {
    const count = (label,value,update,id)=>h('label',{className:'party-field',htmlFor:id},label,
      h('input',{className:'field-input',id,value,inputMode:'numeric',pattern:'[0-9]*',type:'text',
        onChange:event=>update(event.target.value.replace(/[٠-٩۰-۹]/g,char=>'٠١٢٣٤٥٦٧٨٩'.includes(char)?'٠١٢٣٤٥٦٧٨٩'.indexOf(char):'۰۱۲۳۴۵۶۷۸۹'.indexOf(char)).replace(/\D/g,''))}));
    return h('div',{className:'party-controls'},count(copy.adults,adults,setAdults,'adult-count'),
      h('fieldset',{className:'children-choice'}, h('legend',null,copy.children),
        ...[[false,copy.no],[true,copy.yes]].map(([choice,label])=>h('label',{key:label},
          h('input',{type:'radio',name:'has-children',checked:children===choice,onChange:()=>setChildren(choice)}),label))),
      children && count(copy.childCount,childCount,setChildCount,'child-count'),
      invalid && h('p',{className:'form-error',role:'alert'},copy.countHint));
  }

  function summary({date, adults, children, childCount}) {
    const kids = children ? Number(childCount) : 0;
    const rows = [[time(20,20),copy.arrive,copy.arriveBody],[time(20,30),copy.walk,copy.walkBody],
      [null,copy.treasury,copy.treasuryBody],[time(22,30),copy.end,null]];
    return h('div',{className:'evening-plan'},
      h('div',{className:'plan-date'},h('strong',null,dateLabel.format(dateObject(date))),
        h('span',null,copy.party+' · '+number.format(Number(adults)+kids)+' ('+number.format(Number(adults))+' + '+number.format(kids)+' '+copy.with+')')),
      h('h3',null,copy.title), h('small',null,copy.amman),
      h('ol',{className:'evening-timeline'},...rows.map(([clock,title,body])=>h('li',{key:title},
        clock && h('span',{className:'plan-time'},clock),h('strong',null,title),body && h('p',null,body)))),
      h('div',{className:'plan-tips'},...[[copy.wear,copy.wearBody],[copy.tips,copy.tipsBody]].map(([title,body])=>
        h('section',{key:title},h('h4',null,title),h('p',null,body)))),
      h('p',{className:'calendar-hint'},copy.verify),
      h('div',{className:'plan-sources'},...links.map((url,i)=>h('a',{key:url,href:url,target:'_blank',rel:'noreferrer'},copy.sources[i]))));
  }
  return { calendar, party, summary };
}

