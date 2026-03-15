import React, { useEffect, useState, createContext} from "react";
export const ThemeContext=createContext()
export const ThemeContextProvider=({children})=>{
    const [isDark,setIsDark]=useState(false)
    function handleToggle(){
        setIsDark(!isDark)
    }
    return(
        <ThemeContext.Provider value={{isDark,setIsDark,handleToggle}}>
            {children}
        </ThemeContext.Provider>
    )
}