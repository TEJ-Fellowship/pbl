const filterByDateRange = (expenses, start, end) => {
    if(!start && !end) return expenses;

    return expenses.filter((e) => {
        const expenseDate = new Date(e.date);
        return(!start || expenseDate >= new Date(start)) && (!end || expenseDate <= new Date(end));
    })
}

export default filterByDateRange;