import { SimpleStorage } from "./simple-storage.js";

// Sample data for generating realistic customers
const firstNames = [
  "John", "Jane", "Michael", "Sarah", "David", "Emily", "Robert", "Jessica",
  "William", "Ashley", "James", "Amanda", "Christopher", "Melissa", "Daniel",
  "Michelle", "Matthew", "Kimberly", "Anthony", "Amy", "Mark", "Angela",
  "Donald", "Stephanie", "Steven", "Nicole", "Paul", "Elizabeth", "Andrew",
  "Helen", "Joshua", "Sandra", "Kenneth", "Donna", "Kevin", "Carol", "Brian",
  "Ruth", "Brian", "Sharon", "George", "Michelle", "Edward", "Laura",
  "Ronald", "Sarah", "Timothy", "Kimberly", "Jason", "Deborah", "Jeffrey",
  "Lisa", "Ryan", "Nancy", "Jacob", "Karen", "Gary", "Betty", "Nicholas",
  "Helen", "Eric", "Sandra", "Jonathan", "Donna", "Stephen", "Carol",
  "Larry", "Ruth", "Justin", "Sharon", "Scott", "Michelle", "Brandon", "Laura",
  "Benjamin", "Emily", "Samuel", "Kimberly", "Frank", "Deborah", "Gregory",
  "Lisa", "Raymond", "Nancy", "Alexander", "Karen", "Patrick", "Betty",
  "Jack", "Helen", "Dennis", "Sandra", "Jerry", "Donna", "Tyler", "Carol",
  "Aaron", "Ruth", "Jose", "Sharon", "Adam", "Michelle", "Henry", "Laura",
  "Nathan", "Emily", "Douglas", "Kimberly", "Zachary", "Deborah", "Kyle",
  "Lisa", "Noah", "Nancy", "Ethan", "Karen"
];

const lastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
  "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Thompson", "White",
  "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
  "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill",
  "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell",
  "Mitchell", "Carter", "Roberts", "Gomez", "Phillips", "Evans", "Turner",
  "Diaz", "Parker", "Cruz", "Edwards", "Collins", "Reyes", "Stewart", "Morris",
  "Morales", "Murphy", "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan",
  "Cooper", "Peterson", "Bailey", "Reed", "Kelly", "Howard", "Ramos", "Kim",
  "Cox", "Ward", "Richardson", "Watson", "Brooks", "Chavez", "Wood", "James",
  "Bennett", "Gray", "Mendoza", "Ruiz", "Hughes", "Price", "Alvarez", "Castillo",
  "Sanders", "Patel", "Myers", "Long", "Ross", "Foster", "Jimenez"
];

const cities = [
  "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia",
  "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville",
  "Fort Worth", "Columbus", "Charlotte", "San Francisco", "Indianapolis",
  "Seattle", "Denver", "Washington", "Boston", "El Paso", "Detroit", "Nashville",
  "Portland", "Oklahoma City", "Las Vegas", "Memphis", "Louisville", "Baltimore",
  "Milwaukee", "Albuquerque", "Tucson", "Fresno", "Sacramento", "Kansas City",
  "Mesa", "Atlanta", "Omaha", "Colorado Springs", "Raleigh", "Miami", "Long Beach",
  "Virginia Beach", "Oakland", "Minneapolis", "Tulsa", "Tampa", "Arlington"
];

const states = [
  "New York", "California", "Texas", "Florida", "Illinois", "Pennsylvania",
  "Ohio", "Georgia", "North Carolina", "Michigan", "New Jersey", "Virginia",
  "Washington", "Arizona", "Massachusetts", "Tennessee", "Indiana", "Missouri",
  "Maryland", "Wisconsin", "Colorado", "Minnesota", "South Carolina", "Alabama",
  "Louisiana", "Kentucky", "Oregon", "Oklahoma", "Connecticut", "Utah", "Iowa",
  "Nevada", "Arkansas", "Mississippi", "Kansas", "New Mexico", "Nebraska",
  "West Virginia", "Idaho", "Hawaii", "New Hampshire", "Maine", "Montana",
  "Rhode Island", "Delaware", "South Dakota", "North Dakota", "Alaska", "Vermont"
];

const countries = ["United States", "Canada", "United Kingdom", "Australia", "India"];

