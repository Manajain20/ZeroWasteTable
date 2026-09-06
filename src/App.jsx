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

export default function App() {
  const [role, setRole] = useState(null)

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
      <p className="note">This screen will fill in next. For now you can change role.</p>
      <button className="back" type="button" onClick={() => setRole(null)}>
        Change role
      </button>
    </main>
  )
}
