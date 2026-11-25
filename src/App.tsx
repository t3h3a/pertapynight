import { VisitorGallery } from './visitor-gallery.mjs';
import { bookingPlan, validEvening, validCount } from './booking-plan.mjs';
import { bookingCopy, scanTicket, staticDemo } from './ticket-qr.mjs';
import { type FormEvent, type ReactNode, createElement, useEffect, useMemo, useState } from 'react';
import { createContext, useContext } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  ArrowLeft, ArrowRight, CalendarDays, Check, ChevronDown,
  ChevronLeft, ChevronRight, CircleHelp, Clock3, Compass, Globe2, Heart, Info,
  House, Landmark, Map, MapPin, Menu, MoreHorizontal, Moon, Mountain, ShieldCheck, Ticket,
  Users, X, Image as ImageIcon, ScanLine, Sparkles,
} from 'lucide-react';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { useGetPetraSchedules, useVerifyPetraTicket, getGetPetraSchedulesQueryKey } from '@workspace/api-client-react';
import type { PetraSchedule, PetraTicketVerification } from '@workspace/api-client-react';
import { getTranslations, isLanguage, languageNames, localeNames, type Language } from './i18n';

const queryClient = new QueryClient();
type ContextType = { language: Language; t: Record<string,string>; saved: string[]; toggleFavorite: (id:string)=>void; setToast:(value:string)=>void; setLanguage:(value:Language)=>void };
const AppContext = createContext<ContextType | null>(null);
function useApp() { const context = useContext(AppContext); if (!context) throw new Error('App context unavailable'); return context; }
function formatDate(value: string, language: Language, options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(localeNames[language], options).format(date);
}

