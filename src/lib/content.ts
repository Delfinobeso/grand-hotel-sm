import type { StatusLabels } from "@/lib/hours";
import type { EventDate } from "@/lib/ics";

export type Lang = "it" | "en";

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
    home: string;
    room: string;
    dining: string;
    wellness: string;
    info: string;
  };
  common: {
    receptionCta: string;
    languageLabel: string;
    status: StatusLabels;
    callLabel: string;
    bookLabel: string;
    navigateLabel: string;
    openInMapsLabel: string;
    addToCalendarLabel: string;
    callValetLabel: string;
    floorGround: string;
    floorThird: string;
    floorThirdMessegue: string;
    floorBasement: string;
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
    highlightsLabel: string;
    highlights: { title: string; body: string }[];
    hoursLabel: string;
    hours: HoursRow[];
  };
  room: {
    label: string;
    intro: string;
    servicesLabel: string;
    services: { title: string; subtitle: string; body: string }[];
    wifiLabel: string;
    wifi: { network: string; body: string };
    tvLabel: string;
    tvIntro: string;
    channels: {number: string, name: string, logo: string}[];
    petsLabel: string;
    pets: { body: string };
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
    roomServiceLabel: string;
    roomService: { body: string; hours: string; supplement: string };
    laundryLabel: string;
    laundry: { body: string; hours: string };
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
    gymLabel: string;
    gym: { body: string };
    bikeLabel: string;
    bike: { body: string };
  };
  info: {
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
    airportsLabel: string;
    airports: { list: string[]; note: string };
    meetingsLabel: string;
    meetings: { body: string };
    groupLabel: string;
    group: { intro: string; titanoSuites: { name: string; body: string } };
    eventsLabel: string;
    events: { name: string; date: string; dates?: EventDate[] }[];
    outsideLabel: string;
    outsideIntro: string;
    contactsLabel: string;
  };
  footer: string;
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
    home: "Home",
    room: "Servizi",
    dining: "Mangiare",
    wellness: "Benessere",
    info: "Dove",
  },
  common: {
    receptionCta: "Chiama la Reception",
    languageLabel: "Lingua",
    status: {
      open: "Aperto",
      closed: "Chiuso",
      onRequest: "Su richiesta",
      closesAt: "fino alle",
      opensAt: "riapre alle",
    },
    callLabel: "Chiama",
    bookLabel: "Prenota",
    navigateLabel: "Naviga",
    openInMapsLabel: "Apri in Mappe",
    addToCalendarLabel: "Aggiungi al calendario",
    callValetLabel: "Chiama il Valet",
    floorGround: "Piano Terra",
    floorThird: "3° piano",
    floorThirdMessegue: "3° piano · Centro Mességué",
    floorBasement: "-1 · Garage",
  },
  home: {
    eyebrow: "Benvenuti al",
    titleMain: "Grand Hotel",
    titleAccent: "San Marino",
    stayLabel: "Il vostro soggiorno",
    welcomeTitle: "Vi diamo il benvenuto",
    welcomeBody:
      "La vostra camera è pronta. Il Grand Hotel San Marino dispone di 60 camere e suite con vista sulla Valle del Montefeltro, in una posizione ideale per escursioni in bici e passeggiate tra i castelli della Repubblica.",
    checkIn: { label: "Check-in", value: "Dalle ore 14:00" },
    checkOut: { label: "Check-out", value: "Entro le ore 11:00" },
    lateCheckout: "Late check-out su disponibilità, con supplemento.",
    highlightsLabel: "Azioni rapide",
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
    hoursLabel: "Orari dei servizi",
    hours: [
      { label: "Reception", value: "24 ore su 24" },
      { label: "Colazione · Ristorante L'Arengo", value: "07:00 – 10:00" },
      { label: "Pranzo · Ristorante L'Arengo", value: "12:00 – 14:30" },
      { label: "Cena · Ristorante L'Arengo", value: "19:00 – 21:30" },
      { label: "Room Service", value: "07:00 – 23:00 (+ €6,00)" },
      { label: "Lavanderia", value: "08:30 – 16:00" },
      { label: "Palestra", value: "08:00 – 20:00" },
    ],
  },
  room: {
    label: "Camera",
    intro: "Tutto ciò che serve per il massimo confort durante il soggiorno.",
    servicesLabel: "Servizi in camera",
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
    wifiLabel: "Wi-Fi",
    wifi: {
      network: "GRANDHOTELRSM",
      body: "1. Apri Impostazioni → Wi-Fi\n2. Seleziona la rete GRANDHOTELRSM\n3. Tocca la notifica di registrazione\n\nSe non vedi la notifica, attendi qualche secondo. Nella directory in camera trovi gli screenshot passo-passo.",
    },
    tvLabel: "Canali TV",
    tvIntro: "La selezione di canali disponibili in camera:",
    channels: TV_CHANNELS,
    petsLabel: "Animali domestici",
    pets: {
      body: "Gli animali di piccola taglia sono ammessi. È previsto un supplemento di €4,00 al giorno per la pulizia extra della camera.",
    },
  },
  dining: {
    label: "Ristorante",
    intro: "La cucina del Grand Hotel San Marino, il servizio in camera e gli altri locali del gruppo GHSM.",
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
    ],
  },
  wellness: {
    label: "Benessere",
    intro: "Il Centro Medico Maurice Mességué, il listino trattamenti, la palestra e le attività all'aria aperta.",
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
    gymLabel: "Palestra",
    gym: {
      body: "Una piccola palestra affacciata sulla Valle del Montefeltro, con attrezzi fitness di base, situata all'interno del Centro Mességué al 3° piano. Accesso libero, senza prenotazione, dalle 08:00 alle 20:00.",
    },
    bikeLabel: "In bicicletta",
    bike: {
      body: "San Marino offre percorsi stradali e off-road tra i 9 castelli della Repubblica, ideali per escursioni in bicicletta. Per il noleggio bici, chiedere informazioni al Ricevimento.",
    },
  },
  info: {
    label: "Info",
    intro: "Parcheggio, concierge e tutto ciò che serve per organizzare il soggiorno a San Marino.",
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
      body: "Biglietti a €4,00 al giorno disponibili in Reception, validi fino alle ore 12:00 del giorno successivo nelle strisce blu.",
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
    airportsLabel: "Aeroporti",
    airports: {
      list: ["Rimini", "Ancona", "Forlì", "Bologna"],
      note: "Su richiesta è disponibile il servizio di noleggio auto con conducente.",
    },
    meetingsLabel: "Meeting & Eventi",
    meetings: {
      body: "Il Grand Hotel San Marino dispone di 5 sale meeting modulabili, per eventi da 2 a 200 persone, con supporti tecnologici e uno staff qualificato a disposizione per organizzare meeting su misura, colazioni e cene di lavoro, eventi privati, celebrazioni e banchetti.",
    },
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
    outsideLabel: "Fuori dall'hotel",
    outsideIntro:
      "Gli altri indirizzi del gruppo GHSM, a pochi passi a piedi nel centro storico di San Marino.",
    contactsLabel: "Indirizzo e contatti",
  },
  footer: "Grand Hotel San Marino",
};

