'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [total, setTotal] = useState('3000');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ total }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/order/${data.order_id}`);
      } else {
        alert('Error creating order: ' + data.message);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating order');
      setLoading(false);
    }
  };

  return (
    <div className="container my-5 px-2">
      <div className="row">
        <div className="col-md-8 mx-auto">
          <h1>Đặt hàng</h1>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="amountInput" className="form-label">
                Số tiền
              </label>
              <input
                type="number"
                name="total"
                className="form-control"
                id="amountInput"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                required
                min="1"
              />
              <div id="amountInputHelp" className="form-text">
                Điền số tiền
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Đặt hàng'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

