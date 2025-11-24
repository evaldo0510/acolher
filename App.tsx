import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, Users, Map, ShoppingBag, User,
  Heart, Zap, Pill, Moon, Sun, 
  Mic, Send, MapPin, 
  Star, Stethoscope, Briefcase, Coins, ArrowRight,
  Settings, Camera, Sparkles, Smile, Calendar, Shield,
  AlertTriangle, X, Printer, Phone, MessageCircle, ChevronLeft,
  Clock, FileText, BookHeart, Lock, CloudRain, Navigation, 
  Utensils, Bath, Gamepad2, BookOpen, Music, Droplets,
  HeartHandshake, Edit3, Info, Check, LogOut,
  Megaphone, Wifi, WifiOff, Sliders, DollarSign, CheckCircle, PlusCircle, Bell, Upload, Palmtree
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken,
  onAuthStateChanged,
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  setDoc, 
  getDoc,
} from 'firebase/firestore';

// --- CONFIGURAÇÃO FIREBASE ---
// @ts-ignore
const firebaseConfig = JSON.parse(window.__firebase_config || '{}');
const isDemo = firebaseConfig.apiKey === 'demo-key' || !firebaseConfig.apiKey;

let app, auth, db;

if (!isDemo) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) {
    console.error("Firebase initialization error:", e);
  }
}

// @ts-ignore
const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'acolher-app-id';

// --- BIBLIOTECA DE AÇÕES DISPONÍVEIS ---
const ACTION_LIBRARY = {
  meds: { label: "Medicação", icon: Pill, color: "bg-blue-50 text-blue-600 border-blue-100" },
  mood: { label: "Humor", icon: Sun, color: "bg-yellow-50 text-yellow-600 border-yellow-100" },
  school: { label: "Escola", icon: Briefcase, color: "bg-purple-50 text-purple-600 border-purple-100" },
  crisis: { label: "Crise", icon: Zap, color: "bg-red-50 text-red-600 border-red-100" },
  food: { label: "Alimentação", icon: Utensils, color: "bg-green-50 text-green-600 border-green-100" },
  bath: { label: "Banho", icon: Bath, color: "bg-cyan-50 text-cyan-600 border-cyan-100" },
  sleep: { label: "Sono", icon: Moon, color: "bg-indigo-50 text-indigo-600 border-indigo-100" },
  play: { label: "Brincar", icon: Gamepad2, color: "bg-pink-50 text-pink-600 border-pink-100" },
  therapy: { label: "Terapia", icon: Heart, color: "bg-rose-50 text-rose-600 border-rose-100" },
  study: { label: "Estudos", icon: BookOpen, color: "bg-orange-50 text-orange-600 border-orange-100" },
  sensory: { label: "Sensorial", icon: Music, color: "bg-teal-50 text-teal-600 border-teal-100" },
  toilet: { label: "Higiene", icon: Droplets, color: "bg-sky-50 text-sky-600 border-sky-100" }
};

// --- DADOS PADRÃO (FALLBACK) ---
const DEFAULT_EVENTS = [
  { id: 'evt1', month: "NOV", day: "28", title: "ExpoTEA 2025", loc: "Expo Center Norte", dist: "12km", desc: "A maior exposição internacional sobre Autismo. Entrada gratuita.", highlight: true },
  { id: 'evt2', month: "NOV", day: "30", title: "Feira Empreendedorismo Materno", loc: "Centro de Eventos Pro Magno", dist: "8km", desc: "Oportunidade para mães atípicas exporem seus produtos." },
  { id: 'evt3', month: "ABR", day: "06", title: "Caminhada Autismo 2025", loc: "Memorial da América Latina", dist: "14km", desc: "Grande caminhada pela conscientização." },
  { id: 'evt4', month: "OUT", day: "15", title: "Autismo Tech 2025", loc: "Online", dist: "Digital", desc: "Hackathon focado em inclusão." },
];

const DEFAULT_MARKET = [
  { id: 'prod1', title: "Kit Rotina Visual (PECS)", price: "R$ 45,00", author: "Mãe Joana", category: "Material", imageColor: "bg-orange-100" },
  { id: 'prod2', title: "Mordedor Sensorial", price: "R$ 28,50", author: "Mãe Carla", category: "Sensorial", imageColor: "bg-purple-100" },
];

