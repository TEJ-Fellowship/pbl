import React, { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import IncomeOverview from '../../components/Income/IncomeOverview';
import axiosInstance from '../../Utils/axiosInstance';
import { API_PATHS } from '../../Utils/apiPaths';
import Modal from '../../components/Modal';
import AddIncomeForm from '../../components/Income/AddIncomeForm';

const Income = () => {
  const [incomeData, setIncomeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDeleteAlert, setOpenDeleteAlert] = useState({ 
    show: false,
    data: null,
  });

  const [openAddIncomeModal, setOpenAddIncomeModal] =useState(false);

 //get all income details
 const fetchIncomeDetails = async () =>{ 
  if (loading) return;

  setLoading(true);
  try { 
    const response = await axiosInstance.get(
      `${API_PATHS.INCOME.GET_ALL_INCOME}` //MGIHT BE WRONGHERE
    );

    if (response.data) {
      setIncomeData(response.data);
    }
  } catch(error) { 
    console.log("something went wrong. Please try again.", error)
  } finally { 
    setLoading(false);
  }
 };

 //handle add income
 const handleAddIncome = async (income) => {};

 //delete income
 const deleteIncome = async (id) => {};

 //handle download income details
 const handleDownloadIncomeDetails = async () => {};

 useEffect(() => { 
  fetchIncomeDetails();

  return () => {};
 }, []);

  return (
    <DashboardLayout activeMenu="Income">
      <div className="my-5 mx-auto">
        <div className="grid grid-cols-1 gap-6">
          <div className="">
            <IncomeOverview 
              transactions={incomeData}
              onAddIncome={() => setOpenAddIncomeModal(true)}
            />
          </div>
        </div>
      <Modal 
        isOpen={openAddIncomeModal}
        onClose={() => setOpenAddIncomeModal(false)}
        title="Add Income"
      >
        {/* <div>Add Income Form</div> */}
        <AddIncomeForm onAddIncome={handleAddIncome} />
      </Modal>
      </div>
    </DashboardLayout>

  )
}

export default Income