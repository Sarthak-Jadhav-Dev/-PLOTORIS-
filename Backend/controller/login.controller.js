const supabase = require('../database/dbClient');
module.exports = {
    loginUser: async (req,res)=>{
        const {email,password} = req.body;
        try{
            const {data,error} = await supabase.from('users').select('*').eq('email',email).eq('password',password).single();
            if(error){
                res.status(401).json({message:"Invalid email or password",error:error.message});
            }else{
                res.status(200).json({message:"Login successful",data:data});
            }
        }catch(err){
            res.status(500).json({message:"Server error",error:err.message});
        }
    }
}