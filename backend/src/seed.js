import bcrypt from "bcryptjs";
import crypto from "crypto";
import dotenv from "dotenv";
import { getOne, initDb, run } from "./db.js";

dotenv.config();
await initDb();

const stats = [
  { label: "المشتركون الآن", value: 50 },
  { label: "أعضاء الفريق", value: 20 },
  { label: "المهندسون المعتمدون", value: 8 },
  { label: "إجمالي الزيارات", value: 250 }
];

const creators = [
  { name: "عامر ياسر", role: "مبرمج ومحتوى تقني", platform: "YouTube", followers: "21K", url: "https://www.youtube.com/watch?v=xQrefyGSJzA&t=42s" },
  { name: "حمزة كتانة", role: "خبير ERP وذكاء اصطناعي", platform: "YouTube", followers: "3.5K", url: "https://www.youtube.com/watch?v=P7lovcnteEE&t=2s" },
  { name: "محمد سامر", role: "مطور مناهج برمجية", platform: "YouTube", followers: "12.7K", url: "https://www.youtube.com/watch?v=cXpw4d_sIA4&t=24s" }
];

const videos = [
  { title: "من الصفر إلى كودك الأول", speaker: "المهندس عامر ياسر", youtubeId: "xQrefyGSJzA", views: "21 ألف مشاهدة" },
  { title: "بين الذكاء الاصطناعي و ERP", speaker: "المهندس حمزة كتانة", youtubeId: "P7lovcnteEE", views: "3.5 ألف مشاهدة" },
  { title: "أحدث تقنيات البرمجة", speaker: "المهندس حمزة كتانة", youtubeId: "7LB7YsvAQvU", views: "5.2 ألف مشاهدة" }
];

const products = [
  { name: "عضوية IEEE ANU", price: "قريبا", status: "تحت التجهيز" },
  { name: "ورش تدريبية", price: "قريبا", status: "تحت التجهيز" },
  { name: "مواد تعليمية", price: "قريبا", status: "تحت التجهيز" }
];

const testAccounts = [
  {
    firstname: "Admin",
    lastname: "IEEE",
    username: "admin",
    email: "admin@ieee-anu.local",
    discord: "admin",
    password: "Admin12345",
    role: "admin"
  },
  {
    firstname: "User",
    lastname: "IEEE",
    username: "user",
    email: "user@ieee-anu.local",
    discord: "user",
    password: "User12345",
    role: "member"
  }
];

for (const table of ["stats", "creators", "videos", "products"]) {
  await run(`DELETE FROM ${table}`);
}

for (const [order, stat] of stats.entries()) {
  const existing = await getOne("SELECT id FROM stats WHERE label = $label", { $label: stat.label });
  if (existing) {
    await run("UPDATE stats SET value = $value, sort_order = $order WHERE id = $id", {
      $id: existing.id,
      $value: stat.value,
      $order: order
    });
  } else {
    await run("INSERT INTO stats (id, label, value, sort_order) VALUES ($id, $label, $value, $order)", {
      $id: crypto.randomUUID(),
      $label: stat.label,
      $value: stat.value,
      $order: order
    });
  }
}

for (const [order, creator] of creators.entries()) {
  const existing = await getOne("SELECT id FROM creators WHERE name = $name", { $name: creator.name });
  if (existing) {
    await run("UPDATE creators SET role = $role, platform = $platform, followers = $followers, url = $url, sort_order = $order WHERE id = $id", {
      $id: existing.id,
      $role: creator.role,
      $platform: creator.platform,
      $followers: creator.followers,
      $url: creator.url,
      $order: order
    });
  } else {
    await run("INSERT INTO creators (id, name, role, platform, followers, url, sort_order) VALUES ($id, $name, $role, $platform, $followers, $url, $order)", {
      $id: crypto.randomUUID(),
      $name: creator.name,
      $role: creator.role,
      $platform: creator.platform,
      $followers: creator.followers,
      $url: creator.url,
      $order: order
    });
  }
}

for (const [order, video] of videos.entries()) {
  const existing = await getOne("SELECT id FROM videos WHERE youtube_id = $youtubeId", { $youtubeId: video.youtubeId });
  if (existing) {
    await run("UPDATE videos SET title = $title, speaker = $speaker, views = $views, sort_order = $order WHERE id = $id", {
      $id: existing.id,
      $title: video.title,
      $speaker: video.speaker,
      $views: video.views,
      $order: order
    });
  } else {
    await run("INSERT INTO videos (id, title, speaker, youtube_id, views, sort_order) VALUES ($id, $title, $speaker, $youtubeId, $views, $order)", {
      $id: crypto.randomUUID(),
      $title: video.title,
      $speaker: video.speaker,
      $youtubeId: video.youtubeId,
      $views: video.views,
      $order: order
    });
  }
}

for (const [order, product] of products.entries()) {
  const existing = await getOne("SELECT id FROM products WHERE name = $name", { $name: product.name });
  if (existing) {
    await run("UPDATE products SET price = $price, status = $status, sort_order = $order WHERE id = $id", {
      $id: existing.id,
      $price: product.price,
      $status: product.status,
      $order: order
    });
  } else {
    await run("INSERT INTO products (id, name, price, status, sort_order) VALUES ($id, $name, $price, $status, $order)", {
      $id: crypto.randomUUID(),
      $name: product.name,
      $price: product.price,
      $status: product.status,
      $order: order
    });
  }
}

for (const account of testAccounts) {
  const existing = await getOne("SELECT id FROM users WHERE email = $email OR username = $username", {
    $email: account.email,
    $username: account.username
  });
  const passwordHash = await bcrypt.hash(account.password, 12);

  if (existing) {
    await run(
      `UPDATE users
       SET firstname = $firstname,
           lastname = $lastname,
           username = $username,
           email = $email,
           discord = $discord,
           password_hash = $passwordHash,
           role = $role,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $id`,
      {
        $id: existing.id,
        $firstname: account.firstname,
        $lastname: account.lastname,
        $username: account.username,
        $email: account.email,
        $discord: account.discord,
        $passwordHash: passwordHash,
        $role: account.role
      }
    );
  } else {
    await run(
      `INSERT INTO users (id, firstname, lastname, username, email, discord, password_hash, role)
       VALUES ($id, $firstname, $lastname, $username, $email, $discord, $passwordHash, $role)`,
      {
        $id: crypto.randomUUID(),
        $firstname: account.firstname,
        $lastname: account.lastname,
        $username: account.username,
        $email: account.email,
        $discord: account.discord,
        $passwordHash: passwordHash,
        $role: account.role
      }
    );
  }
}

console.log("Database seeded successfully.");

