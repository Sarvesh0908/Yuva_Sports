import bcrypt from 'bcryptjs';
import { db } from '../database/db.js';
import { generateToken } from '../middleware/authMiddleware.js';
import { logAudit } from '../middleware/auditMiddleware.js';
import { throwIfError } from '../utils/dbHelpers.js';

async function findUserByIdentifier(identifier) {
  const clean = identifier.trim();
  const lower = clean.toLowerCase();

  const { data: byEmail, error: emailError } = await db.from('users').select('*').eq('email', lower).maybeSingle();
  throwIfError(emailError);
  if (byEmail) return byEmail;

  const { data: byMobile, error: mobileError } = await db.from('users').select('*').eq('mobile', clean).maybeSingle();
  throwIfError(mobileError);
  return byMobile;
}

async function existingUser(cleanMobile, cleanEmail) {
  const { data: mobileUser, error: mobileError } = await db.from('users').select('id').eq('mobile', cleanMobile).maybeSingle();
  throwIfError(mobileError);
  if (mobileUser) return mobileUser;

  if (cleanEmail) {
    const { data: emailUser, error: emailError } = await db.from('users').select('id').eq('email', cleanEmail).maybeSingle();
    throwIfError(emailError);
    if (emailUser) return emailUser;
  }
  return null;
}

export async function login(req, res) {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'कृपया मोबाईल क्रमांक/ईमेल आणि पासवर्ड भरा / Please enter mobile/email and password.' });
    }

    const user = await findUserByIdentifier(identifier);
    if (!user) return res.status(401).json({ success: false, message: 'अवैध वापरकर्ता नाव किंवा पासवर्ड / Invalid credentials.' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ success: false, message: 'चुकीचा पासवर्ड / Incorrect password.' });
    if (user.status !== 'active') return res.status(403).json({ success: false, message: 'खाते निष्क्रिय केले आहे / Account is inactive.' });

    const token = generateToken(user);
    await logAudit({ userId: user.id, userName: user.name, userRole: user.role, action: 'LOGIN', entity: 'USER', entityId: `${user.id}`, descriptionMr: `${user.name} यांनी प्रणालीमध्ये लॉगिन केले.`, descriptionEn: `${user.name} logged into the system.`, req });

    return res.json({ success: true, message: 'यशस्वी लॉगिन / Login successful', token, user: { id: user.id, name: user.name, email: user.email, mobile: user.mobile, role: user.role, status: user.status } });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'सर्व्हर त्रुटी / Server error' });
  }
}

export async function register(req, res) {
  try {
    const { name, mobile, email, password } = req.body;
    if (!name?.trim() || !mobile?.trim() || !password) return res.status(400).json({ success: false, message: 'कृपया पूर्ण नाव, मोबाईल क्रमांक आणि पासवर्ड भरा / Please fill name, mobile and password.' });

    const cleanMobile = mobile.trim();
    const cleanEmail = email?.trim() ? email.trim().toLowerCase() : null;
    if (cleanMobile.length < 10) return res.status(400).json({ success: false, message: 'कृपया वैध १० अंकी मोबाईल क्रमांक टाका / Please enter valid 10-digit mobile number.' });
    if (password.length < 6) return res.status(400).json({ success: false, message: 'पासवर्ड किमान ६ अक्षरांचा असावा / Password must be at least 6 characters.' });
    if (await existingUser(cleanMobile, cleanEmail)) return res.status(400).json({ success: false, message: 'हा मोबाईल क्रमांक किंवा ईमेल आधीपासूनच नोंदणीकृत आहे / Mobile number or email already registered.' });

    const passwordHash = await bcrypt.hash(password.trim(), 10);
    const { data: newUser, error } = await db.from('users').insert({ name: name.trim(), email: cleanEmail, mobile: cleanMobile, password_hash: passwordHash, role: 'member', status: 'active' }).select('id, name, email, mobile, role, status, created_at').single();
    throwIfError(error);

    await logAudit({ userId: newUser.id, userName: newUser.name, userRole: newUser.role, action: 'REGISTER', entity: 'USER', entityId: `${newUser.id}`, descriptionMr: `${newUser.name} यांनी नवीन सभासद म्हणून नोंदणी केली.`, descriptionEn: `${newUser.name} registered as a new member.`, req });

    return res.status(201).json({ success: true, message: 'नोंदणी यशस्वी झाली! कृपया लॉगिन करा. (Registration successful. Please login.)', user: newUser });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: 'नोंदणी करताना सर्व्हर त्रुटी निर्माण झाली.' });
  }
}

export async function getMe(req, res) {
  try {
    const { data: user, error } = await db.from('users').select('id, name, email, mobile, role, status, created_at').eq('id', req.user.id).maybeSingle();
    throwIfError(error);
    if (!user) return res.status(404).json({ success: false, message: 'वापरकर्ता सापडला नाही / User not found.' });
    return res.json({ success: true, user });
  } catch (err) {
    console.error('getMe error:', err);
    return res.status(500).json({ success: false, message: 'सर्व्हर त्रुटी / Server error' });
  }
}