function AppShell({ children }: { children: ReactNode }) {
  const [path] = useLocation();
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem('petra-language') || '';
    return isLanguage(stored) ? stored : 'en';
  });
  const [menu, setMenu] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [toastKey, setToast] = useState('');
  const t = useMemo(() => getTranslations(language), [language]);
  const rtl = language === 'ar';
  const [saved, setSaved] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('petra-favorites') || '[]') as string[]; } catch { return []; }
  });
  useEffect(() => {
    localStorage.setItem('petra-language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
    const pageTitleKey: Record<string, string> = {
      '/': 'pageHome', '/book': 'pageBook', '/tickets': 'pageTickets',
      '/explore': 'pageExplore', '/favorites': 'favorites', '/events': 'pageEvents',
      '/gallery': 'pageGallery', '/visitor-info': 'pageInfo',
    };
    document.title = `${t[pageTitleKey[path] || 'notFound']} | Petra By Night`;
  }, [language, path, rtl, t]);
  useEffect(() => { localStorage.setItem('petra-favorites', JSON.stringify(saved)); }, [saved]);
  useEffect(() => { if (!toastKey) return; const timer = window.setTimeout(() => setToast(''), 2600); return () => window.clearTimeout(timer); }, [toastKey]);
  const toggleFavorite = (id: string) => {
    const exists = saved.includes(id);
    setToast(exists ? 'toastRemoved' : 'toastSaved');
    setSaved(current => exists ? current.filter(item => item !== id) : [...current, id]);
  };
  const nav = [
    ['/', t.home], ['/book', t.book], ['/tickets', t.tickets], ['/explore', t.explore],
    ['/events', t.events], ['/gallery', t.gallery], ['/visitor-info', t.info],
  ];
  return <div className={`app-shell ${rtl ? 'rtl' : ''}`}>
    <header className="site-header">
      <div className="nav-inner">
        <Link href="/" className="brand" aria-label={t.pageHome} data-testid="link-brand">
          <span className="brand-mark"><Landmark size={22}/></span><span className="brand-name">Petra<span>By Night</span></span>
        </Link>
        <nav className={`main-nav ${menu ? 'open' : ''}`} aria-label={t.mainNavigation}>
          {nav.map(([href, label]) => <Link key={href} href={href} className={path === href ? 'active' : ''} data-testid={`link-nav-${href.slice(1) || 'home'}`} onClick={() => setMenu(false)}>{label}</Link>)}
        </nav>
        <div className="nav-actions">
          <details className="language-menu"
            onBlur={event => {
              if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
            }}
            onKeyDown={event => {
              if (event.key === 'Escape' && event.currentTarget.open) {
                event.currentTarget.open = false;
                event.currentTarget.querySelector('summary')?.focus();
              }
            }}>
            <summary aria-label={t.chooseLanguage}><Globe2 size={17}/><span>{languageNames[language]}</span><ChevronDown size={14}/></summary>
            <div className="language-options">
              {Object.entries(languageNames).map(([code, name]) =>
                <button type="button" key={code} className="language-option" lang={code}
                  dir="auto" aria-pressed={language === code} onClick={event => {
                    const menu = event.currentTarget.closest('details');
                    if (menu) {
                      menu.open = false;
                      menu.querySelector('summary')?.focus();
                    }
                    setLanguage(code as Language);
                  }}>{name}{language === code && <Check size={15}/>}</button>
              )}
            </div>
          </details>
          <Link href="/visitor-info" className="icon-button" aria-label={t.help} data-testid="link-help"><CircleHelp size={15}/></Link>
          <button className="icon-button mobile-menu" aria-label={t.menuToggle} onClick={() => setMenu(value => !value)} data-testid="button-menu">{menu ? <X size={17}/> : <Menu size={17}/>}</button>
        </div>
      </div>
    </header>
    <AppContext.Provider value={{ language, t, saved, toggleFavorite, setToast, setLanguage }}>
      <div key={path} className="route-content">{children}</div>
      <nav className="mobile-bottom-nav" aria-label={t.quickNavigation}>
        <Link href="/" className={path === '/' ? 'active' : ''} data-testid="mobile-nav-home"><House size={18}/><span>{t.home}</span></Link>
        <Link href="/tickets" className={path === '/tickets' ? 'active' : ''} data-testid="mobile-nav-tickets"><Ticket size={18}/><span>{t.tickets}</span></Link>
        <Link href="/explore" className={path === '/explore' ? 'active' : ''} data-testid="mobile-nav-explore"><Compass size={18}/><span>{t.explore}</span></Link>
        <Link href="/favorites" className={path === '/favorites' ? 'active' : ''} data-testid="mobile-nav-favorites"><Heart size={18}/><span>{t.favorites}</span></Link>
        <button type="button" className={moreOpen ? 'active' : ''} aria-expanded={moreOpen} onClick={() => setMoreOpen(value => !value)} data-testid="mobile-nav-more"><MoreHorizontal size={18}/><span>{t.more}</span></button>
      </nav>
      {moreOpen && <div className="more-overlay" onClick={() => setMoreOpen(false)}><section className="more-panel glass-panel" onClick={event => event.stopPropagation()} aria-label={t.more}><div className="more-panel-head"><strong>{t.more}</strong><button type="button" className="icon-button" onClick={() => setMoreOpen(false)} aria-label={t.close} data-testid="button-close-more"><X size={16}/></button></div>{[['/book',t.book],['/events',t.events],['/gallery',t.gallery],['/visitor-info',t.info]].map(([href,label])=><Link key={href} href={href} onClick={() => setMoreOpen(false)} data-testid={`more-link-${href.slice(1)}`}>{label}<ArrowRight size={14}/></Link>)}</section></div>}
      <footer className="footer"><span>© Petra By Night · {t.jordan}</span><span>{t.footerMotto}</span><Link href="/visitor-info" className="text-link">{t.info} <ArrowRight size={13}/></Link></footer>
      {toastKey && <div className="toast-message" role="status" data-testid="status-toast">{t[toastKey]}</div>}
    </AppContext.Provider>
  </div>;
}

