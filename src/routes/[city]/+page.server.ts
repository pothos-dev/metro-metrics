import { loadCity } from "$lib/db"

export const ssr = false

export async function load({ params }) {
  return {
    city: await loadCity(params.city),
  }
}
