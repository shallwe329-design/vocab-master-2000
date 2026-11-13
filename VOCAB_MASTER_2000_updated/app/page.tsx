"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type RelatedIdiom = { term: string; meaning: string; example: string; translation: string };
type Entry = { id: string; term: string; meaning: string; pos?: string; synonyms?: string; example?: string; translation?: string; relatedIdioms?: RelatedIdiom[] };
type RecordItem = { id: string; term: string; correct: boolean; date: string; kind: "word" | "idiom" };

const starterWords: Entry[] = [
  { id: "w1", term: "abundant", meaning: "풍부한", pos: "형용사", synonyms: "plentiful, ample", example: "The region has abundant natural resources.", translation: "그 지역은 풍부한 천연자원을 가지고 있다." },
  { id: "w2", term: "adapt", meaning: "적응하다", pos: "동사", synonyms: "adjust, accommodate", example: "Animals adapt to their environment.", translation: "동물은 환경에 적응한다." },
  { id: "w3", term: "contribute", meaning: "기여하다", pos: "동사", synonyms: "give, donate", example: "Everyone can contribute to the project.", translation: "모두가 그 프로젝트에 기여할 수 있다." }
];
const idiomSuggestions: Record<string, RelatedIdiom[]> = {
  time: [{term:"once in a blue moon",meaning:"아주 드물게",example:"I eat out once in a blue moon.",translation:"나는 아주 드물게 외식한다."},{term:" 시간을 보내다 (pass the time)",meaning:"시간을 보내다",example:"We played games to pass the time.",translation:"우리는 시간을 보내려고 게임을 했다."}],
  heart: [{term:"learn by heart",meaning:"외우다",example:"I learned the poem by heart.",translation:"나는 그 시를 외웠다."},{term:"break someone's heart",meaning:"누군가의 마음을 아프게 하다",example:"He broke her heart.",translation:"그는 그녀의 마음을 아프게 했다."}],
  hand: [{term:"give someone a hand",meaning:"누군가를 돕다",example:"Can you give me a hand?",translation:"저 좀 도와줄 수 있나요?"},{term:"on the other hand",meaning:"반면에",example:"On the other hand, it is expensive.",translation:"반면에 그것은 비싸다."}],
  eye: [{term:"keep an eye on",meaning:"~을 지켜보다",example:"Please keep an eye on my bag.",translation:"제 가방을 좀 봐 주세요."},{term:"see eye to eye",meaning:"의견이 일치하다",example:"We do not always see eye to eye.",translation:"우리는 항상 의견이 일치하는 것은 아니다."}],
  head: [{term:"keep one's head",meaning:"침착함을 유지하다",example:"Try to keep your head in an emergency.",translation:"비상시에 침착함을 유지하도록 해."},{term:"head over heels",meaning:"완전히 빠져서",example:"She is head over heels in love.",translation:"그녀는 사랑에 푹 빠져 있다."}],
  break: [{term:"break the ice",meaning:"어색한 분위기를 깨다",example:"He told a joke to break the ice.",translation:"그는 어색한 분위기를 깨려고 농담을 했다."},{term:"break down",meaning:"고장 나다; 무너지다",example:"My car broke down yesterday.",translation:"어제 내 차가 고장 났다."}],
  look: [{term:"look forward to",meaning:"~을 고대하다",example:"I look forward to meeting you.",translation:"당신을 만나기를 고대합니다."},{term:"look after",meaning:"~을 돌보다",example:"She looks after her younger brother.",translation:"그녀는 남동생을 돌본다."}],
  take: [{term:"take part in",meaning:"~에 참여하다",example:"I took part in the contest.",translation:"나는 그 대회에 참가했다."},{term:"take care of",meaning:"~을 돌보다",example:"Take care of yourself.",translation:"몸 잘 챙겨."}],
  get: [{term:"get along with",meaning:"~와 잘 지내다",example:"I get along with my classmates.",translation:"나는 반 친구들과 잘 지낸다."},{term:"get rid of",meaning:"~을 제거하다",example:"We should get rid of waste.",translation:"우리는 쓰레기를 없애야 한다."}],
  make: [{term:"make up one's mind",meaning:"결심하다",example:"She made up her mind to study abroad.",translation:"그녀는 유학하기로 결심했다."},{term:"make ends meet",meaning:"겨우 생계를 꾸리다",example:"It is hard to make ends meet.",translation:"생계를 꾸리기가 어렵다."}],
  give: [{term:"give up",meaning:"포기하다",example:"Never give up your dream.",translation:"절대 꿈을 포기하지 마."},{term:"give a hand",meaning:"도와주다",example:"Could you give me a hand?",translation:"저를 도와주시겠어요?"}],
  come: [{term:"come true",meaning:"실현되다",example:"My dream came true.",translation:"내 꿈이 실현되었다."},{term:"come up with",meaning:"~을 생각해 내다",example:"She came up with a great idea.",translation:"그녀는 훌륭한 아이디어를 생각해 냈다."}],
  go: [{term:"go through",meaning:"겪다; 경험하다",example:"He went through a difficult time.",translation:"그는 힘든 시기를 겪었다."},{term:"go out of one's way",meaning:"일부러 애쓰다",example:"She went out of her way to help me.",translation:"그녀는 나를 돕기 위해 일부러 애썼다."}],
  run: [{term:"run out of",meaning:"~을 다 써버리다",example:"We ran out of time.",translation:"우리는 시간이 다 되었다."},{term:"run into",meaning:"우연히 만나다",example:"I ran into an old friend.",translation:"나는 옛 친구를 우연히 만났다."}],
  work: [{term:"work out",meaning:"운동하다; 잘 풀리다",example:"Everything will work out.",translation:"모든 일이 잘 풀릴 거야."},{term:"in the works",meaning:"진행 중인",example:"A new project is in the works.",translation:"새 프로젝트가 진행 중이다."}],
  way: [{term:"by the way",meaning:"그런데; 그건 그렇고",example:"By the way, how was your trip?",translation:"그런데 여행은 어땠어?"},{term:"in the way",meaning:"방해가 되는",example:"Do not stand in the way.",translation:"방해가 되게 서 있지 마."}],
  world: [{term:"around the world",meaning:"전 세계에",example:"People around the world use the internet.",translation:"전 세계 사람들이 인터넷을 사용한다."},{term:"the best of both worlds",meaning:"두 가지 장점을 모두 누리는 상황",example:"This job gives me the best of both worlds.",translation:"이 직업은 두 가지 장점을 모두 누리게 해 준다."}],
  life: [{term:"once in a lifetime",meaning:"평생에 한 번뿐인",example:"It was a once-in-a-lifetime chance.",translation:"그것은 평생에 한 번뿐인 기회였다."},{term:"bring to life",meaning:"생생하게 만들다",example:"The movie brings the story to life.",translation:"그 영화는 이야기를 생생하게 만든다."}],
};