const en: HotelContent = {
  nav: {
    home: "Home",
    room: "Services",
    dining: "Food",
    wellness: "Wellness",
    info: "Explore",
  },
  common: {
    receptionCta: "Call Reception",
    languageLabel: "Language",
    status: {
      open: "Open",
      closed: "Closed",
      onRequest: "On request",
      closesAt: "until",
      opensAt: "reopens at",
    },
    callLabel: "Call",
    bookLabel: "Book",
    navigateLabel: "Navigate",
    openInMapsLabel: "Open in Maps",
    addToCalendarLabel: "Add to calendar",
    callValetLabel: "Call Valet",
    floorGround: "Ground floor",
    floorThird: "3rd floor",
    floorThirdMessegue: "3rd floor · Mességué Centre",
    floorBasement: "-1 · Garage",
  },
  home: {
    eyebrow: "Welcome to",
    titleMain: "Grand Hotel",
    titleAccent: "San Marino",
    stayLabel: "Your stay",
    welcomeTitle: "Welcome",
    welcomeBody:
      "Your room is ready. The Grand Hotel San Marino has 60 rooms and suites overlooking the Montefeltro Valley, in an ideal location for cycling and walking among the castles of the Republic.",
    checkIn: { label: "Check-in", value: "From 2:00 PM" },
    checkOut: { label: "Check-out", value: "By 11:00 AM" },
    lateCheckout: "Late check-out subject to availability, with a supplement.",
    highlightsLabel: "Quick actions",
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
    hoursLabel: "Service hours",
    hours: [
      { label: "Reception", value: "24 hours" },
      { label: "Breakfast · L'Arengo Restaurant", value: "7:00 – 10:00 AM" },
      { label: "Lunch · L'Arengo Restaurant", value: "12:00 – 2:30 PM" },
      { label: "Dinner · L'Arengo Restaurant", value: "7:00 – 9:30 PM" },
      { label: "Room Service", value: "7:00 AM – 11:00 PM (+ €6.00)" },
      { label: "Laundry", value: "8:30 AM – 4:00 PM" },
      { label: "Gym", value: "8:00 AM – 8:00 PM" },
    ],
  },
  room: {
    label: "Room",
    intro: "Everything you need for maximum comfort during your stay.",
    servicesLabel: "In-room services",
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
    wifiLabel: "Wi-Fi",
    wifi: {
      network: "GRANDHOTELRSM",
      body: "1. Open Settings → Wi-Fi\n2. Select the GRANDHOTELRSM network\n3. Tap the registration notification\n\nIf you don't see the notification, wait a few seconds. Check the printed directory in your room for step-by-step screenshots.",
    },
    tvLabel: "TV Channels",
    tvIntro: "The channels available in your room:",
    channels: TV_CHANNELS,
    petsLabel: "Pets",
    pets: {
      body: "Small pets are welcome. A supplement of €4.00 per day applies for extra room cleaning.",
    },
  },
  dining: {
    label: "Dining",
    intro: "The cuisine of the Grand Hotel San Marino, room service and the other venues of the GHSM Group.",
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
    ],
  },
  wellness: {
    label: "Wellness",
    intro: "The Maurice Mességué Medical Centre, the treatment price list, the gym and outdoor activities.",
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
    gymLabel: "Gym",
    gym: {
      body: "A small gym overlooking the Montefeltro Valley, with basic fitness equipment, located inside the Mességué Centre on the 3rd floor. Free access, no booking required, from 8:00 AM to 8:00 PM.",
    },
    bikeLabel: "By bike",
    bike: {
      body: "San Marino offers road and off-road routes among the Republic's 9 castles, ideal for cycling excursions. For bike rental, please ask at Reception.",
    },
  },
  info: {
    label: "Info",
    intro: "Parking, concierge and everything you need to plan your stay in San Marino.",
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
      body: "Tickets at €4.00 per day are available at Reception, valid until 12:00 PM the following day in blue-line parking spaces.",
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
    airportsLabel: "Airports",
    airports: {
      list: ["Rimini", "Ancona", "Forlì", "Bologna"],
      note: "A chauffeur-driven car rental service is available on request.",
    },
    meetingsLabel: "Meetings & Events",
    meetings: {
      body: "The Grand Hotel San Marino has 5 modular meeting rooms for events from 2 to 200 people, with technological support and a qualified staff available to organise tailor-made meetings, working breakfasts and dinners, private events, celebrations and banquets.",
    },
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
    outsideLabel: "Outside the hotel",
    outsideIntro: "The other GHSM Group venues, just a short walk away in San Marino's historic centre.",
    contactsLabel: "Address & Contacts",
  },
  footer: "Grand Hotel San Marino",
};

export const content: Record<Lang, HotelContent> = { it, en };