function PageIntro({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return <section className="page-hero"><div className="page-hero-inner"><div className="section-kicker">{eyebrow}</div><h1 className="page-title">{title}</h1><p>{copy}</p></div></section>;
}
type Attraction = { id: string; name: string; tag: string; copy: string; image: string };
function getAttractions(t: Record<string, string>): Attraction[] {
  return [
    { id:'treasury', name:t.treasury, tag:t.firstLight, copy:t.treasuryCopy, image:'/assets/petra-treasury.jpg' },
    { id:'siq', name:t.siq, tag:t.passageTime, copy:t.siqCopy, image:'/assets/petra-night-hero.jpg' },
    { id:'monastery', name:t.adDeir, tag:t.beyondCity, copy:t.adDeirCopy, image:'/assets/petra-monastery.jpg' },
    { id:'royal-tombs', name:t.royalTombs, tag:t.carvedRoseStone, copy:t.royalTombsCopy, image:'/assets/petra-treasury.jpg' },
    { id:'colonnaded-street', name:t.colonnadedStreet, tag:t.ancientCityTag, copy:t.colonnadedCopy, image:'/assets/petra-monastery.jpg' },
  ];
}

function HomePage() {
  const { t, language, setLanguage } = useApp();
  const attractions = getAttractions(t);
  const quick = [
    { icon:Ticket, title:t.book, href:'/book' }, { icon:ScanLine, title:t.tickets, href:'/tickets' },
    { icon:CalendarDays, title:t.events, href:'/events' }, { icon:Map, title:t.explore, href:'/explore' },
    { icon:ImageIcon, title:t.gallery, href:'/gallery' }, { icon:Info, title:t.info, href:'/visitor-info' },
  ];
  return <main>
    <section className="hero">
      <div className="hero-copy">
        <div className="eyebrow">{t.homeEyebrow}</div>
        <h1>{t.heroTitle}</h1><p>{t.heroSub}</p>
        <div className="hero-actions"><Link href="/book" className="button-primary" data-testid="link-book-hero"><Ticket size={17}/>{t.heroCta}<ArrowRight size={16}/></Link><Link href="/explore" className="button-ghost" data-testid="link-explore-hero"><Compass size={16}/>{t.discoverExperience}<ArrowRight size={15}/></Link></div>
      </div>
      <div className="hero-note">{t.homeHeroNote}</div>
    </section>
    <div className="page-wrap">
      <section className="requirement" aria-label={t.requirement}>
        <div className="requirement-copy"><span className="ticket-symbol"><Ticket size={24}/></span><div><h3>{t.requirement}</h3><p>{t.learn}</p></div></div>
        <div className="ticket-flow"><div className="ticket-chip"><Check size={16} color="#82c6a3"/><span>{t.dayTicket}<small>{t.mainEntry}</small></span></div><ArrowRight size={18} className="flow-arrow"/><div className="ticket-chip active"><Moon size={16} color="#c694e7"/><span>{t.heroTitle}<small>{t.eveningExperience}</small></span></div></div>
      </section>
      <section className="quick-links" aria-label={t.services}>{quick.map(({icon:Icon,title,href})=><Link className="quick-link" href={href} key={href} data-testid={`link-quick-${href.slice(1)}`}><Icon size={25}/><span>{title}</span></Link>)}</section>
      <section>
        <div className="section-head"><div><div className="section-kicker">{t.homeSectionEyebrow}</div><h2>{t.explore}</h2><p>{t.homeSectionCopy}</p></div><Link href="/explore" className="text-link" data-testid="link-explore-more">{t.moreExplore}<ArrowRight size={14}/></Link></div>
        <div className="discover-grid">
          {attractions.slice(0,4).map((item,index)=><Link href="/explore" className="discover-card" key={item.id} style={{backgroundImage:`url("${item.image}")`}} data-testid={`card-home-discover-${item.id}`}><div className="discover-label"><strong>{index === 0 ? t.roseCity : index === 1 ? t.heroTitle : item.name}</strong><span>{index === 0 ? t.wonder : index === 1 ? t.magicalEvening : item.tag}</span></div></Link>)}
        </div>
      </section>
      <section className="partnership"><div className="partner-brand"><Landmark size={38}/><div><strong>{t.partnershipName}</strong><small>{t.jordan} · {t.roseCity}</small></div></div><div className="partner-copy"><ShieldCheck size={27}/><div>{t.designedVisit}<small>{t.designedVisitCopy}</small></div></div></section>
      <section className="feature-strip">
        <div className="feature-box"><h3><Globe2 size={18}/>{t.multilingual}</h3><div className="language-pills">{Object.entries(languageNames).map(([code,name])=><button key={code} className={language===code?'selected':''} onClick={()=>setLanguage(code as Language)} data-testid={`button-language-${code}`}>{name}</button>)}</div></div>
        <div className="feature-box"><h3><Mountain size={18}/>{t.darkPetra}</h3><p>{t.darkPetraCopy}</p></div>
        <div className="feature-box"><h3><ShieldCheck size={18}/>{t.planClearly}</h3><ul><li>{t.practicalGuidance}</li><li>{t.sampleSchedules}</li><li>{t.noCheckout}</li></ul></div>
      </section>
    </div>
  </main>;
}

function BookPage() {
  const { setToast, language, t } = useApp();
  const verify = useVerifyPetraTicket();
  const booking = bookingCopy(language);
  const [demo,setDemo] = useState(false);
  const [qrStatus,setQrStatus] = useState('');
  const [step,setStep] = useState(0);
  const [reference,setReference] = useState('');
  const [verification,setVerification] = useState<PetraTicketVerification | null>(null);
  const [date,setDate] = useState('');
  const [visitors,setVisitors] = useState('');
  const [hasChildren,setHasChildren] = useState(false);
  const [childCount,setChildCount] = useState('');
  const [monthOffset,setMonthOffset] = useState(0);
  const [countError,setCountError] = useState(false);
  const plan = bookingPlan(createElement, localeNames[language]);
  const [errorKey,setErrorKey] = useState('');
  const submitEligibility = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setErrorKey('');
    if (staticDemo) return;
    const ticketReference = reference.trim();
    if (ticketReference.length < 4 || ticketReference.length > 80) { setErrorKey('invalidReference'); return; }
    verify.mutate({ data:{ ticketReference } }, { onSuccess:result => {
      setVerification(result);
      if (result.eligible && result.providerMode !== 'unconfigured') { setStep(1); setToast(result.providerMode === 'development' ? 'devCheckPassed' : 'officialPass'); }
      else setErrorKey(result.providerMode === 'unconfigured' ? 'officialUnavailable' : 'invalidTicket');
    }, onError:() => setErrorKey('checkError') });
  };
  const nextStep = () => { if (!validEvening(date)) { setErrorKey('chooseDateError'); return; } setErrorKey(''); setStep(2); };
  return <main><PageIntro eyebrow={t.planEvening} title={t.eligibilityTitle} copy={t.bookingIntro}/>
    <div className="content-area"><div className="booking-layout">
      <aside className="glass-panel step-panel">{[t.stepDayTicket,t.stepChooseDate,t.stepVisitors,t.stepReview].map((name,index)=><div className={`step-item ${step===index?'current':''} ${step>index?'done':''}`} key={name}><span className="step-number">{step>index?<Check size={13}/>:index+1}</span><div><strong>{name}</strong><small>{index===0?t.stepEligibilityOnly:index===1?t.stepSampleSchedule:index===2?t.stepPartySize:t.stepNoBooking}</small></div></div>)}</aside>
      <section className="glass-panel booking-card" aria-live="polite">
        {demo && step > 0 && <div className="notice"><Info size={17}/><span>{booking.demo}</span></div>}
        {step===0 && <><div className="section-kicker">{t.stepOne}</div><h2>{t.dayTicketQuestion}</h2><p>{t.dayTicketHelp}</p>
          <form noValidate onSubmit={submitEligibility}><div className="form-row"><label className="field-label" htmlFor="ticket-reference">{t.referenceLabel}</label><input id="ticket-reference" className="field-input" value={reference} onChange={event=>setReference(event.target.value)} placeholder={t.referencePlaceholder} minLength={4} maxLength={80} required data-testid="input-ticket-reference"/><div className="field-help">{t.referencePrivacy}</div></div>
            <div className="ticket-tools">
              <label className="ticket-scan button-ghost"><ScanLine size={17}/>{booking.scan}<input className="ticket-file" aria-label={booking.scan} type="file" accept="image/*" capture="environment" onChange={event=>void scanTicket(event,booking,setReference,setQrStatus)}/></label>
              <label className="ticket-scan button-ghost"><ImageIcon size={17}/>{booking.photo}<input className="ticket-file" aria-label={booking.photo} type="file" accept="image/*" onChange={event=>void scanTicket(event,booking,setReference,setQrStatus)}/></label>
            </div>
            {qrStatus && <p className="ticket-status" role="status">{qrStatus}</p>}
            <button className="text-link sample-reference" type="button" onClick={()=>setReference('DEMO-PETRA-2026')} data-testid="button-fill-sample-reference">{t.sampleReference}</button>
          {errorKey && <p className="form-error" role="alert" data-testid="status-booking-error">{t[errorKey]}</p>}
             {verification && <div className="notice"><Info size={17}/><span>{verification.providerMode === 'development' ? t.devOnlyWarning : verification.eligible ? t.officialPass : t.officialUnavailable}</span></div>}
             <div className="notice"><ShieldCheck size={17}/><span>{t.noCheckoutWarning}</span></div>
             <div className="form-actions ticket-actions"><button className="button-ghost" type="button" onClick={()=>{setDemo(true);setDate('');setMonthOffset(0);setErrorKey('');setStep(1);}}>{booking.preview}</button>{!staticDemo && <button className="button-primary" type="submit" disabled={verify.isPending} data-testid="button-check-eligibility">{verify.isPending?t.checking:t.checkEligibility}<ArrowRight size={15}/></button>}</div>
          </form>
        </>}
        {step===1 && <><div className="section-kicker">{t.stepTwo}</div><h2>{t.chooseEvening}</h2><p>{t.datesExample}</p>
          {plan.calendar({monthOffset,setMonth:setMonthOffset,date,select:value=>{setDate(value);setErrorKey('');}})}
          {errorKey&&<p className="form-error">{t[errorKey]}</p>}<div className="notice"><CalendarDays size={17}/><span>{t.scheduleProviderNotice}</span></div><div className="form-actions"><button className="button-ghost" onClick={()=>{setDemo(false);setDate('');setStep(0);}} data-testid="button-book-back"><ArrowLeft size={15}/>{t.back}</button><button className="button-primary" onClick={nextStep} data-testid="button-date-continue">{t.continue}<ArrowRight size={15}/></button></div>
        </>}
        {step===2 && <><div className="section-kicker">{t.stepThree}</div><h2>{t.whoJoining}</h2><p>{t.planningOnly}</p>{plan.party({adults:visitors,setAdults:setVisitors,children:hasChildren,setChildren:setHasChildren,childCount,setChildCount,invalid:countError})}<div className="form-actions"><button className="button-ghost" onClick={()=>setStep(1)} data-testid="button-visitors-back"><ArrowLeft size={15}/>{t.back}</button><button className="button-primary" onClick={()=>{const valid=validCount(visitors)&&(!hasChildren||validCount(childCount))&&Number.isSafeInteger(Number(visitors)+(hasChildren?Number(childCount):0));setCountError(!valid);if(valid)setStep(3);}} data-testid="button-summary-continue">{t.reviewPlan}<ArrowRight size={15}/></button></div></>}
        {step===3 && <><div className="section-kicker">{t.stepFour}</div><h2>{t.eveningOverview}</h2><p>{t.notConfirmation}</p>{plan.summary({date,adults:visitors,children:hasChildren,childCount})}<div className="disabled-note"><strong>{t.purchaseUnavailable}.</strong> {t.purchaseUnavailableCopy}</div><div className="form-actions"><button className="button-ghost" onClick={()=>setStep(2)} data-testid="button-summary-back"><ArrowLeft size={15}/>{t.back}</button><button className="button-primary" disabled title={t.purchaseUnavailableCopy} data-testid="button-purchase-disabled">{t.purchaseUnavailable}<ShieldCheck size={15}/></button></div></>}
      </section>
    </div></div>
  </main>;
}

