'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { StarIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';

export default function CustomerCertificationsManager() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReviews();

    const channel = supabase
      .channel('customer-certifications-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'work_orders' },
        () => loadReviews()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadReviews() {
    setLoading(true);

    const { data, error } = await supabase
      .from('work_orders')
      .select('*')
      .not('customer_certified_at', 'is', null)
      .order('customer_certified_at', { ascending: false });

    if (!error) setReviews(data || []);

    setLoading(false);
  }

  const filtered = useMemo(() => {
    return reviews.filter((review) => {
      const query = search.toLowerCase();

      return (
        review.plate?.toLowerCase().includes(query) ||
        review.vehicle_type?.toLowerCase().includes(query) ||
        review.customer_comment?.toLowerCase().includes(query) ||
        review.customer_satisfaction?.toLowerCase().includes(query)
      );
    });
  }, [reviews, search]);

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + Number(r.customer_rating || 0), 0) /
        reviews.length
      : 0;

  const passedCount = reviews.filter((r) => r.quality_passed).length;
  const failedCount = reviews.filter((r) => r.quality_passed === false).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border p-4">
          <p className="text-xs text-slate-500">Total Reviews</p>
          <p className="text-2xl font-extrabold text-blue-700">{reviews.length}</p>
        </div>

        <div className="bg-white rounded-2xl border p-4">
          <p className="text-xs text-slate-500">Average Rating</p>
          <p className="text-2xl font-extrabold text-amber-600">
            {averageRating.toFixed(1)} / 5
          </p>
        </div>

        <div className="bg-white rounded-2xl border p-4">
          <p className="text-xs text-slate-500">Quality Passed</p>
          <p className="text-2xl font-extrabold text-green-700">{passedCount}</p>
        </div>

        <div className="bg-white rounded-2xl border p-4">
          <p className="text-xs text-slate-500">Needs Attention</p>
          <p className="text-2xl font-extrabold text-red-700">{failedCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Customer Certifications & Reviews
            </h2>
            <p className="text-sm text-slate-500">
              Monitor completed customer certifications, ratings, and service feedback.
            </p>
          </div>

          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reviews..."
              className="pl-9 pr-3 py-2 rounded-xl border text-sm w-full md:w-64"
            />
          </div>
        </div>

        <div className="mt-5">
          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Loading reviews...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No customer certifications yet.
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-4">
              {filtered.map((review) => (
                <div
                  key={review.id}
                  className="border rounded-2xl p-5 bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {review.plate || 'No Plate'} — {review.vehicle_type}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Certified:{' '}
                        {review.customer_certified_at
                          ? new Date(review.customer_certified_at).toLocaleString()
                          : 'N/A'}
                      </p>
                    </div>

                    <span
                      className={`text-xs font-bold border px-3 py-1 rounded-full ${
                        review.quality_passed
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {review.quality_passed ? 'Passed' : 'Needs Attention'}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon
                        key={star}
                        className={`w-5 h-5 ${
                          Number(review.customer_rating || 0) >= star
                            ? 'text-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm font-bold text-slate-700">
                      {review.customer_rating || 0}/5
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-700">
                    <strong>Satisfaction:</strong>{' '}
                    {review.customer_satisfaction || 'N/A'}
                  </p>

                  <p className="mt-2 text-sm text-slate-600">
                    {review.customer_comment || 'No customer comment.'}
                  </p>

                  <div className="mt-4 text-xs text-slate-500">
                    Services:{' '}
                    {(review.services || []).length > 0
                      ? review.services.join(', ')
                      : 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
      }
