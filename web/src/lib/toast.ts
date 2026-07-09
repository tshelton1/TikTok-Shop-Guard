import { toast } from "sonner";

const DEFAULT_DURATION = 4000;

export function showSuccess(message: string) {
  toast.success(message, { duration: DEFAULT_DURATION });
}

export function showError(message: string) {
  toast.error(message, { duration: 6000 });
}

export function showInfo(message: string) {
  toast.info(message, { duration: DEFAULT_DURATION });
}

export function showWarning(message: string) {
  toast.warning(message, { duration: DEFAULT_DURATION });
}
