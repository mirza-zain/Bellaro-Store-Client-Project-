import { neon } from "@neondatabase/serverless";
import fs from "node:fs";

let dbUrl = process.env.DATABASE_URL;
if (!dbUrl && fs.existsSync(".env")) {
  const envText = fs.readFileSync(".env", "utf-8");
  const match = envText.match(/^DATABASE_URL=(.+)$/m);
  if (match) dbUrl = match[1].trim();
}

const sql = neon(dbUrl);

const bellaroProducts = [
  {
    name: "Bellaro Monarch Horsebit Leather Loafers",
    description: "Signature handcrafted genuine leather horsebit loafers featuring polished gold metallic horsebit hardware, full leather lining, cushioned insole, and durable lug soles.",
    category: "Footwear",
    subCategory: "Loafers",
    price: 5850,
    stock: 25,
    image: "https://images.unsplash.com/photo-1616406432452-07bc5938759d?auto=format&fit=crop&w=800&q=80",
    variants: JSON.stringify([
      { label: "EUR 39 (UK 6)", price: 5850, stock: 5 },
      { label: "EUR 40 (UK 7)", price: 5850, stock: 5 },
      { label: "EUR 41 (UK 8)", price: 5850, stock: 5 },
      { label: "EUR 42 (UK 9)", price: 5850, stock: 5 },
      { label: "EUR 43 (UK 10)", price: 5850, stock: 5 },
    ]),
  },
  {
    name: "Bellaro Lug-Sole Polished Penny Loafers",
    description: "Deep oxblood/burgundy hand-burnished penny loafers with thick grooved lug commando soles. Engineered for effortless smart-casual and formal styling.",
    category: "Footwear",
    subCategory: "Loafers",
    price: 5450,
    stock: 20,
    image: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80",
    variants: JSON.stringify([
      { label: "EUR 40 (UK 7)", price: 5450, stock: 5 },
      { label: "EUR 41 (UK 8)", price: 5450, stock: 5 },
      { label: "EUR 42 (UK 9)", price: 5450, stock: 5 },
      { label: "EUR 43 (UK 10)", price: 5450, stock: 5 },
    ]),
  },
  {
    name: "Bellaro Modena Tan Suede Driving Moccasins",
    description: "Handcrafted slip-on driving moccasins in rich tan suede leather. Built with cushioned memory footbeds and segmented rubber pebble outsoles for daily comfort.",
    category: "Footwear",
    subCategory: "Moccasins",
    price: 4650,
    stock: 30,
    image: "https://images.unsplash.com/photo-1576792741377-eb0f4f6d1a47?auto=format&fit=crop&w=800&q=80",
    variants: JSON.stringify([
      { label: "EUR 39 (UK 6)", price: 4650, stock: 6 },
      { label: "EUR 40 (UK 7)", price: 4650, stock: 6 },
      { label: "EUR 41 (UK 8)", price: 4650, stock: 6 },
      { label: "EUR 42 (UK 9)", price: 4650, stock: 6 },
      { label: "EUR 43 (UK 10)", price: 4650, stock: 6 },
    ]),
  },
  {
    name: "Bellaro Royale Cross-Strap Leather Slides",
    description: "Designer crisscross slide sandals crafted with structured patterned straps, ergonomic contoured footbeds, and all-day casual ease.",
    category: "Footwear",
    subCategory: "Slides",
    price: 3250,
    stock: 35,
    image: "https://images.unsplash.com/photo-1585120824848-8a5cd41493d2?auto=format&fit=crop&w=800&q=80",
    variants: JSON.stringify([
      { label: "EUR 40 (UK 7)", price: 3250, stock: 8 },
      { label: "EUR 41 (UK 8)", price: 3250, stock: 9 },
      { label: "EUR 42 (UK 9)", price: 3250, stock: 9 },
      { label: "EUR 43 (UK 10)", price: 3250, stock: 9 },
    ]),
  },
  {
    name: "Bellaro Dual-Buckle Contoured Sandals",
    description: "Classic double-buckle comfort slides featuring adjustable metallic hardware, deep ergonomic heel cup, and shock-absorbing cork-EVA outsoles.",
    category: "Footwear",
    subCategory: "Sandals",
    price: 3650,
    stock: 25,
    image: "https://images.unsplash.com/photo-1585120824848-8a5cd41493d2?auto=format&fit=crop&w=800&q=80",
    variants: JSON.stringify([
      { label: "EUR 40 (UK 7)", price: 3650, stock: 6 },
      { label: "EUR 41 (UK 8)", price: 3650, stock: 6 },
      { label: "EUR 42 (UK 9)", price: 3650, stock: 6 },
      { label: "EUR 43 (UK 10)", price: 3650, stock: 7 },
    ]),
  },
  {
    name: "Bellaro CloudThong Cushioned Flip-Flops",
    description: "Everyday comfort thong flip-flops with high-density ribbed footbed cushioning and non-slip rubber grip.",
    category: "Footwear",
    subCategory: "Flip-Flops",
    price: 2450,
    stock: 40,
    image: "https://images.unsplash.com/photo-1585120824848-8a5cd41493d2?auto=format&fit=crop&w=800&q=80",
    variants: JSON.stringify([
      { label: "EUR 40 (UK 7)", price: 2450, stock: 10 },
      { label: "EUR 41 (UK 8)", price: 2450, stock: 10 },
      { label: "EUR 42 (UK 9)", price: 2450, stock: 10 },
      { label: "EUR 43 (UK 10)", price: 2450, stock: 10 },
    ]),
  },
  {
    name: "Bellaro Velvet Amber Eau de Parfum (100ml)",
    description: "A commanding signature fragrance blending smoky amber, warm bergamot, creamy vanilla, and velvety cedarwood notes. Formulated with 25% perfume oil concentration for 10+ hours longevity.",
    category: "Perfumes",
    subCategory: "EauDeParfum",
    price: 6800,
    stock: 30,
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80",
    variants: JSON.stringify([
      { label: "Standard Bottle (100ml EDP)", price: 6800, stock: 30 },
    ]),
  },
  {
    name: "Bellaro Noir Oud Extrait de Parfum (100ml)",
    description: "Intense, dark, and distinguished. Combines pure Cambodian agarwood, Damascus rose, spicy cardamom, and rich Tuscan leather.",
    category: "Perfumes",
    subCategory: "ExtraitDeParfum",
    price: 7500,
    stock: 25,
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80",
    variants: JSON.stringify([
      { label: "Luxury Flacon (100ml Extrait)", price: 7500, stock: 25 },
    ]),
  },
];

async function seed() {
  console.log("Seeding Bellaro products into database...");
  for (const p of bellaroProducts) {
    await sql`
      INSERT INTO products (name, description, category, "subCategory", price, stock, image, variants)
      VALUES (${p.name}, ${p.description}, ${p.category}, ${p.subCategory}, ${p.price}, ${p.stock}, ${p.image}, ${p.variants}::jsonb);
    `;
    console.log(`✓ Inserted: ${p.name}`);
  }
  console.log("All products seeded successfully!");
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
