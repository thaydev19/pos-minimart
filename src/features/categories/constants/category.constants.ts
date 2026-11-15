// ============================================================================
// Category Constants: Icons & Color Presets for Minimart Backoffice
// Nearly 100 Curated Lucide Icons Filtered for Minimart & Supermarket Retail
// ============================================================================

export interface CategoryIconOption {
  id: string;
  name_lo: string;
  group: "core" | "food" | "fresh" | "household" | "general";
  keywords?: string;
}

export interface CategoryIconGroup {
  id: "all" | "core" | "food" | "fresh" | "household" | "general";
  name_lo: string;
}

export const CATEGORY_ICON_GROUPS: CategoryIconGroup[] = [
  { id: "all", name_lo: "ທັງໝົດ" },
  { id: "core", name_lo: "ມິນິມາດຍອດນິຍົມ" },
  { id: "food", name_lo: "ເຄື່ອງດື່ມ & ອາຫານ" },
  { id: "fresh", name_lo: "ຜັກສົດ & ຊີ້ນ" },
  { id: "household", name_lo: "ຂອງໃຊ້ & ສຸຂະພາບ" },
  { id: "general", name_lo: "ອຸປະກອນ & ທົ່ວໄປ" },
];

// 1. Core Minimart Icons (16 top retail convenience store icons)
// The first 11 are displayed in default 2-row view (Slot 12 is the "More" button)
export const MINIMART_CORE_ICONS: CategoryIconOption[] = [
  { id: "Cookie", name_lo: "ເຂົ້າໜົມ / ຄຸກກີ້", group: "core", keywords: "cookie snack biscuit cake sweet" },
  { id: "CupSoda", name_lo: "ນ້ຳຫວານ / ໂຊດາ", group: "core", keywords: "cup soda soft drink beverage juice" },
  { id: "Coffee", name_lo: "ກາເຟ & ຊາ", group: "core", keywords: "coffee tea cup cafe hot drink" },
  { id: "Milk", name_lo: "ນົມ & ນ້ຳດື່ມ", group: "core", keywords: "milk dairy water drink bottle" },
  { id: "Beer", name_lo: "ເບຍ & ເຄື່ອງດື່ມມຶນເມົາ", group: "core", keywords: "beer alcohol drink can bottle" },
  { id: "Utensils", name_lo: "ອາຫານ & ໝີ່ກ່ອງ", group: "core", keywords: "noodle food restaurant eat lunch" },
  { id: "Apple", name_lo: "ໝາກໄມ້ສົດ", group: "core", keywords: "apple fruit fresh healthy" },
  { id: "Scale", name_lo: "ຊັ່ງກິໂລ / ຜັກສົດ", group: "core", keywords: "scale weight fresh vegetable kilo" },
  { id: "Candy", name_lo: "ລູກອົມ & ໝາກຝຣັ່ງ", group: "core", keywords: "candy sweet gum sugar" },
  { id: "ShoppingBag", name_lo: "ເຄື່ອງໃຊ້ປະຈຳວັນ", group: "core", keywords: "bag shop retail store daily" },
  { id: "Sparkles", name_lo: "ສິນຄ້າໂປຣໂມຊັ່ນ", group: "core", keywords: "sparkles promo special clean new" },
  { id: "Sandwich", name_lo: "ເຂົ້າຈີ່ & ແຊນວິດ", group: "core", keywords: "sandwich bread burger bakery breakfast" },
  { id: "Pizza", name_lo: "ພິຊຊ່າ & ອາຫານດ່ວນ", group: "core", keywords: "pizza fast food cheese" },
  { id: "IceCream", name_lo: "ກະແລັມ & ຂອງເຢັນ", group: "core", keywords: "ice cream cold frozen sweet dessert" },
  { id: "Cigarette", name_lo: "ຢາສູບ & ຢາສູບໄຟຟ້າ", group: "core", keywords: "cigarette tobacco smoke cigar" },
  { id: "Package", name_lo: "ສິນຄ້າທົ່ວໄປ", group: "core", keywords: "package box item general" },
];

