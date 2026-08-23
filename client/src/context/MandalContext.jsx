import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const MandalContext = createContext();

export function MandalProvider({ children }) {
  const [mandal, setMandal] = useState({
    name_mr: 'युवा स्पोर्ट्स गणेशोत्सव मंडळ, दत्तवाड',
    name_en: 'Yuva Sports Ganeshostav Mandal, Dattawad',
    tagline_mr: 'स्थापना: १९८८ | नोंदणी क्र. -',
    address_mr: 'युवा स्पोर्ट्स चौक, दत्तवाड | ४१६१०७ , महाराष्ट्र |',
    contact_phone: '+91 9699049637',
    contact_email: 'sarveshkharoshe8@gmail.com',
    registration_no: '-',
    festival_year: 2026,
    arrival_date: '2026-09-14T09:00:00',
    visarjan_date: '2026-09-23T18:00:00',
    upi_id: 'sarveshkharoshe8-2@okaxis',
    upi_name: 'Sarvesh Kharoshe',
    receipt_prefix: 'YUVA-2026-',
    receipt_language: 'mr',
    currency_symbol: '₹',
    logo_url: 'D:\\yuva_sports\\client\\images\\51516212-976b-48e0-8f7d-e1f7108672e5.png'
  });

  const [isLoading, setIsLoading] = useState(false);

  const fetchMandalSettings = async () => {
    try {
      setIsLoading(true);
      // Try authenticated settings, fallback to public info
      let res;
      try {
        res = await api.get('/settings');
      } catch {
        res = await api.get('/public/donation-info');
      }

      if (res.success && (res.data || res.data?.mandal)) {
        const settingsData = res.data?.mandal || res.data;
        setMandal(settingsData);
      }
    } catch (err) {
      console.warn('Could not fetch latest mandal settings, using defaults:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMandalSettings();
  }, []);

  return (
    <MandalContext.Provider value={{ mandal, setMandal, refreshMandal: fetchMandalSettings, isLoading }}>
      {children}
    </MandalContext.Provider>
  );
}

export function useMandal() {
  const context = useContext(MandalContext);
  if (!context) {
    throw new Error('useMandal must be used within a MandalProvider');
  }
  return context;
}
