// In-memory data store (replace with a real DB like MongoDB/PostgreSQL in production)
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");

// ─── Users ───────────────────────────────────────────────────────────────────
// The admin password is private: set ADMIN_PASSWORD in the backend environment.
// Local development falls back to "admin123". In production without it, the
// admin account gets a random password, so nobody can sign in as admin.
const crypto = require("crypto");
const adminPassword = (() => {
  const fromEnv = process.env.ADMIN_PASSWORD?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    console.warn("[auth] ADMIN_PASSWORD is not set: admin sign-in is disabled until it is.");
    return crypto.randomBytes(24).toString("hex");
  }
  return "admin123";
})();

const users = [
  {
    id: "user-1",
    name: "Admin User",
    email: "admin@example.com",
    password: bcrypt.hashSync(adminPassword, 10),
    role: "admin",
    createdAt: new Date("2024-01-01").toISOString(),
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
  },
  {
    id: "user-2",
    name: "John Doe",
    email: "john@example.com",
    password: bcrypt.hashSync("password123", 10),
    role: "user",
    createdAt: new Date("2024-01-15").toISOString(),
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
  },
];

// ─── Products ─────────────────────────────────────────────────────────────────
// All prices are in Indian Rupees (INR), inclusive of GST.
const img = (id) => `https://images.unsplash.com/photo-${id}?w=800&q=80`;

