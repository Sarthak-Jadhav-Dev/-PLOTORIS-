const supabase = require('../database/dbClient');
module.exports = {
    registerUser: async (req,res)=>{
        const {user_name,email,password} = req.body;
        try{
            const {data,error} = await supabase.from('users').insert([{user_name,email,password}]);
            if(error){
                res.status(500).json({message:"Error registering user",error:error.message});
            }else{
                res.status(200).json({message:"User registered successfully",data:data});
            }
        }catch(err){
            res.status(500).json({message:"Server error",error:err.message});
        }
    }
}