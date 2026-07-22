require("dotenv").config();
const { sequelize, University, User, Student, Payment } = require("../models");
const { faker } = require("@faker-js/faker");
const bcrypt = require("bcrypt");

// List of universities
const universitiesList = [
  "Addis Ababa University",
  "Adama Science and Technology University",
  "Bahir Dar University",
  "Jimma University",
  "Mekelle University",
  "Arba Minch University",
  "Haramaya University",
  "Gondar University",
  "Hawassa University",
  "Wollo University",
  "Wolaita Sodo University",
  "Dilla University",
  "Debre Berhan University",
  "Debre Markos University",
  "Mizan Tepi University",
  "Assosa University",
  "Ambo University",
  "Woldia University",
  "Wachemo University",
  "Debre Tabor University",
  "Dire Dawa University",
  "Injibara University",
  "Metu University",
  "Bule Hora University",
  "Wollega University",
  "Madawalabu University",
  "Samara University",
  "Raya University",
  "Arsi University",
  "Bonga University",
  "Kebri Dehar University",
  "Dembi Dolo University",
  "Werabe University",
  "Oda Bultum University",
  "Mettu University",
  "Addis Ababa Science and Technology University",
  "Debark University",
  "Axum University",
  "Selale University",
  "Jijiga University",
  "Dessie University",
  "Kombolcha University",
  "Harambe University",
  "Gambella University",
];

async function seed() {
  try {
    // Update tables without dropping them
    await sequelize.sync({ alter: true });
    console.log("✅ Database synced.");

    // ----- Universities -----
    const universities = [];
    for (const name of universitiesList) {
      const [uni] = await University.findOrCreate({ where: { name } });
      universities.push(uni);
    }
    console.log(`✅ ${universities.length} universities seeded.`);

    // ----- Users -----
    // Admin
    const adminPassword = await bcrypt.hash("admin123", 10);
    await User.findOrCreate({
      where: { email: "admin@example.com" },
      defaults: {
        fullName: "Admin User",
        password: adminPassword,
        role: "admin",
      },
    });

    // University users
    const universityPassword = await bcrypt.hash("password123", 10);
    for (let i = 0; i < 5; i++) {
      await User.findOrCreate({
        where: { email: faker.internet.email() },
        defaults: {
          fullName: faker.person.fullName(),
          password: universityPassword,
          role: "university",
          universityId: universities[i % universities.length].id,
        },
      });
    }
    console.log("✅ Users seeded.");

    // ----- Students -----
    const students = [];
    for (let i = 0; i < 50; i++) {
      const [student] = await Student.findOrCreate({
        where: { email: faker.internet.email() },
        defaults: {
          fullName: faker.person.fullName(),
          universityId: universities[i % universities.length].id,
        },
      });
      students.push(student);
    }
    console.log(`✅ ${students.length} students seeded.`);

    // ----- Payments -----
    for (const student of students) {
      const paymentsCount = faker.number.int({ min: 1, max: 5 });
      for (let j = 0; j < paymentsCount; j++) {
        await Payment.findOrCreate({
          where: {
            studentId: student.id,
            paymentDate: faker.date.between({ from: "2025-01-01", to: "2025-11-01" }),
          },
          defaults: {
            universityId: student.universityId,
            amount: faker.number.int({ min: 100, max: 500 }),
            interest: faker.number.float({ min: 0, max: 20, precision: 0.1 }),
            status: faker.helpers.arrayElement(["paid", "unpaid"]),
            method: faker.helpers.arrayElement(["cash", "bank transfer", "card"]),
          },
        });
      }
    }
    console.log("✅ Payments seeded.");

    console.log("🎉 Seeding completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
}

seed();
