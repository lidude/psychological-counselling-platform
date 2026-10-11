import { bootstrapAdmin } from "../utils/bootstrapAdmin";
import prisma from "../lib/prisma";

async function main() {
  console.log("Running Admin Bootstrap script...");
  await bootstrapAdmin();
  console.log("Admin Bootstrap finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
