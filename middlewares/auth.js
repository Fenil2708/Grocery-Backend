import jwt from 'jsonwebtoken'

const auth = async(request,response,next)=>{
    try {
        const token = request.cookies.accessToken || request.cookies.adminAccessToken || request?.headers?.authorization?.split(" ")[1];

        // if(!token){
        //    token= request.query.token;    
        //   }
        
        if(!token){
            return response.status(401).json({
                message: "Provide token"
            })
        }

        const decode = await jwt.verify(token,process.env.SECRET_KEY_ACCESS_TOKEN);

        if(!decode){
            return response.status(401).json({
                message: "unauthorized access",
                error: true,
                success: false
            })
        }

        request.userId = decode.id

        next()

    } catch (error) {
        return response.status(401).json({
            message : error.name === "TokenExpiredError" ? "Session Expired. Please login again." : "Invalid Token. Please login.",
            error: true,
            success: false
        })
    }
}

export const optionalAuth = async (request, response, next) => {
    try {
        const token = request.cookies.accessToken || request.cookies.adminAccessToken || request?.headers?.authorization?.split(" ")[1];

        if (token) {
            const decode = await jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);
            if (decode) {
                request.userId = decode.id;
            }
        }
        next();
    } catch (error) {
        next();
    }
};

export default auth;