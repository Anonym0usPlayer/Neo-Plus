export function getThemeColor(): string {
  return getComputedStyle(document.documentElement).getPropertyValue('--neo-custom-base-color').trim() ||
         getComputedStyle(document.documentElement).getPropertyValue('--neo-default-base-color').trim() ||
         '#ffffff';
}
export function createColorPickerHTML(): string {
  const currentColor = getThemeColor();
  const id = `neo-color-input-${Date.now()}`;
  return `<input type="color" id="${id}" value="${currentColor}">`;
}
