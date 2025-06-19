import {
  AI_CHAT,
  HOME_ROUTE,
  SMART_QUIZZES,
  TRACK_PROGRESS,
  LOGIN_ROUTE,
} from "./routes";
import { Sparkles, Code, BrainCircuit, Brain, User } from "lucide-react";

const navMenu = [
  {
    route: HOME_ROUTE,
    label: "Learning Portal",
    icon: BrainCircuit,
  },
  {
    route: AI_CHAT,
    label: "AI Chat",
    icon: Brain,
  },
  {
    route: SMART_QUIZZES,
    label: "Smart Quizzes",
    icon: Sparkles,
  },
  {
    route: TRACK_PROGRESS,
    label: "Track Progress",
    icon: Code,
  },
  {
    route: LOGIN_ROUTE,
    label: "Login/Register",
    icon: User,
  },
  
];

export default navMenu;
