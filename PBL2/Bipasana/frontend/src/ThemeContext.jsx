import React, { useState, createContext} from "react";
export const ThemeContext=createContext()
export const ThemeContextProvider=({children})=>{
    const [isDark,setIsDark]=useState(false)
    function handleToggle(){
        setIsDark(!isDark)
    }
    return(
        <ThemeContext.Provider value={{isDark,handleToggle}}>
            {children}
        </ThemeContext.Provider>
    )
}