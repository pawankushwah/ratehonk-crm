// Use ES modules (package.json has "type": "module")
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

// Initialize database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/ratehonk_crm';
const sql = postgres(connectionString, {
  ssl: 'require',
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
  onnotice: () => {},
});

const tenantId = 44;

// Sample data for generating dummy leads
const firstNames = [
  "John", "Jane", "Michael", "Sarah", "David", "Emily", "James", "Jessica",
  "Robert", "Amanda", "William", "Melissa", "Richard", "Michelle", "Joseph",
  "Ashley", "Thomas", "Jennifer", "Christopher", "Lisa", "Daniel", "Nancy",
  "Matthew", "Karen", "Anthony", "Betty", "Mark", "Helen", "Donald", "Sandra",
  "Steven", "Donna", "Paul", "Carol", "Andrew", "Ruth", "Joshua", "Sharon",
  "Kenneth", "Laura", "Kevin", "Angela", "Brian", "Brenda", "George", "Emma",
  "Timothy", "Olivia", "Ronald", "Cynthia", "Jason", "Marie", "Edward", "Janet",
  "Jeffrey", "Catherine", "Ryan", "Frances", "Jacob", "Ann", "Gary", "Kathryn",
  "Nicholas", "Samantha", "Eric", "Deborah", "Jonathan", "Rachel", "Stephen", "Carolyn",
  "Larry", "Janet", "Justin", "Maria", "Scott", "Heather", "Brandon", "Diane",
  "Benjamin", "Julie", "Samuel", "Joyce", "Frank", "Victoria", "Gregory", "Kelly",
  "Raymond", "Christina", "Alexander", "Joan", "Patrick", "Evelyn", "Jack", "Judith",
  "Dennis", "Megan", "Jerry", "Cheryl", "Tyler", "Andrea", "Aaron", "Hannah",
  "Jose", "Jacqueline", "Henry", "Martha", "Adam", "Gloria", "Douglas", "Teresa",
  "Nathan", "Sara", "Zachary", "Janice", "Kyle", "Jean", "Noah", "Alice",
  "Ethan", "Madison", "Jeremy", "Doris", "Hunter", "Abigail", "Mason", "Julia",
  "Christian", "Grace", "Logan", "Judy", "Jaden", "Theresa", "Jordan", "Beverly",
  "Ian", "Denise", "Connor", "Marilyn", "Aiden", "Amber", "Adrian", "Danielle",
  "Cameron", "Rose", "Carlos", "Brittany", "Sebastian", "Diana", "Lucas", "Sophia",
  "Evan", "Amy", "Gabriel", "Shirley", "Julian", "Anna", "Isaac", "Kathleen",
  "Jayden", "Pamela", "Luis", "Emma", "Diego", "Debra", "Bryce", "Rachel",
  "Alex", "Carolyn", "Owen", "Janet", "Landon", "Maria", "Angel", "Frances",
  "Cole", "Christine", "Brayden", "Samantha", "Wyatt", "Deborah", "Luke", "Rachel",
  "Gavin", "Carol", "Grayson", "Janet", "Leo", "Maria", "Kayden", "Frances",
  "Miles", "Christine", "Carson", "Samantha", "Colton", "Deborah", "Bentley", "Rachel"
];

const lastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas",
  "Taylor", "Moore", "Jackson", "Martin", "Lee", "Thompson", "White", "Harris",
  "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen",
  "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green",
  "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter",
  "Roberts", "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker", "Cruz",
  "Edwards", "Collins", "Stewart", "Morris", "Morales", "Murphy", "Cook", "Rogers",
  "Gutierrez", "Ortiz", "Morgan", "Cooper", "Peterson", "Bailey", "Reed", "Kelly",
  "Howard", "Ramos", "Kim", "Cox", "Ward", "Richardson", "Watson", "Brooks",
  "Chavez", "Wood", "James", "Bennett", "Gray", "Mendoza", "Ruiz", "Hughes",
  "Price", "Alvarez", "Castillo", "Sanders", "Patel", "Myers", "Long", "Ross",
  "Foster", "Sullivan", "Russell", "Butler", "Foster", "Gonzales", "Alexander", "Perry",
  "Powell", "Tran", "Hunter", "Pena", "Roberts", "Turner", "Phillips", "Campbell",
  "Parker", "Evans", "Edwards", "Stewart", "Flores", "Morris", "Nguyen", "Rogers",
  "Reed", "Cook", "Morgan", "Bell", "Murphy", "Bailey", "Rivera", "Cooper",
  "Richardson", "Cox", "Howard", "Ward", "Torres", "Peterson", "Gray", "Ramirez",
  "James", "Watson", "Brooks", "Kelly", "Sanders", "Price", "Bennett", "Wood",
  "Barnes", "Ross", "Henderson", "Coleman", "Jenkins", "Perry", "Powell", "Long",
  "Patterson", "Hughes", "Flores", "Washington", "Butler", "Simmons", "Foster", "Gonzales",
  "Bryant", "Alexander", "Russell", "Griffin", "Diaz", "Hayes", "Myers", "Ford",
  "Hamilton", "Graham", "Sullivan", "Wallace", "Woods", "Cole", "West", "Jordan",
  "Owens", "Reynolds", "Fisher", "Ellis", "Harrison", "Gibson", "Mcdonald", "Cruz",
  "Marshall", "Ortiz", "Gomez", "Murray", "Freeman", "Wells", "Webb", "Simpson",
  "Stevens", "Tucker", "Porter", "Hunter", "Hicks", "Crawford", "Henry", "Boyd",
  "Mason", "Morales", "Kennedy", "Warren", "Dixon", "Ramos", "Reyes", "Burns",
  "Gordon", "Shaw", "Holmes", "Rice", "Robertson", "Hunt", "Black", "Daniels",
  "Palmer", "Mills", "Nichols", "Grant", "Knight", "Ferguson", "Rose", "Stone",
  "Hawkins", "Dunn", "Perkins", "Hudson", "Spencer", "Gardner", "Stephens", "Payne",
  "Pierce", "Berry", "Matthews", "Arnold", "Wagner", "Willis", "Ray", "Watkins",
  "Olson", "Carroll", "Duncan", "Snyder", "Hart", "Cunningham", "Bradley", "Lane",
  "Andrews", "Ruiz", "Harper", "Fox", "Riley", "Armstrong", "Carpenter", "Weaver",
  "Greene", "Lawrence", "Elliott", "Chavez", "Sims", "Austin", "Peters", "Kelley",
  "Franklin", "Lawson", "Fields", "Gutierrez", "Ryan", "Schmidt", "Carr", "Vasquez",
  "Castillo", "Wheeler", "Chapman", "Oliver", "Montgomery", "Richards", "Williamson", "Johnston",
  "Banks", "Meyer", "Bishop", "Mccoy", "Howell", "Alvarez", "Morrison", "Hansen",
  "Fernandez", "Garza", "Harvey", "Little", "Burton", "Stanley", "Nguyen", "George",
  "Jacobs", "Reid", "Kim", "Fuller", "Lynch", "Dean", "Gilbert", "Garrett",
  "Romero", "Welch", "Larson", "Frazier", "Burke", "Hanson", "Day", "Mendoza",
  "Moreno", "Bowman", "Medina", "Fowler", "Brewer", "Hoffman", "Carlson", "Silva",
  "Pearson", "Holland", "Douglas", "Fleming", "Jensen", "Vargas", "Byrd", "Davidson",
  "Hopkins", "May", "Terry", "Herrera", "Wade", "Soto", "Walters", "Curtis",
  "Neal", "Caldwell", "Lowe", "Jennings", "Barnett", "Graves", "Jimenez", "Horton",
  "Shelton", "Barrett", "Obrien", "Castro", "Sutton", "Gregory", "Mckinney", "Lucas",
  "Miles", "Craig", "Rodriquez", "Chambers", "Holt", "Lambert", "Fletcher", "Watts",
  "Bates", "Hale", "Rhodes", "Pena", "Beck", "Newman", "Haynes", "Mcdaniel",
  "Mendez", "Bush", "Vaughn", "Parks", "Dawson", "Santiago", "Norris", "Hardy",
  "Love", "Steele", "Curry", "Powers", "Schultz", "Barker", "Guzman", "Page",
  "Munoz", "Ball", "Keller", "Chandler", "Weber", "Leonard", "Walsh", "Lyons",
  "Ramsey", "Wolfe", "Schneider", "Mullins", "Benson", "Sharp", "Bowen", "Daniel",
  "Barber", "Cummings", "Hines", "Baldwin", "Griffith", "Valdez", "Hubbard", "Salazar",
  "Reeves", "Warner", "Stevenson", "Burgess", "Santos", "Tate", "Cross", "Garner",
  "Mann", "Mack", "Moss", "Thornton", "Dennis", "Mcgee", "Farmer", "Delgado",
  "Aguilar", "Vega", "Glover", "Manning", "Cohen", "Harmon", "Rodgers", "Robbins",
  "Newton", "Todd", "Blair", "Higgins", "Ingram", "Reese", "Cannon", "Strickland",
  "Townsend", "Potter", "Goodwin", "Walton", "Rowe", "Hampton", "Ortega", "Patton",
  "Swanson", "Joseph", "Valencia", "Rios", "Estrada", "Conner", "Adkins", "Figueroa",
  "Hull", "Moses", "Cochran", "Chan", "Buchanan", "Casey", "Bonilla", "Maddox",
  "Stout", "Mejia", "Ayala", "Underwood", "Randall", "Bond", "Forrest", "Guy",
  "Michael", "Gross", "Navarro", "Moss", "Fitzgerald", "Donovan", "Mclaughlin", "Espinoza",
  "Yoder", "Mccullough", "Hatfield", "Brock", "Merritt", "Miranda", "Atkins", "Madden",
  "Dunlap", "Bullock", "Morrow", "Kaufman", "Boyer", "Mccormick", "Mercado", "Pollard",
  "Esparza", "Mccall", "Velazquez", "Roach", "Brennan", "Salas", "Marks", "Russo",
  "Sawyer", "Baxter", "Golden", "Hodges", "Mcclain", "Duarte", "Mckenzie", "Collier",
  "Mcclure", "Mcmillan", "Hess", "Fuentes", "Bond", "Dudley", "Herrera", "Mccarty",
  "Hester", "Oneill", "Melton", "Booth", "Kane", "Berg", "Harrell", "Pitts",
  "Savage", "Wiggins", "Brennan", "Salas", "Marks", "Russo", "Sawyer", "Baxter",
  "Golden", "Hodges", "Mcclain", "Duarte", "Mckenzie", "Collier", "Mcclure", "Mcmillan"
];

