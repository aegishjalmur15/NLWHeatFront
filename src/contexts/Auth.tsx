import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/api";

type User={
    id:string,
    avatar_url:string,
    name:string,
    login:string
}

type AuthContextData = {
    user: User | null,
    signInUrl:string,
    signOut: ()=>void
}
type AuthenticateResponse = {
    token:string,
    user:{
        id:string,
        avatar_url:string,
        name:string,
        login:string
    }
}
type Authprovider = {
    children: ReactNode
}

export const AuthContext = createContext({} as AuthContextData);

export function AuthProvider(props:Authprovider){

    const [user, setUser] = useState<User | null>(null);


    const signInUrl =`https://github.com/login/oauth/authorize?scope=user&client_id=${process.env.CLIENT_ID}`;

    async function signIn(githubCode:string) {
        const response  = await api.post<AuthenticateResponse>("authenticate", {
            code: githubCode,
        })

        const { token, user } = response.data;

        localStorage.setItem("@dowhile:token", token);

        api.defaults.headers.common.authorization = `Bearer ${token}`

        setUser(user);
    }

    function signOut(){
        setUser(null);
        localStorage.removeItem("@dowhile:token");

    }

    useEffect(()=>{
        const token = localStorage.getItem("@dowhile:token");

        if(token){

            api.defaults.headers.common.authorization = `Bearer ${token}`

            api.get<User>("profile").then(response=>{
                setUser(response.data);
            })
        }
    },[])

    useEffect(()=>{
        const url = window.location.href;

        const hasGithubCode = url.includes("?code=");

        if(hasGithubCode){
            const [urlWithouCode,githubCode ] = url.split("?code=");

            window.history.pushState({},"", urlWithouCode);

            signIn(githubCode);
        }
    },[])


    return(
        <AuthContext.Provider value={{signInUrl, user, signOut}}>
            {props.children}
        </AuthContext.Provider>
    )
}