import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  WorkerProfile,
  Category,
  Booking,
  CustomJob,
  JobOffer,
  PaymentMethod,
  Payment,
  WorkerPayout,
  PerformanceBonusRule,
  Review,
  Favorite,
  ChatMessage,
  AppNotification,
  Dispute,
  Refund,
  HeroPoster,
  AppSettings,
  AuditLog
} from '../types';

export interface DatabaseSchema {
  users: (User & { passwordHash: string; salt: string })[];
  workers: WorkerProfile[];
  categories: Category[];
  bookings: Booking[];
  customJobs: CustomJob[];
  jobOffers: JobOffer[];
  paymentMethods: PaymentMethod[];
  payments: Payment[];
  workerPayouts: WorkerPayout[];
  performanceBonuses: PerformanceBonusRule[];
  reviews: Review[];
  favorites: Favorite[];
  messages: ChatMessage[];
  notifications: AppNotification[];
  disputes: Dispute[];
  refunds: Refund[];
  posters: HeroPoster[];
  settings: AppSettings;
  auditLogs: AuditLog[];
  adminTokens: { token: string; adminId: string; expiresAt: string }[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'firststep-db.json');

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  if (!password || !hash || !salt) return false;
  try {
    const testHash = hashPassword(password, salt);
    const bufA = Buffer.from(testHash, 'hex');
    const bufB = Buffer.from(hash, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch (e) {
    return false;
  }
}

// Default 50+ categories with Urdu translations & icons
export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-plumbing',
    name: 'Plumbing',
    nameUrdu: 'پلمبنگ سروسز',
    icon: '🔧',
    description: 'Pipe repairs, leakages, motor installations, tap & sanitary fittings',
    order: 1,
    isActive: true,
    services: [
      { id: 'srv-plumb-leak', name: 'Pipe Leakage Repair', nameUrdu: 'پائپ لیکج مرمت', basePrice: 800, description: 'Fix internal and external pipe leaks' },
      { id: 'srv-plumb-tap', name: 'Tap / Mixer Installation', nameUrdu: 'نلکا اور مکسر تنصیب', basePrice: 600, description: 'Install or repair bathroom & kitchen taps' },
      { id: 'srv-plumb-motor', name: 'Water Pump / Motor Repair', nameUrdu: 'پانی موٹر مرمت', basePrice: 1200, description: 'Repair water booster pumps and motors' },
      { id: 'srv-plumb-drain', name: 'Drain Unblocking & Sewerage', nameUrdu: 'ڈرین و گٹر صفائی', basePrice: 1500, description: 'Unclog choked bathroom, kitchen drains' },
      { id: 'srv-plumb-tank', name: 'Overhead Tank Connection', nameUrdu: 'پانی ٹینک کنکشن', basePrice: 2000, description: 'Tank plumbing, valves and overflow fixes' }
    ]
  },
  {
    id: 'cat-electrical',
    name: 'Electrical',
    nameUrdu: 'الیکٹریشن سروسز',
    icon: '⚡',
    description: 'Wiring, short-circuit troubleshooting, switches, fans, breakers, lights',
    order: 2,
    isActive: true,
    services: [
      { id: 'srv-elec-short', name: 'Short Circuit & Fault Finding', nameUrdu: 'شارٹ سرکٹ فالٹ ٹریسنگ', basePrice: 1200, description: 'Comprehensive electrical diagnostics' },
      { id: 'srv-elec-fan', name: 'Ceiling Fan Installation & Repair', nameUrdu: 'پنکھا مرمت و فٹنگ', basePrice: 600, description: 'Install ceiling, bracket or exhaust fans' },
      { id: 'srv-elec-switch', name: 'Switch Board & Socket Replacement', nameUrdu: 'سوئچ بورڈ فٹنگ', basePrice: 500, description: 'Modern switch plate wiring and replacement' },
      { id: 'srv-elec-db', name: 'Distribution Box (DB) & Breakers', nameUrdu: 'مین ڈی بی اور بریکر', basePrice: 1500, description: 'Install main circuit breakers and DB wiring' },
      { id: 'srv-elec-ups', name: 'UPS Wiring & Battery Setup', nameUrdu: 'یو پی ایس وائرنگ', basePrice: 1800, description: 'Dual line UPS wiring and battery health check' }
    ]
  },
  {
    id: 'cat-ac-hvac',
    name: 'AC & HVAC',
    nameUrdu: 'اے سی و ٹھنڈک سروسز',
    icon: '❄️',
    description: 'Inverter AC repair, gas refilling, master service, installation & shifting',
    order: 3,
    isActive: true,
    services: [
      { id: 'srv-ac-service', name: 'AC Master Chemical Wash', nameUrdu: 'اے سی مکمل سروس', basePrice: 1500, description: 'Indoor and outdoor deep chemical pressure wash' },
      { id: 'srv-ac-gas', name: 'AC Gas Refill (R410 / R32 / R22)', nameUrdu: 'اے سی گیس ریفل', basePrice: 3500, description: 'Leak testing and pure refrigerant charging' },
      { id: 'srv-ac-install', name: 'AC Installation / Dismantle', nameUrdu: 'اے سی انسٹالیشن / اتارئی', basePrice: 3000, description: 'Safe wall mount, piping, vacuuming' },
      { id: 'srv-ac-pcb', name: 'Inverter AC PCB Circuit Repair', nameUrdu: 'انورٹر سرکٹ کٹ مرمت', basePrice: 2500, description: 'Electronic card repair for inverter units' }
    ]
  },
  {
    id: 'cat-cleaning',
    name: 'Home Cleaning',
    nameUrdu: 'گھر کی صفائی',
    icon: '🧹',
    description: 'General cleaning, floor mopping, dusting, window & kitchen cleanup',
    order: 4,
    isActive: true,
    services: [
      { id: 'srv-clean-home', name: 'Standard Full Home Cleaning', nameUrdu: 'مکمل گھر صفائی', basePrice: 3500, description: 'Mopping, sweeping, surface disinfection' },
      { id: 'srv-clean-kitchen', name: 'Kitchen Grease & Stove Cleaning', nameUrdu: 'کچن ڈیپ کلیننگ', basePrice: 2000, description: 'Grease removal, exhaust, tile scrub' },
      { id: 'srv-clean-bath', name: 'Bathroom Acid Scrub & Descaling', nameUrdu: 'واش روم صفائی', basePrice: 1200, description: 'Scale removal, sanitary shine, tiles' }
    ]
  },
  {
    id: 'cat-deep-cleaning',
    name: 'Deep Cleaning',
    nameUrdu: 'ڈیپ کلیننگ',
    icon: '✨',
    description: 'Post-construction cleaning, vacant home deep sanitization, marble polishing',
    order: 5,
    isActive: true,
    services: [
      { id: 'srv-deep-vacant', name: 'Move-in / Move-out Deep Cleaning', nameUrdu: 'نئے گھر کی مکمل صفائی', basePrice: 6000, description: 'Thorough sanitation before shifting' },
      { id: 'srv-deep-sofa', name: 'Sofa & Carpet Shampoo Cleaning', nameUrdu: 'صوفہ و قالین شیمپو', basePrice: 2500, description: 'Extraction cleaning for couches and rugs' }
    ]
  },
  {
    id: 'cat-carpenter',
    name: 'Carpenter',
    nameUrdu: 'کارپینٹر و لکڑی کام',
    icon: '🪚',
    description: 'Door lock repair, wooden cabinets, furniture polishing, custom woodwork',
    order: 6,
    isActive: true,
    services: [
      { id: 'srv-carp-door', name: 'Door Lock & Hinge Repair', nameUrdu: 'دروازہ لاک و قبضہ مرمت', basePrice: 700, description: 'Fix sticking doors, lock replacement' },
      { id: 'srv-carp-wardrobe', name: 'Wardrobe & Cabinet Repair', nameUrdu: 'الماری اور کیبنٹ درستگی', basePrice: 1500, description: 'Slide channels, hydraulic hinges, handles' },
      { id: 'srv-carp-furniture', name: 'Furniture Assembly & Polish', nameUrdu: 'فرنیچر فٹنگ و پالش', basePrice: 2000, description: 'Bed, dining table assembly & lacquer polish' }
    ]
  },
  {
    id: 'cat-painting',
    name: 'Painting',
    nameUrdu: 'پینٹ و ڈیکوریشن',
    icon: '🎨',
    description: 'Interior & exterior wall paint, dampness treatment, texture & wall putty',
    order: 7,
    isActive: true,
    services: [
      { id: 'srv-paint-room', name: 'Single Room Painting', nameUrdu: 'ایک کمرہ پینٹ', basePrice: 4000, description: 'Primer, putty, two top coats of plastic emulsion' },
      { id: 'srv-paint-damp', name: 'Seepage & Dampness Fix', nameUrdu: 'سیم و نمی کا مستقل علاج', basePrice: 2500, description: 'Waterproof coating and scraping' },
      { id: 'srv-paint-exterior', name: 'Exterior Weather Sheet Paint', nameUrdu: 'بیرونی ویدر شیٹ پینٹ', basePrice: 8000, description: 'High-durability weather-proof exterior' }
    ]
  },
  {
    id: 'cat-masonry',
    name: 'Masonry / Construction',
    nameUrdu: 'راج مستری و تعمیرات',
    icon: '🧱',
    description: 'Plaster, brick work, tile fixing, flooring, bathroom renovation',
    order: 8,
    isActive: true,
    services: [
      { id: 'srv-mas-tile', name: 'Tile & Marble Installation', nameUrdu: 'ٹائل اور ماربل تنصیب', basePrice: 2500, description: 'Floor and wall tile laying' },
      { id: 'srv-mas-plaster', name: 'Wall Plaster & Patchwork', nameUrdu: 'دیوار پلستر مرمت', basePrice: 1500, description: 'Fix broken plaster and cracks' }
    ]
  },
  {
    id: 'cat-handyman',
    name: 'Handyman',
    nameUrdu: 'ہر قسم کا چھوٹا کام',
    icon: '🔨',
    description: 'Picture hanging, curtain rod mounting, mirror installation, general fixes',
    order: 9,
    isActive: true,
    services: [
      { id: 'srv-handy-drill', name: 'Drilling & Mounting (Mirrors/Frames)', nameUrdu: 'ڈرلنگ اور فریم لگانا', basePrice: 500, description: 'Precise wall anchor mounting' },
      { id: 'srv-handy-curtain', name: 'Curtain Rod & Blinds Fixing', nameUrdu: 'پردے کی راڈ لگانا', basePrice: 800, description: 'Install curtain tracks and roman blinds' }
    ]
  },
  {
    id: 'cat-appliance-repair',
    name: 'Appliance Repair',
    nameUrdu: 'گھریلو اشیاء مرمت',
    icon: '🔌',
    description: 'General home appliances repair, oven, iron, water dispenser',
    order: 10,
    isActive: true,
    services: [
      { id: 'srv-app-dispenser', name: 'Water Dispenser Repair', nameUrdu: 'واٹر ڈسپنسر مرمت', basePrice: 1000, description: 'Hot and cold cooling fault fix' },
      { id: 'srv-app-iron', name: 'Iron & Vacuum Cleaner Fix', nameUrdu: 'استری اور ویکیوم کلینر', basePrice: 600, description: 'Element, thermostat and motor checks' }
    ]
  },
  {
    id: 'cat-refrigerator',
    name: 'Refrigerator Repair',
    nameUrdu: 'فریج و ڈیپ فریزر مرمت',
    icon: '🧊',
    description: 'Compressor replacement, gas filling, thermostat, ice buildup troubleshooting',
    order: 11,
    isActive: true,
    services: [
      { id: 'srv-ref-gas', name: 'Fridge Gas Refill & Leak Check', nameUrdu: 'فریج گیس چارجنگ', basePrice: 3000, description: 'Recharge refrigerant for fridge/freezer' },
      { id: 'srv-ref-comp', name: 'Compressor Replacement', nameUrdu: 'کمپریسر تبدیل کرنا', basePrice: 4000, description: 'Brand new compressor fitting and testing' }
    ]
  },
  {
    id: 'cat-washing-machine',
    name: 'Washing Machine Repair',
    nameUrdu: 'واشنگ مشین مرمت',
    icon: '🧺',
    description: 'Automatic front-load & top-load repairs, spin motor, gearbox, drainage issues',
    order: 12,
    isActive: true,
    services: [
      { id: 'srv-wash-auto', name: 'Automatic Machine Motherboard Repair', nameUrdu: 'آٹومیٹک مشین کارڈ مرمت', basePrice: 2000, description: 'Digital circuit troubleshooting' },
      { id: 'srv-wash-motor', name: 'Spin / Wash Motor Replacement', nameUrdu: 'موٹر و گیئر بکس مرمت', basePrice: 1500, description: 'Semi-auto and fully-auto motor repairs' }
    ]
  },
  {
    id: 'cat-geyser',
    name: 'Geyser Repair',
    nameUrdu: 'گیزر مرمت و سروس',
    icon: '🔥',
    description: 'Instant gas geyser repair, electric geyser element, pilot ignition fix',
    order: 13,
    isActive: true,
    services: [
      { id: 'srv-geyser-instant', name: 'Instant Geyser Diaphragm & Ignition', nameUrdu: 'انسٹنٹ گیزر مکمل درستگی', basePrice: 1200, description: 'Fix sensor, solenoid valve, battery kit' },
      { id: 'srv-geyser-clean', name: 'Geyser Tank Descaling & Element', nameUrdu: 'گیزر صفائی و ایلیمنٹ', basePrice: 1800, description: 'Rust removal, new electric rod install' }
    ]
  },
  {
    id: 'cat-microwave',
    name: 'Microwave Repair',
    nameUrdu: 'مائیکروویو اوون مرمت',
    icon: '🍲',
    description: 'Magnetron replacement, sparking fix, glass tray rotation, touch pad repair',
    order: 14,
    isActive: true,
    services: [
      { id: 'srv-micro-heat', name: 'Not Heating / Sparking Fix', nameUrdu: 'گرم نہ کرنا اور چنگاریاں ختم کرنا', basePrice: 1200, description: 'Magnetron, diode and capacitor check' }
    ]
  },
  {
    id: 'cat-electronics',
    name: 'Electronics Repair',
    nameUrdu: 'الیکٹرانکس ریپیئر',
    icon: '📻',
    description: 'LED TV repair, sound systems, amplifier, power supply fixes',
    order: 15,
    isActive: true,
    services: [
      { id: 'srv-tv-backlight', name: 'LED TV Backlight & Screen Strip', nameUrdu: 'ایل ای ڈی ٹی وی بیک لائٹ', basePrice: 2000, description: 'Replace LED strips and power inverter' }
    ]
  },
  {
    id: 'cat-mobile-repair',
    name: 'Mobile Repair',
    nameUrdu: 'موبائل فون مرمت',
    icon: '📱',
    description: 'Screen replacement, battery, charging port, water damage, motherboard repair',
    order: 16,
    isActive: true,
    services: [
      { id: 'srv-mob-screen', name: 'Screen / LCD Display Replacement', nameUrdu: 'ٹچ اسکرین تبدیل کرنا', basePrice: 1500, description: 'Original display fitting with warranty' },
      { id: 'srv-mob-battery', name: 'Battery Replacement', nameUrdu: 'بیٹری تبدیلی', basePrice: 1000, description: 'Original high capacity battery' },
      { id: 'srv-mob-port', name: 'Charging Port & Mic Repair', nameUrdu: 'چارجنگ پن و مائیک مرمت', basePrice: 800, description: 'Fix loose ports and audio issues' }
    ]
  },
  {
    id: 'cat-computer-repair',
    name: 'Computer / Laptop Repair',
    nameUrdu: 'کمپیوٹر و لیپ ٹاپ ریپیئر',
    icon: '💻',
    description: 'Windows install, SSD upgrade, laptop hinges, motherboard, overheating fix',
    order: 17,
    isActive: true,
    services: [
      { id: 'srv-pc-windows', name: 'OS Installation & Data Backup', nameUrdu: 'ونڈوز انسٹالیشن و بیک اپ', basePrice: 1000, description: 'Clean OS install, antivirus, drivers' },
      { id: 'srv-pc-ssd', name: 'SSD Upgrade & RAM Expansion', nameUrdu: 'ایس ایس ڈی اور ریم اپگریڈ', basePrice: 1200, description: 'Speed up sluggish laptops 5x' },
      { id: 'srv-pc-hinge', name: 'Laptop Body & Hinge Fabrication', nameUrdu: 'لیپ ٹاپ قبضہ و باڈی مرمت', basePrice: 1800, description: 'Fix broken laptop hinges and casings' }
    ]
  },
  {
    id: 'cat-it-services',
    name: 'IT Services',
    nameUrdu: 'آئی ٹی و تکنیکی سروسز',
    icon: '🖥️',
    description: 'Office network setup, server maintenance, software configuration',
    order: 18,
    isActive: true,
    services: [
      { id: 'srv-it-setup', name: 'Office Workstation Setup', nameUrdu: 'آفس کمپیوٹر سیٹ اپ', basePrice: 2500, description: 'Complete PC and peripheral configuration' }
    ]
  },
  {
    id: 'cat-internet-network',
    name: 'Internet / Network',
    nameUrdu: 'انٹرنیٹ و وائی فائی نیٹ ورکنگ',
    icon: '🌐',
    description: 'WiFi router configuration, LAN cable crimping, range extender setup',
    order: 19,
    isActive: true,
    services: [
      { id: 'srv-net-wifi', name: 'WiFi Range Extender & Mesh Setup', nameUrdu: 'وائی فائی رینج ایکسٹینڈر', basePrice: 1200, description: 'Eliminate home WiFi dead zones' }
    ]
  },
  {
    id: 'cat-cctv',
    name: 'CCTV Installation',
    nameUrdu: 'سی سی ٹی وی کیمرے تنصیب',
    icon: '📹',
    description: 'Security camera fitting, DVR/NVR configuration, mobile phone live stream setup',
    order: 20,
    isActive: true,
    services: [
      { id: 'srv-cctv-fit', name: 'CCTV Camera Point Installation', nameUrdu: 'کیمرہ پوائنٹ وائرنگ و فٹنگ', basePrice: 1000, description: 'Per camera cable pull and mounting' },
      { id: 'srv-cctv-mobile', name: 'DVR Online Mobile App Setup', nameUrdu: 'موبائل پر کیمرے دیکھنا', basePrice: 1500, description: 'Remote viewing configuration on phone' }
    ]
  },
  {
    id: 'cat-solar',
    name: 'Solar / Energy',
    nameUrdu: 'سولر پینل و انورٹر سسٹم',
    icon: '☀️',
    description: 'Solar panel structure mounting, net metering, hybrid inverter wiring',
    order: 21,
    isActive: true,
    services: [
      { id: 'srv-solar-clean', name: 'Solar Panel Washing & Maintenance', nameUrdu: 'سولر پینل دھلائی و صفائی', basePrice: 2000, description: 'Restore maximum solar generation efficiency' },
      { id: 'srv-solar-wiring', name: 'Solar Inverter Troubleshooting', nameUrdu: 'سولر انورٹر فالٹ چیکنگ', basePrice: 3000, description: 'String check, MPPT diagnostics' }
    ]
  },
  {
    id: 'cat-generator',
    name: 'Generator Repair',
    nameUrdu: 'جنریٹر سروس و مرمت',
    icon: '⚙️',
    description: 'Petrol & gas generator tuning, carburetor cleaning, automatic transfer switch (ATS)',
    order: 22,
    isActive: true,
    services: [
      { id: 'srv-gen-tune', name: 'Generator Carburetor & Oil Tune-up', nameUrdu: 'جنریٹر آئل و ٹیوننگ', basePrice: 1500, description: 'Spark plug, oil change and carb tune' }
    ]
  },
  {
    id: 'cat-water-tank',
    name: 'Water Tank / Water Services',
    nameUrdu: 'واٹر ٹینک صفائی',
    icon: '🚰',
    description: 'Underground & overhead water tank chemical wash, sludge extraction',
    order: 23,
    isActive: true,
    services: [
      { id: 'srv-tank-clean', name: 'Underground / Overhead Tank Cleaning', nameUrdu: 'زیر زمین و چھت ٹینک صفائی', basePrice: 3000, description: 'High-pressure wash and chlorine disinfection' }
    ]
  },
  {
    id: 'cat-sanitary',
    name: 'Sanitary Services',
    nameUrdu: 'سینیٹری سامان تنصیب',
    icon: '🚽',
    description: 'Commode installation, vanity sink fitting, shower mixer repair',
    order: 24,
    isActive: true,
    services: [
      { id: 'srv-san-commode', name: 'Commode / English Seat Install', nameUrdu: 'کموڈ اور سیٹ لگانا', basePrice: 1500, description: 'Fixing, sealing and wax ring setup' }
    ]
  },
  {
    id: 'cat-locksmith',
    name: 'Locksmith',
    nameUrdu: 'چابی ساز و تالا سروس',
    icon: '🔑',
    description: 'Emergency door opening, key duplication, deadbolt install, master keys',
    order: 25,
    isActive: true,
    services: [
      { id: 'srv-lock-open', name: 'Emergency Locked Door Opening', nameUrdu: 'بند دروازہ کھولنا', basePrice: 1000, description: 'Non-destructive opening of locked doors' }
    ]
  },
  {
    id: 'cat-glass-aluminum',
    name: 'Glass & Aluminum',
    nameUrdu: 'شیشہ و المونیم کام',
    icon: '🪟',
    description: 'Aluminum windows, sliding glass doors, frosted shower cabins',
    order: 26,
    isActive: true,
    services: [
      { id: 'srv-glass-win', name: 'Sliding Window Wheel & Lock Fix', nameUrdu: 'کھڑکی ویل اور لاک درستگی', basePrice: 800, description: 'Smooth gliding roller replacement' }
    ]
  },
  {
    id: 'cat-welding',
    name: 'Welding',
    nameUrdu: 'ویلڈنگ سروسز',
    icon: '🧑‍🏭',
    description: 'Iron gate repair, window grilles, railing welding, metal fabrication',
    order: 27,
    isActive: true,
    services: [
      { id: 'srv-weld-gate', name: 'Main Gate Hinge & Lock Welding', nameUrdu: 'مین گیٹ قبضہ و ویلڈنگ', basePrice: 1200, description: 'Heavy duty arc welding repairs' }
    ]
  },
  {
    id: 'cat-steel-work',
    name: 'Steel Work',
    nameUrdu: 'اسٹیل ورک',
    icon: '🏗️',
    description: 'Stainless steel stairs railing, safety doors, custom steel structure',
    order: 28,
    isActive: true,
    services: [
      { id: 'srv-steel-rail', name: 'Steel Railing Repair & Buffing', nameUrdu: 'اسٹیل جنگلہ مرمت و پالش', basePrice: 1500, description: 'Fix loose joints and mirror polish' }
    ]
  },
  {
    id: 'cat-furniture',
    name: 'Furniture',
    nameUrdu: 'فرنیچر مرمت و پالش',
    icon: '🪑',
    description: 'Sofa cushioning, chair upholstery, polish touch up, bed repair',
    order: 29,
    isActive: true,
    services: [
      { id: 'srv-furn-cushion', name: 'Sofa Cushioning & Fabric Change', nameUrdu: 'صوفہ پوشش و فوم تبدیلی', basePrice: 3000, description: 'High density foam and fabric fitting' }
    ]
  },
  {
    id: 'cat-interior',
    name: 'Interior / Decoration',
    nameUrdu: 'انٹیرئیر و وال پیپر',
    icon: '🛋️',
    description: 'Wallpaper installation, false ceiling, PVC wall paneling, UV sheets',
    order: 30,
    isActive: true,
    services: [
      { id: 'srv-int-wallpaper', name: 'Wallpaper Roll Installation', nameUrdu: 'وال پیپر لگانا فی رول', basePrice: 700, description: 'Seamless bubble-free adhesive paste' }
    ]
  },
  {
    id: 'cat-gardening',
    name: 'Gardening / Landscaping',
    nameUrdu: 'باغبانی و مالی سروس',
    icon: '🌱',
    description: 'Lawn mowing, tree trimming, plant fertilizer, garden pest control',
    order: 31,
    isActive: true,
    services: [
      { id: 'srv-gard-trim', name: 'Lawn Mowing & Hedge Trimming', nameUrdu: 'گھاس کٹائی و پودوں کی تراش', basePrice: 1500, description: 'Complete lawn manicuring' }
    ]
  },
  {
    id: 'cat-pest-control',
    name: 'Pest Control',
    nameUrdu: 'کیڑے مار اسپرے',
    icon: '🦟',
    description: 'Termite (Deemak) treatment, cockroach gel, bed bug & mosquito fumigation',
    order: 32,
    isActive: true,
    services: [
      { id: 'srv-pest-termite', name: 'Termite (Deemak) Anti-Drill Spray', nameUrdu: 'دیمک کا باقاعدہ علاج', basePrice: 5000, description: 'Borer spray with 2-year warranty' },
      { id: 'srv-pest-cockroach', name: 'Cockroach & Bed Bug Fumigation', nameUrdu: 'لال بیگ اور کھٹمل اسپرے', basePrice: 3000, description: 'Odorless non-toxic gel treatment' }
    ]
  },
  {
    id: 'cat-laundry',
    name: 'Laundry / Dry Cleaning',
    nameUrdu: 'لانڈری و ڈرائی کلیننگ',
    icon: '👔',
    description: 'Clothes wash & press, suit dry cleaning, curtain & blanket washing',
    order: 33,
    isActive: true,
    services: [
      { id: 'srv-laun-steam', name: 'Steam Pressing & Ironing', nameUrdu: 'اسٹیم استری', basePrice: 500, description: 'Crease-free steam iron delivery' }
    ]
  },
  {
    id: 'cat-moving',
    name: 'Moving / Shifting',
    nameUrdu: 'شفٹنگ و گھر منتقل کرنا',
    icon: '📦',
    description: 'House shifting laborers, furniture packing, loading & unloading',
    order: 34,
    isActive: true,
    services: [
      { id: 'srv-mov-labor', name: 'Shifting Laborers (Per Person)', nameUrdu: 'شفٹنگ لیبر فی بندہ', basePrice: 1500, description: 'Careful loading, carrying and placement' }
    ]
  },
  {
    id: 'cat-delivery',
    name: 'Delivery / Transport',
    nameUrdu: 'سامان ترسیل و پک اپ',
    icon: '🚚',
    description: 'Suzuki pickup, Shehzore, goods carrier for home & market logistics',
    order: 35,
    isActive: true,
    services: [
      { id: 'srv-del-suzuki', name: 'Suzuki Pickup Ride (City Limit)', nameUrdu: 'سوزوکی پک اپ گاڑی', basePrice: 2000, description: 'Cargo transportation inside city' }
    ]
  },
  {
    id: 'cat-car-repair',
    name: 'Car Repair',
    nameUrdu: 'گاڑی مکینک سروسز',
    icon: '🚗',
    description: 'Doorstep car tuning, brake pads, oil filter change, diagnostic scan',
    order: 36,
    isActive: true,
    services: [
      { id: 'srv-car-tune', name: 'Doorstep Engine Oil & Filter Change', nameUrdu: 'گھر پر انجن آئل تبدیلی', basePrice: 1000, description: 'Oil drain, filter swap and top-ups' },
      { id: 'srv-car-brake', name: 'Brake Service & Disc Resurfacing', nameUrdu: 'بریک سروس و لیفٹ', basePrice: 1500, description: 'Front & rear pad replacement' }
    ]
  },
  {
    id: 'cat-car-washing',
    name: 'Car Washing / Detailing',
    nameUrdu: 'کار واش و ڈیٹیلنگ',
    icon: '🧼',
    description: 'Doorstep waterless car wash, interior vacuuming, compound polish',
    order: 37,
    isActive: true,
    services: [
      { id: 'srv-car-wash', name: 'Complete Doorstep Car Wash & Wax', nameUrdu: 'گھر پر کار واش و ویکس', basePrice: 1200, description: 'Foam wash, interior suction vacuum' }
    ]
  },
  {
    id: 'cat-bike-repair',
    name: 'Bike / Motorcycle Repair',
    nameUrdu: 'موٹر سائیکل مرمت',
    icon: '🏍️',
    description: '70cc / 125cc doorstep tuning, puncture fix, clutch plate, chain sprocket',
    order: 38,
    isActive: true,
    services: [
      { id: 'srv-bike-tune', name: 'Motorcycle Full Tuning & Oil Change', nameUrdu: 'موٹرسائیکل مکمل ٹیوننگ', basePrice: 600, description: 'Carburetor clean, tappet adjust' }
    ]
  },
  {
    id: 'cat-beauty-salon',
    name: 'Beauty / Salon',
    nameUrdu: 'بیوٹی پارلر سروسز',
    icon: '💇‍♀️',
    description: 'At-home facial, waxing, threading, hair spa, manicure & pedicure',
    order: 39,
    isActive: true,
    services: [
      { id: 'srv-beauty-facial', name: 'Hydra / Whitening Herbal Facial', nameUrdu: 'ہربل فیشل گھر پر', basePrice: 2000, description: 'Deep pore clean, scrub and mask' },
      { id: 'srv-beauty-mani', name: 'Mani-Pedi Spa Treatment', nameUrdu: 'مینیکیور اور پیڈیکیور', basePrice: 1800, description: 'Nail shaping, cuticle care, scrub' }
    ]
  },
  {
    id: 'cat-makeup',
    name: 'Makeup',
    nameUrdu: 'میک اپ آرٹسٹ',
    icon: '💄',
    description: 'Party makeup, bridal makeup, engagement styling at your doorstep',
    order: 40,
    isActive: true,
    services: [
      { id: 'srv-mu-party', name: 'Party Makeup with Hairstyle', nameUrdu: 'پارٹی میک اپ و ہیئر اسٹائل', basePrice: 3500, description: 'Lashes, contouring and trendy hair' }
    ]
  },
  {
    id: 'cat-barber',
    name: 'Barber',
    nameUrdu: 'حجام و کٹنگ سروس',
    icon: '✂️',
    description: 'Men & kids haircut at home, beard styling, charcoal face polish',
    order: 41,
    isActive: true,
    services: [
      { id: 'srv-barber-cut', name: 'Home Haircut & Beard Grooming', nameUrdu: 'گھر پر بال کٹائی و شیو', basePrice: 800, description: 'Sanitized scissors, blades, styling' }
    ]
  },
  {
    id: 'cat-tailoring',
    name: 'Tailoring / Stitching',
    nameUrdu: 'درزی و سلائی سروس',
    icon: '🪡',
    description: 'Ladies suit stitching, gents shalwar kameez, alteration doorstep pickup',
    order: 42,
    isActive: true,
    services: [
      { id: 'srv-tailor-suit', name: 'Ladies 3-Piece Suit Stitching', nameUrdu: 'لیڈیز تھری پیس سلائی', basePrice: 1500, description: 'Piping, lace work, custom fit' }
    ]
  },
  {
    id: 'cat-cooking',
    name: 'Cooking / Chef',
    nameUrdu: 'باورچی و کھانا پکانا',
    icon: '👨‍🍳',
    description: 'Home cook for family events, daily meal preparation, biryani specialist',
    order: 43,
    isActive: true,
    services: [
      { id: 'srv-cook-event', name: 'Event / Dawat Chef (Per Day)', nameUrdu: 'دعوت و تقریب کا باورچی', basePrice: 3500, description: 'Delicious Pakistani cuisines' }
    ]
  },
  {
    id: 'cat-catering',
    name: 'Catering',
    nameUrdu: 'کیٹرنگ سروس',
    icon: '🍽️',
    description: 'Degh cooking, crockery on rent, buffet counter setup for ceremonies',
    order: 44,
    isActive: true,
    services: [
      { id: 'srv-cat-degh', name: 'Biryani / Qorma Degh Service', nameUrdu: 'دیگ پکوائی سروس', basePrice: 4000, description: 'Master chef preparation' }
    ]
  },
  {
    id: 'cat-photography',
    name: 'Photography',
    nameUrdu: 'فوٹوگرافی سروسز',
    icon: '📸',
    description: 'Family portraits, birthday coverage, product catalog shoot, wedding photography',
    order: 45,
    isActive: true,
    services: [
      { id: 'srv-photo-event', name: 'Birthday / Small Event Shoot (2 Hrs)', nameUrdu: 'سالگرہ و تقریب فوٹوگرافی', basePrice: 5000, description: 'Edited high-resolution soft copies' }
    ]
  },
  {
    id: 'cat-videography',
    name: 'Videography',
    nameUrdu: 'ویڈیو گرافی',
    icon: '🎥',
    description: 'Cinematic video shoot, drone coverage, 4K reel editing',
    order: 46,
    isActive: true,
    services: [
      { id: 'srv-video-reel', name: 'Event Highlight Video & Reel', nameUrdu: 'ہائی لائٹ ویڈیو اور ریل', basePrice: 6000, description: 'Edited teaser with music' }
    ]
  },
  {
    id: 'cat-event-services',
    name: 'Event Services',
    nameUrdu: 'تقریبات سجاوٹ و انتظامات',
    icon: '🎉',
    description: 'Balloon arch, stage backdrop, sound system & lightings for celebrations',
    order: 47,
    isActive: true,
    services: [
      { id: 'srv-evt-decor', name: 'Birthday Backdrop & Balloon Setup', nameUrdu: 'سالگرہ تھیم سجاوٹ', basePrice: 4000, description: 'Custom thematic wall' }
    ]
  },
  {
    id: 'cat-tutors',
    name: 'Tutors / Education',
    nameUrdu: 'ہوم ٹیوٹر و تدریس',
    icon: '📚',
    description: 'Matric, FSc, O/A Levels home tutors, Quran recitation teacher',
    order: 48,
    isActive: true,
    services: [
      { id: 'srv-tut-home', name: 'Home Tutor (1 Month Demo)', nameUrdu: 'گھر پر ہوم ٹیوٹر', basePrice: 5000, description: 'Qualified subject specialist' }
    ]
  },
  {
    id: 'cat-fitness',
    name: 'Fitness / Personal Training',
    nameUrdu: 'فٹنس و جم ٹرینر',
    icon: '🏋️',
    description: 'Home workout coach, weight loss diet plan, yoga instructor',
    order: 49,
    isActive: true,
    services: [
      { id: 'srv-fit-coach', name: 'Personal Home Fitness Session', nameUrdu: 'ذاتی فٹنس ٹریننگ', basePrice: 1500, description: 'Custom cardio and strength drills' }
    ]
  },
  {
    id: 'cat-security',
    name: 'Security Services',
    nameUrdu: 'سیکیورٹی گارڈ سروسز',
    icon: '🛡️',
    description: 'Verified security guards for house, event security bouncers',
    order: 50,
    isActive: true,
    services: [
      { id: 'srv-sec-event', name: 'Event Security Guard (Per Day)', nameUrdu: 'سیکیورٹی گارڈ فی تقریب', basePrice: 2500, description: 'Uniformed vigilant security' }
    ]
  },
  {
    id: 'cat-pet-services',
    name: 'Pet Services',
    nameUrdu: 'پالتو جانوروں کی دیکھ بھال',
    icon: '🐾',
    description: 'Doorstep cat & dog grooming, bath, nail clipping, vet vaccination',
    order: 51,
    isActive: true,
    services: [
      { id: 'srv-pet-groom', name: 'Cat / Dog Haircut & Medicated Bath', nameUrdu: 'جانوروں کی کٹنگ و نہلانا', basePrice: 2000, description: 'Gentle handling by animal lover' }
    ]
  },
  {
    id: 'cat-babysitting',
    name: 'Babysitting / Childcare',
    nameUrdu: 'بچوں کی دیکھ بھال / آیا',
    icon: '👶',
    description: 'Trained babysitter, nanny, elderly care attendant',
    order: 52,
    isActive: true,
    services: [
      { id: 'srv-baby-care', name: 'Part-time Childcare (Per Shift)', nameUrdu: 'بچوں کی دیکھ بھال', basePrice: 2000, description: 'Attentive caring assistance' }
    ]
  },
  {
    id: 'cat-professional',
    name: 'Professional / Business Services',
    nameUrdu: 'پیشہ ورانہ سروسز',
    icon: '💼',
    description: 'FBR tax filer, NTN registration, legal affidavit stamping',
    order: 53,
    isActive: true,
    services: [
      { id: 'srv-prof-tax', name: 'FBR Individual Tax Return Filing', nameUrdu: 'انکم ٹیکس گوشوارے جمع کرانا', basePrice: 2500, description: 'Become active filer swiftly' }
    ]
  },
  {
    id: 'cat-digital',
    name: 'Digital / Online Services',
    nameUrdu: 'ڈیجیٹل و آن لائن سروسز',
    icon: '💻',
    description: 'Graphic design, logo design, social media marketing, data entry',
    order: 54,
    isActive: true,
    services: [
      { id: 'srv-dig-logo', name: 'Business Logo & Social Post Design', nameUrdu: 'لوگو اور پوسٹ ڈیزائن', basePrice: 2000, description: 'Clean modern branding' }
    ]
  },
  {
    id: 'cat-other',
    name: 'Other Services',
    nameUrdu: 'دیگر تمام سروسز',
    icon: '⭐',
    description: 'Custom assistance, special requests and miscellaneous doorstep work',
    order: 55,
    isActive: true,
    services: [
      { id: 'srv-other-custom', name: 'General Doorstep Assistance', nameUrdu: 'عمومی ہوم سروس', basePrice: 1000, description: 'Assistance tailored to your specific requirements' }
    ]
  }
];

