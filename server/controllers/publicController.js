import { db } from '../database/db.js';
import { throwIfError } from '../utils/dbHelpers.js';

export async function getPublicDonationInfo(req, res) {
  try {
    const { data: mandal, error } = await db.from('mandal_settings').select('name_mr, name_en, tagline_mr, tagline_en, address_mr, address_en, contact_phone, contact_email, registration_no, festival_year, arrival_date, visarjan_date, upi_id, upi_name, logo_url').limit(1).maybeSingle();
    throwIfError(error);
    const { data: upcomingEvents, error: eventError } = await db.from('events').select('id, title_mr, title_en, event_date, start_time, end_time, location').order('event_date', { ascending: true }).limit(5);
    throwIfError(eventError);
    return res.json({ success: true, data: { mandal, upcomingEvents: upcomingEvents || [] } });
  } catch (err) {
    console.error('getPublicDonationInfo error:', err);
    return res.status(500).json({ success: false, message: 'माहिती मिळवताना त्रुटी.' });
  }
}

export async function submitOnlineDonationIntent(req, res) {
  try {
    const { name, mobile, amount, purpose = 'देणगी / वर्गणी', notes = '', utr_number = '' } = req.body;
    if (!name || !mobile || !amount || Number(amount) <= 0) return res.status(400).json({ success: false, message: 'नाव, मोबाईल आणि वैध रक्कम आवश्यक आहे.' });

    const { error } = await db.from('notifications').insert({ user_id: null, title_mr: 'नवीन ऑनलाईन देणगी माहिती प्राप्त', title_en: 'New Online Donation Entry', message_mr: `${name} (मोबाईल: ${mobile}) यांनी ₹${Number(amount).toLocaleString('en-IN')} ची ऑनलाईन देणगी नोंदवली. (UTR/Ref: ${utr_number || 'उपलब्ध नाही'})`, message_en: `${name} (${mobile}) submitted online donation request of ₹${Number(amount).toLocaleString('en-IN')}. (UTR: ${utr_number || 'N/A'})`, type: 'success', link: '/income' });
    throwIfError(error);
    return res.json({ success: true, message: 'आपली देणगी माहिती यशस्वीरित्या मंडळाकडे पाठवली आहे! मंडळ समिती पडताळणी करून डिजिटल पावती आपल्या WhatsApp वर पाठवेल. गणपती बाप्पा मोरया!' });
  } catch (err) {
    console.error('submitOnlineDonationIntent error:', err);
    return res.status(500).json({ success: false, message: 'नोंदणी करताना त्रुटी.' });
  }
}
