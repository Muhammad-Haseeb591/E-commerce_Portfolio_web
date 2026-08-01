/* ------------------------------------------------------------------ */
/*  Fallback content — ONLY shown while the real catalog is still      */
/*  loading or if the fetch fails. Once state.FetchPrducts.catalog has */
/*  data, CategoryGrid derives real categories from it instead.        */
/* ------------------------------------------------------------------ */

export const categories = [
  {
    name: "Ladies Bags",
    slug: "women",
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
    count: 128,
  },
  {
    name: "Ladies Shoes",
    slug: "women",
    image:
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80",
    count: 96,
  },
  {
    name: "Men's Shoes",
    slug: "men",
    image:
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80",
    count: 142,
  },
  {
    name: "Kids Shoes",
    slug: "kids",
    image:
      "https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=800&q=80",
    count: 74,
  },
  {
    name: "Fragrances",
    slug: "fragrances",
    image:
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80",
    count: 210,
  },
  {
    name: "Sale",
    slug: "sale",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80",
    count: 58,
  },
]

export const bannerSlides = [
  {
    image:
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1600&q=80",
    slug: "women",
    title: "Bags That Make an Entrance",
    subtitle: "Handcrafted leather totes, crossbodies & clutches",
    cta: "Shop Ladies Bags",
  },
  {
    image:
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1600&q=80",
    slug: "men",
    title: "Step Up Your Everyday",
    subtitle: "Sneakers, loafers & boots built to last",
    cta: "Shop Men's Shoes",
  },
  {
    image:
      "https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=1600&q=80",
    slug: "fragrances",
    title: "Scent Is a Signature",
    subtitle: "Long-lasting eau de parfum for every mood",
    cta: "Shop Fragrances",
  },
  {
    image:
      "https://images.unsplash.com/photo-1596703263926-eb0762ee17e4?auto=format&fit=crop&w=1600&q=80",
    slug: "women",
    title: "Heels, Flats & Everything In Between",
    subtitle: "Comfort-first styles for day into night",
    cta: "Shop Ladies Shoes",
  },
]

export const promiseStrip = [
  {
    num: "01",
    title: "Free Shipping",
    text: "Complimentary delivery on every order over $75, nationwide.",
  },
  {
    num: "02",
    title: "Easy 30-Day Returns",
    text: "Changed your mind? Send it back within 30 days, no questions asked.",
  },
  {
    num: "03",
    title: "100% Authentic",
    text: "Every bag, shoe & fragrance is sourced direct and guaranteed genuine.",
  },
]

export const trustStats = [
  { label: "Happy Customers Served", value: 48200, suffix: "+" },
  { label: "Customer Satisfaction", value: 98, suffix: "%" },
  { label: "Items In Stock", value: 12500, suffix: "+" },
  { label: "Countries Shipped To", value: 32, suffix: "" },
]

export const featuredReviews = [
  {
    rating: 5,
    comment:
      "The Milano tote is even more beautiful in person — the leather is buttery soft and it fits my laptop perfectly.",
    name: "Amara Okafor",
    avatar: "https://i.pravatar.cc/120?img=47",
    product: "Milano Leather Tote Bag",
  },
  {
    rating: 5,
    comment:
      "Finally heels I can wear all day without wincing. Elegant and shockingly comfortable.",
    name: "Priya Sharma",
    avatar: "https://i.pravatar.cc/120?img=32",
    product: "Aurora Stiletto Heels",
  },
  {
    rating: 4,
    comment:
      "Great everyday sneakers. True to size and the grip is solid on wet pavement.",
    name: "Daniel Reyes",
    avatar: "https://i.pravatar.cc/120?img=12",
    product: "Trailrunner Low Sneakers",
  },
  {
    rating: 5,
    comment:
      "Noir Intense lasts the entire workday and gets me compliments every single time.",
    name: "Sofia Bianchi",
    avatar: "https://i.pravatar.cc/120?img=45",
    product: "Noir Intense Eau de Parfum",
  },
  {
    rating: 5,
    comment:
      "Ordered kids shoes for my son — arrived in two days and the quality is fantastic for the price.",
    name: "Marcus Bennett",
    avatar: "https://i.pravatar.cc/120?img=15",
    product: "Kids Shoes",
  },
]
