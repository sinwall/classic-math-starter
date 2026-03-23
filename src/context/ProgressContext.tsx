import { createContext } from "react";

export default createContext<
    {   pgh: number, 
        step: number, 
        set_pgh: (pgh: number) => void,
        set_step: (step: number) => void,
    }
    |undefined>(undefined);