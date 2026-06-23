// ============================================================
// H-AUTOS GLOBAL — Country, State/Region & Currency Data
// Covers: USA, UK, China, Japan, Nigeria, Canada, Ghana,
//         Kenya, South Africa, UAE, Rwanda, Cameroon, Benin Republic
// ============================================================

export const COUNTRIES = [
  { code: 'NG', name: 'Nigeria',          flag: '🇳🇬', currency: '₦',  currencyCode: 'NGN', phone: '+234' },
  { code: 'US', name: 'USA',              flag: '🇺🇸', currency: '$',  currencyCode: 'USD', phone: '+1'   },
  { code: 'GB', name: 'United Kingdom',   flag: '🇬🇧', currency: '£',  currencyCode: 'GBP', phone: '+44'  },
  { code: 'CN', name: 'China',            flag: '🇨🇳', currency: '¥',  currencyCode: 'CNY', phone: '+86'  },
  { code: 'JP', name: 'Japan',            flag: '🇯🇵', currency: '¥',  currencyCode: 'JPY', phone: '+81'  },
  { code: 'CA', name: 'Canada',           flag: '🇨🇦', currency: 'C$', currencyCode: 'CAD', phone: '+1'   },
  { code: 'GH', name: 'Ghana',            flag: '🇬🇭', currency: '₵',  currencyCode: 'GHS', phone: '+233' },
  { code: 'KE', name: 'Kenya',            flag: '🇰🇪', currency: 'KSh',currencyCode: 'KES', phone: '+254' },
  { code: 'ZA', name: 'South Africa',     flag: '🇿🇦', currency: 'R',  currencyCode: 'ZAR', phone: '+27'  },
  { code: 'AE', name: 'UAE',              flag: '🇦🇪', currency: 'AED',currencyCode: 'AED', phone: '+971' },
  { code: 'RW', name: 'Rwanda',           flag: '🇷🇼', currency: 'RF', currencyCode: 'RWF', phone: '+250' },
  { code: 'CM', name: 'Cameroon',         flag: '🇨🇲', currency: 'FCFA',currencyCode: 'XAF',phone: '+237' },
  { code: 'BJ', name: 'Benin Republic',   flag: '🇧🇯', currency: 'FCFA',currencyCode: 'XOF',phone: '+229' },
];

export const REGIONS_BY_COUNTRY = {
  NG: [
    'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
    'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT - Abuja','Gombe',
    'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
    'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto',
    'Taraba','Yobe','Zamfara'
  ],
  US: [
    'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
    'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
    'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
    'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada',
    'New Hampshire','New Jersey','New Mexico','New York','North Carolina',
    'North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island',
    'South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
    'Virginia','Washington','West Virginia','Wisconsin','Wyoming',
    'Washington D.C.'
  ],
  GB: [
    'England - London','England - South East','England - South West',
    'England - East of England','England - West Midlands','England - East Midlands',
    'England - Yorkshire','England - North West','England - North East',
    'Scotland - Edinburgh','Scotland - Glasgow','Scotland - Highlands',
    'Scotland - Aberdeen','Wales - Cardiff','Wales - Swansea',
    'Wales - Newport','Northern Ireland - Belfast','Northern Ireland - Derry'
  ],
  CN: [
    'Beijing','Shanghai','Tianjin','Chongqing','Guangdong','Zhejiang','Jiangsu',
    'Shandong','Henan','Sichuan','Hubei','Hunan','Anhui','Fujian','Jiangxi',
    'Liaoning','Shaanxi','Jilin','Heilongjiang','Yunnan','Guizhou','Shanxi',
    'Inner Mongolia','Xinjiang','Tibet','Guangxi','Hainan','Ningxia','Qinghai',
    'Gansu','Hebei'
  ],
  JP: [
    'Tokyo','Osaka','Kanagawa','Aichi','Saitama','Chiba','Hyogo','Hokkaido',
    'Fukuoka','Shizuoka','Ibaraki','Hiroshima','Kyoto','Miyagi','Niigata',
    'Nagano','Gifu','Tochigi','Gunma','Okayama','Fukushima','Mie','Kumamoto',
    'Kagoshima','Yamaguchi','Ehime','Nara','Okinawa','Nagasaki','Aomori',
    'Iwate','Akita','Yamagata','Toyama','Ishikawa','Fukui','Yamanashi',
    'Shiga','Wakayama','Tottori','Shimane','Kagawa','Kochi','Saga','Oita',
    'Miyazaki','Tokushima'
  ],
  CA: [
    'Ontario','Quebec','British Columbia','Alberta','Manitoba','Saskatchewan',
    'Nova Scotia','New Brunswick','Newfoundland and Labrador',
    'Prince Edward Island','Northwest Territories','Nunavut','Yukon'
  ],
  GH: [
    'Greater Accra','Ashanti','Western','Central','Eastern','Northern',
    'Upper East','Upper West','Volta','Brong-Ahafo','Western North',
    'Ahafo','Bono East','Oti','North East','Savannah'
  ],
  KE: [
    'Nairobi','Mombasa','Kisumu','Nakuru','Eldoret','Thika','Meru',
    'Kisii','Kakamega','Machakos','Nyeri','Kericho','Garissa','Embu',
    'Baringo','Bomet','Bungoma','Busia','Elgeyo-Marakwet','Homa Bay',
    'Isiolo','Kajiado','Kilifi','Kirinyaga','Kitui','Kwale','Laikipia',
    'Lamu','Mandera','Marsabit','Migori','Murang\'a','Nandi','Narok',
    'Nyandarua','Nyamira','Samburu','Siaya','Taita-Taveta','Tana River',
    'Tharaka-Nithi','Trans Nzoia','Turkana','Uasin Gishu','Vihiga',
    'Wajir','West Pokot'
  ],
  ZA: [
    'Gauteng','Western Cape','KwaZulu-Natal','Eastern Cape','Limpopo',
    'Mpumalanga','North West','Free State','Northern Cape'
  ],
  AE: [
    'Dubai','Abu Dhabi','Sharjah','Ajman','Ras Al Khaimah',
    'Fujairah','Umm Al Quwain'
  ],
  RW: [
    'Kigali City','Eastern Province','Western Province',
    'Northern Province','Southern Province'
  ],
  CM: [
    'Centre','Littoral','West','North West','South West','Adamawa',
    'East','Far North','North','South'
  ],
  BJ: [
    'Alibori','Atacora','Atlantique','Borgou','Collines','Couffo',
    'Donga','Littoral','Mono','Ouémé','Plateau','Zou'
  ],
};