const seed = [
  // Electronics
  ["Wireless Noise-Cancelling Headphones", "electronics", "SoundMaster", 14999, 19999, 45, 4.8, 1284, ["1505740420928-5e560c06d30e", "1583394838336-acd977736f90"], ["wireless", "noise-cancelling", "bluetooth", "headphones"], true,
    "Over-ear headphones with 30-hour battery life and active noise cancellation. Bluetooth 5.3 with multipoint connection and a foldable design for travel."],
  ["UltraSlim 14\" Laptop", "electronics", "Nimbus", 64990, 74990, 15, 4.7, 642, ["1496181133206-80ce9b88a853", "1517336714731-489689fd1ca8"], ["laptop", "ultrabook", "work"], true,
    "14-inch ultrabook with a 2.8K display, 16 GB RAM and 512 GB SSD. Backlit keyboard, all-day battery and a 1.2 kg aluminium body."],
  ["Smartphone X Pro 5G", "electronics", "Orbit", 34999, 39999, 30, 4.5, 2210, ["1511707171634-5f897ff02aa9"], ["smartphone", "5g", "mobile"], true,
    "6.7-inch AMOLED display, 50 MP triple camera, 5000 mAh battery with 67W fast charging, and 8 GB RAM with 256 GB storage."],
  ["True Wireless Earbuds", "electronics", "SoundMaster", 4999, 7999, 80, 4.4, 3120, ["1572569511254-d8f925fe2cbb", "1590658268037-6bf12165a8df"], ["earbuds", "wireless", "bluetooth"], true,
    "Compact earbuds with active noise cancellation, transparency mode, IPX4 sweat resistance and 28 hours total playback with the case."],
  ["4K Ultra HD Smart TV 55\"", "electronics", "VisionPro", 54999, 69999, 18, 4.7, 2341, ["1593784991095-a205069470b6"], ["4k", "smart-tv", "streaming"], false,
    "55-inch 4K Smart TV with Dolby Vision, HDR10+ and built-in streaming apps. HDMI 2.1 ports and a 120Hz panel for gaming."],
  ["Smart Watch Series 5", "electronics", "SmartTime", 19999, 24999, 29, 4.5, 3456, ["1523275335684-37898b6baf30", "1546868871-7041f2a55e12"], ["smartwatch", "health", "gps", "fitness-tracker"], false,
    "Health tracking with SpO2, heart rate and sleep monitoring. Built-in GPS, 50 m water resistance and a 7-day battery."],
  ["Wireless Slim Keyboard", "electronics", "TechGear", 2499, 3299, 60, 4.3, 876, ["1511467687858-23d96c32e4ae", "1541140532154-b024d705b90a"], ["keyboard", "wireless", "office"], false,
    "Low-profile wireless keyboard with quiet scissor keys, a numeric pad and a rechargeable battery that lasts up to 3 months."],
  ["Ergonomic Wireless Mouse", "electronics", "TechGear", 1299, 1799, 95, 4.4, 1543, ["1527864550417-7fd91fc51a46"], ["mouse", "wireless", "office"], false,
    "Contoured wireless mouse with a silent click, adjustable DPI up to 3200 and a 2.4 GHz USB receiver."],
  ["Bookshelf Speakers (Pair)", "electronics", "AcoustiQ", 8999, 11999, 22, 4.6, 412, ["1545454675-3531b543be5d"], ["speakers", "audio", "bluetooth"], false,
    "Powered bookshelf speakers with Bluetooth 5.0, optical input and a wooden cabinet for warm, room-filling sound."],
  ["Portable Bluetooth Speaker", "electronics", "AcoustiQ", 3499, 4999, 70, 4.5, 2876, ["1608043152269-423dbba4e7e1"], ["speaker", "portable", "waterproof"], false,
    "IP67 waterproof portable speaker with punchy bass, 12-hour battery and a durable fabric finish."],
  ["Mirrorless Camera Kit", "electronics", "Optix", 58990, 64990, 9, 4.8, 318, ["1516035069371-29a1b244cc32"], ["camera", "photography", "4k-video"], false,
    "24 MP mirrorless camera with a 16-50 mm kit lens, 4K video, fast hybrid autofocus and in-body stabilisation."],
  ["Instant Film Camera", "electronics", "Optix", 6999, 7999, 40, 4.3, 954, ["1526170375885-4d8ecf77b99f"], ["camera", "instant", "gift"], false,
    "Classic instant camera with autofocus, a built-in flash and a selfie mirror. Prints credit-card-sized photos in seconds."],
  ["Tablet 10.9\" Wi-Fi", "electronics", "Nimbus", 29999, 34999, 25, 4.6, 1120, ["1544244015-0df4b3ffc6b0"], ["tablet", "stylus", "entertainment"], false,
    "10.9-inch Liquid Retina tablet with stylus support, 128 GB storage and all-day battery for work, study and streaming."],

  // Fashion
  ["Leather Biker Jacket", "fashion", "UrbanThread", 7999, 11999, 20, 4.6, 388, ["1551028719-00167b16eac5"], ["jacket", "leather", "winter"], true,
    "Genuine leather biker jacket with asymmetric zip, quilted lining and zipped cuffs. A timeless layer for cooler evenings."],
  ["Classic Crew-Neck T-Shirt", "fashion", "UrbanThread", 599, 999, 150, 4.4, 4210, ["1521572163474-6864f9cf17ab"], ["t-shirt", "cotton", "basics"], false,
    "100% combed cotton crew-neck tee with a regular fit. Pre-shrunk and breathable for everyday wear."],
  ["Graphic Print T-Shirt", "fashion", "Kanso", 699, 999, 120, 4.3, 1562, ["1576566588028-4147f3842f27"], ["t-shirt", "graphic", "casual"], false,
    "Soft cotton tee with a bold front graphic print and a relaxed fit."],
  ["Essential Black T-Shirt", "fashion", "Kanso", 649, 899, 110, 4.5, 2034, ["1618354691373-d851c5c3a990"], ["t-shirt", "black", "basics"], false,
    "Heavyweight black tee with a small chest logo. Holds its shape wash after wash."],
  ["Slim Fit Stretch Jeans", "fashion", "DenimCo", 1999, 2999, 85, 4.4, 2876, ["1542272604-787c3835535d"], ["jeans", "denim", "slim-fit"], false,
    "Mid-rise slim-fit jeans in stretch denim for all-day comfort. Classic five-pocket styling."],
  ["Checked Two-Piece Suit", "fashion", "Regal", 12999, 17999, 14, 4.7, 196, ["1594938298603-c8148c4dae35"], ["suit", "formal", "wedding"], false,
    "Tailored two-piece suit in a blue check with a notch lapel and flat-front trousers. Ideal for weddings and formal events."],
  ["Knit Poncho Wrap", "fashion", "Kanso", 1499, 2199, 35, 4.2, 274, ["1434389677669-e08b4cac3105"], ["poncho", "knit", "women"], false,
    "Lightweight knit poncho with fringe trim. Layers easily over tops and dresses."],
  ["Canvas Low-Top Sneakers", "fashion", "StreetStep", 2499, 3299, 64, 4.5, 1877, ["1525966222134-fcfa99b8ae77"], ["sneakers", "canvas", "casual"], false,
    "Classic canvas low-top sneakers with a cushioned insole and a vulcanised rubber sole."],
  ["Classic White Sneakers", "fashion", "StreetStep", 3999, 4999, 48, 4.6, 1320, ["1608231387042-66d1773070a5"], ["sneakers", "white", "leather"], false,
    "Clean white leather sneakers with perforated detailing and a padded collar. Goes with everything."],

  // Sports
  ["Running Shoes Pro X", "sports", "SpeedRun", 7999, 9999, 67, 4.5, 934, ["1542291026-7eec264c27ff"], ["running", "shoes", "marathon"], true,
    "Lightweight running shoes with energy-return foam and a breathable knit upper. Built for daily training and race day."],
  ["Steel Water Bottle 1L", "sports", "HydroFlow", 899, 1299, 120, 4.4, 3210, ["1602143407151-7111542de6e8"], ["water-bottle", "insulated", "bpa-free"], false,
    "Vacuum-insulated stainless steel bottle that keeps drinks cold for 24 hours or hot for 12. BPA-free, leak-proof lid."],
  ["Yoga Mat & Block Set", "sports", "ZenFit", 1499, 1999, 55, 4.6, 789, ["1591291621164-2c6367723315"], ["yoga", "fitness", "non-slip"], false,
    "6 mm non-slip TPE yoga mat with a foam block and carrying strap. Eco-friendly and easy to clean."],
  ["Hex Dumbbell Set (2 x 5 kg)", "sports", "IronCore", 3499, 4499, 40, 4.7, 1105, ["1576678927484-cc907957088c"], ["dumbbells", "strength", "home-gym"], false,
    "Rubber-coated hex dumbbells with knurled chrome handles. The hex shape stops them rolling away."],
  ["City Road Bicycle", "sports", "Velo", 24999, 29999, 12, 4.6, 214, ["1485965120184-e220f721d03e"], ["bicycle", "cycling", "commute"], false,
    "Lightweight steel-frame road bike with a single-speed drivetrain, alloy rims and dual caliper brakes."],
  ["Match Football (Size 5)", "sports", "GoalPro", 999, 1499, 90, 4.4, 1678, ["1614632537190-23e4146777db"], ["football", "outdoor", "size-5"], false,
    "Thermally bonded match football with a textured surface for better control in all weather."],
  ["Outdoor Basketball", "sports", "GoalPro", 1299, 1799, 75, 4.3, 932, ["1546519638-68e109498ffc"], ["basketball", "outdoor", "size-7"], false,
    "Durable rubber basketball with deep channels for grip. Official size 7 for outdoor courts."],
  ["Training Shoes Flex", "sports", "SpeedRun", 5499, 6999, 52, 4.5, 687, ["1606107557195-0e29a4b5b4aa"], ["training", "shoes", "gym"], false,
    "Stable training shoes with a flat, grippy outsole for lifting, HIIT and court workouts."],
  ["Battle Rope 12 m", "sports", "IronCore", 2999, 3999, 26, 4.4, 241, ["1599058917212-d750089bc07e"], ["battle-rope", "conditioning", "home-gym"], false,
    "38 mm poly-dacron battle rope with heat-shrink grips for full-body conditioning workouts."],

  // Home & Kitchen
  ["Espresso & Coffee Maker", "home", "BrewMaster", 9999, 12999, 36, 4.4, 891, ["1570222094114-d054a817e56b"], ["coffee", "kitchen", "espresso"], true,
    "Espresso machine with a built-in burr grinder, steam wand and programmable shots. Café-style coffee at home."],
  ["Minimalist Floor Lamp", "home", "LightUp", 3499, 4499, 73, 4.6, 1123, ["1507473885765-e6ed057f782c"], ["lamp", "led", "lighting"], false,
    "Matte steel floor lamp with an adjustable dome shade. Works with standard E27 LED bulbs."],
  ["High-Speed Blender 1.5L", "home", "BrewMaster", 3499, 4499, 48, 4.5, 1567, ["1585515320310-259814833e62"], ["blender", "kitchen", "smoothie"], false,
    "1000W blender with a 1.5 L glass jar, three speeds and pulse. Crushes ice for smoothies and shakes."],
  ["Handmade Ceramic Cup Set", "home", "Mitti", 1299, 1799, 60, 4.7, 432, ["1610701596007-11502861dcfa"], ["ceramic", "cups", "handmade"], false,
    "Set of four handmade stoneware cups with a speckled glaze. Microwave and dishwasher safe."],
  ["Soft Microfibre Pillows (Pair)", "home", "DreamWell", 1199, 1699, 100, 4.3, 2210, ["1584100936595-c0654b55a2e2"], ["pillow", "bedroom", "sleep"], false,
    "Hypoallergenic microfibre pillows with a breathable cotton cover. Medium firmness for back and side sleepers."],
  ["Cotton Bedding Set (Queen)", "home", "DreamWell", 2999, 3999, 44, 4.5, 876, ["1615874959474-d609969a20ed"], ["bedding", "cotton", "bedroom"], false,
    "300 thread count cotton bedsheet with two pillow covers and a duvet cover. Soft, breathable and fade-resistant."],
  ["Kitchen Cookware Set", "home", "ChefLine", 4999, 6999, 32, 4.4, 654, ["1556911220-bff31c812dba"], ["cookware", "kitchen", "non-stick"], false,
    "Five-piece induction-ready cookware set with non-stick coating and stay-cool handles."],
  ["Living Room Decor Bundle", "home", "Mitti", 2499, 3499, 28, 4.2, 198, ["1583847268964-b28dc8f51f92"], ["decor", "living-room", "cushions"], false,
    "Two framed wall prints, a woven throw and two cushion covers in neutral tones to refresh any room."],

  // Furniture
  ["Velvet 3-Seater Sofa", "furniture", "ComfortWork", 34999, 44999, 8, 4.7, 312, ["1555041469-a586c61ea9bc"], ["sofa", "velvet", "living-room"], true,
    "Mid-century 3-seater sofa in emerald velvet with solid wood legs and high-resilience foam cushions."],
  ["Linen Lounge Sofa", "furniture", "ComfortWork", 29999, 36999, 10, 4.5, 204, ["1578500494198-246f612d3b3d"], ["sofa", "linen", "living-room"], false,
    "Deep-seated 2-seater sofa in a soft linen blend. Removable, washable cushion covers."],
  ["Scandinavian Lounge Chair", "furniture", "Nordhem", 8999, 11999, 23, 4.6, 567, ["1580480055273-228ff5388ef8"], ["chair", "lounge", "scandinavian"], false,
    "Curved upholstered lounge chair on a swivel base. Compact enough for bedrooms and reading corners."],
  ["Accent Armchair", "furniture", "Nordhem", 12999, 15999, 16, 4.5, 143, ["1586023492125-27b2c045efd7"], ["armchair", "accent", "living-room"], false,
    "Mustard upholstered armchair with a wingback silhouette and tapered wooden legs."],
  ["Moulded Dining Chair (Set of 2)", "furniture", "Nordhem", 6999, 8999, 30, 4.4, 389, ["1592078615290-033ee584e267"], ["dining-chair", "set", "modern"], false,
    "Pair of moulded dining chairs with padded seats and solid beech legs."],
  ["Wooden Bar Stool", "furniture", "Nordhem", 2499, 3299, 42, 4.3, 221, ["1503602642458-232111445657"], ["stool", "wood", "kitchen"], false,
    "Counter-height stool in solid wood with a footrest. Sturdy and easy to assemble."],
  ["Home Office Study Desk", "furniture", "ComfortWork", 9999, 12999, 19, 4.6, 476, ["1518455027359-f3f8164ba6bd"], ["desk", "office", "study"], false,
    "120 cm study desk with a scratch-resistant top, steel trestle legs and cable management."],
  ["Upholstered Queen Bed", "furniture", "DreamWell", 39999, 49999, 6, 4.7, 158, ["1505693416388-ac5ce068fe85"], ["bed", "queen", "bedroom"], false,
    "Queen bed with a tufted upholstered headboard and a solid wood slat base. Mattress sold separately."],

  // Accessories
  ["Laptop Backpack 30L", "accessories", "TravelMate", 2999, 3999, 41, 4.7, 2134, ["1553062407-98eeb64c6a62"], ["backpack", "laptop", "travel"], false,
    "Water-resistant backpack with a padded 16-inch laptop sleeve, USB charging port and anti-theft back pocket."],
  ["Vintage Leather Backpack", "accessories", "TravelMate", 4999, 6499, 18, 4.6, 412, ["1622560480605-d83c853bc5c3"], ["backpack", "leather", "vintage"], false,
    "Full-grain leather backpack with brass hardware and a padded laptop compartment."],
  ["Classic Square Sunglasses", "accessories", "SunCraft", 1499, 2199, 66, 4.4, 1876, ["1572635196237-14b3f281503f"], ["sunglasses", "uv400", "unisex"], false,
    "Square acetate frames with UV400 polarised lenses. Comes with a hard case and cleaning cloth."],
  ["Round Metal Sunglasses", "accessories", "SunCraft", 1799, 2499, 52, 4.5, 943, ["1511499767150-a48a237f0083"], ["sunglasses", "round", "metal"], false,
    "Lightweight round metal frames with green-tinted UV400 lenses and adjustable nose pads."],
  ["Minimal Analog Watch", "accessories", "Tempo", 3999, 5499, 34, 4.6, 765, ["1524592094714-0f0654e20314"], ["watch", "analog", "leather-strap"], false,
    "Minimalist 40 mm watch with a Japanese quartz movement, sapphire-coated glass and a genuine leather strap."],
  ["Leather Bifold Wallet", "accessories", "Tempo", 999, 1499, 140, 4.5, 3301, ["1627123424574-724758594e93"], ["wallet", "leather", "rfid"], false,
    "Slim bifold wallet in genuine leather with RFID blocking and six card slots."],
  ["Structured Top-Handle Bag", "accessories", "Luxe", 4499, 5999, 21, 4.6, 287, ["1584917865442-de89df76afd3"], ["handbag", "women", "leather"], false,
    "Structured top-handle bag with a detachable shoulder strap and gold-tone clasp."],
];

