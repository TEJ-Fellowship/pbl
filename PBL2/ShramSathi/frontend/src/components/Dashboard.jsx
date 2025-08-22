import { CgProfile } from "react-icons/cg";
import { LuPlus } from "react-icons/lu";
import { MdFormatListBulleted } from "react-icons/md";
import { IoChevronForwardOutline } from "react-icons/io5";
import outReach from '../assets/outreachpic.jpg';
import sustainability from '../assets/sustainability.jpg';
import youth from '../assets/youth.jpg';

function Programs({ style, title, description }) {
    return (
        <>
            <div className="flex flex-col w-80 shadow-gray-900">
                <div
                    className="h-60 w-80 rounded-xl bg-cover bg-no-repeat flex items-center justify-center shadow-md shadow-slate-500"
                    style={style}
                ></div>
                <h1 className="font-bold text-gray-800 mt-2">{title}</h1>
                <div className=" text-sm text-gray-500">{description}</div>
            </div>
        </>
    )
}

function Summary({ stats, value }) {

    return (
        <div className="w-80 h-28 pl-7 p-6 border border-gray-200 rounded-md shadow-md shadow-gray-400">
            <h1 className="text-base text-gray-800">{stats}</h1>
            <h1 className="text-2xl font-bold text-gray-800">{value}</h1>
        </div>
    )
}

function Setting({ options, details, icon }) {
    return (
        <div className="flex gap-5 items-center relative">
            <div>
                <div className="w-14 h-14 mt-6 bg-slate-300 flex items-center justify-center rounded">{icon}</div>
            </div>
            <div className="w-[930px] h-14 mt-5 flex items-center justify-between">
                <div>
                    <h1 className="font-bold text-md text-gray-800">{options}</h1>
                    <h1 className="text-sm text-gray-500">{details}</h1>
                </div>
                <div><IoChevronForwardOutline className="w-6 h-6 flex items-center" /></div>
            </div>
        </div>
    )
}

function Dashboard() {
    return (
        <>
            <div className="text-3xl font-extrabold text-gray-800">Dashboard</div>
            <h3 className='text-xl font-bold text-gray-800 mt-10'>Available Programs</h3>
            <div className="flex space-x-5 mt-3">
                <Programs style={{ backgroundImage: `url(${outReach})` }} title='Community Outreach Initiative' description='Join us in making a difference in our community.' />
                <Programs style={{ backgroundImage: `url(${sustainability})` }} title='Environmental Sustainability Drive' description='Help us protect our planet for future generations' />
                <Programs style={{ backgroundImage: `url(${youth})` }} title='Youth Empowerment Program' description='Mentor young individuals and shape their future.' />
            </div>

            <div>
                <h1 className="text-xl font-bold text-gray-800 mt-8 mb-5">Overview</h1>
                <div className="flex gap-4">
                    <Summary stats='Task Completed' value='125' />
                    <Summary stats='Active Members' value='87' />
                    <Summary stats='Program Supported' value='5' />
                </div>
            </div>

            <div className=''>
                <h1 className="text-xl font-bold text-gray-800 mt-8 mb-2">Settings</h1>
                <Setting options='Account Settings' details='Manage your account settings and preferences' icon={<CgProfile className="h-6 w-6" />} />
                <Setting options='Invite Members' details='Invite new members to join your community' icon={< LuPlus className="h-6 w-6" />} />
                <Setting options='Manage Programs' details='View and manages your community programs' icon={< MdFormatListBulleted className="h-6 w-6" />} />
            </div>
        </>
    )
}

export default Dashboard;