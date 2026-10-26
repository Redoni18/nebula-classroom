// The current time, for server pages that show "today" (the admin). They
// render on each request, so reading the clock while rendering is intended;
// going through this function keeps that in one named place.

export function currentTime(): number {
  return Date.now();
}
