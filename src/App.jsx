import { useState } from 'react'

const roles = [
  {
    id: 'restaurant',
    title: 'Restaurant',
    text: 'Track stock, sell leftover food cheap, or donate cooked food.',
  },
  {
    id: 'buyer',
    title: 'Buyer',
    text: 'Find discounted food nearby, reserve it, and pick it up in person.',
  },
  {
    id: 'ngo',
    title: 'NGO',
    text: 'Claim donated cooked food and arrange a pickup.',
  },
]

function dateFromToday(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

const startingItems = [
  { id: '1', name: 'Baby spinach', quantity: 7, unit: 'kg', expiry: dateFromToday(1) },
  { id: '2', name: 'Roma tomatoes', quantity: 18, unit: 'kg', expiry: dateFromToday(4) },
  { id: '3', name: 'Brioche buns', quantity: 14, unit: 'pcs', expiry: dateFromToday(2) },
]

function daysLeft(expiry) {
  const expiryDay = new Date(expiry)
  const today = new Date()
  expiryDay.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return Math.round((expiryDay - today) / 86400000)
}

function freshness(expiry) {
  const days = daysLeft(expiry)
  if (days < 0) return { label: 'Expired', tone: 'urgent' }
  if (days === 0) return { label: 'Expires today', tone: 'urgent' }
  if (days <= 3) return { label: `${days} day${days === 1 ? '' : 's'} left`, tone: 'soon' }
  return { label: `${days} days left`, tone: 'ok' }
}

export default function App() {
  const [role, setRole] = useState(null)
  const [items, setItems] = useState(startingItems)

  if (!role) {
    return (
      <main>
        <p className="eyebrow">ZeroWasteTable</p>
        <h1>Keep leftover food from going to waste.</h1>
        <p className="lede">
          Choose how you want to use the app. You can switch later.
        </p>
        <div className="role-list">
          {roles.map((item) => (
            <button
              key={item.id}
              className="role-card"
              type="button"
              onClick={() => setRole(item.id)}
            >
              <strong>{item.title}</strong>
              <span>{item.text}</span>
            </button>
          ))}
        </div>
      </main>
    )
  }

  const current = roles.find((item) => item.id === role)

  return (
    <main>
      <p className="eyebrow">ZeroWasteTable</p>
      <h1>{current.title} dashboard</h1>
      <p className="lede">{current.text}</p>

      {role === 'restaurant' ? (
        <RestaurantInventory items={items} setItems={setItems} />
      ) : (
        <p className="note">This screen will fill in next.</p>
      )}

      <button className="back" type="button" onClick={() => setRole(null)}>
        Change role
      </button>
    </main>
  )
}

function RestaurantInventory({ items, setItems }) {
  const [form, setForm] = useState({
    name: '',
    quantity: '',
    unit: 'kg',
    expiry: '',
  })

  function addItem(event) {
    event.preventDefault()
    const quantity = Number(form.quantity)
    if (!form.name.trim() || !quantity || !form.expiry) return

    setItems([
      {
        id: String(Date.now()),
        name: form.name.trim(),
        quantity,
        unit: form.unit.trim() || 'kg',
        expiry: form.expiry,
      },
      ...items,
    ])
    setForm({ name: '', quantity: '', unit: 'kg', expiry: '' })
  }

  return (
    <section className="inventory">
      <h2>Inventory</h2>
      <p className="lede">Green is fine. Orange is soon. Red needs a decision.</p>

      <ul className="item-list">
        {items.map((item) => {
          const status = freshness(item.expiry)
          return (
            <li key={item.id} className="item-card">
              <div>
                <strong>{item.name}</strong>
                <span>
                  {item.quantity} {item.unit} remaining
                </span>
              </div>
              <span className={`tag tag-${status.tone}`}>{status.label}</span>
            </li>
          )
        })}
      </ul>

      <form className="add-form" onSubmit={addItem}>
        <h2>Add an item</h2>
        <label>
          Name
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="e.g. Baby spinach"
          />
        </label>
        <div className="form-row">
          <label>
            Quantity
            <input
              type="number"
              min="0"
              step="0.1"
              value={form.quantity}
              onChange={(event) => setForm({ ...form, quantity: event.target.value })}
              placeholder="12"
            />
          </label>
          <label>
            Unit
            <input
              value={form.unit}
              onChange={(event) => setForm({ ...form, unit: event.target.value })}
              placeholder="kg"
            />
          </label>
        </div>
        <label>
          Expiry date
          <input
            type="date"
            value={form.expiry}
            onChange={(event) => setForm({ ...form, expiry: event.target.value })}
          />
        </label>
        <button className="back" type="submit">
          Save item
        </button>
      </form>
    </section>
  )
}
