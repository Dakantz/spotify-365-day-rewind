import {} from "apollo-server-express"
import {} from

class UserTokenData{
    constructor(public uid:string,public exp:number,){

    }
}
class SContext{
    constructor(public token:string,public user:UserTokenData){

    }
}
export async function contextFunc(context) {
    
}