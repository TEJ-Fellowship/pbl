import { useState, useEffect } from "react";


export const useProperties = () => {
    const [properties, setProperties] = useState([]);

    const fetchProperties = async () => {
        try {
            const response = await fetch("http://localhost:8080/api/properties/get-all-property");
            const data = await response.json();
            setProperties(data)

        } catch (err) {
            console.log(err || "Something wrong while fetching the data from backend")
        }
    }

    useEffect(() => {
        fetchProperties();
    }, []);

    return { properties, refetch: fetchProperties };
}