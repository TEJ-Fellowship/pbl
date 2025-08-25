import {
  MY_NEIGHBOURHOOD,
  AVAILABLE_SUPPORT,
  WHY_NEIGHBOURLY_AID,
  WHY_NEIGHBOURLY_AID_DASHBOARD,
  REACH_OUT,
  LEADERBOARD,
} from "./routes";

const navMenu = [
  {
    route: WHY_NEIGHBOURLY_AID_DASHBOARD,
    label: "Why Neighbourly Aid?",
  },
  {
    route: MY_NEIGHBOURHOOD,
    label: "My Neighbourhood",
  },
  {
    route: LEADERBOARD,
    label: "Leaderboard",
  },
  // {
  //   route: AVAILABLE_SUPPORT,
  //   label: "Available Support",
  // },
  // {
  //   route: REACH_OUT,
  //   label: "Reach Out",
  // },
  // {
  //   route: LOGIN_ROUTE,
  //   label: "Login/Register",
  // },
];

export default navMenu;
