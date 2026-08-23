import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    'SUPABASE_URL is missing from environment variables.'
  );
}

if (!supabaseServiceKey) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE_KEY is missing from environment variables.'
  );
}

// ==========================================
// SUPABASE CLIENT
// ==========================================

export const db = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);

export const supabase = db;

// ==========================================
// STORAGE BUCKET
// ==========================================

export const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET ||
  'mandal-uploads';


// ==========================================
// ENSURE STORAGE BUCKET
// ==========================================

export async function ensureStorageBucket() {
  try {
    const { data, error } =
      await db.storage.getBucket(STORAGE_BUCKET);

    if (!error && data) {
      console.log(
        `Supabase Storage bucket ready: ${STORAGE_BUCKET}`
      );
      return;
    }

    const notFound =
      error &&
      (
        error.statusCode === '404' ||
        error.status === 404 ||
        /not found/i.test(error.message || '')
      );

    if (!notFound && error) {
      console.warn(
        'Could not check Supabase Storage bucket:',
        error.message
      );
    }

    const { error: createError } =
      await db.storage.createBucket(
        STORAGE_BUCKET,
        {
          public: true,
          fileSizeLimit: 10 * 1024 * 1024,
          allowedMimeTypes: [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'application/pdf'
          ]
        }
      );

    if (
      createError &&
      !/already exists/i.test(
        createError.message || ''
      )
    ) {
      throw createError;
    }

    console.log(
      `Supabase Storage bucket created: ${STORAGE_BUCKET}`
    );

  } catch (error) {
    console.error(
      'Storage bucket initialization error:',
      error
    );

    throw error;
  }
}


// ==========================================
// DATABASE CONNECTION TEST
// ==========================================

export async function initDb() {

  const { error } = await db
    .from('mandal_settings')
    .select('id')
    .limit(1);

  if (error) {
    throw new Error(
      `Supabase database connection failed: ${error.message}`
    );
  }

  await ensureStorageBucket();

  console.log(
    'Connected to Supabase PostgreSQL successfully.'
  );
}


// ==========================================
// INITIAL APPLICATION SETUP
// ==========================================

export async function ensureInitialSetup() {

  await initDb();

  // ----------------------------------------
  // Mandal settings
  // ----------------------------------------

  const {
    data: settings,
    error: settingsError
  } = await db
    .from('mandal_settings')
    .select('id')
    .limit(1);

  if (settingsError) {
    throw settingsError;
  }

  if (!settings || settings.length === 0) {

    const { error } = await db
      .from('mandal_settings')
      .insert({
        name_mr:
          'युवा स्पोर्ट्स गणेशोत्सव मंडळ, दत्तवाड',

        name_en:
          'Yuva Sports Ganeshostav Mandal, Dattawad',

        tagline_mr:
          'स्थापना: १९८८ | ! नवे पर्व युवा सर्व !',

        tagline_en:
          'Est: 1988 | Reg. No. -',

        address_mr:
          'युवा स्पोर्ट्स चौक, दत्तवाड | ४१६१०७ , महाराष्ट्र |',

        address_en:
          'Yuva Sports Chowk, Dattawad | 416107, Maharashtra |',

        contact_phone:
          process.env.MANDAL_CONTACT_PHONE ||
          '+91 9699049637',

        contact_email:
          process.env.MANDAL_CONTACT_EMAIL ||
          'contact@yuvasports.org',

        registration_no:
          process.env.MANDAL_REGISTRATION_NO ||
          '-',

        festival_year:
          Number(process.env.FESTIVAL_YEAR) ||
          2026,

        arrival_date:
          process.env.ARRIVAL_DATE ||
          '2026-09-14T09:00:00+05:30',

        visarjan_date:
          process.env.VISARJAN_DATE ||
          '2026-09-23T18:00:00+05:30',

        upi_id:
          process.env.MANDAL_UPI_ID ||
          '',

        upi_name:
          process.env.MANDAL_UPI_NAME ||
          'Yuva Sports Ganeshostav Mandal',

        receipt_prefix:
          process.env.RECEIPT_PREFIX ||
          'YUVA-2026-',

        receipt_language: 'mr',

        initial_opening_balance:
          Number(
            process.env.INITIAL_OPENING_BALANCE
          ) || 0
      });

    if (error) {
      throw error;
    }

    console.log(
      'Default Mandal settings created.'
    );
  }


  // ----------------------------------------
  // Initial Admin
  // ----------------------------------------

  const {
    data: admins,
    error: adminCheckError
  } = await db
    .from('users')
    .select('id')
    .eq('role', 'admin')
    .limit(1);

  if (adminCheckError) {
    throw adminCheckError;
  }

  if (!admins || admins.length === 0) {

    const adminPassword =
      process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      throw new Error(
        'ADMIN_PASSWORD must be configured in environment variables before first startup.'
      );
    }

    const passwordHash =
      await bcrypt.hash(
        adminPassword,
        10
      );

    const { error } = await db
      .from('users')
      .insert({
        name:
          process.env.ADMIN_NAME ||
          'Administrator',

        email:
          process.env.ADMIN_EMAIL ||
          'admin@yuvasports.org',

        mobile:
          process.env.ADMIN_MOBILE ||
          '9699049637',

        password_hash:
          passwordHash,

        role: 'admin',

        status: 'active'
      });

    if (error) {
      throw error;
    }

    console.log(
      'Initial Administrator account created.'
    );
  }
}

export default db;