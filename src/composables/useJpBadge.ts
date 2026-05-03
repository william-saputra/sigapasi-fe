export function useJpBadge() {
  function getBadgeClass(currentJp: number, targetJp: number): string {
    if (targetJp === 0) return 'bg-gray-100 text-gray-500'
    if (currentJp === 0) return 'bg-red-100 text-red-700'
    if (currentJp < targetJp) return 'bg-amber-100 text-amber-700'
    if (currentJp === targetJp) return 'bg-green-100 text-green-700'
    return 'bg-orange-100 text-orange-700'
  }

  function getBadgeLabel(currentJp: number, targetJp: number): string {
    return `${currentJp}/${targetJp} JP`
  }

  return { getBadgeClass, getBadgeLabel }
}
