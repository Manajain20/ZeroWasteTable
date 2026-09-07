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
  { id: '1', name: 'Baby spinach', quantity: 7, unit: 'kg', expiry: dateFromToday(1), status: 'in-stock' },
  { id: '2', name: 'Roma tomatoes', quantity: 18, unit: 'kg', expiry: dateFromToday(4), status: 'in-stock' },
  { id: '3', name: 'Brioche buns', quantity: 14, unit: 'pcs', expiry: dateFromToday(2), status: 'in-stock' },
  { id: '4', name: 'Cooked herb chicken', quantity: 9, unit: 'portions', expiry: dateFromToday(0), status: 'in-stock' },
]

function daysLeft(expiry) {
  const expiryDay = new Date(expiry)
  const today = new Date()
  expiryDay.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return Math.round((expiryDay - today) / 86400000)
}

function freshness(item) {
  if (item.status === 'listed') return { label: 'Listed for buyers', tone: 'ok' }
  if (item.status === 'donated') return { label: 'Offered to NGOs', tone: 'ok' }
  const days = daysLeft(item.expiry)
  if (days < 0) return { label: 'Expired', tone: 'urgent' }
  if (days === 0) return { label: 'Expires today', tone: 'urgent' }
  if (days <= 3) return { label: `${days} day${days === 1 ? '' : 's'} left`, tone: 'soon' }
  return { label: `${days} days left`, tone: 'ok' }
}

export default function App() {
  const [role, setRole] = useState(null)
  const [items, setItems] = useState(startingItems)
  const [listings, setListings] = useState([])
  const [donations, setDonations] = useState([])

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
        <RestaurantInventory
          items={items}
          setItems={setItems}
          listings={listings}
          setListings={setListings}
          donations={donations}
          setDonations={setDonations}
        />
      ) : null}

      {role === 'buyer' ? <BuyerList listings={listings} /> : null}

      {role === 'ngo' ? <NgoList donations={donations} /> : null}

      <button className="back" type="button" onClick={() => setRole(null)}>
        Change role
      </button>
    </main>
  )
}

function RestaurantInventory({ items, setItems, listings, setListings, donations, setDonations }) {
  const [form, setForm] = useState({
    name: '',
    quantity: '',
    unit: 'kg',
    expiry: '',
  })
  const [actionItem, setActionItem] = useState(null)
  const [price, setPrice] = useState('400')
  const [discount, setDiscount] = useState('30')

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
        status: 'in-stock',
      },
      ...items,
    ])
    setForm({ name: '', quantity: '', unit: 'kg', expiry: '' })
  }

  function markItem(id, status) {
    setItems(items.map((item) => (item.id === id ? { ...item, status } : item)))
  }

  function listForBuyers() {
    if (!actionItem) return
    const originalPrice = Number(price)
    const discountPercent = Math.min(80, Math.max(5, Number(discount) || 30))
    if (!originalPrice) return

    setListings([
      {
        id: String(Date.now()),
        name: actionItem.name,
        quantity: actionItem.quantity,
        unit: actionItem.unit,
        originalPrice,
        discountPercent,
        discountedPrice: Math.round(originalPrice * (1 - discountPercent / 100)),
        pickup: 'Today · 6:00–8:00 PM',
        payNote: 'Pay in person at pickup',
      },
      ...listings,
    ])
    markItem(actionItem.id, 'listed')
    setActionItem(null)
  }

  function donateToNgo() {
    if (!actionItem) return
    setDonations([
      {
        id: String(Date.now()),
        name: actionItem.name,
        quantity: actionItem.quantity,
        unit: actionItem.unit,
        readyBy: 'Today · 8:00 PM',
        intendedUse: 'Animal feed only',
      },
      ...donations,
    ])
    markItem(actionItem.id, 'donated')
    setActionItem(null)
  }

  return (
    <section className="inventory">
      <h2>Inventory</h2>
      <p className="lede">Green is fine. Orange is soon. Red needs a decision.</p>

      <ul className="item-list">
        {items.map((item) => {
          const status = freshness(item)
          const canShare = item.status === 'in-stock'
          return (
            <li key={item.id} className="item-card">
              <div className="item-top">
                <div>
                  <strong>{item.name}</strong>
                  <span>
                    {item.quantity} {item.unit} remaining
                  </span>
                </div>
                <span className={`tag tag-${status.tone}`}>{status.label}</span>
              </div>
              {canShare ? (
                <button className="text-btn" type="button" onClick={() => setActionItem(item)}>
                  Sell or donate
                </button>
              ) : null}
            </li>
          )
        })}
      </ul>

      {actionItem ? (
        <div className="add-form">
          <h2>What should happen to {actionItem.name}?</h2>
          <p className="lede">
            Safe leftover ingredients can be sold cheap to buyers. Already-cooked food
            should go to an NGO, marked for animal feed.
          </p>
          <div className="form-row">
            <label>
              Original price (₹)
              <input
                type="number"
                min="1"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              />
            </label>
            <label>
              Buyer discount %
              <input
                type="number"
                min="5"
                max="80"
                value={discount}
                onChange={(event) => setDiscount(event.target.value)}
              />
            </label>
          </div>
          <div className="action-row">
            <button className="back" type="button" onClick={listForBuyers}>
              List for buyers
            </button>
            <button className="secondary" type="button" onClick={donateToNgo}>
              Donate to NGO
            </button>
            <button className="text-btn" type="button" onClick={() => setActionItem(null)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}

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

function BuyerList({ listings }) {
  return (
    <section className="inventory">
      <h2>Discounted food nearby</h2>
      <p className="lede">Pickup and pay in person. Reservations come next.</p>
      {listings.length === 0 ? (
        <p className="note">Nothing listed yet. Switch to Restaurant and list an item.</p>
      ) : (
        <ul className="item-list">
          {listings.map((listing) => (
            <li key={listing.id} className="item-card">
              <div className="item-top">
                <div>
                  <strong>{listing.name}</strong>
                  <span>
                    {listing.quantity} {listing.unit} · {listing.pickup}
                  </span>
                  <span>
                    ₹{listing.discountedPrice}{' '}
                    <s>₹{listing.originalPrice}</s> · {listing.discountPercent}% off
                  </span>
                </div>
                <span className="tag tag-soon">{listing.payNote}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function NgoList({ donations }) {
  return (
    <section className="inventory">
      <h2>Donations for pickup</h2>
      <p className="lede">These batches are for animal feed, not human consumption.</p>
      {donations.length === 0 ? (
        <p className="note">No donations yet. Switch to Restaurant and donate cooked food.</p>
      ) : (
        <ul className="item-list">
          {donations.map((donation) => (
            <li key={donation.id} className="item-card">
              <div className="item-top">
                <div>
                  <strong>{donation.name}</strong>
                  <span>
                    {donation.quantity} {donation.unit} · ready {donation.readyBy}
                  </span>
                </div>
                <span className="tag tag-soon">{donation.intendedUse}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