function TicketsPage() {
  const { t } = useApp();
  return <main><PageIntro eyebrow={t.yourVisit} title={t.tickets} copy={t.ticketsIntro}/><div className="content-area"><section className="glass-panel empty-state"><div className="empty-icon"><Ticket size={30}/></div><div className="section-kicker">{t.nothingYet}</div><h2>{t.noTickets}</h2><p>{t.ticketsEmptyCopy}</p><Link className="button-primary" href="/book" data-testid="link-ticket-empty-book">{t.reviewEligibility}<ArrowRight size={15}/></Link></section></div></main>;
}

function ExplorePage() {
  const { saved, toggleFavorite, t } = useApp();
  const attractions = getAttractions(t);
  const [showSaved,setShowSaved] = useState(false);
  const visible = useMemo(()=>attractions.filter(place=>!showSaved||saved.includes(place.id)),[showSaved,saved]);
  return <main><PageIntro eyebrow={t.ancientCity} title={t.explore} copy={t.exploreIntro}/><div className="content-area"><div className="section-head"><div><div className="section-kicker">{t.placesRemember}</div><h2>{showSaved?t.favorites:t.cityStone}</h2></div><button className={`button-ghost ${showSaved?'selected':''}`} onClick={()=>setShowSaved(value=>!value)} data-testid="button-toggle-favorites"><Heart size={15} fill={showSaved?'currentColor':'none'}/>{showSaved?t.showAllPlaces:t.showSaved} ({saved.length})</button></div>
    {visible.length===0?<section className="glass-panel empty-state"><div className="empty-icon"><Heart size={28}/></div><h2>{t.noSaved}</h2><p>{t.savePlaceCopy}</p><button className="button-ghost" onClick={()=>setShowSaved(false)} data-testid="button-show-attractions">{t.browsePetra}</button></section>:<div className="attraction-grid">{visible.map(place=><article className="glass-panel attraction-card" key={place.id}><div className="attraction-image" style={{backgroundImage:`url("${place.image}")`}}><button className={`favorite-btn ${saved.includes(place.id)?'is-favorite':''}`} aria-label={`${saved.includes(place.id)?t.remove:t.save} ${place.name}`} onClick={()=>toggleFavorite(place.id)} data-testid={`button-favorite-${place.id}`}><Heart size={17} fill={saved.includes(place.id)?'currentColor':'none'}/></button></div><div className="attraction-copy"><div className="tag">{place.tag}</div><h3>{place.name}</h3><p>{place.copy}</p></div></article>)}</div>}</div></main>;
}

