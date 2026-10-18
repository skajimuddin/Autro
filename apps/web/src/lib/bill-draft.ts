// The estimate/invoice editors' draft line items, and how they become API/number input.

export interface DraftItem {
  tempId: string
  description: string
  amount: string
  quantity: string
}

export const blankItem = (): DraftItem => ({
  tempId: crypto.randomUUID(),
  description: '',
  amount: '',
  quantity: '1',
})

/** A line counts once it has a description and a price. */
export const isFilled = (i: DraftItem): boolean => Boolean(i.description.trim()) && Number(i.amount) > 0

/** What the API receives for the lines. Quantity is a whole number there. */
export const toApiItems = (items: DraftItem[]): { description: string; amount: number; quantity: number; sort_order: number }[] =>
  items.filter(isFilled).map((i, idx) => ({
    description: i.description.trim(),
    amount: Number(i.amount),
    quantity: Number(i.quantity) || 1,
    sort_order: idx,
  }))

export const toNumbers = (items: DraftItem[]): { amount: number; quantity: number }[] =>
  items.map((i) => ({ amount: Number(i.amount) || 0, quantity: Number(i.quantity) || 1 }))