// 2. Drinks & Food (16 icons)
export const DRINKS_FOOD_ICONS: CategoryIconOption[] = [
  { id: "Wine", name_lo: "ເຫຼົ້າ & ໄວນ໌", group: "food", keywords: "wine alcohol glass bottle drink" },
  { id: "GlassWater", name_lo: "ນ້ຳດື່ມບໍລິສຸດ", group: "food", keywords: "water glass drink pure cold" },
  { id: "Zap", name_lo: "ເຄື່ອງດື່ມຊູກຳລັງ", group: "food", keywords: "energy zap drink power" },
  { id: "Martini", name_lo: "ຄັອກເທວ & ເຫຼົ້າປະສົມ", group: "food", keywords: "cocktail martini alcohol party" },
  { id: "Citrus", name_lo: "ນ້ຳໝາກກ້ຽງ & ໝາກນາວ", group: "food", keywords: "citrus orange lemon juice fruit" },
  { id: "UtensilsCrossed", name_lo: "ຮ້ານອາຫານ & ປຸງແຕ່ງ", group: "food", keywords: "restaurant food kitchen cook" },
  { id: "Soup", name_lo: "ແກງ & ອາຫານກະປ໋ອງ", group: "food", keywords: "soup bowl hot canned food" },
  { id: "Croissant", name_lo: "ເບເກີຣີ່ & ຄົວຊອງ", group: "food", keywords: "croissant bakery bread french" },
  { id: "Popcorn", name_lo: "ປ໊ອບຄອນ & ສາລີ", group: "food", keywords: "popcorn corn snack cinema" },
  { id: "Cake", name_lo: "ເຄັກ & ຂອງຫວານ", group: "food", keywords: "cake birthday sweet dessert party" },
  { id: "Donut", name_lo: "ໂດນັດ & ຂະໜົມຫວານ", group: "food", keywords: "donut sweet bakery sugar ring" },
  { id: "Nut", name_lo: "ຖົ່ວ & ທັນຍາພືດ", group: "food", keywords: "nut peanut almond grain snack" },
  { id: "Wheat", name_lo: "ເຂົ້າສານ & ແປ້ງ", group: "food", keywords: "wheat rice grain cereal flour" },
  { id: "Salad", name_lo: "ສະລັດ & ຜັກປຸງແຕ່ງ", group: "food", keywords: "salad vegetable healthy bowl green" },
  { id: "CookingPot", name_lo: "ໝໍ້ຕົ້ມ & ຊອດປຸງລົດ", group: "food", keywords: "pot cook sauce seasoning condiment" },
  { id: "Flame", name_lo: "ອາຫານປີ້ງ & ໄຟແຊັກ", group: "food", keywords: "fire flame grill bbq lighter" },
];

// 3. Fresh Produce & Meat (9 icons)
export const FRESH_PRODUCE_ICONS: CategoryIconOption[] = [
  { id: "Carrot", name_lo: "ຫົວຜັກກາດ & ຜັກຫົວ", group: "fresh", keywords: "carrot vegetable fresh farm root" },
  { id: "Banana", name_lo: "ກ້ວຍ & ໝາກໄມ້ຫວານ", group: "fresh", keywords: "banana fruit yellow sweet" },
  { id: "Cherry", name_lo: "ເຊີຣີ່ & ໝາກໄມ້ນຳເຂົ້າ", group: "fresh", keywords: "cherry berry fruit red" },
  { id: "Grape", name_lo: "ໝາກອະງຸ່ນ", group: "fresh", keywords: "grape fruit wine purple" },
  { id: "Fish", name_lo: "ປາ & ອາຫານທະເລ", group: "fresh", keywords: "fish seafood fresh ocean river" },
  { id: "Beef", name_lo: "ຊີ້ນສົດ & ຊີ້ນງົວ", group: "fresh", keywords: "beef meat fresh pork steak raw" },
  { id: "Egg", name_lo: "ໄຂ່ໄກ່ & ໄຂ່ເປັດ", group: "fresh", keywords: "egg fresh protein chicken duck" },
  { id: "EggFried", name_lo: "ໄຂ່ດາວ & ອາຫານໄຂ່", group: "fresh", keywords: "fried egg breakfast cook pan" },
  { id: "Drumstick", name_lo: "ຊີ້ນໄກ່ & ຂາໄກ່", group: "fresh", keywords: "chicken meat drumstick poultry fry" },
];

