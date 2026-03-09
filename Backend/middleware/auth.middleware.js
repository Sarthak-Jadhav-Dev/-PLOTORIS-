const supabase = require('../database/dbClient');
module.exports = async (req, res, next) => {
  try {
    const email = req.headers['email'];
    const user = req.headers['user'];

    if(!user){
      return res.status(401).json({ message: "User is missing" });
    }
    if(!email){
      return res.status(401).json({ message: "email is Missing" });
    }

    const { data: userData, error: userError } = await supabase.from('users').select('*').eq('user_name', user).single();

    if (userError || !userData) {
      console.log({ userError, userData, user });
      return res.status(401).json({ message: "User is Not Valid", error: userError?.message });
    }

    const { data: emailData, error: emailError } = await supabase.from('email').select('*').eq('email', email).single();

    if (emailError || !emailData) {
      console.log({ emailError, emailData, email });
      return res.status(401).json({ message: "email Id is not found", error: keyError?.message });
    }
    req.user = userData.user_id;

    next();
  } catch (err) {
    return res.status(500).json({ message: "Authentication error" });
  }
};