import type { LayoutKey } from "@/types/invitation";

// Template tata letak. Mengubah susunan & komposisi section; warna dan font
// tetap diatur terpisah di tema, jadi semua preset warna bisa dipadukan.
export const LAYOUTS: { key: LayoutKey; name: string; description: string; bestWith: string }[] = [
  { key: "editorial", name: "Editorial", description: "Layout majalah asimetris: nama besar bertumpuk, susunan acara seperti cetakan, galeri mozaik.", bestWith: "Modern Elegant, Editorial Wedding" },
  { key: "classic", name: "Klasik Simetris", description: "Semua rata tengah dalam bingkai garis ganda, seperti kartu undangan cetak yang formal.", bestWith: "Classic Luxury, Romantic Champagne" },
  { key: "cinematic", name: "Sinematik Foto Penuh", description: "Setiap section berlatar foto layar penuh dengan teks di atasnya. Galeri berupa filmstrip yang digeser.", bestWith: "Minimalist Monochrome, Modern Elegant" },
  { key: "card", name: "Kartu Minimal", description: "Seluruh undangan dalam satu kartu ramping seperti layar ponsel, ringkas dan rapi, juga di desktop.", bestWith: "Botanical Garden, Romantic Champagne" },
  { key: "nusantara", name: "Tradisional Nusantara", description: "Bingkai dan pita motif geometris terinspirasi kawung. Motif bisa diganti dengan gambar sendiri.", bestWith: "Classic Luxury, Botanical Garden" },
];
