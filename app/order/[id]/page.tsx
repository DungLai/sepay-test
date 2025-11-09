'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Order {
  id: number;
  total: number;
  name: string;
  payment_status: string;
}

export default function OrderPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentStatus, setPaymentStatus] = useState('Unpaid');
  const [loading, setLoading] = useState(true);

  // SePay configuration - from environment variables
  // These values are used in the QR code and payment instructions
  // Make sure to set them in .env.local or Vercel environment variables
  const bankCode = process.env.NEXT_PUBLIC_SEPAY_BANK_CODE || 'MBBank';
  const accountNumber = process.env.NEXT_PUBLIC_SEPAY_ACCOUNT_NUMBER || '0903252427';
  const accountName = process.env.NEXT_PUBLIC_SEPAY_ACCOUNT_NAME || 'Bùi Tấn Việt';

  useEffect(() => {
    // Fetch order details
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        const data = await response.json();

        if (data.success && data.order) {
          setOrder(data.order);
          setPaymentStatus(data.order.payment_status);
          setLoading(false);
        } else {
          alert('Không tìm thấy đơn hàng');
          router.push('/');
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, router]);

  useEffect(() => {
    // Poll payment status every second
    if (paymentStatus === 'Unpaid') {
      const interval = setInterval(() => {
        checkPaymentStatus();
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [paymentStatus, orderId]);

  const checkPaymentStatus = async () => {
    try {
      const response = await fetch('/api/check-payment-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order_id: orderId }),
      });

      const data = await response.json();

      if (data.payment_status === 'order_not_found') {
        alert('Không tìm thấy đơn hàng');
        router.push('/');
        return;
      }

      setPaymentStatus(data.payment_status);
      setLoading(false);
    } catch (error) {
      console.error('Error checking payment status:', error);
      setLoading(false);
    }
  };

  if (loading && !order) {
    return (
      <div className="container my-5 px-2">
        <div className="col-md-8 mx-auto text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container my-5 px-2">
        <div className="col-md-8 mx-auto">
          <p>Không tìm thấy đơn hàng</p>
          <Link href="/">Quay lại</Link>
        </div>
      </div>
    );
  }

  const orderTotal = typeof order.total === 'string' ? parseFloat(order.total) : order.total;
  const formattedAmount = new Intl.NumberFormat('vi-VN').format(orderTotal);
  
  // Generate QR code URL with account details from environment variables
  // Ensure all parameters are properly encoded
  const orderDescription = `DH${order.id}`;
  const qrCodeUrl = `https://qr.sepay.vn/img?bank=${encodeURIComponent(bankCode)}&acc=${encodeURIComponent(accountNumber)}&template=compact&amount=${Math.round(orderTotal)}&des=${encodeURIComponent(orderDescription)}`;

  return (
    <div className="container my-5 px-2">
      <div className="row">
        <div className="col-md-8">
          <h1>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              fill="currentColor"
              className="bi bi-check-circle text-success"
              viewBox="0 0 16 16"
            >
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
              <path d="m10.97 4.97-.02.022-3.473 4.425-2.093-2.094a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05" />
            </svg>{' '}
            Đặt hàng thành công
          </h1>
          <span className="text-muted">Mã đơn hàng #DH{order.id}</span>

          <div
            id="success_pay_box"
            className="p-2 text-center pt-3 border border-2 mt-5"
            style={{ display: paymentStatus === 'Paid' ? 'block' : 'none' }}
          >
              <h2 className="text-success">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  fill="currentColor"
                  className="bi bi-check-circle text-success"
                  viewBox="0 0 16 16"
                >
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                  <path d="m10.97 4.97-.02.022-3.473 4.425-2.093-2.094a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05" />
                </svg>{' '}
                Thanh toán thành công
              </h2>
              <p className="text-center text-success">
                Chúng tôi đã nhận được thanh toán, đơn hàng sẽ được chuyển đến
                quý khách trong thời gian sớm nhất!
              </p>
            </div>

          <div 
            className="row mt-5 px-2" 
            id="checkout_box"
            style={{ display: paymentStatus === 'Unpaid' ? 'block' : 'none' }}
          >
              <div className="col-12 text-center my-2 border">
                <p className="mt-2">
                  Hướng dẫn thanh toán qua chuyển khoản ngân hàng
                </p>
              </div>
              <div className="col-md-6 border text-center p-2">
                <p className="fw-bold">Cách 1: Mở app ngân hàng và quét mã QR</p>
                <div className="my-2">
                  <img src={qrCodeUrl} className="img-fluid" alt="QR Code" />
                  <span>
                    Trạng thái: Chờ thanh toán...{' '}
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden"></span>
                    </div>
                  </span>
                </div>
              </div>
              <div className="col-md-6 border p-2">
                <p className="fw-bold">
                  Cách 2: Chuyển khoản thủ công theo thông tin
                </p>
                <div className="text-center">
                  <img
                    src={`https://qr.sepay.vn/assets/img/banklogo/${encodeURIComponent(bankCode)}.png`}
                    className="img-fluid"
                    style={{ maxHeight: '50px' }}
                    alt="Bank Logo"
                  />
                  <p className="fw-bold">Ngân hàng {bankCode}</p>
                </div>

                <table className="table">
                  <tbody>
                    <tr>
                      <td>Chủ tài khoản:</td>
                      <td>
                        <b>{accountName}</b>
                      </td>
                    </tr>
                    <tr>
                      <td>Số TK:</td>
                      <td>
                        <b>{accountNumber}</b>
                      </td>
                    </tr>
                    <tr>
                      <td>Số tiền:</td>
                      <td>
                        <b>{formattedAmount}đ</b>
                      </td>
                    </tr>
                    <tr>
                      <td>Nội dung CK:</td>
                      <td>
                        <b>DH{order.id}</b>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p className="bg-light p-2">
                  Lưu ý: Vui lòng giữ nguyên nội dung chuyển khoản DH{order.id} để
                  hệ thống tự động xác nhận thanh toán
                </p>
              </div>
            </div>
        </div>
        <div className="col-md-4 bg-light border-top">
          <p className="fw-bold">Thông tin đơn hàng</p>
          <table className="table">
            <tbody>
              <tr>
                <td>
                  <span className="fw-bold">{order.name}</span>
                </td>
                <td className="text-end fw-bold">{formattedAmount}đ</td>
              </tr>
              <tr>
                <td>Thuế</td>
                <td className="text-end">-</td>
              </tr>
              <tr>
                <td>
                  <span className="fw-bold">Tổng</span>
                </td>
                <td className="text-end fw-bold">{formattedAmount}đ</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <p className="mt-5">
          <Link href="/" className="text-decoration-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              className="bi bi-chevron-left"
              viewBox="0 0 16 16"
            >
              <path
                fillRule="evenodd"
                d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"
              />
            </svg>{' '}
            Quay lại
          </Link>
        </p>
      </div>
    </div>
  );
}

