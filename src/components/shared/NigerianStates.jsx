export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe",
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
  "Taraba", "Yobe", "Zamfara"
];

export const CAR_MAKES = [
  "Toyota", "Honda", "Mercedes-Benz", "BMW", "Lexus", "Ford", "Hyundai", "Kia",
  "Nissan", "Volkswagen", "Audi", "Peugeot", "Mazda", "Mitsubishi", "Chevrolet",
  "Jeep", "Land Rover", "Range Rover", "Porsche", "Infiniti", "Acura", "Suzuki",
  "Volvo", "Subaru", "GMC", "Dodge", "Chrysler", "Jaguar", "Mini", "Bentley",
  "Rolls Royce", "Ferrari", "Lamborghini", "Maserati", "Tesla"
];

export const CAR_FEATURES = [
  "Air Conditioning", "Leather Seats", "Sunroof", "Navigation System", "Bluetooth",
  "Backup Camera", "Cruise Control", "Keyless Entry", "Push Start", "Parking Sensors",
  "Alloy Wheels", "DVD Player", "Apple CarPlay", "Android Auto", "Heated Seats",
  "Power Windows", "Power Mirrors", "ABS", "Airbags", "Fog Lights"
];

export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

export const FREE_LISTING_LIMIT = 3;
export const PREMIUM_PRICE = 1999;