const starterIdioms: Entry[] = [
  { id: "i1", term: "break the ice", meaning: "어색한 분위기를 깨다", synonyms: "start a conversation", example: "He told a joke to break the ice.", translation: "그는 어색한 분위기를 깨려고 농담을 했다." },
  { id: "i2", term: "once in a blue moon", meaning: "아주 드물게", synonyms: "rarely, hardly ever", example: "I eat fast food once in a blue moon.", translation: "나는 아주 드물게 패스트푸드를 먹는다." }
];

function makeDays(items: Entry[], perDay: number) {
  const safe = Math.max(1, Math.floor(perDay || 1));
  return Array.from({ length: Math.ceil(items.length / safe) }, (_, i) => items.slice(i * safe, (i + 1) * safe));
}
function speak(text: string, slow = false) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = slow ? 0.75 : 1;
  window.speechSynthesis.speak(utterance);
}
function parseLines(raw: string, kind: "word" | "idiom"): Entry[] {
  return raw.split("\n").map(line => line.trim()).filter(Boolean).map((line, index) => {
    const parts = line.split("|").map(s => s.trim());
    return {
      id: `${kind}-${Date.now()}-${index}`,
      term: parts[0] || "",
      meaning: parts[1] || "",
      pos: parts[2] || (kind === "idiom" ? "숙어" : "품사 미입력"),
      synonyms: parts[3] || "",
      example: parts[4] || "",
      translation: parts[5] || ""
    };
  }).filter(x => x.term);
}