const AcolherSuperApp = () => {
  // --- ESTADOS GLOBAIS ---
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [timeOfDay, setTimeOfDay] = useState('morning'); 
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Offline State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // --- DADOS DO USUÁRIO ---
  const [userProfile, setUserProfile] = useState({
    momName: "", childName: "", childAge: "7 anos",
    diagnosis: "Síndrome de Down", level: "Mãe Guardiã (Nvl 3)",
    badges: ["Primeiros Passos", "Super Vendedora", "Exploradora"], 
    streak: 12, points: 1350, cep: "", photoUrl: null
  });
  
  // --- LISTAS DINÂMICAS ---
  const [logs, setLogs] = useState([]);
  const [eventsAgenda, setEventsAgenda] = useState(DEFAULT_EVENTS);
  const [marketplaceItems, setMarketplaceItems] = useState(DEFAULT_MARKET);

  // --- ESTADOS LOCAIS & UI ---
  const [userRoutine, setUserRoutine] = useState({
    morning: ['meds', 'mood', 'food', 'school'],
    afternoon: ['therapy', 'play', 'food', 'crisis'],
    night: ['bath', 'sleep', 'meds']
  });
  
  const [showReward, setShowReward] = useState(null);
  const [activeModal, setActiveModal] = useState(null); 
  const [chatUser, setChatUser] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [noteInput, setNoteInput] = useState("");
  const [quickInput, setQuickInput] = useState("");
  const [journalMood, setJournalMood] = useState('neutral');
  const [insight, setInsight] = useState(null);
  
  // New Features State
  const [favorites, setFavorites] = useState([]); // Array of IDs
  const [customIcons, setCustomIcons] = useState({}); // { meds: 'url' }
  const [cameraContext, setCameraContext] = useState('profile'); // 'profile' | 'chat'
  const [chatMessages, setChatMessages] = useState([]); // Local chat state for demo

  // Map Filters
  const [mapFilter, setMapFilter] = useState('all'); 
  const [mapFreeOnly, setMapFreeOnly] = useState(false);
  const [mapMaxDist, setMapMaxDist] = useState(10); // km
  const [showFavsOnly, setShowFavsOnly] = useState(false);

  // --- 0. SYNC MANAGER & OFFLINE DETECTION ---
  
  const syncOfflineLogs = async () => {
    if (!user || isDemo) return;
    const pending = JSON.parse(localStorage.getItem('acolher_pending_logs') || '[]');
    if (pending.length === 0) {
        setPendingSyncCount(0);
        return;
    }

    triggerReward(`Sincronizando ${pending.length} registros...`, 0);

    const failed = [];
    for (const log of pending) {
      try {
        // @ts-ignore
        const { id, ...logData } = log; 
        // @ts-ignore
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'logs'), logData);
      } catch (e) {
        console.error("Sync failed for log", log, e);
        failed.push(log);
      }
    }

    if (failed.length > 0) {
        localStorage.setItem('acolher_pending_logs', JSON.stringify(failed));
        setPendingSyncCount(failed.length);
        triggerReward(`${pending.length - failed.length} sincronizados. ${failed.length} pendentes.`, 5);
    } else {
        localStorage.removeItem('acolher_pending_logs');
        setPendingSyncCount(0);
        triggerReward("Sincronização concluída!", 10);
    }
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check for pending items count
    const pending = JSON.parse(localStorage.getItem('acolher_pending_logs') || '[]');
    setPendingSyncCount(pending.length);

    // Load favorites & custom icons from localstorage for persistence
    const savedFavs = JSON.parse(localStorage.getItem('acolher_favorites') || '[]');
    const savedIcons = JSON.parse(localStorage.getItem('acolher_custom_icons') || '{}');
    setFavorites(savedFavs);
    setCustomIcons(savedIcons);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Trigger sync when conditions are met (Online + User Present + Not Demo)
  useEffect(() => {
    if (isOnline && user && !isDemo) {
        syncOfflineLogs();
    }
  }, [isOnline, user, isDemo]);


  // --- 1. CONEXÃO COM FIREBASE (AUTH OU DEMO) ---
  useEffect(() => {
    const initAuth = async () => {
      if (isDemo) {
        console.warn("Running in Demo Mode (Mock Auth)");
        setTimeout(() => {
          // @ts-ignore
          setUser({ uid: 'demo-user', isAnonymous: true });
          fetchUserProfile('demo-user');
        }, 1000);
        return;
      }

      // @ts-ignore
      if (typeof window.__initial_auth_token !== 'undefined' && window.__initial_auth_token) {
        // @ts-ignore
        await signInWithCustomToken(auth, window.__initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };

    initAuth();

    if (!isDemo && auth) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        // @ts-ignore
        setUser(currentUser);
        if (currentUser) {
          fetchUserProfile(currentUser.uid);
        } else {
          setLoading(false);
          setOnboardingStep(0);
        }
      });
      return () => unsubscribe();
    }
  }, []);

  // --- 2. LEITURA DE DADOS ---
  
  const fetchUserProfile = async (uid) => {
    if (isDemo) {
      if (uid === 'demo-user') {
        const hasLocal = localStorage.getItem('acolher_demo_profile');
        if (hasLocal) {
          setUserProfile(JSON.parse(hasLocal));
          setOnboardingStep(3);
        } else {
          setOnboardingStep(0);
        }
      }
      setLoading(false);
      return;
    }

    try {
      const docRef = doc(db, 'artifacts', appId, 'users', uid, 'profile', 'main');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        // @ts-ignore
        setUserProfile({ ...userProfile, ...docSnap.data() });
        setOnboardingStep(3);
      } else {
        setOnboardingStep(0);
      }
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  // LOGS with LocalState merge for Offline Support
  useEffect(() => {
    if (!user) return;
    
    if (isDemo) {
      const localLogs = JSON.parse(localStorage.getItem('acolher_demo_logs') || '[]');
      setLogs(localLogs);
      return;
    }
    
    // @ts-ignore
    const q = collection(db, 'artifacts', appId, 'users', user.uid, 'logs');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // @ts-ignore
      loadedLogs.sort((a, b) => b.timestamp - a.timestamp);
      // @ts-ignore
      setLogs(loadedLogs);
    });
    return () => unsubscribe();
  }, [user]);

  // AGENDA & MERCADO
  useEffect(() => {
    if (!user || isDemo) return;
    
    // Agenda
    const qAgenda = collection(db, 'artifacts', appId, 'public', 'data', 'agenda_events');
    const unsubAgenda = onSnapshot(qAgenda, (snapshot) => {
      let events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (events.length > 0) {
        // @ts-ignore
        events.sort((a, b) => (b.highlight ? 1 : 0) - (a.highlight ? 1 : 0));
        // @ts-ignore
        setEventsAgenda(events);
      }
    });

    // Market
    const qMarket = collection(db, 'artifacts', appId, 'public', 'data', 'market_items');
    const unsubMarket = onSnapshot(qMarket, (snapshot) => {
      let items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (items.length > 0) {
        // @ts-ignore
        setMarketplaceItems(items);
      }
    });

    return () => { unsubAgenda(); unsubMarket(); };
  }, [user]);

  // IA Insight
  useEffect(() => {
    if (userProfile.childName) {
        setInsight({
          message: `Atenção: Notamos um padrão. A agitação do ${userProfile.childName} aumenta 40min após tomar a medicação da manhã.`,
          type: "alert"
        });
    }
  }, [userProfile.childName]);

  // --- DADOS ESTÁTICOS ---
  const nearbyServices = [
    { id: 4, name: "APAE Osasco", type: "ONG", dist: "1.5km", rating: 4.9, free: true, address: "R. Sanazar Mardiros, 64", phone: "(11) 3681-1000", hours: "08:00 - 17:00" },
    { id: 5, name: "Instituto Sophia", type: "ONG", dist: "3.2km", rating: 5.0, free: true, address: "R. Euclides da Cunha, 342", phone: "(11) 3682-0000", hours: "09:00 - 18:00" },
    { id: 1, name: "Parque da FITO", type: "Lazer", dist: "2.0km", rating: 4.7, free: true, address: "R. Georgina, 64", phone: "Aberto ao Público", hours: "06:00 - 18:00" },
    { id: 3, name: "Instituto Singular", type: "Saúde", dist: "1.8km", rating: 5.0, free: false, address: "Av. Hilário P. de Souza, 406", phone: "(11) 3699-9999", hours: "08:00 - 19:00" },
    { id: 6, name: "Clínica Integrar", type: "Saúde", dist: "5.5km", rating: 4.5, free: false, address: "Av. Autonomistas, 22", phone: "(11) 3699-0000", hours: "08:00 - 18:00" },
    { id: 7, name: "Parque Ecológico", type: "Lazer", dist: "8.0km", rating: 4.8, free: true, address: "Av. Dr. Kenkiti, 100", phone: "Aberto", hours: "06:00 - 19:00" },
  ];

  const suggestedMoms = [
    { id: 1, name: "Carla M.", location: "Vila Yara (2km)", matchParams: ["Síndrome de Down", "7 anos"], online: true },
    { id: 2, name: "Joana F.", location: "Online", matchParams: ["Cardiopatia", "Estimulação"], online: true }
  ];

  const doctors = [
    { id: 1, name: "Dra. Sofia Martins", role: "Neuropediatra", rating: 4.9, reviews: 124, verified: true },
    { id: 2, name: "Dr. Pedro Silva", role: "Psiquiatra Infantil", rating: 4.8, reviews: 89, verified: true }
  ];

  // --- FUNÇÕES DE NEGÓCIO ---

  const triggerReward = async (message, pts) => {
    if (!user) return;
    const newPoints = (userProfile.points || 0) + pts;
    setUserProfile(prev => ({...prev, points: newPoints}));
    setShowReward({ message, points: pts });
    setTimeout(() => setShowReward(null), 3000);
    
    if (isDemo) {
      localStorage.setItem('acolher_demo_profile', JSON.stringify({...userProfile, points: newPoints}));
      return;
    }
    
    if (isOnline) {
      try {
        // @ts-ignore
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
        await setDoc(docRef, { points: newPoints }, { merge: true });
      } catch(e) { console.log("Erro ao salvar pontos", e); }
    }
  };

  const toggleFavorite = (id) => {
    // @ts-ignore
    setFavorites(prev => {
      // @ts-ignore
      const newFavs = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem('acolher_favorites', JSON.stringify(newFavs));
      return newFavs;
    });
    triggerReward("Favoritos atualizados!", 0);
  };

  const handleCustomIconUpload = (actionKey, file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      const newIcons = { ...customIcons, [actionKey]: base64 };
      setCustomIcons(newIcons);
      localStorage.setItem('acolher_custom_icons', JSON.stringify(newIcons));
      triggerReward("Ícone personalizado salvo!", 10);
    };
    if (file) reader.readAsDataURL(file);
  };

  const handleSellProduct = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    // @ts-ignore
    const title = e.target.title.value;
    // @ts-ignore
    const price = e.target.price.value;

    const newItem = { 
      id: isDemo ? `demo-${Date.now()}` : undefined,
      title: title, 
      price: `R$ ${price}`, 
      author: userProfile.momName || "Mãe da Tribo", 
      category: "Novo", 
      sales: 0, 
      imageColor: "bg-emerald-100",
      // @ts-ignore
      authorId: user.uid,
      createdAt: Date.now()
    };

    if (isDemo) {
      // @ts-ignore
      setMarketplaceItems(prev => [newItem, ...prev]);
    } else {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'market_items'), newItem);
    }
    
    setActiveModal(null);
    triggerReward("Produto anunciado para toda a rede!", 50);
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!user) return;
    const now = new Date();
    const months = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
    
    let dateParts = now.getDate().toString();
    let monthStr = months[now.getMonth()];
    
    // @ts-ignore
    if(e.target.date.value) {
        // @ts-ignore
        const d = new Date(e.target.date.value);
        dateParts = d.getUTCDate().toString(); 
        monthStr = months[d.getUTCMonth()];
    }

    const newEvent = {
        id: isDemo ? `demo-evt-${Date.now()}` : undefined,
        month: monthStr,
        day: dateParts,
        // @ts-ignore
        title: e.target.title.value,
        // @ts-ignore
        loc: e.target.location.value,
        dist: "Sugerido por você",
        // @ts-ignore
        desc: e.target.desc.value,
        createdBy: userProfile.momName,
        // @ts-ignore
        authorId: user.uid,
        createdAt: Date.now()
    };
    
    if (isDemo) {
      // @ts-ignore
      setEventsAgenda(prev => [newEvent, ...prev]);
    } else {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'agenda_events'), newEvent);
    }

    setActiveModal(null);
    triggerReward("Evento sugerido para a comunidade!", 30);
  };

  const saveLog = async (label, type, note) => {
    if (!user) return;
    const newLog = { 
      id: isDemo ? `log-${Date.now()}` : undefined,
      action: label, 
      type: type, 
      note: note,
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
      date: new Date().toLocaleDateString(),
      mood: type === 'mom_journal' ? journalMood : null,
      timestamp: Date.now()
    };

    const saveOffline = () => {
      const pending = JSON.parse(localStorage.getItem('acolher_pending_logs') || '[]');
      pending.push(newLog);
      localStorage.setItem('acolher_pending_logs', JSON.stringify(pending));
      setPendingSyncCount(prev => prev + 1);
      // @ts-ignore
      setLogs(prev => [newLog, ...prev]); // Optimistic Update
    };

    if (isDemo) {
      // @ts-ignore
      const updatedLogs = [newLog, ...logs];
      setLogs(updatedLogs);
      localStorage.setItem('acolher_demo_logs', JSON.stringify(updatedLogs));
      if(type === 'mom_journal') triggerReward("Desabafo guardado. 💜", 20);
      else triggerReward(`${label} registrado!`, 15);
    } else if (!isOnline) {
      saveOffline();
      if(type === 'mom_journal') triggerReward("Desabafo guardado (Offline).", 20);
      else triggerReward(`${label} registrado offline!`, 15);
    } else {
      // ONLINE MODE
      try {
        // @ts-ignore
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'logs'), newLog);
        if(type === 'mom_journal') triggerReward("Desabafo guardado. 💜", 20);
        else triggerReward(`${label} registrado!`, 15);
      } catch (error) {
        console.warn("Save failed, queueing offline:", error);
        saveOffline();
        triggerReward(`${label} salvo localmente (rede instável).`, 15);
      }
    }
    
    setActiveModal(null);
    setQuickInput(""); setNoteInput("");
  };

  const handleInitialSetup = async (e) => {
    e.preventDefault();
    if (!user) return;
    const newData = {
      // @ts-ignore
      momName: e.target.name.value,
      // @ts-ignore
      childName: e.target.child.value,
      points: 50,
      level: "Mãe Iniciante",
      badges: ["Boas Vindas"],
      streak: 1,
      createdAt: Date.now()
    };

    if (isDemo) {
      localStorage.setItem('acolher_demo_profile', JSON.stringify(newData));
      setUserProfile(prev => ({ ...prev, ...newData }));
    } else {
      // @ts-ignore
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
      await setDoc(docRef, newData);
      setUserProfile(prev => ({ ...prev, ...newData }));
    }
    
    setOnboardingStep(3); 
    triggerReward("Conta criada com sucesso!", 50);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user) return;
    const newData = {
      // @ts-ignore
      momName: e.target.name.value,
      // @ts-ignore
      childName: e.target.childName.value,
      // @ts-ignore
      cep: e.target.cep.value
    };

    if (isDemo) {
      const merged = { ...userProfile, ...newData };
      localStorage.setItem('acolher_demo_profile', JSON.stringify(merged));
      setUserProfile(merged);
    } else {
      // @ts-ignore
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
      await setDoc(docRef, newData, { merge: true });
      // @ts-ignore
      setUserProfile(prev => ({ ...prev, ...newData }));
    }
    
    triggerReward("Perfil atualizado!", 10);
  };

  const handleCaptureImage = async (base64Image) => {
    if (cameraContext === 'profile') {
        const newData = { photoUrl: base64Image };
        if (isDemo) {
          const merged = { ...userProfile, ...newData };
          localStorage.setItem('acolher_demo_profile', JSON.stringify(merged));
          setUserProfile(merged);
        } else {
          // @ts-ignore
          const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
          await setDoc(docRef, newData, { merge: true });
          setUserProfile(prev => ({ ...prev, ...newData }));
        }
        triggerReward("Foto de perfil atualizada!", 20);
    } else if (cameraContext === 'chat') {
        // @ts-ignore
        setChatMessages(prev => [...prev, { from: 'me', image: base64Image }]);
        triggerReward("Foto enviada!", 5);
    }

    setActiveModal(null);
  };

  const getAiJournalPrompt = (mood) => {
    const prompts = {
      good: ["Que pequena vitória te fez sorrir hoje?", "Qual foi o melhor momento com seu filho hoje?", "Pelo que você é grata agora?"],
      neutral: ["Como você cuidou de si mesma hoje?", "Descreva o momento mais calmo do seu dia.", "O que você gostaria de fazer diferente amanhã?"],
      tired: ["O que drenou sua energia hoje?", "Como você pode descansar por 5 minutos agora?", "Você pediu ajuda hoje? Se não, por que?"],
      bad: ["Qual foi o gatilho mais difícil hoje?", "Escreva uma carta de compaixão para você mesma.", "O que você precisa ouvir agora para se sentir melhor?"]
    };
    // @ts-ignore
    const options = prompts[mood] || prompts['neutral'];
    return options[Math.floor(Math.random() * options.length)];
  };

  // --- INTERFACE UI ---

  const RewardToast = () => (
    showReward ? (
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl z-[70] flex items-center gap-3 animate-bounce">
        <Heart className="text-rose-500 fill-rose-500" size={24} />
        <div><p className="font-bold text-sm text-yellow-400">+{showReward.points} pts</p><p className="text-xs">{showReward.message}</p></div>
      </div>
    ) : null
  );

  const OfflineIndicator = () => (
    (!isOnline || pendingSyncCount > 0) ? (
      <div className={`fixed top-0 left-0 w-full z-[80] text-[10px] font-bold text-center py-1 flex items-center justify-center gap-2 ${isOnline ? 'bg-orange-100 text-orange-700' : 'bg-slate-800 text-slate-300'}`}>
        {isOnline ? (
           <><RefreshCw size={10} className="animate-spin"/> Sincronizando {pendingSyncCount} itens...</>
        ) : (
           <><WifiOff size={10} /> Você está offline. Dados salvos localmente.</>
        )}
      </div>
    ) : null
  );

  if (loading) return <div className="h-screen flex items-center justify-center bg-indigo-600 text-white"><Heart className="animate-ping" size={48} /></div>;

  // --- FLUXO DE ONBOARDING ---
  if (onboardingStep < 3) {
    return (
      <div className="h-screen bg-indigo-600 text-white flex flex-col font-sans max-w-md mx-auto shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-10 -mb-10 blur-3xl"></div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center z-10">
          {onboardingStep === 0 && (
            <div className="animate-in fade-in zoom-in duration-700 flex flex-col items-center w-full">
              <Heart size={80} className="animate-pulse mb-6 text-rose-300 fill-rose-300" />
              <h1 className="text-4xl font-bold mb-2 tracking-tight">Acolher</h1>
              <p className="text-indigo-200 text-lg font-medium mb-12">Cuidando de quem cuida.</p>
              <div className="w-full space-y-4">
                <button onClick={() => setOnboardingStep(1)} className="w-full bg-white text-indigo-600 px-8 py-4 rounded-2xl font-bold shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2">Começar (Criar Conta) <ArrowRight size={20}/></button>
                <button onClick={() => setOnboardingStep(2)} className="w-full bg-indigo-800/50 text-white border border-indigo-400 px-8 py-4 rounded-2xl font-bold hover:bg-indigo-800 transition-colors">Já tenho conta</button>
              </div>
            </div>
          )}
          {onboardingStep === 1 && (
            <div className="animate-in slide-in-from-right duration-500 flex flex-col items-center">
              <div className="bg-white/20 p-4 rounded-full mb-6"><Shield size={48} className="text-white"/></div>
              <h2 className="text-2xl font-bold mb-4">Sua Memória Externa</h2>
              <p className="text-indigo-100 leading-relaxed mb-8">Nunca mais esqueça um detalhe para o médico. Registre crises, medicações e conquistas em segundos.</p>
              <button onClick={() => setOnboardingStep(2)} className="bg-white text-indigo-600 px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform">Próximo</button>
            </div>
          )}
          {onboardingStep === 2 && (
            <div className="animate-in slide-in-from-right duration-500 w-full">
              <h2 className="text-2xl font-bold mb-2">Criar Perfil</h2>
              <p className="text-indigo-200 text-sm mb-8">Seus dados ficarão salvos na nuvem.</p>
              <form onSubmit={handleInitialSetup} className="space-y-4 text-left">
                <div><label className="text-xs font-bold text-indigo-200 uppercase ml-1">Seu Nome</label><input name="name" required className="w-full bg-white/10 border border-indigo-400 rounded-xl p-3 text-white placeholder:text-indigo-300 outline-none focus:border-white focus:bg-white/20 transition-colors" placeholder="Como quer ser chamada?" /></div>
                <div><label className="text-xs font-bold text-indigo-200 uppercase ml-1">Nome da Criança</label><input name="child" className="w-full bg-white/10 border border-indigo-400 rounded-xl p-3 text-white placeholder:text-indigo-300 outline-none focus:border-white focus:bg-white/20 transition-colors" placeholder="Quem vamos acolher?" /></div>
                <button type="submit" className="w-full bg-white text-indigo-600 font-bold py-4 rounded-xl shadow-lg hover:bg-indigo-50 transition-colors mt-4 flex justify-center items-center gap-2">Salvar Cadastro <Check size={20}/></button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- MODAIS ---
  
  const CameraModal = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);

    useEffect(() => {
      let currentStream = null;
      const startCamera = async () => {
        try {
          const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
          currentStream = s;
          setStream(s);
          if (videoRef.current) {
             // @ts-ignore
             videoRef.current.srcObject = s;
          }
        } catch (e) {
          console.error("Camera access denied", e);
          triggerReward("Erro: Permissão de câmera negada.", 0);
          setActiveModal(null);
        }
      };
      startCamera();
      return () => {
        // @ts-ignore
        if(currentStream) currentStream.getTracks().forEach(track => track.stop());
      };
    }, []);

    const takePhoto = () => {
       const video = videoRef.current;
       const canvas = canvasRef.current;
       if(video && canvas) {
         // @ts-ignore
         const context = canvas.getContext('2d');
         // Set canvas size small for thumbnail
         // @ts-ignore
         canvas.width = 150; 
         // @ts-ignore
         canvas.height = 150;
         // Draw cropped center
         // @ts-ignore
         const size = Math.min(video.videoWidth, video.videoHeight);
         // @ts-ignore
         const startX = (video.videoWidth - size) / 2;
         // @ts-ignore
         const startY = (video.videoHeight - size) / 2;
         // @ts-ignore
         context.drawImage(video, startX, startY, size, size, 0, 0, 150, 150);
         // @ts-ignore
         const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
         handleCaptureImage(dataUrl);
       }
    };

    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-in fade-in">
         <div className="w-full max-w-md relative bg-black h-full flex flex-col">
            <video ref={videoRef} autoPlay playsInline muted className="flex-1 object-cover w-full opacity-90"></video>
            <canvas ref={canvasRef} className="hidden"></canvas>
            
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white"><X /></button>
            <div className="absolute top-1/2 left-1/2 -ml-20 -mt-20 w-40 h-40 border-2 border-white/30 rounded-full pointer-events-none"></div>

            <div className="bg-black/80 p-6 flex justify-center pb-12">
               <button onClick={takePhoto} className="w-20 h-20 bg-white rounded-full border-8 border-slate-300 hover:scale-105 transition-transform"></button>
            </div>
         </div>
      </div>
    );
  };

  const AddEventModal = () => (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-4 animate-in slide-in-from-bottom-10">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-xl text-slate-800">Sugerir Evento</h3><button onClick={() => setActiveModal(null)} className="p-1 bg-slate-100 rounded-full"><X size={20}/></button></div>
        <form onSubmit={handleAddEvent} className="space-y-4">
          <div><label className="text-xs font-bold text-slate-500">Nome do Evento</label><input name="title" required placeholder="Ex: Piquenique Inclusivo" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:border-indigo-500" /></div>
          <div className="grid grid-cols-2 gap-4">
             <div><label className="text-xs font-bold text-slate-500">Data</label><input name="date" type="date" required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:border-indigo-500" /></div>
             <div><label className="text-xs font-bold text-slate-500">Local</label><input name="location" required placeholder="Ex: Parque..." className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:border-indigo-500" /></div>
          </div>
          <div><label className="text-xs font-bold text-slate-500">Descrição</label><textarea name="desc" rows="3" placeholder="Detalhes..." className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:border-indigo-500" /></div>
          <div className="bg-indigo-50 p-3 rounded-lg text-xs text-indigo-700"><p>✨ Sua sugestão será visível para todas as mães da rede.</p></div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700">Enviar Sugestão</button>
        </form>
      </div>
    </div>
  );

  const LogModal = () => (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl slide-in-from-bottom-10">
        <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">{selectedAction?.icon && <selectedAction.icon className="text-indigo-600"/>} Registrar {selectedAction?.label}</h3><button onClick={() => setActiveModal(null)} className="p-1 bg-slate-100 rounded-full"><X size={20}/></button></div>
        <div className="space-y-4">
          <div><label className="text-xs font-bold text-slate-500 uppercase">Horário</label><div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 mt-1"><Clock size={18} className="text-slate-400"/><span className="font-mono text-sm font-bold text-slate-700">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div></div>
          <div><label className="text-xs font-bold text-slate-500 uppercase">Observações</label><textarea autoFocus rows="3" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 mt-1 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Detalhes..." value={noteInput} onChange={(e) => setNoteInput(e.target.value)} /></div>
          <button onClick={() => saveLog(selectedAction.label, selectedAction.type, noteInput)} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"><CheckCircle size={18} /> Confirmar {(!isOnline) && "(Offline)"}</button>
        </div>
      </div>
    </div>
  );

  const ReportModal = () => (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-md h-[80vh] rounded-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50"><h3 className="font-bold text-lg flex items-center gap-2"><FileTextIcon /> Relatório Médico</h3><button onClick={() => setActiveModal(null)}><X /></button></div>
        <div className="flex-1 p-6 overflow-y-auto font-mono text-sm">
          <div className="text-center mb-6"><h2 className="text-2xl font-bold uppercase text-slate-800">Relatório de Evolução</h2><p className="text-slate-500">Paciente: {userProfile.childName}</p></div>
          {insight && <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg"><h4 className="font-bold text-red-600 mb-2 flex items-center gap-2"><AlertTriangle size={16}/> Alerta de Padrão (IA)</h4><p className="text-xs">{insight.message}</p></div>}
          <h4 className="font-bold border-b mb-2 mt-4">Histórico (Nuvem)</h4>
          {logs.length === 0 ? <p className="text-slate-400 italic">Nenhum registro ainda.</p> : 
            logs.filter(l => l.type !== 'mom_journal').map(log => (<div key={log.id} className="py-2 border-b border-dashed"><div className="flex justify-between"><span className="font-bold">{log.action}</span><span className="text-slate-500 text-xs">{log.time}</span></div>{log.note && <p className="text-xs text-slate-600 mt-1 italic">"{log.note}"</p>}</div>))
          }
        </div>
        <div className="p-4 border-t bg-slate-50"><button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2" onClick={() => {triggerReward("PDF Enviado!", 10); setActiveModal(null);}}><Printer size={18} /> Imprimir / Salvar PDF</button></div>
      </div>
    </div>
  );

  const SellModal = () => (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4 animate-in slide-in-from-bottom-10">
      <div className="bg-white w-full max-w-md rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-xl text-slate-800">Anunciar Produto</h3><button onClick={() => setActiveModal(null)}><X /></button></div>
        <form onSubmit={handleSellProduct} className="space-y-4">
          <input name="title" required placeholder="Título do Produto" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:border-indigo-500" />
          <input name="price" type="number" required placeholder="Preço (R$)" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:border-indigo-500" />
          <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold">Publicar na Rede</button>
        </form>
      </div>
    </div>
  );

  const SOSModal = () => (
    <div className="fixed inset-0 z-[80] bg-rose-600 text-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
      <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 animate-pulse"><Phone size={48} /></div>
      <h2 className="text-3xl font-bold mb-2">SOS Acolher</h2>
      <p className="text-xl font-medium mb-8">Conectando com Psicóloga...</p>
      <button onClick={() => setActiveModal(null)} className="bg-white text-rose-600 px-8 py-3 rounded-full font-bold">Cancelar</button>
    </div>
  );

  const ChatModal = () => {
    const [msg, setMsg] = useState("");
    const [msgs, setMsgs] = useState([
      {from: 'them', text: `Olá! Vi que o ${userProfile.childName} tem a mesma idade do meu.`},
      ...chatMessages // merge global demo state
    ]);
    
    const send = () => { 
        if(!msg) return; 
        const newMsg = {from: 'me', text: msg};
        setMsgs([...msgs, newMsg]); 
        setMsg(""); 
    };

    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-right">
        <div className="p-4 bg-indigo-600 text-white flex items-center gap-3 shadow-md"><button onClick={() => {setActiveModal(null); setChatUser(null);}}><ChevronLeft /></button><div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold">{chatUser?.name.charAt(0)}</div><h3 className="font-bold text-sm">{chatUser?.name}</h3></div>
        <div className="flex-1 bg-slate-50 p-4 space-y-4 overflow-y-auto">
            {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.from === 'me' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200'}`}>
                        {m.image ? <img src={m.image} alt="Chat attachment" className="rounded-lg mb-2 max-w-full" /> : null}
                        {m.text}
                    </div>
                </div>
            ))}
        </div>
        <div className="p-3 border-t bg-white flex gap-2 items-center">
            <button onClick={() => { setCameraContext('chat'); setActiveModal('camera'); }} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:text-indigo-600"><Camera size={20}/></button>
            <input value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Digite..." className="flex-1 bg-slate-100 rounded-full px-4 py-2 outline-none" />
            <button onClick={send} className="bg-indigo-600 text-white p-2 rounded-full"><Send size={18}/></button>
        </div>
      </div>
    );
  };

  const SettingsModal = () => (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl h-[70vh] flex flex-col">
        <div className="flex justify-between items-center mb-4"><div><h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Settings className="text-slate-500"/> Personalizar Rotina</h3><p className="text-xs text-slate-500">Rotina da <b>{timeOfDay === 'morning' ? 'Manhã' : timeOfDay === 'afternoon' ? 'Tarde' : 'Noite'}</b></p></div><button onClick={() => setActiveModal(null)} className="p-1 bg-slate-100 rounded-full"><X size={20}/></button></div>
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {Object.keys(ACTION_LIBRARY).map(key => {
            // @ts-ignore
            const item = ACTION_LIBRARY[key];
            // @ts-ignore
            const isActive = userRoutine[timeOfDay]?.includes(key);
            const toggle = () => {
               setUserRoutine(prev => {
                 // @ts-ignore
                  const list = prev[timeOfDay] || [];
                  return { ...prev, [timeOfDay]: list.includes(key) ? list.filter(k => k !== key) : [...list, key] };
               });
            };
            return (
              <div key={key} className={`p-3 rounded-xl border flex items-center justify-between transition-all ${isActive ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                  <div className="flex items-center gap-3 cursor-pointer" onClick={toggle}>
                      <div className={`p-2 rounded-full ${isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}><item.icon size={20} /></div>
                      <span className={`text-sm font-bold ${isActive ? 'text-indigo-900' : 'text-slate-500'}`}>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                      {key === 'meds' && isActive && (
                          <div className="relative">
                              <input type="file" id="icon-upload" className="hidden" accept="image/*" onChange={(e) => handleCustomIconUpload('meds', e.target.files[0])} />
                              <label htmlFor="icon-upload" className="p-1.5 bg-slate-200 rounded-full text-slate-600 hover:bg-indigo-200 hover:text-indigo-600 cursor-pointer block"><Upload size={14}/></label>
                          </div>
                      )}
                      {isActive && <CheckCircle size={18} className="text-indigo-600" onClick={toggle} />}
                  </div>
              </div>
            );
          })}
        </div>
        <button onClick={() => setActiveModal(null)} className="w-full mt-4 bg-indigo-600 text-white py-3 rounded-xl font-bold">Concluir</button>
      </div>
    </div>
  );

  const JournalModal = () => (
    <div className="fixed inset-0 z-[60] bg-indigo-900/50 flex items-end sm:items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl slide-in-from-bottom-10 border-t-4 border-purple-500">
        <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg text-purple-700 flex items-center gap-2"><BookHeart className="text-purple-500"/> Diário da Mãe</h3><button onClick={() => setActiveModal(null)} className="p-1 bg-slate-100 rounded-full"><X size={20}/></button></div>
        <div className="flex justify-between mb-4 bg-slate-50 p-3 rounded-xl">{['good','neutral','tired','bad'].map(m => (<button key={m} onClick={() => setJournalMood(m)} className={`flex flex-col items-center gap-1 ${journalMood === m ? 'opacity-100 scale-110' : 'opacity-40'}`}><div className={`w-10 h-10 rounded-full flex items-center justify-center ${m==='good'?'bg-green-100 text-green-600':m==='neutral'?'bg-yellow-100 text-yellow-600':m==='tired'?'bg-blue-100 text-blue-600':'bg-red-100 text-red-600'}`}>{m==='good'?<Smile size={24}/>:m==='neutral'?<Sun size={24}/>:m==='tired'?<Moon size={24}/>:<CloudRain size={24}/>}</div></button>))}</div>
        
        {/* AI Prompt Section */}
        <div className="mb-4 bg-purple-50 p-3 rounded-xl border border-purple-100 animate-in fade-in">
            <p className="text-xs font-bold text-purple-600 mb-1 flex items-center gap-1"><Sparkles size={12}/> Sugestão para hoje:</p>
            <p className="text-sm text-purple-800 italic">"{getAiJournalPrompt(journalMood)}"</p>
        </div>

        <textarea autoFocus rows="4" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 text-slate-700" placeholder="Desabafe aqui... (Privado)" value={noteInput} onChange={(e) => setNoteInput(e.target.value)} />
        <button onClick={() => saveLog("Diário da Mãe", "mom_journal", noteInput)} className="w-full mt-4 bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors">Guardar {(!isOnline) && "(Offline)"}</button>
      </div>
    </div>
  );

  const AboutModal = () => (
    <div className="fixed inset-0 z-[60] bg-indigo-900/90 flex items-center justify-center p-6 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={20}/></button>
        <div className="text-center mb-6"><Heart size={48} className="text-rose-500 fill-rose-500 mx-auto mb-3" /><h2 className="text-2xl font-bold text-indigo-900">Sobre o Acolher</h2><p className="text-sm text-slate-500">Cuidando de quem cuida.</p></div>
        <div className="space-y-6 text-sm leading-relaxed text-slate-700 h-64 overflow-y-auto pr-2">
          <div><h3 className="font-bold text-indigo-600 uppercase text-xs mb-1">Nossa Missão</h3><p>Desonerar a carga mental da maternidade atípica através da tecnologia.</p></div>
          <div><h3 className="font-bold text-indigo-600 uppercase text-xs mb-1">Nossa Visão</h3><p>Ser a plataforma global de referência para famílias neurodivergentes até 2026.</p></div>
          <div><h3 className="font-bold text-indigo-600 uppercase text-xs mb-1">Nossos Valores</h3><ul className="list-disc ml-4 space-y-1"><li>A Mãe no Centro</li><li>Dados com Coração</li><li>Independência Financeira</li><li>Acessibilidade Radical</li></ul></div>
        </div>
        <div className="mt-6 pt-4 border-t border-slate-100 text-center"><p className="text-xs text-slate-400">Versão 13.0 - {isDemo ? 'Modo Demo' : 'Conectada ao Firebase 🔥'}</p></div>
      </div>
    </div>
  );

  const LocationModal = () => (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl slide-in-from-bottom-10">
        <div className="flex justify-between items-start mb-4">
          <div><span className={`text-[10px] font-bold px-2 py-1 rounded mb-2 inline-block ${selectedLocation?.free ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{selectedLocation?.type}</span><h3 className="font-bold text-xl text-slate-800 leading-tight">{selectedLocation?.name}</h3></div><button onClick={() => setActiveModal(null)} className="p-1 bg-slate-100 rounded-full"><X size={20}/></button>
        </div>
        <div className="space-y-4 text-sm text-slate-600">
          <p className="flex items-center gap-2"><MapPin size={16} className="text-indigo-500"/> {selectedLocation?.address}</p>
          <p className="flex items-center gap-2"><Phone size={16} className="text-indigo-500"/> {selectedLocation?.phone}</p>
          <p className="flex items-center gap-2"><Clock size={16} className="text-indigo-500"/> {selectedLocation?.hours}</p>
          <div className="flex items-center gap-1 mt-2 text-yellow-500 font-bold"><Star size={16} fill="currentColor"/> {selectedLocation?.rating} (Avaliado por mães)</div>
        </div>
        <button onClick={() => {triggerReward("Rota iniciada!", 10); setActiveModal(null);}} className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700"><Navigation size={18} /> Traçar Rota (GPS)</button>
      </div>
    </div>
  );

  const EventModal = () => (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl slide-in-from-bottom-10">
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-3"><div className="bg-indigo-100 p-3 rounded-xl text-center min-w-[60px] h-min"><span className="block text-xs font-bold text-indigo-400">{selectedEvent?.month}</span><span className="block text-2xl font-bold text-indigo-800">{selectedEvent?.day}</span></div><div><h3 className="font-bold text-lg text-slate-800 leading-tight">{selectedEvent?.title}</h3><p className="text-xs text-slate-500 mt-1">{selectedEvent?.loc}</p></div></div><button onClick={() => setActiveModal(null)} className="p-1 bg-slate-100 rounded-full"><X size={20}/></button>
        </div>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">{selectedEvent?.desc}</p>
        <button 
            onClick={() => {
                if ('Notification' in window) {
                    Notification.requestPermission().then((permission) => {
                      if (permission === 'granted') {
                         triggerReward("Notificações ativadas para este evento!", 20); 
                      } else {
                         triggerReward("Permissão de notificação necessária.", 0);
                      }
                    });
                } else {
                   triggerReward("Notificações ativadas (Simulado)", 20);
                }
                setActiveModal(null);
            }} 
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700"
        >
            <Bell size={18} /> Avise-me (Push)
        </button>
      </div>
    </div>
  );

  // --- SUB-TELAS PRINCIPAIS ---

  const SmartHome = () => {
    const getHeaderStyle = () => {
      if(timeOfDay === 'morning') return 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white';
      if(timeOfDay === 'afternoon') return 'bg-gradient-to-br from-orange-400 to-rose-500 text-white';
      return 'bg-slate-900 text-white'; 
    };

    return (
      <div className="space-y-6 pb-20 animate-in fade-in duration-700">
        {/* Header */}
        <div className={`p-6 rounded-b-[40px] shadow-lg transition-colors duration-500 relative overflow-hidden ${getHeaderStyle()}`}>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center font-bold text-xl uppercase overflow-hidden">
                {userProfile.photoUrl ? <img src={userProfile.photoUrl} alt="Perfil" className="w-full h-full object-cover"/> : (userProfile.momName ? userProfile.momName.charAt(0) : "M")}
              </div>
              <div><p className="text-xs opacity-80">Olá, {userProfile.momName}</p><h1 className="text-xl font-bold">Vamos cuidar?</h1></div></div>
            <div className="bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1"><Coins className="text-yellow-400 fill-yellow-400" size={14} /><span className="text-xs font-bold">{userProfile.points}</span></div>
          </div>
          
          <div className="relative z-10 bg-black/20 p-1 rounded-full w-max mx-auto backdrop-blur-md flex gap-1 mt-2 mb-4">
             <button onClick={()=>setTimeOfDay('morning')} className={`px-4 py-1.5 rounded-full text-xs transition-all ${timeOfDay==='morning' ? 'bg-white text-indigo-600 font-bold shadow-sm' : 'text-white/80 hover:bg-white/10'}`}>Manhã</button>
             <button onClick={()=>setTimeOfDay('afternoon')} className={`px-4 py-1.5 rounded-full text-xs transition-all ${timeOfDay==='afternoon' ? 'bg-white text-orange-600 font-bold shadow-sm' : 'text-white/80 hover:bg-white/10'}`}>Tarde</button>
             <button onClick={()=>setTimeOfDay('night')} className={`px-4 py-1.5 rounded-full text-xs transition-all ${timeOfDay==='night' ? 'bg-white text-indigo-600 font-bold shadow-sm' : 'text-white/80 hover:bg-white/10'}`}>Noite</button>
          </div>

          <div className="relative z-10 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10"><p className="text-sm font-medium flex items-center gap-2"><Sparkles size={16} className="text-yellow-300" /> Dica:</p><p className="text-xs opacity-90 mt-1">"Mantenha a rotina visual sempre à vista do {userProfile.childName}."</p></div>
        </div>

        <div className="px-5 -mt-2 space-y-6">
          {insight && (
            <div className="bg-white p-4 rounded-2xl shadow-lg border-l-4 border-l-red-500 border-y border-r border-slate-100 flex gap-3 items-start animate-pulse cursor-pointer" onClick={() => setActiveModal('report')}>
              <div className="bg-red-100 p-2 rounded-full text-red-600 shrink-0"><AlertTriangle size={20} /></div>
              <div><h3 className="text-xs font-bold text-red-600 uppercase tracking-wide">Padrão Detectado</h3><p className="text-sm text-slate-700 leading-relaxed mt-1">{insight.message}</p><p className="text-xs text-indigo-600 font-bold mt-2">Ver relatório</p></div>
            </div>
          )}
          <div className="bg-white p-1 rounded-2xl shadow-md border border-slate-100" onClick={() => setActiveModal('journal')}>
             <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl flex justify-between items-center group cursor-pointer hover:shadow-sm transition-all">
                <div><h3 className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-1 flex items-center gap-1"><BookHeart size={14}/> Diário Emocional</h3><p className="text-sm font-bold text-slate-800">Como você está se sentindo?</p></div>
                <div className="bg-white p-2 rounded-full text-purple-400 group-hover:text-purple-600"><PlusCircle size={24} /></div>
             </div>
          </div>
          
          <div>
            <div className="flex justify-between items-end mb-3 ml-1">
               <h3 className="font-bold text-slate-700 flex items-center gap-2"><Zap size={16} className="text-indigo-500" /> Ações para {timeOfDay === 'morning' ? 'a Manhã' : timeOfDay === 'afternoon' ? 'a Tarde' : 'a Noite'}</h3>
               <button onClick={() => setActiveModal('settings')} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 flex items-center gap-1"><Settings size={12}/> Personalizar</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(userRoutine[timeOfDay] || []).map((actionKey, i) => {
                // @ts-ignore
                const action = ACTION_LIBRARY[actionKey];
                if(!action) return null;
                // @ts-ignore
                const customIcon = customIcons[actionKey];

                return (
                  <button key={i} onClick={() => {setSelectedAction({...action, type: actionKey}); setNoteInput(""); setActiveModal('log');}} className={`${action.color} border p-4 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-sm active:scale-95 bg-opacity-50 hover:bg-opacity-100 transition-all`}>
                    <div className="bg-white p-2 rounded-full shadow-sm overflow-hidden w-10 h-10 flex items-center justify-center">
                        {customIcon ? <img src={customIcon} className="w-full h-full object-cover" alt="icon"/> : <action.icon size={24} />}
                    </div>
                    <span className="font-bold text-sm text-slate-700">{action.label}</span>
                  </button>
                );
              })}
              {(!userRoutine[timeOfDay] || userRoutine[timeOfDay].length === 0) && (
                <div className="col-span-2 text-center p-4 text-sm text-slate-400 italic border border-dashed border-slate-300 rounded-2xl">Nenhuma ação configurada. Clique em personalizar.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CommunityHub = () => (
    <div className="px-4 pt-12 pb-24 space-y-6 bg-slate-50 min-h-screen animate-in fade-in">
      <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Users className="text-indigo-600" /> Minha Tribo</h2>
      <div className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group cursor-pointer" onClick={() => setActiveModal('sos')}>
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4"><Heart size={120} /></div>
        <div className="relative z-10"><div className="flex items-center gap-2 mb-2"><Zap className="text-yellow-300 fill-current animate-pulse" size={20} /><h2 className="font-bold text-lg">SOS Mãe Exausta</h2></div><p className="text-white/90 text-sm mb-4">No limite? Fala agora com uma "Mãe Madrinha".</p><button className="bg-white text-rose-600 px-6 py-3 rounded-full text-sm font-bold shadow-sm w-full">Pedir Ajuda Agora</button></div>
      </div>
      {suggestedMoms.map(mom => (
        <div key={mom.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 mb-3">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">{mom.name.charAt(0)}</div>
          <div className="flex-1"><h4 className="font-bold text-sm">{mom.name}</h4><p className="text-xs text-slate-500">{mom.matchParams.join(" • ")}</p></div>
          <button onClick={() => {setChatUser(mom); setActiveModal('chat');}} className="text-indigo-600 bg-indigo-50 p-2 rounded-full"><MessageCircle size={20} /></button>
        </div>
      ))}
    </div>
  );

  const MarketHub = () => {
    // @ts-ignore
    const displayedItems = showFavsOnly ? marketplaceItems.filter(i => favorites.includes(i.id)) : marketplaceItems;

    return (
     <div className="flex flex-col h-screen bg-slate-50 pb-20 animate-in fade-in">
       <div className="bg-white px-6 pt-12 pb-6 shadow-sm z-10 sticky top-0">
           <div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><ShoppingBag className="text-emerald-600" /> Mercado</h2><button onClick={() => setActiveModal('sell')} className="bg-indigo-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow hover:bg-indigo-700">+ Vender</button></div>
           <div className="flex items-center gap-2">
               <button onClick={() => setShowFavsOnly(!showFavsOnly)} className={`text-xs px-3 py-1.5 rounded-full font-bold border transition-colors ${showFavsOnly ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                   {showFavsOnly ? '❤️ Mostrando Favoritos' : '🤍 Ver Favoritos'}
               </button>
           </div>
       </div>
       <div className="p-4 space-y-6 overflow-y-auto">
          <div><h3 className="font-bold text-slate-700 mb-3">Destaques</h3>
          {displayedItems.length === 0 && showFavsOnly && <p className="text-sm text-slate-400 italic">Você ainda não favoritou nenhum item.</p>}
          {displayedItems.map(item => (
              <div key={item.id} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex gap-4 items-center mb-3 relative">
                <button onClick={() => toggleFavorite(item.id)} className="absolute top-2 right-2 text-slate-300 hover:text-rose-500 hover:scale-110 transition-all">
                    {/* @ts-ignore */}
                    <Heart size={18} className={favorites.includes(item.id) ? "fill-rose-500 text-rose-500" : ""} />
                </button>
                {/* @ts-ignore */}
                <div className={`w-16 h-16 ${item.imageColor || 'bg-slate-100'} rounded-xl flex items-center justify-center text-slate-400`}><ShoppingBag size={24} /></div>
                {/* @ts-ignore */}
                <div className="flex-1"><h4 className="font-bold text-slate-800">{item.title}</h4><p className="text-xs text-slate-500 mb-1">por {item.author}</p><span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{item.price}</span></div>
                <button className="bg-slate-900 text-white p-2 rounded-lg" onClick={() => triggerReward("Adicionado ao carrinho!", 5)}><ShoppingBag size={16} /></button>
              </div>
            ))}</div>
          
          <div>
            <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Stethoscope size={16} className="text-rose-500"/> Médicos Verificados</h3>
            {doctors.map(doc => (
               <div key={doc.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm mb-3">
                 <div className="flex justify-between">
                    <div><h4 className="font-bold text-slate-800 text-sm flex items-center gap-1">{doc.name} <CheckCircle size={12} className="text-blue-500"/></h4><p className="text-xs text-slate-500">{doc.role}</p></div>
                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded h-min"><Star size={10} className="fill-yellow-400 text-yellow-400" /><span className="text-xs font-bold">{doc.rating}</span></div>
                 </div>
                 <button className="w-full mt-3 bg-slate-50 text-slate-700 font-bold text-xs py-2 rounded-lg">Ver Agenda</button>
               </div>
            ))}
          </div>
       </div>
     </div>
    );
  };

  const ExploreMap = () => {
    // Helper to parse distance strings (e.g., "1.5km")
    const parseDist = (str) => {
      const match = str.match(/([\d.]+)km/);
      return match ? parseFloat(match[1]) : 999;
    };

    const filteredServices = nearbyServices.filter(s => {
      // Type Filter
      const typeMatch = mapFilter === 'all' ? true : 
                        mapFilter === 'ong' ? s.type === 'ONG' : 
                        mapFilter === 'health' ? s.type === 'Saúde' : 
                        mapFilter === 'leisure' ? s.type === 'Lazer' : true;
      // Free Filter
      const freeMatch = mapFreeOnly ? s.free === true : true;
      
      // Distance Filter
      const distMatch = parseDist(s.dist) <= mapMaxDist;

      return typeMatch && freeMatch && distMatch;
    });

    // @ts-ignore
    const filteredEvents = showFavsOnly ? eventsAgenda.filter(e => favorites.includes(e.id)) : eventsAgenda;

    return (
      <div className="flex flex-col h-screen pb-20 bg-slate-50 animate-in fade-in">
         <div className="bg-slate-200 h-2/3 relative w-full flex items-center justify-center text-slate-400">
           <Map size={64} className="opacity-20" />
           <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/90"></div>
           <div className="absolute top-1/3 left-1/2 -ml-4 -mt-8 flex flex-col items-center cursor-pointer" onClick={() => triggerReward("Local encontrado!", 10)}><MapPin size={32} className="text-indigo-600 animate-bounce" fill="currentColor" /></div>
        </div>
        <div className="bg-white rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] -mt-10 relative z-10 flex-1 p-6 overflow-y-auto">
          <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6"></div>
          
          {/* Advanced Filters Section */}
          <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
             <h3 className="font-bold text-slate-700 text-xs mb-3 flex items-center gap-2"><Sliders size={12}/> Filtros de Busca</h3>
             
             {/* Type Tabs */}
             <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
               <button onClick={() => setMapFilter('all')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap ${mapFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>Tudo</button>
               <button onClick={() => setMapFilter('ong')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap flex items-center gap-1 ${mapFilter === 'ong' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-indigo-600'}`}><HeartHandshake size={10}/> ONGs</button>
               <button onClick={() => setMapFilter('health')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap ${mapFilter === 'health' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>Saúde</button>
               <button onClick={() => setMapFilter('leisure')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap flex items-center gap-1 ${mapFilter === 'leisure' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-indigo-600'}`}><Palmtree size={10}/> Lazer</button>
             </div>

             {/* Toggles and Sliders */}
             <div className="grid grid-cols-2 gap-4 items-center">
               <div onClick={() => setMapFreeOnly(!mapFreeOnly)} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border ${mapFreeOnly ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                  <DollarSign size={16} className={mapFreeOnly ? "fill-current" : ""}/>
                  <span className="text-xs font-bold">Grátis</span>
                  {mapFreeOnly && <Check size={12} />}
               </div>
               <div>
                 <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1"><span>Distância</span><span>{mapMaxDist}km</span></div>
                 <input type="range" min="1" max="20" step="0.5" value={mapMaxDist} onChange={(e) => setMapMaxDist(parseFloat(e.target.value))} className="w-full accent-indigo-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"/>
               </div>
             </div>
          </div>
          
          <div className="space-y-3 pb-10">
             <h3 className="font-bold text-slate-700 text-sm">Resultados ({filteredServices.length})</h3>
             {filteredServices.length === 0 && <div className="text-center py-4 text-xs text-slate-400 italic">Nenhum local encontrado com estes filtros.</div>}
             {filteredServices.map(service => (
                <div key={service.id} onClick={() => {setSelectedLocation(service); setActiveModal('location');}} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0 group cursor-pointer hover:bg-slate-50 rounded-lg px-2 -mx-2">
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1">{service.name}{service.type === 'ONG' && <HeartHandshake size={14} className="text-indigo-500"/>}</h4>
                    <span className="text-[10px] text-slate-400">{service.dist} • {service.type}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 text-xs font-bold text-yellow-500"><span className="text-slate-800">{service.rating}</span> <Star size={10} fill="currentColor"/></div>
                    {service.free && <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">Grátis</span>}
                  </div>
                </div>
             ))}
          </div>

          {mapFilter === 'all' && !mapFreeOnly && (
            <>
              <div className="flex justify-between items-center mb-4 pt-4 border-t border-slate-100">
                <h2 className="text-xl font-bold">Agenda Colaborativa</h2>
                <div className="flex gap-2">
                    <button onClick={() => setShowFavsOnly(!showFavsOnly)} className={`text-xs px-2 py-1 rounded-full font-bold border transition-colors ${showFavsOnly ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                    {showFavsOnly ? '❤️' : '🤍'}
                    </button>
                    <button onClick={() => setActiveModal('addEvent')} className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-full font-bold flex items-center gap-1 hover:bg-indigo-700 shadow"><Megaphone size={12}/> Sugerir Evento</button>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                 {filteredEvents.map(evt => (
                    // @ts-ignore
                   <div key={evt.id} className={`relative flex gap-4 p-3 rounded-xl border border-slate-100 bg-white items-center hover:shadow-sm transition-shadow ${evt.highlight ? 'border-indigo-200 bg-indigo-50' : ''}`}>
                      <div className="flex-1 flex gap-4 cursor-pointer" onClick={() => {setSelectedEvent(evt); setActiveModal('event');}}>
                        {/* @ts-ignore */}
                        <div className={`p-2 rounded-lg text-center min-w-[60px] ${evt.highlight ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-800'}`}>
                            {/* @ts-ignore */}
                            <span className="block text-xs font-bold opacity-70">{evt.month}</span>
                            {/* @ts-ignore */}
                            <span className="block text-xl font-bold">{evt.day}</span>
                        </div>
                        <div>
                            {/* @ts-ignore */}
                            <h4 className={`font-bold text-sm ${evt.highlight ? 'text-indigo-900' : 'text-slate-800'}`}>
                            {/* @ts-ignore */}
                            {evt.title}
                            {/* @ts-ignore */}
                            {evt.highlight && <span className="ml-2 inline-block bg-indigo-600 text-white text-[9px] px-1.5 py-0.5 rounded-full align-middle">Destaque</span>}
                            </h4>
                            {/* @ts-ignore */}
                            <p className="text-xs text-slate-500">{evt.loc} • {evt.dist}</p>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); toggleFavorite(evt.id); }} className="p-2 text-slate-300 hover:text-rose-500">
                        {/* @ts-ignore */}
                        <Heart size={16} className={favorites.includes(evt.id) ? "fill-rose-500 text-rose-500" : ""} />
                      </button>
                   </div>
                 ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const ProfileView = () => {
    const [isEditing, setIsEditing] = useState(false); 

    return (
      <div className="flex flex-col h-screen bg-slate-50 pb-20 animate-in slide-in-from-right duration-500">
        <div className="bg-white p-6 pb-8 rounded-b-[40px] shadow-sm text-center relative z-10">
          <div className="absolute top-4 right-4"><button onClick={() => !isDemo && auth && auth.signOut()} className="bg-red-50 text-red-500 p-2 rounded-full hover:bg-red-100 transition-colors flex items-center gap-2 text-xs font-bold px-3"><LogOut size={14} /> Sair</button></div>
          
          <div className="relative w-24 h-24 mx-auto mb-4">
            <div className="w-24 h-24 bg-indigo-100 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-3xl font-bold text-indigo-600 overflow-hidden">
              {userProfile.photoUrl ? (
                <img src={userProfile.photoUrl} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                userProfile.momName ? userProfile.momName.charAt(0) : <User size={32} />
              )}
            </div>
            <button onClick={() => { setCameraContext('profile'); setActiveModal('camera'); }} className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full shadow-md border-2 border-white hover:bg-indigo-700 transition-colors">
              <Camera size={14} />
            </button>
          </div>
          
          {!isEditing ? (
            <>
              <h2 className="text-xl font-bold text-slate-800">{userProfile.momName}</h2>
              <p className="text-sm text-slate-500 mb-4">Mãe do {userProfile.childName}</p>
              <div className="flex justify-center gap-2">
                <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">{userProfile.level}</span>
                <button onClick={() => setActiveModal('about')} className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-rose-100"><Info size={12}/> Sobre</button>
              </div>
              <button onClick={() => setIsEditing(true)} className="block mx-auto mt-4 text-xs text-slate-400 underline flex items-center justify-center gap-1"><Edit3 size={12}/> Editar Perfil</button>
            </>
          ) : (
            <form onSubmit={(e) => { handleSaveProfile(e); setIsEditing(false); }} className="space-y-3 animate-in fade-in">
              <h3 className="text-sm font-bold text-indigo-600 mb-2">Editar Perfil</h3>
              <input name="name" defaultValue={userProfile.momName} placeholder="Seu Nome" className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2 text-center outline-none focus:border-indigo-500" required />
              <input name="childName" defaultValue={userProfile.childName} placeholder="Nome da Criança" className="w-