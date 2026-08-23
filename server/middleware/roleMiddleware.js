export function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'लॉगिन आवश्यक आहे / Unauthorized' });
    }

    const rolesList = Array.isArray(allowedRoles[0]) ? allowedRoles[0] : allowedRoles;

    if (!rolesList.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'या कृतीसाठी आपल्याकडे परवानगी नाही / You do not have permission to perform this action.'
      });
    }

    next();
  };
}