// Helper: get country object by code
export const getCountry = (code) => COUNTRIES.find(c => c.code === code);

// Helper: get regions for a country code
export const getRegions = (countryCode) => REGIONS_BY_COUNTRY[countryCode] || [];

// Helper: format price with country currency
export const formatPriceForCountry = (amount, countryCode) => {
  const country = getCountry(countryCode);
  if (!country) return `₦${Number(amount).toLocaleString()}`;
  const sym = country.currency;
  const num = Number(amount).toLocaleString();
  return `${sym}${num}`;
};

// Popular cities per country for quick browse
export const POPULAR_CITIES = {
  NG: ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan', 'Benin City'],
  US: ['New York', 'Los Angeles', 'Houston', 'Chicago', 'Phoenix', 'Dallas'],
  GB: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Liverpool'],
  CN: ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Hangzhou'],
  JP: ['Tokyo', 'Osaka', 'Yokohama', 'Nagoya', 'Sapporo', 'Fukuoka'],
  CA: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Edmonton', 'Ottawa'],
  GH: ['Accra', 'Kumasi', 'Tamale', 'Takoradi', 'Cape Coast', 'Sunyani'],
  KE: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika'],
  ZA: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein'],
  AE: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Al Ain', 'Ras Al Khaimah'],
  RW: ['Kigali', 'Butare', 'Gitarama', 'Ruhengeri', 'Gisenyi', 'Byumba'],
  CM: ['Yaoundé', 'Douala', 'Garoua', 'Bamenda', 'Bafoussam', 'Maroua'],
  BJ: ['Cotonou', 'Porto-Novo', 'Parakou', 'Abomey', 'Natitingou', 'Ouidah'],
};

// ─── Keep backward compat exports ─────────────────────────────────────────────
export const NIGERIAN_STATES = REGIONS_BY_COUNTRY['NG'];

export const CAR_MAKES = [
  'Toyota','Honda','Mercedes-Benz','BMW','Lexus','Ford','Hyundai','Kia',
  'Nissan','Volkswagen','Audi','Peugeot','Mazda','Mitsubishi','Chevrolet',
  'Jeep','Land Rover','Range Rover','Porsche','Infiniti','Acura','Suzuki',
  'Volvo','Subaru','GMC','Dodge','Chrysler','Jaguar','Mini','Bentley',
  'Rolls Royce','Ferrari','Lamborghini','Maserati','Tesla','BYD','Geely',
  'Chery','SAIC','Haval','Isuzu','Daihatsu','Buick','Lincoln','Cadillac',
  'Rivian','Lucid','Genesis','Alfa Romeo','Fiat','Opel','Skoda','Seat',
  'Renault','Citroën','Dacia','Lancia','Aston Martin','McLaren','Bugatti',
];

export const CAR_FEATURES = [
  'Air Conditioning','Leather Seats','Sunroof','Navigation System','Bluetooth',
  'Backup Camera','Cruise Control','Keyless Entry','Push Start','Parking Sensors',
  'Alloy Wheels','DVD Player','Apple CarPlay','Android Auto','Heated Seats',
  'Ventilated Seats','Electric Windows','Electric Mirrors','ABS Brakes',
  'Airbags','Traction Control','Lane Assist','Blind Spot Monitor',
  'Adaptive Cruise Control','360 Camera','Head-Up Display','Wireless Charging',
  'Third Row Seating','Tow Package','Running Boards','Roof Rack',
];

export const formatPrice = (amount, countryCode = 'NG') => {
  return formatPriceForCountry(amount, countryCode);
};