// Extra photos per product (verified on contact sheets) so each product page
// shows several views. Product images are capped at three.
const EXTRA_IMAGES = {
  "prod-1": ["1599955051125-571f47e04316"],
  "prod-2": ["1529767203443-a617595c8825"],
  "prod-3": ["1722317125979-63599bbb9491", "1751580642565-9284c29f6e00"],
  "prod-4": ["1783890848515-c0dc28b25ef2"],
  "prod-5": ["1521607630287-ee2e81ad3ced", "1717295248494-937c3a5655b1"],
  "prod-6": ["1787834964335-7ca830e4263a"],
  "prod-7": ["1517524615358-1a73bc3fcf51"],
  "prod-8": ["1596495717655-5a38ee8ad7b2", "1721744179382-0f8b0f19789e"],
  "prod-9": ["1585246135063-c361ccd416b6", "1786875950828-d15928cd2772"],
  "prod-10": ["1754142927775-8f1e97ebd030", "1588131153911-a4ea5189fe19"],
  "prod-11": ["1527935168229-c1cc0bdfa662", "1739742465503-b234caa733c9"],
  "prod-12": ["1559758942-9fcc1c7dcf1b", "1762518883965-908ce7f4b214"],
  "prod-13": ["1777539995590-8212f533b6ae", "1747501051110-4a77a81321aa"],
  "prod-14": ["1542403333-cd6d9707fa36", "1567777404619-e7c1e49cba9f"],
  "prod-15": ["1581655353564-df123a1eb820", "1651761179569-4ba2aa054997"],
  "prod-16": ["1627913363993-95b23378265e", "1600805625047-a65db4b4e8d0"],
  "prod-17": ["1571455786673-9d9d6c194f90", "1654570818480-54524bf0186b"],
  "prod-18": ["1762752872078-982cd2b499a4", "1789110520732-77b1e55c32ea"],
  "prod-19": ["1617244147833-3d0919398316", "1686628212738-a0a28bf898bb"],
  "prod-20": ["1552477215-f1ef080434f4", "1785613229880-e7a40f285dba"],
  "prod-21": ["1783139965231-9ecfc25eaf45", "1601731597613-74130df0e01d"],
  "prod-22": ["1780824946973-ab4e10ec90f6", "1620989928625-08536e746255"],
  "prod-23": ["1762690285055-fa80848e825b", "1560816801-08a84aa4bcd7"],
  "prod-24": ["1605714312496-01e90cb509cc", "1789925941122-8162d3628b47"],
  "prod-25": ["1763004871583-4183d64096b1", "1571019613454-1cb2f99b2d8b"],
  "prod-26": ["1685633224688-6a77675eb119", "1582765114730-fe04e8fa43c3"],
  "prod-27": ["1577106901574-4629d3108efc", "1508034689382-e34a2bdffa01"],
  "prod-28": ["1486286701208-1d58e9338013", "1575361204480-aadea25e6e68"],
  "prod-29": ["1676393330610-ab518bb9ef0d", "1762860798875-415e25cf8a5b"],
  "prod-30": ["1765914448331-206c5441c2f8", "1719759674376-a001dc166cb6"],
  "prod-32": ["1768095752732-6fba331e1a60", "1742764676913-8a7e089a9494"],
  "prod-33": ["1608193851807-be390702344a", "1790612590611-fa7c690920e8"],
  "prod-34": ["1704727851801-3743b49cc141", "1740803292819-db75045edc05"],
  "prod-35": ["1536936812504-0e77dc3f0b40", "1784652587169-6b3933829d22"],
  "prod-36": ["1539438050859-39219d86bde8", "1628304457639-3dd4ded74a8b"],
  "prod-37": ["1762199904138-d163fe89540a", "1698746043955-42b03ddedfcb"],
  "prod-38": ["1584990347955-2ec0431a6e8f", "1588279102658-4230e1c4fb1e"],
  "prod-39": ["1775029676739-86443af4010d", "1780672823995-72e9a5416f12"],
  "prod-40": ["1631510083755-11ecb5172d81", "1759647020668-648cd90ddce4"],
  "prod-41": ["1672345158827-7f4aa9467b49", "1512212621149-107ffe572d2f"],
  "prod-42": ["1762803841693-9efdc2fbf446", "1732637279600-a85a25377ba1"],
  "prod-43": ["1643616972898-5adde52a9847", "1685453628631-82ce1a740a9c"],
  "prod-44": ["1616486886892-ff366aa67ba4", "1581539250439-c96689b516dd"],
  "prod-45": ["1565538810643-b5bdb714032a", "1782730741096-b7c1fde1e79c"],
  "prod-46": ["1531668720450-39cf1563fab9", "1652882861012-95f3263cab63"],
  "prod-47": ["1757418254008-1647eb0afe04", "1774578342047-5bf09cd092fa"],
  "prod-48": ["1594299447935-e5b840f54b9b", "1541240290619-3f2fad86473d"],
  "prod-49": ["1622560257067-108402fcedc0", "1572537794493-079b10d702df"],
  "prod-50": ["1599838082471-71ca4aa8e0c8", "1728405034496-a5ac47f28340"],
  "prod-51": ["1590564310418-66304f55a2c2", "1729693673290-11ffa8776000"],
  "prod-52": ["1595389295128-016699e74935", "1758887952896-8491d393afe2"],
  "prod-53": ["1620109176813-e91290f6c795", "1624538000860-24716b9050f2"],
};

