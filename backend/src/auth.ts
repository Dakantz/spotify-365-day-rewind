import { ExpressContext } from 'apollo-server-express/src/ApolloServer'

class UserTokenData{
    constructor(public uid:string,public exp:number,){

    }
}
class SContext{
    constructor(public token:string,public user:UserTokenData, express:ExpressContext){

    }
}
export async function contextFunc(context:ExpressContext) {
    
}