export const INITIAL_POSTERS: HeroPoster[] = [
  {
    id: 'poster-1',
    title: 'Expert Plumbing & Leakage Solutions',
    titleUrdu: 'ماہر پلمبنگ اور لیکج کا فوری حل',
    subtitle: 'Verified master plumbers ready at your doorstep within 30 minutes',
    subtitleUrdu: 'تصدیق شدہ پلمبر صرف 30 منٹ میں آپ کی دہلیز پر',
    category: 'Plumbing',
    serviceName: 'Pipe Leakage Repair',
    imageUrl: '/src/assets/images/worker_plumber_hero_1790860703526.jpg',
    buttonText: 'Book a Plumber',
    buttonTextUrdu: 'پلمبر بک کریں',
    displayOrder: 1,
    durationSeconds: 5,
    isActive: true
  },
  {
    id: 'poster-2',
    title: 'Certified Electricians for Safe Wiring',
    titleUrdu: 'محفوظ وائرنگ کے لیے تصدیق شدہ الیکٹریشن',
    subtitle: 'Short circuits, fans, DB boards and UPS wiring handled with care',
    subtitleUrdu: 'شارٹ سرکٹ، بریکر، پنکھے اور یو پی ایس وائرنگ کی مکمل مرمت',
    category: 'Electrical',
    serviceName: 'Short Circuit & Fault Finding',
    imageUrl: '/src/assets/images/worker_electrician_hero_1790860717603.jpg',
    buttonText: 'Find Electrician',
    buttonTextUrdu: 'الیکٹریشن تلاش کریں',
    displayOrder: 2,
    durationSeconds: 5,
    isActive: true
  },
  {
    id: 'poster-3',
    title: 'Beat The Heat with Inverter AC Pros',
    titleUrdu: 'انورٹر اے سی کی ماسٹر سروس و گیس ریفل',
    subtitle: 'Chemical wash, refrigerant charging and PCB board diagnostics',
    subtitleUrdu: 'کیمیکل واش، پریشر ٹیسٹنگ اور گیس ریفل مناسب ریٹ پر',
    category: 'AC & HVAC',
    serviceName: 'AC Master Chemical Wash',
    imageUrl: '/src/assets/images/worker_ac_tech_hero_1790860731624.jpg',
    buttonText: 'Book AC Tech',
    buttonTextUrdu: 'اے سی ٹیکنیشن بک کریں',
    displayOrder: 3,
    durationSeconds: 5,
    isActive: true
  },
  {
    id: 'poster-4',
    title: 'Spotless Deep Home Cleaning Specialists',
    titleUrdu: 'گھر کی مکمل اور چمکدار ڈیپ کلیننگ',
    subtitle: 'Professional equipment, eco-safe sanitization and trusted staff',
    subtitleUrdu: 'جدید آلات اور محفوظ کیمیکل سے مکمل گھر اور کچن کی صفائی',
    category: 'Home Cleaning',
    serviceName: 'Standard Full Home Cleaning',
    imageUrl: '/src/assets/images/worker_cleaner_hero_1790860747309.jpg',
    buttonText: 'Book Cleaning',
    buttonTextUrdu: 'صفائی بک کریں',
    displayOrder: 4,
    durationSeconds: 5,
    isActive: true
  }
];

