'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function CustomerCertifyPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [satisfaction, setSatisfaction] = useState('Very satisfied');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [qualityPassed, setQualityPassed] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      const { data, error } = await supabase
        .from('work_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) {
        alert(error.message);
      } else {
        setOrder(data);
      }

      setLoading(false);
    }

    if (orderId) loadOrder();
  }, [orderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase
      .from('work_orders')
      .update({
        customer_satisfaction: satisfaction,
        customer_rating: rating,
        customer_comment: comment,
        quality_passed: qualityPassed,
        customer_certified_at: new Date().toISOString(),
        closure_status: 'closed',
      })
      .eq('id', orderId);

    if (error) {
      alert(`Submit failed: ${error.message}`);
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  const downloadInvoice = () => {
    const invoiceText = `
KAKLINX BAY - CUSTOMER INVOICE

Order ID: ${order.id}
Plate Number: ${order.plate}
Vehicle Type: ${order.vehicle_type}
Services: ${(order.services || []).join(', ')}
Amount: GH₵ ${Number(order.total_amount || 0).toFixed(2)}

Customer Rating: ${rating}/5
Satisfaction: ${satisfaction}
Comment: ${comment || 'No comment'}

Status: CLOSED
Certified At: ${new Date().toLocaleString()}
`;

    const blob = new Blob([invoiceText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${order.id}.txt`;
    a.click();

    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!order) {
    return <div className="min-h-screen flex items-center justify-center">Work order not found.</div>;
  }

  if (submitted || order.closure_status === 'closed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-2xl shadow p-6 max-w-md text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 text-2xl">
            ✓
          </div>

          <h1 className="text-xl font-bold text-slate-800">Thank you</h1>

          <p className="text-sm text-slate-500 mt-2">
            This work order has been certified and closed successfully.
          </p>

          <button
            onClick={downloadInvoice}
            className="mt-5 w-full rounded-lg bg-blue-600 text-white py-3 text-sm font-semibold"
          >
            Download Invoice
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="p-5 border-b">
          <h1 className="text-xl font-bold text-slate-800">Customer Job Certification</h1>
          <p className="text-sm text-slate-500 mt-1">
            Please confirm that your vehicle service has been completed.
          </p>
        </div>

        <div className="p-5 bg-slate-50 border-b text-sm">
          <p><strong>Order ID:</strong> {order.id}</p>
          <p><strong>Vehicle:</strong> {order.vehicle_type}</p>
          <p><strong>Plate:</strong> {order.plate}</p>
          <p><strong>Services:</strong> {(order.services || []).join(', ')}</p>
          <p><strong>Amount:</strong> GH₵ {Number(order.total_amount || 0).toFixed(2)}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Was the job completed properly?
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setQualityPassed(true)}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  qualityPassed ? 'bg-emerald-100 border-emerald-500 text-emerald-800' : 'bg-white'
                }`}
              >
                Yes
              </button>

              <button
                type="button"
                onClick={() => setQualityPassed(false)}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  !qualityPassed ? 'bg-red-100 border-red-500 text-red-800' : 'bg-white'
                }`}
              >
                No / Needs attention
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Satisfaction</label>
            <select
              value={satisfaction}
              onChange={(e) => setSatisfaction(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option>Very satisfied</option>
              <option>Satisfied</option>
              <option>Neutral</option>
              <option>Not satisfied</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`w-10 h-10 rounded-lg border text-lg ${
                    rating >= star ? 'bg-amber-100 border-amber-500 text-amber-600' : 'bg-white'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Comment optional</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="You may add a short comment..."
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 text-white py-3 text-sm font-semibold disabled:bg-slate-400"
          >
            {submitting ? 'Submitting...' : 'Certify and Close Work Order'}
          </button>
        </form>
      </div>
    </div>
  );
}
