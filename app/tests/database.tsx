require('dotenv/config');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../../prisma/generated');

async function testDBConnection() {
  const connectionString = process.env.DATABASE_URL;

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    await prisma.$queryRaw`SELECT 1`;
    return { result: true, message: "" };
  }
  catch (err) {
    // If err is Error (exception type)
    if (err instanceof Error)
        return { result: false, message: err.message };
    else // If err is string
        return { result: false, message: String(err) };
  }
  finally {
    await prisma.$disconnect().catch(() => {});
  }
}

async function printConnectionResult() {
  const result = await testDBConnection();
  console.log(result);
}

// Return result of testDB Connection if running tsx directly
if (require.main === module) {
  printConnectionResult();
}
else {
  module.exports = { testDBConnection };
}