const sources = ["website", "referral", "social_media", "email_campaign", "phone_call", "walk_in", "partner", "other"];
const statuses = ["new", "contacted", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"];
const priorities = ["low", "medium", "high", "urgent"];
const countries = ["IN", "US", "UK", "CA", "AU", "DE", "FR", "IT", "ES", "BR"];
const states = [
  "Maharashtra", "Karnataka", "Tamil Nadu", "Delhi", "Gujarat", "Rajasthan", "Uttar Pradesh", "West Bengal",
  "Punjab", "Haryana", "Madhya Pradesh", "Bihar", "Andhra Pradesh", "Telangana", "Kerala", "Odisha",
  "Assam", "Jharkhand", "Chhattisgarh", "Himachal Pradesh", "Uttarakhand", "Goa", "Tripura", "Manipur",
  "Meghalaya", "Nagaland", "Arunachal Pradesh", "Mizoram", "Sikkim"
];
const cities = [
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Pune",
  "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam",
  "Pimpri-Chinchwad", "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad",
  "Meerut", "Rajkot", "Varanasi", "Srinagar", "Amritsar", "Aurangabad", "Dhanbad", "Navi Mumbai",
  "Allahabad", "Howrah", "Gwalior", "Jabalpur", "Coimbatore", "Vijayawada", "Jodhpur", "Madurai",
  "Raipur", "Kota", "Chandigarh", "Guwahati", "Solapur", "Hubli-Dharwad", "Bareilly", "Moradabad",
  "Mysore", "Gurgaon", "Aligarh", "Jalandhar", "Tiruchirappalli", "Bhubaneswar", "Salem", "Warangal",
  "Mira-Bhayandar", "Thiruvananthapuram", "Bhiwandi", "Saharanpur", "Guntur", "Amravati", "Bikaner",
  "Noida", "Jamshedpur", "Bhilai", "Cuttack", "Firozabad", "Kochi", "Nellore", "Bhavnagar", "Dehradun",
  "Durgapur", "Asansol", "Rourkela", "Nanded", "Kolhapur", "Ajmer", "Akola", "Gulbarga", "Jamnagar",
  "Ujjain", "Loni", "Siliguri", "Jhansi", "Ulhasnagar", "Jammu", "Sangli-Miraj", "Mangalore", "Erode",
  "Belgaum", "Ambattur", "Tirunelveli", "Malegaon", "Gaya", "Jalgaon", "Udaipur", "Maheshtala"
];

// Get a random element from an array
function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate random email
function generateEmail(firstName, lastName, index) {
  const domains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "company.com", "test.com"];
  const domain = getRandomElement(domains);
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@${domain}`;
}

// Generate random phone number
function generatePhone() {
  const prefixes = ["91", "1", "44", "61"];
  const prefix = getRandomElement(prefixes);
  const number = Math.floor(1000000000 + Math.random() * 9000000000);
  return `${prefix}${number}`;
}

// Generate random date within last 6 months
function generateRandomDate() {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const randomTime = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime());
  return new Date(randomTime);
}

// Generate type-specific data for flight leads
function generateFlightData() {
  const sourceCities = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune", "Goa"];
  const destCities = ["Dubai", "Singapore", "Bangkok", "London", "New York", "Paris", "Tokyo", "Sydney"];
  const flightTypes = ["one-way", "round-trip", "multi-city"];
  const flightClasses = ["economy", "premium-economy", "business", "first"];
  
  const flightType = getRandomElement(flightTypes);
  const departureDate = generateRandomDate();
  const returnDate = flightType === "round-trip" 
    ? new Date(departureDate.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000)
    : null;
  
  return {
    sourceCity: getRandomElement(sourceCities),
    destinationCity: getRandomElement(destCities),
    flightType: flightType,
    passengers: Math.floor(Math.random() * 4) + 1,
    departureDate: departureDate.toISOString(),
    returnDate: returnDate ? returnDate.toISOString() : null,
    flightClass: getRandomElement(flightClasses)
  };
}

// Generate type-specific data for hotel leads
function generateHotelData() {
  const cities = ["Mumbai", "Delhi", "Goa", "Jaipur", "Udaipur", "Kerala", "Manali", "Shimla"];
  const checkIn = generateRandomDate();
  const checkOut = new Date(checkIn.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
  
  return {
    city: getRandomElement(cities),
    checkInDate: checkIn.toISOString(),
    checkOutDate: checkOut.toISOString(),
    guests: Math.floor(Math.random() * 4) + 1,
    rooms: Math.floor(Math.random() * 3) + 1,
    hotelType: getRandomElement(["budget", "mid-range", "luxury", "resort"])
  };
}

async function generateDummyLeads() {
  try {
    console.log("🚀 Starting to generate dummy leads for tenant ID:", tenantId);
    
    // Get a valid lead type ID for tenant 44
    const leadTypes = await sql`
      SELECT id FROM lead_types WHERE tenant_id = ${tenantId} LIMIT 1
    `;
    
    if (leadTypes.length === 0) {
      console.error("❌ No lead types found for tenant", tenantId);
      console.log("💡 Creating a default lead type...");
      
      const [newLeadType] = await sql`
        INSERT INTO lead_types (tenant_id, name, description, icon, color, is_active)
        VALUES (${tenantId}, 'Flight Booking', 'Flight booking leads', '✈️', '#3B82F6', true)
        RETURNING id
      `;
      console.log("✅ Created default lead type with ID:", newLeadType.id);
    }
    
    // Get lead type IDs
    const allLeadTypes = await sql`
      SELECT id FROM lead_types WHERE tenant_id = ${tenantId}
    `;
    
    if (allLeadTypes.length === 0) {
      throw new Error("No lead types available for tenant " + tenantId);
    }
    
    const leadTypeIds = allLeadTypes.map(lt => lt.id);
    
    // Get a valid user ID for tenant 44 (for assigned_user_id)
    const users = await sql`
      SELECT id FROM users WHERE tenant_id = ${tenantId} LIMIT 1
    `;
    
    const userId = users.length > 0 ? users[0].id : null;
    console.log("👤 Using user ID for assignment:", userId || "null (no assignment)");
    
    // Generate 250+ leads
    const numberOfLeads = 250;
    console.log(`📝 Generating ${numberOfLeads} dummy leads...`);
    
    const leads = [];
    for (let i = 0; i < numberOfLeads; i++) {
      const firstName = getRandomElement(firstNames);
      const lastName = getRandomElement(lastNames);
      const name = `${firstName} ${lastName}`;
      const email = generateEmail(firstName, lastName, i);
      const phone = generatePhone();
      const source = getRandomElement(sources);
      const status = getRandomElement(statuses);
      const priority = getRandomElement(priorities);
      const country = getRandomElement(countries);
      const state = country === "IN" ? getRandomElement(states) : null;
      const city = country === "IN" ? getRandomElement(cities) : null;
      const budgetRange = Math.floor(Math.random() * 100000) + 10000; // 10k to 110k
      const leadTypeId = getRandomElement(leadTypeIds);
      
      // Generate type-specific data (50% flight, 50% hotel or empty)
      let typeSpecificData = null;
      if (Math.random() > 0.3) {
        typeSpecificData = Math.random() > 0.5 ? generateFlightData() : generateHotelData();
      }
      
      const createdAt = generateRandomDate();
      
      leads.push({
        tenant_id: tenantId,
        lead_type_id: leadTypeId,
        first_name: firstName,
        last_name: lastName,
        name: name,
        email: email,
        phone: phone,
        source: source,
        status: status,
        priority: priority,
        country: country,
        state: state,
        city: city,
        budget_range: budgetRange.toString(),
        type_specific_data: typeSpecificData ? JSON.stringify(typeSpecificData) : null,
        assigned_user_id: Math.random() > 0.7 ? userId : null, // 30% assigned
        notes: Math.random() > 0.5 ? `Sample notes for ${name}` : null,
        created_at: createdAt,
        updated_at: createdAt,
      });
    }
    
    // Insert leads in batches of 50
    const batchSize = 50;
    let inserted = 0;
    
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);
      
      // Insert each lead individually in the batch (postgres library doesn't support array values easily)
      for (const lead of batch) {
        await sql`
          INSERT INTO leads (
            tenant_id, lead_type_id, first_name, last_name, name, email, phone, 
            source, status, priority, country, state, city, budget_range, 
            type_specific_data, assigned_user_id, notes, created_at, updated_at
          ) VALUES (
            ${lead.tenant_id}, ${lead.lead_type_id}, ${lead.first_name}, ${lead.last_name}, 
            ${lead.name}, ${lead.email}, ${lead.phone}, ${lead.source}, ${lead.status}, 
            ${lead.priority}, ${lead.country}, ${lead.state}, ${lead.city}, 
            ${lead.budget_range}, ${lead.type_specific_data}, ${lead.assigned_user_id}, 
            ${lead.notes}, ${lead.created_at}, ${lead.updated_at}
          )
        `;
      }
      
      inserted += batch.length;
      console.log(`✅ Inserted batch: ${inserted}/${numberOfLeads} leads`);
    }
    
    console.log(`🎉 Successfully generated ${inserted} dummy leads for tenant ${tenantId}!`);
    
    // Verify the count
    const countResult = await sql`
      SELECT COUNT(*) as total FROM leads WHERE tenant_id = ${tenantId}
    `;
    console.log(`📊 Total leads for tenant ${tenantId}: ${countResult[0].total}`);
    
  } catch (error) {
    console.error("❌ Error generating dummy leads:", error);
    throw error;
  }
}

// Run the script
(async () => {
  try {
    await generateDummyLeads();
    console.log("✅ Script completed successfully");
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Script failed:", error);
    await sql.end();
    process.exit(1);
  }
})();

