import axios from "axios";

const baseUrl='https://studies.cs.helsinki.fi/restcountries/api/';

const getAllCountries=async()=>{
    try{
        const response=await axios.get(`${baseUrl}/all`)
        return response.data;
    }catch(error){
        console.error('Error fetching countries: ',error)
        throw error; //rethrow the error to be handled by the caller
    }
}

const getCountryByName=async(name)=>{
    try{
        const response=await axios.get(`${baseUrl}/name/${name}`)
        return response.data;
    }catch(error){
        console.error('Error fetching country by name: ',error)
        throw error;
    }
}

export default {getAllCountries, getCountryByName}