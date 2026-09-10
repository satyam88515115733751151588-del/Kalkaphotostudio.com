/* =============================================
   KALKA DIGITAL — SHOP PRODUCT DATA
   Single source of truth for shop.html + product.html
   Edit this array to add / remove / update products.
   ============================================= */

const SHOP_PRODUCTS = [
  {
    id: "photo-frame-classic",
    category: "Photo Frames",
    name: "Classic Wooden Photo Frame",
    price: "₹899",
    rating: 4.6,
    reviewCount: 32,
    description:
      "A handcrafted wooden photo frame finished with a matte black border. Built to hold your favourite prints for a lifetime — available in multiple sizes on request.",
    images: [
      "https://res.cloudinary.com/drppdpiyi/image/upload/v1787715017/rakhi_1_ytcfsb.png",
      "https://res.cloudinary.com/drppdpiyi/image/upload/v1779953306/3_uvsu00.jpg",
      "https://res.cloudinary.com/drppdpiyi/image/upload/v1779953308/4_ee9tvl.jpg"
    ]
  },
  {
    id: "album-heritage",
    category: "Photo Albums",
    name: "Heritage Wedding Album",
    price: "₹4,499",
    rating: 4.9,
    reviewCount: 58,
    description:
      "A premium hardbound wedding album with archival-grade printing and a linen cover. Each album is laid out and assembled by hand to tell your story page by page.",
    images: [
      "https://res.cloudinary.com/drppdpiyi/image/upload/v1779953303/1_dmzrya.jpg",
      "https://res.cloudinary.com/drppdpiyi/image/upload/v1779953303/2_qlmx2v.jpg",
      "https://res.cloudinary.com/drppdpiyi/image/upload/v1779953303/4_ivfmoz.jpg"
    ]
  },
  {
    id: "canvas-print-large",
    category: "Canvas Prints",
    name: "Large Format Canvas Print",
    price: "₹1,999",
    rating: 4.7,
    reviewCount: 21,
    description:
      "Museum-quality canvas printing on a solid wooden frame, ready to hang. Perfect for turning a favourite portrait or landscape into a statement piece for your wall.",
    images: [
      "https://res.cloudinary.com/drppdpiyi/image/upload/v1779953295/1_otrpku.jpg",
      "https://res.cloudinary.com/drppdpiyi/image/upload/v1779953292/2_eujbra.jpg",
      "https://res.cloudinary.com/drppdpiyi/image/upload/v1779953291/3_oitmyk.jpg"
    ]
  },
  {
    id: "photo-frame-vintage",
    category: "Photo Frames",
    name: "Vintage Ornate Photo Frame",
    price: "₹1,299",
    rating: 4.5,
    reviewCount: 14,
    description:
      "An ornate antique-style frame with a hand-finished gold trim, ideal for portraits and family heirloom shots that deserve a little extra grandeur.",
    images: [
      "https://res.cloudinary.com/drppdpiyi/image/upload/v1779953290/4_rbl8fe.jpg",
      "https://res.cloudinary.com/drppdpiyi/image/upload/v1779953294/1_isd547.jpg",
      "https://res.cloudinary.com/drppdpiyi/image/upload/v1779953292/2_eiiufx.jpg"
    ]
  },
  {
    id: "album-family",
    category: "Photo Albums",
    name: "Family Moments Album",
    price: "₹2,799",
    rating: 4.8,
    reviewCount: 27,
    description:
      "A compact hardbound album designed for everyday family celebrations — birthdays, get-togethers and festive functions, printed on premium matte paper.",
    images: [
      "https://res.cloudinary.com/drppdpiyi/image/upload/v1779953306/1_qkdwt8.jpg",
      "https://res.cloudinary.com/drppdpiyi/image/upload/v1779953306/3_uvsu00.jpg",
      "https://res.cloudinary.com/drppdpiyi/image/upload/v1779953308/4_ee9tvl.jpg"
    ]
  },
  {
    id: "canvas-print-mini",
    category: "Canvas Prints",
    name: "Mini Canvas Print Set (Set of 3)",
    price: "₹1,199",
    rating: 4.4,
    reviewCount: 9,
    description:
      "A set of three small canvas prints, perfect for a gallery wall or a desk shelf. Mix and match your favourite frames from any shoot.",
    images: [
      "https://res.cloudinary.com/drppdpiyi/image/upload/v1779953294/3_xxldun.jpg",
      "https://res.cloudinary.com/drppdpiyi/image/upload/v1779953297/4_jh9yqu.jpg",
      "https://res.cloudinary.com/drppdpiyi/image/upload/v1779953295/1_otrpku.jpg"
    ]
  }
];

/* Helper: look up one product by id */
function getShopProductById(id) {
  return SHOP_PRODUCTS.find(p => p.id === id);
}

/* Helper: render a 5-star rating string as filled/half/empty Material Symbols */
function renderStarsHTML(rating) {
  let html = "";
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      html += '<span class="material-symbols-outlined star-filled">star</span>';
    } else if (rating >= i - 0.5) {
      html += '<span class="material-symbols-outlined star-filled">star_half</span>';
    } else {
      html += '<span class="material-symbols-outlined star-empty">star</span>';
    }
  }
  return html;
}
