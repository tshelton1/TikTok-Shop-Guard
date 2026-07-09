import type { ScannerFormValues } from "@/components/scans/scanner-form";

export type ScannerFieldErrors = Partial<
  Record<keyof ScannerFormValues | "form", string>
>;

const TITLE_MIN = 3;
const TITLE_MAX = 200;
const DESCRIPTION_MIN = 20;
const DESCRIPTION_MAX = 5000;
const PRICE_MAX = 999_999;

export function validateScannerForm(
  values: ScannerFormValues,
): ScannerFieldErrors {
  const errors: ScannerFieldErrors = {};
  const title = values.title.trim();
  const description = values.description.trim();
  const price = parseFloat(values.price);

  if (!title) {
    errors.title = "Product title is required.";
  } else if (title.length < TITLE_MIN) {
    errors.title = `Title must be at least ${TITLE_MIN} characters.`;
  } else if (title.length > TITLE_MAX) {
    errors.title = `Title must be under ${TITLE_MAX} characters.`;
  }

  if (!description) {
    errors.description = "Description is required.";
  } else if (description.length < DESCRIPTION_MIN) {
    errors.description = `Add at least ${DESCRIPTION_MIN} characters so we can check claims and keywords.`;
  } else if (description.length > DESCRIPTION_MAX) {
    errors.description = `Description must be under ${DESCRIPTION_MAX} characters.`;
  }

  if (!values.price.trim()) {
    errors.price = "Price is required.";
  } else if (Number.isNaN(price) || price < 0) {
    errors.price = "Enter a valid price of $0 or more.";
  } else if (price > PRICE_MAX) {
    errors.price = "Price looks unusually high. Double-check the amount.";
  }

  if (!values.shopId) {
    errors.form = "Select a shop before scanning.";
  }

  return errors;
}

export function hasScannerErrors(errors: ScannerFieldErrors) {
  return Object.keys(errors).length > 0;
}