function FavoritesPage() {
  const { saved, toggleFavorite, t } = useApp();
  const attractions = getAttractions(t);
  const favoritePlaces = attractions.filter(place => saved.includes(place.id));
  return <main><PageIntro eyebrow={t.savedCollection} title={t.favorites} copy={t.favoritesIntro}/><div className="content-area">{favoritePlaces.length === 0 ? <section className="glass-panel empty-state"><div className="empty-icon"><Heart size={28}/></div><h2>{t.noSaved}</h2><p>{t.savedExploreCopy}</p><Link className="button-primary" href="/explore" data-testid="link-favorites-explore">{t.explore}<ArrowRight size={15}/></Link></section> : <div className="attraction-grid">{favoritePlaces.map(place=><article className="glass-panel attraction-card" key={place.id}><div className="attraction-image" style={{backgroundImage:`url("${place.image}")`}}><button className="favorite-btn is-favorite" aria-label={`${t.remove} ${place.name}`} onClick={()=>toggleFavorite(place.id)} data-testid={`button-remove-favorite-${place.id}`}><Heart size={17} fill="currentColor"/></button></div><div className="attraction-copy"><div className="tag">{place.tag}</div><h3>{place.name}</h3><p>{place.copy}</p></div></article>)}</div>}</div></main>;
}

