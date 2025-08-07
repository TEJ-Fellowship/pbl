
const API_KEY =import.meta.env.VITE_GEMINI_HOLIDAY_API_KEY 

export const fetchHolidays = async (countryCode, year) => {
  try {
    const url = `https://calendarific.com/api/v2/holidays?api_key=${API_KEY}&country=${countryCode}&year=${year}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.meta.code === 200) {
      return data.response.holidays;
    } else {
      throw new Error(`API error: ${data.meta.error_type}`);
    }
  } catch (error) {
    console.error("Error fetching holidays:", error);
    return [];
  }
};

export const formatHolidays = (holidays) => {
  return holidays.map(holiday => {
    const date = new Date(holiday.date.iso);
    
    return {
      id: `holiday-${holiday.date.iso}`,
      title: holiday.name,
      description: holiday.description,
      date: date.getDate(),
      month: date.getMonth(),
      year: date.getFullYear(),
      type: "holiday",
      isHoliday: true,
      holidayType: holiday.primary_type,
      locations: holiday.locations,
      states: holiday.states
    };
  });
};

export const getHolidayForDate = (holidays, day, month, year) => {
  return holidays.find(holiday => 
    holiday.date === day && 
    holiday.month === month && 
    holiday.year === year
  ) || null;
};


export const countryCodeToName = {
  'np': 'Nepal',
  'us': 'United States',
  'in': 'India',
  'uk': 'United Kingdom',
  'ca': 'Canada',
  'au': 'Australia',
  'sg': 'Singapore',
  'jp': 'Japan',
  'kr': 'South Korea',
  'cn': 'China',

};

export const getCountryName = (code) => {
  return countryCodeToName[code.toLowerCase()] || code;
};