// Motif geometris sederhana terinspirasi kawung (empat elips mengelilingi titik pusat).
// Dibuat sebagai SVG agar mengikuti warna aksen tema dan ringan dimuat.

const enc = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

/** Pola kawung berulang (tile 40x40). */
export function kawungPattern(color: string, opacity = 0.9) {
  const e = (cx: number, cy: number, rot: number) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="9" ry="5" transform="rotate(${rot} ${cx} ${cy})" fill="none" stroke="${color}" stroke-opacity="${opacity}" stroke-width="1.2"/>`;
  const unit = (ox: number, oy: number) =>
    [e(ox, oy - 9, 90), e(ox, oy + 9, 90), e(ox - 9, oy, 0), e(ox + 9, oy, 0), `<circle cx="${ox}" cy="${oy}" r="1.6" fill="${color}" fill-opacity="${opacity}"/>`].join("");
  return enc(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">${unit(20, 20)}</svg>`);
}

/** Pita (band) tipis: kawung kecil di antara dua garis. Tile 28x14. */
export function bandPattern(color: string) {
  return enc(
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="14" viewBox="0 0 28 14">` +
      `<line x1="0" y1="0.5" x2="28" y2="0.5" stroke="${color}" stroke-width="1"/>` +
      `<line x1="0" y1="13.5" x2="28" y2="13.5" stroke="${color}" stroke-width="1"/>` +
      `<ellipse cx="14" cy="4.2" rx="3.4" ry="2" fill="none" stroke="${color}" stroke-width="0.9"/>` +
      `<ellipse cx="14" cy="9.8" rx="3.4" ry="2" fill="none" stroke="${color}" stroke-width="0.9"/>` +
      `<ellipse cx="9.2" cy="7" rx="2" ry="3.4" fill="none" stroke="${color}" stroke-width="0.9"/>` +
      `<ellipse cx="18.8" cy="7" rx="2" ry="3.4" fill="none" stroke="${color}" stroke-width="0.9"/>` +
      `<circle cx="14" cy="7" r="0.9" fill="${color}"/>` +
      `<path d="M0 7 L3 4 L6 7 L3 10 Z M22 7 L25 4 L28 7 L25 10 Z" fill="${color}" fill-opacity="0.55"/>` +
      `</svg>`,
  );
}