function EventsPage() {
  const { t, language } = useApp();
  const { data, isLoading, isError, refetch } = useGetPetraSchedules({ query: { queryKey: getGetPetraSchedulesQueryKey() } });
  return <main><PageIntro eyebrow={t.eventsEyebrow} title={t.events} copy={t.eventsIntro}/><div className="content-area"><div className="notice" style={{marginTop:0,marginBottom:20}}><Info size={17}/><span>{t.datesNotice}</span></div>
    {isLoading?<div className="schedule-grid">{[1,2,3,4].map(item=><div key={item} className="glass-panel schedule-card"><div className="skeleton-line"/></div>)}</div>:isError?<section className="glass-panel empty-state"><h2>{t.scheduleUnavailable}</h2><button className="button-ghost" onClick={()=>void refetch()} data-testid="button-retry-events">{t.retry}</button></section>:!data?.length?<section className="glass-panel empty-state"><h2>{t.noSchedules}</h2><p>{t.noSampleDatesCopy}</p></section>:<div className="schedule-grid">{(data||[]).map((event:PetraSchedule)=><article className="glass-panel schedule-card" key={event.id} data-testid={`card-schedule-${event.id}`}><div className="sample-label"><Sparkles size={12}/>{t.stepSampleSchedule}</div><h2 className="schedule-date">{formatDate(event.date,language,{weekday:'long',month:'long',day:'numeric'})}</h2><div className="schedule-meta"><Clock3 size={15}/>{t.eveningTiming}</div><p>{t.illustrativeOnly}</p><Link className="text-link" href="/visitor-info">{t.visitorGuidance}<ArrowRight size={14}/></Link></article>)}</div>}</div></main>;
}

