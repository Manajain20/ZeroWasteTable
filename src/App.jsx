import { useState } from 'react'

const roles = [
  {
    id: 'restaurant',
    title: 'Restaurant',
    icon: '🍽️',
    text: 'Track stock, sell leftover food cheap, or donate cooked food.',
  },
  {
    id: 'buyer',
    title: 'Buyer',
    icon: '🛍️',
    text: 'Find discounted food nearby, reserve it, and pick it up in person.',
  },
  {
    id: 'ngo',
    title: 'NGO',
    icon: '🐾',
    text: 'Claim donated cooked food and arrange a pickup.',
  },
]

function dateFromToday(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

const startingItems = [
  { id: '1', name: 'Baby spinach', quantity: 7, unit: 'kg', expiry: dateFromToday(1), status: 'in-stock', lastOrder: 12, avgWastePct: 0.25 },
  { id: '2', name: 'Roma tomatoes', quantity: 18, unit: 'kg', expiry: dateFromToday(4), status: 'in-stock', lastOrder: 100, avgWastePct: 0.2 },
  { id: '3', name: 'Brioche buns', quantity: 14, unit: 'pcs', expiry: dateFromToday(2), status: 'in-stock', lastOrder: 24, avgWastePct: 0.18 },
  { id: '4', name: 'Cooked herb chicken', quantity: 9, unit: 'portions', expiry: dateFromToday(0), status: 'in-stock', lastOrder: 18, avgWastePct: 0.34 },
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

function suggestedOrder(item) {
  if (!item.lastOrder || !item.avgWastePct) return null
  return Math.max(0, Math.round(item.lastOrder * (1 - item.avgWastePct + 0.05)))
}

function closeCycle(item) {
  const lastOrder = item.lastOrder || item.quantity
  const thisWaste = lastOrder ? item.quantity / lastOrder : 0
  const avgWastePct = item.avgWastePct ? (item.avgWastePct + thisWaste) / 2 : thisWaste
  return { ...item, avgWastePct, suggestionDecision: undefined }
}

export default function App() {
  const [role, setRole] = useState(null)
  const [items, setItems] = useState(startingItems)
  const [listings, setListings] = useState([])
  const [donations, setDonations] = useState([])

  if (!role) {
    return (
      <main className="page welcome">
        <div className="brand-row">
          <span className="logo" aria-hidden="true">
            🥗
          </span>
          <p className="eyebrow">ZeroWasteTable</p>
        </div>
        <h1>
          Keep leftover food <em>on the table</em>, not in the bin.
        </h1>
        <p className="lede">
          Restaurants rescue surplus. Neighbours grab a discount. NGOs collect cooked
          batches for animal feed. Pick a seat at the table.
        </p>
        <ul className="highlights">
          <li>
            <strong>Sell</strong>
            surplus cheap
          </li>
          <li>
            <strong>Donate</strong>
            cooked batches
          </li>
          <li>
            <strong>Order</strong>
            less next week
          </li>
        </ul>
        <div className="role-list">
          {roles.map((item) => (
            <button
              key={item.id}
              className={`role-card role-${item.id}`}
              type="button"
              onClick={() => setRole(item.id)}
            >
              <span className="role-icon" aria-hidden="true">
                {item.icon}
              </span>
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
    <main className={`page dash dash-${role}`}>
      <header className="topbar">
        <div className="brand-row">
          <span className="logo" aria-hidden="true">
            🥗
          </span>
          <p className="eyebrow">ZeroWasteTable</p>
        </div>
        <button className="ghost" type="button" onClick={() => setRole(null)}>
          Change role
        </button>
      </header>

      <p className="chip">{current.icon} {current.title}</p>
      <h1>{current.title === 'Restaurant' ? 'What’s in the kitchen today?' : current.title === 'Buyer' ? 'Good food, better price.' : 'Food that still has a job.'}</h1>
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

      {role === 'buyer' ? <BuyerList listings={listings} setListings={setListings} /> : null}

      {role === 'ngo' ? <NgoList donations={donations} setDonations={setDonations} /> : null}
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
  const [shareQty, setShareQty] = useState('')
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
        lastOrder: quantity,
        avgWastePct: 0,
      },
      ...items,
    ])
    setForm({ name: '', quantity: '', unit: 'kg', expiry: '' })
  }

  function markItem(id, status) {
    setItems(
      items.map((item) => {
        if (item.id !== id) return item
        if (status === 'listed' || status === 'donated') {
          return { ...closeCycle(item), status }
        }
        return { ...item, status }
      }),
    )
  }

  function shareAmount() {
    if (!actionItem) return 0
    const amount = Number(shareQty)
    if (!amount || amount <= 0) return 0
    return Math.min(amount, actionItem.quantity)
  }

  function takeFromKitchen(amount) {
    const sendingAll = amount >= actionItem.quantity
    setItems(
      items.map((item) => {
        if (item.id !== actionItem.id) return item
        if (sendingAll) return item
        return {
          ...item,
          quantity: Number((item.quantity - amount).toFixed(2)),
          status: 'in-stock',
        }
      }),
    )
    return sendingAll
  }

  function listForBuyers() {
    if (!actionItem) return
    const amount = shareAmount()
    const originalPrice = Number(price)
    const discountPercent = Math.min(80, Math.max(5, Number(discount) || 30))
    if (!amount || !originalPrice) return

    setListings([
      {
        id: String(Date.now()),
        name: actionItem.name,
        quantity: amount,
        unit: actionItem.unit,
        originalPrice,
        discountPercent,
        discountedPrice: Math.round(originalPrice * (1 - discountPercent / 100)),
        pickup: 'Today · 6:00–8:00 PM',
        payNote: 'Pay in person at pickup',
        status: 'available',
      },
      ...listings,
    ])
    const sendingAll = takeFromKitchen(amount)
    if (sendingAll) markItem(actionItem.id, 'listed')
    setActionItem(null)
  }

  function donateToNgo() {
    if (!actionItem) return
    const amount = shareAmount()
    if (!amount) return

    setDonations([
      {
        id: String(Date.now()),
        name: actionItem.name,
        quantity: amount,
        unit: actionItem.unit,
        readyBy: 'Today · 8:00 PM',
        intendedUse: 'Animal feed only',
        status: 'available',
      },
      ...donations,
    ])
    const sendingAll = takeFromKitchen(amount)
    if (sendingAll) markItem(actionItem.id, 'donated')
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
            <li key={item.id} className={`item-card tone-${status.tone}`}>
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
                <button
                  className="text-btn"
                  type="button"
                  onClick={() => {
                    setActionItem(item)
                    setShareQty(String(item.quantity))
                  }}
                >
                  Sell or donate
                </button>
              ) : null}
            </li>
          )
        })}
      </ul>

      <OrderSuggestions items={items} setItems={setItems} />

      {actionItem ? (
        <div className="add-form">
          <h2>What should happen to {actionItem.name}?</h2>
          <p className="lede">
            Choose how much to share. Whatever you leave stays for the kitchen.
          </p>
          <label>
            Amount to sell or donate
            <input
              type="number"
              min="0.1"
              step="0.1"
              max={actionItem.quantity}
              value={shareQty}
              onChange={(event) => setShareQty(event.target.value)}
            />
          </label>
          <p className="lede">
            You keep{' '}
            {Number((actionItem.quantity - shareAmount()).toFixed(2))} {actionItem.unit}{' '}
            for your own use.
          </p>
          <div className="form-row">
            <label>
              Price for this amount (₹)
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

function OrderSuggestions({ items, setItems }) {
  const pending = items.filter((item) => suggestedOrder(item) !== null && !item.suggestionDecision)

  function decide(id, decision, ownAmount) {
    setItems(
      items.map((item) =>
        item.id === id
          ? { ...item, suggestionDecision: decision, ownOrder: ownAmount }
          : item,
      ),
    )
  }

  return (
    <div className="suggestions">
      <h2 className="section-gap">Next order suggestions</h2>
      <p className="lede">
        Based on what you usually waste, plus a small safety buffer. The app never places
        an order for you.
      </p>
      {pending.length === 0 ? (
        <p className="empty">No pending suggestions. Log a few cycles and they will show up here.</p>
      ) : (
        <ul className="item-list">
          {pending.map((item) => (
            <SuggestionCard key={item.id} item={item} onDecide={decide} />
          ))}
        </ul>
      )}
    </div>
  )
}

function SuggestionCard({ item, onDecide }) {
  const amount = suggestedOrder(item)
  const [own, setOwn] = useState(String(amount))
  const wastePct = Math.round(item.avgWastePct * 100)
  const change = Math.round((1 - amount / item.lastOrder) * 100)

  return (
    <li className="item-card insight">
      <div className="item-top">
        <div>
          <strong>{item.name}</strong>
          <span>
            Last order {item.lastOrder} {item.unit} · about {wastePct}% wasted
          </span>
          <span>
            Suggested next order: {amount} {item.unit} ({change >= 0 ? '↓' : '↑'}
            {Math.abs(change)}% vs last, with 5% buffer)
          </span>
        </div>
      </div>
      <div className="form-row">
        <label>
          Or type your own amount
          <input value={own} onChange={(event) => setOwn(event.target.value)} type="number" min="0" />
        </label>
      </div>
      <div className="action-row">
        <button className="back" type="button" onClick={() => onDecide(item.id, 'accepted')}>
          Use {amount} {item.unit}
        </button>
        <button
          className="secondary"
          type="button"
          onClick={() => onDecide(item.id, 'overridden', Number(own) || amount)}
        >
          Use my amount
        </button>
        <button className="text-btn" type="button" onClick={() => onDecide(item.id, 'ignored')}>
          Ignore
        </button>
      </div>
    </li>
  )
}

function BuyerList({ listings, setListings }) {
  const open = listings.filter((listing) => listing.status === 'available')
  const reserved = listings.filter((listing) => listing.status === 'reserved')

  function reserve(id) {
    setListings(
      listings.map((listing) =>
        listing.id === id ? { ...listing, status: 'reserved' } : listing,
      ),
    )
  }

  return (
    <section className="inventory">
      <h2>Discounted food nearby</h2>
      <p className="lede">Reserve it here, then pick up and pay in person.</p>
      {open.length === 0 ? (
        <p className="empty">Nothing listed yet. Switch to Restaurant and list an item.</p>
      ) : (
        <ul className="item-list">
          {open.map((listing) => (
            <li key={listing.id} className="item-card listing-card">
              <div className="item-top">
                <div>
                  <strong>{listing.name}</strong>
                  <span>
                    {listing.quantity} {listing.unit} · {listing.pickup}
                  </span>
                  <span className="price">
                    ₹{listing.discountedPrice}{' '}
                    <s>₹{listing.originalPrice}</s>
                    <span className="tag tag-soon">{listing.discountPercent}% off</span>
                  </span>
                </div>
                <span className="tag tag-ok">{listing.payNote}</span>
              </div>
              <button className="back" type="button" onClick={() => reserve(listing.id)}>
                Reserve
              </button>
            </li>
          ))}
        </ul>
      )}

      <h2 className="section-gap">My pickups</h2>
      <p className="lede">Food you reserved. Pay when you collect it.</p>
      {reserved.length === 0 ? (
        <p className="empty">No pickups yet. Reserve a listing above.</p>
      ) : (
        <ul className="item-list">
          {reserved.map((listing) => (
            <li key={listing.id} className="item-card">
              <div className="item-top">
                <div>
                  <strong>{listing.name}</strong>
                  <span>
                    {listing.quantity} {listing.unit} · {listing.pickup}
                  </span>
                </div>
                <span className="tag tag-ok">Reserved</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function NgoList({ donations, setDonations }) {
  const open = donations.filter((donation) => donation.status === 'available')
  const claimed = donations.filter((donation) => donation.status === 'claimed')

  function claim(id) {
    setDonations(
      donations.map((donation) =>
        donation.id === id ? { ...donation, status: 'claimed' } : donation,
      ),
    )
  }

  return (
    <section className="inventory">
      <h2>Donations for pickup</h2>
      <p className="lede">These batches are for animal feed, not human consumption.</p>
      {open.length === 0 ? (
        <p className="empty">No donations yet. Switch to Restaurant and donate cooked food.</p>
      ) : (
        <ul className="item-list">
          {open.map((donation) => (
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
              <button className="back" type="button" onClick={() => claim(donation.id)}>
                Claim pickup
              </button>
            </li>
          ))}
        </ul>
      )}

      <h2 className="section-gap">My pickups</h2>
      <p className="lede">Batches you claimed. Collect them in the ready window.</p>
      {claimed.length === 0 ? (
        <p className="empty">No pickups yet. Claim a donation above.</p>
      ) : (
        <ul className="item-list">
          {claimed.map((donation) => (
            <li key={donation.id} className="item-card">
              <div className="item-top">
                <div>
                  <strong>{donation.name}</strong>
                  <span>
                    {donation.quantity} {donation.unit} · {donation.readyBy}
                  </span>
                </div>
                <span className="tag tag-ok">Claimed</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