class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (e) {
        console.error('Failed to parse database file, re-initializing', e);
      }
    }
    return this.initializeSeedData();
  }

  private initializeSeedData(): DatabaseSchema {
    const adminSalt = generateSalt();
    const adminPasswordHash = hashPassword('admin123', adminSalt);

    const worker1Salt = generateSalt();
    const worker2Salt = generateSalt();
    const worker3Salt = generateSalt();
    const worker4Salt = generateSalt();

    const customer1Salt = generateSalt();

    const seed: DatabaseSchema = {
      users: [
        {
          id: 'admin-1',
          role: 'admin',
          name: 'FIRST STEP Central Admin',
          mobile: '03209976716',
          email: 'admin@firststep.pk',
          city: 'Islamabad',
          area: 'Blue Area',
          address: 'FIRST STEP Operations HQ, Islamabad',
          createdAt: new Date().toISOString(),
          status: 'active',
          salt: adminSalt,
          passwordHash: adminPasswordHash
        },
        {
          id: 'worker-user-1',
          role: 'worker',
          name: 'Muhammad Tariq',
          mobile: '03001234567',
          email: 'tariq.plumber@gmail.com',
          city: 'Karachi',
          area: 'Gulshan-e-Iqbal',
          address: 'Block 13-D, Gulshan-e-Iqbal',
          avatarUrl: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&auto=format&fit=crop&q=80',
          createdAt: new Date().toISOString(),
          status: 'active',
          salt: worker1Salt,
          passwordHash: hashPassword('worker123', worker1Salt)
        },
        {
          id: 'worker-user-2',
          role: 'worker',
          name: 'Rashid Khan Electrician',
          mobile: '03112345678',
          email: 'rashid.electric@gmail.com',
          city: 'Lahore',
          area: 'Gulberg',
          address: 'Main Market, Gulberg III',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
          createdAt: new Date().toISOString(),
          status: 'active',
          salt: worker2Salt,
          passwordHash: hashPassword('worker123', worker2Salt)
        },
        {
          id: 'worker-user-3',
          role: 'worker',
          name: 'Bilal Ahmed AC Specialist',
          mobile: '03334567890',
          email: 'bilal.ac@gmail.com',
          city: 'Islamabad',
          area: 'F-10',
          address: 'Sector F-10/2',
          avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
          createdAt: new Date().toISOString(),
          status: 'active',
          salt: worker3Salt,
          passwordHash: hashPassword('worker123', worker3Salt)
        },
        {
          id: 'worker-user-4',
          role: 'worker',
          name: 'Farooq Carpentry Works',
          mobile: '03456789012',
          email: 'farooq.wood@gmail.com',
          city: 'Rawalpindi',
          area: 'Saddar',
          address: 'Kashmir Road, Saddar',
          avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
          createdAt: new Date().toISOString(),
          status: 'active',
          salt: worker4Salt,
          passwordHash: hashPassword('worker123', worker4Salt)
        },
        {
          id: 'customer-user-1',
          role: 'customer',
          name: 'Kamran Siddiqui',
          mobile: '03219876543',
          email: 'kamran@example.com',
          city: 'Karachi',
          area: 'DHA Phase 6',
          address: 'Khayaban-e-Ittehad, Phase 6',
          createdAt: new Date().toISOString(),
          status: 'active',
          salt: customer1Salt,
          passwordHash: hashPassword('customer123', customer1Salt)
        }
      ],
      workers: [
        {
          id: 'worker-profile-1',
          userId: 'worker-user-1',
          name: 'Muhammad Tariq',
          mobile: '03001234567',
          city: 'Karachi',
          area: 'Gulshan-e-Iqbal',
          services: ['Pipe Leakage Repair', 'Tap / Mixer Installation', 'Drain Unblocking & Sewerage'],
          categories: ['Plumbing', 'Sanitary Services'],
          experience: '5–10 years',
          startingPrice: 800,
          priceType: 'fixed',
          visitCharge: 300,
          about: 'Experienced plumbing technician with 8 years of residential and commercial experience in Karachi. Master in hidden leak detection and pressure pipeline joints.',
          rating: 4.9,
          reviewCount: 38,
          completedJobsCount: 42,
          verificationStatus: 'verified',
          availability: 'available',
          avatarUrl: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&auto=format&fit=crop&q=80',
          cnicStatus: 'approved',
          portfolio: [
            { id: 'port-1', title: 'Bathroom pipeline overhaul', imageUrl: '/src/assets/images/worker_plumber_hero_1790860703526.jpg' }
          ],
          badges: ['Top Rated', 'Verified ID', 'Quick Responder'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'worker-profile-2',
          userId: 'worker-user-2',
          name: 'Rashid Khan Electrician',
          mobile: '03112345678',
          city: 'Lahore',
          area: 'Gulberg',
          services: ['Short Circuit & Fault Finding', 'Ceiling Fan Installation & Repair', 'Distribution Box (DB) & Breakers'],
          categories: ['Electrical'],
          experience: '5–10 years',
          startingPrice: 600,
          priceType: 'fixed',
          visitCharge: 300,
          about: 'Government certified electrician. Specialized in circuit breakers, UPS, DB load balancing and emergency short-circuit troubleshooting.',
          rating: 4.8,
          reviewCount: 29,
          completedJobsCount: 35,
          verificationStatus: 'verified',
          availability: 'available',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
          cnicStatus: 'approved',
          portfolio: [
            { id: 'port-2', title: 'Smart Distribution Box Wiring', imageUrl: '/src/assets/images/worker_electrician_hero_1790860717603.jpg' }
          ],
          badges: ['Verified ID', 'Electrical Master'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'worker-profile-3',
          userId: 'worker-user-3',
          name: 'Bilal Ahmed AC Specialist',
          mobile: '03334567890',
          city: 'Islamabad',
          area: 'F-10',
          services: ['AC Master Chemical Wash', 'AC Gas Refill (R410 / R32 / R22)', 'AC Installation / Dismantle'],
          categories: ['AC & HVAC'],
          experience: '3–5 years',
          startingPrice: 1500,
          priceType: 'fixed',
          visitCharge: 500,
          about: 'Inverter AC specialist serving Islamabad & Rawalpindi. We provide vacuum pressure testing, original Honeywell R410 refrigerant and chemical service.',
          rating: 5.0,
          reviewCount: 22,
          completedJobsCount: 26,
          verificationStatus: 'verified',
          availability: 'available',
          avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
          cnicStatus: 'approved',
          portfolio: [
            { id: 'port-3', title: 'Inverter AC Chemical Wash', imageUrl: '/src/assets/images/worker_ac_tech_hero_1790860731624.jpg' }
          ],
          badges: ['5-Star Pro', 'Verified ID'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'worker-profile-4',
          userId: 'worker-user-4',
          name: 'Farooq Carpentry Works',
          mobile: '03456789012',
          city: 'Rawalpindi',
          area: 'Saddar',
          services: ['Door Lock & Hinge Repair', 'Wardrobe & Cabinet Repair', 'Furniture Assembly & Polish'],
          categories: ['Carpenter', 'Furniture'],
          experience: '10+ years',
          startingPrice: null,
          priceType: 'discuss',
          visitCharge: 400,
          about: 'Master carpenter with 12+ years in wooden door restoration, modern kitchen cabinets, hydraulic hinges and antique furniture polish.',
          rating: 4.9,
          reviewCount: 45,
          completedJobsCount: 51,
          verificationStatus: 'verified',
          availability: 'available',
          avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
          cnicStatus: 'approved',
          portfolio: [],
          badges: ['Master Craftsman', 'Verified ID'],
          createdAt: new Date().toISOString()
        }
      ],
      categories: INITIAL_CATEGORIES,
      bookings: [
        {
          id: 'bk-1001',
          customerId: 'customer-user-1',
          customerName: 'Kamran Siddiqui',
          customerMobile: '03219876543',
          workerId: 'worker-profile-1',
          workerName: 'Muhammad Tariq',
          workerMobile: '03001234567',
          serviceName: 'Pipe Leakage Repair',
          categoryName: 'Plumbing',
          bookingDate: '2026-10-02',
          bookingTime: '11:00 AM',
          city: 'Karachi',
          area: 'DHA Phase 6',
          address: 'House 42-B, Street 14, Khayaban-e-Ittehad',
          description: 'Main bathroom sink valve is leaking beneath the wall.',
          photos: [],
          status: 'customer_confirmed',
          totalAmount: 1800,
          commissionPercent: 10,
          commissionAmount: 180,
          workerPayoutAmount: 1620,
          additionalCharges: [],
          paymentId: 'pay-2001',
          isPaid: true,
          customerConfirmedAt: '2026-10-01T10:00:00Z',
          completedAt: '2026-10-01T09:30:00Z',
          createdAt: '2026-09-30T14:20:00Z'
        }
      ],
      customJobs: [
        {
          id: 'job-5001',
          customerId: 'customer-user-1',
          customerName: 'Kamran Siddiqui',
          customerMobile: '03219876543',
          title: 'Emergency Main Line Water Leakage',
          categoryName: 'Plumbing',
          serviceName: 'Pipe Leakage Repair',
          description: 'Water is dripping from the false ceiling under the second floor bathroom. Need immediate investigation and pipe repair today.',
          photos: [],
          city: 'Karachi',
          area: 'DHA Phase 6',
          address: 'House 42-B, Street 14, Khayaban-e-Ittehad',
          date: '2026-10-02',
          urgency: 'urgent',
          budget: 2500,
          status: 'open',
          offersCount: 1,
          createdAt: '2026-10-01T05:00:00Z'
        }
      ],
      jobOffers: [
        {
          id: 'off-7001',
          jobId: 'job-5001',
          workerId: 'worker-profile-1',
          workerName: 'Muhammad Tariq',
          workerRating: 4.9,
          workerCompletedJobs: 42,
          proposedPrice: 2200,
          message: 'I have ultrasonic leak detector tools and can be at your place in 45 minutes.',
          estimatedArrival: 'Today within 45 mins',
          status: 'pending',
          createdAt: '2026-10-01T05:25:00Z'
        }
      ],
      paymentMethods: [
        {
          id: 'pm-meezan',
          name: 'Meezan Bank',
          accountTitle: 'FIRST STEP SERVICES (PVT) LTD',
          accountNumber: '02010108929381',
          iban: 'PK45MEZN0002010108929381',
          instructions: 'Transfer the exact amount to FIRST STEP Meezan Bank account. After payment, take a screenshot and enter your 6 to 12 digit Transaction ID (Trx ID) for verification.',
          isActive: true,
          order: 1
        },
        {
          id: 'pm-raast',
          name: 'Raast',
          accountTitle: 'FIRST STEP SERVICES',
          accountNumber: '03209976716',
          raastId: '03209976716',
          instructions: 'Send instant fee-free payment via Raast ID: 03209976716. Enter your Raast reference number below.',
          isActive: true,
          order: 2
        },
        {
          id: 'pm-easypaisa',
          name: 'Easypaisa',
          accountTitle: 'FIRST STEP OFFICIAL',
          accountNumber: '03209976716',
          easypaisaNumber: '03209976716',
          instructions: 'Open your Easypaisa App and send money to Mobile Account 03209976716. Upload the 3737 confirmation SMS screenshot or Trx ID.',
          isActive: true,
          order: 3
        }
      ],
      payments: [
        {
          id: 'pay-2001',
          bookingId: 'bk-1001',
          customerId: 'customer-user-1',
          customerName: 'Kamran Siddiqui',
          amount: 1800,
          paymentMethodId: 'pm-meezan',
          paymentMethodName: 'Meezan Bank',
          transactionId: 'TXN-98471289',
          paymentDate: '2026-10-01',
          status: 'confirmed',
          verifiedAt: '2026-10-01T08:00:00Z',
          verifiedByAdminId: 'admin-1',
          createdAt: '2026-10-01T07:30:00Z'
        }
      ],
      workerPayouts: [
        {
          id: 'payout-3001',
          workerId: 'worker-profile-1',
          workerName: 'Muhammad Tariq',
          bookingId: 'bk-1001',
          customerPayment: 1800,
          commission: 180,
          bonus: 0,
          adjustments: 0,
          netPayout: 1620,
          status: 'released',
          releasedAt: '2026-10-01T10:15:00Z',
          createdAt: '2026-10-01T10:05:00Z'
        }
      ],
      performanceBonuses: [
        {
          id: 'pb-1',
          title: 'Top Performer Bonus (Rating > 4.8)',
          description: 'Workers maintaining 4.8+ rating receive PKR 1,000 monthly bonus',
          bonusAmount: 1000,
          criteria: 'rating_above',
          threshold: 4.8,
          isActive: true
        },
        {
          id: 'pb-2',
          title: 'High Volume Performer (20+ Jobs)',
          description: 'Workers completing more than 20 jobs monthly receive PKR 1,500 bonus',
          bonusAmount: 1500,
          criteria: 'completed_jobs_above',
          threshold: 20,
          isActive: true
        }
      ],
      reviews: [
        {
          id: 'rev-1',
          bookingId: 'bk-1001',
          workerId: 'worker-profile-1',
          customerId: 'customer-user-1',
          customerName: 'Kamran Siddiqui',
          rating: 5,
          comment: 'Very professional and came on time. Detected the pipe leak under the tiles within 10 minutes and repaired it cleanly. Highly recommended!',
          createdAt: '2026-10-01T10:30:00Z'
        }
      ],
      favorites: [
        {
          id: 'fav-1',
          customerId: 'customer-user-1',
          workerId: 'worker-profile-1',
          createdAt: '2026-10-01T10:35:00Z'
        }
      ],
      messages: [
        {
          id: 'msg-1',
          conversationId: 'conv-bk-1001',
          bookingId: 'bk-1001',
          senderId: 'customer-user-1',
          senderName: 'Kamran Siddiqui',
          senderRole: 'customer',
          recipientId: 'worker-user-1',
          text: 'Assalam-o-Alaikum Tariq bhai, please bring an extra 1/2 inch connector valve just in case.',
          timestamp: '2026-09-30T15:00:00Z',
          isRead: true
        },
        {
          id: 'msg-2',
          conversationId: 'conv-bk-1001',
          bookingId: 'bk-1001',
          senderId: 'worker-user-1',
          senderName: 'Muhammad Tariq',
          senderRole: 'worker',
          recipientId: 'customer-user-1',
          text: 'Walaikum Assalam Kamran sb, sure! I have all PPRC and CPVC fittings in my toolkit.',
          timestamp: '2026-09-30T15:04:00Z',
          isRead: true
        }
      ],
      notifications: [
        {
          id: 'notif-1',
          userId: 'customer-user-1',
          role: 'customer',
          title: 'Booking Confirmed',
          message: 'Muhammad Tariq has accepted your booking for Pipe Leakage Repair.',
          type: 'booking',
          isRead: true,
          createdAt: '2026-09-30T14:25:00Z'
        }
      ],
      disputes: [],
      refunds: [],
      posters: INITIAL_POSTERS,
      settings: {
        siteName: 'FIRST STEP',
        contactNumber: '03209976716',
        supportEmail: 'support@firststep.pk',
        defaultCommissionPercent: 10,
        currency: 'PKR',
        heroPostersEnabled: true,
        announcementText: 'Verified workers available across Karachi, Lahore, Islamabad, and Rawalpindi. Pay securely to FIRST STEP company account.'
      },
      auditLogs: [
        {
          id: 'log-1',
          adminId: 'admin-1',
          adminName: 'FIRST STEP Central Admin',
          action: 'System Initialized',
          details: 'Initialized FIRST STEP database with default categories, payment methods, and posters.',
          timestamp: new Date().toISOString()
        }
      ],
      adminTokens: []
    };

    this.saveDataDirect(seed);
    return seed;
  }

  private saveDataDirect(data: DatabaseSchema): void {
    const tmp = `${DB_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmp, DB_FILE);
  }

  public persist(): void {
    this.saveDataDirect(this.data);
  }

  public getDB(): DatabaseSchema {
    return this.data;
  }
}

export const dbManager = new DatabaseManager();
export const db = dbManager.getDB();
