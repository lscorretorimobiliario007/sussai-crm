const TOUR_STORAGE_KEY = "sussai_tour_done_v1";

export function shouldAutoStartTour(usuario) {
  if (!usuario) return false;
  return localStorage.getItem(TOUR_STORAGE_KEY) !== "1";
}

export function markTourDone() {
  localStorage.setItem(TOUR_STORAGE_KEY, "1");
}

export function resetTourFlag() {
  localStorage.removeItem(TOUR_STORAGE_KEY);
}