const companies = [
  "Tech Solutions Inc", "Global Enterprises", "Digital Innovations", "Prime Services",
  "Elite Corporation", "Advanced Systems", "Mega Industries", "Pro Services",
  "Star Technologies", "Apex Solutions", "Summit Group", "Nexus Corporation",
  "Velocity Inc", "Pinnacle Services", "Quantum Solutions", "Fusion Technologies",
  "Horizon Group", "Catalyst Corp", "Vanguard Industries", "Phoenix Solutions"
];

function generatePhoneNumber(): string {
  const areaCode = Math.floor(Math.random() * 900) + 100;
  const exchange = Math.floor(Math.random() * 900) + 100;
  const number = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `${areaCode}-${exchange}-${number}`;
}

function generateEmail(firstName: string, lastName: string, index: number): string {
  const domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "company.com"];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@${domain}`;
}

function generateAddress(): string {
  const streetNumbers = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
  const streetNames = [
    "Main St", "Oak Ave", "Park Blvd", "Maple Dr", "Cedar Ln", "Elm St",
    "Pine Ave", "First St", "Second St", "Third St", "Washington Ave",
    "Lincoln Dr", "Jefferson St", "Madison Ave", "Adams Blvd", "Jackson St"
  ];
  const number = streetNumbers[Math.floor(Math.random() * streetNumbers.length)];
  const street = streetNames[Math.floor(Math.random() * streetNames.length)];
  return `${number} ${street}`;
}

function generatePincode(): string {
  return Math.floor(Math.random() * 90000) + 10000 + "";
}

async function generateDummyCustomers() {
  const storage = new SimpleStorage();
  const tenantId = 44;
  const numberOfCustomers = 250;

  console.log(`🚀 Starting to generate ${numberOfCustomers} dummy customers for tenant ID ${tenantId}...`);

  // Get a user for this tenant to use as userId for customer activities
  let userId: number | null = null;
  try {
    const users = await storage.getUsersByTenant(tenantId);
    if (users && users.length > 0) {
      userId = users[0].id;
      console.log(`✅ Found user ID ${userId} for tenant ${tenantId}`);
    } else {
      console.error(`❌ No users found for tenant ${tenantId}.`);
      console.error(`   Customer creation requires a userId for activity logging.`);
      console.error(`   Please create at least one user for tenant ${tenantId} before running this script.`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Error fetching users for tenant ${tenantId}:`, error);
    process.exit(1);
  }

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < numberOfCustomers; i++) {
    try {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = `${firstName} ${lastName}`;
      const email = generateEmail(firstName, lastName, i);
      const phone = generatePhoneNumber();
      const city = cities[Math.floor(Math.random() * cities.length)];
      const state = states[Math.floor(Math.random() * states.length)];
      const country = countries[Math.floor(Math.random() * countries.length)];
      const address = generateAddress();
      const pincode = generatePincode();
      const company = Math.random() > 0.5 ? companies[Math.floor(Math.random() * companies.length)] : null;
      const notes = Math.random() > 0.7 
        ? `Customer interested in travel packages. Preferred contact: ${Math.random() > 0.5 ? "Email" : "Phone"}.`
        : null;

      const customerData = {
        tenantId,
        name,
        firstName,
        lastName,
        email,
        phone,
        address,
        city,
        state,
        country,
        pincode,
        company,
        notes,
        preferences: {},
        userId: userId!, // userId is guaranteed to be set at this point
      };

      await storage.createCustomer(customerData);
      successCount++;

      if ((i + 1) % 50 === 0) {
        console.log(`✅ Created ${i + 1} customers so far...`);
      }
    } catch (error: any) {
      errorCount++;
      console.error(`❌ Error creating customer ${i + 1}:`, error.message);
      // Continue with next customer even if one fails
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`✨ Generation complete!`);
  console.log(`✅ Successfully created: ${successCount} customers`);
  console.log(`❌ Errors: ${errorCount} customers`);
  console.log(`📊 Total processed: ${numberOfCustomers} customers`);
  console.log("=".repeat(50));
}

// Run the script
generateDummyCustomers()
  .then(() => {
    console.log("\n🎉 Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script failed with error:", error);
    process.exit(1);
  });

