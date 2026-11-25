
const key = 'petra-visitor-gallery';
const ar = ['صور الزوّار','شارك لحظة من البتراء ليلًا','الصور التي تضيفها تُحفظ في هذا المتصفح.','اسم العرض','وصف الصورة (اختياري)','أضف الصورة','اختر صورة أولًا.','تعذّر حفظ الصورة. اختر صورة أصغر أو احذف مشاركة قديمة.','حذف صورتي','صورة الزائر'];
const en = ['Visitor photos','Share a moment from Petra by Night','Your uploads are saved in this browser.','Display name','Caption (optional)','Add photo','Choose an image first.','Could not save the photo. Choose a smaller image or remove an older post.','Remove my photo','Visitor photo'];
export function VisitorGallery({h,useState,language,assetBase}) {
  const [title,subtitle,local,name,caption,add,missing,failure,remove,photo] = language === 'ar' ? ar : en;
  const [posts,setPosts] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
  });
  const [status,setStatus] = useState('');
  const [busy,setBusy] = useState(false);
  const examples = [
    {id:'couple',name:'@layla.and.omar',caption:language==='ar'?'أول زيارة إلنا سوا. وقفنا شوي قدّام الخزنة بس نتفرّج على ضو الشموع.':'Our first visit together. We stopped outside the Treasury just to take in the candlelight.'},
    {id:'family',name:'@family.on.the.trail',caption:language==='ar'?'مشينا السيق على مهَل مع الولاد. صاروا يلاحظوا كيف ضو الشموع يغيّر لون الصخر.':'We took our time through the Siq with the kids. They kept noticing how the candles changed the color of the rock.'},
    {id:'friends',name:'@nour.and.sara',caption:language==='ar'?'أخذنا هاي الصورة بعد ما وصلنا الخزنة. أحلى لحظة كانت أول لمحة إلها من بين الصخور.':'We took this after reaching the Treasury. Our favorite moment was catching that first glimpse between the rocks.'},
  ].map(post => ({...post,url:assetBase+'assets/visitor-'+post.id+'.webp'}));
  function save(next) {
    localStorage.setItem(key, JSON.stringify(next));
    setPosts(next);
  }
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const image = data.get('image');
    if (!(image instanceof File) || !image.size) { setStatus(missing); return; }
    const displayName = String(data.get('name')).trim();
    if (!displayName) { form.elements.namedItem('name').focus(); return; }
    setBusy(true);
    setStatus('');
    let url;
    try {
      if (image.size > 20 * 1024 * 1024) throw new Error();
      url = URL.createObjectURL(image);
      const img = new Image();
      img.src = url;
      await img.decode();
      const scale = Math.min(1, 960 / Math.max(img.naturalWidth,img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1,Math.round(img.naturalWidth*scale));
      canvas.height = Math.max(1,Math.round(img.naturalHeight*scale));
      canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
      save([{id:crypto.randomUUID(),name:displayName,caption:String(data.get('caption')).trim(),url:canvas.toDataURL('image/jpeg',.8)},...posts]);
      form.reset();
    } catch { setStatus(failure); }
    finally {
      if (url) URL.revokeObjectURL(url);
      setBusy(false);
    }
  }
  return h('section',{className:'visitor-gallery content-area','aria-label':title},
    h('div',{className:'section-head'},h('div',null,h('h2',null,title),h('p',null,subtitle))),
    h('form',{className:'glass-panel visitor-form',onSubmit:submit},
      h('p',null,local),
      h('label',null,name,h('input',{className:'field-input',name:'name',required:true,maxLength:40})),
      h('label',null,caption,h('input',{className:'field-input',name:'caption',maxLength:160})),
      h('label',null,photo,h('input',{name:'image',type:'file',accept:'image/*',required:true})),
      h('button',{className:'button-primary',type:'submit',disabled:busy},add),
      status && h('p',{role:'alert'},status)),
    h('div',{className:'visitor-posts'},...[...posts,...examples].map((post,index)=>
      h('article',{className:'glass-panel visitor-post',key:post.id},
        h('header',null,h('span',{'aria-hidden':true,className:'visitor-avatar'},Array.from(post.name)[0]),h('strong',{dir:'auto'},post.name)),
        h('img',{src:post.url,loading:'lazy',alt:post.caption || photo}),
        post.caption && h('p',{dir:'auto'},post.caption),
        index<posts.length && h('button',{className:'text-link',disabled:busy,type:'button',onClick:()=>{
          try { save(posts.filter(item=>item.id!==post.id));setStatus(''); } catch { setStatus(failure); }
        }},remove)))));
}

