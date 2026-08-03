import type { StatusLabels } from "@/lib/hours";
import type { EventDate } from "@/lib/ics";

export type Lang = "it" | "en" | "fr" | "de" | "es";

export interface HoursRow {
  label: string;
  value: string;
}

export interface MassageVariant {
  label?: string;
  duration?: string;
  price: string;
}

export interface MassageItem {
  name: string;
  variants: MassageVariant[];
}

export interface HotelContent {
  nav: {
    oggi: string;
    hotel: string;
    dining: string;
    wellness: string;
    explore: string;
  };
  services: {
    label: string;
    quickLabel: string;
    backLabel: string;
  };
  common: {
    receptionCta: string;
    receptionLabel: string;
    languageLabel: string;
    themeLabel: string;
    status: StatusLabels;
    callLabel: string;
    bookLabel: string;
    menuLabel: string;
    navigateLabel: string;
    openInMapsLabel: string;
    addToCalendarLabel: string;
    callValetLabel: string;
    reviewLabel: string;
    reviewGoogleLabel: string;
    reviewTripadvisorLabel: string;
    youAreHere: string;
    minWalk: string;
    byCar: string;
    airport: string;
    floorGround: string;
    floorThird: string;
    floorThirdMessegue: string;
    floorBasement: string;
    myLocationLabel: string;
    locationUnavailableLabel: string;
    listLabel: string;
    filterAll: string;
    filterPois: string;
    filterVenues: string;
    filterAirports: string;
    counterOf: string;
  };
  home: {
    eyebrow: string;
    titleMain: string;
    titleAccent: string;
    stayLabel: string;
    welcomeTitle: string;
    welcomeBody: string;
    checkIn: HoursRow;
    checkOut: HoursRow;
    lateCheckout: string;
    nowLabel: string;
    quickLabel: string;
    groupLabel: string;
    groupCategories: { wellness: string; dining: string; cafe: string; gelato: string; suites: string; shop: string; bar: string };
    quick: {
      wifi: { label: string; value: string; note: string; copyDone: string };
      breakfast: { label: string; note: string };
      checkout: { label: string; note: string };
      reception: { label: string; note: string };
      tv: { label: string; note: string; cta: string };
    };
    askLabel: string;
    askBody: string;
    askCta: string;
    highlightsLabel: string;
    highlightsSeeAll: string;
    chatPlaceholder: string;
    highlights: { title: string; body: string }[];
    hotelsLabel: string;
    hotels: { name: string; description: string; url: string }[];
  };
  room: {
    label: string;
    intro: string;
    servicesLabel: string;
    services: { title: string; subtitle: string; body: string }[];
    roomServiceLabel: string;
    roomService: { body: string; hours: string; supplement: string };
    laundryLabel: string;
    laundry: { body: string; hours: string };
    wifiLabel: string;
    wifi: { network: string; body: string };
    tvLabel: string;
    tvIntro: string;
    channels: { number: string; name: string; logo: string }[];
    petsLabel: string;
    pets: { body: string };
  };
  facility: {
    label: string;
    intro: string;
    parkingLabel: string;
    garage: { title: string; body: string[] };
    publicParking: { title: string; body: string };
    conciergeLabel: string;
    taxiLabel: string;
    taxi: { body: string };
    wakeUpLabel: string;
    wakeUp: { body: string };
    cardLabel: string;
    card: { body: string };
    hairdresserLabel: string;
    hairdresser: { body: string };
    meetingsLabel: string;
    meetings: { body: string };
    gymLabel: string;
    gym: { body: string };
    contactsLabel: string;
  };
  dining: {
    label: string;
    intro: string;
    arengoLabel: string;
    arengo: {
      hours: HoursRow[];
      paragraphs: string[];
      reservation: string;
    };
    groupLabel: string;
    groupIntro: string;
    venues: { id: string; name: string; body: string }[];
  };
  wellness: {
    label: string;
    intro: string;
    messegueLabel: string;
    messegue: { paragraphs: string[]; quote: string; quoteAuthor: string; callNote: string };
    priceListLabel: string;
    priceListNote: string;
    massages: MassageItem[];
  };
  info: {
    label: string;
    intro: string;
    sheetLabel: string;
    ghsmLabel: string;
    poiLabel: string;
    pois: { id: string; name: string; body: string }[];
    airportsLabel: string;
    airports: { list: string[]; note: string };
    reachLabel: string;
    reach: {
      transit: { title: string; body: string };
      taxi: { title: string; body: string };
      walk: { title: string; body: string };
    };
  };
  about: {
    label: string;
    intro: string;
    groupLabel: string;
    group: { intro: string; titanoSuites: { name: string; body: string } };
    eventsLabel: string;
    events: { name: string; date: string; dates?: EventDate[] }[];
    contactsLabel: string;
  };
  footer: string;
  poweredBy: string;
  privacyLabel: string;
}

