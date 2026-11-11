import React, { useEffect, useRef, useState } from 'react';

const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export default function IfscInput({ value, onChange }) {
  const [lookupStatus, setLookupStatus] = useState('');
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const ifscCode = (value || '').trim().toUpperCase();
    if (!IFSC_PATTERN.test(ifscCode)) {
      return undefined;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      setLookupStatus('Looking up bank and branch...');
      try {
        const response = await fetch(`https://ifsc.razorpay.com/${encodeURIComponent(ifscCode)}`);
        if (!response.ok) {
          throw new Error('IFSC code was not found.');
        }
        const bankDetails = await response.json();
        if (!bankDetails.BANK || !bankDetails.BRANCH) {
          throw new Error('The IFSC lookup did not return bank and branch details.');
        }
        if (active) {
          onChangeRef.current('ifscCode', ifscCode);
          onChangeRef.current('bankName', `${bankDetails.BANK}, ${bankDetails.BRANCH}`);
          setLookupStatus('Bank and branch filled from IFSC.');
        }
      } catch (error) {
        if (active) {
          setLookupStatus(error.message || 'Could not look up this IFSC code.');
        }
      }
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [value]);

  return (
    <div>
      <label className="block font-bold text-slate-700 mb-1">IFSC Code</label>
      <input
        type="text"
        value={value || ''}
        onChange={(event) => {
          setLookupStatus('');
          onChange('ifscCode', event.target.value.toUpperCase());
          onChange('bankName', '');
        }}
        maxLength={11}
        placeholder="e.g. SBIN0001234"
        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono uppercase"
      />
      {lookupStatus && (
        <p className={`mt-1 text-[10px] ${lookupStatus.includes('filled') ? 'text-emerald-700' : lookupStatus.includes('Looking') ? 'text-slate-500' : 'text-rose-600'}`}>
          {lookupStatus}
        </p>
      )}
    </div>
  );
}
