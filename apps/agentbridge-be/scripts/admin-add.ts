import { Tenant } from "@prisma/client";
import readline from "readline";
import { createTenant, createAdminUser as crudCreateAdminUser } from "../src/services/admins.service.js";
import prisma, { Database } from "../src/utils/connection.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function promptForTenant(tenants: Tenant[]) {
  return new Promise<string>((resolve) => {
    console.log("\n📋 Available tenants:");
    tenants.forEach((tenant, index) => {
      console.log(`${index + 1}. ${tenant.name} (${tenant.id})`);
    });

    rl.question("\nEnter tenant number or press Enter for the first tenant: ", (answer) => {
      const trimmedAnswer = answer.trim();
      const choice = parseInt(trimmedAnswer);
      if (!trimmedAnswer || isNaN(choice) || choice < 1 || choice > tenants.length) {
        resolve(tenants[0].id);
      } else {
        resolve(tenants[choice - 1].id);
      }
    });
  });
}

async function promptForCreateNewTenant(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    rl.question("Create a new tenant for this admin? (Y/n): ", (answer) => {
      const trimmedAnswer = answer.trim();
      if (!trimmedAnswer || trimmedAnswer.toLowerCase() === "y" || trimmedAnswer.toLowerCase() === "yes") {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}

async function createNewTenant(db: Database, email: string): Promise<string> {
  const tenantName = await new Promise<string>((resolve) => {
    rl.question("Enter tenant name (press Enter to use admin email as name): ", (name: string) => {
      resolve(name.trim() || email);
    });
  });

  const tenant = await createTenant(db, tenantName);

  console.log(`✨ New tenant "${tenant.name}" created with ID: ${tenant.id}`);
  return tenant.id;
}

async function createAdminUser() {
  const db = await prisma;
  try {
    const email = await new Promise<string>((resolve) => {
      rl.question("Enter admin email: ", (email) => resolve(email.trim().toLowerCase()));
    });

    if (!email || !email.includes("@")) {
      console.error("❌ Invalid email address");
      rl.close();
      return;
    }

    const existingAdmin = await db.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      await db.admin.update({
        where: { email },
        data: { enabled: true },
      });
      console.log(`🔄 Admin with email ${email} already exists. Enabled them.`);
      rl.close();
      return;
    }

    const tenants = await db.tenant.findMany({
      orderBy: { createdAt: "asc" },
    });

    let tenantId: string;
    const createNewTenantChoice = await promptForCreateNewTenant();

    if (createNewTenantChoice) {
      tenantId = await createNewTenant(db, email);
    } else {
      if (tenants.length === 0) {
        console.log("🔍 No existing tenants found. Creating a new tenant...");
        tenantId = await createNewTenant(db, email);
      } else if (tenants.length === 1) {
        tenantId = tenants[0].id;
        console.log(`🔑 Using existing tenant: ${tenants[0].name} (${tenants[0].id})`);
      } else {
        tenantId = await promptForTenant(tenants);
      }
    }

    await crudCreateAdminUser(db, email, tenantId, { emailVerified: true, enabled: true });

    console.log(`✅ Admin user with email ${email} has been created successfully.`);
    rl.close();
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    rl.close();
  }
}

createAdminUser();
