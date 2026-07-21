import React from "react"
import { PLPProps } from "../types"

export function SunsetPLP({ store, products }: PLPProps) {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Collection</h1>
      <div className="grid grid-cols-4 gap-6">
        {products.map((p: any) => (
          <div key={p.id} className="border p-4">
            <h3>{p.name}</h3>
            <p>BDT {p.pricePaisa / 100}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
