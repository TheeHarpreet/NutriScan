// Ensures barcode is in EAN-13 format
export function normaliseEAN(ean: string) {
  if (ean.length === 12) {
    return "0" + ean; // convert UPC → EAN-13
  }
  return ean;
}
