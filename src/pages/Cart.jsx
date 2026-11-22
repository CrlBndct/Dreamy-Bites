
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';
import { useOrders } from '../OrdersContext';
import { useAuth } from '../AuthContext';
import { useBranches } from '../BranchesContext';
import '../styles/foodpage.css';
import '../styles/cart.css';

const DELIVERY_FEE = 50;
const FREE_DELIVERY_OVER = 500;

const TYPES = [
  { id: 'Pickup', label: 'Pickup', desc: 'Collect it at a branch' },
  { id: 'Delivery', label: 'Delivery', desc: 'We bring it to you' },
  { id: 'Dine-in', label: 'Dine-in', desc: 'Eat at a branch' },
];

function nowLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function Cart() {
  const navigate = useNavigate();

  const { cart, updateQty, removeItem, clearCart, totalPrice } = useCart();
  const { createOrder } = useOrders();
  const { user } = useAuth();
  const { branches } = useBranches();

  const openBranches = branches.filter((b) => b.available !== false);

  const [type, setType] = useState('Pickup');
  const [branchId, setBranchId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [timing, setTiming] = useState('ASAP');
  const [when, setWhen] = useState('');
  const [payment, setPayment] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isDelivery = type === 'Delivery';

  const fee =
    isDelivery && totalPrice < FREE_DELIVERY_OVER
      ? DELIVERY_FEE
      : 0;

  const grandTotal = totalPrice + fee;

  const cashLabel = isDelivery
    ? 'Cash on delivery'
    : 'Pay at the counter';

  const handleCheckout = async (e) => {
    e.preventDefault();

    if (!user || cart.length === 0 || submitting) return;

    setError('');

    if (!name.trim() || !phone.trim()) {
      setError('Please enter your name and phone number.');
      return;
    }

    if (isDelivery && !address.trim()) {
      setError('Please enter your delivery address.');
      return;
    }

    if (!isDelivery && !branchId) {
      setError('Please choose a branch.');
      return;
    }

    if (timing === 'Later' && !when) {
      setError('Please choose the date and time.');
      return;
    }

    const branch = branches.find(
      (b) => String(b.id) === branchId
    );

    try {
      setSubmitting(true);

      await createOrder({
        name: name.trim(),
        phone: phone.trim(),
        type,
        branchName: isDelivery ? '' : branch?.name || '',
        address: isDelivery ? address.trim() : '',
        when:
          timing === 'Later'
            ? new Date(when).toLocaleString()
            : 'As soon as possible',
        payment: payment === 'Cash' ? cashLabel : 'GCash',
        notes: notes.trim(),

        items: cart.map((i) => ({
          foodId: i.foodId,
          quantity: i.quantity,
        })),
      });

      clearCart();

      alert('Thank you for your order! 🍰');
      navigate('/homepage');
    } catch (err) {
      setError(err.message || 'Failed to place your order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="nav">
        <h1 style={{ color: '#80665C' }}>Dreamy Bites</h1>
        <Link to="/homepage" className="backHomeBtn">
          Home
        </Link>
      </div>

      <div className="cart-page">
        <h1>My Basket</h1>

        {cart.length === 0 ? (
          <>
            <p>Your basket is empty.</p>
            <Link to="/homepage" className="cart-link">
              Browse the menu
            </Link>
          </>
        ) : (
          <>
            {cart.map((i) => (
              <div className="cart-item" key={i.foodId}>
                <img src={i.pic} alt={i.foodName} />

                <div className="cart-info">
                  <h2>{i.foodName}</h2>
                  <p>Php {i.price} each</p>
                </div>

                <div className="cart-qty">
                  <button
                    onClick={() =>
                      updateQty(i.foodId, i.quantity - 1)
                    }
                  >
                    -
                  </button>

                  <span>{i.quantity}</span>

                  <button
                    onClick={() =>
                      updateQty(i.foodId, i.quantity + 1)
                    }
                  >
                    +
                  </button>
                </div>

                <h3>Php {i.price * i.quantity}</h3>

                <button
                  className="remove"
                  onClick={() => removeItem(i.foodId)}
                >
                  ✕
                </button>
              </div>
            ))}

            <form className="checkout-form" onSubmit={handleCheckout}>
              <h2>How would you like your order?</h2>

              <div className="type-options">
                {TYPES.map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    className={
                      type === t.id
                        ? 'type-card active'
                        : 'type-card'
                    }
                    onClick={() => {
                      setType(t.id);
                      setError('');
                    }}
                  >
                    <strong>{t.label}</strong>
                    <span>{t.desc}</span>
                  </button>
                ))}
              </div>

              <div className="field-row">
                <input
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <input
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {isDelivery ? (
                <textarea
                  placeholder="Delivery address (street, barangay, city, landmarks)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                />
              ) : (
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                >
                  <option value="">Choose a branch...</option>

                  {openBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.open} - {b.close})
                    </option>
                  ))}
                </select>
              )}

              <div className="choice-row">
                <label>
                  <input
                    type="radio"
                    checked={timing === 'ASAP'}
                    onChange={() => setTiming('ASAP')}
                  />
                  As soon as possible
                </label>

                <label>
                  <input
                    type="radio"
                    checked={timing === 'Later'}
                    onChange={() => setTiming('Later')}
                  />
                  Schedule for later
                </label>
              </div>

              {timing === 'Later' && (
                <input
                  type="datetime-local"
                  min={nowLocal()}
                  value={when}
                  onChange={(e) => setWhen(e.target.value)}
                />
              )}

              <div className="choice-row">
                <label>
                  <input
                    type="radio"
                    checked={payment === 'Cash'}
                    onChange={() => setPayment('Cash')}
                  />
                  {cashLabel}
                </label>

                <label>
                  <input
                    type="radio"
                    checked={payment === 'GCash'}
                    onChange={() => setPayment('GCash')}
                  />
                  GCash
                </label>
              </div>

              <textarea
                placeholder="Notes (e.g. message on the cake, no sugar)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />

              <div className="summary">
                <p>
                  <span>Subtotal</span>
                  <span>Php {totalPrice}</span>
                </p>

                {isDelivery && (
                  <p>
                    <span>Delivery fee</span>
                    <span>
                      {fee === 0 ? 'Free' : `Php ${fee}`}
                    </span>
                  </p>
                )}

                {isDelivery && fee > 0 && (
                  <p className="hint">
                    Free delivery on orders of Php {FREE_DELIVERY_OVER} or more.
                  </p>
                )}

                <h2 className="cart-total">
                  Total: Php {grandTotal}
                </h2>
              </div>

              {error && <p className="form-error">{error}</p>}

              <button
                type="submit"
                className="checkout"
                disabled={submitting}
              >
                {submitting ? 'Placing order...' : 'Place order'}
              </button>
            </form>
          </>
        )}
      </div>
    </>
  );
}