function GalleryPage() {
  const { t, language } = useApp();
  const [active,setActive] = useState<number|null>(null);
  const photos = [
    { name:t.photoTreasury,src:'/assets/petra-treasury.jpg' }, { name:t.photoProcession,src:'/assets/petra-night-hero.jpg' },
    { name:t.photoStone,src:'/assets/petra-monastery.jpg' }, { name:t.photoPetraNight,src:'/assets/petra-night-hero.jpg' },
  ];
  useEffect(()=>{const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setActive(null);};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close);},[]);
  return <main><PageIntro eyebrow={t.galleryEyebrow} title={t.galleryTitle} copy={t.galleryIntro}/><div className="content-area"><div className="gallery-grid">{photos.map((photo,index)=><button className="gallery-item" key={photo.name} onClick={()=>setActive(index)} data-testid={`button-gallery-${index}`} aria-label={`${t.viewPhoto}: ${photo.name}`}><img src={photo.src} alt={photo.name}/><span className="gallery-caption">{photo.name}</span></button>)}</div></div><VisitorGallery h={createElement} useState={useState} language={language} assetBase={import.meta.env.BASE_URL}/>{active!==null&&<div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={t.photoViewer} onClick={()=>setActive(null)}><div className="gallery-modal" onClick={event=>event.stopPropagation()}><button className="modal-close" onClick={()=>setActive(null)} data-testid="button-close-gallery"><X size={18}/>{t.close}</button><img src={photos[active].src} alt={photos[active].name}/><div className="gallery-caption">{photos[active].name}</div><div className="form-actions"><button className="button-ghost" onClick={()=>setActive((active+photos.length-1)%photos.length)} data-testid="button-gallery-prev"><ChevronLeft size={15}/>{t.previous}</button><button className="button-ghost" onClick={()=>setActive((active+1)%photos.length)} data-testid="button-gallery-next">{t.next}<ChevronRight size={15}/></button></div></div></div>}</main>;
}