export async function getUsers(req, res) {
  try {
    const { data, error } = await db.from('users').select('id, name, email, mobile, role, status, created_at, updated_at').order('created_at', { ascending: false });
    throwIfError(error);
    return res.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('getUsers error:', err);
    return res.status(500).json({ success: false, message: 'वापरकर्ते यादी मिळवताना त्रुटी.' });
  }
}

export async function createUser(req, res) {
  try {
    const { name, email, mobile, password, role = 'member' } = req.body;
    const allowedRoles = ['admin', 'treasurer', 'secretary', 'volunteer', 'member'];
    if (!name || !mobile || !password) return res.status(400).json({ success: false, message: 'नाव, मोबाईल आणि पासवर्ड आवश्यक आहेत.' });
    if (!allowedRoles.includes(role)) return res.status(400).json({ success: false, message: 'अवैध भूमिका / Invalid role specified.' });

    const cleanMobile = mobile.trim();
    const cleanEmail = email?.trim() ? email.trim().toLowerCase() : null;
    if (await existingUser(cleanMobile, cleanEmail)) return res.status(400).json({ success: false, message: 'या मोबाईल किंवा ईमेलचा वापरकर्ता आधीच अस्तित्वात आहे.' });

    const passwordHash = await bcrypt.hash(password.trim(), 10);
    const { data: created, error } = await db.from('users').insert({ name: name.trim(), email: cleanEmail, mobile: cleanMobile, password_hash: passwordHash, role, status: 'active' }).select('id, name, email, mobile, role, status, created_at').single();
    throwIfError(error);

    await logAudit({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: 'CREATE_USER', entity: 'USER', entityId: `${created.id}`, descriptionMr: `${req.user?.name} यांनी नवीन वापरकर्ता ${created.name} (${created.role}) तयार केला.`, descriptionEn: `Created system user ${created.name} with role ${created.role}.`, req });
    return res.status(201).json({ success: true, message: 'नवीन वापरकर्ता यशस्वीरित्या तयार केला.', data: created });
  } catch (err) {
    console.error('createUser error:', err);
    return res.status(500).json({ success: false, message: 'वापरकर्ता तयार करताना त्रुटी.' });
  }
}

export async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const allowedRoles = ['admin', 'treasurer', 'secretary', 'volunteer', 'member'];
    if (!role || !allowedRoles.includes(role)) return res.status(400).json({ success: false, message: 'अवैध भूमिका निवडली आहे.' });

    const { data: user, error } = await db.from('users').select('id, name, role, status').eq('id', id).maybeSingle();
    throwIfError(error);
    if (!user) return res.status(404).json({ success: false, message: 'वापरकर्ता सापडला नाही.' });

    if (user.role === 'admin' && role !== 'admin') {
      const { count, error: countError } = await db.from('users').select('*', { count: 'exact', head: true }).eq('role', 'admin');
      throwIfError(countError);
      if ((count || 0) <= 1) return res.status(400).json({ success: false, message: 'मंडळात किमान एक अध्यक्ष/अ‍ॅडमिन असणे अनिवार्य आहे.' });
    }

    const { data: updated, error: updateError } = await db.from('users').update({ role }).eq('id', id).select('id, name, email, mobile, role, status, updated_at').single();
    throwIfError(updateError);

    await logAudit({ userId: req.user?.id, userName: req.user?.name, userRole: req.user?.role, action: 'UPDATE_ROLE', entity: 'USER', entityId: `${user.id}`, descriptionMr: `${req.user?.name} यांनी ${user.name} यांची भूमिका "${user.role}" वरून "${role}" अशी बदलली.`, descriptionEn: `Changed role of ${user.name} from ${user.role} to ${role}.`, req });
    return res.json({ success: true, message: `${user.name} यांची भूमिका यशस्वीरित्या बदलून "${role}" केली!`, data: updated });
  } catch (err) {
    console.error('updateUserRole error:', err);
    return res.status(500).json({ success: false, message: 'भूमिका बदलताना त्रुटी.' });
  }
}

export async function updateUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, role } = req.body;
    const { data: user, error } = await db.from('users').select('id, name, role, status').eq('id', id).maybeSingle();
    throwIfError(error);
    if (!user) return res.status(404).json({ success: false, message: 'वापरकर्ता सापडला नाही.' });
    if (String(id) === String(req.user.id) && status === 'inactive') return res.status(400).json({ success: false, message: 'स्वतःचे खाते निष्क्रिय करता येत नाही.' });

    const { error: updateError } = await db.from('users').update({ status: status || user.status, role: role || user.role }).eq('id', id);
    throwIfError(updateError);
    return res.json({ success: true, message: 'वापरकर्ता माहिती अद्ययावत केली.' });
  } catch (err) {
    console.error('updateUserStatus error:', err);
    return res.status(500).json({ success: false, message: 'अद्ययावत करताना त्रुटी.' });
  }
}

export async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    if (String(id) === String(req.user.id)) return res.status(400).json({ success: false, message: 'स्वतःचे खाते हटवता येत नाही.' });
    const { error } = await db.from('users').delete().eq('id', id);
    throwIfError(error);
    return res.json({ success: true, message: 'वापरकर्ता हटवला.' });
  } catch (err) {
    console.error('deleteUser error:', err);
    return res.status(500).json({ success: false, message: 'वापरकर्ता हटवताना त्रुटी.' });
  }
}
