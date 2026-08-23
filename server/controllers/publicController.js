import { db } from '../database/db.js';

export async function getPublicDonationInfo(req, res) {
  try {
    const mandal = await db.get(`
      SELECT name_mr, name_en, tagline_mr, tagline_en, address_mr, address_en,
             contact_phone, contact_email, registration_no, festival_year,
             arrival_date, visarjan_date, upi_id, upi_name, logo_url
      FROM mandal_settings LIMIT 1
    `);

    const upcomingEvents = await db.all(`
      SELECT id, title_mr, title_en, event_date, start_time, end_time, location
      FROM events
      ORDER BY event_date ASC
      LIMIT 5
    `);

    return res.json({
      success: true,
      data: {
        mandal,
        upcomingEvents
      }
    });
  } catch (err) {
    console.error('getPublicDonationInfo error:', err);
    return res.status(500).json({ success: false, message: 'माहिती मिळवताना त्रुटी.' });
  }
}

export async function submitOnlineDonationIntent(req, res) {
  try {
    const { name, mobile, amount, purpose = 'देणगी / वर्गणी', notes = '', utr_number = '' } = req.body;

    if (!name || !mobile || !amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'नाव, मोबाईल आणि वैध रक्कम आवश्यक आहे.' });
    }

    // Insert as a notification / alert for committee to verify and issue receipt
    await db.run(`
      INSERT INTO notifications (user_id, title_mr, title_en, message_mr, message_en, type, link)
      VALUES (NULL, 'नवीन ऑनलाईन देणगी माहिती प्राप्त', 'New Online Donation Entry', ?, ?, 'success', '/income')
    `, [
      `${name} (मोबाईल: ${mobile}) यांनी ₹${Number(amount).toLocaleString('en-IN')} ची ऑनलाईन देणगी नोंदवली. (UTR/Ref: ${utr_number || 'उपलब्ध नाही'})`,
      `${name} (${mobile}) submitted online donation request of ₹${Number(amount).toLocaleString('en-IN')}. (UTR: ${utr_number || 'N/A'})`
    ]);

    return res.json({
      success: true,
      message: 'आपली देणगी माहिती यशस्वीरित्या मंडळाकडे पाठवली आहे! मंडळ समिती पडताळणी करून डिजिटल पावती आपल्या WhatsApp वर पाठवेल. गणपती बाप्पा मोरया!'
    });
  } catch (err) {
    console.error('submitOnlineDonationIntent error:', err);
    return res.status(500).json({ success: false, message: 'नोंदणी करताना त्रुटी.' });
  }
}