function VisitorInfoPage() {
  const { t } = useApp();
  const [open,setOpen] = useState<number|null>(0);
  const faqs = [
    [t.faqQ1, t.faqA1], [t.faqQ2, t.faqA2], [t.faqQ3, t.faqA3],
    [t.faqQ4, t.faqA4], [t.faqQ5, t.faqA5], [t.faqQ6, t.faqA6],
  ];
  return <main><PageIntro eyebrow={t.beforeArrival} title={t.info} copy={t.infoIntro}/><div className="content-area">
    <div className="info-grid">
      <article className="glass-panel info-card"><MapPin size={22}/><h3>{t.wadiMusa}</h3><p>{t.wadiMusaCopy}</p></article>
      <article className="glass-panel info-card"><Clock3 size={22}/><h3>{t.allowWalk}</h3><p>{t.allowWalkCopy}</p></article>
      <article className="glass-panel info-card"><ShieldCheck size={22}/><h3>{t.protectPlace}</h3><p>{t.protectPlaceCopy}</p></article>
    </div>
    <div className="section-head"><div><div className="section-kicker">{t.usefulAnswers}</div><h2>{t.goodToKnow}</h2></div></div>
    <div className="faq-list">{faqs.map(([question,answer],index)=><article className="glass-panel faq-item" key={question}><button className="faq-question" onClick={()=>setOpen(open===index?null:index)} aria-expanded={open===index} data-testid={`button-faq-${index}`}>{question}{open===index?<ChevronDown size={17}/>:<ChevronRight size={17}/>}</button>{open===index&&<p className="faq-answer" data-testid={`text-faq-answer-${index}`}>{answer}</p>}</article>)}</div>
    <section className="notice"><Info size={17}/><span>{t.officialNotice}</span></section>
  </div></main>;
}

function Router() {
  return <RoutedErrorBoundary><Switch>
    <Route path="/"><HomePage/></Route>
    <Route path="/book"><BookPage/></Route>
    <Route path="/tickets"><TicketsPage/></Route>
    <Route path="/explore"><ExplorePage/></Route>
    <Route path="/favorites"><FavoritesPage/></Route>
    <Route path="/events"><EventsPage/></Route>
    <Route path="/gallery"><GalleryPage/></Route>
    <Route path="/visitor-info"><VisitorInfoPage/></Route>
    <Route component={NotFoundPage}/>
  </Switch></RoutedErrorBoundary>;
}

function NotFoundPage() {
  const { t } = useApp();
  return <main><PageIntro eyebrow="404" title={t.notFound} copy={t.notFoundCopy}/><div className="content-area"><section className="glass-panel empty-state"><Link className="button-primary" href="/" data-testid="link-not-found-home">{t.home}<ArrowRight size={15}/></Link></section></div></main>;
}

function LocalizedErrorFallback({ resetError }: { error: Error; resetError: () => void }) {
  const { t } = useApp();
  return <main><PageIntro eyebrow="!" title={t.errorTitle} copy={t.errorCopy}/><div className="content-area"><section className="glass-panel empty-state"><button className="button-primary" type="button" onClick={resetError} data-testid="button-retry-error">{t.retry}<ArrowRight size={15}/></button></section></div></main>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location} FallbackComponent={LocalizedErrorFallback}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><AppShell><Router/></AppShell></WouterRouter><Toaster/></TooltipProvider></QueryClientProvider>;
}

export default App;