export default function Home() {
  const [words, setWords] = useState<Entry[]>(starterWords);
  const [idioms, setIdioms] = useState<Entry[]>(starterIdioms);
  const [wordRaw, setWordRaw] = useState("");
  const [idiomRaw, setIdiomRaw] = useState("");
  const [lookupTerm, setLookupTerm] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupMessage, setLookupMessage] = useState("");
  const [lookupPreview, setLookupPreview] = useState<Entry | null>(null);
  const [wordDaily, setWordDaily] = useState(20);
  const [idiomDaily, setIdiomDaily] = useState(10);
  const [tab, setTab] = useState("home");
  const [kind, setKind] = useState<"word" | "idiom">("word");
  const [day, setDay] = useState(0);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [wrong, setWrong] = useState<RecordItem[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizChoice, setQuizChoice] = useState("");
  const [feedback, setFeedback] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("vm2k-data");
      if (saved) {
        const d = JSON.parse(saved);
        setWords(d.words || starterWords); setIdioms(d.idioms || starterIdioms);
        setWordDaily(d.wordDaily || 20); setIdiomDaily(d.idiomDaily || 10);
        setRecords(d.records || []); setWrong(d.wrong || []);
      }
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("vm2k-data", JSON.stringify({ words, idioms, wordDaily, idiomDaily, records, wrong }));
  }, [words, idioms, wordDaily, idiomDaily, records, wrong, loaded]);

  const activeItems = kind === "word" ? words : idioms;
  const daily = kind === "word" ? wordDaily : idiomDaily;
  const days = useMemo(() => makeDays(activeItems, daily), [activeItems, daily]);
  const currentItems = days[day] || [];
  const completed = new Set(records.filter(r => r.correct).map(r => `${r.kind}:${r.term}`)).size;
  const accuracy = records.length ? Math.round(records.filter(r => r.correct).length / records.length * 100) : 0;
  const quizItems = currentItems;
  const currentQuiz = quizItems[quizIndex % Math.max(1, quizItems.length)];

  function addEntries(which: "word" | "idiom") {
    const incoming = parseLines(which === "word" ? wordRaw : idiomRaw, which);
    if (!incoming.length) return;
    if (which === "word") { setWords(prev => [...prev, ...incoming]); setWordRaw(""); }
    else { setIdioms(prev => [...prev, ...incoming]); setIdiomRaw(""); }
    setDay(0);
    setTab("study");
    setKind(which);
  }
  async function translateText(text: string) {
    if (!text) return "";
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ko`);
      const data = await res.json();
      return data?.responseData?.translatedText || text;
    } catch { return text; }
  }
  async function lookupWord() {
    const term = lookupTerm.trim().toLowerCase();
    if (!term) { setLookupMessage("영어 단어를 먼저 입력해 주세요."); return; }
    setLookupLoading(true); setLookupMessage("사전에서 정보를 찾고 있어요..."); setLookupPreview(null);
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(term)}`);
      if (!res.ok) throw new Error("단어를 찾지 못했어요. 철자를 확인해 주세요.");
      const data = await res.json();
      const entry = data?.[0];
      const meanings = entry?.meanings || [];
      const firstMeaning = meanings.find((m: any) => m.definitions?.length) || meanings[0];
      const definition = firstMeaning?.definitions?.[0]?.definition || "";
      const example = firstMeaning?.definitions?.find((d: any) => d.example)?.example || "";
      const posMap: Record<string,string> = {noun:"명사",verb:"동사",adjective:"형용사",adverb:"부사",pronoun:"대명사",preposition:"전치사",conjunction:"접속사",interjection:"감탄사"};
      const pos = posMap[firstMeaning?.partOfSpeech] || firstMeaning?.partOfSpeech || "품사 미확인";
      let synonyms = Array.from(new Set(meanings.flatMap((m: any) => (m.definitions || []).flatMap((d: any) => d.synonyms || []).concat(m.synonyms || [])))).slice(0,8).join(", ");
      if (!synonyms) {
        try { const sr = await fetch(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(term)}&max=8`); const sd = await sr.json(); synonyms = sd.map((x: any) => x.word).join(", "); } catch {}
      }
      const [meaningKo, exampleKo] = await Promise.all([translateText(definition), translateText(example)]);
      const relatedIdioms = idiomSuggestions[term] || [];
      setLookupPreview({id:`lookup-${Date.now()}`,term,meaning:meaningKo || definition,pos,synonyms,example,translation:exampleKo,relatedIdioms});
      setLookupMessage(relatedIdioms.length ? `정보를 찾았어요! 관련 숙어 ${relatedIdioms.length}개도 찾았습니다.` : "단어 정보를 찾았어요. 이 단어에 연결된 숙어 추천은 아직 준비된 목록에 없어요.");
    } catch (e: any) { setLookupMessage(e?.message || "검색 중 문제가 발생했어요."); }
    finally { setLookupLoading(false); }
  }
  function addLookupPreview() {
    if (!lookupPreview) return;
    if (words.some(w => w.term.toLowerCase() === lookupPreview.term.toLowerCase())) { setLookupMessage("이미 등록된 단어예요."); return; }
    setWords(prev => [...prev, lookupPreview]);
    const newIdioms = (lookupPreview.relatedIdioms || []).filter(x => !idioms.some(i => i.term.toLowerCase() === x.term.toLowerCase())).map((x,i) => ({id:`auto-idiom-${Date.now()}-${i}`,term:x.term,meaning:x.meaning,pos:"숙어",synonyms:"",example:x.example,translation:x.translation}));
    if (newIdioms.length) setIdioms(prev => [...prev, ...newIdioms]);
    setLookupMessage(`단어를 추가했어요.${newIdioms.length ? ` 관련 숙어 ${newIdioms.length}개도 숙어장에 추가했어요.` : ""}`);
    setLookupPreview(null); setLookupTerm(""); setDay(0);
  }
  function deleteEntry(which: "word" | "idiom", entry: Entry) {
    if (!window.confirm(`'${entry.term}'을(를) 삭제할까요? 관련 학습 기록과 오답 기록도 함께 삭제됩니다.`)) return;
    if (which === "word") setWords(prev => prev.filter(x => x.id !== entry.id));
    else setIdioms(prev => prev.filter(x => x.id !== entry.id));
    setRecords(prev => prev.filter(x => !(x.kind === which && x.term === entry.term)));
    setWrong(prev => prev.filter(x => !(x.kind === which && x.term === entry.term)));
    setDay(0);
  }

  function recordAnswer(correct: boolean) {
    if (!currentQuiz) return;
    const item: RecordItem = { id: `${Date.now()}`, term: currentQuiz.term, correct, date: new Date().toISOString(), kind };
    setRecords(prev => [...prev, item]);
    if (!correct) setWrong(prev => [item, ...prev]);
    setFeedback(correct ? "정답이에요! 잘했어요 🎉" : `오답이에요. 정답: ${currentQuiz.meaning}`);
  }
  async function auth(action: "signup" | "login") {
    if (!supabase) { setAuthMessage("먼저 .env.local에 Supabase URL과 공개 키를 입력하고 서버를 다시 실행해 주세요."); return; }
    const result = action === "signup"
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setAuthMessage(result.error ? result.error.message : action === "signup" ? "가입 요청 완료! 이메일 인증이 필요할 수 있어요." : "로그인되었습니다.");
  }
  async function saveToCloud() {
    if (!supabase) { setAuthMessage("Supabase 설정 전입니다. 현재 학습 데이터는 이 브라우저에 자동 저장됩니다."); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAuthMessage("먼저 로그인해 주세요."); return; }
    const payload = { user_id: user.id, words, idioms, word_daily: wordDaily, idiom_daily: idiomDaily, records, updated_at: new Date().toISOString() };
    const { error } = await supabase.from("user_learning_data").upsert(payload, { onConflict: "user_id" });
    setAuthMessage(error ? error.message : "클라우드 저장 완료!");
  }

  return <main className="shell">
    <header className="topbar">
      <div className="brand"><div className="brandIcon">V</div><div><b>VOCAB MASTER <span>2000</span></b><small>MY WORDS, MY WAY</small></div></div>
      <div className="topRight"><span className="saveStatus">● 자동 저장</span><button className="outline small" onClick={() => setTab("account")}>계정 / 동기화</button></div>
    </header>
    <section className="hero">
      <div><p className="eyebrow">PERSONAL ENGLISH LEARNING</p><h1>나만의 단어장으로<br/><em>영어 실력을 완성하세요.</em></h1><p className="heroText">직접 입력한 단어와 숙어로 맞춤형 Day를 만들고, 학습부터 테스트까지 한곳에서 관리하세요.</p>
        <div className="heroActions"><button onClick={() => setTab("input")}>나만의 단어장 만들기 <span>→</span></button><button className="ghost" onClick={() => setTab("study")}>학습 시작</button></div>
      </div>
      <div className="heroCard"><div className="orb">V</div><p>YOUR DAILY GOAL</p><strong>{wordDaily + idiomDaily}<small>개 / 일</small></strong><div className="miniBars"><i/><i/><i/><i/><i/><i/><i/></div><span>꾸준한 학습이 실력을 만듭니다.</span></div>
    </section>
    <nav className="nav">
      {[["home","대시보드"],["input","단어 입력"],["study","학습하기"],["quiz","테스트"],["wrong","오답노트"],["account","계정 설정"]].map(([id,label]) => <button key={id} className={tab===id?"active":""} onClick={()=>setTab(id)}>{label}</button>)}
    </nav>

    {tab==="home" && <section className="content">
      <div className="sectionHead"><div><p className="eyebrow">OVERVIEW</p><h2>나의 학습 현황</h2></div><span className="datePill">{new Date().toLocaleDateString("ko-KR")}</span></div>
      <div className="stats">
        <Stat label="등록한 영어 단어" value={words.length} unit="개" />
        <Stat label="등록한 숙어 표현" value={idioms.length} unit="개" />
        <Stat label="정답률" value={accuracy} unit="%" />
        <Stat label="오답 누적" value={wrong.length} unit="개" />
      </div>
      <div className="twoCols">
        <div className="panel"><div className="panelTitle"><h3>학습 진도</h3><span>전체 단어 + 숙어</span></div><div className="progressLine"><div style={{width:`${Math.min(100, Math.round(completed/Math.max(1,words.length+idioms.length)*100))}%`}}/></div><div className="progressMeta"><b>{Math.min(100,Math.round(completed/Math.max(1,words.length+idioms.length)*100))}%</b><span>{completed} / {words.length+idioms.length}개 학습 기록</span></div><div className="quickGrid"><div><small>단어 Day</small><b>{makeDays(words,wordDaily).length}일</b></div><div><small>숙어 Day</small><b>{makeDays(idioms,idiomDaily).length}일</b></div></div></div>
        <div className="panel"><div className="panelTitle"><h3>빠른 시작</h3><span>오늘의 학습</span></div><p className="muted">원하는 학습 영역을 선택하고 바로 시작해 보세요.</p><div className="quickButtons"><button onClick={()=>{setKind("word");setDay(0);setTab("study")}}>영단어 학습하기 →</button><button onClick={()=>{setKind("idiom");setDay(0);setTab("study")}}>숙어 표현 학습하기 →</button></div></div>
      </div>
      <div className="panel recent"><div className="panelTitle"><h3>최근 학습 기록</h3><span>최근 5개</span></div>{records.slice(-5).reverse().map(r=><div className="record" key={r.id}><span>{r.kind==="word"?"단어":"숙어"}</span><b>{r.term}</b><small>{new Date(r.date).toLocaleString("ko-KR")}</small><strong className={r.correct?"good":"bad"}>{r.correct?"정답":"오답"}</strong></div>)}{!records.length&&<p className="muted">아직 학습 기록이 없어요. 첫 학습을 시작해 보세요!</p>}</div>
    </section>}

    {tab==="input" && <section className="content">
      <div className="sectionHead"><div><p className="eyebrow">BUILD YOUR VOCABULARY</p><h2>나만의 단어장 만들기</h2><p className="muted">단어와 숙어를 직접 입력하면 하루 학습량에 맞춰 Day가 자동 생성됩니다.</p></div></div>
      <div className="panel inputPanel lookupPanel"><div className="panelTitle"><h3>단어 하나로 자동 정보 찾기</h3><span>DICTIONARY LOOKUP</span></div><p className="muted">영어 단어를 입력하면 뜻·품사·유의어·예문을 자동으로 찾아옵니다. 결과는 직접 수정한 뒤 추가할 수 있어요.</p><div className="lookupRow"><input value={lookupTerm} onChange={e=>setLookupTerm(e.target.value)} onKeyDown={e=>{if(e.key==="Enter") lookupWord();}} placeholder="예: abandon"/><button onClick={lookupWord} disabled={lookupLoading}>{lookupLoading?"검색 중...":"자동으로 정보 찾기"}</button></div>{lookupMessage&&<p className="hint">{lookupMessage}</p>}{lookupPreview&&<div className="lookupPreview"><div className="panelTitle"><h3>{lookupPreview.term}</h3><span>검색 결과 · 수정 가능</span></div><label>뜻</label><input value={lookupPreview.meaning} onChange={e=>setLookupPreview({...lookupPreview,meaning:e.target.value})}/><label>품사</label><input value={lookupPreview.pos||""} onChange={e=>setLookupPreview({...lookupPreview,pos:e.target.value})}/><label>유의어</label><input value={lookupPreview.synonyms||""} onChange={e=>setLookupPreview({...lookupPreview,synonyms:e.target.value})}/><label>예문</label><input value={lookupPreview.example||""} onChange={e=>setLookupPreview({...lookupPreview,example:e.target.value})}/><label>예문 해석</label><input value={lookupPreview.translation||""} onChange={e=>setLookupPreview({...lookupPreview,translation:e.target.value})}/>{!!lookupPreview.relatedIdioms?.length&&<div className="relatedBox"><b>함께 추천하는 숙어</b>{lookupPreview.relatedIdioms.map(x=><p key={x.term}><strong>{x.term}</strong> — {x.meaning}</p>)}</div>}<button onClick={addLookupPreview}>단어와 관련 숙어 추가하기 →</button></div>}</div>
      <div className="twoCols">
        <div className="panel inputPanel"><div className="panelTitle"><h3>영어 단어 직접 입력</h3><span>VOCABULARY</span></div><label>하루 학습할 단어 수</label><input className="numberInput" type="number" min="1" value={wordDaily} onChange={e=>setWordDaily(Math.max(1,Number(e.target.value)||1))}/><p className="hint">몇 개든 원하는 숫자로 설정할 수 있어요.</p><label>단어 목록</label><textarea value={wordRaw} onChange={e=>setWordRaw(e.target.value)} placeholder={"한 줄에 하나씩 입력하세요.\n영어 단어 | 뜻 | 품사 | 유의어 | 예문 | 예문 해석\n예: resilient | 회복력 있는 | 형용사 | tough, strong | She is resilient. | 그녀는 회복력이 있다."}/><button onClick={()=>addEntries("word")}>단어 추가하고 Day 만들기 →</button><p className="hint">필수: 영어 단어와 뜻. 나머지 항목은 생략할 수 있습니다.</p><div className="added">현재 등록: <b>{words.length}개</b> · 총 <b>{makeDays(words,wordDaily).length} Days</b></div></div>
        <div className="panel inputPanel"><div className="panelTitle"><h3>숙어·표현 입력</h3><span>IDIOMS & PHRASES</span></div><label>하루 학습할 숙어 수</label><input className="numberInput" type="number" min="1" value={idiomDaily} onChange={e=>setIdiomDaily(Math.max(1,Number(e.target.value)||1))}/><p className="hint">숙어도 단어와 별도로 학습량을 설정합니다.</p><label>숙어 목록</label><textarea value={idiomRaw} onChange={e=>setIdiomRaw(e.target.value)} placeholder={"한 줄에 하나씩 입력하세요.\n숙어 | 뜻 | (선택) | 유의 표현 | 예문 | 예문 해석\n예: look forward to | ~을 고대하다 | | anticipate | I look forward to seeing you. | 당신을 만나기를 고대합니다."}/><button onClick={()=>addEntries("idiom")}>숙어 추가하고 Day 만들기 →</button><p className="hint">필수: 숙어 표현과 뜻. 유의 표현과 예문도 추가할 수 있습니다.</p><div className="added">현재 등록: <b>{idioms.length}개</b> · 총 <b>{makeDays(idioms,idiomDaily).length} Days</b></div></div>
      </div>
      <div className="panel format"><b>입력 형식 예시</b><p>영어 | 뜻 | 품사 | 유의어 | 예문 | 예문 해석</p><small>예: abandon | 버리다, 포기하다 | 동사 | leave, give up | He abandoned the plan. | 그는 그 계획을 포기했다.</small></div>
    </section>}

    {tab==="study" && <section className="content">
      <div className="sectionHead"><div><p className="eyebrow">LEARN</p><h2>오늘의 학습</h2><p className="muted">카드를 확인하고 발음을 들으며 익혀 보세요.</p></div></div>
      <div className="studyToolbar"><div className="switch"><button className={kind==="word"?"selected":""} onClick={()=>{setKind("word");setDay(0)}}>영단어 ({words.length})</button><button className={kind==="idiom"?"selected":""} onClick={()=>{setKind("idiom");setDay(0)}}>숙어 ({idioms.length})</button></div><label>학습 Day <select value={day} onChange={e=>setDay(Number(e.target.value))}>{days.map((_,i)=><option value={i} key={i}>Day {i+1}</option>)}</select></label></div>
      <div className="dayInfo"><b>DAY {day+1}</b><span>{currentItems.length}개 학습</span><span>전체 {days.length} Days</span></div>
      <div className="wordList">{currentItems.map((item,i)=><article className="wordCard" key={item.id}><div className="wordNumber">{String(i+1).padStart(2,"0")}</div><div className="wordMain"><div className="termLine"><h3>{item.term}</h3>{item.pos&&<span>{item.pos}</span>}</div><p className="meaning">{item.meaning}</p>{item.synonyms&&<p><small>유의어 · </small>{item.synonyms}</p>}{item.example&&<div className="example"><p>{item.example}</p><small>{item.translation}</small></div>}{item.relatedIdioms?.length ? <div className="relatedBox"><b>관련 숙어</b>{item.relatedIdioms.map(x=><p key={x.term}><strong>{x.term}</strong> — {x.meaning}</p>)}</div> : null}</div><div className="soundButtons"><button title="보통 속도" onClick={()=>speak(item.term)}>🔊</button><button title="느린 속도" onClick={()=>speak(item.term,true)}>🐢</button>{item.example&&<button title="예문 듣기" onClick={()=>speak(item.example!)}>문장 듣기</button>}<button className="deleteButton" title="삭제" onClick={()=>deleteEntry(kind,item)}>삭제</button></div></article>)}{!currentItems.length&&<div className="empty">아직 등록된 항목이 없어요. 먼저 단어를 입력해 주세요.</div>}</div>
    </section>}

    {tab==="quiz" && <section className="content">
      <div className="sectionHead"><div><p className="eyebrow">CHECK YOURSELF</p><h2>실력 테스트</h2><p className="muted">현재 선택한 영역과 Day에 등록된 항목으로 테스트합니다.</p></div></div>
      <div className="studyToolbar"><div className="switch"><button className={kind==="word"?"selected":""} onClick={()=>{setKind("word");setDay(0);setQuizIndex(0);setFeedback("")}}>영단어</button><button className={kind==="idiom"?"selected":""} onClick={()=>{setKind("idiom");setDay(0);setQuizIndex(0);setFeedback("")}}>숙어</button></div><label>Day <select value={day} onChange={e=>{setDay(Number(e.target.value));setQuizIndex(0);setFeedback("")}}>{days.map((_,i)=><option value={i} key={i}>Day {i+1}</option>)}</select></label></div>
      <div className="quizCard">{currentQuiz ? <><div className="quizTop">QUESTION {quizIndex+1} / {quizItems.length}</div><h3>{currentQuiz.term}</h3><p>위 표현의 뜻으로 알맞은 것은?</p><div className="answerBox"><input value={quizChoice} onChange={e=>setQuizChoice(e.target.value)} placeholder="뜻을 직접 입력해 보세요." onKeyDown={e=>{if(e.key==="Enter"){recordAnswer(quizChoice.trim().toLowerCase()===currentQuiz.meaning.trim().toLowerCase());setQuizChoice("")}}}/><button onClick={()=>{recordAnswer(quizChoice.trim().toLowerCase()===currentQuiz.meaning.trim().toLowerCase());setQuizChoice("")}}>정답 확인</button></div><div className="or">또는 객관식으로 풀기</div><div className="choices">{[currentQuiz.meaning,...activeItems.filter(x=>x.id!==currentQuiz.id).slice(0,3).map(x=>x.meaning)].sort(()=>Math.random()-.5).map((choice,i)=><button key={`${choice}-${i}`} onClick={()=>recordAnswer(choice===currentQuiz.meaning)}>{choice}</button>)}</div>{feedback&&<p className="feedback">{feedback}</p>}<button className="nextQuestion" onClick={()=>{setQuizIndex(i=>i+1);setFeedback("");setQuizChoice("")}}>다음 문제 →</button></> : <div className="empty">테스트할 항목이 없습니다. 먼저 단어 또는 숙어를 입력해 주세요.</div>}</div>
    </section>}

    {tab==="wrong" && <section className="content"><div className="sectionHead"><div><p className="eyebrow">REVIEW</p><h2>오답노트</h2><p className="muted">테스트에서 틀린 항목을 모아 다시 확인할 수 있습니다.</p></div><span className="datePill">{wrong.length}개</span></div><div className="panel">{wrong.length ? wrong.map((r,i)=><div className="record" key={r.id}><span>{r.kind==="word"?"단어":"숙어"}</span><b>{r.term}</b><small>{new Date(r.date).toLocaleDateString("ko-KR")}</small><strong className="bad">오답</strong></div>) : <p className="muted">아직 오답이 없습니다. 테스트를 풀면 여기에 쌓여요.</p>}</div></section>}

    {tab==="account" && <section className="content"><div className="sectionHead"><div><p className="eyebrow">ACCOUNT & CLOUD</p><h2>계정 및 데이터 동기화</h2><p className="muted">Supabase를 연결하면 계정 기반 클라우드 저장을 사용할 수 있습니다.</p></div></div><div className="twoCols"><div className="panel inputPanel"><h3>회원가입 / 로그인</h3><label>이메일</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="이메일 주소" type="email"/><label>비밀번호</label><input value={password} onChange={e=>setPassword(e.target.value)} placeholder="비밀번호 (6자 이상)" type="password"/><div className="authButtons"><button onClick={()=>auth("signup")}>회원가입</button><button className="outline" onClick={()=>auth("login")}>로그인</button></div><p className="hint">Supabase 환경변수를 설정한 경우에만 작동합니다.</p></div><div className="panel inputPanel"><h3>클라우드 저장</h3><p className="muted">현재 데이터는 이 브라우저에 자동 저장됩니다. 로그인 후 클라우드 저장을 누르면 계정에 저장할 수 있습니다.</p><button onClick={saveToCloud}>내 데이터 클라우드 저장</button><p className="hint">다른 기기에서 불러오는 기능은 다음 연결 단계에서 추가할 수 있습니다.</p></div></div>{authMessage&&<div className="notice">{authMessage}</div>}<div className="panel format"><b>현재 저장 방식 안내</b><p>브라우저 자동 저장(Local Storage)이 기본으로 작동합니다. Supabase 연동은 프로젝트 URL과 공개 키, SQL 테이블 설정이 필요합니다. 비밀키(service_role)는 브라우저에 입력하지 마세요.</p></div></section>}
    <footer>VOCAB MASTER 2000 <span>·</span> Build your own learning routine.</footer>
  </main>;
}
function Stat({label,value,unit}:{label:string;value:number;unit:string}) { return <div className="stat"><span>{label}</span><strong>{value}<small>{unit}</small></strong></div>; }