// 4. Household & Personal Care (15 icons)
export const HOUSEHOLD_CARE_ICONS: CategoryIconOption[] = [
  { id: "Bath", name_lo: "ສະບູ & ຢາສະຜົມ", group: "household", keywords: "bath soap shampoo wash clean bathroom" },
  { id: "ShowerHead", name_lo: "ເຄື່ອງອາບນ້ຳ", group: "household", keywords: "shower bath water bathroom" },
  { id: "SprayCan", name_lo: "ສະເປຣ & ນ້ຳຫອມ", group: "household", keywords: "spray perfume air deodorizer can" },
  { id: "Brush", name_lo: "ແປງຖູແຂ້ວ & ທຳຄວາມສະອາດ", group: "household", keywords: "brush clean teeth broom hygiene" },
  { id: "Scissors", name_lo: "ມີດຕັດ & ອຸປະກອນຕັດ", group: "household", keywords: "scissors cut office tool craft" },
  { id: "Shirt", name_lo: "ເຄື່ອງນຸ່ງ & ຜ້າເຊັດ", group: "household", keywords: "shirt clothes towel cotton cloth" },
  { id: "Baby", name_lo: "ເຄື່ອງໃຊ້ເດັກນ້ອຍ & ແພມເພີດ", group: "household", keywords: "baby diaper infant kid care" },
  { id: "Smile", name_lo: "ຄວາມງາມ & ເບິ່ງແຍງຜິວ", group: "household", keywords: "smile beauty face lotion skin" },
  { id: "Pill", name_lo: "ຢາສາມັນ & ວິຕາມິນ", group: "household", keywords: "pill medicine drug vitamin health pharmacy" },
  { id: "Bandage", name_lo: "ພຣາສເຕີ & ປະຖົມພະຍາບານ", group: "household", keywords: "bandage aid first plaster wound" },
  { id: "HeartPulse", name_lo: "ສຸຂະພາບ & ການແພດ", group: "household", keywords: "heart health medical care doctor" },
  { id: "Thermometer", name_lo: "ວັດແທກໄຂ້ & ສຸຂະອະນາໄມ", group: "household", keywords: "thermometer fever temp test" },
  { id: "Trash2", name_lo: "ຖົງຂີ້ເຫຍື້ອ & ຂອງໃຊ້ຖິ້ມ", group: "household", keywords: "trash bin bag waste garbage" },
  { id: "Umbrella", name_lo: "ຄັນຮົ່ມ & ເສື້ອກັນຝົນ", group: "household", keywords: "umbrella rain weather coat sun" },
  { id: "Home", name_lo: "ເຄື່ອງໃຊ້ໃນບ້ານ", group: "household", keywords: "home house living interior" },
];