const products = seed.map(
  ([name, category, brand, price, originalPrice, stock, rating, reviewCount, imageIds, tags, featured, description], i) => ({
    id: `prod-${i + 1}`,
    name,
    description,
    price,
    originalPrice,
    category,
    brand,
    stock,
    rating,
    reviewCount,
    images: [...imageIds, ...(EXTRA_IMAGES[`prod-${i + 1}`] || [])].slice(0, 3).map(img),
    tags,
    featured,
    // Spread creation dates so "Newest" sorting is meaningful
    createdAt: new Date(Date.UTC(2026, 0, 1) + i * 3 * 86400000).toISOString(),
  })
);

// ─── Search & deals ──────────────────────────────────────────────────────────
// Search rules live in utils/search.js (similar words, typo fixes, related items).
const { searchProducts } = require("../utils/search");

// Today's Deals (utils/deals.js): 8 products a day get an extra discount and
// free delivery. Products are always read through `shopperView`, so the deal
// price is used everywhere (listing, cart, checkout, orders).
const { todaysDeals, withDeal } = require("../utils/deals");
const shopperView = (list) => {
  const deals = todaysDeals(products);
  return list.map((p) => withDeal(p, deals));
};
const discountOf = (p) => (p.originalPrice > p.price ? ((p.originalPrice - p.price) / p.originalPrice) * 100 : 0);

