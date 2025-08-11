import React, { useState } from 'react'
import Input from "../Inputs/Input"
import EmojiPickerPopup from "../layouts/EmojiPickerPopup"

const AddExpenseForm = ({ onAddExpense }) => {
    const [income, setIncome] = useState({
        category: "",
        amount: "",
        date: "",
        icon: "",
    })

    const handleChange = (key, value) => setIncome({ ...income, [key]: value })


    return <div>
        <EmojiPickerPopup
            icon={income.icon}
            onSelect={(selectedIcon) => handleChange("icon", selectedIcon)}
        />

        <Input
            value={income.category}
            onChnage={({ target }) => handleChange("category", target.value)}
            label="Category"
            placeholder="Rent, Groceries, etc"
            type="text"
        />

        <Input
            value={income.amount}
            onChnage={({ target }) => handleChange("amount", target.value)}
            label="Amount"
            placeholder=""
            type="number"
        />

        <Input
            value={income.date}
            onChnage={({ target }) => handleChange("date", target.value)}
            label="Date"
            placeholder=""
            type="date"
        />

        <div className="flex justify-end mt-6">
            <button
                type="button"
                className="add-btn add-btn-fill"
                onClick={() => onAddExpense(income)}
            >
                Add Expense
            </button>
        </div>

    </div>
}

export default AddExpenseForm