// 5. General & Tech (42 icons)
export const GENERAL_TECH_ICONS: CategoryIconOption[] = [
  { id: "Smartphone", name_lo: "ບັດເຕີມເງິນ & ສາຍສາກ", group: "general", keywords: "phone mobile card sim cable" },
  { id: "Headphones", name_lo: "ຫູຟັງ & ອຸປະກອນສຽງ", group: "general", keywords: "headphones audio earphone music" },
  { id: "BatteryCharging", name_lo: "ແບັດເຕີຣີ່ & ພາວເວີແບັງ", group: "general", keywords: "battery charge power bank" },
  { id: "Battery", name_lo: "ຖ່ານໄຟສາຍ", group: "general", keywords: "battery cell energy power" },
  { id: "Lightbulb", name_lo: "ດອກໄຟ & ໄຟຟ້າ", group: "general", keywords: "light bulb lamp electric idea" },
  { id: "Plug", name_lo: "ປັກສຽບ & ສາຍໄຟ", group: "general", keywords: "plug socket power wire electric" },
  { id: "Wrench", name_lo: "ເຄື່ອງມືຊ່າງ", group: "general", keywords: "wrench tool fix repair hardware" },
  { id: "Hammer", name_lo: "ຄ້ອນຕີ & ອຸປະກອນຊ່ອມ", group: "general", keywords: "hammer tool construction hit" },
  { id: "Bolt", name_lo: "ນັອດ & ເຫຼັກ", group: "general", keywords: "bolt screw metal fast" },
  { id: "FileText", name_lo: "ເຈ້ຍ & ປຶ້ມຂຽນ", group: "general", keywords: "file document paper note" },
  { id: "BookOpen", name_lo: "ວາລະສານ & ປຶ້ມ", group: "general", keywords: "book read magazine paper" },
  { id: "Paperclip", name_lo: "ເຄື່ອງຂຽນ & ຫ້ອງການ", group: "general", keywords: "paperclip clip office station" },
  { id: "Tag", name_lo: "ປ້າຍລາຄາ & ໂປຣໂມຊັ່ນ", group: "general", keywords: "tag price label sale promo" },
  { id: "Tags", name_lo: "ໝວດສິນຄ້າ", group: "general", keywords: "tags label category multi" },
  { id: "Barcode", name_lo: "ສິນຄ້າມີບາໂຄດ", group: "general", keywords: "barcode scan code product" },
  { id: "Receipt", name_lo: "ໃບບິນ & ໃບຮັບເງິນ", group: "general", keywords: "receipt bill invoice paper pos" },
  { id: "Gift", name_lo: "ຂອງຂວັນ & ຂອງຫຼິ້ນ", group: "general", keywords: "gift present box ribbon birthday" },
  { id: "Trophy", name_lo: "ລາງວັນ & ຂອງພຣີມ່ຽມ", group: "general", keywords: "trophy prize winner best" },
  { id: "Award", name_lo: "ສິນຄ້າຄຸນນະພາບ", group: "general", keywords: "award quality medal ribbon" },
  { id: "Watch", name_lo: "ໂມງ & ອຸປະກອນໃສ່", group: "general", keywords: "watch clock time wearable" },
  { id: "Glasses", name_lo: "ແວ່ນຕາ & ແວ່ນກັນແດດ", group: "general", keywords: "glasses sun sight optics" },
  { id: "Clock", name_lo: "ສິນຄ້າດ່ວນ / ເວລາ", group: "general", keywords: "clock time fast quick" },
  { id: "Bell", name_lo: "ແຈ້ງເຕືອນ & ບໍລິການ", group: "general", keywords: "bell notify alert ring service" },
  { id: "Percent", name_lo: "ຫຼຸດລາຄາ %", group: "general", keywords: "percent discount sale offer promo" },
  { id: "Ticket", name_lo: "ຄູປອງ & ປີ້", group: "general", keywords: "ticket voucher coupon cinema" },
  { id: "Wallet", name_lo: "ກະເປົາເງິນ", group: "general", keywords: "wallet money cash pay pocket" },
  { id: "Coins", name_lo: "ເງິນຫຼຽນ / ເງິນສົດ", group: "general", keywords: "coins money cash gold change" },
  { id: "CreditCard", name_lo: "ບັດເຄຣດິດ / ສະແກນ", group: "general", keywords: "card credit debit payment qr" },
  { id: "Key", name_lo: "ກະແຈ & ອຸປະກອນລັອກ", group: "general", keywords: "key unlock door security" },
  { id: "Lock", name_lo: "ແມ່ກະແຈ", group: "general", keywords: "lock secure privacy padlock" },
  { id: "Truck", name_lo: "ສິນຄ້າຈັດສົ່ງ", group: "general", keywords: "truck delivery ship transport" },
  { id: "Bike", name_lo: "ລົດຈັກ / ບໍລິການດ່ວນ", group: "general", keywords: "bike moto motorcycle delivery" },
  { id: "Car", name_lo: "ລົດໃຫຍ່ & ອຸປະກອນລົດ", group: "general", keywords: "car auto vehicle motor" },
  { id: "Store", name_lo: "ສິນຄ້າປະຈຳຮ້ານ", group: "general", keywords: "store shop minimart market" },
  { id: "ShoppingCart", name_lo: "ລົດເຂັນຊື້ເຄື່ອງ", group: "general", keywords: "cart shop supermarket trolley" },
  { id: "Box", name_lo: "ກ່ອງພັດສະດຸ", group: "general", keywords: "box package cardboard delivery" },
  { id: "Boxes", name_lo: "ສິນຄ້າຍົກລັງ", group: "general", keywords: "boxes carton stock wholesale" },
  { id: "PackageOpen", name_lo: "ສິນຄ້າເປີດກ່ອງ", group: "general", keywords: "package open unbox stock" },
  { id: "Bookmark", name_lo: "ສິນຄ້າໝາຍໄວ້", group: "general", keywords: "bookmark favorite star save" },
  { id: "Layers", name_lo: "ຫຼາຍຂະໜາດ / ຊຸດ", group: "general", keywords: "layers stack set units bundle" },
  { id: "Grid", name_lo: "ແຜງສິນຄ້າ", group: "general", keywords: "grid catalog layout sheet" },
  { id: "LayoutGrid", name_lo: "ທັງໝົດ / ອື່ນໆ", group: "general", keywords: "grid all category more" },
];