// ─── Carts / Orders / Tokens ─────────────────────────────────────────────────
const carts = {};
const orders = [];
const refreshTokens = new Set();

// ─── Store Methods ─────────────────────────────────────────────────────────
const store = {
  // Users
  users: {
    findAll: () => users.map(({ password, ...u }) => u),
    findById: (id) => users.find((u) => u.id === id),
    findByEmail: (email) => users.find((u) => u.email.toLowerCase() === String(email).toLowerCase()),
    create: (data) => {
      const user = { id: uuidv4(), ...data, createdAt: new Date().toISOString() };
      users.push(user);
      return user;
    },
    update: (id, data) => {
      const idx = users.findIndex((u) => u.id === id);
      if (idx === -1) return null;
      users[idx] = { ...users[idx], ...data, updatedAt: new Date().toISOString() };
      return users[idx];
    },
  },

  // Products
  products: {
    // Returns { result, searchNote }: searchNote explains when search had to
    // fix a typo or fall back to related items.
    search: (filters = {}) => {
      let result = shopperView(products);
      let searchNote = null;
      if (filters.category) result = result.filter((p) => p.category === filters.category);
      if (filters.featured !== undefined) result = result.filter((p) => p.featured === filters.featured);
      if (filters.deals) result = result.filter((p) => p.deal);
      if (filters.minPrice) result = result.filter((p) => p.price >= parseFloat(filters.minPrice));
      if (filters.maxPrice) result = result.filter((p) => p.price <= parseFloat(filters.maxPrice));
      if (filters.search) {
        // Results come back in relevance order; an explicit sort below overrides it
        ({ results: result, note: searchNote } = searchProducts(result, filters.search, products));
      }
      if (filters.sort === "price_asc") result.sort((a, b) => a.price - b.price);
      if (filters.sort === "price_desc") result.sort((a, b) => b.price - a.price);
      if (filters.sort === "rating") result.sort((a, b) => b.rating - a.rating);
      if (filters.sort === "newest") result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      if (filters.sort === "discount") result.sort((a, b) => discountOf(b) - discountOf(a));
      return { result, searchNote };
    },
    findAll: (filters = {}) => store.products.search(filters).result,
    // Shopper view (today's deal applied). Admin edits use findRawById.
    findById: (id) => {
      const product = products.find((p) => p.id === id);
      return product ? shopperView([product])[0] : undefined;
    },
    findRawById: (id) => products.find((p) => p.id === id),
    create: (data) => {
      const product = { id: uuidv4(), ...data, createdAt: new Date().toISOString() };
      products.push(product);
      return product;
    },
    update: (id, data) => {
      const idx = products.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      products[idx] = { ...products[idx], ...data, id, updatedAt: new Date().toISOString() };
      return products[idx];
    },
    delete: (id) => {
      const idx = products.findIndex((p) => p.id === id);
      if (idx === -1) return false;
      products.splice(idx, 1);
      return true;
    },
    getCategories: () => [...new Set(products.map((p) => p.category))],
  },

  // Cart
  cart: {
    get: (userId) => carts[userId] || { items: [], updatedAt: null },
    set: (userId, cart) => {
      carts[userId] = { ...cart, updatedAt: new Date().toISOString() };
      return carts[userId];
    },
    clear: (userId) => {
      carts[userId] = { items: [], updatedAt: new Date().toISOString() };
      return carts[userId];
    },
  },

  // Orders
  orders: {
    create: (data) => {
      const order = {
        id: `ORD-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1296).toString(36).toUpperCase()}`,
        ...data,
        status: "confirmed",
        createdAt: new Date().toISOString(),
      };
      orders.unshift(order);
      return order;
    },
    findByUser: (userId) => orders.filter((o) => o.userId === userId),
    findById: (id) => orders.find((o) => o.id === id),
  },

  // Refresh Tokens
  tokens: {
    add: (token) => refreshTokens.add(token),
    has: (token) => refreshTokens.has(token),
    delete: (token) => refreshTokens.delete(token),
  },
};

module.exports = store;
