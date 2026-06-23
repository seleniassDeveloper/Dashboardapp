import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "seleniadeveloper@gmail.com";
  console.log(`Buscando usuario: ${email}`);
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            business: true
          }
        }
      }
    });

    if (!user) {
      console.log("Usuario no encontrado.");
      return;
    }

    console.log(`Usuario ID: ${user.id} | Name: ${user.name}`);
    user.memberships.forEach(m => {
      console.log(`Membership Business ID: ${m.businessId} | Name: ${m.business.name} | Slug: ${m.business.slug} | Role: ${m.role}`);
    });
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