// All 98 curated Lucide icons in total
export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  ...MINIMART_CORE_ICONS,
  ...DRINKS_FOOD_ICONS,
  ...FRESH_PRODUCE_ICONS,
  ...HOUSEHOLD_CARE_ICONS,
  ...GENERAL_TECH_ICONS,
];

// First 11 icons for the default 2-row view (Slot 12 is the "More" button)
export const DEFAULT_CATEGORY_ICONS: CategoryIconOption[] = MINIMART_CORE_ICONS.slice(0, 11);

export interface CategoryColorOption {
  id: string;
  name_lo: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  dotClass: string;
  activeBtnClass: string;
}

export const CATEGORY_COLOR_OPTIONS: CategoryColorOption[] = [
  {
    id: "emerald",
    name_lo: "ຂຽວມໍລະກົດ",
    bgClass: "bg-emerald-50",
    borderClass: "border-emerald-200",
    textClass: "text-emerald-700",
    dotClass: "bg-emerald-500",
    activeBtnClass: "bg-emerald-600 text-white border-emerald-600 shadow-xs",
  },
  {
    id: "blue",
    name_lo: "ຟ້າຄາມ",
    bgClass: "bg-blue-50",
    borderClass: "border-blue-200",
    textClass: "text-blue-700",
    dotClass: "bg-blue-500",
    activeBtnClass: "bg-blue-600 text-white border-blue-600 shadow-xs",
  },
  {
    id: "amber",
    name_lo: "ສົ້ມທອງ",
    bgClass: "bg-amber-50",
    borderClass: "border-amber-200",
    textClass: "text-amber-800",
    dotClass: "bg-amber-500",
    activeBtnClass: "bg-amber-500 text-white border-amber-500 shadow-xs",
  },
  {
    id: "purple",
    name_lo: "ມ່ວງດອກຮັກ",
    bgClass: "bg-purple-50",
    borderClass: "border-purple-200",
    textClass: "text-purple-700",
    dotClass: "bg-purple-500",
    activeBtnClass: "bg-purple-600 text-white border-purple-600 shadow-xs",
  },
  {
    id: "rose",
    name_lo: "ບົວຊົມພູ",
    bgClass: "bg-rose-50",
    borderClass: "border-rose-200",
    textClass: "text-rose-700",
    dotClass: "bg-rose-500",
    activeBtnClass: "bg-rose-600 text-white border-rose-600 shadow-xs",
  },
  {
    id: "orange",
    name_lo: "ສົ້ມແດງ",
    bgClass: "bg-orange-50",
    borderClass: "border-orange-200",
    textClass: "text-orange-700",
    dotClass: "bg-orange-500",
    activeBtnClass: "bg-orange-600 text-white border-orange-600 shadow-xs",
  },
  {
    id: "indigo",
    name_lo: "ຄາມເຂັ້ມ",
    bgClass: "bg-indigo-50",
    borderClass: "border-indigo-200",
    textClass: "text-indigo-700",
    dotClass: "bg-indigo-500",
    activeBtnClass: "bg-indigo-600 text-white border-indigo-600 shadow-xs",
  },
  {
    id: "cyan",
    name_lo: "ຟ້າອ່ອນ",
    bgClass: "bg-cyan-50",
    borderClass: "border-cyan-200",
    textClass: "text-cyan-700",
    dotClass: "bg-cyan-500",
    activeBtnClass: "bg-cyan-600 text-white border-cyan-600 shadow-xs",
  },
  {
    id: "red",
    name_lo: "ແດງສົດ",
    bgClass: "bg-red-50",
    borderClass: "border-red-200",
    textClass: "text-red-700",
    dotClass: "bg-red-500",
    activeBtnClass: "bg-red-600 text-white border-red-600 shadow-xs",
  },
  {
    id: "slate",
    name_lo: "ຂີ້ເຖົ່າ",
    bgClass: "bg-slate-100",
    borderClass: "border-slate-300",
    textClass: "text-slate-700",
    dotClass: "bg-slate-500",
    activeBtnClass: "bg-slate-700 text-white border-slate-700 shadow-xs",
  },
];
