const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

const titles = ["Premium Boys PG with Food", "Cozy 1BHK Flat for Professionals", "Luxury Girls Coliving Studio", "Comfortable Shared Room in Hostel", "Spacious 2BHK Apartment", "Executive Men's Hostel", "Student Friendly PG", "Studio Flat near IT Park", "Private Room in Shared Flat", "Affordable Boys PG"];
const locations = ["Viman Nagar, Pune", "Hinjewadi Phase 1, Pune", "Baner, Pune", "Kothrud, Pune", "Koregaon Park, Pune", "Kharadi, Pune", "Wakad, Pune", "Magarpatta, Pune", "Aundh, Pune", "Shivaji Nagar, Pune"];
const amenitySets = [
    ["Wi-Fi", "Meals Included", "Air Conditioning", "Laundry"],
    ["Wi-Fi", "Attached Bathroom", "Furnished", "Parking"],
    ["Wi-Fi", "Kitchen", "Gym", "Security Check"],
    ["Wi-Fi", "Lockers", "Power Backup", "Water Purifier"],
    ["Wi-Fi", "Balcony", "Housekeeping", "CCTV"]
];
const roomImages = [
    "/assets/rooms/student_room_1.png", "/assets/rooms/student_room_2.png", "/assets/rooms/student_room_3.png",
    "/assets/rooms/student_room_4.png", "/assets/rooms/student_room_5.png", "/assets/rooms/student_room_6.png",
    "/assets/rooms/student_room_7.png", "/assets/rooms/student_room_8.png", "/assets/rooms/student_room_9.png",
    "/assets/rooms/student_room_10.png", "/assets/rooms/student_room_11.png", "/assets/rooms/student_room_12.png",
    "/assets/rooms/student_room_13.png", "/assets/rooms/student_room_14.png", "/assets/rooms/student_room_15.png"
];

const messNames = ["Annapurna Executive Mess", "Sai Sadan Dining", "Maheshwari Bhojanalaya", "Student Fuel Cafeteria", "Health First Kitchen", "Green Plate Veg Mess", "Taste of Home Tiffin", "Global Student Food Court", "Urban Mess & Snacks", "Viman Nagar Bhojan"];
const messImages = [
    "/assets/messes/mess_1.png", "/assets/messes/mess_2.png", "/assets/messes/mess_3.png",
    "/assets/messes/mess_4.png", "/assets/messes/mess_5.png", "/assets/messes/mess_6.png",
    "/assets/messes/mess_7.png", "/assets/messes/mess_8.png", "/assets/messes/mess_9.png",
    "/assets/messes/mess_10.png", "/assets/messes/mess_11.png", "/assets/messes/mess_12.png"
];

async function main() {
    // Clean up
    await prisma.review.deleteMany();
    await prisma.image.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.messReview.deleteMany();
    await prisma.messSubscription.deleteMany();
    await prisma.messImage.deleteMany();
    await prisma.mess.deleteMany();
    await prisma.room.deleteMany();
    await prisma.message.deleteMany();
    await prisma.user.deleteMany();
    
    // Create base users with proper bcrypt hashing
    const hashedPassword = await bcrypt.hash('password123', 10);

    const hostUser = await prisma.user.create({
        data: {
            name: "Verified Host",
            email: "host@test.com",
            password: hashedPassword,
            role: "HOST"
        }
    });

    const tenantUser = await prisma.user.create({
        data: {
            name: "Student Tenant",
            email: "tenant@test.com",
            password: hashedPassword,
            role: "TENANT"
        }
    });

    console.log(`Created Host User: ${hostUser.id}`);
    console.log(`Created Tenant User: ${tenantUser.id}`);

    // Generate and Insert Rooms
    for (let i = 1; i <= 34; i++) {
        const isFirstFour = i <= 4;
        const title = isFirstFour ? ["Premium Boys PG with Food", "Cozy 1BHK Flat for Professionals", "Luxury Girls Coliving Studio", "Comfortable Shared Room in Hostel"][i-1] : titles[Math.floor(Math.random() * titles.length)];
        const location = isFirstFour ? ["Viman Nagar, Pune", "Hinjewadi Phase 1, Pune", "Baner, Pune", "Kothrud, Pune"][i-1] : locations[Math.floor(Math.random() * locations.length)];
        const price = 5000 + (Math.floor(Math.random() * 15) * 1000);
        const image = roomImages[Math.floor(Math.random() * roomImages.length)];
        const amenities = isFirstFour ? amenitySets[i-1] : amenitySets[Math.floor(Math.random() * amenitySets.length)];
        const lat = 18.5 + (Math.random() * 0.1);
        const lng = 73.7 + (Math.random() * 0.25);
        
        let dbRoom = await prisma.room.create({
            data: {
                title: title,
                description: `Experience a premium stay at ${title} located right within the heart of ${location}.`,
                price: price,
                location: location,
                lat: lat,
                lng: lng,
                amenities: JSON.stringify(amenities),
                hostId: hostUser.id
            }
        });
        
        await prisma.image.create({
            data: { url: image, roomId: dbRoom.id }
        });
    }

    // Generate and Insert Messes
    for (let i = 0; i < messNames.length; i++) {
        const location = locations[i % locations.length];
        const price = 2500 + (Math.floor(Math.random() * 5) * 500);
        const type = i % 3 === 0 ? 'VEG' : (i % 3 === 1 ? 'NON_VEG' : 'BOTH');
        
        const dbMess = await prisma.mess.create({
            data: {
                name: messNames[i],
                description: `High-quality ${type.toLowerCase()} food service for students in ${location}. Home-style taste guaranteed.`,
                price: price,
                location: location,
                type: type,
                lat: 18.5 + (Math.random() * 0.1),
                lng: 73.7 + (Math.random() * 0.25),
                hostId: hostUser.id
            }
        });

        await prisma.messImage.create({
            data: {
                url: messImages[i % messImages.length],
                messId: dbMess.id
            }
        });
    }

    console.log('Seeding completed! Inserted 34 properties and 10 mess listings.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