const TV_CHANNELS = [
  { number: "1", name: "Rai 1", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Rai_1_-_Logo_2016.svg/120px-Rai_1_-_Logo_2016.svg.png" },
  { number: "2", name: "Rai 2", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Rai_2_-_Logo_2016.svg/120px-Rai_2_-_Logo_2016.svg.png" },
  { number: "3", name: "Rai 3", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Rai_3_-_Logo_2016.svg/120px-Rai_3_-_Logo_2016.svg.png" },
  { number: "4", name: "Rete 4", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Rete_4_-_Logo_2018.svg/120px-Rete_4_-_Logo_2018.svg.png" },
  { number: "5", name: "Canale 5", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Canale_5_-_2018_logo.svg/120px-Canale_5_-_2018_logo.svg.png" },
  { number: "6", name: "Italia 1", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Italia_1_logo.svg/120px-Italia_1_logo.svg.png" },
  { number: "7", name: "La7", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/LA7_-_Logo_2011.svg/120px-LA7_-_Logo_2011.svg.png" },
  { number: "8", name: "TV8", logo: "https://upload.wikimedia.org/wikipedia/commons/9/9a/TV8_logo.png" },
  { number: "9", name: "Nove", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Nove_-_Logo_2017.svg/120px-Nove_-_Logo_2017.svg.png" },
  { number: "20", name: "20 Mediaset", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/20_Mediaset.svg/120px-20_Mediaset.svg.png" },
  { number: "21", name: "Rai 4", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Rai_4_-_Logo_2016.svg/120px-Rai_4_-_Logo_2016.svg.png" },
  { number: "22", name: "Iris", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Iris_-_Logo_2013.svg/120px-Iris_-_Logo_2013.svg.png" },
  { number: "23", name: "Rai 5", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Rai_5_-_Logo_2017.svg/120px-Rai_5_-_Logo_2017.svg.png" },
  { number: "24", name: "Rai Movie", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Rai_Movie_-_Logo_2017.svg/120px-Rai_Movie_-_Logo_2017.svg.png" },
  { number: "25", name: "Rai Premium", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Rai_Premium_-_Logo_2017.svg/120px-Rai_Premium_-_Logo_2017.svg.png" },
  { number: "26", name: "Cielo", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Cielo_TV_logo_2013.svg/120px-Cielo_TV_logo_2013.svg.png" },
  { number: "35", name: "Focus", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Focus_TV_2018.svg/120px-Focus_TV_2018.svg.png" },
  { number: "36", name: "RTL 102.5", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/RTL_102.5_logo.svg/120px-RTL_102.5_logo.svg.png" },
  { number: "40", name: "Boing", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Boing_-_Logo_2020.svg/120px-Boing_-_Logo_2020.svg.png" },
  { number: "41", name: "K2", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/K2_new_logo.svg/120px-K2_new_logo.svg.png" },
  { number: "42", name: "Rai Gulp", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Rai_Gulp_-_Logo_2017.svg/120px-Rai_Gulp_-_Logo_2017.svg.png" },
  { number: "43", name: "Rai Yoyo", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Rai_Yoyo_-_Logo_2017.svg/120px-Rai_Yoyo_-_Logo_2017.svg.png" },
  { number: "44", name: "Frisbee", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Frisbee_%282015%29.svg/120px-Frisbee_%282015%29.svg.png" },
  { number: "45", name: "Boing Plus", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Boing_Plus_logo.svg/120px-Boing_Plus_logo.svg.png" },
  { number: "46", name: "Cartoonito", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Cartoonito_-_Logo_2021.svg/120px-Cartoonito_-_Logo_2021.svg.png" },
  { number: "47", name: "Super!", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Super_TV_logo.svg/120px-Super_TV_logo.svg.png" },
  { number: "48", name: "Rai News 24", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Rai_News_24_logo_%282022%29.svg/120px-Rai_News_24_logo_%282022%29.svg.png" },
  { number: "49", name: "Italia 2", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Logo_Italia2.svg/120px-Logo_Italia2.svg.png" },
  { number: "50", name: "Sky TG24", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Sky_TG24_logo_%282021%29.svg/120px-Sky_TG24_logo_%282021%29.svg.png" },
  { number: "51", name: "TgCom24", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/TgCom24_logo.svg/120px-TgCom24_logo.svg.png" },
  { number: "52", name: "DMAX", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/DMAX_BLACK.svg/120px-DMAX_BLACK.svg.png" },
  { number: "54", name: "Rai Storia", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Rai_Storia_-_Logo_2017.svg/120px-Rai_Storia_-_Logo_2017.svg.png" },
  { number: "57", name: "Rai Scuola", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Rai_Scuola_-_Logo_2017.svg/120px-Rai_Scuola_-_Logo_2017.svg.png" },
  { number: "58", name: "Rai Sport", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Rai_Sport_-_Logo_2022.svg/120px-Rai_Sport_-_Logo_2022.svg.png" },
  { number: "60", name: "Sport Italia", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Sportitalia_logo.svg/120px-Sportitalia_logo.svg.png" },
  { number: "64", name: "SuperTennis", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/SuperTennis_Logo.svg/120px-SuperTennis_Logo.svg.png" },
  { number: "831", name: "San Marino RTV", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/San_Marino_RTV_logo_2025.png/120px-San_Marino_RTV_logo_2025.png" },
];

const it: HotelContent = {
  nav: {
    oggi: "Oggi",
    hotel: "Hotel",
    dining: "Ristorante",
    wellness: "Benessere",
    explore: "San Marino",
  },
  common: {
    receptionCta: "Chiama la Reception",
    receptionLabel: "Reception",
    languageLabel: "Lingua",
    themeLabel: "Tema",
    status: {
      open: "Aperto",
      closed: "Chiuso",
      onRequest: "Su richiesta",
      closesAt: "fino alle",
      opensAt: "riapre alle",
    },
    callLabel: "Chiama",
    bookLabel: "Prenota",
    menuLabel: "Vedi il menù",
    navigateLabel: "Naviga",
    openInMapsLabel: "Apri in Mappe",
    addToCalendarLabel: "Aggiungi al calendario",
    callValetLabel: "Chiama il Valet",
    reviewLabel: "Lasciaci una recensione",
    reviewGoogleLabel: "Google",
    reviewTripadvisorLabel: "Tripadvisor",
    youAreHere: "Il vostro hotel",
    minWalk: "min a piedi",
    byCar: "in auto",
    airport: "Aeroporto",
    floorGround: "Piano Terra",
    floorThird: "3° piano",
    floorThirdMessegue: "3° piano · Centro Mességué",
    floorBasement: "-1 · Garage",
    myLocationLabel: "La mia posizione",
    locationUnavailableLabel: "Posizione non disponibile",
    listLabel: "Elenco",
    filterAll: "Tutto",
    filterPois: "Da non perdere",
    filterVenues: "I nostri locali",
    filterAirports: "Come arrivare",
    counterOf: "di",
  },
  home: {
    eyebrow: "Benvenuti al",
    titleMain: "Grand Hotel",
    titleAccent: "San Marino",
    stayLabel: "Il vostro soggiorno",
    welcomeTitle: "Vi diamo il benvenuto",
    welcomeBody:
      "Questa app è la vostra guida al soggiorno: richiedete il room service, visualizzate gli orari dei servizi, esplorate il ristorante e la spa, e scoprite dove andare a San Marino.",
    checkIn: { label: "Check-in", value: "Dalle ore 14:00" },
    checkOut: { label: "Check-out", value: "Entro le ore 11:00" },
    lateCheckout: "Late check-out su disponibilità, con supplemento.",
    nowLabel: "In questo momento",
    quickLabel: "Azioni rapide",
    groupLabel: "Scopri il GHSM Group",
    groupCategories: { wellness: "Benessere", dining: "Ristorante", cafe: "Caffè", gelato: "Gelateria", suites: "Suites", shop: "Bottega", bar: "Lounge bar" },
    quick: {
      wifi: {
        label: "Wi-Fi",
        value: "GRANDHOTELRSM",
        note: "Gratuito in tutto l'hotel. Seleziona la rete e attendi la pagina di accesso.",
        copyDone: "Copiato",
      },
      breakfast: {
        label: "Colazione",
        note: "Ristorante L'Arengo · 07:00 – 10:00. In camera con supplemento di €6,00.",
      },
      checkout: {
        label: "Check-out",
        note: "Entro le ore 11:00. Late check-out su richiesta in Reception.",
      },
      reception: {
        label: "Reception",
        note: "Aperta 24 ore su 24. Dal telefono in camera, tasto 9.",
      },
      tv: {
        label: "Canali TV",
        note: "37 canali disponibili in camera, dal n. 1 all'831.",
        cta: "Vedi tutti i canali",
      },
    },
    askLabel: "Concierge digitale",
    askBody: "Una domanda sul soggiorno o su San Marino? Chiedete pure, vi rispondo subito.",
    askCta: "Apri il Concierge",
    highlightsLabel: "Azioni rapide",
    highlightsSeeAll: "Vedi tutto",
    chatPlaceholder: "Chiedi al nostro Concierge digitale…",
    highlights: [
      {
        title: "Wi-Fi",
        body: "Rete GRANDHOTELRSM — seleziona la rete, attendi la notifica e connettiti gratuitamente in tutto l'hotel.",
      },
      {
        title: "Reception",
        body: "Aperta 24 ore su 24. Componi il tasto 9 dal telefono in camera per qualsiasi necessità.",
      },
      {
        title: "Colazione",
        body: "Servita al Ristorante L'Arengo dalle 07:00 alle 10:00. Room service disponibile con supplemento di €6,00.",
      },
    ],
    hotelsLabel: "Gli hotel del gruppo GHSM",
    hotels: [
      { name: "Grand Hotel San Marino", description: "60 camere e suite con vista sulla valle del Montefeltro.", url: "https://www.grandhotel.sm" },
      { name: "Hotel Titano", description: "Il fascino di fine Ottocento nel cuore di San Marino.", url: "https://www.hoteltitano.com" },
      { name: "Titano Suites", description: "Suite di design nel centro storico della Repubblica.", url: "https://www.titanosuiteshotel.com" },
    ],
  },
  room: {
    label: "Servizi in Camera",
    intro: "Tutto il necessario per il massimo confort: reception, room service, lavanderia, Wi-Fi e canali TV.",
    servicesLabel: "Contatti e comfort",
    services: [
      {
        title: "Reception e Room Service",
        subtitle: "Tasto 9",
        body: "Per qualsiasi necessità, chiamate la Reception o il Room Service componendo il tasto 9 dal telefono in camera.",
      },
      {
        title: "Centro Mességué",
        subtitle: "Tasto 471",
        body: "Per informazioni e prenotazioni al Centro Medico Maurice Mességué, comporre il tasto 471.",
      },
      {
        title: "Cassaforte",
        subtitle: "Tasto R + codice + #",
        body: "Per impostare la cassaforte, premere il tasto R, digitare un nuovo codice personale di 4-10 cifre e confermare con il tasto #.",
      },
      {
        title: "Aria condizionata",
        subtitle: "Pannello in camera",
        body: "Il climatizzatore è regolabile dal pannello in camera. Si disattiva automaticamente aprendo la finestra.",
      },
      {
        title: "Non disturbare",
        subtitle: "Cartoncino sulla maniglia",
        body: "Per non essere disturbati, appendere l'apposito cartoncino alla maniglia esterna della porta.",
      },
    ],
    roomServiceLabel: "Room Service",
    roomService: {
      body: "Colazioni, snack e pasti possono essere serviti direttamente in camera.",
      hours: "Tutti i giorni, 07:00 – 23:00",
      supplement: "Supplemento di €6,00 per ordine.",
    },
    laundryLabel: "Lavanderia",
    laundry: {
      body: "Costi e tempi di lavorazione dipendono dal tipo di tessuto e di lavaggio richiesto. Il modulo per la richiesta si trova nell'armadio della camera.",
      hours: "08:30 – 16:00",
    },
    wifiLabel: "Wi-Fi",
    wifi: {
      network: "GRANDHOTELRSM",
      body: "1. Apri Impostazioni → Wi-Fi\n2. Seleziona la rete GRANDHOTELRSM\n3. Tocca la notifica di registrazione\n\nSe non vedi la notifica, attendi qualche secondo.",
    },
    tvLabel: "Canali TV",
    tvIntro: "La selezione di canali disponibili in camera:",
    channels: TV_CHANNELS,
    petsLabel: "Animali domestici",
    pets: {
      body: "Gli animali di piccola taglia sono ammessi. È previsto un supplemento di €4,00 al giorno per la pulizia extra della camera.",
    },
  },
  facility: {
    label: "Servizi della Struttura",
    intro: "Parcheggio, concierge e gli spazi della struttura — palestra e biciclette — per il vostro soggiorno a San Marino.",
    parkingLabel: "Parcheggio",
    garage: {
      title: "Garage privato",
      body: [
        "€19,00 a notte.",
        "Servizio valet dalle 7:00 alle 23:00: si consiglia di richiedere il veicolo con almeno 30 minuti di anticipo.",
        "È disponibile una colonna di ricarica per veicoli elettrici, con supplemento.",
      ],
    },
    publicParking: {
      title: "Parcheggio pubblico",
      body: "Biglietti a €6,00 al giorno disponibili in Reception, validi fino alle ore 24:00 del giorno successivo nelle strisce blu.",
    },
    conciergeLabel: "Concierge",
    taxiLabel: "Taxi",
    taxi: {
      body: "Per prenotare un taxi, contattare il Ricevimento indicando data, ora, numero di persone, tipo di veicolo richiesto e destinazione.",
    },
    wakeUpLabel: "Sveglia",
    wakeUp: {
      body: "Per richiedere la sveglia, contattare il Ricevimento componendo il tasto 9.",
    },
    cardLabel: "TuttoSanMarino Card",
    card: {
      body: "La TuttoSanMarino Card offre sconti in musei, negozi e ristoranti convenzionati. La card può essere richiesta in Reception.",
    },
    hairdresserLabel: "Parrucchiere",
    hairdresser: {
      body: "Il Ricevimento è a disposizione per informazioni sui saloni di acconciatura nelle vicinanze.",
    },
    meetingsLabel: "Sale Meeting",
    meetings: {
      body: "Il Grand Hotel San Marino dispone di 5 sale meeting modulabili, per eventi da 2 a 200 persone, con supporti tecnologici e uno staff qualificato a disposizione per organizzare meeting su misura, colazioni e cene di lavoro, eventi privati, celebrazioni e banchetti.",
    },
    gymLabel: "Palestra",
    gym: {
      body: "Una piccola palestra affacciata sulla Valle del Montefeltro, con attrezzi fitness di base, situata all'interno del Centro Mességué al 3° piano. Accesso libero, senza prenotazione, dalle 08:00 alle 20:00.",
    },
    contactsLabel: "Contatti e posizione",
  },
  dining: {
    label: "Ristorante",
    intro: "La cucina del Grand Hotel San Marino e gli altri locali del gruppo GHSM. Per il Room Service direttamente in camera, consulta la sezione Hotel.",
    arengoLabel: "Ristorante L'Arengo",
    arengo: {
      hours: [
        { label: "Colazione", value: "07:00 – 10:00" },
        { label: "Pranzo", value: "12:00 – 14:30" },
        { label: "Cena", value: "19:00 – 21:30" },
      ],
      paragraphs: [
        "Pane e pasta sono fatti in casa, grazie al lavoro dei nostri Chef Pasticcere e Chef Pastaio dedicati.",
        "In cucina si tramandano le ricette della tradizione locale: lasagne, ravioli e tortellacci preparati secondo le ricette di famiglia.",
        "Su richiesta sono disponibili menu speciali ipocalorici o pensati per intolleranze alimentari e patologie particolari, grazie alla sinergia con il Centro Medico Mességué e all'utilizzo di materie prime di origine certificata.",
      ],
      reservation: "La prenotazione è gradita.",
    },
    groupLabel: "Il gruppo GHSM",
    groupIntro:
      "Il Grand Hotel San Marino fa parte di GHSM Group, che dal 1894 rappresenta l'ospitalità a San Marino. Ecco gli altri indirizzi del gruppo dove mangiare e bere.",
    venues: [
      {
        id: "laTerrazza",
        name: "Ristorante La Terrazza",
        body: "Cenare tra i merli di una Torre medievale, sospesi tra cielo e terra, con l'orizzonte che si apre a perdita d'occhio — La Terrazza è un'esperienza che pochi luoghi al mondo possono offrire. Cucina enogastronomica di alto livello con prodotti locali.",
      },
      {
        id: "caffeTitano",
        name: "Caffè Titano",
        body: "Venendo a San Marino non si può non fermarsi qui: nel pieno Centro Storico, affacciato su una splendida piazzetta medievale, in uno degli angoli più suggestivi del borgo antico.",
      },
      {
        id: "cremeria",
        name: "La Cremeria del Titano",
        body: "Proprio accanto al Caffè Titano. Aperta nei mesi più caldi, per una fresca e gustosa sosta accompagnata da un buon gelato artigianale.",
      },
      {
        id: "laLoggia",
        name: "La Loggia",
        body: "Lounge bar e bottega nel cuore del centro storico, in Piazzetta Garibaldi: formaggi, salumi e taglieri, vini e vermouth artigianali, dolci tipici sammarinesi e birre locali, selezionati per raccontare i sapori più autentici della nostra terra.",
      },
    ],
  },
  wellness: {
    label: "Benessere",
    intro: "Il Centro Medico Maurice Mességué e il listino trattamenti per il vostro relax.",
    messegueLabel: "Centro Medico Maurice Mességué",
    messegue: {
      paragraphs: [
        "Da oltre 30 anni, il Centro Medico Maurice Mességué è un punto di riferimento italiano per la salute, il dimagrimento e le vacanze benessere: una clinica dimagrante e un'oasi di salute che unisce dieta, attività fisica e cure fitoterapiche.",
        "Il centro propone trattamenti estetici per viso e corpo, con formulazioni specializzate e rituali di remise en forme su misura per ogni ospite.",
      ],
      quote: "È la natura che ha ragione.",
      quoteAuthor: "Maurice Mességué",
      callNote: "Per informazioni e prenotazioni, comporre il tasto 471 dal telefono in camera.",
    },
    priceListLabel: "Listino trattamenti",
    priceListNote: "Prezzi e durate dei trattamenti disponibili presso il Centro Mességué.",
    massages: [
      { name: "Massaggio rilassante", variants: [{ duration: "30'", price: "€50,00" }] },
      { name: "Massaggio decontratturante", variants: [{ duration: "50'", price: "€90,00" }] },
      { name: "Massaggio classico", variants: [{ duration: "30'", price: "€50,00" }] },
      {
        name: "Massaggio di coppia",
        variants: [
          { duration: "30'", price: "€95,00" },
          { duration: "50'", price: "€165,00" },
        ],
      },
      { name: "Hot-Stone", variants: [{ duration: "50'", price: "€90,00" }] },
      { name: "Massaggio ayurvedico", variants: [{ duration: "50'", price: "€90,00" }] },
      { name: "Massaggio con calco verde", variants: [{ duration: "75'", price: "€145,00" }] },
      {
        name: "Linfodrenaggio",
        variants: [
          { label: "Viso", duration: "30'", price: "€45,00" },
          { label: "Corpo", duration: "50'", price: "€90,00" },
        ],
      },
      { name: "Depilazione parziale", variants: [{ price: "€40,00" }] },
      { name: "Depilazione totale gambe", variants: [{ price: "€55,00" }] },
      { name: "Pulizia viso", variants: [{ duration: "60'", price: "€75,00" }] },
      { name: "Trattamento Anti Age classico", variants: [{ duration: "45'", price: "€104,00" }] },
      { name: "Lift Summum (Anti Age Plus)", variants: [{ duration: "50'", price: "€135,00" }] },
      { name: "Radiofrequenza (Anti Age Deluxe)", variants: [{ duration: "75'", price: "€135,00" }] },
      { name: "Manicure", variants: [{ price: "€38,00" }] },
      { name: "Pedicure", variants: [{ price: "€48,00" }] },
    ],
  },
  info: {
    label: "Dove",
    intro: "La mappa della zona, gli indirizzi del gruppo GHSM, i luoghi da non perdere a San Marino e come muoversi in città.",
    sheetLabel: "Info e contatti",
    ghsmLabel: "Indirizzi GHSM nei dintorni",
    poiLabel: "Da non perdere a San Marino",
    pois: [
      {
        id: "palazzoPubblico",
        name: "Palazzo Pubblico",
        body: "Il palazzo del Governo, sede delle istituzioni della Repubblica, domina la centralissima Piazza della Libertà. È visitabile con un percorso che racconta la storia istituzionale di San Marino.",
      },
      {
        id: "basilica",
        name: "Basilica del Santo",
        body: "In stile neoclassico, custodisce le reliquie di San Marino, il santo che ha dato origine alla Repubblica più antica del mondo.",
      },
      {
        id: "museoStato",
        name: "Museo di Stato",
        body: "Raccoglie reperti archeologici, opere d'arte e testimonianze storiche della Repubblica, dalla preistoria all'età moderna.",
      },
      {
        id: "guaita",
        name: "Prima Torre · Rocca Guaita",
        body: "La più antica e famosa delle Tre Torri, costruita nell'XI secolo. Dai camminamenti la vista si apre fino al mare Adriatico.",
      },
      {
        id: "cesta",
        name: "Seconda Torre · Rocca Cesta",
        body: "Ospita il Museo delle Armi Antiche, con una collezione di armature e armi dal XII al XIX secolo.",
      },
      {
        id: "funivia",
        name: "Funivia di San Marino",
        body: "Collega in pochi minuti il centro storico a Borgo Maggiore, con una vista panoramica sulla Valle del Montefeltro.",
      },
      {
        id: "cavaBalestrieri",
        name: "Cava dei Balestrieri",
        body: "Un'ampia terrazza verde alle spalle di Piazza della Libertà, storica sede delle esibizioni della Federazione Balestrieri di San Marino. Da qui lo sguardo spazia sulle colline del Montefeltro.",
      },
      {
        id: "passoStreghe",
        name: "Passo delle Streghe",
        body: "Un suggestivo camminamento scavato nella roccia che collega Rocca Guaita a Rocca Cesta, con scorci sospesi sulla vallata. Il nome richiama le leggende popolari legate al monte Titano.",
      },
      {
        id: "montale",
        name: "Terza Torre · Torre Montale",
        body: "La più piccola e meno accessibile delle Tre Torri, edificata come postazione di avvistamento e oggi non visitabile all'interno. Segna il punto più meridionale della cresta del monte Titano.",
      },
      {
        id: "chiesaSanFrancesco",
        name: "Chiesa di San Francesco",
        body: "Uno dei luoghi di culto più antichi di San Marino, annesso all'ex convento francescano oggi sede del Museo di Stato. Conserva opere pittoriche di scuola riminese e marchigiana.",
      },
      {
        id: "museoCuriosita",
        name: "Museo delle Curiosità",
        body: "Una raccolta insolita di record, invenzioni e oggetti curiosi da tutto il mondo, allestita nel cuore del centro storico. Un percorso adatto a visitatori di ogni età, tra stranezze e aneddoti.",
      },
      {
        id: "portaSanFrancesco",
        name: "Porta San Francesco",
        body: "Uno degli antichi ingressi fortificati al borgo, all'imbocco di Piazzale Lo Stradone verso il centro storico. Il passaggio sotto la torre conserva ancora l'atmosfera medievale delle mura cittadine.",
      },
    ],
    airportsLabel: "Aeroporti",
    airports: {
      list: ["Rimini", "Ancona", "Forlì", "Bologna"],
      note: "Su richiesta è disponibile il servizio di noleggio auto con conducente.",
    },
    reachLabel: "Come muoversi",
    reach: {
      transit: {
        title: "Mezzi pubblici",
        body: "Bonelli Bus collega San Marino alla stazione ferroviaria e all'aeroporto di Rimini con corse regolari durante il giorno.",
      },
      taxi: {
        title: "Taxi",
        body: "Per spostamenti verso aeroporti o altre località, il Ricevimento è a disposizione per prenotare un taxi o un servizio con conducente.",
      },
      walk: {
        title: "A piedi",
        body: "Il centro storico è pedonale e si raggiunge dall'hotel in pochi minuti, tra vicoli e scalinate caratteristiche: si consigliano scarpe comode.",
      },
    },
  },
  about: {
    label: "Informazioni",
    intro: "Il gruppo GHSM, gli eventi in programma a San Marino e tutti i contatti del Grand Hotel.",
    groupLabel: "GHSM Group",
    group: {
      intro: "GHSM Group rappresenta l'ospitalità a San Marino dal 1894.",
      titanoSuites: {
        name: "Titano Suites",
        body: "Un palazzo di fine '800 nel cuore di San Marino, che ospita la Suite Montefeltro con vasca idromassaggio sulla terrazza panoramica.",
      },
    },
    eventsLabel: "Eventi a San Marino",
    events: [
      {
        name: "Investitura dei Capitani Reggenti",
        date: "1 aprile e 1 ottobre",
        dates: [{ month: 4, day: 1 }, { month: 10, day: 1 }],
      },
      { name: "Festa Nazionale", date: "3 settembre", dates: [{ month: 9, day: 3 }] },
      { name: "SMIAF", date: "Prime settimane di agosto" },
      { name: "San Marino Comics", date: "Ultime settimane di agosto" },
      { name: "Rally Legend", date: "Metà ottobre" },
      { name: "MotoGP", date: "Inizio settembre" },
      { name: "Mercatini di Natale", date: "Periodo natalizio" },
    ],
    contactsLabel: "Indirizzo e contatti",
  },
  services: {
    label: "Tutti i servizi",
    quickLabel: "Accesso rapido",
    backLabel: "Tutti i servizi",
  },
  footer: "Grand Hotel San Marino",
  poweredBy: "Realizzata da",
  privacyLabel: "Privacy",
};

const en: HotelContent = {
  nav: {
    oggi: "Today",
    hotel: "Hotel",
    dining: "Dining",
    wellness: "Wellness",
    explore: "San Marino",
  },
  common: {
    receptionCta: "Call Reception",
    receptionLabel: "Reception",
    languageLabel: "Language",
    themeLabel: "Theme",
    status: {
      open: "Open",
      closed: "Closed",
      onRequest: "On request",
      closesAt: "until",
      opensAt: "reopens at",
    },
    callLabel: "Call",
    bookLabel: "Book",
    menuLabel: "View menu",
    navigateLabel: "Navigate",
    openInMapsLabel: "Open in Maps",
    addToCalendarLabel: "Add to calendar",
    callValetLabel: "Call Valet",
    reviewLabel: "Leave us a review",
    reviewGoogleLabel: "Google",
    reviewTripadvisorLabel: "Tripadvisor",
    youAreHere: "Your hotel",
    minWalk: "min walk",
    byCar: "by car",
    airport: "Airport",
    floorGround: "Ground floor",
    floorThird: "3rd floor",
    floorThirdMessegue: "3rd floor · Mességué Centre",
    floorBasement: "-1 · Garage",
    myLocationLabel: "My location",
    locationUnavailableLabel: "Location unavailable",
    listLabel: "List",
    filterAll: "All",
    filterPois: "Must-see",
    filterVenues: "Our venues",
    filterAirports: "Getting there",
    counterOf: "of",
  },
  home: {
    eyebrow: "Welcome to",
    titleMain: "Grand Hotel",
    titleAccent: "San Marino",
    stayLabel: "Your stay",
    welcomeTitle: "Welcome",
    welcomeBody:
      "This app is your guide to your stay: request room service, check service hours, explore the restaurant and spa, and discover what to do in San Marino.",
    checkIn: { label: "Check-in", value: "From 2:00 PM" },
    checkOut: { label: "Check-out", value: "By 11:00 AM" },
    lateCheckout: "Late check-out subject to availability, with a supplement.",
    nowLabel: "Right now",
    quickLabel: "Quick actions",
    groupLabel: "Discover the GHSM Group",
    groupCategories: { wellness: "Wellness", dining: "Restaurant", cafe: "Café", gelato: "Ice cream", suites: "Suites", shop: "Boutique", bar: "Lounge bar" },
    quick: {
      wifi: {
        label: "Wi-Fi",
        value: "GRANDHOTELRSM",
        note: "Free throughout the hotel. Select the network and wait for the sign-in page.",
        copyDone: "Copied",
      },
      breakfast: {
        label: "Breakfast",
        note: "L'Arengo Restaurant · 7:00 – 10:00 AM. In-room with a €6.00 supplement.",
      },
      checkout: {
        label: "Check-out",
        note: "By 11:00 AM. Late check-out on request at Reception.",
      },
      reception: {
        label: "Reception",
        note: "Open 24 hours. Dial 9 from your room phone.",
      },
      tv: {
        label: "TV Channels",
        note: "37 channels available in your room, from no. 1 to 831.",
        cta: "See all channels",
      },
    },
    askLabel: "Digital Concierge",
    askBody: "A question about your stay or about San Marino? Just ask, I'll reply right away.",
    askCta: "Open the Concierge",
    highlightsLabel: "Quick actions",
    highlightsSeeAll: "See all",
    chatPlaceholder: "Ask our digital Concierge…",
    highlights: [
      {
        title: "Wi-Fi",
        body: "GRANDHOTELRSM network — select it, wait for the notification, and connect for free throughout the hotel.",
      },
      {
        title: "Reception",
        body: "Open 24 hours a day. Dial 9 from your room phone for any request.",
      },
      {
        title: "Breakfast",
        body: "Served at Ristorante L'Arengo from 7:00 to 10:00 AM. Room service available with a €6.00 supplement.",
      },
    ],
    hotelsLabel: "The GHSM Group hotels",
    hotels: [
      { name: "Grand Hotel San Marino", description: "60 rooms and suites overlooking the Montefeltro valley.", url: "https://www.grandhotel.sm" },
      { name: "Hotel Titano", description: "Late-19th-century charm in the heart of San Marino.", url: "https://www.hoteltitano.com" },
      { name: "Titano Suites", description: "Design suites in the historic centre of the Republic.", url: "https://www.titanosuiteshotel.com" },
    ],
  },
  room: {
    label: "In-Room Services",
    intro: "Everything you need for maximum comfort: reception, room service, laundry, Wi-Fi and TV channels.",
    servicesLabel: "Contacts & comfort",
    services: [
      {
        title: "Reception & Room Service",
        subtitle: "Dial 9",
        body: "For any need, call Reception or Room Service by dialling 9 on the room phone.",
      },
      {
        title: "Mességué Centre",
        subtitle: "Dial 471",
        body: "For information and bookings at the Maurice Mességué Medical Centre, dial 471.",
      },
      {
        title: "Safe",
        subtitle: "R key + code + #",
        body: "To set the safe, press the R key, enter a new personal code of 4-10 digits and confirm with the # key.",
      },
      {
        title: "Air conditioning",
        subtitle: "Panel in room",
        body: "The air conditioning can be adjusted from the panel in the room. It switches off automatically when the window is opened.",
      },
      {
        title: "Do Not Disturb",
        subtitle: "Door hanger",
        body: "To avoid being disturbed, hang the Do Not Disturb card on the outside door handle.",
      },
    ],
    roomServiceLabel: "Room Service",
    roomService: {
      body: "Breakfast, snacks and meals can be served directly in your room.",
      hours: "Every day, 7:00 AM – 11:00 PM",
      supplement: "€6.00 supplement per order.",
    },
    laundryLabel: "Laundry",
    laundry: {
      body: "Costs and turnaround times depend on the fabric and type of wash required. The request form can be found in the room wardrobe.",
      hours: "8:30 AM – 4:00 PM",
    },
    wifiLabel: "Wi-Fi",
    wifi: {
      network: "GRANDHOTELRSM",
      body: "1. Open Settings → Wi-Fi\n2. Select the GRANDHOTELRSM network\n3. Tap the registration notification\n\nIf you don't see the notification, wait a few seconds.",
    },
    tvLabel: "TV Channels",
    tvIntro: "The channels available in your room:",
    channels: TV_CHANNELS,
    petsLabel: "Pets",
    pets: {
      body: "Small pets are welcome. A supplement of €4.00 per day applies for extra room cleaning.",
    },
  },
  facility: {
    label: "Hotel Facilities",
    intro: "Parking, concierge and the hotel's own facilities — gym and bikes — for your stay in San Marino.",
    parkingLabel: "Parking",
    garage: {
      title: "Private garage",
      body: [
        "€19.00 per night.",
        "Valet service from 7:00 AM to 11:00 PM: please request your vehicle at least 30 minutes in advance.",
        "An electric vehicle charging station is available, with a supplement.",
      ],
    },
    publicParking: {
      title: "Public parking",
      body: "Tickets at €6.00 per day are available at Reception, valid until midnight the following day in blue-line parking spaces.",
    },
    conciergeLabel: "Concierge",
    taxiLabel: "Taxi",
    taxi: {
      body: "To book a taxi, contact Reception with the date, time, number of people, type of vehicle required and destination.",
    },
    wakeUpLabel: "Wake-up call",
    wakeUp: {
      body: "To request a wake-up call, contact Reception by dialling 9.",
    },
    cardLabel: "TuttoSanMarino Card",
    card: {
      body: "The TuttoSanMarino Card offers discounts at partner museums, shops and restaurants. The card can be requested at Reception.",
    },
    hairdresserLabel: "Hairdresser",
    hairdresser: {
      body: "Reception is available for information on nearby hairdressing salons.",
    },
    meetingsLabel: "Meeting Rooms",
    meetings: {
      body: "The Grand Hotel San Marino has 5 modular meeting rooms for events from 2 to 200 people, with technological support and a qualified staff available to organise tailor-made meetings, working breakfasts and dinners, private events, celebrations and banquets.",
    },
    gymLabel: "Gym",
    gym: {
      body: "A small gym overlooking the Montefeltro Valley, with basic fitness equipment, located inside the Mességué Centre on the 3rd floor. Free access, no booking required, from 8:00 AM to 8:00 PM.",
    },
    contactsLabel: "Contact & location",
  },
  dining: {
    label: "Dining",
    intro: "The cuisine of the Grand Hotel San Marino and the other venues of the GHSM Group. For Room Service in your room, see the Hotel section.",
    arengoLabel: "L'Arengo Restaurant",
    arengo: {
      hours: [
        { label: "Breakfast", value: "7:00 – 10:00 AM" },
        { label: "Lunch", value: "12:00 – 2:30 PM" },
        { label: "Dinner", value: "7:00 – 9:30 PM" },
      ],
      paragraphs: [
        "Bread and pasta are made in-house, thanks to the work of our dedicated Pastry Chef and Pasta Chef.",
        "Our kitchen carries on local tradition: lasagne, ravioli and tortellacci prepared according to family recipes.",
        "Special low-calorie menus, or menus for food intolerances and specific medical conditions, are available on request, thanks to our synergy with the Mességué Medical Centre and the use of certified-origin ingredients.",
      ],
      reservation: "Reservations are recommended.",
    },
    groupLabel: "The GHSM Group",
    groupIntro:
      "The Grand Hotel San Marino is part of GHSM Group, representing hospitality in San Marino since 1894. Here are the other group venues for food and drink.",
    venues: [
      {
        id: "laTerrazza",
        name: "La Terrazza Restaurant",
        body: "Dining among the battlements of a medieval tower, suspended between sky and earth, with the horizon stretching as far as the eye can see — La Terrazza is an experience that few places in the world can offer. High-level food-and-wine cuisine with local produce.",
      },
      {
        id: "caffeTitano",
        name: "Caffè Titano",
        body: "A visit to San Marino would not be complete without stopping here: in the heart of the historic centre, overlooking a charming medieval square, in one of the most picturesque corners of the old town.",
      },
      {
        id: "cremeria",
        name: "La Cremeria del Titano",
        body: "Right next to Caffè Titano. Open during the warmer months, the perfect place for a refreshing and delicious break with artisanal gelato.",
      },
      {
        id: "laLoggia",
        name: "La Loggia",
        body: "A lounge bar and boutique in the heart of the historic centre, on Piazzetta Garibaldi: local cheeses, cured meats and charcuterie boards, artisan wines and vermouth, traditional Sammarinese sweets and local craft beers, selected to capture the most authentic flavours of our land.",
      },
    ],
  },
  wellness: {
    label: "Wellness",
    intro: "The Maurice Mességué Medical Centre and the treatment price list for your relaxation.",
    messegueLabel: "Maurice Mességué Medical Centre",
    messegue: {
      paragraphs: [
        "For over 30 years, the Maurice Mességué Medical Centre has been an Italian benchmark for health, weight-loss and wellness holidays: a slimming clinic and a health oasis combining diet, physical activity and herbal-medicine treatments.",
        "The centre offers face and body beauty treatments, with specialised formulations and remise en forme rituals tailored to each guest.",
      ],
      quote: "Nature is always right.",
      quoteAuthor: "Maurice Mességué",
      callNote: "For information and bookings, dial 471 on the room phone.",
    },
    priceListLabel: "Treatment price list",
    priceListNote: "Prices and durations of the treatments available at the Mességué Centre.",
    massages: [
      { name: "Relaxing massage", variants: [{ duration: "30'", price: "€50.00" }] },
      { name: "Decontracting massage", variants: [{ duration: "50'", price: "€90.00" }] },
      { name: "Classic massage", variants: [{ duration: "30'", price: "€50.00" }] },
      {
        name: "Couple's massage",
        variants: [
          { duration: "30'", price: "€95.00" },
          { duration: "50'", price: "€165.00" },
        ],
      },
      { name: "Hot-Stone", variants: [{ duration: "50'", price: "€90.00" }] },
      { name: "Ayurvedic massage", variants: [{ duration: "50'", price: "€90.00" }] },
      { name: "Green clay massage", variants: [{ duration: "75'", price: "€145.00" }] },
      {
        name: "Lymphatic drainage",
        variants: [
          { label: "Face", duration: "30'", price: "€45.00" },
          { label: "Body", duration: "50'", price: "€90.00" },
        ],
      },
      { name: "Partial waxing", variants: [{ price: "€40.00" }] },
      { name: "Full leg waxing", variants: [{ price: "€55.00" }] },
      { name: "Facial cleansing", variants: [{ duration: "60'", price: "€75.00" }] },
      { name: "Classic Anti-Age treatment", variants: [{ duration: "45'", price: "€104.00" }] },
      { name: "Lift Summum (Anti-Age Plus)", variants: [{ duration: "50'", price: "€135.00" }] },
      { name: "Radiofrequency (Anti-Age Deluxe)", variants: [{ duration: "75'", price: "€135.00" }] },
      { name: "Manicure", variants: [{ price: "€38.00" }] },
      { name: "Pedicure", variants: [{ price: "€48.00" }] },
    ],
  },
  info: {
    label: "Explore",
    intro: "The area map, GHSM Group addresses, must-see places in San Marino and how to get around.",
    sheetLabel: "Info & contacts",
    ghsmLabel: "GHSM Group nearby",
    poiLabel: "Must-see in San Marino",
    pois: [
      {
        id: "palazzoPubblico",
        name: "Palazzo Pubblico",
        body: "The Government Palace, seat of the Republic's institutions, overlooks the central Piazza della Libertà. A visitor route tells the story of San Marino's institutions.",
      },
      {
        id: "basilica",
        name: "Basilica del Santo",
        body: "This neoclassical basilica holds the relics of Saint Marinus, who gave his name to the world's oldest republic.",
      },
      {
        id: "museoStato",
        name: "State Museum",
        body: "Home to archaeological finds, artworks and historical artefacts of the Republic, from prehistory to modern times.",
      },
      {
        id: "guaita",
        name: "First Tower · Guaita Fortress",
        body: "The oldest and most iconic of the Three Towers, built in the 11th century. Its walkways offer views all the way to the Adriatic Sea.",
      },
      {
        id: "cesta",
        name: "Second Tower · Cesta Fortress",
        body: "Home to the Museum of Ancient Weapons, with a collection of armour and arms from the 12th to the 19th century.",
      },
      {
        id: "funivia",
        name: "San Marino Cable Car",
        body: "Connects the historic centre to Borgo Maggiore in just a few minutes, with panoramic views over the Montefeltro Valley.",
      },
      {
        id: "cavaBalestrieri",
        name: "Cava dei Balestrieri",
        body: "A broad green terrace behind Piazza della Libertà, the historic home of San Marino's Crossbowmen Federation displays. From here the view opens over the hills of Montefeltro.",
      },
      {
        id: "passoStreghe",
        name: "Passo delle Streghe",
        body: "An evocative rock-cut walkway linking Rocca Guaita to Rocca Cesta, with views suspended over the valley. Its name recalls the folk legends tied to Mount Titano.",
      },
      {
        id: "montale",
        name: "Third Tower · Montale Tower",
        body: "The smallest and least accessible of the Three Towers, built as a watch post and not open to visitors inside today. It marks the southernmost point of Mount Titano's ridge.",
      },
      {
        id: "chiesaSanFrancesco",
        name: "Chiesa di San Francesco",
        body: "One of San Marino's oldest places of worship, adjoining the former Franciscan convent that now houses the State Museum. It holds paintings from the Rimini and Marche schools.",
      },
      {
        id: "museoCuriosita",
        name: "Museum of Curiosities",
        body: "An unusual collection of records, inventions and curious objects from around the world, set in the heart of the historic centre. A visit suited to all ages, full of oddities and anecdotes.",
      },
      {
        id: "portaSanFrancesco",
        name: "Porta San Francesco",
        body: "One of the town's ancient fortified gateways, at the entrance to Piazzale Lo Stradone leading into the historic centre. Passing beneath the tower still carries the medieval atmosphere of the city walls.",
      },
    ],
    airportsLabel: "Airports",
    airports: {
      list: ["Rimini", "Ancona", "Forlì", "Bologna"],
      note: "A chauffeur-driven car rental service is available on request.",
    },
    reachLabel: "Getting around",
    reach: {
      transit: {
        title: "Public transport",
        body: "Bonelli Bus connects San Marino to Rimini's train station and airport with regular daytime services.",
      },
      taxi: {
        title: "Taxi",
        body: "For trips to airports or other destinations, Reception is happy to book a taxi or chauffeur service for you.",
      },
      walk: {
        title: "On foot",
        body: "The historic centre is pedestrian-only and just a few minutes from the hotel, through charming lanes and stairways: comfortable shoes are recommended.",
      },
    },
  },
  about: {
    label: "Information",
    intro: "The GHSM Group, upcoming events in San Marino, and all the Grand Hotel's contact details.",
    groupLabel: "GHSM Group",
    group: {
      intro: "GHSM Group has represented hospitality in San Marino since 1894.",
      titanoSuites: {
        name: "Titano Suites",
        body: "A late-19th-century palazzo in the heart of San Marino, home to the Montefeltro Suite with a hot tub on its panoramic terrace.",
      },
    },
    eventsLabel: "Events in San Marino",
    events: [
      {
        name: "Investiture of the Captains Regent",
        date: "April 1 and October 1",
        dates: [{ month: 4, day: 1 }, { month: 10, day: 1 }],
      },
      { name: "National Day", date: "September 3", dates: [{ month: 9, day: 3 }] },
      { name: "SMIAF", date: "First weeks of August" },
      { name: "San Marino Comics", date: "Last weeks of August" },
      { name: "Rally Legend", date: "Mid-October" },
      { name: "MotoGP", date: "Early September" },
      { name: "Christmas Markets", date: "Christmas season" },
    ],
    contactsLabel: "Address & Contacts",
  },
  services: {
    label: "All Services",
    quickLabel: "Quick access",
    backLabel: "All Services",
  },
  footer: "Grand Hotel San Marino",
  poweredBy: "Built by",
  privacyLabel: "Privacy",
};

const fr: HotelContent = {
  nav: {
    oggi: "Aujourd'hui",
    hotel: "Hôtel",
    dining: "Restaurant",
    wellness: "Bien-être",
    explore: "Saint-Marin",
  },
  common: {
    receptionCta: "Appeler la réception",
    receptionLabel: "Réception",
    languageLabel: "Langue",
    themeLabel: "Thème",
    status: {
      open: "Ouvert",
      closed: "Fermé",
      onRequest: "Sur demande",
      closesAt: "jusqu'à",
      opensAt: "rouvre à",
    },
    callLabel: "Appeler",
    bookLabel: "Réserver",
    menuLabel: "Voir le menu",
    navigateLabel: "Naviguer",
    openInMapsLabel: "Ouvrir dans Plans",
    addToCalendarLabel: "Ajouter au calendrier",
    callValetLabel: "Appeler le voiturier",
    reviewLabel: "Laissez-nous un avis",
    reviewGoogleLabel: "Google",
    reviewTripadvisorLabel: "Tripadvisor",
    youAreHere: "Votre hôtel",
    minWalk: "min à pied",
    byCar: "en voiture",
    airport: "Aéroport",
    floorGround: "Rez-de-chaussée",
    floorThird: "3e étage",
    floorThirdMessegue: "3e étage · Centre Mességué",
    floorBasement: "-1 · Garage",
    myLocationLabel: "Ma position",
    locationUnavailableLabel: "Position indisponible",
    listLabel: "Liste",
    filterAll: "Tout",
    filterPois: "À ne pas manquer",
    filterVenues: "Nos adresses",
    filterAirports: "Comment venir",
    counterOf: "sur",
  },
  home: {
    eyebrow: "Bienvenue au",
    titleMain: "Grand Hotel",
    titleAccent: "San Marino",
    stayLabel: "Votre séjour",
    welcomeTitle: "Nous vous souhaitons la bienvenue",
    welcomeBody:
      "Cette application est votre guide de séjour : demandez le room service, consultez les horaires des services, découvrez le restaurant et le spa, et explorez les incontournables de Saint-Marin.",
    checkIn: { label: "Arrivée", value: "À partir de 14h00" },
    checkOut: { label: "Départ", value: "Jusqu'à 11h00" },
    lateCheckout: "Départ tardif possible selon disponibilité, avec supplément.",
    nowLabel: "En ce moment",
    quickLabel: "Actions rapides",
    groupLabel: "Découvrez le GHSM Group",
    groupCategories: { wellness: "Bien-être", dining: "Restaurant", cafe: "Café", gelato: "Glacier", suites: "Suites", shop: "Boutique", bar: "Bar lounge" },
    quick: {
      wifi: {
        label: "Wi-Fi",
        value: "GRANDHOTELRSM",
        note: "Gratuit dans tout l'hôtel. Sélectionnez le réseau et attendez la page de connexion.",
        copyDone: "Copié",
      },
      breakfast: {
        label: "Petit-déjeuner",
        note: "Restaurant L'Arengo · 07h00 – 10h00. En chambre avec un supplément de 6,00 €.",
      },
      checkout: {
        label: "Départ",
        note: "Jusqu'à 11h00. Départ tardif sur demande à la réception.",
      },
      reception: {
        label: "Réception",
        note: "Ouverte 24h/24. Depuis le téléphone de la chambre, touche 9.",
      },
      tv: {
        label: "Chaînes TV",
        note: "37 chaînes disponibles dans la chambre, du n° 1 au 831.",
        cta: "Voir toutes les chaînes",
      },
    },
    askLabel: "Concierge digital",
    askBody: "Une question sur votre séjour ou sur Saint-Marin ? Demandez, je vous réponds tout de suite.",
    askCta: "Ouvrir le Concierge",
    highlightsLabel: "Actions rapides",
    highlightsSeeAll: "Tout voir",
    chatPlaceholder: "Posez votre question à notre Concierge digital…",
    highlights: [
      {
        title: "Wi-Fi",
        body: "Réseau GRANDHOTELRSM — sélectionnez-le, attendez la notification et connectez-vous gratuitement dans tout l'hôtel.",
      },
      {
        title: "Réception",
        body: "Ouverte 24h/24. Composez le 9 depuis le téléphone de la chambre pour toute demande.",
      },
      {
        title: "Petit-déjeuner",
        body: "Servi au Restaurant L'Arengo de 07h00 à 10h00. Room service disponible avec un supplément de 6,00 €.",
      },
    ],
    hotelsLabel: "Les hôtels du groupe GHSM",
    hotels: [
      { name: "Grand Hotel San Marino", description: "60 chambres et suites avec vue sur la vallée du Montefeltro.", url: "https://www.grandhotel.sm" },
      { name: "Hotel Titano", description: "Le charme de la fin du XIXe siècle au cœur de Saint-Marin.", url: "https://www.hoteltitano.com" },
      { name: "Titano Suites", description: "Suites design dans le centre historique de la République.", url: "https://www.titanosuiteshotel.com" },
    ],
  },
  room: {
    label: "Services en chambre",
    intro: "Tout le nécessaire pour un confort optimal : réception, room service, blanchisserie, Wi-Fi et chaînes TV.",
    servicesLabel: "Contacts et confort",
    services: [
      {
        title: "Réception et Room Service",
        subtitle: "Touche 9",
        body: "Pour toute demande, appelez la Réception ou le Room Service en composant le 9 depuis le téléphone de la chambre.",
      },
      {
        title: "Centre Mességué",
        subtitle: "Touche 471",
        body: "Pour informations et réservations au Centre Médical Maurice Mességué, composez le 471.",
      },
      {
        title: "Coffre-fort",
        subtitle: "Touche R + code + #",
        body: "Pour régler le coffre-fort, appuyez sur la touche R, saisissez un nouveau code personnel de 4 à 10 chiffres et confirmez avec la touche #.",
      },
      {
        title: "Climatisation",
        subtitle: "Panneau dans la chambre",
        body: "La climatisation se règle depuis le panneau de la chambre. Elle se coupe automatiquement à l'ouverture de la fenêtre.",
      },
      {
        title: "Ne pas déranger",
        subtitle: "Écriteau sur la poignée",
        body: "Pour ne pas être dérangé, accrochez l'écriteau prévu à cet effet à la poignée extérieure de la porte.",
      },
    ],
    roomServiceLabel: "Room Service",
    roomService: {
      body: "Petits-déjeuners, encas et repas peuvent être servis directement dans la chambre.",
      hours: "Tous les jours, 07h00 – 23h00",
      supplement: "Supplément de 6,00 € par commande.",
    },
    laundryLabel: "Blanchisserie",
    laundry: {
      body: "Les coûts et délais dépendent du type de tissu et de lavage demandé. Le formulaire de demande se trouve dans l'armoire de la chambre.",
      hours: "08h30 – 16h00",
    },
    wifiLabel: "Wi-Fi",
    wifi: {
      network: "GRANDHOTELRSM",
      body: "1. Ouvrez Réglages → Wi-Fi\n2. Sélectionnez le réseau GRANDHOTELRSM\n3. Touchez la notification d'enregistrement\n\nSi la notification n'apparaît pas, patientez quelques secondes.",
    },
    tvLabel: "Chaînes TV",
    tvIntro: "La sélection de chaînes disponibles dans la chambre :",
    channels: TV_CHANNELS,
    petsLabel: "Animaux de compagnie",
    pets: {
      body: "Les animaux de petite taille sont admis. Un supplément de 4,00 € par jour est prévu pour le nettoyage supplémentaire de la chambre.",
    },
  },
  facility: {
    label: "Services de l'établissement",
    intro: "Parking, concierge et les espaces de l'établissement — salle de sport et vélos — pour votre séjour à Saint-Marin.",
    parkingLabel: "Parking",
    garage: {
      title: "Garage privé",
      body: [
        "19,00 € par nuit.",
        "Service voiturier de 7h00 à 23h00 : nous vous conseillons de demander votre véhicule au moins 30 minutes à l'avance.",
        "Une borne de recharge pour véhicules électriques est disponible, avec supplément.",
      ],
    },
    publicParking: {
      title: "Parking public",
      body: "Des tickets à 6,00 € par jour sont disponibles à la Réception, valables jusqu'à minuit le lendemain dans les zones bleues.",
    },
    conciergeLabel: "Concierge",
    taxiLabel: "Taxi",
    taxi: {
      body: "Pour réserver un taxi, contactez la Réception en indiquant la date, l'heure, le nombre de personnes, le type de véhicule souhaité et la destination.",
    },
    wakeUpLabel: "Réveil",
    wakeUp: {
      body: "Pour demander un réveil, contactez la Réception en composant le 9.",
    },
    cardLabel: "TuttoSanMarino Card",
    card: {
      body: "La carte TuttoSanMarino offre des réductions dans les musées, boutiques et restaurants partenaires. Elle peut être demandée à la Réception.",
    },
    hairdresserLabel: "Coiffeur",
    hairdresser: {
      body: "La Réception se tient à votre disposition pour toute information sur les salons de coiffure à proximité.",
    },
    meetingsLabel: "Salles de réunion",
    meetings: {
      body: "Le Grand Hotel San Marino dispose de 5 salles de réunion modulables, pour des événements de 2 à 200 personnes, avec équipements technologiques et un personnel qualifié à disposition pour organiser réunions sur mesure, petits-déjeuners et dîners de travail, événements privés, célébrations et banquets.",
    },
    gymLabel: "Salle de sport",
    gym: {
      body: "Une petite salle de sport donnant sur la vallée du Montefeltro, avec des équipements fitness de base, située au sein du Centre Mességué au 3e étage. Accès libre, sans réservation, de 08h00 à 20h00.",
    },
    contactsLabel: "Contact et localisation",
  },
  dining: {
    label: "Restaurant",
    intro: "La cuisine du Grand Hotel San Marino et les autres adresses du groupe GHSM. Pour le Room Service directement en chambre, consultez la section Hôtel.",
    arengoLabel: "Restaurant L'Arengo",
    arengo: {
      hours: [
        { label: "Petit-déjeuner", value: "07h00 – 10h00" },
        { label: "Déjeuner", value: "12h00 – 14h30" },
        { label: "Dîner", value: "19h00 – 21h30" },
      ],
      paragraphs: [
        "Le pain et les pâtes sont faits maison, grâce au travail de nos Chef Pâtissier et Chef Pastaio dédiés.",
        "En cuisine se transmettent les recettes de la tradition locale : lasagnes, raviolis et tortellacci préparés selon des recettes familiales.",
        "Sur demande, des menus spéciaux hypocaloriques ou adaptés aux intolérances alimentaires et pathologies particulières sont disponibles, grâce à la synergie avec le Centre Médical Mességué et à l'utilisation de matières premières d'origine certifiée.",
      ],
      reservation: "La réservation est recommandée.",
    },
    groupLabel: "Le groupe GHSM",
    groupIntro:
      "Le Grand Hotel San Marino fait partie du GHSM Group, qui représente l'hospitalité à Saint-Marin depuis 1894. Voici les autres adresses du groupe où manger et boire.",
    venues: [
      {
        id: "laTerrazza",
        name: "Restaurant La Terrazza",
        body: "Dîner entre les créneaux d'une tour médiévale, suspendu entre ciel et terre, avec un horizon qui s'étend à perte de vue — La Terrazza est une expérience que peu d'endroits au monde peuvent offrir. Cuisine gastronomique de haut niveau avec des produits locaux.",
      },
      {
        id: "caffeTitano",
        name: "Caffè Titano",
        body: "En venant à Saint-Marin, impossible de ne pas s'y arrêter : en plein centre historique, donnant sur une charmante petite place médiévale, dans l'un des coins les plus pittoresques de la vieille ville.",
      },
      {
        id: "cremeria",
        name: "La Cremeria del Titano",
        body: "Juste à côté du Caffè Titano. Ouvert pendant les mois les plus chauds, pour une pause fraîche et gourmande accompagnée d'une bonne glace artisanale.",
      },
      {
        id: "laLoggia",
        name: "La Loggia",
        body: "Un bar lounge et une boutique au cœur du centre historique, sur la Piazzetta Garibaldi : fromages, charcuteries et planches, vins et vermouths artisanaux, douceurs typiques saint-marinaises et bières locales, sélectionnés pour raconter les saveurs les plus authentiques de notre terre.",
      },
    ],
  },
  wellness: {
    label: "Bien-être",
    intro: "Le Centre Médical Maurice Mességué et la liste des soins pour votre détente.",
    messegueLabel: "Centre Médical Maurice Mességué",
    messegue: {
      paragraphs: [
        "Depuis plus de 30 ans, le Centre Médical Maurice Mességué est une référence italienne pour la santé, l'amincissement et les vacances bien-être : une clinique minceur et une oasis de santé qui allie régime, activité physique et soins phytothérapiques.",
        "Le centre propose des soins esthétiques pour le visage et le corps, avec des formulations spécialisées et des rituels de remise en forme sur mesure pour chaque hôte.",
      ],
      quote: "C'est la nature qui a raison.",
      quoteAuthor: "Maurice Mességué",
      callNote: "Pour informations et réservations, composez le 471 depuis le téléphone de la chambre.",
    },
    priceListLabel: "Liste des soins",
    priceListNote: "Prix et durées des soins disponibles au Centre Mességué.",
    massages: [
      { name: "Massage relaxant", variants: [{ duration: "30'", price: "50,00 €" }] },
      { name: "Massage décontractant", variants: [{ duration: "50'", price: "90,00 €" }] },
      { name: "Massage classique", variants: [{ duration: "30'", price: "50,00 €" }] },
      {
        name: "Massage en duo",
        variants: [
          { duration: "30'", price: "95,00 €" },
          { duration: "50'", price: "165,00 €" },
        ],
      },
      { name: "Hot-Stone", variants: [{ duration: "50'", price: "90,00 €" }] },
      { name: "Massage ayurvédique", variants: [{ duration: "50'", price: "90,00 €" }] },
      { name: "Massage à l'argile verte", variants: [{ duration: "75'", price: "145,00 €" }] },
      {
        name: "Drainage lymphatique",
        variants: [
          { label: "Visage", duration: "30'", price: "45,00 €" },
          { label: "Corps", duration: "50'", price: "90,00 €" },
        ],
      },
      { name: "Épilation partielle", variants: [{ price: "40,00 €" }] },
      { name: "Épilation totale jambes", variants: [{ price: "55,00 €" }] },
      { name: "Nettoyage du visage", variants: [{ duration: "60'", price: "75,00 €" }] },
      { name: "Soin Anti-Age classique", variants: [{ duration: "45'", price: "104,00 €" }] },
      { name: "Lift Summum (Anti-Age Plus)", variants: [{ duration: "50'", price: "135,00 €" }] },
      { name: "Radiofréquence (Anti-Age Deluxe)", variants: [{ duration: "75'", price: "135,00 €" }] },
      { name: "Manucure", variants: [{ price: "38,00 €" }] },
      { name: "Pédicure", variants: [{ price: "48,00 €" }] },
    ],
  },
  info: {
    label: "Explorer",
    intro: "La carte de la zone, les adresses du groupe GHSM, les lieux à ne pas manquer à Saint-Marin et comment se déplacer en ville.",
    sheetLabel: "Infos & contacts",
    ghsmLabel: "Adresses GHSM à proximité",
    poiLabel: "À ne pas manquer à Saint-Marin",
    pois: [
      {
        id: "palazzoPubblico",
        name: "Palazzo Pubblico",
        body: "Le palais du Gouvernement, siège des institutions de la République, domine la Piazza della Libertà. Un parcours de visite raconte l'histoire institutionnelle de Saint-Marin.",
      },
      {
        id: "basilica",
        name: "Basilica del Santo",
        body: "De style néoclassique, elle conserve les reliques de saint Marin, le saint qui a donné naissance à la plus ancienne République du monde.",
      },
      {
        id: "museoStato",
        name: "Musée d'État",
        body: "Il rassemble des vestiges archéologiques, des œuvres d'art et des témoignages historiques de la République, de la préhistoire à l'époque moderne.",
      },
      {
        id: "guaita",
        name: "Première Tour · Forteresse Guaita",
        body: "La plus ancienne et la plus célèbre des Trois Tours, construite au XIe siècle. Depuis les chemins de ronde, la vue s'étend jusqu'à la mer Adriatique.",
      },
      {
        id: "cesta",
        name: "Deuxième Tour · Forteresse Cesta",
        body: "Elle abrite le Musée des Armes Anciennes, avec une collection d'armures et d'armes du XIIe au XIXe siècle.",
      },
      {
        id: "funivia",
        name: "Téléphérique de Saint-Marin",
        body: "Il relie en quelques minutes le centre historique à Borgo Maggiore, avec une vue panoramique sur la vallée du Montefeltro.",
      },
      {
        id: "cavaBalestrieri",
        name: "Cava dei Balestrieri",
        body: "Une vaste terrasse verdoyante derrière la Piazza della Libertà, siège historique des démonstrations de la Fédération des Arbalétriers de Saint-Marin. La vue s'y étend sur les collines du Montefeltro.",
      },
      {
        id: "passoStreghe",
        name: "Passo delle Streghe",
        body: "Un chemin évocateur taillé dans la roche, reliant la forteresse Guaita à la forteresse Cesta, avec des vues suspendues sur la vallée. Son nom rappelle les légendes populaires liées au mont Titano.",
      },
      {
        id: "montale",
        name: "Troisième Tour · Tour Montale",
        body: "La plus petite et la moins accessible des Trois Tours, construite comme poste de guet et aujourd'hui fermée à la visite intérieure. Elle marque le point le plus méridional de la crête du mont Titano.",
      },
      {
        id: "chiesaSanFrancesco",
        name: "Chiesa di San Francesco",
        body: "L'un des plus anciens lieux de culte de Saint-Marin, attenant à l'ancien couvent franciscain qui abrite aujourd'hui le Musée d'État. Elle conserve des œuvres picturales des écoles de Rimini et des Marches.",
      },
      {
        id: "museoCuriosita",
        name: "Musée des Curiosités",
        body: "Une collection insolite de records, d'inventions et d'objets curieux venus du monde entier, installée au cœur du centre historique. Un parcours adapté à tous les âges, entre bizarreries et anecdotes.",
      },
      {
        id: "portaSanFrancesco",
        name: "Porta San Francesco",
        body: "L'une des anciennes portes fortifiées du bourg, à l'entrée de la Piazzale Lo Stradone menant au centre historique. Le passage sous la tour conserve encore l'atmosphère médiévale des remparts de la ville.",
      },
    ],
    airportsLabel: "Aéroports",
    airports: {
      list: ["Rimini", "Ancône", "Forlì", "Bologne"],
      note: "Un service de location de voiture avec chauffeur est disponible sur demande.",
    },
    reachLabel: "Comment se déplacer",
    reach: {
      transit: {
        title: "Transports publics",
        body: "Bonelli Bus relie Saint-Marin à la gare ferroviaire et à l'aéroport de Rimini avec des liaisons régulières en journée.",
      },
      taxi: {
        title: "Taxi",
        body: "Pour se rendre à l'aéroport ou dans d'autres localités, la Réception est à votre disposition pour réserver un taxi ou un service avec chauffeur.",
      },
      walk: {
        title: "À pied",
        body: "Le centre historique est piétonnier et se rejoint depuis l'hôtel en quelques minutes, entre ruelles et escaliers typiques : des chaussures confortables sont recommandées.",
      },
    },
  },
  about: {
    label: "Informations",
    intro: "Le groupe GHSM, les événements à Saint-Marin et tous les contacts du Grand Hotel.",
    groupLabel: "GHSM Group",
    group: {
      intro: "GHSM Group représente l'hospitalité à Saint-Marin depuis 1894.",
      titanoSuites: {
        name: "Titano Suites",
        body: "Un palais de la fin du XIXe siècle au cœur de Saint-Marin, qui abrite la Suite Montefeltro avec bain à remous sur sa terrasse panoramique.",
      },
    },
    eventsLabel: "Événements à Saint-Marin",
    events: [
      {
        name: "Investiture des Capitaines Régents",
        date: "1er avril et 1er octobre",
        dates: [{ month: 4, day: 1 }, { month: 10, day: 1 }],
      },
      { name: "Fête Nationale", date: "3 septembre", dates: [{ month: 9, day: 3 }] },
      { name: "SMIAF", date: "Premières semaines d'août" },
      { name: "San Marino Comics", date: "Dernières semaines d'août" },
      { name: "Rally Legend", date: "Mi-octobre" },
      { name: "MotoGP", date: "Début septembre" },
      { name: "Marchés de Noël", date: "Période de Noël" },
    ],
    contactsLabel: "Adresse et contacts",
  },
  services: {
    label: "Tous les services",
    quickLabel: "Accès rapide",
    backLabel: "Tous les services",
  },
  footer: "Grand Hotel San Marino",
  poweredBy: "Créée par",
  privacyLabel: "Confidentialité",
};

const de: HotelContent = {
  nav: {
    oggi: "Heute",
    hotel: "Hotel",
    dining: "Restaurant",
    wellness: "Wellness",
    explore: "San Marino",
  },
  common: {
    receptionCta: "Rezeption anrufen",
    receptionLabel: "Rezeption",
    languageLabel: "Sprache",
    themeLabel: "Thema",
    status: {
      open: "Geöffnet",
      closed: "Geschlossen",
      onRequest: "Auf Anfrage",
      closesAt: "bis",
      opensAt: "öffnet wieder um",
    },
    callLabel: "Anrufen",
    bookLabel: "Buchen",
    menuLabel: "Speisekarte ansehen",
    navigateLabel: "Navigieren",
    openInMapsLabel: "In Karten öffnen",
    addToCalendarLabel: "Zum Kalender hinzufügen",
    callValetLabel: "Voiturier anrufen",
    reviewLabel: "Hinterlassen Sie uns eine Bewertung",
    reviewGoogleLabel: "Google",
    reviewTripadvisorLabel: "Tripadvisor",
    youAreHere: "Ihr Hotel",
    minWalk: "Min. zu Fuß",
    byCar: "mit dem Auto",
    airport: "Flughafen",
    floorGround: "Erdgeschoss",
    floorThird: "3. Stock",
    floorThirdMessegue: "3. Stock · Mességué-Zentrum",
    floorBasement: "-1 · Garage",
    myLocationLabel: "Mein Standort",
    locationUnavailableLabel: "Standort nicht verfügbar",
    listLabel: "Liste",
    filterAll: "Alle",
    filterPois: "Sehenswürdigkeiten",
    filterVenues: "Unsere Adressen",
    filterAirports: "Anreise",
    counterOf: "von",
  },
  home: {
    eyebrow: "Willkommen im",
    titleMain: "Grand Hotel",
    titleAccent: "San Marino",
    stayLabel: "Ihr Aufenthalt",
    welcomeTitle: "Herzlich willkommen",
    welcomeBody:
      "Diese App ist Ihr Begleiter für den Aufenthalt: bestellen Sie den Zimmerservice, sehen Sie die Öffnungszeiten der Services ein, entdecken Sie Restaurant und Spa und erfahren Sie, was San Marino zu bieten hat.",
    checkIn: { label: "Check-in", value: "Ab 14:00 Uhr" },
    checkOut: { label: "Check-out", value: "Bis 11:00 Uhr" },
    lateCheckout: "Später Check-out je nach Verfügbarkeit gegen Aufpreis.",
    nowLabel: "Gerade jetzt",
    quickLabel: "Schnellzugriff",
    groupLabel: "Entdecken Sie die GHSM Group",
    groupCategories: { wellness: "Wellness", dining: "Restaurant", cafe: "Café", gelato: "Eisdiele", suites: "Suiten", shop: "Boutique", bar: "Lounge-Bar" },
    quick: {
      wifi: {
        label: "Wi-Fi",
        value: "GRANDHOTELRSM",
        note: "Kostenlos im gesamten Hotel. Wählen Sie das Netzwerk aus und warten Sie auf die Anmeldeseite.",
        copyDone: "Kopiert",
      },
      breakfast: {
        label: "Frühstück",
        note: "Restaurant L'Arengo · 07:00 – 10:00 Uhr. Auf dem Zimmer gegen Aufpreis von 6,00 €.",
      },
      checkout: {
        label: "Check-out",
        note: "Bis 11:00 Uhr. Später Check-out auf Anfrage an der Rezeption.",
      },
      reception: {
        label: "Rezeption",
        note: "Rund um die Uhr geöffnet. Vom Zimmertelefon aus Taste 9 wählen.",
      },
      tv: {
        label: "TV-Sender",
        note: "37 Sender im Zimmer verfügbar, von Nr. 1 bis 831.",
        cta: "Alle Sender ansehen",
      },
    },
    askLabel: "Digitaler Concierge",
    askBody: "Eine Frage zu Ihrem Aufenthalt oder zu San Marino? Fragen Sie einfach, ich antworte sofort.",
    askCta: "Concierge öffnen",
    highlightsLabel: "Schnellzugriff",
    highlightsSeeAll: "Alle anzeigen",
    chatPlaceholder: "Fragen Sie unseren digitalen Concierge…",
    highlights: [
      {
        title: "Wi-Fi",
        body: "Netzwerk GRANDHOTELRSM – auswählen, auf die Benachrichtigung warten und sich kostenlos im gesamten Hotel verbinden.",
      },
      {
        title: "Rezeption",
        body: "Rund um die Uhr geöffnet. Wählen Sie für jedes Anliegen die Taste 9 am Zimmertelefon.",
      },
      {
        title: "Frühstück",
        body: "Serviert im Restaurant L'Arengo von 07:00 bis 10:00 Uhr. Zimmerservice gegen Aufpreis von 6,00 € verfügbar.",
      },
    ],
    hotelsLabel: "Die Hotels der GHSM Group",
    hotels: [
      { name: "Grand Hotel San Marino", description: "60 Zimmer und Suiten mit Blick auf das Montefeltro-Tal.", url: "https://www.grandhotel.sm" },
      { name: "Hotel Titano", description: "Der Charme des ausgehenden 19. Jahrhunderts im Herzen von San Marino.", url: "https://www.hoteltitano.com" },
      { name: "Titano Suites", description: "Design-Suiten in der Altstadt der Republik.", url: "https://www.titanosuiteshotel.com" },
    ],
  },
  room: {
    label: "Zimmerservice",
    intro: "Alles für höchsten Komfort: Rezeption, Zimmerservice, Wäscheservice, WLAN und TV-Sender.",
    servicesLabel: "Kontakte & Komfort",
    services: [
      {
        title: "Rezeption und Zimmerservice",
        subtitle: "Taste 9",
        body: "Wählen Sie bei jedem Anliegen Taste 9 am Zimmertelefon, um Rezeption oder Zimmerservice zu erreichen.",
      },
      {
        title: "Mességué-Zentrum",
        subtitle: "Taste 471",
        body: "Für Informationen und Buchungen im Maurice-Mességué-Gesundheitszentrum wählen Sie die 471.",
      },
      {
        title: "Safe",
        subtitle: "Taste R + Code + #",
        body: "Um den Safe einzustellen, drücken Sie die Taste R, geben Sie einen neuen persönlichen Code aus 4-10 Ziffern ein und bestätigen Sie mit der Taste #.",
      },
      {
        title: "Klimaanlage",
        subtitle: "Bedienfeld im Zimmer",
        body: "Die Klimaanlage wird über das Bedienfeld im Zimmer geregelt. Sie schaltet sich automatisch aus, sobald das Fenster geöffnet wird.",
      },
      {
        title: "Bitte nicht stören",
        subtitle: "Türanhänger",
        body: "Um nicht gestört zu werden, hängen Sie das entsprechende Schild an die Außenklinke der Tür.",
      },
    ],
    roomServiceLabel: "Zimmerservice",
    roomService: {
      body: "Frühstück, Snacks und Mahlzeiten können direkt auf das Zimmer serviert werden.",
      hours: "Täglich, 07:00 – 23:00 Uhr",
      supplement: "Aufpreis von 6,00 € pro Bestellung.",
    },
    laundryLabel: "Wäscheservice",
    laundry: {
      body: "Kosten und Bearbeitungszeiten hängen von Stoffart und gewünschter Wäsche ab. Das Anfrageformular finden Sie im Kleiderschrank des Zimmers.",
      hours: "08:30 – 16:00 Uhr",
    },
    wifiLabel: "Wi-Fi",
    wifi: {
      network: "GRANDHOTELRSM",
      body: "1. Öffnen Sie Einstellungen → WLAN\n2. Wählen Sie das Netzwerk GRANDHOTELRSM\n3. Tippen Sie auf die Anmeldebenachrichtigung\n\nWenn die Benachrichtigung nicht erscheint, warten Sie einige Sekunden.",
    },
    tvLabel: "TV-Sender",
    tvIntro: "Die im Zimmer verfügbaren Sender:",
    channels: TV_CHANNELS,
    petsLabel: "Haustiere",
    pets: {
      body: "Kleine Haustiere sind willkommen. Für die zusätzliche Zimmerreinigung wird ein Aufpreis von 4,00 € pro Tag berechnet.",
    },
  },
  facility: {
    label: "Hoteleinrichtungen",
    intro: "Parkplatz, Concierge und die hoteleigenen Bereiche – Fitnessraum und Fahrräder – für Ihren Aufenthalt in San Marino.",
    parkingLabel: "Parkplatz",
    garage: {
      title: "Privatgarage",
      body: [
        "19,00 € pro Nacht.",
        "Voiturier-Service von 7:00 bis 23:00 Uhr: Bitte fordern Sie Ihr Fahrzeug mindestens 30 Minuten im Voraus an.",
        "Eine Ladestation für Elektrofahrzeuge steht gegen Aufpreis zur Verfügung.",
      ],
    },
    publicParking: {
      title: "Öffentlicher Parkplatz",
      body: "Tickets zu 6,00 € pro Tag sind an der Rezeption erhältlich, gültig bis Mitternacht des Folgetags in den blauen Parkzonen.",
    },
    conciergeLabel: "Concierge",
    taxiLabel: "Taxi",
    taxi: {
      body: "Um ein Taxi zu buchen, wenden Sie sich an die Rezeption und geben Sie Datum, Uhrzeit, Personenzahl, gewünschten Fahrzeugtyp und Ziel an.",
    },
    wakeUpLabel: "Weckruf",
    wakeUp: {
      body: "Für einen Weckruf wenden Sie sich an die Rezeption unter Taste 9.",
    },
    cardLabel: "TuttoSanMarino Card",
    card: {
      body: "Die TuttoSanMarino Card bietet Ermäßigungen in Partnermuseen, -geschäften und -restaurants. Die Karte kann an der Rezeption angefragt werden.",
    },
    hairdresserLabel: "Friseur",
    hairdresser: {
      body: "Die Rezeption informiert Sie gerne über Friseursalons in der Nähe.",
    },
    meetingsLabel: "Tagungsräume",
    meetings: {
      body: "Das Grand Hotel San Marino verfügt über 5 modulare Tagungsräume für Veranstaltungen von 2 bis 200 Personen, mit technischer Ausstattung und qualifiziertem Personal, das maßgeschneiderte Meetings, Arbeitsfrühstücke und -abendessen, private Veranstaltungen, Feiern und Bankette organisiert.",
    },
    gymLabel: "Fitnessraum",
    gym: {
      body: "Ein kleiner Fitnessraum mit Blick auf das Montefeltro-Tal und grundlegenden Fitnessgeräten, im Mességué-Zentrum im 3. Stock. Freier Zugang ohne Reservierung, von 08:00 bis 20:00 Uhr.",
    },
    contactsLabel: "Kontakt und Standort",
  },
  dining: {
    label: "Restaurant",
    intro: "Die Küche des Grand Hotel San Marino und die weiteren Adressen der GHSM Group. Für den Zimmerservice direkt aufs Zimmer siehe den Bereich Hotel.",
    arengoLabel: "Restaurant L'Arengo",
    arengo: {
      hours: [
        { label: "Frühstück", value: "07:00 – 10:00 Uhr" },
        { label: "Mittagessen", value: "12:00 – 14:30 Uhr" },
        { label: "Abendessen", value: "19:00 – 21:30 Uhr" },
      ],
      paragraphs: [
        "Brot und Pasta werden im Haus hergestellt, dank der Arbeit unserer eigenen Konditor- und Pasta-Chefs.",
        "In der Küche werden die Rezepte der lokalen Tradition weitergegeben: Lasagne, Ravioli und Tortellacci nach Familienrezepten zubereitet.",
        "Auf Anfrage sind spezielle kalorienarme Menüs oder Menüs für Lebensmittelunverträglichkeiten und besondere Erkrankungen erhältlich, dank der Zusammenarbeit mit dem Mességué-Gesundheitszentrum und der Verwendung zertifizierter Zutaten.",
      ],
      reservation: "Eine Reservierung wird empfohlen.",
    },
    groupLabel: "Die GHSM Group",
    groupIntro:
      "Das Grand Hotel San Marino gehört zur GHSM Group, die seit 1894 für Gastfreundschaft in San Marino steht. Hier sind die weiteren Adressen der Gruppe zum Essen und Trinken.",
    venues: [
      {
        id: "laTerrazza",
        name: "Restaurant La Terrazza",
        body: "Dinieren zwischen den Zinnen eines mittelalterlichen Turms, schwebend zwischen Himmel und Erde, mit einem Horizont, der sich endlos erstreckt — La Terrazza bietet ein Erlebnis, das nur wenige Orte der Welt bieten können. Hochwertige Küche mit regionalen Produkten.",
      },
      {
        id: "caffeTitano",
        name: "Caffè Titano",
        body: "Bei einem Besuch in San Marino darf ein Halt hier nicht fehlen: mitten in der Altstadt, mit Blick auf einen malerischen mittelalterlichen Platz, an einer der schönsten Ecken der Altstadt.",
      },
      {
        id: "cremeria",
        name: "La Cremeria del Titano",
        body: "Direkt neben dem Caffè Titano. In den wärmeren Monaten geöffnet, für eine erfrischende und köstliche Pause mit handwerklich hergestelltem Eis.",
      },
      {
        id: "laLoggia",
        name: "La Loggia",
        body: "Eine Lounge-Bar und Boutique im Herzen der Altstadt, an der Piazzetta Garibaldi: Käse, Wurstwaren und Vesperplatten, handwerklich hergestellte Weine und Wermut, typische sammarinesische Süßigkeiten und lokale Craft-Biere, ausgewählt, um die authentischsten Aromen unserer Heimat zu erzählen.",
      },
    ],
  },
  wellness: {
    label: "Wellness",
    intro: "Das Maurice-Mességué-Gesundheitszentrum und die Behandlungsliste für Ihre Entspannung.",
    messegueLabel: "Maurice-Mességué-Gesundheitszentrum",
    messegue: {
      paragraphs: [
        "Seit über 30 Jahren ist das Maurice-Mességué-Gesundheitszentrum ein italienischer Bezugspunkt für Gesundheit, Abnehmen und Wellnessurlaub: eine Schlankheitsklinik und eine Gesundheitsoase, die Diät, körperliche Aktivität und Phytotherapie vereint.",
        "Das Zentrum bietet kosmetische Behandlungen für Gesicht und Körper, mit spezialisierten Formulierungen und maßgeschneiderten Remise-en-forme-Ritualen für jeden Gast.",
      ],
      quote: "Die Natur hat immer recht.",
      quoteAuthor: "Maurice Mességué",
      callNote: "Für Informationen und Buchungen wählen Sie die 471 am Zimmertelefon.",
    },
    priceListLabel: "Preisliste der Behandlungen",
    priceListNote: "Preise und Dauer der im Mességué-Zentrum verfügbaren Behandlungen.",
    massages: [
      { name: "Entspannungsmassage", variants: [{ duration: "30'", price: "50,00 €" }] },
      { name: "Lösende Massage", variants: [{ duration: "50'", price: "90,00 €" }] },
      { name: "Klassische Massage", variants: [{ duration: "30'", price: "50,00 €" }] },
      {
        name: "Paarmassage",
        variants: [
          { duration: "30'", price: "95,00 €" },
          { duration: "50'", price: "165,00 €" },
        ],
      },
      { name: "Hot-Stone", variants: [{ duration: "50'", price: "90,00 €" }] },
      { name: "Ayurvedische Massage", variants: [{ duration: "50'", price: "90,00 €" }] },
      { name: "Grüne-Tonerde-Massage", variants: [{ duration: "75'", price: "145,00 €" }] },
      {
        name: "Lymphdrainage",
        variants: [
          { label: "Gesicht", duration: "30'", price: "45,00 €" },
          { label: "Körper", duration: "50'", price: "90,00 €" },
        ],
      },
      { name: "Teilenthaarung", variants: [{ price: "40,00 €" }] },
      { name: "Ganzbeinenthaarung", variants: [{ price: "55,00 €" }] },
      { name: "Gesichtsreinigung", variants: [{ duration: "60'", price: "75,00 €" }] },
      { name: "Klassische Anti-Age-Behandlung", variants: [{ duration: "45'", price: "104,00 €" }] },
      { name: "Lift Summum (Anti-Age Plus)", variants: [{ duration: "50'", price: "135,00 €" }] },
      { name: "Radiofrequenz (Anti-Age Deluxe)", variants: [{ duration: "75'", price: "135,00 €" }] },
      { name: "Maniküre", variants: [{ price: "38,00 €" }] },
      { name: "Pediküre", variants: [{ price: "48,00 €" }] },
    ],
  },
  info: {
    label: "Entdecken",
    intro: "Die Karte der Umgebung, die Adressen der GHSM Group, die Sehenswürdigkeiten in San Marino und wie man sich in der Stadt fortbewegt.",
    sheetLabel: "Infos & Kontakt",
    ghsmLabel: "GHSM-Adressen in der Nähe",
    poiLabel: "Sehenswürdigkeiten in San Marino",
    pois: [
      {
        id: "palazzoPubblico",
        name: "Palazzo Pubblico",
        body: "Der Regierungspalast, Sitz der Institutionen der Republik, überragt die zentrale Piazza della Libertà. Ein Rundgang erzählt die institutionelle Geschichte San Marinos.",
      },
      {
        id: "basilica",
        name: "Basilica del Santo",
        body: "Im neoklassizistischen Stil erbaut, bewahrt sie die Reliquien des heiligen Marinus, der der ältesten Republik der Welt ihren Namen gab.",
      },
      {
        id: "museoStato",
        name: "Staatsmuseum",
        body: "Es beherbergt archäologische Funde, Kunstwerke und historische Zeugnisse der Republik, von der Vorgeschichte bis in die Neuzeit.",
      },
      {
        id: "guaita",
        name: "Erster Turm · Festung Guaita",
        body: "Der älteste und berühmteste der Drei Türme, erbaut im 11. Jahrhundert. Von den Wehrgängen reicht der Blick bis zur Adria.",
      },
      {
        id: "cesta",
        name: "Zweiter Turm · Festung Cesta",
        body: "Hier befindet sich das Museum der antiken Waffen mit einer Sammlung von Rüstungen und Waffen vom 12. bis 19. Jahrhundert.",
      },
      {
        id: "funivia",
        name: "Seilbahn von San Marino",
        body: "Sie verbindet die Altstadt in wenigen Minuten mit Borgo Maggiore und bietet einen Panoramablick auf das Montefeltro-Tal.",
      },
      {
        id: "cavaBalestrieri",
        name: "Cava dei Balestrieri",
        body: "Eine weite grüne Terrasse hinter der Piazza della Libertà, historischer Schauplatz der Vorführungen der Armbrustschützen-Vereinigung San Marinos. Von hier reicht der Blick über die Hügel des Montefeltro.",
      },
      {
        id: "passoStreghe",
        name: "Passo delle Streghe",
        body: "Ein stimmungsvoller, in den Fels gehauener Weg, der die Festung Guaita mit der Festung Cesta verbindet, mit schwebenden Ausblicken auf das Tal. Sein Name erinnert an die Volkslegenden rund um den Monte Titano.",
      },
      {
        id: "montale",
        name: "Dritter Turm · Turm Montale",
        body: "Der kleinste und am wenigsten zugängliche der Drei Türme, einst als Wachposten errichtet und heute im Inneren nicht zugänglich. Er markiert den südlichsten Punkt des Kamms des Monte Titano.",
      },
      {
        id: "chiesaSanFrancesco",
        name: "Chiesa di San Francesco",
        body: "Eines der ältesten Gotteshäuser San Marinos, angrenzend an das ehemalige Franziskanerkloster, in dem heute das Staatsmuseum untergebracht ist. Sie bewahrt Gemälde der Schulen von Rimini und der Marken.",
      },
      {
        id: "museoCuriosita",
        name: "Kuriositätenmuseum",
        body: "Eine ungewöhnliche Sammlung von Rekorden, Erfindungen und kuriosen Objekten aus aller Welt, mitten in der Altstadt untergebracht. Ein Rundgang für jedes Alter, voller Kuriositäten und Anekdoten.",
      },
      {
        id: "portaSanFrancesco",
        name: "Porta San Francesco",
        body: "Eines der alten befestigten Stadttore, am Eingang zur Piazzale Lo Stradone, die in die Altstadt führt. Der Durchgang unter dem Turm bewahrt noch die mittelalterliche Atmosphäre der Stadtmauern.",
      },
    ],
    airportsLabel: "Flughäfen",
    airports: {
      list: ["Rimini", "Ancona", "Forlì", "Bologna"],
      note: "Auf Anfrage steht ein Mietwagenservice mit Fahrer zur Verfügung.",
    },
    reachLabel: "Fortbewegung",
    reach: {
      transit: {
        title: "Öffentliche Verkehrsmittel",
        body: "Bonelli Bus verbindet San Marino tagsüber mit regelmäßigen Fahrten mit dem Bahnhof und dem Flughafen von Rimini.",
      },
      taxi: {
        title: "Taxi",
        body: "Für Fahrten zu Flughäfen oder anderen Orten steht Ihnen die Rezeption zur Verfügung, um ein Taxi oder einen Fahrdienst zu buchen.",
      },
      walk: {
        title: "Zu Fuß",
        body: "Die Altstadt ist eine Fußgängerzone und vom Hotel aus in wenigen Minuten über charakteristische Gassen und Treppen erreichbar: bequeme Schuhe werden empfohlen.",
      },
    },
  },
  about: {
    label: "Informationen",
    intro: "Die GHSM Group, die anstehenden Veranstaltungen in San Marino und alle Kontaktdaten des Grand Hotel.",
    groupLabel: "GHSM Group",
    group: {
      intro: "Die GHSM Group steht seit 1894 für Gastfreundschaft in San Marino.",
      titanoSuites: {
        name: "Titano Suites",
        body: "Ein Palazzo aus dem späten 19. Jahrhundert im Herzen San Marinos, der die Suite Montefeltro mit Whirlpool auf der Panoramaterrasse beherbergt.",
      },
    },
    eventsLabel: "Veranstaltungen in San Marino",
    events: [
      {
        name: "Investitur der Kapitänsregenten",
        date: "1. April und 1. Oktober",
        dates: [{ month: 4, day: 1 }, { month: 10, day: 1 }],
      },
      { name: "Nationalfeiertag", date: "3. September", dates: [{ month: 9, day: 3 }] },
      { name: "SMIAF", date: "Erste Augustwochen" },
      { name: "San Marino Comics", date: "Letzte Augustwochen" },
      { name: "Rally Legend", date: "Mitte Oktober" },
      { name: "MotoGP", date: "Anfang September" },
      { name: "Weihnachtsmärkte", date: "Weihnachtszeit" },
    ],
    contactsLabel: "Adresse & Kontakte",
  },
  services: {
    label: "Alle Services",
    quickLabel: "Schnellzugriff",
    backLabel: "Alle Services",
  },
  footer: "Grand Hotel San Marino",
  poweredBy: "Erstellt von",
  privacyLabel: "Datenschutz",
};

const es: HotelContent = {
  nav: {
    oggi: "Hoy",
    hotel: "Hotel",
    dining: "Restaurante",
    wellness: "Bienestar",
    explore: "San Marino",
  },
  common: {
    receptionCta: "Llamar a recepción",
    receptionLabel: "Recepción",
    languageLabel: "Idioma",
    themeLabel: "Tema",
    status: {
      open: "Abierto",
      closed: "Cerrado",
      onRequest: "Bajo petición",
      closesAt: "hasta las",
      opensAt: "reabre a las",
    },
    callLabel: "Llamar",
    bookLabel: "Reservar",
    menuLabel: "Ver el menú",
    navigateLabel: "Navegar",
    openInMapsLabel: "Abrir en Mapas",
    addToCalendarLabel: "Añadir al calendario",
    callValetLabel: "Llamar al valet",
    reviewLabel: "Déjanos una reseña",
    reviewGoogleLabel: "Google",
    reviewTripadvisorLabel: "Tripadvisor",
    youAreHere: "Su hotel",
    minWalk: "min a pie",
    byCar: "en coche",
    airport: "Aeropuerto",
    floorGround: "Planta baja",
    floorThird: "3ª planta",
    floorThirdMessegue: "3ª planta · Centro Mességué",
    floorBasement: "-1 · Garaje",
    myLocationLabel: "Mi ubicación",
    locationUnavailableLabel: "Ubicación no disponible",
    listLabel: "Lista",
    filterAll: "Todo",
    filterPois: "Imprescindibles",
    filterVenues: "Nuestros locales",
    filterAirports: "Cómo llegar",
    counterOf: "de",
  },
  home: {
    eyebrow: "Bienvenidos al",
    titleMain: "Grand Hotel",
    titleAccent: "San Marino",
    stayLabel: "Su estancia",
    welcomeTitle: "Les damos la bienvenida",
    welcomeBody:
      "Esta app es su guía durante la estancia: solicite el servicio de habitaciones, consulte los horarios de los servicios, descubra el restaurante y el spa, y explore qué ver en San Marino.",
    checkIn: { label: "Check-in", value: "Desde las 14:00 h" },
    checkOut: { label: "Check-out", value: "Hasta las 11:00 h" },
    lateCheckout: "Late check-out sujeto a disponibilidad, con suplemento.",
    nowLabel: "En este momento",
    quickLabel: "Acciones rápidas",
    groupLabel: "Descubra el GHSM Group",
    groupCategories: { wellness: "Bienestar", dining: "Restaurante", cafe: "Café", gelato: "Heladería", suites: "Suites", shop: "Tienda", bar: "Lounge bar" },
    quick: {
      wifi: {
        label: "Wi-Fi",
        value: "GRANDHOTELRSM",
        note: "Gratuito en todo el hotel. Seleccione la red y espere a la página de acceso.",
        copyDone: "Copiado",
      },
      breakfast: {
        label: "Desayuno",
        note: "Restaurante L'Arengo · 07:00 – 10:00. En la habitación con un suplemento de 6,00 €.",
      },
      checkout: {
        label: "Check-out",
        note: "Hasta las 11:00. Late check-out bajo petición en recepción.",
      },
      reception: {
        label: "Recepción",
        note: "Abierta las 24 horas. Desde el teléfono de la habitación, marque el 9.",
      },
      tv: {
        label: "Canales de TV",
        note: "37 canales disponibles en la habitación, del n.º 1 al 831.",
        cta: "Ver todos los canales",
      },
    },
    askLabel: "Concierge digital",
    askBody: "¿Alguna pregunta sobre su estancia o sobre San Marino? Pregunte, le respondo enseguida.",
    askCta: "Abrir el Concierge",
    highlightsLabel: "Acciones rápidas",
    highlightsSeeAll: "Ver todo",
    chatPlaceholder: "Pregunte a nuestro Concierge digital…",
    highlights: [
      {
        title: "Wi-Fi",
        body: "Red GRANDHOTELRSM: selecciónela, espere la notificación y conéctese gratis en todo el hotel.",
      },
      {
        title: "Recepción",
        body: "Abierta las 24 horas. Marque el 9 desde el teléfono de la habitación para cualquier necesidad.",
      },
      {
        title: "Desayuno",
        body: "Servido en el Restaurante L'Arengo de 07:00 a 10:00. Servicio de habitaciones disponible con un suplemento de 6,00 €.",
      },
    ],
    hotelsLabel: "Los hoteles del grupo GHSM",
    hotels: [
      { name: "Grand Hotel San Marino", description: "60 habitaciones y suites con vistas al valle de Montefeltro.", url: "https://www.grandhotel.sm" },
      { name: "Hotel Titano", description: "El encanto de finales del siglo XIX en el corazón de San Marino.", url: "https://www.hoteltitano.com" },
      { name: "Titano Suites", description: "Suites de diseño en el centro histórico de la República.", url: "https://www.titanosuiteshotel.com" },
    ],
  },
  room: {
    label: "Servicios en la habitación",
    intro: "Todo lo necesario para el máximo confort: recepción, servicio de habitaciones, lavandería, Wi-Fi y canales de TV.",
    servicesLabel: "Contactos y comodidades",
    services: [
      {
        title: "Recepción y Room Service",
        subtitle: "Tecla 9",
        body: "Para cualquier necesidad, llame a Recepción o al Room Service marcando el 9 desde el teléfono de la habitación.",
      },
      {
        title: "Centro Mességué",
        subtitle: "Tecla 471",
        body: "Para información y reservas en el Centro Médico Maurice Mességué, marque el 471.",
      },
      {
        title: "Caja fuerte",
        subtitle: "Tecla R + código + #",
        body: "Para configurar la caja fuerte, pulse la tecla R, introduzca un nuevo código personal de 4 a 10 dígitos y confirme con la tecla #.",
      },
      {
        title: "Aire acondicionado",
        subtitle: "Panel en la habitación",
        body: "El aire acondicionado se regula desde el panel de la habitación. Se desactiva automáticamente al abrir la ventana.",
      },
      {
        title: "No molestar",
        subtitle: "Tarjeta en el picaporte",
        body: "Para no ser molestado, cuelgue la tarjeta correspondiente en el picaporte exterior de la puerta.",
      },
    ],
    roomServiceLabel: "Servicio de habitaciones",
    roomService: {
      body: "Desayunos, tentempiés y comidas pueden servirse directamente en la habitación.",
      hours: "Todos los días, 07:00 – 23:00",
      supplement: "Suplemento de 6,00 € por pedido.",
    },
    laundryLabel: "Lavandería",
    laundry: {
      body: "Los costes y plazos dependen del tipo de tejido y lavado solicitado. El formulario de solicitud se encuentra en el armario de la habitación.",
      hours: "08:30 – 16:00",
    },
    wifiLabel: "Wi-Fi",
    wifi: {
      network: "GRANDHOTELRSM",
      body: "1. Abra Ajustes → Wi-Fi\n2. Seleccione la red GRANDHOTELRSM\n3. Toque la notificación de registro\n\nSi no ve la notificación, espere unos segundos.",
    },
    tvLabel: "Canales de TV",
    tvIntro: "La selección de canales disponibles en la habitación:",
    channels: TV_CHANNELS,
    petsLabel: "Mascotas",
    pets: {
      body: "Se admiten mascotas de pequeño tamaño. Se aplica un suplemento de 4,00 € al día por la limpieza extra de la habitación.",
    },
  },
  facility: {
    label: "Servicios del establecimiento",
    intro: "Aparcamiento, concierge y los espacios del establecimiento —gimnasio y bicicletas— para su estancia en San Marino.",
    parkingLabel: "Aparcamiento",
    garage: {
      title: "Garaje privado",
      body: [
        "19,00 € por noche.",
        "Servicio de valet de 7:00 a 23:00: se recomienda solicitar el vehículo con al menos 30 minutos de antelación.",
        "Hay disponible un punto de recarga para vehículos eléctricos, con suplemento.",
      ],
    },
    publicParking: {
      title: "Aparcamiento público",
      body: "Hay tickets de 6,00 € al día disponibles en Recepción, válidos hasta la medianoche del día siguiente en las zonas azules.",
    },
    conciergeLabel: "Concierge",
    taxiLabel: "Taxi",
    taxi: {
      body: "Para reservar un taxi, contacte con Recepción indicando fecha, hora, número de personas, tipo de vehículo deseado y destino.",
    },
    wakeUpLabel: "Servicio despertador",
    wakeUp: {
      body: "Para solicitar un servicio despertador, contacte con Recepción marcando el 9.",
    },
    cardLabel: "TuttoSanMarino Card",
    card: {
      body: "La tarjeta TuttoSanMarino ofrece descuentos en museos, tiendas y restaurantes asociados. Puede solicitarse en Recepción.",
    },
    hairdresserLabel: "Peluquería",
    hairdresser: {
      body: "Recepción está a su disposición para informarle sobre las peluquerías cercanas.",
    },
    meetingsLabel: "Salas de reuniones",
    meetings: {
      body: "El Grand Hotel San Marino cuenta con 5 salas de reuniones modulables, para eventos de 2 a 200 personas, con soporte tecnológico y personal cualificado disponible para organizar reuniones a medida, desayunos y cenas de trabajo, eventos privados, celebraciones y banquetes.",
    },
    gymLabel: "Gimnasio",
    gym: {
      body: "Un pequeño gimnasio con vistas al valle de Montefeltro, con equipamiento fitness básico, situado dentro del Centro Mességué en la 3ª planta. Acceso libre, sin reserva, de 08:00 a 20:00.",
    },
    contactsLabel: "Contacto y ubicación",
  },
  dining: {
    label: "Restaurante",
    intro: "La cocina del Grand Hotel San Marino y los demás locales del grupo GHSM. Para el Room Service directamente en la habitación, consulte la sección Hotel.",
    arengoLabel: "Restaurante L'Arengo",
    arengo: {
      hours: [
        { label: "Desayuno", value: "07:00 – 10:00" },
        { label: "Almuerzo", value: "12:00 – 14:30" },
        { label: "Cena", value: "19:00 – 21:30" },
      ],
      paragraphs: [
        "El pan y la pasta se elaboran de forma artesanal, gracias al trabajo de nuestros chefs pastelero y pastero dedicados.",
        "En la cocina se transmiten las recetas de la tradición local: lasañas, raviolis y tortellacci preparados según recetas familiares.",
        "Bajo petición hay disponibles menús especiales hipocalóricos o pensados para intolerancias alimentarias y patologías particulares, gracias a la sinergia con el Centro Médico Mességué y al uso de materias primas de origen certificado.",
      ],
      reservation: "Se recomienda reserva.",
    },
    groupLabel: "El grupo GHSM",
    groupIntro:
      "El Grand Hotel San Marino forma parte de GHSM Group, que desde 1894 representa la hospitalidad en San Marino. Estas son las demás direcciones del grupo donde comer y beber.",
    venues: [
      {
        id: "laTerrazza",
        name: "Restaurante La Terrazza",
        body: "Cenar entre las almenas de una torre medieval, suspendido entre el cielo y la tierra, con un horizonte que se abre hasta donde alcanza la vista — La Terrazza es una experiencia que pocos lugares en el mundo pueden ofrecer. Cocina gastronómica de alto nivel con productos locales.",
      },
      {
        id: "caffeTitano",
        name: "Caffè Titano",
        body: "Al venir a San Marino no se puede dejar de parar aquí: en pleno Centro Histórico, con vistas a una encantadora plazoleta medieval, en uno de los rincones más sugerentes del casco antiguo.",
      },
      {
        id: "cremeria",
        name: "La Cremeria del Titano",
        body: "Justo al lado del Caffè Titano. Abierta en los meses más calurosos, para una parada fresca y sabrosa acompañada de un buen helado artesanal.",
      },
      {
        id: "laLoggia",
        name: "La Loggia",
        body: "Un lounge bar y una tienda en el corazón del centro histórico, en la Piazzetta Garibaldi: quesos, embutidos y tablas, vinos y vermús artesanales, dulces típicos sanmarinenses y cervezas artesanales locales, seleccionados para contar los sabores más auténticos de nuestra tierra.",
      },
    ],
  },
  wellness: {
    label: "Bienestar",
    intro: "El Centro Médico Maurice Mességué y la lista de tratamientos para su relax.",
    messegueLabel: "Centro Médico Maurice Mességué",
    messegue: {
      paragraphs: [
        "Desde hace más de 30 años, el Centro Médico Maurice Mességué es un referente italiano en salud, adelgazamiento y vacaciones de bienestar: una clínica de adelgazamiento y un oasis de salud que combina dieta, actividad física y tratamientos de fitoterapia.",
        "El centro ofrece tratamientos estéticos para rostro y cuerpo, con formulaciones especializadas y rituales de remise en forme a medida para cada huésped.",
      ],
      quote: "La naturaleza siempre tiene razón.",
      quoteAuthor: "Maurice Mességué",
      callNote: "Para información y reservas, marque el 471 desde el teléfono de la habitación.",
    },
    priceListLabel: "Lista de tratamientos",
    priceListNote: "Precios y duración de los tratamientos disponibles en el Centro Mességué.",
    massages: [
      { name: "Masaje relajante", variants: [{ duration: "30'", price: "50,00 €" }] },
      { name: "Masaje descontracturante", variants: [{ duration: "50'", price: "90,00 €" }] },
      { name: "Masaje clásico", variants: [{ duration: "30'", price: "50,00 €" }] },
      {
        name: "Masaje en pareja",
        variants: [
          { duration: "30'", price: "95,00 €" },
          { duration: "50'", price: "165,00 €" },
        ],
      },
      { name: "Hot-Stone", variants: [{ duration: "50'", price: "90,00 €" }] },
      { name: "Masaje ayurvédico", variants: [{ duration: "50'", price: "90,00 €" }] },
      { name: "Masaje de arcilla verde", variants: [{ duration: "75'", price: "145,00 €" }] },
      {
        name: "Drenaje linfático",
        variants: [
          { label: "Rostro", duration: "30'", price: "45,00 €" },
          { label: "Cuerpo", duration: "50'", price: "90,00 €" },
        ],
      },
      { name: "Depilación parcial", variants: [{ price: "40,00 €" }] },
      { name: "Depilación total de piernas", variants: [{ price: "55,00 €" }] },
      { name: "Limpieza facial", variants: [{ duration: "60'", price: "75,00 €" }] },
      { name: "Tratamiento Anti Age clásico", variants: [{ duration: "45'", price: "104,00 €" }] },
      { name: "Lift Summum (Anti Age Plus)", variants: [{ duration: "50'", price: "135,00 €" }] },
      { name: "Radiofrecuencia (Anti Age Deluxe)", variants: [{ duration: "75'", price: "135,00 €" }] },
      { name: "Manicura", variants: [{ price: "38,00 €" }] },
      { name: "Pedicura", variants: [{ price: "48,00 €" }] },
    ],
  },
  info: {
    label: "Explorar",
    intro: "El mapa de la zona, las direcciones del grupo GHSM, los lugares imprescindibles de San Marino y cómo moverse por la ciudad.",
    sheetLabel: "Información y contacto",
    ghsmLabel: "Direcciones GHSM cercanas",
    poiLabel: "Imprescindibles en San Marino",
    pois: [
      {
        id: "palazzoPubblico",
        name: "Palazzo Pubblico",
        body: "El palacio del Gobierno, sede de las instituciones de la República, domina la céntrica Piazza della Libertà. Se puede visitar con un recorrido que narra la historia institucional de San Marino.",
      },
      {
        id: "basilica",
        name: "Basilica del Santo",
        body: "De estilo neoclásico, custodia las reliquias de San Marino, el santo que dio origen a la república más antigua del mundo.",
      },
      {
        id: "museoStato",
        name: "Museo de Estado",
        body: "Reúne restos arqueológicos, obras de arte y testimonios históricos de la República, desde la prehistoria hasta la edad moderna.",
      },
      {
        id: "guaita",
        name: "Primera Torre · Fortaleza Guaita",
        body: "La más antigua y famosa de las Tres Torres, construida en el siglo XI. Desde sus caminos de ronda la vista se abre hasta el mar Adriático.",
      },
      {
        id: "cesta",
        name: "Segunda Torre · Fortaleza Cesta",
        body: "Alberga el Museo de las Armas Antiguas, con una colección de armaduras y armas del siglo XII al XIX.",
      },
      {
        id: "funivia",
        name: "Teleférico de San Marino",
        body: "Conecta en pocos minutos el centro histórico con Borgo Maggiore, con una vista panorámica sobre el valle de Montefeltro.",
      },
      {
        id: "cavaBalestrieri",
        name: "Cava dei Balestrieri",
        body: "Una amplia terraza verde detrás de la Piazza della Libertà, sede histórica de las exhibiciones de la Federación de Ballesteros de San Marino. Desde aquí la vista se abre sobre las colinas del Montefeltro.",
      },
      {
        id: "passoStreghe",
        name: "Passo delle Streghe",
        body: "Un evocador camino excavado en la roca que une la Rocca Guaita con la Rocca Cesta, con vistas suspendidas sobre el valle. Su nombre recuerda las leyendas populares ligadas al monte Titano.",
      },
      {
        id: "montale",
        name: "Tercera Torre · Torre Montale",
        body: "La más pequeña y menos accesible de las Tres Torres, construida como puesto de vigilancia y hoy no visitable por dentro. Marca el punto más meridional de la cresta del monte Titano.",
      },
      {
        id: "chiesaSanFrancesco",
        name: "Chiesa di San Francesco",
        body: "Uno de los lugares de culto más antiguos de San Marino, contiguo al antiguo convento franciscano que hoy alberga el Museo de Estado. Conserva obras pictóricas de la escuela de Rímini y de las Marcas.",
      },
      {
        id: "museoCuriosita",
        name: "Museo de las Curiosidades",
        body: "Una insólita colección de récords, inventos y objetos curiosos de todo el mundo, instalada en el corazón del centro histórico. Un recorrido apto para todas las edades, entre rarezas y anécdotas.",
      },
      {
        id: "portaSanFrancesco",
        name: "Porta San Francesco",
        body: "Una de las antiguas puertas fortificadas del burgo, en la entrada de la Piazzale Lo Stradone hacia el centro histórico. El paso bajo la torre conserva todavía la atmósfera medieval de las murallas de la ciudad.",
      },
    ],
    airportsLabel: "Aeropuertos",
    airports: {
      list: ["Rímini", "Ancona", "Forlì", "Bolonia"],
      note: "Bajo petición está disponible el servicio de alquiler de coche con conductor.",
    },
    reachLabel: "Cómo moverse",
    reach: {
      transit: {
        title: "Transporte público",
        body: "Bonelli Bus conecta San Marino con la estación de tren y el aeropuerto de Rímini con servicios regulares durante el día.",
      },
      taxi: {
        title: "Taxi",
        body: "Para desplazamientos a aeropuertos u otras localidades, Recepción está a su disposición para reservar un taxi o un servicio con conductor.",
      },
      walk: {
        title: "A pie",
        body: "El centro histórico es peatonal y se llega desde el hotel en pocos minutos, entre callejuelas y escalinatas características: se recomienda calzado cómodo.",
      },
    },
  },
  about: {
    label: "Información",
    intro: "El grupo GHSM, los eventos programados en San Marino y todos los contactos del Grand Hotel.",
    groupLabel: "GHSM Group",
    group: {
      intro: "GHSM Group representa la hospitalidad en San Marino desde 1894.",
      titanoSuites: {
        name: "Titano Suites",
        body: "Un palacio de finales del siglo XIX en el corazón de San Marino, que alberga la Suite Montefeltro con bañera de hidromasaje en su terraza panorámica.",
      },
    },
    eventsLabel: "Eventos en San Marino",
    events: [
      {
        name: "Investidura de los Capitanes Regentes",
        date: "1 de abril y 1 de octubre",
        dates: [{ month: 4, day: 1 }, { month: 10, day: 1 }],
      },
      { name: "Fiesta Nacional", date: "3 de septiembre", dates: [{ month: 9, day: 3 }] },
      { name: "SMIAF", date: "Primeras semanas de agosto" },
      { name: "San Marino Comics", date: "Últimas semanas de agosto" },
      { name: "Rally Legend", date: "Mediados de octubre" },
      { name: "MotoGP", date: "Principios de septiembre" },
      { name: "Mercadillos de Navidad", date: "Época navideña" },
    ],
    contactsLabel: "Dirección y contactos",
  },
  services: {
    label: "Todos los servicios",
    quickLabel: "Acceso rápido",
    backLabel: "Todos los servicios",
  },
  footer: "Grand Hotel San Marino",
  poweredBy: "Creada por",
  privacyLabel: "Privacidad",
};

export const content: Record<Lang, HotelContent> = { it, en, fr, de, es };
